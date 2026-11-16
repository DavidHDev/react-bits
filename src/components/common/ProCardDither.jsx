import { useEffect, useRef } from 'react';

const CELL = 2;
const FPS = 30;
const BAYER = (() => {
  const m = [0];
  for (let size = 1; size < 8; size *= 2) {
    const next = new Array(size * 2 * size * 2);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = m[y * size + x] * 4;
        next[y * size * 2 + x] = v;
        next[y * size * 2 + x + size] = v + 2;
        next[(y + size) * size * 2 + x] = v + 3;
        next[(y + size) * size * 2 + x + size] = v + 1;
      }
    }
    m.length = 0;
    m.push(...next);
  }
  return m.map(v => (v + 0.5) / 64);
})();
const INK = {
  dark: { base: [124, 72, 255], tip: [214, 190, 255] },
  light: { base: [112, 64, 220], tip: [190, 160, 250] }
};

const hash2 = (x, y) => {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const noise2 = (x, y) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};
const fbm = (x, y) => 0.55 * noise2(x, y) + 0.3 * noise2(x * 2.03 + 17.1, y * 2.03 - 9.2) + 0.15 * noise2(x * 4.1 - 5.3, y * 4.1 + 3.7);

const readTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

const ProCardDither = ({ className }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let theme = readTheme();
    let cols = 0;
    let rows = 0;
    let image = null;
    let visible = true;
    let raf = 0;
    let last = 0;
    let time = 0;

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      cols = Math.max(1, Math.ceil(box.width / CELL));
      rows = Math.max(1, Math.ceil(box.height / CELL));
      canvas.width = cols;
      canvas.height = rows;
      image = ctx.createImageData(cols, rows);
    };

    const draw = () => {
      if (!image) return;
      const data = image.data;
      const { base, tip } = INK[theme];
      const t = time * 0.4;
      const aspect = cols / rows;
      for (let y = 0; y < rows; y++) {
        const rise = 1 - y / rows;
        for (let x = 0; x < cols; x++) {
          const u = x / cols;
          const nx = u * aspect;
          const side = Math.abs(u - 0.5) * 2;
          const profile = 0.12 + 0.62 * Math.pow(side, 2.4);
          const sy = rise * 1.6 - t * 1.05;
          const qx = fbm(nx * 1.3 + t * 0.15, sy);
          const qy = fbm(nx * 1.3 + 5.2, sy + 1.3);
          const turb = fbm(nx * 2.4 + qx * 3.2 - t * 0.25, rise * 2.6 + qy * 3.2 - t * 1.7);
          const heat = profile + 0.12 - rise + (turb - 0.5) * 1.25 * (0.55 + rise);
          const k = Math.min(1, Math.max(0, heat / 0.42));
          const body = k * k * (3 - 2 * k);
          const grain = fbm(nx * 7.5 + qx * 2.5, rise * 7 - t * 2.6);
          const value = body * (0.32 + 0.55 * grain);
          const on = value > BAYER[(y & 7) * 8 + (x & 7)];
          const i = (y * cols + x) * 4;
          const mix = 1 - body;
          data[i] = base[0] + (tip[0] - base[0]) * mix;
          data[i + 1] = base[1] + (tip[1] - base[1]) * mix;
          data[i + 2] = base[2] + (tip[2] - base[2]) * mix;
          data[i + 3] = on ? 255 : 0;
        }
      }
      ctx.putImageData(image, 0, 0);
    };

    const tick = now => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - last >= 1000 / FPS) {
        time += Math.min(now - last, 100) / 1000;
        last = now;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (reduced || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    resize();
    draw();

    const sizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    sizeObserver.observe(canvas);

    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    viewObserver.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      theme = readTheme();
      draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    document.addEventListener('visibilitychange', wake);
    wake();

    return () => {
      cancelAnimationFrame(raf);
      sizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', wake);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};

export default ProCardDither;
