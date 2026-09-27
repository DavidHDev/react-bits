import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEBOUNCE_MS = 250;

const WATCHED = [
  { dir: 'src/content', recursive: true },
  { dir: 'src/tailwind', recursive: true },
  { dir: 'src/ts-default', recursive: true },
  { dir: 'src/ts-tailwind', recursive: true },
  { dir: 'src/constants', recursive: false, only: 'Information.js' },
  { dir: '.', recursive: false, only: 'jsrepo.config.ts' }
];

const jsrepoDir = path.join(ROOT, 'node_modules/jsrepo');
const { bin } = JSON.parse(fs.readFileSync(path.join(jsrepoDir, 'package.json'), 'utf8'));
const jsrepoBin = path.join(jsrepoDir, typeof bin === 'string' ? bin : bin.jsrepo);

const signatures = new Map();

const signatureOf = file => {
  try {
    const stat = fs.statSync(file);
    return stat.isFile() ? `${stat.mtimeMs}:${stat.size}` : null;
  } catch {
    return null;
  }
};

const walk = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });

let timer = null;
let building = false;
let queued = false;

const build = () => {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const started = Date.now();
  let errors = '';
  const child = spawn(process.execPath, [jsrepoBin, 'build'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] });
  child.stderr.on('data', chunk => {
    errors += chunk;
  });
  child.on('exit', code => {
    building = false;
    if (code === 0) console.log(`Registry rebuilt in ${Date.now() - started}ms`);
    else console.error(`Registry build failed:\n${errors.trim()}`);
    if (queued) {
      queued = false;
      build();
    }
  });
};

const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(build, DEBOUNCE_MS);
};

WATCHED.forEach(({ dir, recursive, only }) => {
  const base = path.join(ROOT, dir);
  const files = only ? [path.join(base, only)] : walk(base);
  files.forEach(file => signatures.set(file, signatureOf(file)));

  fs.watch(base, { recursive }, (_, name) => {
    if (!name || (only && name !== only)) return;
    const file = path.join(base, name);
    const next = signatureOf(file);
    if (signatures.get(file) === next || (next === null && !signatures.has(file))) return;
    if (next === null) signatures.delete(file);
    else signatures.set(file, next);
    schedule();
  });
});

build();
console.log('Watching components for registry changes...');
