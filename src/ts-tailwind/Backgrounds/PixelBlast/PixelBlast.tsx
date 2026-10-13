'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

export type PixelBlastVariant = 'square' | 'circle' | 'triangle' | 'diamond' | 'cross' | 'ring';
export type PixelBlastHoverEffect = 'reveal' | 'grow' | 'none';

export interface PixelBlastProps {
  variant?: PixelBlastVariant;
  pixelSize?: number;
  color?: string;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
  patternScale?: number;
  patternDensity?: number;
  pixelSizeJitter?: number;
  enableRipples?: boolean;
  rippleIntensityScale?: number;
  rippleThickness?: number;
  rippleSpeed?: number;
  autoPauseOffscreen?: boolean;
  speed?: number;
  transparent?: boolean;
  edgeFade?: number;
  noiseAmount?: number;
  softness?: number;
  smoothing?: number;
  glow?: number;
  twinkle?: number;
  drift?: number;
  driftAngle?: number;
  hoverEffect?: PixelBlastHoverEffect;
  hoverRadius?: number;
  autoRipple?: number;
  tiltX?: number;
  tiltY?: number;
  intro?: boolean;
  variation?: number;
  lightMode?: boolean;
  dpr?: number;
}

type Settings = {
  variant: number;
  pixelSize: number;
  color: string;
  accentColor: string;
  patternScale: number;
  patternDensity: number;
  pixelSizeJitter: number;
  enableRipples: boolean;
  rippleIntensityScale: number;
  rippleThickness: number;
  rippleSpeed: number;
  autoPauseOffscreen: boolean;
  speed: number;
  transparent: boolean;
  edgeFade: number;
  noiseAmount: number;
  softness: number;
  smoothing: number;
  glow: number;
  twinkle: number;
  drift: number;
  driftAngle: number;
  hoverEffect: number;
  hoverRadius: number;
  autoRipple: number;
  tiltX: number;
  tiltY: number;
  intro: boolean;
  variation?: number;
  lightMode: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const MAX_CLICKS = 10;
const INTRO_SECONDS = 1.8;
const SHAPES: Record<string, number> = { square: 0, circle: 1, triangle: 2, diamond: 3, cross: 4, ring: 5 };
const HOVERS: Record<string, number> = { none: 0, grow: 1, reveal: 2 };
const bayer2 = (x: number, y: number): number => (Math.floor(x) / 2 + Math.floor(y) * Math.floor(y) * 0.75) % 1;
const bayer8 = (x: number, y: number): number =>
  (bayer2(x / 4, y / 4) * 0.25 + bayer2(x / 2, y / 2)) * 0.25 + bayer2(x, y);
const BAYER_TABLE = Array.from({ length: 64 }, (_, i) => bayer8(i % 8, Math.floor(i / 8)).toFixed(6)).join(', ');
const RANGE_MIN = -6;
const RANGE_MAX = 10;

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const PACKING = `
const float RANGE_MIN = ${RANGE_MIN.toFixed(1)};
const float RANGE_MAX = ${RANGE_MAX.toFixed(1)};

vec2 pack16(float value) {
  float x = floor(clamp((value - RANGE_MIN) / (RANGE_MAX - RANGE_MIN), 0.0, 1.0) * 65535.0 + 0.5);
  float hi = floor(x / 256.0);
  return vec2(hi, x - hi * 256.0) / 255.0;
}

float unpack16(vec2 c) {
  float x = floor(c.x * 255.0 + 0.5) * 256.0 + floor(c.y * 255.0 + 0.5);
  return RANGE_MIN + x / 65535.0 * (RANGE_MAX - RANGE_MIN);
}
`;

const CELL_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform int uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform vec2 uClickPos[${MAX_CLICKS}];
uniform float uClickAge[${MAX_CLICKS}];
uniform ivec2 uOrigin;
uniform vec2 uDrift;
uniform int uHover;
uniform vec2 uMouse;
uniform float uMouseRadius;
uniform float uMousePresence;
uniform float uIntro;
uniform sampler2D uPrev;
uniform float uDecay;
uniform float uFresh;

out vec4 outCell;
${PACKING}
float hash11(float n) { return fract(sin(n) * 43758.5453); }

float vnoise(vec3 p) {
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0, 0.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n100 = hash11(dot(ip + vec3(1.0, 0.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n010 = hash11(dot(ip + vec3(0.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n110 = hash11(dot(ip + vec3(1.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n001 = hash11(dot(ip + vec3(0.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0)));
  float n101 = hash11(dot(ip + vec3(1.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0)));
  float n011 = hash11(dot(ip + vec3(0.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0)));
  float n111 = hash11(dot(ip + vec3(1.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0)));
  vec3 w = fp * fp * fp * (fp * (fp * 6.0 - 15.0) + 10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0 = mix(x00, x10, w.y);
  float y1 = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t) {
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < 5; ++i) {
    sum += amp * vnoise(p * freq);
    freq *= 1.25;
    amp *= 1.0;
  }
  return sum * 0.5 + 0.5;
}

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  float aspectRatio = uResolution.x / uResolution.y;
  float cellPixelSize = 8.0 * uPixelSize;
  vec2 cellId = vec2(texel + uOrigin);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  float base = fbm2(uv + uDrift, uTime * 0.05);
  base = base * 0.5 - 0.65;
  float feed = base + (uDensity - 0.5) * 0.3;
  if (uEnableRipples == 1) {
    for (int i = 0; i < ${MAX_CLICKS}; ++i) {
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      vec2 cuv = (((pos - uResolution * 0.5 - cellPixelSize * 0.5) / uResolution)) * vec2(aspectRatio, 1.0);
      float t = max(uClickAge[i], 0.0);
      float r = distance(uv, cuv);
      float waveR = uRippleSpeed * t;
      float ring = exp(-pow((r - waveR) / uRippleThickness, 2.0));
      float atten = exp(-1.0 * t) * exp(-10.0 * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  if (uIntro < 1.0) {
    vec2 center = (-cellPixelSize * 0.5 / uResolution) * vec2(aspectRatio, 1.0);
    float reach = length(vec2(aspectRatio, 1.0)) * 0.5 + 0.2;
    float eased = 1.0 - pow(1.0 - uIntro, 2.4);
    float front = eased * reach;
    float r = distance(uv, center);
    float shown = smoothstep(front + 0.04, front - 0.06, r);
    float ring = exp(-pow((r - front) / 0.07, 2.0)) * (1.0 - uIntro);
    feed = mix(-1.0, feed, shown);
    feed = max(feed, ring * 1.4);
  }

  float brush = 0.0;
  if (uHover > 0) {
    vec2 d = (cellCoord + cellPixelSize * 0.5 + uResolution * 0.5 - uMouse) / max(uMouseRadius, 1.0);
    brush = exp(-dot(d, d)) * uMousePresence;
  }
  vec4 prev = texelFetch(uPrev, texel, 0) * (1.0 - uFresh);
  float trail = max(brush, max(prev.a * uDecay - 1.0 / 255.0, 0.0));
  if (uHover == 2) feed += trail * 0.9;

  outCell = vec4(pack16(feed), clamp((feed + 0.5) * 0.5, 0.0, 1.0), trail);
}`;

const MAIN_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform vec3 uColor;
uniform vec3 uAccent;
uniform vec2 uResolution;
uniform float uTime;
uniform float uClock;
uniform float uPixelSize;
uniform float uPixelJitter;
uniform float uEdgeFade;
uniform int uShapeType;
uniform sampler2D uCells;
uniform ivec2 uOrigin;
uniform ivec2 uCellCount;
uniform float uSoftness;
uniform float uSmoothing;
uniform float uGlow;
uniform float uTwinkle;
uniform float uLightMode;
uniform float uTransparent;
uniform float uNoise;
uniform int uHover;
uniform mat3 uPlane;
uniform float uTilted;

out vec4 fragColor;
${PACKING}
const float BAYER[64] = float[64](${BAYER_TABLE});

vec2 gDx;
vec2 gDy;

float aaFrom(vec2 grad) {
  return abs(dot(grad, gDx)) + abs(dot(grad, gDy));
}

float maskSquare(vec2 p, float cov, float soft) {
  if (soft <= 0.0) return cov;
  float side = 0.5 * sqrt(clamp(cov, 0.0, 1.0));
  vec2 c = p - 0.5;
  vec2 q = abs(c) - side;
  float d = max(q.x, q.y);
  vec2 grad = q.x > q.y ? vec2(sign(c.x), 0.0) : vec2(0.0, sign(c.y));
  float aa = max(aaFrom(grad), 1e-4);
  return 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);
}

float maskCircle(vec2 p, float cov) {
  float r = sqrt(cov) * 0.25;
  vec2 c = p - 0.5;
  float len = length(c);
  float d = len - r;
  float aa = 0.5 * aaFrom(c / max(len, 1e-5));
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov) {
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d = p.y - r * (1.0 - p.x);
  float aa = max(aaFrom(vec2(flip ? -r : r, 1.0)), 1e-4);
  return cov * clamp(0.5 - d / aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov) {
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

float maskCross(vec2 p, float cov) {
  float s = sqrt(clamp(cov, 0.0, 1.0));
  vec2 c = p - 0.5;
  vec2 q = abs(c);
  float arm = 0.42 * s;
  float bar = 0.13 * s + 0.02;
  float a1 = max(q.x - arm, q.y - bar);
  float a2 = max(q.x - bar, q.y - arm);
  float d = min(a1, a2);
  bool horizontal = a1 < a2 ? q.x - arm > q.y - bar : q.x - bar > q.y - arm;
  vec2 grad = horizontal ? vec2(sign(c.x), 0.0) : vec2(0.0, sign(c.y));
  float aa = max(aaFrom(grad), 1e-4);
  return 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);
}

float maskRing(vec2 p, float cov) {
  float s = sqrt(clamp(cov, 0.0, 1.0));
  vec2 c = p - 0.5;
  float len = length(c);
  float d = abs(len - 0.3 * s) - 0.09 * s;
  vec2 grad = sign(len - 0.3 * s) * c / max(len, 1e-5);
  float aa = max(aaFrom(grad), 1e-4);
  return 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  float pixelSize = uPixelSize;
  vec2 screen = gl_FragCoord.xy;
  vec4 empty = uTransparent < 0.5 ? vec4(vec3(uLightMode > 0.5 ? 1.0 : 0.0), 1.0) : vec4(0.0);

  float lod = 0.0;
  float depthFade = 1.0;
  if (uTilted > 0.5) {
    vec3 plane = uPlane * vec3(screen.x, uResolution.y - screen.y, 1.0);
    screen = vec2(plane.x, uResolution.y * plane.z - plane.y) / max(plane.z, 1e-4);
    float footprint = length(fwidth(screen));
    lod = smoothstep(0.3, 0.85, footprint / pixelSize);
    depthFade = (1.0 - smoothstep(0.45, 1.0, footprint / (8.0 * pixelSize))) * step(0.0, plane.z);
  }

  vec2 fragCoord = screen - uResolution * 0.5;
  gDx = dFdx(fragCoord) / pixelSize;
  gDy = dFdy(fragCoord) / pixelSize;
  if (depthFade <= 0.0) {
    fragColor = empty;
    return;
  }

  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  ivec2 texel = clamp(ivec2(cellId) - uOrigin, ivec2(0), uCellCount - 1);
  vec2 smoothAt = (fragCoord / cellPixelSize - vec2(uOrigin)) / vec2(uCellCount);
  vec4 blended = texture(uCells, smoothAt);
  float smoothFeed = blended.b * 2.0 - 0.5;
  float feed = smoothFeed;
  float trail = uHover == 1 ? blended.a : 0.0;
  if (uSmoothing < 1.0) {
    vec4 cell = texelFetch(uCells, texel, 0);
    feed = mix(unpack16(cell.rg), smoothFeed, uSmoothing);
    if (uHover == 1) trail = mix(cell.a, blended.a, uSmoothing);
  }

  if (feed < -0.12 * uSoftness && smoothFeed < 0.2 && (lod <= 0.0 || smoothFeed <= 0.0)) {
    fragColor = empty;
    return;
  }

  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fragCoord / pixelSize - pixelId;
  ivec2 cellBits = ivec2(mod(pixelId, 8.0));
  float bayer = BAYER[cellBits.y * 8 + cellBits.x] - 0.5;
  float margin = feed + bayer - 0.5;
  float bw = uSoftness > 0.0 ? smoothstep(-0.12 * uSoftness, 0.12 * uSoftness, margin) : step(0.0, margin);

  float h = uPixelJitter > 0.0 || uTwinkle > 0.0 ? fract(sin(dot(pixelId, vec2(127.1, 311.7))) * 43758.5453) : 0.5;
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float heat = max(trail, clamp((feed - 1.0) * 2.5, 0.0, 1.0) * min(uGlow * 2.0, 1.0));
  float coverage = bw * jitterScale * (1.0 + heat * 0.35);
  float M;
  float area;
  if (uShapeType == 1) {
    M = maskCircle(pixelUV, coverage);
    area = 0.196;
  } else if (uShapeType == 2) {
    M = maskTriangle(pixelUV, pixelId, coverage);
    area = 0.5;
  } else if (uShapeType == 3) {
    M = maskDiamond(pixelUV, coverage);
    area = 0.62;
  } else if (uShapeType == 4) {
    M = maskCross(pixelUV, coverage);
    area = 0.41;
  } else if (uShapeType == 5) {
    M = maskRing(pixelUV, coverage);
    area = 0.41;
  } else {
    M = maskSquare(pixelUV, coverage, uSoftness);
    area = 1.0;
  }
  if (lod > 0.0) {
    float average = clamp(smoothFeed, 0.0, 1.0) * area * (1.0 + heat * 0.35);
    M = mix(M, average, lod);
  }

  if (uTwinkle > 0.0) {
    float rate = 1.5 + 3.0 * fract(h * 7.31);
    float wave = 0.5 + 0.5 * sin(uClock * rate + h * 37.0);
    M *= 1.0 - uTwinkle * 0.55 * wave * wave;
  }

  float density = clamp(smoothFeed, 0.0, 1.0);
  float glow = 0.0;
  if (uGlow > 0.0) {
    float bloom = smoothstep(0.2, 1.0, density);
    glow = bloom * bloom * uGlow * (uLightMode > 0.5 ? 0.12 : 0.22) * depthFade;
  }

  float fade = depthFade;
  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    vec2 edgeA = clamp(norm / uEdgeFade, 0.0, 1.0);
    vec2 edgeB = clamp((1.0 - norm) / uEdgeFade, 0.0, 1.0);
    vec2 sa = edgeA * edgeA * edgeA * (edgeA * (edgeA * 6.0 - 15.0) + 10.0);
    vec2 sb = edgeB * edgeB * edgeB * (edgeB * (edgeB * 6.0 - 15.0) + 10.0);
    fade *= sa.x * sa.y * sb.x * sb.y;
  }
  M = clamp(M, 0.0, 1.0) * fade;
  glow *= fade;

  float hot = clamp(heat, 0.0, 1.0);
  float tone = smoothstep(0.3, 1.0, density) * 0.85;
  vec3 color = mix(uColor, uAccent, max(tone, hot));
  vec3 lit = uLightMode > 0.5 ? color * (1.0 - 0.35 * hot) : mix(color, vec3(1.0), 0.45 * hot);
  if (uNoise > 0.0) {
    float n = hash(floor(gl_FragCoord.xy) + floor(uTime * 60.0));
    lit = clamp(lit + (n - 0.5) * uNoise, 0.0, 1.0);
  }

  vec3 haze = uLightMode > 0.5 ? mix(color, vec3(1.0), 0.35) : color;
  float alpha = M + glow * (1.0 - M);
  vec3 premul = lit * M + haze * glow * (1.0 - M);
  if (uTransparent < 0.5) {
    vec3 paper = vec3(uLightMode > 0.5 ? 1.0 : 0.0);
    fragColor = vec4(premul + paper * (1.0 - alpha), 1.0);
    return;
  }
  fragColor = vec4(premul, alpha);
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

const colorCache = new Map<string, number[]>();

const hexToRgb = (hex: string): number[] => {
  const key = String(hex);
  const cached = colorCache.get(key);
  if (cached) return cached;
  const rgb = parseHex(hex);
  if (colorCache.size > 64) colorCache.clear();
  colorCache.set(key, rgb);
  return rgb;
};

const parseHex = (hex: string): number[] => {
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

const randomFloat = () => {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const u32 = new Uint32Array(1);
    window.crypto.getRandomValues(u32);
    return u32[0] / 0xffffffff;
  }
  return Math.random();
};

const invert3 = (m: number[]): number[] => {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C || 1;
  return [
    A / det,
    -(b * i - c * h) / det,
    (b * f - c * e) / det,
    B / det,
    (a * i - c * g) / det,
    -(a * f - c * d) / det,
    C / det,
    -(a * h - b * g) / det,
    (a * e - b * d) / det
  ];
};

const multiply3 = (x: number[], y: number[]): number[] => {
  const out: number[] = new Array(9);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out[r * 3 + c] = x[r * 3] * y[c] + x[r * 3 + 1] * y[3 + c] + x[r * 3 + 2] * y[6 + c];
    }
  }
  return out;
};

const planeFor = (tiltX: number, tiltY: number, width: number, height: number) => {
  const ax = (tiltX * Math.PI) / 180;
  const ay = (tiltY * Math.PI) / 180;
  const depth = Math.max(width, height) * 1.25;
  const cx = width / 2;
  const cy = height / 2;
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
  const forward = multiply3(multiply3([1, 0, cx, 0, 1, cy, 0, 0, 1], tilt), [1, 0, -cx, 0, 1, -cy, 0, 0, 1]);
  return invert3(forward);
};

const PixelBlast = ({
  variant = 'square',
  pixelSize = 3,
  color = '#B497CF',
  accentColor,
  className,
  style,
  patternScale = 2,
  patternDensity = 1,
  pixelSizeJitter = 0,
  enableRipples = true,
  rippleIntensityScale = 1,
  rippleThickness = 0.1,
  rippleSpeed = 0.3,
  autoPauseOffscreen = true,
  speed = 0.5,
  transparent = true,
  edgeFade = 0.5,
  noiseAmount = 0,
  softness = 0.6,
  smoothing = 1,
  glow = 0.4,
  twinkle = 0.25,
  drift = 0.2,
  driftAngle = 30,
  hoverEffect = 'reveal',
  hoverRadius = 140,
  autoRipple = 0,
  tiltX = 0,
  tiltY = 0,
  intro = true,
  variation,
  lightMode = false,
  dpr
}: PixelBlastProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    variant: SHAPES[variant] ?? 0,
    pixelSize: Math.max(0.5, pixelSize),
    color,
    accentColor: accentColor || color,
    patternScale,
    patternDensity,
    pixelSizeJitter,
    enableRipples,
    rippleIntensityScale,
    rippleThickness: Math.max(0.001, rippleThickness),
    rippleSpeed,
    autoPauseOffscreen,
    speed,
    transparent,
    edgeFade: clamp(edgeFade, 0, 1),
    noiseAmount,
    softness: clamp(softness, 0, 1),
    smoothing: clamp(smoothing, 0, 1),
    glow: clamp(glow, 0, 2),
    twinkle: clamp(twinkle, 0, 1),
    drift,
    driftAngle,
    hoverEffect: HOVERS[hoverEffect] ?? 0,
    hoverRadius: Math.max(10, hoverRadius),
    autoRipple: Math.max(0, autoRipple),
    tiltX: clamp(tiltX, -70, 70),
    tiltY: clamp(tiltY, -70, 70),
    intro,
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

    const makeTexture = (filter: number) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      return texture;
    };
    const targets = [0, 1].map(() => {
      const texture = makeTexture(gl.LINEAR);
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return { texture, framebuffer };
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const view: { width: number; height: number; ratio: number; plane: number[] | null; tiltKey: string } = {
      width: 1,
      height: 1,
      ratio: 1,
      plane: null,
      tiltKey: ''
    };
    const cells = { x: 0, y: 0, w: 1, h: 1, key: '' };
    const pointer = { x: 0, y: 0, inside: false };
    const mouse = { x: 0, y: 0, ready: false };
    const clickPos = new Float32Array(MAX_CLICKS * 2).fill(-1);
    const clickAt = new Float32Array(MAX_CLICKS);
    const clickAge = new Float32Array(MAX_CLICKS);
    let clickIndex = 0;
    let current = 0;
    let fresh = true;
    const seedOffset = settingsRef.current.variation;
    const timeOffset = typeof seedOffset === 'number' ? seedOffset * 37 : randomFloat() * 1000;
    let elapsed = 0;
    let clock = 0;
    let presence = 0;
    let driftX = 0;
    let driftY = 0;
    let introClock = settingsRef.current.intro && !reduce ? 0 : 1;
    let nextAuto = 1.2;
    let raf = 0;
    let last = 0;
    let visible = true;
    let quiet = 0;

    const patternTime = (s: Settings) => timeOffset + elapsed * s.speed;

    const layoutCells = (s: Settings) => {
      const ps = s.pixelSize * view.ratio;
      const cps = 8 * ps;
      const w = canvas.width;
      const h = canvas.height;
      let minX = -w / 2;
      let maxX = w / 2;
      let minY = -h / 2;
      let maxY = h / 2;
      if (view.plane) {
        const corners = [
          [0, 0],
          [w, 0],
          [0, h],
          [w, h],
          [w / 2, 0],
          [w / 2, h],
          [0, h / 2],
          [w, h / 2]
        ];
        minX = Infinity;
        maxX = -Infinity;
        minY = Infinity;
        maxY = -Infinity;
        for (const [x, y] of corners) {
          const [qx, qy] = toPlane(x, y);
          if (qx < -1e5) continue;
          minX = Math.min(minX, qx - w / 2);
          maxX = Math.max(maxX, qx - w / 2);
          minY = Math.min(minY, qy - h / 2);
          maxY = Math.max(maxY, qy - h / 2);
        }
        if (!Number.isFinite(minX)) {
          minX = -w / 2;
          maxX = w / 2;
          minY = -h / 2;
          maxY = h / 2;
        }
      }
      const pad = cps;
      const x0 = Math.floor((minX - pad) / cps);
      const x1 = Math.floor((maxX + pad) / cps);
      const y0 = Math.floor((minY - pad) / cps);
      const y1 = Math.floor((maxY + pad) / cps);
      const width = Math.max(1, Math.min(2048, x1 - x0 + 1));
      const height = Math.max(1, Math.min(2048, y1 - y0 + 1));
      const key = `${x0}:${y0}:${width}:${height}`;
      if (key === cells.key) return;
      cells.key = key;
      cells.x = x0;
      cells.y = y0;
      cells.w = width;
      cells.h = height;
      for (const target of targets) {
        gl.bindTexture(gl.TEXTURE_2D, target.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      fresh = true;
    };

    const planeClicks = new Float32Array(MAX_CLICKS * 2);

    const stepCells = (s: Settings, decay: number) => {
      for (let k = 0; k < MAX_CLICKS; k++) {
        if (clickPos[k * 2] < 0) {
          planeClicks[k * 2] = -1;
          planeClicks[k * 2 + 1] = -1;
          continue;
        }
        const [px, py] = toPlane(clickPos[k * 2], clickPos[k * 2 + 1]);
        planeClicks[k * 2] = Math.max(px, 0);
        planeClicks[k * 2 + 1] = py;
      }
      const [mx, my] = toPlane(mouse.x, mouse.y);
      const source = targets[current];
      const target = targets[1 - current];
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.viewport(0, 0, cells.w, cells.h);
      gl.disable(gl.BLEND);
      gl.useProgram(cellShader.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, source.texture);
      gl.uniform1i(cu.uPrev, 0);
      gl.uniform2f(cu.uResolution, canvas.width, canvas.height);
      gl.uniform1f(cu.uTime, patternTime(s));
      gl.uniform1f(cu.uPixelSize, s.pixelSize * view.ratio);
      gl.uniform1f(cu.uScale, s.patternScale);
      gl.uniform1f(cu.uDensity, s.patternDensity);
      gl.uniform1i(cu.uEnableRipples, s.enableRipples ? 1 : 0);
      gl.uniform1f(cu.uRippleSpeed, s.rippleSpeed);
      gl.uniform1f(cu.uRippleThickness, s.rippleThickness);
      gl.uniform1f(cu.uRippleIntensity, s.rippleIntensityScale);
      gl.uniform2fv(cu.uClickPos, planeClicks);
      gl.uniform1fv(cu.uClickAge, clickAge);
      gl.uniform2i(cu.uOrigin, cells.x, cells.y);
      gl.uniform2f(cu.uDrift, driftX, driftY);
      gl.uniform1i(cu.uHover, s.hoverEffect);
      gl.uniform2f(cu.uMouse, mx, my);
      gl.uniform1f(cu.uMouseRadius, s.hoverRadius * view.ratio);
      gl.uniform1f(cu.uMousePresence, presence);
      gl.uniform1f(cu.uIntro, introClock);
      gl.uniform1f(cu.uDecay, decay);
      gl.uniform1f(cu.uFresh, fresh ? 1 : 0);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      current = 1 - current;
      fresh = false;
    };

    const draw = () => {
      const s = settingsRef.current;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(mainShader.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, targets[current].texture);
      gl.uniform1i(mu.uCells, 0);
      gl.uniform3fv(mu.uColor, hexToRgb(s.color));
      gl.uniform3fv(mu.uAccent, hexToRgb(s.accentColor));
      gl.uniform2f(mu.uResolution, canvas.width, canvas.height);
      gl.uniform1f(mu.uTime, patternTime(s));
      gl.uniform1f(mu.uClock, clock);
      gl.uniform1f(mu.uPixelSize, s.pixelSize * view.ratio);
      gl.uniform1f(mu.uPixelJitter, s.pixelSizeJitter);
      gl.uniform1f(mu.uEdgeFade, s.edgeFade);
      gl.uniform1i(mu.uShapeType, s.variant);
      gl.uniform2i(mu.uOrigin, cells.x, cells.y);
      gl.uniform2i(mu.uCellCount, cells.w, cells.h);
      gl.uniform1f(mu.uSoftness, s.softness);
      gl.uniform1f(mu.uSmoothing, s.smoothing);
      gl.uniform1f(mu.uGlow, s.glow);
      gl.uniform1f(mu.uTwinkle, reduce ? 0 : s.twinkle);
      gl.uniform1f(mu.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform1f(mu.uTransparent, s.transparent ? 1 : 0);
      gl.uniform1f(mu.uNoise, s.noiseAmount);
      gl.uniform1i(mu.uHover, s.hoverEffect);
      gl.uniform1f(mu.uTilted, view.plane ? 1 : 0);
      if (view.plane) {
        const m = view.plane;
        gl.uniformMatrix3fv(mu.uPlane, false, [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
      }
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const toPlane = (x: number, y: number): number[] => {
      const m = view.plane;
      if (!m) return [x, y];
      const h = canvas.height;
      const cy = h - y;
      const z = m[6] * x + m[7] * cy + m[8];
      if (z <= 1e-4) return [-1e6, -1e6];
      return [(m[0] * x + m[1] * cy + m[2]) / z, h - (m[3] * x + m[4] * cy + m[5]) / z];
    };

    const updatePlane = (s: Settings) => {
      view.plane = s.tiltX || s.tiltY ? planeFor(s.tiltX, s.tiltY, canvas.width, canvas.height) : null;
      view.tiltKey = `${s.tiltX}:${s.tiltY}:${canvas.width}:${canvas.height}`;
    };

    const resize = () => {
      const s = settingsRef.current;
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      if (!mouse.ready) {
        mouse.ready = true;
        mouse.x = canvas.width / 2;
        mouse.y = canvas.height / 2;
      }
      updatePlane(s);
      layoutCells(s);
      stepCells(s, 0);
      draw();
      wake();
    };

    const frame = (now: number) => {
      raf = 0;
      const s = settingsRef.current;
      if (!visible && s.autoPauseOffscreen) return;
      if (document.hidden) return;
      const dt = last ? clamp((now - last) / 1000, 0, 1 / 20) : 0;
      last = now;
      if (!reduce) elapsed += dt;
      clock += dt;
      if (!reduce && s.drift) {
        const angle = (s.driftAngle * Math.PI) / 180;
        driftX += Math.cos(angle) * s.drift * dt * 0.05;
        driftY += Math.sin(angle) * s.drift * dt * 0.05;
      }
      if (!reduce && s.enableRipples && s.autoRipple > 0 && introClock >= 1) {
        nextAuto -= dt;
        if (nextAuto <= 0) {
          nextAuto = s.autoRipple * (0.7 + Math.random() * 0.6);
          addRipple((0.15 + Math.random() * 0.7) * view.width, (0.15 + Math.random() * 0.7) * view.height);
        }
      }
      for (let k = 0; k < MAX_CLICKS; k++) clickAge[k] = (clock - clickAt[k]) * 0.5;
      const targetX = pointer.x * view.ratio;
      const targetY = (view.height - pointer.y) * view.ratio;
      const follow = 1 - Math.exp(-dt / 0.08);
      if (pointer.inside) {
        mouse.x += (targetX - mouse.x) * follow;
        mouse.y += (targetY - mouse.y) * follow;
      }
      presence += ((pointer.inside ? 1 : 0) - presence) * (1 - Math.exp(-dt / 0.25));
      const key = `${s.tiltX}:${s.tiltY}:${canvas.width}:${canvas.height}`;
      if (key !== view.tiltKey) updatePlane(s);
      layoutCells(s);
      const decay = s.hoverEffect ? Math.exp(-dt / 0.45) : 0;
      stepCells(s, decay);
      draw();
      if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
      let busy = !reduce && (s.speed !== 0 || s.drift !== 0 || s.twinkle > 0 || (s.autoRipple > 0 && s.enableRipples));
      busy = busy || introClock < 1 || presence > 0.001;
      for (let k = 0; k < MAX_CLICKS; k++) busy = busy || (clickPos[k * 2] >= 0 && clickAge[k] < 8);
      quiet = busy ? 0 : quiet + dt;
      if (quiet < 1.5) raf = requestAnimationFrame(frame);
    };

    function wake() {
      quiet = 0;
      if (!raf && (visible || !settingsRef.current.autoPauseOffscreen) && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
    };

    const onPointerMove = (event: PointerEvent) => {
      const { x, y, inside } = locate(event);
      const was = pointer.inside;
      pointer.inside = inside;
      if (inside) {
        pointer.x = x;
        pointer.y = y;
        if (!was) {
          mouse.x = x * view.ratio;
          mouse.y = (view.height - y) * view.ratio;
        }
      }
      if (inside || was) wake();
    };

    function addRipple(x: number, y: number) {
      clickPos[clickIndex * 2] = x * view.ratio;
      clickPos[clickIndex * 2 + 1] = (view.height - y) * view.ratio;
      clickAt[clickIndex] = clock;
      clickIndex = (clickIndex + 1) % MAX_CLICKS;
      wake();
    }

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      const { x, y, inside } = locate(event);
      if (!inside || reduce || !s.enableRipples) return;
      addRipple(x, y);
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
        gl.deleteTexture(target.texture);
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
      className={['relative h-full w-full overflow-hidden', className].filter(Boolean).join(' ')}
      style={style}
      aria-label="PixelBlast interactive background"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
};

export default PixelBlast;
