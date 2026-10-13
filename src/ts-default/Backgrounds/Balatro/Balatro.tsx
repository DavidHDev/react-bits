'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './Balatro.css';

export interface BalatroProps {
  color1?: string;
  color2?: string;
  color3?: string;
  contrast?: number;
  lighting?: number;
  swirl?: number;
  speed?: number;
  rotationSpeed?: number;
  scale?: number;
  detail?: number;
  offset?: [number, number];
  pixelSize?: number;
  crt?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  clickSwirl?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  opacity?: number;
  maxDevicePixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  color1: number[];
  color2: number[];
  color3: number[];
  contrast: number;
  lighting: number;
  swirl: number;
  speed: number;
  rotation: number;
  scale: number;
  detail: number;
  offset: number[];
  pixelSize: number;
  crt: number;
  mouse: boolean;
  strength: number;
  clickSwirl: boolean;
  intro: boolean;
  light: boolean;
  opacity: number;
  maxRatio: number;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Target {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
}

interface Twirl {
  x: number;
  y: number;
  age: number;
  direction: number;
}

const PIXEL_BUDGET = 2.4e6;
const MAX_TWIRLS = 4;
const FIELD_SCALE = 8;
const STIR_RADIUS = 90;

const VERTEX = `#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`;

const FIELD = `#version 300 es
precision highp float;
uniform sampler2D uPrev;
uniform vec2 uSize;
uniform vec2 uCss;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform vec2 uPush;
uniform float uRadius;
uniform float uDecay;
out vec4 fragColor;

void main() {
  vec2 cell = gl_FragCoord.xy / uSize;
  vec2 p = vec2(cell.x, 1.0 - cell.y) * uCss;
  vec2 seg = uTo - uFrom;
  float len2 = max(dot(seg, seg), 1e-6);
  float h = clamp(dot(p - uFrom, seg) / len2, 0.0, 1.0);
  vec2 gap = p - uFrom - seg * h;
  vec2 delta = uPush * exp(-dot(gap, gap) / (uRadius * uRadius));
  vec2 src = p - delta;
  vec2 prev = texture(uPrev, vec2(src.x / uCss.x, 1.0 - src.y / uCss.y)).xy;
  fragColor = vec4((prev + delta) * uDecay, 0.0, 1.0);
}`;

const PAINT = `#version 300 es
precision highp float;
uniform vec2 uCss;
uniform vec2 uCanvas;
uniform float uBlock;
uniform float uFlow;
uniform float uSpin;
uniform vec2 uOffset;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uContrast;
uniform float uLighting;
uniform float uSwirl;
uniform float uScale;
uniform int uDetail;
uniform sampler2D uField;
uniform float uFieldOn;
uniform vec4 uTwirls[${MAX_TWIRLS}];
uniform float uReveal;
uniform float uLight;
uniform float uOpacity;
out vec4 fragColor;

vec3 paint(vec2 screenSize, vec2 coords) {
  vec2 uv = (coords - 0.5 * screenSize) / length(screenSize) - uOffset;
  float radius = length(uv);
  float speed = uSpin + 302.2;
  float angle = atan(uv.y, uv.x) + speed - 20.0 * (uSwirl * radius + (1.0 - uSwirl));
  vec2 mid = (screenSize / length(screenSize)) / 2.0;
  uv = vec2(radius * cos(angle) + mid.x, radius * sin(angle) + mid.y) - mid;

  uv *= 30.0 / uScale;
  speed = uFlow;
  vec2 uv2 = vec2(uv.x + uv.y);
  for (int i = 0; i < 8; i++) {
    if (i >= uDetail) break;
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121), sin(uv2.x - 0.113 * speed));
    uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
  }

  float contrastMod = 0.25 * uContrast + 0.5 * uSwirl + 1.2;
  float amount = min(2.0, max(0.0, length(uv) * 0.035 * contrastMod));
  float c1 = max(0.0, 1.0 - contrastMod * abs(1.0 - amount));
  float c2 = max(0.0, 1.0 - contrastMod * abs(amount));
  float c3 = 1.0 - min(1.0, c1 + c2);
  float light = (uLighting - 0.2) * max(c1 * 5.0 - 4.0, 0.0) + uLighting * max(c2 * 5.0 - 4.0, 0.0);
  vec3 gap = uLight > 0.5 ? mix(uColor3, vec3(1.0), 0.9) : uColor3;
  float base = 0.3 / uContrast;
  vec3 color = base * uColor1 + (1.0 - base) * (uColor1 * c1 + uColor2 * c2 + gap * c3) + light;
  return mix(gap, color, uReveal);
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy) + 0.5;
  vec2 p = vec2(cell.x, uCanvas.y - cell.y) * uBlock;
  if (uFieldOn > 0.5) {
    p -= texture(uField, vec2(p.x / uCss.x, 1.0 - p.y / uCss.y)).xy;
  }
  for (int i = 0; i < ${MAX_TWIRLS}; i++) {
    vec4 twirl = uTwirls[i];
    if (twirl.w <= 0.0) continue;
    vec2 rel = p - twirl.xy;
    float turn = twirl.z * exp(-dot(rel, rel) / (twirl.w * twirl.w));
    float c = cos(turn);
    float s = sin(turn);
    p = twirl.xy + vec2(c * rel.x - s * rel.y, s * rel.x + c * rel.y);
  }
  vec3 color = paint(uCss, vec2(p.x, uCss.y - p.y));
  float grain = (fract(52.9829189 * fract(dot(cell, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  color = clamp(color + grain, 0.0, 1.0);
  fragColor = vec4(color * uOpacity, uOpacity);
}`;

const SCREEN = `#version 300 es
precision highp float;
uniform sampler2D uPaint;
uniform vec2 uCanvas;
uniform vec2 uSource;
uniform float uDevice;
uniform float uCrt;
out vec4 fragColor;

float smoother(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 device = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y);
  vec2 cell = floor(device / uDevice);
  vec4 texel = texture(uPaint, vec2((cell.x + 0.5) / uSource.x, 1.0 - (cell.y + 0.5) / uSource.y));
  vec3 color = texel.rgb;
  float glow = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float period = max(uDevice, 3.0);
  float row = fract(device.y / period);
  float line = smoother(0.5, 0.92, row) * (1.0 - smoother(0.92, 1.0, row));
  color *= 1.0 - uCrt * 0.34 * line * (1.0 - 0.7 * glow);
  vec2 screen = gl_FragCoord.xy / uCanvas;
  float edge = smoother(0.0, 0.18, screen.x) * smoother(0.0, 0.18, 1.0 - screen.x);
  edge *= smoother(0.0, 0.24, screen.y) * smoother(0.0, 0.24, 1.0 - screen.y);
  color *= mix(1.0, 0.78 + 0.22 * edge, uCrt);
  color *= 1.0 + uCrt * 0.1;
  fragColor = vec4(min(color, vec3(texel.a)), texel.a);
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseColor = (value: string): number[] | null => {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) / 255);
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) return [rgb[1], rgb[2], rgb[3]].map(channel => clamp(parseFloat(channel) / 255, 0, 1));
  return null;
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

const link = (gl: WebGL2RenderingContext, source: string): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
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
    if (info) uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const smoother = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const Balatro = ({
  color1 = '#DE443B',
  color2 = '#006BB4',
  color3 = '#162325',
  contrast = 3.5,
  lighting = 0.4,
  swirl = 0.25,
  speed = 1,
  rotationSpeed = 0,
  scale = 1,
  detail = 5,
  offset = [0, 0],
  pixelSize = 1.5,
  crt = 0,
  mouseInteraction = true,
  mouseStrength = 1,
  clickSwirl = true,
  intro = true,
  lightMode = false,
  opacity = 1,
  maxDevicePixelRatio = 2,
  className = '',
  style
}: BalatroProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const [generation, setGeneration] = useState(0);

  const settings: Settings = {
    color1: parseColor(color1) || [0.871, 0.267, 0.231],
    color2: parseColor(color2) || [0, 0.42, 0.706],
    color3: parseColor(color3) || [0.086, 0.137, 0.145],
    contrast: clamp(contrast, 0.5, 10),
    lighting: clamp(lighting, 0, 1.5),
    swirl: clamp(swirl, 0, 1),
    speed: Math.max(0, speed),
    rotation: clamp(rotationSpeed, -10, 10),
    scale: clamp(scale, 0.2, 5),
    detail: clamp(Math.round(detail), 1, 8),
    offset: Array.isArray(offset) ? [Number(offset[0]) || 0, Number(offset[1]) || 0] : [0, 0],
    pixelSize: clamp(pixelSize, 0, 24),
    crt: clamp(crt, 0, 1),
    mouse: mouseInteraction,
    strength: clamp(mouseStrength, 0, 3),
    clickSwirl,
    intro,
    light: lightMode,
    opacity: clamp(opacity, 0, 1),
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
    const paintProgram = gl ? link(gl, PAINT) : null;
    const screenProgram = gl ? link(gl, SCREEN) : null;
    if (!gl || !paintProgram || !screenProgram) return;
    const floatTargets = !!(
      gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')
    );
    const fieldProgram = floatTargets ? link(gl, FIELD) : null;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vao = gl.createVertexArray();
    const view = { cssWidth: 1, cssHeight: 1, block: 1, device: 1, width: 1, height: 1, crt: false };
    const paintTarget = {
      texture: gl.createTexture() as WebGLTexture,
      framebuffer: gl.createFramebuffer() as WebGLFramebuffer,
      width: 0,
      height: 0
    };
    const field: { width: number; height: number; targets: Target[]; energy: number } = {
      width: 0,
      height: 0,
      targets: [],
      energy: 0
    };
    const pointer = { x: 0, y: 0, lastX: 0, lastY: 0, vx: 0, inside: false, ready: false };
    const steer = { value: 0 };
    const twirls: Twirl[] = [];
    const twirlData = new Float32Array(MAX_TWIRLS * 4);
    let flow = 14;
    let spin = 0;
    let opening = settingsRef.current.intro && !reduced && generation === 0 ? 0 : 1;
    let raf = 0;
    let last = 0;
    let visible = true;
    let pageVisible = document.visibilityState !== 'hidden';
    let lost = false;

    const makeTarget = (width: number, height: number): Target => {
      const texture = gl.createTexture() as WebGLTexture;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, width, height, 0, gl.RG, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const framebuffer = gl.createFramebuffer() as WebGLFramebuffer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { texture, framebuffer };
    };

    const dropField = () => {
      field.targets.forEach(target => {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      });
      field.targets = [];
      field.width = 0;
      field.height = 0;
      field.energy = 0;
    };

    const resize = () => {
      const s = settingsRef.current;
      const rect = container.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width);
      const cssHeight = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, s.maxRatio);
      const budget = Math.ceil(Math.sqrt((cssWidth * cssHeight * dpr * dpr) / PIXEL_BUDGET) - 0.05);
      const device = Math.max(s.pixelSize > 0 ? Math.round(s.pixelSize * dpr) : 1, budget, 1);
      const width = Math.max(1, Math.ceil((cssWidth * dpr) / device));
      const height = Math.max(1, Math.ceil((cssHeight * dpr) / device));
      const crt = s.crt > 0;
      const canvasWidth = crt ? width * device : width;
      const canvasHeight = crt ? height * device : height;
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }
      canvas.style.width = `${(width * device) / dpr}px`;
      canvas.style.height = `${(height * device) / dpr}px`;
      canvas.style.imageRendering = !crt && s.pixelSize > 0 && device >= 2 ? 'pixelated' : 'auto';
      if (crt && (paintTarget.width !== width || paintTarget.height !== height)) {
        gl.bindTexture(gl.TEXTURE_2D, paintTarget.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, paintTarget.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, paintTarget.texture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        paintTarget.width = width;
        paintTarget.height = height;
      }
      view.cssWidth = cssWidth;
      view.cssHeight = cssHeight;
      view.block = device / dpr;
      view.device = device;
      view.width = width;
      view.height = height;
      view.crt = crt;
      if (!fieldProgram) return;
      const fieldWidth = clamp(Math.ceil(cssWidth / FIELD_SCALE), 8, 320);
      const fieldHeight = clamp(Math.ceil(cssHeight / FIELD_SCALE), 8, 320);
      if (fieldWidth === field.width && fieldHeight === field.height) return;
      dropField();
      field.width = fieldWidth;
      field.height = fieldHeight;
      field.targets = [makeTarget(fieldWidth, fieldHeight), makeTarget(fieldWidth, fieldHeight)];
    };

    const stir = (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      pushX: number,
      pushY: number,
      decay: number
    ) => {
      if (!fieldProgram) return;
      const [read, write] = field.targets;
      gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
      gl.viewport(0, 0, field.width, field.height);
      gl.useProgram(fieldProgram.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, read.texture);
      const u = fieldProgram.uniforms;
      gl.uniform1i(u.uPrev, 0);
      gl.uniform2f(u.uSize, field.width, field.height);
      gl.uniform2f(u.uCss, view.cssWidth, view.cssHeight);
      gl.uniform2f(u.uFrom, fromX, fromY);
      gl.uniform2f(u.uTo, toX, toY);
      gl.uniform2f(u.uPush, pushX, pushY);
      gl.uniform1f(u.uRadius, STIR_RADIUS);
      gl.uniform1f(u.uDecay, decay);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      field.targets = [write, read];
    };

    const frame = (now: number) => {
      raf = 0;
      if (lost) return;
      const s = settingsRef.current;
      const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
      last = Math.max(last, now);
      const pace = reduced ? 0.2 : 1;
      flow += dt * s.speed * 7 * pace;
      spin += dt * s.rotation * 0.2 * pace;
      if (opening < 1) opening = Math.min(1, opening + dt / 2.2);

      const tracking = s.mouse && pointer.inside;
      const steerTarget = tracking ? (pointer.x / view.cssWidth - 0.5) * 0.35 * s.strength : 0;
      steer.value += (steerTarget - steer.value) * (1 - Math.exp(-dt / 0.8));

      gl.bindVertexArray(vao);
      if (fieldProgram && field.targets.length) {
        const dx = pointer.x - pointer.lastX;
        const dy = pointer.y - pointer.lastY;
        const moved = tracking && pointer.ready && (dx !== 0 || dy !== 0);
        const decay = Math.exp(-dt / 1.6);
        if (moved || field.energy > 0.05) {
          const amount = 0.85 * s.strength * (reduced ? 0.4 : 1);
          const travel = moved ? Math.hypot(dx, dy) * amount : 0;
          const steps = Math.max(1, Math.ceil(travel / (STIR_RADIUS * 0.3)));
          for (let step = 0; step < steps; step++) {
            const a = step / steps;
            const b = (step + 1) / steps;
            stir(
              pointer.lastX + dx * a,
              pointer.lastY + dy * a,
              pointer.lastX + dx * b,
              pointer.lastY + dy * b,
              moved ? dx * (b - a) * amount : 0,
              moved ? dy * (b - a) * amount : 0,
              step === steps - 1 ? decay : 1
            );
          }
          field.energy = field.energy * decay + travel;
          if (field.energy <= 0.05) {
            field.targets.forEach(target => {
              gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
              gl.clearColor(0, 0, 0, 0);
              gl.clear(gl.COLOR_BUFFER_BIT);
            });
          }
        }
      }
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;

      for (let index = twirls.length - 1; index >= 0; index--) {
        twirls[index].age += dt;
        if (twirls[index].age >= 3.2) twirls.splice(index, 1);
      }
      twirlData.fill(0);
      twirls.forEach((twirl, index) => {
        const t = twirl.age;
        const rise = smoother(t / 0.25);
        const fall = 1 - smoother((t - 0.25) / 2.95);
        twirlData[index * 4] = twirl.x;
        twirlData[index * 4 + 1] = twirl.y;
        twirlData[index * 4 + 2] = twirl.direction * 1.9 * rise * fall;
        twirlData[index * 4 + 3] = 150 * (1 + 0.6 * smoother(t / 3.2));
      });

      const eased = 1 - Math.pow(1 - opening, 3);
      const unwind = 1 - eased;
      gl.bindFramebuffer(gl.FRAMEBUFFER, view.crt ? paintTarget.framebuffer : null);
      gl.viewport(0, 0, view.width, view.height);
      gl.useProgram(paintProgram.program);
      const u = paintProgram.uniforms;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, field.targets.length ? field.targets[0].texture : null);
      gl.uniform1i(u.uField, 0);
      gl.uniform1f(u.uFieldOn, field.targets.length && field.energy > 0.05 ? 1 : 0);
      gl.uniform2f(u.uCss, view.cssWidth, view.cssHeight);
      gl.uniform2f(u.uCanvas, view.width, view.height);
      gl.uniform1f(u.uBlock, view.block);
      gl.uniform1f(u.uFlow, flow);
      gl.uniform1f(u.uSpin, -0.4 + spin + steer.value + 2.6 * unwind * unwind);
      gl.uniform2f(u.uOffset, s.offset[0], s.offset[1]);
      gl.uniform3f(u.uColor1, s.color1[0], s.color1[1], s.color1[2]);
      gl.uniform3f(u.uColor2, s.color2[0], s.color2[1], s.color2[2]);
      gl.uniform3f(u.uColor3, s.color3[0], s.color3[1], s.color3[2]);
      gl.uniform1f(u.uContrast, s.contrast);
      gl.uniform1f(u.uLighting, s.lighting);
      gl.uniform1f(u.uSwirl, Math.min(1, s.swirl + 0.55 * unwind));
      gl.uniform1f(u.uScale, s.scale);
      gl.uniform1i(u.uDetail, s.detail);
      gl.uniform4fv(u.uTwirls, twirlData);
      gl.uniform1f(u.uReveal, smoother(opening / 0.45));
      gl.uniform1f(u.uLight, s.light ? 1 : 0);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (view.crt) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(screenProgram.program);
        const v = screenProgram.uniforms;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, paintTarget.texture);
        gl.uniform1i(v.uPaint, 0);
        gl.uniform2f(v.uCanvas, canvas.width, canvas.height);
        gl.uniform2f(v.uSource, view.width, view.height);
        gl.uniform1f(v.uDevice, view.device);
        gl.uniform1f(v.uCrt, s.crt);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      const settling = Math.abs(steerTarget - steer.value) > 0.0005 || field.energy > 0.05 || twirls.length > 0;
      const busy = s.speed > 0 || s.rotation !== 0 || opening < 1 || settling;
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

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        inside:
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const spot = locate(event);
      if (!pointer.ready || !pointer.inside) {
        pointer.lastX = spot.x;
        pointer.lastY = spot.y;
      }
      pointer.vx = spot.x - pointer.x;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = spot.inside;
      pointer.ready = true;
      wake();
    };
    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      const spot = locate(event);
      if (!spot.inside || !s.clickSwirl || reduced) return;
      twirls.push({ x: spot.x, y: spot.y, age: 0, direction: pointer.vx < 0 ? 1 : -1 });
      if (twirls.length > MAX_TWIRLS) twirls.shift();
      wake();
    };
    const onLeave = () => {
      pointer.inside = false;
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
        dropField();
        gl.deleteTexture(paintTarget.texture);
        gl.deleteFramebuffer(paintTarget.framebuffer);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(paintProgram.program);
        gl.deleteProgram(screenProgram.program);
        if (fieldProgram) gl.deleteProgram(fieldProgram.program);
      }
    };
  }, [generation]);

  return (
    <div ref={containerRef} className={`balatro${className ? ` ${className}` : ''}`} style={style}>
      <canvas ref={canvasRef} className="balatro__canvas" aria-hidden="true" />
    </div>
  );
};

export default Balatro;
