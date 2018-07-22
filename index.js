#!/usr/bin/env node
const svg2bsg = require('./lib/svg2bvg');
const fs = require('fs');
const program = require('commander');


program
  .version('0.1.0')
  .usage('--in <file.svg> --out [file.bvg]')
  .option('--in [in.svg]', 'Input file')
  .option('--out [out.bsv]', 'Output file')
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  return;
}

let argc = program.parse(process.argv);
if (argc.rawArgs.length !== 6) {
  console.log('Bad arguments.');
  program.outputHelp();
}

let svg = fs.readFileSync(program.in);

let d = svg2bsg.convert(svg);
let svgLen = svg.length;
let bsvLen = JSON.stringify(d).length;

console.log('SVG Size:', svgLen, 'bytes, BVG Size:', bsvLen, 'bytes. Diff:', (svgLen / bsvLen).toFixed(2) + 'x smaller');
fs.writeFileSync(program.out, JSON.stringify(d/*, null, 2*/));
