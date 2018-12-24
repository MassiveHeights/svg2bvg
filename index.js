#!/usr/bin/env node
const svg2bvg = require('./lib/svg2bvg').SVG2BVG;
const fs = require('fs');
const program = require('commander');

var pjson = require('./package.json');

program
  .version(pjson.version.toString())
  .usage('--in <file.svg> --out [file.json]')
  .option('--in [in.svg]', 'Input file')
  .option('--out [out.json]', 'Output file')
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

let svgText = fs.readFileSync(program.in);
let data = svg2bvg.convert(svgText);

fs.writeFileSync(program.out, JSON.stringify(data));

console.log(`File '${program.in}' successfully converted.`);