'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

export interface RibbonsProps {
  colors?: string[];
  thickness?: number;
  length?: number;
  spread?: number;
  stiffness?: number;
  bounce?: number;
  shape?: 'lens' | 'comet' | 'even';
  wave?: number;
  softness?: number;
  fade?: boolean;
  opacity?: number;
  backgroundColor?: string;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

type Rgba = number[];

interface Settings {
  colors: Rgba[];
  back: Rgba;
  thickness: number;
  length: number;
  spread: number;
  stiffness: number;
  bounce: number;
  shape: number;
  wave: number;
  softness: number;
  fade: boolean;
  opacity: number;
  dpr?: number;
}

interface Ribbon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  points: Float32Array;
  pull: number;
  drag: number;
  width: number;
  lift: number;
  nudge: number;
  phase: number;
}

interface Engine {
  redraw: () => void;
}

const POINTS = 50;
const DETAIL = 4;
const SAMPLES = (POINTS - 1) * DETAIL + 1;
const STRIDE = 6;
const STEP = 1 / 120;
const SHAPES: Record<string, number> = { lens: 0, comet: 1, even: 2 };
const DEFAULT_COLORS = ['#3847ff', '#7c84ff', '#c7cbff'];

const VERTEX = `#version 300 es
in vec2 a_position;
in vec4 a_shape;
uniform vec2 u_resolution;
out vec4 v_shape;
void main() {
  v_shape = a_shape;
  vec2 clip = a_position / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec3 u_color;
uniform float u_opacity;
uniform float u_fade;
uniform float u_softness;
in vec4 v_shape;
out vec4 outColor;

void main() {
  float halfWidth = v_shape.y;
  float dist = abs(v_shape.x) * v_shape.z;
  float edge = max(halfWidth, 0.5);
  float soft = u_softness * edge;
  float alpha = 1.0 - smoothstep(edge - soft - 0.6, edge + 0.6, dist);
  alpha *= clamp(halfWidth / 0.5, 0.0, 1.0);
  alpha *= mix(1.0, 1.0 - smoothstep(0.0, 1.0, v_shape.w), u_fade);
  alpha *= u_opacity;
  if (alpha <= 0.002) discard;
  outColor = vec4(u_color * alpha, alpha);
}
`;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const hash = (value: number) => {
  const s = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const parseColor = (() => {
  let context: CanvasRenderingContext2D | null = null;
  return (value: string, fallback: Rgba): Rgba => {
    if (typeof document === 'undefined') return fallback;
    if (!context) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      context = canvas.getContext('2d', { willReadFrequently: true });
    }
    if (!context) return fallback;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = '#000';
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255, a / 255];
  };
})();

const profile = (shape: number, u: number) => {
  if (shape === 1) return (1 - u) ** 1.2 * Math.sqrt(smoothstep(0, 0.1, u));
  if (shape === 2) return Math.sqrt(smoothstep(0, 0.06, u) * smoothstep(0, 0.06, 1 - u));
  const d = (u - 0.5) * 2;
  return 1 - 0.9 * d * d;
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

const createRibbon = (index: number, x: number, y: number): Ribbon => {
  const points = new Float32Array(POINTS * 2);
  for (let i = 0; i < POINTS; i++) {
    points[i * 2] = x;
    points[i * 2 + 1] = y;
  }
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    points,
    pull: 0.35 + 1.3 * hash(index + 3),
    drag: 0.9 + 0.2 * hash(index + 5),
    width: 0.95 + 0.1 * hash(index + 7),
    lift: hash(index + 13) - 0.5,
    nudge: hash(index + 17) - 0.5,
    phase: hash(index + 19) * Math.PI * 2
  };
};

export default function Ribbons({
  colors = DEFAULT_COLORS,
  thickness = 30,
  length = 1.4,
  spread = 18,
  stiffness = 0.5,
  bounce = 0.5,
  shape = 'lens',
  wave = 0,
  softness = 0,
  fade = false,
  opacity = 1,
  backgroundColor = 'transparent',
  dpr,
  className = '',
  style
}: RibbonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const settingsRef = useRef<Settings>(null as unknown as Settings);

  const palette = (colors?.length ? colors : DEFAULT_COLORS).slice(0, 12);

  settingsRef.current = {
    colors: palette.map(color => parseColor(color, [1, 1, 1, 1])),
    back: parseColor(backgroundColor, [0, 0, 0, 0]),
    thickness: Math.max(1, thickness),
    length: clamp(length, 0.1, 5),
    spread: Math.max(0, spread),
    stiffness: clamp(stiffness, 0, 1),
    bounce: clamp(bounce, 0, 1),
    shape: SHAPES[shape] ?? 0,
    wave: clamp(wave, 0, 1),
    softness: clamp(softness, 0, 1),
    fade,
    opacity: clamp(opacity, 0, 1),
    dpr
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return undefined;
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return undefined;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const position = gl.getAttribLocation(program, 'a_position');
    const shapeAttribute = gl.getAttribLocation(program, 'a_shape');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, STRIDE * 4, 0);
    gl.enableVertexAttribArray(shapeAttribute);
    gl.vertexAttribPointer(shapeAttribute, 4, gl.FLOAT, false, STRIDE * 4, 8);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const pointX = new Float32Array(POINTS);
    const pointY = new Float32Array(POINTS);
    const spacing = new Float32Array(POINTS);
    const sampleX = new Float32Array(SAMPLES);
    const sampleY = new Float32Array(SAMPLES);
    const sampleSpacing = new Float32Array(SAMPLES);
    let vertices = new Float32Array(0);

    const state = {
      alive: true,
      raf: 0,
      last: 0,
      time: 0,
      visible: true,
      width: 1,
      height: 1,
      ribbons: [] as Ribbon[],
      mouseX: 0,
      mouseY: 0,
      placed: false,
      accumulator: 0
    };

    const resize = () => {
      const s = settingsRef.current;
      const ratio = s.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      state.width = width;
      state.height = height;
      if (!state.placed) {
        state.mouseX = width / 2;
        state.mouseY = height / 2;
      }
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
    };

    const syncRibbons = () => {
      const count = settingsRef.current.colors.length;
      while (state.ribbons.length < count) {
        const anchor = state.ribbons[state.ribbons.length - 1];
        state.ribbons.push(createRibbon(state.ribbons.length, anchor?.x ?? state.mouseX, anchor?.y ?? state.mouseY));
      }
      state.ribbons.length = count;
    };

    const simulate = (dt: number) => {
      const s = settingsRef.current;
      const spring = 0.03 * 4 ** (2 * s.stiffness - 1);
      const zeta = clamp(0.3 ** (2 * s.bounce), 0.05, 1);
      const follow = 1 - 0.183 ** ((1 / s.length) * dt * 60);
      const count = state.ribbons.length;
      const center = (count - 1) / 2;
      for (let i = 0; i < count; i++) {
        const ribbon = state.ribbons[i];
        const omega = 60 * Math.sqrt(spring * ribbon.pull);
        const damping = 2 * zeta * 60 * Math.sqrt(spring) * ribbon.drag;
        const tx = state.mouseX + (i - center + ribbon.nudge * 0.2) * s.spread;
        const ty = state.mouseY + ribbon.lift * s.spread;
        ribbon.vx += (omega * omega * (tx - ribbon.x) - damping * ribbon.vx) * dt;
        ribbon.vy += (omega * omega * (ty - ribbon.y) - damping * ribbon.vy) * dt;
        ribbon.x += ribbon.vx * dt;
        ribbon.y += ribbon.vy * dt;
        const { points } = ribbon;
        points[0] = ribbon.x;
        points[1] = ribbon.y;
        for (let j = 1; j < POINTS; j++) {
          const p = j * 2;
          points[p] += (points[p - 2] - points[p]) * follow;
          points[p + 1] += (points[p - 1] - points[p + 1]) * follow;
        }
      }
    };

    const build = (ribbon: Ribbon, out: Float32Array, offset: number) => {
      const s = settingsRef.current;
      const { points } = ribbon;
      let total = 0;
      for (let j = 0; j < POINTS; j++) {
        pointX[j] = points[j * 2];
        pointY[j] = points[j * 2 + 1];
        if (j > 0) total += Math.hypot(pointX[j] - pointX[j - 1], pointY[j] - pointY[j - 1]);
      }
      if (total < 0.5) return 0;
      for (let j = 0; j < POINTS; j++) {
        const prev = Math.max(j - 1, 0);
        const next = Math.min(j + 1, POINTS - 1);
        spacing[j] = Math.hypot(pointX[next] - pointX[prev], pointY[next] - pointY[prev]);
      }
      if (s.wave > 0) {
        const amplitude = s.wave * Math.min(s.thickness * 0.8, total * 0.07);
        let nx = 0;
        let ny = 0;
        for (let j = 0; j < POINTS; j++) {
          const prev = Math.max(j - 1, 0);
          const next = Math.min(j + 1, POINTS - 1);
          const dx = pointX[next] - pointX[prev];
          const dy = pointY[next] - pointY[prev];
          const len = Math.hypot(dx, dy);
          if (len > 1e-3) {
            nx = -dy / len;
            ny = dx / len;
          }
          const u = j / (POINTS - 1);
          const swing = Math.sin(u * Math.PI * 3 - state.time * 3.2 + ribbon.phase) * Math.sin(Math.PI * u) * amplitude;
          pointX[j] += nx * swing;
          pointY[j] += ny * swing;
        }
      }

      let k = 0;
      for (let j = 0; j < POINTS - 1; j++) {
        const a = Math.max(j - 1, 0);
        const b = j;
        const c = j + 1;
        const d = Math.min(j + 2, POINTS - 1);
        for (let step = 0; step < DETAIL; step++) {
          const t = step / DETAIL;
          const t2 = t * t;
          const t3 = t2 * t;
          sampleX[k] =
            0.5 *
            (2 * pointX[b] +
              (pointX[c] - pointX[a]) * t +
              (2 * pointX[a] - 5 * pointX[b] + 4 * pointX[c] - pointX[d]) * t2 +
              (3 * pointX[b] - pointX[a] - 3 * pointX[c] + pointX[d]) * t3);
          sampleY[k] =
            0.5 *
            (2 * pointY[b] +
              (pointY[c] - pointY[a]) * t +
              (2 * pointY[a] - 5 * pointY[b] + 4 * pointY[c] - pointY[d]) * t2 +
              (3 * pointY[b] - pointY[a] - 3 * pointY[c] + pointY[d]) * t3);
          sampleSpacing[k] = spacing[j] + (spacing[j + 1] - spacing[j]) * t;
          k++;
        }
      }
      sampleX[k] = pointX[POINTS - 1];
      sampleY[k] = pointY[POINTS - 1];
      sampleSpacing[k] = spacing[POINTS - 1];

      const half = s.thickness * 0.5 * ribbon.width * smoothstep(0, s.thickness * 1.5, total);
      let normalX = 0;
      let normalY = 1;
      let cursor = offset;
      for (let i = SAMPLES - 1; i >= 0; i--) {
        const prev = Math.max(i - 1, 0);
        const next = Math.min(i + 1, SAMPLES - 1);
        const dx = sampleX[next] - sampleX[prev];
        const dy = sampleY[next] - sampleY[prev];
        const len = Math.hypot(dx, dy);
        if (len > 1e-4) {
          normalX = -dy / len;
          normalY = dx / len;
        }
        const u = i / (SAMPLES - 1);
        const width = half * profile(s.shape, u) * smoothstep(0, 1.5, sampleSpacing[i]);
        const reach = width + 1.5;
        for (let side = -1; side <= 1; side += 2) {
          out[cursor++] = sampleX[i] + normalX * reach * side;
          out[cursor++] = sampleY[i] + normalY * reach * side;
          out[cursor++] = side;
          out[cursor++] = width;
          out[cursor++] = reach;
          out[cursor++] = u;
        }
      }
      return SAMPLES * 2;
    };

    const draw = () => {
      const s = settingsRef.current;
      resize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      const [r, g, b, a] = s.back;
      gl.clearColor(r * a, g * a, b * a, a);
      gl.clear(gl.COLOR_BUFFER_BIT);
      syncRibbons();
      const count = state.ribbons.length;
      const needed = count * SAMPLES * 2 * STRIDE;
      if (vertices.length < needed) vertices = new Float32Array(needed);
      const ranges: [number, number][] = [];
      for (let i = 0; i < count; i++) {
        const offset = i * SAMPLES * 2 * STRIDE;
        ranges.push([offset / STRIDE, build(state.ribbons[i], vertices, offset)]);
      }
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices.subarray(0, needed), gl.DYNAMIC_DRAW);
      gl.uniform2f(uniforms.u_resolution, state.width, state.height);
      gl.uniform1f(uniforms.u_opacity, s.opacity);
      gl.uniform1f(uniforms.u_fade, s.fade ? 1 : 0);
      gl.uniform1f(uniforms.u_softness, s.softness);
      for (let i = 0; i < count; i++) {
        const [first, size] = ranges[i];
        if (!size) continue;
        gl.uniform3fv(uniforms.u_color, s.colors[i].slice(0, 3));
        gl.drawArrays(gl.TRIANGLE_STRIP, first, size);
      }
    };

    const frame = (now: number) => {
      state.raf = 0;
      if (!state.alive) return;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;
      state.time += dt;
      syncRibbons();
      state.accumulator += dt;
      while (state.accumulator >= STEP) {
        simulate(STEP);
        state.accumulator -= STEP;
      }
      draw();
      if (state.visible) state.raf = requestAnimationFrame(frame);
      else state.last = 0;
    };

    const wake = () => {
      if (!state.raf && state.alive && state.visible) state.raf = requestAnimationFrame(frame);
    };

    const onMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      state.mouseX = x;
      state.mouseY = y;
      state.placed = true;
      wake();
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(container);

    const visibility = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      if (state.visible) wake();
    });
    visibility.observe(container);

    const onLost = (event: Event) => {
      event.preventDefault();
      state.alive = false;
      cancelAnimationFrame(state.raf);
    };

    canvas.addEventListener('webglcontextlost', onLost);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });

    engineRef.current = {
      redraw: () => {
        draw();
        wake();
      }
    };

    resize();
    syncRibbons();
    wake();

    return () => {
      state.alive = false;
      cancelAnimationFrame(state.raf);
      resizeObserver.disconnect();
      visibility.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      engineRef.current = null;
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
  }, []);

  useEffect(() => {
    engineRef.current?.redraw();
  });

  return (
    <div ref={containerRef} className={`pointer-events-none relative h-full w-full ${className}`.trim()} style={style}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
