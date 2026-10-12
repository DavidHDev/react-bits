'use client';

import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react';
import './FaultyTerminal.css';

type Vec2 = [number, number];

export type FaultyTerminalGlyphs = 'blocks' | 'dots' | 'characters';
export type FaultyTerminalClickEffect = 'glitch' | 'degauss' | 'none';

export interface FaultyTerminalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  scale?: number;
  gridMul?: Vec2;
  digitSize?: number;
  timeScale?: number;
  pause?: boolean;
  scanlineIntensity?: number;
  glitchAmount?: number;
  flickerAmount?: number;
  noiseAmp?: number;
  chromaticAberration?: number;
  dither?: number | boolean;
  curvature?: number;
  tint?: string;
  mouseReact?: boolean;
  mouseStrength?: number;
  pageLoadAnimation?: boolean;
  brightness?: number;
  glyphs?: FaultyTerminalGlyphs;
  glow?: number;
  persistence?: number;
  scramble?: number;
  mouseGlow?: number;
  vignette?: number;
  clickEffect?: FaultyTerminalClickEffect;
  variation?: number;
  lightMode?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

type Settings = {
  scale: number;
  gridX: number;
  gridY: number;
  digitSize: number;
  timeScale: number;
  pause: boolean;
  scanlineIntensity: number;
  glitchAmount: number;
  flickerAmount: number;
  noiseAmp: number;
  chromaticAberration: number;
  dither: number;
  curvature: number;
  tint: string;
  mouseReact: boolean;
  mouseStrength: number;
  pageLoadAnimation: boolean;
  brightness: number;
  glyphs: number;
  glow: number;
  persistence: number;
  scramble: number;
  mouseGlow: number;
  vignette: number;
  clickEffect: number;
  clickSeconds: number;
  variation?: number;
  lightMode: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const INTRO_SECONDS = 2;
const MAX_CLICKS = 4;
const CLICK_SECONDS: Record<string, number> = { glitch: 0.7, degauss: 1.6 };
const GLYPHS: Record<string, number> = { blocks: 0, dots: 1, characters: 2 };
const CLICKS: Record<string, number> = { none: 0, glitch: 1, degauss: 2 };

const FONT = [
  ['.###.', '#..##', '#.#.#', '##..#', '.###.'],
  ['..#..', '.##..', '..#..', '..#..', '.###.'],
  ['####.', '....#', '.###.', '#....', '#####'],
  ['####.', '....#', '.###.', '....#', '####.'],
  ['#..#.', '#..#.', '#####', '...#.', '...#.'],
  ['#####', '#....', '####.', '....#', '####.'],
  ['.###.', '#....', '####.', '#...#', '.###.'],
  ['#####', '....#', '...#.', '..#..', '..#..'],
  ['.###.', '#...#', '.###.', '#...#', '.###.'],
  ['.###.', '#...#', '.####', '....#', '.###.'],
  ['.###.', '#...#', '#####', '#...#', '#...#'],
  ['####.', '#...#', '####.', '#...#', '####.'],
  ['.####', '#....', '#....', '#....', '.####'],
  ['####.', '#...#', '#...#', '#...#', '####.'],
  ['#####', '#....', '####.', '#....', '#####'],
  ['#####', '#....', '####.', '#....', '#....'],
  ['.....', '..#..', '.###.', '..#..', '.....'],
  ['.....', '.....', '.###.', '.....', '.....'],
  ['.#...', '..#..', '...#.', '..#..', '.#...'],
  ['....#', '...#.', '..#..', '.#...', '#....'],
  ['.....', '#.#.#', '.###.', '#.#.#', '.....'],
  ['.....', '#####', '.....', '#####', '.....'],
  ['.....', '.....', '.....', '.....', '#####']
];

const FONT_BITS = FONT.map(rows =>
  rows.reduce((bits, row, r) => {
    let value = bits;
    for (let c = 0; c < 5; c++) if (row[c] === '#') value += 2 ** (r * 5 + c);
    return value;
  }, 0)
);

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const PATTERN = `
float time;

float noise(vec2 p) {
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
}

mat2 rotate(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p) {
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;
  mat2 modify0 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify0 * p * 2.0;
  amp *= 0.454545;
  mat2 modify1 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify1 * p * 2.0;
  amp *= 0.454545;
  f += amp * noise(p);
  return f;
}

float pattern(vec2 p) {
  vec2 offset1 = vec2(1.0);
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time);
  mat2 rot1 = rotate(0.1);
  vec2 q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  vec2 r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}
`;

const CELL_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform float iTime;
uniform vec2 uGridMul;
uniform float uNoiseAmp;
uniform float uScale;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform ivec2 uOrigin;
uniform sampler2D uPrev0;
uniform sampler2D uPrev1;
uniform float uDecay;
uniform float uFresh;
uniform float uHover;

layout(location = 0) out vec4 outRings;
layout(location = 1) out vec4 outExtra;
${PATTERN}
void main() {
  time = iTime * 0.333333;
  ivec2 texel = ivec2(gl_FragCoord.xy);
  vec2 grid = uGridMul * 15.0;
  vec2 s = vec2(texel + uOrigin) / grid;
  float intensity = pattern(s * 0.1) * 1.3 - 0.03;
  float lift = 0.0;
  float strike = 0.0;

  if (uUseMouse > 0.5) {
    vec2 mouseWorld = uMouse * uScale;
    float distToMouse = distance(s, mouseWorld);
    float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
    intensity += mouseInfluence;
    float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
    intensity += ripple;
    lift = mouseInfluence;
  }

  if (uUsePageLoadAnimation > 0.5) {
    float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
    float cellDelay = cellRandom * 0.8;
    float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
    float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
    intensity *= fadeAlpha;
    strike = sin(3.14159265 * cellProgress) * step(0.1, intensity);
  }

  vec4 on0 = step(vec4(0.1), intensity - vec4(0.0, 1.0, 2.0, 4.0) * 0.0625);
  vec2 on1 = step(vec2(0.1), intensity - vec2(5.0, 8.0) * 0.0625);
  float level = clamp((intensity - 0.1) / 0.6, 0.0, 1.0);
  float heat = max(clamp(lift / 3.0, 0.0, 1.0) * uHover, strike);

  vec4 prev0 = texelFetch(uPrev0, texel, 0) * (1.0 - uFresh);
  vec4 prev1 = texelFetch(uPrev1, texel, 0) * (1.0 - uFresh);
  vec4 fade0 = max(prev0 * uDecay - 1.0 / 255.0, 0.0);
  vec4 fade1 = max(prev1 * uDecay - 1.0 / 255.0, 0.0);

  outRings = max(on0, fade0);
  outExtra = vec4(max(on1, fade1.xy), max(level, fade1.z), max(heat, fade1.w));
}`;

const fontArray = `const uint FONT[${FONT_BITS.length}] = uint[${FONT_BITS.length}](${FONT_BITS.map(
  bits => `${bits}u`
).join(', ')});`;

const MAIN_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform float iTime;
uniform vec3 iResolution;
uniform float uScale;
uniform vec2 uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3 uTint;
uniform float uBrightness;
uniform float uLightMode;
uniform sampler2D uRings0;
uniform sampler2D uRings1;
uniform ivec2 uOrigin;
uniform ivec2 uCellCount;
uniform int uGlyphs;
uniform float uGlow;
uniform float uScramble;
uniform float uMouseGlow;
uniform float uVignette;
uniform vec4 uClicks[${MAX_CLICKS}];
uniform int uClickMode;
uniform float uClickSeconds;
uniform float uClock;

out vec4 outColor;

${fontArray}

float time;
float clickTear;
float clickSplit;
float pixelHeat;

float hash21(vec2 p) {
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float hashCell(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

ivec2 cellTexel(vec2 cell) {
  return clamp(ivec2(cell) - uOrigin, ivec2(0), uCellCount - 1);
}

float ringValue(float n, vec4 r0, vec4 r1) {
  if (n < 0.5) return r0.x;
  if (n < 1.5) return r0.y;
  if (n < 2.5) return r0.z;
  if (n < 4.5) return r0.w;
  if (n < 5.5) return r1.x;
  return r1.y;
}

float digit(vec2 p) {
  vec2 grid = uGridMul * 15.0;
  vec2 cell = floor(p * grid);
  ivec2 texel = cellTexel(cell);
  vec4 r0 = texelFetch(uRings0, texel, 0);
  vec4 r1 = texelFetch(uRings1, texel, 0);
  float boost = 1.0 + r1.w * uMouseGlow * 1.3;
  pixelHeat = max(pixelHeat, r1.w);
  p = fract(p * grid);
  p *= uDigitSize;

  float px5 = p.x * 5.0;
  float py5 = (1.0 - p.y) * 5.0;
  float x = fract(px5);
  float y = fract(py5);
  float i = floor(py5) - 2.0;
  float j = floor(px5) - 2.0;
  float inside = step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0);

  if (uGlyphs == 2) {
    float rate = 1.2 + r1.w * uScramble * 18.0;
    float phase = hashCell(cell * 1.37 + 4.1);
    float epoch = floor(iTime * rate + phase * 7.0);
    float pick = hashCell(cell + vec2(epoch * 0.731, epoch * 1.913));
    uint glyph = FONT[int(min(pick * float(FONT.length()), float(FONT.length()) - 1.0))];
    int bit = int(i + 2.0) * 5 + int(j + 2.0);
    float lit = float((glyph >> uint(clamp(bit, 0, 24))) & 1u);
    float glow = max(r0.x, r1.z);
    float shade = 0.35 + 0.65 * r1.z;
    return inside * lit * glow * shade * boost * (0.2 + y * 0.8) * (0.75 + x * 0.25);
  }

  float n = i * i + j * j;
  float on = ringValue(n, r0, r1);
  if (uGlyphs == 1) {
    vec2 d = vec2(x, y) - 0.5;
    float radius = 0.36 + 0.06 * on;
    float edge = fwidth(px5) * 0.75;
    float dot = 1.0 - smoothstep(radius - edge, radius + edge, length(d));
    return inside * on * dot * boost * (0.55 + 0.45 * (1.0 - length(d) / 0.5));
  }
  float brightness = on * (0.2 + y * 0.8) * (0.75 + x * 0.25);
  return inside * brightness * boost;
}

float onOff(float a, float b, float c) {
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look) {
  float y = look.y - mod(iTime * 0.25, 1.0);
  float window = 1.0 / (1.0 + 50.0 * y * y);
  return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
}

vec2 getLight(vec2 p) {
  float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
  bar *= uScanlineIntensity;

  float displacement = displace(p);
  p.x += displacement;

  if (uGlitchAmount != 1.0) {
    float extra = displacement * (uGlitchAmount - 1.0);
    p.x += extra;
  }

  p.x += clickTear;

  float middle = digit(p);

  const float off = 0.002;
  float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
              digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
              digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));

  return vec2(0.9 * middle, sum * 0.1 * bar);
}

float glowAt(vec2 p) {
  vec2 grid = uGridMul * 15.0;
  vec2 cell = floor(p * grid);
  vec2 cellPx = iResolution.xy / (uScale * grid);
  float sigma = 0.5 * min(cellPx.x, cellPx.y);
  float center = 0.5 * min(1.0, 1.0 / max(uDigitSize, 0.001));
  float total = 0.0;
  for (int oy = -1; oy <= 1; oy++) {
    for (int ox = -1; ox <= 1; ox++) {
      vec2 c = cell + vec2(float(ox), float(oy));
      ivec2 texel = cellTexel(c);
      vec4 r0 = texelFetch(uRings0, texel, 0);
      vec4 r1 = texelFetch(uRings1, texel, 0);
      float emission = uGlyphs == 2
        ? max(r0.x, r1.z) * (0.35 + 0.65 * r1.z) * 0.45
        : (r0.x + 4.0 * (r0.y + r0.z + r0.w + r1.y) + 8.0 * r1.x) / 25.0;
      emission *= 1.0 + r1.w * uMouseGlow * 1.6;
      vec2 d = (p - (c + center) / grid) * iResolution.xy / uScale;
      total += emission * exp(-dot(d, d) / (2.0 * sigma * sigma));
    }
  }
  return total;
}

vec2 barrel(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
  time = iTime * 0.333333;
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  if (uCurvature != 0.0) {
    uv = barrel(uv);
  }

  clickTear = 0.0;
  clickSplit = 0.0;
  if (uClickMode > 0) {
    for (int k = 0; k < ${MAX_CLICKS}; k++) {
      vec4 click = uClicks[k];
      if (click.w <= 0.0) continue;
      float age = uClock - click.z;
      if (age < 0.0 || age > uClickSeconds) continue;
      float life = age / uClickSeconds;
      float envelope = (1.0 - life) * (1.0 - life);
      if (uClickMode == 1) {
        float tick = floor(age * 30.0);
        float bands = 14.0 + 26.0 * hashCell(vec2(click.z, tick * 0.37));
        float row = floor(uv.y * bands);
        float pickRow = hashCell(vec2(row + tick * 7.0, click.z * 17.0));
        float torn = step(0.42, pickRow);
        float reach = exp(-abs(uv.y - click.y) * 2.5);
        float shift = (hashCell(vec2(row * 1.7 + tick, click.z)) - 0.5) * 0.22;
        clickTear += shift * torn * envelope * reach;
        clickSplit = max(clickSplit, envelope * reach * (0.4 + 0.6 * torn));
      } else {
        vec2 aspect = vec2(iResolution.x / iResolution.y, 1.0);
        vec2 delta = (uv - click.xy) * aspect;
        float dist = length(delta);
        float front = age * 1.6;
        float band = exp(-pow((dist - front) / 0.18, 2.0));
        float wave = sin((dist - front) * 40.0) * band;
        uv += delta / aspect * wave * 0.05 * envelope;
        clickSplit = max(clickSplit, envelope * band);
      }
    }
  }

  vec2 p = uv * uScale;
  pixelHeat = 0.0;
  vec2 lightG = getLight(p);
  float heat = pixelHeat;
  vec2 lightR = lightG;
  vec2 lightB = lightG;

  float split = uChromaticAberration + clickSplit * 6.0;
  if (split != 0.0) {
    vec2 ca = vec2(split) / iResolution.xy;
    lightR = getLight(p + ca);
    lightB = getLight(p - ca);
  }

  if (uGlow > 0.0) {
    float bloom = uGlow * 0.2 * glowAt(p);
    lightR.y += bloom;
    lightG.y += bloom;
    lightB.y += bloom;
  }

  vec3 core = vec3(lightR.x, lightG.x, lightB.x);
  vec3 halo = vec3(lightR.y, lightG.y, lightB.y);
  vec3 raw = core + halo;

  vec3 luma = vec3(0.2126, 0.7152, 0.0722);
  float peak = max(uTint.r, max(uTint.g, uTint.b));
  float phosphor = clamp(uGlow, 0.0, 1.0);
  vec3 vividTint = clamp(mix(vec3(dot(uTint, luma)), uTint, 1.0 + 0.8 * phosphor), 0.0, 1.0);
  vec3 coreTint = mix(uTint, vec3(peak), phosphor * 0.45 * smoothstep(0.45, 0.9, core));
  vec3 col = core * coreTint + halo * vividTint;
  col += (vec3(1.0) - uTint) * min(raw, vec3(1.0)) * heat * uMouseGlow * 0.6;
  col *= uBrightness;

  if (uVignette > 0.0) {
    float edge = 0.04 + 0.22 * uVignette;
    vec2 fade = smoothstep(vec2(0.0), vec2(edge), uv) * smoothstep(vec2(0.0), vec2(edge), 1.0 - uv);
    float mask = fade.x * fade.y;
    mask = mask * mask * (3.0 - 2.0 * mask);
    float keep = mix(1.0, mask, clamp(uVignette * 1.5, 0.0, 1.0));
    col *= keep;
    core *= keep;
    halo *= keep;
  }

  if (uLightMode > 0.5) {
    vec3 luma = vec3(0.2126, 0.7152, 0.0722);
    float lum = dot(uTint, luma);
    float peak = max(uTint.r, max(uTint.g, uTint.b));
    vec3 hue = uTint / max(peak, 0.0001);
    vec3 vivid = clamp(mix(vec3(dot(hue, luma)), hue, 1.6), 0.0, 1.0);
    vivid = clamp(vivid * (0.3 / max(dot(vivid, luma), 0.0001)), 0.0, 1.0);
    vec3 ink = mix(uTint, vivid, smoothstep(0.3, 0.6, lum));
    vec3 cover = (core * 1.15 + halo * 0.4) * uBrightness * (1.0 + heat * uMouseGlow * 0.4);
    if (uDither > 0.0) cover += (hash21(gl_FragCoord.xy) - 0.5) * (uDither * 0.003922);
    cover = clamp(cover, 0.0, 0.94);
    float alpha = max(cover.r, max(cover.g, cover.b));
    outColor = vec4(alpha - cover * (1.0 - ink), alpha);
    return;
  }

  if (uDither > 0.0) {
    float rnd = hash21(gl_FragCoord.xy);
    col += (rnd - 0.5) * (uDither * 0.003922);
  }

  col = clamp(col, 0.0, 1.0);
  outColor = vec4(col, max(col.r, max(col.g, col.b)));
}`;

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

const link = (gl: WebGL2RenderingContext, fragmentSource: string): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
};

const hexToRgb = (hex: string): number[] => {
  let h = String(hex || '#ffffff')
    .replace('#', '')
    .trim();
  if (h.length === 3 || h.length === 4)
    h = h
      .slice(0, 3)
      .split('')
      .map(c => c + c)
      .join('');
  const num = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(num)) return [1, 1, 1];
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
};

export default function FaultyTerminal({
  scale = 1,
  gridMul = [2, 1],
  digitSize = 1.5,
  timeScale = 0.3,
  pause = false,
  scanlineIntensity = 0.3,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 1,
  chromaticAberration = 0,
  dither = 0,
  curvature = 0.2,
  tint = '#ffffff',
  mouseReact = true,
  mouseStrength = 0.2,
  pageLoadAnimation = true,
  brightness = 1,
  glyphs = 'blocks',
  glow = 0.5,
  persistence = 0.5,
  scramble = 0.5,
  mouseGlow = 0.6,
  vignette = 0.25,
  clickEffect = 'glitch',
  variation,
  lightMode = false,
  dpr,
  className = '',
  style,
  ...rest
}: FaultyTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    scale: Math.max(0.05, scale),
    gridX: Math.max(0.1, (gridMul?.[0] ?? 2) * 15),
    gridY: Math.max(0.1, (gridMul?.[1] ?? 1) * 15),
    digitSize,
    timeScale,
    pause,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    noiseAmp,
    chromaticAberration,
    dither: typeof dither === 'boolean' ? (dither ? 1 : 0) : dither,
    curvature,
    tint,
    mouseReact,
    mouseStrength,
    pageLoadAnimation,
    brightness,
    glyphs: GLYPHS[glyphs] ?? 0,
    glow: clamp(glow, 0, 3),
    persistence: clamp(persistence, 0, 1),
    scramble: clamp(scramble, 0, 1),
    mouseGlow: clamp(mouseGlow, 0, 1),
    vignette: clamp(vignette, 0, 1),
    clickEffect: CLICKS[clickEffect] ?? 0,
    clickSeconds: CLICK_SECONDS[clickEffect] ?? 1,
    variation,
    lightMode,
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
    const cellShader = link(gl, CELL_FRAGMENT);
    const mainShader = link(gl, MAIN_FRAGMENT);
    if (!cellShader || !mainShader) return undefined;
    const cu = cellShader.uniforms;
    const mu = mainShader.uniforms;
    const vao = gl.createVertexArray();

    const makeTexture = () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      return texture;
    };
    const targets = [0, 1].map(() => {
      const rings = makeTexture();
      const extra = makeTexture();
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rings, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, extra, 0);
      return { rings, extra, framebuffer };
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const view = { width: 1, height: 1, ratio: 1, columns: 1 };
    const cells = { x: 0, y: 0, w: 1, h: 1, key: '' };
    const pointer = { x: 0.5, y: 0.5, inside: false };
    const mouse = { x: 0.5, y: 0.5 };
    const clicks = new Float32Array(MAX_CLICKS * 4);
    let clickIndex = 0;
    let clock = 0;
    let hover = 0;
    let current = 0;
    let fresh = true;
    const seedOffset = settingsRef.current.variation;
    const initialOffset = typeof seedOffset === 'number' ? seedOffset * 10 : Math.random() * 100;
    let iTime = initialOffset * settingsRef.current.timeScale;
    let introClock = settingsRef.current.pageLoadAnimation && !reduce ? 0 : 1;
    let raf = 0;
    let last = 0;
    let visible = true;
    let quiet = 0;

    const layoutCells = (s: Settings) => {
      const reach = 1 + Math.max(0, s.curvature) * 2;
      const uvMin = 0.5 - 0.5 * reach;
      const uvMax = 0.5 + 0.5 * reach;
      const margin = 0.06 * Math.max(1, Math.abs(s.glitchAmount)) * Math.max(1, Math.abs(s.flickerAmount)) + 0.2;
      const gridX = s.gridX * view.columns;
      const x0 = Math.floor((uvMin * s.scale - margin) * gridX) - 2;
      const x1 = Math.floor((uvMax * s.scale + margin) * gridX) + 2;
      const y0 = Math.floor((uvMin * s.scale - margin) * s.gridY) - 2;
      const y1 = Math.floor((uvMax * s.scale + margin) * s.gridY) + 2;
      const key = `${x0}:${x1}:${y0}:${y1}`;
      if (key === cells.key) return;
      cells.key = key;
      cells.x = x0;
      cells.y = y0;
      cells.w = Math.max(1, Math.min(4096, x1 - x0 + 1));
      cells.h = Math.max(1, Math.min(4096, y1 - y0 + 1));
      for (const target of targets) {
        for (const texture of [target.rings, target.extra]) {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cells.w, cells.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
      }
      fresh = true;
    };

    const stepCells = (s: Settings, decay: number) => {
      const source = targets[current];
      const target = targets[1 - current];
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.viewport(0, 0, cells.w, cells.h);
      gl.disable(gl.BLEND);
      gl.useProgram(cellShader.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, source.rings);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, source.extra);
      gl.uniform1i(cu.uPrev0, 0);
      gl.uniform1i(cu.uPrev1, 1);
      gl.uniform1f(cu.iTime, iTime);
      gl.uniform2f(cu.uGridMul, (s.gridX * view.columns) / 15, s.gridY / 15);
      gl.uniform1f(cu.uNoiseAmp, s.noiseAmp);
      gl.uniform1f(cu.uScale, s.scale);
      gl.uniform2f(cu.uMouse, mouse.x, mouse.y);
      gl.uniform1f(cu.uMouseStrength, s.mouseStrength);
      gl.uniform1f(cu.uUseMouse, s.mouseReact ? 1 : 0);
      gl.uniform1f(cu.uPageLoadProgress, introClock);
      gl.uniform1f(cu.uUsePageLoadAnimation, s.pageLoadAnimation ? 1 : 0);
      gl.uniform2i(cu.uOrigin, cells.x, cells.y);
      gl.uniform1f(cu.uDecay, decay);
      gl.uniform1f(cu.uFresh, fresh ? 1 : 0);
      gl.uniform1f(cu.uHover, hover);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      current = 1 - current;
      fresh = false;
    };

    const draw = () => {
      const s = settingsRef.current;
      const source = targets[current];
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(mainShader.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, source.rings);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, source.extra);
      gl.uniform1i(mu.uRings0, 0);
      gl.uniform1i(mu.uRings1, 1);
      gl.uniform1f(mu.iTime, iTime);
      gl.uniform3f(mu.iResolution, canvas.width, canvas.height, canvas.width / canvas.height);
      gl.uniform1f(mu.uScale, s.scale);
      gl.uniform2f(mu.uGridMul, (s.gridX * view.columns) / 15, s.gridY / 15);
      gl.uniform1f(mu.uDigitSize, s.digitSize);
      gl.uniform1f(mu.uScanlineIntensity, s.scanlineIntensity);
      gl.uniform1f(mu.uGlitchAmount, reduce ? 0 : s.glitchAmount);
      gl.uniform1f(mu.uFlickerAmount, reduce ? 0 : s.flickerAmount);
      gl.uniform1f(mu.uChromaticAberration, s.chromaticAberration);
      gl.uniform1f(mu.uDither, s.dither);
      gl.uniform1f(mu.uCurvature, s.curvature);
      gl.uniform3fv(mu.uTint, hexToRgb(s.tint));
      gl.uniform1f(mu.uBrightness, s.brightness);
      gl.uniform1f(mu.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform2i(mu.uOrigin, cells.x, cells.y);
      gl.uniform2i(mu.uCellCount, cells.w, cells.h);
      gl.uniform1i(mu.uGlyphs, s.glyphs);
      gl.uniform1f(mu.uGlow, s.glow);
      gl.uniform1f(mu.uScramble, s.scramble);
      gl.uniform1f(mu.uMouseGlow, s.mouseGlow);
      gl.uniform1f(mu.uVignette, s.vignette);
      gl.uniform4fv(mu.uClicks, clicks);
      gl.uniform1i(mu.uClickMode, s.clickEffect);
      gl.uniform1f(mu.uClickSeconds, s.clickSeconds);
      gl.uniform1f(mu.uClock, clock);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const resize = () => {
      const s = settingsRef.current;
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      view.columns = Math.min(1, view.width / view.height / 1.5);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      layoutCells(s);
      stepCells(s, 0);
      draw();
      wake();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? clamp((now - last) / 1000, 0.001, 1 / 20) : 1 / 60;
      last = now;
      clock += dt;
      if (!s.pause && !reduce) iTime += dt * s.timeScale;
      const targetX = pointer.inside ? pointer.x : 0.5;
      const targetY = pointer.inside ? pointer.y : 0.5;
      const follow = 1 - Math.exp(-dt / (pointer.inside ? 0.19988 : 0.6));
      mouse.x += (targetX - mouse.x) * follow;
      mouse.y += (targetY - mouse.y) * follow;
      hover += ((pointer.inside ? 1 : 0) - hover) * (1 - Math.exp(-dt / 0.35));
      for (let k = 0; k < MAX_CLICKS; k++) {
        if (clicks[k * 4 + 3] > 0 && clock - clicks[k * 4 + 2] > s.clickSeconds) clicks[k * 4 + 3] = 0;
      }
      layoutCells(s);
      const decay = s.persistence > 0 ? Math.exp(-dt / (0.08 + s.persistence * 1.4)) : 0;
      stepCells(s, decay);
      draw();
      if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
      let busy = !(s.pause || reduce) || introClock < 1;
      busy = busy || Math.abs(targetX - mouse.x) + Math.abs(targetY - mouse.y) > 0.0001;
      busy = busy || Math.abs((pointer.inside ? 1 : 0) - hover) > 0.001;
      for (let k = 0; k < MAX_CLICKS; k++) busy = busy || clicks[k * 4 + 3] > 0;
      quiet = busy ? 0 : quiet + dt;
      if (quiet < 2.5) raf = requestAnimationFrame(frame);
    };

    function wake() {
      quiet = 0;
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(rect.width, 1);
      const y = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
      return { x, y, inside: x >= 0 && x <= 1 && y >= 0 && y <= 1 };
    };

    const onPointerMove = (event: PointerEvent) => {
      const { x, y, inside } = locate(event);
      const was = pointer.inside;
      pointer.inside = inside;
      if (inside) {
        pointer.x = x;
        pointer.y = y;
      }
      if (inside || was) wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      const { x, y, inside } = locate(event);
      if (!inside || reduce || !s.clickEffect) return;
      const o = clickIndex * 4;
      clicks[o] = x;
      clicks[o + 1] = y;
      clicks[o + 2] = clock;
      clicks[o + 3] = 1;
      clickIndex = (clickIndex + 1) % MAX_CLICKS;
      wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      wake();
    };

    const onVisibility = () => wake();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) wake();
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    wakeRef.current = wake;

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      for (const target of targets) {
        gl.deleteTexture(target.rings);
        gl.deleteTexture(target.extra);
        gl.deleteFramebuffer(target.framebuffer);
      }
      gl.deleteVertexArray(vao);
      gl.deleteProgram(cellShader.program);
      gl.deleteProgram(mainShader.program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={containerRef}
      className={`faulty-terminal-container${className ? ` ${className}` : ''}`}
      style={style}
      {...rest}
    >
      <canvas ref={canvasRef} className="faulty-terminal-canvas" aria-hidden="true" />
    </div>
  );
}
