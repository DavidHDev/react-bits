import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { transform } from 'esbuild';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAB = path.resolve(ROOT, process.env.SOUND_LAB_DIR || 'src/tools/sound-lab');
const OUT = path.join(ROOT, 'src/sounds');
const ENGINE = 'react-bits-sound';
const CHECK = process.argv.includes('--check');

const { SOUNDS } = await import(pathToFileURL(path.join(LAB, 'sounds/catalog.js')).href);
const { fileName, soundSource } = await import(pathToFileURL(path.join(LAB, 'export/code.js')).href);

const assertData = (value, trail) => {
  if (value === null || ['number', 'string', 'boolean'].includes(typeof value)) {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`${trail} is not a finite number`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertData(item, `${trail}[${index}]`));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      if (item !== undefined) assertData(item, `${trail}.${key}`);
    });
    return;
  }
  throw new Error(`${trail} is a ${typeof value}, recipes must be plain data`);
};

const format = async (source, file) => {
  const config = (await prettier.resolveConfig(file)) || {};
  return prettier.format(source, { ...config, filepath: file });
};

const spaced = code =>
  code
    .split('\n')
    .map((line, index, lines) =>
      index > 0 &&
      lines[index - 1].trim() !== '' &&
      (/^(const|let|export|function|async|import)\b/.test(line) || /^'use \w+';$/.test(lines[index - 1])) &&
      !(/^import\b/.test(line) && /^import\b/.test(lines[index - 1]))
        ? `\n${line}`
        : line
    )
    .join('\n');

const files = new Map();
const engineFile = path.join(OUT, 'ts', `${ENGINE}.ts`);
const { code } = await transform(fs.readFileSync(engineFile, 'utf8'), {
  loader: 'ts',
  format: 'esm',
  target: 'es2020'
});
const engineJs = path.join(OUT, 'js', `${ENGINE}.js`);
files.set(engineJs, await format(spaced(code), engineJs));

for (const sound of SOUNDS) {
  assertData(sound.recipe, sound.id);
  for (const language of ['js', 'ts']) {
    const file = path.join(OUT, language, `${fileName(sound)}.${language}`);
    files.set(file, await format(soundSource(sound, language === 'ts'), file));
  }
}

const existing = ['js', 'ts'].flatMap(language => {
  const dir = path.join(OUT, language);
  return fs.existsSync(dir) ? fs.readdirSync(dir).map(name => path.join(dir, name)) : [];
});
const stale = existing.filter(file => file !== engineFile && !files.has(file));
const changed = [...files].filter(
  ([file, content]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content
);

if (CHECK) {
  const drift = [...changed.map(([file]) => file), ...stale];
  if (drift.length) {
    console.error(
      `Sound registry files are out of date, run npm run sounds:build:\n${drift.map(file => `  ${path.relative(ROOT, file)}`).join('\n')}`
    );
    process.exit(1);
  }
  console.log(`Sound registry files are up to date (${SOUNDS.length} sounds)`);
} else {
  for (const [file, content] of changed) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  for (const file of stale) fs.rmSync(file);
  console.log(`Wrote ${changed.length} and removed ${stale.length} sound registry files (${SOUNDS.length} sounds)`);
}
