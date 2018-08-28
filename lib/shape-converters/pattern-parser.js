const main = require('../svg2bvg');
const Utils = require('../utils');

module.exports = class {
  static convert(symbol, $node) {
    const svg2bvg = new main.SVG2BVG();

    $node.$type = '';

    const styles = svg2bvg.parseStyles($node);
    const nodes = svg2bvg.parseNodes($node);

    return {
      nodes: nodes[0].nodes,
      r: 'repeat',
      s: styles,
    };
  }
};
