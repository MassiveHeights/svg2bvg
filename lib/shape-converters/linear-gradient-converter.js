const Utils = require('../utils');

module.exports = class {
  static convert(symbol, $node) {
    const x1 = $node.x1 || 0;
    const x2 = $node.x2 || 1;
    const y1 = $node.y1 || 0;
    const y2 = $node.y2 || 0;

    return symbol + `${x1},${y1},${x2},${y2},${$node.gradientUnits ? 0 : 1} ` + $node.$nodes
      .map($c => {
        const opacity = $c['stop-opacity'] === undefined ? 1 : $c['stop-opacity'];
        const color = Utils.allToHex($c['stop-color']);

        let offset = parseFloat($c.offset);

        if ($c.offset.indexOf('%') !== -1) {
          offset /= 100;
        }

        return offset + ',' + color.slice(1) + (opacity === 1 ? '' : ',' + opacity);
      })
      .join(' ');
  }
};
