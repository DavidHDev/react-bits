'use client';

import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react';

export type FerrofluidFlow = 'up' | 'down' | 'left' | 'right' | 'none';

export interface FerrofluidProps extends HTMLAttributes<HTMLDivElement> {
  colors?: string[];
  speed?: number;
  scale?: number;
  spikeHeight?: number;
  sharpness?: number;
  turbulence?: number;
  fluidity?: number;
  tilt?: number;
  magnetism?: number;
  variation?: number;
  flowDirection?: FerrofluidFlow;
  brightness?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
  mouseDampening?: number;
  clickPulse?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  transparent?: boolean;
  color?: string;
  opacity?: number;
  paused?: boolean;
  dpr?: number;
  mixBlendMode?: CSSProperties['mixBlendMode'];
}

type Settings = {
  colors: string[];
  speed: number;
  scale: number;
  spikeHeight: number;
  sharpness: number;
  turbulence: number;
  fluidity: number;
  tilt: number;
  magnetism: number;
  variation: number;
  flow: number[];
  brightness: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  mouseRadius: number;
  mouseDampening: number;
  clickPulse: boolean;
  intro: boolean;
  lightMode: boolean;
  transparent: boolean;
  color?: string;
  opacity: number;
  paused: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

type Target = { texture: WebGLTexture | null; framebuffer: WebGLFramebuffer | null };

const CELL = 1 / 3;
const BOUND_CELL = 1;
const INTRO_SECONDS = 2.4;
const FOV = (38 * Math.PI) / 180;
const FLOW: Record<string, number[]> = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0], none: [0, 0] };

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const SIM_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uGridOrigin;
uniform float uCell;
uniform float uDt;
uniform float uTime;
uniform vec2 uFlow;
uniform float uTurbulence;
uniform float uMagnetism;
uniform float uFieldScale;
uniform vec2 uSeed;
uniform vec4 uCursor;
uniform vec4 uPulse;
uniform float uPulseSpeed;
uniform float uPulseWidth;
uniform vec3 uIntro;
uniform float uSpikeHeight;
uniform float uMound;
uniform float uStiffness;
uniform float uDamping;
uniform float uSettle;
out vec4 outState;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float flowField(vec2 p) {
  vec2 q = p / uFieldScale + uSeed;
  vec2 drift = uFlow * uTime * 0.55;
  vec2 warp = vec2(noise(q * 0.6 + vec2(uTime * 0.07, 3.1)), noise(q * 0.6 - vec2(7.3, uTime * 0.06))) - 0.5;
  vec2 r = q + warp * 1.8 * uTurbulence - drift;
  float n = noise(r) * 0.65 + noise(r * 2.03 + 11.7 - drift * 0.5) * 0.35;
  return smoothstep(0.44, 0.86, n);
}

void main() {
  vec2 texel = floor(gl_FragCoord.xy);
  vec2 p = uGridOrigin + (texel + 0.5) * uCell;
  vec4 prev = texelFetch(uState, ivec2(texel), 0);
  float swell = flowField(p);
  float field = uMagnetism * (0.03 + 1.0 * swell * swell);
  vec2 dc = p - uCursor.xy;
  float falloff = dot(dc, dc) / (uCursor.w * uCursor.w);
  field += uCursor.z * exp(-falloff);
  float mound = uCursor.z * exp(-falloff / 2.2);
  if (uPulse.w > 0.0) {
    float ring = length(p - uPulse.xy) - uPulse.z * uPulseSpeed;
    float envelope = smoothstep(0.0, 0.08, uPulse.z) * exp(-uPulse.z * 1.1);
    field += uPulse.w * envelope * exp(-ring * ring / (uPulseWidth * uPulseWidth));
  }
  float front = clamp((uIntro.z - length(p - uIntro.xy)) / 3.0, 0.0, 1.0);
  front = front * front * (3.0 - 2.0 * front);
  float target = uSpikeHeight * min(pow(max(field * front - 0.04, 0.0), 1.6), 1.0);
  float height = prev.x;
  float velocity = prev.y;
  if (uSettle > 0.5) {
    height = target;
    velocity = 0.0;
  } else {
    float steps = ceil(uDt / 0.008);
    float h = uDt / steps;
    for (int k = 0; k < 8; k++) {
      if (float(k) >= steps) break;
      velocity += (uStiffness * (target - height) - uDamping * velocity) * h;
      height += velocity * h;
    }
    if (height < 0.0) {
      height = 0.0;
      velocity = max(velocity, 0.0);
    }
  }
  outState = vec4(height, velocity, mound * front * uMound, 1.0);
}`;

const BOUND_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uGridOrigin;
uniform float uCell;
uniform vec2 uStateSize;
uniform float uBoundCell;
out vec4 outBound;

void main() {
  vec2 center = uGridOrigin + (floor(gl_FragCoord.xy) + 0.5) * uBoundCell;
  vec2 base = floor((center - uGridOrigin) / uCell);
  float top = 0.0;
  float peak = 0.0;
  for (int y = -4; y <= 4; y++) {
    for (int x = -4; x <= 4; x++) {
      vec2 texel = clamp(base + vec2(float(x), float(y)), vec2(0.0), uStateSize - 1.0);
      vec4 s = texelFetch(uState, ivec2(texel), 0);
      top = max(top, max(s.x, 0.0) * 1.05 + s.z);
      peak = max(peak, s.x);
    }
  }
  outBound = vec4(top, peak, 0.0, 1.0);
}`;

const RENDER_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform sampler2D uBound;
uniform vec2 uGridOrigin;
uniform vec2 uGridSpan;
uniform vec2 uBoundSpan;
uniform float uCellSize;
uniform vec2 uResolution;
uniform vec3 uCamera;
uniform vec3 uForward;
uniform vec3 uUpward;
uniform float uTanHalf;
uniform float uPixelAngle;
uniform float uFar;
uniform float uFogStart;
uniform float uTop;
uniform float uBottom;
uniform float uTime;
uniform vec4 uCursor;
uniform float uMound;
uniform float uRound;
uniform float uSpan;
uniform float uExponent;
uniform float uWarp;
uniform vec3 uKey;
uniform vec3 uStrip;
uniform vec3 uFill;
uniform float uExposure;
uniform float uLight;
uniform float uOpaque;
uniform vec3 uBase;
uniform float uOpacity;
out vec4 outColor;

const float G = 7.2551975;
const vec2 E1 = vec2(0.8660254, 0.5);
const vec2 E2 = vec2(-0.8660254, 0.5);
const vec2 E3 = vec2(0.0, -1.0);
const mat2 TURN = mat2(0.9902681, 0.1391731, -0.1391731, 0.9902681);
const float F0 = 0.06;

vec3 mound(vec2 p) {
  vec2 d = p - uCursor.xy;
  float inv = 1.0 / (uCursor.w * uCursor.w * 2.2);
  float e = uCursor.z * exp(-dot(d, d) * inv);
  return vec3(e, -2.0 * inv * e * d) * uMound;
}

vec2 lattice(vec2 p) {
  vec2 q = TURN * p;
  float t = uTime * 0.35;
  return q + uWarp * vec2(sin(q.y * 0.9 + t), cos(q.x * 0.8 - t * 0.8));
}

float detail(float t) {
  return smoothstep(3.0, 8.0, 1.0 / max(t * uPixelAngle, 1e-5)) * (1.0 - smoothstep(uFogStart, mix(uFogStart, uFar, 0.7), t));
}

float profile(float u, out float rate) {
  float root = sqrt(max(1.0 - u, 0.0) + uRound * uRound);
  rate = 0.5 / (uSpan * root);
  return clamp(1.0 - (root - uRound) / uSpan, 0.0, 1.0);
}

float spikes(vec2 p, float a, float rise, out float clearance) {
  clearance = 10.0;
  if (a < 0.002) return 0.0;
  vec2 q = lattice(p);
  float u = (cos(G * dot(E1, q)) + cos(G * dot(E2, q)) + cos(G * dot(E3, q)) + 1.5) / 4.5;
  if (a > 0.05) {
    float root = uRound + (1.0 - pow(clamp(rise / a, 0.0, 1.0), 1.0 / uExponent)) * uSpan;
    clearance = sqrt(max(1.0 - u, 0.0) / 8.77) - sqrt(max(root * root - uRound * uRound, 0.0) / 8.77);
  }
  float rate;
  return a * pow(profile(u, rate), uExponent);
}

vec2 spikesSlope(vec2 p, float a, vec2 aSlope) {
  if (a < 0.002) return vec2(0.0);
  vec2 q = lattice(p);
  float c1 = G * dot(E1, q);
  float c2 = G * dot(E2, q);
  float c3 = G * dot(E3, q);
  float u = (cos(c1) + cos(c2) + cos(c3) + 1.5) / 4.5;
  vec2 du = -(G / 4.5) * (sin(c1) * E1 + sin(c2) * E2 + sin(c3) * E3) * TURN;
  float rate;
  float s = max(profile(u, rate), 1e-4);
  float shape = pow(s, uExponent);
  return a * uExponent * shape / s * rate * du + aSlope * shape;
}

float surface(vec2 p, float z, float t, out float clearance) {
  vec4 f = texture(uField, (p - uGridOrigin) / uGridSpan);
  return f.z + spikes(p, f.x * detail(t), z - f.z, clearance);
}

vec2 bound(vec2 p) {
  return texture(uBound, (p - uGridOrigin) / uBoundSpan).rg;
}

float panel(vec3 r, vec3 dir, vec3 up, vec2 extent, float soft) {
  vec3 side = normalize(cross(dir, up));
  vec3 top = cross(side, dir);
  float facing = dot(r, dir);
  if (facing <= 0.0) return 0.0;
  vec2 q = vec2(dot(r, side), dot(r, top)) / facing;
  vec2 e = smoothstep(extent + soft, extent - soft, abs(q));
  return e.x * e.y;
}

vec3 studio(vec3 r, vec3 rd, float soft) {
  vec3 z = vec3(0.0, 0.0, 1.0);
  vec3 col = uKey * 4.2 * panel(r, normalize(vec3(-0.3, -0.5, 0.81)), z, vec2(0.36, 0.22), 0.08 + soft);
  col += uStrip * 1.5 * panel(r, normalize(vec3(-0.9, -0.2, 0.38)), z, vec2(0.12, 0.7), 0.07 + soft);
  col += uStrip * 1.5 * panel(r, normalize(vec3(0.9, -0.1, 0.42)), z, vec2(0.12, 0.7), 0.07 + soft);
  float lift = asin(clamp(r.z, -1.0, 1.0)) - asin(clamp(-rd.z, -1.0, 1.0));
  col += uFill * 0.45 * smoothstep(0.08 - soft, 0.7 + soft, lift) * smoothstep(1.6, 1.0, lift);
  return col;
}

vec4 finish(vec3 light, vec3 paper, float alpha) {
  if (uLight > 0.5) {
    if (uOpaque > 0.5) return vec4(mix(uBase, paper, alpha) * uOpacity, uOpacity);
    vec3 shade = mix(vec3(1.0), paper, alpha * uOpacity);
    float cover = 1.0 - min(shade.r, min(shade.g, shade.b));
    return vec4(shade - (1.0 - cover), cover);
  }
  vec3 glow = light * alpha * uOpacity;
  if (uOpaque > 0.5) return vec4(uBase + glow, 1.0);
  return vec4(glow, max(glow.r, max(glow.g, glow.b)));
}

void main() {
  vec2 ndc = (gl_FragCoord.xy - 0.5 * uResolution) / (0.5 * uResolution.y);
  vec3 side = normalize(cross(uForward, uUpward));
  vec3 rd = normalize(uForward + (ndc.x * side + ndc.y * uUpward) * uTanHalf);
  if (rd.z > -0.004) {
    outColor = finish(vec3(0.0), vec3(1.0), 0.0);
    return;
  }
  float tTop = max((uTop - uCamera.z) / rd.z, 0.0);
  float tEnd = min((uBottom - uCamera.z) / rd.z, uFar);
  if (tTop >= tEnd) {
    outColor = finish(vec3(0.0), vec3(1.0), 0.0);
    return;
  }
  float sink = max(-rd.z, 0.2);
  float glide = max(length(rd.xy), 0.05);
  float chunk = 0.9 / glide;
  float t = tEnd;
  float tPrev = tEnd;
  bool found = false;
  bool smoothHit = false;
  float t0 = tTop;
  vec2 b0 = bound(uCamera.xy + rd.xy * t0);
  for (int c = 0; c < 64; c++) {
    if (t0 >= tEnd) break;
    float t1 = min(t0 + chunk, tEnd);
    vec2 b1 = bound(uCamera.xy + rd.xy * t1);
    float b = max(b0.x, b1.x) + 0.03;
    float z1 = uCamera.z + rd.z * t1;
    if (z1 > b) {
      t0 = t1;
      b0 = b1;
      continue;
    }
    float tt = max(t0, (b - uCamera.z) / rd.z);
    if (max(b0.y, b1.y) < 0.002) {
      for (int k = 0; k < 3; k++) {
        vec3 probe = uCamera + rd * tt;
        tt += (probe.z - mound(probe.xy).x) / sink * 0.95;
      }
      if (tt <= t1 + 0.02 || t1 >= tEnd) {
        t = tt;
        smoothHit = true;
        break;
      }
      t0 = t1;
      b0 = b1;
      continue;
    }
    float tp = tt;
    for (int k = 0; k < 48; k++) {
      vec3 pos = uCamera + rd * tt;
      float clearance;
      float gap = pos.z - surface(pos.xy, pos.z, tt, clearance);
      if (gap < 0.0) {
        found = true;
        break;
      }
      tp = tt;
      float pixel = tt * uPixelAngle;
      float limit = pos.z > bound(pos.xy).x + 0.02 ? 0.6 / glide : max(clearance * 0.9, pixel) / glide;
      tt += max(min(gap * 0.75 / sink, limit), pixel);
      if (tt > t1) break;
    }
    if (found) {
      t = tt;
      tPrev = tp;
      break;
    }
    t0 = t1;
    b0 = b1;
  }

  vec3 pos;
  vec2 slope;
  if (smoothHit || !found) {
    pos = uCamera + rd * t;
    slope = mound(pos.xy).yz;
  } else {
    float lo = tPrev;
    float hi = t;
    for (int k = 0; k < 4; k++) {
      float mid = 0.5 * (lo + hi);
      vec3 probe = uCamera + rd * mid;
      float clearance;
      if (probe.z - surface(probe.xy, probe.z, mid, clearance) < 0.0) hi = mid;
      else lo = mid;
    }
    t = hi;
    pos = uCamera + rd * t;
    vec2 uv = (pos.xy - uGridOrigin) / uGridSpan;
    vec2 step = uCellSize / uGridSpan;
    float fade = detail(t);
    float a = texture(uField, uv).x * fade;
    vec2 aSlope = vec2(
      texture(uField, uv + vec2(step.x, 0.0)).x - texture(uField, uv - vec2(step.x, 0.0)).x,
      texture(uField, uv + vec2(0.0, step.y)).x - texture(uField, uv - vec2(0.0, step.y)).x
    ) * fade / (2.0 * uCellSize);
    slope = mound(pos.xy).yz + spikesSlope(pos.xy, a, aSlope);
  }

  vec3 n = normalize(vec3(-slope, 1.0));
  vec3 r = reflect(rd, n);
  float soft = length(fwidth(r)) * 0.6;
  float facing = max(dot(n, -rd), 0.0);
  float fresnel = F0 + (1.0 - F0) * pow(1.0 - facing, 5.0);
  float rim = pow(1.0 - clamp(abs(dot(rd, n)), 0.0, 1.0), 3.0) * smoothstep(0.85, 0.4, n.z);
  float distance = 1.0 - smoothstep(uFogStart, uFar, t);

  if (uLight > 0.5) {
    vec3 key = normalize(vec3(-0.45, -0.55, 0.7));
    float lambert = clamp(dot(n, key) / key.z, 0.0, 1.0);
    float diffuse = mix(0.62, 1.0, lambert);
    float room = mix(0.3, 1.0, smoothstep(-0.25, 0.3, r.z));
    room -= 0.3 * rim;
    float lum = mix(diffuse, room, fresnel);
    lum = 1.0 - (1.0 - lum) * clamp(uExposure / 3.0, 0.0, 1.5);
    vec3 shadow = mix(vec3(0.0), uStrip, 0.45);
    vec3 paper = mix(shadow, vec3(1.0), clamp(lum, 0.0, 1.0));
    outColor = finish(vec3(0.0), paper, distance);
    return;
  }

  vec3 shine = 1.0 - exp(-(studio(r, rd, soft) * fresnel + uFill * rim * 0.35) * uExposure);
  outColor = finish(shine, vec3(1.0), distance);
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const shapeOf = (sharpness: number) => {
  const edge = clamp((sharpness - 1) / 4, 0, 1);
  const round = 1 - edge * 0.7;
  const exponent = 1.05 + edge * 1.2;
  const span = Math.sqrt(1 + round * round) - round;
  return { round, exponent, span };
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
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name.replace('[0]', '')] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const Ferrofluid = ({
  colors = ['#ffffff', '#ffffff', '#ffffff'],
  speed = 0.5,
  scale = 1.6,
  spikeHeight = 1,
  sharpness = 2.5,
  turbulence = 1,
  fluidity = 0.5,
  tilt = 48,
  magnetism = 1,
  variation = 0,
  flowDirection = 'down',
  brightness = 1,
  mouseInteraction = true,
  mouseStrength = 1,
  mouseRadius = 0.22,
  mouseDampening = 0.15,
  clickPulse = true,
  intro = true,
  lightMode = false,
  transparent = true,
  color,
  opacity = 1,
  paused = false,
  dpr,
  mixBlendMode,
  className = '',
  style,
  ...rest
}: FerrofluidProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    colors: Array.isArray(colors) && colors.length ? colors.slice(0, 3) : ['#ffffff'],
    speed: Math.max(0, speed),
    scale: clamp(scale, 0.2, 6),
    spikeHeight: Math.max(0, spikeHeight),
    sharpness: clamp(sharpness, 0.6, 6),
    turbulence: Math.max(0, turbulence),
    fluidity: clamp(fluidity, 0, 1),
    tilt: clamp(tilt, 10, 70),
    magnetism: Math.max(0, magnetism),
    variation,
    flow: FLOW[flowDirection] ?? FLOW.down,
    brightness: Math.max(0, brightness),
    mouseInteraction,
    mouseStrength: Math.max(0, mouseStrength),
    mouseRadius: clamp(mouseRadius, 0.02, 2),
    mouseDampening: Math.max(0, mouseDampening),
    clickPulse,
    intro,
    lightMode,
    transparent,
    color,
    opacity: clamp(opacity, 0, 1),
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

    const floatTargets = Boolean(gl.getExtension('EXT_color_buffer_float'));
    const sim = link(gl, SIM_FRAGMENT);
    const bounds = link(gl, BOUND_FRAGMENT);
    const render = link(gl, RENDER_FRAGMENT);
    if (!sim || !bounds || !render) return undefined;

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const makeTarget = (width: number, height: number, filter: number): Target => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (floatTargets) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { texture, framebuffer };
    };
    const dropTarget = (target: Target | null) => {
      if (!target) return;
      gl.deleteTexture(target.texture);
      gl.deleteFramebuffer(target.framebuffer);
    };

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const cache = new Map<string, number[]>();
    const parse = (value: string | undefined, fallback: number[]): number[] => {
      if (!value) return fallback;
      const key = String(value);
      const cached = cache.get(key);
      if (cached) return cached;
      let rgb = fallback;
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = key;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r / 255, g / 255, b / 255];
      }
      cache.set(key, rgb);
      return rgb;
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const tanHalf = Math.tan(FOV / 2);
    const view = { width: 1, height: 1, worldHeight: 10, scale: 0, tilt: -1, reach: 1 };
    const camera = { x: 0, y: 0, z: 1, forward: [0, 1, 0], upward: [0, 0, 1], far: 10, distance: 4 };
    const grid = { width: 0, height: 0, originX: 0, originY: 0, boundWidth: 0, boundHeight: 0 };
    let states: Target[] = [];
    let boundTarget: Target | null = null;
    let current = 0;
    let settle = true;

    const pointer = { x: 0, y: 0, inside: false };
    const cursor = { x: 0, y: 0, strength: 0 };
    const pulse = { x: 0, y: 0, age: 10 };
    let wander = 0;
    let presence = settingsRef.current.intro && !reduce ? 0 : 1;
    let shape = shapeOf(settingsRef.current.sharpness);
    let shapeKey = settingsRef.current.sharpness;
    let raf = 0;
    let last = 0;
    let visible = true;

    const castRay = (x: number, y: number): [number, number, number] => {
      const aspect = view.width / view.height;
      const sx = x * aspect * tanHalf;
      const sy = y * tanHalf;
      const [fx, fy, fz] = camera.forward;
      const [, uy, uz] = camera.upward;
      const dx = fx + sx;
      const dy = fy + sy * uy;
      const dz = fz + sy * uz;
      const length = Math.hypot(dx, dy, dz) || 1;
      return [dx / length, dy / length, dz / length];
    };

    const groundAt = (x: number, y: number): [number, number] => {
      const [dx, dy, dz] = castRay(x, y);
      const t = dz < -0.004 ? Math.min(-camera.z / dz, camera.far) : camera.far;
      return [camera.x + dx * t, camera.y + dy * t];
    };

    const layout = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      view.width = canvas.width;
      view.height = canvas.height;
      view.worldHeight = 22 / s.scale;
      view.scale = s.scale;
      view.tilt = s.tilt;
      const pitch = ((90 - s.tilt) * Math.PI) / 180;
      const distance = view.worldHeight / (2 * tanHalf);
      camera.forward = [0, Math.cos(pitch), -Math.sin(pitch)];
      camera.upward = [0, Math.sin(pitch), Math.cos(pitch)];
      camera.x = 0;
      camera.y = -distance * Math.cos(pitch);
      camera.z = distance * Math.sin(pitch);
      camera.far = distance * 2.5;
      camera.distance = distance;
      const corners = [groundAt(-1, -1), groundAt(1, -1), groundAt(-1, 1), groundAt(1, 1), groundAt(0, 1)];
      const xs = corners.map(c => c[0]);
      const ys = corners.map(c => c[1]);
      const minX = Math.min(...xs) - 3;
      const maxX = Math.max(...xs) + 3;
      const minY = Math.min(...ys) - 3;
      const maxY = Math.max(...ys) + 3;
      view.reach = Math.max(...corners.map(c => Math.hypot(c[0], c[1]))) + 4;
      const gridWidth = Math.ceil((maxX - minX) / CELL) + 2;
      const gridHeight = Math.ceil((maxY - minY) / CELL) + 2;
      grid.originX = minX;
      grid.originY = minY;
      if (gridWidth !== grid.width || gridHeight !== grid.height) {
        states.forEach(dropTarget);
        dropTarget(boundTarget);
        states = [makeTarget(gridWidth, gridHeight, gl.LINEAR), makeTarget(gridWidth, gridHeight, gl.LINEAR)];
        grid.width = gridWidth;
        grid.height = gridHeight;
        grid.boundWidth = Math.ceil((gridWidth * CELL) / BOUND_CELL);
        grid.boundHeight = Math.ceil((gridHeight * CELL) / BOUND_CELL);
        boundTarget = makeTarget(grid.boundWidth, grid.boundHeight, gl.NEAREST);
        current = 0;
      }
      settle = true;
    };

    const toWorld = (clientX: number, clientY: number): [number, number] => {
      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const y = 1 - ((clientY - rect.top) / Math.max(1, rect.height)) * 2;
      return groundAt(x, y);
    };

    const step = (dt: number) => {
      const s = settingsRef.current;
      if (s.scale !== view.scale || s.tilt !== view.tilt) layout();
      const motion = s.paused ? 0 : 1;
      wander += dt * motion * (reduce ? 0 : s.speed);
      presence = s.intro && !reduce ? Math.min(1, presence + (dt * motion) / INTRO_SECONDS) : 1;
      pulse.age += dt * motion;

      const engaged = s.mouseInteraction && pointer.inside;
      const follow = s.mouseDampening > 0 ? 1 - Math.exp(-dt / s.mouseDampening) : 1;
      if (engaged) {
        cursor.x += (pointer.x - cursor.x) * follow;
        cursor.y += (pointer.y - cursor.y) * follow;
      }
      const targetStrength = engaged ? s.mouseStrength * 1.4 : 0;
      cursor.strength += (targetStrength - cursor.strength) * (1 - Math.exp(-dt / 0.35));
      if (Math.abs(targetStrength - cursor.strength) < 0.001) cursor.strength = targetStrength;
    };

    const draw = (dt: number) => {
      if (!boundTarget || states.length < 2) return;
      const s = settingsRef.current;
      const worldUnit = view.worldHeight;
      const radius = s.mouseRadius * worldUnit;
      const fullHeight = 1.2 * s.spikeHeight;
      if (s.sharpness !== shapeKey) {
        shapeKey = s.sharpness;
        shape = shapeOf(s.sharpness);
      }
      const reveal = presence * presence * (3 - 2 * presence);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);

      const read = states[current];
      const write = states[1 - current];
      gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
      gl.viewport(0, 0, grid.width, grid.height);
      gl.useProgram(sim.program);
      const su = sim.uniforms;
      gl.bindTexture(gl.TEXTURE_2D, read.texture);
      gl.uniform1i(su.uState, 0);
      gl.uniform2f(su.uGridOrigin, grid.originX, grid.originY);
      gl.uniform1f(su.uCell, CELL);
      gl.uniform1f(su.uDt, Math.max(dt, 0.001));
      gl.uniform1f(su.uTime, wander);
      gl.uniform2f(su.uFlow, s.flow[0], s.flow[1]);
      gl.uniform1f(su.uTurbulence, s.turbulence);
      gl.uniform1f(su.uMagnetism, s.magnetism);
      gl.uniform1f(su.uFieldScale, 5.5);
      gl.uniform2f(su.uSeed, s.variation * 17.31, s.variation * 9.73);
      gl.uniform4f(su.uCursor, cursor.x, cursor.y, cursor.strength, radius);
      gl.uniform4f(su.uPulse, pulse.x, pulse.y, pulse.age, pulse.age < 4 ? 1.1 : 0);
      gl.uniform1f(su.uPulseSpeed, worldUnit * 0.45);
      gl.uniform1f(su.uPulseWidth, 1.4);
      gl.uniform3f(su.uIntro, 0, 0, reveal * (view.reach + 3));
      gl.uniform1f(su.uSpikeHeight, fullHeight);
      gl.uniform1f(su.uMound, 0.6);
      gl.uniform1f(su.uStiffness, 150);
      gl.uniform1f(su.uDamping, 22 - s.fluidity * 15);
      gl.uniform1f(su.uSettle, settle || !floatTargets || reduce ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      settle = false;
      current = 1 - current;

      gl.bindFramebuffer(gl.FRAMEBUFFER, boundTarget.framebuffer);
      gl.viewport(0, 0, grid.boundWidth, grid.boundHeight);
      gl.useProgram(bounds.program);
      const bu = bounds.uniforms;
      gl.bindTexture(gl.TEXTURE_2D, write.texture);
      gl.uniform1i(bu.uState, 0);
      gl.uniform2f(bu.uGridOrigin, grid.originX, grid.originY);
      gl.uniform1f(bu.uCell, CELL);
      gl.uniform2f(bu.uStateSize, grid.width, grid.height);
      gl.uniform1f(bu.uBoundCell, BOUND_CELL);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, view.width, view.height);
      gl.useProgram(render.program);
      const ru = render.uniforms;
      gl.bindTexture(gl.TEXTURE_2D, write.texture);
      gl.uniform1i(ru.uField, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, boundTarget.texture);
      gl.uniform1i(ru.uBound, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform2f(ru.uGridOrigin, grid.originX, grid.originY);
      gl.uniform2f(ru.uGridSpan, grid.width * CELL, grid.height * CELL);
      gl.uniform2f(ru.uBoundSpan, grid.boundWidth * BOUND_CELL, grid.boundHeight * BOUND_CELL);
      gl.uniform1f(ru.uCellSize, CELL);
      gl.uniform2f(ru.uResolution, view.width, view.height);
      gl.uniform3f(ru.uCamera, camera.x, camera.y, camera.z);
      gl.uniform3fv(ru.uForward, camera.forward);
      gl.uniform3fv(ru.uUpward, camera.upward);
      gl.uniform1f(ru.uTanHalf, tanHalf);
      gl.uniform1f(ru.uPixelAngle, (2 * tanHalf) / view.height);
      gl.uniform1f(ru.uFar, camera.far);
      gl.uniform1f(ru.uFogStart, camera.distance * 0.95);
      gl.uniform1f(ru.uTop, fullHeight * 1.6 + 0.6 * 3 + 0.1);
      gl.uniform1f(ru.uBottom, -0.05);
      gl.uniform1f(ru.uTime, wander * 2);
      gl.uniform4f(ru.uCursor, cursor.x, cursor.y, cursor.strength, radius);
      gl.uniform1f(ru.uMound, 0.6);
      gl.uniform1f(ru.uRound, shape.round);
      gl.uniform1f(ru.uSpan, shape.span);
      gl.uniform1f(ru.uExponent, shape.exponent);
      gl.uniform1f(ru.uWarp, 0.06 * s.turbulence);
      const lights = s.colors.map(value => parse(value, [1, 1, 1]));
      const key = lights[0];
      const strip = lights[1] ?? key;
      const fill = lights[2] ?? strip;
      gl.uniform3fv(ru.uKey, key);
      gl.uniform3fv(ru.uStrip, strip);
      gl.uniform3fv(ru.uFill, fill);
      gl.uniform1f(ru.uExposure, 3 * s.brightness);
      gl.uniform1f(ru.uLight, s.lightMode ? 1 : 0);
      gl.uniform1f(ru.uOpaque, s.transparent ? 0 : 1);
      gl.uniform3fv(ru.uBase, parse(s.color, s.lightMode ? [1, 1, 1] : [0.0706, 0.0588, 0.0902]));
      gl.uniform1f(ru.uOpacity, s.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
      last = now;
      step(dt);
      draw(dt);
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      layout();
      draw(0);
      wake();
    };

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      [pointer.x, pointer.y] = toWorld(event.clientX, event.clientY);
    };

    const onPointerMove = (event: PointerEvent) => {
      const wasInside = pointer.inside;
      locate(event);
      if (pointer.inside && !wasInside && cursor.strength < 0.05) {
        cursor.x = pointer.x;
        cursor.y = pointer.y;
      }
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      onPointerMove(event);
      if (!pointer.inside || !settingsRef.current.clickPulse || reduce) return;
      pulse.x = pointer.x;
      pulse.y = pointer.y;
      pulse.age = 0;
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

    let lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.dpr !== lastDpr) {
        lastDpr = s.dpr;
        resize();
        return;
      }
      wake();
    };

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      states.forEach(dropTarget);
      dropTarget(boundTarget);
      gl.deleteProgram(sim.program);
      gl.deleteProgram(bounds.program);
      gl.deleteProgram(render.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
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
      style={mixBlendMode ? { ...style, mixBlendMode } : style}
      {...rest}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
};

export default Ferrofluid;
