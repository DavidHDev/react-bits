'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';
import './RippleGrid.css';

export type RippleGridVariant = 'lines' | 'dots' | 'cross';
export type RippleGridAutoRipple = 'center' | 'random' | 'none';

export interface RippleGridProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
  variant?: RippleGridVariant;
  cellSize?: number;
  lineWidth?: number;
  glow?: number;
  rippleStrength?: number;
  rippleSpeed?: number;
  rippleSize?: number;
  autoRipple?: RippleGridAutoRipple;
  rippleInterval?: number;
  tilt?: number;
  rotation?: number;
  mouseInteraction?: boolean;
  clickRipple?: boolean;
  intro?: boolean;
  fade?: number;
  opacity?: number;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
}

type Settings = {
  color: string;
  variant: number;
  cellSize: number;
  lineWidth: number;
  glow: number;
  rippleStrength: number;
  rippleSpeed: number;
  rippleSize: number;
  autoRipple: RippleGridAutoRipple;
  rippleInterval: number;
  tilt: number;
  rotation: number;
  mouseInteraction: boolean;
  clickRipple: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
};

type Ripple = { x: number; y: number; born: number; strength: number };

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const MAX_RIPPLES = 12;
const VARIANTS: Record<string, number> = { lines: 0, dots: 1, cross: 2 };

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uView;
uniform float uRatio;
uniform float uCell;
uniform float uLineWidth;
uniform float uGlow;
uniform float uTilt;
uniform float uFocal;
uniform vec2 uTurn;
uniform vec4 uRipples[${MAX_RIPPLES}];
uniform int uRippleCount;
uniform float uWaveLength;
uniform float uWaveSpeed;
uniform float uStrength;
uniform vec3 uPointer;
uniform vec3 uColor;
uniform vec3 uInk;
uniform float uPresence;
uniform float uReveal;
uniform float uFade;
uniform float uOpacity;
uniform float uLightMode;
uniform int uVariant;
out vec4 outColor;

float smootherstep(float edge, float x) {
  float t = clamp(x / max(edge, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 css = gl_FragCoord.xy / uRatio;
  vec2 screen = vec2(css.x - uView.x * 0.5, uView.y * 0.5 - css.y);
  vec2 plane = screen;
  float horizon = 1.0;
  if (uTilt > 0.0001) {
    float depth = uFocal + screen.y * tan(uTilt);
    horizon = smoothstep(0.0, uFocal * 0.35, depth);
    float scale = uFocal / max(depth, 0.001);
    plane = vec2(screen.x * scale, screen.y * scale / cos(uTilt));
  }

  vec2 push = vec2(0.0);
  float lift = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    if (i >= uRippleCount) break;
    vec4 ripple = uRipples[i];
    vec2 delta = plane - ripple.xy;
    float dist = length(delta);
    float x = (dist - ripple.z * uWaveSpeed) / uWaveLength;
    float packet = exp(-x * x * 1.8);
    float spread = 1.0 / (1.0 + dist / (uWaveLength * 5.0));
    float calm = smoothstep(0.0, uWaveLength * 0.9, dist);
    float wave = sin(x * 6.28318) * packet * spread * calm * ripple.w;
    push += (dist > 0.001 ? delta / dist : vec2(0.0)) * wave;
    lift += wave;
  }

  vec2 bent = plane + push * uStrength * uCell * 0.22;
  vec2 grid = mat2(uTurn.x, uTurn.y, -uTurn.y, uTurn.x) * bent / uCell;
  vec2 fw = max(fwidth(grid), vec2(0.00001));
  vec2 offset = abs(fract(grid - 0.5) - 0.5);
  vec2 dist = offset / fw;
  float width = max(uLineWidth * uRatio, 1.0);
  float thin = min(uLineWidth * uRatio, 1.0);
  float shape = 0.0;
  float edge = min(dist.x, dist.y);
  if (uVariant == 1) {
    edge = length(dist);
    shape = (1.0 - smoothstep(width * 1.7 - 0.5, width * 1.7 + 0.5, edge)) * thin * 1.8;
  } else if (uVariant == 2) {
    float arm = 0.16;
    vec2 cover = (1.0 - smoothstep(width * 0.5 - 0.5, width * 0.5 + 0.5, dist)) * thin;
    vec2 reach = 1.0 - smoothstep(arm - fw * 0.5, arm + fw * 0.5, offset);
    shape = max(cover.x * reach.y, cover.y * reach.x);
    edge = max(min(dist.x, dist.y), length(max(offset - arm, 0.0) / fw));
  } else {
    vec2 cover = (1.0 - smoothstep(width * 0.5 - 0.5, width * 0.5 + 0.5, dist)) * thin;
    shape = max(cover.x, cover.y);
  }
  float halo = exp(-edge / (uRatio * 2.4)) * uGlow;
  float far = 1.0 - smoothstep(0.18, 0.5, max(fw.x, fw.y));

  vec2 toPointer = (plane - uPointer.xy) / (uCell * 3.2);
  float near = uPointer.z * exp(-dot(toPointer, toPointer));
  float shine = max(1.0 + lift * 3.4 * uStrength, 0.25) * (1.0 + near * 1.6);

  float radius = length(plane);
  float reveal = 1.0 - smoothstep(uReveal - uCell * 4.0, uReveal, radius);
  vec2 uv = gl_FragCoord.xy / (uView * uRatio);
  float edgeFade = uFade * 0.5;
  float mask = smootherstep(edgeFade, uv.x) * smootherstep(edgeFade, 1.0 - uv.x) * smootherstep(edgeFade, uv.y) * smootherstep(edgeFade, 1.0 - uv.y);
  mask *= horizon * far * reveal * uPresence * uOpacity;

  float level = (shape * 0.26 + halo * 0.1) * shine * mask;
  float dither = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  if (uLightMode > 0.5) {
    float alpha = clamp(level * 1.2 + dither, 0.0, 1.0);
    outColor = vec4(uInk * alpha, alpha);
  } else {
    float alpha = clamp(level + dither, 0.0, 1.0);
    vec3 color = mix(uColor, vec3(1.0), clamp(level - 0.7, 0.0, 1.0));
    outColor = vec4(color * alpha, alpha);
  }
}`;

const INTRO_SECONDS = 1.6;

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
  gl.bindAttribLocation(program, 0, 'aPosition');
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
    if (info) uniforms[info.name.replace('[0]', '')] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

export const RippleGrid = ({
  color = '#ffffff',
  variant = 'lines',
  cellSize = 48,
  lineWidth = 1,
  glow = 0.6,
  rippleStrength = 1,
  rippleSpeed = 1,
  rippleSize = 1,
  autoRipple = 'center',
  rippleInterval = 2.6,
  tilt = 0,
  rotation = 0,
  mouseInteraction = true,
  clickRipple = true,
  intro = true,
  fade = 0.5,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  ...rest
}: RippleGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    color: String(color),
    variant: VARIANTS[variant] ?? 0,
    cellSize: Math.max(8, cellSize),
    lineWidth: Math.max(0.25, lineWidth),
    glow: Math.max(0, glow),
    rippleStrength: Math.max(0, rippleStrength),
    rippleSpeed: Math.max(0.05, rippleSpeed),
    rippleSize: Math.max(0.2, rippleSize),
    autoRipple,
    rippleInterval: Math.max(0.3, rippleInterval),
    tilt: clamp(tilt, 0, 80),
    rotation,
    mouseInteraction,
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

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const colorCache = new Map<string, number[]>();
    const toLinear = (value: string): number[] => {
      const cached = colorCache.get(value);
      if (cached) return cached;
      let rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#ffffff';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r, g, b].map(v => Math.pow(v / 255, 2.2));
      }
      colorCache.set(value, rgb);
      return rgb;
    };

    const view = { width: 1, height: 1, ratio: 1 };
    const pointer = { x: 0, y: 0, inside: false, planeX: 0, planeY: 0, lastX: 0, lastY: 0, travel: 0 };
    const state = { clock: 0, intro: settingsRef.current.intro && !reduce ? 0 : 1, glow: 0, nextAuto: 0.4 };
    const ripples: Ripple[] = [];
    const packed = new Float32Array(MAX_RIPPLES * 4);
    let raf = 0;
    let last = 0;
    let visible = true;

    const focalOf = () => view.height * 1.15;

    const toPlane = (x: number, y: number): [number, number] | null => {
      const s = settingsRef.current;
      const sx = x - view.width / 2;
      const sy = y - view.height / 2;
      const tilt = (s.tilt * Math.PI) / 180;
      if (tilt <= 0.0001) return [sx, sy];
      const focal = focalOf();
      const depth = focal + sy * Math.tan(tilt);
      if (depth <= focal * 0.05) return null;
      const scale = focal / depth;
      return [sx * scale, (sy * scale) / Math.cos(tilt)];
    };

    const spawn = (x: number, y: number, strength: number) => {
      ripples.push({ x, y, born: state.clock, strength });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    };

    const render = () => {
      const s = settingsRef.current;
      const presence = state.intro * state.intro * (3 - 2 * state.intro);
      const waveLength = s.cellSize * 2.4 * s.rippleSize;
      const waveSpeed = 240 * s.rippleSpeed;
      let count = 0;
      for (let i = ripples.length - 1; i >= 0 && count < MAX_RIPPLES; i--) {
        const r = ripples[i];
        const age = state.clock - r.born;
        packed[count * 4] = r.x;
        packed[count * 4 + 1] = r.y;
        packed[count * 4 + 2] = age;
        packed[count * 4 + 3] = r.strength * Math.exp(-age * 0.55);
        count++;
      }
      const angle = (s.rotation * Math.PI) / 180;
      const tint = toLinear(s.color);
      const tone = 0.2126 * tint[0] + 0.7152 * tint[1] + 0.0722 * tint[2];
      const depth = Math.min(1, 0.12 / Math.max(tone, 0.001));
      const ink = tint.map(v => Math.pow(Math.min(1, v * depth), 1 / 2.2));
      const diagonal = Math.hypot(view.width, view.height);

      gl.bindVertexArray(vao);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program.program);
      gl.uniform2f(u.uView, view.width, view.height);
      gl.uniform1f(u.uRatio, view.ratio);
      gl.uniform1f(u.uCell, s.cellSize);
      gl.uniform1f(u.uLineWidth, s.lineWidth);
      gl.uniform1f(u.uGlow, s.glow);
      gl.uniform1f(u.uTilt, (s.tilt * Math.PI) / 180);
      gl.uniform1f(u.uFocal, focalOf());
      gl.uniform2f(u.uTurn, Math.cos(angle), Math.sin(angle));
      gl.uniform4fv(u.uRipples, packed);
      gl.uniform1i(u.uRippleCount, count);
      gl.uniform1f(u.uWaveLength, waveLength);
      gl.uniform1f(u.uWaveSpeed, waveSpeed);
      gl.uniform1f(u.uStrength, s.rippleStrength);
      gl.uniform3f(u.uPointer, pointer.planeX, pointer.planeY, state.glow);
      gl.uniform3fv(
        u.uColor,
        tint.map(v => Math.pow(v, 1 / 2.2))
      );
      gl.uniform3fv(u.uInk, ink);
      gl.uniform1f(u.uPresence, Math.min(1, presence * 1.6));
      gl.uniform1f(u.uReveal, s.intro && !reduce ? presence * diagonal * 1.4 + s.cellSize * 4 : 1e6);
      gl.uniform1f(u.uFade, s.fade);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.uniform1f(u.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform1i(u.uVariant, s.variant);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) state.clock += dt;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

      if (moving && s.autoRipple !== 'none' && state.clock >= state.nextAuto) {
        if (s.autoRipple === 'random') {
          const spot = toPlane(Math.random() * view.width, view.height * (0.2 + Math.random() * 0.7));
          if (spot) spawn(spot[0], spot[1], 0.75);
        } else {
          spawn(0, 0, 1);
        }
        state.nextAuto = state.clock + s.rippleInterval;
      }
      const lifetime = 9 / Math.max(0.2, s.rippleSpeed);
      while (ripples.length && state.clock - ripples[0].born > lifetime) ripples.shift();

      const engaged = s.mouseInteraction && pointer.inside && !reduce;
      state.glow += ((engaged ? 1 : 0) - state.glow) * (1 - Math.exp(-dt * (engaged ? 6 : 2.5)));
      render();

      const settling = state.intro < 1 || Math.abs((engaged ? 1 : 0) - state.glow) > 0.002;
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
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      view.width = width;
      view.height = height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      view.ratio = canvas.width / width;
      if (!raf) render();
      wake();
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      const spot = pointer.inside ? toPlane(x, y) : null;
      if (spot) {
        const s = settingsRef.current;
        const step = Math.hypot(spot[0] - pointer.planeX, spot[1] - pointer.planeY);
        pointer.planeX = spot[0];
        pointer.planeY = spot[1];
        if (s.mouseInteraction && !reduce && step < s.cellSize * 6) {
          pointer.travel += step;
          if (pointer.travel > s.cellSize * 1.6) {
            pointer.travel = 0;
            spawn(spot[0], spot[1], 0.32);
          }
        }
      } else {
        pointer.inside = false;
      }
      pointer.x = x;
      pointer.y = y;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      if (!s.clickRipple || reduce) return;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const spot = toPlane(x, y);
      if (spot) spawn(spot[0], spot[1], 1.2);
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
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    if (settingsRef.current.intro && !reduce) spawn(0, 0, 1.1);
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
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteProgram(program.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div ref={containerRef} className={`ripple-grid-container${className ? ` ${className}` : ''}`} {...rest}>
      <canvas ref={canvasRef} className="ripple-grid-canvas" aria-hidden="true" />
    </div>
  );
};

export default RippleGrid;
