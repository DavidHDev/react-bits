'use client';

import React, { useEffect, useRef } from 'react';
import './Strands.css';

interface StrandsProps {
  colors?: string[];
  count?: number;
  speed?: number;
  amplitude?: number;
  waviness?: number;
  thickness?: number;
  glow?: number;
  taper?: number;
  spread?: number;
  hueShift?: number;
  intensity?: number;
  saturation?: number;
  opacity?: number;
  scale?: number;
  glass?: boolean;
  refraction?: number;
  dispersion?: number;
  glassSize?: number;
  rim?: number;
  energy?: number;
  listening?: boolean;
  level?: number;
  interactive?: boolean;
  clickPulse?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  maxDevicePixelRatio?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface StrandsConfig {
  colors: string[];
  count: number;
  speed: number;
  amplitude: number;
  waviness: number;
  thickness: number;
  glow: number;
  taper: number;
  spread: number;
  hueShift: number;
  intensity: number;
  saturation: number;
  opacity: number;
  scale: number;
  glass: boolean;
  refraction: number;
  dispersion: number;
  glassSize: number;
  rim: number;
  energy: number;
  listening: boolean;
  level?: number;
  interactive: boolean;
  clickPulse: boolean;
  intro: boolean;
  lightMode: boolean;
  maxDevicePixelRatio: number;
}

const MAX_COLORS = 8;
const ROLES = 7;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform vec3 uMotion;
uniform float uLevel;
uniform vec3 uColors[8];
uniform int uCount;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uSaturation;
uniform float uScale;
uniform float uGlass;
uniform float uRadius;
uniform float uRefraction;
uniform float uDispersion;
uniform float uRim;
uniform vec2 uLean;
uniform float uIntro;
uniform float uPulse;
uniform float uLight;
uniform float uOpacity;

out vec4 fragColor;

const int NB = 10;
const float PI = 3.14159265;

vec3 hueRotate(vec3 c, float a) {
  const mat3 toYiq = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  const mat3 toRgb = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYiq * c;
  float ca = cos(a);
  float sa = sin(a);
  yiq.yz = mat2(ca, sa, -sa, ca) * yiq.yz;
  return max(toRgb * yiq, 0.0);
}

vec3 grade(vec3 c) {
  float g = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = clamp(mix(vec3(g), c, 1.5 * uSaturation), 0.0, 1.0);
  return hueRotate(c, uHueShift * 6.2831853);
}

vec3 lightInk(vec3 L, float halo, vec3 body) {
  vec3 Lg = grade(L);
  float lum = dot(Lg, vec3(0.2126, 0.7152, 0.0722));
  float cov = 1.0 - exp(-lum * 2.6);
  vec3 hue = Lg / max(max(Lg.r, max(Lg.g, Lg.b)), 1e-4);
  float white = pow(clamp(min(hue.r, min(hue.g, hue.b)), 0.0, 1.0), 1.4);
  vec3 ink = pow(hue, vec3(2.2)) * 0.88;
  float coreAmt = white * smoothstep(0.05, 2.2, lum) * 0.92;
  vec3 cream = mix(mix(uColors[3], vec3(1.0), 0.3), vec3(1.0, 0.985, 0.95), smoothstep(1.2, 3.5, lum));
  vec3 c = mix(body, vec3(0.66, 0.69, 0.76), halo * 0.32);
  c = mix(c, ink, cov * (1.0 - white));
  return mix(c, cream, clamp(coreAmt, 0.0, 1.0));
}

float sstep(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

float erfa(float x) {
  float a = abs(x);
  float t = 1.0 / (1.0 + 0.3275911 * a);
  float y = 1.0 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-a * a);
  return x < 0.0 ? -y : y;
}

vec3 grad4(vec3 c0, vec3 c1, vec3 c2, vec3 c3, float p1, float p2, float f) {
  vec3 c = mix(c0, c1, sstep(0.0, p1, f));
  c = mix(c, c2, sstep(p1, p2, f));
  return mix(c, c3, sstep(p2, 1.0, f));
}

float smaxk(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(a, b, h) + k * h * (1.0 - h);
}

vec2 sheetW(float tt, float H, float sig, float sigB, float ridges) {
  float ew = 0.04 * uThickness;
  float res0;
  float res1;
  for (int pass = 0; pass < 2; pass++) {
    float sg = pass == 0 ? sig : sigB;
    float fill = 0.5 * (erfa(tt / sg) - erfa((tt - H) / sg)) / H;
    float se = sqrt(sg * sg + 0.25 * ew * ew * H * H);
    float de = (tt - H + 0.5 * ew * H) / se;
    float eg = exp(-de * de) / (se * 1.7724539);
    float rgw = sqrt(sg * sg + 0.0025 * H * H);
    float d1 = (tt - 0.45 * H) / rgw;
    float d2 = (tt - 0.241 * H) / rgw;
    float rid = 0.04 * (exp(-d1 * d1) * step(1.5, ridges) + 0.7 * exp(-d2 * d2) * step(2.5, ridges)) / (rgw * 1.7724539);
    float v = 0.6 * fill * (1.0 - 0.55 * uLight) + (1.6 * ew * 0.886 * eg + rid) * (1.0 + 1.3 * uLight);
    if (pass == 0) res0 = v;
    else res1 = v;
  }
  return vec2(res0, res1);
}

float axis(float x) {
  float a = uAmplitude;
  return -0.2318 + uLean.y * 0.06 + (-0.2394 + uLean.x * 0.1) * x + 0.2815 * a * x * x + 0.3368 * a * x * x * x;
}

float softp(float z) {
  return 0.03 * log(1.0 + exp(clamp(z / 0.03, -60.0, 60.0)));
}

vec3 light(vec2 u, float fp, float bend, float level, out float halo) {
  float amp = level < 0.65 ? mix(0.25, 1.0, sstep(0.0, 0.65, level)) : mix(1.0, 1.12, (level - 0.65) / 0.35);
  float grow = clamp((amp - 0.25) / 0.75, 0.0, 1.25);
  float x = u.x / uScale;
  float uy = u.y;
  float ya = axis(x);
  float taper = max(uTaper, 0.05);
  float bx = 0.0437 + uMotion.z + uLean.x * 0.08;
  float bump = exp(-pow((x - bx) / (0.6879 * taper), 2.0));
  float hW = 0.02 + softp(-0.12 + 0.5324 * uAmplitude * grow * uMotion.y * bump - 0.02);
  float k = 1.0 * uWaviness;
  float cphi = cos(0.5 * PI + k * (x + 0.0664) + uMotion.x);
  float envC = (0.0886 + 0.3 * exp(-pow((x - 0.0634) / 0.6873, 2.0))) * uSpread * grow;
  float hC = -envC * tanh(cphi / 0.6);
  float th = 0.051 * uThickness * exp(-pow(cphi / 0.5, 2.0));
  float sig = sqrt(pow(0.005 + 0.05 * bend, 2.0) + fp * fp + th * th);
  float sigB = sqrt(0.0064 * max(uGlow, 0.05) * max(uGlow, 0.05) + fp * fp + th * th);
  float mend = exp(-pow(abs((x + 0.0421) / (0.4235 * taper)), 2.2689));
  vec3 red = uColors[0];
  vec3 orange = uColors[1];
  vec3 amber = uColors[2];
  vec3 warmWhite = uColors[3];
  vec3 cyan = uColors[4];
  vec3 blue = uColors[5];
  vec3 deep = uColors[6];
  vec3 orangeEdge = orange * vec3(1.0, 0.85, 0.77);
  vec3 coolCore = mix(warmWhite, vec3(1.0, 1.0, 0.7), 0.6);
  vec3 mint = clamp(mix(cyan, warmWhite, 0.35) * vec3(0.92, 1.05, 0.95), 0.0, 1.0);
  float ridges = float(uCount);
  float glow = max(uGlow, 0.0);
  vec3 L = vec3(0.0);
  vec3 Lb = vec3(0.0);
  {
    float H = max(abs(hW), 1e-4);
    float tt = uy - ya;
    vec2 w = sheetW(tt, H, sig, sigB, ridges);
    float f = clamp(tt / H, 0.0, 1.0);
    vec3 c = grad4(warmWhite, amber, orange, orangeEdge, 0.2351, 0.5643, f);
    c = mix(c, red, sstep(0.75, 1.0, f) * sstep(0.196, 0.3376, hW));
    vec3 mean = (grad4(warmWhite, amber, orange, orangeEdge, 0.2351, 0.5643, 0.1) + grad4(warmWhite, amber, orange, orangeEdge, 0.2351, 0.5643, 0.35) + grad4(warmWhite, amber, orange, orangeEdge, 0.2351, 0.5643, 0.6) + grad4(warmWhite, amber, orange, orangeEdge, 0.2351, 0.5643, 0.9)) * 0.25;
    L += mix(c, mean, sstep(0.3, 1.2, sig / H)) * (w.x * 0.2101 * mend);
    Lb += mix(c, mean, sstep(0.3, 1.2, sigB / H)) * (w.y * 0.2101 * mend);
  }
  {
    float H = max(abs(hC), 1e-4);
    float tt = (uy - ya) * (hC >= 0.0 ? 1.0 : -1.0);
    vec2 w = sheetW(tt, H, sig, sigB, 1.0);
    float f = clamp(tt / H, 0.0, 1.0);
    vec3 c = grad4(coolCore, cyan, blue, deep, 0.15, 0.7931, f);
    vec3 mean = (grad4(coolCore, cyan, blue, deep, 0.15, 0.7931, 0.1) + grad4(coolCore, cyan, blue, deep, 0.15, 0.7931, 0.35) + grad4(coolCore, cyan, blue, deep, 0.15, 0.7931, 0.6) + grad4(coolCore, cyan, blue, deep, 0.15, 0.7931, 0.9)) * 0.25;
    L += mix(c, mean, sstep(0.3, 1.2, sig / H)) * (w.x * 0.28 * mend);
    Lb += mix(c, mean, sstep(0.3, 1.2, sigB / H)) * (w.y * 0.28 * mend);
  }
  vec3 G = vec3(0.0);
  float wh = sqrt(0.0256 + envC * envC * cphi * cphi);
  float dg = (uy - ya) / wh;
  G += vec3(1.0, 0.97, 0.92) * (exp(-dg * dg) * 0.0315 / wh * mend * glow);
  float nx = -0.0664 - uMotion.x / k + 0.2168;
  float bxx = (x - nx) / 0.1849;
  float byy = (uy - axis(nx) - 0.0333) / (0.0544 * mix(0.7, 1.0, min(amp, 1.0)));
  G += mint * (exp(-bxx * bxx - byy * byy) * 1.4 * glow * sstep(0.0, 0.6, amp));
  float hb = (uy - ya - 0.3 * hW) / (0.07 + 0.45 * hW + 0.3 * envC);
  halo = exp(-hb * hb) * mend * smoothstep(0.0, 0.3, uIntro);
  vec3 total = L + 0.16 * glow * Lb + 1.16 * G;
  return total * 2.4 * uIntensity * smoothstep(0.0, 0.3, uIntro) * sstep(uIntro * 1.6, uIntro * 1.6 - 0.5, abs(x));
}

vec2 remap(vec2 p, float f, out float r, out float bend) {
  r = min(length(p), 0.9995);
  bend = pow(r, 5.17);
  float k = clamp(uRefraction, 0.0, 1.8);
  float sc = (1.0 - 0.278 * k * (1.0 - bend)) * (1.0 - 0.632 * k * bend) / (1.0 - 0.278 * k);
  return p * sc * f;
}

void main() {
  vec2 res = uResolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y);
  float level = clamp(uLevel, 0.0, 1.0);
  float appear = smoothstep(0.0, 0.35, uIntro);

  if (uGlass > 0.5) {
    float R = uRadius * mix(0.94, 1.0, uIntro) * (1.0 + 0.03 * uPulse);
    float px = 1.0 / (min(res.x, res.y) * R);
    vec2 pc = p / R;
    float rho = length(pc);
    if (rho > 1.0 + 2.0 * px) {
      float sh = uLight * 0.07 * exp(-pow((rho - 0.985) / 0.07, 2.0)) * smoothstep(-0.6, 0.4, -pc.y) * appear * uOpacity;
      fragColor = vec4(0.0, 0.0, 0.0, sh);
      return;
    }
    float r;
    float bend;
    vec2 u = remap(pc, 1.0, r, bend);
    float fp = 0.5 * max(length(dFdx(u)), length(dFdy(u)));
    float halo;
    float skip;
    vec3 L = light(u, fp, bend, level, halo);
    float ca = 0.02 * uDispersion * bend;
    if (ca > 0.0015) {
      float r2;
      float b2;
      L.r = light(remap(pc, 1.0 - ca, r2, b2), fp, bend, level, skip).r;
      L.b = light(remap(pc, 1.0 + ca, r2, b2), fp, bend, level, skip).b;
    }
    vec3 col = 1.0 - exp(-L);
    vec2 d = pc / max(rho, 1e-6);
    float key = 0.4 * pow(max(0.0, d.x * 0.94 - d.y * 0.34), 6.0) + 0.2 * pow(max(0.0, -d.x * 0.5 + d.y * 0.87), 6.0);
    float ring = exp(-pow((r - 0.985) / 0.011, 2.0));
    float hzk = 0.25 + 0.7 * pow(max(0.0, -d.x * 0.6 + d.y * 0.8), 2.0) + pow(max(0.0, d.x * 0.8 - d.y * 0.6), 2.0);
    float haze = exp(-pow((1.0 - r) / 0.09, 2.0)) * hzk * 0.13 * uRim;
    vec3 orb;
    if (uLight > 0.5) {
      float lz = dot(d * r, vec2(-0.55, 0.83));
      vec3 body = mix(vec3(0.885, 0.893, 0.915), vec3(0.972, 0.975, 0.983), 0.5 + 0.5 * lz);
      float fres = smoothstep(0.8, 1.0, r);
      body = mix(body, vec3(0.82, 0.83, 0.86), fres * fres * 0.5);
      orb = lightInk(L, halo, body);
      float spec = exp(-pow((r - 0.955) / 0.03, 2.0)) * pow(max(0.0, dot(d, vec2(-0.55, 0.83))), 3.0);
      orb = mix(orb, vec3(1.0), clamp(spec * 0.85 * uRim + haze * 0.6, 0.0, 1.0));
      float edge = exp(-pow((1.0 - r) / (0.01 + 1.2 * px), 2.0));
      orb *= 1.0 - 0.12 * edge;
    } else {
      orb = vec3(0.04) + col * (1.0 + 0.1 * bend * uRim) + ring * key * uRim * (1.0 + 0.4 * level) + haze * vec3(1.0, 1.02, 1.04);
      orb = grade(clamp(orb, 0.0, 1.0));
    }
    float inside = clamp((1.0 - rho) / px + 0.5, 0.0, 1.0) * appear;
    vec3 rgb = orb * inside;
    fragColor = vec4(rgb, max(inside * mix(0.92, 1.0, uLight), max(max(rgb.r, rgb.g), rgb.b))) * uOpacity;
  } else {
    float span = 0.5 * res.x / min(res.x, res.y);
    vec2 u = p * (0.78 / span) + vec2(0.0, -0.15);
    float fp = 0.5 * max(length(dFdx(u)), length(dFdy(u)));
    float halo;
    float fade = sstep(0.82, 0.55, abs(u.x));
    vec3 L = light(u, fp, 0.0, level, halo) * fade;
    vec3 col = grade(1.0 - exp(-L)) * appear;
    if (uLight > 0.5) {
      vec3 c = lightInk(L, halo * fade * 0.6, vec3(1.0));
      float a = clamp(1.0 - min(c.r, min(c.g, c.b)), 0.0, 1.0) * appear;
      fragColor = vec4((c - (1.0 - a)) * appear, a) * uOpacity;
    } else {
      fragColor = vec4(col, max(max(col.r, col.g), col.b)) * uOpacity;
    }
  }
}
`;

const hexToRgb = (hex: string): [number, number, number] => {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
  const v = parseInt(h.slice(0, 6), 16);
  if (!isFinite(v)) return [1, 1, 1];
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type) as WebGLShader;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const createProgram = (gl: WebGL2RenderingContext) => {
  const program = gl.createProgram() as WebGLProgram;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  return program;
};

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

const speech = (t: number) => {
  const phrase = smooth(-0.8, -0.3, 0.6 * Math.sin(t * 2.7) + 0.5 * Math.sin(t * 1.53 + 1.2));
  const syllable = Math.max(0, Math.sin(t * 17 + 1.6 * Math.sin(t * 5.3)));
  const stress = 0.6 + 0.4 * Math.sin(t * 3.7 + 0.7);
  return phrase * (0.35 + 0.65 * syllable) * (0.25 + stress);
};

const DEFAULT_COLORS = ['#d95b56', '#ba5046', '#ffa24c', '#ffe0b3', '#93f1ff', '#3569fa', '#193d9b'];

export default function Strands({
  colors = DEFAULT_COLORS,
  count = 3,
  speed = 1,
  amplitude = 1,
  waviness = 1,
  thickness = 1,
  glow = 1,
  taper = 1,
  spread = 1,
  hueShift = 0,
  intensity = 1,
  saturation = 1,
  opacity = 1,
  scale = 1,
  glass = true,
  refraction = 1,
  dispersion = 1,
  glassSize = 1,
  rim = 1,
  energy = 0.65,
  listening = false,
  level,
  interactive = true,
  clickPulse = true,
  intro = true,
  lightMode = false,
  maxDevicePixelRatio = 2,
  className = '',
  style
}: StrandsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef<StrandsConfig>({} as StrandsConfig);
  propsRef.current = {
    colors,
    count,
    speed,
    amplitude,
    waviness,
    thickness,
    glow,
    taper,
    spread,
    hueShift,
    intensity,
    saturation,
    opacity,
    scale,
    glass,
    refraction,
    dispersion,
    glassSize,
    rim,
    energy,
    listening,
    level,
    interactive,
    clickPulse,
    intro,
    lightMode,
    maxDevicePixelRatio
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;
    container.appendChild(canvas);

    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let loc: Record<string, WebGLUniformLocation | null> = {};
    const names = [
      'uResolution',
      'uMotion',
      'uLevel',
      'uColors',
      'uCount',
      'uAmplitude',
      'uWaviness',
      'uThickness',
      'uGlow',
      'uTaper',
      'uSpread',
      'uHueShift',
      'uIntensity',
      'uSaturation',
      'uScale',
      'uGlass',
      'uRadius',
      'uRefraction',
      'uDispersion',
      'uRim',
      'uLean',
      'uIntro',
      'uPulse',
      'uLight',
      'uOpacity'
    ];
    const setup = () => {
      const next = createProgram(gl);
      if (!next) return false;
      program = next;
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.useProgram(next);
      loc = Object.fromEntries(names.map(name => [name, gl.getUniformLocation(next, name)]));
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      return true;
    };
    if (!setup()) {
      canvas.remove();
      return;
    }

    const query =
      typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const st = {
      clock: 0,
      pace: 0,
      activity: 0,
      hover: 0,
      hoverTarget: 0,
      burst: 0,
      lean: [0, 0] as number[],
      leanTarget: [0, 0] as number[],
      pulse: 0,
      pulseV: 0,
      introStart: -1,
      intro: propsRef.current.intro ? 0 : 1,
      visible: typeof IntersectionObserver === 'undefined',
      lost: false,
      raf: 0,
      last: 0,
      width: 0,
      height: 0,
      speechT: 0,
      paletteKey: '',
      palette: { flat: new Float32Array(MAX_COLORS * 3), count: 1 }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, Math.max(0.5, propsRef.current.maxDevicePixelRatio));
      const w = Math.max(1, Math.round(container.clientWidth * dpr));
      const h = Math.max(1, Math.round(container.clientHeight * dpr));
      if (w !== st.width || h !== st.height) {
        st.width = w;
        st.height = h;
        canvas.width = w;
        canvas.height = h;
      }
    };

    const updatePalette = (list: string[]) => {
      const key = list.join(',');
      if (key === st.paletteKey) return;
      st.paletteKey = key;
      const rgb = (list.length ? list : DEFAULT_COLORS).slice(0, MAX_COLORS).map(hexToRgb);
      const flat = new Float32Array(MAX_COLORS * 3);
      for (let i = 0; i < ROLES; i++) {
        const t = rgb.length > 1 ? (i / (ROLES - 1)) * (rgb.length - 1) : 0;
        const a = Math.floor(t);
        const b = Math.min(a + 1, rgb.length - 1);
        const f = t - a;
        flat.set(
          rgb[a].map((c, k) => c + (rgb[b][k] - c) * f),
          i * 3
        );
      }
      st.palette = { flat, count: ROLES };
    };

    const draw = () => {
      if (st.lost || !program) return;
      const p = propsRef.current;
      updatePalette(Array.isArray(p.colors) ? p.colors : []);
      gl.viewport(0, 0, st.width, st.height);
      gl.uniform2f(loc.uResolution, st.width, st.height);
      const c = st.clock;
      const sway = 0.75 + 0.45 * st.pace;
      gl.uniform3f(
        loc.uMotion,
        (0.26 * Math.sin(0.53 * c) + 0.1 * Math.sin(1.19 * c + 1.3)) * sway,
        1 + (0.06 * Math.sin(0.71 * c) + 0.035 * Math.sin(1.37 * c + 0.4)) * sway,
        0.06 * Math.sin(0.41 * c + 2) * sway
      );
      gl.uniform1f(loc.uLevel, clamp(st.activity, 0, 1));
      gl.uniform3fv(loc.uColors, st.palette.flat);
      gl.uniform1i(loc.uCount, clamp(Math.round(p.count), 1, 3));
      gl.uniform1f(loc.uAmplitude, p.amplitude);
      gl.uniform1f(loc.uWaviness, p.waviness);
      gl.uniform1f(loc.uThickness, p.thickness);
      gl.uniform1f(loc.uGlow, p.glow);
      gl.uniform1f(loc.uTaper, Math.max(0.05, p.taper));
      gl.uniform1f(loc.uSpread, p.spread);
      gl.uniform1f(loc.uHueShift, p.hueShift);
      gl.uniform1f(loc.uIntensity, p.intensity);
      gl.uniform1f(loc.uSaturation, p.saturation);
      gl.uniform1f(loc.uScale, Math.max(0.05, p.scale));
      gl.uniform1f(loc.uGlass, p.glass ? 1 : 0);
      gl.uniform1f(loc.uRadius, 0.42 * p.glassSize);
      gl.uniform1f(loc.uRefraction, p.refraction);
      gl.uniform1f(loc.uDispersion, p.dispersion);
      gl.uniform1f(loc.uRim, p.rim);
      gl.uniform2f(loc.uLean, st.lean[0], st.lean[1]);
      gl.uniform1f(loc.uIntro, st.intro);
      gl.uniform1f(loc.uPulse, st.pulse);
      gl.uniform1f(loc.uLight, p.lightMode ? 1 : 0);
      gl.uniform1f(loc.uOpacity, p.opacity);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      st.raf = 0;
      const p = propsRef.current;
      const dt = st.last ? clamp((now - st.last) / 1000, 0, 0.05) : 0;
      st.last = now;
      const reduced = !!query?.matches;
      if (st.introStart < 0 && st.visible) st.introStart = now;
      if (p.intro && !reduced && st.introStart >= 0) {
        const t = clamp((now - st.introStart) / 1400, 0, 1);
        st.intro = 1 - Math.pow(1 - t, 3);
      } else {
        st.intro = 1;
      }
      st.hover += (st.hoverTarget - st.hover) * (1 - Math.exp(-dt / (st.hoverTarget > st.hover ? 0.25 : 0.6)));
      for (let i = 0; i < 2; i++) st.lean[i] += (st.leanTarget[i] - st.lean[i]) * (1 - Math.exp(-dt / 0.35));
      st.pulseV += (-170 * st.pulse - 14 * st.pulseV) * dt;
      st.pulse += st.pulseV * dt;
      st.burst *= Math.exp(-dt / 0.45);
      if (p.listening && !reduced) st.speechT += dt;
      const voice =
        typeof p.level === 'number' ? clamp(p.level, 0, 1) : p.listening && !reduced ? speech(st.speechT) : 0;
      const target = Math.min(1.2, Math.max(clamp(p.energy, 0, 1), voice) + st.hover * 0.18 + st.burst);
      st.activity += (target - st.activity) * (1 - Math.exp(-dt / (target > st.activity ? 0.12 : 0.4)));
      st.pace += (Math.min(1, st.activity) - st.pace) * (1 - Math.exp(-dt / 0.8));
      if (!reduced) {
        st.clock += dt * p.speed * (0.6 + 1.6 * st.pace);
      }
      draw();
      const settled =
        reduced &&
        Math.abs(st.activity - target) < 1e-3 &&
        Math.abs(st.pulse) < 1e-3 &&
        Math.abs(st.pulseV) < 1e-3 &&
        st.burst < 1e-3 &&
        Math.abs(st.hover - st.hoverTarget) < 1e-3 &&
        Math.abs(st.lean[0] - st.leanTarget[0]) < 1e-3 &&
        Math.abs(st.lean[1] - st.leanTarget[1]) < 1e-3;
      if (st.visible && !document.hidden && !st.lost && !settled) st.raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (!st.raf && st.visible && !st.lost) {
        st.last = 0;
        st.raf = requestAnimationFrame(frame);
      }
    };

    const local = (e: PointerEvent): [number, number] => {
      const r = container.getBoundingClientRect();
      const m = Math.min(r.width, r.height) || 1;
      return [(e.clientX - r.left - r.width / 2) / (m / 2), (e.clientY - r.top - r.height / 2) / (m / 2)];
    };

    const onMove = (e: PointerEvent) => {
      if (!propsRef.current.interactive) return;
      const [x, y] = local(e);
      st.hoverTarget = clamp(1.6 - Math.hypot(x, y), 0, 1);
      st.leanTarget = [clamp(x, -1.2, 1.2) * 0.8, clamp(-y, -1.2, 1.2) * 0.8];
      wake();
    };

    const onLeave = () => {
      st.hoverTarget = 0;
      st.leanTarget = [0, 0];
      wake();
    };

    const onDown = () => {
      if (!propsRef.current.clickPulse) return;
      st.pulseV += 5;
      st.burst = Math.min(1.2, st.burst + 0.9);
      wake();
    };

    const onLost = (e: Event) => {
      e.preventDefault();
      st.lost = true;
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
    };

    const onRestored = () => {
      st.lost = false;
      if (setup()) wake();
    };

    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerleave', onLeave);
    container.addEventListener('pointerdown', onDown);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(container);
    resize();

    let intersection: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersection = new IntersectionObserver(entries => {
        st.visible = entries[entries.length - 1].isIntersecting;
        if (st.visible) wake();
      });
      intersection.observe(container);
    }
    const onVisibility = () => {
      if (!document.hidden) wake();
    };
    document.addEventListener('visibilitychange', onVisibility);
    wake();

    return () => {
      if (st.raf) cancelAnimationFrame(st.raf);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('pointerdown', onDown);
      document.removeEventListener('visibilitychange', onVisibility);
      resizeObserver.disconnect();
      intersection?.disconnect();
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div ref={containerRef} className={`strands-container ${className}`.trim()} style={style} />;
}
