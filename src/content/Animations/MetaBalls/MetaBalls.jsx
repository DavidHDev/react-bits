'use client';

import { useEffect, useRef } from 'react';

import './MetaBalls.css';

const MAX_BALLS = 50;
const SLOTS = MAX_BALLS + 1;
const VARIANTS = { solid: 0, outline: 1, contour: 2 };
const VISIBLE = 0.877;

const fract = x => x - Math.floor(x);

const hash31 = p => {
  const r = [p * 0.1031, p * 0.103, p * 0.0973].map(fract);
  const dot = r[0] * (r[1] + 33.33) + r[1] * (r[2] + 33.33) + r[2] * (r[0] + 33.33);
  return r.map(value => fract(value + dot));
};

const hash33 = v => {
  const p = [v[0] * 0.1031, v[1] * 0.103, v[2] * 0.0973].map(fract);
  const dot = p[0] * (p[1] + 33.33) + p[1] * (p[0] + 33.33) + p[2] * (p[2] + 33.33);
  const q = p.map(value => fract(value + dot));
  return [fract((q[0] + q[1]) * q[2]), fract((q[0] + q[0]) * q[1]), fract((q[1] + q[0]) * q[0])];
};

const toRgb = color => {
  let hex = String(color || '')
    .trim()
    .replace('#', '');
  if (hex.length === 3) hex = hex.replace(/./g, c => c + c);
  if (!/^[0-9a-f]{6}/i.test(hex)) return [1, 1, 1];
  return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOut = t => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const VERTEX = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uScale;
uniform vec4 uBalls[${SLOTS}];
uniform vec4 uShapes[${SLOTS}];
uniform int uCount;
uniform float uGamma;
uniform float uThreshold;
uniform vec3 uColor;
uniform vec3 uCursorColor;
uniform int uVariant;
uniform float uLine;
uniform float uSpacing;
uniform float uRings;
uniform float uOpaque;

out vec4 outColor;

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) * uScale;
  float field = 0.0;
  float tint = 0.0;
  float mass = 0.0;
  vec2 grad = vec2(0.0);
  bool classic = abs(uGamma - 1.0) < 0.001;
  for (int i = 0; i < ${SLOTS}; i++) {
    if (i >= uCount) break;
    vec4 ball = uBalls[i];
    vec4 shape = uShapes[i];
    vec2 d = p - ball.xy;
    vec2 q = vec2(shape.x * d.x + shape.y * d.y, shape.y * d.x + shape.z * d.y);
    float qq = max(dot(q, q), ball.z * 1e-4 + 1e-12);
    float v = ball.z / qq;
    float w = classic ? v : pow(v, uGamma);
    field += w;
    float weight = w / (1.0 + w / uThreshold);
    mass += weight;
    tint += weight * ball.w;
    grad -= 2.0 * uGamma * w / qq * vec2(shape.x * q.x + shape.y * q.y, shape.y * q.x + shape.z * q.y);
  }
  float slope = max(length(grad) * uScale, 1e-8);
  vec3 color = mix(uColor, uCursorColor, mass > 0.0 ? clamp(tint / mass, 0.0, 1.0) : 0.0);
  float alpha;
  if (uVariant == 0) {
    alpha = field > 3.0 * uThreshold ? 1.0 : clamp((field - uThreshold) / slope + 0.5, 0.0, 1.0);
  } else if (uVariant == 1) {
    alpha = field > 3.0 * uThreshold ? 0.0 : clamp(0.5 * uLine + 0.5 - abs((field - uThreshold) / slope), 0.0, 1.0);
  } else {
    float rho = pow(max(field / uThreshold, 1e-6), -0.5 / uGamma);
    float rate = rho * slope / (2.0 * uGamma * max(field, 1e-8));
    float u = (rho - 1.0) / uSpacing;
    float ring = floor(u + 0.5);
    float gap = (u - ring) * uSpacing / max(rate, 1e-8);
    alpha = clamp(0.5 * uLine + 0.5 - abs(gap), 0.0, 1.0);
    alpha *= ring < -0.5 || ring > uRings + 0.5 ? 0.0 : 1.0 - ring / (uRings + 1.0);
    if (ring > 0.5) alpha *= smoothstep(uLine * 6.0, uLine * 12.0, uSpacing / max(rate, 1e-8));
  }
  outColor = vec4(color * alpha, uOpaque > 0.5 ? 1.0 : alpha);
}
`;

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const createBall = index => {
  const h1 = hash31(index + 1);
  const h2 = hash33(h1);
  return {
    start: h1[0] * Math.PI * 2,
    rate: 0.1 * Math.PI + h1[1] * 0.3 * Math.PI,
    reach: 5 + h1[1] * 5,
    toggle: Math.floor(h2[0] * 2),
    radius: 0.5 + h2[2] * 1.5,
    lane: h2[1] * 2 - 1,
    rise: 0.55 + h1[2] * 0.7,
    sway: h2[0] * Math.PI * 2,
    delay: 0.1 + fract(h1[2] * 7.31 + h2[1] * 3.17) * 0.55,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    fx: 0,
    fy: 0,
    ax: 0,
    ay: 0,
    avx: 0,
    avy: 0,
    a: 0,
    b: 0,
    va: 0,
    vb: 0
  };
};

const MetaBalls = ({
  className = '',
  color = '#ffffff',
  cursorBallColor = '#ffffff',
  speed = 0.3,
  enableMouseInteraction = true,
  hoverSmoothness = 0.1,
  animationSize = 30,
  ballCount = 15,
  clumpFactor = 1,
  cursorBallSize = 3,
  enableTransparency = false,
  variant = 'solid',
  motion = 'orbit',
  gooeyness = 0.5,
  stickiness = 0.5,
  stretch = 0.5,
  wobble = 0.5,
  lineWidth = 1.5,
  rings = 4,
  clickBurst = true,
  intro = true,
  paused = false,
  dpr,
  style
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const settings = {
    color,
    cursorBallColor,
    speed,
    enableMouseInteraction,
    hoverSmoothness,
    animationSize,
    ballCount,
    clumpFactor,
    cursorBallSize,
    enableTransparency,
    variant,
    motion,
    gooeyness,
    stickiness,
    stretch,
    wobble,
    lineWidth,
    rings,
    clickBurst,
    paused,
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const introRef = useRef(intro);
  const engineRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) return;

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.bindAttribLocation(program, 0, 'position');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uniform = name => gl.getUniformLocation(program, name);
    const loc = {
      resolution: uniform('uResolution'),
      scale: uniform('uScale'),
      balls: uniform('uBalls'),
      shapes: uniform('uShapes'),
      count: uniform('uCount'),
      gamma: uniform('uGamma'),
      threshold: uniform('uThreshold'),
      color: uniform('uColor'),
      cursorColor: uniform('uCursorColor'),
      variant: uniform('uVariant'),
      line: uniform('uLine'),
      spacing: uniform('uSpacing'),
      rings: uniform('uRings'),
      opaque: uniform('uOpaque')
    };

    const ballData = new Float32Array(SLOTS * 4);
    const shapeData = new Float32Array(SLOTS * 4);
    const balls = Array.from({ length: MAX_BALLS }, (_, index) => createBall(index));
    const idle = createBall(MAX_BALLS + 7);
    const cursor = { x: 0, y: 0, vx: 0, vy: 0, a: 0, b: 0, va: 0, vb: 0, pulse: 0, pulseVelocity: 0, ready: false };
    const pointer = { x: 0, y: 0, inside: false };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const view = { width: 1, height: 1, ratio: 1 };
    const colors = new Map();
    const rgb = value => {
      if (!colors.has(value)) colors.set(value, toRgb(value));
      return colors.get(value);
    };
    let phase = 0;
    let clock = 0;
    let introAt = introRef.current && !reduced ? 0 : -1;
    let visible = true;
    let raf = 0;
    let last = 0;
    let dirty = true;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const s = settingsRef.current;
      const ratio = Math.max(0.5, Math.min(s.dpr ?? window.devicePixelRatio ?? 1, 2));
      view.width = Math.max(1, rect.width);
      view.height = Math.max(1, rect.height);
      view.ratio = ratio;
      canvas.width = Math.max(1, Math.round(view.width * ratio));
      canvas.height = Math.max(1, Math.round(view.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      dirty = true;
    };

    const toWorld = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      const scale = settingsRef.current.animationSize / Math.max(1, rect.height);
      return {
        x: (clientX - rect.left - rect.width / 2) * scale,
        y: (rect.top + rect.height / 2 - clientY) * scale,
        inside: clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
      };
    };

    const presence = () => {
      if (introAt < 0) return { size: 1, time: Infinity };
      const t = clock - introAt;
      return { size: easeOut(t / 0.5), time: t };
    };

    const release = (ball, look) => (look.time === Infinity ? 1 : easeInOut((look.time - ball.delay) / 1.15));

    const anchor = (ball, s, spread) => {
      const halfWidth = (s.animationSize * view.width) / view.height / 2;
      const halfHeight = s.animationSize / 2;
      const clump = Math.min(1.25, s.clumpFactor);
      if (s.motion === 'lava') {
        const cycle = Math.sin(phase * ball.rise * 1.6 + ball.start);
        const x =
          ball.lane * halfWidth * 0.8 * clump + Math.sin(phase * 0.5 * ball.rise + ball.sway) * halfWidth * 0.06;
        const y = Math.sign(cycle) * Math.pow(Math.abs(cycle), 0.55) * halfHeight * 0.9;
        return [x * spread, y * spread];
      }
      if (s.motion === 'drift') {
        const x = Math.sin(phase * ball.rise * 0.9 + ball.start) * halfWidth * 0.84 * clump;
        const y = Math.sin(phase * ball.rate * 1.3 + ball.sway) * halfHeight * 0.78 * clump;
        return [x * spread, y * spread];
      }
      const t = phase * ball.rate;
      const angle = ball.start + t;
      return [
        Math.cos(angle) * ball.reach * s.clumpFactor * spread,
        Math.sin(angle + t * ball.toggle) * ball.reach * s.clumpFactor * spread
      ];
    };

    const deform = (body, h, s) => {
      const speed = Math.hypot(body.vx, body.vy);
      const amount = 0.6 * s.stretch * Math.tanh(speed / 14);
      let ta = 0;
      let tb = 0;
      if (speed > 1e-4) {
        ta = (amount * (body.vx * body.vx - body.vy * body.vy)) / (speed * speed);
        tb = (amount * 2 * body.vx * body.vy) / (speed * speed);
      }
      const omega = 13;
      const zeta = 0.85 - 0.68 * clamp(s.wobble, 0, 1);
      body.va += (omega * omega * (ta - body.a) - 2 * zeta * omega * body.va) * h;
      body.vb += (omega * omega * (tb - body.b) - 2 * zeta * omega * body.vb) * h;
      body.a += body.va * h;
      body.b += body.vb * h;
    };

    const bridge = s => {
      const goo = clamp(s.gooeyness, 0, 1);
      const gamma = goo < 0.5 ? 1 + (0.5 - goo) * 1.2 : 1 - (goo - 0.5) * 0.5;
      return { gamma, threshold: Math.pow(1.3, gamma), reach: Math.pow(2, 0.5 / gamma) };
    };

    const step = (h, s, count, look) => {
      const { reach } = bridge(s);
      const pull = 36 * clamp(s.stickiness, 0, 1);
      const cursorRadius = s.cursorBallSize * VISIBLE * look.size * (1 + cursor.pulse);
      phase += h * s.speed;

      for (let i = 0; i < count; i++) {
        const ball = balls[i];
        const [x, y] = anchor(ball, s, release(ball, look));
        ball.avx = clamp((x - ball.ax) / h, -40, 40);
        ball.avy = clamp((y - ball.ay) / h, -40, 40);
        ball.ax = x;
        ball.ay = y;
        ball.fx = 20 * (x - ball.x) - 5.4 * (ball.vx - ball.avx);
        ball.fy = 20 * (y - ball.y) - 5.4 * (ball.vy - ball.avy);
      }

      for (let i = 0; i < count; i++) {
        const p = balls[i];
        const rp = p.radius * VISIBLE * look.size;
        for (let j = i + 1; j < count; j++) {
          const q = balls[j];
          const rq = q.radius * VISIBLE * look.size;
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const distance = Math.hypot(dx, dy) || 1e-4;
          const far = (rp + rq) * reach;
          if (distance >= far) continue;
          const core = (rp + rq) * 0.62;
          let force;
          if (distance < core) force = -60 * (core - distance);
          else {
            const t = (distance - core) / (far - core);
            force = pull * Math.min(rp, rq) * smoothstep(0, 0.6, t) * (1 - smoothstep(0.82, 1, t));
          }
          const nx = dx / distance;
          const ny = dy / distance;
          const mp = rp * rp + 0.05;
          const mq = rq * rq + 0.05;
          p.fx += (nx * force) / mp;
          p.fy += (ny * force) / mp;
          q.fx -= (nx * force) / mq;
          q.fy -= (ny * force) / mq;
        }
        const dx = cursor.x - p.x;
        const dy = cursor.y - p.y;
        const distance = Math.hypot(dx, dy) || 1e-4;
        const far = (rp + cursorRadius) * reach;
        if (distance < far) {
          const core = (rp + cursorRadius) * 0.62;
          let force;
          if (distance < core) force = -140 * (core - distance);
          else {
            const t = (distance - core) / (far - core);
            force = pull * 0.6 * rp * smoothstep(0, 0.6, t) * (1 - smoothstep(0.82, 1, t));
          }
          p.fx += ((dx / distance) * force) / (rp * rp + 0.05);
          p.fy += ((dy / distance) * force) / (rp * rp + 0.05);
        }
      }

      for (let i = 0; i < count; i++) {
        const ball = balls[i];
        ball.vx += ball.fx * h;
        ball.vy += ball.fy * h;
        ball.x += ball.vx * h;
        ball.y += ball.vy * h;
        deform(ball, h, s);
        if (!Number.isFinite(ball.x + ball.y + ball.vx + ball.vy + ball.a + ball.b + ball.va + ball.vb)) {
          Object.assign(ball, { x: ball.ax, y: ball.ay, vx: 0, vy: 0, a: 0, b: 0, va: 0, vb: 0 });
        }
      }
    };

    const moveCursor = (dt, s, look) => {
      let tx;
      let ty;
      if (pointer.inside && s.enableMouseInteraction) {
        tx = pointer.x;
        ty = pointer.y;
      } else {
        const out = look.time === Infinity ? 1 : easeInOut((look.time - 0.75) / 1.3);
        if (s.motion === 'lava' || s.motion === 'drift') {
          [tx, ty] = anchor(idle, s, out);
        } else {
          const halfWidth = (s.animationSize * view.width) / view.height / 2;
          const halfHeight = s.animationSize / 2;
          tx = Math.cos(clock * s.speed) * halfWidth * 0.3 * out;
          ty = Math.sin(clock * s.speed) * halfHeight * 0.3 * out;
        }
      }
      if (!cursor.ready) {
        cursor.x = tx;
        cursor.y = ty;
        cursor.ready = true;
      }
      const follow = 1 - Math.pow(1 - clamp(s.hoverSmoothness, 0.001, 1), dt * 60);
      const nx = cursor.x + (tx - cursor.x) * follow;
      const ny = cursor.y + (ty - cursor.y) * follow;
      const blend = 1 - Math.exp(-dt / 0.05);
      cursor.vx += ((nx - cursor.x) / Math.max(dt, 1e-4) - cursor.vx) * blend;
      cursor.vy += ((ny - cursor.y) / Math.max(dt, 1e-4) - cursor.vy) * blend;
      cursor.x = nx;
      cursor.y = ny;
    };

    const burst = (x, y) => {
      const s = settingsRef.current;
      const count = clamp(Math.round(s.ballCount), 0, MAX_BALLS);
      const radius = s.animationSize * 0.45;
      for (let i = 0; i < count; i++) {
        const ball = balls[i];
        const dx = ball.x - x;
        const dy = ball.y - y;
        const distance = Math.hypot(dx, dy) || 1e-4;
        if (distance > radius) continue;
        const falloff = Math.pow(1 - distance / radius, 1.2);
        const kick = 72 * falloff;
        ball.vx += (dx / distance) * kick - (dy / distance) * kick * 0.3;
        ball.vy += (dy / distance) * kick + (dx / distance) * kick * 0.3;
      }
      cursor.pulseVelocity += 9;
    };

    const shapeOf = (body, out, offset) => {
      const m = Math.hypot(body.a, body.b);
      const c = Math.cosh(m);
      const k = m > 1e-6 ? Math.sinh(m) / m : 1;
      out[offset] = c - k * body.a;
      out[offset + 1] = -k * body.b;
      out[offset + 2] = c + k * body.a;
      out[offset + 3] = 0;
    };

    const draw = () => {
      const s = settingsRef.current;
      const count = clamp(Math.round(s.ballCount), 0, MAX_BALLS);
      const look = presence();
      const { gamma, threshold } = bridge(s);
      for (let i = 0; i < count; i++) {
        const ball = balls[i];
        const radius = ball.radius * look.size;
        ballData[i * 4] = ball.x;
        ballData[i * 4 + 1] = ball.y;
        ballData[i * 4 + 2] = radius * radius;
        ballData[i * 4 + 3] = 0;
        shapeOf(ball, shapeData, i * 4);
      }
      const cursorRadius = s.cursorBallSize * look.size * (1 + cursor.pulse);
      ballData[count * 4] = cursor.x;
      ballData[count * 4 + 1] = cursor.y;
      ballData[count * 4 + 2] = cursorRadius * cursorRadius;
      ballData[count * 4 + 3] = 1;
      shapeOf(cursor, shapeData, count * 4);

      gl.uniform2f(loc.resolution, canvas.width, canvas.height);
      gl.uniform1f(loc.scale, s.animationSize / canvas.height);
      gl.uniform4fv(loc.balls, ballData);
      gl.uniform4fv(loc.shapes, shapeData);
      gl.uniform1i(loc.count, count + 1);
      gl.uniform1f(loc.gamma, gamma);
      gl.uniform1f(loc.threshold, threshold);
      gl.uniform3fv(loc.color, rgb(s.color));
      gl.uniform3fv(loc.cursorColor, rgb(s.cursorBallColor));
      gl.uniform1i(loc.variant, VARIANTS[s.variant] ?? 0);
      gl.uniform1f(loc.line, Math.max(0.25, s.lineWidth) * view.ratio);
      gl.uniform1f(loc.spacing, 0.28);
      gl.uniform1f(loc.rings, clamp(Math.round(s.rings), 0, 12));
      gl.uniform1f(loc.opaque, s.enableTransparency ? 0 : 1);
      gl.clearColor(0, 0, 0, s.enableTransparency ? 0 : 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      dirty = false;
    };

    const frame = now => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      const s = settingsRef.current;
      if (!s.paused && dt > 1e-4) {
        clock += dt;
        const count = clamp(Math.round(s.ballCount), 0, MAX_BALLS);
        const look = presence();
        moveCursor(dt, s, look);
        const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
        for (let i = 0; i < steps; i++) step(dt / steps, s, count, look);
        deform(cursor, dt, s);
        cursor.pulseVelocity += (-170 * cursor.pulse - 2 * 0.42 * 13 * cursor.pulseVelocity) * dt;
        cursor.pulse = Math.max(-0.4, cursor.pulse + cursor.pulseVelocity * dt);
        dirty = true;
      }
      if (dirty) draw();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !visible) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    const onMove = event => {
      const point = toWorld(event.clientX, event.clientY);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = point.inside;
    };
    const onLeave = event => {
      if (!event.relatedTarget) pointer.inside = false;
    };
    const onLift = event => {
      if (event.pointerType !== 'mouse') pointer.inside = false;
    };
    const onDown = event => {
      const s = settingsRef.current;
      if (!s.clickBurst || !s.enableMouseInteraction || s.paused || event.button !== 0) return;
      const point = toWorld(event.clientX, event.clientY);
      if (point.inside) burst(point.x, point.y);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) start();
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerout', onLeave);
    window.addEventListener('pointerup', onLift);
    window.addEventListener('pointercancel', onLift);

    resize();
    start();
    engineRef.current = {
      refresh: () => {
        dirty = true;
      }
    };

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerout', onLeave);
      window.removeEventListener('pointerup', onLift);
      window.removeEventListener('pointercancel', onLift);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.refresh();
  });

  return (
    <div ref={containerRef} className={`metaballs-container ${className}`.trim()} style={style}>
      <canvas ref={canvasRef} className="metaballs-canvas" />
    </div>
  );
};

export default MetaBalls;
