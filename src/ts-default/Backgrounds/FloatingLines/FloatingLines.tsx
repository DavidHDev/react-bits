'use client';

import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react';
import './FloatingLines.css';

export type WaveName = 'top' | 'middle' | 'bottom';

export type WavePosition = {
  x?: number;
  y?: number;
  rotate?: number;
};

export type LineStyle = 'solid' | 'dotted' | 'dashed';

export interface FloatingLinesProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  linesGradient?: string[];
  enabledWaves?: WaveName[];
  lineCount?: number | number[];
  lineDistance?: number | number[];
  topWavePosition?: WavePosition;
  middleWavePosition?: WavePosition;
  bottomWavePosition?: WavePosition;
  animationSpeed?: number;
  amplitude?: number;
  lineWidth?: number;
  lineStyle?: LineStyle;
  glow?: number;
  brightness?: number;
  depthOfField?: number;
  edgeFade?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  clickSwirl?: boolean;
  intro?: boolean;
  mixBlendMode?: CSSProperties['mixBlendMode'];
  backgroundColor?: string;
  lightMode?: boolean;
  opacity?: number;
  dpr?: number;
  style?: CSSProperties;
}

type WaveSettings = {
  count: number;
  distance: number;
  position: { x: number; y: number; rotate: number };
};

type Settings = {
  stops: string[];
  waves: WaveSettings[];
  animationSpeed: number;
  amplitude: number;
  lineWidth: number;
  style: number;
  glow: number;
  brightness: number;
  depthOfField: number;
  edgeFade: number;
  interactive: boolean;
  bendRadius: number;
  bendStrength: number;
  mouseDamping: number;
  parallax: boolean;
  parallaxStrength: number;
  clickSwirl: boolean;
  intro: boolean;
  backgroundColor?: string;
  lightMode: boolean;
  opacity: number;
  dpr?: number;
};

type Click = { x: number; y: number; age: number; spin: number };

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const MAX_LINES = 24;
const MAX_STOPS = 8;
const MAX_CLICKS = 3;
const INTRO_SECONDS = 1.8;
const WAVES: WaveName[] = ['top', 'middle', 'bottom'];
const WAVE_DEFAULTS: Record<WaveName, { x: number; y: number; rotate: number }> = {
  top: { x: 10, y: 0.5, rotate: -0.4 },
  middle: { x: 5, y: 0, rotate: 0.2 },
  bottom: { x: 2, y: -0.7, rotate: -1 }
};
const WAVE_SHAPE: Record<
  WaveName,
  { offset: number; step: number; light: number; flip: number; depth: number; drift: number }
> = {
  top: { offset: 1, step: 0.2, light: 0.2, flip: 1, depth: 1, drift: 0.6 },
  middle: { offset: 2, step: 0.15, light: 1, flip: 0, depth: 0, drift: 1 },
  bottom: { offset: 1.5, step: 0.2, light: 0.32, flip: 0, depth: 0.6, drift: 1.4 }
};

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform float uRatio;
uniform vec4 uWave[3];
uniform vec4 uShape[3];
uniform vec4 uParallax[3];
uniform int uCount[3];
uniform vec4 uLine[${MAX_LINES * 3}];
uniform vec3 uLineColor[${MAX_LINES * 3}];
uniform vec2 uMouseWarp[3];
uniform float uHaloReach;
uniform float uWidth;
uniform float uGlow;
uniform float uBrightness;
uniform float uFocus;
uniform float uEdgeFade;
uniform vec4 uMouse;
uniform float uBendRadius;
uniform float uBendStrength;
uniform vec4 uClicks[${MAX_CLICKS}];
uniform float uLight;
uniform float uOpaque;
uniform vec3 uBackground;
uniform float uOpacity;
uniform float uStyle;
uniform float uSpacing;
out vec4 outColor;

vec3 toSrgb(vec3 c) {
  return pow(max(c, 0.0), vec3(1.0 / 2.2));
}

vec3 inkOf(vec3 color) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return color * min(1.0, 0.16 / max(luma, 0.001));
}

vec2 warp(vec2 p, float rotate, float flip) {
  float angle = rotate * log(length(p) + 1.0);
  vec2 r = p * mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
  if (flip > 0.5) r.x = -r.x;
  return r;
}

void main() {
  vec2 screen = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
  screen.y = -screen.y;
  for (int k = 0; k < ${MAX_CLICKS}; k++) {
    vec4 click = uClicks[k];
    if (click.w == 0.0) continue;
    float age = click.z;
    float turn = 1.9 * smoothstep(0.0, 0.23, age) * exp(-max(age - 0.23, 0.0) * 1.1) * click.w;
    float spread = 0.3 * (1.0 + age * 0.55);
    vec2 offset = screen - click.xy;
    float angle = turn * exp(-dot(offset, offset) / (spread * spread));
    screen = click.xy + mat2(cos(angle), sin(angle), -sin(angle), cos(angle)) * offset;
  }
  vec3 light = vec3(0.0);
  vec3 bloom = vec3(0.0);
  vec3 inkColor = vec3(0.0);
  float inkAlpha = 0.0;
  float aa = 0.75 * uRatio;
  float invSigma = 1.0 / max(uBendRadius * uBendRadius, 1e-4);
  float tight = 1.0 / (2.6 * uRatio);
  float wide = 1.0 / (11.0 * uRatio);

  for (int w = 0; w < 3; w++) {
    int count = uCount[w];
    if (count <= 0) continue;
    vec4 wave = uWave[w];
    vec4 shape = uShape[w];
    vec2 r = warp(screen + uParallax[w].xy, wave.z, shape.w);
    vec2 rm = uMouseWarp[w];
    float blur = uFocus * uParallax[w].z;
    float width = uWidth * (1.0 + blur * 2.5);
    float soft = aa * (1.0 + blur * 7.0);
    float energy = (uWidth + aa) / (width + soft) * shape.z;
    float cut = uHaloReach + width * 2.0 + soft;
    float sx = sin(r.x);
    float cx = cos(r.x);
    float along = r.x - rm.x;
    float pull = uMouse.z * exp(-along * along * invSigma);
    float level = r.y + wave.y;
    int first = w * ${MAX_LINES};

    for (int i = 0; i < ${MAX_LINES}; i++) {
      if (i >= count) break;
      vec4 line = uLine[first + i];
      float y = (sx * line.x + cx * line.y) * line.z;
      float near = 0.0;
      if (pull > 0.002) {
        float across = (y - wave.y) - rm.y;
        near = exp(-across * across * invSigma) * pull;
        float push = uBendStrength * near;
        y += across * (uBendStrength < 0.0 ? min(-push, 2.5) : -min(push, 0.9));
      }
      float m = level - y;
      float slope = length(vec2(dFdx(m), dFdy(m)));
      float d = abs(m) / max(slope, 1e-5);
      if (d < cut) {
        float gap = d;
        float size = width;
        if (uStyle > 0.5) {
          float period = uSpacing / (uResolution.y * 0.5);
          float cell = (fract((r.x + line.w) / period + float(i) * 0.37) - 0.5) * uSpacing;
          float span = uStyle > 1.5 ? max(uSpacing * 0.32 - width, 0.0) : 0.0;
          gap = length(vec2(max(abs(cell) - span, 0.0), d));
          size = uStyle > 1.5 ? width : width * 1.6;
        }
        float core = smoothstep(size + soft, size - soft, gap);
        float fall = 1.0 - d / cut;
        float halo = (exp(-gap * tight) * 0.3 + exp(-d * wide) * 0.02 * fall * fall) * uGlow;
        vec3 color = uLineColor[first + i];
        float lift = 1.0 + near * 0.8;
        light += color * core * energy * lift;
        bloom += color * halo * shape.z * lift;
        float a = clamp(clamp(core * energy * 1.15 + halo * shape.z * 0.12, 0.0, 1.0) * lift, 0.0, 1.0);
        inkColor = inkOf(color) * a + inkColor * (1.0 - a);
        inkAlpha = a + inkAlpha * (1.0 - a);
      }
    }
  }

  float edge = 1.0;
  if (uEdgeFade > 0.0) {
    float u = gl_FragCoord.x / uResolution.x;
    float fade = uEdgeFade * 0.45;
    float left = smoothstep(0.0, fade, u);
    float right = smoothstep(0.0, fade, 1.0 - u);
    edge = left * left * (3.0 - 2.0 * left) * right * right * (3.0 - 2.0 * right);
  }

  if (uLight > 0.5) {
    float alpha = inkAlpha * edge * uOpacity;
    vec3 ink = toSrgb(inkColor / max(inkAlpha, 1e-4));
    if (uOpaque > 0.5) {
      outColor = vec4(mix(uBackground, ink, alpha), 1.0);
    } else {
      outColor = vec4(ink * alpha, alpha);
    }
    return;
  }

  vec3 capped = 0.28 * (1.0 - exp(-bloom / 0.28));
  vec3 glow = toSrgb(1.0 - exp(-(light + capped) * uBrightness * 1.2)) * edge * uOpacity;
  if (uOpaque > 0.5) {
    outColor = vec4(uBackground + glow * (1.0 - uBackground), 1.0);
  } else {
    outColor = vec4(glow, max(glow.r, max(glow.g, glow.b)));
  }
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const warp = (x: number, y: number, rotate: number, flip: number): [number, number] => {
  const angle = rotate * Math.log(Math.hypot(x, y) + 1);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rx = x * cos + y * sin;
  return [flip > 0.5 ? -rx : rx, y * cos - x * sin];
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

const link = (gl: WebGL2RenderingContext): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
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

const perWave = (value: number | number[] | undefined, waves: WaveName[], wave: WaveName, fallback: number) => {
  if (typeof value === 'number') return value;
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const index = waves.indexOf(wave);
  return value[index] ?? value[value.length - 1] ?? fallback;
};

const FloatingLines = ({
  linesGradient = ['#e945f5', '#ffffff'],
  enabledWaves = ['top', 'middle', 'bottom'],
  lineCount = 10,
  lineDistance = 6,
  topWavePosition,
  middleWavePosition,
  bottomWavePosition,
  animationSpeed = 1,
  amplitude = 1,
  lineWidth = 1,
  lineStyle = 'solid',
  glow = 1,
  brightness = 1,
  depthOfField = 0.5,
  edgeFade = 0,
  interactive = true,
  bendRadius = 5,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  clickSwirl = true,
  intro = true,
  mixBlendMode = 'screen',
  backgroundColor,
  lightMode = false,
  opacity = 1,
  dpr,
  className = '',
  style,
  ...rest
}: FloatingLinesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const waves = Array.isArray(enabledWaves) ? enabledWaves.filter(wave => WAVES.includes(wave)) : WAVES;
  const settings: Settings = {
    stops: Array.isArray(linesGradient) && linesGradient.length ? linesGradient.slice(0, MAX_STOPS) : ['#ffffff'],
    waves: WAVES.map(wave => {
      const on = waves.includes(wave);
      const position = {
        ...WAVE_DEFAULTS[wave],
        ...(wave === 'top' ? topWavePosition : wave === 'middle' ? middleWavePosition : bottomWavePosition)
      };
      return {
        count: on ? clamp(Math.round(perWave(lineCount, waves, wave, 10)), 0, MAX_LINES) : 0,
        distance: perWave(lineDistance, waves, wave, 6) * 0.01,
        position
      };
    }),
    animationSpeed: Math.max(0, animationSpeed),
    amplitude: Math.max(0, amplitude),
    lineWidth: Math.max(0.1, lineWidth),
    style: lineStyle === 'dashed' ? 2 : lineStyle === 'dotted' ? 1 : 0,
    glow: Math.max(0, glow),
    brightness: Math.max(0, brightness),
    depthOfField: clamp(depthOfField, 0, 1),
    edgeFade: clamp(edgeFade, 0, 1),
    interactive,
    bendRadius: Math.max(0.1, bendRadius),
    bendStrength,
    mouseDamping: clamp(mouseDamping, 0, 1),
    parallax,
    parallaxStrength: Math.max(0, parallaxStrength),
    clickSwirl,
    intro,
    backgroundColor,
    lightMode,
    opacity: clamp(opacity, 0, 1),
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

    const program = link(gl);
    if (!program) return undefined;
    const u = program.uniforms;

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

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
    const pointer = { x: 0, y: 0, nx: 0, ny: 0, vx: 0, inside: false };
    const mouse = { x: 0, y: 0, influence: 0, px: 0, py: 0 };
    const clicks: Click[] = [];
    const waveData = new Float32Array(12);
    const shapeData = new Float32Array(12);
    const parallaxData = new Float32Array(12);
    const countData = new Int32Array(3);
    const lineData = new Float32Array(MAX_LINES * 3 * 4);
    const colorData = new Float32Array(MAX_LINES * 3 * 3);
    const mouseData = new Float32Array(6);
    const clickData = new Float32Array(MAX_CLICKS * 4);
    let time = 0;
    let reveal = settingsRef.current.intro && !reduce ? 0 : 1;
    let raf = 0;
    let last = 0;
    let visible = true;

    const render = () => {
      const s = settingsRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const eased = reveal * reveal * (3 - 2 * reveal);
      const ratio = width / Math.max(1, container.clientWidth);
      const stops = s.stops.map(value => parse(value, [1, 1, 1]).map(channel => Math.pow(channel, 2.2)));
      const mouseX = (2 * mouse.x - width) / height;
      const mouseY = -(2 * mouse.y - height) / height;
      s.waves.forEach((wave, index) => {
        const shape = WAVE_SHAPE[WAVES[index]];
        const { x: shift, y: lift, rotate } = wave.position;
        const px = mouse.px * shape.drift;
        const py = -mouse.py * shape.drift;
        waveData.set([shift, lift, rotate, 0], index * 4);
        shapeData.set([shape.offset, shape.step, shape.light, shape.flip], index * 4);
        parallaxData.set([px, py, shape.depth, 0], index * 4);
        mouseData.set(warp(mouseX + px, mouseY + py, rotate, shape.flip), index * 2);
        countData[index] = wave.count;
        for (let line = 0; line < wave.count; line++) {
          const offset = shape.offset + shape.step * line;
          const along = wave.distance * line + shift;
          const phase = along + offset + time * 0.1;
          const amp = Math.sin(offset + time * 0.2) * 0.3 * s.amplitude * eased;
          const slot = index * MAX_LINES + line;
          lineData.set([Math.cos(phase), Math.sin(phase), amp, along], slot * 4);
          const t = wave.count > 1 ? line / (wave.count - 1) : 0;
          const scaled = t * Math.max(stops.length - 1, 0);
          const from = Math.min(Math.floor(scaled), Math.max(stops.length - 2, 0));
          const to = Math.min(from + 1, stops.length - 1);
          const f = clamp(scaled - from, 0, 1);
          const e = f * f * (3 - 2 * f);
          for (let c = 0; c < 3; c++) colorData[slot * 3 + c] = stops[from][c] + (stops[to][c] - stops[from][c]) * e;
        }
      });
      clickData.fill(0);
      clicks.forEach((click, index) => clickData.set([click.x, click.y, click.age, click.spin], index * 4));

      gl.viewport(0, 0, width, height);
      gl.useProgram(program.program);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.uResolution, width, height);
      gl.uniform1f(u.uRatio, ratio);
      gl.uniform4fv(u.uWave, waveData);
      gl.uniform4fv(u.uShape, shapeData);
      gl.uniform4fv(u.uParallax, parallaxData);
      gl.uniform1iv(u.uCount, countData);
      gl.uniform4fv(u.uLine, lineData);
      gl.uniform3fv(u.uLineColor, colorData);
      gl.uniform2fv(u.uMouseWarp, mouseData);
      gl.uniform1f(u.uHaloReach, 11 * ratio * Math.log(160 * s.glow + 1));
      gl.uniform1f(u.uWidth, s.lineWidth * 0.5 * ratio);
      gl.uniform1f(u.uGlow, s.glow);
      gl.uniform1f(u.uBrightness, s.brightness * eased);
      gl.uniform1f(u.uFocus, s.depthOfField);
      gl.uniform1f(u.uEdgeFade, s.edgeFade);
      gl.uniform4f(u.uMouse, mouse.x, mouse.y, mouse.influence, 0);
      gl.uniform1f(u.uBendRadius, s.bendRadius * 0.09);
      gl.uniform1f(u.uBendStrength, s.bendStrength * 2.5);
      gl.uniform4fv(u.uClicks, clickData);
      gl.uniform1f(u.uLight, s.lightMode ? 1 : 0);
      gl.uniform1f(u.uOpaque, s.backgroundColor ? 1 : 0);
      gl.uniform3fv(u.uBackground, parse(s.backgroundColor, s.lightMode ? [1, 1, 1] : [0, 0, 0]));
      gl.uniform1f(u.uOpacity, s.opacity * eased);
      gl.uniform1f(u.uStyle, s.style);
      gl.uniform1f(u.uSpacing, (s.style === 2 ? 22 : 9) * ratio);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
      last = now;
      const motion = reduce ? 0 : 1;
      time += dt * s.animationSpeed * motion;
      if (s.intro && !reduce && reveal < 1) reveal = Math.min(1, reveal + dt / INTRO_SECONDS);
      else if (!s.intro || reduce) reveal = 1;

      const follow = 1 - Math.pow(1 - s.mouseDamping, dt * 60);
      const engaged = s.interactive && pointer.inside && !reduce;
      if (engaged) {
        mouse.x += (pointer.x - mouse.x) * follow;
        mouse.y += (pointer.y - mouse.y) * follow;
      }
      mouse.influence += ((engaged ? 1 : 0) - mouse.influence) * follow;
      const tx = s.parallax && engaged ? pointer.nx * s.parallaxStrength : 0;
      const ty = s.parallax && engaged ? pointer.ny * s.parallaxStrength : 0;
      mouse.px += (tx - mouse.px) * follow;
      mouse.py += (ty - mouse.py) * follow;
      for (let i = clicks.length - 1; i >= 0; i--) {
        clicks[i].age += dt;
        if (clicks[i].age > 4) clicks.splice(i, 1);
      }

      render();
      raf = requestAnimationFrame(frame);
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
      render();
      wake();
    };

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const ratio = canvas.width / Math.max(1, rect.width);
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      const nextX = x * ratio;
      if (Math.abs(nextX - pointer.x) > 0.5) pointer.vx = nextX - pointer.x;
      pointer.x = nextX;
      pointer.y = (rect.height - y) * ratio;
      pointer.nx = x / Math.max(1, rect.width) - 0.5;
      pointer.ny = 0.5 - y / Math.max(1, rect.height);
    };

    const onPointerMove = (event: PointerEvent) => {
      const wasInside = pointer.inside;
      locate(event);
      if (pointer.inside && !wasInside && mouse.influence < 0.05) {
        mouse.x = pointer.x;
        mouse.y = pointer.y;
      }
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      locate(event);
      if (!pointer.inside || !settingsRef.current.clickSwirl || reduce) return;
      const x = (2 * pointer.x - canvas.width) / canvas.height;
      const y = -(2 * pointer.y - canvas.height) / canvas.height;
      clicks.unshift({ x, y, age: 0, spin: pointer.vx < 0 ? -1 : 1 });
      if (clicks.length > MAX_CLICKS) clicks.pop();
      wake();
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
      if (!raf) render();
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
      gl.deleteProgram(program.program);
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
      className={`floating-lines-container${className ? ` ${className}` : ''}`}
      style={{ ...style, mixBlendMode: lightMode || backgroundColor ? 'normal' : mixBlendMode }}
      {...rest}
    >
      <canvas ref={canvasRef} className="floating-lines-canvas" aria-hidden="true" />
    </div>
  );
};

export default FloatingLines;
