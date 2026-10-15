export const pageScript = config => `(() => {
  if (window !== window.top) return;
  const config = ${JSON.stringify(config)};
  try {
    localStorage.setItem('react-bits-theme', config.theme);
    if (config.announcementKey) localStorage.setItem(config.announcementKey, 'true');
  } catch {}

  const nativeNow = performance.now.bind(performance);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  const nativeRaf = window.requestAnimationFrame.bind(window);
  const NativeDate = Date;
  const wallStart = NativeDate.now();
  const channel = new MessageChannel();
  const yields = [];
  channel.port1.onmessage = () => {
    const resolve = yields.shift();
    if (resolve) resolve();
  };
  const macrotask = () =>
    new Promise(resolve => {
      yields.push(resolve);
      channel.port2.postMessage(0);
    });

  let mode = 'boot';
  let now = 0;
  let seq = 0;
  let rafs = [];
  const timers = new Map();
  const errors = [];
  const report = error => {
    if (errors.length < 20) errors.push(String((error && (error.stack || error.message)) || error).slice(0, 400));
  };
  const invoke = (fn, args) => {
    try {
      if (typeof fn === 'function') fn(...args);
      else new Function(String(fn))();
    } catch (error) {
      report(error);
    }
  };

  performance.now = () => now;
  class VirtualDate extends NativeDate {
    constructor(...args) {
      if (args.length) super(...args);
      else super(wallStart + now);
    }
    static now() {
      return wallStart + now;
    }
  }
  window.Date = VirtualDate;
  try {
    Object.defineProperty(Event.prototype, 'timeStamp', { configurable: true, get: () => now });
  } catch {}

  window.requestAnimationFrame = callback => {
    seq += 1;
    rafs.push([seq, callback]);
    return seq;
  };
  window.cancelAnimationFrame = id => {
    rafs = rafs.filter(entry => entry[0] !== id);
  };

  const schedule = (fn, ms, args, repeat) => {
    seq += 1;
    const id = seq;
    const delay = Math.max(repeat ? 1 : 0, Number(ms) || 0);
    if (mode !== 'boot') {
      timers.set(id, { id, at: now + delay, fn, args, every: repeat ? delay : 0, native: null });
      return id;
    }
    const entry = { id, at: nativeNow() + delay, fn, args, every: repeat ? delay : 0, native: null };
    const fire = () => {
      if (!timers.has(id)) return;
      if (entry.every) entry.at = nativeNow() + entry.every;
      else timers.delete(id);
      invoke(fn, args);
    };
    entry.native = repeat ? nativeSetInterval(fire, delay) : nativeSetTimeout(fire, delay);
    timers.set(id, entry);
    return id;
  };
  const cancel = id => {
    const entry = timers.get(id);
    if (!entry) return;
    if (entry.native !== null) {
      nativeClearTimeout(entry.native);
      nativeClearInterval(entry.native);
    }
    timers.delete(id);
  };
  window.setTimeout = (fn, ms, ...args) => schedule(fn, ms, args, false);
  window.setInterval = (fn, ms, ...args) => schedule(fn, ms, args, true);
  window.clearTimeout = cancel;
  window.clearInterval = cancel;

  const tracked = new WeakMap();
  let firstSync = true;
  const holdNew = () => {
    let list = [];
    try {
      list = document.getAnimations();
    } catch {
      return;
    }
    for (const animation of list) {
      if (tracked.has(animation) || (animation.timeline && animation.timeline !== document.timeline)) continue;
      const rate = animation.playbackRate || 1;
      const timing = animation.effect && animation.effect.getComputedTiming ? animation.effect.getComputedTiming() : null;
      const end = timing ? timing.endTime : Infinity;
      tracked.set(animation, { start: null, base: rate < 0 && Number.isFinite(end) ? end : 0 });
      try {
        animation.pause();
        animation.currentTime = rate < 0 && Number.isFinite(end) ? end : 0;
      } catch {}
    }
  };
  const holdLoop = () => {
    if (mode === 'virtual') return;
    holdNew();
    nativeRaf(holdLoop);
  };
  nativeRaf(holdLoop);
  const watch = new MutationObserver(() => {
    if (mode === 'boot' && document.querySelector('.demo-container')) {
      mode = 'hold';
      watch.disconnect();
    }
  });
  watch.observe(document, { childList: true, subtree: true });
  const syncAnimations = () => {
    let list = [];
    try {
      list = document.getAnimations();
    } catch {
      return;
    }
    for (const animation of list) {
      if (animation.timeline && animation.timeline !== document.timeline) continue;
      let state = tracked.get(animation);
      const rate = animation.playbackRate || 1;
      const timing = animation.effect && animation.effect.getComputedTiming ? animation.effect.getComputedTiming() : null;
      const end = timing ? timing.endTime : Infinity;
      if (state && state.start === null) state.start = now;
      if (!state) {
        const current = Number(animation.currentTime) || 0;
        const base = rate < 0 ? (firstSync || !Number.isFinite(current) ? end : current) : 0;
        state = { start: now, base };
        tracked.set(animation, state);
        try {
          animation.pause();
        } catch {}
      }
      const local = state.base + (now - state.start) * rate;
      if (rate > 0 && Number.isFinite(end) && local >= end) {
        try {
          animation.finish();
        } catch {
          try {
            animation.currentTime = end;
          } catch {}
        }
        continue;
      }
      if (rate < 0 && local <= 0) {
        try {
          animation.finish();
        } catch {
          try {
            animation.currentTime = 0;
          } catch {}
        }
        continue;
      }
      try {
        animation.currentTime = local;
      } catch {}
    }
    firstSync = false;
  };

  const media = new WeakMap();
  const seeks = [];
  const syncMedia = () => {
    for (const element of document.querySelectorAll('video, audio')) {
      let state = media.get(element);
      if (!state) {
        state = { start: now, base: Number(element.currentTime) || 0 };
        media.set(element, state);
      }
      try {
        if (!element.paused) element.pause();
        const duration = element.duration;
        if (!Number.isFinite(duration) || duration <= 0) continue;
        const target = (state.base + (now - state.start) / 1000) % duration;
        if (Math.abs(element.currentTime - target) > 0.001) {
          seeks.push(
            new Promise(resolve => {
              const done = () => resolve();
              element.addEventListener('seeked', done, { once: true });
              nativeSetTimeout(done, 250);
            })
          );
          element.currentTime = target;
        }
      } catch {}
    }
  };

  const flush = async () => {
    await macrotask();
    await macrotask();
  };

  const CURSOR_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 24 34">' +
    '<path d="M2.2 2.1v24.6l6.1-5.9 4.1 9.6 4.4-1.9-4.1-9.4h8.6z" fill="#0a0a0c" stroke="#ffffff" stroke-width="1.9" stroke-linejoin="round"/></svg>';
  let cursor = null;
  const ensureCursor = () => {
    if (cursor || !document.documentElement) return cursor;
    cursor = document.createElement('div');
    cursor.setAttribute('data-preview-cursor', '');
    cursor.style.cssText =
      'position:fixed;left:0;top:0;width:24px;height:34px;pointer-events:none;z-index:2147483647;display:none;transform-origin:2px 2px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.28));';
    cursor.innerHTML = CURSOR_SVG;
    document.documentElement.appendChild(cursor);
    return cursor;
  };

  const style = document.createElement('style');
  style.textContent = config.css || '';
  const mountStyle = () => {
    if (!document.head) return false;
    document.head.appendChild(style);
    return true;
  };
  if (!mountStyle()) document.addEventListener('DOMContentLoaded', mountStyle, { once: true });

  const HINTS = /^(move your cursor|move around|move and click|try dragging|scroll down in this box)$/i;
  const hideHints = box => {
    for (const element of box.querySelectorAll('p, span, div')) {
      if (element.children.length || !HINTS.test((element.textContent || '').trim())) continue;
      element.style.setProperty('visibility', 'hidden', 'important');
    }
  };

  let sized = false;
  const sizeContainer = () => {
    const box = document.querySelector('.demo-container');
    if (!box || sized) return box;
    const rect = box.getBoundingClientRect();
    if (rect.height < 40) return box;
    const width = Math.round(rect.height * config.aspect);
    box.style.setProperty('width', width + 'px', 'important');
    box.style.setProperty('min-width', width + 'px', 'important');
    box.style.setProperty('max-width', 'none', 'important');
    box.style.setProperty('flex', 'none', 'important');
    sized = true;
    return box;
  };

  window.__vt = {
    errors,
    now: () => now,
    mode: () => mode,
    container: () => {
      const box = sizeContainer();
      if (!box) return null;
      box.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = box.getBoundingClientRect();
      return { x: rect.left, y: rect.top, width: rect.width, height: rect.height, sx: window.scrollX, sy: window.scrollY };
    },
    lockScroll: () => {
      const x = window.scrollX;
      const y = window.scrollY;
      const restore = () => {
        if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y);
      };
      window.addEventListener('scroll', restore, { passive: true });
      window.__vt.restoreScroll = restore;
    },
    restoreScroll: () => {},
    measure: () => {
      window.__vt.restoreScroll();
      const box = document.querySelector('.demo-container');
      const rect = box.getBoundingClientRect();
      return { x: rect.left, y: rect.top, width: rect.width, height: rect.height, sx: window.scrollX, sy: window.scrollY };
    },
    ready: () => {
      const box = sizeContainer();
      if (!box || !sized) return false;
      hideHints(box);
      if (document.fonts && document.fonts.status !== 'loaded') return false;
      for (const image of box.querySelectorAll('img')) {
        if (!image.complete && image.loading !== 'lazy') return false;
      }
      return true;
    },
    resources: () => performance.getEntriesByType('resource').length,
    begin: () => {
      if (mode === 'virtual') return;
      const box = document.querySelector('.demo-container');
      if (box) hideHints(box);
      window.dispatchEvent(new Event('resize'));
      window.addEventListener(
        'click',
        event => {
          const link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
          if (link) event.preventDefault();
        },
        true
      );
      const at = nativeNow();
      for (const entry of timers.values()) {
        if (entry.native !== null) {
          nativeClearTimeout(entry.native);
          nativeClearInterval(entry.native);
        }
        entry.native = null;
        entry.at = now + Math.max(0, entry.at - at);
      }
      mode = 'virtual';
    },
    step: async (ms, present = true) => {
      const target = now + ms;
      for (let guard = 0; guard < 5000; guard += 1) {
        let next = null;
        for (const entry of timers.values()) {
          if (entry.at <= target && (!next || entry.at < next.at || (entry.at === next.at && entry.id < next.id))) next = entry;
        }
        if (!next) break;
        now = Math.max(now, next.at);
        if (next.every) next.at += next.every;
        else timers.delete(next.id);
        invoke(next.fn, next.args);
        await macrotask();
      }
      now = target;
      syncAnimations();
      syncMedia();
      const queue = rafs;
      rafs = [];
      for (const [, callback] of queue) invoke(callback, [now]);
      await flush();
      syncAnimations();
      if (seeks.length) await Promise.all(seeks.splice(0));
      if (present) await new Promise(resolve => nativeRaf(() => resolve()));
      return now;
    },
    rect: selector => {
      const box = document.querySelector('.demo-container');
      if (!box) return null;
      const target = selector ? box.querySelector(selector) || document.querySelector(selector) : box;
      if (!target) return null;
      const outer = box.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      return {
        x: (rect.left + rect.width / 2 - outer.left) / outer.width,
        y: (rect.top + rect.height / 2 - outer.top) / outer.height,
        width: rect.width / outer.width,
        height: rect.height / outer.height
      };
    },
    scroller: selector => {
      if (selector === 'window') return document.scrollingElement;
      const box = document.querySelector('.demo-container');
      if (!box) return null;
      const target = selector ? box.querySelector(selector) || document.querySelector(selector) : null;
      if (target) return target;
      return [box, ...box.querySelectorAll('*')].find(element => {
        const overflow = getComputedStyle(element).overflowY;
        return (overflow === 'auto' || overflow === 'scroll') && element.scrollHeight > element.clientHeight + 4;
      });
    },
    scrollTop: selector => {
      const target = window.__vt.scroller(selector);
      return target ? target.scrollTop : 0;
    },
    scroll: (selector, fraction, from, to) => {
      const target = window.__vt.scroller(selector);
      if (!target) return false;
      const end = to === 'bottom' ? target.scrollHeight - target.clientHeight : Number(to);
      target.scrollTop = from + (end - from) * fraction;
      return true;
    },
    click: selector => {
      const element = document.querySelector(selector);
      if (!element) return false;
      element.click();
      return true;
    },
    cursor: (x, y, pressed, show) => {
      const element = ensureCursor();
      if (!element) return;
      let visible = show !== 'none';
      if (visible && show !== 'show') {
        const under = document.elementFromPoint(x, y);
        if (under && getComputedStyle(under).cursor === 'none') visible = false;
      }
      element.style.display = visible ? 'block' : 'none';
      element.style.transform = 'translate(' + (x - 2) + 'px,' + (y - 2) + 'px) scale(' + (pressed ? 0.86 : 1) + ')';
    },
    hideCursor: () => {
      if (cursor) cursor.style.display = 'none';
    }
  };
})();`;
