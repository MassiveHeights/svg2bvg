#!/usr/bin/env node
const svg2bvg = require('./lib/svg2bvg');
const fs = require('fs');
const program = require('commander');

program
  .version('0.1.0')
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
