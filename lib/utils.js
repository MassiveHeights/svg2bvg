module.exports = class {
  static toFixed(n, decimals = 2) {
    if (isNaN(n)) {
      return n;
    }

    n = Number(n);

    if (n.toString().length < n.toFixed(decimals)) {
      return n;
    }

    return Number(n.toFixed(decimals));
  }
};
