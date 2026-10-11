'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

export interface LightPillarProps {
  topColor?: string;
  bottomColor?: string;
  intensity?: number;
  rotationSpeed?: number;
  flow?: number;
  interactive?: boolean;
  clickPulse?: boolean;
  glowAmount?: number;
  bloom?: number;
  pillarWidth?: number;
  pillarHeight?: number;
  pillarRotation?: number;
  twist?: number;
  detail?: number;
  noiseIntensity?: number;
  fade?: number;
  intro?: boolean;
  mixBlendMode?: CSSProperties['mixBlendMode'];
  quality?: 'low' | 'medium' | 'high';
  resolution?: number;
  lightMode?: boolean;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  topColor: string;
  bottomColor: string;
  intensity: number;
  rotationSpeed: number;
  flow: number;
  interactive: boolean;
  clickPulse: boolean;
  glowAmount: number;
  bloom: number;
  pillarWidth: number;
  pillarHeight: number;
  pillarRotation: number;
  twist: number;
  detail: number;
  noiseIntensity: number;
  fade: number;
  intro: boolean;
  scale: number;
  lightMode: boolean;
  paused: boolean;
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

interface Program {
  program: WebGLProgram;
  uniforms: Uniforms;
}

interface Pulse {
  axis: number;
  age: number;
}

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const MARCH = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uTarget;
uniform vec2 uRot;
uniform vec2 uPillarRot;
uniform vec2 uWave;
uniform float uShift;
uniform float uPillarWidth;
uniform float uPillarHeight;
uniform int uDetail;
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform float uGlowAmount;
uniform float uWidthNorm;
out vec4 outColor;

void main() {
  vec2 vUv = gl_FragCoord.xy / uTarget;
  vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
  uv.x -= uShift;
  uv = vec2(uPillarRot.x * uv.x - uPillarRot.y * uv.y, uPillarRot.y * uv.x + uPillarRot.x * uv.y);

  vec3 ro = vec3(0.0, 0.0, -10.0);
  vec3 rd = normalize(vec3(uv, 1.0));
  vec3 origin = vec3(uRot.x * ro.x - uRot.y * ro.z, ro.y, uRot.y * ro.x + uRot.x * ro.z);
  vec3 dir = vec3(uRot.x * rd.x - uRot.y * rd.z, rd.y, uRot.y * rd.x + uRot.x * rd.z);

  float glow = 0.0;
  float lift = 0.0;
  float t = 0.1;
  for (int i = 0; i < 80; i++) {
    vec3 p = origin + dir * t;
    vec3 q = p;
    q.y = p.y * uPillarHeight + uTime;

    float freq = 1.0;
    float amp = 1.0;
    for (int j = 0; j < 6; j++) {
      if (j >= uDetail) break;
      q.xz = vec2(uWave.y * q.x - uWave.x * q.z, uWave.x * q.x + uWave.y * q.z);
      q += cos(q.zxy * freq - uTime * float(j) * 2.0) * amp;
      freq *= 2.0;
      amp *= 0.5;
    }

    float d = length(cos(q.xz)) - 0.2;
    float bound = length(p.xz) - uPillarWidth;
    float h = max(4.0 - abs(d - bound), 0.0);
    d = max(d, bound) + h * h * 0.015625;
    d = abs(d) * 0.15 + 0.01;

    float weight = 1.0 / d;
    glow += weight;
    lift += clamp((15.0 - p.y) / 30.0, 0.0, 1.0) * weight;

    t += d;
    if (t > 50.0) break;
  }

  vec3 col = tanh((uBottomColor * glow + (uTopColor - uBottomColor) * lift) * uGlowAmount / uWidthNorm);
  float peak = max(col.r, max(col.g, col.b));
  outColor = vec4(col, smoothstep(0.62, 1.0, peak));
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform vec2 uFieldSize;
uniform vec2 uView;
uniform vec2 uAspect;
uniform vec2 uPillarRot;
uniform float uShift;
uniform float uIntensity;
uniform float uNoiseIntensity;
uniform float uLightMode;
uniform float uNeutral;
uniform float uBloom;
uniform float uFade;
uniform float uReveal;
uniform float uFlare;
uniform vec4 uPulses[3];
out vec4 outColor;

vec3 tap(vec2 uv) {
  return textureLod(uField, uv, 0.0).rgb;
}

vec3 bicubic(vec2 uv) {
  vec2 position = uv * uFieldSize;
  vec2 center = floor(position - 0.5) + 0.5;
  vec2 f = position - center;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 t0 = (center - 1.0) / uFieldSize;
  vec2 t3 = (center + 2.0) / uFieldSize;
  vec2 t12 = (center + w2 / w12) / uFieldSize;
  vec3 result = vec3(0.0);
  result += tap(vec2(t0.x, t0.y)) * w0.x * w0.y;
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
  vec3 col = bicubic(uv);

  if (uBloom > 0.0) {
    vec4 l3 = textureLod(uField, uv, 3.0);
    vec4 l4 = textureLod(uField, uv, 4.0);
    vec4 l5 = textureLod(uField, uv, 5.0);
    vec4 l6 = textureLod(uField, uv, 6.0);
    float halo = l3.a * 0.3 + l4.a * 0.3 + l5.a * 0.25 + l6.a * 0.15;
    vec3 tint = l4.rgb + l5.rgb;
    tint /= max(max(tint.r, max(tint.g, tint.b)), 0.001);
    vec3 glow = clamp(tint * halo * uBloom * 1.1, 0.0, 1.0);
    col = 1.0 - (1.0 - clamp(col, 0.0, 1.0)) * (1.0 - glow);
  }

  vec2 p = (uv * 2.0 - 1.0) * uAspect;
  p.x -= uShift;
  float axis = uPillarRot.y * p.x + uPillarRot.x * p.y;

  float boost = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 pulse = uPulses[i];
    if (pulse.y <= 0.0) continue;
    float offset = (axis - pulse.x) / 0.24;
    boost += exp(-offset * offset) * pulse.y;
  }
  float head = (axis - uReveal + 0.35) / 0.3;
  boost += exp(-head * head) * uFlare;
  float lum = max(col.r, max(col.g, col.b));
  col += mix(col, vec3(lum), 0.45) * boost * 1.8;

  col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;
  vec3 result = clamp(col * uIntensity, 0.0, 1.0);

  float mask = smoothstep(uReveal, uReveal - 0.9, axis);
  float edge = uFade * 0.5;
  if (edge > 0.0) {
    mask *= smootherstep01(uv.x / edge) * smootherstep01((1.0 - uv.x) / edge);
    mask *= smootherstep01(uv.y / edge) * smootherstep01((1.0 - uv.y) / edge);
  }

  if (uLightMode > 0.5) {
    float energy = max(result.r, max(result.g, result.b));
    vec3 hue = result / max(energy, 0.001);
    float coverage = smoothstep(0.025, 0.95, energy);
    hue = pow(clamp(hue, 0.0, 1.0), vec3(1.25));
    vec3 tinted = mix(vec3(1.0), hue, coverage * 0.94 * mask);
    vec3 ink = vec3(1.0) - pow(result, vec3(1.6)) * 0.85 * mask;
    result = mix(tinted, ink, uNeutral);
  } else {
    result *= mask;
  }
  outColor = vec4(result, 1.0);
}`;

const QUALITY: Record<string, number> = { low: 0.35, medium: 0.5, high: 0.6 };
const INTRO_SECONDS = 2.1;
const PULSE_LIFE = 1.4;
const MIN_SCALE = 0.25;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

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

const LightPillar = ({
  topColor = '#5227FF',
  bottomColor = '#FF9FFC',
  intensity = 1.0,
  rotationSpeed = 0.3,
  flow = 1,
  interactive = true,
  clickPulse = true,
  glowAmount = 0.002,
  bloom = 0.5,
  pillarWidth = 3.0,
  pillarHeight = 0.4,
  pillarRotation = 25,
  twist = 0.4,
  detail = 4,
  noiseIntensity = 0.5,
  fade = 0,
  intro = true,
  mixBlendMode = 'screen',
  quality = 'high',
  resolution,
  lightMode = false,
  paused = false,
  className = '',
  style
}: LightPillarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef<Settings>(null as unknown as Settings);
  const [generation, setGeneration] = useState(0);
  settingsRef.current = {
    topColor: String(topColor),
    bottomColor: String(bottomColor),
    intensity: Math.max(0, intensity),
    rotationSpeed,
    flow,
    interactive,
    clickPulse,
    glowAmount: Math.max(0, glowAmount),
    bloom: Math.max(0, bloom),
    pillarWidth: Math.max(0.05, pillarWidth),
    pillarHeight,
    pillarRotation,
    twist,
    detail: Math.round(clamp(detail, 1, 6)),
    noiseIntensity: Math.max(0, noiseIntensity),
    fade: clamp(fade, 0, 1),
    intro,
    scale: clamp(resolution ?? QUALITY[quality] ?? QUALITY.high, MIN_SCALE, 2),
    lightMode,
    paused
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
    const marchProgram = link(gl, MARCH);
    const compositeProgram = link(gl, COMPOSITE);
    if (!marchProgram || !compositeProgram) return undefined;

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

    let texture: WebGLTexture | null = null;
    const framebuffer = gl.createFramebuffer();
    const target = { width: 0, height: 0 };
    const sizeTarget = (width: number, height: number) => {
      if (target.width === width && target.height === height) return;
      target.width = width;
      target.height = height;
      if (texture) gl.deleteTexture(texture);
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;
      gl.texStorage2D(gl.TEXTURE_2D, levels, floatTargets ? gl.RGBA16F : gl.RGBA8, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    };

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const colorCache = new Map<string, number[]>();
    const toRgb = (value: string): number[] => {
      if (colorCache.has(value)) return colorCache.get(value) as number[];
      let rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#ffffff';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r / 255, g / 255, b / 255];
      }
      colorCache.set(value, rgb);
      return rgb;
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const view = { width: 1, height: 1, ratio: 1 };
    const pointer = { x: 0, y: 0, inside: false };
    const pulses: Pulse[] = [];
    const pulseData = new Float32Array(12);
    const state = {
      clock: 0,
      intro: settingsRef.current.intro && !reduce ? 0 : 1,
      touch: 0,
      spin: 0,
      lean: 0,
      shift: 0,
      governor: 1,
      slow: 0,
      quick: 0
    };
    let raf = 0;
    let last = 0;
    let visible = true;

    const axisAt = (x: number, y: number, angle: number) => {
      const aspect = view.width / view.height;
      const px = ((x / view.width) * 2 - 1) * aspect - state.shift;
      const py = 1 - (y / view.height) * 2;
      return Math.sin(angle) * px + Math.cos(angle) * py;
    };

    const render = () => {
      const s = settingsRef.current;
      const scale = Math.max(MIN_SCALE, s.scale * state.governor);
      const fieldWidth = Math.max(1, Math.round(view.width * scale));
      const fieldHeight = Math.max(1, Math.round(view.height * scale));
      sizeTarget(fieldWidth, fieldHeight);

      const grow = ease(state.intro);
      const rise = easeOut(state.intro);
      const tilt = ((s.pillarRotation + state.lean) * Math.PI) / 180;
      const angle = state.clock * 0.3 + state.spin;
      const width = s.pillarWidth * (0.3 + 0.7 * grow);

      gl.bindVertexArray(vao);
      const m = marchProgram.uniforms;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, target.width, target.height);
      gl.useProgram(marchProgram.program);
      gl.uniform1f(m.uTime, state.clock * s.flow);
      gl.uniform2f(m.uResolution, view.width, view.height);
      gl.uniform2f(m.uTarget, target.width, target.height);
      gl.uniform2f(m.uRot, Math.cos(angle), Math.sin(angle));
      gl.uniform2f(m.uPillarRot, Math.cos(tilt), Math.sin(tilt));
      gl.uniform2f(m.uWave, Math.sin(s.twist), Math.cos(s.twist));
      gl.uniform1f(m.uShift, state.shift);
      gl.uniform1f(m.uPillarWidth, width);
      gl.uniform1f(m.uPillarHeight, s.pillarHeight);
      gl.uniform1i(m.uDetail, s.detail);
      gl.uniform3fv(m.uTopColor, toRgb(s.topColor));
      gl.uniform3fv(m.uBottomColor, toRgb(s.bottomColor));
      gl.uniform1f(m.uGlowAmount, s.glowAmount);
      gl.uniform1f(m.uWidthNorm, width / 3);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (s.bloom > 0) gl.generateMipmap(gl.TEXTURE_2D);

      pulseData.fill(0);
      pulses.forEach((pulse, index) => {
        pulseData.set([pulse.axis + pulse.age * 1.7, Math.exp(-pulse.age / (PULSE_LIFE * 0.45)), 0, 0], index * 4);
      });

      const c = compositeProgram.uniforms;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(compositeProgram.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(c.uField, 0);
      gl.uniform2f(c.uFieldSize, target.width, target.height);
      gl.uniform2f(c.uView, canvas.width, canvas.height);
      gl.uniform2f(c.uAspect, view.width / view.height, 1);
      gl.uniform2f(c.uPillarRot, Math.cos(tilt), Math.sin(tilt));
      gl.uniform1f(c.uShift, state.shift);
      gl.uniform1f(c.uIntensity, s.intensity * (0.15 + 0.85 * rise) * (1 + 0.12 * state.touch));
      gl.uniform1f(c.uNoiseIntensity, s.noiseIntensity);
      gl.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
      const chroma = (rgb: number[]) => Math.max(...rgb) - Math.min(...rgb);
      const vivid = Math.max(chroma(toRgb(s.topColor)), chroma(toRgb(s.bottomColor)));
      gl.uniform1f(c.uNeutral, 1 - clamp((vivid - 0.08) / 0.12, 0, 1));
      gl.uniform1f(c.uBloom, s.bloom);
      gl.uniform1f(c.uFade, s.fade);
      const span = view.width / view.height + 1.2;
      gl.uniform1f(c.uReveal, state.intro >= 1 ? 1e4 : -span + rise * (span * 2 + 1.2));
      gl.uniform1f(c.uFlare, state.intro >= 1 ? 0 : (1 - rise) * 1.3 * Math.min(1, state.intro * 8));
      gl.uniform4fv(c.uPulses, pulseData);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tune = (dt: number) => {
      if (dt > 1 / 40) {
        state.slow += 1;
        state.quick = 0;
      } else if (dt < 1 / 55) {
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
      const running = !s.paused && !reduce && s.rotationSpeed !== 0;
      if (running) state.clock += dt * 0.96 * s.rotationSpeed;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

      const engaged = s.interactive && pointer.inside && !reduce;
      const aim = engaged ? pointer.x / view.width - 0.5 : 0;
      const follow = 1 - Math.exp(-dt * 2.4);
      state.spin += (aim * 1.4 - state.spin) * follow;
      state.lean += (aim * 9 - state.lean) * follow;
      state.shift += (aim * 0.35 * (view.width / view.height) - state.shift) * follow;
      state.touch += ((engaged ? 1 : 0) - state.touch) * (1 - Math.exp(-dt * 3));

      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].age += dt;
        if (pulses[i].age > PULSE_LIFE * 2.2) pulses.splice(i, 1);
      }

      render();

      const settling =
        state.intro < 1 ||
        pulses.length > 0 ||
        Math.abs(aim * 1.4 - state.spin) > 0.0005 ||
        Math.abs((engaged ? 1 : 0) - state.touch) > 0.002;
      if (running || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      view.width = width;
      view.height = height;
      view.ratio = ratio;
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
      const s = settingsRef.current;
      if (!s.clickPulse || reduce) return;
      const point = locate(event);
      if (!point.inside) return;
      const tilt = ((s.pillarRotation + state.lean) * Math.PI) / 180;
      pulses.push({ axis: axisAt(point.x, point.y, tilt), age: 0 });
      if (pulses.length > 3) pulses.shift();
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

    wakeRef.current = () => {
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
      if (texture) gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteProgram(marchProgram.program);
      gl.deleteProgram(compositeProgram.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      if (!gl.isContextLost()) gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [generation]);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={containerRef}
      className={`absolute top-0 left-0 w-full h-full overflow-hidden ${className}`}
      style={{ mixBlendMode, ...style }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" aria-hidden="true" />
    </div>
  );
};

export default LightPillar;
