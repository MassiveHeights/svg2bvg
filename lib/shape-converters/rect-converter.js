const Utils = require('../utils');

module.exports = class {
  static convert(symbol, $node) {
    const data = [
      $node.x,
      $node.y,
      $node.width,
      $node.height,
    ];

    let rx = Number($node.rx);
    let ry = Number($node.ry);

    if ($node.rx === undefined) {
      rx = ry;
    } else if ($node.ry === undefined) {
      ry = rx;
    }

    rx = rx || 0;
    ry = ry || 0;

    if (rx !== 0 && ry !== 0) {
      if (rx === ry) {
        data.push(rx);
      } else {
        data.push(rx, ry);
      }
    }

    return symbol + data.map(v => Utils.toFixed(v)).join(',');
  }
};
