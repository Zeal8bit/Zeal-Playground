#!/usr/bin/env node

import { asm as ASM } from 'asm80-core';
import { promises as fs } from 'fs';
import path from 'path';
import util from 'util';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __rootdir = path.resolve(__dirname, '../../');
const __filesdir = path.resolve(__rootdir, 'files/');
const mainFile = process.argv[2];
const binFile = path.join(process.cwd(), path.parse(mainFile).name + '.bin');
const lstFile = path.join(process.cwd(), path.parse(mainFile).name + '.lst');

if (args.length === 0) {
  console.log(`Usage:\n\n  asm80.js <path>\n`);
  process.exit(1);
}

async function readFile(filePath) {
  const fullPath = path.join(__filesdir, filePath);
  const contents = await fs.readFile(fullPath, 'utf8');
  return contents;
}

function get_bytes(obj) {
  var bytes = [];
  var pc = -1;
  obj.dump.forEach(function (entry) {
    if (!entry.lens) return;
    /* Initialize the PC if not initialized yet */
    if (pc == -1) {
      pc = entry.addr;
    } else if (pc < entry.addr) {
      /* Gap between current PC and the instruction address */
      for (var i = 0; i < entry.addr - pc; i++) {
        bytes.push(0x00);
      }
      pc = entry.addr;
    }
    /* Concat the two arrays */
    bytes.push(...entry.lens);
    pc += entry.lens.length;
  });
  return bytes;
}

readFile(mainFile).then(async (code) => {
  try {
    const result = await ASM.compile(code, { readFile }, { assembler: 'z80' });
    const bytes = get_bytes(result);

    const hex = bytes
      .map((b, i) => {
        const byte = b.toString(16).padStart(2, '0');
        // Add a newline after every 16th byte, except the last one
        return (i + 1) % 16 === 0 ? byte + '\n' : byte + ' ';
      })
      .join('');

    console.log(hex);

    console.log('Saving to', binFile);
    await fs.writeFile(binFile, Buffer.from(bytes));

    const list = ASM.lst(result, true, true);
    await fs.writeFile(lstFile, list);
  } catch (e) {
    console.warn('ERROR:', util.inspect(e, { depth: null, colors: true }));
  }
});
