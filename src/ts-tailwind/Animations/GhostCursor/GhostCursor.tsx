'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
export interface GhostCursorProps {
  color?: string;
  brightness?: number;
  size?: number;
  trailLength?: number;
  inertia?: number;
  turbulence?: number;
  drift?: number;
  detail?: number;
  grainIntensity?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  edgeIntensity?: number;
  clickPuff?: boolean;
  intro?: boolean;
  theme?: 'dark' | 'light';
  mixBlendMode?: CSSProperties['mixBlendMode'];
  fadeDelayMs?: number;
  fadeDurationMs?: number;
  maxDevicePixelRatio?: number;
  targetPixels?: number;
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  color: number[];
  brightness: number;
  size: number;
  trail: number;
  inertia: number;
  turbulence: number;
  drift: number;
  detail: number;
  grain: number;
  bloom: number;
  bloomRadius: number;
  threshold: number;
  edge: number;
  clickPuff: boolean;
  intro: boolean;
  theme: number;
  fadeDelay: number;
  fadeDuration: number;
  maxRatio: number;
  budget: number;
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

interface Program {
  program: WebGLProgram;
  uniforms: Uniforms;
}

interface Target {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
}

const VERTEX = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const NOISE = `
vec2 hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

vec3 gradientNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = hash2(i);
  vec2 gb = hash2(i + vec2(1.0, 0.0));
  vec2 gc = hash2(i + vec2(0.0, 1.0));
  vec2 gd = hash2(i + vec2(1.0, 1.0));
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  float k = va - vb - vc + vd;
  float value = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
  vec2 slope = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) + du * (u.yx * k + vec2(vb, vc) - va);
  return vec3(value, slope);
}
`;

const SIM = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uState;
uniform vec2 uSize;
uniform float uDt;
uniform float uTime;
uniform float uDecay;
uniform float uDrag;
uniform vec2 uDrift;
uniform float uTurbulence;
uniform float uSwirl;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uTrail;
uniform float uIdle;
uniform vec2 uVelocity;
uniform vec4 uPuff;
${NOISE}
float erf(float x) {
  float x2 = x * x;
  return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732395 + 0.147 * x2) / (1.0 + 0.147 * x2)));
}
vec2 curl(vec2 p) {
  vec3 a = gradientNoise(p * uSwirl + vec2(uTime * 0.11, -uTime * 0.07));
  vec3 b = gradientNoise(p * uSwirl * 2.03 + vec2(-uTime * 0.13, uTime * 0.09) + 17.3);
  vec2 g = a.yz + b.yz * 0.5;
  return vec2(g.y, -g.x);
}
vec4 fetch(vec2 p) {
  if (p.x < 0.0 || p.y < 0.0 || p.x > uSize.x || p.y > uSize.y) return vec4(0.0);
  return texture(uState, p / uSize);
}
void main() {
  vec2 p = gl_FragCoord.xy;
  vec4 here = texture(uState, vUv);
  vec2 flow = here.gb + curl(p) * uTurbulence + uDrift;
  vec4 state = fetch(p - flow * uDt);
  float density = state.r * uDecay;
  vec2 velocity = state.gb * uDrag;

  float sigma = max(uRadius, 0.5);
  vec2 ab = uTo - uFrom;
  float len = length(ab);
  float trail = 0.0;
  if (len > 0.25) {
    vec2 dir = ab / len;
    vec2 ap = p - uFrom;
    float along = dot(ap, dir);
    float across = dot(ap, vec2(-dir.y, dir.x));
    float k = 1.4142136 * sigma;
    trail = exp(-across * across / (2.0 * sigma * sigma)) * 0.5 * (erf(along / k) - erf((along - len) / k));
  }
  vec2 dh = p - uTo;
  float head = exp(-dot(dh, dh) / (2.0 * sigma * sigma));
  density += uTrail * trail + uIdle * uDt * head;
  velocity += (uVelocity - velocity) * clamp(trail * 0.65, 0.0, 1.0);

  if (uPuff.w > 0.0) {
    vec2 d = p - uPuff.xy;
    float r2 = dot(d, d);
    float g = exp(-r2 / (2.0 * uPuff.z * uPuff.z));
    density += uPuff.w * g;
    velocity += (r2 > 0.0001 ? d / sqrt(r2) : vec2(0.0)) * g * uPuff.w * uPuff.z * 2.2;
  }

  fragColor = vec4(clamp(density, 0.0, 6.0), velocity, 1.0);
}`;

const SHADE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uState;
uniform vec2 uSimSize;
uniform vec2 uView;
uniform vec2 uHead;
uniform float uHeadSize;
uniform float uHeadAmount;
uniform float uTime;
uniform vec3 uColor;
uniform float uDetail;
uniform float uNoiseScale;
uniform vec2 uFlow;
uniform float uBrightness;
uniform float uTheme;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.8776, 0.4794, -0.4794, 0.8776);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p * 2.0;
    a *= 0.5;
  }
  return v;
}
float fbm5(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.8776, 0.4794, -0.4794, 0.8776);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p * 2.0;
    a *= 0.52;
  }
  return v;
}
vec4 cubic(sampler2D tex, vec2 uv, vec2 size) {
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 c0 = (i + 0.5 + w1 / g0 - 1.0) / size;
  vec2 c1 = (i + 0.5 + w3 / g1 + 1.0) / size;
  vec4 a = texture(tex, c0) * g0.x + texture(tex, vec2(c1.x, c0.y)) * g1.x;
  vec4 b = texture(tex, vec2(c0.x, c1.y)) * g0.x + texture(tex, c1) * g1.x;
  return a * g0.y + b * g1.y;
}
float field(vec2 uv, vec2 p) {
  vec2 d = p - uHead;
  return cubic(uState, uv, uSimSize).r + uHeadAmount * exp(-dot(d, d) / (2.0 * uHeadSize * uHeadSize));
}
void main() {
  vec2 p = vUv * uView;
  float density = field(vUv, p);
  if (density < 0.002) {
    fragColor = vec4(0.0);
    return;
  }
  vec2 step = vec2(1.5) / uSimSize;
  float dx = field(vUv + vec2(step.x, 0.0), p + vec2(step.x * uView.x, 0.0)) - field(vUv - vec2(step.x, 0.0), p - vec2(step.x * uView.x, 0.0));
  float dy = field(vUv + vec2(0.0, step.y), p + vec2(0.0, step.y * uView.y)) - field(vUv - vec2(0.0, step.y), p - vec2(0.0, step.y * uView.y));

  vec2 n = (p + uFlow) * uNoiseScale;
  float t = uTime;
  vec2 q = vec2(fbm(n + t * 0.1), fbm(n + vec2(5.2, 1.3) + t * 0.1));
  vec2 r = vec2(fbm(n + q * 1.8 + vec2(1.7, 9.2) + t * 0.15), fbm(n + q * 1.8 + vec2(8.3, 2.8) + t * 0.15));
  float smoke = fbm5(n + r * 1.1);
  float wisp = pow(smoothstep(0.18, 0.82, smoke), 2.0) * 2.8;
  float body = density * mix(1.0, wisp, uDetail);
  float cloud = body * smoothstep(0.0, 0.32, body) * 1.15;
  if (cloud <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  vec3 normal = normalize(vec3(-dx * 2.2, -dy * 2.2, 1.0) + vec3((q - 0.5) * 0.35 * uDetail, 0.0));
  float light = 0.7 + 0.5 * max(dot(normal, normalize(vec3(-0.35, 0.55, 0.75))), 0.0);
  float core = smoothstep(0.7, 2.2, cloud);

  vec3 tint = mix(uColor * light, mix(uColor, vec3(1.0), 0.55) * light, core);
  vec3 ink = mix(uColor, uColor * 0.78, core * 0.6) * (1.12 - 0.12 * light);
  vec3 color = mix(tint * uBrightness, ink, uTheme) * cloud;
  fragColor = vec4(color, cloud);
}`;

const DOWN = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uThreshold;
void main() {
  vec4 a = texture(uSource, vUv + uTexel * vec2(-0.5, -0.5));
  vec4 b = texture(uSource, vUv + uTexel * vec2(0.5, -0.5));
  vec4 c = texture(uSource, vUv + uTexel * vec2(-0.5, 0.5));
  vec4 d = texture(uSource, vUv + uTexel * vec2(0.5, 0.5));
  vec4 color = (a + b + c + d) * 0.25;
  float peak = max(color.r, max(color.g, color.b));
  float keep = peak > 0.0 ? max(peak - uThreshold, 0.0) / peak : 0.0;
  fragColor = color * keep;
}`;

const BLUR = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSource;
uniform vec2 uDirection;
void main() {
  vec4 color = texture(uSource, vUv) * 0.181862;
  color += (texture(uSource, vUv + uDirection * 1.423135) + texture(uSource, vUv - uDirection * 1.423135)) * 0.284316;
  color += (texture(uSource, vUv + uDirection * 3.326702) + texture(uSource, vUv - uDirection * 3.326702)) * 0.106598;
  color += (texture(uSource, vUv + uDirection * 5.242989) + texture(uSource, vUv - uDirection * 5.242989)) * 0.018156;
  fragColor = color;
}`;

const COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uShade;
uniform sampler2D uBloom0;
uniform sampler2D uBloom1;
uniform sampler2D uBloom2;
uniform vec2 uShadeSize;
uniform vec3 uWeights;
uniform float uBloom;
uniform float uPresence;
uniform float uGrain;
uniform float uEdge;
uniform float uTime;
uniform float uTheme;
uniform vec3 uColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec4 cubic(sampler2D tex, vec2 uv, vec2 size) {
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 c0 = (i + 0.5 + w1 / g0 - 1.0) / size;
  vec2 c1 = (i + 0.5 + w3 / g1 + 1.0) / size;
  vec4 a = texture(tex, c0) * g0.x + texture(tex, vec2(c1.x, c0.y)) * g1.x;
  vec4 b = texture(tex, vec2(c0.x, c1.y)) * g0.x + texture(tex, c1) * g1.x;
  return a * g0.y + b * g1.y;
}
void main() {
  vec4 shade = cubic(uShade, vUv, uShadeSize);
  vec4 bloom = texture(uBloom0, vUv) * uWeights.x + texture(uBloom1, vUv) * uWeights.y + texture(uBloom2, vUv) * uWeights.z;
  vec2 edge = min(vUv, 1.0 - vUv);
  float vignette = mix(1.0 - uEdge, 1.0, clamp(min(edge.x, edge.y) * 2.0, 0.0, 1.0));
  float fade = uPresence * vignette;
  float grain = hash(gl_FragCoord.xy + fract(uTime * 7.13) * 91.7) - 0.5;
  if (uTheme > 0.5) {
    float coverage = 1.0 - exp(-(shade.a + bloom.a * uBloom * 0.6) * 0.95);
    coverage = clamp(coverage * fade * (1.0 + grain * uGrain * 2.0), 0.0, 1.0);
    vec3 pigment = shade.a > 0.0001 ? clamp(shade.rgb / shade.a, 0.0, 1.0) : uColor;
    fragColor = vec4(pow(pigment, vec3(1.0 / 2.2)) * coverage, coverage);
    return;
  }
  vec3 color = (shade.rgb + bloom.rgb * uBloom) * fade;
  color = pow(1.0 - exp(-color * 0.95), vec3(1.0 / 2.2));
  color += color * grain * uGrain * 2.0;
  color = clamp(color + (hash(gl_FragCoord.xy * 1.37) - 0.5) / 255.0, 0.0, 1.0);
  fragColor = vec4(color, max(color.r, max(color.g, color.b)));
}`;

const INTRO_MS = 1900;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseColor = (value: string): number[] => {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) / 255);
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) return [rgb[1], rgb[2], rgb[3]].map(channel => clamp(parseFloat(channel) / 255, 0, 1));
  return [0.706, 0.592, 0.812];
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

const link = (gl: WebGL2RenderingContext, fragmentSource: string): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const GhostCursor = ({
  color = '#B497CF',
  brightness = 1,
  size = 80,
  trailLength = 50,
  inertia = 0.5,
  turbulence = 0.5,
  drift = 0.3,
  detail = 1,
  grainIntensity = 0.05,
  bloomStrength = 0.6,
  bloomRadius = 1,
  bloomThreshold = 0.025,
  edgeIntensity = 0,
  clickPuff = true,
  intro = true,
  theme = 'dark',
  mixBlendMode,
  fadeDelayMs,
  fadeDurationMs,
  maxDevicePixelRatio = 2,
  targetPixels,
  zIndex = 10,
  className = '',
  style
}: GhostCursorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const [generation, setGeneration] = useState(0);
  const [touch] = useState(
    () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );

  const light = theme === 'light';
  const settings: Settings = {
    color: parseColor(color).map(channel => Math.pow(channel, 2.2)),
    brightness: Math.max(0, brightness),
    size: Math.max(8, size),
    trail: clamp(trailLength, 1, 200),
    inertia: clamp(inertia, 0, 0.99),
    turbulence: clamp(turbulence, 0, 2),
    drift,
    detail: clamp(detail, 0, 1),
    grain: clamp(grainIntensity, 0, 1),
    bloom: Math.max(0, bloomStrength),
    bloomRadius: clamp(bloomRadius, 0, 3),
    threshold: Math.max(0, bloomThreshold),
    edge: clamp(edgeIntensity, 0, 1),
    clickPuff,
    intro,
    theme: light ? 1 : 0,
    fadeDelay: Math.max(0, fadeDelayMs ?? (touch ? 500 : 1000)),
    fadeDuration: Math.max(1, fadeDurationMs ?? (touch ? 1000 : 1500)),
    maxRatio: clamp(maxDevicePixelRatio, 0.25, 3),
    budget: Math.max(5e4, targetPixels ?? (touch ? 3e5 : 6e5))
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    wakeRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const parent = container?.parentElement;
    if (!container || !canvas || !parent) return;

    const previousPosition = parent.style.position;
    const reposition = getComputedStyle(parent).position === 'static';
    if (reposition) parent.style.position = 'relative';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'default'
    });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) {
      if (reposition) parent.style.position = previousPosition;
      return;
    }
    const linked = [link(gl, SIM), link(gl, SHADE), link(gl, DOWN), link(gl, BLUR), link(gl, COMPOSITE)];
    const [simProgram, shadeProgram, downProgram, blurProgram, compositeProgram] = linked;
    if (!simProgram || !shadeProgram || !downProgram || !blurProgram || !compositeProgram) {
      for (const item of linked) if (item) gl.deleteProgram(item.program);
      if (reposition) parent.style.position = previousPosition;
      return;
    }
    const programs = {
      sim: simProgram,
      shade: shadeProgram,
      down: downProgram,
      blur: blurProgram,
      composite: compositeProgram
    };

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);

    const createTarget = (): Target => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const framebuffer = gl.createFramebuffer();
      return { texture, framebuffer, width: 0, height: 0 };
    };

    const allocate = (target: Target, width: number, height: number) => {
      if (target.width === width && target.height === height) return false;
      target.width = width;
      target.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return true;
    };

    const sims = [createTarget(), createTarget()];
    const shade = createTarget();
    const downs = [createTarget(), createTarget(), createTarget()];
    const blurs = [createTarget(), createTarget(), createTarget()];

    const pass = (target: Target | null, program: Program) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
      gl.viewport(0, 0, target ? target.width : canvas.width, target ? target.height : canvas.height);
      gl.useProgram(program.program);
      return program.uniforms;
    };

    const bind = (unit: number, texture: WebGLTexture | null) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    };

    const view = { width: 1, height: 1, ratio: 1, sim: 0.25, shade: 1 };
    const ghost = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0, ready: false };
    const pointer = { x: 0, y: 0, inside: false, moved: -1e9 };
    const flow = { y: 0 };
    const puffs: { x: number; y: number }[] = [];
    let presence = 0;
    let current = 0;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let visible = true;
    let pageVisible = document.visibilityState !== 'hidden';
    let lost = false;
    let dirty = true;
    let introLive = settingsRef.current.intro && !reduced && generation === 0;
    let introStart = -1;

    const resize = () => {
      const s = settingsRef.current;
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, s.maxRatio);
      view.width = width;
      view.height = height;
      view.ratio = ratio;
      const cw = Math.max(1, Math.round(width * ratio));
      const ch = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      view.shade = Math.min(1, Math.sqrt(s.budget / (width * height)));
      const sw = Math.max(8, Math.round(width * view.shade));
      const sh = Math.max(8, Math.round(height * view.shade));
      allocate(shade, sw, sh);
      let w = Math.max(4, Math.round(sw / 2));
      let h = Math.max(4, Math.round(sh / 2));
      for (let i = 0; i < 3; i++) {
        allocate(downs[i], w, h);
        allocate(blurs[i], w, h);
        w = Math.max(2, Math.round(w / 2));
        h = Math.max(2, Math.round(h / 2));
      }
      view.sim = Math.min(0.35, 220 / Math.max(width, height));
      const simW = Math.max(16, Math.round(width * view.sim));
      const simH = Math.max(16, Math.round(height * view.sim));
      allocate(sims[0], simW, simH);
      allocate(sims[1], simW, simH);
      dirty = true;
    };

    const simulate = (dt: number, active: boolean) => {
      const s = settingsRef.current;
      const src = sims[current];
      const dst = sims[1 - current];
      const scale = view.sim;
      const sigma = s.size * scale * 0.3;
      const decay = Math.exp(-dt / (0.12 + s.trail * 0.022));
      const u = pass(dst, programs.sim);
      bind(0, src.texture);
      gl.uniform1i(u.uState, 0);
      gl.uniform2f(u.uSize, dst.width, dst.height);
      gl.uniform1f(u.uDt, dt);
      gl.uniform1f(u.uTime, clock);
      gl.uniform1f(u.uDecay, decay);
      gl.uniform1f(u.uDrag, Math.exp(-dt * 2.4));
      gl.uniform2f(u.uDrift, 0, s.drift * 110 * scale);
      gl.uniform1f(u.uTurbulence, s.turbulence * 70 * scale);
      gl.uniform1f(u.uSwirl, 1 / Math.max(1, s.size * scale * 2.2));
      gl.uniform2f(u.uFrom, ghost.px * scale, (view.height - ghost.py) * scale);
      gl.uniform2f(u.uTo, ghost.x * scale, (view.height - ghost.y) * scale);
      gl.uniform1f(u.uRadius, sigma);
      gl.uniform1f(u.uTrail, active ? 0.42 * presence : 0);
      gl.uniform1f(u.uIdle, active ? 0.22 * presence : 0);
      gl.uniform2f(u.uVelocity, ghost.vx * scale * 0.5, -ghost.vy * scale * 0.5);
      const puff = puffs.shift();
      if (puff) {
        gl.uniform4f(u.uPuff, puff.x * scale, (view.height - puff.y) * scale, sigma * 1.4, 0.9);
      } else {
        gl.uniform4f(u.uPuff, 0, 0, 1, 0);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      current = 1 - current;
    };

    const render = () => {
      const s = settingsRef.current;
      let u = pass(shade, programs.shade);
      bind(0, sims[current].texture);
      gl.uniform1i(u.uState, 0);
      gl.uniform2f(u.uSimSize, sims[current].width, sims[current].height);
      gl.uniform2f(u.uView, view.width, view.height);
      gl.uniform2f(u.uHead, ghost.x, view.height - ghost.y);
      gl.uniform1f(u.uHeadSize, s.size * 0.38);
      gl.uniform1f(u.uHeadAmount, ghost.ready ? 0.8 * presence : 0);
      gl.uniform1f(u.uTime, clock);
      gl.uniform3fv(u.uColor, s.color);
      gl.uniform1f(u.uDetail, s.detail);
      gl.uniform1f(u.uNoiseScale, 2.4 / Math.max(20, s.size * 2.6));
      gl.uniform2f(u.uFlow, 0, flow.y);
      gl.uniform1f(u.uBrightness, s.brightness);
      gl.uniform1f(u.uTheme, s.theme);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      let source = shade;
      for (let i = 0; i < 3; i++) {
        u = pass(downs[i], programs.down);
        bind(0, source.texture);
        gl.uniform1i(u.uSource, 0);
        gl.uniform2f(u.uTexel, 1 / source.width, 1 / source.height);
        gl.uniform1f(u.uThreshold, i === 0 ? s.threshold : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        u = pass(blurs[i], programs.blur);
        bind(0, downs[i].texture);
        gl.uniform1i(u.uSource, 0);
        gl.uniform2f(u.uDirection, 1 / downs[i].width, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        u = pass(downs[i], programs.blur);
        bind(0, blurs[i].texture);
        gl.uniform1i(u.uSource, 0);
        gl.uniform2f(u.uDirection, 0, 1 / blurs[i].height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        source = downs[i];
      }

      u = pass(null, programs.composite);
      bind(0, shade.texture);
      bind(1, downs[0].texture);
      bind(2, downs[1].texture);
      bind(3, downs[2].texture);
      gl.uniform1i(u.uShade, 0);
      gl.uniform1i(u.uBloom0, 1);
      gl.uniform1i(u.uBloom1, 2);
      gl.uniform1i(u.uBloom2, 3);
      gl.uniform2f(u.uShadeSize, shade.width, shade.height);
      const spread = s.bloomRadius;
      gl.uniform3f(u.uWeights, 1, 0.6 + 0.4 * spread, 0.25 + 0.75 * Math.min(1, spread * spread * 0.5));
      gl.uniform1f(u.uBloom, s.bloom);
      gl.uniform1f(u.uPresence, presence);
      gl.uniform1f(u.uGrain, s.grain);
      gl.uniform1f(u.uEdge, s.edge);
      gl.uniform1f(u.uTime, clock);
      gl.uniform1f(u.uTheme, s.theme);
      gl.uniform3fv(u.uColor, s.color);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = 0;
      if (lost) return;
      const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
      last = Math.max(last, now);
      clock += dt;
      const s = settingsRef.current;
      if (dirty) resize();
      dirty = false;

      if (introLive) {
        if (introStart < 0) introStart = now + 280;
        const t = (now - introStart) / INTRO_MS;
        if (t >= 0) {
          const e = t < 1 ? t * t * (3 - 2 * t) : 1;
          const x = view.width * (0.16 + 0.44 * e + 0.05 * Math.sin(e * Math.PI));
          const y = view.height * (0.7 - 0.24 * e - 0.1 * Math.sin(e * Math.PI * 2));
          if (!ghost.ready) {
            ghost.x = ghost.px = x;
            ghost.y = ghost.py = y;
            ghost.vx = ghost.vy = 0;
            ghost.ready = true;
          }
          pointer.x = x;
          pointer.y = y;
          pointer.inside = true;
          pointer.moved = now;
          if (t >= 1) introLive = false;
        }
      }

      const idle = now - pointer.moved;
      const target = !ghost.ready ? 0 : idle < s.fadeDelay ? 1 : Math.max(0, 1 - (idle - s.fadeDelay) / s.fadeDuration);
      presence += (target - presence) * (1 - Math.exp(-dt / (target > presence ? 0.12 : 0.08)));
      if (Math.abs(target - presence) < 0.002) presence = target;

      ghost.px = ghost.x;
      ghost.py = ghost.y;
      if (ghost.ready) {
        if (pointer.inside) {
          const stiffness = 520 * Math.pow(1 - s.inertia, 2) + 26;
          const damping = 2 * Math.sqrt(stiffness) * 0.92;
          const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
          const h = dt / steps;
          for (let i = 0; i < steps; i++) {
            ghost.vx += (stiffness * (pointer.x - ghost.x) - damping * ghost.vx) * h;
            ghost.vy += (stiffness * (pointer.y - ghost.y) - damping * ghost.vy) * h;
            ghost.x += ghost.vx * h;
            ghost.y += ghost.vy * h;
          }
        } else {
          const glide = Math.pow(s.inertia, dt * 60);
          ghost.vx *= glide;
          ghost.vy *= glide;
          ghost.x += ghost.vx * dt;
          ghost.y += ghost.vy * dt;
        }
      }
      flow.y -= s.drift * 110 * dt;

      simulate(dt, presence > 0.01);
      render();

      const busy = introLive || target > 0 || presence > 0.001 || puffs.length > 0;
      if (!busy) {
        for (const target of sims) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }
      if (visible && pageVisible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || lost || !visible || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
    };

    const onPointerMove = (event: PointerEvent) => {
      const spot = locate(event);
      if (spot.inside) introLive = false;
      if (!spot.inside) {
        if (pointer.inside) onLeave();
        return;
      }
      if (!pointer.inside && !ghost.ready) {
        ghost.x = ghost.px = spot.x;
        ghost.y = ghost.py = spot.y;
        ghost.vx = ghost.vy = 0;
        ghost.ready = true;
      } else if (!pointer.inside && presence < 0.05) {
        ghost.x = ghost.px = spot.x;
        ghost.y = ghost.py = spot.y;
        ghost.vx = ghost.vy = 0;
      }
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = true;
      pointer.moved = performance.now();
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const spot = locate(event);
      if (!spot.inside) return;
      onPointerMove(event);
      if (settingsRef.current.clickPuff) {
        puffs.push({ x: spot.x, y: spot.y });
        wake();
      }
    };

    const onLeave = () => {
      const now = performance.now();
      if (pointer.inside && now - pointer.moved < settingsRef.current.fadeDelay) pointer.moved = now;
      pointer.inside = false;
      wake();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
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
      dirty = true;
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
    if (introLive) wake();

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        for (const target of [...sims, shade, ...downs, ...blurs]) {
          gl.deleteFramebuffer(target.framebuffer);
          gl.deleteTexture(target.texture);
        }
        gl.deleteBuffer(buffer);
        gl.deleteVertexArray(vao);
        for (const item of Object.values(programs)) gl.deleteProgram(item.program);
      }
      if (reposition) parent.style.position = previousPosition;
    };
  }, [generation]);

  const blend = mixBlendMode ?? (light ? 'normal' : 'screen');

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}
      style={{ zIndex, ...style }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{ mixBlendMode: blend }}
        aria-hidden="true"
      />
    </div>
  );
};

export default GhostCursor;
