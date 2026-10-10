'use client';

import { useEffect, useRef } from 'react';

import './SlicedWaves.css';

const BAR_VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 aShape;
in vec4 aTop;
in vec4 aBottom;
uniform vec2 uView;
uniform float uAngle;
out vec2 vLocal;
out vec4 vShape;
out vec4 vTop;
out vec4 vBottom;
void main() {
  float halo = aShape.z + 5.0;
  float reachX = aShape.z + max(aTop.w * 2.5, halo * 2.0);
  float reachY = aShape.w + max(aTop.w * 2.5, halo * 2.0);
  vec2 local = aCorner * vec2(reachX, reachY);
  vLocal = local;
  vShape = aShape;
  vTop = aTop;
  vBottom = aBottom;
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec2 p = aShape.xy + local - uView * 0.5;
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + uView * 0.5;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
}`;

const BAR_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec4 vShape;
in vec4 vTop;
in vec4 vBottom;
uniform float uGlow;
uniform float uSlices;
uniform float uBase;
uniform float uHalfBar;
uniform float uScale;
out vec4 outColor;

float erfApprox(float x) {
  float a = x * x;
  float t = 1.0 - exp(-a * (1.2732395 + 0.147 * a) / (1.0 + 0.147 * a));
  return sign(x) * sqrt(max(t, 0.0));
}

float box(float d, float h, float s) {
  float k = 0.70710678 / max(s, 0.3);
  return 0.5 * (erfApprox((h - d) * k) + erfApprox((h + d) * k));
}

void main() {
  float blur = vTop.w;
  float body = box(vLocal.x, vShape.z, blur) * box(vLocal.y, vShape.w, blur * 1.15);
  float halo = vShape.z + 5.0;
  float glow = box(vLocal.x, vShape.z, halo) * box(vLocal.y, vShape.w, halo);
  float t = clamp(vLocal.y / max(vShape.w, 0.001) * 0.5 + 0.5, 0.0, 1.0);
  vec3 color = mix(vTop.rgb, vBottom.rgb, t);
  float v = clamp(vLocal.y / max(vShape.w, 0.001), -1.0, 1.0);
  float core = exp(-pow(vLocal.x / max(vShape.z + blur * 0.5, 0.5), 2.0) * 1.5);
  body *= (1.0 + 0.35 * core) * (1.0 - 0.35 * v * v * v * v);
  if (uSlices > 0.0) {
    float cell = vShape.z / max(uHalfBar, 0.00001) / uSlices;
    float y = (uBase - vShape.y - vLocal.y) / max(cell, 0.001);
    float f = 1.0 - abs(fract(y) - 0.5) * 2.0;
    float soft = clamp(blur / max(cell, 0.001) * 1.6, 0.04, 1.0);
    body *= smoothstep(0.28 - soft, 0.28 + soft, f);
  }
  vec3 tint = color * color / max(max(color.r, max(color.g, color.b)), 0.05);
  outColor = vec4((color * body + tint * uGlow * glow * 0.16) * vBottom.w * uScale, 1.0);
}`;

const QUAD_VERTEX = `#version 300 es
in vec2 aCorner;
void main() {
  gl_Position = vec4(aCorner, 0.0, 1.0);
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uLight;
uniform vec2 uResolution;
uniform float uScale;
uniform float uExposure;
uniform float uGrain;
uniform float uTime;
uniform float uFade;
uniform float uOpacity;
uniform float uLightMode;
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
  vec3 hdr = texelFetch(uLight, ivec2(gl_FragCoord.xy), 0).rgb / uScale * uExposure;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  mask *= uOpacity;
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  float peak = max(hdr.r, max(hdr.g, hdr.b));
  if (uLightMode > 0.5) {
    vec3 hue = hdr / max(peak, 0.0001);
    float tone = dot(hue, vec3(0.2126, 0.7152, 0.0722));
    vec3 color = pow(clamp(hue * min(1.0, 0.66 / max(tone, 0.001)), 0.0, 1.0), vec3(1.0 / 2.2));
    float alpha = clamp((1.0 - exp(-peak * 1.1)) * 0.85 * (1.0 + grain), 0.0, 1.0) * mask;
    outColor = vec4(color * alpha, alpha);
  } else {
    vec3 mapped = 1.0 - exp(-hdr);
    mapped = mix(mapped, vec3(1.0), smoothstep(1.1, 3.2, peak) * 0.75);
    float level = max(mapped.r, max(mapped.g, mapped.b));
    mapped = clamp(mapped + grain * (0.25 + level), 0.0, 1.0) * mask;
    outColor = vec4(mapped, max(mapped.r, max(mapped.g, mapped.b)));
  }
}`;

const TAU = Math.PI * 2;
const MAX_RIBBONS = 6;
const FOCAL = 1.1;
const DISTANCE = 2.6;
const INTRO_SECONDS = 1.5;
const MAX_RENDER_DIM = 2560;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const hash = n => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const noise = x => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
};

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (gl, vertexSource, fragmentSource, attributes) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  attributes.forEach((name, index) => gl.bindAttribLocation(program, index, name));
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
};

const locate = (gl, program, names) => {
  const result = {};
  for (const name of names) result[name] = gl.getUniformLocation(program, name);
  return result;
};

const SlicedWaves = ({
  color1 = '#ffd9a8',
  color2 = '#ff5fa2',
  color3 = '#5b8cff',
  ribbons = 3,
  spacing = 28,
  barWidth = 0.5,
  ribbonHeight = 0.26,
  spread = 0.1,
  amplitude = 0.1,
  frequency = 1,
  speed = 1,
  perspective = 0.45,
  curve = 0.5,
  blur = 0.6,
  glow = 1,
  brightness = 1.25,
  position = 0.78,
  rotation = 0,
  slices = 0,
  grain = 0.08,
  mouseInteraction = true,
  intro = true,
  fade = 0,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const settings = {
    color1: String(color1),
    color2: String(color2),
    color3: String(color3),
    ribbons: Math.round(clamp(ribbons, 1, MAX_RIBBONS)),
    spacing: clamp(spacing, 4, 200),
    barWidth: clamp(barWidth, 0.05, 1),
    ribbonHeight: Math.max(0, ribbonHeight),
    spread: Math.max(0, spread),
    amplitude: Math.max(0, amplitude),
    frequency: Math.max(0, frequency),
    speed,
    perspective: clamp(perspective, 0, 1),
    curve: clamp(curve, 0, 1),
    blur: clamp(blur, 0, 2),
    glow: Math.max(0, glow),
    brightness: Math.max(0, brightness),
    position: clamp(position, 0, 1),
    rotation,
    slices: Math.max(0, Math.round(slices)),
    grain: Math.max(0, grain),
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
      stencil: false
    });
    if (!container || !canvas || !gl) return undefined;

    const floatTarget = !!gl.getExtension('EXT_color_buffer_float');
    const lightScale = floatTarget ? 1 : 0.25;
    const barProgram = link(gl, BAR_VERTEX, BAR_FRAGMENT, ['aCorner', 'aShape', 'aTop', 'aBottom']);
    const compositeProgram = link(gl, QUAD_VERTEX, COMPOSITE, ['aCorner']);
    if (!barProgram || !compositeProgram) return undefined;
    const bar = locate(gl, barProgram, ['uView', 'uAngle', 'uGlow', 'uSlices', 'uBase', 'uHalfBar', 'uScale']);
    const composite = locate(gl, compositeProgram, [
      'uLight',
      'uResolution',
      'uScale',
      'uExposure',
      'uGrain',
      'uTime',
      'uFade',
      'uOpacity',
      'uLightMode'
    ]);

    const cornerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const instanceBuffer = gl.createBuffer();
    const barVao = gl.createVertexArray();
    gl.bindVertexArray(barVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    for (let attribute = 1; attribute <= 3; attribute++) {
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 48, (attribute - 1) * 16);
      gl.vertexAttribDivisor(attribute, 1);
    }
    const quadBuffer = gl.createBuffer();
    const quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const lightTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lightTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer();

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const colorCache = new Map();
    let instances = new Float32Array(0);
    const pointer = { x: 0, y: 0, inside: false };
    const state = {
      width: 1,
      height: 1,
      targetWidth: 0,
      targetHeight: 0,
      time: 0,
      intro: settingsRef.current.intro && !reduce ? 0 : 1,
      focus: DISTANCE,
      focusVelocity: 0,
      lift: 0,
      liftX: 0
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;

    const toLinear = value => {
      if (colorCache.has(value)) return colorCache.get(value);
      let rgb = [1, 1, 1];
      if (probe && value) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r, g, b].map(v => Math.pow(v / 255, 2.2));
      }
      colorCache.set(value, rgb);
      return rgb;
    };

    const writePalette = (palette, x, offset) => {
      const n = palette.length;
      const f = ((x % n) + n) % n;
      const i = Math.floor(f);
      let m = f - i;
      m = m * m * (3 - 2 * m);
      const a = palette[i];
      const b = palette[(i + 1) % n];
      for (let c = 0; c < 3; c++) instances[offset + c] = a[c] + (b[c] - a[c]) * m;
    };

    const ensureTarget = () => {
      if (state.targetWidth === canvas.width && state.targetHeight === canvas.height) return;
      state.targetWidth = canvas.width;
      state.targetHeight = canvas.height;
      gl.bindTexture(gl.TEXTURE_2D, lightTexture);
      if (floatTarget) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lightTexture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const layout = s => {
      const { width: w, height: h } = state;
      const F = h * FOCAL;
      const centerScale = F / DISTANCE;
      const pitch = s.spacing / centerScale;
      const halfBar = pitch * s.barWidth * 0.5;
      const yaw = s.perspective * 0.66;
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);
      const bend = s.curve * 0.6;
      const angle = (s.rotation * Math.PI) / 180;
      const span = Math.abs(Math.cos(angle)) * w * 0.5 + Math.abs(Math.sin(angle)) * h * 0.5;
      const reach = Math.ceil(((Math.max(w, h) / F) * DISTANCE * 2.4) / pitch);
      const bars = [];
      for (let i = -reach; i <= reach; i++) {
        const x = i * pitch;
        const local = bend * Math.sin(x * 0.9 + 0.8);
        const X = x * cosYaw - local * sinYaw;
        const Z = x * sinYaw + local * cosYaw + DISTANCE;
        if (Z < 0.45) continue;
        const scale = F / Z;
        const sx = w * 0.5 + X * scale;
        if (Math.abs(sx - w * 0.5) > span + halfBar * scale + 80) continue;
        bars.push({ i, x, Z, sx, scale });
      }
      return { bars, halfBar, centerScale };
    };

    const build = (s, view) => {
      const { width: w, height: h } = state;
      const { bars, halfBar, centerScale } = view;
      const palette = [s.color1, s.color2, s.color3].map(toLinear);
      const t = state.time;
      const thickness = (s.ribbonHeight * h * 0.5) / centerScale;
      const separation = (s.spread * h) / centerScale;
      const amplitude = (s.amplitude * h) / centerScale;
      const frequency = 0.22 * s.frequency;
      const base = h * s.position;
      const focus = state.focus;
      const blurScale = s.blur * 16;
      const sweep = 1.6 + 0.04 * (s.ribbons - 1);
      const needed = bars.length * s.ribbons * 12;
      if (needed > instances.length) instances = new Float32Array(needed + 1200);
      let count = 0;
      for (const b of bars) {
        const hw = halfBar * b.scale;
        const across = b.sx / Math.max(w, 1);
        const lift = state.lift * Math.exp(-Math.pow((b.sx - state.liftX) / Math.max(w * 0.12, 60), 2));
        const blurPx = (0.5 + s.blur * 0.6 + blurScale * Math.abs(focus / b.Z - 1)) * (s.lightMode ? 0.55 : 1);
        for (let r = 0; r < s.ribbons; r++) {
          const offset = (r - (s.ribbons - 1) / 2) * separation;
          const wave =
            0.62 * Math.sin(TAU * frequency * b.x - t * 1.6 + r * 2.1) +
            0.38 * Math.sin(TAU * frequency * 1.9 * b.x + t * 2.25 + r * 1.3);
          const yc = offset + wave * amplitude;
          const swell = 0.5 + 0.5 * Math.sin(TAU * frequency * 0.7 * b.x + t * 1.1 + r * 2.7);
          const grow = clamp((state.intro * sweep - across - r * 0.04) / 0.6, 0, 1);
          const eased = grow * grow * (3 - 2 * grow);
          const th = thickness * (0.6 + 0.4 * swell) * eased;
          const hh = th * b.scale;
          if (hh < 0.4) continue;
          const tone = r * 1.15 + b.x * 0.3 + t * 0.12;
          const o = count * 12;
          instances[o] = b.sx;
          instances[o + 1] = base - yc * b.scale;
          instances[o + 2] = hw;
          instances[o + 3] = hh;
          writePalette(palette, tone - 0.22, o + 4);
          instances[o + 7] = blurPx;
          writePalette(palette, tone + 0.22, o + 8);
          instances[o + 11] =
            (0.75 + 0.25 * noise(b.i * 0.9 + r * 7.7 - t * 1.2)) * (1 + lift * 0.6) * (0.4 + 0.6 * eased);
          count++;
        }
      }
      return { count, halfBar, base };
    };

    const render = (s, view = layout(s)) => {
      ensureTarget();
      const { count, halfBar, base } = build(s, view);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (count > 0) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(barProgram);
        gl.uniform2f(bar.uView, state.width, state.height);
        gl.uniform1f(bar.uAngle, (s.rotation * Math.PI) / 180);
        gl.uniform1f(bar.uGlow, s.lightMode ? s.glow * 0.4 : s.glow);
        gl.uniform1f(bar.uSlices, s.slices);
        gl.uniform1f(bar.uBase, base);
        gl.uniform1f(bar.uHalfBar, halfBar);
        gl.uniform1f(bar.uScale, lightScale);
        gl.bindVertexArray(barVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, instances.subarray(0, count * 12), gl.DYNAMIC_DRAW);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
        gl.disable(gl.BLEND);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(compositeProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, lightTexture);
      gl.uniform1i(composite.uLight, 0);
      gl.uniform2f(composite.uResolution, canvas.width, canvas.height);
      gl.uniform1f(composite.uScale, lightScale);
      gl.uniform1f(composite.uExposure, 1.6 * s.brightness);
      gl.uniform1f(composite.uGrain, s.grain);
      gl.uniform1f(composite.uTime, state.time % 1000);
      gl.uniform1f(composite.uFade, s.fade);
      gl.uniform1f(composite.uOpacity, s.opacity);
      gl.uniform1f(composite.uLightMode, s.lightMode ? 1 : 0);
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const focusTarget = (view, x) => {
      let best = null;
      for (const b of view.bars) {
        if (!best || Math.abs(b.sx - x) < Math.abs(best.sx - x)) best = b;
      }
      return best ? best.Z : DISTANCE;
    };

    const frame = now => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) state.time += dt * s.speed;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

      const engaged = s.mouseInteraction && pointer.inside && !reduce;
      const angle = (s.rotation * Math.PI) / 180;
      const localX =
        Math.cos(angle) * (pointer.x - state.width * 0.5) +
        Math.sin(angle) * (pointer.y - state.height * 0.5) +
        state.width * 0.5;
      const view = layout(s);
      const target = engaged ? focusTarget(view, localX) : DISTANCE;
      state.focusVelocity += (36 * (target - state.focus) - 11 * state.focusVelocity) * dt;
      state.focus += state.focusVelocity * dt;
      state.lift += ((engaged ? 1 : 0) - state.lift) * (1 - Math.exp(-dt / (engaged ? 0.25 : 0.6)));
      state.liftX += (localX - state.liftX) * (1 - Math.exp(-dt / 0.12));

      render(s, view);
      const settling =
        state.intro < 1 ||
        Math.abs(target - state.focus) > 0.001 ||
        Math.abs(state.focusVelocity) > 0.001 ||
        state.lift > 0.002 ||
        engaged;
      if (moving || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const base = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      const longest = Math.max(width, height) * base;
      const ratio = longest > MAX_RENDER_DIM ? (base * MAX_RENDER_DIM) / longest : base;
      state.width = width;
      state.height = height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      if (!raf) render(s);
      wake();
    };

    const onPointerMove = event => {
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

    wakeRef.current = () => {
      if (!raf) render(settingsRef.current);
      wake();
    };

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(lightTexture);
      gl.deleteBuffer(cornerBuffer);
      gl.deleteBuffer(instanceBuffer);
      gl.deleteBuffer(quadBuffer);
      gl.deleteVertexArray(barVao);
      gl.deleteVertexArray(quadVao);
      gl.deleteProgram(barProgram);
      gl.deleteProgram(compositeProgram);
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div ref={containerRef} className={`sliced-waves-container${className ? ` ${className}` : ''}`} {...rest}>
      <canvas ref={canvasRef} className="sliced-waves-canvas" aria-hidden="true" />
    </div>
  );
};

export default SlicedWaves;
