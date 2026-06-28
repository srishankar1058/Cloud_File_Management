// One-time setup script: decodes public/icon.b64 into public/icon.png.
// Run once with: node scripts/setup-icon.mjs
// Safe to delete public/icon.b64 and this script afterwards.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const b64Path = path.join(projectRoot, 'public', 'icon.b64');
const outPath = path.join(projectRoot, 'public', 'icon.png');

if (!existsSync(b64Path)) {
  console.error('Could not find public/icon.b64 — nothing to do.');
  process.exit(1);
}

const b64 = readFileSync(b64Path, 'utf8').trim();
const buffer = Buffer.from(b64, 'base64');
writeFileSync(outPath, buffer);

console.log(`✓ Wrote ${buffer.length} bytes to ${outPath}`);
console.log('You can now delete public/icon.b64 and scripts/setup-icon.mjs.');
