'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

const MAX_BOLTS = 4;
const MAX_STRIKES = 4;
const LEADER = 0.11;
const LIFE = 1.3;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uPhase;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uSize;
uniform float uThickness;
uniform float uGlow;
uniform float uFlicker;
uniform float uBranches;
uniform float uXOffset;
uniform float uAngle;
uniform float uSpread;
uniform int uBolts;
uniform vec4 uPointer;
uniform vec4 uStrikes[${MAX_STRIKES}];
uniform vec4 uStrikeInfo[${MAX_STRIKES}];
uniform float uFlash;
uniform float uIntro;
uniform float uLight;
uniform float uFade;
uniform float uOpacity;

out vec4 outColor;

const float TAU = 6.28318530718;
const float PERIOD = 8.0;
const float WARP = 2.1;

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float gnoise(vec2 p, float period) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash22(mod(i, period)), f);
  float b = dot(hash22(mod(i + vec2(1.0, 0.0), period)), f - vec2(1.0, 0.0));
  float c = dot(hash22(mod(i + vec2(0.0, 1.0), period)), f - vec2(0.0, 1.0));
  float d = dot(hash22(mod(i + vec2(1.0, 1.0), period)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float period = PERIOD;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * gnoise(p, period);
    p = p * 2.0 + vec2(17.0, 31.0);
    period *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

float warpField(vec2 q, float base, float reach, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float period = PERIOD;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    float weight = 1.0;
    if (i >= 3) {
      float estimate = abs(base + value * WARP);
      weight = 1.0 - smoothstep(reach * 0.6, reach, estimate);
      if (weight <= 0.0) break;
      reach *= 0.62;
    }
    value += amplitude * gnoise(q, period) * weight;
    q = q * 2.0 + vec2(17.0, 31.0);
    period *= 2.0;
    amplitude *= 0.5;
  }
  return value * WARP;
}

float flicker(float seed) {
  float steady = 0.82 + 0.18 * sin(TAU * (uPhase * 13.0 + seed)) * sin(TAU * (uPhase * 7.0 + seed * 1.7));
  float burst = 0.0;
  for (int j = 0; j < 3; j++) {
    float at = hash11(seed * 17.0 + float(j) * 5.3);
    float since = fract(uPhase - at) * 10.0;
    burst += exp(-since * 7.0) * (0.75 + 0.45 * sin(since * 70.0));
  }
  return mix(1.0, steady + burst * 0.9, uFlicker);
}

float glow(float d, float width) {
  float reach = d / (width * 3.5);
  return width / (d + width * 0.08) / (1.0 + reach * reach);
}

vec2 gDrift;
float gWidth;
float gCore;
float gPixel;

vec3 bolt(
  vec2 p,
  vec2 offset,
  float seed,
  float pinned,
  float front,
  float strength,
  float branches,
  float blink,
  float branchGain,
  vec2 range,
  float heat,
  int octaves
) {
  vec2 q = p * uSize + gDrift + offset;
  float pin = pinned > 0.5 ? fbm(gDrift + offset, octaves) * WARP : 0.0;
  float warp = warpField(q, p.x - pin, 1.3 * max(1.0, uGlow), octaves) - pin;
  float crackle = heat > 0.001 ? heat * 0.012 * gnoise(q * 9.0 + vec2(41.0, 7.0), PERIOD * 9.0) : 0.0;
  float x = p.x + warp + crackle;
  float d = length(vec2(x, max(front - p.y, 0.0)));
  float energy = glow(d, gWidth * (1.0 + heat * 0.6)) * strength;
  float core = (1.0 - smoothstep(gCore - gPixel, gCore + gPixel, d)) * min(strength, 1.6);
  float line = glow(d, gWidth * 0.55) * strength;

  for (int k = 0; k < 6; k++) {
    float order = float(k) + 0.5;
    if (order > branches + heat * 2.0) break;
    float h = seed * 31.0 + float(k) * 13.7;
    float start = mix(range.x, range.y, hash11(h));
    float span = mix(0.22, 0.7, hash11(h + 3.0));
    if (pinned > 0.5) span = min(span, max(start - 0.04, 0.06));
    float along = (start - p.y) / span;
    if (along <= 0.0 || along >= 1.0) continue;
    float side = hash11(h + 1.0) > 0.5 ? 1.0 : -1.0;
    float slope = mix(0.35, 1.15, hash11(h + 2.0));
    float offset = x - side * slope * (start - p.y);
    if (abs(offset) - 0.12 * along > gWidth * 13.0) continue;
    float gain = branchGain;
    if (blink > 0.5) {
      float window = fract(uPhase * 3.0 + hash11(h + 4.0));
      float shown = smoothstep(0.0, 0.03, window) * (1.0 - smoothstep(0.3, 0.42, window));
      gain *= max(shown, heat * 0.8);
      if (gain <= 0.001) continue;
      gain *= flicker(seed + order);
    }
    if (gain <= 0.001) continue;
    vec2 jq = q * 3.0 + vec2(order * 11.0, order * 5.0);
    float jag = (gnoise(jq, PERIOD * 3.0) * 0.12 + gnoise(jq * 3.0 + vec2(5.0, 9.0), PERIOD * 9.0) * 0.035) * along;
    float bd = abs(offset - jag);
    float taper = pow(1.0 - along, 1.6) * smoothstep(0.0, 0.2, along) * smoothstep(front, front + 0.08, p.y);
    energy += glow(bd, gWidth * 0.4) * taper * gain;
    line += glow(bd, gWidth * 0.2) * taper * gain;
    core += (1.0 - smoothstep(gCore * 0.6 - gPixel, gCore * 0.6 + gPixel, bd)) * taper * min(gain, 1.0) * 0.8;
  }
  return vec3(energy, core, line);
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
  gPixel = 2.0 / uResolution.y;
  gDrift = vec2(PERIOD) * uPhase;
  gWidth = 0.07 * uGlow;
  gCore = 0.0032 * uThickness;
  float ca = cos(uAngle);
  float sa = sin(uAngle);
  mat2 turn = mat2(ca, -sa, sa, ca);
  vec2 local = turn * uv;
  vec2 pointer = turn * uPointer.xy;
  vec2 toPointer = uv - uPointer.xy;
  float heat = uPointer.z * exp(-dot(toPointer, toPointer) / 0.09);
  int octaves = uResolution.y > 1400.0 ? 8 : 7;

  float energy = 0.0;
  float core = 0.0;
  float line = 0.0;

  for (int b = 0; b < ${MAX_BOLTS}; b++) {
    if (b >= uBolts) break;
    float seed = float(b) * 7.13 + 0.37;
    float lane = uXOffset + (float(b) - 0.5 * float(uBolts - 1)) * uSpread;
    vec2 p = local - vec2(lane, 0.0);
    float near = exp(-pow(pointer.x - lane, 2.0) / 0.5);
    float lean = uPointer.z * uPointer.w * near * exp(-pow(p.y - pointer.y, 2.0) / 0.14);
    p.x -= lean * clamp(pointer.x - lane, -0.45, 0.45) * 0.55;
    float reveal = uIntro >= 1.0 ? 1.0 : smoothstep(0.0, 0.08, uv.y - (1.1 - 2.4 * uIntro));
    float strength = flicker(seed) * reveal * (1.0 + heat * 1.4) * (1.0 + uFlash);
    vec3 hit = bolt(
      p,
      vec2(float(b) * 3.0, float(b) * 5.0),
      seed,
      0.0,
      -1000.0,
      strength,
      uBranches * 6.0,
      1.0,
      reveal,
      vec2(-0.75, 0.9),
      heat,
      octaves
    );
    energy += hit.x;
    core += hit.y;
    line += hit.z;
  }

  for (int j = 0; j < ${MAX_STRIKES}; j++) {
    vec4 strike = uStrikes[j];
    if (strike.w <= 0.001) continue;
    vec4 info = uStrikeInfo[j];
    vec2 p = local - turn * strike.xy;
    if (p.y < strike.z - 1.6) continue;
    vec3 hit = bolt(
      p,
      vec2(info.x * 0.731, info.x * 1.377),
      info.x,
      1.0,
      strike.z,
      strike.w,
      uBranches * 6.0,
      0.0,
      strike.w,
      vec2(0.12, info.y),
      heat,
      octaves
    );
    energy += hit.x + info.z * strike.w * glow(length(p), gWidth * 0.5) * 0.12;
    core += hit.y;
    line += hit.z;
  }

  float e = energy * uIntensity * 0.6;
  float hot = clamp(core + smoothstep(6.0, 20.0, e) * 0.55, 0.0, 1.0);
  vec2 edge = min(gl_FragCoord.xy, uResolution - gl_FragCoord.xy) / (uResolution.y * max(uFade, 0.0001) * 0.5);
  float fade = uFade > 0.0 ? smoothstep(0.0, 1.0, edge.x) * smoothstep(0.0, 1.0, edge.y) : 1.0;

  vec3 rgb;
  float alpha;
  if (uLight > 0.5) {
    float stroke = smoothstep(1.0, 3.6, line * uIntensity);
    float halo = 1.0 - exp(-e * 0.35);
    vec3 ink = uColor * 0.82;
    alpha = clamp(stroke + halo * 0.15, 0.0, 1.0);
    rgb = mix(ink, vec3(1.0), hot * 0.85) * alpha;
  } else {
    vec3 lit = 1.0 - exp(-uColor * e * 0.9);
    rgb = mix(lit, vec3(1.0), hot);
    alpha = clamp(max(rgb.r, max(rgb.g, rgb.b)), 0.0, 1.0);
  }
  float keep = fade * uOpacity;
  outColor = vec4(rgb * keep, alpha * keep);
}
`;

interface LightningProps {
  color?: string;
  bolts?: number;
  spread?: number;
  branches?: number;
  xOffset?: number;
  angle?: number;
  size?: number;
  thickness?: number;
  glow?: number;
  intensity?: number;
  speed?: number;
  flicker?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  clickStrike?: boolean;
  intro?: boolean;
  fade?: number;
  opacity?: number;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

interface Strike {
  x: number;
  y: number;
  born: number;
  seed: number;
  reach: number;
}

const toRgb = (color: string): [number, number, number] => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color).trim());
  if (!match) return [0.5, 0.6, 1];
  const hex = match[1].length === 3 ? match[1].replace(/./g, digit => digit + digit) : match[1];
  return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255) as [number, number, number];
};

const smootherstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type) as WebGLShader;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const UNIFORMS = [
  'uResolution',
  'uPhase',
  'uColor',
  'uIntensity',
  'uSize',
  'uThickness',
  'uGlow',
  'uFlicker',
  'uBranches',
  'uXOffset',
  'uAngle',
  'uSpread',
  'uBolts',
  'uPointer',
  'uStrikes',
  'uStrikeInfo',
  'uFlash',
  'uIntro',
  'uLight',
  'uFade',
  'uOpacity'
];

const Lightning = ({
  color = '#4d6bff',
  bolts = 1,
  spread = 0.6,
  branches = 0.5,
  xOffset = 0,
  angle = 0,
  size = 1,
  thickness = 1,
  glow = 1,
  intensity = 1,
  speed = 1,
  flicker = 0.6,
  mouseInteraction = true,
  mouseStrength = 1,
  clickStrike = true,
  intro = true,
  fade = 0,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  style
}: LightningProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ refresh: () => void } | null>(null);
  const settings = {
    color,
    bolts,
    spread,
    branches,
    xOffset,
    angle,
    size,
    thickness,
    glow,
    intensity,
    speed,
    flicker,
    mouseInteraction,
    mouseStrength,
    clickStrike,
    intro,
    fade,
    opacity,
    lightMode,
    paused,
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    const uniforms = Object.fromEntries(UNIFORMS.map(name => [name, gl.getUniformLocation(program, name)]));
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const view = { width: 1, height: 1, left: 0, top: 0 };
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, presence: 0, inside: false };
    const strikes: Strike[] = Array.from({ length: MAX_STRIKES }, () => ({ x: 0, y: 0, born: -1, seed: 0, reach: 2 }));
    const strikeData = new Float32Array(MAX_STRIKES * 4);
    const infoData = new Float32Array(MAX_STRIKES * 4);
    let next = 0;
    let phase = 0.21;
    let introStart: number | null = settingsRef.current.intro && !reduced ? -1 : null;
    let visible = true;
    let raf = 0;
    let last = 0;
    let disposed = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(settingsRef.current.dpr ?? window.devicePixelRatio ?? 1, 2);
      view.width = Math.max(1, rect.width);
      view.height = Math.max(1, rect.height);
      view.left = rect.left;
      view.top = rect.top;
      const width = Math.max(1, Math.round(view.width * ratio));
      const height = Math.max(1, Math.round(view.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const toUv = (x: number, y: number): [number, number] => [
      (2 * x - view.width) / view.height,
      (view.height - 2 * y) / view.height
    ];

    const draw = (now: number) => {
      const s = settingsRef.current;
      const rgb = toRgb(s.color);
      let flash = 0;
      for (let j = 0; j < MAX_STRIKES; j++) {
        const strike = strikes[j];
        const age = strike.born < 0 ? -1 : (now - strike.born) / 1000;
        const base = j * 4;
        if (age < 0 || age > LIFE) {
          strikeData.fill(0, base, base + 4);
          infoData.fill(0, base, base + 4);
          continue;
        }
        const progress = Math.min(1, age / LEADER);
        const since = age - LEADER;
        let env = 0.45 + 0.35 * progress;
        if (since >= 0) {
          env = 1.8 * Math.exp(-since * 5.5) * (0.85 + 0.2 * Math.sin(since * 70));
          if (since > 0.17) env += Math.exp(-(since - 0.17) * 9);
          if (since > 0.33) env += 0.7 * Math.exp(-(since - 0.33) * 10);
          flash += 0.5 * Math.exp(-since * 9);
          if (since > 0.17) flash += 0.25 * Math.exp(-(since - 0.17) * 12);
        }
        env *= 1 - smootherstep((age - (LIFE - 0.4)) / 0.4);
        strikeData[base] = strike.x;
        strikeData[base + 1] = strike.y;
        strikeData[base + 2] = strike.reach * (1 - progress ** 1.6);
        strikeData[base + 3] = env;
        infoData[base] = strike.seed;
        infoData[base + 1] = strike.reach;
        infoData[base + 2] = since >= 0 ? 1 : 0;
        infoData[base + 3] = 0;
      }
      const introAmount = introStart === null ? 1 : introStart < 0 ? 0 : Math.min(1, (now - introStart) / 420);
      const [px, py] = toUv(pointer.x, pointer.y);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uPhase, phase);
      gl.uniform3f(uniforms.uColor, rgb[0], rgb[1], rgb[2]);
      gl.uniform1f(uniforms.uIntensity, Math.max(0, s.intensity));
      gl.uniform1f(uniforms.uSize, Math.max(0.05, s.size));
      gl.uniform1f(uniforms.uThickness, Math.max(0, s.thickness));
      gl.uniform1f(uniforms.uGlow, Math.max(0.01, s.glow));
      gl.uniform1f(uniforms.uFlicker, reduced ? 0 : Math.min(1, Math.max(0, s.flicker)));
      gl.uniform1f(uniforms.uBranches, Math.min(1, Math.max(0, s.branches)));
      gl.uniform1f(uniforms.uXOffset, s.xOffset);
      gl.uniform1f(uniforms.uAngle, (s.angle * Math.PI) / 180);
      gl.uniform1f(uniforms.uSpread, s.spread);
      gl.uniform1i(uniforms.uBolts, Math.min(MAX_BOLTS, Math.max(1, Math.round(s.bolts))));
      gl.uniform4f(uniforms.uPointer, px, py, pointer.presence, Math.max(0, s.mouseStrength));
      gl.uniform4fv(uniforms.uStrikes, strikeData);
      gl.uniform4fv(uniforms.uStrikeInfo, infoData);
      gl.uniform1f(uniforms.uFlash, Math.min(1, flash));
      gl.uniform1f(uniforms.uIntro, introAmount);
      gl.uniform1f(uniforms.uLight, s.lightMode ? 1 : 0);
      gl.uniform1f(uniforms.uFade, Math.min(1, Math.max(0, s.fade)));
      gl.uniform1f(uniforms.uOpacity, Math.min(1, Math.max(0, s.opacity)));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed || !visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (introStart !== null && introStart < 0) introStart = now;
      if (!s.paused && !reduced) phase = (phase + (dt * Math.max(0, s.speed)) / 10) % 1;
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / steps;
      for (let n = 0; n < steps; n++) {
        pointer.vx += (120 * (pointer.tx - pointer.x) - 19 * pointer.vx) * h;
        pointer.vy += (120 * (pointer.ty - pointer.y) - 19 * pointer.vy) * h;
        pointer.x += pointer.vx * h;
        pointer.y += pointer.vy * h;
      }
      const goal = s.mouseInteraction && pointer.inside && !reduced ? 1 : 0;
      pointer.presence += (goal - pointer.presence) * (1 - Math.exp(-dt / (goal > pointer.presence ? 0.3 : 0.55)));
      draw(now);
      const striking = strikes.some(strike => strike.born >= 0 && now - strike.born < LIFE * 1000 + 50);
      const introducing = introStart !== null && now - introStart < 450;
      const moving = !s.paused && !reduced && s.speed > 0;
      const settling = Math.abs(goal - pointer.presence) > 0.002 || Math.abs(pointer.vx) + Math.abs(pointer.vy) > 0.5;
      if (moving || striking || introducing || settling) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || disposed || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const locate = (event: PointerEvent): [number, number, boolean] => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return [x, y, x >= 0 && y >= 0 && x <= rect.width && y <= rect.height];
    };

    const onMove = (event: PointerEvent) => {
      const [x, y, inside] = locate(event);
      if (inside && !pointer.inside && pointer.presence < 0.02) {
        pointer.x = x;
        pointer.y = y;
        pointer.vx = pointer.vy = 0;
      }
      pointer.tx = x;
      pointer.ty = y;
      pointer.inside = inside;
      if (settingsRef.current.mouseInteraction) wake();
    };

    const onLeave = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointer.inside = false;
      wake();
    };

    const onDown = (event: PointerEvent) => {
      if (!settingsRef.current.clickStrike || reduced) return;
      const [x, y, inside] = locate(event);
      if (!inside) return;
      const [ux, uy] = toUv(x, y);
      const radians = (settingsRef.current.angle * Math.PI) / 180;
      const sa = Math.sin(radians);
      const ca = Math.cos(radians);
      const top = (view.width / view.height) * Math.abs(sa) + Math.abs(ca);
      const strike = strikes[next];
      next = (next + 1) % MAX_STRIKES;
      strike.x = ux;
      strike.y = uy;
      strike.reach = top - (-sa * ux + ca * uy) + 0.2;
      strike.born = performance.now();
      strike.seed = Math.random() * 100;
      wake();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerout', onLeave);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw(performance.now());
      wake();
    });
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    visibilityObserver.observe(canvas);

    const onVisibility = () => {
      if (!document.hidden) wake();
    };
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    draw(performance.now());
    wake();

    engineRef.current = {
      refresh: () => {
        resize();
        draw(performance.now());
        wake();
      }
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerout', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.refresh();
  }, [
    color,
    bolts,
    spread,
    branches,
    xOffset,
    angle,
    size,
    thickness,
    glow,
    intensity,
    speed,
    flicker,
    fade,
    opacity,
    lightMode,
    paused,
    dpr
  ]);

  return <canvas ref={canvasRef} className={`relative block h-full w-full ${className}`.trim()} style={style} />;
};

export default Lightning;
