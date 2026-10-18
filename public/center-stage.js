(() => {
  const key = Symbol.for('center-stage-helper');
  if (window[key]) return;
  window[key] = 1;
  const version = 1;
  const allow = (document.currentScript?.dataset.allow || '').split(/[\s,]+/).filter(Boolean);
  const trusted = origin => {
    if (allow.includes(origin)) return true;
    try {
      const { protocol, hostname } = new URL(origin);
      if (hostname === 'reactbits.dev' || hostname === 'www.reactbits.dev') return protocol === 'https:';
      return ['localhost', '127.0.0.1', '[::1]'].includes(hostname) || hostname.endsWith('.localhost');
    } catch {
      return false;
    }
  };
  const root = document.documentElement;
  const hidden = new Map();
  let bar = null;
  let glide = null;
  let watch = 0;
  const clamp = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max);
  const scroller = () => document.scrollingElement || root;
  const painted = () =>
    new Promise(resolve => {
      const done = () => resolve();
      requestAnimationFrame(() => requestAnimationFrame(done));
      setTimeout(done, 150);
    });
  const show = edge =>
    hidden.forEach(([value, priority, side], element) => {
      if (edge && side !== edge) return;
      hidden.delete(element);
      if (value) element.style.setProperty('visibility', value, priority);
      else element.style.removeProperty('visibility');
    });
  const hide = (elements, side) =>
    elements.forEach(element => {
      if (hidden.has(element)) return;
      const style = element.style;
      hidden.set(element, [style.getPropertyValue('visibility'), style.getPropertyPriority('visibility'), side]);
      style.setProperty('visibility', 'hidden', 'important');
    });
  const restore = () => {
    show();
    if (bar !== null) {
      if (bar) root.style.setProperty('scrollbar-width', bar);
      else root.style.removeProperty('scrollbar-width');
      bar = null;
    }
  };
  const touch = () => {
    clearTimeout(watch);
    watch = setTimeout(restore, 20000);
  };
  const fixed = () => {
    const [width, height] = [innerWidth, innerHeight];
    const found = { top: 0, bottom: 0, tops: [], bottoms: [] };
    const seen = new Set();
    const measure = start => {
      for (let node = start; node && node !== document.body && node !== root; node = node.parentElement) {
        if (seen.has(node)) return;
        seen.add(node);
        const style = getComputedStyle(node);
        if (style.position !== 'fixed' && style.position !== 'sticky') continue;
        const rect = node.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1 || rect.height > height * 0.5 || rect.bottom <= 0 || rect.top >= height)
          return;
        if (style.visibility === 'hidden' || Number(style.opacity) === 0) return;
        if (style.position === 'sticky') {
          const top = parseFloat(style.top);
          const bottom = parseFloat(style.bottom);
          const stuck =
            (Number.isFinite(top) && Math.abs(rect.top - top) < 1.5) ||
            (Number.isFinite(bottom) && Math.abs(height - rect.bottom - bottom) < 1.5);
          if (!stuck) continue;
        }
        if (rect.top < height * 0.35 && rect.bottom <= height * 0.5) {
          found.top = Math.max(found.top, rect.bottom);
          found.tops.push(node);
        } else if (rect.top >= height * 0.5) {
          found.bottom = Math.max(found.bottom, height - rect.top);
          found.bottoms.push(node);
        }
        return;
      }
    };
    for (const y of [2, 0.04, 0.1, 0.18, 0.82, 0.9, 0.96].map(at => (at > 1 ? at : height * at)).concat(height - 2))
      for (const x of [0.03, 0.2, 0.4, 0.6, 0.8, 0.97]) document.elementsFromPoint(width * x, y).forEach(measure);
    return found;
  };
  const boxes = () => {
    const list = [];
    const add = element => {
      const rect = element?.getBoundingClientRect?.();
      if (!rect || rect.width < 48 || rect.height < 24) return;
      let top = rect.top;
      let bottom = rect.bottom;
      for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.overflowX === 'visible' && style.overflowY === 'visible' && style.clipPath === 'none') continue;
        const clip = node.getBoundingClientRect();
        top = Math.max(top, clip.top);
        bottom = Math.min(bottom, clip.bottom);
      }
      if (bottom - top >= 24) list.push([Math.round(top + scrollY), Math.round(bottom + scrollY)]);
    };
    document.querySelectorAll('canvas, video, iframe').forEach(add);
    document.getAnimations?.().forEach(animation => animation.playState === 'running' && add(animation.effect?.target));
    return list.slice(0, 200);
  };
  const commands = {
    hello(data, origin) {
      let handle = false;
      try {
        navigator.mediaDevices.setCaptureHandleConfig({
          handle: String(data.nonce).slice(0, 64),
          permittedOrigins: [origin]
        });
        handle = true;
      } catch {
        handle = false;
      }
      return { version, handle };
    },
    measure() {
      const { top, bottom } = fixed();
      return {
        view: [innerWidth, innerHeight],
        scroll: scrollY,
        height: scroller().scrollHeight,
        top,
        bottom,
        boxes: boxes()
      };
    },
    prepare() {
      if (bar === null) bar = root.style.getPropertyValue('scrollbar-width');
      root.style.setProperty('scrollbar-width', 'none');
      return {};
    },
    async scroll(data) {
      scrollTo({ top: clamp(data.y, 0, scroller().scrollHeight), behavior: 'instant' });
      const found = fixed();
      if (data.top) hide(found.tops, 'top');
      if (data.bottom) hide(found.bottoms, 'bottom');
      else show('bottom');
      await painted();
      return { scroll: scrollY };
    },
    glide(data) {
      glide?.stop();
      const distance = Math.max(0, scroller().scrollHeight - innerHeight);
      if (distance < 2) return { done: false };
      const duration = clamp(distance / clamp(data.speed, 100, 5000), 2, 24) * 1000;
      scrollTo({ top: 0, behavior: 'instant' });
      return new Promise(resolve => {
        let frame = 0;
        let timer = 0;
        const job = {
          stop() {
            clearTimeout(timer);
            cancelAnimationFrame(frame);
            if (glide === job) glide = null;
            resolve({ done: false });
          }
        };
        glide = job;
        timer = setTimeout(
          () => {
            const begin = performance.now();
            const tick = now => {
              touch();
              const progress = clamp((now - begin) / duration, 0, 1);
              const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
              scrollTo({ top: distance * eased, behavior: 'instant' });
              if (progress < 1) frame = requestAnimationFrame(tick);
              else {
                if (glide === job) glide = null;
                resolve({ done: true, start: performance.timeOrigin + begin, end: performance.timeOrigin + now });
              }
            };
            frame = requestAnimationFrame(tick);
          },
          clamp(data.hold, 0, 3000)
        );
      });
    },
    stop() {
      glide?.stop();
      return {};
    },
    restore(data) {
      glide?.stop();
      restore();
      if (data.y !== undefined) scrollTo({ top: clamp(data.y, 0, scroller().scrollHeight), behavior: 'instant' });
      return {};
    }
  };
  addEventListener('message', event => {
    const data = event.data;
    if (!data || data.centerStage !== version || !event.source || !trusted(event.origin)) return;
    const run = Object.hasOwn(commands, data.type) ? commands[data.type] : null;
    if (!run) return;
    touch();
    Promise.resolve()
      .then(() => run(data, event.origin))
      .then(
        result => ({ ok: true, ...result }),
        () => ({ ok: false })
      )
      .then(result => event.source.postMessage({ centerStageHelper: version, id: data.id, ...result }, event.origin));
  });
})();
