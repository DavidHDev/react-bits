import { Buffer } from 'buffer';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { connect, evaluate, findChrome, launchChrome, sleep, startSite, withTimeout } from './shapeMagicBrowser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = path.join(ROOT, 'src/tools/shape-magic');
const OUT_DIR = path.join(ROOT, 'public/assets/shape-magic');
const MANIFEST = path.join(OUT_DIR, 'thumbs.json');
const filesIn = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : file.endsWith('.js') && !file.endsWith('.test.js') ? [file] : [];
  });
const hash = () => {
  const digest = createHash('sha1');
  const files = [
    ...filesIn(path.join(TOOL, 'engine')),
    ...filesIn(path.join(TOOL, 'presets')),
    ...filesIn(path.join(TOOL, 'materials')),
    path.join(TOOL, 'state/doc.js'),
    path.join(TOOL, 'state/style.js'),
    path.join(ROOT, 'src/components/common/Preview/colorMath.js'),
    path.join(ROOT, 'scripts/shapeMagicBrowser.js'),
    fileURLToPath(import.meta.url)
  ];
  files.sort().forEach(file => digest.update(fs.readFileSync(file)));
  return digest.digest('hex');
};

const RENDER = `async item => {
  const root = '/src/tools/shape-magic';
  const [{ createRenderer }, { bindMasks, loadField, maskPlan }, { createDoc, isMaskLayer }, { styleFor }] =
    await Promise.all([
      import(root + '/engine/renderer.js'),
      import(root + '/engine/masks.js'),
      import(root + '/state/doc.js'),
      import(root + '/state/style.js')
    ]);
  const canvas = window.__thumbnailCanvas ||= document.createElement('canvas');
  const renderer = window.__thumbnailRenderer ||= createRenderer(canvas, { preserve: true });
  const doc = createDoc(item.preset, { light: item.light });
  await Promise.all(doc.mark.layers.filter(isMaskLayer).map(loadField));
  const plan = maskPlan([doc.mark.layers]);
  const scene = { a: doc.mark, maskSlots: plan.slots };
  const style = item.style || styleFor(doc);
  await renderer.prepareScene(scene, style);
  bindMasks(renderer, plan.keys);
  renderer.draw({ scene, style, width: item.size, height: item.size, time: 0 });
  if (renderer.gl.getError()) throw new Error('WebGL error rendering ' + item.file);
  return canvas.toDataURL('image/png');
}`;

const main = async () => {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
  const url = args.includes('--site') ? args[args.indexOf('--site') + 1] : null;
  const { default: sharp } = await import('sharp');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const sourceHash = hash();
  const site = await startSite(url);
  let chrome;
  let browser;
  let page;
  try {
    chrome = await launchChrome(findChrome(), { software: true });
    browser = await connect(chrome.endpoint.href);
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', newWindow: true });
    page = await connect(`ws://${chrome.endpoint.host}/devtools/page/${targetId}`);
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Page.navigate', { url: `${site.url.replace(/\/$/, '')}/shape-frame.html` });
    const started = Date.now();
    while ((await evaluate(page, 'document.readyState')) !== 'complete') {
      if (Date.now() - started > 30000) throw new Error('The Shape Magic frame did not load.');
      await sleep(100);
    }
    const items = await evaluate(
      page,
      `(async () => (await import('/src/tools/shape-magic/presets/thumbnails.js')).THUMBNAILS)()`
    );
    const work = items.filter(
      item =>
        (!only || only.has(item.key) || only.has(item.preset.id) || only.has(item.file)) &&
        (force || manifest[item.file] !== sourceHash || !fs.existsSync(path.join(OUT_DIR, item.file)))
    );
    console.log(`Rendering ${work.length} Shape Magic thumbnails...`);
    for (const item of work) {
      const image = await withTimeout(
        evaluate(page, `(${RENDER})(${JSON.stringify(item)})`),
        180000,
        `Timed out rendering ${item.file}.`
      );
      await sharp(Buffer.from(image.split(',')[1], 'base64'))
        .webp({ lossless: true, effort: 6 })
        .toFile(path.join(OUT_DIR, item.file));
      manifest[item.file] = sourceHash;
      console.log(item.file);
    }
    fs.writeFileSync(
      MANIFEST,
      `${JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`
    );
    console.log(work.length ? 'Done.' : 'Shape Magic thumbnails are up to date.');
  } finally {
    page?.close();
    browser?.close();
    await chrome?.close();
    await site.close();
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
