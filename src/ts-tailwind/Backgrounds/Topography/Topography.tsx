'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

const FOV = 0.32;
const ORBIT = 9;
const NEAR = 0.05;
const FAR = 160;
const HEIGHT = 1.7;
const FREQUENCY = 0.45;
const INTRO_SECONDS = 2.8;
const MAX_PULSES = 4;
const BLOOM_LEVELS = 4;
const SCULPT_SIZE = 256;
const SCULPT_SPAN = 48;
const MAX_CELLS = 200000;
const SUN = [-0.81, 0.58, -0.02];
export type TopographyDirection = 'forward' | 'backward' | 'left' | 'right';
export type TopographyHoverEffect = 'lift' | 'trace' | 'light';
export type TopographyClickEffect = 'pulse' | 'peak' | 'none';
export type TopographyMarkers = 'none' | 'plus' | 'dots';

export interface TopographyProps {
  color?: string;
  lineCount?: number;
  lineWidth?: number;
  majorLines?: boolean;
  elevation?: number;
  foreground?: number;
  scale?: number;
  detail?: number;
  tilt?: number;
  speed?: number;
  direction?: TopographyDirection;
  morph?: number;
  glow?: number;
  depthOfField?: number;
  fog?: number;
  brightness?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  hoverEffect?: TopographyHoverEffect;
  mouseRadius?: number;
  mouseStrength?: number;
  trail?: number;
  parallax?: number;
  clickEffect?: TopographyClickEffect;
  markers?: TopographyMarkers;
  glitch?: number;
  intro?: boolean;
  lightMode?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Target {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  depth: WebGLRenderbuffer | null;
  width: number;
  height: number;
}

interface Frame {
  f: number[];
  r: number[];
  u: number[];
  eye: number[];
  distance: number;
}

interface Hit {
  x: number;
  y: number;
  z: number;
  depth: number;
}

interface Box {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  near: number;
}

interface Pulse {
  x: number;
  z: number;
  age: number;
}

interface TopographyState {
  intro: number;
  rise: number;
  travelX: number;
  travelZ: number;
  morph: number;
  yaw: number;
  pitch: number;
  yawVelocity: number;
  pitchVelocity: number;
  presence: number;
  focus: number;
  hit: Hit | null;
  brushFrom: { x: number; z: number } | null;
  sculptLife: number;
  burst: Pulse | null;
  level: number;
  trace: number;
  clock: number;
  tilt: number;
  elevation: number;
  scale: number;
}

const DIRECTIONS: Record<string, number[]> = { forward: [0, 1], backward: [0, -1], left: [-1, 0], right: [1, 0] };
const HOVER_EFFECTS = ['lift', 'trace', 'light'];
const MARKER_STYLES: Record<string, number> = { plus: 0, dots: 1 };
const MARKER_SPACING = 1.25;

const COMMON = `
precision highp float;
precision highp int;

uniform float uFrequency;
uniform vec2 uMorph;
uniform sampler2D uSculpt;
uniform float uSculptOn;
uniform vec4 uPulses[${MAX_PULSES}];
uniform vec3 uEye;
uniform vec3 uForward;
uniform vec3 uNear;

uint lattice(ivec2 p) {
  uvec2 q = uvec2(p + 1073741824);
  uint h = q.x * 2654435761u + q.y * 2246822519u;
  h = (h ^ (h >> 15u)) * 739982445u;
  h = (h ^ (h >> 12u)) * 695872825u;
  return h ^ (h >> 15u);
}

float corner(ivec2 c, vec2 f) {
  uint h = lattice(c);
  vec2 g = vec2(float(h & 65535u), float(h >> 16u)) / 32767.5 - 1.0;
  return dot(g, f);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  ivec2 c = ivec2(i);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = corner(c, f);
  float b = corner(c + ivec2(1, 0), f - vec2(1.0, 0.0));
  float d = corner(c + ivec2(0, 1), f - vec2(0.0, 1.0));
  float e = corner(c + ivec2(1, 1), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(d, e, u.x), u.y);
}

vec2 octave(vec2 p, vec2 shift) {
  return vec2(1.6 * p.x - 1.2 * p.y, 1.2 * p.x + 1.6 * p.y) + shift;
}

float relief(vec2 t) {
  vec2 p = t * uFrequency;
  vec2 w = vec2(noise(p * 0.42 + uMorph), noise(p * 0.42 - uMorph.yx + vec2(5.2, 1.3)));
  p += w * 0.8;
  float n = noise(p) * 0.55;
  p = octave(p, vec2(7.1, 3.7));
  n += noise(p) * 0.15;
  p = octave(p, vec2(1.9, 8.3));
  n += noise(p) * 0.04;
  float s = log(1.0 + exp(7.0 * (3.0 * n + 0.05))) / 7.0;
  return s * s * 1.4 + 0.1 * n;
}

float swell(vec2 t) {
  float lift = 0.0;
  for (int i = 0; i < ${MAX_PULSES}; i++) {
    vec4 p = uPulses[i];
    if (p.w <= 0.0) continue;
    float x = (length(t - p.xy) - p.z) / (0.28 + p.z * 0.05);
    lift += exp(-x * x) * p.w;
  }
  return lift;
}

vec4 sculpted(vec2 t) {
  return uSculptOn > 0.5 ? textureLod(uSculpt, t / ${SCULPT_SPAN}.0, 0.0) : vec4(0.0);
}

float settle(vec2 world) {
  float depth = dot(vec3(world.x, 0.0, world.y) - uEye, uForward);
  float x = clamp((depth - uNear.x) / max(uNear.y - uNear.x, 1e-3), 0.0, 1.0);
  return mix(uNear.z, 1.0, x * x * x * (x * (x * 6.0 - 15.0) + 10.0));
}
`;

const FIELD = `#version 300 es
${COMMON}
uniform ivec2 uBase;
uniform float uCell;
uniform float uDetail;
layout(location = 0) out vec4 outField;
layout(location = 1) out vec4 outHeight;

void main() {
  vec2 t = vec2(uBase + ivec2(gl_FragCoord.xy)) * uCell;
  vec4 carved = sculpted(t);
  float ring = swell(t);
  float ground = relief(t) + carved.r + ring * 0.14;
  vec2 dp = t * uFrequency * 5.0 + vec2(13.1, 4.7);
  float fine = noise(dp) * 0.6 + noise(octave(dp, vec2(2.3, 6.1))) * 0.3;
  outField = vec4(carved.g, ring, ground, carved.r);
  outHeight = vec4(ground + uDetail * 0.1 * fine, 0.0, 0.0, 1.0);
}`;

const terrainVertex = (baked: boolean) => `#version 300 es
#define BAKED ${baked ? 1 : 0}
${COMMON}
uniform sampler2D uField;
uniform ivec2 uOrigin;
uniform ivec2 uCamCell;
uniform vec2 uCamFrac;
uniform float uCell;
uniform int uStride;
uniform float uHeight;
uniform mat4 uViewProj;
out vec2 vTexel;
out vec2 vTerrain;
out float vDepth;
out float vLift;
out vec3 vNormal;

float ground(vec2 t) {
  return relief(t) + swell(t) * 0.14;
}

void main() {
  ivec2 step = ivec2(gl_VertexID >> 1, gl_InstanceID + (gl_VertexID & 1)) * uStride;
  ivec2 local = uOrigin + step;
  vec2 terrain = vec2(local + uCamCell) * uCell;
  vec2 world = vec2(local) * uCell - uCamFrac;
  float k = settle(world);
#if BAKED
  ivec2 texel = step + 2;
  vec4 c = texelFetch(uField, texel, 0);
  vec4 l = texelFetch(uField, texel - ivec2(1, 0), 0);
  vec4 r = texelFetch(uField, texel + ivec2(1, 0), 0);
  vec4 d = texelFetch(uField, texel - ivec2(0, 1), 0);
  vec4 u = texelFetch(uField, texel + ivec2(0, 1), 0);
  float h = (c.b - c.a) * k + c.a;
  float dx = (l.b - l.a - r.b + r.a) * k + l.a - r.a;
  float dz = (d.b - d.a - u.b + u.a) * k + d.a - u.a;
  vNormal = vec3(dx * uHeight / (2.0 * uCell), 1.0, dz * uHeight / (2.0 * uCell));
  vTexel = vec2(texel) + 0.5;
#else
  float h = ground(terrain) * k;
  float hx = ground(terrain + vec2(0.04, 0.0)) * k;
  float hz = ground(terrain + vec2(0.0, 0.04)) * k;
  vNormal = vec3((h - hx) * uHeight / 0.04, 1.0, (h - hz) * uHeight / 0.04);
  vTexel = vec2(0.0);
#endif
  vec4 clip = uViewProj * vec4(world.x, h * uHeight, world.y, 1.0);
  gl_Position = clip;
  vTerrain = terrain;
  vDepth = clip.w;
  vLift = h * uHeight;
}`;

const terrainFragment = (baked: boolean) => `#version 300 es
#define BAKED ${baked ? 1 : 0}
${COMMON}
uniform sampler2D uField;
uniform highp sampler2D uHeightField;
uniform float uDetail;
uniform float uLines;
uniform float uLineWidth;
uniform float uMajor;
uniform vec3 uColor;
uniform float uBrightness;
uniform vec2 uFade;
uniform vec3 uFocus;
uniform vec4 uHeat;
uniform vec4 uLamp;
uniform vec4 uTrace;
uniform vec3 uSun;
uniform float uRefDepth;
uniform float uReveal;
uniform float uLightMode;
uniform float uOpacity;
uniform vec4 uGlitch[3];
uniform float uGlitchSeed;
uniform float uPixel;
in vec2 vTexel;
in vec2 vTerrain;
in float vDepth;
in float vLift;
in vec3 vNormal;
out vec4 outColor;

float smoother(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float stroke(float dist, float width, float soft, float density, float crowd) {
  float cover = max(0.0, min(min(width, soft), 0.5 * (width + soft) - dist)) / soft;
  return mix(cover, min(width * density, 1.0) * 0.6, crowd);
}

float sampleHeight(vec2 coord, out vec2 slope) {
  vec2 u = coord - 0.5;
  vec2 i = floor(u + 0.5);
  vec2 f = u - i;
  vec3 wx = vec3(0.5 * (0.5 - f.x) * (0.5 - f.x), 0.75 - f.x * f.x, 0.5 * (0.5 + f.x) * (0.5 + f.x));
  vec3 wy = vec3(0.5 * (0.5 - f.y) * (0.5 - f.y), 0.75 - f.y * f.y, 0.5 * (0.5 + f.y) * (0.5 + f.y));
  vec3 dx = vec3(f.x - 0.5, -2.0 * f.x, 0.5 + f.x);
  vec3 dy = vec3(f.y - 0.5, -2.0 * f.y, 0.5 + f.y);
  ivec2 base = ivec2(i) - 1;
  float total = 0.0;
  slope = vec2(0.0);
  for (int y = 0; y < 3; y++) {
    float a = texelFetch(uHeightField, base + ivec2(0, y), 0).r;
    float b = texelFetch(uHeightField, base + ivec2(1, y), 0).r;
    float c = texelFetch(uHeightField, base + ivec2(2, y), 0).r;
    float row = a * wx.x + b * wx.y + c * wx.z;
    total += row * wy[y];
    slope += vec2((a * dx.x + b * dx.y + c * dx.z) * wy[y], row * dy[y]);
  }
  return total;
}

void main() {
  float py = gl_FragCoord.y / uPixel;
  float shift = 0.0;
  float split = 0.0;
  for (int i = 0; i < 3; i++) {
    if (py >= uGlitch[i].x && py < uGlitch[i].y) {
      shift = uGlitch[i].z * uPixel;
      split = uGlitch[i].w * uPixel;
    }
  }
  vec2 spot = vTerrain - dFdx(vTerrain) * shift;
#if BAKED
  vec2 ex = dFdx(vTexel);
  vec2 ey = dFdy(vTexel);
  vec2 coord = vTexel - ex * shift;
  vec2 slope;
  float h = sampleHeight(coord, slope);
  vec4 field = texture(uField, coord / vec2(textureSize(uField, 0)));
  float trail = field.r;
  float ring = field.g;
  float gx = dot(slope, ex) * uLines;
  float gy = dot(slope, ey) * uLines;
#else
  vec2 dp = spot * uFrequency * 5.0 + vec2(13.1, 4.7);
  float ring = swell(spot);
  float h = relief(spot) + ring * 0.14 + uDetail * 0.1 * (noise(dp) * 0.6 + noise(octave(dp, vec2(2.3, 6.1))) * 0.3);
  float trail = 0.0;
  float gx = dFdx(h) * uLines;
  float gy = dFdy(h) * uLines;
#endif

  float lc = h * uLines + 0.5;
  float density = max(sqrt(gx * gx + gy * gy), 1e-5);
  float dist = abs(fract(lc + 0.5) - 0.5) / density;
  float major = uMajor * (1.0 - step(0.5, mod(floor(lc + 0.5), 5.0)));

  vec2 hd = spot - uHeat.xy;
  float heat = exp(-dot(hd, hd) / (uHeat.z * uHeat.z)) * uHeat.w + trail * 0.6;
  float energy = heat + ring;

  float depth = max(vDepth, 0.01);
  float persp = clamp(sqrt(uRefDepth / depth), 0.6, 1.6);
  float width = uLineWidth * persp * (1.0 + 0.6 * major) * (1.0 + 0.45 * min(energy, 1.5));
  float soft = 1.0 + min(uFocus.y * abs(1.0 - uFocus.x / depth), uFocus.z);
  float crowd = smoothstep(0.3, 0.75, density * max(width, soft));
  float cover = stroke(dist, width, soft, density, crowd);
  vec3 cover3 = vec3(cover);
  if (split > 0.0) {
    float offset = split * density;
    cover3.r = stroke(abs(fract(lc + offset + 0.5) - 0.5) / density, width, soft, density, crowd);
    cover3.b = stroke(abs(fract(lc - offset + 0.5) - 0.5) / density, width, soft, density, crowd);
    vec2 block = floor(vec2(gl_FragCoord.x / (uPixel * 26.0), py / 5.0)) + uGlitchSeed * 71.0;
    float drop = fract(sin(dot(block, vec2(12.9898, 78.233))) * 43758.5453);
    cover3 *= drop > 0.82 ? 0.1 : 1.2;
  }

  vec3 normal = normalize(vNormal);
  float sun = clamp(dot(normal, uSun), 0.0, 1.0);
  vec3 toLamp = uLamp.xyz - vec3(vTerrain.x, vLift, vTerrain.y);
  float lampDistance = length(toLamp);
  float lamp = clamp(dot(normal, toLamp / max(lampDistance, 1e-3)), 0.0, 1.0) * uLamp.w / (1.0 + lampDistance * lampDistance * 0.9);
  float level = mix(0.45, 1.05, smoothstep(0.0, 1.1, h)) * mix(0.35, 1.25, sun * sun) * (1.0 + 0.6 * major);
  level += heat * 1.4 + ring * 3.0 + lamp * 1.2;

  float fade = 1.0 - smoother((depth - uFade.x) / max(uFade.y - uFade.x, 1e-3));
  vec3 light = cover3 * level;

  if (uTrace.y > 0.0) {
    float traceWidth = uLineWidth * persp * 1.8;
    float trace = stroke(abs(h - uTrace.x) * uLines / density, traceWidth, soft, density, crowd);
    vec2 td = spot - uTrace.zw;
    light += trace * uTrace.y * mix(0.35, 1.0, exp(-dot(td, td) / 20.0)) * 2.6;
  }
  light *= fade * uBrightness * uReveal;

  if (uLightMode > 0.5) {
    float ink = (1.0 - exp(-max(max(light.r, light.g), light.b) * 1.8)) * 0.92 * uOpacity;
    outColor = vec4(uColor * ink, ink);
    return;
  }

  vec3 color = 1.0 - exp(-uColor * light * 1.8);
  float top = max(max(color.r, color.g), color.b);
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  color = max(color + dither / 255.0 * step(0.002, top), 0.0);
  outColor = vec4(color, max(max(color.r, color.g), color.b)) * uOpacity;
}`;

const MARKER_VERTEX = `#version 300 es
${COMMON}
uniform ivec2 uOrigin;
uniform ivec2 uCamCell;
uniform vec2 uCamFrac;
uniform float uSpacing;
uniform int uColumns;
uniform float uHeight;
uniform mat4 uViewProj;
uniform vec2 uView;
uniform float uSize;
uniform float uRefDepth;
uniform vec4 uHeat;
uniform float uTime;
uniform vec4 uGlitch[3];
uniform float uPixel;
out vec2 vCorner;
out float vSize;
out float vGlow;
out float vFrame;
out float vDepth;

void main() {
  ivec2 local = uOrigin + ivec2(gl_InstanceID % uColumns, gl_InstanceID / uColumns);
  ivec2 id = local + uCamCell;
  vec2 terrain = vec2(id) * uSpacing;
  vec2 world = vec2(local) * uSpacing - uCamFrac;
  float ring = swell(terrain);
  float h = (relief(terrain) + ring * 0.14) * settle(world) + sculpted(terrain).r;
  vec4 clip = uViewProj * vec4(world.x, h * uHeight + 0.05, world.y, 1.0);
  uint seed = lattice(id + ivec2(911, 377));
  float a = float(seed & 1023u) / 1023.0;
  float b = float((seed >> 10u) & 1023u) / 1023.0;
  vec2 hd = terrain - uHeat.xy;
  float heat = exp(-dot(hd, hd) / (uHeat.z * uHeat.z)) * uHeat.w;
  float blink = step(0.92, a) * (0.5 + 0.5 * sin(uTime * (1.4 + b * 2.2) + b * 40.0));
  float size = uSize * clamp(sqrt(uRefDepth / max(clip.w, 0.01)), 0.6, 1.3) * (1.0 + 0.4 * heat + 0.35 * blink);
  float frame = max(smoothstep(0.55, 0.95, blink), smoothstep(0.3, 0.8, heat));
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 offset = corner * (size * (frame > 0.001 ? 2.6 : 1.0) + 1.5);
  float py = (clip.y / clip.w * 0.5 + 0.5) * uView.y / uPixel;
  float shift = 0.0;
  for (int i = 0; i < 3; i++) {
    if (py >= uGlitch[i].x && py < uGlitch[i].y) shift = uGlitch[i].z;
  }
  clip.xy += (offset + vec2(shift * uPixel, 0.0)) / uView * 2.0 * clip.w;
  gl_Position = clip;
  vCorner = offset;
  vSize = size;
  vFrame = frame;
  vGlow = 0.5 + 0.4 * b + blink * 0.9 + heat * 1.8 + ring * 3.0;
  vDepth = clip.w;
}`;

const MARKER_FRAGMENT = `#version 300 es
precision highp float;
uniform vec3 uColor;
uniform vec2 uFade;
uniform float uReveal;
uniform float uBrightness;
uniform float uLightMode;
uniform float uOpacity;
uniform float uStyle;
uniform float uPixel;
in vec2 vCorner;
in float vSize;
in float vGlow;
in float vFrame;
in float vDepth;
out vec4 outColor;

float smoother(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 a = abs(vCorner);
  float cover;
  if (uStyle < 0.5) {
    float thick = max(0.6 * uPixel, 0.5);
    float across = clamp(vSize - a.x + 0.5, 0.0, 1.0) * clamp(thick - a.y + 0.5, 0.0, 1.0);
    float down = clamp(vSize - a.y + 0.5, 0.0, 1.0) * clamp(thick - a.x + 0.5, 0.0, 1.0);
    cover = max(across, down);
  } else {
    cover = clamp(vSize * 0.42 - length(vCorner) + 0.5, 0.0, 1.0);
  }
  if (vFrame > 0.001) {
    float edge = vSize * 2.3;
    float reach = edge * 0.45;
    float line = max(0.5 * uPixel, 0.5);
    float sides = clamp(line - abs(a.x - edge) + 0.5, 0.0, 1.0) * clamp(a.y - edge + reach + 0.5, 0.0, 1.0) * clamp(edge + line - a.y + 0.5, 0.0, 1.0);
    float caps = clamp(line - abs(a.y - edge) + 0.5, 0.0, 1.0) * clamp(a.x - edge + reach + 0.5, 0.0, 1.0) * clamp(edge + line - a.x + 0.5, 0.0, 1.0);
    cover = max(cover, max(sides, caps) * vFrame * 0.8);
  }
  float fade = 1.0 - smoother((vDepth - uFade.x) / max(uFade.y - uFade.x, 1e-3));
  float light = cover * vGlow * fade * fade * uReveal * uBrightness;
  if (uLightMode > 0.5) {
    float ink = (1.0 - exp(-light * 1.8)) * 0.92 * uOpacity;
    outColor = vec4(uColor * ink, ink);
    return;
  }
  vec3 color = 1.0 - exp(-uColor * light * 1.8);
  outColor = vec4(color, max(max(color.r, color.g), color.b)) * uOpacity;
}`;

const FULLSCREEN = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const SCULPT = `#version 300 es
precision highp float;
uniform sampler2D uPrevious;
uniform vec4 uSegment;
uniform vec4 uBrush;
uniform vec4 uBurst;
uniform vec2 uDecay;
out vec4 outColor;

vec2 wrapped(vec2 d) {
  return d - ${SCULPT_SPAN}.0 * floor(d / ${SCULPT_SPAN}.0 + 0.5);
}

void main() {
  vec4 previous = texelFetch(uPrevious, ivec2(gl_FragCoord.xy), 0);
  vec2 t = gl_FragCoord.xy / ${SCULPT_SIZE}.0 * ${SCULPT_SPAN}.0;
  vec2 a = wrapped(t - uSegment.xy);
  vec2 ab = uSegment.zw - uSegment.xy;
  float k = clamp(dot(a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  vec2 d = a - ab * k;
  float g = exp(-dot(d, d) / (uBrush.x * uBrush.x)) * uBrush.w;
  float height = previous.r * uDecay.x;
  height += (uBrush.y - height) * g * uBrush.z;
  float heat = previous.g * uDecay.y;
  heat += (1.0 - heat) * g * uBrush.z;
  vec2 b = wrapped(t - uBurst.xy);
  height += uBurst.w * exp(-dot(b, b) / (uBurst.z * uBurst.z));
  outColor = vec4(height, heat, 0.0, 1.0);
}`;

const DOWNSAMPLE = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTarget;
uniform vec2 uTexel;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec4 color = texture(uSource, uv - uTexel);
  color += texture(uSource, uv + uTexel);
  color += texture(uSource, uv + vec2(uTexel.x, -uTexel.y));
  color += texture(uSource, uv + vec2(-uTexel.x, uTexel.y));
  outColor = min(color * 0.25, vec4(1.0));
}`;

const BLUR = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTarget;
uniform vec2 uStep;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec4 color = texture(uSource, uv) * 0.181862;
  color += (texture(uSource, uv + uStep * 1.423135) + texture(uSource, uv - uStep * 1.423135)) * 0.284316;
  color += (texture(uSource, uv + uStep * 3.326702) + texture(uSource, uv - uStep * 3.326702)) * 0.106598;
  color += (texture(uSource, uv + uStep * 5.242989) + texture(uSource, uv - uStep * 5.242989)) * 0.018156;
  outColor = color;
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uBloom0;
uniform sampler2D uBloom1;
uniform sampler2D uBloom2;
uniform sampler2D uBloom3;
uniform vec2 uView;
uniform float uGlow;
uniform float uLightMode;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uView;
  vec4 halo = texture(uBloom0, uv) * 0.4;
  halo += texture(uBloom1, uv) * 0.3;
  halo += texture(uBloom2, uv) * 0.2;
  halo += texture(uBloom3, uv) * 0.1;
  if (uLightMode > 0.5) {
    outColor = halo * uGlow * 0.35;
    return;
  }
  vec3 color = halo.rgb * uGlow * 1.6;
  color = color / (1.0 + color);
  outColor = vec4(color, max(max(color.r, color.g), color.b));
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smoother = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

const lattice = (x: number, y: number) => {
  let h = (Math.imul(x + 1073741824, 2654435761) + Math.imul(y + 1073741824, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 739982445) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 695872825) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
};

const corner = (cx: number, cy: number, fx: number, fy: number) => {
  const h = lattice(cx, cy);
  return ((h & 65535) / 32767.5 - 1) * fx + ((h >>> 16) / 32767.5 - 1) * fy;
};

const noise = (x: number, y: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const a = corner(ix, iy, fx, fy);
  const b = corner(ix + 1, iy, fx - 1, fy);
  const d = corner(ix, iy + 1, fx, fy - 1);
  const e = corner(ix + 1, iy + 1, fx - 1, fy - 1);
  const top = a + (b - a) * ux;
  return top + (d + (e - d) * ux - top) * uy;
};

const relief = (tx: number, tz: number, frequency: number, morphX: number, morphZ: number) => {
  let px = tx * frequency;
  let pz = tz * frequency;
  const wx = noise(px * 0.42 + morphX, pz * 0.42 + morphZ);
  const wz = noise(px * 0.42 - morphZ + 5.2, pz * 0.42 - morphX + 1.3);
  px += wx * 0.8;
  pz += wz * 0.8;
  let n = noise(px, pz) * 0.55;
  const qx = 1.6 * px - 1.2 * pz + 7.1;
  const qz = 1.2 * px + 1.6 * pz + 3.7;
  n += noise(qx, qz) * 0.15;
  n += noise(1.6 * qx - 1.2 * qz + 1.9, 1.2 * qx + 1.6 * qz + 8.3) * 0.04;
  const s = Math.log(1 + Math.exp(7 * (3 * n + 0.05))) / 7;
  return s * s * 1.4 + 0.1 * n;
};

const fineDetail = (tx: number, tz: number, frequency: number) => {
  const px = tx * frequency * 5 + 13.1;
  const pz = tz * frequency * 5 + 4.7;
  return noise(px, pz) * 0.6 + noise(1.6 * px - 1.2 * pz + 2.3, 1.2 * px + 1.6 * pz + 6.1) * 0.3;
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

const link = (gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): Program | null => {
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
  const total = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < total; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const toRgb = (hex: string): number[] => {
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

const orient = (yaw: number, pitch: number) => {
  const cp = Math.cos(pitch);
  const f = [Math.sin(yaw) * cp, -Math.sin(pitch), Math.cos(yaw) * cp];
  const r = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
  return { f, r, u };
};

const lens = (aspect: number) => clamp(0.4877 / aspect, FOV, 0.6);

const viewProjection = ({ eye, f, r, u }: Frame, aspect: number, out: Float32Array) => {
  const t = 1 / lens(aspect);
  const nf = 1 / (NEAR - FAR);
  const view = [
    r[0],
    u[0],
    -f[0],
    0,
    r[1],
    u[1],
    -f[1],
    0,
    r[2],
    u[2],
    -f[2],
    0,
    -(r[0] * eye[0] + r[1] * eye[1] + r[2] * eye[2]),
    -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]),
    f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2],
    1
  ];
  const projection = [t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (FAR + NEAR) * nf, -1, 0, 0, 2 * FAR * NEAR * nf, 0];
  for (let c = 0; c < 4; c++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += projection[k * 4 + row] * view[c * 4 + k];
      out[c * 4 + row] = sum;
    }
  }
  return out;
};

const Topography = ({
  color = '#4f7cff',
  lineCount = 22,
  lineWidth = 1.2,
  majorLines = true,
  elevation = 1,
  foreground = 0.2,
  scale = 1,
  detail = 0.35,
  tilt = 32,
  speed = 0.25,
  direction = 'forward',
  morph = 0.2,
  glow = 0.6,
  depthOfField = 0.4,
  fog = 0.35,
  brightness = 1,
  opacity = 1,
  mouseInteraction = true,
  hoverEffect = 'lift',
  mouseRadius = 1,
  mouseStrength = 0.6,
  trail = 0.3,
  parallax = 0.5,
  clickEffect = 'pulse',
  markers = 'none',
  glitch = 0,
  intro = true,
  lightMode = false,
  dpr,
  className = '',
  style
}: TopographyProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const [generation, setGeneration] = useState(0);
  const settings = {
    color,
    lineCount: clamp(lineCount, 2, 80),
    lineWidth: Math.max(0.2, lineWidth),
    majorLines,
    elevation: clamp(elevation, 0, 3),
    foreground: clamp(foreground, 0, 1),
    scale: clamp(scale, 0.2, 5),
    detail: clamp(detail, 0, 1),
    tilt: clamp(tilt, 12, 90),
    speed,
    direction: DIRECTIONS[direction] ?? DIRECTIONS.forward,
    morph: Math.max(0, morph),
    glow: Math.max(0, glow),
    depthOfField: clamp(depthOfField, 0, 1),
    fog: clamp(fog, 0, 1),
    brightness: Math.max(0, brightness),
    opacity: clamp(opacity, 0, 1),
    mouseInteraction,
    hoverEffect: HOVER_EFFECTS.includes(hoverEffect) ? hoverEffect : 'lift',
    mouseRadius: Math.max(0.1, mouseRadius),
    mouseStrength: Math.max(0, mouseStrength),
    trail: clamp(trail, 0, 1),
    parallax: clamp(parallax, 0, 1),
    clickEffect,
    markers: MARKER_STYLES[markers] ?? -1,
    glitch: clamp(glitch, 0, 1),
    intro,
    lightMode,
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ratio = Math.min(settingsRef.current.dpr || window.devicePixelRatio || 1, 2);
    const gl = canvas?.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: ratio < 1.5,
      depth: true,
      stencil: false,
      powerPreference: 'high-performance'
    });
    if (!container || !canvas || !gl) return undefined;

    const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
    const terrain = link(gl, terrainVertex(floatTargets), terrainFragment(floatTargets));
    const fieldProgram = floatTargets ? link(gl, FULLSCREEN, FIELD) : null;
    const sculptProgram = floatTargets ? link(gl, FULLSCREEN, SCULPT) : null;
    const downProgram = link(gl, FULLSCREEN, DOWNSAMPLE);
    const blurProgram = link(gl, FULLSCREEN, BLUR);
    const compositeProgram = link(gl, FULLSCREEN, COMPOSITE);
    const markerProgram = link(gl, MARKER_VERTEX, MARKER_FRAGMENT);
    if (!terrain || !downProgram || !blurProgram || !compositeProgram || !markerProgram) return undefined;

    const onContextLost = (event: Event) => event.preventDefault();
    const onContextRestored = () => setGeneration(value => value + 1);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    const vao = gl.createVertexArray();
    const format = floatTargets ? gl.RGBA16F : gl.RGBA8;

    const createTexture = (width: number, height: number, internal: number, wrap: number) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, internal, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      return texture;
    };

    const createTarget = (): Target => ({
      texture: null,
      framebuffer: gl.createFramebuffer(),
      depth: null,
      width: 0,
      height: 0
    });

    const allocate = (target: Target, width: number, height: number, withDepth: boolean) => {
      if (target.texture && target.width === width && target.height === height) return;
      if (target.texture) gl.deleteTexture(target.texture);
      target.texture = createTexture(width, height, format, gl.CLAMP_TO_EDGE);
      target.width = width;
      target.height = height;
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
      if (withDepth) {
        if (!target.depth) target.depth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, target.depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, target.depth);
      }
    };

    const source = createTarget();
    const levels = Array.from({ length: BLOOM_LEVELS }, () => [createTarget(), createTarget()]);
    const sculpt = sculptProgram
      ? [0, 1].map(() => {
          const texture = createTexture(SCULPT_SIZE, SCULPT_SIZE, gl.RG16F, gl.REPEAT);
          const framebuffer = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          return { texture, framebuffer };
        })
      : null;
    const blank = createTexture(1, 1, gl.RGBA8, gl.REPEAT);
    const field: {
      texture: WebGLTexture | null;
      heights: WebGLTexture | null;
      framebuffer: WebGLFramebuffer | null;
      width: number;
      height: number;
    } = { texture: null, heights: null, framebuffer: gl.createFramebuffer(), width: 0, height: 0 };
    let sculptIndex = 0;

    const reserveField = (width: number, height: number) => {
      if (field.texture && width <= field.width && height <= field.height) return;
      if (field.texture) gl.deleteTexture(field.texture);
      if (field.heights) gl.deleteTexture(field.heights);
      field.width = Math.max(width, Math.ceil(field.width * 1.25), 64);
      field.height = Math.max(height, Math.ceil(field.height * 1.25), 64);
      field.texture = createTexture(field.width, field.height, gl.RGBA16F, gl.CLAMP_TO_EDGE);
      field.heights = createTexture(field.width, field.height, gl.R32F, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, field.heights);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, field.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, field.texture, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, field.heights, 0);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    };

    const bind = (unit: number, texture: WebGLTexture | null) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const matrix = new Float32Array(16);
    const pulseData = new Float32Array(MAX_PULSES * 4);
    const glitchData = new Float32Array(12);
    const glitch = { until: 0, next: 1.5, roll: 0, seed: 0 };
    let entropy = 7919;
    const random = () => {
      entropy = (entropy * 16807) % 2147483647;
      return (entropy - 1) / 2147483646;
    };
    const pulses: Pulse[] = [];
    const pointer = { x: 0, y: 0, inside: false };
    const view = { width: 1, height: 1, ratio: 1, cell: 0.05, cellKey: '' };
    const state: TopographyState = {
      intro: settingsRef.current.intro && !reduce ? 0 : 1,
      rise: 1,
      travelX: 0,
      travelZ: 0,
      morph: 0,
      yaw: 0,
      pitch: 0,
      yawVelocity: 0,
      pitchVelocity: 0,
      presence: 0,
      focus: ORBIT,
      hit: null,
      brushFrom: null,
      sculptLife: 0,
      burst: null,
      level: 0,
      trace: 0,
      clock: 0,
      tilt: settingsRef.current.tilt,
      elevation: settingsRef.current.elevation,
      scale: settingsRef.current.scale
    };
    state.rise = smoother(state.intro);
    let raf = 0;
    let last = 0;
    let visible = true;
    let quiet = 0;

    const camera = (): Frame => {
      const pitch = Math.min((state.tilt * Math.PI) / 180 + state.pitch, Math.PI / 2 - 1e-4);
      const frame = orient(state.yaw, pitch);
      const lift = state.elevation * HEIGHT * state.rise * 0.18;
      const clearance = state.elevation * HEIGHT * state.rise * 1.3 + 0.9;
      const distance = Math.max(ORBIT, (clearance - lift) / Math.sin(pitch));
      return {
        ...frame,
        distance,
        eye: [-frame.f[0] * distance, lift - frame.f[1] * distance, -frame.f[2] * distance]
      };
    };

    const rayDirection = (cam: Frame, nx: number, ny: number) => {
      const aspect = view.width / view.height;
      const t = lens(aspect);
      const d = [0, 1, 2].map(i => cam.f[i] + cam.r[i] * nx * t * aspect + cam.u[i] * ny * t);
      const length = Math.hypot(d[0], d[1], d[2]);
      return d.map(v => v / length);
    };

    const along = (cam: Frame, d: number[]) => d[0] * cam.f[0] + d[1] * cam.f[1] + d[2] * cam.f[2];

    const groundDepth = (cam: Frame, ny: number) => {
      const d = rayDirection(cam, 0, ny);
      if (d[1] > -1e-3) return Infinity;
      return (cam.eye[1] / -d[1]) * along(cam, d);
    };

    const nearRange = (cam: Frame, s: typeof settings) => [groundDepth(cam, -1) * 0.9, cam.distance, s.foreground];

    const settleAt = (cam: Frame, near: number[], x: number, z: number) => {
      const depth = (x - cam.eye[0]) * cam.f[0] - cam.eye[1] * cam.f[1] + (z - cam.eye[2]) * cam.f[2];
      return near[2] + (1 - near[2]) * smoother((depth - near[0]) / Math.max(near[1] - near[0], 1e-3));
    };

    const pick = (cam: Frame, s: typeof settings, nx: number, ny: number): Hit | null => {
      const d = rayDirection(cam, nx, ny);
      const height = state.elevation * HEIGHT * state.rise;
      const frequency = FREQUENCY / state.scale;
      const near = nearRange(cam, s);
      const above = (distance: number) => {
        const x = cam.eye[0] + d[0] * distance;
        const z = cam.eye[2] + d[2] * distance;
        const ground = relief(state.travelX + x, state.travelZ + z, frequency, state.morph * 0.37, state.morph * 0.23);
        return cam.eye[1] + d[1] * distance - ground * height * settleAt(cam, near, x, z);
      };
      let distance = NEAR;
      let gap = above(distance);
      for (let i = 0; i < 200 && distance < FAR * 0.5; i++) {
        const next = distance + Math.max(0.02, gap * 0.4);
        const value = above(next);
        if (value < 0) {
          let lo = distance;
          let hi = next;
          for (let k = 0; k < 10; k++) {
            const mid = (lo + hi) * 0.5;
            if (above(mid) < 0) hi = mid;
            else lo = mid;
          }
          return {
            x: state.travelX + cam.eye[0] + d[0] * hi,
            y: cam.eye[1] + d[1] * hi,
            z: state.travelZ + cam.eye[2] + d[2] * hi,
            depth: hi * along(cam, d)
          };
        }
        distance = next;
        gap = value;
      }
      return null;
    };

    const footprint = (cam: Frame, s: typeof settings, fadeEnd: number) => {
      const ceiling = state.elevation * HEIGHT * state.rise * 1.7 + 0.2 + s.mouseStrength;
      const box: Box = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity, near: Infinity };
      const add = (d: number[], distance: number) => {
        const x = cam.eye[0] + d[0] * distance;
        const z = cam.eye[2] + d[2] * distance;
        box.minX = Math.min(box.minX, x);
        box.maxX = Math.max(box.maxX, x);
        box.minZ = Math.min(box.minZ, z);
        box.maxZ = Math.max(box.maxZ, z);
      };
      for (const nx of [-1.08, 0, 1.08]) {
        for (const ny of [-1.08, 1.08]) {
          const d = rayDirection(cam, nx, ny);
          const forward = Math.max(along(cam, d), 1e-3);
          let near = NEAR;
          let far = (fadeEnd * 1.05) / forward;
          if (d[1] < -1e-4) {
            near = Math.max(NEAR, (cam.eye[1] - ceiling) / -d[1]);
            far = Math.min(far, cam.eye[1] / -d[1]);
          }
          near = Math.min(near, far);
          add(d, near);
          add(d, far);
          box.near = Math.min(box.near, near * forward);
        }
      }
      return box;
    };

    const grid = (box: Box, cell: number) => {
      const camX = Math.floor(state.travelX / cell);
      const camZ = Math.floor(state.travelZ / cell);
      const fracX = state.travelX - camX * cell;
      const fracZ = state.travelZ - camZ * cell;
      const k0 = Math.floor((box.minX + fracX) / cell) - 2;
      const m0 = Math.floor((box.minZ + fracZ) / cell) - 2;
      const columns = clamp(Math.ceil((box.maxX + fracX) / cell) + 2 - k0, 1, 4000);
      const rows = clamp(Math.ceil((box.maxZ + fracZ) / cell) + 2 - m0, 1, Math.floor((MAX_CELLS * 1.5) / columns));
      return { cell, camX, camZ, fracX, fracZ, k0, m0, columns, rows };
    };

    const render = () => {
      const s = settingsRef.current;
      const cam = camera();
      viewProjection(cam, view.width / view.height, matrix);

      const bottom = groundDepth(cam, -1);
      const top = Math.min(groundDepth(cam, 1), cam.distance * 3.2);
      const horizon = Math.max(top, bottom * 1.6, cam.distance * 1.4);
      const fadeEnd = horizon + (bottom * 1.8 - horizon) * s.fog;
      const fadeStart = fadeEnd * 0.7 + (bottom * 0.7 - fadeEnd * 0.7) * s.fog;
      const box = footprint(cam, s, fadeEnd);

      const cellKey = `${view.width}x${view.height}@${view.ratio}|${Math.round(state.tilt / 4)}|${Math.round(state.elevation * 5)}|${s.fog}`;
      if (cellKey !== view.cellKey) {
        view.cellKey = cellKey;
        const focal = (view.height * view.ratio * 0.5) / lens(view.width / view.height);
        let cell = clamp((14 * Math.max(box.near, 0.5)) / focal, 0.02, 0.4);
        const cells = ((box.maxX - box.minX) * (box.maxZ - box.minZ)) / (cell * cell);
        if (cells > MAX_CELLS) cell *= Math.sqrt(cells / MAX_CELLS);
        view.cell = cell;
      }

      const color = toRgb(s.color);
      const height = state.elevation * HEIGHT * state.rise;
      const layout = grid(box, view.cell);
      const near = nearRange(cam, s);
      const dots = s.markers >= 0 ? grid(box, MARKER_SPACING) : null;
      const touch = state.hit && s.mouseInteraction ? state.presence : 0;
      const heatStrength = touch * (0.35 + 0.5 * s.mouseStrength);
      const focusScale = s.depthOfField * view.height * 0.016;
      const reveal = smoother(state.intro / 0.35);
      const hitX = state.hit ? state.hit.x : 0;
      const hitZ = state.hit ? state.hit.z : 0;

      pulseData.fill(0);
      pulses.forEach((p, i) => {
        pulseData.set([p.x, p.z, p.age * 4.2, Math.exp(-p.age * 1.1) * smoother(p.age / 0.08)], i * 4);
      });

      gl.bindVertexArray(vao);
      if (fieldProgram) {
        const width = layout.columns + 7;
        const height2 = layout.rows + 7;
        reserveField(width, height2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, field.framebuffer);
        gl.viewport(0, 0, width, height2);
        gl.useProgram(fieldProgram.program);
        const f = fieldProgram.uniforms;
        bind(0, sculpt ? sculpt[sculptIndex].texture : blank);
        gl.uniform1i(f.uSculpt, 0);
        gl.uniform1f(f.uSculptOn, sculpt ? 1 : 0);
        gl.uniform1f(f.uFrequency, FREQUENCY / state.scale);
        gl.uniform2f(f.uMorph, state.morph * 0.37, state.morph * 0.23);
        gl.uniform4fv(f.uPulses, pulseData);
        gl.uniform2i(f.uBase, layout.k0 - 2 + layout.camX, layout.m0 - 2 + layout.camZ);
        gl.uniform1f(f.uCell, layout.cell);
        gl.uniform1f(f.uDetail, s.detail);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      const drawTerrain = (pixel: number, width: number, targetHeight: number, stride: number) => {
        gl.viewport(0, 0, width, targetHeight);
        gl.useProgram(terrain.program);
        const u = terrain.uniforms;
        bind(0, fieldProgram ? field.texture : blank);
        gl.uniform1i(u.uField, 0);
        bind(1, fieldProgram ? field.heights : blank);
        gl.uniform1i(u.uHeightField, 1);
        gl.uniform1f(u.uFrequency, FREQUENCY / state.scale);
        gl.uniform2f(u.uMorph, state.morph * 0.37, state.morph * 0.23);
        gl.uniform4fv(u.uPulses, pulseData);
        gl.uniform2i(u.uOrigin, layout.k0, layout.m0);
        gl.uniform2i(u.uCamCell, layout.camX, layout.camZ);
        gl.uniform2f(u.uCamFrac, layout.fracX, layout.fracZ);
        gl.uniform1f(u.uCell, layout.cell);
        gl.uniform1i(u.uStride, stride);
        gl.uniform1f(u.uHeight, height);
        gl.uniform3fv(u.uEye, cam.eye);
        gl.uniform3fv(u.uForward, cam.f);
        gl.uniform3fv(u.uNear, near);
        gl.uniform1f(u.uRefDepth, cam.distance);
        gl.uniformMatrix4fv(u.uViewProj, false, matrix);
        gl.uniform1f(u.uDetail, s.detail);
        gl.uniform1f(u.uLines, s.lineCount);
        gl.uniform1f(u.uLineWidth, s.lineWidth * pixel);
        gl.uniform1f(u.uMajor, s.majorLines ? 1 : 0);
        gl.uniform3fv(u.uColor, color);
        gl.uniform1f(u.uBrightness, s.brightness);
        gl.uniform2f(u.uFade, fadeStart, fadeEnd);
        gl.uniform3f(u.uFocus, state.focus, focusScale * pixel, view.height * 0.03 * pixel);
        gl.uniform4f(u.uHeat, hitX, hitZ, 0.9 * s.mouseRadius, heatStrength);
        gl.uniform4f(u.uLamp, hitX, state.hit ? state.hit.y + 1.4 : 0, hitZ, heatStrength);
        gl.uniform4f(u.uTrace, state.level, state.trace, hitX, hitZ);
        gl.uniform3fv(u.uSun, SUN);
        gl.uniform1f(u.uReveal, reveal);
        gl.uniform1f(u.uLightMode, s.lightMode ? 1 : 0);
        gl.uniform1f(u.uOpacity, s.opacity);
        gl.uniform4fv(u.uGlitch, glitchData);
        gl.uniform1f(u.uGlitchSeed, glitch.seed);
        gl.uniform1f(u.uPixel, pixel);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.disable(gl.BLEND);
        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArraysInstanced(
          gl.TRIANGLE_STRIP,
          0,
          2 * (Math.ceil(layout.columns / stride) + 1),
          Math.ceil(layout.rows / stride)
        );
        if (dots) {
          gl.useProgram(markerProgram.program);
          const m = markerProgram.uniforms;
          bind(2, sculpt ? sculpt[sculptIndex].texture : blank);
          gl.uniform1i(m.uSculpt, 2);
          gl.uniform1f(m.uSculptOn, sculpt ? 1 : 0);
          gl.uniform1f(m.uFrequency, FREQUENCY / state.scale);
          gl.uniform2f(m.uMorph, state.morph * 0.37, state.morph * 0.23);
          gl.uniform4fv(m.uPulses, pulseData);
          gl.uniform3fv(m.uEye, cam.eye);
          gl.uniform3fv(m.uForward, cam.f);
          gl.uniform3fv(m.uNear, near);
          gl.uniform2i(m.uOrigin, dots.k0, dots.m0);
          gl.uniform2i(m.uCamCell, dots.camX, dots.camZ);
          gl.uniform2f(m.uCamFrac, dots.fracX, dots.fracZ);
          gl.uniform1f(m.uSpacing, dots.cell);
          gl.uniform1i(m.uColumns, dots.columns + 1);
          gl.uniform1f(m.uHeight, height);
          gl.uniformMatrix4fv(m.uViewProj, false, matrix);
          gl.uniform2f(m.uView, width, targetHeight);
          gl.uniform1f(m.uSize, 4 * pixel);
          gl.uniform1f(m.uRefDepth, cam.distance);
          gl.uniform4f(m.uHeat, hitX, hitZ, 1.2 * s.mouseRadius, heatStrength);
          gl.uniform1f(m.uTime, state.clock);
          gl.uniform4fv(m.uGlitch, glitchData);
          gl.uniform1f(m.uPixel, pixel);
          gl.uniform3fv(m.uColor, color);
          gl.uniform2f(m.uFade, fadeStart, fadeEnd);
          gl.uniform1f(m.uReveal, reveal);
          gl.uniform1f(m.uBrightness, s.brightness);
          gl.uniform1f(m.uLightMode, s.lightMode ? 1 : 0);
          gl.uniform1f(m.uOpacity, s.opacity);
          gl.uniform1f(m.uStyle, s.markers);
          gl.depthFunc(gl.LEQUAL);
          gl.depthMask(false);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, (dots.columns + 1) * (dots.rows + 1));
          gl.disable(gl.BLEND);
          gl.depthMask(true);
        }
        gl.disable(gl.DEPTH_TEST);
      };

      const bloom = s.glow > 0.001;
      if (bloom) {
        const width = Math.max(1, Math.round(view.width / 2));
        const targetHeight = Math.max(1, Math.round(view.height / 2));
        allocate(source, width, targetHeight, true);
        levels.forEach((pair, index) => {
          const w = Math.max(1, Math.round(view.width / 2 ** (index + 2)));
          const h = Math.max(1, Math.round(view.height / 2 ** (index + 2)));
          allocate(pair[0], w, h, false);
          allocate(pair[1], w, h, false);
        });
        gl.bindFramebuffer(gl.FRAMEBUFFER, source.framebuffer);
        drawTerrain(0.5, width, targetHeight, 2);
        let from = source;
        levels.forEach(([front, back]) => {
          gl.bindFramebuffer(gl.FRAMEBUFFER, front.framebuffer);
          gl.viewport(0, 0, front.width, front.height);
          gl.useProgram(downProgram.program);
          bind(0, from.texture);
          gl.uniform1i(downProgram.uniforms.uSource, 0);
          gl.uniform2f(downProgram.uniforms.uTarget, front.width, front.height);
          gl.uniform2f(downProgram.uniforms.uTexel, 1 / from.width, 1 / from.height);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.useProgram(blurProgram.program);
          gl.uniform1i(blurProgram.uniforms.uSource, 0);
          gl.uniform2f(blurProgram.uniforms.uTarget, back.width, back.height);
          gl.bindFramebuffer(gl.FRAMEBUFFER, back.framebuffer);
          bind(0, front.texture);
          gl.uniform2f(blurProgram.uniforms.uStep, 1 / front.width, 0);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.bindFramebuffer(gl.FRAMEBUFFER, front.framebuffer);
          bind(0, back.texture);
          gl.uniform2f(blurProgram.uniforms.uStep, 0, 1 / back.height);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          from = front;
        });
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      drawTerrain(view.ratio, canvas.width, canvas.height, 1);

      if (bloom) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(compositeProgram.program);
        const c = compositeProgram.uniforms;
        levels.forEach(([front], index) => {
          bind(index, front.texture);
          gl.uniform1i(c[`uBloom${index}`], index);
        });
        gl.uniform2f(c.uView, canvas.width, canvas.height);
        gl.uniform1f(c.uGlow, s.glow * reveal);
        gl.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
        gl.enable(gl.BLEND);
        if (s.lightMode) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        else gl.blendFunc(gl.ONE, gl.ONE);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disable(gl.BLEND);
      }
      for (let unit = BLOOM_LEVELS; unit >= 0; unit--) bind(unit, null);
    };

    const updateSculpt = (s: typeof settings, dt: number) => {
      if (!sculpt || !sculptProgram) return false;
      const brush = s.mouseInteraction && s.hoverEffect === 'lift' && state.presence > 0.001 ? state.hit : null;
      const burst = state.burst;
      if (!brush && !burst && state.sculptLife <= 0) return false;
      const from = state.brushFrom || brush;
      const read = sculpt[sculptIndex];
      const write = sculpt[1 - sculptIndex];
      gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
      gl.viewport(0, 0, SCULPT_SIZE, SCULPT_SIZE);
      gl.useProgram(sculptProgram.program);
      const u = sculptProgram.uniforms;
      bind(0, read.texture);
      gl.uniform1i(u.uPrevious, 0);
      if (brush && from) gl.uniform4f(u.uSegment, from.x, from.z, brush.x, brush.z);
      else gl.uniform4f(u.uSegment, 0, 0, 0, 0);
      gl.uniform4f(
        u.uBrush,
        1.1 * s.mouseRadius,
        0.9 * s.mouseStrength,
        1 - Math.exp(-dt * 7),
        brush ? state.presence : 0
      );
      if (burst) {
        const before = smoother(burst.age / 0.7);
        burst.age += dt;
        const amount = (smoother(burst.age / 0.7) - before) * 0.9 * Math.max(s.mouseStrength, 0.3);
        gl.uniform4f(u.uBurst, burst.x, burst.z, 1.6 * s.mouseRadius, amount);
        if (burst.age >= 0.7) state.burst = null;
      } else {
        gl.uniform4f(u.uBurst, 0, 0, 1, 0);
      }
      const tau = 0.25 + 3 * s.trail * s.trail;
      gl.uniform2f(u.uDecay, Math.exp(-dt / tau), Math.exp(-dt / 0.7));
      gl.disable(gl.BLEND);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      sculptIndex = 1 - sculptIndex;
      state.brushFrom = brush ? { x: brush.x, z: brush.z } : null;
      if (brush || burst) state.sculptLife = tau * 6;
      else state.sculptLife -= dt;
      return true;
    };

    let sizedDpr = settingsRef.current.dpr;

    const resize = () => {
      const s = settingsRef.current;
      sizedDpr = s.dpr;
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      render();
      wake();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      if (s.dpr !== sizedDpr) resize();
      const dt = last ? clamp((now - last) / 1000, 0, 1 / 20) : 1 / 60;
      last = now;

      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
      state.rise = smoother(state.intro);
      const ease = reduce ? 1 : 1 - Math.exp(-dt / 0.4);
      state.tilt += (s.tilt - state.tilt) * ease;
      state.elevation += (s.elevation - state.elevation) * ease;
      state.scale = s.scale;

      state.clock += dt;
      const glitching = reduce ? 0 : s.glitch;
      if (glitching > 0) {
        if (state.clock >= glitch.next && state.clock >= glitch.until) {
          glitch.until = state.clock + 0.1 + random() * 0.22 * (0.5 + glitching);
          glitch.next = glitch.until + (9 - 7.4 * glitching) * (0.45 + random() * 1.1);
          glitch.roll = 0;
        }
        if (state.clock < glitch.until) {
          if (state.clock >= glitch.roll) {
            glitchData.fill(0);
            const count = 1 + Math.floor(random() * 3);
            for (let i = 0; i < count; i++) {
              const band = 3 + random() * random() * view.height * 0.14;
              const y = random() * view.height;
              const shift = (random() - 0.5) * 2 * (10 + 46 * glitching);
              glitchData.set([y, y + band, shift, 1 + random() * 3 * glitching], i * 4);
            }
            glitch.seed = random();
            glitch.roll = state.clock + 0.04 + random() * 0.05;
          }
        } else glitchData.fill(0);
      } else glitchData.fill(0);

      if (!reduce) {
        state.travelX += s.direction[0] * s.speed * 0.8 * dt;
        state.travelZ += s.direction[1] * s.speed * 0.8 * dt;
        state.morph += s.morph * 0.12 * dt;
      }

      const engaged = pointer.inside && s.mouseInteraction;
      state.presence += ((engaged ? 1 : 0) - state.presence) * (1 - Math.exp(-dt / (engaged ? 0.18 : 0.45)));

      const nx = (pointer.x / view.width) * 2 - 1;
      const ny = 1 - (pointer.y / view.height) * 2;
      const lean = reduce || !engaged ? 0 : s.parallax;
      const targetYaw = nx * lean * 0.09;
      const targetPitch = -ny * lean * 0.045;
      state.yawVelocity += (38 * (targetYaw - state.yaw) - 11 * state.yawVelocity) * dt;
      state.pitchVelocity += (38 * (targetPitch - state.pitch) - 11 * state.pitchVelocity) * dt;
      state.yaw += state.yawVelocity * dt;
      state.pitch += state.pitchVelocity * dt;

      const cam = camera();
      if (engaged) {
        state.hit = pick(cam, s, nx, ny);
        if (state.hit && state.brushFrom) {
          const jump = Math.hypot(state.hit.x - state.brushFrom.x, state.hit.z - state.brushFrom.z);
          if (jump > 3 * s.mouseRadius) state.brushFrom = null;
        }
      } else if (state.presence < 0.002) {
        state.hit = null;
        state.brushFrom = null;
      }

      const tracing = state.hit && s.mouseInteraction && s.hoverEffect === 'trace' ? state.presence : 0;
      if (state.hit) {
        const frequency = FREQUENCY / state.scale;
        const target =
          relief(state.hit.x, state.hit.z, frequency, state.morph * 0.37, state.morph * 0.23) +
          s.detail * 0.1 * fineDetail(state.hit.x, state.hit.z, frequency);
        state.level = state.trace < 0.01 ? target : state.level + (target - state.level) * (1 - Math.exp(-dt / 0.09));
      }
      state.trace += (tracing - state.trace) * (1 - Math.exp(-dt / 0.2));

      const focusTarget = state.hit && s.depthOfField > 0 ? state.hit.depth : cam.distance;
      state.focus += (focusTarget - state.focus) * (1 - Math.exp(-dt / 0.35));

      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].age += dt;
        if (pulses[i].age > 4) pulses.splice(i, 1);
      }

      const sculpting = updateSculpt(s, dt);
      render();

      const settling =
        Math.abs(s.tilt - state.tilt) > 0.01 ||
        Math.abs(s.elevation - state.elevation) > 1e-4 ||
        Math.abs(state.yaw - targetYaw) > 1e-4 ||
        Math.abs(state.pitch - targetPitch) > 1e-4 ||
        Math.abs(state.yawVelocity) > 1e-4 ||
        Math.abs(state.pitchVelocity) > 1e-4 ||
        Math.abs(focusTarget - state.focus) > 1e-3 ||
        Math.abs(tracing - state.trace) > 1e-3;
      const busy =
        (!reduce && (s.speed !== 0 || s.morph !== 0 || s.glitch > 0 || s.markers >= 0)) ||
        state.intro < 1 ||
        pulses.length > 0 ||
        sculpting ||
        settling ||
        (state.presence > 0.001 && state.presence < 0.999);
      quiet = busy ? 0 : quiet + dt;
      if (quiet < 0.5) raf = requestAnimationFrame(frame);
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
      }
      if (inside || was) wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      const { x, y, inside } = locate(event);
      if (!inside) return;
      pointer.x = x;
      pointer.y = y;
      pointer.inside = true;
      wake();
      if (s.glitch > 0 && !reduce) {
        glitch.until = state.clock + 0.16;
        glitch.roll = 0;
      }
      if (!s.mouseInteraction || (s.clickEffect !== 'pulse' && s.clickEffect !== 'peak')) return;
      const hit = pick(camera(), s, (x / view.width) * 2 - 1, 1 - (y / view.height) * 2);
      if (!hit) return;
      if (s.clickEffect === 'peak' && sculpt) {
        state.burst = { x: hit.x, z: hit.z, age: 0 };
      } else if (s.clickEffect === 'pulse') {
        if (pulses.length >= MAX_PULSES) pulses.shift();
        pulses.push({ x: hit.x, z: hit.z, age: 0 });
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      pointer.inside = false;
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
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
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
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      [source, ...levels.flat()].forEach(target => {
        if (target.texture) gl.deleteTexture(target.texture);
        if (target.depth) gl.deleteRenderbuffer(target.depth);
        gl.deleteFramebuffer(target.framebuffer);
      });
      sculpt?.forEach(target => {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      });
      gl.deleteTexture(blank);
      gl.deleteVertexArray(vao);
      if (field.texture) gl.deleteTexture(field.texture);
      if (field.heights) gl.deleteTexture(field.heights);
      gl.deleteFramebuffer(field.framebuffer);
      [terrain, fieldProgram, sculptProgram, downProgram, blurProgram, compositeProgram, markerProgram].forEach(
        program => program && gl.deleteProgram(program.program)
      );
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [generation]);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={containerRef}
      className={['relative w-full h-full overflow-hidden', className].filter(Boolean).join(' ')}
      style={style}
    >
      <canvas ref={canvasRef} className="block w-full h-full" aria-hidden="true" />
    </div>
  );
};

export default Topography;
