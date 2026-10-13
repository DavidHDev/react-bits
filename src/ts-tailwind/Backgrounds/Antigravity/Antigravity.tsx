'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

type Shape = 'capsule' | 'sphere' | 'box' | 'tetrahedron';
type ColorMode = 'conic' | 'radial' | 'random';

export interface AntigravityProps {
  count?: number;
  magnetRadius?: number;
  ringRadius?: number;
  waveSpeed?: number;
  waveAmplitude?: number;
  waveCount?: number;
  particleSize?: number;
  lerpSpeed?: number;
  color?: string;
  colors?: string[];
  colorMode?: ColorMode;
  colorSpeed?: number;
  autoAnimate?: boolean;
  particleVariance?: number;
  rotationSpeed?: number;
  depthFactor?: number;
  pulseSpeed?: number;
  particleShape?: Shape;
  fieldStrength?: number;
  ambient?: number;
  interactive?: boolean;
  clickBurst?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  opacity?: number;
  maxDevicePixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  count: number;
  magnet: number;
  ring: number;
  waveSpeed: number;
  waveAmplitude: number;
  waveCount: number;
  size: number;
  follow: number;
  palette: string[];
  paletteKey: string;
  colorMode: number;
  colorSpeed: number;
  autoAnimate: boolean;
  variance: number;
  rotation: number;
  depth: number;
  pulse: number;
  shape: number;
  tightness: number;
  ambient: number;
  interactive: boolean;
  clickBurst: boolean;
  intro: boolean;
  light: boolean;
  opacity: number;
  maxRatio: number;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Field {
  total: number;
  width: number;
  height: number;
  homeX: Float32Array;
  homeY: Float32Array;
  band: Float32Array;
  phase: Float32Array;
  agility: Float32Array;
  delay: Float32Array;
  orbit: Float32Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  particles: Float32Array;
  seeds: Float32Array;
}

const PIXEL_BUDGET = 2.4e6;
const WORLD_HEIGHT = 31.5;
const PALETTE_SIZE = 256;
const DEFAULT_COLORS = ['#5227FF', '#FF9FFC', '#B497CF'];
const SHAPES: Record<Shape, number> = { capsule: 0, sphere: 1, box: 2, tetrahedron: 3 };
const COLOR_MODES: Record<ColorMode, number> = { conic: 0, radial: 1, random: 2 };

const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aParticle;
layout(location = 2) in vec4 aSeed;
uniform vec2 uSize;
uniform float uPixel;
uniform vec2 uCursor;
uniform float uRing;
uniform float uBand;
uniform float uParticle;
uniform float uAmbient;
uniform float uTime;
uniform float uPulse;
uniform float uVariance;
uniform float uDepth;
uniform float uShape;
uniform float uColorMode;
uniform float uStops;
uniform float uHue;
uniform float uReveal;
uniform float uStreak;
uniform float uCharge;
out vec2 vLocal;
out vec2 vBounds;
out float vU;
out float vAlpha;
out float vSoft;

void main() {
  vec2 rel = aParticle.xy - uCursor;
  float dist = length(rel);
  vec2 radial = dist > 1e-3 ? rel / dist : vec2(1.0, 0.0);
  vec2 dir = radial;
  float speed = length(aParticle.zw);
  float streak = clamp(speed / uStreak, 0.0, 2.5);
  if (speed > 1e-3) {
    vec2 heading = aParticle.zw / speed * sign(dot(aParticle.zw, radial) + 1e-4);
    dir = normalize(mix(radial, heading, smoothstep(0.0, 1.0, streak)));
  }
  float ring = exp(-pow((dist - uRing) / uBand, 2.0));
  float z = aSeed.x;
  float depth = 1.0 + z * 0.32 * uDepth;
  float pulse = 1.0 + sin(uTime * uPulse + aSeed.y) * 0.22 * uVariance;
  float grow = uAmbient + (1.0 - uAmbient) * ring;
  float size = uParticle * depth * pulse * (0.85 + 0.3 * aSeed.w) * (1.0 + uCharge * 0.25 * ring);
  vec2 bounds;
  if (uShape < 0.5) {
    float width = size * 0.17 * mix(0.55, 1.0, ring);
    bounds = vec2(max(width, size * 0.5 * grow) * (1.0 + streak * 1.2), width);
  } else if (uShape < 1.5) {
    bounds = vec2(size * 0.22 * mix(0.45, 1.0, grow));
  } else {
    bounds = vec2(size * 0.26 * mix(0.45, 1.0, grow));
  }
  float soft = 1.0 + max(-z, 0.0) * 1.6 * uDepth;
  vec2 local = aCorner * (bounds + soft * 1.5 / uPixel);
  vec2 world = aParticle.xy + dir * local.x + vec2(-dir.y, dir.x) * local.y;
  gl_Position = vec4(world.x / uSize.x * 2.0 - 1.0, 1.0 - world.y / uSize.y * 2.0, 0.0, 1.0);
  vLocal = local * uPixel;
  vBounds = bounds * uPixel;
  vSoft = soft;
  if (uColorMode < 0.5) {
    vU = atan(radial.y, radial.x) / 6.28318530718 + uHue + (aSeed.z - 0.5) * 0.06;
  } else if (uColorMode < 1.5) {
    vU = clamp(dist / (uRing * 2.4), 0.0, 1.0) + (aSeed.z - 0.5) * 0.06;
  } else {
    vU = floor(aSeed.z * uStops) / max(uStops - 1.0, 1.0);
  }
  float fog = 1.0 - max(-z, 0.0) * 0.35 * uDepth;
  vAlpha = mix(uAmbient, 1.0, ring) * fog * uReveal;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uPalette;
uniform float uShape;
uniform float uColorMode;
uniform float uOpacity;
in vec2 vLocal;
in vec2 vBounds;
in float vU;
in float vAlpha;
in float vSoft;
out vec4 fragColor;

void main() {
  vec2 p = vLocal;
  float d;
  if (uShape < 0.5) {
    float r = vBounds.y;
    d = length(vec2(max(abs(p.x) - max(vBounds.x - r, 0.0), 0.0), p.y)) - r;
  } else if (uShape < 1.5) {
    d = length(p) - vBounds.x;
  } else if (uShape < 2.5) {
    float r = vBounds.x * 0.28;
    vec2 q = abs(p) - (vBounds - r);
    d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  } else {
    float r = vBounds.x * 1.15;
    vec2 q = vec2(r * 0.5774 - p.x, abs(p.y));
    d = max(dot(q, vec2(0.5, 0.8660254)) - r * 0.5, -q.x - r * 0.5) * 1.2;
  }
  float alpha = clamp(0.5 - d / vSoft, 0.0, 1.0) * vAlpha * uOpacity;
  if (alpha < 0.002) discard;
  vec3 color = texture(uPalette, vec2(uColorMode < 0.5 ? fract(vU) : vU, uColorMode < 0.5 ? 0.25 : 0.75)).rgb;
  fragColor = vec4(color * alpha, alpha);
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
const toSrgb = (channel: number) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(Math.max(channel, 0), 1 / 2.4) - 0.055;

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

const fromOklab = ([L, a, b]: number[]): number[] => {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ].map(channel => clamp(toSrgb(channel), 0, 1));
};

const buildPalette = (colors: string[], light: boolean) => {
  const stops: number[][] = [];
  colors.forEach(color => {
    const parsed = parseColor(color);
    if (!parsed) return;
    const lab = toOklab(parsed);
    const hue = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
    const warmth = clamp(1 - Math.abs(hue - 85) / 40, 0, 1);
    const ceiling = 0.62 + 0.14 * warmth * warmth * (3 - 2 * warmth);
    if (light && lab[0] > ceiling) {
      const boost = 1 + (lab[0] - ceiling) * 1.6;
      stops.push([ceiling, lab[1] * boost, lab[2] * boost]);
    } else {
      stops.push(lab);
    }
  });
  if (!stops.length) stops.push(toOklab(light ? [0.1, 0.1, 0.12] : [1, 1, 1]));
  const data = new Uint8Array(PALETTE_SIZE * 2 * 4);
  const rows = [[...stops, stops[0]], stops.length > 1 ? stops : [stops[0], stops[0]]];
  rows.forEach((row, index) => {
    for (let x = 0; x < PALETTE_SIZE; x++) {
      const t = (x / (PALETTE_SIZE - (index === 0 ? 0 : 1))) * (row.length - 1);
      const from = Math.min(Math.floor(t), row.length - 2);
      const k = t - from;
      const eased = k * k * (3 - 2 * k);
      const start = row[from];
      const end = row[from + 1];
      const chroma = Math.hypot(start[1], start[2]) * (1 - eased) + Math.hypot(end[1], end[2]) * eased;
      const a = start[1] + (end[1] - start[1]) * eased;
      const b = start[2] + (end[2] - start[2]) * eased;
      const length = Math.hypot(a, b);
      const scale = length > 1e-4 ? chroma / length : 0;
      const color = fromOklab([start[0] + (end[0] - start[0]) * eased, a * scale, b * scale]);
      for (let channel = 0; channel < 3; channel++) {
        data[(index * PALETTE_SIZE + x) * 4 + channel] = Math.round(color[channel] * 255);
      }
      data[(index * PALETTE_SIZE + x) * 4 + 3] = 255;
    }
  });
  return data;
};

const random = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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

const Antigravity = ({
  count = 1500,
  magnetRadius = 9,
  ringRadius = 7,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  waveCount = 3,
  particleSize = 0.9,
  lerpSpeed = 0.05,
  color,
  colors = DEFAULT_COLORS,
  colorMode = 'conic',
  colorSpeed = 0.05,
  autoAnimate = true,
  particleVariance = 1,
  rotationSpeed = 0,
  depthFactor = 1,
  pulseSpeed = 3,
  particleShape = 'capsule',
  fieldStrength = 10,
  ambient = 0.25,
  interactive = true,
  clickBurst = true,
  intro = true,
  lightMode = false,
  opacity = 1,
  maxDevicePixelRatio = 2,
  className = '',
  style
}: AntigravityProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const [generation, setGeneration] = useState(0);
  const palette = color ? [color] : Array.isArray(colors) && colors.length ? colors : DEFAULT_COLORS;

  const settings: Settings = {
    count: clamp(Math.round(count), 1, 20000),
    magnet: Math.max(0, magnetRadius),
    ring: Math.max(0, ringRadius),
    waveSpeed,
    waveAmplitude: Math.max(0, waveAmplitude),
    waveCount: Math.max(0, Math.round(waveCount)),
    size: Math.max(0, particleSize),
    follow: clamp(lerpSpeed, 0.001, 1),
    palette,
    paletteKey: `${palette.join(',')}|${lightMode}`,
    colorMode: COLOR_MODES[colorMode] ?? COLOR_MODES.conic,
    colorSpeed,
    autoAnimate,
    variance: Math.max(0, particleVariance),
    rotation: rotationSpeed,
    depth: Math.max(0, depthFactor),
    pulse: pulseSpeed,
    shape: SHAPES[particleShape] ?? SHAPES.capsule,
    tightness: Math.max(0, fieldStrength),
    ambient: clamp(ambient, 0, 1),
    interactive,
    clickBurst,
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
    gl.bindVertexArray(vao);
    const cornerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const particleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);
    const seedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);

    const paletteTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const size = { width: 1, height: 1, ratio: 1 };
    const cursor = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, ready: false };
    const pointer = { x: 0, y: 0, inside: false, down: false, moved: -Infinity };
    let field: Field | null = null;
    let paletteKey = '';
    let time = 0;
    let hue = 0;
    let charge = 0;
    let introClock = settingsRef.current.intro && !reduced && generation === 0 ? 0 : Infinity;
    let raf = 0;
    let last = 0;
    let visible = true;
    let pageVisible = document.visibilityState !== 'hidden';
    let lost = false;

    const updatePalette = (s: Settings) => {
      if (s.paletteKey === paletteKey) return;
      paletteKey = s.paletteKey;
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        PALETTE_SIZE,
        2,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        buildPalette(s.palette, s.light)
      );
    };

    const buildField = (total: number, width: number, height: number, previous: Field | null): Field => {
      const rand = random(1337);
      const margin = 0.06;
      const spanX = width * (1 + margin * 2);
      const spanY = height * (1 + margin * 2);
      const cols = Math.max(1, Math.ceil(Math.sqrt((total * spanX) / spanY)));
      const rows = Math.max(1, Math.ceil(total / cols));
      const cells = Array.from({ length: cols * rows }, (_, index) => index);
      for (let index = cells.length - 1; index > 0; index--) {
        const swap = Math.floor(rand() * (index + 1));
        [cells[index], cells[swap]] = [cells[swap], cells[index]];
      }
      const depths = Array.from({ length: total }, () => rand() * 2 - 1).sort((a, b) => a - b);
      const next: Field = {
        total,
        width,
        height,
        homeX: new Float32Array(total),
        homeY: new Float32Array(total),
        band: new Float32Array(total),
        phase: new Float32Array(total),
        agility: new Float32Array(total),
        delay: new Float32Array(total),
        orbit: new Float32Array(total),
        x: new Float32Array(total),
        y: new Float32Array(total),
        vx: new Float32Array(total),
        vy: new Float32Array(total),
        particles: new Float32Array(total * 4),
        seeds: new Float32Array(total * 4)
      };
      for (let index = 0; index < total; index++) {
        const cell = cells[index];
        const hx = -width * margin + (((cell % cols) + 0.5 + (rand() - 0.5) * 0.85) / cols) * spanX;
        const hy = -height * margin + ((Math.floor(cell / cols) + 0.5 + (rand() - 0.5) * 0.85) / rows) * spanY;
        next.homeX[index] = hx;
        next.homeY[index] = hy;
        next.band[index] = rand() * 2 - 1;
        next.phase[index] = rand() * Math.PI * 2;
        next.agility[index] = 0.75 + rand() * 0.5;
        next.delay[index] = rand();
        if (previous && index < previous.total) {
          next.x[index] = (previous.x[index] / previous.width) * width;
          next.y[index] = (previous.y[index] / previous.height) * height;
          next.vx[index] = previous.vx[index];
          next.vy[index] = previous.vy[index];
          next.orbit[index] = previous.orbit[index];
        } else {
          next.x[index] = hx;
          next.y[index] = introClock === 0 ? hy + height * (0.45 + next.delay[index] * 0.4) : hy;
        }
        next.seeds[index * 4] = depths[index];
        next.seeds[index * 4 + 1] = next.phase[index];
        next.seeds[index * 4 + 2] = rand();
        next.seeds[index * 4 + 3] = rand();
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, next.seeds, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, next.particles.byteLength, gl.DYNAMIC_DRAW);
      return next;
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
      if (!cursor.ready) {
        cursor.x = cursor.tx = cssWidth / 2;
        cursor.y = cursor.ty = cssHeight / 2;
        cursor.ready = true;
      }
      if (
        !field ||
        field.total !== s.count ||
        Math.abs(field.width - cssWidth) > 0.5 ||
        Math.abs(field.height - cssHeight) > 0.5
      ) {
        field = buildField(s.count, cssWidth, cssHeight, field);
      }
    };

    const simulate = (s: Settings, dt: number) => {
      if (!field) return;
      const unit = size.height / WORLD_HEIGHT;
      const ringPx = s.ring * unit * (1 - 0.38 * charge);
      const magnetPx = Math.max(s.magnet * unit, 1);
      const spread = (5 / (s.tightness + 0.1)) * unit;
      const wavePx = s.waveAmplitude * unit * 0.5;
      const omegaBase = 2.2 + s.follow * 80;
      const spinRate = (s.rotation + charge * 3) * (reduced ? 0.3 : 1);
      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const edge = magnetPx * 0.18;
      const { homeX, homeY, band, phase, agility, delay, orbit, x, y, vx, vy, particles, seeds, total } = field;
      for (let index = 0; index < total; index++) {
        const parallax = 1 - seeds[index * 4] * 0.12 * s.depth;
        const cx = centerX + (cursor.x - centerX) * parallax;
        const cy = centerY + (cursor.y - centerY) * parallax;
        const hx = homeX[index];
        const hy = homeY[index] + Math.sin(time * 0.7 + phase[index]) * unit * 0.12 * s.waveAmplitude;
        const dx = hx - cx;
        const dy = hy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const capture = 1 - clamp((dist - (magnetPx - edge)) / (edge * 2), 0, 1);
        const ease = capture * capture * (3 - 2 * capture);
        let turn = orbit[index] + spinRate * ease * dt;
        turn -= Math.atan2(Math.sin(turn), Math.cos(turn)) * (1 - ease) * Math.min(1, dt * 2.5);
        orbit[index] = turn;
        let tx = hx;
        let ty = hy;
        if (ease > 0 || Math.abs(turn) > 1e-4) {
          const angle = Math.atan2(dy, dx) + turn;
          const wave =
            wavePx *
            (0.6 * Math.sin(angle * s.waveCount - time * s.waveSpeed * 2) +
              0.4 * Math.sin(phase[index] + time * s.waveSpeed * 1.3));
          const radius = dist + (ringPx + wave + band[index] * spread - dist) * ease;
          tx = cx + Math.cos(angle) * radius;
          ty = cy + Math.sin(angle) * radius;
        }
        const omega = introClock < delay[index] * 0.9 ? 0 : omegaBase * agility[index];
        const damping = 1.64 * omega;
        const stiffness = omega * omega;
        const steps = Math.min(4, Math.max(1, Math.ceil(omega * dt * 2)));
        const h = dt / steps;
        for (let step = 0; step < steps; step++) {
          vx[index] += ((tx - x[index]) * stiffness - vx[index] * damping) * h;
          vy[index] += ((ty - y[index]) * stiffness - vy[index] * damping) * h;
          x[index] += vx[index] * h;
          y[index] += vy[index] * h;
        }
        particles[index * 4] = x[index];
        particles[index * 4 + 1] = y[index];
        particles[index * 4 + 2] = vx[index];
        particles[index * 4 + 3] = vy[index];
      }
    };

    const burst = (s: Settings, strength: number) => {
      if (!field) return;
      const unit = size.height / WORLD_HEIGHT;
      const reach = Math.max(s.magnet, s.ring) * unit * 1.8;
      const { x, y, vx, vy, agility, total } = field;
      for (let index = 0; index < total; index++) {
        const dx = x[index] - cursor.x;
        const dy = y[index] - cursor.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1e-3;
        const kick = unit * 110 * strength * Math.exp(-Math.pow(dist / reach, 2)) * agility[index];
        vx[index] += (dx / dist) * kick;
        vy[index] += (dy / dist) * kick;
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (lost || !field) return;
      const s = settingsRef.current;
      updatePalette(s);
      const dt = clamp((now - last) / 1000 || 0, 0, 1 / 30);
      last = Math.max(last, now);
      const pace = reduced ? 0.3 : 1;
      time += dt * pace;
      hue += dt * s.colorSpeed * pace;
      if (introClock < 3) introClock += dt;
      charge = pointer.down ? Math.min(1, charge + dt / 0.9) : Math.max(0, charge - dt * 4);

      const idle = performance.now() - pointer.moved > 2000 || !pointer.inside;
      if (s.autoAnimate && !reduced && (idle || !s.interactive)) {
        cursor.tx = size.width / 2 + Math.sin(time * 0.5) * (size.width / 4);
        cursor.ty = size.height / 2 + Math.cos(time) * (size.height / 4);
      } else if (s.interactive && pointer.inside) {
        cursor.tx = pointer.x;
        cursor.ty = pointer.y;
      }
      cursor.vx += ((cursor.tx - cursor.x) * 49 - cursor.vx * 14) * dt;
      cursor.vy += ((cursor.ty - cursor.y) * 49 - cursor.vy * 14) * dt;
      cursor.x += cursor.vx * dt;
      cursor.y += cursor.vy * dt;

      simulate(s, dt);

      const unit = size.height / WORLD_HEIGHT;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(shader.program);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, field.particles);
      const u = shader.uniforms;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.uniform1i(u.uPalette, 0);
      gl.uniform2f(u.uSize, size.width, size.height);
      gl.uniform1f(u.uPixel, size.ratio);
      gl.uniform2f(u.uCursor, cursor.x, cursor.y);
      gl.uniform1f(u.uRing, s.ring * unit * (1 - 0.38 * charge));
      gl.uniform1f(u.uBand, Math.max(unit * 6, 1));
      gl.uniform1f(u.uParticle, s.size * unit * 0.6);
      gl.uniform1f(u.uAmbient, s.ambient);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uPulse, s.pulse);
      gl.uniform1f(u.uVariance, s.variance);
      gl.uniform1f(u.uDepth, s.depth);
      gl.uniform1f(u.uShape, s.shape);
      gl.uniform1f(u.uColorMode, s.colorMode);
      gl.uniform1f(u.uStops, s.palette.length);
      gl.uniform1f(u.uHue, hue);
      gl.uniform1f(u.uReveal, introClock < 3 ? clamp(introClock / 0.6, 0, 1) : 1);
      gl.uniform1f(u.uStreak, unit * 30);
      gl.uniform1f(u.uCharge, charge);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, field.total);

      if (visible && pageVisible) raf = requestAnimationFrame(frame);
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
      pointer.inside = spot.inside;
      if (!spot.inside) return;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.moved = performance.now();
    };
    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      const spot = locate(event);
      if (!spot.inside || !s.interactive) return;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = true;
      pointer.moved = performance.now();
      if (s.clickBurst && !reduced) pointer.down = true;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (pointer.down) burst(settingsRef.current, 0.45 + charge);
      pointer.down = false;
      if (event.pointerType !== 'mouse') pointer.inside = false;
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.down = false;
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
        gl.deleteBuffer(cornerBuffer);
        gl.deleteBuffer(particleBuffer);
        gl.deleteBuffer(seedBuffer);
        gl.deleteTexture(paletteTexture);
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

export default Antigravity;
