const parseColor = require('parse-color');
const parseUnit = require('parse-unit');

const unitMap = {
  'px': 1,
  'pt': 1.25,
  'pc': 15,
  'mm': 3.543307,
  'cm': 35.43307,
  'in': 90,
};

class AttrsConverter {
  static convertUnit(defaultValue) {
    return (value = defaultValue) => {
      const valUnit = parseUnit(value);
      const val = valUnit[0];
      const unit = valUnit[1].toLowerCase();

      if (unit === '')
        return val;

      return val * unitMap[unit];
    };
  }

  static convertNumber(defaultValue) {
    return (value = defaultValue) => {
      return Number(value);
    };
  }

  static convertEnum(defaultValue, map) {
    return (value = defaultValue) => {
      if (value === defaultValue) return;

      return map[value];
    };
  }

  static convertPaint(defaultValue) {
    return (value = defaultValue) => {
      if (value === defaultValue) return;

      return parseColor(value).hex.substring(1);
    };
  }

  static convertPathData(value) {
    return value.replace(/ /g, ',');
  }

  static convertPoints(value) {
    return value.replace(/ /g, ',');
  }
}


module.exports = {
  'x'     : AttrsConverter.convertUnit(0),
  'y'     : AttrsConverter.convertUnit(0),
  'x1'    : AttrsConverter.convertUnit(0),
  'y1'    : AttrsConverter.convertUnit(0),
  'x2'    : AttrsConverter.convertUnit(0),
  'y2'    : AttrsConverter.convertUnit(0),
  'cx'    : AttrsConverter.convertUnit(0),
  'cy'    : AttrsConverter.convertUnit(0),
  'r'     : AttrsConverter.convertUnit(0),
  'rx'    : AttrsConverter.convertUnit(0),
  'ry'    : AttrsConverter.convertUnit(0),
  'width' : AttrsConverter.convertUnit(0),
  'height': AttrsConverter.convertUnit(0),
  'd'     : AttrsConverter.convertPathData,
  'points': AttrsConverter.convertPoints,

  'fill-opacity'     : AttrsConverter.convertNumber(1),
  'fill'             : AttrsConverter.convertPaint('none'),
  'fill-rule'        : AttrsConverter.convertEnum('nonzero', {nonzero: 1, evenodd: 0}),
  'stroke'           : AttrsConverter.convertPaint('none'),
  'stroke-width'     : AttrsConverter.convertUnit(1),
  'stroke-opacity'   : AttrsConverter.convertNumber(1),
  'stroke-linecap'   : AttrsConverter.convertEnum('butt', {butt: 'b', round: 'r', square: 's'}),
  'stroke-linejoin'  : AttrsConverter.convertEnum('miter', {miter: 'm', round: 'r', bevel: 'b'}),
  'stroke-miterlimit': AttrsConverter.convertNumber(4),
  'opacity'          : AttrsConverter.convertNumber(1),
};