'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';

export type RadarMode = 'sweep' | 'pulse';

export interface RadarProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
  backgroundColor?: string;
  mode?: RadarMode;
  speed?: number;
  trail?: number;
  scale?: number;
  ringCount?: number;
  spokeCount?: number;
  ticks?: boolean;
  targets?: number;
  clutter?: number;
  glow?: number;
  brightness?: number;
  gridOpacity?: number;
  lineWidth?: number;
  tilt?: number;
  centerX?: number;
  centerY?: number;
  mouseInteraction?: boolean;
  intro?: boolean;
  grain?: number;
  fade?: number;
  opacity?: number;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
}

type Settings = {
  color: string;
  backgroundColor: string;
  mode: RadarMode;
  speed: number;
  trail: number;
  scale: number;
  ringCount: number;
  spokeCount: number;
  ticks: boolean;
  targets: number;
  clutter: number;
  glow: number;
  brightness: number;
  gridOpacity: number;
  lineWidth: number;
  tilt: number;
  centerX: number;
  centerY: number;
  mouseInteraction: boolean;
  intro: boolean;
  grain: number;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

type Target = { texture: WebGLTexture | null; framebuffer: WebGLFramebuffer | null; width: number; height: number };

type Echo = { x: number; y: number; time: number };

type Contact = { x: number; y: number; heading: number; velocity: number; turn: number; echoes: Echo[] };

const QUAD_VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const CAMERA = `
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uViewHeight;
uniform float uFocal;
uniform float uDistance;
uniform float uTilt;
`;

const SCENE = `#version 300 es
precision highp float;
${CAMERA}
uniform float uMode;
uniform float uSweep;
uniform float uSwept;
uniform float uDirection;
uniform float uCycle;
uniform float uTrail;
uniform float uRings;
uniform float uSpokes;
uniform float uTicks;
uniform float uGrid;
uniform float uLine;
uniform float uClutter;
uniform float uTime;
uniform vec3 uAccent;
uniform vec3 uHeat;
uniform float uIntro;
uniform float uRange;
uniform float uPixel;
out vec4 outColor;

const float TAU = 6.28318531;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float stroke(float distance, float width) {
  float w = max(width, 1.0) * 0.5;
  return clamp(w + 0.5 - distance, 0.0, 1.0) * min(width, 1.0);
}

void main() {
  vec2 s = (gl_FragCoord.xy - uCenter) / uViewHeight;
  float ct = cos(uTilt);
  float st = sin(uTilt);
  vec3 forward = vec3(0.0, st, -ct);
  vec3 up = vec3(0.0, ct, st);
  vec3 dir = forward * uFocal + vec3(s.x, 0.0, 0.0) + up * s.y;
  vec3 eye = vec3(0.0, -uDistance * st, uDistance * ct);
  float hit = -eye.z / min(dir.z, -0.00001);
  vec2 p = eye.xy + dir.xy * hit;
  float r = length(p);
  vec2 dpdx = dFdx(p);
  vec2 dpdy = dFdy(p);
  if (dir.z > -0.0001 || r > 1.3) {
    outColor = vec4(0.0);
    return;
  }
  vec2 radial = p / max(r, 0.00001);
  vec2 tangent = vec2(radial.y, -radial.x);
  float pxR = max(length(vec2(dot(radial, dpdx), dot(radial, dpdy))), 0.000001);
  float pxT = max(length(vec2(dot(tangent, dpdx), dot(tangent, dpdy))), 0.000001);
  float bearing = atan(p.x, p.y);
  float turn = fract(bearing / TAU + 1.0);
  float inside = 1.0 - smoothstep(1.0 - pxR, 1.0 + pxR, r);

  float ringCoord = r * uRings;
  float ringIndex = clamp(floor(ringCoord + 0.5), 1.0, max(uRings - 1.0, 1.0));
  float rings = stroke(abs(ringCoord - ringIndex) / uRings / pxR, uLine) * step(ringIndex, uRings - 0.5);
  float arc = clamp(uIntro * (uRings + 3.0) - ringIndex, 0.0, 1.0) * 1.02;
  rings *= 1.0 - smoothstep(arc - 0.01, arc, turn);
  float outerArc = clamp(uIntro * (uRings + 3.0) - uRings, 0.0, 1.0) * 1.02;
  float outer = stroke(abs(r - 1.0) / pxR, uLine * 1.15) * (1.0 - smoothstep(outerArc - 0.01, outerArc, turn));

  float tickCoord = turn * 180.0;
  float tickIndex = floor(tickCoord + 0.5);
  float major = 1.0 - step(0.5, mod(tickIndex, 15.0));
  float middle = 1.0 - step(0.5, mod(tickIndex, 5.0));
  float tickLength = mix(mix(0.016, 0.03, middle), 0.05, major);
  float tickRadial = clamp((r - 1.0) / pxR + 0.5, 0.0, 1.0) * clamp((1.0 + tickLength - r) / pxR + 0.5, 0.0, 1.0);
  float spacing = TAU / 180.0 * r / pxT;
  float ticks = stroke(abs(tickCoord - tickIndex) / 180.0 * TAU * r / pxT, uLine) * tickRadial;
  ticks *= mix(mix(0.42 * smoothstep(2.5, 5.0, spacing), 0.7, middle), 1.0, major) * uTicks;
  ticks *= smoothstep(0.55, 0.9, uIntro);

  float spokeTotal = max(uSpokes, 1.0);
  float spokeCoord = turn * spokeTotal;
  float spokeIndex = floor(spokeCoord + 0.5);
  float spokes = stroke(abs(spokeCoord - spokeIndex) / spokeTotal * TAU * r / pxT, uLine) * smoothstep(0.05, 0.16, r);
  spokes *= inside * step(0.5, uSpokes);
  float cardinalCoord = turn * 4.0;
  float cardinal = stroke(abs(cardinalCoord - floor(cardinalCoord + 0.5)) / 4.0 * TAU * r / pxT, uLine) * smoothstep(0.02, 0.08, r) * inside;
  float hub = stroke(abs(r - 0.022) / pxR, uLine);
  float spokesIn = smoothstep(0.35, 0.8, uIntro);
  float axisDistance = abs(cardinalCoord - floor(cardinalCoord + 0.5)) / 4.0 * TAU * r / pxT;
  float rangeCoord = r * uRings * 5.0;
  float rangeMark = stroke(abs(rangeCoord - floor(rangeCoord + 0.5)) / (uRings * 5.0) / pxR, uLine);
  rangeMark *= 1.0 - smoothstep(3.0 * uPixel - 0.5, 3.0 * uPixel + 0.5, axisDistance);
  rangeMark *= smoothstep(0.06, 0.12, r) * inside;
  float bezel = stroke(abs(r - 1.065) / pxR, uLine) * uTicks * smoothstep(0.6, 0.95, uIntro);

  float grid = rings * 0.12 + outer * 0.24 + ticks * 0.22 + bezel * 0.08;
  grid += (spokes * 0.05 + cardinal * 0.08 + hub * 0.22 + rangeMark * 0.16) * spokesIn;
  grid *= uGrid;

  float behind;
  float edge;
  float trail;
  float lastPass;
  if (uMode < 0.5) {
    float ahead = fract((bearing - uSweep) / TAU + 0.5) - 0.5;
    behind = fract(uDirection * (uSweep - bearing) / TAU) * TAU;
    edge = stroke(abs(ahead) * TAU * r / pxT, uLine * 1.4) * smoothstep(0.0, 0.04, r) * inside;
    trail = exp(-behind / uTrail) * (1.0 - smoothstep(uSwept - 0.15, uSwept, behind));
    lastPass = floor(uCycle - behind / TAU);
  } else {
    behind = uSweep - r;
    edge = stroke(abs(behind) / pxR, uLine * 1.4) * inside;
    trail = behind >= 0.0 ? exp(-behind / uTrail) : 0.0;
    lastPass = behind >= 0.0 ? uCycle : uCycle - 1.0;
  }
  float sweepIn = smoothstep(0.45, 1.0, uIntro);
  trail *= inside * sweepIn;
  edge *= sweepIn;
  float glowTrail = pow(trail, 0.45);

  float returns = 0.0;
  if (uClutter > 0.0 && trail > 0.004) {
    float radialBin = floor(r * 120.0);
    float count = max(8.0, floor(radialBin * 5.0));
    float angularBin = floor(turn * count);
    vec2 drift = vec2(lastPass * 0.173, lastPass * 0.291);
    float weather = noise(p * 3.2 + drift) * 0.65 + noise(p * 7.1 - drift) * 0.35;
    float cluster = smoothstep(0.5, 0.78, weather);
    float density = uClutter * (0.02 + 0.35 * cluster) * (1.0 - smoothstep(0.55, 1.0, r));
    vec2 binSeed = vec2(radialBin, angularBin) + lastPass * 17.13;
    float speck = step(1.0 - density, hash(binSeed));
    vec2 inBin = vec2(fract(r * 120.0), fract(turn * count)) - 0.5;
    float shape = 1.0 - smoothstep(0.18, 0.5, length(inBin));
    speck *= shape * (0.45 + 0.55 * hash(binSeed + 7.7));
    returns = (speck * 1.1 + cluster * 0.16 * uClutter) * trail;
  }

  float heat = uHeat.z * exp(-dot(p - uHeat.xy, p - uHeat.xy) / 0.035);
  float lit = clamp(glowTrail * 0.9 + heat * 0.55, 0.0, 1.0);
  vec3 lineColor = mix(vec3(1.0), uAccent, lit);
  vec3 light = lineColor * grid * (1.0 + glowTrail * 3.0 + heat * 2.4);
  float fill = trail * 0.11 * (0.35 + 0.65 * smoothstep(0.0, 0.6, r));
  light += uAccent * (fill + returns * 0.55);
  light += mix(uAccent, vec3(1.0), 0.3) * edge * 1.3;
  outColor = vec4(light * uRange, 1.0);
}`;

const SPRITE_VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 aSprite;
in vec4 aStyle;
${CAMERA}
out vec2 vLocal;
out vec4 vStyle;
out float vKind;
void main() {
  float ct = cos(uTilt);
  float st = sin(uTilt);
  float c = cos(aStyle.w);
  float s = sin(aStyle.w);
  vec2 local = aCorner * 1.25;
  vec2 offset = vec2(c * local.x - s * local.y, s * local.x + c * local.y) * aSprite.z;
  vec3 world = vec3(aSprite.xy + offset, 0.0);
  vec3 eye = vec3(0.0, -uDistance * st, uDistance * ct);
  vec3 rel = world - eye;
  float xc = rel.x;
  float yc = dot(rel, vec3(0.0, ct, st));
  float zc = max(dot(rel, vec3(0.0, st, -ct)), 0.0001);
  vec2 center = uCenter / uResolution * 2.0 - 1.0;
  gl_Position = vec4(center * zc + 2.0 * uFocal * uViewHeight * vec2(xc, yc) / uResolution, 0.0, zc);
  vLocal = local;
  vStyle = aStyle;
  vKind = aSprite.w;
}`;

const SPRITE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec4 vStyle;
in float vKind;
uniform vec3 uAccent;
uniform float uRange;
out vec4 outColor;
void main() {
  float shape;
  vec3 tint;
  if (vKind < 0.5) {
    float d = length(vLocal * vec2(0.62, 1.0));
    float aa = max(fwidth(d), 0.0001);
    shape = clamp((1.0 - d) / aa + 0.5, 0.0, 1.0);
    shape *= 0.5 + 0.5 * exp(-d * d * 2.5);
    tint = mix(uAccent, vec3(1.0), vStyle.y * 0.45 * exp(-d * d * 5.0));
  } else {
    float d = length(vLocal);
    float aa = max(fwidth(d), 0.0001);
    shape = clamp(1.0 - abs(d - 1.0) / (aa * 0.75), 0.0, 1.0);
    tint = mix(uAccent, vec3(1.0), 0.2);
  }
  outColor = vec4(tint * shape * vStyle.x * uRange, 1.0);
}`;

const DOWN = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec4 sum = texture(uSource, uv) * 4.0;
  sum += texture(uSource, uv - uTexel);
  sum += texture(uSource, uv + uTexel);
  sum += texture(uSource, uv + vec2(uTexel.x, -uTexel.y));
  sum += texture(uSource, uv - vec2(uTexel.x, -uTexel.y));
  outColor = sum / 8.0;
}`;

const UP = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec2 h = uTexel * 0.5;
  vec4 sum = texture(uSource, uv + vec2(-h.x * 2.0, 0.0));
  sum += texture(uSource, uv + vec2(h.x * 2.0, 0.0));
  sum += texture(uSource, uv + vec2(0.0, -h.y * 2.0));
  sum += texture(uSource, uv + vec2(0.0, h.y * 2.0));
  sum += texture(uSource, uv + vec2(-h.x, h.y)) * 2.0;
  sum += texture(uSource, uv + h) * 2.0;
  sum += texture(uSource, uv + vec2(h.x, -h.y)) * 2.0;
  sum += texture(uSource, uv - h) * 2.0;
  outColor = sum / 12.0 + texture(uBase, uv);
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2 uResolution;
uniform float uExposure;
uniform float uGlow;
uniform float uGrain;
uniform float uFade;
uniform float uOpacity;
uniform float uTime;
uniform float uLightMode;
uniform vec4 uBackground;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float smootherstep(float edge, float x) {
  float t = clamp(x / max(edge, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 hdr = texelFetch(uScene, ivec2(gl_FragCoord.xy), 0).rgb * uExposure;
  vec3 bloom = texture(uBloom, uv).rgb * uExposure * uGlow * 0.5;
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  mask *= uOpacity;
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  vec4 color;
  if (uLightMode > 0.5) {
    float bloomPeak = max(bloom.r, max(bloom.g, bloom.b));
    float bloomLow = min(bloom.r, min(bloom.g, bloom.b));
    vec3 total = hdr + bloom * 0.3 * (bloomPeak - bloomLow) / max(bloomPeak, 0.0001);
    float peak = max(total.r, max(total.g, total.b));
    vec3 hue = total / max(peak, 0.0001);
    float tone = dot(hue, vec3(0.2126, 0.7152, 0.0722));
    float depth = mix(0.36, 0.09, smoothstep(0.06, 0.7, peak));
    vec3 ink = pow(clamp(hue * min(1.0, depth / max(tone, 0.001)), 0.0, 1.0), vec3(1.0 / 2.2));
    float alpha = clamp((1.0 - exp(-peak * 2.6)) * (1.0 + grain), 0.0, 1.0) * mask;
    color = vec4(ink * alpha, alpha);
  } else {
    vec3 mapped = 1.0 - exp(-(hdr + bloom));
    float level = max(mapped.r, max(mapped.g, mapped.b));
    mapped = clamp(mapped + grain * level, 0.0, 1.0) * mask;
    color = vec4(mapped, max(mapped.r, max(mapped.g, mapped.b)));
  }
  vec4 back = vec4(uBackground.rgb * uBackground.a, uBackground.a);
  outColor = color + back * (1.0 - color.a);
}`;

const TAU = Math.PI * 2;
const MAX_TARGETS = 16;
const HISTORY = 4;
const FOCAL = 2;
const INTRO_SECONDS = 2.2;
const MAX_RENDER_DIM = 2560;
const BLOOM_LEVELS = 5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const seeded = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

const link = (
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  attributes: string[]
): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  attributes.forEach((name, index) => gl.bindAttribLocation(program, index, name));
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
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const spawnTarget = (rng: () => number, inward: boolean) => {
  const angle = rng() * TAU;
  const radius = inward ? 0.94 : 0.2 + rng() * 0.68;
  const heading = inward ? angle + Math.PI + (rng() - 0.5) * 1.6 : rng() * TAU;
  return {
    x: Math.sin(angle) * radius,
    y: Math.cos(angle) * radius,
    heading,
    velocity: 0.012 + rng() * 0.03,
    turn: (rng() - 0.5) * 0.18
  };
};

export default function Radar({
  color = '#3ef09a',
  backgroundColor = 'transparent',
  mode = 'sweep',
  speed = 1,
  trail = 0.35,
  scale = 0.9,
  ringCount = 6,
  spokeCount = 12,
  ticks = true,
  targets = 6,
  clutter = 0.35,
  glow = 1,
  brightness = 1,
  gridOpacity = 1,
  lineWidth = 1,
  tilt = 0,
  centerX = 0.5,
  centerY = 0.5,
  mouseInteraction = true,
  intro = true,
  grain = 0.03,
  fade = 0,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  ...rest
}: RadarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    color: String(color),
    backgroundColor: String(backgroundColor),
    mode: mode === 'pulse' ? 'pulse' : 'sweep',
    speed,
    trail: clamp(trail, 0.02, 1),
    scale: Math.max(0.05, scale),
    ringCount: Math.round(clamp(ringCount, 1, 24)),
    spokeCount: Math.round(clamp(spokeCount, 0, 72)),
    ticks,
    targets: Math.round(clamp(targets, 0, MAX_TARGETS)),
    clutter: clamp(clutter, 0, 1),
    glow: Math.max(0, glow),
    brightness: Math.max(0, brightness),
    gridOpacity: clamp(gridOpacity, 0, 2),
    lineWidth: clamp(lineWidth, 0.25, 4),
    tilt: (clamp(tilt, 0, 80) * Math.PI) / 180,
    centerX,
    centerY,
    mouseInteraction,
    intro,
    grain: Math.max(0, grain),
    fade: clamp(fade, 0, 1),
    opacity: clamp(opacity, 0, 1),
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
    const range = floatTargets ? 1 : 0.25;
    const programs = {
      scene: link(gl, QUAD_VERTEX, SCENE, ['aPosition']),
      sprite: link(gl, SPRITE_VERTEX, SPRITE_FRAGMENT, ['aCorner', 'aSprite', 'aStyle']),
      down: link(gl, QUAD_VERTEX, DOWN, ['aPosition']),
      up: link(gl, QUAD_VERTEX, UP, ['aPosition']),
      composite: link(gl, QUAD_VERTEX, COMPOSITE, ['aPosition'])
    } as Record<string, Program>;
    if (Object.values(programs).some(entry => !entry)) return undefined;

    const quadBuffer = gl.createBuffer();
    const quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const cornerBuffer = gl.createBuffer();
    const instanceBuffer = gl.createBuffer();
    const spriteVao = gl.createVertexArray();
    gl.bindVertexArray(spriteVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    for (let attribute = 1; attribute <= 2; attribute++) {
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 32, (attribute - 1) * 16);
      gl.vertexAttribDivisor(attribute, 1);
    }
    gl.bindVertexArray(null);

    const createTarget = (): Target => ({
      texture: gl.createTexture(),
      framebuffer: gl.createFramebuffer(),
      width: 0,
      height: 0
    });
    const sizeTarget = (target: Target, width: number, height: number) => {
      if (target.width === width && target.height === height) return;
      target.width = width;
      target.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      if (floatTargets) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    };
    const scene = createTarget();
    const down = Array.from({ length: BLOOM_LEVELS + 1 }, createTarget);
    const up = Array.from({ length: BLOOM_LEVELS }, createTarget);

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const colorCache = new Map<string, number[]>();
    const parseColor = (value: string): number[] => {
      const cached = colorCache.get(value);
      if (cached) return cached;
      let rgba = [1, 1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = 'rgba(0, 0, 0, 0)';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
        rgba = a ? [r / a, g / a, b / a, a / 255] : [0, 0, 0, 0];
      }
      colorCache.set(value, rgba);
      return rgba;
    };
    const toLinear = (value: string) =>
      parseColor(value)
        .slice(0, 3)
        .map(v => Math.pow(v, 2.2));

    const rng = seeded(7919);
    const contacts: Contact[] = Array.from({ length: MAX_TARGETS }, () => ({ ...spawnTarget(rng, false), echoes: [] }));
    const cursor = { x: 0, y: 0, inside: false, echoes: [] as Echo[] };
    const pointer = { x: 0, y: 0, inside: false };
    const view = { width: 1, height: 1, ratio: 1 };
    const state = {
      time: 0,
      sweep: 0,
      swept: 0,
      cycle: 0,
      intro: settingsRef.current.intro && !reduce ? 0 : 1,
      heat: 0,
      heatVelocity: 0,
      heatX: 0,
      heatY: 0
    };
    const instances = new Float32Array(8 * 160);
    let raf = 0;
    let last = 0;
    let visible = true;

    const fit = (s: Settings) => (s.scale * Math.min(view.width, view.height)) / view.height;

    const camera = (s: Settings) => ({ distance: (2 * FOCAL) / fit(s), focal: FOCAL, tilt: s.tilt });

    const toPlane = (s: Settings, x: number, y: number): [number, number] | null => {
      const { distance, focal, tilt } = camera(s);
      const sx = (x - s.centerX * view.width) / view.height;
      const sy = (s.centerY * view.height - y) / view.height;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      const dx = sx;
      const dy = focal * st + sy * ct;
      const dz = -focal * ct + sy * st;
      if (dz > -0.0001) return null;
      const ey = -distance * st;
      const ez = distance * ct;
      const t = -ez / dz;
      return [dx * t, ey + dy * t];
    };

    const period = (s: Settings) => (s.mode === 'pulse' ? 3.2 : 6);

    const advance = (s: Settings, dt: number) => {
      const step = dt * Math.abs(s.speed);
      const pulse = s.mode === 'pulse';
      const span = pulse ? 1.15 : TAU;
      const delta = (step / period(s)) * span;
      const direction = s.speed < 0 && !pulse ? -1 : 1;
      const previous = state.sweep;
      state.swept += delta;
      const record = (contact: { x: number; y: number; echoes: Echo[] }) => {
        contact.echoes.unshift({ x: contact.x, y: contact.y, time: state.time });
        if (contact.echoes.length > HISTORY) contact.echoes.length = HISTORY;
      };
      const passed = (x: number, y: number) => {
        if (pulse) {
          const radius = Math.hypot(x, y);
          const from = previous;
          const to = previous + delta;
          return (radius > from && radius <= to) || (to > span && radius <= to - span);
        }
        const bearing = Math.atan2(x, y);
        const gap = (((direction * (bearing - previous)) % TAU) + TAU) % TAU;
        return gap > 0 && gap <= delta;
      };
      for (let i = 0; i < s.targets; i++) {
        const contact = contacts[i];
        contact.heading += contact.turn * step;
        contact.x += Math.sin(contact.heading) * contact.velocity * step;
        contact.y += Math.cos(contact.heading) * contact.velocity * step;
        if (Math.hypot(contact.x, contact.y) > 0.96) Object.assign(contact, spawnTarget(rng, true));
        if (passed(contact.x, contact.y)) record(contact);
      }
      if (cursor.inside && passed(cursor.x, cursor.y)) record(cursor);
      state.sweep += direction * delta;
      while (state.sweep >= span) {
        state.sweep -= span;
        state.cycle += 1;
      }
      while (state.sweep < 0) {
        state.sweep += span;
        state.cycle += 1;
      }
    };

    const buildSprites = (s: Settings) => {
      const unit = 2 / (fit(s) * view.height);
      const persist = (period(s) / Math.max(Math.abs(s.speed), 0.05)) * 1.1;
      let count = 0;
      const push = (
        x: number,
        y: number,
        radius: number,
        kind: number,
        intensity: number,
        core: number,
        angle: number
      ) => {
        if (count * 8 + 8 > instances.length) return;
        instances.set([x, y, radius, kind, intensity, core, 0, angle], count * 8);
        count++;
      };
      const emit = (contact: { echoes: Echo[] }, strength: number) => {
        contact.echoes.forEach((echo, index) => {
          const age = state.time - echo.time;
          const fade = Math.exp(-age / persist) * (index === 0 ? 1 : 0.8);
          if (fade < 0.01) return;
          const angle = -Math.atan2(echo.x, echo.y);
          push(
            echo.x,
            echo.y,
            unit * (index === 0 ? 3.4 : 2.4),
            0,
            fade * strength * 2.2,
            index === 0 ? 1 : 0.3,
            angle
          );
          if (index === 0 && age < 1.4) {
            const progress = age / 1.4;
            const eased = 1 - Math.pow(1 - progress, 3);
            push(echo.x, echo.y, unit * (4 + 26 * eased), 1, (1 - progress) * (1 - progress) * strength * 1.4, 0, 0);
          }
        });
      };
      for (let i = 0; i < s.targets; i++) emit(contacts[i], 1);
      emit(cursor, 1.3);
      return count;
    };

    const run = (entry: Program, target: Target | null, width: number, height: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
      gl.viewport(0, 0, width, height);
      gl.useProgram(entry.program);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const bindTexture = (entry: Program, name: string, unit: number, texture: WebGLTexture | null) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(entry.uniforms[name], unit);
    };

    const setCamera = (entry: Program, s: Settings) => {
      const u = entry.uniforms;
      const { distance, focal, tilt } = camera(s);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform2f(u.uCenter, s.centerX * canvas.width, (1 - s.centerY) * canvas.height);
      gl.uniform1f(u.uViewHeight, canvas.height);
      gl.uniform1f(u.uFocal, focal);
      gl.uniform1f(u.uDistance, distance);
      gl.uniform1f(u.uTilt, tilt);
    };

    const render = () => {
      const s = settingsRef.current;
      const accent = toLinear(s.color);
      const presence = state.intro;
      sizeTarget(scene, canvas.width, canvas.height);

      const sceneProgram = programs.scene;
      const u = sceneProgram.uniforms;
      gl.useProgram(sceneProgram.program);
      setCamera(sceneProgram, s);
      gl.uniform1f(u.uMode, s.mode === 'pulse' ? 1 : 0);
      gl.uniform1f(u.uSweep, state.sweep);
      gl.uniform1f(u.uSwept, Math.min(state.swept, TAU + 1));
      gl.uniform1f(u.uDirection, s.speed < 0 && s.mode !== 'pulse' ? -1 : 1);
      gl.uniform1f(u.uCycle, state.cycle);
      gl.uniform1f(u.uTrail, s.mode === 'pulse' ? s.trail * 0.22 : s.trail * TAU * 0.5);
      gl.uniform1f(u.uRings, s.ringCount);
      gl.uniform1f(u.uSpokes, s.spokeCount);
      gl.uniform1f(u.uTicks, s.ticks ? 1 : 0);
      gl.uniform1f(u.uGrid, s.gridOpacity);
      gl.uniform1f(u.uLine, s.lineWidth * view.ratio);
      gl.uniform1f(u.uClutter, s.clutter * (s.lightMode ? 0.6 : 1));
      gl.uniform1f(u.uTime, state.time);
      gl.uniform3fv(u.uAccent, accent);
      gl.uniform3f(u.uHeat, state.heatX, state.heatY, state.heat);
      gl.uniform1f(u.uIntro, presence);
      gl.uniform1f(u.uRange, range);
      gl.uniform1f(u.uPixel, view.ratio);
      gl.bindVertexArray(quadVao);
      run(sceneProgram, scene, canvas.width, canvas.height);

      const count = buildSprites(s);
      if (count > 0) {
        const sprite = programs.sprite;
        gl.useProgram(sprite.program);
        setCamera(sprite, s);
        gl.uniform3fv(sprite.uniforms.uAccent, accent);
        gl.uniform1f(sprite.uniforms.uRange, range * Math.min(1, presence * 2));
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.bindVertexArray(spriteVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, instances.subarray(0, count * 8), gl.DYNAMIC_DRAW);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
        gl.disable(gl.BLEND);
      }

      gl.bindVertexArray(quadVao);
      let source = scene;
      for (let level = 0; floatTargets && level <= BLOOM_LEVELS; level++) {
        const target = down[level];
        const width = level === 0 ? Math.round(view.width / 2) : source.width >> 1;
        const height = level === 0 ? Math.round(view.height / 2) : source.height >> 1;
        sizeTarget(target, Math.max(1, width), Math.max(1, height));
        gl.useProgram(programs.down.program);
        gl.uniform2f(programs.down.uniforms.uTexel, 1 / source.width, 1 / source.height);
        gl.uniform2f(programs.down.uniforms.uTarget, target.width, target.height);
        bindTexture(programs.down, 'uSource', 0, source.texture);
        run(programs.down, target, target.width, target.height);
        source = target;
      }
      for (let level = BLOOM_LEVELS - 1; floatTargets && level >= 0; level--) {
        const from = level === BLOOM_LEVELS - 1 ? down[BLOOM_LEVELS] : up[level + 1];
        const target = up[level];
        sizeTarget(target, down[level].width, down[level].height);
        gl.useProgram(programs.up.program);
        gl.uniform2f(programs.up.uniforms.uTexel, 1 / from.width, 1 / from.height);
        gl.uniform2f(programs.up.uniforms.uTarget, target.width, target.height);
        bindTexture(programs.up, 'uSource', 0, from.texture);
        bindTexture(programs.up, 'uBase', 1, down[level].texture);
        run(programs.up, target, target.width, target.height);
      }

      const composite = programs.composite;
      const c = composite.uniforms;
      gl.useProgram(composite.program);
      gl.uniform2f(c.uResolution, canvas.width, canvas.height);
      gl.uniform1f(c.uExposure, (1.5 * s.brightness) / range);
      gl.uniform1f(c.uGlow, floatTargets ? s.glow : 0);
      gl.uniform1f(c.uGrain, s.grain);
      gl.uniform1f(c.uFade, s.fade);
      gl.uniform1f(c.uOpacity, s.opacity);
      gl.uniform1f(c.uTime, state.time % 1000);
      gl.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
      const back = parseColor(s.backgroundColor);
      gl.uniform4f(c.uBackground, back[0], back[1], back[2], back[3]);
      bindTexture(composite, 'uScene', 0, scene.texture);
      bindTexture(composite, 'uBloom', 1, up[0].texture);
      run(composite, null, canvas.width, canvas.height);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
      const plane = s.mouseInteraction && pointer.inside && !reduce ? toPlane(s, pointer.x, pointer.y) : null;
      cursor.inside = !!plane && Math.hypot(plane[0], plane[1]) < 0.98;
      if (plane) {
        cursor.x = plane[0];
        cursor.y = plane[1];
        state.heatX += (plane[0] - state.heatX) * (1 - Math.exp(-dt * 10));
        state.heatY += (plane[1] - state.heatY) * (1 - Math.exp(-dt * 10));
      }
      const goal = cursor.inside ? 1 : 0;
      state.heatVelocity += (120 * (goal - state.heat) - 19 * state.heatVelocity) * dt;
      state.heat = clamp(state.heat + state.heatVelocity * dt, 0, 1.2);
      if (moving) {
        state.time += dt;
        const ramp = 0.25 + 0.75 * clamp((state.intro - 0.35) / 0.65, 0, 1);
        advance(s, dt * ramp);
      }
      render();
      const settling = state.intro < 1 || state.heat > 0.001 || Math.abs(state.heatVelocity) > 0.001;
      if (moving || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const base = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      const longest = Math.max(width, height) * base;
      const ratio = longest > MAX_RENDER_DIM ? (base * MAX_RENDER_DIM) / longest : base;
      view.width = width;
      view.height = height;
      view.ratio = ratio;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      if (!raf) render();
      wake();
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
      wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
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
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    let lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      if (settingsRef.current.dpr !== lastDpr) {
        lastDpr = settingsRef.current.dpr;
        resize();
        return;
      }
      if (!raf) render();
      wake();
    };

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      for (const target of [scene, ...down, ...up]) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      for (const entry of Object.values(programs)) gl.deleteProgram(entry.program);
      gl.deleteBuffer(quadBuffer);
      gl.deleteBuffer(cornerBuffer);
      gl.deleteBuffer(instanceBuffer);
      gl.deleteVertexArray(quadVao);
      gl.deleteVertexArray(spriteVao);
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
      {...rest}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
}
