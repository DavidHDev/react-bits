'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Geometry, Triangle, RenderTarget } from 'ogl';

import './SwarmCursor.css';

const FIELD_VERT = `
precision highp float;
attribute vec2 position;
attribute vec2 aLocal;
attribute float aWeight;
uniform vec2 uRes;
varying vec2 vLocal;
varying float vWeight;

void main() {
  vLocal = aLocal;
  vWeight = aWeight;
  vec2 clip = (position / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const FIELD_FRAG = `
precision highp float;
varying vec2 vLocal;
varying float vWeight;

void main() {
  float d = length(vLocal);
  float a = exp(-d * d * 3.6) * vWeight;
  gl_FragColor = vec4(a, a, a, a);
}
`;

const SCREEN_VERT = `
precision highp float;
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const COMP_FRAG = `
precision highp float;
uniform sampler2D tField;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uMerge;
uniform float uGlow;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  float f = texture2D(tField, vUv).r;

  float edge = uMerge * 0.3;
  float core = smoothstep(uMerge - edge, uMerge + edge, f);
  float halo = smoothstep(uMerge * 0.12, uMerge, f);

  vec3 col = mix(uColor, uAccent, clamp(f / max(uMerge * 2.4, 0.001), 0.0, 1.0));

  float alpha = (core + halo * uGlow * (1.0 - core)) * uOpacity;
  if (alpha <= 0.002) discard;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

const hexToRgb = hex => {
  let h = (hex || '').replace('#', '').trim();
  if (h.length === 3)
    h = h
      .split('')
      .map(c => c + c)
      .join('');
  const n = parseInt(h || '000000', 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const buildPerm = () => {
  const src = new Uint8Array(256);
  for (let i = 0; i < 256; i++) src[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = src[i];
    src[i] = src[j];
    src[j] = t;
  }
  const perm = new Uint16Array(512);
  for (let i = 0; i < 512; i++) perm[i] = src[i & 255];
  return perm;
};

const smoothFade = t => t * t * t * (t * (t * 6 - 15) + 10);

const gradDot = (h, x, y, z) => {
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
};

const noise3 = (perm, x, y, z) => {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const fz = Math.floor(z);
  const X = fx & 255;
  const Y = fy & 255;
  const Z = fz & 255;
  const rx = x - fx;
  const ry = y - fy;
  const rz = z - fz;
  const u = smoothFade(rx);
  const v = smoothFade(ry);
  const w = smoothFade(rz);

  const A = perm[X] + Y;
  const AA = perm[A & 511] + Z;
  const AB = perm[(A + 1) & 511] + Z;
  const B = perm[(X + 1) & 511] + Y;
  const BA = perm[B & 511] + Z;
  const BB = perm[(B + 1) & 511] + Z;

  const g000 = gradDot(perm[AA & 511] & 15, rx, ry, rz);
  const g100 = gradDot(perm[BA & 511] & 15, rx - 1, ry, rz);
  const g010 = gradDot(perm[AB & 511] & 15, rx, ry - 1, rz);
  const g110 = gradDot(perm[BB & 511] & 15, rx - 1, ry - 1, rz);
  const g001 = gradDot(perm[(AA + 1) & 511] & 15, rx, ry, rz - 1);
  const g101 = gradDot(perm[(BA + 1) & 511] & 15, rx - 1, ry, rz - 1);
  const g011 = gradDot(perm[(AB + 1) & 511] & 15, rx, ry - 1, rz - 1);
  const g111 = gradDot(perm[(BB + 1) & 511] & 15, rx - 1, ry - 1, rz - 1);

  const x00 = g000 + u * (g100 - g000);
  const x10 = g010 + u * (g110 - g010);
  const x01 = g001 + u * (g101 - g001);
  const x11 = g011 + u * (g111 - g011);
  const y0 = x00 + v * (x10 - x00);
  const y1 = x01 + v * (x11 - x01);
  return y0 + w * (y1 - y0);
};

const SwarmCursor = ({
  color = '#ffffff',
  accentColor = '#ffffff',
  count = 10,
  size = 10,
  merge = 0.77,
  glow = 0.75,
  opacity = 1,
  spread = 100,
  separation = 0.15,
  speed = 2.5,
  wander = 0.25,
  trail = 0.75,
  scatterOnClick = true,
  enabled = true,
  children,
  className = '',
  style,
  ...rest
}) => {
  const containerRef = useRef(null);
  const propsRef = useRef({});
  propsRef.current = {
    color,
    accentColor,
    count,
    size,
    merge,
    glow,
    opacity,
    spread,
    separation,
    speed,
    wander,
    trail,
    scatterOnClick,
    enabled
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio || 1, 1.75) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.className = 'swarm-cursor__canvas';
    container.appendChild(gl.canvas);

    const MAX = 120;
    const MAX_QUADS = 6000;
    const HISTORY = 120;
    const positions = new Float32Array(MAX_QUADS * 4 * 2);
    const locals = new Float32Array(MAX_QUADS * 4 * 2);
    const weights = new Float32Array(MAX_QUADS * 4);
    const index = new Uint16Array(MAX_QUADS * 6);
    for (let i = 0; i < MAX_QUADS; i++) {
      const v = i * 4;
      locals.set([-1, -1, 1, -1, 1, 1, -1, 1], v * 2);
      index.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6);
    }

    const geometry = new Geometry(gl, {
      position: { size: 2, data: positions, usage: gl.DYNAMIC_DRAW },
      aLocal: { size: 2, data: locals },
      aWeight: { size: 1, data: weights, usage: gl.DYNAMIC_DRAW },
      index: { data: index }
    });

    const fieldProgram = new Program(gl, {
      vertex: FIELD_VERT,
      fragment: FIELD_FRAG,
      uniforms: { uRes: { value: [1, 1] } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false
    });
    fieldProgram.setBlendFunc(gl.ONE, gl.ONE);
    const fieldMesh = new Mesh(gl, { geometry, program: fieldProgram });

    const compProgram = new Program(gl, {
      vertex: SCREEN_VERT,
      fragment: COMP_FRAG,
      uniforms: {
        tField: { value: null },
        uColor: { value: hexToRgb(propsRef.current.color) },
        uAccent: { value: hexToRgb(propsRef.current.accentColor) },
        uMerge: { value: propsRef.current.merge },
        uGlow: { value: propsRef.current.glow },
        uOpacity: { value: propsRef.current.opacity }
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false
    });
    const compMesh = new Mesh(gl, { geometry: new Triangle(gl), program: compProgram });

    let target = null;
    let cssW = 1;
    let cssH = 1;

    const resize = () => {
      cssW = container.clientWidth || 1;
      cssH = container.clientHeight || 1;
      renderer.setSize(cssW, cssH);
      fieldProgram.uniforms.uRes.value = [cssW, cssH];
      const w = Math.max(1, Math.round(gl.drawingBufferWidth));
      const h = Math.max(1, Math.round(gl.drawingBufferHeight));
      target = new RenderTarget(gl, { width: w, height: h, depth: false });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const perm = buildPerm();
    const px = new Float32Array(MAX);
    const py = new Float32Array(MAX);
    const vx = new Float32Array(MAX);
    const vy = new Float32Array(MAX);
    const scale = new Float32Array(MAX);
    const agility = new Float32Array(MAX);
    const handed = new Float32Array(MAX);
    const noiseX = new Float32Array(MAX);
    const noiseY = new Float32Array(MAX);

    const histX = new Float32Array(HISTORY * MAX);
    const histY = new Float32Array(HISTORY * MAX);
    const histT = new Float32Array(HISTORY);
    let histHead = 0;
    let histLen = 0;
    let lastSample = -1;

    const spawn = (i, ox, oy) => {
      const a = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 120;
      px[i] = ox + Math.cos(a) * r;
      py[i] = oy + Math.sin(a) * r;
      vx[i] = Math.cos(a) * 60;
      vy[i] = Math.sin(a) * 60;
      for (let h = 0; h < HISTORY; h++) {
        histX[h * MAX + i] = px[i];
        histY[h * MAX + i] = py[i];
      }
    };

    for (let i = 0; i < MAX; i++) {
      spawn(i, cssW * 0.5, cssH * 0.5);
      scale[i] = 0.65 + Math.random() * 0.6;
      agility[i] = 0.75 + Math.random() * 0.5;
      handed[i] = Math.random() < 0.5 ? -1 : 1;
      noiseX[i] = Math.random() * 260;
      noiseY[i] = Math.random() * 260;
    }

    const cursor = { x: cssW * 0.5, y: cssH * 0.5, has: false };
    let burst = 0;
    let activeCount = Math.max(1, Math.min(MAX, Math.round(propsRef.current.count)));

    const onMove = e => {
      const r = container.getBoundingClientRect();
      cursor.x = e.clientX - r.left;
      cursor.y = e.clientY - r.top;
      cursor.has = true;
    };
    const onLeave = () => {
      cursor.has = false;
    };
    const onDown = e => {
      if (!propsRef.current.scatterOnClick || !propsRef.current.enabled) return;
      const r = container.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const escape = 620 + propsRef.current.speed * 130;
      for (let i = 0; i < MAX; i++) {
        let dx = px[i] - cx;
        let dy = py[i] - cy;
        let d = Math.hypot(dx, dy);
        if (d < 1e-3) {
          const a = Math.random() * Math.PI * 2;
          dx = Math.cos(a);
          dy = Math.sin(a);
          d = 1;
        }
        const kick = escape * (0.75 + Math.random() * 0.5);
        vx[i] = (dx / d) * kick;
        vy[i] = (dy / d) * kick;
      }
      burst = 1;
    };
    container.addEventListener('pointermove', onMove, { passive: true });
    container.addEventListener('pointerenter', onMove, { passive: true });
    container.addEventListener('pointerleave', onLeave);
    container.addEventListener('pointerdown', onDown);

    let raf = 0;
    let last = performance.now();

    const frame = now => {
      raf = requestAnimationFrame(frame);
      const p = propsRef.current;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!p.enabled || reduceMotion) {
        renderer.render({ scene: compMesh });
        return;
      }

      const n = Math.max(1, Math.min(MAX, Math.round(p.count)));
      const anchorX = cursor.has ? cursor.x : cssW * 0.5;
      const anchorY = cursor.has ? cursor.y : cssH * 0.5;

      for (let i = activeCount; i < n; i++) spawn(i, anchorX, anchorY);
      activeCount = n;

      const t = now * 0.001;
      burst = Math.max(0, burst - dt / 0.5);

      const maxSpeed = 110 + Math.max(0.1, p.speed) * 165;
      const steerRate = 4.5 + Math.max(0.1, p.speed) * 1.15;
      const maxForce = maxSpeed * 9;
      const band = Math.max(20, p.spread * 0.55);
      const sepDist = Math.max(1, p.spread * 0.42 * (0.35 + p.separation));
      const flowMix = p.wander * 2.4;
      const eps = 0.08;
      const baseScale = 0.0016;
      const fineScale = baseScale * 3.6;

      for (let i = 0; i < n; i++) {
        const dx = anchorX - px[i];
        const dy = anchorY - py[i];
        const dist = Math.hypot(dx, dy) || 1e-4;
        const ux = dx / dist;
        const uy = dy / dist;

        const orbitDrift = noise3(perm, noiseX[i], noiseY[i], t * 0.13);
        const orbit = band * (0.34 + 1.35 * Math.max(0, Math.min(1, orbitDrift + 0.5)));

        const radial = Math.max(-1, Math.min(1, (dist - orbit) / (band * 0.85)));
        const swirl = Math.sqrt(Math.max(0, 1 - radial * radial)) * handed[i];

        let wishX = ux * radial - uy * swirl;
        let wishY = uy * radial + ux * swirl;

        if (flowMix > 0.001) {
          const bx = px[i] * baseScale;
          const by = py[i] * baseScale;
          const bt = t * 0.22;
          const coarseX = (noise3(perm, bx, by + eps, bt) - noise3(perm, bx, by - eps, bt)) / (2 * eps);
          const coarseY = -(noise3(perm, bx + eps, by, bt) - noise3(perm, bx - eps, by, bt)) / (2 * eps);

          const fx = px[i] * fineScale + noiseX[i];
          const fy = py[i] * fineScale + noiseY[i];
          const ft = t * 0.55;
          const fineX = (noise3(perm, fx, fy + eps, ft) - noise3(perm, fx, fy - eps, ft)) / (2 * eps);
          const fineY = -(noise3(perm, fx + eps, fy, ft) - noise3(perm, fx - eps, fy, ft)) / (2 * eps);

          wishX += (coarseX + fineX * 0.7) * flowMix;
          wishY += (coarseY + fineY * 0.7) * flowMix;
        }

        const wl = Math.hypot(wishX, wishY) || 1e-4;
        wishX /= wl;
        wishY /= wl;

        const rate = steerRate * agility[i] * (1 - burst);
        let ax = (wishX * maxSpeed - vx[i]) * rate;
        let ay = (wishY * maxSpeed - vy[i]) * rate;

        if (burst > 0.001) {
          ax -= ux * maxSpeed * burst * 5.5;
          ay -= uy * maxSpeed * burst * 5.5;
        }

        for (let j = 0; j < n; j++) {
          if (j === i) continue;
          const sx = px[i] - px[j];
          const sy = py[i] - py[j];
          const d2 = sx * sx + sy * sy;
          if (d2 > 1e-4 && d2 < sepDist * sepDist) {
            const d = Math.sqrt(d2);
            const f = (1 - d / sepDist) * maxSpeed * 3.2 * p.separation;
            ax += (sx / d) * f;
            ay += (sy / d) * f;
          }
        }

        const al = Math.hypot(ax, ay);
        const cap = maxForce * (1 + burst * 4);
        if (al > cap) {
          ax = (ax / al) * cap;
          ay = (ay / al) * cap;
        }

        vx[i] += ax * dt;
        vy[i] += ay * dt;

        const sp = Math.hypot(vx[i], vy[i]);
        const hi = maxSpeed * (1 + burst * 3.5);
        const lo = maxSpeed * 0.32;
        if (sp > hi) {
          vx[i] = (vx[i] / sp) * hi;
          vy[i] = (vy[i] / sp) * hi;
        } else if (sp < lo && sp > 1e-4) {
          vx[i] = (vx[i] / sp) * lo;
          vy[i] = (vy[i] / sp) * lo;
        }

        px[i] += vx[i] * dt;
        py[i] += vy[i] * dt;
      }

      const nowSec = now * 0.001;
      if (lastSample < 0 || nowSec - lastSample >= 0.008) {
        lastSample = nowSec;
        histT[histHead] = nowSec;
        const base = histHead * MAX;
        for (let i = 0; i < n; i++) {
          histX[base + i] = px[i];
          histY[base + i] = py[i];
        }
        histHead = (histHead + 1) % HISTORY;
        if (histLen < HISTORY) histLen++;
      }

      const trailAge = p.trail * 0.85;
      const perAgent = Math.max(0, Math.floor(MAX_QUADS / n) - 1);
      const maxStamps = Math.min(46, perAgent);

      let quad = 0;
      const pushQuad = (cx, cy, r, w) => {
        const v = quad * 8;
        positions[v] = cx - r;
        positions[v + 1] = cy - r;
        positions[v + 2] = cx + r;
        positions[v + 3] = cy - r;
        positions[v + 4] = cx + r;
        positions[v + 5] = cy + r;
        positions[v + 6] = cx - r;
        positions[v + 7] = cy + r;
        const o = quad * 4;
        weights[o] = w;
        weights[o + 1] = w;
        weights[o + 2] = w;
        weights[o + 3] = w;
        quad++;
      };

      for (let i = 0; i < n; i++) {
        const headR = p.size * scale[i] * 2.1;
        const headW = 1.06 + 0.3 * scale[i];
        pushQuad(px[i], py[i], headR, headW);

        if (trailAge < 0.01 || maxStamps < 2 || histLen < 2) continue;

        const step = Math.max(2, p.size * scale[i] * 0.5);
        const span = step * maxStamps;

        let prevX = px[i];
        let prevY = py[i];
        let walked = 0;
        let nextAt = step;
        let stamps = 0;

        for (let j = 0; j < histLen && stamps < maxStamps; j++) {
          const slot = (histHead - 1 - j + HISTORY) % HISTORY;
          if (nowSec - histT[slot] > trailAge) break;
          const hx = histX[slot * MAX + i];
          const hy = histY[slot * MAX + i];
          const segX = hx - prevX;
          const segY = hy - prevY;
          const segLen = Math.hypot(segX, segY);
          if (segLen < 1e-4) continue;

          while (nextAt <= walked + segLen && stamps < maxStamps) {
            const f = (nextAt - walked) / segLen;
            const u = nextAt / span;
            const taper = Math.pow(Math.max(0, 1 - u), 0.55);
            const rLocal = headR * taper;
            if (rLocal < step) {
              stamps = maxStamps;
              break;
            }
            const stampW = Math.min(headW, (headW * step) / (rLocal * 0.934));
            pushQuad(prevX + segX * f, prevY + segY * f, rLocal, stampW);
            stamps++;
            nextAt += step;
          }

          walked += segLen;
          prevX = hx;
          prevY = hy;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aWeight.needsUpdate = true;
      geometry.setDrawRange(0, quad * 6);

      compProgram.uniforms.uColor.value = hexToRgb(p.color);
      compProgram.uniforms.uAccent.value = hexToRgb(p.accentColor);
      compProgram.uniforms.uMerge.value = p.merge;
      compProgram.uniforms.uGlow.value = p.glow;
      compProgram.uniforms.uOpacity.value = p.opacity;

      renderer.render({ scene: fieldMesh, target, clear: true });
      compProgram.uniforms.tField.value = target.texture;
      renderer.render({ scene: compMesh });
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerenter', onMove);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('pointerdown', onDown);
      if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    };
  }, []);

  return (
    <div ref={containerRef} className={`swarm-cursor ${className}`.trim()} style={style} {...rest}>
      {children ? <div className="swarm-cursor__content">{children}</div> : null}
    </div>
  );
};

export default SwarmCursor;
