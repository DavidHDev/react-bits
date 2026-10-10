'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';

import './PlasmaWave.css';

export interface PlasmaWaveProps extends HTMLAttributes<HTMLDivElement> {
  colors?: string[];
  speed?: number;
  speed1?: number;
  speed2?: number;
  dir2?: number;
  bend1?: number;
  bend2?: number;
  thickness?: number;
  focalLength?: number;
  rotationDeg?: number;
  xOffset?: number;
  yOffset?: number;
  brightness?: number;
  glow?: number;
  core?: number;
  grain?: number;
  quality?: number;
  mouseInteraction?: boolean;
  intro?: boolean;
  fade?: number;
  opacity?: number;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
}

type Settings = {
  color1: string;
  color2: string;
  speed: number;
  speed1: number;
  speed2: number;
  dir2: number;
  bend1: number;
  bend2: number;
  thickness: number;
  focalLength: number;
  rotation: number;
  xOffset: number;
  yOffset: number;
  brightness: number;
  glow: number;
  core: number;
  grain: number;
  quality: number;
  mouseInteraction: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

type Target = { texture: WebGLTexture | null; framebuffer: WebGLFramebuffer | null; width: number; height: number };

const QUAD_VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const COMMON = `#version 300 es
precision highp float;
const float PI = 3.14159265;
const float TAU = 6.28318531;
const float HALF_PI = 1.5707963;
`;

const TRACE = `
uniform vec2 uView;
uniform vec2 uOffset;
uniform float uRotation;
uniform float uFocalLength;
uniform float uTime;
uniform float uSpeed1;
uniform float uSpeed2;
uniform float uDir2;
uniform float uBend1;
uniform float uBend2;
uniform float uThickness;
uniform vec3 uHeat;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uCore;
uniform float uRange;

vec4 traceLight(vec2 pixel) {
  vec2 coord = pixel + uOffset - 0.5 * uView;
  float c = cos(uRotation);
  float sn = sin(uRotation);
  coord = mat2(c, -sn, sn, c) * coord;
  vec3 u = normalize(vec3(coord / uView.y, uFocalLength));
  vec3 o = vec3(0.0, 0.0, -7.0);
  float t = uTime * PI;
  float t1 = t * 0.7;
  float t2 = t * 0.9;
  float tSpeed1 = t * uSpeed1;
  float tSpeed2 = t * uSpeed2 * uDir2;
  float s = 1.0;
  float d = 0.0;
  vec2 k = vec2(0.0);
  for (int i = 0; i < 14; ++i) {
    vec3 p = o + u * d;
    p.x -= 15.0;
    float px = p.x;
    float swell = uHeat.y * exp(-pow((px - uHeat.x) / uHeat.z, 2.0));
    float wob1 = uBend1 + swell * (0.16 + 0.2 * uBend1) + sin(t1 + px * 0.8) * 0.1;
    float wob2 = uBend2 + swell * (0.16 + 0.2 * uBend2) + cos(t2 + px * 1.1) * 0.1;
    vec2 a = sin(vec2(px, px + HALF_PI) + tSpeed1) * wob1;
    vec2 b = cos(vec2(px, px + HALF_PI) + tSpeed2) * wob2;
    float cut = px + uThickness;
    k.x = max(cut, length(p.yz - a) - uThickness);
    k.y = max(cut, length(p.yz - b) - uThickness);
    s = min(s, min(k.x, k.y));
    if (s < 0.001 || d > 300.0) break;
    d += s * 0.7;
  }
  vec3 raw = max(cos(d * TAU) - s * sqrt(d) - vec3(k, 0.0), 0.0);
  float field = max(raw.r, max(raw.g, raw.b));
  raw.gb += 0.1;
  raw = raw * 0.4 + raw.brg * 0.6 + raw * raw;
  float lum = dot(raw, vec3(0.299, 0.587, 0.114));
  float w1 = max(0.0, 1.0 - k.x * 2.0) + 0.0001;
  float w2 = max(0.0, 1.0 - k.y * 2.0) + 0.0001;
  vec3 base = (uColor1 * w1 + uColor2 * w2) / (w1 + w2);
  float soft = smoothstep(0.03, 0.36, field);
  float hot = smoothstep(0.32, 0.8, field);
  vec3 light = base * lum * 2.6 * soft + mix(base, vec3(1.0), 0.55) * hot * uCore * 2.0;
  return vec4(light * uRange, field);
}
`;

const COARSE = `${COMMON}
${TRACE}
uniform vec2 uScale;
out vec4 outColor;
void main() {
  outColor = traceLight(gl_FragCoord.xy * uScale);
}`;

const FINE = `${COMMON}
${TRACE}
uniform vec2 uScale;
uniform sampler2D uCoarse;
uniform vec2 uCoarseSize;
uniform vec2 uFineSize;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uFineSize;
  vec2 pos = uv * uCoarseSize - 0.5;
  ivec2 cell = ivec2(floor(pos));
  ivec2 last = ivec2(uCoarseSize) - 1;
  float a = texelFetch(uCoarse, clamp(cell, ivec2(0), last), 0).a;
  float b = texelFetch(uCoarse, clamp(cell + ivec2(1, 0), ivec2(0), last), 0).a;
  float c = texelFetch(uCoarse, clamp(cell + ivec2(0, 1), ivec2(0), last), 0).a;
  float d = texelFetch(uCoarse, clamp(cell + ivec2(1, 1), ivec2(0), last), 0).a;
  float high = max(max(a, b), max(c, d));
  float low = min(min(a, b), min(c, d));
  if (high > 0.02 && low < 0.4) outColor = traceLight(gl_FragCoord.xy * uScale);
  else outColor = texture(uCoarse, uv);
}`;

const DOWN = `${COMMON}
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

const UP = `${COMMON}
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

const COMPOSITE = `${COMMON}
uniform sampler2D uLight;
uniform sampler2D uBloom;
uniform vec2 uResolution;
uniform float uExposure;
uniform float uGlow;
uniform float uCore;
uniform float uPresence;
uniform float uGrain;
uniform float uFade;
uniform float uOpacity;
uniform float uTime;
uniform float uLightMode;
uniform vec3 uLens;
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
  vec2 offset = gl_FragCoord.xy - uLens.xy;
  float lens = uLens.z * exp(-dot(offset, offset) / (uResolution.y * uResolution.y * 0.045));
  vec4 source = texture(uLight, uv);
  vec3 hdr = source.rgb * uExposure * uPresence * (1.0 + lens * 0.35);
  hdr += texture(uBloom, uv).rgb * uExposure * uPresence * uGlow * (0.18 + lens * 0.08);
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  float peak = max(hdr.r, max(hdr.g, hdr.b));
  if (uLightMode > 0.5) {
    vec3 hue = hdr / max(peak, 0.0001);
    float tone = dot(hue, vec3(0.2126, 0.7152, 0.0722));
    vec3 ink = pow(clamp(hue * min(1.0, 0.6 / max(tone, 0.001)), 0.0, 1.0), vec3(1.0 / 2.2));
    float feather = max(fwidth(source.a) * 1.25, 0.02);
    float body = smoothstep(0.15 - feather, 0.15 + feather, source.a) * uPresence;
    vec3 color = mix(ink, vec3(1.0), smoothstep(12.0, 26.0, peak) * uCore);
    float halo = (1.0 - exp(-peak * 0.5)) * 0.3 * min(uGlow, 1.5);
    float alpha = clamp(body * 0.92 + (1.0 - body) * halo, 0.0, 1.0) * mask * uOpacity;
    color = mix(ink, color, body);
    outColor = vec4(clamp(color + grain, 0.0, 1.0) * alpha, alpha);
  } else {
    vec3 mapped = 1.0 - exp(-hdr);
    float level = max(mapped.r, max(mapped.g, mapped.b));
    mapped = clamp(mapped + grain * level, 0.0, 1.0) * mask * uOpacity;
    outColor = vec4(mapped, max(mapped.r, max(mapped.g, mapped.b)));
  }
}`;

const BLOOM_LEVELS = 4;
const COARSE_RATIO = 3;
const INTRO_SECONDS = 1.8;
const MAX_LIGHT_PIXELS = 2400000;

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

export default function PlasmaWave({
  colors = ['#A855F7', '#06B6D4'],
  speed = 1,
  speed1 = 0.05,
  speed2 = 0.05,
  dir2 = 1,
  bend1 = 1,
  bend2 = 0.5,
  thickness = 0.3,
  focalLength = 1.25,
  rotationDeg = 0,
  xOffset = 0,
  yOffset = 0,
  brightness = 1,
  glow = 1,
  core = 0.6,
  grain = 0.03,
  quality = 1,
  mouseInteraction = true,
  intro = true,
  fade = 0,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  ...rest
}: PlasmaWaveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    color1: String(colors?.[0] ?? '#A855F7'),
    color2: String(colors?.[1] ?? colors?.[0] ?? '#06B6D4'),
    speed,
    speed1,
    speed2,
    dir2,
    bend1,
    bend2,
    thickness: Math.max(0.02, thickness),
    focalLength: Math.max(0.05, focalLength),
    rotation: (rotationDeg * Math.PI) / 180,
    xOffset,
    yOffset,
    brightness: Math.max(0, brightness),
    glow: Math.max(0, glow),
    core: clamp(core, 0, 1),
    grain: Math.max(0, grain),
    quality: clamp(quality, 0.25, 1),
    mouseInteraction,
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
    const range = floatTargets ? 1 : 0.25;
    const programs = {
      coarse: link(gl, COARSE),
      fine: link(gl, FINE),
      down: link(gl, DOWN),
      up: link(gl, UP),
      composite: link(gl, COMPOSITE)
    } as Record<string, Program>;
    if (Object.values(programs).some(entry => !entry)) return undefined;

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

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
    const coarse = createTarget();
    const fine = createTarget();
    const down = Array.from({ length: BLOOM_LEVELS + 1 }, createTarget);
    const up = Array.from({ length: BLOOM_LEVELS }, createTarget);

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const colorCache = new Map<string, number[]>();
    const toLinear = (value: string): number[] => {
      const cached = colorCache.get(value);
      if (cached) return cached;
      let rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r, g, b].map(v => Math.pow(v / 255, 2.2));
      }
      colorCache.set(value, rgb);
      return rgb;
    };

    const view = { width: 1, height: 1, fineWidth: 1, fineHeight: 1, coarseWidth: 1, coarseHeight: 1 };
    const pointer = { x: 0, y: 0, inside: false };
    const state = {
      time: 0,
      intro: settingsRef.current.intro && !reduce ? 0 : 1,
      heat: 0,
      heatVelocity: 0,
      heatX: 0,
      lensX: 0,
      lensY: 0
    };
    let raf = 0;
    let last = 0;
    let visible = true;

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

    const setScene = (entry: Program, s: Settings, presence: number) => {
      const u = entry.uniforms;
      gl.useProgram(entry.program);
      gl.uniform2f(u.uView, view.width, view.height);
      gl.uniform2f(u.uOffset, s.xOffset, s.yOffset);
      gl.uniform1f(u.uRotation, s.rotation);
      gl.uniform1f(u.uFocalLength, s.focalLength);
      gl.uniform1f(u.uTime, state.time);
      gl.uniform1f(u.uSpeed1, s.speed1);
      gl.uniform1f(u.uSpeed2, s.speed2);
      gl.uniform1f(u.uDir2, s.dir2);
      gl.uniform1f(u.uBend1, s.bend1 * (0.3 + 0.7 * presence));
      gl.uniform1f(u.uBend2, s.bend2 * (0.3 + 0.7 * presence));
      gl.uniform1f(u.uThickness, s.thickness);
      gl.uniform3f(u.uHeat, state.heatX, state.heat, 1.4);
      gl.uniform3fv(u.uColor1, toLinear(s.color1));
      gl.uniform3fv(u.uColor2, toLinear(s.color2));
      gl.uniform1f(u.uCore, s.core);
      gl.uniform1f(u.uRange, range);
    };

    const render = () => {
      const s = settingsRef.current;
      const presence = state.intro * state.intro * (3 - 2 * state.intro);
      gl.bindVertexArray(vao);
      sizeTarget(coarse, view.coarseWidth, view.coarseHeight);
      sizeTarget(fine, view.fineWidth, view.fineHeight);

      setScene(programs.coarse, s, presence);
      gl.uniform2f(programs.coarse.uniforms.uScale, view.width / view.coarseWidth, view.height / view.coarseHeight);
      run(programs.coarse, coarse, view.coarseWidth, view.coarseHeight);

      const refine = programs.fine;
      setScene(refine, s, presence);
      gl.uniform2f(refine.uniforms.uScale, view.width / view.fineWidth, view.height / view.fineHeight);
      gl.uniform2f(refine.uniforms.uCoarseSize, view.coarseWidth, view.coarseHeight);
      gl.uniform2f(refine.uniforms.uFineSize, view.fineWidth, view.fineHeight);
      bindTexture(refine, 'uCoarse', 0, coarse.texture);
      run(refine, fine, view.fineWidth, view.fineHeight);

      let source = fine;
      for (let level = 0; level <= BLOOM_LEVELS; level++) {
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
      for (let level = BLOOM_LEVELS - 1; level >= 1; level--) {
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
      gl.uniform1f(c.uExposure, (2.4 * s.brightness) / range);
      gl.uniform1f(c.uGlow, s.glow);
      gl.uniform1f(c.uCore, s.core);
      gl.uniform1f(c.uPresence, presence * presence);
      gl.uniform1f(c.uGrain, s.grain);
      gl.uniform1f(c.uFade, s.fade);
      gl.uniform1f(c.uOpacity, s.opacity);
      gl.uniform1f(c.uTime, state.time);
      gl.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform3f(
        c.uLens,
        (state.lensX * canvas.width) / view.width,
        ((view.height - state.lensY) * canvas.height) / view.height,
        state.heat
      );
      bindTexture(composite, 'uLight', 0, fine.texture);
      bindTexture(composite, 'uBloom', 1, up[1].texture);
      run(composite, null, canvas.width, canvas.height);
    };

    const heatTarget = (s: Settings): number | null => {
      if (!(s.mouseInteraction && pointer.inside) || reduce) return null;
      const x = pointer.x + s.xOffset - view.width / 2;
      const y = view.height - pointer.y + s.yOffset - view.height / 2;
      const c = Math.cos(s.rotation);
      const sn = Math.sin(s.rotation);
      return (7 * (c * x + sn * y)) / view.height / s.focalLength - 15;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) state.time += dt * s.speed;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
      const target = heatTarget(s);
      if (target !== null) state.heatX += (target - state.heatX) * (1 - Math.exp(-dt * 6));
      state.heatVelocity += (120 * ((target === null ? 0 : 1) - state.heat) - 19 * state.heatVelocity) * dt;
      state.heat = clamp(state.heat + state.heatVelocity * dt, 0, 1.15);
      state.lensX += (pointer.x - state.lensX) * (1 - Math.exp(-dt * 8));
      state.lensY += (pointer.y - state.lensY) * (1 - Math.exp(-dt * 8));
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
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      view.width = width;
      view.height = height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      let scale = s.quality;
      if (width * height * scale * scale > MAX_LIGHT_PIXELS) scale = Math.sqrt(MAX_LIGHT_PIXELS / (width * height));
      view.fineWidth = Math.max(1, Math.round(width * scale));
      view.fineHeight = Math.max(1, Math.round(height * scale));
      view.coarseWidth = Math.max(1, Math.round(view.fineWidth / COARSE_RATIO));
      view.coarseHeight = Math.max(1, Math.round(view.fineHeight / COARSE_RATIO));
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
      for (const target of [coarse, fine, ...down, ...up]) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      for (const entry of Object.values(programs)) gl.deleteProgram(entry.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div ref={containerRef} className={`plasma-wave-container${className ? ` ${className}` : ''}`} {...rest}>
      <canvas ref={canvasRef} className="plasma-wave-canvas" aria-hidden="true" />
    </div>
  );
}
