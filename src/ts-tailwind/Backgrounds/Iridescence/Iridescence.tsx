'use client';

import React, { useEffect, useRef } from 'react';

export interface IridescenceProps {
  color?: string | [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  scale?: number;
  detail?: number;
  rotation?: number;
  warp?: number;
  hueShift?: number;
  saturation?: number;
  brightness?: number;
  contrast?: number;
  stir?: number;
  sheen?: number;
  clickSwirl?: boolean;
  grain?: number;
  fade?: number;
  opacity?: number;
  resolution?: number;
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

type Swirl = { x: number; y: number; age: number };

const ROOT = 'relative h-full w-full overflow-hidden';
const CANVAS = 'absolute inset-0 block h-full w-full';

const VERTEX = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uScale;
uniform float uRotation;
uniform int uDetail;
uniform float uWarp;
uniform float uHue;
uniform float uSaturation;
uniform float uBrightness;
uniform float uContrast;
uniform float uGrain;
uniform float uSeed;
uniform float uFade;
uniform float uOpacity;
uniform sampler2D uField;
uniform float uStir;
uniform vec3 uPointer;
uniform float uSheen;
uniform vec4 uSwirls[6];
in vec2 vUv;
out vec4 outColor;

vec3 hueRotate(vec3 c, float angle) {
  const vec3 k = vec3(0.57735027);
  float ca = cos(angle);
  return c * ca + cross(k, c) * sin(angle) + k * dot(k, c) * (1.0 - ca);
}

float smootherstep(float edge, float x) {
  float t = clamp(x / edge, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 aspect = uResolution / mr;
  vec2 st = vUv - texture(uField, vUv).rg * uStir;

  for (int k = 0; k < 6; k++) {
    vec4 swirl = uSwirls[k];
    if (swirl.w == 0.0) continue;
    vec2 delta = (st - swirl.xy) * aspect;
    float angle = swirl.w * exp(-dot(delta, delta) / (swirl.z * swirl.z));
    float ca = cos(angle);
    float sa = sin(angle);
    st = swirl.xy + vec2(ca * delta.x - sa * delta.y, sa * delta.x + ca * delta.y) / aspect;
  }

  vec2 uv = (st * 2.0 - 1.0) * aspect;
  float c = cos(uRotation);
  float s = sin(uRotation);
  uv = mat2(c, -s, s, c) * uv / uScale;
  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5;
  float a = 0.0;
  for (int i = 0; i < 24; i++) {
    if (i >= uDetail) break;
    float fi = float(i);
    a += cos(fi - d - a * uv.x * uWarp);
    d += sin(uv.y * fi + a);
  }
  d += uTime * 0.5;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;

  vec2 toPointer = (vUv - uPointer.xy) * aspect;
  col += col * uPointer.z * uSheen * 0.8 * exp(-dot(toPointer, toPointer) / 0.09);

  col = hueRotate(col, uHue);
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(luma), col, uSaturation);
  col = (col - 0.5) * uContrast + 0.5;
  col *= uBrightness;
  col += (hash(gl_FragCoord.xy + uSeed) - 0.5) * uGrain * 0.12;
  col = clamp(col, 0.0, 1.0);

  float alpha = uOpacity;
  if (uFade > 0.0) {
    vec2 px = vUv * uResolution;
    float edge = uFade * mr * 0.5;
    alpha *= smootherstep(edge, px.x) * smootherstep(edge, uResolution.x - px.x);
    alpha *= smootherstep(edge, px.y) * smootherstep(edge, uResolution.y - px.y);
  }
  outColor = vec4(col * alpha, alpha);
}`;

const FIELD_COLUMNS = 48;
const MAX_SWIRLS = 6;
const SWIRL_LIFE = 3.2;

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

const Iridescence = ({
  color = [1, 1, 1],
  speed = 1,
  amplitude = 0.1,
  mouseReact = true,
  scale = 1,
  detail = 8,
  rotation = 0,
  warp = 1,
  hueShift = 0,
  saturation = 1,
  brightness = 1.5,
  contrast = 1,
  stir = 0.5,
  sheen = 0.3,
  clickSwirl = true,
  grain = 0,
  fade = 0,
  opacity = 1,
  resolution = 1,
  paused = false,
  className = '',
  style
}: IridescenceProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const colorKey = Array.isArray(color) ? color.join(',') : String(color);
  const settings = {
    colorKey,
    color,
    speed,
    amplitude,
    mouseReact,
    scale: Math.max(0.05, scale),
    detail: clamp(Math.round(detail), 1, 24),
    rotation,
    warp,
    hueShift,
    saturation: Math.max(0, saturation),
    brightness: Math.max(0, brightness),
    contrast: Math.max(0, contrast),
    stir: Math.max(0, stir),
    sheen: Math.max(0, sheen),
    clickSwirl,
    grain: clamp(grain, 0, 1),
    fade: clamp(fade, 0, 1),
    opacity: clamp(opacity, 0, 1),
    resolution: clamp(resolution, 0.1, 2),
    paused
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!root || !canvas || !gl) return undefined;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return undefined;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of [
      'uResolution',
      'uTime',
      'uColor',
      'uMouse',
      'uAmplitude',
      'uScale',
      'uRotation',
      'uDetail',
      'uWarp',
      'uHue',
      'uSaturation',
      'uBrightness',
      'uContrast',
      'uGrain',
      'uSeed',
      'uFade',
      'uOpacity',
      'uField',
      'uStir',
      'uPointer',
      'uSheen',
      'uSwirls'
    ]) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }

    const fieldTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(uniforms.uField, 0);

    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeCtx = probe.getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const pointer = { x: 0.5, y: 0.5, px: 0, py: 0, inside: false, tracked: false };
    const state = {
      width: 1,
      height: 1,
      phase: 0,
      mouse: [0.5, 0.5] as number[],
      presence: 0,
      color: [1, 1, 1] as number[],
      colorKey: '',
      cols: 0,
      rows: 0,
      field: new Float32Array(0),
      scratch: new Float32Array(0),
      fieldActive: false,
      swirls: [] as Swirl[],
      seed: 0
    };
    const swirlData = new Float32Array(MAX_SWIRLS * 4);
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;

    const resolveColor = (s: typeof settings) => {
      if (s.colorKey === state.colorKey) return;
      state.colorKey = s.colorKey;
      if (Array.isArray(s.color)) {
        const rgb = s.color as number[];
        state.color = [0, 1, 2].map(i => clamp(Number(rgb[i] ?? 1), 0, 1));
        return;
      }
      if (!probeCtx) return;
      probeCtx.clearRect(0, 0, 1, 1);
      probeCtx.fillStyle = '#ffffff';
      probeCtx.fillStyle = String(s.color);
      probeCtx.fillRect(0, 0, 1, 1);
      const [r, g, b] = probeCtx.getImageData(0, 0, 1, 1).data;
      state.color = [r / 255, g / 255, b / 255];
    };

    const layoutField = () => {
      const cols = FIELD_COLUMNS;
      const rows = clamp(Math.round((cols * state.height) / state.width), 6, 96);
      if (cols === state.cols && rows === state.rows) return;
      state.cols = cols;
      state.rows = rows;
      state.field = new Float32Array(cols * rows * 2);
      state.scratch = new Float32Array(cols * rows * 2);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, cols, rows, 0, gl.RG, gl.FLOAT, state.field);
    };

    const brush = (x: number, y: number, dx: number, dy: number) => {
      const { cols, rows, field } = state;
      const radius = 0.22;
      const aspect = state.width / state.height;
      const fromCol = Math.max(0, Math.floor((x - radius / aspect) * cols));
      const toCol = Math.min(cols - 1, Math.ceil((x + radius / aspect) * cols));
      const fromRow = Math.max(0, Math.floor((y - radius) * rows));
      const toRow = Math.min(rows - 1, Math.ceil((y + radius) * rows));
      for (let row = fromRow; row <= toRow; row++) {
        for (let col = fromCol; col <= toCol; col++) {
          const ox = ((col + 0.5) / cols - x) * aspect;
          const oy = (row + 0.5) / rows - y;
          const t = 1 - (ox * ox + oy * oy) / (radius * radius);
          if (t <= 0) continue;
          const i = (row * cols + col) * 2;
          const px = field[i] + dx * t * t * 3.2;
          const py = field[i + 1] + dy * t * t * 3.2;
          const length = Math.hypot(px, py);
          const limit = 0.4;
          const k = length > 0 ? (limit * Math.tanh(length / limit)) / length : 0;
          field[i] = px * k;
          field[i + 1] = py * k;
        }
      }
      state.fieldActive = true;
    };

    const relaxField = (dt: number) => {
      const { cols, rows, field, scratch } = state;
      const decay = Math.exp(-dt * 1.4);
      let peak = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = (row * cols + col) * 2;
          const l = (row * cols + Math.max(0, col - 1)) * 2;
          const r = (row * cols + Math.min(cols - 1, col + 1)) * 2;
          const u = (Math.max(0, row - 1) * cols + col) * 2;
          const b = (Math.min(rows - 1, row + 1) * cols + col) * 2;
          for (let c = 0; c < 2; c++) {
            const value = (field[i + c] * 12 + field[l + c] + field[r + c] + field[u + c] + field[b + c]) / 16;
            scratch[i + c] = value * decay;
            peak = Math.max(peak, Math.abs(scratch[i + c]));
          }
        }
      }
      field.set(scratch);
      if (peak < 0.0004) {
        field.fill(0);
        state.fieldActive = false;
      }
    };

    const render = () => {
      const s = settingsRef.current;
      resolveColor(s);
      layoutField();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, state.cols, state.rows, gl.RG, gl.FLOAT, state.field);
      swirlData.fill(0);
      state.swirls.forEach((swirl, k) => {
        const radius = 0.21 * (1 + 0.4 * swirl.age);
        const ease = Math.exp(-swirl.age * 1.35) - Math.exp(-swirl.age * 10);
        const fade = Math.min(1, (SWIRL_LIFE - swirl.age) / 0.8);
        swirlData.set([swirl.x, swirl.y, radius, 3 * ease * fade * (0.21 / radius) ** 2], k * 4);
      });
      gl.uniform2f(uniforms.uResolution, state.width, state.height);
      gl.uniform1f(uniforms.uTime, state.phase);
      gl.uniform3f(uniforms.uColor, state.color[0], state.color[1], state.color[2]);
      gl.uniform2f(uniforms.uMouse, state.mouse[0], state.mouse[1]);
      gl.uniform1f(uniforms.uAmplitude, s.amplitude);
      gl.uniform1f(uniforms.uScale, s.scale);
      gl.uniform1f(uniforms.uRotation, (s.rotation * Math.PI) / 180);
      gl.uniform1i(uniforms.uDetail, s.detail);
      gl.uniform1f(uniforms.uWarp, s.warp);
      gl.uniform1f(uniforms.uHue, (s.hueShift * Math.PI) / 180);
      gl.uniform1f(uniforms.uSaturation, s.saturation);
      gl.uniform1f(uniforms.uBrightness, s.brightness);
      gl.uniform1f(uniforms.uContrast, s.contrast);
      gl.uniform1f(uniforms.uGrain, s.grain);
      gl.uniform1f(uniforms.uSeed, state.seed);
      gl.uniform1f(uniforms.uFade, s.fade);
      gl.uniform1f(uniforms.uOpacity, s.opacity);
      gl.uniform1f(uniforms.uStir, s.mouseReact ? s.stir : 0);
      gl.uniform3f(uniforms.uPointer, pointer.x, pointer.y, s.mouseReact ? state.presence : 0);
      gl.uniform1f(uniforms.uSheen, s.sheen);
      gl.uniform4fv(uniforms.uSwirls, swirlData);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive || !visible) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) state.phase += dt * s.speed;
      const target = s.mouseReact && pointer.tracked ? [pointer.x, pointer.y] : [0.5, 0.5];
      const follow = 1 - Math.exp(-dt * 5);
      state.mouse[0] += (target[0] - state.mouse[0]) * follow;
      state.mouse[1] += (target[1] - state.mouse[1]) * follow;
      state.presence += ((pointer.inside ? 1 : 0) - state.presence) * (1 - Math.exp(-dt * 4));
      if (state.fieldActive) relaxField(dt);
      state.swirls = state.swirls.filter(swirl => (swirl.age += dt) < SWIRL_LIFE);
      if (s.grain > 0 && moving) state.seed = Math.floor(now / 42) % 997;
      render();
      const settling =
        Math.abs(target[0] - state.mouse[0]) > 0.0005 ||
        Math.abs(target[1] - state.mouse[1]) > 0.0005 ||
        Math.abs((pointer.inside ? 1 : 0) - state.presence) > 0.002;
      if (moving || settling || state.fieldActive || state.swirls.length) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (raf || !alive || !visible) return;
      raf = requestAnimationFrame(frame);
    };

    const locate = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / Math.max(1, rect.width),
        y: 1 - (event.clientY - rect.top) / Math.max(1, rect.height)
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const s = settingsRef.current;
      const { x, y } = locate(event);
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (inside && s.mouseReact && !reduce && pointer.inside && s.stir > 0) {
        brush(x, y, x - pointer.x, y - pointer.y);
      }
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
      if (inside) pointer.tracked = true;
      wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      if (!s.clickSwirl || reduce) return;
      const { x, y } = locate(event);
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      if (state.swirls.length >= MAX_SWIRLS) {
        if (state.swirls[0].age < SWIRL_LIFE - 0.4) return;
        state.swirls.shift();
      }
      state.swirls.push({ x, y, age: 0 });
      wake();
    };

    const resize = () => {
      const s = settingsRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * s.resolution;
      state.width = Math.max(1, root.clientWidth);
      state.height = Math.max(1, root.clientHeight);
      canvas.width = Math.max(1, Math.round(state.width * dpr));
      canvas.height = Math.max(1, Math.round(state.height * dpr));
      render();
      wake();
    };

    wakeRef.current = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * settingsRef.current.resolution;
      if (canvas.width !== Math.max(1, Math.round(state.width * dpr))) resize();
      else if (!raf) render();
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    visibility.observe(root);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      gl.deleteTexture(fieldTexture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div ref={rootRef} className={`${ROOT}${className ? ` ${className}` : ''}`} style={style}>
      <canvas ref={canvasRef} className={CANVAS} aria-hidden="true" />
    </div>
  );
};

export default Iridescence;
