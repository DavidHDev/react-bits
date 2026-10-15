'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';

import './GhostFibers.css';

export type GhostFibersFiberStyle = 'dots' | 'dashes' | 'lines';

export type GhostFibersGradient = 'depth' | 'along' | 'across';

export type GhostFibersHoverEffect = 'focus' | 'part' | 'none';

export interface GhostFibersProps extends HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
  lineColor?: string;
  secondaryColor?: string;
  gradient?: GhostFibersGradient;
  speed?: number;
  scale?: number;
  rotation?: number;
  rollSpeed?: number;
  layers?: number;
  waves?: number;
  twist?: number;
  threads?: number;
  volume?: number;
  spread?: number;
  density?: number;
  thickness?: number;
  flow?: number;
  fiberStyle?: GhostFibersFiberStyle;
  tips?: number;
  foldGlow?: number;
  perspective?: number;
  depthOfField?: number;
  focusDepth?: number;
  particles?: number;
  sparkle?: number;
  glow?: number;
  brightness?: number;
  vignette?: number;
  grain?: number;
  mouseInteraction?: boolean;
  hoverEffect?: GhostFibersHoverEffect;
  mouseStrength?: number;
  pulseOnClick?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
}

type Settings = {
  glowColor: string;
  lineColor: string;
  secondaryColor: string;
  gradient: number;
  speed: number;
  scale: number;
  rotation: number;
  rollSpeed: number;
  layers: number;
  waves: number;
  twist: number;
  threads: number;
  volume: number;
  spread: number;
  density: number;
  thickness: number;
  flow: number;
  dotLength: number;
  tips: number;
  foldGlow: number;
  perspective: number;
  depthOfField: number;
  focusDepth: number;
  particles: number;
  sparkle: number;
  glow: number;
  brightness: number;
  vignette: number;
  grain: number;
  mouseInteraction: boolean;
  hover: number;
  mouseStrength: number;
  pulseOnClick: boolean;
  intro: boolean;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

type Target = { texture: WebGLTexture | null; framebuffer: WebGLFramebuffer | null; width: number; height: number };

type Camera = { eye: number[]; viewProj: number[]; orient: number[] };

type Nearest = { gap: number; s: number; ribbon: number; depth: number };

const MAX_RENDER_DIM = 2400;
const BLOOM_LEVELS = 5;
const INTRO_SECONDS = 2.6;
const CAMERA = 7.5;
const FOV = 0.56;
const RIBBON_LENGTH = 24;
const HOVER_EFFECTS: Record<GhostFibersHoverEffect, number> = { focus: 0, part: 1, none: 2 };
const FIBER_STYLES: Record<GhostFibersFiberStyle, number> = { dots: 0, dashes: 0.45, lines: 1 };
const GRADIENTS: Record<GhostFibersGradient, number> = { depth: 0, along: 1, across: 2 };
const RIBBON_TINT = [0, 0.75, 0.35];
const PLACEMENTS = [
  [0, 0, 0, 0],
  [1.9, -4.6, -0.08, 2.4],
  [-1.05, 2.0, 0.12, 4.1]
];
const RIBBON_GAIN = [1, 0.5, 0.55];
const DEG = Math.PI / 180;
const FOCAL = 1 / (2 * Math.tan(FOV / 2));

const HEADER = `#version 300 es
precision highp float;
`;

const SHAPE = `
uniform float uTime;
uniform float uTwist;
uniform float uRoll;
uniform float uWaves;
uniform float uWidth;
uniform float uRibbon;
uniform mat3 uOrient;
uniform float uScale;
uniform vec4 uPlace;
uniform float uVolume;

float hash11(float n) {
  return fract(sin(n * 91.3458) * 47453.5453);
}

vec3 centerLocal(float s) {
  float t = uTime;
  float ph = uPlace.w;
  float x = s * ${RIBBON_LENGTH.toFixed(1)};
  float y = uWaves * (0.52 * sin(x * 0.43 + t * 0.31 + ph) + 0.26 * sin(x * 0.79 - t * 0.23 + 1.3 + ph * 0.7)) + uPlace.x + x * uPlace.z;
  float z = uWaves * 0.65 * sin(x * 0.33 + t * 0.19 + 0.7 + ph * 1.3) + uPlace.y;
  return vec3(x, y, z);
}

float twistAt(float s, float layer) {
  float x = s * ${RIBBON_LENGTH.toFixed(1)};
  return uTwist * 0.483 * x + uRoll + uPlace.w * 0.6 + layer * uVolume * 0.42 + 0.5 * sin(x * 0.26 + uTime * 0.27 + uPlace.w);
}

vec3 ribbonPoint(float s, float v, float n, float layer, out vec3 normal) {
  vec3 c0 = centerLocal(s);
  vec3 c1 = centerLocal(s + 0.004);
  vec3 tangent = normalize(c1 - c0);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 n0 = normalize(up - tangent * dot(up, tangent));
  vec3 b0 = cross(tangent, n0);
  float th = twistAt(s, layer);
  vec3 across = cos(th) * n0 + sin(th) * b0;
  vec3 sheet = -sin(th) * n0 + cos(th) * b0;
  float halfWidth = uWidth * (0.78 + 0.22 * cos(s * 3.14159));
  vec3 local = c0 + across * v * halfWidth + sheet * (n + layer * uVolume * 0.16) * halfWidth;
  normal = uOrient * sheet;
  return uOrient * (local * uScale);
}
`;

const DOT_VERTEX = `${HEADER}
${SHAPE}
uniform mat4 uViewProj;
uniform vec3 uEye;
uniform vec2 uViewport;
uniform float uDpr;
uniform float uFibers;
uniform float uDots;
uniform float uFlow;
uniform float uSize;
uniform float uFocus;
uniform float uDof;
uniform float uMaxCoc;
uniform float uFocal;
uniform float uIntro;
uniform vec4 uPulse;
uniform vec4 uHover;
uniform float uPart;
uniform float uDotLength;
uniform float uSparkle;
uniform float uDepthSpread;
uniform float uGain;
uniform float uTips;
uniform float uTint;
uniform float uGradient;
uniform float uFold;

out vec2 vLocal;
out float vRadius;
out float vSegment;
out vec3 vLight;
out float vTint;

vec3 project(vec3 world, out float depth) {
  vec4 clip = uViewProj * vec4(world, 1.0);
  depth = clip.w;
  vec2 ndc = clip.xy / clip.w;
  return vec3((ndc * 0.5 + 0.5) * uViewport, clip.w);
}

vec2 part(vec2 px) {
  if (uPart <= 0.0 || uHover.w <= 0.0) return px;
  vec2 away = px - uHover.xy;
  float dist = length(away);
  float radius = uHover.z;
  float push = uPart * uHover.w * radius * 0.55 * exp(-dist * dist / (radius * radius));
  return px + away / max(dist, 1e-3) * push * smoothstep(0.0, radius * 0.25, dist);
}

void main() {
  int perFiber = int(uDots);
  int fiber = gl_InstanceID / perFiber;
  int bead = gl_InstanceID - fiber * perFiber;
  float fi = float(fiber);
  float fk = float(bead);

  float seed = hash11(fi * 1.731 + uRibbon * 17.0);
  float s = fract((fk + uFlow + seed * uDots) / uDots) - 0.5;
  float sNext = s + 1.0 / uDots;
  float layer = mod(fi, 3.0) - 1.0;
  float slot = floor(fi / 3.0);
  float perLayer = max(floor(uFibers / 3.0), 1.0);
  float v = ((slot + 0.5) / perLayer) * 2.0 - 1.0 + (hash11(fi * 3.113 + 4.0) - 0.5) * (1.6 / perLayer) + layer * 0.12 / perLayer;
  float depthOffset = (hash11(fi * 7.919 + 2.0) - 0.5) * uDepthSpread * (0.35 + 6.0 * s * s);

  vec3 normal;
  vec3 world = ribbonPoint(s, v, depthOffset, layer, normal);
  vec3 nextNormal;
  vec3 nextWorld = ribbonPoint(sNext, v, depthOffset, layer, nextNormal);

  float depth;
  vec3 p0 = project(world, depth);
  float nextDepth;
  vec3 p1 = project(nextWorld, nextDepth);
  vec2 px = part(p0.xy);
  vec2 pxNext = part(p1.xy);

  float baseRadius = max(0.5 * uSize * uDpr * uFocal / max(depth, 0.1), 0.45);
  float coc = min(uDof * abs(1.0 - uFocus / max(depth, 0.1)) * uViewport.y * 0.035, uMaxCoc * uDpr);
  float radius = baseRadius + coc;
  float spill = max(10.0 * uDpr, baseRadius);
  float energy = pow(baseRadius / min(radius, spill), 1.25) * pow(min(1.0, spill / radius), 2.0);

  vec3 toEye = normalize(uEye - world);
  float facing = abs(dot(normalize(normal), toEye));
  float focalPx = uViewport.y * ${FOCAL.toFixed(5)} / max(depth, 0.1);
  float widthPx = 2.0 * uWidth * uScale * focalPx;
  float stack = (widthPx * facing + 2.0 * baseRadius) / (widthPx + 2.0 * baseRadius);
  float spacingFace = length(nextWorld - world) * focalPx;
  float trail = (length(p1.xy - p0.xy) + 2.0 * baseRadius) / (spacingFace + 2.0 * baseRadius);
  float crowd = sqrt(clamp(stack * trail, 0.002, 1.0));
  float fold = pow(1.0 - facing, 6.0) * uFold;
  float endFade = smoothstep(0.5, 0.4, abs(s)) * smoothstep(1.6, 4.2, depth);
  float tipEnd = mix(0.6, 0.06 + 0.26 * hash11(fi * 9.137 + uPlace.w * 3.0), uTips);
  float tip = exp(-pow((s - tipEnd) / 0.0065, 2.0)) * uTips;
  endFade *= smoothstep(tipEnd + 0.003, tipEnd - 0.001, s);
  float appear = smoothstep(0.0, 0.12, uIntro * 1.3 - (s + 0.5) - seed * 0.12);
  float twinklePhase = hash11(fi * 13.7 + fk * 0.917 + uRibbon * 3.0);
  float twinkle = pow(max(sin(uTime * (1.2 + 2.6 * twinklePhase) * 3.0 + twinklePhase * 61.0), 0.0), 36.0) * uSparkle * (1.0 - 0.85 * uDotLength);
  float pulseGap = abs(s - uPulse.x) - uPulse.y * 0.42;
  float pulse = uPulse.z * exp(-pulseGap * pulseGap / 0.0018) * (abs(uPulse.w - uRibbon) < 0.5 ? 1.0 : 0.35);
  float strength = mix(0.45, 1.0, hash11(fi * 5.37 + 1.0)) * mix(1.0, 0.72, abs(layer) * uVolume);
  float intensity = energy * crowd * strength * endFade * appear * 0.8 * uGain * (1.0 + fold * 7.0 + twinkle * 5.0 + pulse * 4.0 + tip * 7.0);
  float highlight = clamp(fold * 0.55 + twinkle + pulse + tip, 0.0, 1.0);

  vec2 segment = (pxNext - px) * uDotLength;
  float segmentLength = length(segment);
  intensity *= mix(1.0, (2.0 * radius) / (segmentLength + 2.0 * radius) * 1.6, uDotLength);
  vec2 axis = segmentLength > 1e-3 ? segment / segmentLength : vec2(1.0, 0.0);
  vec2 perp = vec2(-axis.y, axis.x);
  vec2 corner = vec2(gl_VertexID == 1 || gl_VertexID == 3 ? 1.0 : 0.0, gl_VertexID >= 2 ? 1.0 : 0.0);
  float along = mix(-radius, segmentLength + radius, corner.x);
  float across = mix(-radius, radius, corner.y);
  vec2 position = px + axis * along + perp * across;

  vLocal = vec2(along, across);
  vRadius = radius;
  vSegment = segmentLength;
  vLight = vec3(intensity, highlight, coc / max(radius, 1e-3));
  float depthTint = clamp(uTint + smoothstep(uFocus, uFocus + 5.0, depth) * 0.5, 0.0, 1.0);
  vTint = uGradient < 0.5 ? depthTint : uGradient < 1.5 ? smoothstep(-0.42, 0.42, s) : clamp(v * 0.5 + 0.5, 0.0, 1.0);
  if (intensity < 0.0005) position = vec2(-1e4);
  gl_Position = vec4(position / uViewport * 2.0 - 1.0, 0.0, 1.0);
}`;

const DUST_VERTEX = `${HEADER}
uniform mat4 uViewProj;
uniform vec2 uViewport;
uniform float uDpr;
uniform float uTime;
uniform float uSize;
uniform float uFocus;
uniform float uDof;
uniform float uMaxCoc;
uniform float uFocal;
uniform float uIntro;
uniform float uSparkle;
uniform float uScale;
uniform float uGradient;
uniform float uGain;

out vec2 vLocal;
out float vRadius;
out float vSegment;
out vec3 vLight;
out float vTint;

float hash11(float n) {
  return fract(sin(n * 91.3458) * 47453.5453);
}

void main() {
  float id = float(gl_InstanceID);
  vec3 seed = vec3(hash11(id * 1.37 + 0.3), hash11(id * 2.91 + 1.7), hash11(id * 4.17 + 2.9));
  vec3 box = vec3(9.0, 5.4, 6.0);
  vec3 p = (seed - 0.5) * box;
  p.z -= 0.6;
  p += 0.18 * vec3(sin(uTime * 0.21 + seed.x * 40.0), sin(uTime * 0.17 + seed.y * 40.0), sin(uTime * 0.13 + seed.z * 40.0));
  p *= mix(1.0, uScale, 0.5);
  vec4 clip = uViewProj * vec4(p, 1.0);
  float depth = clip.w;
  vec2 px = (clip.xy / clip.w * 0.5 + 0.5) * uViewport;
  float size = uSize * mix(0.5, 1.4, hash11(id * 7.7));
  float baseRadius = max(0.5 * size * uDpr * uFocal / max(depth, 0.1), 0.45);
  float coc = min(uDof * abs(1.0 - uFocus / max(depth, 0.1)) * uViewport.y * 0.035, uMaxCoc * uDpr * 1.6);
  float radius = baseRadius + coc;
  float spill = max(10.0 * uDpr, baseRadius);
  float energy = pow(baseRadius / min(radius, spill), 0.9) * pow(min(1.0, spill / radius), 2.0);
  float twinkle = pow(max(sin(uTime * (0.8 + 1.6 * seed.y) * 2.0 + seed.z * 50.0), 0.0), 8.0);
  float intensity = energy * (0.35 + 0.65 * twinkle) * mix(0.4, 1.0, seed.x) * smoothstep(0.3, 1.0, uIntro) * (depth > 0.2 ? 1.0 : 0.0);
  vec2 corner = vec2(gl_VertexID == 1 || gl_VertexID == 3 ? 1.0 : 0.0, gl_VertexID >= 2 ? 1.0 : 0.0) * 2.0 - 1.0;
  vec2 position = px + corner * radius;
  vLocal = corner * radius;
  vRadius = radius;
  vSegment = 0.0;
  vLight = vec3(intensity * 0.8 * uGain, 0.3 + 0.6 * twinkle * uSparkle, coc / max(radius, 1e-3));
  vTint = uGradient < 0.5 ? 0.45 + 0.55 * seed.y : seed.y;
  gl_Position = vec4(position / uViewport * 2.0 - 1.0, 0.0, 1.0);
}`;

const DOT_FRAGMENT = `${HEADER}
uniform vec3 uGlowColor;
uniform vec3 uLineColor;
uniform vec3 uSecondaryColor;
in vec2 vLocal;
in float vRadius;
in float vSegment;
in vec3 vLight;
in float vTint;
out vec4 outColor;
void main() {
  float along = clamp(vLocal.x, 0.0, vSegment);
  float d = length(vec2(vLocal.x - along, vLocal.y));
  float rho = d / max(vRadius, 1e-3);
  if (rho > 1.0) discard;
  float soft = clamp(2.6 / max(vRadius, 1e-3), 0.14, 1.0);
  float disk = 1.0 - smoothstep(1.0 - soft, 1.0, rho);
  float bokeh = disk * (0.94 + 0.08 * smoothstep(0.55, 0.95, rho));
  float core = exp(-rho * rho * 3.2);
  float shape = mix(core, bokeh, smoothstep(0.25, 0.7, vLight.z));
  vec3 color = mix(mix(uGlowColor, uSecondaryColor, vTint), uLineColor, vLight.y);
  outColor = vec4(color * shape * vLight.x, shape * vLight.x);
}`;

const FULLSCREEN = `${HEADER}
out vec2 vUv;
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const BRIGHT_FRAGMENT = `${HEADER}
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 outColor;
vec3 pick(vec2 uv) {
  vec3 c = texture(uSource, uv).rgb;
  float peak = max(max(c.r, c.g), c.b);
  return c * smoothstep(0.35, 1.2, peak);
}
void main() {
  vec2 o = uTexel;
  vec3 c = pick(vUv + vec2(-o.x, -o.y)) + pick(vUv + vec2(o.x, -o.y)) + pick(vUv + vec2(-o.x, o.y)) + pick(vUv + vec2(o.x, o.y));
  outColor = vec4(c * 0.25, 1.0);
}`;

const DOWN_FRAGMENT = `${HEADER}
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 o = uTexel;
  vec3 c = texture(uSource, vUv).rgb * 4.0;
  c += texture(uSource, vUv + vec2(-o.x, -o.y)).rgb;
  c += texture(uSource, vUv + vec2(o.x, -o.y)).rgb;
  c += texture(uSource, vUv + vec2(-o.x, o.y)).rgb;
  c += texture(uSource, vUv + vec2(o.x, o.y)).rgb;
  outColor = vec4(c / 8.0, 1.0);
}`;

const UP_FRAGMENT = `${HEADER}
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 o = uTexel;
  vec3 c = texture(uSource, vUv + vec2(-o.x * 2.0, 0.0)).rgb;
  c += texture(uSource, vUv + vec2(-o.x, o.y)).rgb * 2.0;
  c += texture(uSource, vUv + vec2(0.0, o.y * 2.0)).rgb;
  c += texture(uSource, vUv + vec2(o.x, o.y)).rgb * 2.0;
  c += texture(uSource, vUv + vec2(o.x * 2.0, 0.0)).rgb;
  c += texture(uSource, vUv + vec2(o.x, -o.y)).rgb * 2.0;
  c += texture(uSource, vUv + vec2(0.0, -o.y * 2.0)).rgb;
  c += texture(uSource, vUv + vec2(-o.x, -o.y)).rgb * 2.0;
  outColor = vec4(c / 12.0, 1.0);
}`;

const COMPOSITE_FRAGMENT = `${HEADER}
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uGlow;
uniform float uBrightness;
uniform float uLightMode;
uniform float uGrain;
uniform float uVignette;
uniform float uFrame;
uniform vec2 uView;
uniform float uDpr;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float smoother(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

void main() {
  vec4 scene = texture(uScene, vUv);
  vec3 bloom = texture(uBloom, vUv).rgb;
  vec3 light = (scene.rgb + bloom * uGlow) * uBrightness;
  float reach = max(uVignette * 0.3, 1e-4);
  float mask = uVignette > 0.0 ? smoother(vUv.x / reach) * smoother((1.0 - vUv.x) / reach) * smoother(vUv.y / reach) * smoother((1.0 - vUv.y) / reach) : 1.0;
  vec2 cell = floor(vUv * uView / max(uDpr, 1.0));
  float grain = hash(cell + uFrame * 17.31) + hash(cell * 1.31 + uFrame * 3.7 + 9.1) - 1.0;
  if (uLightMode > 0.5) {
    float amount = scene.a * uBrightness;
    float ink = (1.0 - exp(-amount * 1.5)) * mask;
    ink = clamp(ink * (1.0 + grain * uGrain * 2.0), 0.0, 1.0);
    vec3 hue = clamp(scene.rgb / max(scene.a, 1e-4), 0.0, 1.0);
    vec3 tone = hue * mix(1.0, 0.72, clamp(amount * 0.35, 0.0, 1.0));
    outColor = vec4(tone * ink, ink);
    return;
  }
  vec3 color = (1.0 - exp(-light * 1.25)) * mask;
  float peak = max(color.r, max(color.g, color.b));
  color = max(color + grain * uGrain * (0.25 + 0.75 * sqrt(peak)), 0.0);
  outColor = vec4(color, max(color.r, max(color.g, color.b)));
}`;

const SHAPE_UNIFORMS = [
  'uTime',
  'uTwist',
  'uRoll',
  'uWaves',
  'uWidth',
  'uRibbon',
  'uOrient',
  'uScale',
  'uPlace',
  'uVolume'
];
const DOT_UNIFORMS = [
  ...SHAPE_UNIFORMS,
  'uViewProj',
  'uEye',
  'uViewport',
  'uDpr',
  'uFibers',
  'uDots',
  'uFlow',
  'uSize',
  'uFocus',
  'uDof',
  'uMaxCoc',
  'uFocal',
  'uIntro',
  'uPulse',
  'uHover',
  'uPart',
  'uDotLength',
  'uSparkle',
  'uDepthSpread',
  'uGain',
  'uTips',
  'uTint',
  'uGradient',
  'uFold',
  'uGlowColor',
  'uLineColor',
  'uSecondaryColor'
];
const DUST_UNIFORMS = [
  'uViewProj',
  'uViewport',
  'uDpr',
  'uTime',
  'uSize',
  'uFocus',
  'uDof',
  'uMaxCoc',
  'uFocal',
  'uIntro',
  'uSparkle',
  'uScale',
  'uGradient',
  'uGain',
  'uGlowColor',
  'uLineColor',
  'uSecondaryColor'
];
const PASS_UNIFORMS = ['uSource', 'uTexel'];
const COMPOSITE_UNIFORMS = [
  'uScene',
  'uBloom',
  'uGlow',
  'uBrightness',
  'uLightMode',
  'uGrain',
  'uVignette',
  'uFrame',
  'uView',
  'uDpr'
];

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

const link = (
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  names: string[]
): Program | null => {
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
  for (const name of names) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
};

const frustum = (fov: number, aspect: number, near: number, far: number) => {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
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

const orientation = (yaw: number, pitch: number, roll: number) => {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
  const rx = [1, 0, 0, 0, cp, sp, 0, -sp, cp];
  const rz = [cr, sr, 0, -sr, cr, 0, 0, 0, 1];
  const mul = (a: number[], b: number[]) => {
    const out: number[] = new Array(9);
    for (let col = 0; col < 3; col += 1) {
      for (let row = 0; row < 3; row += 1) {
        out[col * 3 + row] = a[row] * b[col * 3] + a[3 + row] * b[col * 3 + 1] + a[6 + row] * b[col * 3 + 2];
      }
    }
    return out;
  };
  return mul(rz, mul(rx, ry));
};

const applyMat3 = (m: number[], v: number[]) => [
  m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
  m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
  m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
];

const GhostFibers = ({
  glowColor = '#8b5cf6',
  lineColor,
  secondaryColor,
  gradient = 'depth',
  speed = 0.5,
  scale = 1,
  rotation = 18,
  rollSpeed = 0.15,
  layers = 3,
  waves = 1,
  twist = 1.2,
  threads = 72,
  volume = 0.7,
  spread = 1,
  density = 1,
  thickness = 1,
  flow = 0.4,
  fiberStyle = 'dots',
  tips = 0,
  foldGlow = 1,
  perspective = 0.65,
  depthOfField = 0.85,
  focusDepth = 0,
  particles = 0.5,
  sparkle = 0.5,
  glow = 0.8,
  brightness = 1,
  vignette = 0.3,
  grain = 0.06,
  mouseInteraction = true,
  hoverEffect = 'focus',
  mouseStrength = 1,
  pulseOnClick = true,
  intro = true,
  lightMode = false,
  paused = false,
  dpr,
  ...rest
}: GhostFibersProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    glowColor: String(glowColor),
    lineColor: lineColor ? String(lineColor) : '',
    secondaryColor: secondaryColor ? String(secondaryColor) : '',
    gradient: GRADIENTS[gradient] ?? 0,
    speed: Math.max(0, speed),
    scale: clamp(scale, 0.3, 3),
    rotation: rotation * DEG,
    rollSpeed,
    layers: clamp(Math.round(layers), 1, 3),
    waves: Math.max(0, waves),
    twist: Math.max(0, twist),
    threads: clamp(Math.round(threads), 6, 180),
    volume: clamp(volume, 0, 2),
    spread: clamp(spread, 0.2, 3),
    density: clamp(density, 0.2, 3),
    thickness: clamp(thickness, 0.2, 4),
    flow,
    dotLength: FIBER_STYLES[fiberStyle] ?? 0,
    tips: clamp(tips, 0, 1),
    foldGlow: clamp(foldGlow, 0, 3),
    perspective: clamp(perspective, 0, 1),
    depthOfField: clamp(depthOfField, 0, 2),
    focusDepth: clamp(focusDepth, -1, 1),
    particles: clamp(particles, 0, 2),
    sparkle: clamp(sparkle, 0, 2),
    glow: Math.max(0, glow),
    brightness: Math.max(0, brightness),
    vignette: clamp(vignette, 0, 1),
    grain: Math.max(0, grain),
    mouseInteraction,
    hover: HOVER_EFFECTS[hoverEffect] ?? 0,
    mouseStrength: Math.max(0, mouseStrength),
    pulseOnClick,
    intro,
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
      antialias: false,
      depth: false,
      stencil: false
    });
    if (!container || !canvas || !gl) return undefined;

    const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
    const dots = link(gl, DOT_VERTEX, DOT_FRAGMENT, DOT_UNIFORMS);
    const dust = link(gl, DUST_VERTEX, DOT_FRAGMENT, DUST_UNIFORMS);
    const bright = link(gl, FULLSCREEN, BRIGHT_FRAGMENT, PASS_UNIFORMS);
    const down = link(gl, FULLSCREEN, DOWN_FRAGMENT, PASS_UNIFORMS);
    const up = link(gl, FULLSCREEN, UP_FRAGMENT, PASS_UNIFORMS);
    const composite = link(gl, FULLSCREEN, COMPOSITE_FRAGMENT, COMPOSITE_UNIFORMS);
    if (!dots || !dust || !bright || !down || !up || !composite) return undefined;

    const format = floatTargets ? gl.RGBA16F : gl.RGBA8;
    const makeTarget = (): Target => ({ texture: null, framebuffer: gl.createFramebuffer(), width: 0, height: 0 });
    const allocate = (target: Target, width: number, height: number) => {
      if (target.texture && target.width === width && target.height === height) return;
      if (target.texture) gl.deleteTexture(target.texture);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      target.texture = texture;
      target.width = width;
      target.height = height;
    };
    const scene = makeTarget();
    const chain = Array.from({ length: BLOOM_LEVELS }, makeTarget);
    const vao = gl.createVertexArray();

    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeContext = probe.getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = {
      time: 0,
      roll: 0,
      flow: 0,
      frame: 0,
      intro: settingsRef.current.intro && !reduce ? 0 : INTRO_SECONDS,
      width: 1,
      height: 1,
      fit: 1,
      colorKey: '',
      glow: [0.55, 0.36, 0.96],
      line: [1, 0.85, 0.98],
      secondary: [0.44, 0.29, 0.77],
      pointer: { x: 0, y: 0, inside: false },
      hover: { x: 0, y: 0, presence: 0, placed: false },
      look: { x: 0, y: 0, vx: 0, vy: 0 },
      focus: CAMERA + settingsRef.current.focusDepth * 3,
      pulse: { s: 0, age: 9, strength: 0, ribbon: 0 },
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
      const key = `${s.glowColor}|${s.lineColor}|${s.secondaryColor}|${s.lightMode}`;
      if (key === state.colorKey) return;
      state.colorKey = key;
      state.glow = toRgb(s.glowColor, [0.55, 0.36, 0.96]);
      state.secondary = s.secondaryColor ? toRgb(s.secondaryColor, state.glow) : state.glow.map(c => c * 0.8);
      if (s.lineColor) state.line = toRgb(s.lineColor, state.glow);
      else state.line = s.lightMode ? state.glow : state.glow.map(c => c + (1 - c) * 0.72);
    };

    const centerLocal = (s: number, t: number, ribbon: number, waves: number) => {
      const place = PLACEMENTS[ribbon];
      const ph = place[3];
      const x = s * RIBBON_LENGTH;
      const y =
        waves * (0.52 * Math.sin(x * 0.43 + t * 0.31 + ph) + 0.26 * Math.sin(x * 0.79 - t * 0.23 + 1.3 + ph * 0.7)) +
        place[0] +
        x * place[2];
      const z = waves * 0.65 * Math.sin(x * 0.33 + t * 0.19 + 0.7 + ph * 1.3) + place[1];
      return [x, y, z];
    };

    const cameraFor = (s: Settings): Camera => {
      const aspect = state.width / Math.max(state.height, 1);
      const eye = [0, 0, CAMERA];
      const projection = frustum(FOV, aspect, 0.1, 60);
      const view = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -eye[0], -eye[1], -eye[2], 1];
      const orient = orientation(s.perspective * 0.85 + state.look.x * 0.22, 0.12 - state.look.y * 0.14, s.rotation);
      return { eye, viewProj: multiply(projection, view), orient };
    };

    const screenOf = (camera: Camera, world: number[]) => {
      const m = camera.viewProj;
      const x = m[0] * world[0] + m[4] * world[1] + m[8] * world[2] + m[12];
      const y = m[1] * world[0] + m[5] * world[1] + m[9] * world[2] + m[13];
      const w = m[3] * world[0] + m[7] * world[1] + m[11] * world[2] + m[15];
      return { x: ((x / w) * 0.5 + 0.5) * state.width, y: (0.5 - (y / w) * 0.5) * state.height, depth: w };
    };

    const nearestOnRibbon = (s: Settings, px: number, py: number): Nearest | null => {
      const camera = state.camera;
      if (!camera) return null;
      let best: Nearest | null = null;
      for (let ribbon = 0; ribbon < s.layers; ribbon += 1) {
        for (let i = 0; i <= 96; i += 1) {
          const u = i / 96 - 0.5;
          const local = centerLocal(u, state.time, ribbon, s.waves).map(c => c * s.scale * state.fit);
          const world = applyMat3(camera.orient, local);
          const screen = screenOf(camera, world);
          const gap = Math.hypot(screen.x - px, screen.y - py);
          if (!best || gap < best.gap) best = { gap, s: u, ribbon, depth: screen.depth };
        }
      }
      return best;
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
      state.fit = clamp(width / height / 1.5, 0.6, 1);
      render();
    };

    const drawPass = (program: Program, target: Target, source: Target, texel: number[]) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.viewport(0, 0, target.width, target.height);
      gl.useProgram(program.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, source.texture);
      gl.uniform1i(program.uniforms.uSource, 0);
      gl.uniform2f(program.uniforms.uTexel, texel[0], texel[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const render = () => {
      const s = settingsRef.current;
      resolveColors(s);
      const camera = cameraFor(s);
      state.camera = camera;
      const ratio = canvas.height / Math.max(state.height, 1);
      const intro = s.paused || reduce ? 1 : clamp(state.intro / INTRO_SECONDS, 0, 1);
      const introEase = 1 - (1 - intro) * (1 - intro) * (1 - intro);

      allocate(scene, canvas.width, canvas.height);
      gl.bindVertexArray(vao);
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.framebuffer);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);

      const dotsPerFiber = Math.round(260 * s.density);
      const blurCap = 22 * clamp(Math.sqrt(56000 / (s.threads * dotsPerFiber * s.layers)), 0.45, 1);
      const area = Math.max(0.8 * s.thickness, 0.45) ** 2 / 0.64;
      const load = Math.pow((s.threads / 72) * s.density * area, -0.75);
      gl.useProgram(dots.program);
      const u = dots.uniforms;
      gl.uniform1f(u.uTime, state.time);
      gl.uniform1f(u.uTwist, s.twist);
      gl.uniform1f(u.uRoll, state.roll);
      gl.uniform1f(u.uWaves, s.waves);
      gl.uniform1f(u.uWidth, 0.62 * s.spread);
      gl.uniformMatrix3fv(u.uOrient, false, camera.orient);
      gl.uniform1f(u.uScale, s.scale * state.fit);
      gl.uniformMatrix4fv(u.uViewProj, false, camera.viewProj);
      gl.uniform3f(u.uEye, camera.eye[0], camera.eye[1], camera.eye[2]);
      gl.uniform2f(u.uViewport, canvas.width, canvas.height);
      gl.uniform1f(u.uDpr, ratio);
      gl.uniform1f(u.uFibers, s.threads);
      gl.uniform1f(u.uDots, dotsPerFiber);
      gl.uniform1f(u.uFlow, state.flow);
      gl.uniform1f(u.uSize, 1.6 * s.thickness);
      gl.uniform1f(u.uFocus, state.focus);
      gl.uniform1f(u.uDof, s.depthOfField);
      gl.uniform1f(u.uMaxCoc, blurCap);
      gl.uniform1f(u.uFocal, CAMERA);
      gl.uniform1f(u.uIntro, introEase);
      gl.uniform4f(u.uPulse, state.pulse.s, state.pulse.age, state.pulse.strength, state.pulse.ribbon);
      gl.uniform4f(
        u.uHover,
        state.hover.x * ratio,
        (state.height - state.hover.y) * ratio,
        140 * ratio,
        state.hover.presence * s.mouseStrength
      );
      gl.uniform1f(u.uPart, s.hover === 1 ? 1 : 0);
      gl.uniform1f(u.uDotLength, s.dotLength);
      gl.uniform1f(u.uSparkle, s.sparkle);
      gl.uniform1f(u.uDepthSpread, 0.12);
      gl.uniform1f(u.uVolume, s.volume);
      gl.uniform3f(u.uGlowColor, state.glow[0], state.glow[1], state.glow[2]);
      gl.uniform3f(u.uLineColor, state.line[0], state.line[1], state.line[2]);
      gl.uniform3f(u.uSecondaryColor, state.secondary[0], state.secondary[1], state.secondary[2]);
      gl.uniform1f(u.uTips, s.tips);
      gl.uniform1f(u.uGradient, s.gradient);
      gl.uniform1f(u.uFold, s.foldGlow);
      for (let ribbon = 0; ribbon < s.layers; ribbon += 1) {
        const place = PLACEMENTS[ribbon];
        gl.uniform1f(u.uRibbon, ribbon);
        gl.uniform4f(u.uPlace, place[0], place[1], place[2], place[3]);
        gl.uniform1f(u.uGain, RIBBON_GAIN[ribbon] * load);
        gl.uniform1f(u.uTint, RIBBON_TINT[ribbon]);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, s.threads * dotsPerFiber);
      }

      const dustCount = Math.round(420 * s.particles);
      if (dustCount > 0) {
        gl.useProgram(dust.program);
        const d = dust.uniforms;
        gl.uniformMatrix4fv(d.uViewProj, false, camera.viewProj);
        gl.uniform2f(d.uViewport, canvas.width, canvas.height);
        gl.uniform1f(d.uDpr, ratio);
        gl.uniform1f(d.uTime, state.time);
        gl.uniform1f(d.uSize, 2.2 * s.thickness);
        gl.uniform1f(d.uFocus, state.focus);
        gl.uniform1f(d.uDof, s.depthOfField);
        gl.uniform1f(d.uMaxCoc, 22);
        gl.uniform1f(d.uFocal, CAMERA);
        gl.uniform1f(d.uIntro, introEase);
        gl.uniform1f(d.uSparkle, s.sparkle);
        gl.uniform1f(d.uScale, s.scale * state.fit);
        gl.uniform1f(d.uGradient, s.gradient);
        gl.uniform1f(d.uGain, 1 / s.thickness);
        gl.uniform3f(d.uGlowColor, state.glow[0], state.glow[1], state.glow[2]);
        gl.uniform3f(d.uLineColor, state.line[0], state.line[1], state.line[2]);
        gl.uniform3f(d.uSecondaryColor, state.secondary[0], state.secondary[1], state.secondary[2]);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, dustCount);
      }
      gl.disable(gl.BLEND);

      const blooming = s.glow > 0.001 && !s.lightMode;
      gl.bindVertexArray(vao);
      if (blooming) {
        chain.forEach((target, index) => {
          allocate(
            target,
            Math.max(1, Math.round(canvas.width / 2 ** (index + 1))),
            Math.max(1, Math.round(canvas.height / 2 ** (index + 1)))
          );
        });
        drawPass(bright, chain[0], scene, [0.5 / scene.width, 0.5 / scene.height]);
        for (let index = 1; index < BLOOM_LEVELS; index += 1) {
          drawPass(down, chain[index], chain[index - 1], [1 / chain[index - 1].width, 1 / chain[index - 1].height]);
        }
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        for (let index = BLOOM_LEVELS - 1; index > 0; index -= 1) {
          drawPass(up, chain[index - 1], chain[index], [0.5 / chain[index].width, 0.5 / chain[index].height]);
        }
        gl.disable(gl.BLEND);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(composite.program);
      const c = composite.uniforms;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, scene.texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, blooming ? chain[0].texture : scene.texture);
      gl.uniform1i(c.uScene, 0);
      gl.uniform1i(c.uBloom, 1);
      gl.uniform1f(c.uGlow, blooming ? s.glow : 0);
      gl.uniform1f(c.uBrightness, s.brightness);
      gl.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform1f(c.uGrain, s.grain);
      gl.uniform1f(c.uVignette, s.vignette);
      gl.uniform1f(c.uFrame, state.frame % 977);
      gl.uniform2f(c.uView, canvas.width, canvas.height);
      gl.uniform1f(c.uDpr, ratio);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindVertexArray(null);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const s = settingsRef.current;
      const elapsed = last ? (now - last) / 1000 : 1 / 60;
      const dt = Math.min(0.05, elapsed);
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) {
        state.frame += 1;
        state.time += dt * s.speed;
        state.roll += dt * s.speed * s.rollSpeed;
        state.flow += dt * s.flow * 12;
        state.intro += Math.min(elapsed, 1);
      } else if (state.intro < INTRO_SECONDS) {
        state.intro = INTRO_SECONDS;
      }
      state.pulse.age += dt;
      state.pulse.strength = Math.max(0, 1 - state.pulse.age / 1.8) ** 2;

      const { pointer, hover, look } = state;
      const active = s.mouseInteraction && pointer.inside && !reduce;
      if (active && !hover.placed) {
        hover.x = pointer.x;
        hover.y = pointer.y;
        hover.placed = true;
      }
      hover.x += (pointer.x - hover.x) * (1 - Math.exp(-dt / 0.08));
      hover.y += (pointer.y - hover.y) * (1 - Math.exp(-dt / 0.08));
      const goal = active ? 1 : 0;
      hover.presence += (goal - hover.presence) * (1 - Math.exp(-dt / (goal > hover.presence ? 0.3 : 0.6)));
      if (!active && hover.presence < 0.001) hover.placed = false;
      const lookX = active ? (pointer.x / state.width - 0.5) * 0.5 : 0;
      const lookY = active ? (0.5 - pointer.y / state.height) * 0.5 : 0;
      look.vx += (30 * (lookX - look.x) - 11 * look.vx) * dt;
      look.vy += (30 * (lookY - look.y) - 11 * look.vy) * dt;
      look.x += look.vx * dt;
      look.y += look.vy * dt;

      const resting = CAMERA + s.focusDepth * 3;
      let focusGoal = resting;
      if (active && s.hover === 0) {
        const near = nearestOnRibbon(s, hover.x, hover.y);
        if (near) focusGoal = resting + (near.depth - resting) * hover.presence * Math.min(1, s.mouseStrength);
      }
      state.focus += (focusGoal - state.focus) * (1 - Math.exp(-dt / 0.35));

      render();
      const settling =
        Math.abs(goal - hover.presence) > 0.002 ||
        Math.abs(lookX - look.x) > 0.0002 ||
        Math.abs(lookY - look.y) > 0.0002 ||
        Math.abs(focusGoal - state.focus) > 0.001 ||
        state.pulse.strength > 0.001;
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
      const near = nearestOnRibbon(s, x, y);
      if (near) state.pulse = { s: near.s, age: 0, strength: 1, ribbon: near.ribbon };
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
      gl.deleteVertexArray(vao);
      [scene, ...chain].forEach(target => {
        if (target.texture) gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      });
      [dots, dust, bright, down, up, composite].forEach(entry => gl.deleteProgram(entry.program));
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  const { className = '', ...attributes } = rest;

  return (
    <div ref={containerRef} className={`ghost-fibers-container${className ? ` ${className}` : ''}`} {...attributes}>
      <canvas ref={canvasRef} className="ghost-fibers-canvas" aria-hidden="true" />
    </div>
  );
};

export default GhostFibers;
