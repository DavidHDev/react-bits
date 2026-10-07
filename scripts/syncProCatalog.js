import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const sourceRoot = path.resolve(args.find(arg => !arg.startsWith('--')) || path.join(root, '../react-bits-pro'));
const sourceManifest = path.join(sourceRoot, 'public/showcase-manifest.json');
const destinationManifest = path.join(root, 'public/pro-manifest.json');

if (!check) {
  execFileSync('npm', ['run', 'generate:manifest'], { cwd: sourceRoot, stdio: 'inherit' });
}

const manifest = JSON.parse(fs.readFileSync(sourceManifest, 'utf8'));
const counts = {
  components: manifest.components.length,
  blocks: manifest.blocks.reduce((sum, category) => sum + category.variants.length, 0),
  appUi: manifest.appUi.reduce((sum, category) => sum + category.variants.length, 0),
  templates: manifest.templates.length,
  agentKit: manifest.agentKit.length + Number(Boolean(manifest.agentSkill))
};
for (const [key, count] of Object.entries(counts)) {
  if (manifest.counts[key] !== count) throw new Error('Manifest count mismatch: ' + key);
}
if (new URL(manifest.assets.baseUrl).pathname !== '/rbp') {
  throw new Error('Expected the Pro manifest media root to be /rbp.');
}

const media = new Set();
const collect = value => {
  if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  else if (typeof value === 'string' && /^(components|library-showcase|showcase)\/.+\.webp$/.test(value)) media.add(value);
};
collect(manifest);

const jobs = [];
for (const relative of [...media].sort()) {
  const [kind, ...parts] = relative.split('/');
  if (parts.some(part => !part || part === '.' || part === '..') || relative.includes('\\')) {
    throw new Error('Invalid media path: ' + relative);
  }
  const sourceDirectory = manifest.assets.sources[kind];
  if (!sourceDirectory) throw new Error('Unknown media kind: ' + kind);
  const source = path.resolve(sourceRoot, sourceDirectory, ...parts);
  if (!source.startsWith(sourceRoot + path.sep) || !fs.statSync(source).isFile()) {
    throw new Error('Missing or invalid source media: ' + relative);
  }
  jobs.push({ source, destination: path.join(root, 'public/rbp', relative) });
  if (kind === 'showcase') {
    jobs.push({ source, destination: path.join(root, 'public/assets/pro', ...parts) });
  }
}
jobs.push({ source: sourceManifest, destination: destinationManifest });

const stale = jobs.filter(({ source, destination }) =>
  !fs.existsSync(destination) || !fs.readFileSync(source).equals(fs.readFileSync(destination))
);
if (check) {
  if (stale.length) {
    console.error(stale.map(job => path.relative(root, job.destination)).join('\n'));
    throw new Error(stale.length + ' Pro catalog/media files are missing or stale. Run npm run pro:sync.');
  }
  execFileSync(process.execPath, [path.join(root, 'scripts/generateProSummary.js'), '--check'], { cwd: root, stdio: 'inherit' });
  console.log('Pro manifest and ' + media.size + ' referenced media assets match the local Pro export.');
} else {
  for (const { source, destination } of stale) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
  execFileSync(process.execPath, [path.join(root, 'scripts/generateProSummary.js')], { cwd: root, stdio: 'inherit' });
  console.log('Synced ' + stale.length + ' files; ' + counts.components + ' components, ' + counts.blocks + ' blocks, ' + manifest.components.filter(item => item.isNew).length + ' new components.');
}
