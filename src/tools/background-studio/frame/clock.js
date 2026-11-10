const query = new URLSearchParams(window.location.search);
const manual = query.get('clock') === 'manual';
const seed = Number(query.get('seed'));
const pixelRatio = Number(query.get('dpr'));

const START = 10;
const SETTLE_LIMIT = 4000;
const PARALLEL = 'khr_parallel_shader_compile';

const nativeRaf = window.requestAnimationFrame.bind(window);
const nativeCaf = window.cancelAnimationFrame.bind(window);
const nativeNow = performance.now.bind(performance);
const nativeDateNow = Date.now.bind(Date);
const nativeSetTimeout = window.setTimeout.bind(window);
const nativeClearTimeout = window.clearTimeout.bind(window);
const nativeSetInterval = window.setInterval.bind(window);
const nativeClearInterval = window.clearInterval.bind(window);

const dateOffset = nativeDateNow() - (manual ? START : nativeNow());

let paused = false;
let offset = 0;
let frozenAt = 0;
let virtual = manual ? START : nativeNow();
let pending = 0;
let frameId = 0;
let callbacks = new Map();
let programs = [];
let building = 0;
let loading = 0;
let waiting = 0;
const hooks = new Map();
const parallel = new WeakMap();
const listeners = new Set();
const timers = new Map();
let timerId = 1 << 24;
const managed = new WeakSet();
const images = new WeakSet();

const now = () => {
  if (manual) return virtual;
  return paused ? frozenAt : nativeNow() - offset;
};

const report = error => {
  if (typeof window.reportError === 'function') window.reportError(error);
  else
    nativeSetTimeout(() => {
      throw error;
    });
};

const run = timestamp => {
  const batch = callbacks;
  callbacks = new Map();
  batch.forEach(callback => {
    try {
      callback(timestamp);
    } catch (error) {
      report(error);
    }
  });
  const after = [...hooks.values()];
  hooks.clear();
  after.forEach(hook => hook(timestamp));
};

const linked = ({ gl, program }) => {
  if (gl.isContextLost()) return true;
  const extension = parallel.get(gl);
  return !extension || gl.getProgramParameter(program, extension.COMPLETION_STATUS_KHR) !== false;
};

const fetching = () =>
  document.fonts?.status === 'loading' || Array.prototype.some.call(document.images, image => !image.complete);

const compiling = () => {
  if (programs.length) programs = programs.filter(entry => !linked(entry));
  return programs.length > 0 || building > 0 || loading > 0 || (manual && fetching());
};

const finish = () => {
  const list = programs;
  programs = [];
  list.forEach(({ gl, program }) => {
    if (!gl.isContextLost()) gl.getProgramParameter(program, gl.LINK_STATUS);
  });
};

const pump = () => {
  pending = 0;
  if (manual || paused) return;
  if (programs.length) compiling();
  run(now());
};

const refreshWhenBuilt = () => {
  if (waiting) return;
  const until = nativeNow() + SETTLE_LIMIT;
  const check = () => {
    waiting = 0;
    if (manual || !paused) return;
    if (compiling() && nativeNow() < until) {
      waiting = nativeRaf(check);
      return;
    }
    frozenAt += 1;
    run(frozenAt);
  };
  waiting = nativeRaf(check);
};

const schedule = () => {
  if (!pending && !manual && !paused) pending = nativeRaf(pump);
};

const animations = () => (typeof document.getAnimations === 'function' ? document.getAnimations() : []);

const syncAnimations = elapsed => {
  animations().forEach(animation => {
    if (!managed.has(animation)) {
      managed.add(animation);
      animation.pause();
    }
    animation.currentTime = (Number(animation.currentTime) || 0) + elapsed;
  });
};

const emit = () => listeners.forEach(listener => listener());

window.requestAnimationFrame = callback => {
  frameId += 1;
  callbacks.set(frameId, callback);
  schedule();
  return frameId;
};

window.cancelAnimationFrame = id => {
  callbacks.delete(id);
};

performance.now = now;
Date.now = () => Math.round(dateOffset + now());

[window.WebGLRenderingContext, window.WebGL2RenderingContext].forEach(type => {
  const proto = type?.prototype;
  if (!proto) return;
  const { getExtension, getSupportedExtensions, linkProgram, deleteProgram } = proto;
  proto.getExtension = function (name) {
    const asked = String(name).toLowerCase() === PARALLEL;
    if (asked && manual) return null;
    const extension = getExtension.call(this, name);
    if (asked && extension) parallel.set(this, extension);
    return extension;
  };
  if (manual) {
    proto.getSupportedExtensions = function () {
      const names = getSupportedExtensions.call(this);
      return names ? names.filter(name => name.toLowerCase() !== PARALLEL) : names;
    };
  }
  proto.linkProgram = function (program) {
    linkProgram.call(this, program);
    if (program && (manual || parallel.has(this))) programs.push({ gl: this, program });
  };
  proto.deleteProgram = function (program) {
    if (programs.length) programs = programs.filter(entry => entry.program !== program);
    deleteProgram.call(this, program);
  };
});

const built = () => {
  building -= 1;
};

const watchImage = image => {
  if (images.has(image)) return;
  images.add(image);
  loading += 1;
  const done = () => {
    image.removeEventListener('load', done);
    image.removeEventListener('error', done);
    nativeSetTimeout(() => {
      images.delete(image);
      loading -= 1;
    });
  };
  image.addEventListener('load', done);
  image.addEventListener('error', done);
};

const source = manual && window.HTMLImageElement && Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
if (source?.set) {
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    ...source,
    set(value) {
      source.set.call(this, value);
      watchImage(this);
    }
  });
}

const paint = () =>
  new Promise(resolve => {
    const timer = nativeSetTimeout(resolve, 1000);
    nativeRaf(() => {
      nativeClearTimeout(timer);
      resolve();
    });
  });

const quiet = until =>
  new Promise(resolve => {
    let calm = 0;
    const check = () => {
      calm = compiling() ? 0 : calm + 1;
      if (calm > 2 || nativeNow() > until) resolve();
      else nativeSetTimeout(check, 4);
    };
    check();
  });

[
  [window.GPU, ['requestAdapter']],
  [window.GPUAdapter, ['requestDevice']],
  [window.GPUDevice, ['createRenderPipelineAsync', 'createComputePipelineAsync']]
].forEach(([type, names]) => {
  const proto = type?.prototype;
  if (!proto) return;
  names.forEach(name => {
    const native = proto[name];
    if (typeof native !== 'function') return;
    proto[name] = function (...args) {
      const result = native.apply(this, args);
      if (result && typeof result.then === 'function') {
        building += 1;
        result.then(built, built);
      }
      return result;
    };
  });
});

if (manual) {
  window.setTimeout = (handler, delay, ...args) => {
    if (typeof handler !== 'function' || !(delay > 0)) return nativeSetTimeout(handler, delay, ...args);
    timerId += 1;
    timers.set(timerId, { handler, args, due: virtual + delay, every: 0 });
    return timerId;
  };
  window.setInterval = (handler, delay, ...args) => {
    if (typeof handler !== 'function') return nativeSetInterval(handler, delay, ...args);
    const every = Math.max(Number(delay) || 0, 1);
    timerId += 1;
    timers.set(timerId, { handler, args, due: virtual + every, every });
    return timerId;
  };
  window.clearTimeout = id => {
    if (timers.has(id)) timers.delete(id);
    else nativeClearTimeout(id);
  };
  window.clearInterval = id => {
    if (timers.has(id)) timers.delete(id);
    else nativeClearInterval(id);
  };
}

if (Number.isFinite(seed) && query.has('seed')) {
  const generator = from => {
    let state = from >>> 0 || 1;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return (t ^ (t >>> 14)) >>> 0;
    };
  };
  const random = generator(seed);
  const entropy = generator(seed ^ 0x9e3779b9);
  Math.random = () => random() / 4294967296;
  const nativeValues = window.crypto?.getRandomValues?.bind(window.crypto);
  if (nativeValues) {
    Object.defineProperty(window.crypto, 'getRandomValues', {
      configurable: true,
      value: array => {
        if (!ArrayBuffer.isView(array)) return nativeValues(array);
        const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        for (let index = 0; index < bytes.length; index += 1) bytes[index] = entropy() >>> 24;
        return array;
      }
    });
  }
}

if (pixelRatio > 0) {
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => pixelRatio });
}

const nextTimer = limit => {
  let found = null;
  timers.forEach((timer, id) => {
    if (timer.due <= limit && (!found || timer.due < found.timer.due)) found = { id, timer };
  });
  return found;
};

const fireTimers = limit => {
  for (let guard = 0; guard < 1000; guard++) {
    const next = nextTimer(limit);
    if (!next) return;
    const { id, timer } = next;
    virtual = Math.max(virtual, timer.due);
    if (timer.every) timer.due += timer.every;
    else timers.delete(id);
    try {
      timer.handler(...timer.args);
    } catch (error) {
      report(error);
    }
  }
};

export const clock = {
  manual,
  now,
  get paused() {
    return paused;
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  pause() {
    if (manual || paused) return;
    frozenAt = now();
    paused = true;
    if (pending) nativeCaf(pending);
    pending = 0;
    animations().forEach(animation => animation.pause());
    emit();
    if (compiling()) refreshWhenBuilt();
  },
  resume() {
    if (manual || !paused) return;
    offset = nativeNow() - frozenAt;
    paused = false;
    animations().forEach(animation => {
      if (animation.playState === 'paused') animation.play();
    });
    schedule();
    emit();
  },
  refresh() {
    if (manual || !paused || waiting) return;
    if (compiling()) {
      refreshWhenBuilt();
      return;
    }
    frozenAt += 1;
    run(frozenAt);
  },
  async settle() {
    if (manual) finish();
    const until = nativeNow() + SETTLE_LIMIT;
    while (compiling() && nativeNow() < until) {
      await quiet(until);
      if (!manual) return;
      await paint();
      await paint();
    }
  },
  step(ms) {
    if (!manual) return;
    finish();
    const target = virtual + ms;
    fireTimers(target);
    virtual = target;
    syncAnimations(ms);
    run(virtual);
  },
  afterFrame(hook, key = hook) {
    hooks.set(key, hook);
    schedule();
    return () => {
      if (hooks.get(key) === hook) hooks.delete(key);
    };
  },
  wait(ms) {
    return new Promise(resolve => nativeSetTimeout(resolve, ms));
  }
};
