import { Buffer } from 'buffer';
import { createHash } from 'crypto';
import { execFileSync, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = path.join(ROOT, 'src/tools/shape-magic');
const MATERIALS = path.join(TOOL, 'materials');
const OUT_DIR = path.join(ROOT, 'public/assets/shape-magic');
const MANIFEST = path.join(OUT_DIR, 'swatches.json');
const SHARED = [
  'engine/shader.js',
  'engine/renderer.js',
  'engine/materialParams.js',
  'engine/surface.js',
  'engine/surfaceGpu.js',
  'engine/primitives.js',
  'state/doc.js'
]
  .map(file => path.join(TOOL, file))
  .concat(fileURLToPath(import.meta.url));
const OUTPUT = { width: 352, height: 242 };
const SCALE = 2;
const MOMENT = 1.6;

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser'
];

const parseArgs = argv => {
  const options = { force: false, only: null, site: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--force') options.force = true;
    else if (arg === '--only') options.only = new Set(argv[++i].split(',').map(value => value.trim()));
    else if (arg === '--site') options.site = argv[++i].replace(/\/$/, '');
  }
  return options;
};

const findChrome = () => {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate.startsWith('/')) {
      if (fs.existsSync(candidate)) return candidate;
      continue;
    }
    try {
      return execFileSync('which', [candidate], { encoding: 'utf8' }).trim();
    } catch {
      continue;
    }
  }
  throw new Error('Chrome was not found. Set CHROME_PATH to a Chrome or Chromium binary.');
};

const launchChrome = binary =>
  new Promise((resolve, reject) => {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'react-bits-swatches-'));
    const chrome = spawn(binary, [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--mute-audio',
      '--force-color-profile=srgb',
      '--enable-unsafe-swiftshader',
      'about:blank'
    ]);
    const cleanup = () => {
      try {
        chrome.kill('SIGKILL');
      } catch {
        return;
      }
    };
    process.once('exit', cleanup);
    const timer = setTimeout(() => reject(new Error('Chrome did not start in time.')), 15000);
    let output = '';
    chrome.stderr.on('data', chunk => {
      output += chunk;
      const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(output);
      if (match) {
        clearTimeout(timer);
        resolve({
          endpoint: new URL(match[1]),
          close: () =>
            new Promise(done => {
              chrome.once('exit', () => {
                fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
                done();
              });
              chrome.kill();
            })
        });
      }
    });
    chrome.on('exit', code => reject(new Error(`Chrome exited early with code ${code}.`)));
  });

const connect = url =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const pending = new Map();
    let nextId = 0;
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      const waiting = pending.get(message.id);
      if (!waiting) return;
      pending.delete(message.id);
      if (message.error) waiting.reject(new Error(message.error.message));
      else waiting.resolve(message.result);
    });
    socket.addEventListener('error', () => reject(new Error(`Could not connect to ${url}`)));
    socket.addEventListener('open', () =>
      resolve({
        send: (method, params = {}) =>
          new Promise((done, fail) => {
            nextId += 1;
            pending.set(nextId, { resolve: done, reject: fail });
            socket.send(JSON.stringify({ id: nextId, method, params }));
          }),
        close: () => socket.close()
      })
    );
  });

const evaluate = async (page, expression) => {
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || 'Script error');
  return result.value;
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const withTimeout = (promise, ms, message) => {
  let timer;
  const expiry = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, expiry]).finally(() => clearTimeout(timer));
};

const startSite = async site => {
  if (site) return { url: site, close: async () => {} };
  const { createServer } = await import('vite');
  const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 0, strictPort: false } });
  await server.listen();
  const address = server.httpServer.address();
  return { url: `http://localhost:${address.port}`, close: () => server.close() };
};

const RENDER = `async ({ ids, width, height, time }) => {
  const root = '/src/tools/shape-magic';
  const [{ createRenderer }, { bindMasks, maskPlan }, { DEFAULT_EFFECTS, createDoc }, { PROCEDURAL_BY_ID }, { defaultValues }] =
    await Promise.all([
      import(root + '/engine/renderer.js'),
      import(root + '/engine/masks.js'),
      import(root + '/state/doc.js'),
      import(root + '/materials/index.js'),
      import(root + '/engine/materialParams.js')
    ]);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const renderer = createRenderer(canvas, { preserve: true });
  const doc = createDoc({ mark: { layers: [{ type: 'circle', size: 0.84 }] } });
  const plan = maskPlan([doc.mark.layers]);
  const scene = { a: doc.mark, maskSlots: plan.slots };
  const gloss = { ...DEFAULT_EFFECTS.gloss, on: true };
  const images = {};
  for (const id of ids) {
    const def = PROCEDURAL_BY_ID[id];
    if (!def) throw new Error('Unknown material ' + id);
    const fill = def.kind === 'fill';
    bindMasks(renderer, plan.keys);
    renderer.draw({
      scene,
      style: {
        fill: fill ? { kind: 'material' } : { kind: 'solid', color1: '#ffffff' },
        material: { def, values: defaultValues(def.params) },
        gloss: fill ? gloss : { on: false },
        background: { kind: 'none' }
      },
      width,
      height,
      time
    });
    images[id] = canvas.toDataURL('image/png');
  }
  renderer.dispose();
  return images;
}`;

const hashFiles = files => {
  const hash = createHash('sha1');
  files.forEach(file => hash.update(fs.readFileSync(file)));
  return hash.digest('hex');
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const { default: sharp } = await import('sharp');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const shared = hashFiles(SHARED);
  const work = fs
    .readdirSync(MATERIALS)
    .filter(file => file.endsWith('.js') && file !== 'index.js')
    .map(file => file.slice(0, -3))
    .filter(id => !options.only || options.only.has(id))
    .map(id => ({ id, hash: hashFiles([path.join(MATERIALS, `${id}.js`)]).slice(0, 8) + shared.slice(0, 8) }))
    .filter(
      ({ id, hash }) => options.force || manifest[id] !== hash || !fs.existsSync(path.join(OUT_DIR, `fx-${id}.webp`))
    );

  if (!work.length) {
    console.log('Shape Magic swatches are up to date.');
    return;
  }

  console.log(`Rendering ${work.length} Shape Magic swatch${work.length === 1 ? '' : 'es'}...`);
  const site = await startSite(options.site);
  const chrome = await launchChrome(findChrome());
  const browser = await connect(chrome.endpoint.href);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', newWindow: true });
  const page = await connect(`ws://${chrome.endpoint.host}/devtools/page/${targetId}`);

  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Page.navigate', { url: `${site.url}/shape-frame.html` });
    const started = Date.now();
    while ((await evaluate(page, 'document.readyState')) !== 'complete') {
      if (Date.now() - started > 30000) throw new Error('The Shape Magic frame did not load.');
      await sleep(100);
    }
    const args = JSON.stringify({
      ids: work.map(item => item.id),
      width: OUTPUT.width * SCALE,
      height: OUTPUT.height * SCALE,
      time: MOMENT
    });
    const images = await withTimeout(evaluate(page, `(${RENDER})(${args})`), 180000, 'Timed out while rendering.');
    for (const { id, hash } of work) {
      const image = await sharp(Buffer.from(images[id].split(',')[1], 'base64'))
        .resize(OUTPUT.width, OUTPUT.height, { kernel: 'lanczos3' })
        .webp({ quality: 82, alphaQuality: 90, effort: 6 })
        .toBuffer();
      fs.writeFileSync(path.join(OUT_DIR, `fx-${id}.webp`), image);
      manifest[id] = hash;
    }
    console.log('Done.');
  } finally {
    page.close();
    browser.close();
    await chrome.close();
    await site.close();
    const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
