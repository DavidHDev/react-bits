'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

const FOV = 50;
const CAMERA_Z = 20;
const MAX_ASPECT = 1.5;
const MAX_SPEED = 16;
const STRIDE = 12;
const SLOP = 0.01;

export type BallpitMaterial = 'satin' | 'matte' | 'gloss' | 'frosted' | 'metal';

export interface BallpitProps {
  count?: number;
  colors?: Array<string | number>;
  material?: BallpitMaterial;
  minSize?: number;
  maxSize?: number;
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  bounce?: number;
  depth?: number;
  drift?: number;
  followCursor?: boolean;
  cursorSize?: number;
  grab?: boolean;
  clickEffect?: 'burst' | 'none';
  lightColor?: string;
  lightIntensity?: number;
  exposure?: number;
  shadows?: number;
  intro?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

interface Material {
  roughness: number;
  metalness: number;
  coat: number;
  coatRoughness: number;
  scatter: number;
  frost: number;
}

const MATERIALS: Record<string, Material> = {
  satin: { roughness: 0.42, metalness: 0, coat: 0.35, coatRoughness: 0.22, scatter: 1, frost: 0 },
  matte: { roughness: 0.92, metalness: 0, coat: 0, coatRoughness: 0.5, scatter: 0.5, frost: 0 },
  gloss: { roughness: 0.2, metalness: 0, coat: 1, coatRoughness: 0.08, scatter: 1, frost: 0 },
  frosted: { roughness: 0.55, metalness: 0, coat: 0.6, coatRoughness: 0.18, scatter: 1.5, frost: 1 },
  metal: { roughness: 0.3, metalness: 1, coat: 0, coatRoughness: 0.2, scatter: 0, frost: 0 }
};

const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aSphere;
layout(location = 2) in vec4 aColor;
layout(location = 3) in vec4 aShade;
uniform mat4 uProj;
uniform float uCameraZ;
uniform float uPixel;
out vec3 vPoint;
flat out vec3 vCenter;
flat out float vRadius;
flat out vec4 vColor;
flat out vec4 vShade;
void main() {
  vec3 c = vec3(aSphere.xy, aSphere.z - uCameraZ);
  float r = aSphere.w;
  float d = length(c);
  vec3 toCamera = -c / d;
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCamera));
  vec3 up = cross(toCamera, right);
  float reach = r * d / sqrt(max(d * d - r * r, 1e-4)) + uPixel * d * 2.0;
  vec3 p = c + (right * aCorner.x + up * aCorner.y) * reach;
  vPoint = p;
  vCenter = c;
  vRadius = r;
  vColor = aColor;
  vShade = aShade;
  gl_Position = uProj * vec4(p, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec3 vPoint;
flat in vec3 vCenter;
flat in float vRadius;
flat in vec4 vColor;
flat in vec4 vShade;
uniform mat4 uProj;
uniform vec3 uLightPos;
uniform vec3 uLight;
uniform float uExposure;
uniform float uShadow;
uniform vec4 uSurface;
uniform vec2 uExtra;
out vec4 outColor;

const float PI = 3.14159265;

float lobe(vec3 d, vec3 axis, float sharp) {
  return pow(max(dot(d, axis), 0.0), sharp) * (sharp + 1.0) * 0.16;
}

vec3 studio(vec3 d, float rough) {
  float r = clamp(rough, 0.0, 1.0);
  float sharp = mix(60.0, 1.2, sqrt(r));
  vec3 col = mix(vec3(0.085, 0.085, 0.09), vec3(0.38, 0.38, 0.39), smoothstep(-0.7, 0.9, d.y));
  col += vec3(1.0, 0.99, 0.97) * 2.6 * lobe(d, normalize(vec3(-0.42, 0.78, 0.47)), sharp);
  col += vec3(0.97, 0.98, 1.0) * 1.1 * lobe(d, normalize(vec3(0.78, 0.22, 0.58)), sharp * 0.7);
  col += vec3(1.0) * 1.3 * lobe(d, normalize(vec3(0.15, 0.55, -0.82)), sharp * 0.8);
  return col;
}

vec2 envBRDF(float NoV, float rough) {
  vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
  vec4 c1 = vec4(1.0, 0.0425, 1.04, -0.04);
  vec4 r = rough * c0 + c1;
  float a = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;
  return vec2(-1.04, 1.04) * a + r.zw;
}

float ggx(float NoH, float a) {
  float a2 = a * a;
  float d = NoH * NoH * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

float smith(float NoV, float NoL, float a) {
  float k = a * 0.5;
  return 0.25 / max((NoV * (1.0 - k) + k) * (NoL * (1.0 - k) + k), 1e-4);
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 rd = normalize(vPoint);
  float b = dot(vCenter, rd);
  float h = length(vCenter - rd * b);
  float r = vRadius;
  float aa = max(fwidth(h), 1e-5);
  float cover = clamp((r - h) / aa + 0.5, 0.0, 1.0);
  if (cover <= 0.002) discard;
  float hc = min(h, r * 0.9995);
  float t = b - sqrt(r * r - hc * hc);
  vec3 pos = rd * t;
  vec3 n = normalize(pos - vCenter);
  vec4 clip = uProj * vec4(pos, 1.0);
  gl_FragDepth = clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);

  vec3 v = -rd;
  vec3 albedo = vColor.rgb;
  bool lamp = vColor.a > 0.5;
  vec3 dn = fwidth(n);
  float rough = sqrt(min(uSurface.x * uSurface.x + dot(dn, dn) * 0.6, 1.0));
  float metal = uSurface.y;
  float coat = uSurface.z;
  float coatRough = sqrt(min(uSurface.w * uSurface.w + dot(dn, dn) * 0.6, 1.0));
  float NoV = clamp(dot(n, v), 1e-4, 1.0);
  vec3 R = reflect(-v, n);

  float occlusion = vShade.w * smoothstep(-0.15, 0.9, dot(n, vShade.xyz));
  float ao = 1.0 - uShadow * occlusion;
  float specAo = 1.0 - uShadow * occlusion * 0.7;

  vec3 L = uLightPos - pos;
  float dist2 = dot(L, L);
  L *= inversesqrt(dist2);
  vec3 radiance = lamp ? vec3(0.0) : uLight / (dist2 + 1.0);
  float NoL = clamp(dot(n, L), 0.0, 1.0);
  vec3 H = normalize(L + v);
  float NoH = clamp(dot(n, H), 0.0, 1.0);
  float VoH = clamp(dot(v, H), 0.0, 1.0);

  vec3 F0 = mix(vec3(0.04), albedo, metal);
  vec2 ab = envBRDF(NoV, rough);
  vec3 Fr = max(vec3(1.0 - rough), F0) - F0;
  vec3 kS = F0 + Fr * pow(1.0 - NoV, 5.0);
  vec3 diffuseColor = albedo * (1.0 - metal);
  vec3 irradiance = studio(n, 1.0) * 1.15;
  vec3 envSpec = studio(R, rough) * (F0 * ab.x + ab.y);
  vec3 col = diffuseColor * irradiance * (1.0 - kS) * ao + envSpec * specAo;
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - VoH, 5.0);
  float a = max(rough * rough, 0.06);
  vec3 spec = ggx(NoH, a) * smith(NoV, NoL, a) * F;
  float wrap = clamp((dot(n, L) + 0.3) / 1.3, 0.0, 1.0);
  col += (diffuseColor * (1.0 - F) / PI * wrap + spec * NoL) * radiance;
  vec3 sh = normalize(L + n * 0.1);
  float scatter = pow(clamp(dot(v, -sh), 0.0, 1.0), 2.0) * 10.0 + 0.04;
  col += scatter * albedo * radiance * 0.03 * uExtra.x;
  float alpha = 1.0;
  if (uExtra.y > 0.5) {
    float rim = pow(1.0 - NoV, 2.5);
    col += albedo * (studio(-R, 1.0) * 0.35 + 0.06) * (1.0 - rim);
    col += radiance * albedo * pow(max(dot(-v, L), 0.0), 3.0) * 0.08;
    alpha = mix(0.5, 0.96, rim);
  }
  if (coat > 0.0) {
    float Fc = 0.04 + 0.96 * pow(1.0 - NoV, 5.0);
    float ca = max(coatRough * coatRough, 0.03);
    vec3 coatEnv = studio(R, coatRough) * Fc;
    float coatSpec = ggx(NoH, ca) * smith(NoV, NoL, ca) * (0.04 + 0.96 * pow(1.0 - VoH, 5.0)) * NoL;
    col = col * (1.0 - Fc * coat) + (coatEnv * specAo + radiance * coatSpec) * coat;
    alpha = mix(alpha, 1.0, Fc * coat);
  }
  if (lamp) col += uLight * 0.0025 * (0.4 + 0.6 * albedo);
  col = aces(col * uExposure);
  col = pow(col, vec3(1.0 / 2.2));
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  float a2 = alpha * cover;
  outColor = vec4(col * a2, a2);
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

const link = (gl: WebGL2RenderingContext) => {
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
  const total = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < total; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const toLinear = (value: string | number): number[] => {
  let rgb: number[];
  if (typeof value === 'number') {
    rgb = [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
  } else {
    let hex = String(value || '#ffffff')
      .replace('#', '')
      .trim();
    if (hex.length === 3 || hex.length === 4)
      hex = hex
        .slice(0, 3)
        .split('')
        .map(c => c + c)
        .join('');
    const num = parseInt(hex.slice(0, 6), 16);
    rgb = Number.isNaN(num) ? [1, 1, 1] : [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
  }
  return rgb.map(c => Math.pow(c, 2.2));
};

const Ballpit = ({
  count = 200,
  colors = ['#ffffff'],
  material = 'satin',
  minSize = 0.5,
  maxSize = 1,
  gravity = 0.5,
  friction = 0.9975,
  wallBounce = 0.95,
  bounce = 0.85,
  depth = 2,
  drift = 0,
  followCursor = true,
  cursorSize = 1,
  grab = true,
  clickEffect = 'burst',
  lightColor = '#ffffff',
  lightIntensity = 1,
  exposure = 1,
  shadows = 0.6,
  intro = true,
  dpr,
  className = '',
  style
}: BallpitProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings = {
    count: Math.round(clamp(count, 1, 4000)),
    colors: Array.isArray(colors) && colors.length ? colors : ['#ffffff'],
    material: MATERIALS[material] ? material : 'satin',
    minSize: Math.max(0.05, Math.min(minSize, maxSize)),
    maxSize: Math.max(0.05, Math.max(minSize, maxSize)),
    gravity,
    friction: clamp(friction, 0.5, 1),
    wallBounce: clamp(wallBounce, 0, 1),
    bounce: clamp(bounce, 0, 1),
    depth: Math.max(0, depth),
    drift: Math.max(0, drift),
    followCursor,
    cursorSize: Math.max(0, cursorSize),
    grab,
    clickEffect,
    lightColor,
    lightIntensity: lightIntensity > 20 ? lightIntensity / 200 : Math.max(0, lightIntensity),
    exposure: Math.max(0, exposure),
    shadows: clamp(shadows, 0, 1),
    intro,
    dpr
  };
  type Settings = typeof settings;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: true,
      stencil: false,
      powerPreference: 'high-performance'
    });
    if (!container || !canvas || !gl) return undefined;
    const shader = link(gl);
    if (!shader) return undefined;
    const u = shader.uniforms;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const view = { width: 1, height: 1, ratio: 1, halfW: 9, halfH: 9, fit: 1, tan: Math.tan((FOV * Math.PI) / 360) };
    const projection = new Float32Array(16);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const instances = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instances);
    for (let k = 0; k < 3; k++) {
      gl.enableVertexAttribArray(1 + k);
      gl.vertexAttribPointer(1 + k, 4, gl.FLOAT, false, STRIDE * 4, k * 16);
      gl.vertexAttribDivisor(1 + k, 1);
    }
    gl.bindVertexArray(null);

    let capacity = 0;
    let n = 0;
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let pz = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let vz = new Float32Array(0);
    let rad = new Float32Array(0);
    let inv = new Float32Array(0);
    let size = new Float32Array(0);
    let phase = new Float32Array(0);
    let occ = new Float32Array(0);
    let still = new Float32Array(0);
    let tone = new Uint16Array(0);
    let entered = new Uint8Array(0);
    let cellOf = new Int32Array(0);
    let sorted = new Int32Array(0);
    let order = new Int32Array(1);
    let data = new Float32Array(STRIDE);
    let table = new Int32Array(2);
    let starts = new Int32Array(2);
    let palette: number[][] = [];
    let paletteKey = '';
    let lastSizes = '';

    const allocate = (total: number) => {
      const grow = (old: Float32Array, width = 1) => {
        const next = new Float32Array(total * width);
        next.set(old.subarray(0, Math.min(old.length, next.length)));
        return next;
      };
      const growUint8 = (old: Uint8Array) => {
        const next = new Uint8Array(total);
        next.set(old.subarray(0, Math.min(old.length, next.length)));
        return next;
      };
      px = grow(px);
      py = grow(py);
      pz = grow(pz);
      vx = grow(vx);
      vy = grow(vy);
      vz = grow(vz);
      rad = grow(rad);
      inv = grow(inv);
      size = grow(size);
      phase = grow(phase);
      occ = grow(occ, 4);
      still = grow(still, 3);
      const nextTone = new Uint16Array(total);
      nextTone.set(tone.subarray(0, Math.min(tone.length, total)));
      tone = nextTone;
      entered = growUint8(entered);
      cellOf = new Int32Array(total);
      sorted = new Int32Array(total);
      order = new Int32Array(total + 1);
      data = new Float32Array((total + 1) * STRIDE);
      capacity = total;
      gl.bindBuffer(gl.ARRAY_BUFFER, instances);
      gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
    };

    const pointer = { x: 0, y: 0, inside: false, down: false, downX: 0, downY: 0, downAt: 0, moved: false };
    const cursor = { x: 0, y: 0, z: 0, r: 0, tx: 0, ty: 0, vx: 0, vy: 0 };
    const light = { x: 0, y: 5, z: 6, flash: 0 };
    const held = { index: -1, ox: 0, oy: 0, tx: 0, ty: 0, vx: 0, vy: 0 };
    let elapsed = 0;
    let glide = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let quiet = 0;

    const spawn = (i: number, s: Settings, fromTop: boolean) => {
      const r = rad[i];
      const zr = Math.max(s.depth - r, 0);
      entered[i] = 1;
      if (fromTop && s.gravity > 0.05) {
        px[i] = (Math.random() * 2 - 1) * Math.max(view.halfW - r, 0.01);
        py[i] = view.halfH + r + Math.random() * view.halfH * 2.2;
        pz[i] = (Math.random() * 2 - 1) * zr;
        vx[i] = (Math.random() - 0.5) * 2;
        vy[i] = -(4 + Math.random() * 5);
        vz[i] = 0;
        entered[i] = 0;
      } else if (fromTop) {
        const tx = (Math.random() * 2 - 1) * Math.max(view.halfW - r, 0.01);
        const ty = (Math.random() * 2 - 1) * Math.max(view.halfH - r, 0.01);
        const tz = (Math.random() * 2 - 1) * zr;
        px[i] = (Math.random() * 2 - 1) * 0.6;
        py[i] = (Math.random() * 2 - 1) * 0.6;
        pz[i] = (Math.random() * 2 - 1) * Math.min(zr, 0.3);
        vx[i] = (tx - px[i]) * 2.2;
        vy[i] = (ty - py[i]) * 2.2;
        vz[i] = (tz - pz[i]) * 2.2;
        glide = 1;
      } else {
        px[i] = (Math.random() * 2 - 1) * Math.max(view.halfW - r, 0.01);
        py[i] = (Math.random() * 2 - 1) * Math.max(view.halfH - r, 0.01);
        pz[i] = (Math.random() * 2 - 1) * zr;
        vx[i] = 0;
        vy[i] = 0;
        vz[i] = 0;
      }
    };

    const applySizes = (s: Settings) => {
      for (let i = 0; i < n; i++) {
        rad[i] = (s.minSize + size[i] * (s.maxSize - s.minSize)) * view.fit;
        inv[i] = 1 / (rad[i] * rad[i] * rad[i]);
      }
    };

    const applyPalette = (s: Settings) => {
      palette = s.colors.map(toLinear);
      paletteKey = s.colors.join('|');
    };

    const sync = (s: Settings, first: boolean) => {
      const key = `${s.minSize}:${s.maxSize}:${view.fit}`;
      if (s.count !== n) {
        if (s.count > capacity) allocate(Math.max(s.count, Math.ceil(capacity * 1.5)));
        const from = n;
        n = s.count;
        for (let i = from; i < n; i++) {
          size[i] = Math.random();
          tone[i] = i;
          phase[i] = Math.random() * Math.PI * 2;
          rad[i] = (s.minSize + size[i] * (s.maxSize - s.minSize)) * view.fit;
          inv[i] = 1 / (rad[i] * rad[i] * rad[i]);
          spawn(i, s, (first ? s.intro : true) && !reduce);
        }
        for (let i = 0; i <= n; i++) order[i] = i;
      }
      if (key !== lastSizes) {
        lastSizes = key;
        applySizes(s);
      }
      if (s.colors.join('|') !== paletteKey) applyPalette(s);
    };

    let contacts = new Float32Array(0);
    let contactCount = 0;

    const grid = { scale: 1, x0: 0, y0: 0, z0: 0, nx: 1, ny: 1, nz: 1 };

    const buildGrid = (cell: number, s: Settings) => {
      grid.scale = 1 / cell;
      grid.x0 = -view.halfW - cell;
      grid.y0 = -view.halfH - cell;
      grid.z0 = -Math.max(s.depth, s.maxSize) - cell;
      grid.nx = Math.max(1, Math.ceil((view.halfW * 2 + cell * 2) * grid.scale) + 1);
      grid.ny = Math.max(1, Math.ceil((view.halfH * 2 + cell * 2) * grid.scale) + 1);
      grid.nz = Math.max(1, Math.ceil((Math.max(s.depth, s.maxSize) * 2 + cell * 2) * grid.scale) + 1);
      const cells = grid.nx * grid.ny * grid.nz;
      if (table.length < cells + 1) {
        table = new Int32Array(cells + 1);
        starts = new Int32Array(cells + 1);
      }
      table.fill(0, 0, cells + 1);
      for (let i = 0; i < n; i++) {
        const cx = clamp(Math.floor((px[i] - grid.x0) * grid.scale), 0, grid.nx - 1);
        const cy = clamp(Math.floor((py[i] - grid.y0) * grid.scale), 0, grid.ny - 1);
        const cz = clamp(Math.floor((pz[i] - grid.z0) * grid.scale), 0, grid.nz - 1);
        const c = (cz * grid.ny + cy) * grid.nx + cx;
        cellOf[i] = c;
        table[c + 1]++;
      }
      for (let c = 1; c <= cells; c++) table[c] += table[c - 1];
      starts.set(table.subarray(0, cells + 1));
      for (let i = 0; i < n; i++) sorted[starts[cellOf[i]]++] = i;
    };

    const wall = (i: number, gap: number, nx: number, ny: number, nz: number, bounce: number, margin: number) => {
      if (gap >= margin || contactCount * 8 >= contacts.length) return;
      const approach = vx[i] * nx + vy[i] * ny + vz[i] * nz;
      const o = contactCount * 8;
      contacts[o] = i;
      contacts[o + 1] = -2;
      contacts[o + 2] = nx;
      contacts[o + 3] = ny;
      contacts[o + 4] = nz;
      contacts[o + 5] = gap;
      contacts[o + 6] = approach < -1.5 ? -bounce * approach : 0;
      contacts[o + 7] = 0;
      contactCount++;
    };

    const findContacts = (s: Settings, dt: number, shade: boolean, margin: number) => {
      const heldIndex = held.index;
      const { nx: gx, ny: gy, nz: gz } = grid;
      contactCount = 0;
      for (let i = 0; i < n; i++) {
        const c = cellOf[i];
        const cx = c % gx;
        const cy = Math.floor(c / gx) % gy;
        const cz = Math.floor(c / (gx * gy));
        for (let dz = cz > 0 ? -1 : 0; dz <= (cz < gz - 1 ? 1 : 0); dz++) {
          for (let dy = cy > 0 ? -1 : 0; dy <= (cy < gy - 1 ? 1 : 0); dy++) {
            const row = ((cz + dz) * gy + cy + dy) * gx;
            for (let dx = cx > 0 ? -1 : 0; dx <= (cx < gx - 1 ? 1 : 0); dx++) {
              const cell = row + cx + dx;
              for (let k = table[cell]; k < table[cell + 1]; k++) {
                const j = sorted[k];
                if (j <= i) continue;
                const ddx = px[j] - px[i];
                const ddy = py[j] - py[i];
                const ddz = pz[j] - pz[i];
                const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
                const sum = rad[i] + rad[j];
                const reach = Math.max(sum + margin, shade ? sum * 1.4 : 0);
                if (d2 >= reach * reach || d2 < 1e-12) continue;
                const d = Math.sqrt(d2);
                const nx = ddx / d;
                const ny = ddy / d;
                const nz = ddz / d;
                if (shade) {
                  const w = clamp(1 - (d - sum) / (sum * 0.4), 0, 1);
                  occ[i * 4] += nx * w;
                  occ[i * 4 + 1] += ny * w;
                  occ[i * 4 + 2] += nz * w;
                  occ[i * 4 + 3] += w;
                  occ[j * 4] -= nx * w;
                  occ[j * 4 + 1] -= ny * w;
                  occ[j * 4 + 2] -= nz * w;
                  occ[j * 4 + 3] += w;
                }
                if (d >= sum + margin || contactCount * 8 >= contacts.length) continue;
                if (i === heldIndex && j === heldIndex) continue;
                const approach = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny + (vz[j] - vz[i]) * nz;
                const o = contactCount * 8;
                contacts[o] = i;
                contacts[o + 1] = j;
                contacts[o + 2] = nx;
                contacts[o + 3] = ny;
                contacts[o + 4] = nz;
                contacts[o + 5] = d - sum;
                contacts[o + 6] = approach < -1.5 ? -s.bounce * approach : 0;
                contacts[o + 7] = 0;
                contactCount++;
              }
            }
          }
        }
        if (i !== heldIndex) {
          const r = rad[i];
          const zr = Math.max(s.depth - r, 0);
          wall(i, px[i] + view.halfW - r, 1, 0, 0, s.wallBounce, margin);
          wall(i, view.halfW - r - px[i], -1, 0, 0, s.wallBounce, margin);
          wall(i, py[i] + view.halfH - r, 0, 1, 0, s.wallBounce, margin);
          if (entered[i]) wall(i, view.halfH - r - py[i], 0, -1, 0, s.wallBounce, margin);
          wall(i, pz[i] + zr, 0, 0, 1, s.wallBounce, margin);
          wall(i, zr - pz[i], 0, 0, -1, s.wallBounce, margin);
        }
        if (cursor.r > 0.01 && i !== heldIndex && contactCount * 8 < contacts.length) {
          const ddx = px[i] - cursor.x;
          const ddy = py[i] - cursor.y;
          const ddz = pz[i] - cursor.z;
          const sum = rad[i] + cursor.r;
          const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
          if (d2 < (sum + margin) * (sum + margin) && d2 > 1e-12) {
            const d = Math.sqrt(d2);
            const nx = ddx / d;
            const ny = ddy / d;
            const nz = ddz / d;
            const approach = (vx[i] - cursor.vx) * nx + (vy[i] - cursor.vy) * ny + vz[i] * nz;
            const o = contactCount * 8;
            contacts[o] = i;
            contacts[o + 1] = -1;
            contacts[o + 2] = nx;
            contacts[o + 3] = ny;
            contacts[o + 4] = nz;
            contacts[o + 5] = d - sum;
            contacts[o + 6] = approach < -1.5 ? -s.bounce * approach : 0;
            contacts[o + 7] = 0;
            contactCount++;
          }
        }
      }
    };

    const solveVelocities = (dt: number) => {
      const heldIndex = held.index;
      const iterations = n > 800 ? 5 : 8;
      for (let iteration = 0; iteration < iterations; iteration++) {
        for (let c = 0; c < contactCount; c++) {
          const o = c * 8;
          const i = contacts[o];
          const j = contacts[o + 1];
          const nx = contacts[o + 2];
          const ny = contacts[o + 3];
          const nz = contacts[o + 4];
          const gap = contacts[o + 5];
          const target = gap > 0 ? -gap / dt : contacts[o + 6];
          const before = contacts[o + 7];
          if (j < 0) {
            const vn =
              j === -1
                ? (vx[i] - cursor.vx) * nx + (vy[i] - cursor.vy) * ny + vz[i] * nz
                : vx[i] * nx + vy[i] * ny + vz[i] * nz;
            const after = Math.max(before + target - vn, 0);
            const change = after - before;
            contacts[o + 7] = after;
            vx[i] += change * nx;
            vy[i] += change * ny;
            vz[i] += change * nz;
            continue;
          }
          const wi = i === heldIndex ? 0 : inv[i];
          const wj = j === heldIndex ? 0 : inv[j];
          const w = wi + wj;
          if (w <= 0) continue;
          const vn = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny + (vz[j] - vz[i]) * nz;
          const after = Math.max(before + (target - vn) / w, 0);
          const change = after - before;
          contacts[o + 7] = after;
          vx[i] -= change * wi * nx;
          vy[i] -= change * wi * ny;
          vz[i] -= change * wi * nz;
          vx[j] += change * wj * nx;
          vy[j] += change * wj * ny;
          vz[j] += change * wj * nz;
        }
      }
    };

    const correctPositions = () => {
      const heldIndex = held.index;
      for (let pass = 0; pass < 2; pass++) {
        for (let c = 0; c < contactCount; c++) {
          const o = c * 8;
          const i = contacts[o];
          const j = contacts[o + 1];
          if (j === -2) continue;
          if (j < 0) {
            const ddx = px[i] - cursor.x;
            const ddy = py[i] - cursor.y;
            const ddz = pz[i] - cursor.z;
            const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
            const overlap = rad[i] + cursor.r - d - SLOP;
            if (overlap <= 0 || d < 1e-6) continue;
            const k = (overlap * 0.5) / d;
            px[i] += ddx * k;
            py[i] += ddy * k;
            pz[i] += ddz * k;
            continue;
          }
          const ddx = px[j] - px[i];
          const ddy = py[j] - py[i];
          const ddz = pz[j] - pz[i];
          const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
          const overlap = rad[i] + rad[j] - d - SLOP;
          if (overlap <= 0 || d < 1e-6) continue;
          const wi = i === heldIndex ? 0 : inv[i];
          const wj = j === heldIndex ? 0 : inv[j];
          const w = wi + wj;
          if (w <= 0) continue;
          const k = (overlap * 0.3) / (d * w);
          px[i] -= ddx * k * wi;
          py[i] -= ddy * k * wi;
          pz[i] -= ddz * k * wi;
          px[j] += ddx * k * wj;
          py[j] += ddy * k * wj;
          pz[j] += ddz * k * wj;
        }
      }
    };

    const walls = (s: Settings) => {
      const hw = view.halfW;
      const hh = view.halfH;
      const e = s.wallBounce;
      for (let i = 0; i < n; i++) {
        const r = rad[i];
        if (px[i] < -hw + r) {
          px[i] = -hw + r;
          if (vx[i] < 0) vx[i] = vx[i] < -1.5 ? -vx[i] * e : 0;
        } else if (px[i] > hw - r) {
          px[i] = hw - r;
          if (vx[i] > 0) vx[i] = vx[i] > 1.5 ? -vx[i] * e : 0;
        }
        if (py[i] < -hh + r) {
          py[i] = -hh + r;
          if (vy[i] < 0) vy[i] = vy[i] < -1.5 ? -vy[i] * e : 0;
          vx[i] *= 0.995;
          vz[i] *= 0.995;
        } else if (entered[i] && py[i] > hh - r) {
          py[i] = hh - r;
          if (vy[i] > 0) vy[i] = vy[i] > 1.5 ? -vy[i] * e : 0;
        }
        if (!entered[i] && py[i] < hh - r) entered[i] = 1;
        const zr = Math.max(s.depth - r, 0);
        if (pz[i] < -zr) {
          pz[i] = -zr;
          if (vz[i] < 0) vz[i] = vz[i] < -1.5 ? -vz[i] * e : 0;
        } else if (pz[i] > zr) {
          pz[i] = zr;
          if (vz[i] > 0) vz[i] = vz[i] > 1.5 ? -vz[i] * e : 0;
        }
      }
    };

    const step = (s: Settings, dt: number, shade: boolean) => {
      const g = s.gravity * 45;
      const damp = Math.pow(s.friction, dt * 60) * (glide > 0 ? Math.exp(-2.2 * dt) : 1);
      const wander = reduce ? 0 : s.drift * 2.2;
      const biggest = s.maxSize * view.fit;
      const margin = biggest * 0.3;
      if (contacts.length < n * 96) contacts = new Float32Array(n * 96);
      for (let i = 0; i < n; i++) {
        if (i === held.index) {
          const f = 1 - Math.exp(-dt / 0.02);
          vx[i] = ((held.tx - px[i]) * f) / dt;
          vy[i] = ((held.ty - py[i]) * f) / dt;
          vz[i] = 0;
          continue;
        }
        vy[i] -= g * dt;
        if (wander) {
          const p = phase[i];
          vx[i] += Math.sin(elapsed * 0.63 + p) * wander * dt;
          vy[i] += Math.cos(elapsed * 0.47 + p * 1.7) * wander * dt;
          vz[i] += Math.sin(elapsed * 0.41 + p * 2.3) * wander * dt * 0.5;
        }
        vx[i] *= damp;
        vy[i] *= damp;
        vz[i] *= damp;
        const sp = vx[i] * vx[i] + vy[i] * vy[i] + vz[i] * vz[i];
        if (sp > MAX_SPEED * MAX_SPEED) {
          const f = MAX_SPEED / Math.sqrt(sp);
          vx[i] *= f;
          vy[i] *= f;
          vz[i] *= f;
        }
      }
      buildGrid(biggest * (shade ? 2.8 : 2.3), s);
      if (shade) occ.fill(0, 0, n * 4);
      findContacts(s, dt, shade, margin);
      solveVelocities(dt);
      for (let i = 0; i < n; i++) {
        px[i] += vx[i] * dt;
        py[i] += vy[i] * dt;
        pz[i] += vz[i] * dt;
      }
      correctPositions();
      walls(s);
      if (shade) {
        for (let i = 0; i < n; i++) {
          const gap = py[i] - rad[i] + view.halfH;
          const reach = rad[i] * 0.5;
          if (gap >= reach) continue;
          const w = 1 - Math.max(gap, 0) / reach;
          occ[i * 4 + 1] -= w;
          occ[i * 4 + 3] += w;
        }
      }
      if (held.index >= 0) {
        const i = held.index;
        held.vx += (vx[i] - held.vx) * (1 - Math.exp(-dt / 0.05));
        held.vy += (vy[i] - held.vy) * (1 - Math.exp(-dt / 0.05));
      }
    };

    const rayTo = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const nx = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ny = 1 - ((clientY - rect.top) / Math.max(rect.height, 1)) * 2;
      return [nx * view.tan * (view.width / view.height), ny * view.tan, -1];
    };

    const onPlane = (ray: number[], z: number) => {
      const t = (z - CAMERA_Z) / ray[2];
      return [ray[0] * t, ray[1] * t];
    };

    const pick = (ray: number[]) => {
      const len = Math.hypot(ray[0], ray[1], ray[2]);
      const dx = ray[0] / len;
      const dy = ray[1] / len;
      const dz = ray[2] / len;
      let best = -1;
      let bestT = Infinity;
      for (let i = 0; i < n; i++) {
        const ox = -px[i];
        const oy = -py[i];
        const oz = CAMERA_Z - pz[i];
        const b = ox * dx + oy * dy + oz * dz;
        const r = rad[i] * 1.15;
        const c = ox * ox + oy * oy + oz * oz - r * r;
        const disc = b * b - c;
        if (disc < 0) continue;
        const t = -b - Math.sqrt(disc);
        if (t > 0 && t < bestT) {
          bestT = t;
          best = i;
        }
      }
      return best;
    };

    const burst = (x: number, y: number) => {
      const s = settingsRef.current;
      const reach = view.halfH * 0.7;
      for (let i = 0; i < n; i++) {
        const dx = px[i] - x;
        const dy = py[i] - y;
        const dz = pz[i];
        const d = Math.hypot(dx, dy, dz);
        if (d >= reach || d < 1e-4) continue;
        const f = Math.pow(1 - d / reach, 2) * 26 * (1 + 0.6 / (rad[i] + 0.4));
        vx[i] += (dx / d) * f;
        vy[i] += (dy / d) * f + f * 0.25;
        vz[i] += (dz / d) * f * 0.5;
      }
      light.x = x;
      light.y = y;
      light.z = Math.max(s.depth, 1) + 1.5;
      light.flash = 1;
    };

    let sizedDpr = settingsRef.current.dpr;

    const resize = () => {
      const s = settingsRef.current;
      sizedDpr = s.dpr;
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      const aspect = view.width / view.height;
      const base = Math.tan((FOV * Math.PI) / 360);
      view.tan = aspect > MAX_ASPECT ? (base * MAX_ASPECT) / aspect : base;
      view.halfH = view.tan * CAMERA_Z;
      view.halfW = view.halfH * aspect;
      view.fit = clamp(Math.sqrt((view.halfW * view.halfH) / (base * base * CAMERA_Z * CAMERA_Z * MAX_ASPECT)), 0.4, 1);
      const f = 1 / view.tan;
      const near = 1;
      const far = 80;
      projection.fill(0);
      projection[0] = f / aspect;
      projection[5] = f;
      projection[10] = (far + near) / (near - far);
      projection[11] = -1;
      projection[14] = (2 * far * near) / (near - far);
      if (!n) sync(s, true);
      draw();
      wake();
    };

    const draw = () => {
      const s = settingsRef.current;
      const mat = MATERIALS[s.material];
      let count = 0;
      const total = n + 1;
      for (let a = 1; a < total; a++) {
        const item = order[a];
        const z = item === n ? cursor.z : pz[item];
        let b = a - 1;
        while (b >= 0 && (order[b] === n ? cursor.z : pz[order[b]]) > z) {
          order[b + 1] = order[b];
          b--;
        }
        order[b + 1] = item;
      }
      for (let k = 0; k < total; k++) {
        const i = order[k];
        const o = count * STRIDE;
        if (i === n) {
          if (cursor.r < 0.01 || !s.followCursor) continue;
          const c = palette[0] || [1, 1, 1];
          data[o] = cursor.x;
          data[o + 1] = cursor.y;
          data[o + 2] = cursor.z;
          data[o + 3] = cursor.r;
          data[o + 4] = c[0];
          data[o + 5] = c[1];
          data[o + 6] = c[2];
          data[o + 7] = 1;
          data[o + 8] = 0;
          data[o + 9] = 0;
          data[o + 10] = 0;
          data[o + 11] = 0;
        } else {
          const c = palette[tone[i] % palette.length];
          data[o] = px[i];
          data[o + 1] = py[i];
          data[o + 2] = pz[i];
          data[o + 3] = rad[i];
          data[o + 4] = c[0];
          data[o + 5] = c[1];
          data[o + 6] = c[2];
          data[o + 7] = 0;
          const w = occ[i * 4 + 3];
          const len = Math.hypot(occ[i * 4], occ[i * 4 + 1], occ[i * 4 + 2]) || 1;
          data[o + 8] = occ[i * 4] / len;
          data[o + 9] = occ[i * 4 + 1] / len;
          data[o + 10] = occ[i * 4 + 2] / len;
          data[o + 11] = Math.min(w * 0.55, 1);
        }
        count++;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!count) return;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(shader.program);
      gl.uniformMatrix4fv(u.uProj, false, projection);
      gl.uniform1f(u.uCameraZ, CAMERA_Z);
      gl.uniform1f(u.uPixel, (2 * view.tan) / canvas.height);
      const lc = toLinear(s.lightColor);
      const power = s.lightIntensity * 60 * (1 + light.flash * 3);
      gl.uniform3f(u.uLight, lc[0] * power, lc[1] * power, lc[2] * power);
      gl.uniform3f(u.uLightPos, light.x, light.y, light.z - CAMERA_Z);
      gl.uniform1f(u.uExposure, s.exposure);
      gl.uniform1f(u.uShadow, s.shadows);
      gl.uniform4f(u.uSurface, mat.roughness, mat.metalness, mat.coat, mat.coatRoughness);
      gl.uniform2f(u.uExtra, mat.scatter, mat.frost);
      gl.bindBuffer(gl.ARRAY_BUFFER, instances);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, count * STRIDE);
      gl.bindVertexArray(vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      gl.bindVertexArray(null);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      if (s.dpr !== sizedDpr) resize();
      const dt = last ? clamp((now - last) / 1000, 0, 1 / 20) : 1 / 60;
      last = now;
      elapsed += dt;
      glide = Math.max(0, glide - dt);
      sync(s, false);
      const targetR = s.followCursor && pointer.inside && held.index < 0 ? s.cursorSize * view.fit : 0;
      cursor.r += (targetR - cursor.r) * (1 - Math.exp(-dt / 0.12));
      const follow = 1 - Math.exp(-dt / 0.06);
      const fromX = cursor.x;
      const fromY = cursor.y;
      cursor.x += (cursor.tx - cursor.x) * follow;
      cursor.y += (cursor.ty - cursor.y) * follow;
      cursor.vx = clamp((cursor.x - fromX) / Math.max(dt, 1e-3), -MAX_SPEED, MAX_SPEED);
      cursor.vy = clamp((cursor.y - fromY) / Math.max(dt, 1e-3), -MAX_SPEED, MAX_SPEED);
      const restX = 0;
      const restY = view.halfH * 0.75;
      const restZ = s.depth + 4;
      const lightTarget = pointer.inside
        ? [cursor.x, cursor.y, s.followCursor ? cursor.z : 1.5]
        : light.flash > 0.05
          ? [light.x, light.y, light.z]
          : [restX, restY, restZ];
      const lf = 1 - Math.exp(-dt / 0.08);
      light.x += (lightTarget[0] - light.x) * lf;
      light.y += (lightTarget[1] - light.y) * lf;
      light.z += (lightTarget[2] - light.z) * lf;
      light.flash *= Math.exp(-dt / 0.3);
      if (dt > 1e-4) {
        const steps = Math.min(6, Math.max(1, Math.ceil(dt / (1 / 180))));
        const h = dt / steps;
        for (let k = 0; k < steps; k++) step(s, h, k === steps - 1);
      }
      draw();
      let moved = 0;
      for (let i = 0; i < n; i++) {
        const k = i * 3;
        const d = Math.abs(px[i] - still[k]) + Math.abs(py[i] - still[k + 1]) + Math.abs(pz[i] - still[k + 2]);
        if (d > moved) moved = d;
        still[k] = px[i];
        still[k + 1] = py[i];
        still[k + 2] = pz[i];
      }
      const motion = moved / Math.max(dt, 1e-3);
      const busy =
        motion > 0.6 ||
        pointer.inside ||
        held.index >= 0 ||
        light.flash > 0.01 ||
        glide > 0 ||
        cursor.r > 0.01 ||
        (s.drift > 0 && !reduce);
      quiet = busy ? 0 : quiet + dt;
      if (quiet < 0.8) raf = requestAnimationFrame(frame);
    };

    function wake() {
      quiet = 0;
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    const inside = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    };

    const aim = (event: PointerEvent) => {
      const ray = rayTo(event.clientX, event.clientY);
      const [x, y] = onPlane(ray, cursor.z);
      cursor.tx = x;
      cursor.ty = y;
      if (held.index >= 0) {
        const [hx, hy] = onPlane(ray, pz[held.index]);
        held.tx = hx - held.ox;
        held.ty = hy - held.oy;
      }
      return ray;
    };

    const onPointerMove = (event: PointerEvent) => {
      const was = pointer.inside;
      pointer.inside = inside(event) || held.index >= 0;
      if (pointer.inside) {
        aim(event);
        if (!was) {
          cursor.x = cursor.tx;
          cursor.y = cursor.ty;
        }
        if (pointer.down && Math.hypot(event.clientX - pointer.downX, event.clientY - pointer.downY) > 6)
          pointer.moved = true;
      }
      if (pointer.inside || was) wake();
    };

    const interactive = (target: EventTarget | null) =>
      target instanceof Element && target.closest('a, button, input, textarea, select, label, [role="button"]');

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !inside(event) || interactive(event.target)) return;
      const s = settingsRef.current;
      pointer.down = true;
      pointer.moved = false;
      pointer.downX = event.clientX;
      pointer.downY = event.clientY;
      pointer.downAt = performance.now();
      const ray = aim(event);
      if (s.grab) {
        const i = pick(ray);
        if (i >= 0) {
          const [hx, hy] = onPlane(ray, pz[i]);
          held.index = i;
          held.ox = hx - px[i];
          held.oy = hy - py[i];
          held.tx = px[i];
          held.ty = py[i];
          held.vx = 0;
          held.vy = 0;
          if (event.pointerType === 'mouse') event.preventDefault();
        }
      }
      wake();
    };

    const release = (event: PointerEvent | null) => {
      const s = settingsRef.current;
      if (held.index >= 0) {
        const i = held.index;
        const sp = Math.hypot(held.vx, held.vy);
        const k = sp > 22 ? 22 / sp : 1;
        vx[i] = held.vx * k;
        vy[i] = held.vy * k;
        held.index = -1;
        entered[i] = 1;
      } else if (
        event &&
        pointer.down &&
        !pointer.moved &&
        performance.now() - pointer.downAt < 400 &&
        s.clickEffect === 'burst' &&
        !reduce &&
        inside(event)
      ) {
        const [x, y] = onPlane(rayTo(event.clientX, event.clientY), 0);
        burst(x, y);
      }
      pointer.down = false;
      wake();
    };

    const onPointerUp = (event: PointerEvent) => release(event);
    const onPointerCancel = () => release(null);
    const onPointerLeave = () => {
      pointer.inside = held.index >= 0;
      wake();
    };
    const onVisibility = () => wake();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) wake();
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerCancel, { passive: true });
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
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(quad);
      gl.deleteBuffer(instances);
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
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} aria-hidden="true" />
    </div>
  );
};

export default Ballpit;
