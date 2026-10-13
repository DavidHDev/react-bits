'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

type Pattern = 'grid' | 'hex' | 'spiral' | 'scatter';

export interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  pattern?: Pattern;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  cursorRadius?: number;
  bulgeStrength?: number;
  twist?: number;
  glowColor?: string;
  glowRadius?: number;
  glowIntensity?: number;
  baseOpacity?: number;
  waveAmplitude?: number;
  sparkle?: boolean;
  speed?: number;
  interactive?: boolean;
  holdToZoom?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  opacity?: number;
  maxDevicePixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  radius: number;
  step: number;
  pattern: number;
  from: number[];
  to: number[];
  glowColor: number[];
  glowWeight: number;
  direction: number[];
  lensRadius: number;
  strength: number;
  twist: number;
  glowRadius: number;
  glowIntensity: number;
  base: number;
  wave: number;
  sparkle: number;
  speed: number;
  interactive: boolean;
  holdToZoom: boolean;
  intro: boolean;
  light: boolean;
  opacity: number;
  maxRatio: number;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

const PIXEL_BUDGET = 9e6;
const MAX_DOTS = 120000;
const PATTERNS: Record<Pattern, number> = { grid: 0, hex: 1, spiral: 2, scatter: 3 };
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aDot;
uniform vec2 uSize;
uniform float uPixel;
uniform float uRadius;
uniform float uCell;
uniform vec4 uLens;
uniform vec2 uWarp;
uniform vec3 uGlow;
uniform vec3 uFrom;
uniform vec3 uTo;
uniform vec4 uGlowColor;
uniform vec3 uGradient;
uniform float uTime;
uniform float uWave;
uniform float uSparkle;
uniform float uFocus;
uniform float uBase;
uniform float uLight;
out vec2 vLocal;
out float vRadius;
out float vBlur;
out float vHalo;
out float vHaloWidth;
out vec3 vColor;
out float vAlpha;

vec3 toRgb(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.291485548 * lab.z;
  vec3 lms = vec3(l * l * l, m * m * m, s * s * s);
  vec3 lin = clamp(vec3(
    4.0767416621 * lms.x - 3.3077115913 * lms.y + 0.2309699292 * lms.z,
    -1.2684380046 * lms.x + 2.6097574011 * lms.y - 0.3413193965 * lms.z,
    -0.0041960863 * lms.x - 0.7034186147 * lms.y + 1.707614701 * lms.z
  ), 0.0, 1.0);
  return mix(lin * 12.92, 1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
}

vec3 blend(vec3 a, vec3 b, float t) {
  vec2 ab = mix(a.yz, b.yz, t);
  float chroma = mix(length(a.yz), length(b.yz), t);
  float len = length(ab);
  return vec3(mix(a.x, b.x, t), len > 1e-5 ? ab * (chroma / len) : ab);
}

vec3 wave(vec2 p, float t) {
  float ay = p.x * 0.018 + t + 1.1 * sin(p.y * 0.016 - t * 0.4);
  float ax = p.y * 0.021 + t * 0.7 + 1.3 * sin(p.x * 0.013 + t * 0.3);
  float spread = cos(ay) * 0.0176 * cos(p.y * 0.016 - t * 0.4) + 0.5 * cos(ax) * 0.0169 * cos(p.x * 0.013 + t * 0.3);
  return uWave * vec3(0.5 * sin(ax), sin(ay), spread);
}

void main() {
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 center = uSize * 0.5;
  vec3 swell = wave(aDot.xy, uTime);
  vec2 source = center + (aDot.xy - center) * mix(1.12, 1.0, uFocus) + swell.xy;

  vec2 rel = source - uLens.xy;
  float x = length(rel) / uLens.z;
  float y = clamp(1.0 - x * x, 0.0, 1.0);
  float w = y * y * y;
  float k = uWarp.x * uLens.w;
  float grow = 1.0 + k * w;
  float spread = 1.0 + k * (w - 6.0 * x * x * y * y);
  float theta = uWarp.y * uLens.w * w;
  vec2 turn = vec2(cos(theta), sin(theta));
  vec2 display = uLens.xy + vec2(turn.x * rel.x - turn.y * rel.y, turn.y * rel.x + turn.x * rel.y) * grow;
  float scale = sqrt(max(grow * spread, 0.02));

  float spark = 0.0;
  if (uSparkle > 0.0) {
    float phase = 0.5 + 0.5 * sin(uTime * (0.55 + aDot.w * 0.9) + aDot.z * 6.2831853);
    spark = pow(phase, 48.0) * step(0.72, fract(aDot.z * 7.31 + aDot.w * 3.17)) * uSparkle;
  }

  float pool = 0.0;
  if (uGlow.x > 0.0) {
    float g = length(display - uLens.xy) / uGlow.x;
    float q = clamp(1.0 - g * g, 0.0, 1.0);
    pool = q * q * uGlow.y * uLens.w;
  }

  float radius = uRadius * (1.0 + 0.7 * spark);
  float device = radius * scale * uPixel;
  float fade = 1.0;
  if (device < 0.75) {
    fade = device * device / 0.5625;
    radius = 0.75 / (scale * uPixel);
  }
  float blur = (1.0 - uFocus) * uCell * 0.42;
  float energy = pow(radius / (radius + blur), 1.15);
  float halo = pool * uGlow.z;
  float haloWidth = 2.0 + radius * 1.5;
  float pad = radius + blur * 1.2 + 1.5 / (scale * uPixel) + (halo > 0.0 ? haloWidth * 2.5 : 0.0);

  float t = clamp(dot(aDot.xy - center, uGradient.xy) / uGradient.z + 0.5, 0.0, 1.0);
  vec3 tone = blend(uFrom, uTo, t);
  vec3 deep = vec3(tone.x * 0.72, tone.yz * 1.3);
  vec3 base = toRgb(tone);
  vec3 lit = toRgb(mix(deep, uGlowColor.xyz, uGlowColor.w));
  vec3 color = mix(base, lit, clamp(pool, 0.0, 1.0) * 0.8);
  color = mix(color, uLight > 0.5 ? color * 0.6 : vec3(1.0), spark * 0.55);

  vLocal = corner * pad;
  vRadius = radius + blur;
  vBlur = blur * 0.7;
  vHalo = halo;
  vHaloWidth = haloWidth;
  vColor = color;
  float shade = clamp(1.0 - swell.z * 2.5, 0.4, 1.6);
  vAlpha = mix(min(uBase * shade, 1.0), 1.0, clamp(max(pool, spark), 0.0, 1.0)) * fade * energy * smoothstep(0.0, 0.25, uFocus + 0.08);
  vec2 point = display + corner * pad * scale;
  gl_Position = vec4(point.x / uSize.x * 2.0 - 1.0, 1.0 - point.y / uSize.y * 2.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform float uOpacity;
in vec2 vLocal;
in float vRadius;
in float vBlur;
in float vHalo;
in float vHaloWidth;
in vec3 vColor;
in float vAlpha;
out vec4 fragColor;

void main() {
  float dist = length(vLocal);
  float d = dist - vRadius;
  float edge = max(fwidth(dist), 1e-4) + vBlur;
  float cover = 1.0 - smoothstep(-0.5 * edge, 0.5 * edge, d);
  float glow = vHalo * exp(-max(d, 0.0) / vHaloWidth) * 0.5;
  float alpha = min(cover + glow, 1.0) * vAlpha * uOpacity;
  if (alpha < 0.002) discard;
  fragColor = vec4(vColor * alpha, alpha);
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseColor = (value: string): number[] | null => {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) / 255);
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) return [rgb[1], rgb[2], rgb[3]].map(channel => clamp(parseFloat(channel) / 255, 0, 1));
  return null;
};

const toLinear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4));

const toOklab = (color: number[]): number[] => {
  const [r, g, b] = color.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
};

const toInk = (value: string, fallback: number[], light: boolean): number[] => {
  const lab = toOklab(parseColor(value) || fallback);
  if (!light) return lab;
  const hue = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  const warmth = clamp(1 - Math.abs(hue - 85) / 40, 0, 1);
  const ceiling = 0.6 + 0.16 * warmth * warmth * (3 - 2 * warmth);
  if (lab[0] <= ceiling) return lab;
  const boost = 1 + (lab[0] - ceiling) * 1.6;
  return [ceiling, lab[1] * boost, lab[2] * boost];
};

const chroma = (value: string) => {
  const lab = toOklab(parseColor(value) || [1, 1, 1]);
  return Math.hypot(lab[1], lab[2]);
};

const hash = (a: number, b: number, c: number) => {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const lensReach = (radius: number, strength: number, twist: number) => {
  let peak = 0;
  for (let index = 1; index < 48; index++) {
    const x = index / 48;
    const w = (1 - x * x) ** 3;
    const sigma = x * radius;
    const grow = 1 + strength * w;
    const theta = twist * w;
    peak = Math.max(peak, Math.hypot(sigma * (grow * Math.cos(theta) - 1), sigma * grow * Math.sin(theta)));
  }
  return peak;
};

const buildDots = (width: number, height: number, step: number, pattern: number, margin: number) => {
  const cx = width / 2;
  const cy = height / 2;
  const minX = -margin;
  const maxX = width + margin;
  const minY = -margin;
  const maxY = height + margin;
  const out: number[] = [];
  const push = (x: number, y: number, a: number, b: number) => {
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) out.push(x, y, a, b);
  };
  if (pattern === PATTERNS.spiral) {
    const spacing = step / Math.sqrt(Math.PI);
    const reach = Math.hypot(width / 2 + margin, height / 2 + margin);
    const count = Math.ceil((reach / spacing) ** 2);
    for (let index = 0; index < count; index++) {
      const r = spacing * Math.sqrt(index + 0.5);
      const angle = index * GOLDEN_ANGLE;
      push(cx + r * Math.cos(angle), cy + r * Math.sin(angle), hash(index, 0, 3), hash(index, 0, 4));
    }
  } else {
    const rowStep = pattern === PATTERNS.hex ? (step * Math.sqrt(3)) / 2 : step;
    const cols = Math.ceil((width / 2 + margin) / step) + 1;
    const rows = Math.ceil((height / 2 + margin) / rowStep) + 1;
    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        let x = cx + col * step + (pattern === PATTERNS.hex && row & 1 ? step / 2 : 0);
        let y = cy + row * rowStep;
        if (pattern === PATTERNS.scatter) {
          x += (hash(col, row, 1) - 0.5) * step * 0.8;
          y += (hash(col, row, 2) - 0.5) * step * 0.8;
        }
        push(x, y, hash(col, row, 3), hash(col, row, 4));
      }
    }
  }
  return new Float32Array(out);
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const link = (gl: WebGL2RenderingContext): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Program['uniforms'] = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const DotField = ({
  dotRadius = 1.5,
  dotSpacing = 14,
  pattern = 'grid',
  gradientFrom = '#5227FF',
  gradientTo = '#FF9FFC',
  gradientAngle = 135,
  cursorRadius = 240,
  bulgeStrength = 0.6,
  twist = 0,
  glowColor = '#ffffff',
  glowRadius = 160,
  glowIntensity = 0.8,
  baseOpacity = 0.55,
  waveAmplitude = 0,
  sparkle = false,
  speed = 1,
  interactive = true,
  holdToZoom = true,
  intro = true,
  lightMode = false,
  opacity = 1,
  maxDevicePixelRatio = 2,
  className = '',
  style
}: DotFieldProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const [generation, setGeneration] = useState(0);

  const radius = clamp(dotRadius, 0.25, 12);
  const step = radius * 2 + clamp(dotSpacing, 1, 200);
  const angle = (gradientAngle * Math.PI) / 180;
  const settings: Settings = {
    radius,
    step,
    pattern: PATTERNS[pattern] ?? PATTERNS.grid,
    from: toInk(gradientFrom, [0.32, 0.15, 1], lightMode),
    to: toInk(gradientTo, [1, 0.62, 0.99], lightMode),
    glowColor: toInk(glowColor, [1, 1, 1], lightMode),
    glowWeight: lightMode ? clamp((chroma(glowColor) - 0.02) / 0.06, 0, 1) : 1,
    direction: [Math.sin(angle), -Math.cos(angle)],
    lensRadius: clamp(cursorRadius, 20, 2000),
    strength: clamp(bulgeStrength, -1, 1),
    twist: (clamp(twist, -360, 360) * Math.PI) / 180,
    glowRadius: Math.max(0, glowRadius),
    glowIntensity: clamp(glowIntensity, 0, 2),
    base: clamp(baseOpacity, 0, 1),
    wave: clamp(waveAmplitude, 0, 60),
    sparkle: sparkle ? 1 : 0,
    speed: Math.max(0, speed),
    interactive,
    holdToZoom,
    intro,
    light: lightMode,
    opacity: clamp(opacity, 0, 1),
    maxRatio: clamp(maxDevicePixelRatio, 0.5, 3)
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    wakeRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
    const shader = gl ? link(gl) : null;
    if (!gl || !shader) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.vertexAttribDivisor(0, 1);
    gl.bindVertexArray(null);

    const size = { width: 1, height: 1, ratio: 1 };
    const pointer = { x: 0, y: 0, inside: false, down: false };
    const lens = { x: 0, y: 0, vx: 0, vy: 0, presence: 0, zoom: 0, ready: false };
    let layoutKey = '';
    let count = 0;
    let time = Math.random() * 100;
    let focus = settingsRef.current.intro && !reduced && generation === 0 ? 0 : 1;
    let raf = 0;
    let last = 0;
    let visible = true;
    let pageVisible = document.visibilityState !== 'hidden';
    let lost = false;

    const strengthOf = (s: Settings, zoom: number) => {
      const base = s.strength >= 0 ? s.strength * 1.2 : s.strength * 0.7;
      return clamp(base * (1 + zoom * 0.6), -0.85, 1.45);
    };

    const layout = () => {
      const s = settingsRef.current;
      const reach = lensReach(s.lensRadius, strengthOf(s, s.holdToZoom ? 1 : 0), s.twist * (s.holdToZoom ? 1.6 : 1));
      const margin = Math.ceil(reach + s.wave + s.step * 2);
      const area = (size.width + margin * 2) * (size.height + margin * 2);
      const step = Math.max(s.step, Math.sqrt(area / MAX_DOTS));
      const key = `${size.width}|${size.height}|${step}|${s.pattern}|${margin}`;
      if (key === layoutKey) return;
      layoutKey = key;
      const data = buildDots(size.width, size.height, step, s.pattern, margin);
      count = data.length / 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    };

    const resize = () => {
      const s = settingsRef.current;
      const rect = container.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width);
      const cssHeight = Math.max(1, rect.height);
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        s.maxRatio,
        Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight))
      );
      const width = Math.max(1, Math.round(cssWidth * ratio));
      const height = Math.max(1, Math.round(cssHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      size.width = cssWidth;
      size.height = cssHeight;
      size.ratio = width / cssWidth;
      layout();
    };

    const frame = (now: number) => {
      raf = 0;
      if (lost) return;
      const s = settingsRef.current;
      const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
      last = Math.max(last, now);
      if (!reduced) time += dt * s.speed;
      if (focus < 1) focus = Math.min(1, focus + dt / 1.8);

      const tracking = s.interactive && pointer.inside;
      if (tracking && (!lens.ready || lens.presence < 0.01)) {
        lens.x = pointer.x;
        lens.y = pointer.y;
        lens.vx = 0;
        lens.vy = 0;
        lens.ready = true;
      }
      if (lens.ready) {
        const omega = 18;
        const f = 1 + 2 * dt * omega;
        const oo = omega * omega;
        const hoo = dt * oo;
        const hhoo = dt * hoo;
        const inv = 1 / (f + hhoo);
        const nx = (f * lens.x + dt * lens.vx + hhoo * pointer.x) * inv;
        const ny = (f * lens.y + dt * lens.vy + hhoo * pointer.y) * inv;
        lens.vx = (lens.vx + hoo * (pointer.x - lens.x)) * inv;
        lens.vy = (lens.vy + hoo * (pointer.y - lens.y)) * inv;
        lens.x = nx;
        lens.y = ny;
      }
      const presenceTarget = tracking ? 1 : 0;
      lens.presence += (presenceTarget - lens.presence) * (1 - Math.exp(-dt / (tracking ? 0.18 : 0.4)));
      const zoomTarget = tracking && pointer.down && s.holdToZoom ? 1 : 0;
      lens.zoom += (zoomTarget - lens.zoom) * (1 - Math.exp(-dt / 0.14));

      const eased = focus < 0.5 ? 4 * focus * focus * focus : 1 - Math.pow(-2 * focus + 2, 3) / 2;
      const presence = lens.presence * lens.presence * (3 - 2 * lens.presence);
      const extent = Math.abs(size.width * s.direction[0]) + Math.abs(size.height * s.direction[1]);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(shader.program);
      gl.bindVertexArray(vao);
      const u = shader.uniforms;
      gl.uniform2f(u.uSize, size.width, size.height);
      gl.uniform1f(u.uPixel, size.ratio);
      gl.uniform1f(u.uRadius, s.radius);
      gl.uniform1f(u.uCell, s.step);
      gl.uniform4f(u.uLens, lens.x, lens.y, s.lensRadius * (1 + lens.zoom * 0.12), presence);
      gl.uniform2f(u.uWarp, strengthOf(s, lens.zoom), s.twist * (1 + lens.zoom * 0.6));
      gl.uniform3f(
        u.uGlow,
        s.glowRadius * (1 + lens.zoom * 0.1),
        s.glowIntensity * (1 + lens.zoom * 0.25),
        s.light ? 0 : 1
      );
      gl.uniform3f(u.uFrom, s.from[0], s.from[1], s.from[2]);
      gl.uniform3f(u.uTo, s.to[0], s.to[1], s.to[2]);
      gl.uniform4f(u.uGlowColor, s.glowColor[0], s.glowColor[1], s.glowColor[2], s.glowWeight);
      gl.uniform3f(u.uGradient, s.direction[0], s.direction[1], Math.max(extent, 1));
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uWave, s.wave);
      gl.uniform1f(u.uSparkle, s.sparkle);
      gl.uniform1f(u.uFocus, eased);
      gl.uniform1f(u.uBase, s.light ? Math.min(1, s.base * 1.3) : s.base);
      gl.uniform1f(u.uLight, s.light ? 1 : 0);
      gl.uniform1f(u.uOpacity, s.opacity);
      if (count) gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);

      const moving =
        Math.abs(pointer.x - lens.x) + Math.abs(pointer.y - lens.y) > 0.05 || Math.hypot(lens.vx, lens.vy) > 0.5;
      const settling =
        Math.abs(presenceTarget - lens.presence) > 0.002 ||
        Math.abs(zoomTarget - lens.zoom) > 0.002 ||
        (lens.presence > 0.002 && moving);
      const animated = !reduced && s.speed > 0 && (s.wave > 0 || s.sparkle > 0);
      const busy = focus < 1 || settling || animated;
      if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || lost || !visible || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = () => {
      resize();
      wake();
    };

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        inside:
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const spot = locate(event);
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = spot.inside;
      wake();
    };
    const onPointerDown = (event: PointerEvent) => {
      const spot = locate(event);
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = spot.inside;
      pointer.down = spot.inside;
      wake();
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.down = false;
      wake();
    };
    const onPointerUp = (event: PointerEvent) => {
      pointer.down = false;
      if (event.pointerType !== 'mouse') pointer.inside = false;
      wake();
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onRestored = () => setGeneration(value => value + 1);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      wake();
    });
    resizeObserver.observe(container);

    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      wake();
    });
    intersection.observe(container);

    const onVisibility = () => {
      pageVisible = document.visibilityState !== 'hidden';
      wake();
    };
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        gl.deleteBuffer(buffer);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(shader.program);
      }
    };
  }, [generation]);

  return (
    <div ref={containerRef} className={`relative h-full w-full overflow-hidden ${className}`.trim()} style={style}>
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
};

export default DotField;
