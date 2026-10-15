'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';

export type AcidSquaresShape = 'square' | 'round';

export type AcidSquaresDetail = 'low' | 'medium' | 'high';

export type AcidSquaresLighting = 'split' | 'backlit' | 'overhead';

export type AcidSquaresHoverEffect = 'press' | 'lift' | 'none';

export type AcidSquaresPulseOrigin = 'center' | 'random';

export interface AcidSquaresProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
  accentColor?: string;
  secondaryColor?: string;
  tileSize?: number;
  gap?: number;
  roundness?: number;
  softness?: number;
  bulge?: number;
  rotation?: number;
  gloss?: number;
  waves?: number;
  waveScale?: number;
  speed?: number;
  shape?: AcidSquaresShape;
  pulse?: number;
  pulseSpeed?: number;
  pulseSpacing?: number;
  pulseWidth?: number;
  pulseOrigin?: AcidSquaresPulseOrigin;
  brightness?: number;
  lighting?: AcidSquaresLighting;
  tilt?: number;
  zoom?: number;
  depth?: number;
  grain?: number;
  fade?: number;
  opacity?: number;
  intro?: boolean;
  mouseInteraction?: boolean;
  hoverEffect?: AcidSquaresHoverEffect;
  mouseStrength?: number;
  mouseRadius?: number;
  pulseOnClick?: boolean;
  detail?: AcidSquaresDetail;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
}

type Light = [number, number, number, number, number];

type Settings = {
  color: string;
  accentColor: string;
  secondaryColor: string;
  tileSize: number;
  gap: number;
  roundness: number;
  softness: number;
  bulge: number;
  rotation: number;
  gloss: number;
  waves: number;
  waveScale: number;
  speed: number;
  square: number;
  pulse: number;
  pulseSpeed: number;
  pulseSpacing: number;
  pulseWidth: number;
  randomOrigin: boolean;
  brightness: number;
  lights: Light[];
  tilt: number;
  zoom: number;
  depth: number;
  grain: number;
  fade: number;
  opacity: number;
  intro: boolean;
  mouseInteraction: boolean;
  hover: number;
  mouseStrength: number;
  mouseRadius: number;
  pulseOnClick: boolean;
  mesh: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
};

type Surface = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

type Ripple = { x: number; z: number; start: number; strength: number };

type Camera = { eye: number[]; target: number[]; viewProj: number[]; inverse: number[]; distance: number };

const MAX_RIPPLES = 8;
const MESH: Record<AcidSquaresDetail, number> = { low: 150, medium: 210, high: 280 };
const AREA = [-42, -76, 84, 94];
const MAX_RENDER_DIM = 2400;
const INTRO_SECONDS = 3;
const REVEAL_SECONDS = 2.6;
const REVEAL_REACH = 19;
const ORIGIN = [0, -3];
const HOVER_EFFECTS: Record<AcidSquaresHoverEffect, number> = { press: 1, lift: -1, none: 0 };
const LIGHTING: Record<AcidSquaresLighting, Light[]> = {
  split: [
    [7, 4.2, -4, 4, 4],
    [-8, 3.6, 3, 4, 4]
  ],
  backlit: [
    [6, 1.6, -15, 5, 3],
    [-7, 1.4, -13, 5, 3]
  ],
  overhead: [
    [3, 7.5, -4, 3, 3],
    [-3, 7, -1, 3, 3]
  ]
};
const DEG = Math.PI / 180;

const FIELD = `
uniform vec4 uRipples[${MAX_RIPPLES}];
uniform vec4 uWave;
uniform float uSquare;
uniform float uClock;
uniform vec4 uSwell;
uniform vec4 uHover;
uniform vec4 uIntro;

float reachOf(vec2 delta, out vec2 grad) {
  vec2 a = abs(delta);
  vec2 dir = vec2(delta.x < 0.0 ? -1.0 : 1.0, delta.y < 0.0 ? -1.0 : 1.0);
  float round_ = length(delta);
  vec2 roundGrad = delta / max(round_, 1e-4);
  float m = max(max(a.x, a.y), 1e-4);
  vec2 k = a / m;
  vec2 k3 = k * k * k;
  float sum = dot(k3, k);
  float root = sqrt(sqrt(sum));
  float square = m * root;
  vec2 squareGrad = dir * k3 / (root * root * root);
  float d = mix(round_, square, uSquare);
  vec2 g = mix(roundGrad, squareGrad, uSquare);
  float soft = sqrt(d * d + 0.36);
  grad = g * d / soft;
  return soft - 0.6;
}

vec3 field(vec2 p) {
  float t = uSwell.w;
  float f = uSwell.y;
  vec2 k1 = vec2(0.19, 0.11) * f;
  vec2 k2 = vec2(-0.09, 0.23) * f;
  vec2 k3 = vec2(0.29, -0.17) * f;
  float a1 = dot(p, k1) + t * 0.55;
  float a2 = dot(p, k2) - t * 0.42 + 1.3;
  float a3 = dot(p, k3) + t * 0.74 + 2.1;
  float h = 0.55 * sin(a1) + 0.4 * sin(a2) + 0.22 * sin(a3);
  vec2 g = 0.55 * cos(a1) * k1 + 0.4 * cos(a2) * k2 + 0.22 * cos(a3) * k3;
  h *= uSwell.x;
  g *= uSwell.x;
  vec2 dg;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    if (r.w <= 0.0) continue;
    float age = uClock - r.z;
    if (age <= 0.0) continue;
    float d = reachOf(p - r.xy, dg);
    float radius = age * uWave.y;
    float x = (d - radius) / uWave.z;
    float life = clamp(1.0 - radius / uWave.w, 0.0, 1.0);
    float strength = r.w * uWave.x * life * life * smoothstep(0.0, 1.5, radius);
    float bump = exp(-x * x);
    h += bump * strength;
    g += -2.0 * x * bump * strength / uWave.z * dg;
  }
  if (uIntro.w > 0.0) {
    float d = reachOf(p - uIntro.xy, dg);
    float x = (d - uIntro.z) / 2.2;
    float bump = exp(-x * x) * uIntro.w;
    h += bump;
    g += -2.0 * x * bump / 2.2 * dg;
  }
  vec2 hd = p - uHover.xy;
  float hr = max(uHover.z, 1e-3);
  float hover = exp(-dot(hd, hd) / (hr * hr)) * uHover.w;
  h -= hover;
  g += 2.0 * hd / (hr * hr) * hover;
  return vec3(h, g);
}
`;

const VERTEX = `#version 300 es
precision highp float;
${FIELD}
layout(location = 0) in vec2 aGrid;
uniform mat4 uViewProj;
uniform vec4 uArea;
out vec2 vGround;
out vec3 vWorld;
void main() {
  vec2 ground = uArea.xy + aGrid * uArea.zw;
  vec3 f = field(ground);
  vWorld = vec3(ground.x, f.x, ground.y);
  vGround = ground;
  gl_Position = uViewProj * vec4(vWorld, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
${FIELD}
uniform vec3 uEye;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform vec3 uSecond;
uniform vec3 uLightA;
uniform vec3 uLightB;
uniform float uTile;
uniform float uAngle;
uniform float uGap;
uniform float uRound;
uniform float uSoftness;
uniform float uBulge;
uniform float uGloss;
uniform vec2 uRange;
uniform float uBrightness;
uniform float uGrain;
uniform float uGrainScale;
uniform float uLightMode;
uniform float uOpacity;
uniform vec4 uReveal;
uniform vec2 uView;
uniform float uFade;
uniform float uFrame;
in vec2 vGround;
in vec3 vWorld;
out vec4 outColor;

float smoother(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 f = field(vGround);
  vec3 n0 = normalize(vec3(-f.y, 1.0, -f.z));
  vec3 tx = normalize(vec3(1.0, f.y, 0.0));
  vec3 tz = normalize(cross(tx, n0));
  tx = normalize(cross(n0, tz));

  float c = cos(uAngle);
  float s = sin(uAngle);
  mat2 toTile = mat2(c, -s, s, c);
  vec2 q = toTile * vGround / uTile;
  vec2 cell = floor(q);
  vec2 local = q - cell - 0.5;
  float footprint = max(length(fwidth(q)), 1e-5);

  float on = 1.0;
  if (uReveal.w < 1.0) {
    vec2 centre = transpose(toTile) * (cell + 0.5) * uTile;
    vec2 dg;
    float d = reachOf(centre - uReveal.xy, dg);
    float delay = hash(vec3(cell, 7.0)) * 1.1;
    on = max(smoother((uReveal.z - d - delay) / 1.6), uReveal.w);
  }

  float half_ = (0.5 - uGap * 0.5) * mix(0.62, 1.0, on);
  float radius = min(uRound * half_, half_);
  vec2 dd = abs(local) - (half_ - radius);
  float d = length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0) - radius;
  vec2 outward = dd.x > 0.0 || dd.y > 0.0 ? normalize(max(dd, 0.0) * sign(local)) : (dd.x > dd.y ? vec2(sign(local.x), 0.0) : vec2(0.0, sign(local.y)));

  float bevelWidth = max(mix(0.04, 0.42, uSoftness) * half_, footprint * 1.5);
  float edge = clamp((d + bevelWidth) / bevelWidth, 0.0, 1.0);
  float dome = uBulge * 0.5 * length(local) / max(half_, 1e-3);
  float theta = edge * edge * mix(0.7, 1.35, uSoftness) + dome;
  vec2 outwardGround = transpose(toTile) * outward;
  vec2 domeGround = transpose(toTile) * (local / max(length(local), 1e-4));
  vec3 bend = normalize(tx * mix(domeGround.x, outwardGround.x, edge) + tz * mix(domeGround.y, outwardGround.y, edge));
  float crowd = smoothstep(0.08, 0.3, footprint);
  theta *= 1.0 - crowd;
  vec3 n = normalize(n0 * cos(theta) + bend * sin(theta));

  float inside = 1.0 - smoothstep(-footprint * 0.75, footprint * 0.75, d);
  float area = (2.0 * half_) * (2.0 * half_) - (4.0 - 3.14159) * radius * radius;
  inside = mix(inside, area, crowd) * on;

  vec3 toEye = uEye - vWorld;
  float dist = length(toEye);
  vec3 v = toEye / dist;
  vec3 la = uLightA - vWorld;
  vec3 lb = uLightB - vWorld;
  float da = length(la);
  float db = length(lb);
  la /= da;
  lb /= db;
  float fa = 1.0 / (1.0 + da * da * 0.02);
  float fb = 1.0 / (1.0 + db * db * 0.02);

  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  vec3 ha = normalize(la + v);
  vec3 hb = normalize(lb + v);
  float shine = mix(10.0, 90.0, uGloss);
  float norm = (shine + 8.0) / 60.0;
  float specA = pow(max(dot(n, ha), 0.0), shine) * norm;
  float specB = pow(max(dot(n, hb), 0.0), shine) * norm;
  float sheenA = pow(max(dot(n, ha), 0.0), 8.0);
  float sheenB = pow(max(dot(n, hb), 0.0), 8.0);
  float diffA = max(dot(n, la), 0.0);
  float diffB = max(dot(n, lb), 0.0);
  vec3 r = reflect(-v, n);
  float rim = exp((dot(r, normalize(vec3(0.15, 0.55, -1.0))) - 1.0) * 6.0);
  float occlusion = mix(1.0, 0.35, edge * edge);
  float edgeLight = edge * edge;

  vec3 color;
  float alpha;
  if (uLightMode > 0.5) {
    float luma = dot(uColor, vec3(0.299, 0.587, 0.114));
    vec3 body = mix(vec3(luma), uColor, 0.5) * 0.96;
    vec3 keyDir = normalize(vec3(-0.35, 0.85, 0.45));
    float shade = clamp(dot(n, keyDir) * 0.6 + 0.5, 0.0, 1.0);
    float wa = clamp(diffA * fa * 9.0, 0.0, 1.0);
    float wb = clamp(diffB * fb * 9.0, 0.0, 1.0);
    vec3 hue = (uAccent * wa + uSecond * wb) / max(wa + wb, 1e-3);
    vec3 lit = body * mix(vec3(1.0), hue, clamp(wa + wb, 0.0, 1.0) * 0.42) * mix(0.7, 1.05, shade);
    lit += vec3(1.0) * (specA * fa + specB * fb) * 2.4 * uGloss;
    lit *= mix(1.0, 0.8, edgeLight * (1.0 - crowd));
    color = lit;
    alpha = inside;
  } else {
    float luma = dot(uColor, vec3(0.299, 0.587, 0.114));
    vec3 body = mix(vec3(luma), uColor, 0.35) + vec3(0.02);
    vec3 lit = body * 0.25;
    lit += body * (uAccent * diffA * fa + uSecond * diffB * fb) * 14.0;
    lit += uAccent * (specA * (0.55 + 1.6 * edgeLight) + sheenA * 0.3) * fa * 9.0 * uGloss;
    lit += uSecond * (specB * (0.55 + 1.6 * edgeLight) + sheenB * 0.3) * fb * 9.0 * uGloss;
    lit += mix(uSecond, vec3(1.0), 0.4) * rim * fresnel * 0.35 * uGloss;
    lit *= occlusion;
    color = lit * inside;
    alpha = inside;
  }

  float fade = 1.0 - smoother((dist - uRange.x) / max(uRange.y - uRange.x, 1e-3));
  alpha *= fade * uOpacity;
  color *= uBrightness;
  if (uLightMode < 0.5) color = 1.0 - exp(-color * 1.1);

  vec2 grainCell = floor(gl_FragCoord.xy / uGrainScale);
  float grain = hash(vec3(grainCell, uFrame)) + hash(vec3(grainCell + 17.0, uFrame + 3.0)) - 1.0;
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color += grain * uGrain * (uLightMode > 0.5 ? 0.6 : 0.25 + 0.75 * sqrt(clamp(lum, 0.0, 1.0)));
  color = clamp(color, 0.0, 1.0);

  vec2 uv = gl_FragCoord.xy / uView;
  float edgeFade = max(uFade * 0.5, 1e-4);
  float mask = uFade > 0.0 ? smoother(uv.x / edgeFade) * smoother((1.0 - uv.x) / edgeFade) * smoother(uv.y / edgeFade) * smoother((1.0 - uv.y) / edgeFade) : 1.0;
  alpha *= mask;
  outColor = vec4(color * alpha, alpha);
}`;

const UNIFORMS = [
  'uRipples',
  'uWave',
  'uSquare',
  'uClock',
  'uSwell',
  'uHover',
  'uIntro',
  'uViewProj',
  'uArea',
  'uEye',
  'uColor',
  'uAccent',
  'uSecond',
  'uLightA',
  'uLightB',
  'uTile',
  'uAngle',
  'uGap',
  'uRound',
  'uSoftness',
  'uBulge',
  'uGloss',
  'uRange',
  'uBrightness',
  'uGrain',
  'uGrainScale',
  'uLightMode',
  'uOpacity',
  'uReveal',
  'uView',
  'uFade',
  'uFrame'
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ease = (x: number) => {
  const t = clamp(x, 0, 1);
  return 1 - (1 - t) * (1 - t) * (1 - t);
};

const glide = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): Surface | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
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
  for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
};

const perspective = (fov: number, aspect: number, near: number, far: number) => {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
};

const lookAt = (eye: number[], target: number[]) => {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len;
  zy /= len;
  zz /= len;
  let xx = zz;
  let xz = -zx;
  len = Math.hypot(xx, xz) || 1;
  xx /= len;
  xz /= len;
  const yx = zy * xz;
  const yy = zz * xx - zx * xz;
  const yz = -zy * xx;
  return [
    xx,
    yx,
    zx,
    0,
    0,
    yy,
    zy,
    0,
    xz,
    yz,
    zz,
    0,
    -(xx * eye[0] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1
  ];
};

const multiply = (a: number[], b: number[]) => {
  const out: number[] = new Array(16);
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[col * 4 + row] =
        a[row] * b[col * 4] + a[4 + row] * b[col * 4 + 1] + a[8 + row] * b[col * 4 + 2] + a[12 + row] * b[col * 4 + 3];
    }
  }
  return out;
};

const invert = (a: number[]) => {
  const b00 = a[0] * a[5] - a[1] * a[4];
  const b01 = a[0] * a[6] - a[2] * a[4];
  const b02 = a[0] * a[7] - a[3] * a[4];
  const b03 = a[1] * a[6] - a[2] * a[5];
  const b04 = a[1] * a[7] - a[3] * a[5];
  const b05 = a[2] * a[7] - a[3] * a[6];
  const b06 = a[8] * a[13] - a[9] * a[12];
  const b07 = a[8] * a[14] - a[10] * a[12];
  const b08 = a[8] * a[15] - a[11] * a[12];
  const b09 = a[9] * a[14] - a[10] * a[13];
  const b10 = a[9] * a[15] - a[11] * a[13];
  const b11 = a[10] * a[15] - a[11] * a[14];
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  const k = det ? 1 / det : 0;
  return [
    (a[5] * b11 - a[6] * b10 + a[7] * b09) * k,
    (a[2] * b10 - a[1] * b11 - a[3] * b09) * k,
    (a[13] * b05 - a[14] * b04 + a[15] * b03) * k,
    (a[10] * b04 - a[9] * b05 - a[11] * b03) * k,
    (a[6] * b08 - a[4] * b11 - a[7] * b07) * k,
    (a[0] * b11 - a[2] * b08 + a[3] * b07) * k,
    (a[14] * b02 - a[12] * b05 - a[15] * b01) * k,
    (a[8] * b05 - a[10] * b02 + a[11] * b01) * k,
    (a[4] * b10 - a[5] * b08 + a[7] * b06) * k,
    (a[1] * b08 - a[0] * b10 - a[3] * b06) * k,
    (a[12] * b04 - a[13] * b02 + a[15] * b00) * k,
    (a[9] * b02 - a[8] * b04 - a[11] * b00) * k,
    (a[5] * b07 - a[4] * b09 - a[6] * b06) * k,
    (a[0] * b09 - a[1] * b07 + a[2] * b06) * k,
    (a[13] * b01 - a[12] * b03 - a[14] * b00) * k,
    (a[8] * b03 - a[9] * b01 + a[10] * b00) * k
  ];
};

const AcidSquares = ({
  color = '#120f17',
  accentColor = '#ff4fb8',
  secondaryColor = '#3b6bff',
  tileSize = 1,
  gap = 0.12,
  roundness = 0.25,
  softness = 0.5,
  bulge = 0.3,
  rotation = 35,
  gloss = 0.6,
  waves = 1,
  waveScale = 1,
  speed = 0.6,
  shape = 'square',
  pulse = 1,
  pulseSpeed = 0.45,
  pulseSpacing = 1,
  pulseWidth = 1,
  pulseOrigin = 'center',
  brightness = 1,
  lighting = 'split',
  tilt = 0.7,
  zoom = 1,
  depth = 10,
  grain = 0.12,
  fade = 0,
  opacity = 1,
  intro = true,
  mouseInteraction = true,
  hoverEffect = 'press',
  mouseStrength = 1,
  mouseRadius = 0.35,
  pulseOnClick = true,
  detail = 'medium',
  lightMode = false,
  paused = false,
  dpr,
  ...rest
}: AcidSquaresProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    color: String(color),
    accentColor: String(accentColor),
    secondaryColor: String(secondaryColor),
    tileSize: clamp(tileSize, 0.2, 5),
    gap: clamp(gap, 0, 0.6),
    roundness: clamp(roundness, 0, 1),
    softness: clamp(softness, 0, 1),
    bulge: clamp(bulge, 0, 1.5),
    rotation: rotation * DEG,
    gloss: clamp(gloss, 0, 1),
    waves: Math.max(0, waves),
    waveScale: clamp(waveScale, 0.1, 5),
    speed: Math.max(0, speed),
    square: shape === 'round' ? 0 : 1,
    pulse: Math.max(0, pulse),
    pulseSpeed: Math.max(0, pulseSpeed),
    pulseSpacing: clamp(pulseSpacing, 0.2, 6),
    pulseWidth: clamp(pulseWidth, 0.1, 5),
    randomOrigin: pulseOrigin === 'random',
    brightness: Math.max(0, brightness),
    lights: LIGHTING[lighting] || LIGHTING.split,
    tilt: clamp(tilt, 0, 1),
    zoom: clamp(zoom, 0.3, 4),
    depth: clamp(depth, 2, 40),
    grain: Math.max(0, grain),
    fade: clamp(fade, 0, 1),
    opacity: clamp(opacity, 0, 1),
    intro,
    mouseInteraction,
    hover: HOVER_EFFECTS[hoverEffect] ?? 1,
    mouseStrength: Math.max(0, mouseStrength),
    mouseRadius: clamp(mouseRadius, 0.02, 2),
    pulseOnClick,
    mesh: MESH[detail] || MESH.medium,
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
      antialias: true,
      depth: true,
      stencil: false
    });
    if (!container || !canvas || !gl) return undefined;

    const surface = link(gl, VERTEX, FRAGMENT);
    if (!surface) return undefined;

    const vao = gl.createVertexArray();
    const gridBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    let meshSize = 0;
    let indexCount = 0;
    const buildMesh = (size: number) => {
      if (size === meshSize) return;
      meshSize = size;
      const points = new Float32Array((size + 1) * (size + 1) * 2);
      let o = 0;
      for (let j = 0; j <= size; j += 1) {
        for (let i = 0; i <= size; i += 1) {
          points[o] = i / size;
          points[o + 1] = j / size;
          o += 2;
        }
      }
      const indices = new Uint32Array(size * size * 6);
      o = 0;
      for (let j = 0; j < size; j += 1) {
        for (let i = 0; i < size; i += 1) {
          const a = j * (size + 1) + i;
          const b = a + 1;
          const c = a + size + 1;
          const d = c + 1;
          indices[o] = a;
          indices[o + 1] = c;
          indices[o + 2] = b;
          indices[o + 3] = b;
          indices[o + 4] = c;
          indices[o + 5] = d;
          o += 6;
        }
      }
      indexCount = indices.length;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
    };

    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeContext = probe.getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = {
      clock: 0,
      swell: 0,
      lights: 0,
      frame: 0,
      nextRipple: 1.2,
      ripples: [] as Ripple[],
      intro: settingsRef.current.intro && !reduce ? 0 : INTRO_SECONDS,
      width: 1,
      height: 1,
      colorKey: '',
      color: [0.07, 0.06, 0.09] as number[],
      accent: [1, 0.31, 0.72] as number[],
      second: [0.23, 0.42, 1] as number[],
      pointer: { x: 0, y: 0, inside: false },
      hover: { x: 0, z: 0, vx: 0, vz: 0, presence: 0, placed: false },
      look: { x: 0, y: 0, vx: 0, vy: 0 },
      seed: 1,
      camera: null as Camera | null
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;

    const toRgb = (value: string, fallback: number[]): number[] => {
      if (!probeContext || !value) return fallback;
      const css = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
      probeContext.clearRect(0, 0, 1, 1);
      probeContext.fillStyle = '#000000';
      probeContext.fillStyle = css;
      probeContext.fillRect(0, 0, 1, 1);
      const [r, g, b] = probeContext.getImageData(0, 0, 1, 1).data;
      return [r / 255, g / 255, b / 255];
    };

    const resolveColors = (s: Settings) => {
      const key = `${s.color}|${s.accentColor}|${s.secondaryColor}`;
      if (key === state.colorKey) return;
      state.colorKey = key;
      state.color = toRgb(s.color, [0.07, 0.06, 0.09]);
      state.accent = toRgb(s.accentColor, [1, 0.31, 0.72]);
      state.second = toRgb(s.secondaryColor, [0.23, 0.42, 1]);
    };

    const random = () => {
      state.seed = (state.seed * 16807) % 2147483647;
      return (state.seed - 1) / 2147483646;
    };

    const cameraFor = (s: Settings): Camera => {
      const aspect = state.width / Math.max(state.height, 1);
      const distance = 8 / s.zoom;
      const yaw = state.look.x * 0.16;
      const pitch = 1.5 - s.tilt * 1.26 + state.look.y * 0.05;
      const target = [ORIGIN[0], 0, ORIGIN[1]];
      const eye = [
        target[0] + Math.sin(yaw) * Math.cos(pitch) * distance,
        target[1] + Math.sin(pitch) * distance,
        target[2] + Math.cos(yaw) * Math.cos(pitch) * distance
      ];
      const projection = perspective(0.8, aspect, 0.1, 400);
      const view = lookAt(eye, target);
      const viewProj = multiply(projection, view);
      return { eye, target, viewProj, inverse: invert(viewProj), distance };
    };

    const rippleData = new Float32Array(MAX_RIPPLES * 4);

    const render = () => {
      const s = settingsRef.current;
      buildMesh(s.mesh);
      resolveColors(s);
      const camera = cameraFor(s);
      state.camera = camera;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.useProgram(surface.program);
      const u = surface.uniforms;
      rippleData.fill(0);
      state.ripples.forEach((ripple, index) => {
        rippleData[index * 4] = ripple.x;
        rippleData[index * 4 + 1] = ripple.z;
        rippleData[index * 4 + 2] = ripple.start;
        rippleData[index * 4 + 3] = ripple.strength;
      });
      const introAge = state.intro;
      const revealing = introAge < INTRO_SECONDS;
      const revealRadius = glide(introAge / REVEAL_SECONDS) * REVEAL_REACH;
      const settle = ease(introAge / INTRO_SECONDS);
      gl.uniform4fv(u.uRipples, rippleData);
      gl.uniform4f(u.uWave, 0.55 * s.pulse, 3 * Math.max(s.pulseSpeed, 0.05) + 1.2, 1.6 * s.pulseWidth, 46);
      gl.uniform1f(u.uSquare, s.square);
      gl.uniform1f(u.uClock, state.clock);
      gl.uniform4f(u.uSwell, 1.3 * s.waves * (0.25 + 0.75 * settle), 1.9 / s.waveScale, 0, state.swell);
      gl.uniform4f(
        u.uHover,
        state.hover.x,
        state.hover.z,
        (3 * s.mouseRadius) / 0.35,
        0.7 * state.hover.presence * s.mouseStrength * s.hover
      );
      gl.uniform4f(
        u.uIntro,
        ORIGIN[0],
        ORIGIN[1],
        revealRadius,
        revealing ? 0.9 * (1 - smoothstep(0.55, 1, introAge / INTRO_SECONDS)) : 0
      );
      gl.uniformMatrix4fv(u.uViewProj, false, camera.viewProj);
      gl.uniform4f(u.uArea, AREA[0] + ORIGIN[0], AREA[1] + ORIGIN[1], AREA[2], AREA[3]);
      gl.uniform3f(u.uEye, camera.eye[0], camera.eye[1], camera.eye[2]);
      gl.uniform3f(u.uColor, state.color[0], state.color[1], state.color[2]);
      gl.uniform3f(u.uAccent, state.accent[0], state.accent[1], state.accent[2]);
      gl.uniform3f(u.uSecond, state.second[0], state.second[1], state.second[2]);
      const orbit = state.lights;
      const reach = camera.distance / 8;
      const lightLevel = 0.35 + 0.65 * settle;
      const [first, second] = s.lights;
      gl.uniform3f(
        u.uLightA,
        camera.target[0] + (first[0] + Math.sin(orbit * 0.7) * first[3]) * reach,
        first[1] * reach * lightLevel + 0.6,
        camera.target[2] + (first[2] + Math.cos(orbit * 0.5) * first[4]) * reach
      );
      gl.uniform3f(
        u.uLightB,
        camera.target[0] + (second[0] + Math.cos(orbit * 0.6) * second[3]) * reach,
        second[1] * reach * lightLevel + 0.6,
        camera.target[2] + (second[2] + Math.sin(orbit * 0.45) * second[4]) * reach
      );
      gl.uniform1f(u.uTile, 1.2 * s.tileSize);
      gl.uniform1f(u.uAngle, s.rotation);
      gl.uniform1f(u.uGap, s.gap);
      gl.uniform1f(u.uRound, s.roundness);
      gl.uniform1f(u.uSoftness, s.softness);
      gl.uniform1f(u.uBulge, s.bulge);
      gl.uniform1f(u.uGloss, s.gloss);
      const far = Math.min(s.depth * 3.2 * reach, AREA[3] * 0.62);
      gl.uniform2f(u.uRange, far * 0.5, far);
      gl.uniform1f(u.uBrightness, s.brightness);
      const pixelRatio = canvas.height / Math.max(state.height, 1);
      gl.uniform1f(u.uGrain, s.grain);
      gl.uniform1f(u.uGrainScale, Math.max(1, pixelRatio));
      gl.uniform1f(u.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.uniform4f(u.uReveal, ORIGIN[0], ORIGIN[1], revealRadius, revealing ? 0 : 1);
      gl.uniform2f(u.uView, canvas.width, canvas.height);
      gl.uniform1f(u.uFade, s.fade);
      gl.uniform1f(u.uFrame, state.frame % 977);
      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
      gl.bindVertexArray(null);
      gl.disable(gl.DEPTH_TEST);
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

    const groundPoint = (px: number, py: number) => {
      const camera = state.camera;
      if (!camera) return null;
      const nx = (px / state.width) * 2 - 1;
      const ny = 1 - (py / state.height) * 2;
      const m = camera.inverse;
      const fx = m[0] * nx + m[4] * ny + m[8] + m[12];
      const fy = m[1] * nx + m[5] * ny + m[9] + m[13];
      const fz = m[2] * nx + m[6] * ny + m[10] + m[14];
      const fw = m[3] * nx + m[7] * ny + m[11] + m[15];
      const dx = fx / fw - camera.eye[0];
      const dy = fy / fw - camera.eye[1];
      const dz = fz / fw - camera.eye[2];
      if (dy >= -1e-4) return null;
      const t = -camera.eye[1] / dy;
      return { x: camera.eye[0] + dx * t, z: camera.eye[2] + dz * t };
    };

    const spawn = (x: number, z: number, strength: number) => {
      state.ripples.push({ x, z, start: state.clock, strength });
      while (state.ripples.length > MAX_RIPPLES) state.ripples.shift();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) {
        state.frame += 1;
        state.clock += dt;
        state.intro += dt;
        state.swell += dt * s.speed;
        state.lights += dt * s.speed * 0.6;
        const travel = 3 * Math.max(s.pulseSpeed, 0.05) + 1.2;
        const interval = (10 * s.pulseSpacing) / travel;
        if (s.pulse > 0 && state.clock >= state.nextRipple) {
          if (s.randomOrigin) {
            const spot = groundPoint((0.15 + random() * 0.7) * state.width, (0.25 + random() * 0.6) * state.height);
            if (spot) spawn(spot.x, spot.z, 1);
          } else {
            spawn(ORIGIN[0], ORIGIN[1], 1);
          }
          state.nextRipple = state.clock + interval * (s.randomOrigin ? 0.6 : 1);
        }
        const lifetime = 46 / travel + 1;
        state.ripples = state.ripples.filter(ripple => state.clock - ripple.start < lifetime);
      } else if (state.intro < INTRO_SECONDS) {
        state.intro = INTRO_SECONDS;
      }

      const { pointer, hover, look } = state;
      const active = s.mouseInteraction && pointer.inside && !reduce;
      const spot = active && s.hover !== 0 ? groundPoint(pointer.x, pointer.y) : null;
      if (spot) {
        if (!hover.placed) {
          hover.x = spot.x;
          hover.z = spot.z;
          hover.vx = 0;
          hover.vz = 0;
          hover.placed = true;
        }
        hover.vx += (90 * (spot.x - hover.x) - 19 * hover.vx) * dt;
        hover.vz += (90 * (spot.z - hover.z) - 19 * hover.vz) * dt;
        hover.x += hover.vx * dt;
        hover.z += hover.vz * dt;
      }
      const goal = spot ? 1 : 0;
      hover.presence += (goal - hover.presence) * (1 - Math.exp(-dt / (goal > hover.presence ? 0.35 : 0.6)));
      if (!spot && hover.presence < 0.001) hover.placed = false;
      const lookX = active ? (pointer.x / state.width - 0.5) * 0.5 : 0;
      const lookY = active ? (0.5 - pointer.y / state.height) * 0.5 : 0;
      look.vx += (30 * (lookX - look.x) - 11 * look.vx) * dt;
      look.vy += (30 * (lookY - look.y) - 11 * look.vy) * dt;
      look.x += look.vx * dt;
      look.y += look.vy * dt;

      render();
      const settling =
        Math.abs(goal - hover.presence) > 0.002 ||
        Math.hypot(hover.vx, hover.vz) > 0.01 ||
        Math.abs(lookX - look.x) > 0.0002 ||
        Math.abs(lookY - look.y) > 0.0002;
      if (moving || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      state.pointer.x = x;
      state.pointer.y = y;
      state.pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      if (!s.mouseInteraction || !s.pulseOnClick || event.button !== 0 || reduce) return;
      if (
        event.target instanceof Element &&
        event.target.closest('a, button, input, textarea, select, label, [role="button"]')
      )
        return;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const spot = groundPoint(x, y);
      if (spot) spawn(spot.x, spot.z, 1.15);
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
    window.addEventListener('pointerdown', onPointerDown);
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
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(gridBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(surface.program);
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  const { className = '', ...attributes } = rest;

  return (
    <div
      ref={containerRef}
      className={['relative h-full w-full overflow-hidden', className].filter(Boolean).join(' ')}
      {...attributes}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
};

export default AcidSquares;
