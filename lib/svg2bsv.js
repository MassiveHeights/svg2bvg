'use strict';

/* BSV v0.1 Format Specification */

const parseSvgTransform = require('svg-transform-parser').parse;
const xml2json = require('./xml2json');
const parseColor = require('parse-color');
const parseUnit = require('parse-unit');

// globals
let decimals = 2;

const CMD_STYLE_LINE = 'L';
const CMD_STYLE_LINE_ALPHA = 'l';
const CMD_STYLE_LINE_WIDTH = 'w';
const CMD_STYLE_FILL = 'F';
const CMD_STYLE_FILL_RULE = 'r';
const CMD_STYLE_FILL_ALPHA = 'f';
const CMD_STYLE_CAPS = 'c';
const CMD_STYLE_JOINTS = 'j';
const CMD_STYLE_MITER = 'm';
const CMD_STYLE_ALPHA = 'a';
const CMD_STYLE = '$S';

const CMD_SHAPE_RECT = '$r';
const CMD_SHAPE_CIRCLE = '$c';
const CMD_SHAPE_ELLIPSE = '$e';
const CMD_SHAPE_LINE = '$l';
const CMD_SHAPE_POLYLINE = '$s';
const CMD_SHAPE_PATH = '$p';
const CMD_SHAPE_POLYGON = '$g';
const CMD_SHAPE_CLIPPING = '$m';

let styleMap = new Map();
styleMap.set('fill', CMD_STYLE_FILL);
styleMap.set('fill-opacity', CMD_STYLE_FILL_ALPHA);
styleMap.set('fill-rule', CMD_STYLE_FILL_RULE);
styleMap.set('stroke', CMD_STYLE_LINE);
styleMap.set('stroke-opacity', CMD_STYLE_LINE_ALPHA);
styleMap.set('stroke-width', CMD_STYLE_LINE_WIDTH); // width?
styleMap.set('opacity', CMD_STYLE_ALPHA); // alpha
styleMap.set('stroke-linecap', CMD_STYLE_CAPS);
styleMap.set('stroke-linejoin', CMD_STYLE_JOINTS);
styleMap.set('stroke-miterlimit', CMD_STYLE_MITER);

let styleAttrs = ['fill-opacity', 'fill', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'opacity'];

let svgDefs = {
  'x'     : {type: 'unit', default: 0},
  'y'     : {type: 'unit', default: 0},
  'x1'    : {type: 'unit', default: 0},
  'y1'    : {type: 'unit', default: 0},
  'x2'    : {type: 'unit', default: 0},
  'y2'    : {type: 'unit', default: 0},
  'cx'    : {type: 'unit', default: 0},
  'cy'    : {type: 'unit', default: 0},
  'r'     : {type: 'unit', default: 0},
  'rx'    : {type: 'unit', default: 0},
  'ry'    : {type: 'unit', default: 0},
  'width' : {type: 'unit', default: 0},
  'height': {type: 'unit', default: 0},
  'd'     : {type: 'path'},
  'points': {type: 'points'},

  'fill-opacity'     : {type: 'number', default: 1},
  'fill'             : {type: 'paint', default: 'black'},
  'fill-rule'        : {
    type   : 'enum',
    default: 'nonzero',
    options: ['nonzero', 'evenodd'],
    convert: {nonzero: 1, evenodd: 0},
  },
  'stroke'           : {type: 'paint', default: 'black'},
  'stroke-width'     : {type: 'unit', default: 1},
  'stroke-opacity'   : {type: 'number', default: 1},
  'stroke-linecap'   : {
    type   : 'enum',
    default: 'butt',
    options: ['butt', 'round', 'square'],
    convert: {butt: 'b', round: 'r', square: 's'},
  },
  'stroke-linejoin'  : {
    type   : 'enum',
    default: 'miter',
    options: ['miter', 'round', 'bevel'],
    convert: {miter: 'm', round: 'r', bevel: 'b'},
  },
  'stroke-miterlimit': {type: 'number', default: 4},
  'opacity'          : {type: 'number', default: 1},
};

let unitMap = {
  'px': 1,
  'pt': 1.25,
  'pc': 15,
  'mm': 3.543307,
  'cm': 35.43307,
  'in': 90,
};

let tagMap = {
  'rect'    : {convert: CMD_SHAPE_RECT, data: ['x', 'y', 'width', 'height']},
  'circle'  : {convert: CMD_SHAPE_CIRCLE, data: ['cx', 'cy', 'r']},
  'path'    : {convert: CMD_SHAPE_PATH, data: ['d']},
  'ellipse' : {convert: CMD_SHAPE_ELLIPSE, data: ['cx', 'cy', 'rx', 'ry']},
  'line'    : {convert: CMD_SHAPE_LINE, data: ['x1', 'y1', 'x2', 'y2']},
  'polyline': {convert: CMD_SHAPE_POLYLINE, data: ['points']},
  'polygon' : {convert: CMD_SHAPE_POLYGON, data: ['points']},
};

module.exports = class SVG2BSV {
  constructor() {
    this.styles = [];
    this.commands = [];
    this.styleId = 0;

    this.parseTypeMap = {
      'unit'  : SVG2BSV.parseUnit,
      'number': SVG2BSV.parseNumber,
      'enum'  : SVG2BSV.parseEnum,
      'paint' : SVG2BSV.parsePaint,
      'path'  : SVG2BSV.parsePath,
      'points': SVG2BSV.parsePoints,
    };
  }

  static convert(svgText) {
    const json = xml2json.convert(svgText);
    const converter = new SVG2BSV();

    return converter.parse(json);
  }

  appendData(...data) {
    data.forEach(p => {
      if (typeof p === 'number') {
        if (decimals >= 0) {
          if (p === ~~p)
            this.commands.push(p);
          else
            this.commands.push(p.toFixed(decimals));
        }
        else
          this.commands.push(p);
      } else
        this.commands.push(p);
    });
  }

  __join(array) {
    let s = '';

    array.forEach(x => {
      if (isNaN(x))
        s += x;
      else
        s += x + ' ';
    });

    return s.trim();
  }

  parseStyles(obj) {
    let style = {};
    let keys = Object.keys(obj);

    keys.forEach(k => {
      let value = obj[k];

      if (styleAttrs.indexOf(k) === -1)
        return;

      if (!svgDefs[k])
        return;

      style[k] = this.parseTypeMap[svgDefs[k].type](k, value);
    });

    if (Object.keys(style).length > 0) {
      obj.$styleIndex = this.styleId;
      this.styles[++this.styleId] = style;
    }

    if (!obj.$nodes)
      return;

    obj.$nodes.forEach(x => {
      this.parseStyles(x);
    });
  }

  writeStyles() {
    let out = [];

    this.styles.forEach(s => {
      let keys = Object.keys(s);
      let arr = [];
      keys.forEach(key => {
        let newKey = styleMap.get(key);
        arr.push(`${newKey}${s[key]}`);
      });

      arr.sort();
      out.push(arr.join(' '));
    });

    return out;
  }

  parse(obj) {
    let out = {
      version: 0.1,
      styles : {},
      nodes  : [],
    };

    this.parseStyles(obj[0]);
    out.styles = this.writeStyles();

    if (obj[0].$nodes) {
      obj[0].$nodes.forEach($node => {
        this.parseNode($node, out)
      });
    }

    return out;
  }

  parseAttrs(obj, ...attrs) {
    let out = [];

    attrs.forEach(k => {
      let value = obj[k] === undefined ? svgDefs[k].default : obj[k];
      out.push(this.parseTypeMap[svgDefs[k].type](k, value));
    });

    return out;
  }

  parseNode($node, parent) {
    this.commands = [];
    let node = {};

    let tag = $node.$type;

    if ($node.$styleIndex != null)
      this.appendData(CMD_STYLE, $node.$styleIndex);

    if ($node.transform) {
      node.t = SVG2BSV.parseTransform(tag, $node.transform);
    }

    if (tagMap[tag]) {
      let tagInfo = tagMap[tag];
      this.appendData(tagInfo.convert, ...this.parseAttrs($node, ...tagInfo.data));
    }

    // write
    if (!parent.nodes)
      parent.nodes = [];

    if ($node.id)
      node.id = $node.id;

    if (this.commands.length > 0) {
      node.cmds = this.__join(this.commands);
    }

    if (!($node.$nodes == null && Object.keys(node).length === 0))
      parent.nodes.push(node);

    // go for children
    if (!$node.$nodes)
      return;

    $node.$nodes.forEach(x => {
      this.parseNode(x, node);
    });
  }

  static parsePath(key, value) {
    return value.replace(/ /g, ',');
  }

  static parsePoints(key, value) {
    return value.replace(/ /g, ',');
  }

  static parseUnit(key, value) {
    let up = parseUnit(value);
    let v = up[0];
    let unit = up[1].toLowerCase();

    if (unit === '')
      return v;

    return v * unitMap[unit];
  }

  static parseEnum(key, value) {
    if (svgDefs[key] != null)
      return svgDefs[key].convert[value];

    console.log('unable to find enum converter for key', key);

    return value;
  }

  static parseNumber(key, value) {
    return +value;
  }

  static parsePaint(key, value) {
    if (value === 'none')
      return '-';

    return parseColor(value).hex.substring(1);
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

    while (res[res.length - 1] === defaults[res.length - 1]) {
      res.pop();
    }

    return res.map(v => Number(v.toFixed(decimals)));
  }
};
