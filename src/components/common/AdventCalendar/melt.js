const NS = 'http://www.w3.org/2000/svg';

let defs = null;

const ensureDefs = () => {
  if (defs && defs.isConnected) return defs;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  defs = document.createElementNS(NS, 'defs');
  svg.appendChild(defs);
  document.body.appendChild(svg);
  return defs;
};

const gradientUri = (w, h) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  )}`;

const easeIn = t => t * t * (1.6 - 0.6 * t);

const matrixOf = threshold => `0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -34 0 0 0 ${(34 * threshold).toFixed(3)}`;

export const meltDoor = (door, leaf, { seed = 1, duration = 1500, frost = '#eef3ff', onDone } = {}) => {
  const rect = leaf.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const id = `adv-melt-${seed}-${Math.round(performance.now())}`;
  const filter = document.createElementNS(NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '1');
  filter.setAttribute('height', '1');
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  filter.innerHTML = `
    <feTurbulence type="fractalNoise" baseFrequency="0.04 0.022" numOctaves="3" seed="${seed}" result="noiseRaw"/>
    <feColorMatrix in="noiseRaw" type="matrix" values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1" result="noise"/>
    <feImage href="${gradientUri(w, h)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="grad"/>
    <feComposite in="noise" in2="grad" operator="arithmetic" k1="0" k2="0.45" k3="0.6" k4="-0.03" result="field"/>
    <feColorMatrix in="field" type="matrix" values="${matrixOf(1.2)}" result="keepRaw"/>
    <feComposite in="keepRaw" in2="SourceAlpha" operator="in" result="keep"/>
    <feColorMatrix in="field" type="matrix" values="${matrixOf(1.14)}" result="coreRaw"/>
    <feComposite in="keep" in2="coreRaw" operator="out" result="edge"/>
    <feComposite in="SourceGraphic" in2="keep" operator="in" result="door"/>
    <feFlood flood-color="${frost}" flood-opacity="0.9" result="ice"/>
    <feComposite in="ice" in2="edge" operator="in" result="glow"/>
    <feMerge><feMergeNode in="door"/><feMergeNode in="glow"/></feMerge>`;
  ensureDefs().appendChild(filter);
  const [, keepMatrix, coreMatrix] = filter.querySelectorAll('feColorMatrix');
  const matrix = matrixOf;

  const canvas = document.createElement('canvas');
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    borderRadius: getComputedStyle(leaf).borderRadius,
    pointerEvents: 'none',
    zIndex: '4'
  });
  door.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const flakes = [];

  leaf.style.filter = `url(#${id})`;
  let raf = 0;
  let last = performance.now();
  const start = last;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    leaf.style.filter = '';
    leaf.style.visibility = '';
    filter.remove();
    canvas.remove();
    onDone?.();
  };

  const frame = now => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const p = Math.min(1, (now - start) / duration);
    const threshold = 1.1 - 1.2 * easeIn(p);
    keepMatrix.setAttribute('values', matrix(threshold));
    coreMatrix.setAttribute('values', matrix(threshold - 0.035));

    if (p < 0.92) {
      const front = Math.min(1, Math.max(0, 1 - (threshold - 0.2) / 0.6));
      const count = Math.random() < 0.55 ? 1 : 0;
      for (let i = 0; i < count; i++) {
        flakes.push({
          x: Math.random() * w,
          y: front * h + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 14,
          vy: 8 + Math.random() * 20,
          r: 0.7 + Math.random() * Math.random() * 1.8,
          life: 0,
          span: 0.9 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i];
      f.life += dt;
      if (f.life > f.span) {
        flakes.splice(i, 1);
        continue;
      }
      f.vy = Math.min(46, f.vy + 34 * dt);
      f.x += (f.vx + Math.sin(f.life * 5 + f.phase) * 10) * dt;
      f.y += f.vy * dt;
      const a = Math.min(1, f.life * 6) * (1 - f.life / f.span) * Math.min(1, Math.max(0, (h - f.y) / 12));
      ctx.globalAlpha = a * 0.95;
      ctx.fillStyle = frost;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (p < 1 || flakes.length) raf = requestAnimationFrame(frame);
    else finish();
    if (p >= 1) leaf.style.visibility = 'hidden';
  };

  raf = requestAnimationFrame(frame);
  return finish;
};
