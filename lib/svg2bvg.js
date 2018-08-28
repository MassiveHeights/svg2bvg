'use strict';

/* BVG v0.1 Format Specification */
const parseSvgTransform = require('svg-transform-parser').parse;
const xml2json = require('./xml2json');
const constants = require('./constants');
const attrConverterMap = require('./attr-converter-map');
const RectConverter = require('./shape-converters/rect-converter');
const LinearGradientConverter = require('./shape-converters/linear-gradient-converter');
const PatternParser = require('./shape-converters/pattern-parser');
const Utils = require('./utils');

const styleCmds = constants.cmd.style;
const shapeCmds = constants.cmd.shape;

const styleMap = {
  'fill'             : styleCmds.FILL,
  'fill-opacity'     : styleCmds.FILL_ALPHA,
  'fill-rule'        : styleCmds.FILL_RULE,
  'stroke'           : styleCmds.LINE,
  'stroke-opacity'   : styleCmds.LINE_ALPHA,
  'stroke-width'     : styleCmds.LINE_WIDTH, // width?
  'opacity'          : styleCmds.ALPHA, // alpha
  'stroke-linecap'   : styleCmds.CAPS,
  'stroke-linejoin'  : styleCmds.JOINTS,
  'stroke-miterlimit': styleCmds.MITER,
  'stroke-dasharray' : styleCmds.LINE_DASH,
};

const tagMap = {
  'rect'    : {convert: shapeCmds.RECT, converter: RectConverter},
  'circle'  : {convert: shapeCmds.CIRCLE, data: ['cx', 'cy', 'r']},
  'path'    : {convert: shapeCmds.PATH, data: ['d']},
  'ellipse' : {convert: shapeCmds.ELLIPSE, data: ['cx', 'cy', 'rx', 'ry']},
  'line'    : {convert: shapeCmds.LINE, data: ['x1', 'y1', 'x2', 'y2']},
  'polyline': {convert: shapeCmds.POLYLINE, data: ['points']},
  'polygon' : {convert: shapeCmds.POLYGON, data: ['points']},

  linearGradient: {convert: shapeCmds.LINEAR_GRADIENT, converter: LinearGradientConverter},
  pattern       : {convert: shapeCmds.PATTERN, converter: PatternParser},
};

module.exports.SVG2BVG = class SVG2BVG {
  static convert(svgText) {
    const json = xml2json.convert(svgText);
    const converter = new SVG2BVG();
    const $node = json[0];
    const defs = converter.getDefs($node);

    const res = {
      v     : 0.6,
      format: 'bvg',
      styles: converter.parseStyles($node),
      nodes : converter.parseNodes($node),
    };

    if (defs) {
      res.defs = converter.parseDefs(defs);
    }

    return res;
  }

  getDefs($node) {
    if (!$node.$nodes) return;

    for (let i = $node.$nodes.length - 1; i >= 0; i--) {
      const $child = $node.$nodes[i];

      if ($child.$type === 'defs') {
        $node.$nodes.splice(i, 1);

        return $child;
      }
    }
  }

  parseDefs($defs) {
    const res = {};

    for (let i = 0, l = $defs.$nodes.length; i < l; i++) {
      const $node = $defs.$nodes[i];
      const id = $node.id;

      if (!id) continue;

      const tagInfo = tagMap[$node.$type];
      res[id] = tagInfo.converter.convert(tagInfo.convert, $node);
    }

    return res;
  }

  parseStyles($node, styles = []) {
    const attrs = Object.keys($node);
    const style = {};

    attrs.forEach(attr => {
      const value = $node[attr];
      const converter = attrConverterMap[attr];

      if (converter && styleMap[attr] && converter(value) !== undefined) {
        style[attr] = converter(value);
      }
    });

    if (Object.keys(style).length > 0) {
      const s = Object.keys(style).map(attr => `${styleMap[attr]}${style[attr]}`).sort().join(' ');
      const index = styles.indexOf(s);

      if (index === -1) {
        $node.$styleIndex = styles.push(s) - 1;
      } else {
        $node.$styleIndex = index;
      }
    }

    $node.$nodes && $node.$nodes.forEach($node => this.parseStyles($node, styles));

    return styles;
  }

  parseNodes($node, parent = {}) {
    const tag = $node.$type;
    const cmds = [];
    const node = {};

    if ($node.$styleIndex != null) {
      cmds.push(constants.cmd.STYLE + $node.$styleIndex);
    }

    if ($node.transform) {
      const t = SVG2BVG.parseTransform(tag, $node.transform);

      if (t.length) {
        node.t = t;
      }
    }

    if (tagMap[tag]) {
      const tagInfo = tagMap[tag];
      const cmd = tagInfo.converter ? tagInfo.converter.convert(tagInfo.convert, $node) :
        tagInfo.convert + this.parseAttrs($node, ...tagInfo.data).join(',');

      cmds.push(cmd);
    }

    if ($node.id) {
      node.id = $node.id;
    }

    if (cmds.length) {
      node.cmds = cmds.join('').trim();
    }

    if ($node.$nodes) {
      $node.$nodes.forEach($node => this.parseNodes($node, node));

      const groups = [];
      let group = [];

      node.nodes && node.nodes.forEach(child => {
        if (child.cmds && Object.keys(child).length === 1) {
          group.push(child);
        } else {
          group.length > 1 && groups.push(group);
          group = [];
        }
      });

      group.length > 1 && groups.push(group);
      groups.forEach(group => {
        group.forEach((c, i) => {
          if (i === 0) return;
          group[0].cmds += c.cmds;
          node.nodes.splice(node.nodes.indexOf(c), 1);
        });
      });
    }

    if (node.cmds || node.nodes) {
      parent.nodes = parent.nodes || [];
      parent.nodes.push(node);
    }

    return parent.nodes;
  }

  parseAttrs($node, ...attrs) {
    return attrs.map(attr => {
      const converter = attrConverterMap[attr];
      const value = $node[attr];

      return Utils.toFixed(converter(value));
    });
  }

  static parseTransform(key, value) {
    const res = []; // x y scaleX scaleY rotation pivotX pivotY skewX skewY
    const defaults = [0, 0, 1, 1, 0, 0, 0, 0, 0];
    const v = parseSvgTransform(value);

    if (v.matrix) {
      const PI_Q = Math.PI / 4.0;

      const a = v.matrix.a;
      const b = v.matrix.b;
      const c = v.matrix.c;
      const d = v.matrix.d;
      const tx = v.matrix.e;
      const ty = v.matrix.f;

      let skewX = Math.atan(-c / d);
      let skewY = Math.atan(b / a);

      const scaleY = (skewX > -PI_Q && skewX < PI_Q) ? d / Math.cos(skewX) : -c / Math.sin(skewX);
      const scaleX = (skewY > -PI_Q && skewY < PI_Q) ? a / Math.cos(skewY) : b / Math.sin(skewY);

      let rotation = 0;

      if (skewX === skewY) {
        rotation = skewX;
        skewX = skewY = 0;
      }

      res.push(tx, ty, scaleX, scaleY, rotation, 0, 0, skewX, skewY);
    } else {
      if (v.translate) {
        res.push(v.translate.tx, v.translate.ty);
      } else {
        res.push(0, 0);
      }

      if (v.scale) {
        res.push(v.scale.sx, v.scale.sy || v.scale.sx);
      } else {
        res.push(1, 1);
      }

      if (v.rotate) {
        res.push(v.rotate.angle / 180 * Math.PI, v.rotate.cx || 0, v.rotate.cy || 0);
      } else {
        res.push(0, 0, 0);
      }

      if (v.skewX) {
        res.push(v.skewX.angle / 180 * Math.PI);
      } else {
        res.push(0);
      }

      if (v.skewY) {
        res.push(v.skewY.angle / 180 * Math.PI);
      } else {
        res.push(0);
      }
    }

    while (res[res.length - 1] === defaults[res.length - 1] && res.length > 0) {
      res.pop();
    }

    return res.map(Utils.toFixed);
  }
};
