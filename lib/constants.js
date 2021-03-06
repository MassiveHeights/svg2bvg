module.exports = {
  cmd: {
    path: {
      MOVETO     : 'M',
      MOVETO_REL : 'm',
      LINETO     : 'L',
      LINETO_REL : 'l',
      VLINE      : 'V',
      VLINE_REL  : 'v',
      HLINE      : 'H',
      HLINE_REL  : 'h',
      CURVE      : 'C',
      CURVE_REL  : 'c',
      SCURVE     : 'S',
      SCURVE_REL : 's',
      QCURVE     : 'Q',
      QCURVE_REL : 'q',
      SQCURVE    : 'T',
      SQCURVE_REL: 't',
      ARC        : 'A',
      ARC_REL    : 'a',
      CLOSE_PATH : 'Z',
    },

    shape: {
      RECT    : '$r',
      CIRCLE  : '$c',
      ELLIPSE : '$e',
      LINE    : '$l',
      POLYLINE: '$s',
      PATH    : '$p',
      POLYGON : '$g',
      CLIPPING: '$m',

      // defs
      LINEAR_GRADIENT: 'R',
      PATTERN: 'P'
    },

    style: {
      LINE      : 'L',
      LINE_ALPHA: 'l',
      LINE_WIDTH: 'w',
      FILL      : 'F',
      FILL_RULE : 'r',
      FILL_ALPHA: 'f',
      CAPS      : 'c',
      JOINTS    : 'j',
      MITER     : 'm',
      ALPHA     : 'a',
      LINE_DASH : 'd',
    },

    STYLE    : '$S',
    TRANSFORM: '$T',
  },
};
