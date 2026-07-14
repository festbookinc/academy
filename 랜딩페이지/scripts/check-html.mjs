#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcDir = join(root, 'src');
const indexPath = join(root, 'index.html');

const INCLUDE_RE = /<!--\s*@include\s+([^\s]+)\s*-->/g;

function buildHtmlString() {
  const template = readFileSync(join(srcDir, 'index.template.html'), 'utf8');
  return template.replace(INCLUDE_RE, (_, relPath) => {
    return readFileSync(resolve(srcDir, relPath), 'utf8');
  });
}

const built = buildHtmlString();
const current = readFileSync(indexPath, 'utf8');

if (built !== current) {
  console.error('index.html is out of sync with src/partials/. Run: npm run build');
  process.exit(1);
}

console.log('index.html is in sync with src/');
