import { Buffer } from 'buffer';
import { createHash } from 'crypto';
import { execFileSync, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/assets/studio');
const MANIFEST = path.join(OUT_DIR, 'thumbs.json');
const REGISTRY = path.join(ROOT, 'src/tools/background-studio/backgrounds/index.js');
const LIGHT_PROPS = path.join(ROOT, 'src/constants/backgroundThemeProps.js');
const FRAME_FILES = [
  path.join(ROOT, 'src/tools/background-studio/frame/clock.js'),
  path.join(ROOT, 'src/tools/background-studio/frame/main.jsx'),
  path.join(ROOT, 'scripts/generateStudioThumbs.js')
];
const LAYOUT = { width: 960, height: 600 };
const OUTPUT = { width: 480, height: 300 };
const MOMENT = 4.2;
const TABS = 3;
const FILL = { dark: '#120f17', light: '#ffffff' };
const THEMES = ['dark', 'light'];
const OVERRIDES = { noise: { blendMode: 'normal', opacity: 0.32 } };

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
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'react-bits-thumbs-'));
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

const filesIn = dir =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const target = path.join(dir, entry.name);
        return entry.isDirectory() ? filesIn(target) : [target];
      })
    : [];

const startSite = async site => {
  if (site) return { url: site, close: async () => {} };
  const { createServer } = await import('vite');
  const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 0, strictPort: false } });
  await server.listen();
  const address = server.httpServer.address();
  return { url: `http://localhost:${address.port}`, close: () => server.close() };
};

const RENDER = `async ({ id, theme, moment, fill, cursor, overrides }) => {
  const catalog = await import('/src/tools/background-studio/utils/catalog.js');
  const entry = catalog.findEntry(id);
  if (!entry) throw new Error('Unknown background ' + id);
  document.documentElement.style.background = fill;
  document.body.style.background = fill;
  const api = window.__rbStudio;
  api.setTheme(theme);
  await api.load(id, { ...catalog.themeDefaults(entry, theme === 'light'), ...(entry.fixedProps || {}), ...overrides });
  const wait = ms => api.clock.wait(ms);
  for (let frame = 0; frame < 24; frame += 1) {
    api.clock.step(1);
    await wait(16);
  }
  const pointer = (seconds, click) => {
    const x = innerWidth * (0.5 + 0.3 * Math.sin(seconds * 0.85));
    const y = innerHeight * (0.5 + 0.24 * Math.sin(seconds * 1.27 + 0.8));
    const target = document.elementFromPoint(x, y) || document.body;
    const init = { clientX: x, clientY: y, screenX: x, screenY: y, bubbles: true, cancelable: true, view: window };
    const point = { ...init, pointerId: 1, pointerType: 'mouse', isPrimary: true };
    target.dispatchEvent(new PointerEvent('pointermove', point));
    target.dispatchEvent(new MouseEvent('mousemove', init));
    if (click) {
      target.dispatchEvent(new PointerEvent('pointerdown', point));
      target.dispatchEvent(new MouseEvent('mousedown', init));
      target.dispatchEvent(new PointerEvent('pointerup', point));
      target.dispatchEvent(new MouseEvent('mouseup', init));
      target.dispatchEvent(new MouseEvent('click', init));
    }
  };
  const steps = Math.round(moment * 60);
  for (let index = 0; index < steps; index += 1) {
    if (cursor) pointer(index / 60, (steps - 1 - index) % 36 === 9);
    api.clock.step(1000 / 60);
    if (index % 4 === 3) await wait(0);
  }
  await wait(120);
  return true;
}`;

const hashFor = (entry, lightProps) => {
  const hash = createHash('sha1');
  const dir = path.join(ROOT, 'src/content', entry.category, entry.name);
  filesIn(dir)
    .sort()
    .forEach(file => hash.update(fs.readFileSync(file)));
  FRAME_FILES.forEach(file => hash.update(fs.readFileSync(file)));
  hash.update(JSON.stringify(entry.registry));
  hash.update(JSON.stringify(lightProps || null));
  return hash.digest('hex').slice(0, 16);
};

const readEntries = async () => {
  const { BACKGROUNDS } = await import(`${REGISTRY}?t=${Date.now()}`);
  const { BACKGROUND_LIGHT_PROPS, STUDIO_DARK_PROPS, STUDIO_LIGHT_PROPS } = await import(LIGHT_PROPS);
  const source = fs.readFileSync(REGISTRY, 'utf8');
  return BACKGROUNDS.filter(background => !background.hidden).map(background => {
    const match = new RegExp(`id: '${background.id}'[\\s\\S]*?content/(\\w+)/(\\w+)/`).exec(source);
    return {
      id: background.id,
      category: match[1],
      name: match[2],
      cursor: match[1] === 'Animations',
      registry: { props: background.props, fixedProps: background.fixedProps || null },
      lightProps: {
        dark: STUDIO_DARK_PROPS[background.id] || null,
        light: { ...BACKGROUND_LIGHT_PROPS[background.id], ...STUDIO_LIGHT_PROPS[background.id] }
      }
    };
  });
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const { default: sharp } = await import('sharp');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const entries = (await readEntries()).filter(entry => !options.only || options.only.has(entry.id));

  const work = entries
    .map(entry => ({ entry, hash: hashFor(entry, entry.lightProps) }))
    .filter(
      ({ entry, hash }) =>
        options.force ||
        manifest[entry.id] !== hash ||
        THEMES.some(theme => !fs.existsSync(path.join(OUT_DIR, `${entry.id}-${theme}.webp`)))
    );

  if (!work.length) {
    console.log('Studio thumbnails are up to date.');
    return;
  }

  console.log(`Rendering ${work.length} studio thumbnail${work.length === 1 ? '' : 's'}...`);
  const site = await startSite(options.site);
  const chrome = await launchChrome(findChrome());
  const browser = await connect(chrome.endpoint.href);
  const failures = [];

  const renderOne = async (entry, theme) => {
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', newWindow: true });
    const page = await connect(`ws://${chrome.endpoint.host}/devtools/page/${targetId}`);
    try {
      await page.send('Page.enable');
      await page.send('Runtime.enable');
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: LAYOUT.width,
        height: LAYOUT.height,
        deviceScaleFactor: 1,
        mobile: false
      });
      await page.send('Page.navigate', { url: `${site.url}/studio-frame.html?theme=${theme}&clock=manual&seed=1` });
      const started = Date.now();
      while (!(await evaluate(page, 'Boolean(window.__rbStudio)'))) {
        if (Date.now() - started > 30000) throw new Error('The studio frame did not start.');
        await sleep(100);
      }
      const args = JSON.stringify({
        id: entry.id,
        theme,
        moment: MOMENT,
        fill: FILL[theme],
        cursor: entry.cursor,
        overrides: OVERRIDES[entry.id] || {}
      });
      await Promise.race([
        evaluate(page, `(${RENDER})(${args})`),
        sleep(60000).then(() => {
          throw new Error('Timed out while rendering.');
        })
      ]);
      const { data } = await page.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: LAYOUT.width, height: LAYOUT.height, scale: OUTPUT.width / LAYOUT.width },
        captureBeyondViewport: false
      });
      const image = await sharp(Buffer.from(data, 'base64'))
        .resize(OUTPUT.width, OUTPUT.height, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
      fs.writeFileSync(path.join(OUT_DIR, `${entry.id}-${theme}.webp`), image);
      return true;
    } catch (error) {
      failures.push(`${entry.id} (${theme}): ${error.message}`);
      return false;
    } finally {
      page.close();
      await browser.send('Target.closeTarget', { targetId }).catch(() => {});
    }
  };

  try {
    const queue = work.slice();
    const runner = async () => {
      while (queue.length) {
        const { entry, hash } = queue.shift();
        const results = [];
        for (const theme of THEMES) results.push(await renderOne(entry, theme));
        if (results.every(Boolean)) manifest[entry.id] = hash;
        process.stdout.write('.');
      }
    };
    await Promise.all(Array.from({ length: Math.min(TABS, work.length) }, runner));
  } finally {
    process.stdout.write('\n');
    browser.close();
    await chrome.close();
    await site.close();
    const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
  }

  if (failures.length) {
    console.error(`Could not render:\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('Done.');
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
