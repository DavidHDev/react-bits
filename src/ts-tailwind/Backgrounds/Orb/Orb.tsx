'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

export interface OrbProps {
  colors?: string[];
  hue?: number;
  backgroundColor?: string;
  size?: number;
  glow?: number;
  bleed?: number;
  wobble?: number;
  highlight?: number;
  trail?: number;
  tiltX?: number;
  tiltY?: number;
  speed?: number;
  hoverIntensity?: number;
  rotateOnHover?: boolean;
  forceHoverState?: boolean;
  followCursor?: boolean;
  clickPulse?: boolean;
  intro?: boolean;
  opacity?: number;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

type Settings = {
  colors: string[];
  hue: number;
  backgroundColor: string;
  size: number;
  glow: number;
  bleed: number;
  wobble: number;
  highlight: number;
  trail: number;
  tiltX: number;
  tiltY: number;
  speed: number;
  hoverIntensity: number;
  rotateOnHover: boolean;
  forceHoverState: boolean;
  followCursor: boolean;
  clickPulse: boolean;
  intro: boolean;
  opacity: number;
  paused: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const INTRO_SECONDS = 1.1;
const FOCAL = 3.2;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uRotation;
uniform vec2 uReach;
uniform float uNear;
uniform float uAwake;
uniform vec3 uBackground;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uScale;
uniform float uWobble;
uniform float uGlow;
uniform float uBleed;
uniform float uHighlight;
uniform float uSwirl;
uniform float uOrbit;
uniform vec2 uEcho;
uniform float uReveal;
uniform float uOpacity;
uniform float uTrail;
uniform vec2 uTilt;
out vec4 outColor;

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
  p3 += dot(p3, p3.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
}

float snoise3(vec3 p) {
  const float K1 = 0.333333333;
  const float K2 = 0.166666667;
  vec3 i = floor(p + (p.x + p.y + p.z) * K1);
  vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
  vec3 e = step(vec3(0.0), d0 - d0.yzx);
  vec3 i1 = e * (1.0 - e.zxy);
  vec3 i2 = 1.0 - e.zxy * (1.0 - e);
  vec3 d1 = d0 - (i1 - K2);
  vec3 d2 = d0 - (i2 - K1);
  vec3 d3 = d0 - 0.5;
  vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
  vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
  return dot(vec4(31.316), n);
}

float light1(float intensity, float attenuation, float dist) {
  return intensity / (1.0 + dist * attenuation);
}

float light2(float intensity, float attenuation, float dist) {
  return intensity / (1.0 + dist * dist * attenuation);
}

vec4 draw(vec2 uv) {
  float rawLen = length(uv);
  vec2 dir = rawLen > 0.0001 ? uv / rawLen : vec2(1.0, 0.0);
  float reachAmount = length(uReach);
  vec2 reachDir = reachAmount > 0.00001 ? uReach / reachAmount : vec2(1.0, 0.0);
  float facing = exp((dot(dir, reachDir) - 1.0) * 3.2);
  float len = max(rawLen - reachAmount * facing * smoothstep(0.25, 0.65, rawLen), 0.0);
  uv = dir * len;
  float ang = atan(dir.y, dir.x);
  float invLen = len > 0.0 ? 1.0 / len : 0.0;
  float near = facing * uNear;
  float bgLuminance = dot(uBackground, vec3(0.299, 0.587, 0.114));

  float n0 = snoise3(vec3(uv * 0.65, uTime * 0.5)) * 0.5 + 0.5;
  float r0 = mix(0.8 - 0.04 * uWobble, 0.8 + 0.04 * uWobble, n0);
  float d0 = distance(uv, (r0 * invLen) * uv);
  float v0 = light1(1.0, 10.0 / uGlow, d0);
  v0 *= smoothstep(r0 * 1.05, r0, len);
  float reach = max(uBleed, 0.04);
  float innerFade = smoothstep(r0 * (1.0 - 0.2 * reach), r0 * (1.0 - 0.05 * reach), len);
  v0 *= mix(innerFade, 1.0, bgLuminance * 0.7 * min(uBleed, 1.0));
  float body = smoothstep(0.8 - 0.2 * reach, 0.8, len);
  float cl = cos(ang + uSwirl) * 0.5 + 0.5;

  vec2 pos = vec2(cos(uOrbit), sin(uOrbit)) * r0;
  float d = distance(uv, pos);
  vec2 head = vec2(cos(uOrbit), sin(uOrbit));
  float lag = atan(head.x * dir.y - head.y * dir.x, dot(dir, head));
  float trail = uTrail > 0.0 ? smoothstep(0.0, 0.35, lag) * exp(-max(lag, 0.0) * 2.6 / uTrail) : 0.0;
  float v1 = (light2(1.5, 5.0, d) + trail * 0.6) * uHighlight;
  v1 *= light1(1.0, 50.0, d0);
  float band = v0 * smoothstep(1.0, mix(0.6, 1.0, n0 * 0.5), len) * body;
  float heat = pow(clamp(band / 0.82, 0.0, 1.0), 3.0);
  float bloom = light2(1.0, 160.0 / uGlow, max(len - r0, 0.0)) * smoothstep(0.4, 0.0, len - r0) * step(r0, len);

  float v2 = smoothstep(1.0, mix(0.6, 1.0, n0 * 0.5), len);
  float v3 = body;

  vec3 colBase = mix(uColor1, uColor2, cl);
  float fadeAmount = mix(1.0, 0.1, bgLuminance);

  float echoD = abs(len - r0 - uEcho.x);
  float echo = light1(1.0, 60.0, echoD) * smoothstep(0.12, 0.0, echoD) * uEcho.y;

  vec3 darkCol = mix(uColor3, colBase, v0);
  darkCol = (darkCol + v1) * v2 * v3 * (1.0 + uAwake + near * 0.35) + mix(colBase, vec3(1.0), 0.25) * heat * (0.28 + near * 0.3);
  darkCol = clamp(darkCol + colBase * (bloom * 0.1 + echo), 0.0, 1.0);

  vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
  lightCol = mix(uBackground, lightCol, clamp(v0 + echo, 0.0, 1.0));
  lightCol = mix(lightCol, colBase, clamp(v0, 0.0, 1.0) * clamp(near * 0.4 + uAwake, 0.0, 0.6));
  lightCol = clamp(mix(lightCol, vec3(1.0), clamp(v1 * 0.35, 0.0, 0.6)), 0.0, 1.0);

  vec3 finalCol = mix(darkCol, lightCol, bgLuminance);
  float alpha = max(max(finalCol.r, finalCol.g), finalCol.b);
  return vec4(finalCol / (alpha + 1e-5), alpha);
}

vec2 toPlane(vec2 p, out float hit) {
  float cx = cos(uTilt.x);
  float sx = sin(uTilt.x);
  float cy = cos(uTilt.y);
  float sy = sin(uTilt.y);
  vec3 ex = vec3(cy, 0.0, -sy);
  vec3 ey = vec3(sy * sx, cx, cy * sx);
  vec3 normal = vec3(sy * cx, -sx, cy * cx);
  vec3 origin = vec3(0.0, 0.0, ${FOCAL.toFixed(1)});
  vec3 ray = vec3(p, -${FOCAL.toFixed(1)});
  float denom = dot(normal, ray);
  float t = -dot(normal, origin) / (abs(denom) > 0.00001 ? denom : -0.00001);
  hit = t > 0.0 ? 1.0 : 0.0;
  vec3 q = origin + ray * t;
  return vec2(dot(q, ex), dot(q, ey));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / min(uResolution.x, uResolution.y) * 2.0;
  uv *= uScale;
  float hit = 1.0;
  if (abs(uTilt.x) + abs(uTilt.y) > 0.0001) uv = toPlane(uv, hit);

  float s = sin(uRotation);
  float c = cos(uRotation);
  uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

  vec4 col = draw(uv);
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  float alpha = clamp(col.a * hit * uReveal * uOpacity + dither, 0.0, 1.0);
  outColor = vec4(col.rgb * alpha * alpha, alpha);
}`;

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
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const Orb = ({
  colors = ['#9c43fe', '#4cc2e9', '#101499'],
  hue = 0,
  backgroundColor = '#000000',
  size = 1,
  glow = 1,
  bleed = 1,
  wobble = 1,
  highlight = 1,
  trail = 1,
  tiltX = 0,
  tiltY = 0,
  speed = 1,
  hoverIntensity = 1,
  rotateOnHover = true,
  forceHoverState = false,
  followCursor = true,
  clickPulse = true,
  intro = true,
  opacity = 1,
  paused = false,
  dpr,
  className = '',
  style
}: OrbProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const palette: string[] = Array.isArray(colors) ? colors : [];
  const settings: Settings = {
    colors: [palette[0] ?? '#9c43fe', palette[1] ?? palette[0] ?? '#4cc2e9', palette[2] ?? '#101499'].map(String),
    hue,
    backgroundColor: String(backgroundColor),
    size: clamp(size, 0.1, 3),
    glow: clamp(glow, 0.1, 5),
    bleed: clamp(bleed, 0, 4),
    wobble: Math.max(0, wobble),
    highlight: Math.max(0, highlight),
    trail: Math.max(0, trail),
    tiltX: clamp(tiltX, -70, 70),
    tiltY: clamp(tiltY, -70, 70),
    speed,
    hoverIntensity: Math.max(0, hoverIntensity),
    rotateOnHover,
    forceHoverState,
    followCursor,
    clickPulse,
    intro,
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
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const cache = new Map<string, number[]>();
    const parse = (value: string): number[] => {
      const cached = cache.get(value);
      if (cached) return cached;
      let rgb: number[] = [0, 0, 0];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
        rgb = a ? [r / 255, g / 255, b / 255] : [0, 0, 0];
      }
      cache.set(value, rgb);
      return rgb;
    };
    const shiftHue = (rgb: number[], degrees: number): number[] => {
      if (!degrees) return rgb;
      const angle = (degrees * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const [r, g, b] = rgb;
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      const i = 0.596 * r - 0.274 * g - 0.322 * b;
      const q = 0.211 * r - 0.523 * g + 0.312 * b;
      const ni = i * cos - q * sin;
      const nq = i * sin + q * cos;
      return [y + 0.956 * ni + 0.621 * nq, y - 0.272 * ni - 0.647 * nq, y - 1.106 * ni + 1.703 * nq];
    };

    const view = { width: 1, height: 1 };
    const pointer = { x: 0, y: 0, inside: false };
    const state = {
      time: 0,
      swirl: 0,
      orbit: 0,
      echo: 1,
      rotation: 0,
      hover: 0,
      near: 0,
      reachX: 0,
      reachY: 0,
      reachSpeedX: 0,
      reachSpeedY: 0,
      pulse: 0,
      pulseSpeed: 0,
      kick: settingsRef.current.intro && !reduce ? 2.5 : 0,
      reveal: settingsRef.current.intro && !reduce ? 0 : 1
    };
    let raf = 0;
    let last = 0;
    let visible = true;

    const toOrb = (x: number, y: number): [number, number] => {
      const s = settingsRef.current;
      const side = Math.min(view.width, view.height);
      const scale = 1 / (s.size * (1 + state.pulse));
      let ux = ((x - view.width / 2) / side) * 2 * scale;
      let uy = ((view.height / 2 - y) / side) * 2 * scale;
      if (s.tiltX || s.tiltY) {
        const ax = (-s.tiltX * Math.PI) / 180;
        const ay = (s.tiltY * Math.PI) / 180;
        const [cx, sx, cy, sy] = [Math.cos(ax), Math.sin(ax), Math.cos(ay), Math.sin(ay)];
        const normal = [sy * cx, -sx, cy * cx];
        const ray = [ux, uy, -FOCAL];
        const denom = normal[0] * ray[0] + normal[1] * ray[1] + normal[2] * ray[2];
        const t = -(normal[2] * FOCAL) / (Math.abs(denom) > 0.00001 ? denom : -0.00001);
        if (t <= 0) return [99, 99];
        const q = [ray[0] * t, ray[1] * t, FOCAL + ray[2] * t];
        ux = q[0] * cy - q[2] * sy;
        uy = q[0] * sy * sx + q[1] * cx + q[2] * cy * sx;
      }
      const sin = Math.sin(state.rotation);
      const cos = Math.cos(state.rotation);
      return [cos * ux - sin * uy, sin * ux + cos * uy];
    };

    const render = () => {
      const s = settingsRef.current;
      const [c1, c2, c3] = s.colors.map(value => shiftHue(parse(value), s.hue));
      const reveal = state.reveal;
      const back = reveal - 1;
      const grow = 1 + 2.2 * back * back * back + 1.2 * back * back;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program.program);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, state.time);
      gl.uniform2f(u.uReach, state.reachX, state.reachY);
      gl.uniform1f(u.uNear, state.near);
      gl.uniform1f(u.uAwake, state.hover * s.hoverIntensity * 0.18);
      gl.uniform1f(u.uRotation, state.rotation);
      gl.uniform3fv(u.uBackground, parse(s.backgroundColor));
      gl.uniform3fv(u.uColor1, c1);
      gl.uniform3fv(u.uColor2, c2);
      gl.uniform3fv(u.uColor3, c3);
      gl.uniform1f(u.uScale, 1 / (s.size * (1 + state.pulse) * (0.62 + 0.38 * grow)));
      gl.uniform1f(u.uWobble, s.wobble);
      gl.uniform1f(u.uGlow, s.glow);
      gl.uniform1f(u.uBleed, s.bleed);
      gl.uniform1f(u.uHighlight, s.highlight);
      gl.uniform2f(u.uEcho, state.echo * 0.55, state.echo < 1 ? (1 - state.echo) * (1 - state.echo) : 0);
      gl.uniform1f(u.uSwirl, state.swirl);
      gl.uniform1f(u.uOrbit, state.orbit);
      gl.uniform1f(
        u.uReveal,
        Math.min(1, reveal / 0.55) * Math.min(1, reveal / 0.55) * (3 - 2 * Math.min(1, reveal / 0.55))
      );
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.uniform1f(u.uTrail, s.trail);
      gl.uniform2f(u.uTilt, (-s.tiltX * Math.PI) / 180, (s.tiltY * Math.PI) / 180);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
      last = now;
      if (s.paused) {
        state.reveal = 1;
        render();
        last = 0;
        return;
      }
      const motion = reduce ? 0 : 1;
      const [px, py] = toOrb(pointer.x, pointer.y);
      const distance = Math.hypot(px, py);
      const region = pointer.inside && motion ? clamp((1.45 - distance) / 0.4, 0, 1) : 0;
      const zone = region * region * (3 - 2 * region);
      const aimed = zone * clamp((distance - 0.15) / 0.45, 0, 1);
      const near = zone > 0.5;
      const target = s.forceHoverState ? 1 : zone;
      state.hover += (target - state.hover) * (1 - Math.exp(-dt / 0.16));
      const reach = 0.075 * s.hoverIntensity * aimed;
      const goalX = distance > 0.0001 ? (px / distance) * reach : 0;
      const goalY = distance > 0.0001 ? (py / distance) * reach : 0;
      state.reachSpeedX += (70 * (goalX - state.reachX) - 7 * state.reachSpeedX) * dt;
      state.reachSpeedY += (70 * (goalY - state.reachY) - 7 * state.reachSpeedY) * dt;
      state.reachX += state.reachSpeedX * dt;
      state.reachY += state.reachSpeedY * dt;
      state.near += (aimed * s.hoverIntensity - state.near) * (1 - Math.exp(-dt / 0.12));

      const step = dt * s.speed * motion;
      state.time += step;
      state.swirl += step * 2 * (1 + state.kick);
      state.echo = Math.min(1, state.echo + dt / 1.2);
      if (s.rotateOnHover) state.rotation += dt * 0.3 * state.hover * motion;

      const aim = Math.atan2(py, px);
      if (s.followCursor && near && motion) {
        const delta = Math.atan2(Math.sin(aim - state.orbit), Math.cos(aim - state.orbit));
        state.orbit += delta * (1 - Math.exp(-dt * 6));
      } else {
        state.orbit -= step;
      }
      state.orbit = Math.atan2(Math.sin(state.orbit), Math.cos(state.orbit));

      state.pulseSpeed += (-170 * state.pulse - 11 * state.pulseSpeed) * dt;
      state.pulse += state.pulseSpeed * dt;
      state.kick *= Math.exp(-dt * 2.5);

      if (!s.intro || reduce) state.reveal = 1;
      else if (state.reveal < 1) state.reveal = Math.min(1, state.reveal + dt / INTRO_SECONDS);

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
      view.width = width;
      view.height = height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      render();
      wake();
    };

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    };

    const onPointerMove = (event: PointerEvent) => {
      locate(event);
      if (!settingsRef.current.paused) wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      locate(event);
      if (!pointer.inside || !s.clickPulse || s.paused || reduce) return;
      const [px, py] = toOrb(pointer.x, pointer.y);
      if (Math.hypot(px, py) > 1) return;
      state.pulseSpeed += 0.9;
      state.kick = 2.2;
      state.echo = 0;
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
      className={['relative z-0 h-full w-full overflow-hidden', className].filter(Boolean).join(' ')}
      style={style}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
};

export default Orb;
