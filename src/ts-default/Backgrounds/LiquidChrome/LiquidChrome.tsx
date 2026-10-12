'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './LiquidChrome.css';

export interface LiquidChromeProps {
  color?: string | number[];
  speed?: number;
  amplitude?: number;
  frequencyX?: number;
  frequencyY?: number;
  detail?: number;
  thickness?: number;
  depth?: number;
  roughness?: number;
  exposure?: number;
  interactive?: boolean;
  rippleStrength?: number;
  rippleSize?: number;
  tilt?: number;
  intro?: boolean;
  lightMode?: boolean;
  maxDevicePixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  tint: number[];
  speed: number;
  amplitude: number;
  frequency: number[];
  detail: number;
  thickness: number;
  depth: number;
  roughness: number;
  exposure: number;
  interactive: boolean;
  rippleStrength: number;
  rippleSize: number;
  tilt: number;
  intro: boolean;
  light: boolean;
  maxRatio: number;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Target {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
}

interface Stroke {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  strength: number;
  radius: number;
}

const PIXEL_BUDGET = 2.4e6;
const SIM_CELL = 4;
const SIM_STEP = 1 / 120;

const VERTEX = `#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`;

const SIM = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSize;
uniform vec4 uStroke;
uniform vec2 uImpulse;
out vec4 fragColor;

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  return length(p - a - ab * t);
}

void main() {
  vec2 texel = 1.0 / uSize;
  vec2 uv = gl_FragCoord.xy * texel;
  vec2 state = texture(uState, uv).rg;
  vec2 around =
    texture(uState, uv - vec2(texel.x, 0.0)).rg +
    texture(uState, uv + vec2(texel.x, 0.0)).rg +
    texture(uState, uv - vec2(0.0, texel.y)).rg +
    texture(uState, uv + vec2(0.0, texel.y)).rg -
    4.0 * state;
  float next = state.r + (state.r - state.g) * 0.982 + 0.3 * around.r + 0.08 * (around.r - around.g);
  next *= 0.998;
  if (uImpulse.x != 0.0) {
    float d = segment(gl_FragCoord.xy, uStroke.xy, uStroke.zw) / uImpulse.y;
    next += uImpulse.x * exp(-d * d);
  }
  fragColor = vec4(next, state.r, 0.0, 1.0);
}`;

const SLOPE = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSize;
out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / uSize;
  vec2 uv = gl_FragCoord.xy * texel;
  float left = texture(uState, uv - vec2(texel.x, 0.0)).r;
  float right = texture(uState, uv + vec2(texel.x, 0.0)).r;
  float down = texture(uState, uv - vec2(0.0, texel.y)).r;
  float up = texture(uState, uv + vec2(0.0, texel.y)).r;
  fragColor = vec4((right - left) * 0.5, (up - down) * 0.5, 0.0, 1.0);
}`;

const CHROME = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uUnit;
uniform float uTime;
uniform float uAmplitude;
uniform vec2 uFrequency;
uniform float uDetail;
uniform float uSharpness;
uniform float uDepth;
uniform float uPresence;
uniform vec3 uTint;
uniform vec2 uShift;
uniform float uRoughness;
uniform float uExposure;
uniform float uLight;
uniform sampler2D uSlope;
uniform vec2 uSlopeSize;
uniform float uRipple;
out vec4 fragColor;

vec2 slopeAt(vec2 uv) {
  vec2 st = uv * uSlopeSize - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (-f3 + 3.0 * f2 - 3.0 * f + 1.0) / 6.0;
  vec2 w1 = (3.0 * f3 - 6.0 * f2 + 4.0) / 6.0;
  vec2 w2 = (-3.0 * f3 + 3.0 * f2 + 3.0 * f + 1.0) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = (i - 0.5 + w1 / g0) / uSlopeSize;
  vec2 h1 = (i + 1.5 + w3 / g1) / uSlopeSize;
  vec2 a = texture(uSlope, vec2(h0.x, h0.y)).rg;
  vec2 b = texture(uSlope, vec2(h1.x, h0.y)).rg;
  vec2 c = texture(uSlope, vec2(h0.x, h1.y)).rg;
  vec2 d = texture(uSlope, vec2(h1.x, h1.y)).rg;
  return g0.y * (g0.x * a + g1.x * b) + g1.y * (g0.x * c + g1.x * d);
}

float lamp(vec2 p, vec2 center, vec2 size, float soft) {
  vec2 grown = size + soft;
  vec2 q = (p - center) / grown;
  q *= q;
  float d = sqrt(sqrt(dot(q, q)));
  float edge = soft / min(grown.x, grown.y);
  float shape = (1.0 - smoothstep(1.0 - edge, 1.0 + edge, d)) * (1.0 - 0.45 * d * d);
  return shape * size.x * size.y / (grown.x * grown.y);
}

vec3 studio(vec3 r, float blur) {
  vec2 p = r.xy / max(r.z + 1.0, 0.05);
  p += uShift * smoothstep(0.3, 1.0, length(p));
  float radius = length(p);
  float soft = 0.008 + blur;
  vec2 dir = p / max(radius, 1e-3);
  float key = lamp(p, vec2(-0.25, 0.42), vec2(0.3, 0.12), soft);
  float side = lamp(p, vec2(0.48, 0.12), vec2(0.06, 0.3), soft);
  float ground = lamp(p, vec2(-0.1, -0.55), vec2(0.45, 0.06), soft);
  float rise = smoothstep(-1.0, 1.0, dir.y);
  if (uLight > 0.5) {
    float edge = 0.008 + blur * 0.8;
    float lobe = smoothstep(0.15, 0.85, 0.5 + 0.5 * sin(atan(dir.y, dir.x) * 2.0 + 0.9));
    float tone = mix(2.4, 0.95, smoothstep(0.5 - edge, 1.0 + edge, radius));
    tone = mix(tone, 0.02, smoothstep(0.98 - edge, 1.12 + edge, radius));
    tone = mix(tone, mix(0.03, 0.3, lobe) * (0.8 + 0.4 * rise), smoothstep(1.15 - edge, 1.3 + edge, radius));
    float width = 0.035 + edge;
    tone += 2.4 * exp(-pow((radius - 1.4) / width, 2.0)) * min(1.0, 0.06 / width) * (0.6 + 0.4 * rise);
    return vec3(tone) * (1.0 - 0.5 * side) * (1.0 - 0.3 * ground) + 0.8 * key;
  }
  float width = 0.015 + soft * 2.0;
  float rim = exp(-abs(radius - 1.0) / width) * 0.031 / width * (0.8 + smoothstep(-0.5, 0.8, p.y));
  float band = 1.0 - 0.95 * smoothstep(1.04 - soft, 1.12 + soft, radius);
  float wall = smoothstep(1.25, 1.55, radius) * (0.6 + 0.4 * rise);
  float streak = smoothstep(0.2, 0.8, 0.5 + 0.5 * sin(atan(dir.y, dir.x) * 3.0 + 0.6));
  vec3 color = vec3(0.004, 0.004, 0.005) + 0.02 * smoothstep(-0.4, 0.6, p.y);
  color += vec3(1.0, 0.97, 0.94) * key * 4.0 + vec3(0.9, 0.95, 1.0) * side * 3.0 + ground * 1.2;
  color += vec3(1.0, 0.98, 0.95) * rim;
  color *= band;
  return color + vec3(mix(0.45, 1.8, streak)) * wall;
}

vec3 shade(vec2 slope, vec3 v, float blur, vec3 f0) {
  float steep = length(slope);
  slope *= 3.0 * tanh(steep / 3.0) / max(steep, 1e-6);
  vec3 n = normalize(vec3(-slope, 1.0));
  vec3 r = reflect(v, n);
  float facing = clamp(dot(n, -v), 0.0, 1.0);
  return studio(r, blur) * (f0 + (1.0 - f0) * pow(1.0 - facing, 5.0));
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (2.0 * frag - uResolution) / uUnit;
  vec2 p = uv;
  vec2 rowX = vec2(1.0, 0.0);
  vec2 rowY = vec2(0.0, 1.0);
  float amplitude = uAmplitude * uPresence;
  for (float i = 1.0; i < 9.0; i++) {
    if (i > uDetail) break;
    float a = amplitude / i;
    float soften = exp(0.3 - 0.3 * i);
    float argX = i * uFrequency.x * p.y + uTime;
    p.x += a * cos(argX);
    rowX -= a * sin(argX) * i * uFrequency.x * soften * rowY;
    float argY = i * uFrequency.y * p.x + uTime;
    p.y += a * cos(argY);
    rowY -= a * sin(argY) * i * uFrequency.y * soften * rowX;
  }
  float phase = uTime - p.x - p.y;
  vec2 field = -(rowX + rowY);
  float density = max(length(field), 1e-3);
  vec2 across = field / density;
  float k = uSharpness;
  float sn = sin(phase);
  float cs = cos(phase);
  float th = tanh(k * sn);
  float bevel = (1.0 - th * th) / tanh(k);
  float fade = smoothstep(3.0, 9.0, 3.14159 * uUnit / density);
  float weight = uDepth * uPresence * fade;
  vec2 slope = k * cs * bevel * weight * across + slopeAt(frag / uResolution) * uRipple;
  vec2 sweep = -k * bevel * (sn + 2.0 * k * cs * cs * th) * weight * density * 2.0 / uUnit * across;
  vec2 stepX = dFdx(slope);
  vec2 stepY = dFdy(slope);
  vec2 crease = dot(stepX, stepX) > dot(stepY, stepY) ? stepX : stepY;
  if (dot(crease, crease) > dot(sweep, sweep)) sweep = crease;
  float bend = length(sweep);
  float alpha = smoothstep(0.0, 0.1, length(slope));
  vec3 f0 = mix(vec3(1.0), uTint, smoothstep(0.05, 0.6, length(slope))) * 0.92;
  vec3 v = normalize(vec3(uv * 0.08, -1.0));
  float blur = uRoughness * 0.35;
  vec3 light;
  if (bend < 0.01) {
    light = shade(slope, v, blur + bend * 0.5, f0);
  } else {
    light = vec3(0.0);
    for (float t = -0.375; t < 0.4; t += 0.25) {
      light += shade(slope + sweep * t, v, blur + bend * 0.15, f0);
    }
    light *= 0.25;
  }
  vec3 color = pow(aces(light * uExposure), vec3(1.0 / 2.2));
  float grain = fract(52.9829189 * fract(dot(frag, vec2(0.06711056, 0.00583715))));
  color += (grain - 0.5) / 255.0;
  fragColor = vec4(clamp(color, 0.0, 1.0) * alpha, alpha);
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseColor = (value: string | number[]): number[] => {
  if (Array.isArray(value)) return [0, 1, 2].map(index => clamp(Number(value[index]) || 0, 0, 1));
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) / 255);
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) return [rgb[1], rgb[2], rgb[3]].map(channel => clamp(parseFloat(channel) / 255, 0, 1));
  return [1, 1, 1];
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
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Program['uniforms'] = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const LiquidChrome = ({
  color = '#ffffff',
  speed = 0.2,
  amplitude = 0.3,
  frequencyX = 3,
  frequencyY = 3,
  detail = 4,
  thickness = 1,
  depth = 1,
  roughness = 0.3,
  exposure = 1,
  interactive = true,
  rippleStrength = 1,
  rippleSize = 1,
  tilt = 1,
  intro = true,
  lightMode = false,
  maxDevicePixelRatio = 2,
  className = '',
  style
}: LiquidChromeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const [generation, setGeneration] = useState(0);

  const settings: Settings = {
    tint: parseColor(color).map(channel => Math.pow(channel, 2.2)),
    speed: Math.max(0, speed),
    amplitude: clamp(amplitude, 0, 2),
    frequency: [Math.max(0.1, frequencyX), Math.max(0.1, frequencyY)],
    detail: clamp(Math.round(detail), 1, 8),
    thickness: clamp(thickness, 0.25, 4),
    depth: Math.max(0, depth),
    roughness: clamp(roughness, 0, 1),
    exposure: Math.max(0, exposure),
    interactive,
    rippleStrength: Math.max(0, rippleStrength),
    rippleSize: clamp(rippleSize, 0.2, 4),
    tilt: Math.max(0, tilt),
    intro,
    light: lightMode,
    maxRatio: clamp(maxDevicePixelRatio, 0.5, 3)
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    wakeRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
    const chrome = gl ? link(gl, CHROME) : null;
    if (!gl || !chrome) return;
    const fluid = Boolean(gl.getExtension('EXT_color_buffer_float'));
    const sim = fluid ? link(gl, SIM) : null;
    const slope = fluid ? link(gl, SLOPE) : null;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vao = gl.createVertexArray();
    const grid = { width: 1, height: 1 };
    const targets: Target[] = [];
    let slopeTarget: Target | null = null;
    let current = 0;
    let unit = 1;
    const pointer = { x: 0, y: 0, inside: false, ready: false, nx: 0, ny: 0 };
    const view = { yaw: 0, pitch: 0, vyaw: 0, vpitch: 0 };
    const strokes: Stroke[] = [];
    let time = Math.random() * 40;
    let presence = settingsRef.current.intro && !reduced && generation === 0 ? 0 : 1;
    let energy = 0;
    let accumulator = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let pageVisible = document.visibilityState !== 'hidden';
    let lost = false;

    const makeTarget = (width: number, height: number): Target => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, width, height, 0, gl.RG, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { texture, framebuffer };
    };

    const dropTarget = (target: Target | null) => {
      if (!target) return;
      gl.deleteTexture(target.texture);
      gl.deleteFramebuffer(target.framebuffer);
    };

    const resize = () => {
      const s = settingsRef.current;
      const rect = container.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width);
      const cssHeight = Math.max(1, rect.height);
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        s.maxRatio,
        Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight))
      );
      const width = Math.max(1, Math.round(cssWidth * ratio));
      const height = Math.max(1, Math.round(cssHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      unit = Math.min(width, height);
      if (!fluid || !sim || !slope) return;
      const gridWidth = clamp(Math.round(cssWidth / SIM_CELL), 16, 512);
      const gridHeight = clamp(Math.round(cssHeight / SIM_CELL), 16, 512);
      if (gridWidth === grid.width && gridHeight === grid.height && targets.length) return;
      targets.forEach(dropTarget);
      targets.length = 0;
      dropTarget(slopeTarget);
      Object.assign(grid, { width: gridWidth, height: gridHeight });
      targets.push(makeTarget(gridWidth, gridHeight), makeTarget(gridWidth, gridHeight));
      slopeTarget = makeTarget(gridWidth, gridHeight);
    };

    const simulate = (steps: number) => {
      if (!sim || !slope || !slopeTarget) return;
      gl.useProgram(sim.program);
      gl.viewport(0, 0, grid.width, grid.height);
      gl.uniform2f(sim.uniforms.uSize, grid.width, grid.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(sim.uniforms.uState, 0);
      for (let step = 0; step < steps; step++) {
        const stroke = step === 0 ? strokes.shift() : null;
        if (stroke) {
          gl.uniform4f(sim.uniforms.uStroke, stroke.ax, stroke.ay, stroke.bx, stroke.by);
          gl.uniform2f(sim.uniforms.uImpulse, stroke.strength, stroke.radius);
        } else {
          gl.uniform2f(sim.uniforms.uImpulse, 0, 1);
        }
        const source = targets[current];
        const destination = targets[1 - current];
        gl.bindTexture(gl.TEXTURE_2D, source.texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        current = 1 - current;
      }
      gl.useProgram(slope.program);
      gl.uniform2f(slope.uniforms.uSize, grid.width, grid.height);
      gl.uniform1i(slope.uniforms.uState, 0);
      gl.bindTexture(gl.TEXTURE_2D, targets[current].texture);
      gl.bindFramebuffer(gl.FRAMEBUFFER, slopeTarget.framebuffer);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const render = (s: Settings) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const u = chrome.uniforms;
      gl.useProgram(chrome.program);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform1f(u.uUnit, unit);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uAmplitude, s.amplitude);
      gl.uniform2f(u.uFrequency, s.frequency[0], s.frequency[1]);
      gl.uniform1f(u.uDepth, s.depth);
      gl.uniform1f(u.uDetail, s.detail);
      gl.uniform1f(u.uSharpness, 5 / (3 * s.thickness));
      gl.uniform1f(u.uPresence, 1 - Math.pow(1 - presence, 3));
      gl.uniform3fv(u.uTint, s.tint);
      gl.uniform2f(u.uShift, view.yaw, view.pitch);
      gl.uniform1f(u.uRoughness, s.roughness);
      gl.uniform1f(u.uExposure, s.exposure);
      gl.uniform1f(u.uLight, s.light ? 1 : 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, slopeTarget ? slopeTarget.texture : null);
      gl.uniform1i(u.uSlope, 0);
      gl.uniform2f(u.uSlopeSize, grid.width, grid.height);
      gl.uniform1f(u.uRipple, slopeTarget ? s.rippleStrength * 2.2 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = 0;
      if (lost) return;
      const s = settingsRef.current;
      const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
      last = Math.max(last, now);
      time += dt * s.speed * (reduced ? 0.25 : 1);
      presence = Math.min(1, presence + dt / 1.8);

      const hovering = s.interactive && pointer.inside;
      const reach = reduced ? 0 : s.tilt;
      const targetYaw = (hovering ? pointer.nx * 0.35 : 0.22 * Math.sin(time * 1.3)) * reach;
      const targetPitch = (hovering ? -pointer.ny * 0.28 : 0.16 * Math.sin(time * 0.9 + 1.7)) * reach;
      const stiffness = 36;
      const damping = 2 * Math.sqrt(stiffness) * 0.95;
      view.vyaw += ((targetYaw - view.yaw) * stiffness - view.vyaw * damping) * dt;
      view.vpitch += ((targetPitch - view.pitch) * stiffness - view.vpitch * damping) * dt;
      view.yaw += view.vyaw * dt;
      view.pitch += view.vpitch * dt;

      gl.bindVertexArray(vao);
      if (slopeTarget) {
        accumulator += dt;
        const steps = Math.min(4, Math.floor(accumulator / SIM_STEP));
        accumulator -= steps * SIM_STEP;
        if (steps > 0) {
          simulate(steps);
          energy = Math.max(0, energy * Math.pow(0.982, steps));
        }
      }
      render(s);

      const settling =
        Math.abs(view.vyaw) + Math.abs(view.vpitch) > 1e-4 ||
        Math.abs(targetYaw - view.yaw) + Math.abs(targetPitch - view.pitch) > 1e-4;
      const busy = s.speed > 0 || presence < 1 || settling || energy > 0.002 || strokes.length > 0;
      if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || lost || !visible || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = () => {
      resize();
      wake();
    };

    const toGrid = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * grid.width,
        y: (1 - (clientY - rect.top) / rect.height) * grid.height,
        nx: ((clientX - rect.left) / rect.width) * 2 - 1,
        ny: ((clientY - rect.top) / rect.height) * 2 - 1,
        inside: clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
      };
    };

    const push = (stroke: Stroke, s: Settings) => {
      if (!slopeTarget || !s.interactive || reduced) return;
      strokes.push(stroke);
      if (strokes.length > 6) strokes.shift();
      energy = 1;
    };

    const onPointerMove = (event: PointerEvent) => {
      const s = settingsRef.current;
      const spot = toGrid(event.clientX, event.clientY);
      pointer.nx = clamp(spot.nx, -1, 1);
      pointer.ny = clamp(spot.ny, -1, 1);
      pointer.inside = spot.inside;
      if (spot.inside && pointer.ready) {
        const travel = Math.hypot(spot.x - pointer.x, spot.y - pointer.y);
        if (travel > 0.25) {
          push(
            {
              ax: pointer.x,
              ay: pointer.y,
              bx: spot.x,
              by: spot.y,
              strength: -Math.min(0.45, 0.04 + travel * 0.045) * s.rippleSize,
              radius: 4 * s.rippleSize
            },
            s
          );
        }
      }
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.ready = spot.inside;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      const spot = toGrid(event.clientX, event.clientY);
      if (!spot.inside) return;
      push(
        { ax: spot.x, ay: spot.y, bx: spot.x, by: spot.y, strength: -1.6 * s.rippleSize, radius: 6 * s.rippleSize },
        s
      );
      wake();
    };

    const onLeave = () => {
      pointer.inside = false;
      pointer.ready = false;
      wake();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') onLeave();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
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
      resize();
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
    wake();

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        targets.forEach(dropTarget);
        dropTarget(slopeTarget);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(chrome.program);
        if (sim) gl.deleteProgram(sim.program);
        if (slope) gl.deleteProgram(slope.program);
      }
    };
  }, [generation]);

  return (
    <div ref={containerRef} className={`liquid-chrome${className ? ` ${className}` : ''}`} style={style}>
      <canvas ref={canvasRef} className="liquid-chrome__canvas" aria-hidden="true" />
    </div>
  );
};

export default LiquidChrome;
