#!/usr/bin/env node
// Generates digraphs.ts from Vim's digraph.txt.
// Run with: node scripts/gen-digraphs.mjs

import { get } from 'https';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const URL =
  'https://raw.githubusercontent.com/vim/vim/master/runtime/doc/digraph.txt';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

console.log('Fetching digraph.txt from vim/vim …');
const text = await fetchText(URL);
const lines = text.split('\n');

// Each data line is tab-separated: {char} \t {digraph} \t {hex} \t {dec} \t {name}
// The hex field uses "0x" prefix in the ASCII table and bare hex in the mbyte table.
// We parse both tables together; same logic applies to both.

const entries = []; // [digraph: string, char: string, codepoint: number]

for (const line of lines) {
  const fields = line.split('\t');
  if (fields.length < 3) continue;

  const digraph = fields[1].trim();
  if (digraph.length !== 2) continue;

  const hexRaw = fields[2].trim().replace(/^0x/i, '');
  if (!/^[0-9a-fA-F]+$/.test(hexRaw)) continue;

  const codepoint = parseInt(hexRaw, 16);
  // Skip control characters (0x00–0x1F) and DEL (0x7F) — not meaningful to insert.
  if (isNaN(codepoint) || codepoint < 0x20 || codepoint === 0x7f) continue;

  entries.push([digraph, String.fromCodePoint(codepoint), codepoint]);
}

// Sort by codepoint for readability, then deduplicate on digraph key.
entries.sort((a, b) => a[2] - b[2]);

const seen = new Set();
const deduped = [];
for (const entry of entries) {
  if (!seen.has(entry[0])) {
    seen.add(entry[0]);
    deduped.push(entry);
  }
}

const outLines = [
  "// Auto-generated from Vim's digraph.txt — do not edit by hand.",
  '// Regenerate with: node scripts/gen-digraphs.mjs',
  'export const DIGRAPHS: Record<string, string> = {',
];

for (const [digraph, char, cp] of deduped) {
  const key = JSON.stringify(digraph);
  const val = JSON.stringify(char);
  const hex = 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
  outLines.push(`  ${key}: ${val}, // ${hex}`);
}

outLines.push('};', '');

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'digraphs.ts');
writeFileSync(outPath, outLines.join('\n'));
console.log(`Written ${deduped.length} digraphs → digraphs.ts`);
