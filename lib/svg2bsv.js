'use strict';

/* BSV v0.1 Format Specification */

// imports
const xml2json = require('./xml2json');
const parseColor = require('parse-color');
const parseUnit = require('parse-unit');
const Matrix = require('./Matrix');
const parseSvgTransform = require('svg-transform-parser').parse;

// globals
let decimals = 2;

const CMD_PATH_MOVETO = 'M';
const CMD_PATH_MOVETO_REL = 'm';
const CMD_PATH_LINETO = 'L';
const CMD_PATH_LINETO_REL = 'l';
const CMD_PATH_VLINE = 'V';
const CMD_PATH_VLINE_REL = 'v';
const CMD_PATH_HLINE = 'H';
const CMD_PATH_HLINE_REL = 'h';
const CMD_PATH_CURVE = 'C';
const CMD_PATH_CURVE_REL = 'c';
const CMD_PATH_SCURVE = 'S';
const CMD_PATH_SCURVE_REL = 's';
const CMD_PATH_QCURVE = 'Q';
const CMD_PATH_QCURVE_REL = 'q';
const CMD_PATH_SQCURVE = 'T';
const CMD_PATH_SQCURVE_REL = 't';
const CMD_PATH_ARC = 'A';
const CMD_PATH_ARC_REL = 'a';
const CMD_PATH_CLOSE_PATH = 'Z';

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

const CMD_TRANSFORM = '$T';
const CMD_STYLE = '$S';

const CMD_SHAPE_RECT = '$r';
const CMD_SHAPE_CIRCLE = '$c';
const CMD_SHAPE_ELIPSE = '$e';
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
  'x': { type: 'unit', default: 0 },
  'y': { type: 'unit', default: 0 },
  'cx': { type: 'unit', default: 0 },
  'cy': { type: 'unit', default: 0 },
  'r': { type: 'unit', default: 0 },
  'width': { type: 'unit', default: 0 },
  'height': { type: 'unit', default: 0 },

  'fill-opacity': { type: 'number', default: 1 },
  'fill': { type: 'paint', default: 'black' },
  'fill-rule': { type: 'enum', default: 'nonzero', options: ['nonzero', 'evenodd'], convert: [1, 0] },
  'stroke': { type: 'paint', default: 'black' },
  'stroke-width': { type: 'unit', default: 1 },
  'stroke-opacity': { type: 'number', default: 1 },
  'stroke-linecap': { type: 'enum', default: 'butt', options: ['butt', 'round', 'square'], convert: ['b', 'r', 's'] },
  'stroke-linejoin': { type: 'enum', default: 'miter', options: ['miter', 'round', 'bevel'], convert: ['m', 'r', 'b'] },
  'stroke-miterlimit': { type: 'number', default: 4 },
  'opacity': { type: 'number', default: 1 },

  'd': { type: 'path' }
};

let unitMap = {
  'px': 1,
  'pt': 1.25,
  'pc': 15,
  'mm': 3.543307,
  'cm': 35.43307,
  'in': 90
}

let tagMap = {
  'rect': { convert: CMD_SHAPE_RECT, data: ['x', 'y', 'width', 'height'] },
  'circle': { convert: CMD_SHAPE_CIRCLE, data: ['cx', 'cy', 'r'] },
  'path': { convert: CMD_SHAPE_PATH, data: ['d'] }
};

module.exports = class SVG2BSV {
  constructor() {
    this.styles = [];
    this.styleId = 0;

    this.commands = [];

    // this.lastStyle = null;
    // this.lastTransform = null;

    this.parseTypeMap = {
      'unit': SVG2BSV.parseUnit,
      'number': SVG2BSV.parseNumber,
      'enum': SVG2BSV.parseEnum,
      'paint': SVG2BSV.parsePaint,
      'transform': SVG2BSV.parseTransform,
      'path': SVG2BSV.parsePath
    };
  }

  appendData(...data) {
    data.forEach(p => {
      if (typeof p == 'number') {
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

  appendTransform(transform) {
    if (!transform)
      return;

    // TODO: can we cache transform?
    // if (transform.equals(this.lastTransform)) {
    //   console.log('same transform');
    //   return;
    // }

    this.commands.push(CMD_TRANSFORM);
    this.appendData(transform.data[0], transform.data[1], transform.data[2], transform.data[3], transform.data[4], transform.data[5]);

    this.lastTransform = transform;
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
      styles: {},
      nodes: []
    };

    // collect the data
    this.parseStyles(obj[0]);

    if (obj[0].$nodes) {
      obj[0].$nodes.forEach(x => {
        this.parseNode(x, out)
      });
    }

    // save the data
    out.styles = this.writeStyles();

    return out;
  }

  parseAttrs(obj, ...attrs) {
    let out = [];
    attrs.forEach(k => {
      let value = obj[k];
      out.push(this.parseTypeMap[svgDefs[k].type](k, value));
    })

    return out;
  }

  parseNode(obj, out) {
    this.commands = [];
    let node = {};

    let tag = obj.$type;

    if (obj.$styleIndex != null)
      this.appendData(CMD_STYLE, obj.$styleIndex);

    let transform = SVG2BSV.parseTransform(tag, obj.transform);

    if (transform)
      this.appendTransform(transform);

    if (tagMap[tag]) {
      let tagInfo = tagMap[tag];
      this.appendData(tagInfo.convert, ...this.parseAttrs(obj, ...tagInfo.data));
    }

    // write
    if (!out.nodes)
      out.nodes = [];

    if (obj.id)
      node.name = obj.id;

    if (this.commands.length > 0) {
      node.cmds = this.__join(this.commands);
    }

    if (!(obj.$nodes == null && Object.keys(node).length === 0))
      out.nodes.push(node);

    // go for children
    if (!obj.$nodes)
      return;

    obj.$nodes.forEach(x => {
      this.parseNode(x, node);
    });
  }

  static parsePath(key, value) {
    return value.replace(/ /g, /,/g);
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
    if (value == null)
      return null;

    let v = parseSvgTransform(value);
    if (v.matrix != null)
      return new Matrix(v.matrix.a, v.matrix.b, v.matrix.c, v.matrix.d, v.matrix.e, v.matrix.f)

    let m = new Matrix();
    if (v.rotate != null) {
      if (v.rotate.cx)
        m.setTranslation(v.rotate.cx, v.rotate.cy);

      m.rotate(v.rotate.angle * 0.01745329251994329576923690768489);

      if (v.rotate.cx)
        m.translate(-v.rotate.cx, -v.rotate.cy);
    }

    if (v.translate != null)
      m.setTranslation(v.translate.tx, v.translate.ty);

    if (v.scale)
      m.scale(v.scale.sx, v.scale.sy || v.scale.sx);

    return m;
  }

  static convert(svgText) {
    let o = xml2json.convert(svgText);

    let converter = new SVG2BSV();
    return converter.parse(o);
  }
}