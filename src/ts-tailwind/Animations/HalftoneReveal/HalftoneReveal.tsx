'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

const DEFAULT_SRC = 'https://images.unsplash.com/photo-1693250707557-a846a014b321?q=80&w=1400&auto=format&fit=crop';

export type HalftoneRevealMode = 'mono' | 'duotone' | 'color';

export type HalftoneRevealShape = 'dot' | 'ellipse' | 'square' | 'diamond' | 'line' | 'cross';

export interface HalftoneRevealProps {
  src?: string;
  fit?: 'contain' | 'cover';
  mode?: HalftoneRevealMode;
  shape?: HalftoneRevealShape;
  cellSize?: number;
  angle?: number;
  dotScale?: number;
  inkColor?: string;
  accentColor?: string;
  paperColor?: string;
  contrast?: number;
  brightness?: number;
  invert?: boolean;
  roughness?: number;
  misregistration?: number;
  revealRadius?: number;
  softness?: number;
  linger?: number;
  reverse?: boolean;
  wander?: boolean;
  clickBurst?: boolean;
  intro?: boolean;
  className?: string;
  style?: CSSProperties;
}

type Settings = {
  fit: 'contain' | 'cover';
  mode: number;
  shape: number;
  cellSize: number;
  angle: number;
  dotScale: number;
  inkColor: string;
  accentColor: string;
  paperColor: string;
  contrast: number;
  brightness: number;
  invert: boolean;
  roughness: number;
  misregistration: number;
  revealRadius: number;
  softness: number;
  linger: number;
  reverse: boolean;
  wander: boolean;
  clickBurst: boolean;
  intro: boolean;
};

type MaskTarget = { texture: WebGLTexture | null; framebuffer: WebGLFramebuffer | null; width: number; height: number };

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const MASK = `#version 300 es
precision highp float;
uniform sampler2D uPrevious;
uniform vec2 uTexture;
uniform vec2 uView;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uSoftness;
uniform float uStrength;
uniform float uFade;
out vec4 outColor;

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  return length(p - a - ab * h);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uTexture;
  vec2 p = vec2(uv.x, 1.0 - uv.y) * uView;
  float trail = max(texture(uPrevious, uv).r - uFade, 0.0);
  float band = max(uRadius * uSoftness, 1.0);
  float brush = clamp((uRadius - segment(p, uFrom, uTo)) / band, 0.0, 1.0);
  brush = brush * brush * (3.0 - 2.0 * brush);
  outColor = vec4(max(trail, brush * uStrength), 0.0, 0.0, 1.0);
}`;

const VIEW = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uMask;
uniform vec2 uResolution;
uniform vec2 uView;
uniform float uDpr;
uniform vec4 uFrame;
uniform float uTexels;
uniform float uMode;
uniform float uShape;
uniform float uCell;
uniform float uAngle;
uniform float uScale;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform vec3 uPaper;
uniform float uContrast;
uniform float uBrightness;
uniform float uInvert;
uniform float uRough;
uniform float uShift;
uniform vec3 uMatte;
uniform float uKey;
uniform float uReverse;
uniform float uIntro;
uniform vec4 uBursts[4];
uniform float uBurstWidth;
out vec4 outColor;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const vec3 CYAN = vec3(0.0, 0.64, 0.93);
const vec3 MAGENTA = vec3(0.92, 0.07, 0.56);
const vec3 YELLOW = vec3(1.0, 0.91, 0.0);
const vec3 KEY = vec3(0.11, 0.1, 0.12);
const vec3 RED = vec3(1.0, 0.16, 0.12);
const vec3 GREEN = vec3(0.12, 1.0, 0.3);
const vec3 BLUE = vec3(0.16, 0.32, 1.0);

mat2 rotate(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec4 photo(vec2 p, float lod, float margin) {
  vec2 uv = (p - uFrame.xy) / uFrame.zw;
  vec4 c = textureLod(uImage, clamp(uv, 0.0, 1.0), lod);
  vec2 slack = margin * uCell / uFrame.zw;
  vec2 inside = step(-slack, uv) * step(uv, 1.0 + slack);
  float keep = inside.x * inside.y * c.a;
  keep *= mix(1.0, smoothstep(0.05, 0.2, distance(c.rgb, uMatte)), uKey);
  return vec4(c.rgb, keep);
}

float grade(float v) {
  v = clamp((v - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0);
  return mix(v, 1.0 - v, uInvert);
}

vec3 gradeColor(vec3 c) {
  return vec3(grade(c.r), grade(c.g), grade(c.b));
}

vec3 tone(vec3 c) {
  return pow(max(c, 0.0), vec3(1.5));
}

float press(float t, float alpha) {
  return (0.05 + clamp(t, 0.0, 1.0) * 0.89) * alpha;
}

float plate(float t, float alpha) {
  return (0.02 + clamp(t, 0.0, 1.0) * 0.92) * alpha;
}

vec3 decode(vec3 c) {
  return pow(max(c, 0.0), vec3(2.2));
}

vec4 separate(vec3 color) {
  vec3 target = clamp(tone(gradeColor(color)) / max(tone(uPaper), vec3(0.02)), 0.0, 1.0);
  vec3 absorbC = 1.0 - decode(CYAN);
  vec3 absorbM = 1.0 - decode(MAGENTA);
  vec3 absorbY = 1.0 - decode(YELLOW);
  float bright = pow(max(max(target.r, target.g), target.b), 0.4545);
  float key = pow(clamp(1.0 - bright / 0.62, 0.0, 1.0), 1.4) * 0.95;
  vec3 rest = clamp(target / max(1.0 - key * (1.0 - decode(KEY)), vec3(0.03)), 0.0, 1.0);
  vec3 a = 1.0 - rest;
  for (int i = 0; i < 3; i++) {
    vec3 tc = 1.0 - a.x * absorbC;
    vec3 tm = 1.0 - a.y * absorbM;
    vec3 ty = 1.0 - a.z * absorbY;
    mat3 slope = mat3(-absorbC * tm * ty, -absorbM * tc * ty, -absorbY * tc * tm);
    if (abs(determinant(slope)) < 1e-6) break;
    a = clamp(a - inverse(slope) * (tc * tm * ty - rest), 0.0, 1.0);
  }
  return vec4(a, key);
}

vec3 emit(vec3 color) {
  vec3 target = max(tone(gradeColor(color)) - tone(uPaper), 0.0);
  mat3 lights = mat3(decode(RED), decode(GREEN), decode(BLUE));
  return clamp(inverse(lights) * target, 0.0, 1.0);
}

float metric(vec2 f) {
  if (uShape < 0.5) return length(f);
  if (uShape < 1.5) return length(f * vec2(0.8, 1.15));
  if (uShape < 2.5) return max(abs(f.x), abs(f.y));
  if (uShape < 3.5) return abs(f.x) + abs(f.y);
  if (uShape < 4.5) return abs(f.y);
  return min(abs(f.x), abs(f.y));
}

float reach(float t) {
  t = clamp(t, 0.0, 1.0);
  if (uShape < 0.5) return t < 0.785 ? sqrt(t / 3.14159) : mix(0.5, 0.72, (t - 0.785) / 0.215);
  if (uShape < 1.5) return t < 0.7 ? sqrt(t * 0.92 / 3.14159) : mix(0.4497, 0.72, (t - 0.7) / 0.3);
  if (uShape < 2.5) return 0.5 * sqrt(t) + 0.02 * t;
  if (uShape < 3.5) return t < 0.5 ? sqrt(t * 0.5) : 1.0 - sqrt((1.0 - t) * 0.5);
  if (uShape < 4.5) return 0.52 * t;
  return (1.0 - sqrt(1.0 - t)) * 0.5 + 0.02 * t;
}

vec2 center(vec2 p, float angle) {
  vec2 q = rotate(angle) * p / uCell;
  vec2 c = floor(q) + 0.5;
  if (uShape > 3.5 && uShape < 4.5) c.x = q.x;
  return rotate(-angle) * c * uCell;
}

float dots(vec2 p, float angle, float t, float seed, float grow) {
  vec2 q = rotate(angle) * p / uCell;
  float d = metric(fract(q) - 0.5);
  d += (noise(p * 0.42 + seed * 17.0) - 0.5) * uRough * 0.18;
  float r = reach(t) * uScale * grow;
  float w = max(fwidth(d), 0.0001) * 0.75;
  return smoothstep(r + w, r - w, d) * clamp(r / (w * 2.0), 0.0, 1.0);
}

float coverage(vec4 image) {
  float shade = dot(tone(gradeColor(image.rgb)), LUMA);
  float paper = dot(tone(uPaper), LUMA);
  float span = dot(tone(uInk), LUMA) - paper;
  float t = abs(span) < 0.02 ? 1.0 - shade : (shade - paper) / span;
  return press(t, image.a);
}

float burst(vec2 p) {
  float value = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 b = uBursts[i];
    if (b.w <= 0.0) continue;
    float offset = distance(p, b.xy) - b.z;
    float edge = offset > 0.0 ? offset / (uBurstWidth * 0.35) : -offset / uBurstWidth;
    value = max(value, clamp(1.0 - edge, 0.0, 1.0) * b.w);
  }
  return value;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  float lod = log2(max(uCell * uTexels, 1.0));
  float base = uAngle;
  vec2 drift = vec2(uShift, uShift * -0.6);

  vec2 field = p / max(uView.x, uView.y) - uView / max(uView.x, uView.y) * 0.5;
  float delay = length(field) * 1.15 + hash(floor(p / uCell)) * 0.06;
  float grow = smoothstep(0.0, 1.0, clamp((uIntro * 1.7 - delay) / 0.45, 0.0, 1.0));

  vec3 print = uPaper;
  if (uMode < 0.5) {
    float k = dots(p, base, coverage(photo(center(p, base), lod, 0.5)), 0.0, grow);
    print = mix(uPaper, uInk, k);
  } else if (uMode < 1.5) {
    float second = base + 0.5236;
    float tA = coverage(photo(center(p, base), lod, 0.5));
    float tB = coverage(photo(center(p + drift, second) - drift, lod, 0.5));
    float kA = dots(p, base, pow(tA, 1.9), 0.0, grow);
    float kB = dots(p + drift, second, clamp(tB * 1.3, 0.0, 1.0) * 0.8, 1.0, grow);
    if (dot(uPaper, LUMA) > 0.5) {
      print = uPaper * mix(vec3(1.0), uAccent, kB) * mix(vec3(1.0), uInk, kA);
    } else {
      print = min(uPaper + uAccent * kB + uInk * kA, vec3(1.0));
    }
  } else if (dot(uPaper, LUMA) > 0.5) {
    float ac = base - 0.5236;
    float am = base + 0.5236;
    float ay = base - 0.7854;
    vec4 sc = photo(center(p + drift, ac) - drift, lod, 0.5);
    vec4 sm = photo(center(p - drift, am) + drift, lod, 0.5);
    vec4 sy = photo(center(p + drift.yx, ay) - drift.yx, lod, 0.5);
    vec4 sk = photo(center(p, base), lod, 0.5);
    float kc = sc.a > 0.0 ? dots(p + drift, ac, plate(separate(sc.rgb).x, sc.a), 1.0, grow) : 0.0;
    float km = sm.a > 0.0 ? dots(p - drift, am, plate(separate(sm.rgb).y, sm.a), 2.0, grow) : 0.0;
    float ky = sy.a > 0.0 ? dots(p + drift.yx, ay, plate(separate(sy.rgb).z, sy.a), 3.0, grow) : 0.0;
    float kk = sk.a > 0.0 ? dots(p, base, plate(separate(sk.rgb).w, sk.a), 4.0, grow) : 0.0;
    print = uPaper;
    print *= mix(vec3(1.0), CYAN, kc);
    print *= mix(vec3(1.0), MAGENTA, km);
    print *= mix(vec3(1.0), YELLOW, ky);
    print *= mix(vec3(1.0), KEY, kk);
  } else {
    float ar = base - 0.5236;
    float ag = base + 0.5236;
    vec4 sr = photo(center(p + drift, ar) - drift, lod, 0.5);
    vec4 sg = photo(center(p - drift, ag) + drift, lod, 0.5);
    vec4 sb = photo(center(p, base), lod, 0.5);
    float kr = dots(p + drift, ar, plate(emit(sr.rgb).x, sr.a), 1.0, grow);
    float kg = dots(p - drift, ag, plate(emit(sg.rgb).y, sg.a), 2.0, grow);
    float kb = dots(p, base, plate(emit(sb.rgb).z, sb.a), 3.0, grow);
    print = min(uPaper + RED * kr + GREEN * kg + BLUE * kb, vec3(1.0));
  }

  vec2 maskUv = vec2(p.x / uView.x, 1.0 - p.y / uView.y);
  float shown = max(texture(uMask, maskUv).r, burst(p));
  shown = mix(shown, 1.0 - shown, uReverse);
  shown = shown * shown * (3.0 - 2.0 * shown);
  vec2 q = rotate(base) * p / uCell;
  float d = metric(fract(q) - 0.5);
  float r = reach(1.0) * 1.08 * shown;
  float w = max(fwidth(d), 0.0001) * 0.75;
  float k = smoothstep(r + w, r - w, d) * clamp(r / (w * 2.0), 0.0, 1.0);
  vec4 sharp = photo(p, 0.0, 0.0);
  vec3 real = mix(uPaper, sharp.rgb, sharp.a);
  outColor = vec4(mix(print, real, k), 1.0);
}`;

const MODES: Record<string, number> = { mono: 0, duotone: 1, color: 2 };
const SHAPES: Record<string, number> = { dot: 0, ellipse: 1, square: 2, diamond: 3, line: 4, cross: 5 };
const MAX_BURSTS = 4;
const BURST_SECONDS = 1.3;
const INTRO_SECONDS = 1.4;
const MASK_SCALE = 0.5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (gl: WebGL2RenderingContext, fragmentSource: string) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
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

const locate = (gl: WebGL2RenderingContext, program: WebGLProgram, names: string[]) => {
  const result: Record<string, WebGLUniformLocation | null> = {};
  for (const name of names) result[name] = gl.getUniformLocation(program, name);
  return result;
};

const wanderAt = (t: number, w: number, h: number): [number, number] => [
  w * (0.5 + 0.32 * Math.sin(t * 0.53) + 0.08 * Math.sin(t * 1.31 + 0.6)),
  h * (0.5 + 0.27 * Math.sin(t * 0.71 + 1.1) + 0.07 * Math.cos(t * 1.57))
];

const measureEdge = (context: CanvasRenderingContext2D, image: HTMLImageElement) => {
  const size = 32;
  context.canvas.width = size;
  context.canvas.height = size;
  context.clearRect(0, 0, size, size);
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  const sum: number[] = [0, 0, 0];
  const squares: number[] = [0, 0, 0];
  let count = 0;
  let clear = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x > 0 && y > 0 && x < size - 1 && y < size - 1) continue;
      const i = (y * size + x) * 4;
      if (data[i + 3] < 250) clear++;
      for (let c = 0; c < 3; c++) {
        const v = data[i + c] / 255;
        sum[c] += v;
        squares[c] += v * v;
      }
      count++;
    }
  }
  const matte = [sum[0] / count, sum[1] / count, sum[2] / count];
  const spread =
    matte.reduce((total, mean, c) => total + Math.sqrt(Math.max(0, squares[c] / count - mean * mean)), 0) / 3;
  return { matte, plain: clear < count * 0.5 && spread < 0.06 };
};

const HalftoneReveal = ({
  src = DEFAULT_SRC,
  fit = 'cover',
  mode = 'mono',
  shape = 'dot',
  cellSize = 6,
  angle = 45,
  dotScale = 1,
  inkColor = '#120f17',
  accentColor = '#ff4f2a',
  paperColor = '#ffffff',
  contrast = 1.1,
  brightness = 0,
  invert = false,
  roughness = 0,
  misregistration = 0,
  revealRadius = 160,
  softness = 0.6,
  linger = 1.2,
  reverse = false,
  wander = false,
  clickBurst = true,
  intro = true,
  className = '',
  style
}: HalftoneRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    fit,
    mode: MODES[mode] ?? 0,
    shape: SHAPES[shape] ?? 0,
    cellSize: clamp(cellSize, 2, 80),
    angle,
    dotScale: clamp(dotScale, 0.2, 2),
    inkColor: String(inkColor),
    accentColor: String(accentColor),
    paperColor: String(paperColor),
    contrast,
    brightness,
    invert,
    roughness: clamp(roughness, 0, 1),
    misregistration: clamp(misregistration, 0, 1),
    revealRadius: Math.max(0, revealRadius),
    softness: clamp(softness, 0, 1),
    linger: Math.max(0, linger),
    reverse,
    wander,
    clickBurst,
    intro
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false
    });
    if (!container || !canvas || !gl) return undefined;

    const maskProgram = link(gl, MASK);
    const viewProgram = link(gl, VIEW);
    if (!maskProgram || !viewProgram) return undefined;
    const maskUniforms = locate(gl, maskProgram, [
      'uPrevious',
      'uTexture',
      'uView',
      'uFrom',
      'uTo',
      'uRadius',
      'uSoftness',
      'uStrength',
      'uFade'
    ]);
    const viewUniforms = locate(gl, viewProgram, [
      'uImage',
      'uMask',
      'uResolution',
      'uView',
      'uDpr',
      'uFrame',
      'uTexels',
      'uMode',
      'uShape',
      'uCell',
      'uAngle',
      'uScale',
      'uInk',
      'uAccent',
      'uPaper',
      'uContrast',
      'uBrightness',
      'uInvert',
      'uRough',
      'uShift',
      'uMatte',
      'uKey',
      'uReverse',
      'uIntro',
      'uBursts',
      'uBurstWidth'
    ]);

    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const floatMask = !!gl.getExtension('EXT_color_buffer_float');
    const imageTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const createMask = (width: number, height: number): MaskTarget => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (floatMask) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { texture, framebuffer, width, height };
    };
    const destroyMask = (target: MaskTarget) => {
      gl.deleteFramebuffer(target.framebuffer);
      gl.deleteTexture(target.texture);
    };
    let masks = [createMask(2, 2), createMask(2, 2)];

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const colorCache = new Map<string, number[]>();
    const bursts: { x: number; y: number; start: number }[] = [];
    const burstData = new Float32Array(MAX_BURSTS * 4);
    const pointer = { x: 0, y: 0, inside: false, fresh: true, placed: false };
    const brush = { x: 0, y: 0, px: 0, py: 0 };
    const state = {
      width: 1,
      height: 1,
      dpr: 1,
      image: null as HTMLImageElement | null,
      matte: [0, 0, 0] as number[],
      key: 0,
      introStart: 0,
      presence: 0,
      drift: 0,
      trailUntil: 0
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;

    const toRgb = (value: string): number[] => {
      const cached = colorCache.get(value);
      if (cached) return cached;
      let rgb = [0, 0, 0];
      if (probe && value) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r / 255, g / 255, b / 255];
      }
      colorCache.set(value, rgb);
      return rgb;
    };

    const frameRect = (s: Settings) => {
      const { image, width, height } = state;
      if (!image) return [0, 0, width, height];
      const scale = (s.fit === 'cover' ? Math.max : Math.min)(width / image.naturalWidth, height / image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      return [(width - w) / 2, (height - h) / 2, w, h];
    };

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.width = width;
      state.height = height;
      state.dpr = dpr;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      const mw = Math.max(2, Math.round(width * MASK_SCALE));
      const mh = Math.max(2, Math.round(height * MASK_SCALE));
      if (mw !== masks[0].width || mh !== masks[0].height) {
        masks.forEach(destroyMask);
        masks = [createMask(mw, mh), createMask(mw, mh)];
      }
      if (!pointer.placed) {
        pointer.x = width / 2;
        pointer.y = height / 2;
      }
      wake();
    };

    const drawMask = (s: Settings, dt: number) => {
      const minimum = floatMask ? 0 : 1.5 / 255;
      gl.bindFramebuffer(gl.FRAMEBUFFER, masks[1].framebuffer);
      gl.viewport(0, 0, masks[1].width, masks[1].height);
      gl.useProgram(maskProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, masks[0].texture);
      gl.uniform1i(maskUniforms.uPrevious, 0);
      gl.uniform2f(maskUniforms.uTexture, masks[1].width, masks[1].height);
      gl.uniform2f(maskUniforms.uView, state.width, state.height);
      gl.uniform2f(maskUniforms.uFrom, brush.px, brush.py);
      gl.uniform2f(maskUniforms.uTo, brush.x, brush.y);
      gl.uniform1f(maskUniforms.uRadius, s.revealRadius * (0.45 + 0.55 * state.presence));
      gl.uniform1f(maskUniforms.uSoftness, s.softness);
      gl.uniform1f(maskUniforms.uStrength, state.presence);
      gl.uniform1f(maskUniforms.uFade, Math.max(s.linger > 0 ? dt / s.linger : 1, minimum));
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      masks.reverse();
    };

    const drawView = (s: Settings, now: number) => {
      const [fx, fy, fw, fh] = frameRect(s);
      const image = state.image;
      const intro = !image ? 0 : !s.intro || reduce ? 1 : Math.min(1, (now - state.introStart) / 1000 / INTRO_SECONDS);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(viewProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.uniform1i(viewUniforms.uImage, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, masks[0].texture);
      gl.uniform1i(viewUniforms.uMask, 1);
      gl.uniform2f(viewUniforms.uResolution, canvas.width, canvas.height);
      gl.uniform2f(viewUniforms.uView, state.width, state.height);
      gl.uniform1f(viewUniforms.uDpr, canvas.width / state.width);
      gl.uniform4f(viewUniforms.uFrame, fx, fy, fw, fh);
      gl.uniform1f(viewUniforms.uTexels, image ? image.naturalWidth / fw : 1);
      gl.uniform1f(viewUniforms.uMode, s.mode);
      gl.uniform1f(viewUniforms.uShape, s.shape);
      gl.uniform1f(viewUniforms.uCell, s.cellSize);
      gl.uniform1f(viewUniforms.uAngle, (s.angle * Math.PI) / 180);
      gl.uniform1f(viewUniforms.uScale, s.dotScale);
      gl.uniform3fv(viewUniforms.uInk, toRgb(s.inkColor));
      gl.uniform3fv(viewUniforms.uAccent, toRgb(s.accentColor));
      gl.uniform3fv(viewUniforms.uPaper, toRgb(s.paperColor));
      gl.uniform1f(viewUniforms.uContrast, s.contrast);
      gl.uniform1f(viewUniforms.uBrightness, s.brightness);
      gl.uniform1f(viewUniforms.uInvert, s.invert ? 1 : 0);
      gl.uniform1f(viewUniforms.uRough, s.roughness);
      gl.uniform1f(viewUniforms.uShift, s.misregistration * s.cellSize * 0.35);
      gl.uniform3fv(viewUniforms.uMatte, state.matte);
      gl.uniform1f(viewUniforms.uKey, state.key);
      gl.uniform1f(viewUniforms.uReverse, s.reverse ? 1 : 0);
      gl.uniform1f(viewUniforms.uIntro, 1 - (1 - intro) * (1 - intro));
      gl.uniform4fv(viewUniforms.uBursts, burstData);
      gl.uniform1f(viewUniforms.uBurstWidth, Math.max(60, s.revealRadius * 0.9));
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      return intro;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 1 / 60;
      last = now;

      const wandering = s.wander && !reduce;
      let targetX = pointer.x;
      let targetY = pointer.y;
      if (!pointer.inside && wandering) {
        state.drift = Math.min(1, state.drift + dt / 1.2);
        const [wx, wy] = wanderAt(now / 1000, state.width, state.height);
        const k = state.drift * state.drift * (3 - 2 * state.drift);
        targetX += (wx - targetX) * k;
        targetY += (wy - targetY) * k;
      } else {
        state.drift = 0;
      }
      const engaged = pointer.inside || wandering;
      state.presence += ((engaged ? 1 : 0) - state.presence) * (1 - Math.exp(-dt / 0.16));
      if (pointer.fresh) {
        brush.x = brush.px = targetX;
        brush.y = brush.py = targetY;
        pointer.fresh = false;
      } else {
        const follow = 1 - Math.exp(-dt / 0.035);
        brush.x += (targetX - brush.x) * follow;
        brush.y += (targetY - brush.y) * follow;
      }

      burstData.fill(0);
      for (let i = bursts.length - 1; i >= 0; i--) {
        if ((now - bursts[i].start) / 1000 >= BURST_SECONDS) bursts.splice(i, 1);
      }
      bursts.forEach((b, i) => {
        const k = Math.max(0, (now - b.start) / 1000 / BURST_SECONDS);
        const reach = Math.hypot(Math.max(b.x, state.width - b.x), Math.max(b.y, state.height - b.y)) + 80;
        burstData[i * 4] = b.x;
        burstData[i * 4 + 1] = b.y;
        burstData[i * 4 + 2] = reach * Math.sin((k * Math.PI) / 2);
        burstData[i * 4 + 3] = 1 - k * k * k;
      });

      if (state.presence > 0.002) state.trailUntil = now + s.linger * 1000 + 200;
      drawMask(s, dt);
      brush.px = brush.x;
      brush.py = brush.y;
      const intro = drawView(s, now);

      const busy =
        engaged || state.presence > 0.002 || bursts.length > 0 || now < state.trailUntil || (state.image && intro < 1);
      if (busy) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      if (!alive) return;
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      const sampler = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      if (sampler) {
        try {
          const edge = measureEdge(sampler, image);
          state.matte = edge.matte;
          state.key = edge.plain ? 1 : 0;
        } catch {
          state.key = 0;
        }
      }
      state.image = image;
      state.introStart = performance.now();
      wake();
    };
    image.src = src;

    const locatePointer = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.placed = true;
    };
    const onMove = (event: PointerEvent) => {
      locatePointer(event);
      if (!pointer.inside) {
        pointer.inside = true;
        pointer.fresh = true;
      }
      wake();
    };
    const onLeave = () => {
      pointer.inside = false;
      wake();
    };
    const onDown = (event: PointerEvent) => {
      onMove(event);
      if (!settingsRef.current.clickBurst || (event.pointerType === 'mouse' && event.button !== 0)) return;
      bursts.push({ x: pointer.x, y: pointer.y, start: performance.now() });
      if (bursts.length > MAX_BURSTS) bursts.shift();
    };
    const onVisibility = () => {
      last = 0;
      wake();
    };

    container.addEventListener('pointermove', onMove, { passive: true });
    container.addEventListener('pointerenter', onMove, { passive: true });
    container.addEventListener('pointerdown', onDown, { passive: true });
    container.addEventListener('pointerleave', onLeave, { passive: true });
    container.addEventListener('pointercancel', onLeave, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
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
    resize();

    wakeRef.current = () => {
      if (!raf && alive && visible) {
        drawView(settingsRef.current, performance.now());
        wake();
      }
    };

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      image.onload = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerenter', onMove);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('pointercancel', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      masks.forEach(destroyMask);
      gl.deleteTexture(imageTexture);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(maskProgram);
      gl.deleteProgram(viewProgram);
    };
  }, [src]);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={containerRef}
      className={['relative h-full w-full overflow-hidden', className].filter(Boolean).join(' ')}
      style={style}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
};

export default HalftoneReveal;
