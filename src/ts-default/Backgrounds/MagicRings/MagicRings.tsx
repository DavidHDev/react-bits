'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './MagicRings.css';

type Motion = 'pulse' | 'ripple' | 'breathe';
type Pass = 'glow' | 'compose' | 'line';
type Matrix = number[];

export interface MagicRingsProps {
  color?: string;
  colorTwo?: string;
  ringCount?: number;
  motion?: Motion;
  speed?: number;
  lineThickness?: number;
  glow?: number;
  baseRadius?: number;
  radiusStep?: number;
  expansion?: number;
  taper?: number;
  rotation?: number;
  spin?: number;
  tilt?: number;
  dispersion?: number;
  grain?: number;
  opacity?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  hoverScale?: number;
  hoverIntensity?: number;
  parallax?: number;
  clickBurst?: boolean;
  intro?: boolean;
  theme?: 'dark' | 'light';
  maxDevicePixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  color: number[];
  colorTwo: number[];
  ringCount: number;
  motion: Motion;
  speed: number;
  lineThickness: number;
  glow: number;
  baseRadius: number;
  radiusStep: number;
  expansion: number;
  taper: number;
  rotation: number;
  spin: number;
  tilt: number;
  dispersion: number;
  grain: number;
  opacity: number;
  followMouse: boolean;
  mouseInfluence: number;
  hoverScale: number;
  hoverIntensity: number;
  parallax: number;
  clickBurst: boolean;
  intro: boolean;
  light: boolean;
  maxRatio: number;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface RingState {
  radius: number;
  life: number;
  virtual: number;
  mix: number;
  opening: number;
}

interface Burst {
  start: number;
  radius: number;
}

const MAX_RINGS = 12;
const MAX_BURSTS = 3;
const SLOTS = MAX_RINGS + MAX_BURSTS;

const SEGMENTS = 128;

const FULLSCREEN = `
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`;

const STRIP = `
layout(location = 0) in vec2 aSegment;
uniform mat3 uForward;
uniform vec2 uResolution;
uniform float uUnit;
uniform vec2 uCenter;
uniform vec4 uShape[SLOTS];
uniform vec4 uFrame[SLOTS];
uniform float uReach;
uniform float uSplit;
flat out int vSlot;
out vec2 vPlane;
void main() {
  vec4 shape = uShape[gl_InstanceID];
  vec2 origin = uCenter + uFrame[gl_InstanceID].xy;
  float angle = aSegment.x * 6.2831853;
  vec2 direction = vec2(cos(angle), sin(angle));
  vec3 inner = uForward * vec3(origin + direction * shape.x, 1.0);
  vec3 outer = uForward * vec3(origin + direction * (shape.x + 0.01), 1.0);
  float pixels = length(outer.xy / outer.z - inner.xy / inner.z) * 100.0 * uUnit;
  float band = uReach / max(pixels, 1e-3) + uSplit * shape.x;
  vec2 plane = origin + direction * max(shape.x + aSegment.y * band, 0.0);
  vec3 screen = uForward * vec3(plane, 1.0);
  gl_Position = vec4(screen.xy * (2.0 * uUnit / uResolution), 0.0, screen.z);
  vPlane = plane;
  vSlot = gl_InstanceID;
}`;

const COMMON = `
uniform vec2 uResolution;
uniform vec2 uScale;
uniform float uUnit;
uniform mat3 uInverse;
uniform vec2 uCenter;
uniform int uCount;
uniform vec4 uShape[SLOTS];
uniform vec4 uFrame[SLOTS];
uniform vec4 uTint[SLOTS];
uniform vec4 uHover;
uniform vec2 uBounds;
uniform float uSplit;
uniform float uOpacity;

out vec4 fragColor;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float angleOf(vec2 v) {
  vec2 a = abs(v);
  float t = min(a.x, a.y) / max(max(a.x, a.y), 1e-6);
  float r = t * (0.5 + 0.1738 * (1.0 - t));
  return a.y > a.x ? 1.0 - r : r;
}

float nearness(vec2 plane) {
  vec2 offset = plane - uHover.xy;
  return uHover.z * exp(-dot(offset, offset) * uHover.w);
}

vec3 prismOf(vec3 tint) {
  return mix(tint, vec3(dot(tint, vec3(0.3333))), 0.65) * 0.85;
}

vec4 toneMap(vec3 light) {
  float peak = max(max(light.r, light.g), light.b);
  if (peak <= 0.0) return vec4(0.0);
  float level = 1.0 - exp(-peak);
  vec3 color = mix(light * (level / peak), vec3(level), smoothstep(1.4, 3.6, peak) * 0.4);
  return vec4(color, level);
}
`;

const GLOW = `
uniform vec4 uHalo;
uniform vec3 uRange;

float haloOf(float d) {
  float fall = exp(-d * uHalo.y);
  float tight = fall * fall;
  tight *= tight;
  float window = clamp(1.0 - (d - uRange.x) * uRange.y, 0.0, 1.0);
  return (uHalo.z * tight + uHalo.w * fall) * window * window;
}

void main() {
  vec3 projected = uInverse * vec3((gl_FragCoord.xy * uScale - 0.5 * uResolution) / uUnit, 1.0);
  vec2 plane = projected.xy / projected.z;
  vec2 base = plane - uCenter;
  float reach = length(base);
  if (projected.z <= 0.0 || reach < uBounds.x || reach > uBounds.y) {
    fragColor = vec4(0.0);
    return;
  }
  float boost = 1.0 + 1.6 * nearness(plane);
  float limit = uRange.z + uSplit;
  vec3 light = vec3(0.0);
  float alpha = 0.0;

  for (int i = 0; i < SLOTS; i++) {
    if (i >= uCount) break;
    vec4 shape = uShape[i];
    vec4 frame = uFrame[i];
    vec2 w = base - frame.xy;
    float len = length(w);
    float d = abs(len - shape.x);
    if (d > limit) continue;
    float a = angleOf(vec2(dot(w, frame.zw), frame.z * w.y - frame.w * w.x));
    if (a > shape.w) continue;
    float energy = shape.y * max(exp(-shape.z * a * a * a) - 0.002, 0.0) * boost;
    vec3 tint = uTint[i].rgb;
#ifdef PRISM
    float offset = uSplit * shape.x;
    vec3 halo = vec3(haloOf(abs(len - shape.x - offset)), haloOf(d), haloOf(abs(len - shape.x + offset)));
#else
    vec3 halo = vec3(haloOf(d));
#endif
#ifdef LIGHT
    float layer = clamp(energy * dot(halo, vec3(0.3333)), 0.0, 1.0);
    light = tint * layer + light * (1.0 - layer);
    alpha = layer + alpha * (1.0 - layer);
#else
#ifdef PRISM
    tint = prismOf(tint);
#endif
    light += tint * energy * halo;
#endif
  }
#ifdef LIGHT
  fragColor = vec4(light, alpha);
#elif defined(PACKED)
  fragColor = vec4(1.0 - exp(-light), 1.0);
#else
  fragColor = vec4(light, 1.0);
#endif
}`;

const COMPOSE = `
uniform sampler2D uGlow;
uniform float uGrain;
uniform float uTime;

void main() {
  vec4 glow = texture(uGlow, gl_FragCoord.xy / uResolution);
  float grain = 1.0;
  if (uGrain > 0.0) grain += uGrain * (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 413.0) - 0.5) * 1.8;
  float dither = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
#ifdef LIGHT
  float alpha = clamp(glow.a * grain, 0.0, 1.0);
  if (alpha <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }
  vec3 ink = glow.rgb * grain;
  alpha = clamp(alpha + dither, 0.0, 1.0);
  fragColor = vec4(min(ink, vec3(alpha)), alpha) * uOpacity;
#else
#ifdef PACKED
  vec3 light = -log(1.0 - min(glow.rgb, vec3(0.9995))) * grain;
#else
  vec3 light = glow.rgb * grain;
#endif
  vec4 color = toneMap(light);
  if (color.a <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }
  float alpha = clamp(color.a + dither, 0.0, 1.0);
  fragColor = vec4(min(color.rgb, vec3(alpha)), alpha) * uOpacity;
#endif
}`;

const LINE = `
flat in int vSlot;
in vec2 vPlane;
uniform float uWidth;

float coverage(float pixels, float halfWidth) {
  return clamp(max(halfWidth, 0.5) - pixels + 0.5, 0.0, 1.0) * min(halfWidth * 2.0, 1.0);
}

void main() {
  vec4 shape = uShape[vSlot];
  vec4 frame = uFrame[vSlot];
  vec4 tint = uTint[vSlot];
  vec2 w = vPlane - uCenter - frame.xy;
  float len = length(w);
  float stretch = 1.0 / max(length(vec2(dFdx(len), dFdy(len))), 1e-6);
  float a = angleOf(vec2(dot(w, frame.zw), frame.z * w.y - frame.w * w.x));
  float near = nearness(vPlane);
  float energy = shape.y * max(exp(-shape.z * a * a * a) - 0.002, 0.0) * (1.0 + 1.6 * near) * step(a, shape.w);
  float halfWidth = uWidth * (1.0 + 0.45 * near) * max(1.0 - a, 0.5) * tint.w;
  float pixels = abs(len - shape.x) * stretch;
#ifdef PRISM
  float offset = uSplit * shape.x;
  vec3 core = vec3(
    coverage(abs(len - shape.x - offset) * stretch, halfWidth),
    coverage(pixels, halfWidth),
    coverage(abs(len - shape.x + offset) * stretch, halfWidth)
  );
#else
  vec3 core = vec3(coverage(pixels, halfWidth));
#endif
#ifdef LIGHT
  float hot = core.g * clamp(1.0 - pixels / max(halfWidth * 0.35, 0.3), 0.0, 1.0);
  float layer = energy * max(max(core.r, core.g), core.b);
  if (layer <= 0.0) discard;
#ifdef PRISM
  vec3 color = clamp(1.0 - (1.0 - tint.rgb) * core * 1.4, 0.0, 1.0);
#else
  vec3 color = tint.rgb;
#endif
  color = mix(color, vec3(1.0), hot * 0.7);
  fragColor = vec4(color * layer, layer) * uOpacity;
#else
#ifdef PRISM
  vec4 color = toneMap(prismOf(tint.rgb) * energy * core * 1.7);
#else
  vec4 color = toneMap(tint.rgb * energy * core * 1.7);
#endif
  if (color.a <= 0.0) discard;
  fragColor = color * uOpacity;
#endif
}`;

const shaderSource = (body: string, flags: string[]) =>
  [
    '#version 300 es',
    'precision highp float;',
    `#define SLOTS ${SLOTS}`,
    ...flags.map(flag => `#define ${flag}`),
    body
  ].join('\n');

const FRAGMENTS: Record<Pass, string> = { glow: GLOW, compose: COMPOSE, line: LINE };

const MOTIONS: Motion[] = ['pulse', 'ripple', 'breathe'];
const CYCLE = 3.45;
const STAGGER = 0.5;
const DEPTH = 2.6;
const BURST_LIFE = 1.1;
const BURST_SPEED = 0.9;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smoothstep = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};

const pulseLife = (t: number) => Math.min(smoothstep(0, 0.7, t), 1 - smoothstep(0.5, 3.25, t));

const toLinear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4));

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
  return [0.66, 0.33, 0.97];
};

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

const link = (gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
    if (info) uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
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

const planeFor = (tiltX: number, tiltY: number) => {
  const ax = (tiltX * Math.PI) / 180;
  const ay = (tiltY * Math.PI) / 180;
  const cx = Math.cos(ax);
  const sx = Math.sin(ax);
  const cy = Math.cos(ay);
  const sy = Math.sin(ay);
  const forward = [cy, sy * sx, 0, 0, cx, 0, (sy * cx) / DEPTH, -sx / DEPTH, 1];
  return { forward, inverse: invert(forward) };
};

const project = (m: Matrix, x: number, y: number) => {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w, w];
};

const MagicRings = ({
  color = '#A855F7',
  colorTwo = '#6366F1',
  ringCount = 6,
  motion = 'pulse',
  speed = 1,
  lineThickness = 2,
  glow = 1,
  baseRadius = 0.35,
  radiusStep = 0.1,
  expansion = 0.1,
  taper = 1.5,
  rotation = 0,
  spin = 0,
  tilt = 0,
  dispersion = 0,
  grain = 0,
  opacity = 1,
  followMouse = false,
  mouseInfluence = 0.2,
  hoverScale = 1.2,
  hoverIntensity = 1,
  parallax = 0.05,
  clickBurst = true,
  intro = true,
  theme = 'dark',
  maxDevicePixelRatio = 2,
  className = '',
  style
}: MagicRingsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const [generation, setGeneration] = useState(0);

  const light = theme === 'light';
  const first = parseColor(color);
  const second = parseColor(colorTwo);
  const settings: Settings = {
    color: light ? first : first.map(toLinear),
    colorTwo: light ? second : second.map(toLinear),
    ringCount: clamp(Math.round(ringCount), 1, MAX_RINGS),
    motion: MOTIONS.includes(motion) ? motion : 'pulse',
    speed: Math.max(0, speed),
    lineThickness: Math.max(0.25, lineThickness),
    glow: clamp(glow, 0, 3),
    baseRadius: Math.max(0.01, baseRadius),
    radiusStep: Math.max(0, radiusStep),
    expansion,
    taper: Math.max(0.5, taper),
    rotation: (rotation * Math.PI) / 180,
    spin,
    tilt: clamp(tilt, -80, 80),
    dispersion: clamp(dispersion, 0, 1),
    grain: clamp(grain, 0, 1),
    opacity: clamp(opacity, 0, 1),
    followMouse,
    mouseInfluence,
    hoverScale: Math.max(0.5, hoverScale),
    hoverIntensity: Math.max(0, hoverIntensity),
    parallax,
    clickBurst,
    intro,
    light,
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
    if (!container || !canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'default'
    });
    if (!gl) return;
    const programs = new Map<string, Program | null>();
    const programFor = (name: Pass, flags: string[]) => {
      const key = `${name}|${flags.join(',')}`;
      if (!programs.has(key)) {
        const vertex = shaderSource(name === 'line' ? STRIP : FULLSCREEN, flags);
        programs.set(key, link(gl, vertex, shaderSource(`${COMMON}${FRAGMENTS[name]}`, flags)));
      }
      return programs.get(key);
    };
    if (!programFor('glow', []) || !programFor('compose', []) || !programFor('line', [])) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vao = gl.createVertexArray();
    const stripVao = gl.createVertexArray();
    const stripBuffer = gl.createBuffer();
    const strip = new Float32Array((SEGMENTS + 1) * 4);
    for (let index = 0; index <= SEGMENTS; index++) {
      strip.set([index / SEGMENTS, -1, index / SEGMENTS, 1], index * 4);
    }
    gl.bindVertexArray(stripVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, stripBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, strip, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    const glowTexture = gl.createTexture();
    const glowBuffer = gl.createFramebuffer();
    const glowSize = { width: 0, height: 0 };
    let floatGlow = Boolean(gl.getExtension('EXT_color_buffer_float'));
    const shape = new Float32Array(SLOTS * 4);
    const frameData = new Float32Array(SLOTS * 4);
    const tints = new Float32Array(SLOTS * 4);
    const size = { width: 1, height: 1, ratio: 1, unit: 1 };
    const pointer = { x: 0, y: 0, inside: false, touch: false };
    const spring = { x: 0, y: 0, vx: 0, vy: 0, hover: 0, hoverVelocity: 0 };
    const bursts: Burst[] = [];
    let introLive = settingsRef.current.intro && settingsRef.current.speed > 0 && !reduced && generation === 0;
    let time = introLive ? 0 : 1.6;
    let clock = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let pageVisible = document.visibilityState !== 'hidden';
    let lost = false;

    const resize = () => {
      const s = settingsRef.current;
      const rect = container.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, s.maxRatio);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      Object.assign(size, { width, height, ratio, unit: Math.max(1, Math.min(width, height)) });
      const glowWidth = Math.max(1, Math.ceil(width / 2));
      const glowHeight = Math.max(1, Math.ceil(height / 2));
      if (glowSize.width === glowWidth && glowSize.height === glowHeight) return;
      Object.assign(glowSize, { width: glowWidth, height: glowHeight });
      const allocate = (useFloat: boolean) => {
        gl.bindTexture(gl.TEXTURE_2D, glowTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          useFloat ? gl.RGBA16F : gl.RGBA8,
          glowWidth,
          glowHeight,
          0,
          gl.RGBA,
          useFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
          null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, glowBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glowTexture, 0);
        const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return complete;
      };
      if (!allocate(floatGlow)) {
        floatGlow = false;
        allocate(false);
      }
    };

    const ringState = (s: Settings, index: number, count: number): RingState => {
      const mix = count > 1 ? index / (count - 1) : 0;
      if (s.motion === 'ripple') {
        const span = count * s.radiusStep + s.expansion;
        const period = CYCLE * Math.max(1, count) * 0.32;
        const phase = time / period + index / count;
        const progress = phase - Math.floor(phase);
        const born = time - progress * period >= -1e-4 || !introLive;
        const life = born ? smoothstep(0, 0.12, progress) * (1 - smoothstep(0.62, 1, progress)) : 0;
        const position = progress * Math.max(1, count - 1);
        return { radius: s.baseRadius + progress * span, life, virtual: position, mix: progress, opening: 1 };
      }
      if (s.motion === 'breathe') {
        const wave = Math.sin((time / 4) * Math.PI * 2 - index * 0.55);
        const rise = introLive ? smoothstep(index * 0.12, index * 0.12 + 0.9, time) : 1;
        return {
          radius: s.baseRadius + index * s.radiusStep + s.expansion * 0.5 * (1 + wave),
          life: (0.78 + 0.22 * wave) * rise,
          virtual: index,
          mix,
          opening: 1
        };
      }
      const local = time - index * STAGGER;
      const t = ((local % CYCLE) + CYCLE) % CYCLE;
      const life = introLive && local < 0 ? 0 : pulseLife(t);
      return {
        radius: s.baseRadius + index * s.radiusStep + (1 - Math.pow(1 - t / CYCLE, 2)) * s.expansion,
        life,
        virtual: index,
        mix,
        opening: introLive && local < CYCLE ? smoothstep(0, 0.9, local) : 1
      };
    };

    const render = () => {
      const s = settingsRef.current;
      const count = s.ringCount;
      const hover = spring.hover;
      const still = reduced ? 0 : 1;
      const scale = 1 + (s.hoverScale - 1) * hover * still;
      const mouseX = spring.x * still;
      const mouseY = spring.y * still;
      const leanX = s.tilt - mouseY * s.parallax * 260;
      const leanY = mouseX * s.parallax * 260;
      const view = planeFor(leanX, leanY);
      const center = s.followMouse ? [mouseX * s.mouseInfluence, mouseY * s.mouseInfluence] : [0, 0];
      const spinBase = s.spin * time * 0.6;

      let slots = 0;
      let lowest = Infinity;
      let highest = 0;
      let shiftMax = 0;
      const place = (
        radius: number,
        life: number,
        cut: number,
        angle: number,
        shiftX: number,
        shiftY: number,
        mix: number,
        width: number
      ) => {
        if (life <= 0.002) return;
        const gain = 10 * radius * cut * cut * cut;
        shape.set([radius, life, gain, gain > 6.2 ? Math.cbrt(6.2 / gain) : 2], slots * 4);
        frameData.set([shiftX, shiftY, Math.cos(angle), Math.sin(angle)], slots * 4);
        tints.set(
          [
            s.color[0] + (s.colorTwo[0] - s.color[0]) * mix,
            s.color[1] + (s.colorTwo[1] - s.color[1]) * mix,
            s.color[2] + (s.colorTwo[2] - s.color[2]) * mix,
            width
          ],
          slots * 4
        );
        lowest = Math.min(lowest, radius);
        highest = Math.max(highest, radius);
        shiftMax = Math.max(shiftMax, Math.hypot(shiftX, shiftY));
        slots++;
      };

      for (let index = 0; index < count; index++) {
        const state = ringState(s, index, count);
        let radius = state.radius * scale;
        let life = state.life;
        for (const burst of bursts) {
          const age = clock - burst.start;
          const wave = (burst.radius + age * BURST_SPEED) * scale;
          const fade = Math.pow(Math.max(0, 1 - age / BURST_LIFE), 1.5);
          const gap = (wave - radius) / 0.08;
          radius += 0.04 * Math.exp(-gap * gap) * fade;
          life = Math.min(1.6, life + 0.9 * Math.exp(-gap * gap * 1.6) * fade);
        }
        const cut = Math.pow(s.taper, state.virtual) / Math.max(0.08, state.opening);
        const angle = s.rotation + spinBase * (index % 2 ? -1 : 1) * (1 + index * 0.15);
        place(radius, life, cut, angle, index * s.parallax * mouseX, index * s.parallax * mouseY, state.mix, 1);
      }
      for (const burst of bursts) {
        const age = clock - burst.start;
        const fade = Math.pow(Math.max(0, 1 - age / BURST_LIFE), 1.5);
        const radius = (burst.radius + age * BURST_SPEED) * scale;
        place(radius, 1.5 * fade, 0.85, s.rotation, 0, 0, clamp(age / BURST_LIFE, 0, 1), 1.15);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!slots) return;

      const flags: string[] = [];
      if (s.light) flags.push('LIGHT');
      if (s.dispersion > 0) flags.push('PRISM');
      if (!floatGlow) flags.push('PACKED');
      const glowProgram = programFor('glow', flags);
      const composeProgram = programFor('compose', flags);
      const lineProgram = programFor('line', flags);
      if (!glowProgram || !composeProgram || !lineProgram) return;

      const glowScale = (s.light ? 0.3 : 1) * (1 - s.dispersion * 0.45);
      const outer = 0.012 + 0.033 * s.glow;
      const innerAmount = 0.5 * Math.min(1, s.glow) * glowScale;
      const outerAmount = 0.9 * s.glow * glowScale;
      const range = outer * 4.5 + 0.008;
      const split = s.dispersion * 0.03;
      const margin = range + split * highest + shiftMax + 0.01;
      const width = s.lineThickness * size.ratio;
      const reach = width * (1 + 0.45 * s.hoverIntensity) * 1.15 + 1.5;
      const cursor = project(view.inverse, pointer.x, pointer.y);

      const shared = (program: Program) => {
        const u = program.uniforms;
        gl.useProgram(program.program);
        gl.uniform2f(u.uResolution, canvas.width, canvas.height);
        gl.uniform1f(u.uUnit, size.unit);
        gl.uniform2f(u.uCenter, center[0], center[1]);
        gl.uniform1i(u.uCount, slots);
        gl.uniform4fv(u.uShape, shape);
        gl.uniform4fv(u.uFrame, frameData);
        gl.uniform4fv(u.uTint, tints);
        gl.uniform4f(u.uHover, cursor[0] - center[0], cursor[1] - center[1], hover * s.hoverIntensity, 1 / 0.03);
        gl.uniform1f(u.uSplit, split);
        gl.uniform1f(u.uOpacity, s.opacity);
        return u;
      };

      gl.bindVertexArray(vao);
      gl.bindFramebuffer(gl.FRAMEBUFFER, glowBuffer);
      gl.viewport(0, 0, glowSize.width, glowSize.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const glowUniforms = shared(glowProgram);
      gl.uniform2f(glowUniforms.uScale, canvas.width / glowSize.width, canvas.height / glowSize.height);
      gl.uniformMatrix3fv(glowUniforms.uInverse, true, view.inverse);
      gl.uniform2f(glowUniforms.uBounds, Math.max(0, lowest - margin), highest + margin);
      gl.uniform4f(glowUniforms.uHalo, 0, 1 / outer, innerAmount, outerAmount);
      gl.uniform3f(glowUniforms.uRange, range * 0.45, 1 / (range * 0.55), range);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const composeUniforms = shared(composeProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, glowTexture);
      gl.uniform1i(composeUniforms.uGlow, 0);
      gl.uniform1f(composeUniforms.uGrain, s.grain);
      gl.uniform1f(composeUniforms.uTime, clock);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      const lineUniforms = shared(lineProgram);
      gl.uniformMatrix3fv(lineUniforms.uForward, true, view.forward);
      gl.uniform1f(lineUniforms.uReach, reach);
      gl.uniform1f(lineUniforms.uWidth, width);
      gl.enable(gl.BLEND);
      if (s.light) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      else gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(stripVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (SEGMENTS + 1) * 2, slots);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
    };

    const frame = (now: number) => {
      raf = 0;
      if (lost) return;
      const s = settingsRef.current;
      const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
      last = Math.max(last, now);
      clock += dt;
      if (!reduced) time += dt * s.speed;

      const targetX = pointer.inside ? pointer.x / Math.max(1e-6, size.width / size.unit) : 0;
      const targetY = pointer.inside ? pointer.y / Math.max(1e-6, size.height / size.unit) : 0;
      const stiffness = 70;
      const damping = 2 * Math.sqrt(stiffness) * 0.9;
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      for (let step = 0; step < steps; step++) {
        spring.vx += (stiffness * (targetX - spring.x) - damping * spring.vx) * h;
        spring.vy += (stiffness * (targetY - spring.y) - damping * spring.vy) * h;
        spring.x += spring.vx * h;
        spring.y += spring.vy * h;
        const hoverTarget = pointer.inside ? 1 : 0;
        spring.hoverVelocity += (40 * (hoverTarget - spring.hover) - 2 * Math.sqrt(40) * spring.hoverVelocity) * h;
        spring.hover += spring.hoverVelocity * h;
      }

      for (let index = bursts.length - 1; index >= 0; index--) {
        if (clock - bursts[index].start > BURST_LIFE) bursts.splice(index, 1);
      }
      if (introLive && time > (s.ringCount + 2) * STAGGER + CYCLE) introLive = false;

      render();

      const settling =
        Math.abs(spring.vx) + Math.abs(spring.vy) + Math.abs(spring.hoverVelocity) > 1e-4 ||
        Math.abs((pointer.inside ? 1 : 0) - spring.hover) > 1e-3;
      const busy = (s.speed > 0 && !reduced) || settling || bursts.length > 0 || introLive;
      if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || lost || !visible || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = () => {
      resize();
      wake();
    };

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      const unit = Math.max(1, Math.min(rect.width, rect.height));
      return {
        x: (event.clientX - rect.left - rect.width / 2) / unit,
        y: (rect.top + rect.height / 2 - event.clientY) / unit,
        inside
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' && !pointer.touch) return;
      const spot = locate(event);
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = spot.inside;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const spot = locate(event);
      if (!spot.inside) return;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = true;
      pointer.touch = event.pointerType === 'touch';
      const s = settingsRef.current;
      if (s.clickBurst && !reduced) {
        bursts.push({ start: clock, radius: Math.max(0.04, s.baseRadius * 0.45) });
        if (bursts.length > MAX_BURSTS) bursts.shift();
      }
      wake();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      pointer.touch = false;
      pointer.inside = false;
      wake();
    };

    const onLeave = () => {
      pointer.inside = false;
      wake();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
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
      resize();
      wake();
    });
    resizeObserver.observe(container);

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

    resize();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        gl.deleteVertexArray(vao);
        gl.deleteTexture(glowTexture);
        gl.deleteFramebuffer(glowBuffer);
        programs.forEach(entry => entry && gl.deleteProgram(entry.program));
        gl.deleteVertexArray(stripVao);
        gl.deleteBuffer(stripBuffer);
      }
    };
  }, [generation]);

  return (
    <div ref={containerRef} className={`magic-rings${className ? ` ${className}` : ''}`} style={style}>
      <canvas ref={canvasRef} className="magic-rings__canvas" aria-hidden="true" />
    </div>
  );
};

export default MagicRings;
