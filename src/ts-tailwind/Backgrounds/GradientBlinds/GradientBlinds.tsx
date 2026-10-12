'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

export type BlindsShineDirection = 'left' | 'right';
export type BlindsClickEffect = 'ripple' | 'none';
export type BlindsIdle = 'drift' | 'center' | 'stay';

export interface GradientBlindsProps {
  className?: string;
  style?: CSSProperties;
  dpr?: number;
  paused?: boolean;
  gradientColors?: string[];
  angle?: number;
  noise?: number;
  blindCount?: number;
  blindMinWidth?: number;
  mouseDampening?: number;
  mirrorGradient?: boolean;
  spotlightRadius?: number;
  spotlightSoftness?: number;
  spotlightOpacity?: number;
  distortAmount?: number;
  shineDirection?: BlindsShineDirection;
  lightColor?: string;
  perspective?: number;
  gradientSpeed?: number;
  shine?: number;
  relief?: number;
  glow?: number;
  sway?: number;
  speed?: number;
  hoverTilt?: number;
  clickEffect?: BlindsClickEffect;
  idle?: BlindsIdle;
  intro?: boolean;
  mixBlendMode?: CSSProperties['mixBlendMode'];
  lightMode?: boolean;
}

type Settings = {
  paused: boolean;
  colorKey: string;
  gradientColors?: string[];
  angle: number;
  noise: number;
  blindCount: number;
  blindMinWidth: number;
  mouseDampening: number;
  mirrorGradient: boolean;
  spotlightRadius: number;
  spotlightSoftness: number;
  spotlightOpacity: number;
  distortAmount: number;
  shineDirection: BlindsShineDirection;
  lightColor: string;
  perspective: number;
  gradientSpeed: number;
  shine: number;
  relief: number;
  glow: number;
  sway: number;
  speed: number;
  hoverTilt: number;
  clickEffect: BlindsClickEffect;
  idle: BlindsIdle;
  intro: boolean;
  lightMode: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const MAX_COLORS = 8;
const MAX_WAVES = 4;
const INTRO_SECONDS = 1.8;
const RIPPLE_SECONDS = 1.6;

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uAngle;
uniform float uNoise;
uniform float uBlindCount;
uniform float uSpotlightRadius;
uniform float uSpotlightSoftness;
uniform float uSpotlightOpacity;
uniform float uMirror;
uniform float uDistort;
uniform float uShineFlip;
uniform vec3 uColors[8];
uniform int uColorCount;
uniform float uLightMode;
uniform float uShine;
uniform float uRelief;
uniform float uGlow;
uniform float uSway;
uniform float uSwayTime;
uniform float uHover;
uniform vec4 uWaves[4];
uniform float uIntro;
uniform float uGrainTime;
uniform vec3 uLightColor;
uniform float uPerspective;
uniform float uGradientShift;

out vec4 outColor;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

vec2 rotate2D(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c) * p;
}

vec2 blindSpace(vec2 uv0) {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = uv0 * 2.0 - 1.0;
  p.x *= aspect;
  vec2 pr = rotate2D(p, uAngle);
  pr.x /= aspect;
  vec2 uv = pr * 0.5 + 0.5;
  if (abs(uPerspective) > 0.001) {
    float k = uPerspective * 2.2;
    uv.x = (exp(k * uv.x) - 1.0) / (exp(k) - 1.0);
  }
  if (uDistort > 0.0) {
    float a = uv.y * 6.0;
    float b = uv.x * 6.0;
    float w = 0.01 * uDistort;
    uv.x += sin(a) * w;
    uv.y += cos(b) * w;
  }
  return uv;
}

vec3 gradientColor(float t) {
  float tt = clamp(t, 0.0, 1.0);
  int count = max(uColorCount, 2);
  float scaled = tt * float(count - 1);
  int seg = min(int(floor(scaled)), count - 2);
  float f = scaled - float(seg);
  if (tt >= 1.0) return uColors[count - 1];
  return mix(uColors[seg], uColors[seg + 1], f);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv0 = frag / uResolution;
  vec2 uvMod = blindSpace(uv0);

  float count = max(uBlindCount, 1.0);
  float stripePhase = uvMod.x * count;
  float pixel = max(fwidth(stripePhase), 1e-5);

  float t = uvMod.x;
  if (uGradientShift != 0.0) {
    t = 1.0 - abs(1.0 - fract((t + uGradientShift) * 0.5) * 2.0);
  }
  if (uMirror > 0.5) {
    t = 1.0 - abs(1.0 - 2.0 * fract(t));
  }
  vec3 base = gradientColor(t);

  vec2 offset = uMouse / uResolution;
  float d = length(uv0 - offset);
  float r = max(uSpotlightRadius, 1e-4);
  float spot = (1.0 - 2.0 * pow(d / r, uSpotlightSoftness)) * uSpotlightOpacity;

  float slat = floor(stripePhase);
  float s = stripePhase - slat;
  float stripeAA = clamp(count * 1.25 / min(uResolution.x, uResolution.y), 0.001, 0.12);
  float edgeBlend = 1.0 - smoothstep(0.0, stripeAA, min(s, 1.0 - s));
  float across = mix(s, 0.5, edgeBlend);
  float ramp = uShineFlip > 0.5 ? 1.0 - across : across;

  float unit = min(uResolution.x, uResolution.y);
  float reach = max(uSpotlightRadius, 0.05) * unit;
  vec2 toLight = uMouse - frag;
  float nearLight = exp(-dot(toLight, toLight) / (reach * reach));

  float tilt = 0.0;
  float pulse = 0.0;
  if (uSway > 0.0) {
    tilt += uSway * 0.5 * sin(uSwayTime * 0.9 + slat * 0.55) * (0.6 + 0.4 * sin(uSwayTime * 0.37 + slat * 0.21));
  }
  tilt += uHover * nearLight * 0.7;
  float aspect = uResolution.x / uResolution.y;
  for (int i = 0; i < 4; i++) {
    vec4 wave = uWaves[i];
    if (wave.w <= 0.0) continue;
    float age = uTime - wave.z;
    if (age < 0.0 || age > ${RIPPLE_SECONDS.toFixed(2)}) continue;
    float life = age / ${RIPPLE_SECONDS.toFixed(2)};
    vec2 origin = blindSpace(wave.xy / uResolution);
    float slats = abs(slat + 0.5 - origin.x * count);
    float front = age * max(count, 4.0) * 0.95;
    float k = (slats - front) / (0.8 + life * 1.2);
    float along = (uvMod.y - origin.y) / max(0.42 + life * 0.5, 0.01);
    float fade = (1.0 - life) * (1.0 - life);
    float ring = exp(-k * k) * exp(-along * along) * fade * smoothstep(0.0, 0.2, age);
    tilt += ring * 0.9;
    pulse += ring;
  }
  if (uIntro < 1.0) {
    float settle = smoothstep(0.0, 1.0, clamp(uIntro * 1.5 - uv0.x * 0.5, 0.0, 1.0));
    tilt -= (1.0 - settle) * 1.2;
  }

  float edge = ramp;
  float calm = 1.0 - 0.6 * clamp(spot, 0.0, 1.0);
  ramp = pow(clamp(ramp, 0.0, 1.0), exp(tilt * 0.9));
  ramp *= 1.0 - 0.3 * min(pulse, 1.0) * calm;
  float crease = uRelief * 0.38 * smoothstep(0.62, 1.0, ramp);
  float sheen = uShine * exp(-pow((edge - 0.035) / 0.07, 2.0)) * (0.3 + 0.7 * nearLight) * (1.0 - edgeBlend);

  vec3 lit = spot > 0.0 ? uLightColor * spot : vec3(spot);
  lit += uLightColor * min(pulse, 1.0) * 0.35 * calm;
  vec3 revealSignal = lit + base - vec3(ramp + crease);

  vec3 col;
  if (uLightMode > 0.5) {
    vec3 luma = vec3(0.2126, 0.7152, 0.0722);
    float peak = max(base.r, max(base.g, base.b));
    float low = min(base.r, min(base.g, base.b));
    float chroma = (peak - low) / max(peak, 0.0001);
    vec3 hue = base / max(peak, 0.0001);
    hue = clamp(mix(vec3(dot(hue, luma)), hue, 1.3), 0.0, 1.0);
    hue *= mix(1.0, 0.82, smoothstep(0.55, 0.9, dot(hue, luma)));
    vec3 tint = mix(base, hue, smoothstep(0.06, 0.28, chroma));
    vec3 revealed = clamp(revealSignal, 0.0, 1.0);
    float coverage = max(revealed.r, max(revealed.g, revealed.b));
    float stroke = 1.0 - smoothstep(pixel, pixel * 2.2, edge);
    col = mix(vec3(1.0), tint, 0.72 * smoothstep(0.0, 1.0, coverage));
    col = mix(col, tint * 0.85, stroke * clamp(coverage * 1.5, 0.0, 1.0) * 0.7);
    col = mix(col, vec3(1.0), clamp(sheen, 0.0, 1.0) * 0.5);
    float grain = max(0.5 * (hash(frag + uGrainTime) + hash(frag.yx + uGrainTime * 1.7)) - 0.5, 0.0);
    col = clamp(col - vec3(grain * uNoise * 0.12 * coverage), 0.0, 1.0);
  } else {
    vec3 haze = base * uGlow * 0.4 * smoothstep(0.0, 1.0, spot) * (0.4 + 0.6 * ramp);
    col = revealSignal + haze + mix(base, uLightColor, 0.45) * sheen * 0.7;
    vec3 over = max(col - 0.8, 0.0);
    col = min(col, vec3(0.8)) + 0.2 * (1.0 - exp(-over / 0.2));
    float luma = dot(clamp(col, 0.0, 1.0), vec3(0.2126, 0.7152, 0.0722));
    float grain = 0.5 * (hash(frag + uGrainTime) + hash(frag.yx + uGrainTime * 1.7)) - 0.5;
    col += grain * uNoise * (0.45 + 0.55 * smoothstep(0.0, 0.5, luma));
  }

  float presence = smoothstep(0.0, 0.65, uIntro);
  col = uLightMode > 0.5 ? mix(vec3(1.0), col, presence) : col * presence;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
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
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
};

const hexToRGB = (hex: string): number[] => {
  const c = String(hex || '')
    .replace('#', '')
    .padEnd(6, '0');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return [r || 0, g || 0, b || 0];
};

const prepStops = (stops?: string[]) => {
  const base = (stops && stops.length ? stops : ['#FF9FFC', '#5227FF']).slice(0, MAX_COLORS);
  if (base.length === 1) base.push(base[0]);
  while (base.length < MAX_COLORS) base.push(base[base.length - 1]);
  const flat = new Float32Array(MAX_COLORS * 3);
  for (let i = 0; i < MAX_COLORS; i++) flat.set(hexToRGB(base[i]), i * 3);
  const count = Math.max(2, Math.min(MAX_COLORS, stops?.length ?? 2));
  return { flat, count };
};

const GradientBlinds = ({
  className = '',
  style,
  dpr,
  paused = false,
  gradientColors,
  angle = 0,
  noise = 0.3,
  blindCount = 16,
  blindMinWidth = 60,
  mouseDampening = 0.15,
  mirrorGradient = false,
  spotlightRadius = 0.5,
  spotlightSoftness = 1,
  spotlightOpacity = 1,
  distortAmount = 0,
  shineDirection = 'left',
  lightColor = '#ffffff',
  perspective = 0,
  gradientSpeed = 0,
  shine = 0.4,
  relief = 0.5,
  glow = 0.4,
  sway = 0.35,
  speed = 1,
  hoverTilt = 0.6,
  clickEffect = 'ripple',
  idle = 'drift',
  intro = true,
  mixBlendMode = 'lighten',
  lightMode = false
}: GradientBlindsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const colorKey = (gradientColors && gradientColors.length ? gradientColors : ['#FF9FFC', '#5227FF']).join(',');
  const settings: Settings = {
    paused,
    colorKey,
    gradientColors,
    angle,
    noise: clamp(noise, 0, 2),
    blindCount: Math.max(1, blindCount || 1),
    blindMinWidth,
    mouseDampening: Math.max(0, mouseDampening),
    mirrorGradient,
    spotlightRadius,
    spotlightSoftness,
    spotlightOpacity,
    distortAmount,
    shineDirection,
    lightColor,
    perspective: clamp(perspective, -1, 1),
    gradientSpeed,
    shine: clamp(shine, 0, 2),
    relief: clamp(relief, 0, 1),
    glow: clamp(glow, 0, 2),
    sway: clamp(sway, 0, 1),
    speed: clamp(speed, 0, 4),
    hoverTilt: clamp(hoverTilt, 0, 1.5),
    clickEffect,
    idle,
    intro,
    lightMode,
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false
    });
    if (!container || !canvas || !gl) return undefined;
    const shader = link(gl);
    if (!shader) return undefined;
    const u = shader.uniforms;
    const vao = gl.createVertexArray();

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const view = { width: 1, height: 1, ratio: 1, count: 1 };
    const pointer = { x: 0, y: 0, inside: false };
    const light = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, ready: false };
    const waves = new Float32Array(MAX_WAVES * 4);
    let waveIndex = 0;
    let hover = 0;
    let time = 0;
    let swayTime = 0;
    let shift = 0;
    let grainTime = 0;
    let introClock = settingsRef.current.intro && !reduce ? 0 : 1;
    let colorKeyCache = '';
    let colorStops = prepStops(settingsRef.current.gradientColors);
    let raf = 0;
    let last = 0;
    let visible = true;

    const blindTotal = (s: Settings) => {
      if (s.blindMinWidth && s.blindMinWidth > 0) {
        const byWidth = Math.max(1, Math.floor(view.width / s.blindMinWidth));
        return Math.max(1, s.blindCount ? Math.min(s.blindCount, byWidth) : byWidth);
      }
      return Math.max(1, s.blindCount);
    };

    const draw = () => {
      const s = settingsRef.current;
      if (colorKeyCache !== s.colorKey) {
        colorStops = prepStops(s.gradientColors);
        colorKeyCache = s.colorKey;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(shader.program);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, time);
      gl.uniform2f(u.uMouse, light.x * view.ratio, (view.height - light.y) * view.ratio);
      gl.uniform1f(u.uAngle, (s.angle * Math.PI) / 180);
      gl.uniform1f(u.uNoise, s.noise);
      gl.uniform1f(u.uBlindCount, blindTotal(s));
      gl.uniform1f(u.uSpotlightRadius, s.spotlightRadius);
      gl.uniform1f(u.uSpotlightSoftness, s.spotlightSoftness);
      gl.uniform1f(u.uSpotlightOpacity, s.spotlightOpacity);
      gl.uniform1f(u.uMirror, s.mirrorGradient ? 1 : 0);
      gl.uniform1f(u.uDistort, s.distortAmount);
      gl.uniform1f(u.uShineFlip, s.shineDirection === 'right' ? 1 : 0);
      gl.uniform3fv(u.uColors, colorStops.flat);
      gl.uniform1i(u.uColorCount, colorStops.count);
      gl.uniform1f(u.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform1f(u.uShine, s.shine);
      gl.uniform1f(u.uRelief, s.relief);
      gl.uniform1f(u.uGlow, s.glow);
      gl.uniform1f(u.uSway, reduce ? 0 : s.sway);
      gl.uniform1f(u.uSwayTime, swayTime);
      gl.uniform1f(u.uHover, hover * s.hoverTilt);
      gl.uniform4fv(u.uWaves, waves);
      gl.uniform1f(u.uIntro, introClock);
      gl.uniform1f(u.uGrainTime, grainTime);
      gl.uniform3fv(u.uLightColor, hexToRGB(s.lightColor || '#ffffff'));
      gl.uniform1f(u.uPerspective, s.perspective);
      gl.uniform1f(u.uGradientShift, shift);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const aim = (s: Settings) => {
      if (pointer.inside) {
        light.tx = pointer.x;
        light.ty = pointer.y;
      } else if (s.idle === 'center') {
        light.tx = view.width / 2;
        light.ty = view.height / 2;
      } else if (s.idle === 'drift' && !reduce) {
        light.tx = view.width * (0.5 + 0.22 * Math.sin(swayTime * 0.23) + 0.05 * Math.sin(swayTime * 0.61 + 1.3));
        light.ty = view.height * (0.5 + 0.16 * Math.sin(swayTime * 0.31 + 0.7) + 0.04 * Math.sin(swayTime * 0.83));
      }
    };

    const follow = (s: Settings, dt: number) => {
      const tau = s.mouseDampening;
      if (tau <= 0) {
        light.x = light.tx;
        light.y = light.ty;
        light.vx = 0;
        light.vy = 0;
        return;
      }
      const omega = 2.4 / tau;
      const k = omega * omega;
      const c = 2 * omega;
      const steps = Math.max(1, Math.ceil(dt / 0.008));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        light.vx += (k * (light.tx - light.x) - c * light.vx) * h;
        light.vy += (k * (light.ty - light.y) - c * light.vy) * h;
        light.x += light.vx * h;
        light.y += light.vy * h;
      }
    };

    const resize = () => {
      const s = settingsRef.current;
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      if (!light.ready) {
        light.ready = true;
        light.x = light.tx = view.width / 2;
        light.y = light.ty = view.height / 2;
      }
      draw();
      wake();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? clamp((now - last) / 1000, 0.001, 1 / 20) : 1 / 60;
      last = now;
      if (s.paused) return;
      time += dt;
      if (!reduce) {
        swayTime += dt * s.speed;
        shift = (shift + dt * s.gradientSpeed * 0.06) % 2;
      }
      grainTime = Math.floor(time * 24) * 17.13;
      if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
      hover += ((pointer.inside ? 1 : 0) - hover) * (1 - Math.exp(-dt / 0.35));
      aim(s);
      follow(s, dt);
      for (let i = 0; i < MAX_WAVES; i++) {
        if (waves[i * 4 + 3] > 0 && time - waves[i * 4 + 2] > RIPPLE_SECONDS) waves[i * 4 + 3] = 0;
      }
      draw();
      const settling =
        Math.abs(light.tx - light.x) > 0.05 ||
        Math.abs(light.ty - light.y) > 0.05 ||
        Math.abs(light.vx) + Math.abs(light.vy) > 0.05 ||
        Math.abs((pointer.inside ? 1 : 0) - hover) > 0.002;
      const active =
        settling ||
        introClock < 1 ||
        waves.some((value, index) => index % 4 === 3 && value > 0) ||
        (!reduce &&
          (s.noise > 0 ||
            s.gradientSpeed !== 0 ||
            (s.sway > 0 && s.speed > 0) ||
            (s.idle === 'drift' && !pointer.inside)));
      if (active) raf = requestAnimationFrame(frame);
    };

    function wake() {
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
    };

    const onPointerMove = (event: PointerEvent) => {
      const { x, y, inside } = locate(event);
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
      if (inside) wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      const { x, y, inside } = locate(event);
      if (!inside || reduce || s.clickEffect !== 'ripple') return;
      const o = waveIndex * 4;
      waves[o] = x * view.ratio;
      waves[o + 1] = (view.height - y) * view.ratio;
      waves[o + 2] = time;
      waves[o + 3] = 1;
      waveIndex = (waveIndex + 1) % MAX_WAVES;
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
      if (visible) wake();
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    wakeRef.current = wake;

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
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
      style={{ ...(!lightMode && mixBlendMode ? { mixBlendMode } : null), ...style }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
};

export default GradientBlinds;
