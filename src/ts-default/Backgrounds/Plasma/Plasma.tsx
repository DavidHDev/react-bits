'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';

import './Plasma.css';

export type PlasmaDirection = 'forward' | 'reverse' | 'pingpong';

export interface PlasmaProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
  speed?: number;
  direction?: PlasmaDirection;
  scale?: number;
  twist?: number;
  wave?: number;
  softness?: number;
  shine?: number;
  brightness?: number;
  grain?: number;
  quality?: number;
  mouseInteractive?: boolean;
  intro?: boolean;
  fade?: number;
  opacity?: number;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
}

type Settings = {
  color: string;
  speed: number;
  direction: PlasmaDirection;
  scale: number;
  twist: number;
  wave: number;
  softness: number;
  shine: number;
  brightness: number;
  grain: number;
  quality: number;
  mouseInteractive: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const QUAD_VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const VOLUME = `#version 300 es
precision highp float;
uniform vec2 uView;
uniform vec2 uScale;
uniform float uZoom;
uniform float uTime;
uniform float uTwist;
uniform float uWave;
uniform float uSharpness;
uniform vec2 uOrbit;
uniform float uDither;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 c = (gl_FragCoord.xy * uScale - 0.5 * uView) / uZoom;
  vec3 rd = normalize(vec3(c, uView.y));
  vec3 ro = vec3(0.0, 0.0, -4.0);
  float cy = cos(uOrbit.x);
  float sy = sin(uOrbit.x);
  float cx = cos(uOrbit.y);
  float sx = sin(uOrbit.y);
  mat3 orbit = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy) * mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
  ro = orbit * ro;
  rd = orbit * rd;
  float z = 0.0;
  float density = 0.0;
  float band = 0.0;
  for (int i = 0; i < 60; i++) {
    vec3 p = ro + rd * z;
    vec3 s = p;
    float d = p.y - uTime;
    p.x += uWave * (1.0 + p.y) * sin(d + p.x * 0.1) * cos(0.34 * d + p.x * 0.05);
    vec2 q = p.xz *= mat2(cos(p.y * uTwist + vec4(0.0, 11.0, 33.0, 0.0) - uTime));
    float shell = abs(sqrt(length(q * q)) - 0.25 * (5.0 + s.y)) / 3.0;
    float stepLength = shell + 0.0008;
    z += stepLength;
    float phase = s.y + p.z * 0.5 + s.z - length(s - p);
    float weight = (1.0 + sin(phase + 8.0)) * exp(-shell * uSharpness) * stepLength;
    density += weight;
    band += weight * (0.5 + 0.5 * sin(phase * 0.5 + 1.0));
  }
  vec2 encoded = sqrt(vec2(density, band) / (1.0 + vec2(density, band)));
  encoded += (vec2(hash(gl_FragCoord.xy), hash(gl_FragCoord.yx + 17.0)) - 0.5) * uDither;
  outColor = vec4(encoded, 0.0, 1.0);
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uVolume;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform vec3 uHighlight;
uniform vec3 uInk;
uniform float uGain;
uniform float uShine;
uniform float uPresence;
uniform float uGrain;
uniform float uFade;
uniform float uOpacity;
uniform float uTime;
uniform float uLightMode;
uniform vec3 uHeat;
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
  vec2 encoded = clamp(texture(uVolume, uv).rg, 0.0, 0.9995);
  encoded *= encoded;
  vec2 volume = encoded / (1.0 - encoded);
  vec2 offset = (gl_FragCoord.xy - uHeat.xy) / uResolution.y;
  float heat = uHeat.z * exp(-dot(offset, offset) / 0.05);
  float density = volume.r * uGain * uPresence * (1.0 + heat * 0.35);
  float band = clamp(volume.g / max(volume.r, 0.00001), 0.0, 1.0);
  vec3 tint = mix(uColor, uHighlight, band * 0.35);
  vec3 hdr = tint * density + uHighlight * density * density * uShine;
  float peak = max(hdr.r, max(hdr.g, hdr.b));
  float level = 1.0 - exp(-peak);
  float hot = smoothstep(1.0, 3.0, peak);
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  mask *= uOpacity;
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  if (uLightMode > 0.5) {
    vec3 color = mix(uInk, vec3(1.0), hot * 0.75);
    float alpha = clamp(pow(level, 0.8) * 0.9 * (1.0 + grain), 0.0, 1.0) * mask;
    outColor = vec4(color * alpha, alpha);
  } else {
    vec3 hue = hdr / max(peak, 0.0001);
    vec3 color = mix(hue * level, vec3(level), hot * 0.6);
    color = pow(color, vec3(1.0 / 2.2));
    color = clamp(color + grain * level, 0.0, 1.0) * mask;
    outColor = vec4(color, max(color.r, max(color.g, color.b)));
  }
}`;

const INTRO_SECONDS = 1.6;
const MAX_VOLUME_PIXELS = 1600000;

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

const link = (gl: WebGL2RenderingContext, fragmentSource: string): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, QUAD_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

export const Plasma = ({
  color = '#a6a3b8',
  speed = 1,
  direction = 'forward',
  scale = 1,
  twist = 1,
  wave = 1,
  softness = 0.5,
  shine = 1,
  brightness = 1,
  grain = 0.04,
  quality = 0.75,
  mouseInteractive = true,
  intro = true,
  fade = 0,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  ...rest
}: PlasmaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    color: String(color),
    speed,
    direction,
    scale: Math.max(0.1, scale),
    twist,
    wave: Math.max(0, wave),
    softness: clamp(softness, 0, 1),
    shine: Math.max(0, shine),
    brightness: Math.max(0, brightness),
    grain: Math.max(0, grain),
    quality: clamp(quality, 0.25, 1),
    mouseInteractive,
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
      stencil: false,
      powerPreference: 'high-performance'
    });
    if (!container || !canvas || !gl) return undefined;

    const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
    const volumeProgram = link(gl, VOLUME);
    const compositeProgram = link(gl, COMPOSITE);
    if (!volumeProgram || !compositeProgram) return undefined;
    const programs = { volume: volumeProgram, composite: compositeProgram };

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    const target = { width: 0, height: 0 };
    const sizeTarget = (width: number, height: number) => {
      if (target.width === width && target.height === height) return;
      target.width = width;
      target.height = height;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (floatTargets) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    };

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

    const view = { width: 1, height: 1, volumeWidth: 1, volumeHeight: 1 };
    const pointer = { x: 0, y: 0, inside: false };
    const state = {
      clock: 0,
      intro: settingsRef.current.intro && !reduce ? 0 : 1,
      yaw: 0,
      pitch: 0,
      yawVelocity: 0,
      pitchVelocity: 0,
      heat: 0,
      heatX: 0,
      heatY: 0
    };
    let raf = 0;
    let last = 0;
    let visible = true;

    const timeOf = (s: Settings) => {
      const t = state.clock * 0.4;
      if (s.direction === 'reverse') return -t;
      if (s.direction !== 'pingpong') return t;
      const span = 10;
      const segment = (state.clock % span) / span;
      const eased = segment * segment * (3 - 2 * segment);
      return (Math.floor(state.clock / span) % 2 === 0 ? eased : 1 - eased) * span * 0.4;
    };

    const render = () => {
      const s = settingsRef.current;
      const presence = state.intro * state.intro * (3 - 2 * state.intro);
      gl.bindVertexArray(vao);
      sizeTarget(view.volumeWidth, view.volumeHeight);

      const volume = programs.volume;
      const u = volume.uniforms;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, target.width, target.height);
      gl.useProgram(volume.program);
      gl.uniform2f(u.uView, view.width, view.height);
      gl.uniform2f(u.uScale, view.width / target.width, view.height / target.height);
      gl.uniform1f(u.uZoom, s.scale);
      gl.uniform1f(u.uTime, timeOf(s) + (1 - presence) * 1.4);
      gl.uniform1f(u.uTwist, s.twist);
      gl.uniform1f(u.uWave, 0.4 * s.wave);
      gl.uniform1f(u.uSharpness, 100 - s.softness * 90);
      gl.uniform2f(u.uOrbit, state.yaw, state.pitch);
      gl.uniform1f(u.uDither, floatTargets ? 0 : 1 / 255);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      const composite = programs.composite;
      const c = composite.uniforms;
      const base = toLinear(s.color);
      const highlight = base.map(v => v + (1 - v) * 0.85);
      const tone = 0.2126 * base[0] + 0.7152 * base[1] + 0.0722 * base[2];
      const depth = Math.min(1, 0.16 / Math.max(tone, 0.001));
      const ink = base.map(v => Math.pow(Math.min(1, v * depth), 1 / 2.2));
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(composite.program);
      gl.uniform2f(c.uResolution, canvas.width, canvas.height);
      gl.uniform3fv(c.uColor, base);
      gl.uniform3fv(c.uHighlight, highlight);
      gl.uniform3fv(c.uInk, ink);
      gl.uniform1f(c.uGain, 4.8 * s.brightness);
      gl.uniform1f(c.uShine, 0.025 * s.shine);
      gl.uniform1f(c.uPresence, presence);
      gl.uniform1f(c.uGrain, s.grain);
      gl.uniform1f(c.uFade, s.fade);
      gl.uniform1f(c.uOpacity, s.opacity);
      gl.uniform1f(c.uTime, state.clock % 1000);
      gl.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform3f(
        c.uHeat,
        (state.heatX * canvas.width) / view.width,
        ((view.height - state.heatY) * canvas.height) / view.height,
        state.heat
      );
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(c.uVolume, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) state.clock += dt * s.speed;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
      const engaged = s.mouseInteractive && pointer.inside && !reduce;
      const goalYaw = engaged ? (pointer.x / view.width - 0.5) * 0.9 : 0;
      const goalPitch = engaged ? (pointer.y / view.height - 0.5) * 0.18 : 0;
      state.yawVelocity += (40 * (goalYaw - state.yaw) - 11 * state.yawVelocity) * dt;
      state.pitchVelocity += (40 * (goalPitch - state.pitch) - 11 * state.pitchVelocity) * dt;
      state.yaw += state.yawVelocity * dt;
      state.pitch += state.pitchVelocity * dt;
      state.heat += ((engaged ? 1 : 0) - state.heat) * (1 - Math.exp(-dt * (engaged ? 4 : 2)));
      state.heatX += (pointer.x - state.heatX) * (1 - Math.exp(-dt * 8));
      state.heatY += (pointer.y - state.heatY) * (1 - Math.exp(-dt * 8));
      render();
      const settling =
        state.intro < 1 ||
        Math.abs(goalYaw - state.yaw) > 0.0005 ||
        Math.abs(state.yawVelocity) > 0.0005 ||
        Math.abs(goalPitch - state.pitch) > 0.0005 ||
        Math.abs(state.pitchVelocity) > 0.0005 ||
        Math.abs((engaged ? 1 : 0) - state.heat) > 0.002;
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
      let scale = s.quality;
      if (width * height * scale * scale > MAX_VOLUME_PIXELS) scale = Math.sqrt(MAX_VOLUME_PIXELS / (width * height));
      view.volumeWidth = Math.max(1, Math.round(width * scale));
      view.volumeHeight = Math.max(1, Math.round(height * scale));
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

    let lastQuality = settingsRef.current.quality;
    let lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.quality !== lastQuality || s.dpr !== lastDpr) {
        lastQuality = s.quality;
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
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteProgram(programs.volume.program);
      gl.deleteProgram(programs.composite.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div ref={containerRef} className={`plasma-container${className ? ` ${className}` : ''}`} {...rest}>
      <canvas ref={canvasRef} className="plasma-canvas" aria-hidden="true" />
    </div>
  );
};

export default Plasma;
