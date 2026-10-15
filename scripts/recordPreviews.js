import { Buffer } from 'buffer';
import { execFileSync, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { componentMetadata } from '../src/constants/Information.js';
import { pageScript } from './previews/page.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPECS = path.join(ROOT, 'scripts/previews/choreography.json');
const ANNOUNCEMENT = path.join(ROOT, 'src/components/common/AnnouncementModal/AnnouncementModal.jsx');
const ROUTES = path.join(ROOT, 'src/constants/Components.js');
const VIDEO_DIR = path.join(ROOT, 'public/assets/video');
const ASPECT = 1.6;
const OUT_WIDTH = 960;
const OUT_HEIGHT = 600;
const SCALE = 2;
const VIEW_WIDTH = 1680;
const VIEW_HEIGHT = 1200;
const CROSSFADE = 0.5;
const DIP = 0.35;
const FADE_IN = 0.2;
const GLIDE = 0.45;
const MAX_ZOOM = 2.6;
const BUDGET = 90;
const AMBIENT_BUDGET = 70;
const FINAL_WIDTH = 800;
const FINAL_HEIGHT = 500;
const PROBE_RATIO = 0.7;
const CALL_TIMEOUT = 60000;
const AUTO_SCALE = 3.2;
const BACKDROP = { dark: [18, 15, 23], light: [255, 255, 255] };
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser'
];
const LOCK_CSS = 'html, body { overflow: hidden !important; }';
const SCROLL_CSS = 'html, body { scroll-behavior: auto !important; }';
const HIDE_CSS = [
  '.demo-container button[aria-label="Refresh animation"], .background-demo-content, .bgc, .demo-scroll-hint { display: none !important; }',
  '.demo-container { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }',
  '.demo-container::after, .demo-container::before { display: none !important; }',
  '.main-nav, .ln-navbar { visibility: hidden !important; }',
  '.right-panel, .pro-mobile-bar { display: none !important; }',
  '[data-sonner-toaster], .sidebar-hover-preview { display: none !important; }'
].join(' ');
const DEFAULTS = {
  Backgrounds: { duration: 6, loop: 'crossfade', frame: 'full', cursor: 'none' },
  other: { duration: 5, loop: 'replay', frame: 'auto', cursor: 'auto' }
};
const KEYS = {
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Enter: 13,
  Escape: 27,
  Tab: 9,
  Backspace: 8,
  Home: 36,
  End: 35,
  PageUp: 33,
  PageDown: 34,
  ' ': 32,
  Space: 32
};

const parseArgs = argv => {
  const options = {
    only: null,
    category: null,
    modes: ['dark', 'light'],
    site: null,
    workers: 3,
    out: VIDEO_DIR,
    masters: path.join(os.tmpdir(), 'react-bits-preview-masters'),
    fps: 60,
    force: false,
    keep: false,
    encode: true,
    reencode: false,
    mp4Only: false,
    postersOnly: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--only') options.only = new Set(argv[++i].split(',').map(value => value.trim()));
    else if (arg === '--category') options.category = new Set(argv[++i].split(',').map(value => value.trim()));
    else if (arg === '--mode') options.modes = argv[++i] === 'both' ? ['dark', 'light'] : [argv[i]];
    else if (arg === '--site') options.site = argv[++i].replace(/\/$/, '');
    else if (arg === '--workers') options.workers = Math.max(1, Number(argv[++i]) || 1);
    else if (arg === '--out') options.out = path.resolve(argv[++i]);
    else if (arg === '--masters') options.masters = path.resolve(argv[++i]);
    else if (arg === '--fps') options.fps = Math.max(10, Number(argv[++i]) || 60);
    else if (arg === '--force') options.force = true;
    else if (arg === '--keep') options.keep = true;
    else if (arg === '--masters-only') options.encode = false;
    else if (arg === '--reencode') options.reencode = true;
    else if (arg === '--posters-only') {
      options.reencode = true;
      options.postersOnly = true;
    } else if (arg === '--mp4-only') {
      options.reencode = true;
      options.mp4Only = true;
    }
  }
  return options;
};

const findBinary = (env, candidates) => {
  if (process.env[env]) return process.env[env];
  for (const candidate of candidates) {
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
  return null;
};

const FFMPEG = findBinary('FFMPEG_PATH', ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', 'ffmpeg']);

const announcementKey = () => {
  try {
    return fs.readFileSync(ANNOUNCEMENT, 'utf8').match(/STORAGE_KEY = '([^']+)'/)?.[1] ?? null;
  } catch {
    return null;
  }
};

const catalog = () => {
  const routes = fs.readFileSync(ROUTES, 'utf8');
  return Object.entries(componentMetadata).map(([key, meta]) => {
    const route = new URL(meta.docsUrl).pathname;
    const slug = route.split('/').pop();
    const demo = routes.match(new RegExp(`(?<![\\w-])'?${slug}'?: \\(\\) => import\\('([^']+)'\\)`))?.[1];
    const demoFile = demo
      ? ['.jsx', '.js', ''].map(ext => path.join(ROOT, demo.replace('../', 'src/') + ext)).find(fs.existsSync)
      : null;
    const base = (meta.videoUrl || `/assets/video/${slug.replace(/-/g, '')}.webm`)
      .replace(/^\/assets\/video\//, '')
      .replace(/\.(webm|mp4)$/i, '');
    return {
      key,
      category: meta.category,
      name: meta.name,
      route,
      slug,
      base,
      inputs: [demoFile, path.join(ROOT, 'src/content', key)].filter(Boolean)
    };
  });
};

const loadSpecs = () => {
  if (!fs.existsSync(SPECS)) return new Map();
  const data = JSON.parse(fs.readFileSync(SPECS, 'utf8'));
  const list = Array.isArray(data) ? data : Object.entries(data).map(([slug, spec]) => ({ slug, ...spec }));
  return new Map(list.map(spec => [spec.slug, spec]));
};

const filesIn = target => {
  if (!fs.existsSync(target)) return [];
  if (!fs.statSync(target).isDirectory()) return [target];
  return fs.readdirSync(target).flatMap(entry => filesIn(path.join(target, entry)));
};

const isStale = (outputs, inputs) => {
  if (outputs.some(output => !fs.existsSync(output))) return true;
  const built = Math.min(...outputs.map(output => fs.statSync(output).mtimeMs));
  return inputs.flatMap(filesIn).some(input => fs.statSync(input).mtimeMs > built);
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const launchChrome = binary =>
  new Promise((resolve, reject) => {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'react-bits-previews-'));
    const chrome = spawn(
      binary,
      [
        '--headless=new',
        '--remote-debugging-port=0',
        `--user-data-dir=${profile}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--hide-scrollbars',
        '--mute-audio',
        '--force-color-profile=srgb',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--autoplay-policy=no-user-gesture-required',
        '--ignore-gpu-blocklist',
        `--window-size=${VIEW_WIDTH},${VIEW_HEIGHT}`,
        'about:blank'
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    let settled = false;
    const close = () =>
      new Promise(done => {
        if (chrome.exitCode !== null || chrome.signalCode) {
          fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
          done();
          return;
        }
        chrome.once('exit', () => {
          fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
          done();
        });
        chrome.kill('SIGKILL');
      });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      chrome.kill('SIGKILL');
      reject(new Error('Chrome did not start in time.'));
    }, 20000);
    let output = '';
    chrome.stderr.on('data', chunk => {
      output += chunk;
      const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(output);
      if (match && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ endpoint: new URL(match[1]), process: chrome, close });
      }
    });
    chrome.on('exit', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Chrome exited early with code ${code}.`));
    });
  });

const connect = url =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const pending = new Map();
    const listeners = new Map();
    let nextId = 0;
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const waiting = pending.get(message.id);
        if (!waiting) return;
        pending.delete(message.id);
        if (message.error) waiting.reject(new Error(message.error.message));
        else waiting.resolve(message.result);
        return;
      }
      for (const listener of listeners.get(message.method) || []) listener(message.params);
    });
    socket.addEventListener('close', () => {
      for (const waiting of pending.values()) waiting.reject(new Error('DevTools connection closed.'));
      pending.clear();
    });
    socket.addEventListener('error', () => reject(new Error(`Could not connect to ${url}`)));
    socket.addEventListener('open', () =>
      resolve({
        send: (method, params = {}) =>
          new Promise((done, fail) => {
            nextId += 1;
            const id = nextId;
            const timer = setTimeout(() => {
              pending.delete(id);
              fail(new Error(`${method} timed out`));
            }, CALL_TIMEOUT);
            pending.set(id, {
              resolve: value => {
                clearTimeout(timer);
                done(value);
              },
              reject: error => {
                clearTimeout(timer);
                fail(error);
              }
            });
            socket.send(JSON.stringify({ id, method, params }));
          }),
        on: (method, listener) => {
          if (!listeners.has(method)) listeners.set(method, []);
          listeners.get(method).push(listener);
        },
        close: () => socket.close()
      })
    );
  });

const startSite = async site => {
  if (site) return { url: site, close: async () => {} };
  const { build, preview } = await import('vite');
  console.log('Building the site for recording...');
  await build({ root: ROOT, logLevel: 'error' });
  const server = await preview({ root: ROOT, logLevel: 'error', preview: { port: 4190, strictPort: false } });
  return { url: server.resolvedUrls.local[0].replace(/\/$/, ''), close: () => server.close() };
};

const evaluate = async (page, expression) => {
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (exceptionDetails)
    throw new Error(exceptionDetails.exception?.description || exceptionDetails.text || 'Script error');
  return result.value;
};

const easing = {
  linear: u => u,
  out: u => 1 - (1 - u) ** 3,
  in: u => u ** 3,
  inOut: u => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2)
};

const ease = (name, u) => (easing[name] || easing.inOut)(Math.min(1, Math.max(0, u)));

const catmull = (points, u) => {
  if (points.length === 1) return points[0];
  const segments = points.length - 1;
  const scaled = Math.min(segments - 1e-9, Math.max(0, u * segments));
  const index = Math.floor(scaled);
  const t = scaled - index;
  const p0 = points[Math.max(0, index - 1)];
  const p1 = points[index];
  const p2 = points[index + 1];
  const p3 = points[Math.min(points.length - 1, index + 2)];
  const blend = (a, b, c, d) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  return [blend(p0[0], p1[0], p2[0], p3[0]), blend(p0[1], p1[1], p2[1], p3[1])];
};

const OUTSIDE = [1.12, 0.62];

const compileTimeline = spec => {
  const actions = [...(spec.actions || [])]
    .map((action, order) => ({ ...action, order, begin: action.at ?? action.from ?? 0 }))
    .sort((a, b) => a.begin - b.begin || a.order - b.order);
  const segments = [];
  const presses = [];
  const discrete = [];
  let position = { point: OUTSIDE };
  let free = -Infinity;
  const glideTo = (target, end) => {
    const start = Math.max(free, end - GLIDE);
    if (start < end) segments.push({ t0: start, t1: end, kind: 'glide', from: position, to: target, ease: 'inOut' });
    else segments.push({ t0: end, t1: end, kind: 'glide', from: target, to: target, ease: 'linear' });
  };
  for (const action of actions) {
    const type = action.type;
    if (type === 'path' || type === 'drag') {
      const points = (action.points || []).map(point => (Array.isArray(point) ? { point } : point));
      if (!points.length) continue;
      const from = action.from ?? 0;
      const to = Math.max(from + 0.05, action.to ?? from + 1);
      glideTo(points[0], from);
      segments.push({ t0: from, t1: to, kind: 'curve', points, ease: action.ease || 'inOut' });
      if (type === 'drag') presses.push([from, to, 'left']);
      position = points[points.length - 1];
      free = to;
    } else if (type === 'click') {
      const target = action.selector
        ? { selector: action.selector, dx: action.dx, dy: action.dy }
        : { point: [action.x ?? 0.5, action.y ?? 0.5] };
      const at = action.at ?? 0;
      glideTo(target, at);
      position = target;
      const hold = Math.max(0.06, action.hold ?? 0.09);
      presses.push([at, at + hold, action.button === 'right' ? 'right' : 'left']);
      free = at + hold;
    } else if (type === 'leave') {
      const at = action.at ?? 0;
      segments.push({
        t0: at,
        t1: at + GLIDE,
        kind: 'glide',
        from: position,
        to: { point: OUTSIDE, leave: true },
        ease: 'inOut'
      });
      position = { point: OUTSIDE };
      free = at + GLIDE;
    } else if (type === 'wheel' || type === 'scroll') {
      discrete.push({ ...action, from: action.from ?? 0, to: Math.max((action.from ?? 0) + 0.05, action.to ?? 1) });
    } else if (type === 'key' || type === 'refresh') {
      discrete.push({ ...action, at: action.at ?? 0 });
    }
  }
  segments.sort((a, b) => a.t0 - b.t0);
  return { segments, presses, discrete };
};

const resolvePoint = async (page, target, cache) => {
  if (target.point) return target.point;
  if (target.selector) {
    if (!cache.has(target)) {
      const rect = await evaluate(page, `__vt.rect(${JSON.stringify(target.selector)})`);
      cache.set(target, rect ? [rect.x, rect.y] : [0.5, 0.5]);
    }
    const [x, y] = cache.get(target);
    return [x + (target.dx || 0), y + (target.dy || 0)];
  }
  return [0.5, 0.5];
};

const pointerAt = async (page, timeline, t, cache) => {
  let active = null;
  for (const segment of timeline.segments) {
    if (segment.t0 <= t) active = segment;
    else break;
  }
  if (!active) return OUTSIDE;
  const u = active.t1 > active.t0 ? (Math.min(t, active.t1) - active.t0) / (active.t1 - active.t0) : 1;
  const k = ease(active.ease, u);
  if (active.kind === 'curve') {
    const points = [];
    for (const point of active.points) points.push(await resolvePoint(page, point, cache));
    return catmull(points, k);
  }
  const from = await resolvePoint(page, active.from, cache);
  const to = await resolvePoint(page, active.to, cache);
  return [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k];
};

const pressedAt = (timeline, t) => timeline.presses.find(([a, b]) => t >= a && t < b)?.[2] || false;

const keyEvent = key => {
  const code = KEYS[key] ?? (key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0);
  const text = key.length === 1 ? key : key === 'Enter' ? '\r' : key === 'Space' ? ' ' : undefined;
  return {
    key: key === 'Space' ? ' ' : key,
    code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
    windowsVirtualKeyCode: code,
    text
  };
};

const queryFor = props =>
  Object.entries(props || {})
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(Array.isArray(value) ? value.join(',') : String(value).replace(/^#/, ''))}`
    )
    .join('&');

const record = async (chrome, site, job, framesDir, log) => {
  const { targetId } = await chrome.browser.send('Target.createTarget', { url: 'about:blank' });
  const page = await connect(`ws://${chrome.endpoint.host}/devtools/page/${targetId}`);
  const problems = [];
  page.on('Runtime.exceptionThrown', params =>
    problems.push(params.exceptionDetails?.exception?.description || params.exceptionDetails?.text)
  );
  page.on('Runtime.consoleAPICalled', params => {
    if (params.type === 'error')
      problems.push(
        params.args
          .map(arg => arg.value ?? arg.description ?? '')
          .join(' ')
          .slice(0, 300)
      );
  });
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      deviceScaleFactor: job.scale,
      mobile: false
    });
    await page.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-color-scheme', value: job.mode },
        { name: 'prefers-reduced-motion', value: 'no-preference' }
      ]
    });
    await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: pageScript({
        theme: job.mode,
        announcementKey: chrome.announcement,
        aspect: ASPECT,
        css: job.spec.pageScroll ? `${SCROLL_CSS} ${HIDE_CSS}` : `${LOCK_CSS} ${SCROLL_CSS} ${HIDE_CSS}`
      })
    });
    const props = { ...(job.spec.props || {}), ...(job.mode === 'light' ? job.spec.lightProps || {} : {}) };
    const query = queryFor(props);
    await page.send('Page.navigate', { url: `${site}${job.item.route}${query ? `?${query}` : ''}` });

    const deadline = Date.now() + 45000;
    let ready = false;
    while (Date.now() < deadline) {
      ready = await evaluate(page, `!!(window.__vt && window.__vt.ready())`).catch(() => false);
      if (ready) break;
      await sleep(150);
    }
    if (!ready) throw new Error('demo never became ready');
    let count = -1;
    let stable = 0;
    while (Date.now() < deadline && stable < 5) {
      const now = await evaluate(page, `__vt.resources()`);
      stable = now === count ? stable + 1 : 0;
      count = now;
      await sleep(150);
    }
    await sleep(job.spec.settle ?? 400);

    let box = await evaluate(page, `__vt.container()`);
    if (!job.spec.pageScroll && box.height + 240 > VIEW_HEIGHT) {
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: VIEW_WIDTH,
        height: Math.ceil(box.height + 400),
        deviceScaleFactor: job.scale,
        mobile: false
      });
      await sleep(300);
      box = await evaluate(page, `__vt.container()`);
    }
    if (job.spec.pageScroll) {
      await evaluate(
        page,
        `(() => { const r = document.querySelector('.demo-container').getBoundingClientRect(); window.scrollTo(0, Math.max(0, window.scrollY + r.top - (innerHeight - r.height - 120))); return 1; })()`
      );
      box = await evaluate(page, `__vt.measure()`);
    } else await evaluate(page, `__vt.lockScroll()`);
    await evaluate(page, `__vt.begin()`);

    const fps = job.fps;
    const dt = 1000 / fps;
    const timeline = compileTimeline(job.spec);
    const cache = new Map();
    const warmup = Math.max(0, job.spec.warmup || 0);
    const tail = job.spec.loop === 'crossfade' ? CROSSFADE : 0;
    const total = Math.round((job.spec.duration + tail) * fps);
    const startFrame = -Math.round(warmup * fps);
    let last = { x: null, y: null, pressed: false };
    const track = [];
    const toPage = point => ({ x: box.x + point[0] * box.width, y: box.y + point[1] * box.height });

    for (let frame = startFrame; frame < total; frame += 1) {
      const t = (frame + 1) / fps;
      const previous = frame / fps;
      const point = await pointerAt(page, timeline, t, cache);
      const pressed = pressedAt(timeline, t);
      const { x, y } = toPage(point);
      if (x !== last.x || y !== last.y || pressed !== last.pressed) {
        const mask = (pressed || last.pressed) === 'right' ? 2 : 1;
        if (pressed && !last.pressed) {
          await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 });
          await page.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x,
            y,
            button: pressed,
            buttons: mask,
            clickCount: 1
          });
        } else if (!pressed && last.pressed) {
          await page.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x,
            y,
            button: last.pressed,
            buttons: mask
          });
          await page.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x,
            y,
            button: last.pressed,
            buttons: 0,
            clickCount: 1
          });
        } else {
          await page.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x,
            y,
            button: pressed || 'none',
            buttons: pressed ? mask : 0
          });
        }
        last = { x, y, pressed };
      }
      const scripts = [];
      const due = at => (at > previous || (frame === startFrame && at >= previous)) && at <= t;
      for (const action of timeline.discrete) {
        if (action.type === 'key' && due(action.at)) {
          const event = keyEvent(action.key);
          await page.send('Input.dispatchKeyEvent', { type: event.text ? 'keyDown' : 'rawKeyDown', ...event });
          await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...event, text: undefined });
        } else if (action.type === 'refresh' && due(action.at)) {
          scripts.push(`__vt.click('button[aria-label="Refresh animation"]');`);
        } else if (action.type === 'wheel' && t > action.from && previous < action.to) {
          const span = action.to - action.from;
          const a = ease(action.ease || 'inOut', (Math.max(previous, action.from) - action.from) / span);
          const b = ease(action.ease || 'inOut', (Math.min(t, action.to) - action.from) / span);
          const at = toPage([action.x ?? 0.5, action.y ?? 0.5]);
          await page.send('Input.dispatchMouseEvent', {
            type: 'mouseWheel',
            x: at.x,
            y: at.y,
            deltaX: (action.deltaX || 0) * (b - a),
            deltaY: (action.deltaY || 0) * (b - a)
          });
        } else if (action.type === 'scroll' && t > action.from && previous < action.to + 1 / fps) {
          if (action.startPx === undefined) {
            action.startPx =
              action.from_px ?? (await evaluate(page, `__vt.scrollTop(${JSON.stringify(action.selector || null)})`));
          }
          const u = ease(action.ease || 'inOut', (Math.min(t, action.to) - action.from) / (action.to - action.from));
          scripts.push(
            `__vt.scroll(${JSON.stringify(action.selector || null)}, ${u}, ${action.startPx}, ${JSON.stringify(action.to_px ?? 'bottom')});`
          );
        }
      }
      const cursorMode = job.spec.cursor || 'auto';
      const showCursor = cursorMode !== 'none' && timeline.segments.length > 0;
      scripts.push(
        showCursor
          ? `__vt.cursor(${x}, ${y}, ${Boolean(pressed)}, ${JSON.stringify(cursorMode)});`
          : `__vt.hideCursor();`
      );
      await evaluate(
        page,
        `(async () => { ${scripts.join(' ')} await __vt.step(${dt}, ${frame >= -1}); return 1; })()`
      );
      box = await evaluate(page, `__vt.measure()`);
      if (frame >= 0) {
        track.push(showCursor ? point : null);
        const { data } = await page.send('Page.captureScreenshot', {
          format: 'jpeg',
          quality: 94,
          clip: { x: box.x + box.sx, y: box.y + box.sy, width: box.width, height: box.height, scale: 1 },
          optimizeForSpeed: true
        });
        fs.writeFileSync(path.join(framesDir, `${String(frame).padStart(5, '0')}.jpg`), Buffer.from(data, 'base64'));
      }
    }
    const landed = await evaluate(page, `location.pathname`).catch(() => null);
    if (landed !== job.item.route) throw new Error(`page navigated to ${landed}`);
    const pageErrors = await evaluate(page, `__vt.errors`).catch(() => []);
    log.push(...problems.filter(Boolean), ...pageErrors);
    return { frames: total, box, track };
  } finally {
    page.close();
    await chrome.browser.send('Target.closeTarget', { targetId }).catch(() => {});
  }
};

const loadSharp = async () => (await import('sharp')).default;

const readRaw = async (sharp, file, width) => {
  const image = sharp(file);
  const resized = width ? image.resize({ width }) : image;
  const { data, info } = await resized.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

const frameBox = async (sharp, framesDir, count, mode, track, box) => {
  const files = fs
    .readdirSync(framesDir)
    .filter(name => name.endsWith('.jpg'))
    .sort();
  const every = Math.max(1, Math.floor(count / 24));
  const sample = files.filter((_, index) => index % every === 0);
  const [r, g, b] = BACKDROP[mode];
  let hits = null;
  let width = 0;
  let height = 0;
  for (const [order, name] of sample.entries()) {
    const raw = await readRaw(sharp, path.join(framesDir, name), 320);
    width = raw.width;
    height = raw.height;
    if (!hits) hits = new Uint16Array(width * height);
    const pointer = track[order * every];
    const mask = pointer
      ? {
          x0: pointer[0] - 6 / box.width,
          x1: pointer[0] + 32 / box.width,
          y0: pointer[1] - 6 / box.height,
          y1: pointer[1] + 44 / box.height
        }
      : null;
    for (let i = 0; i < width * height; i += 1) {
      if (mask) {
        const u = (i % width) / width;
        const v = Math.floor(i / width) / height;
        if (u >= mask.x0 && u <= mask.x1 && v >= mask.y0 && v <= mask.y1) continue;
      }
      const d = Math.abs(raw.data[i * 3] - r) + Math.abs(raw.data[i * 3 + 1] - g) + Math.abs(raw.data[i * 3 + 2] - b);
      if (d > 30) hits[i] += 1;
    }
  }
  if (!hits) return null;
  const need = Math.max(1, Math.round(sample.length * 0.04));
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (hits[y * width + x] < need) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  return { x0: x0 / width, y0: y0 / height, x1: (x1 + 1) / width, y1: (y1 + 1) / height };
};

const cropFor = (frame, content) => {
  if (frame === 'full' || !frame) return { zoom: 1, cx: 0.5, cy: 0.5 };
  if (typeof frame === 'object')
    return { zoom: Math.max(1, frame.zoom || 1), cx: frame.cx ?? 0.5, cy: frame.cy ?? 0.5 };
  if (!content) return { zoom: 1, cx: 0.5, cy: 0.5 };
  const pad = 0.12;
  const w = Math.min(1, content.x1 - content.x0 + pad * 2);
  const h = Math.min(1, content.y1 - content.y0 + pad * 2 * ASPECT);
  const zoom = Math.min(MAX_ZOOM, Math.max(1, Math.min(1 / w, 1 / h)));
  return { zoom, cx: (content.x0 + content.x1) / 2, cy: (content.y0 + content.y1) / 2 };
};

const cropFilter = (crop, width, height) => {
  const fit = Math.min(height, width / ASPECT) / crop.zoom;
  const h = Math.round(fit / 2) * 2;
  const w = Math.min(width, Math.round((fit * ASPECT) / 2) * 2);
  const x = Math.round(Math.min(width - w, Math.max(0, crop.cx * width - w / 2)));
  const y = Math.round(Math.min(height - h, Math.max(0, crop.cy * height - h / 2)));
  return `crop=${w}:${h}:${x}:${y}`;
};

const mix = (a, b, k) => {
  const out = Buffer.allocUnsafe(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = Math.round(a[i] + (b[i] - a[i]) * k);
  return out;
};

const sequence = async (sharp, framesDir, seqDir, job, count) => {
  fs.mkdirSync(seqDir, { recursive: true });
  const processed = path.join(seqDir, '..', 'processed');
  fs.mkdirSync(processed, { recursive: true });
  const fps = job.fps;
  const name = index => path.join(framesDir, `${String(index).padStart(5, '0')}.jpg`);
  const length = Math.min(Math.round(job.spec.duration * fps), count);
  const sources = Array.from({ length }, (_, index) => name(index));
  const write = async (index, raw) => {
    const file = path.join(processed, `${String(index).padStart(5, '0')}.jpg`);
    await sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 3 } })
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
      .toFile(file);
    sources[index] = file;
  };
  let rotation = 0;
  if (job.spec.loop === 'crossfade' && count >= length + 2) {
    const overlap = Math.min(count - length, Math.round(CROSSFADE * fps));
    for (let i = 0; i < overlap; i += 1) {
      const head = await readRaw(sharp, name(i));
      const tailFrame = await readRaw(sharp, name(length + i));
      const k = (i + 1) / (overlap + 1);
      await write(i, {
        data: mix(tailFrame.data, head.data, k * k * (3 - 2 * k)),
        width: head.width,
        height: head.height
      });
    }
  } else if (job.spec.loop === 'replay') {
    const dip = Math.round(DIP * fps);
    const backdrop = BACKDROP[job.mode];
    const from = length - dip;
    const plateFor = raw => {
      const plate = Buffer.allocUnsafe(raw.data.length);
      for (let p = 0; p < plate.length; p += 3) {
        plate[p] = backdrop[0];
        plate[p + 1] = backdrop[1];
        plate[p + 2] = backdrop[2];
      }
      return plate;
    };
    for (let i = from; i < length; i += 1) {
      const raw = await readRaw(sharp, name(i));
      const k = (i - from + 1) / dip;
      await write(i, { data: mix(raw.data, plateFor(raw), k * k * (3 - 2 * k)), width: raw.width, height: raw.height });
    }
    const rise = Math.round(FADE_IN * fps);
    for (let i = 0; i < Math.min(rise, from); i += 1) {
      const raw = await readRaw(sharp, name(i));
      const k = 1 - (i + 1) / (rise + 1);
      await write(i, { data: mix(raw.data, plateFor(raw), k * k * (3 - 2 * k)), width: raw.width, height: raw.height });
    }
    rotation = Math.max(0, from - Math.round(0.5 * fps));
  }
  for (let j = 0; j < length; j += 1) {
    fs.symlinkSync(sources[(j + rotation) % length], path.join(seqDir, `${String(j).padStart(5, '0')}.jpg`));
  }
  return length;
};

const run = (args, label) =>
  new Promise((resolve, reject) => {
    const child = spawn(FFMPEG, ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let errors = '';
    child.stderr.on('data', chunk => {
      errors += chunk;
    });
    child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${label}: ${errors.slice(-400)}`))));
  });

const encodeMaster = async (job, seqDir, crop, frameSize, master) => {
  const filter = `${cropFilter(crop, frameSize.width, frameSize.height)},scale=${OUT_WIDTH}:${OUT_HEIGHT}:flags=lanczos`;
  await run(
    [
      '-framerate',
      String(job.fps),
      '-i',
      path.join(seqDir, '%05d.jpg'),
      '-vf',
      `${filter},format=yuv420p`,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '10',
      '-g',
      String(job.fps),
      master
    ],
    'master'
  );
};

const rateFilter = (job, fps) => [
  '-vf',
  `${fps !== job.fps ? `fps=${fps},` : ''}scale=${FINAL_WIDTH}:${FINAL_HEIGHT}:flags=lanczos:out_range=tv:out_color_matrix=bt709,format=yuv420p`,
  '-color_range',
  'tv',
  '-colorspace',
  'bt709',
  '-color_primaries',
  'bt709',
  '-color_trc',
  'bt709'
];

const estimateSize = async (job, master, crf, fps) => {
  const probe = `${master}.probe.webm`;
  await run(
    [
      '-i',
      master,
      ...rateFilter(job, fps),
      '-c:v',
      'libvpx-vp9',
      '-crf',
      String(crf),
      '-b:v',
      '0',
      '-row-mt',
      '1',
      '-deadline',
      'realtime',
      '-cpu-used',
      '8',
      '-an',
      probe
    ],
    'vp9 probe'
  );
  const size = fs.statSync(probe).size;
  fs.rmSync(probe, { force: true });
  return size;
};

const vp9Pass = async (job, master, output, crf, fps) => {
  const passlog = `${master}.vp9`;
  const vp9 = [
    ...rateFilter(job, fps),
    '-c:v',
    'libvpx-vp9',
    '-crf',
    String(crf),
    '-b:v',
    '0',
    '-row-mt',
    '1',
    '-tile-columns',
    '1',
    '-auto-alt-ref',
    '1',
    '-lag-in-frames',
    '25',
    '-g',
    String(fps * 10),
    '-deadline',
    'good',
    '-pix_fmt',
    'yuv420p',
    '-an',
    '-passlogfile',
    passlog
  ];
  await run(['-i', master, ...vp9, '-pass', '1', '-cpu-used', '4', '-f', 'webm', '/dev/null'], 'vp9 pass 1');
  await run(['-i', master, ...vp9, '-pass', '2', '-cpu-used', '2', output], 'vp9 pass 2');
  for (const file of fs.readdirSync(path.dirname(passlog))) {
    if (file.startsWith(path.basename(passlog))) fs.rmSync(path.join(path.dirname(passlog), file), { force: true });
  }
};

const writePoster = async (sharp, webm, poster) => {
  const frame = `${poster}.png`;
  await run(['-ss', '0.1', '-i', webm, '-frames:v', '1', frame], 'poster');
  await sharp(frame).webp({ quality: 78, effort: 6 }).toFile(poster);
  fs.rmSync(frame, { force: true });
};

const encodeMp4 = async (job, master, output, rate, crf) => {
  await run(
    [
      '-i',
      master,
      ...rateFilter(job, Math.min(30, job.fps)),
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      String(crf),
      '-maxrate',
      `${Math.round(rate * 6)}k`,
      '-bufsize',
      `${Math.round(rate * 12)}k`,
      '-profile:v',
      'high',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      output
    ],
    'mp4'
  );
};

const encodeFinals = async (job, master, outputs, mp4Only = false) => {
  const ambient = job.item.category === 'Backgrounds';
  const rate = job.spec.kbPerSecond ?? (ambient ? AMBIENT_BUDGET : BUDGET);
  if (mp4Only) {
    await encodeMp4(job, master, outputs.mp4, rate, job.spec.mp4Crf ?? 30);
    return;
  }
  const budget = rate * 1024 * job.spec.duration;
  const base = job.spec.crf ?? 36;
  let fps = Math.min(job.fps, job.spec.fps ?? (ambient ? 30 : job.fps));
  let estimate = (await estimateSize(job, master, base, fps)) * PROBE_RATIO;
  if (estimate > budget * 2 && fps > 30) {
    fps = 30;
    estimate = (await estimateSize(job, master, base, fps)) * PROBE_RATIO;
  }
  let crf = estimate > budget ? Math.min(52, base + Math.ceil(6 * Math.log2(estimate / budget))) : base;
  await vp9Pass(job, master, outputs.webm, crf, fps);
  if (fs.statSync(outputs.webm).size > budget * 1.2 && crf < 52) {
    crf = Math.min(52, crf + Math.ceil(6 * Math.log2(fs.statSync(outputs.webm).size / budget)));
    await vp9Pass(job, master, outputs.webm, crf, fps);
  }
  await encodeMp4(job, master, outputs.mp4, rate, (job.spec.mp4Crf ?? 30) + Math.round((crf - base) * 0.4));
};

const specFor = (item, specs) => {
  const base = item.category === 'Backgrounds' ? DEFAULTS.Backgrounds : DEFAULTS.other;
  const spec = { ...base, ...(specs.get(item.slug) || {}) };
  spec.duration = Math.min(10, Math.max(2, Number(spec.duration) || base.duration));
  return spec;
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  if (!FFMPEG) throw new Error('ffmpeg was not found. Set FFMPEG_PATH.');
  const chromeBinary = findBinary('CHROME_PATH', CHROME_CANDIDATES);
  if (!chromeBinary) throw new Error('Chrome was not found. Set CHROME_PATH.');
  const sharp = await loadSharp();
  const specs = loadSpecs();
  fs.mkdirSync(options.out, { recursive: true });
  fs.mkdirSync(options.masters, { recursive: true });

  const jobs = [];
  for (const item of catalog()) {
    if (options.only && !options.only.has(item.slug)) continue;
    if (options.category && !options.category.has(item.category)) continue;
    for (const mode of options.modes) {
      const name = mode === 'light' ? `${item.base}-light` : item.base;
      const outputs = {
        webm: path.join(options.out, `${name}.webm`),
        mp4: path.join(options.out, `${name}.mp4`),
        poster: path.join(options.out, `${name}.webp`)
      };
      const master = path.join(options.masters, `${name}.mp4`);
      const watched = options.encode ? [outputs.webm, outputs.mp4, outputs.poster] : [master];
      if (!options.force && !isStale(watched, [...item.inputs, SPECS])) continue;
      const spec = specFor(item, specs);
      const scale =
        spec.frame === 'auto'
          ? AUTO_SCALE
          : typeof spec.frame === 'object'
            ? Math.min(4, Math.max(SCALE, 1.6 * (spec.frame.zoom || 1)))
            : SCALE;
      jobs.push({ item, mode, name, outputs, master, spec, scale, fps: options.fps });
    }
  }
  if (!jobs.length) {
    console.log('Preview videos are up to date.');
    return;
  }
  console.log(
    `Recording ${jobs.length} preview video${jobs.length === 1 ? '' : 's'} with ${options.workers} worker${options.workers === 1 ? '' : 's'}...`
  );

  const site = await startSite(options.site);
  const announcement = announcementKey();
  const chromes = new Set();
  const shutdown = async () => {
    await Promise.all([...chromes].map(chrome => chrome.close().catch(() => {})));
    chromes.clear();
  };
  const onSignal = () => {
    for (const chrome of chromes) chrome.process.kill('SIGKILL');
    process.exit(1);
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);

  const failures = [];
  let done = 0;
  const queue = [...jobs];
  const startChrome = async () => {
    const launched = await launchChrome(chromeBinary);
    chromes.add(launched);
    const browser = await connect(launched.endpoint.href);
    return { ...launched, browser, announcement };
  };
  const stopChrome = async chrome => {
    chrome.browser.close();
    await chrome.close().catch(() => {});
    chromes.delete(chrome);
  };

  const worker = async () => {
    let chrome = await startChrome();
    while (queue.length) {
      const job = queue.shift();
      const started = Date.now();
      if (options.postersOnly && fs.existsSync(job.outputs.webm)) {
        await writePoster(sharp, job.outputs.webm, job.outputs.poster);
        done += 1;
        continue;
      }
      if (options.reencode && fs.existsSync(job.master)) {
        try {
          await encodeFinals(job, job.master, job.outputs, options.mp4Only);
          if (!options.mp4Only) await writePoster(sharp, job.outputs.webm, job.outputs.poster);
          done += 1;
          console.log(
            `[${done}/${jobs.length}] ${job.name} ${Math.round(fs.statSync(job.outputs.webm).size / 1024)} KB (re-encoded)`
          );
        } catch (error) {
          failures.push(`${job.name}: ${error.message}`);
          console.log(`[failed] ${job.name}: ${error.message}`);
        }
        continue;
      }
      const work = fs.mkdtempSync(path.join(os.tmpdir(), `react-bits-preview-${job.name}-`));
      const framesDir = path.join(work, 'frames');
      const seqDir = path.join(work, 'seq');
      fs.mkdirSync(framesDir);
      const log = [];
      let attempt = 0;
      while (attempt < 2) {
        attempt += 1;
        try {
          const { frames, track, box } = await record(chrome, site.url, job, framesDir, log);
          const first = path.join(framesDir, '00000.jpg');
          const meta = await sharp(first).metadata();
          const content =
            job.spec.frame === 'auto' ? await frameBox(sharp, framesDir, frames, job.mode, track, box) : null;
          const crop = cropFor(job.spec.frame, content);
          await sequence(sharp, framesDir, seqDir, job, frames);
          await encodeMaster(job, seqDir, crop, { width: meta.width, height: meta.height }, job.master);
          if (options.encode) {
            await encodeFinals(job, job.master, job.outputs);
            await writePoster(sharp, job.outputs.webm, job.outputs.poster);
          }
          done += 1;
          const size = options.encode ? `${Math.round(fs.statSync(job.outputs.webm).size / 1024)} KB` : 'master';
          const note = log.length ? ` (${log.length} page errors)` : '';
          console.log(
            `[${done}/${jobs.length}] ${job.name} ${size} zoom ${crop.zoom.toFixed(2)} ${((Date.now() - started) / 1000).toFixed(0)}s${note}`
          );
          if (log.length) fs.writeFileSync(`${job.master}.log`, log.join('\n'));
          break;
        } catch (error) {
          if (attempt >= 2) {
            failures.push(`${job.name}: ${error.message}`);
            console.log(`[failed] ${job.name}: ${error.message}`);
          }
          fs.rmSync(framesDir, { recursive: true, force: true });
          fs.rmSync(seqDir, { recursive: true, force: true });
          fs.mkdirSync(framesDir);
          await stopChrome(chrome);
          chrome = await startChrome();
        }
      }
      if (!options.keep) fs.rmSync(work, { recursive: true, force: true });
      else console.log(`  frames kept in ${work}`);
    }
    await stopChrome(chrome);
  };

  try {
    await Promise.all(Array.from({ length: Math.min(options.workers, jobs.length) }, worker));
  } finally {
    await shutdown();
    await site.close();
  }
  if (failures.length) {
    console.log(`\n${failures.length} failed:\n${failures.join('\n')}`);
    process.exitCode = 1;
  }
};

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
