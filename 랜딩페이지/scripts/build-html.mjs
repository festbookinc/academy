#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcDir = join(root, 'src');

const INCLUDE_RE = /<!--\s*@include\s+([^\s]+)\s*-->/g;

function buildHtml(templatePath, outPath) {
  const template = readFileSync(templatePath, 'utf8');
  const output = template.replace(INCLUDE_RE, (_, relPath) => {
    const filePath = resolve(srcDir, relPath);
    return readFileSync(filePath, 'utf8');
  });
  writeFileSync(outPath, output);
  return output.split('\n').length;
}

const lineCount = buildHtml(
  join(srcDir, 'index.template.html'),
  join(root, 'index.html')
);

console.log(`Built index.html (${lineCount} lines)`);
