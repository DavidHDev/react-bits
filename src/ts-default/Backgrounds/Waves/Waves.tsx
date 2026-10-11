'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import './Waves.css';

export type WavesLineStyle = 'solid' | 'dashed';

export interface WavesProps {
  lineColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  lineStyle?: WavesLineStyle;
  spacing?: number;
  lineWidth?: number;
  rotation?: number;
  amplitude?: number;
  scale?: number;
  twist?: number;
  speed?: number;
  variation?: number;
  mouseInteraction?: boolean;
  mouseRadius?: number;
  mouseStrength?: number;
  bounce?: number;
  returnDuration?: number;
  clickRipple?: boolean;
  intro?: boolean;
  fade?: number;
  opacity?: number;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

type Settings = {
  lineColor: string;
  accentColor: string;
  lineStyle: number;
  spacing: number;
  lineWidth: number;
  rotation: number;
  amplitude: number;
  scale: number;
  twist: number;
  speed: number;
  variation: number;
  mouseInteraction: boolean;
  mouseRadius: number;
  mouseStrength: number;
  bounce: number;
  returnDuration: number;
  clickRipple: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
};

type Ripple = { x: number; y: number; age: number; range: number };

type Front = { x: number; y: number; front: number; power: number };

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const STYLES: Record<string, number> = { solid: 0, dashed: 1 };
const CELL = 12;
const STEP = 4;
const INTRO_SECONDS = 2.2;
const RIPPLE_SPEED = 640;
const RIPPLE_WIDTH = 64;
const RIPPLE_IMPULSE = (RIPPLE_WIDTH * Math.sqrt(Math.PI / 2)) / RIPPLE_SPEED;
const MAX_VERTICES = 1600000;

const VERTEX = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uView;
uniform float uRatio;
uniform vec2 uAxis;
uniform float uSpacing;
uniform float uStep;
uniform vec2 uStart;
uniform float uAmplitude;
uniform vec2 uFrequency;
uniform vec2 uDrift;
uniform float uTwist;
uniform uint uSeed;
uniform sampler2D uField;
uniform ivec2 uFieldSize;
uniform float uCell;
uniform float uLimit;
uniform float uReach;
uniform float uReveal;
uniform float uBand;
out float vAcross;
out float vAlong;
out float vEnergy;
out float vShow;
out float vPhase;

const vec2 GRADIENTS[12] = vec2[12](
  vec2(1.0, 1.0), vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(-1.0, -1.0),
  vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(1.0, 0.0), vec2(-1.0, 0.0),
  vec2(0.0, 1.0), vec2(0.0, -1.0), vec2(0.0, 1.0), vec2(0.0, -1.0)
);

vec2 gradient(vec2 cell) {
  uvec2 q = uvec2(ivec2(cell) + 65536) + uvec2(uSeed * 7919u, uSeed * 104729u);
  q = 1103515245u * ((q >> 1u) ^ q.yx);
  uint n = 1103515245u * (q.x ^ (q.y >> 3u));
  return GRADIENTS[(n >> 16u) % 12u];
}

float ease(float t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float perlin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  float n00 = dot(gradient(i), f);
  float n10 = dot(gradient(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float n01 = dot(gradient(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float n11 = dot(gradient(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  vec2 u = vec2(ease(f.x), ease(f.y));
  return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
}

vec2 node(ivec2 cell) {
  return texelFetch(uField, clamp(cell, ivec2(0), uFieldSize - 1), 0).xy;
}

void weights(float f, out vec4 w, out vec4 d) {
  float g = 1.0 - f;
  float f2 = f * f;
  float f3 = f2 * f;
  w = vec4(g * g * g, 3.0 * f3 - 6.0 * f2 + 4.0, -3.0 * f3 + 3.0 * f2 + 3.0 * f + 1.0, f3) / 6.0;
  d = vec4(-g * g, 3.0 * f2 - 4.0 * f, -3.0 * f2 + 2.0 * f + 1.0, f2) * 0.5;
}

vec2 field(vec2 point, out mat2 slope) {
  vec2 t = point / uCell;
  vec2 base = floor(t);
  vec2 f = t - base;
  vec4 wx;
  vec4 dx;
  vec4 wy;
  vec4 dy;
  weights(f.x, wx, dx);
  weights(f.y, wy, dy);
  ivec2 origin = ivec2(base) - 1;
  vec2 value = vec2(0.0);
  vec2 alongX = vec2(0.0);
  vec2 alongY = vec2(0.0);
  for (int j = 0; j < 4; j++) {
    vec2 row = vec2(0.0);
    vec2 rowSlope = vec2(0.0);
    for (int i = 0; i < 4; i++) {
      vec2 tap = node(origin + ivec2(i, j));
      row += tap * wx[i];
      rowSlope += tap * dx[i];
    }
    value += row * wy[j];
    alongX += rowSlope * wy[j];
    alongY += row * dy[j];
  }
  float size = length(value);
  float scale = size > 0.0001 ? uLimit * tanh(size / uLimit) / size : 1.0;
  slope = mat2(alongX, alongY) * (scale / uCell);
  return value * scale;
}

vec2 wave(vec2 rest) {
  float turn = perlin(rest * uFrequency + uDrift) * 12.0 * uTwist;
  vec2 local = rest + vec2(cos(turn), sin(turn) * 0.5) * uAmplitude;
  return uView * 0.5 + vec2(local.x * uAxis.x - local.y * uAxis.y, local.x * uAxis.y + local.y * uAxis.x);
}

void main() {
  int index = gl_VertexID >> 1;
  float side = float(gl_VertexID & 1) * 2.0 - 1.0;
  float u = uStart.x + float(gl_InstanceID) * uSpacing;
  float v = uStart.y + float(index) * uStep;
  vec2 flowing = wave(vec2(u, v));
  vec2 bend = wave(vec2(u, v + uStep)) - wave(vec2(u, v - uStep));
  mat2 slope;
  vec2 shift = field(flowing, slope);
  vec2 point = flowing + shift;
  float energy = length(shift);
  vec2 tangent = bend + slope * bend;
  float span = max(length(tangent), 0.0001);
  vec2 normal = vec2(-tangent.y, tangent.x) / span;
  vec2 corner = point + normal * side * uReach / uRatio;
  vAcross = side * uReach;
  vAlong = v;
  vEnergy = energy;
  vShow = clamp((uReveal - abs(u)) / uBand, 0.0, 1.0);
  uint line = uint(gl_InstanceID) * 747796405u + uSeed * 2891336453u + 1u;
  line = ((line >> ((line >> 28u) + 4u)) ^ line) * 277803737u;
  vPhase = float((line >> 22u) ^ line) / 4294967295.0;
  vec2 clip = corner / uView * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uView;
uniform float uRatio;
uniform float uHalf;
uniform float uThin;
uniform int uStyle;
uniform float uPeriod;
uniform float uFlow;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uBase;
uniform float uHeat;
uniform float uFade;
uniform float uOpacity;
in float vAcross;
in float vAlong;
in float vEnergy;
in float vShow;
in float vPhase;
out vec4 outColor;

float smootherstep(float edge, float x) {
  float t = clamp(x / max(edge, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  float coverage = clamp(uHalf + 0.5 - abs(vAcross), 0.0, 1.0) * uThin;
  if (uStyle == 1) {
    float phase = (vAlong + uFlow) / uPeriod + vPhase;
    float blur = max(fwidth(phase), 0.0001);
    coverage *= clamp((0.25 - abs(fract(phase) - 0.5)) / blur + 0.5, 0.0, 1.0);
  }
  float heat = smoothstep(0.0, uHeat, vEnergy);
  vec2 uv = gl_FragCoord.xy / (uView * uRatio);
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  float alpha = coverage * mix(uBase, 1.0, heat) * mask * vShow * uOpacity;
  outColor = vec4(mix(uColor, uAccent, heat) * alpha, alpha);
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smootherstep = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
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

const link = (gl: WebGL2RenderingContext): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
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
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const Waves = ({
  lineColor = '#ffffff',
  accentColor,
  backgroundColor = 'transparent',
  lineStyle = 'solid',
  spacing = 10,
  lineWidth = 1,
  rotation = 0,
  amplitude = 32,
  scale = 1,
  twist = 1,
  speed = 1,
  variation = 0,
  mouseInteraction = true,
  mouseRadius = 175,
  mouseStrength = 1,
  bounce = 0.5,
  returnDuration = 1.4,
  clickRipple = true,
  intro = true,
  fade = 0,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  style
}: WavesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    lineColor: String(lineColor),
    accentColor: accentColor ? String(accentColor) : '',
    lineStyle: STYLES[lineStyle] ?? 0,
    spacing: Math.max(2, spacing),
    lineWidth: Math.max(0.25, lineWidth),
    rotation,
    amplitude: Math.max(0, amplitude),
    scale: Math.max(0.05, scale),
    twist: Math.max(0, twist),
    speed,
    variation: Math.max(0, Math.round(variation)),
    mouseInteraction,
    mouseRadius: Math.max(20, mouseRadius),
    mouseStrength: Math.max(0, mouseStrength),
    bounce: clamp(bounce, 0, 1),
    returnDuration: Math.max(0.2, returnDuration),
    clickRipple,
    intro,
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

    const program = link(gl);
    if (!program) return undefined;
    const u = program.uniforms;

    const vao = gl.createVertexArray();
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const colors = new Map<string, number[]>();
    const parse = (value: string): number[] => {
      const cached = colors.get(value);
      if (cached) return cached;
      let rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#ffffff';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r / 255, g / 255, b / 255];
      }
      colors.set(value, rgb);
      return rgb;
    };
    const ink = (rgb: number[]): number[] => {
      const linear = rgb.map(v => Math.pow(v, 2.2));
      const tone = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      const depth = Math.min(1, 0.045 / Math.max(tone, 0.0001));
      return linear.map(v => Math.pow(v * depth, 1 / 2.2));
    };

    const view = { width: 1, height: 1, ratio: 1 };
    const grid = {
      cols: 0,
      rows: 0,
      shift: new Float32Array(0),
      speed: new Float32Array(0),
      top: 0,
      bottom: -1,
      left: 0,
      right: -1
    };
    const pointer = { x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0, inside: false };
    const ripples: Ripple[] = [];
    const state = { flow: 0, intro: settingsRef.current.intro && !reduce ? 0 : 1 };
    let raf = 0;
    let last = 0;
    let visible = true;

    const limitOf = (s: Settings) => Math.max(12, s.mouseRadius * 0.5);

    const rebuild = () => {
      grid.cols = Math.ceil(view.width / CELL) + 2;
      grid.rows = Math.ceil(view.height / CELL) + 2;
      grid.shift = new Float32Array(grid.cols * grid.rows * 2);
      grid.speed = new Float32Array(grid.cols * grid.rows * 2);
      grid.top = 0;
      grid.bottom = -1;
      grid.left = 0;
      grid.right = -1;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, grid.cols, grid.rows, 0, gl.RG, gl.FLOAT, grid.shift);
    };

    const include = (x0: number, y0: number, x1: number, y1: number) => {
      const c0 = clamp(Math.floor(x0 / CELL), 0, grid.cols - 1);
      const c1 = clamp(Math.ceil(x1 / CELL), 0, grid.cols - 1);
      const r0 = clamp(Math.floor(y0 / CELL), 0, grid.rows - 1);
      const r1 = clamp(Math.ceil(y1 / CELL), 0, grid.rows - 1);
      const empty = grid.bottom < grid.top;
      grid.top = empty ? r0 : Math.min(grid.top, r0);
      grid.bottom = empty ? r1 : Math.max(grid.bottom, r1);
      grid.left = empty ? c0 : Math.min(grid.left, c0);
      grid.right = empty ? c1 : Math.max(grid.right, c1);
    };

    const simulate = (dt: number) => {
      const s = settingsRef.current;
      const follow = 1 - Math.exp(-dt / 0.045);
      const nx = pointer.sx + (pointer.x - pointer.sx) * follow;
      const ny = pointer.sy + (pointer.y - pointer.sy) * follow;
      const blend = 1 - Math.exp(-dt / 0.06);
      pointer.vx += ((nx - pointer.sx) / dt - pointer.vx) * blend;
      pointer.vy += ((ny - pointer.sy) / dt - pointer.vy) * blend;
      pointer.sx = nx;
      pointer.sy = ny;

      const zeta = 1 - 0.85 * s.bounce;
      const omega = 4 / (zeta * s.returnDuration);
      const radius = s.mouseRadius;
      const speedNow = Math.hypot(pointer.vx, pointer.vy);
      const drive =
        s.mouseInteraction && pointer.inside && !reduce ? 26000 * Math.tanh(speedNow / 1400) * s.mouseStrength : 0;
      if (drive > 1) include(pointer.sx - radius, pointer.sy - radius, pointer.sx + radius, pointer.sy + radius);

      const live: Front[] = [];
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.age += dt;
        const front = ripple.age * RIPPLE_SPEED;
        const life = 1 - front / ripple.range;
        if (life <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        const reach = front + RIPPLE_WIDTH * 3;
        include(ripple.x - reach, ripple.y - reach, ripple.x + reach, ripple.y + reach);
        live.push({
          x: ripple.x,
          y: ripple.y,
          front,
          power: (150 * omega * life * Math.sqrt(life)) / RIPPLE_IMPULSE
        });
      }

      if (grid.bottom < grid.top) return false;

      const stiffness = omega * omega;
      const damping = 2 * zeta * omega;
      const steps = Math.min(16, Math.max(1, Math.ceil(dt / Math.min(1 / 120, 0.6 / omega))));
      const h = dt / steps;
      const dirX = speedNow > 0.001 ? pointer.vx / speedNow : 0;
      const dirY = speedNow > 0.001 ? pointer.vy / speedNow : 0;
      const { cols, shift, speed: velocity, left, right } = grid;
      let peak = 0;

      for (let row = grid.top; row <= grid.bottom; row++) {
        const y = row * CELL;
        for (let col = left; col <= right; col++) {
          const x = col * CELL;
          const index = (row * cols + col) * 2;
          let ax = 0;
          let ay = 0;
          if (drive > 1) {
            const distance = Math.hypot(x - pointer.sx, y - pointer.sy);
            if (distance < radius) {
              const weight = smootherstep(1 - distance / radius) * drive;
              ax += dirX * weight;
              ay += dirY * weight;
            }
          }
          for (const ripple of live) {
            const ex = x - ripple.x;
            const ey = y - ripple.y;
            const distance = Math.hypot(ex, ey);
            const offset = (distance - ripple.front) / RIPPLE_WIDTH;
            if (distance > 0.001 && Math.abs(offset) < 3) {
              const push = ripple.power * Math.exp(-offset * offset * 2) * smootherstep(distance / 56);
              ax += (ex / distance) * push;
              ay += (ey / distance) * push;
            }
          }
          let px = shift[index];
          let py = shift[index + 1];
          let vx = velocity[index];
          let vy = velocity[index + 1];
          for (let k = 0; k < steps; k++) {
            vx += (ax - stiffness * px - damping * vx) * h;
            vy += (ay - stiffness * py - damping * vy) * h;
            px += vx * h;
            py += vy * h;
          }
          shift[index] = px;
          shift[index + 1] = py;
          velocity[index] = vx;
          velocity[index + 1] = vy;
          peak = Math.max(peak, Math.abs(px) + Math.abs(py) + (Math.abs(vx) + Math.abs(vy)) * 0.05);
        }
      }

      const top = grid.top;
      const height = grid.bottom - grid.top + 1;
      if (peak < 0.02 && drive <= 1 && !live.length) {
        for (let row = grid.top; row <= grid.bottom; row++) {
          shift.fill(0, (row * cols + left) * 2, (row * cols + right + 1) * 2);
          velocity.fill(0, (row * cols + left) * 2, (row * cols + right + 1) * 2);
        }
        grid.top = 0;
        grid.bottom = -1;
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        top,
        cols,
        height,
        gl.RG,
        gl.FLOAT,
        shift.subarray(top * cols * 2, (top + height) * cols * 2)
      );
      return grid.bottom >= grid.top;
    };

    const render = () => {
      const s = settingsRef.current;
      const angle = (s.rotation * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const limit = limitOf(s);
      const margin = s.amplitude * 1.1 + limit + s.spacing * 2 + 8;
      const reachU = (view.width * Math.abs(cos) + view.height * Math.abs(sin)) / 2 + margin;
      const reachV = (view.width * Math.abs(sin) + view.height * Math.abs(cos)) / 2 + margin;
      const half = Math.ceil(reachU / s.spacing);
      const lines = half * 2 + 1;
      let step = STEP;
      let samples = Math.ceil((reachV * 2) / step) + 1;
      if (lines * samples * 2 > MAX_VERTICES) {
        samples = Math.max(16, Math.floor(MAX_VERTICES / (lines * 2)));
        step = (reachV * 2) / (samples - 1);
      }
      const width = s.lineWidth * view.ratio;
      const halfWidth = Math.max(0.5, width / 2);
      const reach = halfWidth + 1;
      const progress = state.intro;
      const reveal = s.intro && !reduce ? (1 - Math.pow(1 - clamp(progress / 0.7, 0, 1), 3)) * reachU * 1.3 : 1e6;
      const swell = s.intro && !reduce ? smootherstep((progress - 0.1) / 0.9) : 1;
      const base = parse(s.lineColor);
      const tone = s.lightMode ? ink(base) : base;
      const accent = s.accentColor ? parse(s.accentColor) : tone;
      const flowTime = state.flow + s.variation * 37.1;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program.program);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(u.uField, 0);
      gl.uniform2f(u.uView, view.width, view.height);
      gl.uniform1f(u.uRatio, view.ratio);
      gl.uniform2f(u.uAxis, cos, sin);
      gl.uniform1f(u.uSpacing, s.spacing);
      gl.uniform1f(u.uStep, step);
      gl.uniform2f(u.uStart, -half * s.spacing, -reachV);
      gl.uniform1f(u.uAmplitude, s.amplitude * swell);
      gl.uniform2f(u.uFrequency, 0.002 / s.scale, 0.0015 / s.scale);
      gl.uniform2f(u.uDrift, flowTime * 0.025, flowTime * 0.0075);
      gl.uniform1f(u.uTwist, s.twist);
      gl.uniform1ui(u.uSeed, s.variation);
      gl.uniform2i(u.uFieldSize, grid.cols, grid.rows);
      gl.uniform1f(u.uCell, CELL);
      gl.uniform1f(u.uLimit, limit);
      gl.uniform1f(u.uReach, reach);
      gl.uniform1f(u.uReveal, reveal);
      gl.uniform1f(u.uBand, Math.max(1, reachU * 0.3));
      gl.uniform1f(u.uHalf, halfWidth);
      gl.uniform1f(u.uThin, Math.min(1, width));
      gl.uniform1i(u.uStyle, s.lineStyle);
      gl.uniform1f(u.uPeriod, s.spacing * 2.6);
      gl.uniform1f(u.uFlow, (state.flow * 16) % (s.spacing * 2.6));
      gl.uniform3fv(u.uColor, tone);
      gl.uniform3fv(u.uAccent, accent);
      gl.uniform1f(u.uBase, 0.62);
      gl.uniform1f(u.uHeat, limit * 0.55);
      gl.uniform1f(u.uFade, s.fade);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, samples * 2, lines);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
      last = now;
      if (s.paused) {
        state.intro = 1;
        render();
        last = 0;
        return;
      }
      if (!reduce) state.flow += dt * s.speed;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
      const awake = simulate(dt);
      render();
      const engaged = pointer.inside && s.mouseInteraction && Math.hypot(pointer.vx, pointer.vy) > 1;
      if (!reduce || awake || engaged || ripples.length || state.intro < 1) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      view.width = width;
      view.height = height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      view.ratio = canvas.width / width;
      rebuild();
      render();
      wake();
    };

    const place = (event: PointerEvent, snap: boolean) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      if (snap || (inside && !pointer.inside)) {
        pointer.sx = x;
        pointer.sy = y;
        pointer.vx = 0;
        pointer.vy = 0;
      }
      pointer.inside = inside;
      pointer.x = x;
      pointer.y = y;
      return { x, y, rect, inside };
    };

    const onPointerMove = (event: PointerEvent) => {
      place(event, false);
      if (!settingsRef.current.paused) wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      const { x, y, rect, inside } = place(event, event.pointerType !== 'mouse');
      if (inside && s.clickRipple && !s.paused && !reduce) {
        ripples.push({ x, y, age: 0, range: Math.max(360, Math.hypot(rect.width, rect.height) * 0.55) });
        if (ripples.length > 6) ripples.shift();
      }
      wake();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') pointer.inside = false;
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
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    let lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.dpr !== lastDpr) {
        lastDpr = s.dpr;
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
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteProgram(program.program);
      gl.deleteVertexArray(vao);
      gl.deleteTexture(texture);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={containerRef}
      className={`waves${className ? ` ${className}` : ''}`}
      style={{ backgroundColor, ...style }}
    >
      <canvas ref={canvasRef} className="waves__canvas" aria-hidden="true" />
    </div>
  );
};

export default Waves;
