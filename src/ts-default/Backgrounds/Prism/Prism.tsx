'use client';

import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react';
import './Prism.css';

export type PrismAnimation = 'rotate' | '3drotate' | 'rotate3d' | 'hover' | 'static';

export interface PrismProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  height?: number;
  baseWidth?: number;
  animationType?: PrismAnimation;
  glow?: number;
  offset?: { x?: number; y?: number };
  noise?: number;
  scale?: number;
  hueShift?: number;
  colorFrequency?: number;
  colors?: string[];
  saturation?: number;
  timeScale?: number;
  interactive?: boolean;
  hoverStrength?: number;
  inertia?: number;
  intro?: boolean;
  resolution?: number;
  lightMode?: boolean;
  dpr?: number;
  style?: CSSProperties;
}

type Settings = {
  height: number;
  baseWidth: number;
  animationType: string;
  glow: number;
  offsetX: number;
  offsetY: number;
  noise: number;
  scale: number;
  hueShift: number;
  colorFrequency: number;
  colors: string[];
  saturation: number;
  timeScale: number;
  interactive: boolean;
  hoverStrength: number;
  inertia: number;
  intro: boolean;
  resolution: number;
  lightMode: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const INTRO_SECONDS = 1.4;
const PALETTE_SIZE = 64;
const HUE_W = [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114];
const HUE_U = [0.701, -0.587, -0.114, -0.299, 0.413, -0.114, -0.3, -0.588, 0.886];
const HUE_V = [0.168, -0.331, 0.5, 0.328, 0.035, -0.5, -0.497, 0.296, 0.201];

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform mat3 uRay;
uniform float uGlow;
uniform vec2 uOffset;
uniform float uColorFreq;
uniform float uCenterShift;
uniform float uInvBaseHalf;
uniform float uInvHeight;
uniform float uMinAxis;
uniform float uPxScale;
uniform sampler2D uPalette;
uniform int uUsePalette;
uniform float uTime;
uniform float uNoise;
uniform float uSaturation;
uniform mat3 uHue;
uniform int uUseHue;
uniform float uLight;
uniform float uNeutral;
out vec4 outColor;

const vec4 PHASE_COS = vec4(1.0, 0.5403023058681398, -0.4161468365471424, -0.9899924966004454);
const vec4 PHASE_SIN = vec4(0.0, 0.8414709848078965, 0.9092974268256817, 0.1411200080598672);

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
}

float pyramid(vec3 p) {
  vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
  return max((q.x + q.y + q.z - 1.0) * uMinAxis * 0.5773502691896258, -p.y);
}

vec3 grade(vec3 col, vec2 seed) {
  col += (rand(seed) - 0.5) * uNoise;
  col = clamp(col, 0.0, 1.0);
  float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);
  if (uUseHue == 1) col = clamp(uHue * col, 0.0, 1.0);
  return col;
}

void main() {
  vec2 f = (gl_FragCoord.xy - 0.5 * uResolution - uOffset) * uPxScale;
  vec3 origin = uRay * vec3(f, 0.0);
  vec3 axis = uRay[2];
  float z = 5.0;
  vec4 o = vec4(0.0);
  for (int i = 0; i < 100; i++) {
    vec3 p = origin + axis * z;
    float d = 0.1 + 0.2 * abs(pyramid(p + vec3(0.0, uCenterShift, 0.0)));
    z -= d;
    float phase = (p.y + z) * uColorFreq;
    vec4 band = sin(phase) * PHASE_COS + cos(phase) * PHASE_SIN + 1.0;
    if (uUsePalette == 1) band.rgb = texture(uPalette, vec2(phase * 0.15915494309189535, 0.5)).rgb * 2.0;
    o += band / d;
  }
  vec4 raw = o * o * uGlow / 1e5;
  vec4 e = exp(2.0 * raw);
  vec4 mapped = (e - 1.0) / (e + 1.0);
  vec2 seed = gl_FragCoord.xy + vec2(uTime);
  if (uLight > 0.5) {
    float peak = max(raw.r, max(raw.g, raw.b));
    vec3 hue = grade(raw.rgb / max(peak, 1e-6), seed);
    vec3 ink = pow(hue, vec3(1.5)) * mix(0.86, 0.32, uNeutral);
    float strength = max(mapped.r, max(mapped.g, mapped.b)) * mapped.a;
    float cover = clamp(strength * 0.95 + (rand(seed.yx) - 0.5) * uNoise * 0.5, 0.0, 1.0);
    outColor = vec4(ink * cover, cover);
  } else {
    outColor = vec4(grade(mapped.rgb, seed) * mapped.a, mapped.a);
  }
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

const rotation = (yaw: number, pitch: number, roll: number): number[] => {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);
  const cz = Math.cos(roll);
  const sz = Math.sin(roll);
  return [
    cy * cz + sy * sx * sz,
    cx * sz,
    -sy * cz + cy * sx * sz,
    -cy * sz + sy * sx * cz,
    cx * cz,
    sy * sz + cy * sx * cz,
    sy * cx,
    -sx,
    cy * cx
  ];
};

const multiply = (a: number[], b: number[]) => {
  const out: number[] = new Array(9);
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 3; r++) {
      out[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2];
    }
  }
  return out;
};

const Prism = ({
  height = 3.5,
  baseWidth = 5.5,
  animationType = 'rotate',
  glow = 1,
  offset,
  noise = 0,
  scale = 3.6,
  hueShift = 0,
  colorFrequency = 1,
  colors,
  saturation = 1.5,
  timeScale = 0.5,
  interactive = true,
  hoverStrength = 2,
  inertia = 0.05,
  intro = true,
  resolution = 0.5,
  lightMode = false,
  dpr,
  className = '',
  style,
  ...rest
}: PrismProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const palette = Array.isArray(colors) ? colors.filter(Boolean).slice(0, 8) : [];
  const settings: Settings = {
    height: Math.max(0.1, height),
    baseWidth: Math.max(0.1, baseWidth),
    animationType: animationType === 'rotate3d' ? '3drotate' : animationType,
    glow: Math.max(0, glow),
    offsetX: offset?.x ?? 0,
    offsetY: offset?.y ?? 0,
    noise: Math.max(0, noise),
    scale: Math.max(0.1, scale),
    hueShift: ((hueShift || 0) * Math.PI) / 180,
    colorFrequency: Math.max(0, colorFrequency),
    colors: palette,
    saturation: Math.max(0, saturation),
    timeScale: Math.max(0, timeScale),
    interactive,
    hoverStrength: Math.max(0, hoverStrength),
    inertia: clamp(inertia, 0.001, 1),
    intro,
    resolution: clamp(resolution, 0.25, 1),
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
    const vao = gl.createVertexArray();
    const paletteTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, PALETTE_SIZE, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const parse = (value: string): number[] => {
      if (!probe) return [255, 255, 255];
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = String(value);
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    };
    let paletteKey = '';
    let neutral = 0;
    const syncPalette = (colorsList: string[]) => {
      const key = colorsList.join(',');
      if (key === paletteKey) return;
      paletteKey = key;
      neutral = 0;
      if (!colorsList.length) return;
      const stops = colorsList.map(parse);
      neutral =
        1 -
        stops.reduce((sum, [r, g, b]) => {
          const top = Math.max(r, g, b);
          return sum + (top > 0 ? (top - Math.min(r, g, b)) / top : 0);
        }, 0) /
          stops.length;
      const data = new Uint8Array(PALETTE_SIZE * 4);
      for (let i = 0; i < PALETTE_SIZE; i++) {
        const position = (i / PALETTE_SIZE) * stops.length;
        const index = Math.floor(position);
        const a = stops[index % stops.length];
        const b = stops[(index + 1) % stops.length];
        const t = position - index;
        const k = t * t * (3 - 2 * t);
        for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(a[c] + (b[c] - a[c]) * k);
        data[i * 4 + 3] = 255;
      }
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, PALETTE_SIZE, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const view = { width: 1, height: 1, scale: 1 };
    const pose = { yaw: 0, pitch: 0, roll: 0 };
    const pointer = { x: 0, y: 0, inside: false };
    let time = 0;
    let introClock = settingsRef.current.intro && !reduce ? 0 : 1;
    let raf = 0;
    let last = 0;
    let visible = true;

    const orientation = (s: Settings) => {
      const tilt = rotation(pose.yaw, pose.pitch, pose.roll);
      if (s.animationType === 'rotate') {
        const t = time * s.timeScale;
        const c0 = Math.cos(t);
        const c1 = Math.cos(t + 33);
        const c2 = Math.cos(t + 11);
        return multiply(tilt, [c0, 0, c2, 0, 1, 0, c1, 0, c0]);
      }
      if (s.animationType === '3drotate') {
        const t = time * s.timeScale;
        return multiply(tilt, rotation(t * 0.55, Math.sin(t * 0.6 + 0.6) * 0.6, Math.sin(t * 0.35 + 1.9) * 0.5));
      }
      return tilt;
    };

    const draw = () => {
      const s = settingsRef.current;
      syncPalette(s.colors);
      const half = s.baseWidth * 0.5;
      const ignite = introClock * introClock * (3 - 2 * introClock);
      const c = Math.cos(s.hueShift);
      const sn = Math.sin(s.hueShift);
      gl.bindVertexArray(vao);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(shader.program);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniformMatrix3fv(u.uRay, false, orientation(s));
      gl.uniform1f(u.uGlow, s.glow * ignite * ignite);
      gl.uniform2f(u.uOffset, s.offsetX * view.scale, -s.offsetY * view.scale);
      gl.uniform1f(u.uColorFreq, s.colorFrequency);
      gl.uniform1f(u.uCenterShift, s.height * 0.25);
      gl.uniform1f(u.uInvBaseHalf, 1 / half);
      gl.uniform1f(u.uInvHeight, 1 / s.height);
      gl.uniform1f(u.uMinAxis, Math.min(half, s.height));
      gl.uniform1f(u.uPxScale, 1 / (canvas.height * 0.1 * s.scale));
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.uniform1i(u.uPalette, 0);
      gl.uniform1i(u.uUsePalette, s.colors.length ? 1 : 0);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uNoise, s.noise);
      gl.uniform1f(u.uSaturation, s.saturation);
      gl.uniformMatrix3fv(
        u.uHue,
        false,
        HUE_W.map((w, i) => w + HUE_U[i] * c + HUE_V[i] * sn)
      );
      gl.uniform1i(u.uUseHue, Math.abs(s.hueShift) > 0.0001 ? 1 : 0);
      gl.uniform1f(u.uLight, s.lightMode ? 1 : 0);
      gl.uniform1f(u.uNeutral, neutral);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const s = settingsRef.current;
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.scale = Math.min(s.dpr || window.devicePixelRatio || 1, 2) * s.resolution;
      canvas.width = Math.max(1, Math.round(view.width * view.scale));
      canvas.height = Math.max(1, Math.round(view.height * view.scale));
      draw();
      wake();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      if (Math.round(view.width * Math.min(s.dpr || window.devicePixelRatio || 1, 2) * s.resolution) !== canvas.width) {
        resize();
        return;
      }
      const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
      last = now;
      if (!reduce) time += dt;
      if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
      const hover = s.animationType === 'hover';
      const aim = pointer.inside && !reduce && (hover || s.interactive);
      const reach = (hover ? 0.6 : 0.09) * s.hoverStrength;
      const yaw = aim ? -pointer.x * reach : 0;
      const pitch = aim ? pointer.y * reach : 0;
      const follow = 1 - Math.pow(1 - s.inertia, dt * 60);
      pose.yaw += (yaw - pose.yaw) * follow;
      pose.pitch += (pitch - pose.pitch) * follow;
      pose.roll += (0 - pose.roll) * (1 - Math.pow(0.9, dt * 60));
      draw();
      const settling = Math.abs(yaw - pose.yaw) + Math.abs(pitch - pose.pitch) + Math.abs(pose.roll) > 1e-4;
      const spinning = !reduce && !hover && s.animationType !== 'static' && s.timeScale > 0;
      const busy = spinning || settling || introClock < 1 || (!reduce && s.noise > 0);
      if (busy) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    function wake() {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
      pointer.inside = Math.abs(x) <= 1 && Math.abs(y) <= 1;
      pointer.x = clamp(x, -1, 1);
      pointer.y = clamp(y, -1, 1);
      const s = settingsRef.current;
      if (s.interactive || s.animationType === 'hover') wake();
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
    window.addEventListener('blur', onPointerLeave);
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
      window.removeEventListener('blur', onPointerLeave);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteTexture(paletteTexture);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div ref={containerRef} className={`prism${className ? ` ${className}` : ''}`} style={style} {...rest}>
      <canvas ref={canvasRef} className="prism-canvas" aria-hidden="true" />
    </div>
  );
};

export default Prism;
