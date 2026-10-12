'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

type Mode = 'orbit' | 'attract' | 'spiral' | 'dipole';
type Shape = 'line' | 'arrow' | 'needle';
type Matrix = number[];

export interface MagnetLinesProps {
  spacing?: number;
  rows?: number;
  columns?: number;
  containerSize?: number | string;
  lineColor?: string;
  accentColor?: string;
  lineWidth?: number | string;
  lineHeight?: number | string;
  baseAngle?: number;
  mode?: Mode;
  shape?: Shape;
  rainbow?: boolean;
  radius?: number;
  fade?: number;
  edgeFade?: number;
  stretch?: number;
  reach?: number;
  scatter?: number;
  inertia?: number;
  bounce?: number;
  ripple?: number;
  clickPulse?: boolean;
  intro?: boolean;
  idle?: boolean;
  tiltX?: number;
  tiltY?: number;
  maxDevicePixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  square: boolean;
  spacing: number;
  rows: number;
  columns: number;
  lineWidth: number | string;
  lineHeight: number | string;
  baseAngle: number;
  mode: Mode;
  shape: Shape;
  color: number[];
  accent: number[];
  accentMix: number;
  rainbow: boolean;
  tone: number;
  radius: number;
  fade: number;
  edgeFade: number;
  stretch: number;
  reach: number;
  scatter: number;
  inertia: number;
  bounce: number;
  ripple: number;
  clickPulse: boolean;
  intro: boolean;
  idle: boolean;
  tiltX: number;
  tiltY: number;
  maxRatio: number;
}

interface View {
  forward: Matrix;
  inverse: Matrix;
  minScale: number;
  maxScale: number;
}

interface Range {
  fromColumn: number;
  toColumn: number;
  fromRow: number;
  toRow: number;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Field {
  width: number;
  height: number;
  pad: number;
  ratio: number;
  view: View | null;
  length: number;
  thickness: number;
  fill: boolean;
  edgePad: number;
  minScale: number;
  maxScale: number;
  introSpeed: number;
  bounds: number[];
  key: string;
}

interface Pulse {
  x: number;
  y: number;
  start: number;
  life: number;
}

interface Candidate {
  x: number;
  y: number;
  column: number;
  row: number;
  w: number;
  distance: number;
}

const VERTEX = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec2 aCenter;
layout(location = 2) in vec4 aState;
uniform mat3 uView;
uniform vec2 uCanvas;
uniform vec2 uOffset;
uniform vec2 uLine;
uniform float uStretch;
uniform float uHead;
uniform float uPad;
uniform float uFar;
out vec2 vLocal;
out vec2 vHalf;
out float vEmphasis;
out float vFlash;
out float vAngle;
out float vShown;
void main() {
  float angle = aState.x;
  float emphasis = aState.y;
  float halfLength = uLine.x * (1.0 + uStretch * emphasis);
  float halfWidth = uLine.y;
  vec2 extent = vec2(halfLength + uPad, max(halfWidth, uHead * halfLength) + uPad);
  vec2 local = aCorner * extent;
  vec2 axis = vec2(cos(angle), sin(angle));
  vec2 point = aCenter + axis * local.x + vec2(-axis.y, axis.x) * local.y;
  vec3 screen = uView * vec3(point, 1.0);
  vec2 scale = vec2(2.0 / uCanvas.x, -2.0 / uCanvas.y);
  vec2 shift = vec2(-1.0 + 2.0 * uOffset.x / uCanvas.x, 1.0 - 2.0 * uOffset.y / uCanvas.y);
  gl_Position = vec4(screen.xy * scale + shift * screen.z, 0.0, screen.z);
  float depth = (uView * vec3(aCenter, 1.0)).z;
  vLocal = local;
  vHalf = vec2(halfLength, halfWidth);
  vEmphasis = emphasis;
  vFlash = aState.z;
  vAngle = angle;
  vShown = aState.w * (1.0 - smoothstep(uFar * 0.45, uFar, depth));
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec2 vHalf;
in float vEmphasis;
in float vFlash;
in float vAngle;
in float vShown;
out vec4 fragColor;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uAccentMix;
uniform float uOpacity;
uniform float uFade;
uniform int uShape;
uniform float uHead;
uniform float uRainbow;
uniform float uTone;
uniform float uPeriod;
uniform vec2 uCanvas;
uniform vec2 uOffset;
uniform vec2 uPixels;
uniform vec2 uEdge;

float ndot(vec2 a, vec2 b) {
  return a.x * b.x - a.y * b.y;
}

float rhombus(vec2 p, vec2 b) {
  p = abs(p);
  float h = clamp(ndot(b - 2.0 * p, b) / dot(b, b), -1.0, 1.0);
  float d = length(p - 0.5 * b * vec2(1.0 - h, 1.0 + h));
  return d * sign(p.x * b.y + p.y * b.x - b.x * b.y);
}

float triangle(vec2 p, vec2 q) {
  p.x = abs(p.x);
  vec2 a = p - q * clamp(dot(p, q) / dot(q, q), 0.0, 1.0);
  vec2 b = p - q * vec2(clamp(p.x / q.x, 0.0, 1.0), 1.0);
  float s = -sign(q.y);
  vec2 d = min(vec2(dot(a, a), s * (p.x * q.y - p.y * q.x)), vec2(dot(b, b), s * (p.y - q.y)));
  return -sqrt(d.x) * sign(d.y);
}

float capsule(vec2 p, float from, float to, float radius) {
  float x = clamp(p.x, from, to);
  return length(vec2(p.x - x, p.y)) - radius;
}

float feather(float distance, float zone) {
  if (zone <= 0.0) return 1.0;
  float t = clamp(distance / zone, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

vec3 spectrum(float hue, float tone) {
  vec3 k = clamp(abs(fract(hue + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  float chroma = (1.0 - abs(2.0 * tone - 1.0)) * 0.92;
  return tone + chroma * (k - 0.5);
}

void main() {
  vec2 p = vLocal;
  float aa = max(length(fwidth(p)) * 0.7071, 0.0001);
  float halfWidth = max(vHalf.y, aa * 0.5);
  float thin = vHalf.y / halfWidth;
  float halfLength = max(vHalf.x, halfWidth);
  float d;
  if (uShape == 1) {
    float head = min(halfLength * 0.9, max(halfWidth * 4.5, halfLength * 0.55));
    float wing = max(uHead * halfLength, halfWidth * 2.2);
    float shaft = capsule(p, -halfLength + halfWidth, halfLength - head * 0.6, halfWidth);
    float tip = triangle(vec2(p.y, halfLength - p.x), vec2(wing, head));
    d = min(shaft, tip);
  } else if (uShape == 2) {
    d = rhombus(p, vec2(halfLength, max(uHead * halfLength, halfWidth)));
  } else {
    d = capsule(p, -halfLength + halfWidth, halfLength - halfWidth, halfWidth);
  }
  float coverage = clamp(0.5 - d / aa, 0.0, 1.0) * thin;
  if (coverage <= 0.0) discard;

  float emphasis = clamp(vEmphasis + vFlash, 0.0, 1.0);
  vec3 color = mix(uColor, uAccent, uAccentMix * emphasis);
  if (uShape == 2) {
    float north = smoothstep(-aa, aa, p.x);
    color = mix(uColor, uAccent, north);
  }
  if (uRainbow > 0.5) {
    float hue = fract(vAngle / uPeriod);
    vec3 tint = spectrum(hue, uTone);
    color = uShape == 2 ? mix(tint, uColor, 1.0 - smoothstep(-aa, aa, p.x)) : tint;
  }
  float alpha = uOpacity * mix(1.0 - uFade, 1.0, clamp(vEmphasis, 0.0, 1.0));
  alpha = clamp(alpha + vFlash * 0.6, 0.0, 1.0) * coverage * vShown;
  vec2 point = vec2(gl_FragCoord.x, uPixels.y - gl_FragCoord.y) * (uCanvas / uPixels) - uOffset;
  vec2 inside = min(point, uCanvas - 2.0 * uOffset - point);
  alpha *= feather(inside.x, uEdge.x) * feather(inside.y, uEdge.y);
  fragColor = vec4(color * alpha, alpha);
}`;

const MODES = ['orbit', 'attract', 'spiral', 'dipole'];
const SHAPES: Record<Shape, number> = { line: 0, arrow: 1, needle: 2 };
const TAU = Math.PI * 2;
const PULSE_SPEED = 520;
const PULSE_SPIN = 0.34;
const INTRO_SPEED = 700;
const INTRO_TIME = 1.1;
const INTRO_SPIN = 0.65;
const FAR = 4;
const MAX_LINES = 30000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const wrap = (value: number, period: number) => {
  const half = period / 2;
  return ((((value + half) % period) + period) % period) - half;
};

const seedFor = (column: number, row: number) => {
  let hash = Math.imul(column + 40503, 2246822519) ^ Math.imul(row + 9973, 3266489917);
  hash = Math.imul(hash ^ (hash >>> 15), 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 374761393);
  return (((hash ^ (hash >>> 16)) >>> 0) / 4294967296) * 2 - 1;
};

const parseColor = (value: string): number[] => {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) / 255);
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) return [rgb[1], rgb[2], rgb[3]].map(channel => clamp(parseFloat(channel) / 255, 0, 1));
  if (typeof document !== 'undefined') {
    const context = document.createElement('canvas').getContext('2d');
    if (context) {
      context.fillStyle = '#000000';
      context.fillStyle = text;
      const normal = String(context.fillStyle);
      if (normal !== '#000000' || /^(#0{3}|#0{6}|black)$/i.test(text)) return parseColor(normal);
    }
  }
  return [0.94, 0.94, 0.94];
};

const lightness = (rgb: number[]) => (Math.max(...rgb) + Math.min(...rgb)) / 2;

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

const multiply = (a: Matrix, b: Matrix): Matrix => {
  const out: number[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[c + 3] + a[r * 3 + 2] * b[c + 6]);
    }
  }
  return out;
};

const invert = (m: Matrix): Matrix => {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, C, b * g - a * h, a * e - b * d].map(
    value => value / det
  );
};

const apply = (m: Matrix, x: number, y: number) => {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w, w];
};

const viewFor = (tiltX: number, tiltY: number, width: number, height: number, fill: boolean): View => {
  const ax = (tiltX * Math.PI) / 180;
  const ay = (tiltY * Math.PI) / 180;
  const depth = Math.max(width, height) * 1.25;
  const tilt = [
    Math.cos(ay),
    0,
    0,
    Math.sin(ax) * Math.sin(ay),
    Math.cos(ax),
    0,
    (Math.sin(ay) * Math.cos(ax)) / depth,
    -Math.sin(ax) / depth,
    1
  ];
  if (fill) {
    const forward = multiply([1, 0, width / 2, 0, 1, height / 2, 0, 0, 1], tilt);
    return { forward, inverse: invert(forward), minScale: 1, maxScale: 1 };
  }
  const corners = [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [width / 2, height / 2],
    [-width / 2, height / 2]
  ].map(([x, y]) => apply(tilt, x, y));
  const xs = corners.map(point => point[0]);
  const ys = corners.map(point => point[1]);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const fit = Math.min(1, width / Math.max(1, spanX), height / Math.max(1, spanY));
  const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
  const midY = (Math.max(...ys) + Math.min(...ys)) / 2;
  const place = [fit, 0, width / 2 - midX * fit, 0, fit, height / 2 - midY * fit, 0, 0, 1];
  const forward = multiply(place, tilt);
  const scales = corners.map(point => fit / Math.abs(point[2]));
  return { forward, inverse: invert(forward), minScale: Math.min(...scales), maxScale: Math.max(...scales) };
};

const visibleRange = (view: View, width: number, height: number, cellX: number, cellY: number): Range | null => {
  const inverse = view.inverse;
  const edge = Math.max(cellX, cellY) * 2;
  const corners = [
    [-edge, -edge],
    [width + edge, -edge],
    [width + edge, height + edge],
    [-edge, height + edge]
  ];
  const depthOf = ([x, y]: number[]) => inverse[6] * x + inverse[7] * y + inverse[8] - 1 / FAR;
  const hull: number[][] = [];
  corners.forEach((from, index) => {
    const to = corners[(index + 1) % corners.length];
    const a = depthOf(from);
    const b = depthOf(to);
    if (a >= 0) hull.push(from);
    if (a >= 0 !== b >= 0) {
      const t = a / (a - b);
      hull.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
    }
  });
  if (hull.length < 3) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of hull) {
    const point = apply(inverse, x, y);
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  }
  return {
    fromColumn: Math.floor((minX + width / 2) / cellX - 0.5) - 1,
    toColumn: Math.ceil((maxX + width / 2) / cellX - 0.5) + 1,
    fromRow: Math.floor((minY + height / 2) / cellY - 0.5) - 1,
    toRow: Math.ceil((maxY + height / 2) / cellY - 0.5) + 1
  };
};

const MagnetLines = ({
  spacing = 30,
  rows,
  columns,
  containerSize,
  lineColor = '#efefef',
  accentColor,
  lineWidth = 2,
  lineHeight = 18,
  baseAngle = -10,
  mode = 'orbit',
  shape = 'line',
  rainbow = false,
  radius = 200,
  fade = 0.65,
  edgeFade = 0,
  stretch = 0.4,
  reach = 0,
  scatter = 0,
  inertia = 0.35,
  bounce = 0.3,
  ripple = 0.3,
  clickPulse = true,
  intro = true,
  idle = false,
  tiltX = 0,
  tiltY = 0,
  maxDevicePixelRatio = 2,
  className = '',
  style
}: MagnetLinesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const [generation, setGeneration] = useState(0);

  const size = typeof containerSize === 'number' ? `${containerSize}px` : containerSize;
  const square = Boolean(size);
  const color = parseColor(lineColor);
  const accent = accentColor ? parseColor(accentColor) : null;
  const settings: Settings = {
    square,
    spacing: Math.max(4, Number(spacing) || 30),
    rows: rows ? clamp(Math.round(rows), 1, 400) : 0,
    columns: columns ? clamp(Math.round(columns), 1, 400) : 0,
    lineWidth,
    lineHeight,
    baseAngle: (baseAngle * Math.PI) / 180,
    mode: MODES.includes(mode) ? mode : 'orbit',
    shape: SHAPES[shape] !== undefined ? shape : 'line',
    color,
    accent: accent ?? (shape === 'needle' ? parseColor('#f43f5e') : color),
    accentMix: accent ? 1 : 0,
    rainbow,
    tone: clamp(lightness(color), 0.42, 0.66),
    radius: Math.max(1, radius),
    fade: clamp(fade, 0, 1),
    edgeFade: clamp(edgeFade, 0, 1),
    stretch: clamp(stretch, 0, 2),
    reach: Math.max(0, reach),
    scatter: clamp(scatter, 0, 1),
    inertia: clamp(inertia, 0, 1),
    bounce: clamp(bounce, 0, 1),
    ripple: clamp(ripple, 0, 1),
    clickPulse,
    intro,
    idle,
    tiltX: clamp(tiltX, -70, 70),
    tiltY: clamp(tiltY, -70, 70),
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
    const probe = probeRef.current;
    if (!container || !canvas || !probe) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'default'
    });
    const program = gl ? link(gl) : null;
    if (!gl || !program) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const cornerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const centerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, centerBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);
    const stateBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, stateBuffer);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const field: Field = {
      width: 1,
      height: 1,
      pad: 0,
      ratio: 1,
      view: null,
      length: 20,
      thickness: 2,
      fill: true,
      edgePad: 1,
      minScale: 1,
      maxScale: 1,
      introSpeed: INTRO_SPEED,
      bounds: [0, 0, 0, 0],
      key: ''
    };
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, time: 0, seen: false, inside: false, away: 0 };
    const target = { x: 0, y: 0, heading: 0 };
    const pulses: Pulse[] = [];
    let count = 0;
    let centers = new Float32Array(0);
    let cells = new Int32Array(0);
    let reveal = new Float32Array(0);
    let rests = new Float32Array(0);
    let seeds = new Float32Array(0);
    let angles = new Float32Array(0);
    let speeds = new Float32Array(0);
    let seenX = new Float32Array(0);
    let seenY = new Float32Array(0);
    let pending = new Uint8Array(0);
    let state = new Float32Array(0);
    let introStart = -1;
    let introLive = settingsRef.current.intro && !reduced && generation === 0;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let visible = true;
    let pageVisible = document.visibilityState !== 'hidden';
    let lost = false;
    let dirty = true;

    const measure = (value: number | string) => {
      if (typeof value === 'number') return value;
      probe.style.width = String(value);
      return probe.getBoundingClientRect().width;
    };

    const layout = (
      width: number,
      height: number,
      view: View,
      columnCount: number,
      rowCount: number,
      tiled: boolean
    ) => {
      const cellX = width / columnCount;
      const cellY = height / rowCount;
      const range = tiled
        ? visibleRange(view, width, height, cellX, cellY)
        : { fromColumn: 0, toColumn: columnCount - 1, fromRow: 0, toRow: rowCount - 1 };
      const origin = apply(view.forward, 0, 0);
      const found: Candidate[] = [];
      if (range) {
        for (let row = range.fromRow; row <= range.toRow; row++) {
          const y = (row + 0.5) * cellY - height / 2;
          for (let column = range.fromColumn; column <= range.toColumn; column++) {
            const x = (column + 0.5) * cellX - width / 2;
            const [screenX, screenY, w] = apply(view.forward, x, y);
            if (tiled) {
              if (w <= 0 || w > FAR) continue;
              const margin = (0.49 * Math.min(cellX, cellY)) / w;
              if (screenX < -margin || screenX > width + margin || screenY < -margin || screenY > height + margin)
                continue;
            }
            found.push({ x, y, column, row, w, distance: Math.hypot(screenX - origin[0], screenY - origin[1]) });
          }
        }
      }
      if (found.length > MAX_LINES) {
        found.sort((a, b) => a.w - b.w);
        found.length = MAX_LINES;
      }

      const previous = new Map<number, number>();
      for (let index = 0; index < count; index++) previous.set(cells[index * 2] * 65536 + cells[index * 2 + 1], index);
      const total = found.length;
      const next = {
        centers: new Float32Array(total * 2),
        cells: new Int32Array(total * 2),
        reveal: new Float32Array(total),
        seeds: new Float32Array(total),
        rests: new Float32Array(total),
        angles: new Float32Array(total),
        speeds: new Float32Array(total),
        seenX: new Float32Array(total),
        seenY: new Float32Array(total),
        pending: new Uint8Array(total)
      };
      let farthest = 0;
      let nearest = Infinity;
      let deepest = 0;
      const bounds = [Infinity, Infinity, -Infinity, -Infinity];
      found.forEach((item, index) => {
        next.centers[index * 2] = item.x;
        next.centers[index * 2 + 1] = item.y;
        next.cells[index * 2] = item.column;
        next.cells[index * 2 + 1] = item.row;
        next.reveal[index] = item.distance;
        next.seeds[index] = seedFor(item.column, item.row);
        farthest = Math.max(farthest, item.distance);
        nearest = Math.min(nearest, item.w);
        deepest = Math.max(deepest, item.w);
        bounds[0] = Math.min(bounds[0], item.x);
        bounds[1] = Math.min(bounds[1], item.y);
        bounds[2] = Math.max(bounds[2], item.x);
        bounds[3] = Math.max(bounds[3], item.y);
        const old = previous.get(item.column * 65536 + item.row);
        if (old === undefined) {
          next.pending[index] = 1;
          return;
        }
        next.angles[index] = angles[old];
        next.speeds[index] = speeds[old];
        next.seenX[index] = seenX[old];
        next.seenY[index] = seenY[old];
      });

      count = total;
      ({ centers, cells, reveal, seeds, rests, angles, speeds, seenX, seenY, pending } = next);
      state = new Float32Array(total * 4);
      field.introSpeed = Math.max(INTRO_SPEED, farthest / INTRO_TIME);
      field.bounds = total ? bounds : [0, 0, 0, 0];
      field.minScale = total ? 1 / deepest : 1;
      field.maxScale = total ? 1 / nearest : 1;
      gl.bindBuffer(gl.ARRAY_BUFFER, centerBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, centers, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, stateBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, state.byteLength || 16, gl.DYNAMIC_DRAW);
    };

    const rebuild = () => {
      const s = settingsRef.current;
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const length = Math.max(1, measure(s.lineHeight));
      const thickness = Math.max(0.25, measure(s.lineWidth));
      const fill = !s.square;
      const tiled = fill && (s.tiltX !== 0 || s.tiltY !== 0);
      const view = viewFor(s.tiltX, s.tiltY, width, height, fill);
      const ratio = Math.min(window.devicePixelRatio || 1, s.maxRatio);

      let columnCount = Math.max(1, Math.round(s.columns || (s.rows ? (s.rows * width) / height : width / s.spacing)));
      let rowCount = Math.max(1, Math.round(s.rows || (s.columns ? (s.columns * height) / width : height / s.spacing)));
      if (columnCount * rowCount > MAX_LINES) {
        const shrink = Math.sqrt((columnCount * rowCount) / MAX_LINES);
        columnCount = Math.max(1, Math.floor(columnCount / shrink));
        rowCount = Math.max(1, Math.floor(rowCount / shrink));
      }

      const key = [
        fill,
        columnCount,
        rowCount,
        width.toFixed(1),
        height.toFixed(1),
        tiled ? `${s.tiltX},${s.tiltY}` : ''
      ].join('|');
      if (key !== field.key) {
        field.key = key;
        layout(width, height, view, columnCount, rowCount, tiled);
      }

      const minScale = fill ? field.minScale : view.minScale;
      const maxScale = fill ? field.maxScale : view.maxScale;
      const pad = fill ? 0 : Math.ceil((length * (1 + s.stretch) + thickness * 2) * Math.max(1, maxScale) + 8);
      const canvasWidth = width + pad * 2;
      const canvasHeight = height + pad * 2;
      canvas.style.left = `${-pad}px`;
      canvas.style.top = `${-pad}px`;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      const pixelWidth = Math.max(1, Math.round(canvasWidth * ratio));
      const pixelHeight = Math.max(1, Math.round(canvasHeight * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      Object.assign(field, {
        width,
        height,
        pad,
        ratio,
        view,
        length,
        thickness,
        fill,
        edgePad: 2 / (ratio * Math.max(0.05, minScale))
      });
    };

    const fieldAngle = (s: Settings, index: number, px: number, py: number) => {
      const dx = px - centers[index * 2];
      const dy = py - centers[index * 2 + 1];
      if (s.mode === 'dipole') {
        const distance = Math.hypot(dx, dy) || 1;
        const rx = -dx / distance;
        const ry = -dy / distance;
        const mx = Math.cos(target.heading);
        const my = Math.sin(target.heading);
        const dot = mx * rx + my * ry;
        return Math.atan2(3 * dot * ry - my, 3 * dot * rx - mx);
      }
      const toward = Math.atan2(dy, dx);
      if (s.mode === 'attract') return toward;
      if (s.mode === 'spiral') return toward + Math.PI / 4;
      return toward + Math.PI / 2;
    };

    const frame = (now: number) => {
      raf = 0;
      if (lost) return;
      const s = settingsRef.current;
      const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
      last = Math.max(last, now);
      clock += dt;
      if (dirty) rebuild();
      dirty = false;

      const period = s.shape === 'line' ? Math.PI : TAU;
      const spread = s.scatter * Math.PI * 0.5;
      for (let index = 0; index < count; index++) rests[index] = s.baseAngle + Math.PI / 2 + seeds[index] * spread;

      const wandering = s.idle && !reduced && (!pointer.seen || pointer.away > 1.2);
      if (pointer.seen && !pointer.inside) pointer.away += dt;
      let px = pointer.seen ? pointer.x : 0;
      let py = pointer.seen ? pointer.y : 0;
      if (wandering) {
        const amount = Math.min(field.width, field.height) * 0.32;
        px = Math.cos(clock * 0.37) * amount + Math.sin(clock * 0.21) * amount * 0.35;
        py = Math.sin(clock * 0.53 + 1.3) * amount * 0.8;
      }
      const follow = 1 - Math.exp(-dt / (pointer.seen && !wandering ? 0.035 : 0.6));
      target.x += (px - target.x) * follow;
      target.y += (py - target.y) * follow;
      const speed = Math.hypot(pointer.vx, pointer.vy);
      if (speed > 40) {
        const turn = wrap(Math.atan2(pointer.vy, pointer.vx) - target.heading, TAU);
        target.heading += turn * (1 - Math.exp(-dt / 0.25));
      }
      pointer.vx *= Math.exp(-dt / 0.12);
      pointer.vy *= Math.exp(-dt / 0.12);

      if (introLive && introStart < 0) introStart = clock;
      const introTime = introLive ? clock - introStart : Infinity;
      let introBusy = false;

      const stiffness = s.inertia <= 0 || reduced ? 0 : Math.pow(6 + 42 * Math.pow(1 - s.inertia, 2), 2);
      const damping = stiffness ? 2 * Math.sqrt(stiffness) * (1 - 0.75 * s.bounce) : 0;
      const steps = stiffness ? Math.max(1, Math.ceil(dt / (1 / 240))) : 0;
      const h = steps ? dt / steps : 0;
      const lag = reduced ? 0 : s.ripple / 900;
      const radius = s.radius;
      const reachIn = s.reach * 0.55;
      const reachOut = s.reach;

      for (let i = pulses.length - 1; i >= 0; i--) {
        const age = clock - pulses[i].start;
        if (age > pulses[i].life) pulses.splice(i, 1);
      }

      let moving = false;
      for (let index = 0; index < count; index++) {
        const cx = centers[index * 2];
        const cy = centers[index * 2 + 1];
        const born = pending[index] === 1;
        if (born) {
          seenX[index] = target.x;
          seenY[index] = target.y;
        } else {
          const distance = Math.hypot(target.x - cx, target.y - cy);
          const tau = lag * distance;
          const k = tau > 0 ? 1 - Math.exp(-dt / tau) : 1;
          seenX[index] += (target.x - seenX[index]) * k;
          seenY[index] += (target.y - seenY[index]) * k;
          if (Math.abs(target.x - seenX[index]) + Math.abs(target.y - seenY[index]) > 0.05) moving = true;
        }
        const sx = seenX[index];
        const sy = seenY[index];
        const near = Math.hypot(sx - cx, sy - cy);
        let goal = fieldAngle(s, index, sx, sy);
        const rest = rests[index];
        if (reachOut > 0) {
          const t = clamp((reachOut - near) / Math.max(1, reachOut - reachIn), 0, 1);
          goal = rest + wrap(goal - rest, period) * smootherstep(t);
        }
        let shown = 1;
        if (introLive) {
          const local = (introTime - reveal[index] / field.introSpeed) / INTRO_SPIN;
          const progress = smootherstep(clamp(local, 0, 1));
          if (local < 1) introBusy = true;
          goal = rest + wrap(goal - rest, period) * progress;
          shown = clamp(local * 2.5, 0, 1);
        }
        if (born) {
          angles[index] = introLive ? rest : goal;
          speeds[index] = 0;
          pending[index] = 0;
        } else if (!stiffness) {
          angles[index] = angles[index] + wrap(goal - angles[index], period);
          speeds[index] = 0;
        } else {
          let angle = angles[index];
          let velocity = speeds[index];
          for (let step = 0; step < steps; step++) {
            velocity += (stiffness * wrap(goal - angle, period) - damping * velocity) * h;
            angle += velocity * h;
          }
          if (Math.abs(velocity) < 0.002 && Math.abs(wrap(goal - angle, period)) < 0.0005) {
            angle += wrap(goal - angle, period);
            velocity = 0;
          } else moving = true;
          if (angle > 40 || angle < -40) angle = wrap(angle, TAU);
          angles[index] = angle;
          speeds[index] = velocity;
        }

        let spin = 0;
        let flash = 0;
        for (const pulse of pulses) {
          const travelled = (clock - pulse.start) * PULSE_SPEED;
          const gap = Math.hypot(cx - pulse.x, cy - pulse.y);
          const local = (travelled - gap) / (PULSE_SPEED * PULSE_SPIN);
          if (local > 0 && local < 1) spin += smootherstep(local) * period;
          const band = (travelled - gap - PULSE_SPEED * PULSE_SPIN * 0.5) / 60;
          flash += Math.exp(-band * band) * Math.max(0, 1 - (clock - pulse.start) / pulse.life);
        }

        const emphasis = Math.exp(-(near * near) / (radius * radius)) * shown;
        state[index * 4] = angles[index] + spin;
        state[index * 4 + 1] = emphasis;
        state[index * 4 + 2] = Math.min(1, flash * 0.9) * shown;
        state[index * 4 + 3] = shown;
      }
      if (introLive && !introBusy && clock - introStart > 0.2) introLive = false;
      if (Math.abs(px - target.x) + Math.abs(py - target.y) > 0.05) moving = true;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (count && field.view) {
        const u = program.uniforms;
        gl.useProgram(program.program);
        gl.uniformMatrix3fv(u.uView, true, field.view.forward);
        gl.uniform2f(u.uCanvas, field.width + field.pad * 2, field.height + field.pad * 2);
        gl.uniform2f(u.uOffset, field.pad, field.pad);
        gl.uniform2f(u.uLine, field.length / 2, field.thickness / 2);
        gl.uniform1f(u.uStretch, s.stretch);
        gl.uniform1f(u.uHead, s.shape === 'needle' ? 0.16 : s.shape === 'arrow' ? 0.32 : 0);
        gl.uniform1f(u.uPad, field.edgePad);
        gl.uniform1f(u.uFar, field.fill ? FAR : 1e6);
        gl.uniform3fv(u.uColor, s.color);
        gl.uniform3fv(u.uAccent, s.accent);
        gl.uniform1f(u.uAccentMix, s.accentMix);
        gl.uniform1f(u.uOpacity, 1);
        gl.uniform1f(u.uFade, s.fade);
        gl.uniform1i(u.uShape, SHAPES[s.shape]);
        gl.uniform1f(u.uRainbow, s.rainbow ? 1 : 0);
        gl.uniform1f(u.uTone, s.tone);
        gl.uniform1f(u.uPeriod, period);
        gl.uniform2f(u.uPixels, canvas.width, canvas.height);
        gl.uniform2f(u.uEdge, s.edgeFade * 0.34 * field.width, s.edgeFade * 0.44 * field.height);
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, stateBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, state);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      }

      const busy = moving || introLive || pulses.length > 0 || wandering;
      if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || lost || !visible || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = () => {
      dirty = true;
      wake();
    };

    const toPlane = (clientX: number, clientY: number) => {
      if (!field.view) return null;
      const rect = container.getBoundingClientRect();
      const [x, y, w] = apply(field.view.inverse, clientX - rect.left, clientY - rect.top);
      if (w <= 0) return null;
      const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      return { x, y, inside };
    };

    const onPointerMove = (event: PointerEvent) => {
      const spot = toPlane(event.clientX, event.clientY);
      if (!spot) return;
      const now = performance.now();
      const dt = Math.max(1, now - pointer.time) / 1000;
      if (pointer.seen && dt < 0.2) {
        pointer.vx = pointer.vx * 0.6 + ((spot.x - pointer.x) / dt) * 0.4;
        pointer.vy = pointer.vy * 0.6 + ((spot.y - pointer.y) / dt) * 0.4;
      }
      pointer.time = now;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.seen = true;
      pointer.inside = spot.inside;
      if (spot.inside) pointer.away = 0;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      onPointerMove(event);
      const s = settingsRef.current;
      if (!s.clickPulse || reduced || !count) return;
      const spot = toPlane(event.clientX, event.clientY);
      if (!spot) return;
      const inside = field.fill
        ? spot.inside
        : Math.abs(spot.x) <= field.width / 2 && Math.abs(spot.y) <= field.height / 2;
      if (!inside) return;
      const [minX, minY, maxX, maxY] = field.bounds;
      const farthest = Math.max(
        Math.hypot(spot.x - minX, spot.y - minY),
        Math.hypot(spot.x - maxX, spot.y - minY),
        Math.hypot(spot.x - minX, spot.y - maxY),
        Math.hypot(spot.x - maxX, spot.y - maxY)
      );
      pulses.push({
        x: spot.x,
        y: spot.y,
        start: clock,
        life: Math.min(6, farthest / PULSE_SPEED + PULSE_SPIN + 0.1)
      });
      if (pulses.length > 6) pulses.shift();
      wake();
    };

    const onLeave = () => {
      pointer.inside = false;
      wake();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
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
      dirty = true;
      wake();
    });
    resizeObserver.observe(container);
    const onResize = () => {
      dirty = true;
      wake();
    };
    window.addEventListener('resize', onResize);

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

    wake();

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        gl.deleteBuffer(cornerBuffer);
        gl.deleteBuffer(centerBuffer);
        gl.deleteBuffer(stateBuffer);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(program.program);
      }
    };
  }, [generation]);

  return (
    <div
      ref={containerRef}
      className={`relative ${square ? 'aspect-square max-w-full' : 'h-full w-full overflow-hidden'}${className ? ` ${className}` : ''}`}
      style={square ? { width: size, ...style } : style}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute block" aria-hidden="true" />
      <span ref={probeRef} className="pointer-events-none invisible absolute left-0 top-0 h-0" aria-hidden="true" />
    </div>
  );
};

export default MagnetLines;
