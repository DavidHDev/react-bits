'use client';

import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

export type SwarmShape = 'dot' | 'streak' | 'square';
export type SwarmIdle = 'roam' | 'gather' | 'hide';
export type SwarmClickEffect = 'burst' | 'pulse' | 'none';

export interface SwarmCursorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'color'> {
  count?: number;
  size?: number;
  shape?: SwarmShape;
  color?: string;
  accentColor?: string;
  spread?: number;
  speed?: number;
  swirl?: number;
  tail?: number;
  trail?: number;
  wander?: number;
  depth?: number;
  targets?: string;
  idle?: SwarmIdle;
  clickEffect?: SwarmClickEffect;
  hideCursor?: boolean;
  intro?: boolean;
  enabled?: boolean;
  lightMode?: boolean;
  dpr?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

type Settings = {
  count: number;
  size: number;
  shape: number;
  color: string;
  accentColor: string;
  spread: number;
  speed: number;
  swirl: number;
  tail: number;
  trail: number;
  wander: number;
  depth: number;
  targets: string;
  idle: SwarmIdle;
  clickEffect: SwarmClickEffect;
  hideCursor: boolean;
  intro: boolean;
  enabled: boolean;
  lightMode: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const MAX_PARTICLES = 2000;
const INTRO_SECONDS = 1.4;
const HIDDEN = 'swarm-cursor-hidden';
const SHAPES: Record<string, number> = { dot: 0, square: 1, streak: 2 };
const CELL = 16;
const MAX_COLS = 72;
const MAX_ROWS = 48;
const PRESSURE_STEPS = 12;

const VERTEX = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aAgent;
layout(location = 2) in vec4 aLook;
layout(location = 3) in vec2 aExtra;
uniform vec2 uView;
out vec2 vLocal;
out vec2 vHalf;
out float vAlpha;
out float vTint;
out float vSoft;
out float vShape;

void main() {
  vec2 dir = aAgent.zw;
  vec2 side = vec2(-dir.y, dir.x);
  vec2 extent = aLook.xy * 0.5;
  vec2 pad = extent + 1.0 + aExtra.x * 1.5;
  vec2 local = aCorner * pad;
  vec2 center = aAgent.xy - dir * (extent.x - extent.y);
  vec2 pos = center + dir * local.x + side * local.y;
  vLocal = local;
  vHalf = extent;
  vAlpha = aLook.z;
  vTint = aLook.w;
  vSoft = aExtra.x;
  vShape = aExtra.y;
  vec2 clip = pos / uView * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uRatio;
in vec2 vLocal;
in vec2 vHalf;
in float vAlpha;
in float vTint;
in float vSoft;
in float vShape;
out vec4 outColor;

void main() {
  float d;
  if (vShape > 0.5 && vShape < 1.5) {
    float corner = vHalf.y * 0.3;
    vec2 q = abs(vLocal) - vHalf + corner;
    d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - corner;
  } else {
    vec2 q = vLocal;
    q.x = max(abs(q.x) - (vHalf.x - vHalf.y), 0.0);
    d = length(q) - vHalf.y;
  }
  float edge = 0.6 / uRatio + vSoft;
  float cover = 1.0 - smoothstep(-edge, edge, d);
  float stretch = clamp(1.0 - vHalf.y / max(vHalf.x, 0.001), 0.0, 1.0);
  float head = clamp((vLocal.x + vHalf.x) / max(2.0 * vHalf.x, 0.001), 0.0, 1.0);
  cover *= mix(1.0, 0.12 + 0.88 * head * head, stretch);
  float alpha = cover * vAlpha;
  outColor = vec4(mix(uColor, uAccent, vTint) * alpha, alpha);
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

const random = (seed: number) => {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
};

const rectField = (x: number, y: number, hx: number, hy: number, r: number, out: number[]) => {
  const sx = x < 0 ? -1 : 1;
  const sy = y < 0 ? -1 : 1;
  const qx = Math.abs(x) - (hx - r);
  const qy = Math.abs(y) - (hy - r);
  if (qx > 0 && qy > 0) {
    const l = Math.hypot(qx, qy) || 1;
    out[0] = l - r;
    out[1] = (qx / l) * sx;
    out[2] = (qy / l) * sy;
  } else if (qx > qy) {
    out[0] = qx - r;
    out[1] = sx;
    out[2] = 0;
  } else {
    out[0] = qy - r;
    out[1] = 0;
    out[2] = sy;
  }
  return out;
};

const SwarmCursor = ({
  count = 800,
  size = 2.6,
  shape = 'dot',
  color,
  accentColor,
  spread = 90,
  speed = 1,
  swirl = 0.6,
  tail = 0.5,
  trail = 0.6,
  wander = 0.5,
  depth = 0.7,
  targets = 'a, button, [data-swarm-target]',
  idle = 'roam',
  clickEffect = 'burst',
  hideCursor = false,
  intro = true,
  enabled = true,
  lightMode = false,
  dpr,
  children,
  className = '',
  style,
  ...rest
}: SwarmCursorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const ink = lightMode ? '#18181b' : '#ffffff';
  const settings: Settings = {
    count: Math.round(clamp(count, 1, MAX_PARTICLES)),
    size: clamp(size, 0.5, 16),
    shape: SHAPES[shape] ?? 0,
    color: color || ink,
    accentColor: accentColor || color || ink,
    spread: clamp(spread, 20, 400),
    speed: clamp(speed, 0, 4),
    swirl: clamp(swirl, 0, 1),
    tail: clamp(tail, 0, 1),
    trail: clamp(trail, 0, 3),
    wander: clamp(wander, 0, 2),
    depth: clamp(depth, 0, 1),
    targets,
    idle,
    clickEffect,
    hideCursor,
    intro,
    enabled,
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
    const shader = link(gl);
    if (!shader) return undefined;
    const u = shader.uniforms;

    const slots = MAX_PARTICLES + 1;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const cornerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const agentData = new Float32Array(slots * 4);
    const lookData = new Float32Array(slots * 4);
    const extraData = new Float32Array(slots * 2);
    const instanced = (location: number, width: number, data: Float32Array) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, width, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(location, 1);
      return buffer;
    };
    const agentBuffer = instanced(1, 4, agentData);
    const lookBuffer = instanced(2, 4, lookData);
    const extraBuffer = instanced(3, 2, extraData);
    gl.bindVertexArray(null);

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const colorCache = new Map<string, number[]>();
    const parse = (value: string): number[] => {
      const key = String(value);
      const cached = colorCache.get(key);
      if (cached) return cached;
      let rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = key;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r / 255, g / 255, b / 255];
      }
      colorCache.set(key, rgb);
      return rgb;
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const view = { width: 1, height: 1, ratio: 1 };
    const px = new Float32Array(MAX_PARTICLES);
    const py = new Float32Array(MAX_PARTICLES);
    const pz = new Float32Array(MAX_PARTICLES);
    const vx = new Float32Array(MAX_PARTICLES);
    const vy = new Float32Array(MAX_PARTICLES);
    const vz = new Float32Array(MAX_PARTICLES);
    const home = new Float32Array(MAX_PARTICLES);
    const heft = new Float32Array(MAX_PARTICLES);
    const bob = new Float32Array(MAX_PARTICLES);
    const bobRate = new Float32Array(MAX_PARTICLES);
    const grain = new Float32Array(MAX_PARTICLES);
    const glint = new Float32Array(MAX_PARTICLES);
    const order = new Int32Array(MAX_PARTICLES);
    const field = [0, 0, 0];
    let cols = 1;
    let rows = 1;
    let cell = CELL;
    let flowX = new Float32Array(1);
    let flowY = new Float32Array(1);
    let lastX = new Float32Array(1);
    let lastY = new Float32Array(1);
    let pressure = new Float32Array(1);
    let divergence = new Float32Array(1);
    let curl = new Float32Array(1);
    const pointer = { x: 0, y: 0, inside: false };
    const anchor = { x: 0, y: 0, lastX: 0, lastY: 0, moveX: 0, moveY: 0 };
    const ring = { active: false, x: 0, y: 0, hx: 0, hy: 0, corner: 0, spin: 1 };
    const burst = { age: 10 };
    const ping = { age: 10, x: 0, y: 0 };
    let hovered: Element | null = null;
    let time = 0;
    let presence = 1;
    let introClock = settingsRef.current.intro && !reduce ? 0 : 1;
    let raf = 0;
    let last = 0;
    let visible = true;
    let seeded = false;
    let hidden = false;
    let sorted = 0;

    const setHidden = (value: boolean) => {
      if (value === hidden) return;
      hidden = value;
      container.classList.toggle(HIDDEN, value);
    };

    const allocate = () => {
      const nextCols = clamp(Math.round(view.width / CELL), 8, MAX_COLS);
      const nextRows = clamp(Math.round(view.height / CELL), 8, MAX_ROWS);
      cell = Math.max(view.width / nextCols, view.height / nextRows);
      if (nextCols === cols && nextRows === rows) return;
      cols = nextCols;
      rows = nextRows;
      const total = cols * rows;
      flowX = new Float32Array(total);
      flowY = new Float32Array(total);
      lastX = new Float32Array(total);
      lastY = new Float32Array(total);
      pressure = new Float32Array(total);
      divergence = new Float32Array(total);
      curl = new Float32Array(total);
    };

    const sample = (values: Float32Array, x: number, y: number) => {
      let gx = x / cell - 0.5;
      let gy = y / cell - 0.5;
      if (gx < 0) gx = 0;
      else if (gx > cols - 1.001) gx = cols - 1.001;
      if (gy < 0) gy = 0;
      else if (gy > rows - 1.001) gy = rows - 1.001;
      const i = gx | 0;
      const j = gy | 0;
      const fx = gx - i;
      const fy = gy - j;
      const k = i + j * cols;
      return (
        (values[k] * (1 - fx) + values[k + 1] * fx) * (1 - fy) +
        (values[k + cols] * (1 - fx) + values[k + cols + 1] * fx) * fy
      );
    };

    const walls = (values: Float32Array, axis: number) => {
      for (let j = 1; j < rows - 1; j++) {
        const left = j * cols;
        const right = left + cols - 1;
        values[left] = axis === 1 ? -values[left + 1] : values[left + 1];
        values[right] = axis === 1 ? -values[right - 1] : values[right - 1];
      }
      for (let i = 1; i < cols - 1; i++) {
        const bottom = i + (rows - 1) * cols;
        values[i] = axis === 2 ? -values[i + cols] : values[i + cols];
        values[bottom] = axis === 2 ? -values[bottom - cols] : values[bottom - cols];
      }
      values[0] = 0.5 * (values[1] + values[cols]);
      values[cols - 1] = 0.5 * (values[cols - 2] + values[2 * cols - 1]);
      values[(rows - 1) * cols] = 0.5 * (values[(rows - 2) * cols] + values[(rows - 1) * cols + 1]);
      values[rows * cols - 1] = 0.5 * (values[rows * cols - 2] + values[(rows - 1) * cols - 1]);
    };

    const stir = (s: Settings, dt: number, ease: number) => {
      const radius = s.spread;
      const reach = radius * 2.2;
      const i0 = Math.max(1, Math.floor((anchor.x - reach) / cell));
      const i1 = Math.min(cols - 2, Math.ceil((anchor.x + reach) / cell));
      const j0 = Math.max(1, Math.floor((anchor.y - reach) / cell));
      const j1 = Math.min(rows - 2, Math.ceil((anchor.y + reach) / cell));
      const inv = 1 / (radius * radius * 0.55);
      const moving = Math.hypot(anchor.moveX, anchor.moveY);
      const grab = (1 - Math.exp(-dt * 20)) * clamp(moving / 240, 0, 1) * presence;
      const whirl = ring.active ? 0 : radius * (0.5 + 4 * (1 - ease)) * (0.35 + 0.65 * s.speed);
      const churn = s.wander * radius * 14 * (0.4 + 0.6 * s.speed);
      const fk = 1.4 / radius;
      const ft = time * 0.75 * (0.4 + 0.6 * s.speed);
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const k = i + j * cols;
          const x = (i + 0.5) * cell;
          const y = (j + 0.5) * cell;
          const rx = x - anchor.x;
          const ry = y - anchor.y;
          const d2 = rx * rx + ry * ry;
          const w = Math.exp(-d2 * inv);
          if (w < 0.003) continue;
          const d = Math.sqrt(d2) + 0.001;
          flowX[k] += (anchor.moveX - flowX[k]) * w * grab;
          flowY[k] += (anchor.moveY - flowY[k]) * w * grab;
          const reachOut = Math.min(1, d / (radius * 0.45));
          flowX[k] += (-ry / d) * whirl * reachOut * w * dt;
          flowY[k] += (rx / d) * whirl * reachOut * w * dt;
          const a1 = x * fk + ft;
          const b1 = y * fk * 1.1 - ft * 0.8;
          const a2 = y * fk * 1.7 + ft * 1.2 + 1.3;
          const b2 = x * fk * 1.3 - 0.7;
          const curlX = -Math.sin(a1) * Math.sin(b1) * 1.1 + 1.02 * Math.cos(a2) * Math.cos(b2);
          const curlY = -(Math.cos(a1) * Math.cos(b1) - 0.78 * Math.sin(a2) * Math.sin(b2));
          flowX[k] += curlX * churn * w * dt;
          flowY[k] += curlY * churn * w * dt;
        }
      }
      if (!ring.active) return;
      const band = Math.max(4, radius * 0.16);
      const margin = band + 24;
      const circulate = 230 * (0.4 + 0.6 * s.speed) * ring.spin;
      const r0 = Math.max(1, Math.floor((ring.x - ring.hx - margin) / cell));
      const r1 = Math.min(cols - 2, Math.ceil((ring.x + ring.hx + margin) / cell));
      const c0 = Math.max(1, Math.floor((ring.y - ring.hy - margin) / cell));
      const c1 = Math.min(rows - 2, Math.ceil((ring.y + ring.hy + margin) / cell));
      const rate = 1 - Math.exp(-dt * 6);
      for (let j = c0; j <= c1; j++) {
        for (let i = r0; i <= r1; i++) {
          const k = i + j * cols;
          rectField((i + 0.5) * cell - ring.x, (j + 0.5) * cell - ring.y, ring.hx, ring.hy, ring.corner, field);
          const off = field[0] - (5 + band * 0.5);
          const w = Math.exp(-(off * off) / (margin * margin * 0.35));
          if (w < 0.01) continue;
          flowX[k] += (-field[2] * circulate - flowX[k]) * w * rate;
          flowY[k] += (field[1] * circulate - flowY[k]) * w * rate;
        }
      }
    };

    const flow = (s: Settings, dt: number) => {
      const total = cols * rows;
      for (let j = 1; j < rows - 1; j++) {
        for (let i = 1; i < cols - 1; i++) {
          const k = i + j * cols;
          curl[k] = (flowY[k + 1] - flowY[k - 1] - flowX[k + cols] + flowX[k - cols]) * (0.5 / cell);
        }
      }
      const confine = s.swirl * cell * 9;
      for (let j = 2; j < rows - 2; j++) {
        for (let i = 2; i < cols - 2; i++) {
          const k = i + j * cols;
          const gx = Math.abs(curl[k + 1]) - Math.abs(curl[k - 1]);
          const gy = Math.abs(curl[k + cols]) - Math.abs(curl[k - cols]);
          const len = Math.hypot(gx, gy) + 1e-5;
          flowX[k] += (gy / len) * curl[k] * confine * dt;
          flowY[k] -= (gx / len) * curl[k] * confine * dt;
        }
      }
      lastX.set(flowX);
      lastY.set(flowY);
      const back = dt / cell;
      const fade = Math.exp(-dt / (0.35 + 1.5 * s.swirl));
      for (let j = 1; j < rows - 1; j++) {
        for (let i = 1; i < cols - 1; i++) {
          const k = i + j * cols;
          let x = i - back * lastX[k];
          let y = j - back * lastY[k];
          if (x < 0.5) x = 0.5;
          else if (x > cols - 1.5) x = cols - 1.5;
          if (y < 0.5) y = 0.5;
          else if (y > rows - 1.5) y = rows - 1.5;
          const i0 = x | 0;
          const j0 = y | 0;
          const fx = x - i0;
          const fy = y - j0;
          const a = i0 + j0 * cols;
          flowX[k] =
            ((lastX[a] * (1 - fx) + lastX[a + 1] * fx) * (1 - fy) +
              (lastX[a + cols] * (1 - fx) + lastX[a + cols + 1] * fx) * fy) *
            fade;
          flowY[k] =
            ((lastY[a] * (1 - fx) + lastY[a + 1] * fx) * (1 - fy) +
              (lastY[a + cols] * (1 - fx) + lastY[a + cols + 1] * fx) * fy) *
            fade;
        }
      }
      walls(flowX, 1);
      walls(flowY, 2);
      const h2 = cell * cell;
      for (let j = 1; j < rows - 1; j++) {
        for (let i = 1; i < cols - 1; i++) {
          const k = i + j * cols;
          divergence[k] = (flowX[k + 1] - flowX[k - 1] + flowY[k + cols] - flowY[k - cols]) * (0.5 / cell);
        }
      }
      pressure.fill(0, 0, total);
      walls(divergence, 0);
      for (let step = 0; step < PRESSURE_STEPS; step++) {
        for (let j = 1; j < rows - 1; j++) {
          for (let i = 1; i < cols - 1; i++) {
            const k = i + j * cols;
            pressure[k] =
              (pressure[k - 1] + pressure[k + 1] + pressure[k - cols] + pressure[k + cols] - h2 * divergence[k]) * 0.25;
          }
        }
        walls(pressure, 0);
      }
      for (let j = 1; j < rows - 1; j++) {
        for (let i = 1; i < cols - 1; i++) {
          const k = i + j * cols;
          flowX[k] -= (pressure[k + 1] - pressure[k - 1]) * (0.5 / cell);
          flowY[k] -= (pressure[k + cols] - pressure[k - cols]) * (0.5 / cell);
        }
      }
      walls(flowX, 1);
      walls(flowY, 2);
    };

    const crowd = new Int32Array(MAX_PARTICLES);
    let crowdHeads = new Int32Array(1);
    let crowdRows = 1;
    const push = (n: number, h: number) => {
      const gc = Math.max(1, Math.ceil(view.width / h) + 2);
      const gr = Math.max(1, Math.ceil(view.height / h) + 2);
      if (crowdHeads.length < gc * gr) crowdHeads = new Int32Array(gc * gr);
      crowdHeads.fill(-1, 0, gc * gr);
      crowdRows = gr;
      for (let i = 0; i < n; i++) {
        const cx = clamp(Math.floor(px[i] / h) + 1, 0, gc - 1);
        const cy = clamp(Math.floor(py[i] / h) + 1, 0, gr - 1);
        const key = cy * gc + cx;
        crowd[i] = crowdHeads[key];
        crowdHeads[key] = i;
      }
      return gc;
    };

    const move = (s: Settings, dt: number, ease: number) => {
      const n = s.count;
      const radius = s.spread;
      const loose = 1 - 0.6 * s.tail;
      const gather = 12 * loose * (0.2 + 0.8 * ease);
      const pull = 30 * loose * (0.2 + 0.8 * ease);
      const band = Math.max(4, radius * 0.16);
      const w = view.width;
      const h = view.height;
      const gap = radius * Math.sqrt(Math.PI / Math.max(n, 1)) * 1.6;
      const repel = 4000;
      const gc = push(n, gap);
      for (let i = 0; i < n; i++) {
        const x = px[i];
        const y = py[i];
        const k = 10 * (1 - 0.6 * s.tail * heft[i]);
        let ax = (sample(flowX, x, y) - vx[i]) * k;
        let ay = (sample(flowY, x, y) - vy[i]) * k;
        const cx = clamp(Math.floor(x / gap) + 1, 0, gc - 1);
        const cy = clamp(Math.floor(y / gap) + 1, 0, crowdRows - 1);
        for (let oy = -1; oy <= 1; oy++) {
          const row = cy + oy;
          if (row < 0 || row >= crowdRows) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const col = cx + ox;
            if (col < 0 || col >= gc) continue;
            for (let j = crowdHeads[row * gc + col]; j !== -1; j = crowd[j]) {
              if (j === i) continue;
              const dx = x - px[j];
              const dy = y - py[j];
              const d2 = dx * dx + dy * dy;
              if (d2 >= gap * gap || d2 < 1e-6) continue;
              const d = Math.sqrt(d2);
              const q = 1 - d / gap;
              ax += (dx / d) * q * q * repel;
              ay += (dy / d) * q * q * repel;
            }
          }
        }
        if (ring.active) {
          rectField(x - ring.x, y - ring.y, ring.hx, ring.hy, ring.corner, field);
          const e = field[0] - (5 + band * home[i] * home[i]);
          const hold = e > 0 ? 70 : 140;
          ax -= field[1] * e * hold;
          ay -= field[2] * e * hold;
        } else {
          const dx = anchor.x - x;
          const dy = anchor.y - y;
          const d = Math.hypot(dx, dy) + 0.001;
          const over = Math.max(0, d - radius);
          ax += (dx / d) * (d * gather + over * pull);
          ay += (dy / d) * (d * gather + over * pull);
        }
        if (introClock >= 1) {
          if (x < 8) ax += (8 - x) * 30;
          else if (x > w - 8) ax -= (x - w + 8) * 30;
          if (y < 8) ay += (8 - y) * 30;
          else if (y > h - 8) ay -= (y - h + 8) * 30;
        }
        const lift = Math.sin(time * bobRate[i] + bob[i]) * radius * (ring.active ? 0.15 : 0.55);
        const az = (lift - pz[i]) * 36 - vz[i] * 9;
        vx[i] += ax * dt;
        vy[i] += ay * dt;
        vz[i] += az * dt;
        px[i] += vx[i] * dt;
        py[i] += vy[i] * dt;
        pz[i] += vz[i] * dt;
      }
    };

    const seed = () => {
      const rand = random(7);
      for (let i = 0; i < MAX_PARTICLES; i++) {
        home[i] = 0.08 + 0.92 * Math.sqrt(rand());
        heft[i] = rand() * rand();
        bob[i] = rand() * Math.PI * 2;
        bobRate[i] = 0.5 + rand() * 1.1;
        grain[i] = 0.55 + rand() * 0.9;
        glint[i] = rand() * 100;
      }
      seeded = true;
    };

    const place = (gathered: boolean) => {
      const s = settingsRef.current;
      const rand = random(11);
      const reachOut = Math.hypot(view.width, view.height) * 0.5;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const a = rand() * Math.PI * 2;
        const r = gathered ? home[i] * s.spread : (0.35 + 0.65 * Math.sqrt(rand())) * reachOut;
        px[i] = anchor.x + Math.cos(a) * r;
        py[i] = anchor.y + Math.sin(a) * r;
        pz[i] = Math.sin(bob[i]) * s.spread * 0.55;
        vx[i] = 0;
        vy[i] = 0;
        vz[i] = 0;
      }
    };

    const findTarget = () => {
      const s = settingsRef.current;
      if (!s.targets || !pointer.inside) return null;
      const rect = container.getBoundingClientRect();
      const element = document.elementFromPoint(rect.left + pointer.x, rect.top + pointer.y);
      if (!element || !container.contains(element)) return null;
      let match: Element | null = null;
      try {
        match = element.closest(s.targets);
      } catch {
        match = null;
      }
      return match && container.contains(match) ? match : null;
    };

    const updateAnchor = (s: Settings, dt: number) => {
      const w = view.width;
      const h = view.height;
      if (hovered && hovered.isConnected) {
        const box = hovered.getBoundingClientRect();
        const frame = container.getBoundingClientRect();
        const radius = parseFloat(getComputedStyle(hovered).borderTopLeftRadius) || 0;
        ring.x = box.left - frame.left + box.width / 2;
        ring.y = box.top - frame.top + box.height / 2;
        ring.hx = box.width / 2;
        ring.hy = box.height / 2;
        ring.corner = Math.min(radius, ring.hx, ring.hy);
        if (!ring.active) {
          let turning = 0;
          for (let i = 0; i < s.count; i++) turning += (px[i] - ring.x) * vy[i] - (py[i] - ring.y) * vx[i];
          ring.spin = turning < 0 ? -1 : 1;
        }
        ring.active = true;
      } else {
        ring.active = false;
      }
      let goal = 1;
      if (pointer.inside) {
        anchor.x = pointer.x;
        anchor.y = pointer.y;
      } else if (s.idle === 'gather') {
        anchor.x = w * 0.5;
        anchor.y = h * 0.5;
      } else if (s.idle === 'hide') {
        goal = 0;
      } else {
        anchor.x = w * (0.5 + 0.3 * Math.sin(time * 0.21) + 0.06 * Math.sin(time * 0.53 + 1.7));
        anchor.y = h * (0.5 + 0.24 * Math.sin(time * 0.29 + 0.8) + 0.05 * Math.sin(time * 0.71));
      }
      if (dt > 0) {
        const moveX = clamp((anchor.x - anchor.lastX) / dt, -4000, 4000);
        const moveY = clamp((anchor.y - anchor.lastY) / dt, -4000, 4000);
        const blend = 1 - Math.exp(-dt * 30);
        anchor.moveX += (moveX - anchor.moveX) * blend;
        anchor.moveY += (moveY - anchor.moveY) * blend;
      }
      anchor.lastX = anchor.x;
      anchor.lastY = anchor.y;
      presence += (goal - presence) * (1 - Math.exp(-dt / 0.25));
    };

    const draw = () => {
      const s = settingsRef.current;
      const n = s.count;
      const fade = introClock * introClock * (3 - 2 * introClock) * presence;
      const zr = Math.max(s.spread * 0.55, 10);
      if (sorted !== n) {
        for (let a = 0; a < n; a++) order[a] = a;
        sorted = n;
      }
      for (let a = 1; a < n; a++) {
        const value = order[a];
        const key = pz[value];
        let b = a - 1;
        while (b >= 0 && pz[order[b]] > key) {
          order[b + 1] = order[b];
          b--;
        }
        order[b + 1] = value;
      }
      const flash = burst.age < 1.2 ? Math.exp(-burst.age / 0.3) : 0;
      const front = ping.age * 520;
      let written = 0;
      for (let a = 0; a < n; a++) {
        const i = order[a];
        const near = clamp(pz[i] / zr, -1, 1);
        const scale = 1 + s.depth * 0.6 * near;
        const body = s.size * grain[i] * scale;
        const soft = s.depth * s.size * (s.lightMode ? 0.35 : 1.4) * Math.pow(Math.abs(near), 1.6);
        const flat = Math.hypot(vx[i], vy[i]);
        const dx = flat > 0.001 ? vx[i] / flat : 1;
        const dy = flat > 0.001 ? vy[i] / flat : 0;
        let wave = 0;
        if (ping.age < 1.6) {
          const offset = (Math.hypot(px[i] - ping.x, py[i] - ping.y) - front) / 40;
          wave = Math.exp(-offset * offset) * (1 - ping.age / 1.6);
        }
        const tint = Math.max(clamp((flat - 380) / 900, 0, 1), flash, wave);
        const width = body * (1 + wave * 0.8);
        let length = width + Math.min(flat * s.trail * 0.02, body * 14);
        if (s.shape === 2) length = width * 2.6 + Math.min(flat * s.trail * 0.03, body * 18);
        const twinkle = 0.86 + 0.14 * Math.sin(time * 3.1 + glint[i]);
        const dim = 1 - s.depth * 0.45 * Math.max(0, -near);
        const o = written * 4;
        agentData[o] = px[i];
        agentData[o + 1] = py[i];
        agentData[o + 2] = dx;
        agentData[o + 3] = dy;
        lookData[o] = length;
        lookData[o + 1] = width;
        lookData[o + 2] = clamp(0.95 * dim * (body / (body + soft)) * twinkle * (1 + wave * 0.4), 0, 1) * fade;
        lookData[o + 3] = tint;
        extraData[written * 2] = soft;
        extraData[written * 2 + 1] = s.shape;
        written++;
      }
      if (s.hideCursor && pointer.inside) {
        const o = written * 4;
        agentData[o] = pointer.x;
        agentData[o + 1] = pointer.y;
        agentData[o + 2] = 1;
        agentData[o + 3] = 0;
        lookData[o] = 6;
        lookData[o + 1] = 6;
        lookData[o + 2] = 1;
        lookData[o + 3] = 0;
        extraData[written * 2] = 0;
        extraData[written * 2 + 1] = 0;
        written++;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!s.enabled || !written) return;
      gl.useProgram(shader.program);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, agentBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, agentData, 0, written * 4);
      gl.bindBuffer(gl.ARRAY_BUFFER, lookBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, lookData, 0, written * 4);
      gl.bindBuffer(gl.ARRAY_BUFFER, extraBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, extraData, 0, written * 2);
      gl.uniform2f(u.uView, view.width, view.height);
      gl.uniform3fv(u.uColor, parse(s.color));
      gl.uniform3fv(u.uAccent, parse(s.accentColor));
      gl.uniform1f(u.uRatio, view.ratio);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, written);
      gl.bindVertexArray(null);
    };

    const resize = () => {
      const s = settingsRef.current;
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      allocate();
      if (!seeded) {
        seed();
        updateAnchor(s, 0);
        if (reduce) {
          anchor.x = view.width / 2;
          anchor.y = view.height / 2;
        }
        anchor.lastX = anchor.x;
        anchor.lastY = anchor.y;
        place(introClock >= 1);
      }
      draw();
      wake();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? clamp((now - last) / 1000, 0.001, 1 / 30) : 1 / 60;
      last = now;
      if (!s.enabled || reduce) {
        setHidden(false);
        draw();
        return;
      }
      time += dt;
      burst.age += dt;
      ping.age += dt;
      if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
      const ease = introClock * introClock * (3 - 2 * introClock);
      hovered = findTarget();
      updateAnchor(s, dt);
      setHidden(s.hideCursor && pointer.inside);
      stir(s, dt, ease);
      flow(s, dt);
      move(s, dt / 2, ease);
      move(s, dt / 2, ease);
      draw();
      raf = requestAnimationFrame(frame);
    };

    function wake() {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
    };

    const onPointerMove = (event: PointerEvent) => {
      const { x, y, inside } = locate(event);
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      const { x, y, inside } = locate(event);
      if (!inside || !s.enabled || reduce || s.clickEffect === 'none') return;
      const reachOut = s.spread * 2.2;
      if (s.clickEffect === 'pulse') {
        ping.x = x;
        ping.y = y;
        ping.age = 0;
      } else {
        burst.age = 0;
      }
      const kick = s.clickEffect === 'pulse' ? 160 : 780;
      for (let i = 0; i < s.count; i++) {
        const dx = px[i] - x;
        const dy = py[i] - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > reachOut) continue;
        const k = (1 - d / reachOut) * kick * (0.6 + 0.4 * grain[i]);
        vx[i] += (dx / d) * k;
        vy[i] += (dy / d) * k;
      }
      if (s.clickEffect === 'pulse') return;
      const twist = 520 * (time % 2 < 1 ? 1 : -1);
      const inv = 1 / (s.spread * s.spread);
      for (let j = 1; j < rows - 1; j++) {
        for (let i = 1; i < cols - 1; i++) {
          const k = i + j * cols;
          const rx = (i + 0.5) * cell - x;
          const ry = (j + 0.5) * cell - y;
          const d2 = rx * rx + ry * ry;
          const w = (Math.sqrt(d2) / s.spread) * Math.exp(-d2 * inv);
          if (w < 0.003) continue;
          const d = Math.sqrt(d2) + 0.001;
          flowX[k] += (-ry / d) * twist * w;
          flowY[k] += (rx / d) * twist * w;
        }
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') pointer.inside = false;
    };

    const onPointerLeave = () => {
      pointer.inside = false;
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
    wakeRef.current = wake;

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      setHidden(false);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(cornerBuffer);
      gl.deleteBuffer(agentBuffer);
      gl.deleteBuffer(lookBuffer);
      gl.deleteBuffer(extraBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
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
      {...rest}
    >
      <style>{`.${HIDDEN}, .${HIDDEN} * { cursor: none !important; }`}</style>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 block h-full w-full" aria-hidden="true" />
      {children ? <div className="relative h-full w-full">{children}</div> : null}
    </div>
  );
};

export default SwarmCursor;
