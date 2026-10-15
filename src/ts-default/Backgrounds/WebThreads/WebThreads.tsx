'use client';

import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import './WebThreads.css';

export interface WebThreadsProps {
  colors?: string[];
  coreColor?: string;
  backgroundColor?: string;
  lightMode?: boolean;
  threadCount?: number;
  speed?: number;
  frequency?: number;
  spread?: number;
  taper?: number;
  position?: number;
  pinch?: number;
  nodes?: number;
  angle?: number;
  glow?: number;
  falloff?: number;
  thickness?: number;
  brightness?: number;
  opacity?: number;
  depth?: number;
  pulses?: number;
  mirror?: boolean;
  shimmer?: boolean;
  fade?: number;
  grain?: number;
  intro?: boolean;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  pulseOnClick?: boolean;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

type RGB = [number, number, number];

interface Surge {
  x: number;
  direction: number;
  at: number;
}

interface Shape {
  nodes: number;
  pinch: number;
  mirror: boolean;
  spread: number;
  shimmer: boolean;
  frequency: number;
  count: number;
  taper: number;
  position: number;
}

const ROOT = 'web-threads-container';
const CANVAS = 'web-threads-canvas';

const MAX_THREADS = 24;
const MAX_COLORS = 6;
const MAX_SURGES = 3;
const SURGE_SECONDS = 1.6;
const SURGE_STAGGER = 0.05;
const STROKE_SECONDS = 1.25;
const TAU = Math.PI * 2;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uPhase;
uniform float uClock;
uniform int uCount;
uniform float uFrequency;
uniform float uSpread;
uniform float uTaper;
uniform float uPosition;
uniform float uPinch;
uniform float uNodes;
uniform vec2 uAngle;
uniform float uGlow;
uniform float uFalloff;
uniform float uThickness;
uniform float uBrightness;
uniform float uOpacity;
uniform float uMirror;
uniform float uShimmer;
uniform float uDepth;
uniform float uPulses;
uniform float uFade;
uniform float uGrain;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform vec3 uCore;
uniform vec3 uBackground;
uniform float uOpaque;
uniform float uLight;
uniform vec4 uIntro;
uniform float uFocus[${MAX_THREADS}];
uniform vec2 uFocusState;
uniform vec4 uSurges[${MAX_SURGES}];
out vec4 outColor;

const float PI = 3.14159265;
const float TAU = 6.28318530;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float easeInOut(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5;
}

vec3 palette(float t) {
  if (uColorCount <= 1) return uColors[0];
  float scaled = clamp(t, 0.0, 1.0) * float(uColorCount - 1);
  int index = int(min(floor(scaled), float(uColorCount - 2)));
  return mix(uColors[index], uColors[index + 1], scaled - float(index));
}

vec2 envelope(float x) {
  float dx = x - uPinch;
  if (uNodes <= 1.0) return vec2(uSpread * abs(dx), uSpread * sign(dx));
  float k = PI * uNodes;
  float c = cos(k * (dx + 0.5));
  return vec2(uSpread * 0.5 * abs(c), -uSpread * 0.5 * k * sin(k * (dx + 0.5)) * sign(c));
}

vec2 space(vec2 p, float aspect) {
  vec2 q = (p - 0.5) * vec2(aspect, 1.0);
  q = vec2(q.x * uAngle.x + q.y * uAngle.y, -q.x * uAngle.y + q.y * uAngle.x);
  return vec2(q.x / aspect + 0.5, q.y + 0.5);
}

float hubAt(float x) {
  if (uNodes <= 1.0) return uPinch;
  float spacing = 1.0 / uNodes;
  return uPinch - 0.5 + (floor((x - uPinch + 0.5) / spacing) + 0.5) * spacing;
}

vec3 thread(float x, float i, float n) {
  float lane = uNodes <= 1.0 ? x - uPinch : (x - uPinch + 0.5) * uNodes - 0.5;
  float side = uMirror > 0.5 ? (mod(floor(lane), 2.0) < 0.5 ? -1.0 : 1.0) : 1.0;
  vec2 env = envelope(x);
  float amp = 1.0 + i * uTaper;
  float shimmer = uShimmer > 0.5 ? sin(uClock * 1.7 + i * 1.3) * 0.35 : 0.0;
  float angle = x * uFrequency + (uPhase + i * TAU / max(n, 1.0)) * side + shimmer;
  float wave = sin(angle);
  float y = uPosition - env.x * amp * wave;
  float slope = -(env.y * amp * wave + env.x * amp * cos(angle) * uFrequency);
  return vec3(y, slope, angle);
}

void main() {
  vec2 p = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 s = space(p, aspect);
  float x = s.x;
  float y = s.y;
  float n = float(uCount);
  float pixel = 1.0 / uResolution.y;
  float hub = hubAt(x);
  float presence = uFocusState.x;
  float settle = uFocusState.y;

  vec3 color = vec3(0.0);
  float energy = 0.0;
  float ink = 0.0;
  vec3 inkColor = vec3(0.0);

  for (int idx = 0; idx < ${MAX_THREADS}; idx++) {
    if (idx >= uCount) break;
    float i = float(idx);
    float ci = n > 1.0 ? i / (n - 1.0) : 0.0;

    float head = 2.0;
    float bead = 0.0;
    float born = 1.0;
    if (uIntro.w > 0.5) {
      float progress = clamp((uIntro.x - i * uIntro.y) / uIntro.z, 0.0, 1.0);
      head = mix(-0.06, 1.06, easeInOut(progress));
      bead = sin(PI * progress);
      born = progress > 0.0 ? smoothstep(-0.05, 0.03, head) : 0.0;
    }
    if (born <= 0.0) continue;

    bool tip = x > head;
    vec3 lead = bead > 0.0 || tip ? thread(head, i, n) : vec3(0.0);
    vec3 t = tip ? lead : thread(x, i, n);

    float focus = uFocus[idx];
    float spot = tip ? head : x;
    float twist = uDepth * smoothstep(0.0, 0.07, abs(spot - hubAt(spot)));
    float depth = 0.5 + 0.5 * cos(t.z);
    float front = mix(1.0, 0.3 + 0.7 * depth, twist);
    float width = uThickness * mix(1.0, 0.55 + 0.7 * depth, twist) * (1.0 + 0.3 * focus * presence);

    float d;
    if (tip) {
      float back = head - 0.02;
      vec2 a = vec2(back * aspect, thread(back, i, n).x);
      vec2 b = vec2(head * aspect, lead.x);
      vec2 pa = vec2(x * aspect, y) - a;
      vec2 ba = b - a;
      d = length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0));
    } else {
      float bend = t.y * smoothstep(0.0, 0.04, abs(x - hub));
      d = abs(y - t.x) / sqrt(1.0 + bend * bend / (aspect * aspect));
    }
    float g = uGlow / pow(max(d / width, pixel * 0.35), uFalloff) * front * born;
    float onLine = exp(-d / (width * 0.012));

    if (bead > 0.0) {
      vec2 near = vec2((x - head) * aspect, y - lead.x);
      g *= 1.0 + bead * 1.6 * exp(-dot(near, near) / 0.0025);
    }

    float light = 0.0;
    for (int k = 0; k < ${MAX_SURGES}; k++) {
      vec4 surge = uSurges[k];
      if (surge.w <= 0.0) continue;
      float progress = clamp((surge.y - i * ${SURGE_STAGGER.toFixed(3)}) / ${SURGE_SECONDS.toFixed(2)}, 0.0, 1.0);
      if (progress <= 0.0 || progress >= 1.0) continue;
      float lead = mix(surge.x, surge.z > 0.0 ? 1.12 : -0.12, easeInOut(progress));
      float along = (x - lead) * surge.z * aspect;
      float trail = along < 0.0 ? exp(along / 0.24) : exp(-along * along / 0.0009);
      light += trail * sin(PI * progress);
    }
    g *= 1.0 + light * (0.12 + 2.8 * onLine);

    if (uPulses > 0.0) {
      float travel = abs(x - hub);
      float pulse = pow(0.5 + 0.5 * sin(travel * 16.0 + uClock * 2.2 + i * 1.9), 24.0);
      g *= 1.0 + uPulses * 5.0 * pulse * onLine;
    }

    float sheen = pow(0.5 + 0.5 * sin(abs(x - hub) * 11.0 + uClock * 1.4), 10.0);
    float lift = focus * presence;
    g *= (1.0 - settle * (1.0 - focus)) * (1.0 + lift * (0.9 + 1.4 * sheen * onLine));

    vec3 tint = mix(palette(ci), uCore, 0.3 * lift);
    color += g * tint;
    energy += g;
    float stroke = smoothstep(0.45, 1.3, g);
    inkColor += tint * stroke;
    ink += stroke;
  }

  float fade = 1.0;
  if (uFade > 0.0) {
    float edge = min(x, 1.0 - x);
    float f = clamp(edge / max(uFade * 0.5, 0.001), 0.0, 1.0);
    fade = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  }
  float core = smoothstep(0.5, 2.2, energy);
  color = mix(color, uCore * energy, core * 0.5);
  color *= uBrightness * fade;
  float alpha = clamp(energy * fade, 0.0, 1.0) * uOpacity;
  float grain = (hash(gl_FragCoord.xy + fract(uClock) * 97.0) - 0.5) * uGrain;

  if (uLight < 0.5) {
    vec3 rgb = max(color * alpha * (1.0 + grain * 2.0), 0.0);
    if (uOpaque > 0.5) {
      outColor = vec4(min(uBackground * (1.0 - alpha) + rgb, 1.0), 1.0);
    } else {
      outColor = vec4(rgb, alpha);
    }
  } else {
    ink *= fade;
    vec3 hue = ink > 0.0001 ? inkColor / ink : palette(0.5);
    float body = clamp(ink, 0.0, 1.0);
    float haze = clamp(1.0 - exp(-energy * fade * 0.3), 0.0, 1.0) * 0.12;
    float focal = smoothstep(2.0, 9.0, energy * fade) * 0.25;
    float cover = clamp((body * 0.9 + (haze + focal) * (1.0 - body)) * (1.0 + grain * 2.0), 0.0, 0.95) * uOpacity;
    vec3 stroke = hue;
    if (uOpaque > 0.5) {
      outColor = vec4(mix(uBackground, stroke, cover), 1.0);
    } else {
      outColor = vec4(stroke * cover, cover);
    }
  }
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const mod = (value: number, base: number) => ((value % base) + base) % base;

let probe: CanvasRenderingContext2D | null = null;

const parseColor = (value: string, fallback: RGB | null): RGB | null => {
  if (value === 'transparent') return null;
  if (typeof document === 'undefined') return fallback;
  if (!probe) probe = document.createElement('canvas').getContext('2d');
  if (!probe) return fallback;
  probe.fillStyle = '#000000';
  probe.fillStyle = value;
  const text = probe.fillStyle;
  if (text.startsWith('#')) {
    const hex = parseInt(text.slice(1), 16);
    return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
  }
  const match = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(text);
  if (!match) return fallback;
  if (match[4] !== undefined && Number(match[4]) === 0) return null;
  return [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255];
};

const staggerFor = (count: number) => Math.min(0.12, 0.9 / Math.max(count - 1, 1));

const toThreadSpace = (point: number[], aspect: number, angle: number) => {
  const qx = (point[0] - 0.5) * aspect;
  const qy = 0.5 - point[1];
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [(qx * cos + qy * sin) / aspect + 0.5, -qx * sin + qy * cos + 0.5];
};

const threadY = (s: Shape, x: number, index: number, phase: number, clock: number) => {
  const lane = s.nodes <= 1 ? x - s.pinch : (x - s.pinch + 0.5) * s.nodes - 0.5;
  const side = s.mirror ? (mod(Math.floor(lane), 2) < 0.5 ? -1 : 1) : 1;
  const dx = x - s.pinch;
  const env =
    s.nodes <= 1 ? s.spread * Math.abs(dx) : s.spread * 0.5 * Math.abs(Math.cos(Math.PI * s.nodes * (dx + 0.5)));
  const shimmer = s.shimmer ? Math.sin(clock * 1.7 + index * 1.3) * 0.35 : 0;
  const angle = x * s.frequency + (phase + (index * TAU) / Math.max(s.count, 1)) * side + shimmer;
  return s.position - env * (1 + index * s.taper) * Math.sin(angle);
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const prefersReduced = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

export default function WebThreads({
  colors = ['#5227FF', '#FF9FFC'],
  coreColor = '#FFFFFF',
  backgroundColor = 'transparent',
  lightMode = false,
  threadCount = 6,
  speed = 0.2,
  frequency = 5,
  spread = 0.18,
  taper = 1,
  position = 0.5,
  pinch = 0.5,
  nodes = 1,
  angle = 0,
  glow = 0.02,
  falloff = 0.6,
  thickness = 1.1,
  brightness = 0.6,
  opacity = 1,
  depth = 0,
  pulses = 0,
  mirror = true,
  shimmer = false,
  fade = 0,
  grain = 0.05,
  intro = true,
  mouseInteraction = true,
  mouseStrength = 0.5,
  pulseOnClick = true,
  paused = false,
  dpr = 2,
  className = '',
  style
}: WebThreadsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorKey = colors.join('|');
  const palette = useMemo(
    () =>
      colorKey
        .split('|')
        .slice(0, MAX_COLORS)
        .map((value): RGB => parseColor(value, [1, 1, 1]) ?? [1, 1, 1]),
    [colorKey]
  );
  const core = useMemo((): RGB => parseColor(coreColor, [1, 1, 1]) ?? [1, 1, 1], [coreColor]);
  const paper = useMemo(() => parseColor(backgroundColor, null), [backgroundColor]);

  const settings = {
    palette: palette.length ? palette : [[1, 1, 1]],
    core,
    paper,
    lightMode,
    count: clamp(Math.round(threadCount), 1, MAX_THREADS),
    speed,
    frequency,
    spread,
    taper,
    position,
    pinch,
    nodes: clamp(Math.round(nodes), 1, 6),
    angle: (angle * Math.PI) / 180,
    glow: Math.max(0, glow),
    falloff: Math.max(0.05, falloff),
    thickness: Math.max(0.05, thickness),
    brightness: Math.max(0, brightness),
    opacity: clamp(opacity, 0, 1),
    depth: clamp(depth, 0, 1),
    pulses: Math.max(0, pulses),
    mirror,
    shimmer,
    fade: clamp(fade, 0, 1),
    grain: typeof grain === 'number' ? Math.max(0, grain) : grain ? 0.05 : 0,
    intro,
    mouseInteraction,
    mouseStrength: clamp(mouseStrength, 0, 1),
    pulseOnClick,
    paused,
    dpr: Math.max(0.5, dpr)
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const canvas = document.createElement('canvas');
    canvas.className = CANVAS;
    container.appendChild(canvas);
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'high-performance'
    });
    if (!gl) {
      canvas.remove();
      return undefined;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      canvas.remove();
      return undefined;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      canvas.remove();
      return undefined;
    }
    const names = [
      'uResolution',
      'uPhase',
      'uClock',
      'uCount',
      'uFrequency',
      'uSpread',
      'uTaper',
      'uPosition',
      'uPinch',
      'uNodes',
      'uAngle',
      'uGlow',
      'uFalloff',
      'uThickness',
      'uBrightness',
      'uOpacity',
      'uMirror',
      'uShimmer',
      'uDepth',
      'uPulses',
      'uFade',
      'uGrain',
      'uColors',
      'uColorCount',
      'uCore',
      'uBackground',
      'uOpaque',
      'uLight',
      'uIntro',
      'uFocus',
      'uFocusState',
      'uSurges'
    ];
    const u: Record<string, WebGLUniformLocation | null> = {};
    names.forEach(name => {
      u[name] = gl.getUniformLocation(program, name);
    });

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);

    const colorData = new Float32Array(MAX_COLORS * 3);
    const surgeData = new Float32Array(MAX_SURGES * 4);
    const focus = new Float32Array(MAX_THREADS);
    const state = {
      width: 1,
      height: 1,
      phase: 0,
      clock: 0,
      last: 0,
      raf: 0,
      visible: false,
      introAt: -1,
      pointer: [0.5, 0.5],
      inside: false,
      presence: 0,
      settle: 0,
      target: -1,
      surges: [] as Surge[],
      quiet: 0,
      seen: null as typeof settings | null
    };

    const resize = () => {
      const s = settingsRef.current;
      const ratio = Math.min(window.devicePixelRatio || 1, s.dpr);
      const width = Math.max(1, Math.round(container.clientWidth * ratio));
      const height = Math.max(1, Math.round(container.clientHeight * ratio));
      if (width === state.width && height === state.height) return;
      state.quiet = 0;
      state.width = width;
      state.height = height;
      canvas.width = width;
      canvas.height = height;
    };

    const introLength = (s: typeof settings) => (s.count - 1) * staggerFor(s.count) + STROKE_SECONDS;

    const updateFocus = (s: typeof settings, dt: number, reduced: boolean) => {
      const wanted = s.mouseInteraction && state.inside;
      if (wanted) {
        const aspect = state.width / Math.max(state.height, 1);
        const [cx, cy] = toThreadSpace(state.pointer, aspect, s.angle);
        let best = -1;
        let bestDistance = Infinity;
        for (let index = 0; index < s.count; index++) {
          const distance = Math.abs(threadY(s, cx, index, state.phase, reduced ? 0 : state.clock) - cy);
          const reach = index === state.target ? 0.11 : 0.085;
          if (distance < reach && distance < bestDistance) {
            best = index;
            bestDistance = distance;
          }
        }
        state.target = best;
      } else {
        state.target = -1;
      }
      const ease = 1 - Math.exp(-dt / 0.22);
      let strongest = 0;
      for (let index = 0; index < MAX_THREADS; index++) {
        const goal = index === state.target ? 1 : 0;
        focus[index] += (goal - focus[index]) * ease;
        strongest = Math.max(strongest, focus[index]);
      }
      state.presence += ((wanted ? 1 : 0) - state.presence) * (1 - Math.exp(-dt / 0.3));
      const settleGoal = s.mouseStrength * 0.65 * strongest * state.presence;
      state.settle += (settleGoal - state.settle) * (1 - Math.exp(-dt / 0.3));
      return strongest > 0.002 || state.presence > 0.002 || state.settle > 0.002;
    };

    const render = (reduced: boolean) => {
      const s = settingsRef.current;
      const introClock = state.introAt < 0 ? 0 : state.clock - state.introAt;
      const introRunning = s.intro && !reduced && introClock < introLength(s);
      gl.viewport(0, 0, state.width, state.height);
      gl.uniform2f(u.uResolution, state.width, state.height);
      gl.uniform1f(u.uPhase, state.phase);
      gl.uniform1f(u.uClock, reduced ? 0 : state.clock);
      gl.uniform1i(u.uCount, s.count);
      gl.uniform1f(u.uFrequency, s.frequency);
      gl.uniform1f(u.uSpread, s.spread);
      gl.uniform1f(u.uTaper, s.taper);
      gl.uniform1f(u.uPosition, s.position);
      gl.uniform1f(u.uPinch, s.pinch);
      gl.uniform1f(u.uNodes, s.nodes);
      gl.uniform2f(u.uAngle, Math.cos(s.angle), Math.sin(s.angle));
      gl.uniform1f(u.uGlow, s.glow * Math.sqrt(6 / Math.max(s.count, 6)));
      gl.uniform1f(u.uFalloff, s.falloff);
      gl.uniform1f(u.uThickness, s.thickness);
      gl.uniform1f(u.uBrightness, s.brightness);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.uniform1f(u.uMirror, s.mirror ? 1 : 0);
      gl.uniform1f(u.uShimmer, s.shimmer && !reduced ? 1 : 0);
      gl.uniform1f(u.uDepth, s.depth);
      gl.uniform1f(u.uPulses, s.pulses);
      gl.uniform1f(u.uFade, s.fade);
      gl.uniform1f(u.uGrain, s.grain);
      colorData.fill(0);
      s.palette.slice(0, MAX_COLORS).forEach((rgb, index) => colorData.set(rgb, index * 3));
      gl.uniform3fv(u.uColors, colorData);
      gl.uniform1i(u.uColorCount, Math.min(s.palette.length, MAX_COLORS));
      gl.uniform3f(u.uCore, s.core[0], s.core[1], s.core[2]);
      const paperColor = s.paper ?? [0, 0, 0];
      gl.uniform3f(u.uBackground, paperColor[0], paperColor[1], paperColor[2]);
      gl.uniform1f(u.uOpaque, s.paper ? 1 : 0);
      gl.uniform1f(u.uLight, s.lightMode ? 1 : 0);
      gl.uniform4f(u.uIntro, introClock, staggerFor(s.count), STROKE_SECONDS, introRunning ? 1 : 0);
      gl.uniform1fv(u.uFocus, focus);
      gl.uniform2f(u.uFocusState, state.presence * (0.4 + 0.6 * s.mouseStrength), state.settle);
      surgeData.fill(0);
      state.surges.slice(-MAX_SURGES).forEach((surge, index) => {
        surgeData.set([surge.x, state.clock - surge.at, surge.direction, 1], index * 4);
      });
      gl.uniform4fv(u.uSurges, surgeData);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (now: number) => {
      state.raf = requestAnimationFrame(tick);
      if (!state.visible || document.hidden) {
        state.last = now;
        return;
      }
      const s = settingsRef.current;
      const dt = state.last ? Math.min((now - state.last) / 1000, 0.1) : 1 / 60;
      state.last = now;
      const reduced = prefersReduced();
      state.clock += dt;
      if (state.introAt < 0) state.introAt = state.clock;
      if (!s.paused && !reduced) state.phase += dt * s.speed;
      const focusing = updateFocus(s, dt, reduced);
      state.surges = state.surges.filter(
        surge => state.clock - surge.at < SURGE_SECONDS + (s.count - 1) * SURGE_STAGGER
      );

      const still = s.paused || reduced;
      const transient =
        state.surges.length > 0 || (s.intro && !reduced && state.clock - state.introAt < introLength(s)) || focusing;
      if (state.seen !== s || transient || !still) state.quiet = 0;
      else state.quiet += 1;
      state.seen = s;
      if (state.quiet > 3) return;

      resize();
      render(reduced);
    };

    const local = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / Math.max(rect.width, 1),
        y: (event.clientY - rect.top) / Math.max(rect.height, 1),
        inside:
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
      };
    };

    const onMove = (event: PointerEvent) => {
      const point = local(event);
      state.inside = point.inside;
      if (point.inside) state.pointer = [point.x, point.y];
    };

    const onLeave = () => {
      state.inside = false;
    };

    const onDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      if (!s.pulseOnClick || event.button !== 0 || prefersReduced()) return;
      if (
        event.target instanceof Element &&
        event.target.closest('a, button, input, textarea, select, label, [role="button"]')
      )
        return;
      const point = local(event);
      if (!point.inside) return;
      const aspect = state.width / Math.max(state.height, 1);
      const [x] = toThreadSpace([point.x, point.y], aspect, s.angle);
      const direction = x <= s.pinch ? 1 : -1;
      state.surges.push({ x, direction, at: state.clock });
      if (state.surges.length > MAX_SURGES) state.surges.shift();
    };

    const visibility = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
    });
    visibility.observe(container);
    const sizes = new ResizeObserver(resize);
    sizes.observe(container);
    resize();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    document.documentElement.addEventListener('pointerleave', onLeave);
    state.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(state.raf);
      visibility.disconnect();
      sizes.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div ref={containerRef} className={[ROOT, className].filter(Boolean).join(' ')} style={style} />;
}
