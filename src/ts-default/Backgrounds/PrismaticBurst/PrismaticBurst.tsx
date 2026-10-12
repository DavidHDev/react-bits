'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

import './PrismaticBurst.css';

const BLOOM_LEVELS = 4;
const MAX_PULSES = 4;

export interface PrismaticBurstProps {
  colors?: string[];
  intensity?: number;
  speed?: number;
  animationType?: 'rotate' | 'rotate3d' | 'hover';
  distort?: number;
  rayCount?: number;
  rayWidth?: number;
  zoom?: number;
  twist?: number;
  flow?: number;
  centerFade?: number;
  grain?: number;
  glow?: number;
  offset?: { x?: number | string; y?: number | string };
  mouseInteraction?: boolean;
  mouseStrength?: number;
  hoverDampness?: number;
  clickBurst?: boolean;
  intro?: boolean;
  fade?: number;
  quality?: 'low' | 'medium' | 'high';
  resolution?: number;
  lightMode?: boolean;
  mixBlendMode?: CSSProperties['mixBlendMode'] | 'none';
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  colors: string[];
  intensity: number;
  speed: number;
  animation: number;
  distort: number;
  rayCount: number;
  rayWidth: number;
  zoom: number;
  twist: number;
  flow: number;
  centerFade: number;
  grain: number;
  glow: number;
  offsetX: number;
  offsetY: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  hoverDampness: number;
  clickBurst: boolean;
  intro: boolean;
  fade: number;
  scale: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
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
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const BURST = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uResolution;
uniform float uTime;
uniform float uPhase;
uniform float uIntensity;
uniform mat3 uOrient;
uniform int uColorCount;
uniform float uDistort;
uniform vec2 uOffset;
uniform sampler2D uGradient;
uniform float uNoiseAmount;
uniform int uRayCount;
uniform float uZoom;
uniform float uRayWidth;
uniform float uTwist;
uniform float uFlow;
uniform float uCenterFade;
uniform vec4 uPointer;
uniform vec4 uPulses[4];
uniform vec3 uIntro;
uniform float uEncode;
out vec4 outColor;

float hash21(vec2 p) {
  p = floor(p);
  float f = 52.9829189 * fract(dot(p, vec2(0.065, 0.005)));
  return fract(f);
}

mat2 rot30() {
  return mat2(0.8, -0.5, 0.5, 0.8);
}

float layeredNoise(vec2 fragPx) {
  vec2 p = mod(fragPx + vec2(uTime * 30.0, -uTime * 21.0), 1024.0);
  vec2 q = rot30() * p;
  float n = 0.0;
  n += 0.40 * hash21(q);
  n += 0.25 * hash21(q * 2.0 + 17.0);
  n += 0.20 * hash21(q * 4.0 + 47.0);
  n += 0.10 * hash21(q * 8.0 + 113.0);
  n += 0.05 * hash21(q * 16.0 + 191.0);
  return n;
}

float edgeFade(vec2 frag, vec2 res, vec2 offset) {
  vec2 toC = frag - 0.5 * res - offset;
  float r = length(toC) / (0.5 * min(res.x, res.y) * uCenterFade);
  float x = clamp(r, 0.0, 1.0);
  float q = x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  float s = q * 0.5;
  s = pow(s, 1.5);
  float tail = 1.0 - pow(1.0 - s, 2.0);
  s = mix(s, tail, 0.2);
  float dn = (layeredNoise(frag * 0.15) - 0.5) * 0.0015 * s;
  return clamp(s + dn, 0.0, 1.0);
}

vec2 rot2(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c) * v;
}

float bendAngle(vec3 q, float t) {
  return 0.8 * sin(q.x * 0.55 + t * 0.6) + 0.7 * sin(q.y * 0.50 - t * 0.5) + 0.6 * sin(q.z * 0.60 + t * 0.7);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float t = uPhase;
  float jitterAmp = 0.1 * clamp(uNoiseAmount, 0.0, 1.0);
  vec2 centered = 2.0 * (frag - uOffset) - uResolution;
  vec3 dir = normalize(vec3(centered, uResolution.y * max(uZoom, 1e-3)));
  float marchT = 0.0;
  vec3 col = vec3(0.0);
  float n = layeredNoise(frag);
  float amp = clamp(uDistort, 0.0, 50.0) * 0.15;
  float edge = 0.5 - 0.35 * (uRayWidth - 1.0);
  mat2 twist = mat2(1.0);
  if (uTwist != 0.0) {
    float a = uTwist * length(centered) / uResolution.y;
    float c = cos(a);
    float s = sin(a);
    twist = mat2(c, s, -s, c);
  }

  for (int i = 0; i < 44; ++i) {
    vec3 P = marchT * dir;
    P.z -= 2.0;
    float rad = length(P);
    vec3 Pl = P * (10.0 / max(rad, 1e-6));
    if (uTwist != 0.0) Pl.xy = twist * Pl.xy;
    Pl = uOrient * Pl;

    float stepLen = min(rad - 0.3, n * jitterAmp) + 0.1;

    vec3 Pb = Pl;
    if (amp > 0.0) {
      float grow = smoothstep(0.35, 3.0, marchT);
      float a1 = amp * grow * bendAngle(Pl * 0.6, t);
      float a2 = 0.5 * amp * grow * bendAngle(Pl.zyx * 0.5 + 3.1, t * 0.9);
      Pb.xz = rot2(Pb.xz, a1);
      Pb.xy = rot2(Pb.xy, a2);
    }

    float rayPattern = smoothstep(
      edge,
      edge + 0.2,
      sin(Pb.x + cos(Pb.y) * cos(Pb.z)) * sin(Pb.z + sin(Pb.y) * cos(Pb.x + t))
    );

    if (uRayCount > 0) {
      float ang = atan(Pb.y, Pb.x);
      float comb = 0.5 + 0.5 * cos(float(uRayCount) * ang);
      comb = pow(comb, 3.0);
      rayPattern *= smoothstep(0.15, 0.95, comb);
    }

    float depth = marchT - uFlow;
    vec3 spectral;
    if (uColorCount > 0) {
      float saw = fract(depth * 0.25);
      float tRay = saw * saw * (3.0 - 2.0 * saw);
      spectral = 2.0 * texture(uGradient, vec2(clamp(tRay, 0.0, 1.0), 0.5)).rgb;
    } else {
      spectral = 1.0 + cos(depth * 3.0 + vec3(0.0, 1.0, 2.0));
    }

    col += (0.05 / (0.4 + stepLen)) * smoothstep(5.0, 0.0, rad) * spectral * rayPattern;
    marchT += stepLen;
  }

  col *= edgeFade(frag, uResolution, uOffset);
  col *= uIntensity;

  float unit = 0.5 * min(uResolution.x, uResolution.y);
  float radius = length(frag - 0.5 * uResolution - uOffset) / unit;
  float lift = 1.0;
  for (int k = 0; k < 4; k++) {
    vec4 pulse = uPulses[k];
    if (pulse.y <= 0.0) continue;
    float d = (radius - pulse.x) / pulse.z;
    lift += pulse.y * exp(-d * d) + pulse.w;
  }
  if (uPointer.z > 0.0) {
    vec2 m = (frag - uPointer.xy) / unit;
    lift += uPointer.z * exp(-dot(m, m) / max(uPointer.w * uPointer.w, 1e-4));
  }
  if (uIntro.z > 0.0) {
    vec2 toC = frag - 0.5 * uResolution - uOffset;
    float ang = atan(toC.y, toC.x);
    float streak = 0.5 + 0.22 * sin(ang * 5.0 + 1.3) + 0.16 * sin(ang * 13.0 + 4.1) + 0.12 * sin(ang * 29.0 + 2.2);
    float front = uIntro.x * (0.7 + 0.3 * streak);
    float d = (radius - front) / 0.2;
    lift += uIntro.y * exp(-d * d);
    lift *= smoothstep(front, front - 0.5, radius);
  }

  outColor = vec4(col * lift * uEncode, 1.0);
}`;

const DOWNSAMPLE = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTarget;
uniform vec2 uTexel;
uniform float uLimit;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec3 color = texture(uSource, uv - uTexel).rgb;
  color += texture(uSource, uv + uTexel).rgb;
  color += texture(uSource, uv + vec2(uTexel.x, -uTexel.y)).rgb;
  color += texture(uSource, uv + vec2(-uTexel.x, uTexel.y)).rgb;
  outColor = vec4(min(color * 0.25, vec3(uLimit)), 1.0);
}`;

const BLUR = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTarget;
uniform vec2 uStep;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec3 color = texture(uSource, uv).rgb * 0.181862;
  color += (texture(uSource, uv + uStep * 1.423135).rgb + texture(uSource, uv - uStep * 1.423135).rgb) * 0.284316;
  color += (texture(uSource, uv + uStep * 3.326702).rgb + texture(uSource, uv - uStep * 3.326702).rgb) * 0.106598;
  color += (texture(uSource, uv + uStep * 5.242989).rgb + texture(uSource, uv - uStep * 5.242989).rgb) * 0.018156;
  outColor = vec4(color, 1.0);
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uSceneSize;
uniform sampler2D uBloom0;
uniform sampler2D uBloom1;
uniform sampler2D uBloom2;
uniform sampler2D uBloom3;
uniform vec2 uView;
uniform float uExact;
uniform float uDecode;
uniform float uBloom;
uniform float uFade;
uniform float uLightMode;
out vec4 outColor;

vec3 tap(vec2 uv) {
  return textureLod(uScene, uv, 0.0).rgb;
}

vec3 bicubic(vec2 uv) {
  vec2 position = uv * uSceneSize;
  vec2 center = floor(position - 0.5) + 0.5;
  vec2 f = position - center;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 t0 = (center - 1.0) / uSceneSize;
  vec2 t3 = (center + 2.0) / uSceneSize;
  vec2 t12 = (center + w2 / w12) / uSceneSize;
  vec3 result = tap(vec2(t0.x, t0.y)) * w0.x * w0.y;
  result += tap(vec2(t12.x, t0.y)) * w12.x * w0.y;
  result += tap(vec2(t3.x, t0.y)) * w3.x * w0.y;
  result += tap(vec2(t0.x, t12.y)) * w0.x * w12.y;
  result += tap(vec2(t12.x, t12.y)) * w12.x * w12.y;
  result += tap(vec2(t3.x, t12.y)) * w3.x * w12.y;
  result += tap(vec2(t0.x, t3.y)) * w0.x * w3.y;
  result += tap(vec2(t12.x, t3.y)) * w12.x * w3.y;
  result += tap(vec2(t3.x, t3.y)) * w3.x * w3.y;
  return max(result, 0.0);
}

float smootherstep01(float t) {
  t = clamp(t, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uView;
  vec3 col = uExact > 0.5 ? texelFetch(uScene, ivec2(gl_FragCoord.xy), 0).rgb : bicubic(uv);
  if (uBloom > 0.0) {
    vec3 halo = texture(uBloom0, uv).rgb * 0.42;
    halo += texture(uBloom1, uv).rgb * 0.3;
    halo += texture(uBloom2, uv).rgb * 0.18;
    halo += texture(uBloom3, uv).rgb * 0.1;
    col += halo * uBloom * (uLightMode > 0.5 ? 0.25 : 1.0);
  }
  col = clamp(col * uDecode, 0.0, 1.0);

  float mask = 1.0;
  float edge = uFade * 0.5;
  if (edge > 0.0) {
    mask *= smootherstep01(uv.x / edge) * smootherstep01((1.0 - uv.x) / edge);
    mask *= smootherstep01(uv.y / edge) * smootherstep01((1.0 - uv.y) / edge);
  }

  if (uLightMode > 0.5) {
    float energy = max(max(col.r, col.g), col.b);
    vec3 hue = col / max(energy, 0.0001);
    float neutral = min(hue.r, min(hue.g, hue.b));
    hue = max(hue - vec3(neutral * 0.68), vec3(0.0));
    hue /= max(max(hue.r, max(hue.g, hue.b)), 0.0001);
    vec3 pigment = mix(hue, hue * hue, 0.24) * 0.64;
    float coverage = smoothstep(0.001, 0.32, energy);
    coverage = pow(coverage, 0.72) * 0.92 * mask;
    outColor = vec4(pigment * coverage, coverage);
  } else {
    col *= mask;
    outColor = vec4(col, max(col.r, max(col.g, col.b)));
  }
}`;

const QUALITY: Record<string, number> = { low: 0.35, medium: 0.5, high: 0.7 };
const MIN_SCALE = 0.2;
const INTRO_SECONDS = 2.4;
const PULSE_LIFE = 1.5;
const ANIMATIONS: Record<string, number> = { rotate: 0, rotate3d: 1, hover: 2 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toPx = (value?: number | string | null): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value).trim().replace('px', ''));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const rotX = (a: number): number[] => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
};

const rotY = (a: number): number[] => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
};

const rotZ = (a: number): number[] => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
};

const multiply = (a: ArrayLike<number>, b: ArrayLike<number>): Float32Array => {
  const out = new Float32Array(9);
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      out[col * 3 + row] = a[row] * b[col * 3] + a[3 + row] * b[col * 3 + 1] + a[6 + row] * b[col * 3 + 2];
    }
  }
  return out;
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

const link = (gl: WebGL2RenderingContext, fragmentSource: string): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
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
  const uniforms: Uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const PrismaticBurst = ({
  colors,
  intensity = 2,
  speed = 0.5,
  animationType = 'rotate3d',
  distort = 0,
  rayCount = 0,
  rayWidth = 1,
  zoom = 1,
  twist = 0,
  flow = 0,
  centerFade = 1,
  grain = 0.8,
  glow = 0,
  offset,
  mouseInteraction = true,
  mouseStrength = 0.5,
  hoverDampness = 0.25,
  clickBurst = true,
  intro = true,
  fade = 0,
  quality = 'high',
  resolution,
  lightMode = false,
  mixBlendMode,
  paused = false,
  dpr,
  className = '',
  style
}: PrismaticBurstProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef<Settings>(null as unknown as Settings);
  const [generation, setGeneration] = useState(0);
  settingsRef.current = {
    colors: Array.isArray(colors) ? colors.slice(0, 64).map(String) : [],
    intensity: Math.max(0, intensity),
    speed,
    animation: ANIMATIONS[animationType] ?? ANIMATIONS.rotate3d,
    distort: Math.max(0, distort),
    rayCount: Math.max(0, Math.floor(rayCount ?? 0)),
    rayWidth: clamp(rayWidth, 0.2, 2.5),
    zoom: Math.max(0.05, zoom),
    twist,
    flow,
    centerFade: clamp(centerFade, 0.5, 3),
    grain: clamp(grain, 0.3, 1),
    glow: Math.max(0, glow),
    offsetX: toPx(offset?.x),
    offsetY: toPx(offset?.y),
    mouseInteraction,
    mouseStrength: Math.max(0, mouseStrength),
    hoverDampness: clamp(hoverDampness, 0, 1),
    clickBurst,
    intro,
    fade: clamp(fade, 0, 1),
    scale: clamp(resolution ?? QUALITY[quality] ?? QUALITY.high, MIN_SCALE, 1),
    lightMode,
    paused,
    dpr
  };

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
    const burstProgram = link(gl, BURST);
    const downProgram = link(gl, DOWNSAMPLE);
    const blurProgram = link(gl, BLUR);
    const compositeProgram = link(gl, COMPOSITE);
    if (!burstProgram || !downProgram || !blurProgram || !compositeProgram) return undefined;

    const onContextLost = (event: Event) => {
      event.preventDefault();
    };
    const onContextRestored = () => setGeneration(value => value + 1);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const format = floatTargets ? gl.RGBA16F : gl.RGBA8;
    const encode = floatTargets ? 1 : 0.25;
    const createTarget = (): Target => ({ texture: null, framebuffer: gl.createFramebuffer(), width: 0, height: 0 });
    const scene = createTarget();
    const levels = Array.from({ length: BLOOM_LEVELS }, () => [createTarget(), createTarget()]);

    const allocate = (target: Target, width: number, height: number) => {
      if (target.texture && target.width === width && target.height === height) return;
      if (target.texture) gl.deleteTexture(target.texture);
      target.texture = gl.createTexture();
      target.width = width;
      target.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    };

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

    const gradient = gl.createTexture();
    let gradientKey: string | null = null;
    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const toRgb = (value: string): number[] => {
      if (!probe) return [255, 255, 255];
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    };
    const uploadGradient = (list: string[]) => {
      const key = list.join('|');
      if (key === gradientKey) return;
      gradientKey = key;
      const count = Math.max(1, list.length);
      const data = new Uint8Array(count * 4).fill(255);
      list.forEach((value, index) => data.set(toRgb(value), index * 4));
      gl.bindTexture(gl.TEXTURE_2D, gradient);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, count, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const pointer = { x: 0, y: 0, inside: false };
    const state = {
      time: 0,
      phase: 0,
      flow: 0,
      kick: 0,
      intro: settingsRef.current.intro && !reduce ? 0 : 1,
      hoverX: 0.5,
      hoverY: 0.5,
      smoothX: 0,
      smoothY: 0,
      touch: 0,
      governor: 1,
      slow: 0,
      quick: 0
    };
    const pulses: { age: number }[] = [];
    const pulseData = new Float32Array(MAX_PULSES * 4);
    let raf = 0;
    let last = 0;
    let visible = true;

    const render = () => {
      const s = settingsRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const cssWidth = Math.max(1, container.clientWidth);
      const cssHeight = Math.max(1, container.clientHeight);
      const scale = Math.max(MIN_SCALE, s.scale * state.governor);
      const sceneWidth = Math.max(1, Math.round(width * scale));
      const sceneHeight = Math.max(1, Math.round(height * scale));
      const exact = sceneWidth === width && sceneHeight === height;
      gl.bindVertexArray(vao);
      allocate(scene, sceneWidth, sceneHeight);
      levels.forEach((pair, index) => {
        const levelWidth = Math.max(1, Math.round(cssWidth / 2 ** (index + 1)));
        const levelHeight = Math.max(1, Math.round(cssHeight / 2 ** (index + 1)));
        allocate(pair[0], levelWidth, levelHeight);
        allocate(pair[1], levelWidth, levelHeight);
      });
      uploadGradient(s.colors);

      const toScene = sceneWidth / cssWidth;
      const engaged = s.mouseInteraction ? state.touch : 0;
      const nx = cssWidth > 0 ? (state.smoothX / cssWidth) * 2 - 1 : 0;
      const ny = cssHeight > 0 ? (state.smoothY / cssHeight) * 2 - 1 : 0;
      const parallax = 0.06 * s.mouseStrength * engaged * Math.min(sceneWidth, sceneHeight) * 0.5;
      const offsetX = s.offsetX * toScene + nx * parallax;
      const offsetY = s.offsetY * toScene - ny * parallax;

      const t = state.phase;
      let orient: Float32Array | number[];
      if (s.animation === 0) {
        const a = t * 0.2;
        const c0 = Math.cos(a);
        orient = [c0, 0, Math.cos(a + 11), 0, 1, 0, Math.cos(a + 33), 0, c0];
      } else if (s.animation === 1) {
        orient = multiply(multiply(rotZ(t * 0.17), rotY(t * 0.21)), rotX(t * 0.31));
      } else {
        const mx = state.hoverX * 2 - 1;
        const my = state.hoverY * 2 - 1;
        orient = multiply(rotY(mx * 0.6), rotX(my * 0.6));
      }
      if (s.animation !== 2 && engaged > 0) {
        const tilt = 0.3 * s.mouseStrength * engaged;
        orient = multiply(orient, multiply(rotY(nx * tilt), rotX(ny * tilt)));
      }

      pulseData.fill(0);
      pulses.forEach((pulse, index) => {
        const life = pulse.age / PULSE_LIFE;
        pulseData.set(
          [pulse.age * 1.7, 1.6 * Math.pow(1 - life, 1.6), 0.2 + pulse.age * 0.16, 0.35 * Math.exp(-pulse.age * 7)],
          index * 4
        );
      });

      const unit = 0.5 * Math.min(sceneWidth, sceneHeight);
      const reach =
        Math.hypot(sceneWidth * 0.5 + Math.abs(offsetX), sceneHeight * 0.5 + Math.abs(offsetY)) / Math.max(unit, 1);
      const rise = 1 - Math.pow(1 - state.intro, 3);

      const b = pass(scene, burstProgram);
      bind(0, gradient);
      gl.uniform1i(b.uGradient, 0);
      gl.uniform2f(b.uResolution, sceneWidth, sceneHeight);
      gl.uniform1f(b.uTime, state.time);
      gl.uniform1f(b.uPhase, t);
      gl.uniform1f(b.uIntensity, s.intensity);
      gl.uniformMatrix3fv(b.uOrient, false, orient);
      gl.uniform1i(b.uColorCount, s.colors.length);
      gl.uniform1f(b.uDistort, s.distort);
      gl.uniform2f(b.uOffset, offsetX, offsetY);
      gl.uniform1f(b.uNoiseAmount, s.grain);
      gl.uniform1i(b.uRayCount, s.rayCount);
      gl.uniform1f(b.uZoom, s.zoom);
      gl.uniform1f(b.uRayWidth, s.rayWidth);
      gl.uniform1f(b.uTwist, s.twist);
      gl.uniform1f(b.uFlow, state.flow);
      gl.uniform1f(b.uCenterFade, s.centerFade * Math.max(1, s.zoom));
      gl.uniform4f(
        b.uPointer,
        state.smoothX * toScene,
        (cssHeight - state.smoothY) * toScene,
        s.mouseInteraction ? 0.7 * s.mouseStrength * engaged : 0,
        0.45
      );
      gl.uniform4fv(b.uPulses, pulseData);
      gl.uniform3f(b.uIntro, (rise * (reach + 0.6)) / 0.7, 1.6 * (1 - state.intro), state.intro < 1 ? 1 : 0);
      gl.uniform1f(b.uEncode, encode);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (s.glow > 0) {
        let source = scene;
        levels.forEach(([front, back]) => {
          const d = pass(front, downProgram);
          bind(0, source.texture);
          gl.uniform1i(d.uSource, 0);
          gl.uniform2f(d.uTarget, front.width, front.height);
          gl.uniform2f(d.uTexel, 1 / source.width, 1 / source.height);
          gl.uniform1f(d.uLimit, 3 * encode);
          gl.drawArrays(gl.TRIANGLES, 0, 3);

          let u = pass(back, blurProgram);
          bind(0, front.texture);
          gl.uniform1i(u.uSource, 0);
          gl.uniform2f(u.uTarget, back.width, back.height);
          gl.uniform2f(u.uStep, 1 / front.width, 0);
          gl.drawArrays(gl.TRIANGLES, 0, 3);

          u = pass(front, blurProgram);
          bind(0, back.texture);
          gl.uniform1i(u.uSource, 0);
          gl.uniform2f(u.uTarget, front.width, front.height);
          gl.uniform2f(u.uStep, 0, 1 / back.height);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          source = front;
        });
      }

      const c = pass(null, compositeProgram);
      bind(0, scene.texture);
      gl.uniform1i(c.uScene, 0);
      levels.forEach(([front], index) => {
        bind(index + 1, front.texture);
        gl.uniform1i(c[`uBloom${index}`], index + 1);
      });
      gl.uniform2f(c.uSceneSize, sceneWidth, sceneHeight);
      gl.uniform2f(c.uView, width, height);
      gl.uniform1f(c.uExact, exact ? 1 : 0);
      gl.uniform1f(c.uDecode, 1 / encode);
      gl.uniform1f(c.uBloom, s.glow);
      gl.uniform1f(c.uFade, s.fade);
      gl.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      for (let unit = BLOOM_LEVELS; unit >= 0; unit--) bind(unit, null);
    };

    const tune = (interval: number) => {
      if (interval > 1 / 40) {
        state.slow += 1;
        state.quick = 0;
      } else if (interval < 1 / 55) {
        state.quick += 1;
        state.slow = 0;
      }
      if (state.slow > 20) {
        state.governor = Math.max(0.5, state.governor * 0.85);
        state.slow = 0;
      } else if (state.quick > 180 && state.governor < 1) {
        state.governor = Math.min(1, state.governor * 1.1);
        state.quick = 0;
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      if (last) tune((now - last) / 1000);
      last = now;

      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
      const rush = 3 * Math.pow(1 - state.intro, 2);
      const running = !s.paused && !reduce;
      if (running) {
        state.time += dt;
        state.phase += dt * s.speed * (1 + rush) + state.kick * dt;
        state.flow += dt * s.flow * 1.2;
      }
      state.kick *= Math.exp(-dt * 3.5);
      if (state.kick < 1e-3) state.kick = 0;

      const engaged = s.mouseInteraction && pointer.inside && !reduce;
      const tau = 0.02 + s.hoverDampness * 0.5;
      const follow = 1 - Math.exp(-dt / tau);
      if (engaged && state.touch < 0.01) {
        state.smoothX = pointer.x;
        state.smoothY = pointer.y;
      }
      state.smoothX += (pointer.x - state.smoothX) * follow;
      state.smoothY += (pointer.y - state.smoothY) * follow;
      state.touch += ((engaged ? 1 : 0) - state.touch) * (1 - Math.exp(-dt * (engaged ? 5 : 2.5)));
      if (s.animation === 2 && pointer.inside) {
        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        state.hoverX += (clamp(pointer.x / width, 0, 1) - state.hoverX) * follow;
        state.hoverY += (clamp(pointer.y / height, 0, 1) - state.hoverY) * follow;
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].age += dt;
        if (pulses[i].age > PULSE_LIFE) pulses.splice(i, 1);
      }

      render();

      const settling =
        state.intro < 1 ||
        pulses.length > 0 ||
        state.kick > 0 ||
        Math.abs((engaged ? 1 : 0) - state.touch) > 0.002 ||
        Math.abs(pointer.x - state.smoothX) + Math.abs(pointer.y - state.smoothY) > 0.2;
      if ((running && (s.speed !== 0 || s.grain > 0 || s.flow !== 0)) || settling) raf = requestAnimationFrame(frame);
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
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      if (!raf) render();
      wake();
    };

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = locate(event);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = point.inside;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const point = locate(event);
      if (!point.inside) return;
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = true;
      const s = settingsRef.current;
      if (s.mouseInteraction && s.clickBurst && !reduce) {
        if (pulses.length >= MAX_PULSES) pulses.shift();
        pulses.push({ age: 0 });
        state.kick = Math.min(5, state.kick + 2.4);
      }
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
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      [scene, ...levels.flat()].forEach(target => {
        if (target.texture) gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      });
      gl.deleteTexture(gradient);
      [burstProgram, downProgram, blurProgram, compositeProgram].forEach(item => gl.deleteProgram(item.program));
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      if (!gl.isContextLost()) gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [generation]);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div ref={containerRef} className={`prismatic-burst-container${className ? ` ${className}` : ''}`} style={style}>
      <canvas
        ref={canvasRef}
        className="prismatic-burst-canvas"
        style={mixBlendMode && mixBlendMode !== 'none' ? { mixBlendMode } : undefined}
        aria-hidden="true"
      />
    </div>
  );
};

export default PrismaticBurst;
