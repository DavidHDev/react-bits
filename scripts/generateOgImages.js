import { Buffer } from 'buffer';
import { execFileSync, spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import process from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { getComponentCatalog } from '../src/utils/catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/og');
const BASE_IMAGE = path.join(ROOT, 'scripts/og/base.png');
const TEMPLATE = path.join(ROOT, 'scripts/og/card.html');
const FONT_DIR = path.join(ROOT, 'node_modules/geist/dist/fonts');
const PUBLIC_DIR = path.join(ROOT, 'public');
const WIDTH = 1200;
const HEIGHT = 630;
const JPEG_QUALITY = 84;
const RENDER_TIMEOUT_MS = 20000;
const LIVE_WIDTH = 1440;
const LIVE_HEIGHT = 1200;
const LIVE_SCALE = 2;
const LIVE_SETTLE_MS = 2200;
const LIVE_TABS = 3;
const LIVE_INSET = 2;
const LIVE_STYLE = [
  'button[aria-label="Refresh animation"], .background-demo-content { display: none !important; }',
  '.demo-container { border: 0 !important; border-radius: 0 !important; }'
].join(' ');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg'
};

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser'
];

const parseArgs = argv => {
  const options = { force: false, only: null, out: OUT_DIR, site: null, live: true, debug: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--force') options.force = true;
    else if (arg === '--only') options.only = new Set(argv[++i].split(',').map(value => value.trim()));
    else if (arg === '--out') options.out = path.resolve(argv[++i]);
    else if (arg === '--site') options.site = argv[++i];
    else if (arg === '--no-live') options.live = false;
    else if (arg === '--debug') options.debug = true;
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

const resolveAsset = (pathname, liveDir) => {
  if (pathname === '/card.html') return TEMPLATE;
  if (pathname.startsWith('/live/')) return path.join(liveDir, path.basename(pathname));
  if (pathname === '/base.png') return BASE_IMAGE;
  if (pathname.startsWith('/fonts/')) return path.join(FONT_DIR, pathname.slice('/fonts/'.length));
  if (pathname.startsWith('/assets/video/')) return path.join(PUBLIC_DIR, pathname);
  return null;
};

const startServer = liveDir =>
  new Promise(resolve => {
    const server = http.createServer((request, response) => {
      const { pathname } = new URL(request.url, 'http://localhost');
      const file = resolveAsset(decodeURIComponent(pathname), liveDir);
      if (!file || !fs.existsSync(file)) {
        response.writeHead(404).end();
        return;
      }
      const size = fs.statSync(file).size;
      const type = MIME_TYPES[path.extname(file)] || 'application/octet-stream';
      const range = /bytes=(\d*)-(\d*)/.exec(request.headers.range || '');
      if (range) {
        const start = range[1] ? Number(range[1]) : 0;
        const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
        response.writeHead(206, {
          'Content-Type': type,
          'Content-Length': end - start + 1,
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(file, { start, end }).pipe(response);
        return;
      }
      response.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(file).pipe(response);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });

const launchChrome = binary =>
  new Promise((resolve, reject) => {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'react-bits-og-'));
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

const openPage = async (browser, endpoint, { width, height, scale }) => {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', newWindow: true });
  const page = await connect(`ws://${endpoint.host}/devtools/page/${targetId}`);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: false
  });
  return page;
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const waitForCard = async (page, token) => {
  const started = Date.now();
  while (Date.now() - started < RENDER_TIMEOUT_MS) {
    const { result } = await page.send('Runtime.evaluate', {
      expression: 'window.__og || null',
      returnByValue: true
    });
    const state = result.value;
    if (state?.token === token && state.status === 'ready') return state;
    if (state?.token === token && state.status === 'error') throw new Error(state.message);
    await sleep(50);
  }
  throw new Error('Timed out waiting for the card to render.');
};

let renders = 0;

const renderCard = async (page, origin, card) => {
  renders += 1;
  const token = String(renders);
  const params = new URLSearchParams({ title: card.title, token });
  if (card.image) params.set('image', card.image);
  if (card.video) params.set('video', card.video);
  await page.send('Page.navigate', { url: `${origin}/card.html?${params}` });
  const state = await waitForCard(page, token);
  const capture = async format => {
    const { data } = await page.send('Page.captureScreenshot', {
      format,
      ...(format === 'jpeg' ? { quality: JPEG_QUALITY } : {}),
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 },
      captureBeyondViewport: false
    });
    return Buffer.from(data, 'base64');
  };
  const encoded = await encodeJpeg(await capture('png'));
  return { image: encoded || (await capture('jpeg')), state };
};

const encodeJpeg = async png => {
  try {
    const { default: sharp } = await import('sharp');
    return await sharp(png).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  } catch {
    return null;
  }
};

const isStale = (output, inputs) => {
  if (!fs.existsSync(output)) return true;
  const built = fs.statSync(output).mtimeMs;
  return inputs.some(input => fs.existsSync(input) && fs.statSync(input).mtimeMs > built);
};

const filesIn = dir =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const target = path.join(dir, entry.name);
        return entry.isDirectory() ? filesIn(target) : [target];
      })
    : [];

const startSite = async site => {
  if (site) return { url: site.replace(/\/$/, ''), close: async () => {} };
  const { build, preview } = await import('vite');
  console.log('Building the site for live previews...');
  await build({ root: ROOT, logLevel: 'error' });
  const server = await preview({ root: ROOT, logLevel: 'error', preview: { port: 4180, strictPort: false } });
  return { url: server.resolvedUrls.local[0].replace(/\/$/, ''), close: () => server.close() };
};

const evaluate = async (page, expression) => {
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || 'Script error');
  return result.value;
};

const captureLive = async (page, site, entry) => {
  await page.send('Page.navigate', { url: `${site}${entry.path}` });
  const ready = await evaluate(
    page,
    `new Promise(resolve => {
      const started = performance.now();
      const check = () => {
        if (document.querySelector('.demo-container')) resolve(true);
        else if (performance.now() - started > 15000) resolve(false);
        else setTimeout(check, 100);
      };
      check();
    })`
  );
  if (!ready) throw new Error('no preview container');
  await evaluate(
    page,
    `(() => {
      const style = document.createElement('style');
      style.textContent = ${JSON.stringify(LIVE_STYLE)};
      document.head.appendChild(style);
      document.querySelector('.demo-container').scrollIntoView({ block: 'center' });
      return true;
    })()`
  );
  await sleep(LIVE_SETTLE_MS);
  const box = await evaluate(
    page,
    `(() => {
      const rect = document.querySelector('.demo-container').getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, scrollX, scrollY };
    })()`
  );
  const steps = 36;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const sweep = t < 0.6 ? 0.2 + (0.6 * t) / 0.6 : 0.8 - (0.3 * (t - 0.6)) / 0.4;
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: box.left + box.width * sweep,
      y: box.top + box.height * (0.5 + 0.16 * Math.sin(t * Math.PI * 3) * (1 - t))
    });
    await sleep(35);
  }
  const { data } = await page.send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: box.left + box.scrollX + LIVE_INSET,
      y: box.top + box.scrollY + LIVE_INSET,
      width: box.width - LIVE_INSET * 2,
      height: box.height - LIVE_INSET * 2,
      scale: 1
    }
  });
  return Buffer.from(data, 'base64');
};

const report = (label, done, total, detail = '') =>
  process.stdout.write(`\r${label} ${done}/${total} ${detail}`.padEnd(80));

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const catalog = getComponentCatalog().filter(
    entry => !options.only || options.only.has(entry.slug) || options.only.has(entry.key)
  );
  if (!catalog.length) throw new Error('No components matched.');

  const jobs = catalog
    .map(entry => {
      const [category, name] = entry.key.split('/');
      const videoFile = entry.meta.videoUrl ? path.join(PUBLIC_DIR, entry.meta.videoUrl) : null;
      const hasVideo = Boolean(videoFile && fs.existsSync(videoFile));
      const output = path.join(options.out, entry.categorySlug, `${entry.slug}.jpg`);
      const inputs = [
        BASE_IMAGE,
        TEMPLATE,
        ...(hasVideo ? [videoFile] : []),
        ...filesIn(path.join(ROOT, 'src/content', category, name)),
        path.join(ROOT, 'src/demo', category, `${name}Demo.jsx`)
      ];
      return {
        entry,
        hasVideo,
        output,
        live: `${entry.categorySlug}--${entry.slug}.png`,
        stale: isStale(output, inputs)
      };
    })
    .filter(job => options.force || job.stale);

  if (!jobs.length) {
    console.log(`OG images: all ${catalog.length} up to date.`);
    return;
  }

  const liveDir = fs.mkdtempSync(path.join(os.tmpdir(), 'react-bits-og-live-'));
  const site = options.live ? await startSite(options.site) : null;
  const server = await startServer(liveDir);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const chrome = await launchChrome(findChrome());
  const browser = await connect(chrome.endpoint.href);
  const failures = [];
  let written = 0;
  let captured = 0;

  try {
    if (site) {
      const queue = [...jobs];
      const tabs = await Promise.all(
        Array.from({ length: Math.min(LIVE_TABS, jobs.length) }, () =>
          openPage(browser, chrome.endpoint, { width: LIVE_WIDTH, height: LIVE_HEIGHT, scale: LIVE_SCALE })
        )
      );
      await Promise.all(
        tabs.map(async tab => {
          while (queue.length) {
            const job = queue.shift();
            try {
              fs.writeFileSync(path.join(liveDir, job.live), await captureLive(tab, site.url, job.entry));
              job.captured = true;
            } catch (error) {
              job.captureError = error.message;
            }
            captured += 1;
            report('Capturing live previews', captured, jobs.length, job.entry.path);
          }
          tab.close();
        })
      );
      process.stdout.write('\n');
    }

    const page = await openPage(browser, chrome.endpoint, { width: WIDTH, height: HEIGHT, scale: 1 });
    for (const job of jobs) {
      try {
        const { image, state } = await renderCard(page, origin, {
          title: job.entry.name,
          image: job.captured ? `/live/${job.live}` : null,
          video: job.hasVideo ? job.entry.meta.videoUrl : null
        });
        job.source = state.source;
        if (options.debug) console.log(`\n${job.entry.path} ${JSON.stringify(state.frame)}`);
        fs.mkdirSync(path.dirname(job.output), { recursive: true });
        fs.writeFileSync(job.output, image);
        written += 1;
        report('Rendering cards', written, jobs.length, job.entry.path);
      } catch (error) {
        failures.push(`${job.entry.path}: ${error.message}`);
      }
    }
    page.close();
  } finally {
    browser.close();
    await chrome.close();
    server.close();
    await site?.close();
    if (options.debug) console.log(`\nLive captures kept in ${liveDir}`);
    else fs.rmSync(liveDir, { recursive: true, force: true });
  }

  process.stdout.write('\n');
  const fromVideo = jobs.filter(job => job.source === 'video').map(job => job.entry.slug);
  console.log(
    `OG images: ${written} written (${written - fromVideo.length} live, ${fromVideo.length} from video), ${catalog.length - jobs.length} up to date, ${failures.length} failed.`
  );
  if (fromVideo.length && site) console.log(`  From video: ${fromVideo.join(', ')}`);
  if (failures.length) {
    failures.forEach(failure => console.error(`  ${failure}`));
    process.exitCode = 1;
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
