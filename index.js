#!/usr/bin/env node
const svg2bsv = require('./lib/svg2bsv');
const fs = require('fs');
const program = require('commander');


program
  .version('0.1.0')
  .usage('--input <file.svg> --output [file.bsv]')
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

let d = svg2bsv.convert(svg);
let svgLen = svg.length;
let bsvLen = JSON.stringify(d).length;

console.log('SVG Size:', svgLen, '~ BSV Size:', bsvLen, '~ diff:', (svgLen / bsvLen).toFixed(2) + 'x smaller');
fs.writeFileSync(program.out, JSON.stringify(d));
