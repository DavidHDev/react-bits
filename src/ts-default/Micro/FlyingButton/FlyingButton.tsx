'use client';

import {
  useEffect,
  useRef,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type ReactNode
} from 'react';
import './FlyingButton.css';

const G = 1100;
const SPRING = 380;
const DAMP = 10;
const REST = G / (2 * SPRING);
const POD_H = 5;
const MAX_JETS = 4;
const TILT_MAX = 0.55;
const G_RIDE = G * 0.75;
const FLIP_TIME = 0.42;
type Size = 'small' | 'medium' | 'large' | 'extra-large';

const SIZES: Record<Size, { h: number; px: number; fs: number; k: number }> = {
  small: { h: 36, px: 16, fs: 13, k: 0.82 },
  medium: { h: 44, px: 22, fs: 14, k: 1 },
  large: { h: 52, px: 26, fs: 16, k: 1.18 },
  'extra-large': { h: 60, px: 30, fs: 18, k: 1.36 }
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : d);
const smooth = (t: number) => {
  const s = clamp(t, 0, 1);
  return s * s * (3 - 2 * s);
};
const jerk = (t: number) => {
  const s = clamp(t, 0, 1);
  return s * s * s * (10 + s * (6 * s - 15));
};
const jerkV = (t: number) => {
  const s = clamp(t, 0, 1);
  return 30 * s * s * (1 - s) * (1 - s);
};
const jerkA = (t: number) => {
  const s = clamp(t, 0, 1);
  return 60 * s * (1 - s) * (1 - 2 * s);
};
const wave = (t: number, k: number) =>
  Math.sin(t * 1.31 + k) * 0.5 + Math.sin(t * 2.73 + k * 1.7) * 0.3 + Math.sin(t * 5.19 + k * 2.3) * 0.2;
const waveD = (t: number, k: number) =>
  Math.cos(t * 1.31 + k) * 0.655 + Math.cos(t * 2.73 + k * 1.7) * 0.819 + Math.cos(t * 5.19 + k * 2.3) * 1.038;

const rgb = (hex?: string): [number, number, number] => {
  const h = String(hex || '').replace('#', '');
  const v = h.length === 3 ? h.replace(/(.)/g, '$1$1') : h.padEnd(6, '0').slice(0, 6);
  const n = parseInt(v, 16);
  if (!Number.isFinite(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 outColor;
`;

const JETS = `
uniform vec4 uJetA[${MAX_JETS}];
uniform vec4 uJetB[${MAX_JETS}];
uniform float uJetBend[${MAX_JETS}];
float jetWeight(vec2 p, vec4 a, vec4 b, out float along) {
  vec2 rel = p - a.xy;
  along = dot(rel, a.zw);
  vec2 off = rel - a.zw * clamp(along, 0.0, b.z);
  return exp(-dot(off, off) / (b.y * b.y)) * smoothstep(-b.y, 0.0, along);
}
`;

const NOISE = `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
`;

const ADVECT = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uWorld;
uniform float uDt;
uniform float uKeep;
void main() {
  vec2 v = textureLod(uVelocity, vUv, 0.0).xy;
  if (!(abs(v.x) < 4000.0 && abs(v.y) < 4000.0)) v = vec2(0.0);
  vec4 c = textureLod(uSource, vUv - uDt * v / uWorld, 0.0) * uKeep;
  outColor = all(lessThan(abs(c), vec4(1e4))) ? c : vec4(0.0);
}`;

const FORCE = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform vec2 uWorld;
uniform float uDt;
uniform float uBuoyancy;
uniform float uLift;
uniform float uDamping;
uniform float uSpread;
uniform float uSplash;
uniform float uFriction;
uniform float uWind;
uniform vec3 uKick;
uniform vec4 uCraft;
uniform vec4 uCraftMotion;
uniform vec2 uTurb;
uniform float uTime;
uniform float uObstacle;
${JETS}
${NOISE}
vec2 curlNoise(vec2 p) {
  float e = 0.35;
  float a = noise(p + vec2(0.0, e));
  float b = noise(p - vec2(0.0, e));
  float c = noise(p + vec2(e, 0.0));
  float d = noise(p - vec2(e, 0.0));
  return vec2(a - b, d - c) / (2.0 * e);
}
void main() {
  vec2 p = vUv * uWorld;
  vec2 v = textureLod(uVelocity, vUv, 0.0).xy;
  vec2 d = textureLod(uDye, vUv, 1.0).xy;
  float smokeHere = smoothstep(0.02, 0.4, d.x + d.y);
  vec2 tq = p / uTurb.y;
  vec2 turb = curlNoise(tq + vec2(uTime * 0.21, -uTime * 0.37)) + 0.5 * curlNoise(tq * 2.3 + vec2(-uTime * 0.53, uTime * 0.29) + 7.0);
  v += turb * uTurb.x * smokeHere * uDt;
  v.y += (uBuoyancy * d.y + uLift * d.x) * uDt;
  v /= 1.0 + uDamping * uDt;
  v.x /= 1.0 + uFriction * exp(-p.y / 18.0) * uDt;
  v.x += (uWind - v.x) * (1.0 - exp(-0.35 * uDt)) * smoothstep(0.0, 60.0, p.y);
  for (int i = 0; i < ${MAX_JETS}; i++) {
    vec4 b = uJetB[i];
    if (b.w <= 0.0) continue;
    vec4 a = uJetA[i];
    vec2 rel = p - a.xy;
    float along = dot(rel, a.zw);
    float across = dot(rel, vec2(-a.w, a.z));
    float reach = a.w < -0.2 ? a.y / -a.w : max(b.z, 1.0);
    float bn = clamp(along / max(reach, 1.0), 0.0, 1.0);
    across -= uJetBend[i] * bn * bn;
    vec2 dir = normalize(a.zw + vec2(-a.w, a.z) * (2.0 * uJetBend[i] * bn / max(reach, 1.0)));
    float sN = clamp(along / max(b.z, 1.0), 0.0, 1.0);
    float R = b.y + uSpread * clamp(along, 0.0, b.z);
    float wr = exp(-across * across / (R * R));
    float wa = smoothstep(-b.y, 0.0, along) * (1.0 - smoothstep(0.55, 1.0, sN));
    float rate = mix(46.0, 7.0, sN);
    float w = (1.0 - exp(-uDt * rate)) * wr * wa * clamp(b.w * 3.0, 0.0, 1.0);
    float U = b.x * sqrt(b.y / R);
    v = mix(v, dir * U, w);
  }
  for (int i = 0; i < ${MAX_JETS}; i++) {
    vec4 b = uJetB[i];
    if (b.w <= 0.0) continue;
    vec4 a = uJetA[i];
    if (a.w > -0.2) continue;
    float reach = a.y / -a.w;
    float gx = a.x + a.z * reach - a.w * uJetBend[i];
    float near = exp(-reach / uKick.x);
    float sx = uKick.y + reach * 0.25;
    float kx = (p.x - gx) / (sx * 1.6);
    float ky = p.y / (uKick.z * 1.5);
    float k = exp(-kx * kx - ky * ky);
    float side = clamp((p.x - gx) / sx, -1.0, 1.0);
    v += uDt * uSplash * b.w * near * k * vec2(side * 0.7, 0.9);
  }
  vec2 q = p - uCraft.xy;
  float c = cos(uCraftMotion.z);
  float s = sin(uCraftMotion.z);
  vec2 lq = vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
  vec2 e = abs(lq) - uCraft.zw + uCraft.w;
  float sd = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - uCraft.w;
  float inside = smoothstep(2.0, -2.0, sd) * uObstacle;
  vec2 cv = uCraftMotion.xy + uCraftMotion.w * vec2(-q.y, q.x);
  v = mix(v, cv, inside);
  float speed = length(v);
  if (!(speed < 1e5)) v = vec2(0.0);
  else if (speed > 2600.0) v *= 2600.0 / speed;
  outColor = vec4(v, 0.0, 1.0);
}`;

const CURL = `${HEAD}
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float L = textureLod(uVelocity, vUv - vec2(uTexel.x, 0.0), 0.0).y;
  float R = textureLod(uVelocity, vUv + vec2(uTexel.x, 0.0), 0.0).y;
  float B = textureLod(uVelocity, vUv - vec2(0.0, uTexel.y), 0.0).x;
  float T = textureLod(uVelocity, vUv + vec2(0.0, uTexel.y), 0.0).x;
  outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uStrength;
uniform float uDt;
void main() {
  float L = textureLod(uCurl, vUv - vec2(uTexel.x, 0.0), 0.0).x;
  float R = textureLod(uCurl, vUv + vec2(uTexel.x, 0.0), 0.0).x;
  float B = textureLod(uCurl, vUv - vec2(0.0, uTexel.y), 0.0).x;
  float T = textureLod(uCurl, vUv + vec2(0.0, uTexel.y), 0.0).x;
  float C = textureLod(uCurl, vUv, 0.0).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f /= length(f) + 1e-4;
  f *= uStrength * C;
  f.y *= -1.0;
  vec2 v = textureLod(uVelocity, vUv, 0.0).xy + f * uDt;
  if (!(abs(v.x) < 4000.0 && abs(v.y) < 4000.0)) v = vec2(0.0);
  outColor = vec4(v, 0.0, 1.0);
}`;

const DIVERGENCE = `${HEAD}
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  vec2 C = textureLod(uVelocity, vUv, 0.0).xy;
  float L = textureLod(uVelocity, vUv - vec2(uTexel.x, 0.0), 0.0).x;
  float R = textureLod(uVelocity, vUv + vec2(uTexel.x, 0.0), 0.0).x;
  float B = textureLod(uVelocity, vUv - vec2(0.0, uTexel.y), 0.0).y;
  float T = textureLod(uVelocity, vUv + vec2(0.0, uTexel.y), 0.0).y;
  if (vUv.y - uTexel.y < 0.0) B = -C.y;
  outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const PRESSURE_SAMPLE = `
float pressureAt(sampler2D tex, vec2 uv, vec2 texel, float c, int side) {
  if (side == 0 && uv.x - texel.x < 0.0) return 0.0;
  if (side == 1 && uv.x + texel.x > 1.0) return 0.0;
  if (side == 2 && uv.y - texel.y < 0.0) return c;
  if (side == 3 && uv.y + texel.y > 1.0) return 0.0;
  vec2 o = side == 0 ? vec2(-texel.x, 0.0) : side == 1 ? vec2(texel.x, 0.0) : side == 2 ? vec2(0.0, -texel.y) : vec2(0.0, texel.y);
  return textureLod(tex, uv + o, 0.0).x;
}
`;

const PRESSURE = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
${PRESSURE_SAMPLE}
void main() {
  float C = textureLod(uPressure, vUv, 0.0).x;
  float L = pressureAt(uPressure, vUv, uTexel, C, 0);
  float R = pressureAt(uPressure, vUv, uTexel, C, 1);
  float B = pressureAt(uPressure, vUv, uTexel, C, 2);
  float T = pressureAt(uPressure, vUv, uTexel, C, 3);
  float div = textureLod(uDivergence, vUv, 0.0).x;
  float pr = (L + R + B + T - div) * 0.25;
  outColor = vec4(abs(pr) < 1e6 ? pr : 0.0, 0.0, 0.0, 1.0);
}`;

const GRADIENT = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
${PRESSURE_SAMPLE}
void main() {
  float C = textureLod(uPressure, vUv, 0.0).x;
  float L = pressureAt(uPressure, vUv, uTexel, C, 0);
  float R = pressureAt(uPressure, vUv, uTexel, C, 1);
  float B = pressureAt(uPressure, vUv, uTexel, C, 2);
  float T = pressureAt(uPressure, vUv, uTexel, C, 3);
  vec2 v = textureLod(uVelocity, vUv, 0.0).xy - 0.5 * vec2(R - L, T - B);
  if (vUv.y - uTexel.y < 0.0) v.y = max(v.y, 0.0);
  if (!(abs(v.x) < 4000.0 && abs(v.y) < 4000.0)) v = vec2(0.0);
  outColor = vec4(v, 0.0, 1.0);
}`;

const BLUR = `${HEAD}
uniform sampler2D uSource;
uniform vec2 uStep;
void main() {
  vec2 c = textureLod(uSource, vUv, 0.0).xy * 0.2270270;
  c += textureLod(uSource, vUv + uStep * 1.3846154, 0.0).xy * 0.3162162;
  c += textureLod(uSource, vUv - uStep * 1.3846154, 0.0).xy * 0.3162162;
  c += textureLod(uSource, vUv + uStep * 3.2307692, 0.0).xy * 0.0702703;
  c += textureLod(uSource, vUv - uStep * 3.2307692, 0.0).xy * 0.0702703;
  outColor = vec4(c, 0.0, 1.0);
}`;

const SCALE = `${HEAD}
uniform sampler2D uSource;
uniform float uScale;
void main() {
  outColor = textureLod(uSource, vUv, 0.0) * uScale;
}`;

const DYE = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uWorld;
uniform float uDt;
uniform vec2 uKeep;
uniform vec4 uRate;
uniform vec4 uCol;
uniform vec3 uKick;
uniform float uDisperse;
uniform float uDispV;
uniform vec4 uCraft;
uniform vec4 uCraftMotion;
uniform vec2 uGap;
uniform float uJetX[${MAX_JETS}];
uniform float uJetN;
uniform float uFloor;
uniform float uTime;
${JETS}
${NOISE}
void main() {
  vec2 v = textureLod(uVelocity, vUv, 0.0).xy;
  vec2 val = textureLod(uSource, vUv - uDt * v / uWorld, 0.0).xy * uKeep;
  val.x *= exp(-uDisperse * max(length(v) - uDispV, 0.0) * 0.01 * uDt);
  {
    vec2 q = vUv * uWorld - uCraft.xy;
    float c = cos(uCraftMotion.z);
    float sn = sin(uCraftMotion.z);
    vec2 lq = vec2(c * q.x + sn * q.y, -sn * q.x + c * q.y);
    float belly = uCraft.y - uCraft.w - 7.0;
    float depth = 0.68 * belly * smoothstep(40.0, 110.0, belly);
    float below = -lq.y - uCraft.w;
    float wy = smoothstep(-4.0, 6.0, below) * (1.0 - smoothstep(depth * 0.7, depth, below));
    float nearest = 1e4;
    float outer = 0.0;
    for (int k = 0; k < ${MAX_JETS}; k++) {
      if (float(k) >= uJetN) break;
      nearest = min(nearest, abs(lq.x - uJetX[k]));
      outer = max(outer, abs(uJetX[k]));
    }
    float wx = uGap.x > 1.0 ? smoothstep(uGap.x * 0.22, uGap.x * 0.4, nearest) * (1.0 - smoothstep(outer - uGap.x * 0.1, outer, abs(lq.x))) : 0.0;
    val.x *= exp(-uGap.y * wx * wy * uDt);
  }
  val.x = max(val.x - uFloor * uDt, 0.0);
  vec2 p = vUv * uWorld;
  for (int i = 0; i < ${MAX_JETS}; i++) {
    vec4 jb = uJetB[i];
    if (jb.w <= 0.0) continue;
    vec4 ja = uJetA[i];
    vec2 rel = p - ja.xy;
    float along = dot(rel, ja.zw);
    float across = dot(rel, vec2(-ja.w, ja.z));
    vec2 off = rel - ja.zw * clamp(along, 0.0, 6.0);
    float wn = exp(-dot(off, off) / (jb.y * jb.y)) * smoothstep(-jb.y, 0.0, along);
    float pulse = 0.6 + 0.8 * noise(vec2(uTime * 6.0 + float(i) * 13.1, along * 0.06 + float(i)));
    val.x += uRate.x * jb.w * wn * pulse * uDt;
    val.y += uRate.y * jb.w * wn * uDt;
    float reach = ja.w < -0.2 ? ja.y / -ja.w : 1e4;
    float sN = clamp(along / max(reach, 1.0), 0.0, 1.0);
    across -= uJetBend[i] * sN * sN;
    float R = uCol.y + uCol.x * clamp(along, 0.0, reach);
    float wc = exp(-across * across / (R * R)) * smoothstep(0.45, 0.8, sN) * (1.0 - step(reach + 2.0, along));
    float grain = 0.45 + 1.1 * noise(vec2(across * 0.12 + float(i) * 3.0, along * 0.05 - uTime * 9.0));
    val.x += uRate.w * jb.w * wc * grain * uDt;
    val.y += uRate.y * 0.25 * jb.w * wc * uDt;
    if (reach < 1e3) {
      float gx = ja.x + ja.z * reach - ja.w * uJetBend[i];
      float near = exp(-reach / uKick.x);
      float spread = uKick.y + reach * 0.25;
      float kx = (p.x - gx) / spread;
      float ky = p.y / uKick.z;
      float k = exp(-kx * kx - ky * ky);
      float g2 = 0.5 + noise(vec2(p.x * 0.08, uTime * 4.0 + float(i) * 9.0));
      val.x += uRate.z * jb.w * near * k * g2 * uDt;
      val.y += uRate.y * 0.4 * jb.w * near * k * uDt;
    }
  }
  if (!(val.x < 1e3 && val.y < 1e3 && val.x >= 0.0 && val.y >= 0.0)) val = vec2(0.0);
  outColor = vec4(val, 0.0, 1.0);
}`;

const RENDER = `${HEAD}
uniform sampler2D uDye;
uniform vec2 uWorld;
uniform vec2 uDyeSize;
uniform float uTime;
uniform float uLightTheme;
uniform vec3 uSmoke;
uniform vec3 uShade;
uniform vec3 uThrust;
uniform vec4 uLook;
uniform vec4 uLook2;
uniform vec4 uLook3;
uniform vec4 uCol;
uniform float uGamma;
uniform float uTone;
uniform vec3 uLight2;
uniform float uThreshold;
uniform float uScale;
uniform vec4 uCraft;
uniform vec4 uCraftMotion;
${JETS}
${NOISE}
float dens(vec2 p, float lod) {
  return textureLod(uDye, p / uWorld, lod).x;
}
float hash1(float n) {
  return fract(sin(n * 127.1) * 43758.5453);
}
float fbm2(vec2 p) {
  return noise(p) * 0.65 + noise(p * 2.13 + 17.0) * 0.35;
}
float flowNoise(float q, float xn, float t, float id, float rate) {
  float c = t / 0.7;
  float f1 = fract(c);
  float f2 = fract(c + 0.5);
  float k1 = floor(c);
  float k2 = floor(c + 0.5);
  float n1 = fbm2(vec2(q - f1 * 0.7 * rate + hash1(k1 + id * 7.0) * 41.0, xn * 1.15 + id * 3.7));
  float n2 = fbm2(vec2(q - f2 * 0.7 * rate + hash1(k2 + id * 7.0 + 0.5) * 41.0, xn * 1.15 + id * 3.7 + 11.0));
  float w1 = 1.0 - abs(2.0 * f1 - 1.0);
  float w2 = 1.0 - w1;
  return 0.5 + (n1 * w1 + n2 * w2 - 0.5) / sqrt(w1 * w1 + w2 * w2);
}
float column(vec2 p, vec4 a, float str, float id, float t, float bend, out float xn, out float s) {
  vec2 rel = p - a.xy;
  s = dot(rel, a.zw);
  float x = dot(rel, vec2(-a.w, a.z));
  float S = a.w < -0.2 ? a.y / -a.w : 1e4;
  float bn = clamp(s / max(S, 1.0), 0.0, 1.0);
  x -= bend * bn * bn;
  xn = 0.0;
  if (s < -4.0 || s > S + 6.0) return 0.0;
  float sc = clamp(s, 0.0, S);
  float R = uCol.y + uCol.x * sc;
  float flare = smoothstep(S - 32.0 * uScale, S + 2.0, sc);
  R *= 1.0 + 1.3 * flare * flare;
  xn = x / R;
  if (abs(xn) > 3.2) return 0.0;
  float q = log(1.0 + 0.22 * sc / (9.0 * uScale)) / 0.22;
  float lam = 9.0 * uScale + 0.22 * sc;
  float U = uCol.w * sqrt(str) * sqrt(uCol.y / R);
  float n = flowNoise(q, xn, t, id, U / lam);
  float amp = 0.12 + 0.5 * smoothstep(4.0, 70.0, sc);
  float u = abs(xn) * (1.0 - amp * (n - 0.5) * 1.8);
  float prof = exp(-u * u * 1.7);
  float dil = pow(uCol.y / R, 0.5);
  float onset = smoothstep(2.0 * uScale, 16.0 * uScale, s);
  float tail = 1.0 - smoothstep(S - 2.0, S + 6.0, s);
  return uCol.z * str * prof * dil * onset * tail * (0.7 + 0.6 * n);
}
float shape(vec2 p, float lod) {
  return log(1.0 + 3.0 * dens(p, lod));
}
void main() {
  vec2 p = vUv * uWorld;
  float texel = uWorld.x / uDyeSize.x;
  float D = textureLod(uDye, vUv, uLook.w).x;
  float heat = textureLod(uDye, vUv, 0.5).y;

  float e = uLook3.x;
  float lodN = max(log2(e / texel), 0.0) + uLook3.y;
  vec2 g = vec2(shape(p + vec2(e, 0.0), lodN) - shape(p - vec2(e, 0.0), lodN), shape(p + vec2(0.0, e), lodN) - shape(p - vec2(0.0, e), lodN)) / (2.0 * e);
  float e2 = e * 3.0;
  float lodB = lodN + 1.6;
  vec2 g2 = vec2(shape(p + vec2(e2, 0.0), lodB) - shape(p - vec2(e2, 0.0), lodB), shape(p + vec2(0.0, e2), lodB) - shape(p - vec2(0.0, e2), lodB)) / (2.0 * e2);
  vec3 nS = normalize(vec3(-(g * uLook3.z + g2 * uLook3.w) * uLook.y, 1.0));

  float colD = 0.0;
  vec2 colN = vec2(0.0);
  float colHot = 0.0;
  float colNear = 0.0;
  for (int i = 0; i < ${MAX_JETS}; i++) {
    vec4 jb = uJetB[i];
    if (jb.w <= 0.0) continue;
    vec4 ja = uJetA[i];
    float xn;
    float sa;
    float cd = column(p, ja, min(jb.w, 1.6), float(i), uTime, uJetBend[i], xn, sa);
    colD += cd;
    colN += vec2(-ja.w, ja.z) * clamp(xn, -1.6, 1.6) * cd;
    colHot += cd * exp(-max(sa, 0.0) / 45.0);
    colNear += cd * exp(-max(sa, 0.0) / 16.0);
  }
  float Dt = D + colD;
  float alpha = 1.0 - exp(-uLook.x * pow(max(D - uThreshold, 0.0) + colD, uGamma));
  vec2 cn = colD > 1e-5 ? colN / colD : vec2(0.0);
  vec3 nC = normalize(vec3(cn * 0.85, sqrt(max(1.0 - dot(cn, cn) * 0.72, 0.08))));
  float wC = colD / max(Dt, 1e-5);
  vec3 n = normalize(mix(nS, nC, wC));
  vec3 L = normalize(vec3(-0.38, 0.6, 0.72));
  float diff = clamp((dot(n, L) + uLook2.z) / (1.0 + uLook2.z), 0.0, 1.0);

  vec2 ld = normalize(L.xy);
  float tau = 0.0;
  float dist = 2.0;
  float stepLen = 3.0;
  for (int i = 0; i < 9; i++) {
    float lod = max(log2(stepLen / texel), 0.0);
    tau += dens(p + ld * dist, lod) * stepLen;
    dist += stepLen;
    stepLen *= 1.4;
  }
  float sun = mix(exp(-uLook.z * tau), 1.0, wC * 0.6);
  float ao = mix(exp(-uLook2.w * dens(p, 4.5)), 1.0, wC);

  vec3 amb = vec3(0.84, 0.88, 1.0) * uLook2.x;
  vec3 key = vec3(1.0, 0.985, 0.96) * uLook2.y;
  vec3 lit = amb * ao + key * sun * diff;

  vec3 jl = vec3(0.0);
  vec3 core = vec3(0.0);
  for (int i = 0; i < ${MAX_JETS}; i++) {
    vec4 jb = uJetB[i];
    if (jb.w <= 0.0) continue;
    vec4 ja = uJetA[i];
    vec2 rel = p - ja.xy;
    float along = dot(rel, ja.zw);
    float across = dot(rel, vec2(-ja.w, ja.z));
    float str = min(jb.w, 1.6);
    float flick = 0.9 + 0.2 * noise(vec2(uTime * 38.0, float(i) * 5.0));
    float len = (8.0 + 12.0 * str) * flick * uScale;
    float sN = along / len;
    float wid = 3.2 * uScale * (0.9 - 0.5 * clamp(sN, 0.0, 1.0)) + 0.3;
    float radial = exp(-across * across / (wid * wid));
    float axial = smoothstep(-0.12, 0.04, sN) * pow(clamp(1.0 - sN, 0.0, 1.0), 1.5);
    float c = radial * axial * str;
    core += mix(uThrust, vec3(1.0), smoothstep(0.25, 0.9, c)) * c * 1.3;
    float d = length(rel - ja.zw * clamp(along, 0.0, len));
    core += uThrust * str * (0.22 * exp(-d / (5.0 * uScale)) + 0.06 * exp(-d / (18.0 * uScale)));
    jl += uThrust * str * uLight2.x * (exp(-d / (30.0 * uScale)) + 0.45 * exp(-d / (100.0 * uScale)));
  }

  vec3 jlNear = jl * 0.35 + uThrust * colNear / max(Dt, 1e-4) * 0.9;
  jl += uThrust * colHot / max(Dt, 1e-4) * 0.9;
  if (uLightTheme > 0.5) {
    float shade = dot(lit + jl * 0.8, vec3(0.3333)) * uLight2.z;
    vec3 ink = mix(uShade, uSmoke, smoothstep(0.15, 1.2, shade));
    alpha = 1.0 - pow(1.0 - alpha, 1.25);
    ink = mix(ink, uThrust, clamp(dot(jlNear, vec3(0.3333)) * 0.5, 0.0, 0.3));
    float ca = clamp(max(core.r, max(core.g, core.b)) * 0.85, 0.0, 1.0);
    vec3 coreInk = mix(uThrust, vec3(1.0), 0.35 * smoothstep(0.7, 1.0, ca));
    vec3 lc = ink * alpha * (1.0 - ca) + coreInk * ca;
    float la = alpha + ca * (1.0 - alpha);
    outColor = vec4(lc, la);
    return;
  }
  vec3 smoke = uSmoke * (lit + jl) * uLight2.z;
  smoke = mix(smoke / (1.0 + 0.35 * max(smoke - 0.8, 0.0)), 1.0 - exp(-smoke * 1.35), uTone);
  vec3 emit = mix(uThrust, vec3(1.0), 0.5) * heat * heat * uLight2.y;
  vec3 col = (smoke + emit) * alpha + core;
  float a = clamp(max(alpha, max(col.r, max(col.g, col.b))), 0.0, 1.0);
  col = min(col, vec3(a));
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0 * a;
  outColor = vec4(max(col, 0.0), a);
}`;

const SMOKE = {
  colSpread: 0.1,
  colR: 3.6,
  colD: 1.25,
  colU: 420,
  splash: 400,
  friction: 5,
  disperse: 0.6,
  dispV: 60,
  gap: 10,
  wind: 8,
  turb: 350,
  turbScale: 34,
  jetLight: 0.3,
  threshold: 0.035,
  blur: 3,
  emit: 0,
  exposure: 1.3,
  tone: 1,
  gamma: 0.6,
  kickNear: 45,
  kickW: 18,
  kickH: 14,
  vort: 6,
  spread: 0.1,
  floor: 0.02,
  keepD: 0.3,
  keepIdle: 0.45,
  keepH: 1.6,
  rateN: 0,
  rateH: 6,
  rateK: 20,
  rateC: 3,
  buoy: 330,
  lift: 22,
  damp: 0.55,
  radius: 6,
  speed: 380,
  reach: 0.9,
  forceMax: 240,
  alphaK: 4,
  relief: 9,
  shadow: 0.026,
  alphaLod: 0,
  ambient: 0.58,
  key: 0.82,
  wrap: 0.35,
  ao: 0.35,
  normalE: 3,
  normalLod: -0.8,
  fine: 0.35,
  broad: 0.9,
  iters: 28
};

type Theme = 'dark' | 'light';
type Trigger = 'hover' | 'click';
type ClickHandler = (event: ReactMouseEvent<HTMLButtonElement> | PointerEvent) => void;

interface EngineProps {
  size: Size;
  altitude: number;
  hoverTime: number;
  jets: number;
  thrusters: boolean;
  trigger: Trigger;
  carryCursor: boolean;
  ramp: boolean;
  smoke: number;
  turbulence: number;
  wobble: number;
  thrustColor: string;
  smokeColor: string;
  theme: Theme;
  onClick?: ClickHandler;
}

interface EngineArgs {
  root: HTMLDivElement;
  canvas: HTMLCanvasElement;
  button: HTMLButtonElement;
  cursor: SVGSVGElement | null;
  ramp: SVGSVGElement | null;
  props: MutableRefObject<EngineProps>;
}

interface Engine {
  refresh: () => void;
  rehome: () => void;
  destroy: () => void;
}

interface RampGeo {
  ss: number[];
  xs: number[];
  ys: number[];
  ps: number[];
  ks: number[];
  r: number;
  T: number;
  x0: number;
  foot: number;
  S: number;
  clear: number;
  ok: boolean;
}

interface Track {
  geo: RampGeo;
  base: number;
  v0: number;
  acc: number;
}

interface Back {
  from: number;
  to: number;
  time: number;
}

interface Turn {
  th: number;
  w: number;
}

interface Piece {
  el: HTMLElement;
  x: number;
  y: number;
  k: number;
}

interface Strip {
  wrap: HTMLDivElement;
  ink: HTMLDivElement;
  parts: HTMLElement[];
  n: number;
  sn: number[];
  pods: Piece[];
  items: Piece[];
}

interface Nozzle {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Target {
  tex: WebGLTexture | null;
  fbo: WebGLFramebuffer | null;
  w: number;
  h: number;
  mips: boolean;
}

interface Pair {
  read: Target;
  write: Target;
  swap: () => void;
}

interface Program {
  p: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
}

type Uniform = number | number[] | Float32Array | Target | { f1: number[] };

interface Jets {
  a: Float32Array;
  b: Float32Array;
  bend: number[];
}

interface SimShared {
  jets: Jets;
  craft: number[];
  motion: number[];
  scale: number;
  activity: number;
  time: number;
}

interface StepInput extends SimShared {
  jetX: number[];
  jetN: number;
  spacing: number;
  calm: number;
  wind: number;
  smoke: number;
  turbulence: number;
}

interface RenderInput extends SimShared {
  light: boolean;
  smokeColor: number[];
  shadeColor: number[];
  thrustColor: number[];
}

type Sim = ReturnType<typeof createSim>;

function createEngine({ root, canvas, button, cursor, ramp, props }: EngineArgs): Engine {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance'
  });
  const motionQuery =
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const s = {
    W: 0,
    H: 0,
    dpr: 1,
    bw: 0,
    bh: 0,
    x: 0,
    vx: 0,
    y: -REST,
    vy: 0,
    th: 0,
    w: 0,
    fvx: 0,
    fvy: 0,
    thrust: [0, 0, 0, 0],
    delay: [0, 0, 0, 0],
    phase: 'rest',
    pt: 0,
    clock: 0,
    seed: Math.random() * 100,
    wind: 1,
    alt: 160,
    climbT: 1.6,
    y0: 0,
    vrPrev: 0,
    hold: 2.4,
    xRef: 0,
    landX: 0,
    boost: false,
    contact: true,
    placed: false,
    track: null as Track | null,
    back: null as Back | null,
    flip: null as Turn | null,
    rampKey: '',
    rampGeo: null as RampGeo | null,
    strip: null as Strip | null,
    u: 0,
    v: 0,
    target: { x: 0, y: 0 },
    pointer: { in: false, x: 0, y: 0, type: 'mouse' },
    off: { x: 0, y: 0 },
    attached: false,
    hover: false,
    armed: true,
    carry: false,
    pressed: false,
    press: null as { x: number; y: number } | null,
    drag: null as { gx: number; gy: number } | null,
    suppress: false,
    lastC: null as { x: number; y: number } | null,
    lastTh: 0,
    quiet: 0,
    running: false,
    last: 0,
    raf: 0,
    simTime: 0,
    activity: 0
  };

  let sim: Sim | null = null;
  if (gl) {
    const floatOk = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float');
    if (floatOk) {
      try {
        sim = createSim(gl);
      } catch (err) {
        sim = null;
      }
    }
  }

  const still = () => Boolean(motionQuery && motionQuery.matches);
  const scale = () => (SIZES[props.current.size] || SIZES.medium).k;
  const podH = () => POD_H * scale();
  const count = () => clamp(Math.round(num(props.current.jets, 2)), 1, MAX_JETS);
  const offsets = () => {
    const n = count();
    if (n === 1) return [0];
    const a = s.bw * (n === 2 ? 0.3 : 0.34);
    return Array.from({ length: n }, (_, k) => a * ((2 * k) / (n - 1) - 1));
  };
  const feet = () => {
    const xs = offsets();
    return xs.length > 1 ? [xs[0], xs[xs.length - 1]] : [-0.3 * s.bw, 0.3 * s.bw];
  };
  const totalThrust = () => s.thrust[0] + s.thrust[1] + s.thrust[2] + s.thrust[3];
  const flying = () =>
    s.phase === 'ignite' || s.phase === 'climb' || s.phase === 'hover' || s.phase === 'descend' || s.phase === 'drag';
  const riding = () => s.phase === 'drive' || s.phase === 'loop' || s.phase === 'flip' || s.phase === 'return';
  const xLimits = () => [s.bw / 2 + 4, Math.max(s.bw / 2 + 4, s.W - s.bw / 2 - 4)];
  const rampOn = () => Boolean(props.current.ramp);

  const rampGeo = (): RampGeo => {
    const base = podH() + s.bh / 2;
    const key = `${s.W}|${s.H}|${s.bw}|${base}`;
    if (s.rampKey === key && s.rampGeo) return s.rampGeo;
    const r = Math.max(s.H * 0.24, podH() + s.bh + 40);
    const K = 1 / r;
    const ease = r * 0.4;
    const arc = (r * Math.PI) / 2 - ease;
    const build = (rise: number, top: number) => {
      const segs = [
        [ease, 0, K],
        [arc, K, K],
        [ease, K, 0],
        [rise, 0, 0],
        [ease, 0, K],
        [arc, K, K],
        [ease, K, 0],
        [top, 0, 0]
      ];
      const g = { ss: [0], xs: [0], ys: [0], ps: [0], ks: [0] };
      let x = 0;
      let y = 0;
      let a = 0;
      let d = 0;
      segs.forEach(([len, k0, k1]) => {
        const n = Math.max(1, Math.round(len / 1.5));
        const h = len / n;
        for (let j = 0; j < n; j += 1) {
          const km = k0 + (k1 - k0) * ((j + 0.5) / n);
          const am = a + (km * h) / 2;
          x += Math.cos(am) * h;
          y += Math.sin(am) * h;
          a += km * h;
          d += h;
          g.ss.push(d);
          g.xs.push(x);
          g.ys.push(y);
          g.ps.push(a);
          g.ks.push(k0 + (k1 - k0) * ((j + 1) / n));
        }
      });
      return g;
    };
    const bends = build(0, 0);
    const rise = Math.max(0, s.H * 0.66 - Math.max(...bends.ys));
    const g = build(rise, Math.max(48, s.W * 0.16));
    const T = clamp(r * 0.12, 8, 16);
    const x0 = s.W - Math.max(18, s.W * 0.05) - T - Math.max(...g.xs);
    const xs = g.xs.map(v => v + x0);
    const n = g.ss.length - 1;
    const footAt = g.ys.findIndex(v => v > 3);
    const foot = footAt < 0 ? xs[n] : xs[footAt];
    const geo = {
      ...g,
      xs,
      r,
      T,
      x0,
      foot,
      S: g.ss[n],
      clear: Math.min(foot, xs[n]) - 12,
      ok: Math.max(...g.ys) + T < s.H - 8
    };
    s.rampKey = key;
    s.rampGeo = geo;
    return geo;
  };

  const home = () => {
    const [lo, hi] = xLimits();
    if (!rampOn()) return clamp(s.W / 2, lo, hi);
    const g = rampGeo();
    return clamp(Math.min(g.foot * 0.5, g.x0 - 90, g.clear - s.bw / 2 - 40), lo, hi);
  };

  const craftCenter = () => ({
    x: s.x,
    y: podH() + s.bh / 2 + s.y + REST
  });

  const nozzles = (): Nozzle[] => {
    const c = craftCenter();
    const cs = Math.cos(s.th);
    const sn = Math.sin(s.th);
    const ry = props.current.thrusters ? -(s.bh / 2 + podH()) + 1 : -(s.bh / 2) + 2;
    return offsets().map(rx => ({ x: c.x + rx * cs - ry * sn, y: c.y + rx * sn + ry * cs, dx: sn, dy: -cs }));
  };

  const cssCenter = () => {
    const c = craftCenter();
    return { x: c.x, y: s.H - c.y };
  };

  const quad = (x0: number, w: number, h: number, p0: number[], p1: number[], p2: number[], p3: number[]) => {
    const dx1 = p1[0] - p2[0];
    const dx2 = p3[0] - p2[0];
    const dx3 = p0[0] - p1[0] + p2[0] - p3[0];
    const dy1 = p1[1] - p2[1];
    const dy2 = p3[1] - p2[1];
    const dy3 = p0[1] - p1[1] + p2[1] - p3[1];
    const det = dx1 * dy2 - dx2 * dy1 || 1e-6;
    const g = (dx3 * dy2 - dx2 * dy3) / det;
    const k = (dx1 * dy3 - dx3 * dy1) / det;
    const a = p1[0] - p0[0] + g * p1[0];
    const b = p3[0] - p0[0] + k * p3[0];
    const d = p1[1] - p0[1] + g * p1[1];
    const e = p3[1] - p0[1] + k * p3[1];
    const tx = p0[0] - (a * x0) / w;
    const ty = p0[1] - (d * x0) / w;
    if (Math.abs(g) < 1e-7 && Math.abs(k) < 1e-7) {
      return `matrix(${[a / w, d / w, b / h, e / h, tx, ty].map(v => v.toFixed(6)).join(',')})`;
    }
    const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, tx, ty, 0, 1 - (g * x0) / w];
    return `matrix3d(${m.map(v => v.toFixed(6)).join(',')})`;
  };

  const dropStrip = () => {
    if (!s.strip) return;
    s.strip.wrap.remove();
    s.strip.ink.remove();
    s.strip = null;
    button.style.visibility = '';
  };

  const makeStrip = () => {
    dropStrip();
    const t = s.track;
    if (!t) return;
    const g = t.geo;
    const d = podH() + s.bh / 2;
    const sn = [0];
    for (let i = 1; i < g.ss.length; i += 1) {
      const k = (g.ks[i] + g.ks[i - 1]) / 2;
      sn.push(sn[i - 1] + (g.ss[i] - g.ss[i - 1]) * Math.max(1 - k * d, 0.2));
    }
    const n = clamp(Math.round(s.bw / 8), 8, 32);
    const wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:absolute;inset:0;z-index:1;pointer-events:none';
    const ink = document.createElement('div');
    ink.setAttribute('aria-hidden', 'true');
    ink.style.cssText = 'position:absolute;inset:0;z-index:2;pointer-events:none;will-change:transform';
    const kids = Array.from(button.children) as HTMLElement[];
    const label = kids[1];
    const pods = kids.slice(2).map(p => {
      const el = p.cloneNode(true) as HTMLElement;
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.transformOrigin = '0 0';
      wrap.appendChild(el);
      return { el, x: p.offsetLeft, y: p.offsetTop + p.offsetHeight / 2, k: 1 };
    });
    const parts: HTMLElement[] = [];
    for (let i = 0; i < n; i += 1) {
      const c = button.cloneNode(true) as HTMLButtonElement;
      c.removeAttribute('data-hover');
      c.removeAttribute('data-pressed');
      c.setAttribute('tabindex', '-1');
      c.setAttribute('inert', '');
      Array.from(c.children)
        .slice(1)
        .forEach((k: Element) => {
          (k as HTMLElement).style.visibility = 'hidden';
        });
      const x0 = (s.bw * i) / n - (i ? 0.75 : 2);
      const x1 = (s.bw * (i + 1)) / n + (i < n - 1 ? 0.75 : 2);
      c.style.visibility = 'visible';
      c.style.transformOrigin = '0 0';
      c.style.clipPath = `polygon(${x0}px -2px, ${x1}px -2px, ${x1}px ${s.bh + 2}px, ${x0}px ${s.bh + 2}px)`;
      wrap.appendChild(c);
      parts.push(c);
    }
    const items: Piece[] = [];
    const text = label ? label.textContent || '' : '';
    const ctx = document.createElement('canvas').getContext('2d');
    if (label && ctx && text.trim() && !label.children.length) {
      const cs = getComputedStyle(label);
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.font = font;
      const chars = Array.from(text);
      const at = (i: number) => ctx.measureText(chars.slice(0, i).join('')).width;
      const span = at(chars.length) || 1;
      const yc = label.offsetTop + label.offsetHeight / 2;
      chars.forEach((ch, i) => {
        const el = document.createElement('span');
        el.textContent = ch;
        el.style.cssText = `position:absolute;left:0;top:0;white-space:pre;line-height:1;transform-origin:0 0;font:${font};color:${cs.color}`;
        ink.appendChild(el);
        items.push({ el, x: label.offsetLeft + ((at(i) + at(i + 1)) / 2) * (label.offsetWidth / span), y: yc, k: 0.5 });
      });
    } else if (label) {
      const el = label.cloneNode(true) as HTMLElement;
      el.style.position = 'absolute';
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.transformOrigin = '0 0';
      ink.appendChild(el);
      items.push({
        el,
        x: label.offsetLeft + label.offsetWidth / 2,
        y: label.offsetTop + label.offsetHeight / 2,
        k: 0
      });
    }
    root.appendChild(wrap);
    root.appendChild(ink);
    button.style.visibility = 'hidden';
    s.strip = { wrap, ink, parts, n, sn, pods, items };
  };

  const placeStrip = () => {
    const st = s.strip;
    const t = s.track;
    if (!st || !t) return;
    const g = t.geo;
    const S = g.ss[g.ss.length - 1];
    const E = st.sn[st.sn.length - 1];
    const seek = (from: number[], to: number[], v: number) => {
      let lo = 0;
      let hi = from.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (from[mid] <= v) lo = mid;
        else hi = mid;
      }
      return to[lo] + (to[hi] - to[lo]) * ((v - from[lo]) / (from[hi] - from[lo]));
    };
    const neutral = (u: number) => (u <= 0 ? u : u >= S ? E + u - S : seek(g.ss, st.sn, u));
    const track = (v: number) => (v <= 0 ? v : v >= E ? S + v - E : seek(st.sn, g.ss, v));
    const nc = neutral(s.u);
    const lift = podH();
    const map = (x: number, y: number) => {
      const [px, py, a] = along(g, track(nc + x - s.bw / 2));
      const h = lift + s.bh - y;
      return [px - Math.sin(a) * h, s.H - py - Math.cos(a) * h, a];
    };
    const pose = (el: HTMLElement, x: number, y: number, a: number) => {
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${(-a).toFixed(4)}rad) translate(-50%, -50%)`;
    };
    const w = s.bw / st.n;
    const top: number[][] = [];
    const low: number[][] = [];
    for (let j = 0; j <= st.n; j += 1) {
      top.push(map(j * w, 0));
      low.push(map(j * w, s.bh));
    }
    st.parts.forEach((part, i) => {
      part.style.transform = quad(i * w, w, s.bh, top[i], top[i + 1], low[i + 1], low[i]);
    });
    st.pods.forEach(p => {
      const [x, y, a] = map(p.x, p.y);
      pose(p.el, x, y, a);
    });
    st.items.forEach(it => {
      const [bx, by, ba] = map(it.x, it.y);
      const [ox, oy, oa] = map(s.bw / 2, it.y);
      const o = it.x - s.bw / 2;
      const rx = ox + Math.cos(oa) * o;
      const ry = oy - Math.sin(oa) * o;
      pose(it.el, rx + (bx - rx) * it.k, ry + (by - ry) * it.k, oa + (ba - oa) * it.k);
    });
  };

  const place = () => {
    if (s.strip) placeStrip();
    const c = craftCenter();
    const left = c.x - s.bw / 2;
    const top = s.H - c.y - s.bh / 2;
    button.style.transform = `translate3d(${left.toFixed(2)}px, ${top.toFixed(2)}px, 0) rotate(${(-s.th).toFixed(5)}rad)`;
    root.style.setProperty('--fly-thrust', clamp(totalThrust() * 0.9, 0, 1.2).toFixed(3));
  };

  const drawRamp = () => {
    if (!ramp) return;
    const g = rampGeo();
    const paths = ramp.querySelectorAll('path');
    const body = paths[0];
    const edge = paths[1];
    const f = (v: number) => v.toFixed(1);
    const line = (off: number) => {
      const out: string[] = [];
      for (let i = 0; i < g.ss.length; i += 2) {
        const a = g.ps[i];
        out.push(`${f(g.xs[i] + Math.sin(a) * off)} ${f(s.H - g.ys[i] + Math.cos(a) * off)}`);
      }
      const a = g.ps[g.ss.length - 1];
      out.push(`${f(g.xs[g.ss.length - 1] + Math.sin(a) * off)} ${f(s.H - g.ys[g.ss.length - 1] + Math.cos(a) * off)}`);
      return `M ${out.join(' L ')}`;
    };
    ramp.setAttribute('viewBox', `0 0 ${f(s.W)} ${f(s.H)}`);
    ramp.style.visibility = g.ok ? '' : 'hidden';
    if (body) {
      body.setAttribute('d', line(g.T / 2));
      body.setAttribute('stroke-width', f(g.T));
    }
    if (edge) edge.setAttribute('d', line(0.75));
  };

  const jetUniforms = (list: Nozzle[]): Jets => {
    const a = new Float32Array(MAX_JETS * 4);
    const b = new Float32Array(MAX_JETS * 4);
    const bend = [0, 0, 0, 0];
    const n = list.length;
    const K = SMOKE;
    const k = scale();
    list.forEach((q, i) => {
      const str = clamp(s.thrust[i] * n, 0, 2);
      const reach = q.dy < -0.2 ? q.y / -q.dy : K.forceMax;
      a.set([q.x, q.y, q.dx, q.dy], i * 4);
      b.set(
        [K.speed * Math.sqrt(str), K.radius * k, Math.min(K.forceMax, reach * K.reach), str > 0.004 ? str : 0],
        i * 4
      );
      const across = s.fvx * -q.dy + s.fvy * q.dx;
      bend[i] = clamp(-across * 0.22, -0.55 * reach, 0.55 * reach);
    });
    return { a, b, bend };
  };

  const draw = (dt: number) => {
    if (!sim) return;
    const P = props.current;
    const list = nozzles();
    const jets = jetUniforms(list);
    const c = craftCenter();
    const xs = offsets();
    const k = scale();
    const craft = [c.x, c.y, s.bw / 2, s.bh / 2];
    const motion = [s.vx, s.vy, s.th, s.w];
    const calm =
      (1 - smooth((Math.abs(s.fvx) - 40) / 100)) * (1 - smooth((Math.abs(s.th) - 0.1) / 0.2)) * (riding() ? 0 : 1);
    if (dt > 0) {
      s.simTime += dt;
      sim.step(dt, {
        jets,
        craft,
        motion,
        calm,
        scale: k,
        activity: s.activity,
        jetX: [0, 1, 2, 3].map(i => (i < xs.length ? xs[i] : 0)),
        jetN: xs.length,
        spacing: xs.length > 1 ? xs[1] - xs[0] : 0,
        wind: s.wind * SMOKE.wind,
        time: s.simTime,
        smoke: clamp(num(P.smoke, 1), 0, 3),
        turbulence: clamp(num(P.turbulence, 1), 0, 3)
      });
    }
    const smoke = rgb(P.smokeColor);
    sim.render(canvas.width, canvas.height, {
      jets,
      craft,
      motion,
      scale: k,
      activity: s.activity,
      time: s.simTime,
      light: P.theme === 'light',
      smokeColor: smoke,
      shadeColor: smoke.map((v, i) => v * 0.74 + [0.0, 0.012, 0.045][i]),
      thrustColor: rgb(P.thrustColor)
    });
  };

  const measure = () => {
    const r = root.getBoundingClientRect();
    const W0 = s.W;
    s.W = Math.max(1, r.width);
    s.H = Math.max(1, r.height);
    s.bw = button.offsetWidth;
    s.bh = button.offsetHeight;
    if (!s.placed) {
      s.x = home();
      s.placed = true;
    } else if (W0 > 0 && W0 !== s.W) s.x *= s.W / W0;
    if (!riding()) {
      const [lo, hi] = xLimits();
      s.x = clamp(s.x, lo, hi);
    }
    s.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(s.W * s.dpr);
    const ch = Math.round(s.H * s.dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    if (sim) sim.resize(s.W, s.H);
    drawRamp();
    root.dataset.ready = '';
    place();
    if (!s.running) draw(0);
  };

  const overCraft = (px: number, py: number, margin = 0) => {
    const c = cssCenter();
    const a = s.th;
    const dx = px - c.x;
    const dy = py - c.y;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    return Math.abs(lx) <= s.bw / 2 + 2 + margin && ly >= -s.bh / 2 - 2 - margin && ly <= s.bh / 2 + podH() + margin;
  };

  const begin = () => {
    s.pt = 0;
    s.armed = false;
    s.seed = Math.random() * 100;
    s.wind = Math.random() < 0.5 ? -1 - Math.random() : 1 + Math.random();
    s.vrPrev = 0;
    s.quiet = 0;
    s.boost = false;
  };

  const launch = () => {
    if (s.phase !== 'rest' || still()) return false;
    const P = props.current;
    begin();
    s.phase = 'ignite';
    s.delay = s.delay.map(() => Math.random() * 0.07);
    const top = s.H - s.bh - podH() - 30 - REST;
    s.alt = clamp(s.y + num(P.altitude, 170), s.y + 24, Math.max(s.y + 24, top));
    s.climbT = 1.15 + (s.alt - s.y) / 420;
    s.hold = Math.max(0, num(P.hoverTime, 2.4));
    s.xRef = s.x;
    wake();
    return true;
  };

  const along = (g: RampGeo, u: number): number[] => {
    if (u <= 0) return [g.x0 + u, 0, 0, 0];
    let lo = 0;
    let hi = g.ss.length - 1;
    if (u >= g.ss[hi]) {
      const a = g.ps[hi];
      return [g.xs[hi] + Math.cos(a) * (u - g.ss[hi]), g.ys[hi] + Math.sin(a) * (u - g.ss[hi]), a, 0];
    }
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (g.ss[mid] <= u) lo = mid;
      else hi = mid;
    }
    const m = (u - g.ss[lo]) / (g.ss[hi] - g.ss[lo]);
    return [g.xs, g.ys, g.ps, g.ks].map(v => v[lo] + (v[hi] - v[lo]) * m);
  };

  const ridePose = (t: Track, u: number) => {
    const [x, y, a, k] = along(t.geo, u);
    return { x: x - Math.sin(a) * t.base, cy: y + Math.cos(a) * t.base, th: a, bend: k * t.base };
  };

  const ride = () => {
    if (s.phase !== 'rest' || still() || !rampOn()) return false;
    const g = rampGeo();
    const run = g.x0 - s.x;
    if (run < 60 || !g.ok) return launch();
    begin();
    const base = podH() + s.bh / 2;
    const top = Math.max(...g.ys) - 2 * base;
    const v0 = Math.sqrt(2 * G_RIDE * top + 2.2 * G_RIDE * (g.r - base));
    s.track = { geo: g, base, v0, acc: (v0 * v0) / (2 * run) };
    s.phase = 'drive';
    s.u = -run;
    s.v = 0;
    s.thrust = [0, 0, 0, 0];
    makeStrip();
    wake();
    return true;
  };

  const chooseLanding = (lead: number) => {
    const [lo, hi] = xLimits();
    let x = s.x + lead;
    if (rampOn()) x = Math.min(x, rampGeo().clear - s.bw / 2);
    s.landX = clamp(x, lo, hi);
  };

  const physics = (dt: number) => {
    const P = props.current;
    const wob = clamp(num(P.wobble, 1), 0, 3);
    s.pt += dt;
    s.clock += dt;
    if (s.phase === 'return') {
      const b = s.back as Back;
      const u = Math.min(s.pt / b.time, 1);
      s.x = b.from + (b.to - b.from) * jerk(u);
      s.vx = ((b.to - b.from) * jerkV(u)) / b.time;
      s.y = -REST;
      s.vy = 0;
      s.th = 0;
      s.w = 0;
      if (u >= 1) {
        s.phase = 'rest';
        s.pt = 0;
        s.vx = 0;
      }
      return;
    }
    if (s.phase === 'drive' || s.phase === 'loop') {
      const t = s.track as Track;
      const prev = ridePose(t, s.u);
      if (s.phase === 'drive') s.v = Math.min(t.v0, s.v + t.acc * dt);
      else s.v = Math.sqrt(Math.max(t.v0 * t.v0 - 2 * G_RIDE * (prev.cy - t.base), 0.2 * t.v0 * t.v0));
      s.u += (s.v * dt) / Math.max(1 - prev.bend, 0.25);
      if (s.phase === 'drive' && s.u >= 0) s.phase = 'loop';
      const pose = ridePose(t, s.u);
      s.vx = (pose.x - prev.x) / dt;
      s.vy = (pose.cy - prev.cy) / dt;
      s.w = (pose.th - prev.th) / dt;
      s.x = pose.x;
      s.y = pose.cy - podH() - s.bh / 2 - REST;
      s.th = pose.th;
      s.thrust = s.thrust.map(v => v * Math.exp(-dt / 0.1));
      if (s.phase === 'loop' && s.u >= t.geo.S) {
        dropStrip();
        s.phase = 'flip';
        s.pt = 0;
        s.flip = { th: s.th, w: s.w };
      }
      return;
    }
    const I = (s.bw * s.bw + s.bh * s.bh) / 12;
    const cs = Math.max(Math.cos(s.th), 0.5);
    let total = 0;
    let control = false;
    let xt = s.xRef;
    let kp = 3;
    let kd = 3.6;
    let turn: Turn | null = null;
    if (s.phase === 'flip') {
      const u = Math.min(s.pt / FLIP_TIME, 1);
      const f = s.flip as Turn;
      const end = Math.PI * 2;
      turn = {
        th:
          (2 * u * u * u - 3 * u * u + 1) * f.th +
          (u * u * u - 2 * u * u + u) * FLIP_TIME * f.w +
          (3 * u * u - 2 * u * u * u) * end,
        w: ((6 * u * u - 6 * u) * (f.th - end)) / FLIP_TIME + (3 * u * u - 4 * u + 1) * f.w
      };
      total = 2.4 * smooth((Math.cos(turn.th) - 0.8) / 0.15);
      const nearGround = s.y + REST < s.bh * 0.6;
      if (u >= 1 || nearGround) {
        turn = null;
        s.th -= Math.PI * 2 * Math.round(s.th / (Math.PI * 2));
        s.phase = 'descend';
        s.pt = 0;
        s.boost = true;
        s.vrPrev = s.vy;
        chooseLanding((s.vx * Math.abs(s.vx)) / 700);
      }
    }
    if (s.phase === 'ignite') {
      total = 0.9 * smooth(s.pt / 0.5);
      if (s.pt >= 0.5) {
        s.phase = 'climb';
        s.pt = 0;
        s.y0 = s.y;
      }
    }
    if (s.phase === 'climb') {
      const u = s.pt / s.climbT;
      const span = s.alt - s.y0;
      const yr = s.y0 + span * jerk(u);
      const vr = (span * jerkV(u)) / s.climbT;
      const ar = (span * jerkA(u)) / (s.climbT * s.climbT);
      total = (G + ar + 30 * (yr - s.y) + 8 * (vr - s.vy)) / (G * cs);
      control = true;
      if (u >= 1) {
        s.phase = 'hover';
        s.pt = 0;
      }
    } else if (s.phase === 'hover') {
      const t = s.clock * 0.8;
      const yr = s.alt + 3.5 * wob * wave(t, s.seed);
      const vr = 3.5 * wob * 0.8 * waveD(t, s.seed);
      total = (G + 30 * (yr - s.y) + 8 * (vr - s.vy)) / (G * cs);
      control = true;
      if (s.pt >= s.hold) {
        s.phase = 'descend';
        s.pt = 0;
        s.vrPrev = 0;
        chooseLanding(0);
      }
    } else if (s.phase === 'drag') {
      const yr = s.target.y - podH() - s.bh / 2 - REST;
      total = (G + 34 * (yr - s.y) - 10 * s.vy) / (G * cs);
      control = true;
    } else if (s.phase === 'descend') {
      xt = s.landX;
      kp = s.boost ? 5 : 4;
      kd = s.boost ? 4.6 : 4.2;
      const vmax = 170;
      const vt = 32;
      const off = s.boost ? smooth((Math.abs(s.landX - s.x) - 20) / 40) : smooth((Math.abs(s.landX - s.x) - 3) / 23);
      const h = Math.max(s.y + REST, 0);
      const profile = (vt + (vmax - vt) * (1 - Math.exp(-h / 52))) * (1 - (s.boost ? 0.45 : 0.88) * off);
      const ramp = s.boost ? vmax * 3 : vmax * smooth(s.pt / 0.9) + 1;
      const vr = -Math.min(profile, ramp);
      const ar = clamp((vr - s.vrPrev) / Math.max(dt, 1e-4), -600, 600);
      s.vrPrev = vr;
      total = (G + ar + (s.boost ? 9 : 7) * (vr - s.vy)) / (G * cs);
      control = true;
      if (s.contact && s.pt > 0.3) {
        s.phase = 'landed';
        s.pt = 0;
        s.boost = false;
      }
    } else if (s.phase === 'landed') {
      total = 0;
      if (s.pt > 0.6 && totalThrust() < 0.03) {
        const back = rampOn() && s.track ? home() : s.x;
        s.phase = Math.abs(back - s.x) > 6 ? 'return' : 'rest';
        s.pt = 0;
        s.thrust = [0, 0, 0, 0];
        s.vy = 0;
        s.w = 0;
        s.vx = 0;
        s.track = null;
        s.back = { from: s.x, to: back, time: clamp(Math.abs(back - s.x) / 200, 0.7, 1.8) };
      }
    }
    total = Number.isFinite(total) ? clamp(total, 0, s.boost || s.phase === 'flip' ? 2.6 : 1.9) : 1;

    const xs = offsets();
    const n = xs.length;
    const sx2 = xs.reduce((acc, v) => acc + v * v, 0);
    const hand = s.phase === 'drag' ? clamp(100 * (s.target.x - s.x) - 17 * s.vx, -2400, 2400) : 0;
    let alphaCmd = 0;
    if (control) {
      const gust = 0.8 * wob * wave(s.clock * 1.7, s.seed + 3);
      const aCmd = s.phase === 'drag' ? hand * 0.75 : kp * (xt - s.x) - kd * s.vx;
      const lean = s.boost ? 0.45 : 0.32;
      const thRef = clamp(-Math.atan2(aCmd, G), -lean, lean);
      alphaCmd = -81 * (s.th - thRef) - 14 * s.w - gust;
    }
    const cap = (s.boost || s.phase === 'flip' ? 2.6 : 2.4) / n;
    const spool = (cur: number, cmd: number) => cur + (cmd - cur) * (1 - Math.exp(-dt / (cmd > cur ? 0.08 : 0.17)));
    const unit = sx2 > 1 ? (alphaCmd * I) / (G * sx2) : 0;
    const room = Math.abs(unit) * Math.max(0, ...xs.map(Math.abs));
    const base = Math.min(total / n, Math.max(cap - room, cap * 0.5));
    let torque = 0;
    for (let k = 0; k < MAX_JETS; k += 1) {
      let cmd = 0;
      if (k < n) {
        cmd = clamp(base + unit * xs[k], 0, cap);
        if (s.phase === 'ignite' && s.pt < s.delay[k]) cmd = 0;
      }
      s.thrust[k] = spool(s.thrust[k], cmd);
      if (k < n) torque += s.thrust[k] * xs[k];
    }

    const T = totalThrust() * G;
    let ax = s.phase === 'drag' ? hand : -T * Math.sin(s.th) - 0.8 * s.vx;
    let ay = T * Math.cos(s.th) - G - 0.3 * s.vy;
    let alpha = s.phase === 'flip' ? 0 : (torque * G) / I - 1.2 * s.w;
    if (control) {
      if (s.phase !== 'drag') ax += 12 * wob * wave(s.clock * 0.7, s.seed + 7);
      alpha += 0.9 * wob * wave(s.clock * 2.3, s.seed + 11);
      if (sx2 < 1) alpha += alphaCmd;
      if (Math.abs(s.th) > 0.35) alpha -= (s.th - Math.sign(s.th) * 0.35) * 160;
    }
    const c = craftCenter();
    const csn = Math.cos(s.th);
    const sn = Math.sin(s.th);
    const ry = -(s.bh / 2 + podH());
    let contact = false;
    if (s.phase !== 'flip') {
      feet().forEach(rx => {
        const ox = rx * csn - ry * sn;
        const oy = rx * sn + ry * csn;
        const footY = c.y + oy;
        const pen = REST - footY;
        if (pen > 0) {
          contact = true;
          const vpy = s.vy + s.w * ox;
          const vpx = s.vx - s.w * oy;
          const fy = Math.max(0, SPRING * pen - DAMP * vpy);
          const fx = -10 * vpx;
          ay += fy;
          ax += fx;
          alpha += (ox * fy - oy * fx) / I;
        }
      });
    }
    s.contact = contact;
    s.vx = clamp(s.vx + ax * dt, -1500, 1500);
    s.vy = clamp(s.vy + ay * dt, -1500, 1500);
    s.w = clamp(s.w + alpha * dt, -14, 14);
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.th += s.w * dt;
    if (turn) {
      s.th = turn.th;
      s.w = turn.w;
    }
    if (s.phase !== 'flip' && Math.abs(s.th) > TILT_MAX) {
      s.th = Math.sign(s.th) * TILT_MAX;
      if (s.w * s.th > 0) s.w = 0;
    }
    const [lo, hi] = xLimits();
    if (s.x < lo || s.x > hi) {
      s.x = clamp(s.x, lo, hi);
      s.vx = 0;
    }
    if (s.y + REST < -40) {
      s.y = -REST;
      s.vy = 0;
    }
    if (!Number.isFinite(s.y + s.x + s.th + s.vy + s.vx + s.w + totalThrust())) {
      Object.assign(s, { x: s.W / 2, vx: 0, y: -REST, vy: 0, th: 0, w: 0, thrust: [0, 0, 0, 0], phase: 'rest' });
      s.drag = null;
    }
  };

  const updatePointer = (dt: number) => {
    const P = props.current;
    const p = s.pointer;
    const c = cssCenter();
    if (s.attached && !s.drag && s.lastC) {
      const fx = p.x + s.off.x;
      const fy = p.y + s.off.y;
      const da = -(s.th - s.lastTh);
      const rx = fx - s.lastC.x;
      const ry = fy - s.lastC.y;
      const nx = c.x + rx * Math.cos(da) - ry * Math.sin(da);
      const ny = c.y + rx * Math.sin(da) + ry * Math.cos(da);
      s.off.x += nx - fx;
      s.off.y += ny - fy;
    }
    s.lastC = c;
    s.lastTh = s.th;
    const fx = p.x + s.off.x;
    const fy = p.y + s.off.y;
    const over = p.in && overCraft(fx, fy, s.attached || s.drag ? 10 : 0);
    if (over !== s.hover) {
      s.hover = over;
      if (over) button.dataset.hover = '';
      else delete button.dataset.hover;
    }
    if (!over && !s.drag) {
      s.attached = false;
      if (s.phase === 'rest') s.armed = true;
    }
    if (over && s.armed && s.phase === 'rest' && p.type === 'mouse' && P.trigger !== 'click' && !rampOn() && launch()) {
      s.attached = Boolean(P.carryCursor);
    }
    if (s.phase === 'rest' && Math.abs(s.off.x) + Math.abs(s.off.y) < 12) {
      const k = Math.exp(-dt * 6);
      s.off.x *= k;
      s.off.y *= k;
    }
    if (Math.abs(s.off.x) + Math.abs(s.off.y) < 0.3 && (!s.attached || s.phase === 'rest')) {
      s.off.x = 0;
      s.off.y = 0;
      if (s.phase === 'rest') s.attached = false;
    }
    const carry =
      Boolean(P.carryCursor) &&
      p.in &&
      p.type === 'mouse' &&
      (s.attached || Boolean(s.drag) || s.off.x !== 0 || s.off.y !== 0);
    if (carry !== s.carry) {
      s.carry = carry;
      if (carry) root.dataset.carry = '';
      else delete root.dataset.carry;
    }
    if (carry && cursor) {
      cursor.style.transform = `translate3d(${(fx - 1.8).toFixed(2)}px, ${(fy - 1.75).toFixed(2)}px, 0)`;
    }
  };

  const frame = (now: number) => {
    s.raf = 0;
    const dt = s.last ? clamp((now - s.last) / 1000, 0, 1 / 30) : 1 / 60;
    s.last = now;
    if (dt > 0) {
      if (s.phase !== 'rest') {
        const steps = 6;
        for (let i = 0; i < steps; i += 1) physics(dt / steps);
      }
      const kf = 1 - Math.exp(-dt / 0.12);
      s.fvx += (s.vx - s.fvx) * kf;
      s.fvy += (s.vy - s.fvy) * kf;
      updatePointer(dt);
      place();
      draw(dt);
      const thrust = totalThrust();
      s.quiet = thrust > 0.01 || s.phase !== 'rest' ? 0 : s.quiet + dt;
      const firing = thrust > 0.05 ? 1 : 0;
      s.activity += (firing - s.activity) * (1 - Math.exp(-dt / (firing ? 0.25 : 1.6)));
    }
    if (s.phase !== 'rest' || s.quiet < 7 || s.carry) s.raf = requestAnimationFrame(frame);
    else {
      s.running = false;
      s.last = 0;
      if (sim) sim.clear();
      draw(0);
    }
  };

  const wake = () => {
    if (s.raf) return;
    s.running = true;
    s.raf = requestAnimationFrame(frame);
  };

  const local = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const pointerAt = () => {
    const p = s.pointer;
    const mouse = p.type === 'mouse';
    return { x: p.x + (mouse ? s.off.x : 0), y: p.y + (mouse ? s.off.y : 0) };
  };

  const aim = () => {
    if (!s.drag) return;
    const f = pointerAt();
    const [lo, hi] = xLimits();
    const low = podH() + s.bh / 2;
    s.target.x = clamp(f.x - s.drag.gx, lo, hi);
    s.target.y = clamp(s.H - (f.y - s.drag.gy), low, Math.max(low, s.H - s.bh / 2 - 6));
  };

  const startDrag = (e: PointerEvent) => {
    const f = pointerAt();
    const c = cssCenter();
    s.drag = { gx: f.x - c.x, gy: f.y - c.y };
    s.phase = 'drag';
    s.pt = 0;
    s.attached = false;
    s.pressed = false;
    s.suppress = true;
    s.boost = false;
    delete button.dataset.pressed;
    root.dataset.dragging = '';
    try {
      root.setPointerCapture(e.pointerId);
    } catch {}
    aim();
  };

  const endDrag = (e: PointerEvent) => {
    s.drag = null;
    s.press = null;
    delete root.dataset.dragging;
    try {
      root.releasePointerCapture(e.pointerId);
    } catch {}
    s.phase = 'hover';
    s.pt = 0;
    s.alt = s.y;
    const [lo, hi] = xLimits();
    s.xRef = clamp(s.x + s.vx * 0.3, lo, hi);
    s.hold = Math.min(Math.max(0, num(props.current.hoverTime, 2.4)), 0.9);
  };

  const onMove = (e: PointerEvent) => {
    const q = local(e);
    const p = s.pointer;
    if (p.in && !s.attached && !s.drag && (s.off.x || s.off.y)) {
      const k = Math.exp(-Math.hypot(q.x - p.x, q.y - p.y) / 110);
      s.off.x *= k;
      s.off.y *= k;
    }
    p.x = q.x;
    p.y = q.y;
    p.in = true;
    p.type = e.pointerType || 'mouse';
    if (s.press && !s.drag && flying() && Math.hypot(q.x - s.press.x, q.y - s.press.y) > 4) startDrag(e);
    if (s.drag) aim();
    updatePointer(0);
    if (s.carry || s.phase !== 'rest') wake();
  };

  const onLeave = () => {
    if (s.drag) return;
    s.pointer.in = false;
    s.attached = false;
    s.off.x = 0;
    s.off.y = 0;
    updatePointer(0);
  };

  const onDown = (e: PointerEvent) => {
    const q = local(e);
    const p = s.pointer;
    p.x = q.x;
    p.y = q.y;
    p.in = true;
    p.type = e.pointerType || 'mouse';
    s.suppress = false;
    const f = pointerAt();
    if (!overCraft(f.x, f.y, s.attached ? 10 : 0)) return;
    if (p.type !== 'mouse' && s.phase === 'rest' && props.current.trigger !== 'click' && !rampOn()) launch();
    s.press = { x: q.x, y: q.y };
    if (s.carry && p.type === 'mouse') {
      s.pressed = true;
      button.dataset.pressed = '';
    }
  };

  const onUp = (e: PointerEvent) => {
    if (s.drag) {
      endDrag(e);
      return;
    }
    s.press = null;
    if (!s.pressed) return;
    s.pressed = false;
    delete button.dataset.pressed;
    if (s.carry && s.hover) {
      if (s.phase === 'rest' && rampOn()) ride();
      else if (props.current.trigger === 'click' && launch()) s.attached = Boolean(props.current.carryCursor);
      if (props.current.onClick) props.current.onClick(e);
    }
  };

  const onClick = (e: MouseEvent) => {
    if (s.suppress) {
      s.suppress = false;
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (s.phase !== 'rest') return;
    if (rampOn()) {
      ride();
      return;
    }
    if (launch() && s.pointer.type === 'mouse' && s.pointer.in && s.hover) {
      s.attached = Boolean(props.current.carryCursor);
    }
  };

  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerenter', onMove);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);
  button.addEventListener('click', onClick);

  const ro = new ResizeObserver(measure);
  ro.observe(root);
  ro.observe(button);
  measure();

  return {
    refresh: measure,
    rehome() {
      measure();
      if (s.phase !== 'rest') return;
      s.x = home();
      place();
      if (!s.running) draw(0);
    },
    destroy() {
      ro.disconnect();
      dropStrip();
      if (s.raf) cancelAnimationFrame(s.raf);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerenter', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      button.removeEventListener('click', onClick);
      if (sim) sim.dispose();
    }
  };
}

function createSim(gl: WebGL2RenderingContext) {
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type) as WebGLShader;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(log || 'shader');
    }
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const programs: Program[] = [];
  const make = (src: string): Program => {
    const fs = compile(gl.FRAGMENT_SHADER, src);
    const p = gl.createProgram() as WebGLProgram;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'program');
    gl.deleteShader(fs);
    const u: Record<string, WebGLUniformLocation | null> = {};
    const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i += 1) {
      const info = gl.getActiveUniform(p, i) as WebGLActiveInfo;
      u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
    }
    const prog = { p, u };
    programs.push(prog);
    return prog;
  };

  const P = {
    advect: make(ADVECT),
    force: make(FORCE),
    curl: make(CURL),
    vorticity: make(VORTICITY),
    divergence: make(DIVERGENCE),
    pressure: make(PRESSURE),
    gradient: make(GRADIENT),
    scale: make(SCALE),
    blur: make(BLUR),
    dye: make(DYE),
    render: make(RENDER)
  };

  const vao = gl.createVertexArray();
  const targets: Target[] = [];

  const target = (w: number, h: number, internal: number, mips: boolean): Target => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const levels = mips ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1;
    gl.texStorage2D(gl.TEXTURE_2D, levels, internal, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const t = { tex, fbo, w, h, mips };
    targets.push(t);
    return t;
  };
  const pair = (w: number, h: number, internal: number, mips: boolean): Pair => {
    const p = { read: target(w, h, internal, mips), write: target(w, h, internal, mips) } as Pair;
    p.swap = () => {
      const t = p.read;
      p.read = p.write;
      p.write = t;
    };
    return p;
  };

  let f: {
    vw: number;
    vh: number;
    dw: number;
    dh: number;
    velocity: Pair;
    pressure: Pair;
    divergence: Target;
    curl: Target;
    dye: Pair;
    soft: Target;
    temp: Target;
  } | null = null;
  let world = [1, 1];

  const free = () => {
    targets.forEach(t => {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    });
    targets.length = 0;
  };

  const resize = (W: number, H: number) => {
    const cell = Math.max(2, W / 520, H / 300);
    const vw = Math.max(16, Math.round(W / cell));
    const vh = Math.max(16, Math.round(H / cell));
    const dw = Math.max(16, Math.round(W / (cell / 2)));
    const dh = Math.max(16, Math.round(H / (cell / 2)));
    world = [W, H];
    if (f && f.vw === vw && f.vh === vh && f.dw === dw && f.dh === dh) return;
    free();
    f = {
      vw,
      vh,
      dw,
      dh,
      velocity: pair(vw, vh, gl.RG16F, false),
      pressure: pair(vw, vh, gl.R16F, false),
      divergence: target(vw, vh, gl.R16F, false),
      curl: target(vw, vh, gl.R16F, false),
      dye: pair(dw, dh, gl.RG16F, false),
      soft: target(dw, dh, gl.RG16F, true),
      temp: target(dw, dh, gl.RG16F, false)
    };
  };

  let unit = 0;
  const bind = (prog: Program, values: Record<string, Uniform>) => {
    gl.useProgram(prog.p);
    unit = 0;
    Object.entries(values).forEach(([name, v]) => {
      const loc = prog.u[name];
      if (loc === undefined || loc === null) return;
      if (typeof v === 'number') gl.uniform1f(loc, v);
      else if ('f1' in v) gl.uniform1fv(loc, v.f1);
      else if ('tex' in v) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, v.tex);
        gl.uniform1i(loc, unit);
        unit += 1;
      } else if (v.length === 2) gl.uniform2fv(loc, v);
      else if (v.length === 3) gl.uniform3fv(loc, v);
      else gl.uniform4fv(loc, v);
    });
  };
  const run = (prog: Program, values: Record<string, Uniform>, out?: Target) => {
    bind(prog, values);
    if (out) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, out.fbo);
      gl.viewport(0, 0, out.w, out.h);
    }
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const step = (dt: number, o: StepInput) => {
    if (!f) return;
    const K = SMOKE;
    gl.disable(gl.BLEND);
    const vt = [1 / f.vw, 1 / f.vh];
    run(
      P.advect,
      { uVelocity: f.velocity.read, uSource: f.velocity.read, uWorld: world, uDt: dt, uKeep: 1 },
      f.velocity.write
    );
    f.velocity.swap();
    run(
      P.force,
      {
        uVelocity: f.velocity.read,
        uDye: f.soft,
        uWorld: world,
        uDt: dt,
        uBuoyancy: K.buoy,
        uLift: K.lift,
        uDamping: K.damp,
        uSpread: K.spread,
        uSplash: K.splash,
        uFriction: K.friction,
        uWind: o.wind,
        uTurb: [K.turb * (0.35 + 0.65 * o.activity), K.turbScale],
        uTime: o.time,
        uObstacle: o.calm,
        uKick: [K.kickNear * o.scale, K.kickW * o.scale, K.kickH * o.scale],
        uCraft: o.craft,
        uCraftMotion: o.motion,
        uJetA: o.jets.a,
        uJetB: o.jets.b,
        uJetBend: { f1: o.jets.bend }
      },
      f.velocity.write
    );
    f.velocity.swap();
    run(P.curl, { uVelocity: f.velocity.read, uTexel: vt }, f.curl);
    run(
      P.vorticity,
      {
        uVelocity: f.velocity.read,
        uCurl: f.curl,
        uTexel: vt,
        uStrength: K.vort * o.turbulence * (0.4 + 0.6 * o.activity),
        uDt: dt
      },
      f.velocity.write
    );
    f.velocity.swap();
    run(P.divergence, { uVelocity: f.velocity.read, uTexel: vt }, f.divergence);
    run(P.scale, { uSource: f.pressure.read, uScale: 0.8 }, f.pressure.write);
    f.pressure.swap();
    for (let i = 0; i < K.iters; i += 1) {
      run(P.pressure, { uPressure: f.pressure.read, uDivergence: f.divergence, uTexel: vt }, f.pressure.write);
      f.pressure.swap();
    }
    run(P.gradient, { uPressure: f.pressure.read, uVelocity: f.velocity.read, uTexel: vt }, f.velocity.write);
    f.velocity.swap();

    run(
      P.dye,
      {
        uVelocity: f.velocity.read,
        uSource: f.dye.read,
        uWorld: world,
        uDt: dt,
        uKeep: [Math.exp(-(K.keepD + K.keepIdle * (1 - o.activity)) * dt), Math.exp(-K.keepH * dt)],
        uRate: [K.rateN * o.smoke, K.rateH, K.rateK * o.smoke, K.rateC * o.smoke],
        uSpread: K.spread,
        uCol: [K.colSpread, K.colR * o.scale, K.colD, K.colU],
        uKick: [K.kickNear * o.scale, K.kickW * o.scale, K.kickH * o.scale],
        uDisperse: K.disperse,
        uDispV: K.dispV,
        uCraft: o.craft,
        uCraftMotion: o.motion,
        uGap: [o.spacing, K.gap * o.calm],
        uJetX: { f1: o.jetX },
        uJetN: o.jetN,
        uFloor: K.floor,
        uTime: o.time,
        uJetA: o.jets.a,
        uJetB: o.jets.b,
        uJetBend: { f1: o.jets.bend }
      },
      f.dye.write
    );
    f.dye.swap();
    const spread = K.blur / 2;
    run(P.blur, { uSource: f.dye.read, uStep: [spread / f.dw, 0] }, f.temp);
    run(P.blur, { uSource: f.temp, uStep: [0, spread / f.dh] }, f.soft);
    gl.bindTexture(gl.TEXTURE_2D, f.soft.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  const render = (cw: number, ch: number, o: RenderInput) => {
    if (!f) return;
    const K = SMOKE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cw, ch);
    gl.disable(gl.BLEND);
    run(P.render, {
      uDye: f.soft,
      uWorld: world,
      uDyeSize: [f.dw, f.dh],
      uTime: o.time,
      uLightTheme: o.light ? 1 : 0,
      uSmoke: o.smokeColor,
      uShade: o.shadeColor,
      uThrust: o.thrustColor,
      uLook: [K.alphaK * (0.6 + 0.4 * o.activity), K.relief, K.shadow, K.alphaLod],
      uLook2: [K.ambient, K.key, K.wrap, K.ao],
      uLook3: [K.normalE, K.normalLod, K.fine, K.broad],
      uCol: [K.colSpread, K.colR * o.scale, K.colD, K.colU],
      uScale: o.scale,
      uGamma: K.gamma,
      uTone: K.tone,
      uLight2: [K.jetLight, K.emit, K.exposure],
      uThreshold: K.threshold * (0.3 + 0.7 * o.activity),
      uCraft: o.craft,
      uCraftMotion: o.motion,
      uJetA: o.jets.a,
      uJetB: o.jets.b,
      uJetBend: { f1: o.jets.bend }
    });
  };

  const clear = () => {
    if (!f) return;
    [
      f.velocity.read,
      f.velocity.write,
      f.pressure.read,
      f.pressure.write,
      f.dye.read,
      f.dye.write,
      f.soft,
      f.temp
    ].forEach(t => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    gl.bindTexture(gl.TEXTURE_2D, f.soft.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  const dispose = () => {
    free();
    programs.forEach(p => gl.deleteProgram(p.p));
    gl.deleteShader(vs);
    gl.deleteVertexArray(vao);
  };

  return { step, render, resize, clear, dispose };
}

export interface FlyingButtonProps {
  children?: ReactNode;
  onClick?: ClickHandler;
  theme?: Theme;
  size?: Size;
  radius?: number;
  altitude?: number;
  hoverTime?: number;
  jets?: number;
  thrusters?: boolean;
  trigger?: Trigger;
  carryCursor?: boolean;
  ramp?: boolean;
  smoke?: number;
  turbulence?: number;
  wobble?: number;
  thrustColor?: string;
  smokeColor?: string;
  buttonColor?: string;
  textColor?: string;
  rampColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function FlyingButton({
  children = 'Take off',
  onClick,
  theme = 'dark',
  size = 'medium',
  radius,
  altitude = 170,
  hoverTime = 2.4,
  jets = 2,
  thrusters = true,
  trigger = 'hover',
  carryCursor = true,
  ramp = false,
  rampColor,
  smoke = 1,
  turbulence = 1,
  wobble = 1,
  thrustColor,
  smokeColor,
  buttonColor,
  textColor,
  className = '',
  style
}: FlyingButtonProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cursorRef = useRef<SVGSVGElement>(null);
  const rampRef = useRef<SVGSVGElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const propsRef = useRef<EngineProps>({} as EngineProps);
  const light = theme === 'light';
  const dims = SIZES[size as Size] || SIZES.medium;
  const thrust = thrustColor || (light ? '#4f8cff' : '#8ec5ff');
  const smokeTone = smokeColor || (light ? '#e9ebf0' : '#eef1f6');
  const body = buttonColor || (light ? '#18181b' : '#27272a');
  const ink = textColor || (light ? '#fafafa' : '#f5f5f5');
  const deck = rampColor || (light ? '#ececf0' : '#25222b');
  const jetCount = clamp(Math.round(num(jets, 2)), 1, MAX_JETS);
  const spread = jetCount === 1 ? 0 : jetCount === 2 ? 0.3 : 0.34;
  const pods = thrusters
    ? Array.from({ length: jetCount }, (_, k) =>
        jetCount === 1 ? 50 : 50 + spread * 100 * ((2 * k) / (jetCount - 1) - 1)
      )
    : [];
  propsRef.current = {
    size,
    altitude,
    hoverTime,
    jets: jetCount,
    thrusters: Boolean(thrusters),
    trigger,
    carryCursor,
    ramp: Boolean(ramp),
    smoke,
    turbulence,
    wobble,
    thrustColor: thrust,
    smokeColor: smokeTone,
    theme,
    onClick
  };

  useEffect(() => {
    if (!rootRef.current || !canvasRef.current || !buttonRef.current) return;
    const engine = createEngine({
      root: rootRef.current,
      canvas: canvasRef.current,
      button: buttonRef.current,
      cursor: cursorRef.current,
      ramp: rampRef.current,
      props: propsRef
    });
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      engine.destroy();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) engineRef.current.refresh();
  }, [size, jetCount, thrusters, radius]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.rehome();
  }, [ramp]);

  return (
    <div
      ref={rootRef}
      className={`flying-button ${className}`.trim()}
      data-theme={theme}
      data-trigger={ramp ? 'click' : trigger}
      style={
        {
          '--fly-bg': body,
          '--fly-ink': ink,
          '--fly-glow': thrust,
          '--fly-ramp': deck,
          '--fly-h': `${dims.h}px`,
          '--fly-px': `${dims.px}px`,
          '--fly-fs': `${dims.fs}px`,
          '--fly-scale': dims.k,
          ...(radius !== undefined && radius !== null ? { '--fly-radius': `${num(radius, 0)}px` } : {}),
          ...style
        } as CSSProperties
      }
    >
      <svg
        ref={rampRef}
        className="flying-button__ramp"
        style={ramp ? undefined : { display: 'none' }}
        aria-hidden="true"
      >
        <path className="flying-button__ramp-body" />
        <path className="flying-button__ramp-edge" />
      </svg>
      <canvas ref={canvasRef} className="flying-button__smoke" aria-hidden="true" />
      <button
        ref={buttonRef}
        type="button"
        className="flying-button__craft"
        onClick={e => propsRef.current.onClick && propsRef.current.onClick(e)}
      >
        <span className="flying-button__face" aria-hidden="true" />
        <span className="flying-button__label">{children}</span>
        {pods.map(left => (
          <span key={left} className="flying-button__pod" style={{ left: `${left}%` }} aria-hidden="true" />
        ))}
      </button>
      <svg ref={cursorRef} className="flying-button__cursor" viewBox="0 0 24 34" aria-hidden="true">
        <path
          d="M2.2 2.1v24.6l6.1-5.9 4.1 9.6 4.4-1.9-4.1-9.4h8.6z"
          fill="#0a0a0c"
          stroke="#fff"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
