'use client';

import { useEffect, useRef, useState } from 'react';

import './HoloMosaic.css';

const MAX_WAVES = 6;
const MAX_RENDER_DIM = 2400;
const TILE_PX = 52;
const EYE = 1.15;
const INTRO_SECONDS = 2.4;
const WAVE_SECONDS = 4;
const FILTERS = { none: 0, dither: 1, ascii: 2 };

const SPECTRUMS = {
  full: [400, 700, 0],
  warm: [565, 700, 0],
  cool: [405, 565, 0],
  pearl: [420, 690, 0.55]
};

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uPixel;
uniform float uTime;
uniform float uClock;
uniform float uTile;
uniform vec2 uRot;
uniform float uGap;
uniform float uRound;
uniform float uBevel;
uniform float uScatter;
uniform float uTilt;
uniform float uSwirl;
uniform float uRipple;
uniform float uBands;
uniform float uSoft;
uniform float uIntensity;
uniform float uSaturation;
uniform vec3 uSpectrum;
uniform float uGlitter;
uniform float uSheen;
uniform float uGrain;
uniform vec3 uColor;
uniform vec3 uMetal;
uniform vec2 uLight;
uniform vec4 uHover;
uniform vec4 uWaves[${MAX_WAVES}];
uniform vec4 uIntro;
uniform float uFade;
uniform float uOpacity;
uniform float uLightMode;
uniform float uSeed;
uniform float uFrame;
uniform float uFilter;
uniform float uFilterSize;
out vec4 outColor;

float h21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float h31(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

float vn3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y),
    f.z
  );
}

vec3 bump3y(vec3 x, vec3 yo) {
  return clamp(1.0 - x * x - yo, 0.0, 1.0);
}

vec3 spectral(float w) {
  float x = clamp((w - 400.0) / 300.0, 0.0, 1.0);
  vec3 c1 = vec3(3.54585104, 2.93225262, 2.41593945);
  vec3 x1 = vec3(0.69549072, 0.49228336, 0.27699880);
  vec3 y1 = vec3(0.02312639, 0.15225084, 0.52607955);
  vec3 c2 = vec3(3.90307140, 3.21182957, 3.96587128);
  vec3 x2 = vec3(0.11748627, 0.86755042, 0.66077860);
  vec3 y2 = vec3(0.84897130, 0.88445281, 0.73949448);
  return bump3y(c1 * (x - x1), y1) + bump3y(c2 * (x - x2), y2);
}

vec3 band(float lam) {
  float window = smoothstep(380.0, 425.0, lam) * (1.0 - smoothstep(680.0, 780.0, lam));
  if (window <= 0.0) return vec3(0.0);
  return spectral(mix(uSpectrum.x, uSpectrum.y, clamp((lam - 380.0) / 400.0, 0.0, 1.0))) * window;
}

float boxDist(vec2 p, float b, float r, out vec2 grad) {
  vec2 q = abs(p) - b + r;
  vec2 m = max(q, 0.0);
  float outside = length(m);
  vec2 sg = vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
  grad = outside > 0.0 ? sg * m / outside : sg * (q.x > q.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0));
  return outside + min(max(q.x, q.y), 0.0) - r;
}

vec4 shade(vec2 frag, float solid) {
  vec2 c = frag - 0.5 * uRes;
  vec2 s = c / uRes.y;
  vec2 g = vec2(uRot.x * c.x + uRot.y * c.y, uRot.x * c.y - uRot.y * c.x) / uTile;
  vec2 id = floor(g);
  vec2 f = g - id - 0.5;
  vec2 gc = (id + 0.5) * uTile;
  vec2 cell = vec2(uRot.x * gc.x - uRot.y * gc.y, uRot.y * gc.x + uRot.x * gc.y) / uRes.y;
  vec2 seed = vec2(uSeed * 17.13, uSeed * 31.71);
  float h1 = h21(id + seed);
  float h2 = h21(id + seed + 19.7);
  float h3 = h21(id + seed + 41.3);

  float flip = 0.0;
  float presence = 1.0;
  if (uIntro.w > 0.0) {
    float k = clamp((uIntro.z - length(cell - uIntro.xy) * 0.85 - h1 * 0.22) / 0.75, 0.0, 1.0);
    float e = k * k * k * (k * (k * 6.0 - 15.0) + 10.0);
    flip = (1.0 - e) * 1.5707963;
    presence = e;
  }
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    vec4 w = uWaves[i];
    if (w.w <= 0.0) continue;
    float k = clamp(((uClock - w.z) * 0.95 - length(cell - w.xy)) / 0.2, 0.0, 1.0);
    flip += k * k * (3.0 - 2.0 * k) * 3.1415927;
  }

  float ca = cos(flip);
  float sa = sin(flip);
  float squash = max(abs(ca), 0.02);
  float half_ = 0.5 - 0.5 * uGap;
  vec2 grad;
  float d = boxDist(vec2(f.x / squash, f.y), half_, uRound * half_, grad);
  float aa = 1.2 / uTile;
  float aaD = mix(aa, aa / squash, abs(grad.x));
  float cover = mix((1.0 - smoothstep(-aaD, aaD, d)) * smoothstep(0.02, 0.08, abs(ca)), 1.0, solid);
  float alpha = cover * uOpacity;
  if (uFade > 0.0) {
    vec2 uv = frag / uRes;
    vec2 m = clamp(min(uv, 1.0 - uv) / max(uFade * 0.5, 1e-4), 0.0, 1.0);
    m = m * m * m * (m * (m * 6.0 - 15.0) + 10.0);
    alpha *= m.x * m.y;
  }
  if (alpha <= 0.002) return vec4(0.0);

  float edge = smoothstep(-0.02 - 0.07 * uBevel, 0.0, d) * uBevel;
  float inner = smoothstep(0.0, -0.09, d);
  vec3 n = normalize(vec3((vec2(h2, h3) - 0.5) * (0.5 * uTilt) + grad * edge * 0.55, 1.0));
  n = vec3(n.x * ca + n.z * sa, n.y, abs(n.z * ca - n.x * sa));
  vec3 N = vec3(uRot.x * n.x - uRot.y * n.y, uRot.y * n.x + uRot.x * n.y, n.z);
  vec2 hv = cell - uHover.xy;
  float hw = exp(-dot(hv, hv) / (uHover.z * uHover.z)) * uHover.w;
  N = normalize(N + vec3(-hv / uHover.z * hw * 1.3, 0.0));
  float turn = abs(sin(flip));

  float t = uTime;
  float flow = vn3(vec3(s * (1.4 * uSwirl) + seed * 0.013, t * 0.05));
  vec2 rc = vec2(0.15 + 0.22 * sin(t * 0.07), -0.05 + 0.16 * cos(t * 0.053));
  float rip = sin(length(s - rc) * 26.0 - t * 1.2) * 0.5 + 0.5;
  float phi = 6.2831853 * mix(flow, h1, uScatter) + uRipple * 0.9 * rip;
  vec3 T = vec3(cos(phi), sin(phi), 0.0);
  T = normalize(T - dot(T, N) * N);
  vec3 V = normalize(vec3(-s, ${EYE.toFixed(1)}));
  vec3 L = normalize(vec3(uLight, 1.0));
  float D = 1450.0 * uBands;
  vec3 sh = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float a = float(k) * 2.39996 + 0.7;
    vec3 Lk = normalize(vec3(uLight + vec2(cos(a), sin(a)) * sqrt((float(k) + 0.5) / 3.0) * uSoft, 1.0));
    float x = abs(dot(Lk + V, T)) * D;
    sh += band(x) + 0.6 * band(x * 0.5);
  }
  sh *= presence * (0.62 + 0.38 * inner) / 3.0;
  float lum = dot(sh, vec3(0.2126, 0.7152, 0.0722));
  sh = mix(vec3(lum), sh, uSaturation);
  sh = mix(sh, vec3(lum * 1.15 + 0.08 * presence), uSpectrum.z * 0.6);

  vec3 H = normalize(L + V);
  float ndh = max(dot(N, H), 0.0);
  float wide = pow(ndh, 34.0);
  float tight = pow(ndh, 700.0);
  vec2 spot = uLight * ${EYE.toFixed(1)};
  float pool = pow(max(1.0 - length(s - spot) * 2.1, 0.0), 2.5) * uSheen;

  float spark = 0.0;
  vec3 sparkColor = vec3(1.0);
  if (uGlitter > 0.0) {
    vec2 gq = frag / (uPixel * 6.0);
    vec2 gid = floor(gq) + seed;
    float gh = h21(gid + 3.7);
    if (gh < 0.05 + 0.25 * uGlitter) {
      vec2 off = vec2(h21(gid + 1.3), h21(gid + 5.9)) - 0.5;
      float r = length(fract(gq) - 0.5 - off * 0.45);
      vec3 gn = normalize(vec3((vec2(h21(gid + 9.1), h21(gid + 2.2)) - 0.5) * 0.7 + N.xy, 1.0));
      float twinkle = 0.55 + 0.45 * sin(t * (2.0 + 5.0 * gh) + gh * 70.0);
      spark = smoothstep(0.991, 0.9995, dot(gn, H)) * (1.0 - smoothstep(0.07, 0.24, r)) * twinkle * presence * uGlitter;
      sparkColor = spectral(420.0 + 260.0 * h21(gid + 7.7));
    }
  }

  float grainNoise = h31(vec3(floor(frag / uPixel), uFrame)) - 0.5;
  vec3 col;
  if (uLightMode > 0.5) {
    float ink = max(max(sh.r, sh.g), sh.b) * uIntensity;
    float top = max(max(sh.r, sh.g), sh.b);
    vec3 hue = sh / max(top, 1e-3);
    float chroma = (top - min(min(sh.r, sh.g), sh.b)) / max(top, 1e-3);
    hue = clamp(mix(vec3(dot(hue, vec3(0.2126, 0.7152, 0.0722))), hue, 1.35) * 0.92, 0.0, 1.0);
    hue = mix(uMetal * 0.85, hue, smoothstep(0.08, 0.45, chroma));
    float density = 0.86 * smoothstep(0.0, 0.85, ink);
    vec3 paper = uColor * (1.0 - 0.035 * (1.0 - wide) - 0.05 * edge) + uMetal * (0.08 * tight);
    col = mix(paper, hue * mix(vec3(1.0), uColor, 0.15), density);
    col = mix(col, sparkColor * 0.9, min(spark * 1.4, 0.9));
    col -= abs(grainNoise) * uGrain * 0.35 * clamp(density * 1.6 + spark, 0.0, 1.0);
    col = mix(col, uColor, 0.12 * (1.0 - wide) * (1.0 - density) * pool);
  } else {
    vec3 base = uColor + vec3(0.018, 0.018, 0.024);
    col = base + uMetal * (0.025 + 0.07 * wide + 1.1 * tight + 0.2 * pool + 0.55 * turn * turn) * (0.75 + 0.25 * inner);
    col += sh * (1.65 * uIntensity);
    col += mix(sparkColor, vec3(1.0), 0.45) * spark * 2.4;
    col = col * (1.0 + col / 5.0) / (1.0 + col * 0.55);
    col += grainNoise * uGrain * 0.24;
  }
  col = clamp(col, 0.0, 1.0);
  return vec4(col * alpha, alpha);
}

float bayer(vec2 p) {
  int i = int(mod(p.x, 4.0)) + int(mod(p.y, 4.0)) * 4;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[i]) + 0.5) / 16.0;
}

float glyph(float level, vec2 uv) {
  int codes[8] = int[8](0, 4194304, 131200, 14336, 459200, 145536, 703136, 11512810);
  vec2 g = floor(uv * 7.0) - 1.0;
  if (g.x < 0.0 || g.y < 0.0 || g.x > 4.0 || g.y > 4.0) return 0.0;
  int code = codes[int(clamp(level * 8.0, 0.0, 7.0))];
  return float((code >> (int(g.x) + 5 * int(4.0 - g.y))) & 1);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  if (uFilter > 1.5) {
    float size = max(4.0, floor(uPixel * 10.0 * uFilterSize + 0.5));
    vec2 cellId = floor(frag / size);
    vec4 sampled = shade((cellId + 0.5) * size, 1.0);
    if (sampled.a <= 0.002) {
      outColor = vec4(0.0);
      return;
    }
    vec3 col = sampled.rgb / sampled.a;
    float ink = pow(clamp(length(col - uColor) * 1.25, 0.0, 1.0), 0.85);
    float on = glyph(ink, (frag - cellId * size) / size);
    float top = max(max(col.r, col.g), col.b);
    vec3 tone = uLightMode > 0.5 ? col * 0.82 : mix(col, col / max(top, 0.25), 0.4);
    float alpha = on * sampled.a;
    outColor = vec4(clamp(tone, 0.0, 1.0) * alpha, alpha);
  } else if (uFilter > 0.5) {
    float size = max(1.0, floor(uPixel * 2.0 * uFilterSize + 0.5));
    vec2 cellId = floor(frag / size);
    vec4 sampled = shade((cellId + 0.5) * size, 0.0);
    float threshold = bayer(cellId);
    float alpha = sampled.a >= 0.999 ? 1.0 : step(threshold, sampled.a);
    if (alpha <= 0.0) {
      outColor = vec4(0.0);
      return;
    }
    vec3 col = sampled.rgb / max(sampled.a, 1e-3);
    vec3 levels = clamp(uColor + floor((col - uColor) * 4.0 + threshold) / 4.0, 0.0, 1.0);
    outColor = vec4(levels * alpha, alpha);
  } else {
    outColor = shade(frag, 0.0);
  }
}`;

const UNIFORMS = [
  'uRes',
  'uPixel',
  'uTime',
  'uClock',
  'uTile',
  'uRot',
  'uGap',
  'uRound',
  'uBevel',
  'uScatter',
  'uTilt',
  'uSwirl',
  'uRipple',
  'uBands',
  'uSoft',
  'uIntensity',
  'uSaturation',
  'uSpectrum',
  'uGlitter',
  'uSheen',
  'uGrain',
  'uColor',
  'uMetal',
  'uLight',
  'uHover',
  'uWaves',
  'uIntro',
  'uFade',
  'uOpacity',
  'uLightMode',
  'uSeed',
  'uFrame',
  'uFilter',
  'uFilterSize'
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const startProgram = gl => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  return { program, vertex, fragment };
};

const finishProgram = (gl, job) => {
  const { program, vertex, fragment } = job;
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked && !gl.isContextLost()) {
    const broken = [vertex, fragment].filter(shader => !gl.getShaderParameter(shader, gl.COMPILE_STATUS));
    if (broken.length) broken.forEach(shader => console.error(gl.getShaderInfoLog(shader)));
    else console.error(gl.getProgramInfoLog(program));
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!linked) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = {};
  for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
};

const HoloMosaic = ({
  color = '#120f17',
  metalColor = '#e8ebf1',
  spectrum = 'full',
  tileSize = 1,
  gap = 0.08,
  roundness = 0.15,
  bevel = 0.35,
  rotation = 0,
  scatter = 0.3,
  tilt = 0.35,
  swirl = 1,
  ripple = 0.6,
  bands = 1.3,
  softness = 0.5,
  intensity = 1.25,
  saturation = 0.1,
  glitter = 0.85,
  sheen = 0.8,
  grain = 0.08,
  speed = 0.5,
  variation = 0,
  filter = 'none',
  filterSize = 1,
  fade = 0,
  opacity = 1,
  intro = true,
  mouseInteraction = true,
  mouseStrength = 1,
  mouseRadius = 0.25,
  flipOnClick = true,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const releaseRef = useRef(0);
  const [generation, setGeneration] = useState(0);
  const settings = {
    color: String(color),
    metalColor: String(metalColor),
    spectrum: SPECTRUMS[spectrum] || SPECTRUMS.full,
    tileSize: clamp(num(tileSize, 1), 0.2, 6),
    gap: clamp(num(gap, 0), 0, 0.6),
    roundness: clamp(num(roundness, 0), 0, 1),
    bevel: clamp(num(bevel, 0), 0, 1),
    rotation: (num(rotation, 0) * Math.PI) / 180,
    scatter: clamp(num(scatter, 0), 0, 1),
    tilt: clamp(num(tilt, 0), 0, 2),
    swirl: clamp(num(swirl, 0), 0, 5),
    ripple: clamp(num(ripple, 0), 0, 3),
    bands: clamp(num(bands, 1), 0.3, 3),
    softness: clamp(num(softness, 0), 0, 1),
    intensity: Math.max(0, num(intensity, 0)),
    saturation: clamp(num(saturation, 0), 0, 1.5),
    glitter: clamp(num(glitter, 0), 0, 1),
    sheen: clamp(num(sheen, 0), 0, 2),
    grain: clamp(num(grain, 0), 0, 1),
    speed: Math.max(0, num(speed, 0)),
    variation: num(variation, 0),
    filter: FILTERS[filter] ?? 0,
    filterSize: clamp(num(filterSize, 1), 0.5, 4),
    fade: clamp(num(fade, 0), 0, 1),
    opacity: clamp(num(opacity, 1), 0, 1),
    intro,
    mouseInteraction,
    mouseStrength: clamp(num(mouseStrength, 0), 0, 3),
    mouseRadius: clamp(num(mouseRadius, 0.25), 0.05, 1),
    flipOnClick,
    lightMode,
    paused,
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    wakeRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;
    cancelAnimationFrame(releaseRef.current);
    releaseRef.current = 0;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'default'
    });
    if (!gl) return undefined;
    const parallel = gl.getExtension('KHR_parallel_shader_compile');
    let job = startProgram(gl);
    if (!job) return undefined;
    let surface = null;
    if (!parallel) {
      surface = finishProgram(gl, job);
      job = null;
      if (!surface) return undefined;
    }
    const vao = gl.createVertexArray();
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeContext = probe.getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const waveData = new Float32Array(MAX_WAVES * 4);
    const state = {
      time: 17 + (settingsRef.current.variation % 97) * 3.1,
      clock: 0,
      frame: 0,
      intro: settingsRef.current.intro && !reduce && !settingsRef.current.paused ? 0 : INTRO_SECONDS,
      started: false,
      width: 1,
      height: 1,
      ratio: 1,
      colorKey: '',
      color: [0.07, 0.06, 0.09],
      metal: [0.78, 0.8, 0.85],
      pointer: { x: 0, y: 0, inside: false },
      light: { x: 0, y: 0, vx: 0, vy: 0, placed: false },
      hover: { x: 0, y: 0, vx: 0, vy: 0, presence: 0, placed: false },
      follow: 0,
      waves: []
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;
    let lost = false;

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
      const key = `${s.color}|${s.metalColor}`;
      if (key === state.colorKey) return;
      state.colorKey = key;
      state.color = toRgb(s.color, [0.07, 0.06, 0.09]);
      state.metal = toRgb(s.metalColor, [0.78, 0.8, 0.85]);
    };

    const aspect = () => state.width / Math.max(state.height, 1);

    const wander = () => {
      const t = state.time;
      return {
        x: 0.46 * aspect() * Math.cos(t * 0.29 + 0.4),
        y: 0.36 * Math.sin(t * 0.41 + 1.1)
      };
    };

    const toSurface = (px, py) => ({
      x: (px - state.width / 2) / state.height,
      y: (state.height / 2 - py) / state.height
    });

    const render = () => {
      if (!surface || lost) return;
      const s = settingsRef.current;
      resolveColors(s);
      const u = surface.uniforms;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.BLEND);
      gl.useProgram(surface.program);
      gl.bindVertexArray(vao);
      waveData.fill(0);
      state.waves.forEach((wave, index) => {
        waveData[index * 4] = wave.x;
        waveData[index * 4 + 1] = wave.y;
        waveData[index * 4 + 2] = wave.start;
        waveData[index * 4 + 3] = 1;
      });
      const introLive = state.intro < INTRO_SECONDS;
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uPixel, state.ratio);
      gl.uniform1f(u.uTime, state.time);
      gl.uniform1f(u.uClock, state.clock);
      gl.uniform1f(u.uTile, TILE_PX * s.tileSize * state.ratio);
      gl.uniform2f(u.uRot, Math.cos(s.rotation), Math.sin(s.rotation));
      gl.uniform1f(u.uGap, s.gap);
      gl.uniform1f(u.uRound, s.roundness);
      gl.uniform1f(u.uBevel, s.bevel);
      gl.uniform1f(u.uScatter, s.scatter);
      gl.uniform1f(u.uTilt, s.tilt);
      gl.uniform1f(u.uSwirl, s.swirl);
      gl.uniform1f(u.uRipple, s.ripple);
      gl.uniform1f(u.uBands, s.bands);
      gl.uniform1f(u.uSoft, 0.02 + 0.2 * s.softness);
      gl.uniform1f(u.uIntensity, s.intensity);
      gl.uniform1f(u.uSaturation, s.saturation);
      gl.uniform3f(u.uSpectrum, s.spectrum[0], s.spectrum[1], s.spectrum[2]);
      gl.uniform1f(u.uGlitter, s.glitter);
      gl.uniform1f(u.uSheen, s.sheen);
      gl.uniform1f(u.uGrain, s.grain);
      gl.uniform3f(u.uColor, state.color[0], state.color[1], state.color[2]);
      gl.uniform3f(u.uMetal, state.metal[0], state.metal[1], state.metal[2]);
      gl.uniform2f(u.uLight, state.light.x / EYE, state.light.y / EYE);
      gl.uniform4f(u.uHover, state.hover.x, state.hover.y, s.mouseRadius, 0.8 * state.hover.presence * s.mouseStrength);
      gl.uniform4fv(u.uWaves, waveData);
      gl.uniform4f(u.uIntro, 0, 0, state.intro, introLive ? 1 : 0);
      gl.uniform1f(u.uFade, s.fade);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.uniform1f(u.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform1f(u.uSeed, (s.variation % 1000) * 0.618);
      gl.uniform1f(u.uFrame, state.frame % 613);
      gl.uniform1f(u.uFilter, s.filter);
      gl.uniform1f(u.uFilterSize, s.filterSize);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const base = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      const longest = Math.max(width, height) * base;
      const ratio = longest > MAX_RENDER_DIM ? (base * MAX_RENDER_DIM) / longest : base;
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      state.width = width;
      state.height = height;
      state.ratio = pixelHeight / height;
      if (!state.light.placed) {
        const home = wander();
        state.light.x = home.x;
        state.light.y = home.y;
        state.light.placed = true;
      }
      render();
    };

    const spring = (body, target, stiffness, damping, dt) => {
      body.vx += (stiffness * (target.x - body.x) - damping * body.vx) * dt;
      body.vy += (stiffness * (target.y - body.y) - damping * body.vy) * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
    };

    const ready = () => {
      if (surface) return true;
      if (!job || !parallel || !gl.getProgramParameter(job.program, parallel.COMPLETION_STATUS_KHR)) return false;
      surface = finishProgram(gl, job);
      job = null;
      return Boolean(surface);
    };

    const frame = now => {
      raf = 0;
      if (!alive || !visible || document.hidden || lost) return;
      if (!ready()) {
        if (job) raf = requestAnimationFrame(frame);
        return;
      }
      const s = settingsRef.current;
      const dt = last && state.started ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      state.started = true;
      const moving = !s.paused && !reduce;
      if (moving) {
        state.frame += 1;
        state.clock += dt;
        state.intro += dt;
        state.time += dt * s.speed;
        state.waves = state.waves.filter(wave => state.clock - wave.start < WAVE_SECONDS);
      } else if (state.intro < INTRO_SECONDS) {
        state.intro = INTRO_SECONDS;
      }
      const { pointer, light, hover } = state;
      const active = s.mouseInteraction && pointer.inside && !reduce;
      const target = active ? toSurface(pointer.x, pointer.y) : null;
      state.follow += ((active ? 1 : 0) - state.follow) * (1 - Math.exp(-dt / (active ? 0.45 : 1.2)));
      const home = wander();
      const goal = target
        ? { x: home.x + (target.x - home.x) * state.follow, y: home.y + (target.y - home.y) * state.follow }
        : home;
      if (dt > 0) spring(light, goal, 38, 11, dt);
      if (target) {
        if (!hover.placed) {
          hover.x = target.x;
          hover.y = target.y;
          hover.vx = 0;
          hover.vy = 0;
          hover.placed = true;
        }
        if (dt > 0) spring(hover, target, 90, 18, dt);
      }
      const hoverGoal = target ? 1 : 0;
      hover.presence += (hoverGoal - hover.presence) * (1 - Math.exp(-dt / (hoverGoal > hover.presence ? 0.3 : 0.6)));
      if (!target && hover.presence < 0.001) hover.placed = false;
      render();
      const settling =
        Math.abs(hoverGoal - hover.presence) > 0.002 ||
        Math.hypot(light.vx, light.vy) > 0.0005 ||
        Math.hypot(goal.x - light.x, goal.y - light.y) > 0.0005 ||
        Math.hypot(hover.vx, hover.vy) > 0.0005;
      const animating = moving && (s.speed > 0 || state.intro < INTRO_SECONDS || state.waves.length > 0);
      if (animating || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && alive && visible && !document.hidden && !lost) raf = requestAnimationFrame(frame);
    };

    const locate = event => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
    };

    const onPointerMove = event => {
      const spot = locate(event);
      state.pointer.x = spot.x;
      state.pointer.y = spot.y;
      state.pointer.inside = spot.inside;
      wake();
    };

    const onPointerDown = event => {
      const s = settingsRef.current;
      if (!s.mouseInteraction || !s.flipOnClick || event.button !== 0 || reduce || s.paused) return;
      if (
        event.target instanceof Element &&
        event.target.closest('a, button, input, textarea, select, label, [role="button"]')
      )
        return;
      const spot = locate(event);
      if (!spot.inside) return;
      const point = toSurface(spot.x, spot.y);
      state.waves.push({ x: point.x, y: point.y, start: state.clock });
      while (state.waves.length > MAX_WAVES) state.waves.shift();
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

    const onLost = event => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onRestored = () => setGeneration(value => value + 1);

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
    window.addEventListener('pointerdown', onPointerDown);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
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
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        gl.deleteVertexArray(vao);
        if (surface) gl.deleteProgram(surface.program);
        const release = () => {
          if (!job || gl.isContextLost()) return;
          if (parallel && !gl.getProgramParameter(job.program, parallel.COMPLETION_STATUS_KHR)) {
            requestAnimationFrame(release);
            return;
          }
          gl.deleteShader(job.vertex);
          gl.deleteShader(job.fragment);
          gl.deleteProgram(job.program);
          job = null;
        };
        release();
      }
      const free = () => {
        releaseRef.current = 0;
        if (!canvas.isConnected && !gl.isContextLost()) gl.getExtension('WEBGL_lose_context')?.loseContext();
      };
      if (canvas.isConnected) releaseRef.current = requestAnimationFrame(free);
      else free();
    };
  }, [generation]);

  return (
    <div ref={containerRef} className={`holo-mosaic-container${className ? ` ${className}` : ''}`} {...rest}>
      <canvas ref={canvasRef} className="holo-mosaic-canvas" aria-hidden="true" />
    </div>
  );
};

export default HoloMosaic;
