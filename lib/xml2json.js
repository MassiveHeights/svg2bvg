const { JSDOM } = require('jsdom');
const { window } = new JSDOM('');
const { DOMParser, Node } = window;


module.exports = class XML2JSON {
  convert(xml, parent) {
    let out = {};

    if (xml.nodeType == 1) {
      if (xml.attributes.length > 0) {
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          out[attribute.nodeName] = attribute.nodeValue;
        }
      }
    }

    let nodeName = xml.nodeName;

    if (xml.nodeType === 3) {
      let v = xml.nodeValue.replace(/(\r\n|\n|\r)/gm, '').replace(/ /g, '');
      if (v.length !== 0) {
        out['$type'] = nodeName;
        out['$value'] = v;
        if (xml.parentNode.childNodes.length === 1) {
          parent['$value'] = v;
          return null;
        }
      } else {
        return null;
      }
    }

    out['$type'] = nodeName;

    for (let i = 0; i < xml.childNodes.length; i++) {
      let item = xml.childNodes.item(i);
      let o = this.convert(item, out);

      if (o) {
        if (!out['$nodes'])
          out['$nodes'] = [];

        out['$nodes'].push(o);
      }
    }

    return out;
  }

  static convert(text) {
    let converter = new XML2JSON();
    let xml = new DOMParser().parseFromString(text, 'application/xml');

    let a = [];
    for (let i = 0; i < xml.childNodes.length; i++) {
      let item = xml.childNodes.item(i);

      if (item.nodeType == 1) {
        a.push(converter.convert(item));
      }
    }

    return a;
  }
}