'use client';

import { useEffect, useRef } from 'react';

import './AcidSquares.css';

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const buildFragment = (square, light, twist) => `#version 300 es
#define SQUARE ${square}
#define LIGHT ${light}
#define TWIST ${twist}
precision highp float;
out vec4 outColor;
uniform vec2 uResolution;
uniform float uTime;
uniform float uSteps;
uniform float uDepth;
uniform float uSpread;
uniform float uLine;
uniform float uZoom;
uniform float uTravel;
uniform float uTwist;
uniform float uRoll;
uniform vec4 uPulse;
uniform vec2 uSparkle;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uBrightness;
uniform vec4 uTorch;
uniform vec2 uLook;
uniform float uGrain;
uniform float uFade;
uniform float uOpacity;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

mat2 rotate(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float smootherstep(float edge, float x) {
  float t = clamp(x / max(edge, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 ndc = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
  vec2 dir = rotate(uRoll) * ndc * (0.5 / max(uZoom, 0.05)) + uLook;
  vec3 offset = vec3(0.0, 0.0, uTravel);
  vec3 p = vec3(0.0);
  float s = 0.0;
  float glow = 0.0;
  float edgeLine = 0.0;
  float edgeSoft = 0.0;
  float pulse = 0.0;
  float crest = 0.0;
  float peak = 0.0;
  vec3 home = vec3(0.0);

  for (int i = 0; i < 64; i++) {
    if (float(i) >= uSteps) break;
    p += vec3(dir * s, s);
    vec3 q = p + offset;
#if TWIST
    q.xy = rotate(q.z * uTwist) * q.xy;
#endif
    vec2 cell = ceil(q.xy);
#if SQUARE
    float tube = max(abs(q.x), abs(q.z));
    float ring = max(abs(cell.x), abs(cell.y));
#else
    float tube = length(q.xz);
    float ring = length(cell);
#endif
    s += uDepth - tube + length(cell);
    s = 0.002 + abs(s) * uSpread;
    float g = 1.0 / s;
    glow += g;
    vec2 seam = abs(fract(q.xy) - 0.5);
    float gap = 0.5 - max(seam.x, seam.y);
    gap *= gap;
    float line = max(1.0 - gap * 156.25, 0.0);
    line *= line;
    edgeLine += g * line * line;
#if LIGHT
    float soft = max(1.0 - gap * 12.5, 0.0);
    soft *= soft;
    edgeSoft += g * soft * soft;
#endif
    float wave = fract(ring * uPulse.y - uPulse.w) - 0.5;
    float band = g * exp(wave > 0.0 ? -wave * wave / (uPulse.z * uPulse.z) : wave / (uPulse.z * 2.5)) * smoothstep(0.6, 1.8, ring);
    pulse += band;
    crest += wave > -uPulse.z ? band : 0.0;
    if (g > peak) {
      peak = g;
      home = vec3(cell, floor(q.z * 0.5));
    }
  }

  float h = hash(home.xy * 7.13 + home.z);
  float flicker = step(1.0 - uSparkle.x, h) * (0.5 + 0.5 * sin(uSparkle.y + h * 31.0));
  float base = tanh(glow / 2700.0 * uBrightness);
  float lines = tanh(edgeLine / 2700.0 * uBrightness * 2.0);
  float lit = tanh(pulse / 2700.0 * uBrightness * 1.6);
  float front = tanh(crest / 2700.0 * uBrightness * 1.6);
  float twinkle = tanh(glow * flicker / 2700.0 * uBrightness * 1.6);
  vec2 toTorch = ndc - uTorch.xy;
  float torch = exp(-dot(toTorch, toTorch) / max(uTorch.z * uTorch.z, 0.0001)) * uTorch.w;
  float spark = clamp(front * uPulse.x + twinkle + base * torch * 1.4, 0.0, 1.0);
  float haze = max(lit - front, 0.0) * uPulse.x;

  vec2 uv = gl_FragCoord.xy / uResolution;
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  mask *= uOpacity;

#if LIGHT
  float soft = tanh(edgeSoft / 2700.0 * uBrightness * 1.2);
  float near = mix(0.2, 1.0, smoothstep(0.15, 1.1, length(ndc)));
  float face = smoothstep(0.3, 1.0, base) * 0.12;
  float shade = (1.0 - (1.0 - face) * (1.0 - soft * 0.25) * (1.0 - lines * uLine)) * near;
  float glowInk = clamp((1.0 - exp(-spark * 2.4)) * 0.9 + (1.0 - exp(-haze * 2.4)) * 0.16, 0.0, 1.0);
  vec3 color = uColor * 0.5 * shade + uAccent * glowInk * (1.0 - shade);
  float alpha = shade + glowInk * (1.0 - shade);
  vec3 tint = color / max(alpha, 0.0001);
  alpha = clamp(alpha * (1.0 + grain), 0.0, 1.0) * mask;
  outColor = vec4(tint * alpha, alpha);
#else
  float lift = smoothstep(0.0, 0.6, base);
  vec3 structure = mix(uColor, vec3(1.0), 0.22 + 0.13 * lift) * mix(0.45, 1.0, lift);
  structure = mix(structure, mix(uColor, vec3(1.0), 0.55), smoothstep(0.65, 1.0, base));
  float accent = clamp(spark + haze * 0.6, 0.0, 1.0);
  vec3 color = structure * base + mix(uColor, vec3(1.0), 0.7) * lines * uLine + uAccent * accent * (0.6 + 0.4 * base);
  color = max(color + grain * max(color.r, max(color.g, color.b)), 0.0) * mask;
  outColor = vec4(color, max(color.r, max(color.g, color.b)));
#endif
}`;

const UNIFORMS = [
  'uResolution',
  'uTime',
  'uSteps',
  'uDepth',
  'uSpread',
  'uLine',
  'uZoom',
  'uTravel',
  'uTwist',
  'uRoll',
  'uPulse',
  'uSparkle',
  'uColor',
  'uAccent',
  'uBrightness',
  'uTorch',
  'uLook',
  'uGrain',
  'uFade',
  'uOpacity'
];

const DETAIL_STEPS = { low: 20, medium: 32, high: 48 };
const MAX_RENDER_DIM = 2400;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (gl, vertexSource, fragmentSource) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
};

const locate = (gl, program, names) => {
  const result = {};
  for (const name of names) result[name] = gl.getUniformLocation(program, name);
  return result;
};

const AcidSquares = ({
  color = '#120f17',
  accentColor = '#c6ff3d',
  shape = 'square',
  pulse = 1,
  pulseSpeed = 0.45,
  pulseSpacing = 1,
  pulseWidth = 1,
  sparkle = 0.04,
  speed = 0.7,
  breathe = 1,
  zoom = 1.3,
  depth = 10,
  edges = 0.45,
  twist = 0,
  roll = 0,
  brightness = 1,
  mouseInteraction = true,
  mouseStrength = 1,
  mouseRadius = 0.35,
  detail = 'medium',
  grain = 0.03,
  fade = 0,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const settings = {
    color: String(color),
    accentColor: String(accentColor),
    shape: shape === 'round' ? 0 : 1,
    pulse: Math.max(0, pulse),
    pulseSpeed,
    pulseSpacing: clamp(pulseSpacing, 0.2, 5),
    pulseWidth: clamp(pulseWidth, 0.1, 5),
    sparkle: clamp(sparkle, 0, 1),
    speed,
    breathe: Math.max(0, breathe),
    zoom: clamp(zoom, 0.3, 5),
    depth: clamp(depth, 2, 24),
    edges: clamp(edges, 0, 1),
    twist,
    roll,
    brightness: Math.max(0, brightness),
    mouseInteraction,
    mouseStrength: Math.max(0, mouseStrength),
    mouseRadius: clamp(mouseRadius, 0.02, 2),
    steps: DETAIL_STEPS[detail] || DETAIL_STEPS.medium,
    grain: Math.max(0, grain),
    fade: clamp(fade, 0, 1),
    opacity: clamp(opacity, 0, 1),
    lightMode,
    paused,
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });
    if (!container || !canvas || !gl) return undefined;

    const programs = new Map();
    const pick = s => {
      const key = `${s.shape}${s.lightMode ? 1 : 0}${s.twist !== 0 ? 1 : 0}`;
      if (!programs.has(key)) {
        const program = link(gl, VERTEX, buildFragment(s.shape, s.lightMode ? 1 : 0, s.twist !== 0 ? 1 : 0));
        programs.set(key, program ? { program, uniforms: locate(gl, program, UNIFORMS) } : null);
      }
      return programs.get(key);
    };
    if (!pick(settingsRef.current)) return undefined;

    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeContext = probe.getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = {
      time: 0,
      pulsePhase: 0,
      sparklePhase: 0,
      roll: 0,
      width: 1,
      height: 1,
      colorKey: '',
      color: [0.07, 0.06, 0.09],
      accent: [0.78, 1, 0.24],
      pointer: { x: 0, y: 0, inside: false },
      torch: { x: 0, y: 0, vx: 0, vy: 0, presence: 0, placed: false },
      look: { x: 0, y: 0, vx: 0, vy: 0 }
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;

    const toRgb = (value, fallback) => {
      if (!probeContext || !value) return fallback;
      const css = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
      probeContext.clearRect(0, 0, 1, 1);
      probeContext.fillStyle = '#000000';
      probeContext.fillStyle = css;
      probeContext.fillRect(0, 0, 1, 1);
      const [r, g, b] = probeContext.getImageData(0, 0, 1, 1).data;
      return [r / 255, g / 255, b / 255];
    };

    const resolveColors = s => {
      const key = `${s.color}|${s.accentColor}`;
      if (key === state.colorKey) return;
      state.colorKey = key;
      state.color = toRgb(s.color, [0.07, 0.06, 0.09]);
      state.accent = toRgb(s.accentColor, [0.78, 1, 0.24]);
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const baseDpr = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      const longest = Math.max(width, height) * baseDpr;
      const ratio = longest > MAX_RENDER_DIM ? (baseDpr * MAX_RENDER_DIM) / longest : baseDpr;
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      state.width = width;
      state.height = height;
      render();
    };

    const render = () => {
      const s = settingsRef.current;
      const entry = pick(s);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!entry) return;
      const { uniforms } = entry;
      resolveColors(s);
      const aspect = state.width / state.height;
      gl.useProgram(entry.program);
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, state.time % 1000);
      gl.uniform1f(uniforms.uSteps, s.steps);
      gl.uniform1f(uniforms.uDepth, s.depth);
      gl.uniform1f(uniforms.uSpread, 0.2 + s.edges * 0.22);
      gl.uniform1f(uniforms.uLine, s.lightMode ? 0.25 + s.edges * 0.45 : 0.15 + s.edges * 0.35);
      gl.uniform1f(uniforms.uZoom, s.zoom);
      gl.uniform1f(uniforms.uTravel, Math.sin(state.time) * s.breathe);
      gl.uniform1f(uniforms.uTwist, s.twist);
      gl.uniform1f(uniforms.uRoll, state.roll);
      gl.uniform4f(uniforms.uPulse, s.pulse, 0.16 / s.pulseSpacing, 0.05 * s.pulseWidth, state.pulsePhase);
      gl.uniform2f(uniforms.uSparkle, s.sparkle, state.sparklePhase);
      gl.uniform3f(uniforms.uColor, state.color[0], state.color[1], state.color[2]);
      gl.uniform3f(uniforms.uAccent, state.accent[0], state.accent[1], state.accent[2]);
      gl.uniform1f(uniforms.uBrightness, s.brightness);
      gl.uniform4f(
        uniforms.uTorch,
        (state.torch.x / state.width - 0.5) * 2 * aspect,
        (0.5 - state.torch.y / state.height) * 2,
        s.mouseRadius,
        s.mouseStrength * state.torch.presence
      );
      gl.uniform2f(uniforms.uLook, state.look.x, state.look.y);
      gl.uniform1f(uniforms.uGrain, s.grain);
      gl.uniform1f(uniforms.uFade, s.fade);
      gl.uniform1f(uniforms.uOpacity, s.opacity);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const frame = now => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) {
        state.time += dt * s.speed;
        state.pulsePhase = (state.pulsePhase + dt * s.pulseSpeed) % 1;
        state.sparklePhase = (state.sparklePhase + dt * 2) % (Math.PI * 2);
        state.roll += dt * s.roll;
      }

      const { pointer, torch, look } = state;
      const active = s.mouseInteraction && pointer.inside && !reduce;
      if (active && !torch.placed) {
        torch.x = pointer.x;
        torch.y = pointer.y;
        torch.vx = 0;
        torch.vy = 0;
        torch.placed = true;
      }
      torch.vx += (110 * (pointer.x - torch.x) - 19 * torch.vx) * dt;
      torch.vy += (110 * (pointer.y - torch.y) - 19 * torch.vy) * dt;
      torch.x += torch.vx * dt;
      torch.y += torch.vy * dt;
      const goal = active ? 1 : 0;
      torch.presence += (goal - torch.presence) * (1 - Math.exp(-dt / (goal > torch.presence ? 0.3 : 0.6)));
      if (!active && torch.presence < 0.001) torch.placed = false;
      const lookX = active ? (pointer.x / state.width - 0.5) * 0.06 : 0;
      const lookY = active ? (0.5 - pointer.y / state.height) * 0.06 : 0;
      look.vx += (40 * (lookX - look.x) - 12 * look.vx) * dt;
      look.vy += (40 * (lookY - look.y) - 12 * look.vy) * dt;
      look.x += look.vx * dt;
      look.y += look.vy * dt;

      render();
      const settling =
        Math.abs(goal - torch.presence) > 0.002 ||
        Math.hypot(torch.vx, torch.vy) > 0.5 ||
        Math.abs(lookX - look.x) > 0.0002 ||
        Math.abs(lookY - look.y) > 0.0002;
      if (moving || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const onPointerMove = event => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      state.pointer.x = x;
      state.pointer.y = y;
      state.pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      wake();
    };

    const onPointerLeave = () => {
      state.pointer.inside = false;
      wake();
    };

    const onVisibility = () => {
      last = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    wake();

    wakeRef.current = () => {
      if (!raf) render();
      wake();
    };

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      programs.forEach(entry => entry && gl.deleteProgram(entry.program));
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  const { className = '', ...attributes } = rest;

  return (
    <div ref={containerRef} className={`acid-squares-container${className ? ` ${className}` : ''}`} {...attributes}>
      <canvas ref={canvasRef} className="acid-squares-canvas" aria-hidden="true" />
    </div>
  );
};

export default AcidSquares;
