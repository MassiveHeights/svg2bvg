/**
 * Copyright (C) 2018 Massive Heights - All Rights Reserved
 * 
 * https://github.com/MassiveHeights/Black/blob/master/LICENSE.md
 */

/**
 * A 2x3 matrix allows you to transform objects in space.
 */
module.exports = class Matrix {
  /**
   * Creates new Matrix instance.
   *
   * @param  {number} [a=1]  A-component.
   * @param  {number} [b=0]  B-component.
   * @param  {number} [c=0]  C-component.
   * @param  {number} [d=1]  D-component.
   * @param  {number} [tx=0] TX-component.
   * @param  {number} [ty=0] TY-component.
   */
  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    /** @private @type {Float32Array} */
    this.data = new Float32Array(6);
    this.set(a, b, c, d, tx, ty);
  }

  /**
   * Sets components of this matrix to the given values.
   *
   * @param  {number} a  A-component.
   * @param  {number} b  B-component.
   * @param  {number} c  C-component.
   * @param  {number} d  D-component.
   * @param  {number} tx TX-component.
   * @param  {number} ty TY-component.
   * @return {Matrix} This.
   */
  set(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    let m = this.data;

    m[0] = a;
    m[1] = b;
    m[2] = c;
    m[3] = d;
    m[4] = tx;
    m[5] = ty;

    return this;
  }

  /**
   * Translates the matrix by x and y axes.
   *
   * @param {number} dx Amount along x-axis.
   * @param {number} dy Amount along y-axis.
   * @return {Matrix} This.
   */
  translate(dx, dy) {
    let a = this.data;

    let /** @type {number} */ a0 = a[0]; // a
    let /** @type {number} */ a1 = a[1]; // b
    let /** @type {number} */ a2 = a[2]; // c
    let /** @type {number} */ a3 = a[3]; // d
    let /** @type {number} */ a4 = a[4]; // tx
    let /** @type {number} */ a5 = a[5]; // ty

    this.data[4] = a0 * dx + a2 * dy + a4;
    this.data[5] = a1 * dx + a3 * dy + a5;

    return this;
  }

  /**
   * Sets tx and ty components to given values.
   *
   * @param {number} x The tx component to update.
   * @param {number} y The ty component to update.
   * @return {Matrix} This.
   */
  setTranslation(x, y) {
    this.data[4] = x;
    this.data[5] = y;

    return this;
  }

  /**
   * Sets absolute rotation of this matrix to specified angle.
   *
   * @param  {number} theta     Theta value.
   * @param  {number} scale = 1 Scale value.
   * @return {Matrix} This.
   */
  setRotation(theta, scale = 1) {
    let m = this.data;
    m[0] = Math.cos(theta) * scale;
    m[2] = Math.sin(theta) * scale;
    m[1] = -m[2];
    m[3] = m[0];

    return this;
  }

  /**
   * Applies rotation to this matrix.
   *
   * @param  {number} angle Angle in radians.
   * @return {Matrix} This.
   */
  rotate(angle) {
    let a = this.data;
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    let a0 = a[0];
    let a2 = a[2];
    let a4 = a[4];

    a[0] = a0 * cos - a[1] * sin;
    a[1] = a0 * sin + a[1] * cos;
    a[2] = a2 * cos - a[3] * sin;
    a[3] = a2 * sin + a[3] * cos;
    a[4] = a4 * cos - a[5] * sin;
    a[5] = a4 * sin + a[5] * cos;

    return this;
  }

  /**
   * Scales current matrix.
   *
   * @param {number} sx Abscissa of the scaling vector.
   * @param {number} sy Ordinate of the scaling vector.
   * @return {Matrix} This.
   */
  scale(sx, sy) {
    let a = this.data;
    let /** @type {number} */ a0 = a[0]; // a
    let /** @type {number} */ a1 = a[1]; // b
    let /** @type {number} */ a2 = a[2]; // c
    let /** @type {number} */ a3 = a[3]; // d
    let /** @type {number} */ a4 = a[4]; // tx
    let /** @type {number} */ a5 = a[5]; // ty

    this.data[0] = a0 * sx;
    this.data[1] = a1 * sx;
    this.data[2] = a2 * sy;
    this.data[3] = a3 * sy;

    return this;
  }

  /**
   * Resets current matrix to identity state.
   *
   * @return {Matrix} This.
   */
  identity() {
    return this.set(1, 0, 0, 1, 0, 0);
  }

  /**
   * Specifies if current matrix is identity.
   *
   * @returns {boolean}
   */
  get isIdentity() {
    return this.exactEquals(Matrix.__identity);
  }

  /**
   * Concatenates a given matrix with the current one.
   *
   * @param  {Matrix} b The matrix to be concatenated.
   * @return {Matrix}   This.
   */
  prepend(b) {
    let a = this.data;
    let bv = b.data;

    let /** @type {number} */ a0 = a[0]; // a
    let /** @type {number} */ a1 = a[1]; // b
    let /** @type {number} */ a2 = a[2]; // c
    let /** @type {number} */ a3 = a[3]; // d
    let /** @type {number} */ a4 = a[4]; // tx
    let /** @type {number} */ a5 = a[5]; // ty

    let /** @type {number} */ b0 = bv[0]; // a
    let /** @type {number} */ b1 = bv[1]; // b
    let /** @type {number} */ b2 = bv[2]; // c
    let /** @type {number} */ b3 = bv[3]; // d
    let /** @type {number} */ b4 = bv[4]; // tx
    let /** @type {number} */ b5 = bv[5]; // ty

    if (b0 !== 1 || b1 !== 0 || b2 !== 0 || b3 !== 1) {
      let a11 = (a0 * b0 + a1 * b2);
      a[1] = a0 * b1 + a1 * b3;
      a[0] = a11;

      let c11 = (a2 * b0 + a3 * b2);
      a[3] = a2 * b1 + a3 * b3;
      a[2] = c11;
    }


    let tx11 = (a4 * b0 + a5 * b2 + b4);
    a[5] = a4 * b1 + a5 * b3 + b5;
    a[4] = tx11;
    return this;
  }

  /**
   * Appends values to this matrix.
   *
   * @param  {Matrix} b The matrix to be appended.
   * @return {Matrix} This.
   */
  append(b) {
    let a = this.data;
    let bv = b.data;

    let /** @type {number} */ a0 = a[0];
    let /** @type {number} */ a1 = a[1];
    let /** @type {number} */ a2 = a[2];
    let /** @type {number} */ a3 = a[3];
    let /** @type {number} */ a4 = a[4];
    let /** @type {number} */ a5 = a[5];
    let /** @type {number} */ b0 = bv[0];
    let /** @type {number} */ b1 = bv[1];
    let /** @type {number} */ b2 = bv[2];
    let /** @type {number} */ b3 = bv[3];
    let /** @type {number} */ b4 = bv[4];
    let /** @type {number} */ b5 = bv[5];

    a[0] = a0 * b0 + a2 * b1;
    a[1] = a1 * b0 + a3 * b1;
    a[2] = a0 * b2 + a2 * b3;
    a[3] = a1 * b2 + a3 * b3;
    a[4] = a0 * b4 + a2 * b5 + a4;
    a[5] = a1 * b4 + a3 * b5 + a5;
    return this;
  }

  /**
   * Inverts current matrix.
   *
   * @return {Matrix} This.
   */
  invert() {
    let a = this.data;

    let aa = a[0];
    let ab = a[1];
    let ac = a[2];
    let ad = a[3];
    let atx = a[4];
    let aty = a[5];

    let det = aa * ad - ab * ac;
    if (det === 0) {
      a[0] = a[1] = a[2] = a[3] = 0;
      a[4] = -atx;
      a[5] = -aty;
      return this;
    }
    det = 1.0 / det;

    a[0] = ad * det;
    a[1] = -ab * det;
    a[2] = -ac * det;
    a[3] = aa * det;
    a[4] = (ac * aty - ad * atx) * det;
    a[5] = (ab * atx - aa * aty) * det;

    return this;
  }

  /**
   * TODO: remove or finish
   * @ignore
   * @returns {Array<number>} Description
   */
  __decompose() {
    let m = this.data;
    let a = m[0];
    let b = m[1];
    let c = m[2];
    let d = m[3];
    let tx = m[4];
    let ty = m[5];

    let skewX = -Math.atan2(-c, d);
    let skewY = Math.atan2(b, a);

    let delta = Math.abs(skewX + skewY);

    let r_rotation = 0;
    let r_skewX = 0;
    let r_skewY = 0;
    let r_scaleX = 0;
    let r_scaleY = 0;
    let r_x = 0;
    let r_y = 0;

    if (delta < 0.00001) {
      r_rotation = skewY;

      if (a < 0 && d >= 0)
        r_rotation += (r_rotation <= 0) ? Math.PI : -Math.PI;
    } else {
      r_skewX = skewX;
      r_skewY = skewY;
    }

    r_scaleX = Math.sqrt((a * a) + (b * b));
    r_scaleY = Math.sqrt((c * c) + (d * d));

    r_x = tx;
    r_y = ty;

    return [r_x, r_y, r_rotation, r_scaleX, r_scaleY, r_skewX, r_skewY];
  }

  /**
   * Clones the current matrix and returns new cloned object.
   *
   * @return {Matrix} New cloned object.
   */
  clone() {
    let m = new Matrix();
    let v = this.data;
    m.set(v[0], v[1], v[2], v[3], v[4], v[5]);
    return m;
  }

  /**
   * Copies values to given matrix.
   *
   * @param  {Matrix} matrix The destination matrix.
   * @return {Matrix} This.
   */
  copyTo(matrix) {
    let a = this.data;
    let b = matrix.data;

    b[0] = a[0];
    b[1] = a[1];
    b[2] = a[2];
    b[3] = a[3];
    b[4] = a[4];
    b[5] = a[5];

    return matrix;
  }

  /**
   * Copies values from given matrix into this.
   *
   * @param  {Matrix} matrix The matrix to copy values from.
   * @return {Matrix} This.
   */
  copyFrom(matrix) {
    return matrix.copyTo(this);
  }

  /**
   * Compares this matrix values with given matrix and checks if they are the same.
   *
   * @param {Matrix} matrix Matrix object to compare with.
   * @returns {boolean}
   */
  exactEquals(matrix) {
    if (!matrix)
      return false;

    let a = this.data;
    let b = matrix.data;

    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
  }

  /**
   * Compares this matrix values with given matrix and checks if they are the same.
   *
   * @param  {Matrix} matrix                   Matrix object to compare with.
   * @param  {number} epsilon = Number.EPSILON Comparision threshold.
   * @return {boolean} True if equal.
   */
  equals(matrix, epsilon = Number.EPSILON) {
    if (!matrix)
      return false;

    let a = this.data;
    let b = matrix.data;

    return (Math.abs(a[0] - b[0]) < epsilon) && (Math.abs(a[1] - b[1]) < epsilon) && (Math.abs(a[2] - b[2]) < epsilon) &&
      (Math.abs(a[3] - b[3]) < epsilon) && (Math.abs(a[4] - b[4]) < epsilon) && (Math.abs(a[5] - b[5]) < epsilon);
  }

  /**
   * Returns array of values representing this matrix object.
   *
   * @return {Float32Array}
   */
  get value() {
    return this.data;
  }

  /**
   * @ignore
   * @param  {number=} digits = 2
   * @return {string}
   */
  toString(digits = 2) {
    return `        | ${this.value[0].toFixed(digits)} | ${this.value[1].toFixed(digits)} | ${this.value[4].toFixed(digits)} |
Matrix: | ${this.value[2].toFixed(digits)} | ${this.value[3].toFixed(digits)} | ${this.value[5].toFixed(digits)} |`;
  }
}