export const RECORD_LIMIT = 60;

const MAX_WIDTH = 3840;
const MAX_HEIGHT = 2160;
const LEAD = 0.25;
const TAIL = 0.4;
const START_WAIT = 8000;
const RECORD_PIXELS = 4.5e6;
const STILL_EVERY = 400;
const FIRST_FRAME_WAIT = 5000;
const DENSITY = 2;
const PAGE_STEP = 0.6;
const PAGE_SCREENS = 16;
const PAGE_ROWS = 27000;
const SETTLE = [200, 120, 600];
const END_SETTLE = 600;
const BOX_MARGIN = 16;
const WAITING = [340, 200];
const HELPER = '/center-stage.js';
const HELPER_KEY = Symbol.for('center-stage-helper');
const HELPER_EVERY = 1500;
const HELPER_WAIT = 4000;
const END_PUSH = 0.6;
const END_WAIT = 900;
const SCROLL_SPEED = 900;
const SETTLE_EVERY = 400;
const RECORDER_TYPES = [
  'video/mp4;codecs=avc1',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4'
];

const SURFACES = {
  browser: { name: 'tab', label: 'Tab' },
  window: { name: 'window', label: 'Window' },
  monitor: { name: 'screen', label: 'Screen' }
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const bitrateFor = (width, height, fps) => Math.round(clamp(width * height * fps * 0.1, 4e6, 6e7));

const canTap = () => typeof window.MediaStreamTrackProcessor === 'function' && typeof window.VideoFrame === 'function';
const canEncode = () => canTap() && typeof VideoEncoder === 'function' && typeof Worker === 'function';
const clock = () => performance.timeOrigin + performance.now();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const wheelPixels = (event, view) => {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * view;
  return event.deltaY;
};

export const canCapture = () =>
  typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function';

export const canRecord = () => canEncode() || typeof MediaRecorder === 'function';

export const surfaceLabel = media => (SURFACES[media?.surface] || SURFACES.browser).label;

export const pageAddress = text => {
  const value = (text || '').trim();
  if (!value) return null;
  const local = /^(localhost|127\.|\[::1\]|0\.0\.0\.0|192\.168\.|10\.)/i.test(value);
  const address = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `${local ? 'http' : 'https'}://${value}`;
  try {
    const url = new URL(address);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

export const pageHost = url => {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const pageRoom = ([width, height]) => {
  const screen = window.screen || {};
  const room = [Math.max(320, (screen.availWidth || width) - 24), Math.max(320, (screen.availHeight || height) - 110)];
  const fit = Math.min(1, room[0] / width, room[1] / height);
  return [Math.round(width * fit), Math.round(height * fit)];
};

const paintWaiting = (page, host) => {
  const doc = page.document;
  const [background, color] =
    document.documentElement.dataset.theme === 'light' ? ['#ffffff', '#18181b'] : ['#0e0b13', '#ececf1'];
  doc.title = host;
  doc.documentElement.style.cssText = `height:100%;background:${background};color-scheme:light dark`;
  doc.body.style.cssText = `margin:0;height:100%;display:grid;place-content:center;gap:6px;text-align:center;font:500 13px/1.4 system-ui,sans-serif;color:${color}`;
  const name = doc.createElement('div');
  name.textContent = host;
  name.style.cssText = 'font-size:22px;font-weight:600;letter-spacing:-0.01em';
  const note = doc.createElement('div');
  note.textContent = 'Share this window in Center Stage';
  note.style.opacity = '0.6';
  doc.body.replaceChildren(name, note);
};

export function openPage(host) {
  const screen = window.screen || {};
  const [width, height] = WAITING;
  const left = Math.round((screen.availLeft || 0) + Math.max(0, (screen.availWidth || width) - width - 24));
  const top = Math.round((screen.availTop || 0) + Math.max(0, (screen.availHeight || height) - height - 96));
  const page = window.open('', '', `popup,width=${width},height=${height},left=${left},top=${top}`);
  if (!page) return null;
  try {
    page.opener = null;
    paintWaiting(page, host);
  } catch {
    return page;
  }
  return page;
}

const nextStop = (view, boxes, target) => {
  const reach = target + view;
  let next = target + view * PAGE_STEP;
  for (const [top, bottom] of boxes) {
    if (top >= reach || bottom <= reach || bottom - top > view * 1.5) continue;
    const latest = top - BOX_MARGIN;
    const fits = bottom - top <= view - BOX_MARGIN * 2;
    const earliest = fits ? bottom + BOX_MARGIN - view : -Infinity;
    if (latest > target && latest >= earliest && latest < next) next = latest;
  }
  return next;
};

async function showPage(page, url, size) {
  const [width, height] = pageRoom(size);
  try {
    const screen = window.screen || {};
    const chrome = [Math.max(0, page.outerWidth - page.innerWidth), Math.max(0, page.outerHeight - page.innerHeight)];
    const left = (screen.availLeft || 0) + Math.max(0, (screen.availWidth || width) - width - chrome[0] - 16);
    const top = (screen.availTop || 0) + Math.max(0, ((screen.availHeight || height) - height - chrome[1]) / 2);
    page.moveTo(Math.round(left), Math.round(top));
    page.resizeTo(width + chrome[0], height + chrome[1]);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await wait(attempt < 2 ? 120 : 160);
      if (page.closed) return null;
      const gap = [width - page.innerWidth, height - page.innerHeight];
      if (Math.abs(gap[0]) <= 1 && Math.abs(gap[1]) <= 1) {
        if (attempt >= 2) break;
      } else page.resizeBy(gap[0], gap[1]);
    }
    const measured = [page.innerWidth, page.innerHeight];
    page.location.replace(url);
    return measured;
  } catch {
    try {
      page.location.href = url;
    } catch {
      return null;
    }
  }
  return [width, height];
}

class PageHelper {
  constructor(live) {
    this.live = live;
    this.serial = 0;
    this.pending = new Map();
    this.target = '*';
    this.nonce = `center-stage-${Math.random().toString(36).slice(2)}`;
    this.connected = false;
    this.misses = 0;
    this.pinging = false;
    this.injected = new WeakSet();
    this.onMessage = event => {
      const data = event.data;
      if (!data || data.centerStageHelper !== 1 || event.source !== this.live.page) return;
      this.target = event.origin;
      const waiting = this.pending.get(data.id);
      if (!waiting) return;
      this.pending.delete(data.id);
      waiting(data);
    };
    window.addEventListener('message', this.onMessage);
    this.timer = setInterval(() => this.ping(), HELPER_EVERY);
    this.ping();
  }

  call(type, args = {}, timeout = HELPER_WAIT) {
    const page = this.live.page;
    if (!page || page.closed) return Promise.reject(new Error('The page window is closed.'));
    this.serial += 1;
    const id = this.serial;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('The page stopped answering.'));
      }, timeout);
      this.pending.set(id, data => {
        clearTimeout(timer);
        if (data.ok) resolve(data);
        else reject(new Error('The page could not do that.'));
      });
      try {
        page.postMessage({ centerStage: 1, id, type, ...args }, this.target);
      } catch (problem) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(problem);
      }
    });
  }

  inject() {
    const page = this.live.access();
    if (!page || page[HELPER_KEY] || this.injected.has(page.document)) return;
    this.injected.add(page.document);
    const script = page.document.createElement('script');
    script.src = new URL(HELPER, window.location.origin).href;
    script.async = true;
    (page.document.head || page.document.documentElement).append(script);
  }

  async ping() {
    if (this.pinging) return;
    this.pinging = true;
    try {
      this.inject();
      const reply = await this.call('hello', { nonce: this.nonce }, 1000);
      this.misses = 0;
      this.update(!reply.handle || (await this.matches()));
    } catch {
      this.misses += 1;
      if (this.misses >= 2) {
        this.target = '*';
        this.update(false);
      }
    } finally {
      this.pinging = false;
    }
  }

  async matches() {
    const track = this.live.track;
    if (typeof track.getCaptureHandle !== 'function') return true;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (track.getCaptureHandle()?.handle === this.nonce) return true;
      await wait(60);
    }
    return false;
  }

  update(connected) {
    if (this.connected === connected) return;
    this.connected = connected;
    this.live.listeners.helper.forEach(listener => listener(this.live));
  }

  dispose() {
    clearInterval(this.timer);
    window.removeEventListener('message', this.onMessage);
    this.pending.forEach(waiting => waiting({ ok: false }));
    this.pending.clear();
    this.connected = false;
  }
}

export const isQuietCancel = problem =>
  problem?.name === 'AbortError' || (problem?.name === 'NotAllowedError' && !/system/i.test(problem.message || ''));

export const captureProblem = problem => {
  if (problem?.name === 'NotAllowedError')
    return 'Your system blocked the capture. Allow screen recording for this browser in your system settings.';
  if (problem?.name === 'NotReadableError') return 'That tab or window could not be captured. Try another one.';
  return problem?.message || 'The capture could not start.';
};

const keepFocus = controller => {
  try {
    controller?.setFocusBehavior?.('no-focus-change');
    return true;
  } catch {
    return false;
  }
};

const copyToCanvas = (image, width, height, reuse = null) => {
  const canvas = reuse || document.createElement('canvas');
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  try {
    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
  } catch {
    return null;
  }
  return canvas;
};

function pageStitcher(onProgress, scale) {
  const worker = new Worker(new URL('./stitch.worker.js', import.meta.url), { type: 'module' });
  worker.postMessage({ type: 'scale', scale });
  let busy = false;
  let queued = null;
  let finishing = null;
  let settle = null;
  const send = ({ frame, hint }) => {
    busy = true;
    worker.postMessage({ type: 'frame', frame, ...hint }, [frame]);
  };
  const flush = () => {
    if (busy) return;
    if (queued) {
      const next = queued;
      queued = null;
      send(next);
    } else if (finishing) worker.postMessage({ type: 'finish' });
  };
  worker.onmessage = ({ data }) => {
    if (data.type === 'progress') {
      busy = false;
      onProgress?.(data);
      flush();
    } else if (data.type === 'done' || data.type === 'error') settle?.(data);
  };
  worker.onerror = event => {
    event.preventDefault?.();
    settle?.({ type: 'error', message: event.message });
  };
  return {
    push(frame, hint = {}) {
      if (finishing) return;
      queued?.frame.close();
      queued = { frame: frame.clone(), hint };
      flush();
    },
    finish() {
      if (finishing) return finishing;
      finishing = new Promise(resolve => {
        settle = resolve;
      }).then(data => {
        worker.terminate();
        if (data.type === 'error') throw new Error(data.message || 'The page could not be stitched.');
        if (data.type !== 'done' || !data.bitmap) return null;
        return { bitmap: data.bitmap, screens: data.screens };
      });
      flush();
      return finishing;
    },
    cancel() {
      queued?.frame.close();
      queued = null;
      worker.terminate();
      settle?.({ type: 'cancelled' });
    }
  };
}

class LiveCapture {
  constructor(stream, track, options = {}) {
    const settings = track.getSettings();
    this.kind = 'live';
    this.surface = SURFACES[settings.displaySurface] ? settings.displaySurface : 'browser';
    this.name = `Live ${SURFACES[this.surface].name}`;
    this.stream = stream;
    this.track = track;
    this.width = settings.width || 0;
    this.height = settings.height || 0;
    this.frameRate = clamp(Math.round(settings.frameRate || 30), 24, 60);
    this.density = options.density || null;
    this.controller = options.controller || null;
    this.page = options.page || null;
    this.host = options.host || null;
    this.target = null;
    this.helper = null;
    this.opening = null;
    this.verified = false;
    this.stitcher = null;
    this.auto = null;
    this.wheel = 0;
    this.forwarding = null;
    this.forwarded = null;
    this.cssWidth = 0;
    this.version = 0;
    this.ended = false;
    this.released = false;
    this.latest = null;
    this.still = null;
    this.stillAt = 0;
    this.recorder = null;
    this.pinned = false;
    this.pinning = false;
    this.frameHandle = 0;
    this.frameTimer = 0;
    this.listeners = { end: new Set(), resize: new Set(), helper: new Set() };
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.srcObject = stream;
    this.onTrackEnded = () => this.finish();
    track.addEventListener('ended', this.onTrackEnded);
    this.tap = canTap() ? this.openTap() : null;
    this.ready = this.start();
  }

  async start() {
    let settle = null;
    const first = new Promise(resolve => {
      settle = resolve;
    });
    this.firstFrame = settle;
    const video = this.video;
    const onData = () => {
      this.resize(video.videoWidth, video.videoHeight);
      this.keepStill(true);
      settle();
    };
    video.addEventListener('loadeddata', onData, { once: true });
    await video.play().catch(() => {});
    if (video.readyState >= 2 && video.videoWidth) onData();
    let timer = 0;
    const late = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`The ${SURFACES[this.surface].name} did not send a picture.`)),
        FIRST_FRAME_WAIT
      );
    });
    try {
      await Promise.race([first, late]);
    } finally {
      clearTimeout(timer);
      video.removeEventListener('loadeddata', onData);
      this.firstFrame = null;
    }
    if (this.tap) video.pause();
    else this.watchVideo();
    return this;
  }

  openTap() {
    const clone = this.track.clone();
    const reader = new window.MediaStreamTrackProcessor({ track: clone, maxBufferSize: 2 }).readable.getReader();
    const tap = { clone, reader, closed: false };
    const pump = async () => {
      for (;;) {
        let result = null;
        try {
          result = await reader.read();
        } catch {
          return;
        }
        if (result.done || !result.value) return;
        if (tap.closed || this.released) {
          result.value.close();
          return;
        }
        this.accept(result.value);
      }
    };
    pump();
    return tap;
  }

  watchVideo() {
    const video = this.video;
    if (typeof video.requestVideoFrameCallback !== 'function') {
      this.frameTimer = setInterval(() => {
        this.version += 1;
        this.keepStill(false);
      }, 1000 / this.frameRate);
      return;
    }
    const onFrame = (_, meta) => {
      if (this.released) return;
      this.version += 1;
      this.resize(meta?.width || video.videoWidth, meta?.height || video.videoHeight);
      this.keepStill(false);
      this.frameHandle = video.requestVideoFrameCallback(onFrame);
    };
    this.frameHandle = video.requestVideoFrameCallback(onFrame);
  }

  accept(frame) {
    this.latest?.close();
    this.latest = frame;
    this.version += 1;
    this.resize(frame.displayWidth, frame.displayHeight);
    if (!this.pinned) this.sharpen();
    if (this.stitcher && !this.auto) this.stitcher.push(frame, this.forwarded ? { wheel: this.wheel } : {});
    this.arrived?.();
    this.firstFrame?.();
  }

  keepStill(force) {
    if (this.ended || this.latest) return;
    const now = performance.now();
    if (!force && now - this.stillAt < STILL_EVERY) return;
    const video = this.video;
    if (video.readyState < 2 || !video.videoWidth) return;
    const canvas = copyToCanvas(video, video.videoWidth, video.videoHeight, this.still);
    if (!canvas) return;
    this.still = canvas;
    this.stillAt = now;
  }

  async sharpen() {
    if (this.pinned || this.pinning || this.released) return;
    const { screenPixelRatio: scale } = this.track.getSettings();
    if (!scale || !this.width || !this.height) return;
    this.pinning = true;
    await this.fit([this.width / scale, this.height / scale]);
    this.pinned = true;
    this.pinning = false;
  }

  async fit([width, height]) {
    this.cssWidth = width;
    const density = this.density || Math.max(DENSITY, window.devicePixelRatio || 1);
    const fit = Math.min(density, MAX_WIDTH / width, MAX_HEIGHT / height);
    const constraints = {
      width: { max: Math.round(width * fit) },
      height: { max: Math.round(height * fit) },
      frameRate: { ideal: 60, max: 60 }
    };
    const tracks = [this.track, this.tap?.clone].filter(Boolean);
    await Promise.all(tracks.map(item => item.applyConstraints(constraints).catch(() => {})));
  }

  resize(width, height) {
    if (!width || !height || (width === this.width && height === this.height)) return;
    this.width = width;
    this.height = height;
    this.listeners.resize.forEach(listener => listener(this));
  }

  frame() {
    const latest = this.latest;
    if (latest) return { image: latest, width: latest.displayWidth, height: latest.displayHeight };
    const video = this.video;
    if (!this.ended && !this.released && video.readyState >= 2 && video.videoWidth)
      return { image: video, width: video.videoWidth, height: video.videoHeight };
    if (this.still) return { image: this.still, width: this.still.width, height: this.still.height };
    return null;
  }

  snapshot() {
    const frame = this.frame();
    if (!frame) return null;
    const canvas = frame.image === this.still ? this.still : copyToCanvas(frame.image, frame.width, frame.height);
    if (!canvas) return null;
    return {
      kind: 'image',
      element: canvas,
      width: canvas.width,
      height: canvas.height,
      name: `${SURFACES[this.surface].label} capture`,
      role: this.role
    };
  }

  scale() {
    const width = this.latest?.displayWidth || this.width;
    const page = this.access();
    if (page?.innerWidth) return width / page.innerWidth;
    return this.cssWidth ? width / this.cssWidth : DENSITY;
  }

  windowOf() {
    const page = this.page;
    if (!page || page.closed) return null;
    try {
      return page.document ? page : null;
    } catch {
      return null;
    }
  }

  access() {
    const page = this.windowOf();
    return page && page.location.href !== 'about:blank' ? page : null;
  }

  async verify() {
    const page = this.windowOf();
    if (!page || typeof this.track.getCaptureHandle !== 'function') return false;
    const handle = `center-stage-${Math.random().toString(36).slice(2)}`;
    try {
      page.navigator.mediaDevices.setCaptureHandleConfig({ handle, permittedOrigins: [window.location.origin] });
    } catch {
      return false;
    }
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (this.track.getCaptureHandle()?.handle === handle) {
        this.verified = true;
        return true;
      }
      await wait(50);
    }
    return false;
  }

  canDrive() {
    return !this.ended && Boolean(this.helper?.connected);
  }

  open(url, size) {
    const opening = this.load(url, size)
      .catch(() => {})
      .then(() => {
        if (this.opening === opening) this.opening = null;
      });
    this.opening = opening;
    return opening;
  }

  async load(url, size) {
    const page = this.windowOf();
    if (!page || !url) return;
    this.target = url;
    const fitted = await showPage(page, url, size);
    if (!fitted || this.released) return;
    await this.fit(fitted);
    if (!this.released) this.helper = new PageHelper(this);
  }

  dropPage() {
    const page = this.page;
    this.helper?.dispose();
    this.helper = null;
    this.page = null;
    this.host = null;
    if (page && !page.closed) page.close();
  }

  showWindow() {
    const page = this.page;
    if (!page || page.closed) return false;
    try {
      page.focus();
      return true;
    } catch {
      return false;
    }
  }

  forward(element) {
    if (this.forwarding) return this.forwarding;
    const controller = this.controller;
    if (!element || this.surface !== 'browser' || typeof controller?.forwardWheel !== 'function')
      return Promise.resolve(false);
    this.forwarding = controller.forwardWheel(element).then(
      () => {
        if (this.released) return false;
        const onWheel = event => {
          this.wheel += wheelPixels(event, this.height / this.scale());
          this.wheelAt = performance.now();
        };
        element.addEventListener('wheel', onWheel, { capture: true, passive: true });
        this.forwarded = { element, onWheel };
        return true;
      },
      () => {
        this.forwarding = null;
        return false;
      }
    );
    return this.forwarding;
  }

  unforward() {
    const forwarded = this.forwarded;
    if (forwarded) forwarded.element.removeEventListener('wheel', forwarded.onWheel, { capture: true });
    this.forwarded = null;
    if (this.forwarding) {
      const stopping = this.controller?.forwardWheel?.(null);
      stopping?.catch?.(() => {});
    }
    this.forwarding = null;
  }

  startPage({ onProgress, onEnd } = {}) {
    if (this.stitcher || this.ended || this.released) return false;
    const track = { moved: 0, at: performance.now(), wheel: this.wheel, last: null };
    const progress = data => {
      onProgress?.(data.screens);
      if (this.auto || typeof data.position !== 'number') return;
      const now = performance.now();
      if (track.last === null || Math.abs(data.position - track.last) > 0.004) {
        if (track.last !== null) track.moved += Math.abs(data.position - track.last);
        track.last = data.position;
        track.at = now;
        track.wheel = this.wheel;
        return;
      }
      const pushed = ((this.wheel - track.wheel) * this.scale()) / Math.max(1, this.height);
      if (this.forwarded && track.moved > 0.5 && pushed > END_PUSH && now - track.at > END_WAIT) onEnd?.();
    };
    this.stitcher = pageStitcher(progress, this.scale());
    if (this.canDrive()) {
      this.auto = this.drivePage(this.stitcher, onEnd);
      return true;
    }
    if (this.latest) this.stitcher.push(this.latest, this.forwarded ? { wheel: this.wheel } : {});
    const stitcher = this.stitcher;
    this.settleTimer = setInterval(() => {
      if (this.stitcher !== stitcher || !this.latest) return;
      stitcher.push(this.latest, { ...(this.forwarded ? { wheel: this.wheel } : {}), settle: true });
    }, SETTLE_EVERY);
    return true;
  }

  async settleFrames(extra = 0) {
    await wait(SETTLE[0] + extra);
    const deadline = performance.now() + SETTLE[2];
    let last = performance.now();
    this.arrived = () => {
      last = performance.now();
    };
    while (performance.now() < deadline && performance.now() - last < SETTLE[1]) await wait(30);
    this.arrived = null;
  }

  async drivePage(stitcher, onEnd) {
    const helper = this.helper;
    if (!helper) return;
    try {
      await helper.call('prepare');
      let stop = 0;
      for (let index = 0; ; index += 1) {
        if (this.stitcher !== stitcher || this.released) return;
        const before = await helper.call('measure');
        const view = before.view[1];
        const limit = Math.min(view * PAGE_SCREENS, PAGE_ROWS / this.scale());
        const end = Math.max(0, Math.min(before.height, limit) - view);
        const target = Math.min(stop, end);
        const last = target >= end;
        await helper.call('scroll', { y: target, top: index > 0, bottom: !last });
        await this.settleFrames(last ? END_SETTLE : 0);
        if (this.stitcher !== stitcher || this.released || !this.latest) return;
        const placed = await helper.call('measure');
        stitcher.push(this.latest, {
          offset: placed.scroll,
          top: placed.top,
          bottom: placed.bottom,
          total: Math.min(placed.height, limit)
        });
        if (last) break;
        stop = nextStop(view, placed.boxes || [], placed.scroll);
      }
    } catch {
      if (this.stitcher !== stitcher || this.released) return;
    } finally {
      helper.call('restore', { y: 0 }).catch(() => {});
    }
    if (this.stitcher === stitcher) onEnd?.();
  }

  scrollPage() {
    const helper = this.canDrive() ? this.helper : null;
    if (!helper) return null;
    let stopped = false;
    const done = helper.call('glide', { speed: SCROLL_SPEED, hold: 600 }, 40000).then(
      reply =>
        reply.done && !stopped
          ? { start: reply.start - performance.timeOrigin, end: reply.end - performance.timeOrigin }
          : null,
      () => null
    );
    return {
      done,
      stop() {
        if (stopped) return;
        stopped = true;
        helper.call('stop').catch(() => {});
      }
    };
  }

  async finishPage() {
    const stitcher = this.stitcher;
    if (!stitcher) return null;
    clearInterval(this.settleTimer);
    if (!this.auto && this.latest)
      stitcher.push(this.latest, { ...(this.forwarded ? { wheel: this.wheel } : {}), settle: true, last: true });
    this.unforward();
    this.auto = null;
    const page = await stitcher.finish();
    this.stitcher = null;
    if (!page) return null;
    return {
      kind: 'image',
      element: page.bitmap,
      width: page.bitmap.width,
      height: page.bitmap.height,
      name: 'Full page',
      screens: page.screens,
      role: this.role
    };
  }

  cancelPage() {
    clearInterval(this.settleTimer);
    this.unforward();
    this.stitcher?.cancel();
    this.stitcher = null;
    this.auto = null;
  }

  async record(options = {}) {
    if (this.recorder) return this.recorder;
    if (this.ended || this.released) throw new Error('The capture has ended.');
    const recorder = this.tap && canEncode() ? await workerRecorder(this, options) : streamRecorder(this, options);
    if (this.released) {
      recorder.cancel();
      throw new Error('The capture has ended.');
    }
    this.recorder = recorder;
    recorder.done.finally(() => {
      if (this.recorder === recorder) this.recorder = null;
    });
    return recorder;
  }

  onEnd(listener) {
    this.listeners.end.add(listener);
    return () => this.listeners.end.delete(listener);
  }

  onResize(listener) {
    this.listeners.resize.add(listener);
    return () => this.listeners.resize.delete(listener);
  }

  onHelper(listener) {
    this.listeners.helper.add(listener);
    return () => this.listeners.helper.delete(listener);
  }

  finish() {
    if (this.ended || this.released) return;
    this.ended = true;
    this.listeners.end.forEach(listener => listener(this));
  }

  stop() {
    this.track.stop();
    this.finish();
  }

  release() {
    if (this.released) return;
    this.released = true;
    this.ended = true;
    this.recorder?.cancel();
    this.recorder = null;
    if (this.stitcher) this.cancelPage();
    this.unforward();
    this.track.removeEventListener('ended', this.onTrackEnded);
    if (this.tap) {
      this.tap.closed = true;
      this.tap.reader.cancel().catch(() => {});
      this.tap.clone.stop();
    }
    if (this.frameHandle && typeof this.video.cancelVideoFrameCallback === 'function')
      this.video.cancelVideoFrameCallback(this.frameHandle);
    clearInterval(this.frameTimer);
    this.stream.getTracks().forEach(item => item.stop());
    this.video.pause();
    this.video.srcObject = null;
    this.latest?.close();
    this.latest = null;
    this.helper?.dispose();
    this.helper = null;
    this.listeners.end.clear();
    this.listeners.resize.clear();
    this.listeners.helper.clear();
    if (this.page && !this.page.closed) this.page.close();
    this.page = null;
  }
}

const settleWithin = (promise, ms, message) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      problem => {
        clearTimeout(timer);
        reject(problem);
      }
    );
  });

async function workerRecorder(live, { limit = RECORD_LIMIT, onLimit, onFail } = {}) {
  const clone = live.track.clone();
  const scale = Math.min(0.99, Math.sqrt(RECORD_PIXELS / Math.max(1, live.width * live.height)));
  const size = [Math.floor(live.width * scale), Math.floor(live.height * scale)];
  await clone
    .applyConstraints({ width: { max: size[0] }, height: { max: size[1] }, frameRate: { ideal: 60, max: 60 } })
    .catch(() => {});
  const readable = new window.MediaStreamTrackProcessor({ track: clone, maxBufferSize: 8 }).readable;
  const worker = new Worker(new URL('./recorder.worker.js', import.meta.url), { type: 'module' });
  let ready = null;
  let finish = null;
  let failed = null;
  let stopping = null;
  const started = new Promise((resolve, reject) => {
    ready = { resolve, reject };
  });
  const finished = new Promise(resolve => {
    finish = resolve;
  });
  const fail = message => {
    failed = new Error(message || 'The recording failed.');
    ready.reject(failed);
    finish(null);
    if (!stopping) onFail?.(failed);
  };
  worker.onmessage = ({ data }) => {
    if (data.type === 'started') ready.resolve();
    else if (data.type === 'error') fail(data.message);
    else if (data.type === 'done') finish(data);
    else if (data.type === 'cancelled') finish(null);
  };
  worker.onerror = event => {
    event.preventDefault?.();
    fail(event.message);
  };
  worker.postMessage({ type: 'start', readable, fps: live.frameRate, size }, [readable]);
  const shutdown = () => {
    worker.terminate();
    clone.stop();
  };
  try {
    await settleWithin(started, START_WAIT, 'The recording could not start.');
  } catch (problem) {
    shutdown();
    throw problem;
  }
  const timer = setTimeout(() => onLimit?.(), limit * 1000);
  let resolveDone = null;
  const done = new Promise(resolve => {
    resolveDone = resolve;
  });
  return {
    started: performance.now(),
    done,
    stop() {
      if (stopping) return stopping;
      clearTimeout(timer);
      worker.postMessage({ type: 'stop', at: clock() });
      stopping = finished.then(data => {
        shutdown();
        if (failed) throw failed;
        if (!data || data.frames < 2) return null;
        const file = new File([data.buffer], `${surfaceLabel(live)} recording.mp4`, { type: 'video/mp4' });
        const start = data.first === null ? 0 : clamp(data.first - LEAD, 0, data.duration);
        const end = data.last === null ? data.duration : clamp(data.last + TAIL, start, data.duration);
        return { file, start, end: end - start < 0.5 ? data.duration : end, origin: data.origin };
      });
      resolveDone(stopping.catch(() => null));
      return stopping;
    },
    cancel() {
      if (stopping) return;
      stopping = Promise.resolve(null);
      clearTimeout(timer);
      worker.postMessage({ type: 'cancel' });
      shutdown();
      resolveDone(null);
    }
  };
}

function streamRecorder(live, { limit = RECORD_LIMIT, onLimit } = {}) {
  if (typeof MediaRecorder !== 'function') throw new Error('This browser cannot record video.');
  const type = RECORDER_TYPES.find(item => MediaRecorder.isTypeSupported(item));
  if (!type) throw new Error('This browser cannot record video.');
  const clone = live.track.clone();
  const media = new MediaRecorder(new MediaStream([clone]), {
    mimeType: type,
    videoBitsPerSecond: bitrateFor(live.width, live.height, live.frameRate)
  });
  const chunks = [];
  const stopped = new Promise(resolve => {
    media.onstop = resolve;
  });
  media.ondataavailable = event => {
    if (event.data?.size) chunks.push(event.data);
  };
  media.start(1000);
  const started = performance.now();
  const timer = setTimeout(() => onLimit?.(), limit * 1000);
  let finishing = null;
  let cancelled = false;
  let resolveDone = null;
  const done = new Promise(resolve => {
    resolveDone = value => resolve(Promise.resolve(value).catch(() => null));
  });
  const recorder = {
    started,
    done,
    stop() {
      if (finishing) return finishing;
      clearTimeout(timer);
      if (media.state !== 'inactive') media.stop();
      finishing = stopped.then(() => {
        clone.stop();
        if (cancelled) return null;
        const blob = new Blob(chunks, { type: media.mimeType || type });
        if (!blob.size) return null;
        const extension = blob.type.startsWith('video/mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `${surfaceLabel(live)} recording.${extension}`, {
          type: blob.type.split(';')[0]
        });
        return { file, start: 0, end: null };
      });
      resolveDone(finishing);
      return finishing;
    },
    cancel() {
      if (cancelled) return;
      cancelled = true;
      clearTimeout(timer);
      media.ondataavailable = null;
      if (media.state !== 'inactive') media.stop();
      clone.stop();
      resolveDone(null);
    }
  };
  return recorder;
}

export async function openCapture(options = {}) {
  const controller = typeof window.CaptureController === 'function' ? new window.CaptureController() : null;
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser',
        width: { max: MAX_WIDTH },
        height: { max: MAX_HEIGHT },
        frameRate: { ideal: 60, max: 60 }
      },
      audio: false,
      selfBrowserSurface: 'exclude',
      surfaceSwitching: 'include',
      ...(controller ? { controller } : {})
    });
  } catch (problem) {
    if (options.page && !options.page.closed) options.page.close();
    throw problem;
  }
  keepFocus(controller);
  const track = stream.getVideoTracks()[0];
  if (!track) {
    stream.getTracks().forEach(item => item.stop());
    throw new Error('That capture has no picture.');
  }
  const live = new LiveCapture(stream, track, { ...options, controller });
  try {
    await live.ready;
    await live.sharpen();
    if (options.page) {
      if (await live.verify()) live.open(options.url, options.size);
      else live.dropPage();
    }
  } catch (problem) {
    live.release();
    throw problem;
  }
  return live;
}
