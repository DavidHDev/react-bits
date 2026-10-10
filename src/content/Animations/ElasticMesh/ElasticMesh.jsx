'use client';

import { useEffect, useRef } from 'react';

import './ElasticMesh.css';

const VERTEX = `#version 300 es
in vec2 aPosition;
in vec2 aRest;
in vec4 aStrain;
in vec3 aDent;
uniform vec2 uViewport;
uniform vec2 uOffset;
out vec2 vRest;
out vec4 vStrain;
out vec3 vDent;
void main() {
  vRest = aRest;
  vStrain = aStrain;
  vDent = aDent;
  vec2 clip = (aPosition + uOffset) / uViewport * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const SHADOW = `#version 300 es
precision highp float;
in vec2 vRest;
in vec4 vStrain;
in vec3 vDent;
uniform sampler2D uField;
uniform vec3 uShadowColor;
uniform float uShadow;
uniform vec4 uParts[64];
uniform float uClock;

float arrival(float delay) {
  float t = max(uClock - delay, 0.0);
  float omega = 15.0;
  float zeta = 0.38;
  float damped = omega * sqrt(1.0 - zeta * zeta);
  return 1.0 - exp(-zeta * omega * t) * (cos(damped * t) + zeta * omega / damped * sin(damped * t));
}

float owner(vec2 rest) {
  ivec2 size = textureSize(uField, 0);
  ivec2 texel = clamp(ivec2(rest * vec2(size)), ivec2(0), size - 1);
  return floor(texelFetch(uField, texel, 0).w + 0.5);
}

vec3 settle(vec2 rest) {
  if (uClock > 9.0) return vec3(rest, 1.0);
  float id = owner(rest);
  if (id < 0.5 || id > 64.5) return vec3(rest, 1.0);
  vec4 part = uParts[int(id) - 1];
  float presence = arrival(part.z);
  float size = max(mix(0.5, 1.0, presence), 0.05);
  vec2 moved = part.xy + (rest - part.xy) / size;
  return vec3(moved, presence * step(abs(owner(moved) - id), 0.5));
}
out vec4 outColor;
void main() {
  vec3 arrived = settle(vRest);
  float shade = texture(uField, arrived.xy).z * uShadow * clamp(arrived.z, 0.0, 1.0) * (1.0 - 0.35 * clamp(vDent.x, 0.0, 1.0));
  outColor = vec4(uShadowColor * shade, shade);
}`;

const SURFACE = `#version 300 es
precision highp float;
in vec2 vRest;
in vec4 vStrain;
in vec3 vDent;
uniform sampler2D uField;
uniform sampler2D uSlope;
uniform sampler2D uPaint;
uniform vec3 uColor;
uniform float uPaintMix;
uniform float uMaterial;
uniform float uLight;
uniform float uInflate;
uniform mat3 uTurn;
uniform vec4 uParts[64];
uniform float uClock;
out vec4 outColor;

float arrival(float delay) {
  float t = max(uClock - delay, 0.0);
  float omega = 15.0;
  float zeta = 0.38;
  float damped = omega * sqrt(1.0 - zeta * zeta);
  return 1.0 - exp(-zeta * omega * t) * (cos(damped * t) + zeta * omega / damped * sin(damped * t));
}

float owner(vec2 rest) {
  ivec2 size = textureSize(uField, 0);
  ivec2 texel = clamp(ivec2(rest * vec2(size)), ivec2(0), size - 1);
  return floor(texelFetch(uField, texel, 0).w + 0.5);
}

vec3 settle(vec2 rest) {
  if (uClock > 9.0) return vec3(rest, 1.0);
  float id = owner(rest);
  if (id < 0.5 || id > 64.5) return vec3(rest, 1.0);
  vec4 part = uParts[int(id) - 1];
  float presence = arrival(part.z);
  float size = max(mix(0.5, 1.0, presence), 0.05);
  vec2 moved = part.xy + (rest - part.xy) / size;
  return vec3(moved, presence * step(abs(owner(moved) - id), 0.5));
}
vec4 cubic(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x;
  float y = s.y - 4.0 * s.x;
  float z = s.z - 4.0 * s.y + 6.0 * s.x;
  return vec4(x, y, z, 6.0 - x - y - z) / 6.0;
}

vec2 smoothSlope(vec2 uv) {
  vec2 size = vec2(textureSize(uSlope, 0));
  vec2 cell = uv * size - 0.5;
  vec2 f = fract(cell);
  cell -= f;
  vec4 xc = cubic(f.x);
  vec4 yc = cubic(f.y);
  vec4 corner = cell.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 sum = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
  vec4 offset = (corner + vec4(xc.yw, yc.yw) / sum) / size.xxyy;
  vec2 a = texture(uSlope, offset.xz).xy;
  vec2 b = texture(uSlope, offset.yz).xy;
  vec2 c = texture(uSlope, offset.xw).xy;
  vec2 d = texture(uSlope, offset.yw).xy;
  float sx = sum.x / (sum.x + sum.y);
  float sy = sum.z / (sum.z + sum.w);
  return mix(mix(d, c, sx), mix(b, a, sx), sy);
}

float panel(vec3 r, vec3 center, vec2 size, float soft) {
  vec3 forward = normalize(center);
  vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 lift = cross(forward, side);
  float facing = dot(r, forward);
  vec2 local = vec2(dot(r, side), dot(r, lift)) / max(facing, 0.1);
  vec2 q = abs(local) - size;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  return smoothstep(soft, -soft, d) * smoothstep(0.05, 0.3, facing);
}

vec3 studio(vec3 r, float blur) {
  float y = r.y;
  vec3 skyLow = mix(vec3(0.92, 0.95, 1.0), vec3(1.0), uLight);
  vec3 skyHigh = mix(vec3(0.1, 0.11, 0.14), vec3(0.62, 0.64, 0.7), uLight);
  vec3 groundNear = mix(vec3(0.12, 0.11, 0.1), vec3(0.3, 0.29, 0.28), uLight);
  vec3 groundFar = mix(vec3(0.005), vec3(0.1), uLight);
  vec3 sky = mix(skyLow, skyHigh, smoothstep(0.0, 0.75, y));
  vec3 ground = mix(groundNear, groundFar, smoothstep(0.0, -0.4, y));
  float edge = 0.004 + blur;
  vec3 c = mix(ground, sky, smoothstep(-edge, edge, y));
  float glow = 0.035 + blur;
  c += vec3(2.2) * exp(-pow((y - 0.02) / glow, 2.0)) * (0.035 / glow);
  c += vec3(7.0) * panel(r, vec3(-0.55, 0.55, 0.62), vec2(0.36, 0.2), 0.025 + blur);
  c += vec3(4.5) * panel(r, vec3(0.9, 0.18, 0.4), vec2(0.045, 0.85), 0.01 + blur) * (0.045 / (0.045 + blur));
  c += vec3(3.2) * panel(r, vec3(-0.95, 0.1, 0.32), vec2(0.035, 0.7), 0.01 + blur) * (0.035 / (0.035 + blur));
  c += vec3(2.4) * panel(r, vec3(0.0, 0.92, 0.38), vec2(1.1, 0.045), 0.01 + blur) * (0.045 / (0.045 + blur));
  return c;
}

vec3 tone(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 arrived = settle(vRest);
  vec2 rest = arrived.xy;
  float presence = arrived.z;
  vec4 field = texture(uField, rest);
  float edge = field.y;
  float edgeWidth = max(fwidth(edge), 0.0001);
  if (edge < -3.0 * edgeWidth || presence <= 0.001) discard;
  float cover = clamp(edge / edgeWidth + 0.5, 0.0, 1.0);

  vec2 slope = smoothSlope(rest);
  mat2 strain = mat2(vStrain.xy, vStrain.zw);
  float area = max(determinant(strain), 0.2);
  float lift = uInflate * presence * inversesqrt(area);
  float keep = clamp(1.0 - vDent.x, 0.15, 1.6);
  vec2 restGradient = (slope * keep - field.x * vDent.yz) * lift;
  vec2 gradient = inverse(transpose(strain)) * restGradient;
  vec3 normal = normalize(vec3(-gradient.x, gradient.y, 1.0));
  float depth = field.x * keep * lift;

  vec3 turned = uTurn * normal;
  vec3 reflected = uTurn * reflect(vec3(0.0, 0.0, -1.0), normal);
  float footprint = length(fwidth(reflected));
  float facing = max(normal.z, 0.0);
  float fresnel = pow(1.0 - facing, 5.0);
  vec3 lightDir = normalize(vec3(-0.5, 0.62, 0.62));
  float wrap = max((dot(turned, lightDir) + 0.45) / 1.45, 0.0);
  float key = max(dot(turned, lightDir), 0.0);
  float occlusion = mix(0.55, 1.0, smoothstep(0.0, 12.0, depth));

  vec3 paint = texture(uPaint, rest).rgb;
  vec3 base = mix(uColor, paint, uPaintMix);
  vec3 color;
  if (uMaterial < 0.5) {
    vec3 env = studio(reflected, 0.04 + footprint * 0.6);
    float reflectance = 0.045 + 0.955 * fresnel;
    vec3 deep = base * base * 0.55;
    vec3 body = mix(deep, base * 1.08, wrap) * occlusion;
    body += base * pow(1.0 - facing, 2.0) * 0.18;
    color = body * (1.0 - reflectance) + tone(env * reflectance * 0.9);
  } else if (uMaterial < 1.5) {
    vec3 env = studio(reflected, footprint * 0.6);
    vec3 tint = mix(vec3(1.0), base, 0.6) * 0.92;
    vec3 reflectance = tint + (1.0 - tint) * fresnel;
    color = tone(env * reflectance * mix(0.55, 1.0, occlusion) * 1.1);
  } else if (uMaterial < 2.5) {
    vec3 env = studio(reflected, 0.03 + footprint * 0.6);
    float core = smoothstep(0.0, 1.0, facing);
    vec3 glow = mix(base * base * 0.35, min(base * 1.45 + 0.08, vec3(1.0)), core * core);
    vec3 body = glow * mix(0.7, 1.0, occlusion) + base * wrap * 0.18;
    float reflectance = 0.03 + 0.97 * fresnel;
    color = body * (1.0 - reflectance) + tone(env * reflectance * 0.85);
  } else {
    vec3 env = studio(reflected, 0.35 + footprint * 0.6);
    vec3 body = base * (0.3 + 0.7 * wrap) * mix(0.68, 1.0, occlusion);
    body += base * key * 0.12;
    color = body + tone(env * (0.012 + 0.18 * fresnel)) * 0.5;
  }
  float alpha = cover * smoothstep(0.0, 0.18, presence);
  outColor = vec4(color * alpha, alpha);
}`;

const MATERIALS = { balloon: 0, chrome: 1, jelly: 2, clay: 3 };
const MAX_FIELD = 720;
const MAX_NODES = 5200;
const STEP = 1 / 480;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (gl, fragmentSource) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.bindAttribLocation(program, 1, 'aRest');
  gl.bindAttribLocation(program, 2, 'aStrain');
  gl.bindAttribLocation(program, 3, 'aDent');
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

const distance1d = (f, n, d, v, z) => {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
};

const distanceField = (grid, width, height) => {
  const n = Math.max(width, height);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) f[y] = grid[y * width + x];
    distance1d(f, height, d, v, z);
    for (let y = 0; y < height; y++) grid[y * width + x] = d[y];
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) f[x] = grid[y * width + x];
    distance1d(f, width, d, v, z);
    for (let x = 0; x < width; x++) grid[y * width + x] = Math.sqrt(d[x]);
  }
  return grid;
};

const nearestLabels = (labels, width, height) => {
  const far = 1e20;
  const column = new Float64Array(width * height);
  const site = new Int32Array(width * height);
  for (let x = 0; x < width; x++) {
    let last = -1;
    for (let y = 0; y < height; y++) {
      const i = y * width + x;
      if (labels[i]) last = y;
      site[i] = last;
      column[i] = last >= 0 ? (y - last) * (y - last) : far;
    }
    last = -1;
    for (let y = height - 1; y >= 0; y--) {
      const i = y * width + x;
      if (labels[i]) last = y;
      if (last >= 0 && (last - y) * (last - y) < column[i]) {
        column[i] = (last - y) * (last - y);
        site[i] = last;
      }
    }
  }
  const out = new Float32Array(width * height);
  const f = new Float64Array(width);
  const v = new Int32Array(width);
  const z = new Float64Array(width + 1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) f[x] = column[y * width + x];
    let k = 0;
    v[0] = 0;
    z[0] = -Infinity;
    z[1] = Infinity;
    for (let q = 1; q < width; q++) {
      let cut = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (cut <= z[k]) {
        k--;
        cut = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      z[k] = cut;
      z[k + 1] = Infinity;
    }
    k = 0;
    for (let x = 0; x < width; x++) {
      while (z[k + 1] < x) k++;
      const sx = v[k];
      const sy = site[y * width + sx];
      out[y * width + x] = sy >= 0 ? labels[sy * width + sx] : 0;
    }
  }
  return out;
};

const inflateField = (mask, width, height) => {
  const levels = [{ width, height, mask }];
  while (Math.max(levels[levels.length - 1].width, levels[levels.length - 1].height) > 48) {
    const prev = levels[levels.length - 1];
    const w = Math.ceil(prev.width / 2);
    const h = Math.ceil(prev.height / 2);
    const next = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const sx = x * 2 + dx;
            const sy = y * 2 + dy;
            if (sx < prev.width && sy < prev.height) {
              sum += prev.mask[sy * prev.width + sx];
              count++;
            }
          }
        }
        next[y * w + x] = sum / count;
      }
    }
    levels.push({ width: w, height: h, mask: next });
  }

  let solution = null;
  for (let level = levels.length - 1; level >= 0; level--) {
    const { width: w, height: h, mask: m } = levels[level];
    const current = new Float32Array(w * h);
    if (solution) {
      const pw = levels[level + 1].width;
      const ph = levels[level + 1].height;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const fx = clamp((x + 0.5) / 2 - 0.5, 0, pw - 1);
          const fy = clamp((y + 0.5) / 2 - 0.5, 0, ph - 1);
          const x0 = Math.floor(fx);
          const y0 = Math.floor(fy);
          const x1 = Math.min(pw - 1, x0 + 1);
          const y1 = Math.min(ph - 1, y0 + 1);
          const tx = fx - x0;
          const ty = fy - y0;
          const top = solution[y0 * pw + x0] * (1 - tx) + solution[y0 * pw + x1] * tx;
          const bottom = solution[y1 * pw + x0] * (1 - tx) + solution[y1 * pw + x1] * tx;
          current[y * w + x] = top * (1 - ty) + bottom * ty;
        }
      }
    }
    const source = 4 ** level;
    const iterations = level === levels.length - 1 ? 300 : 60;
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (m[i] < 0.5) {
            current[i] = 0;
            continue;
          }
          const l = x > 0 ? current[i - 1] : 0;
          const r = x < w - 1 ? current[i + 1] : 0;
          const u = y > 0 ? current[i - w] : 0;
          const d = y < h - 1 ? current[i + w] : 0;
          current[i] += ((l + r + u + d + source) * 0.25 - current[i]) * 1.85;
        }
      }
    }
    solution = current;
  }
  return solution;
};

const blurField = (source, width, height, radius) => {
  const r = Math.max(1, Math.round(radius));
  const sigma = r / 2.5;
  const kernel = [];
  let total = 0;
  for (let i = -r; i <= r; i++) {
    const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(weight);
    total += weight;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= total;
  const temp = new Float32Array(width * height);
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let i = -r; i <= r; i++) sum += source[y * width + clamp(x + i, 0, width - 1)] * kernel[i + r];
      temp[y * width + x] = sum;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let i = -r; i <= r; i++) sum += temp[clamp(y + i, 0, height - 1) * width + x] * kernel[i + r];
      out[y * width + x] = sum;
    }
  }
  return out;
};

const ElasticMesh = ({
  text = 'Squish',
  src = '',
  fontFamily = 'system-ui, sans-serif',
  fontWeight = 900,
  color = '#3b5bff',
  imageColors = true,
  material = 'balloon',
  inflate = 1,
  stiffness = 0.5,
  wobble = 0.6,
  grabRadius = 70,
  stretch = 0.5,
  press = 0.5,
  shadow = 0.5,
  intro = true,
  theme = 'dark',
  dpr,
  className = '',
  style,
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const contentRef = useRef(null);
  const settings = {
    text: String(text),
    src: String(src || ''),
    fontFamily: String(fontFamily),
    fontWeight,
    color: String(color),
    imageColors,
    material: MATERIALS[material] ?? 0,
    inflate: clamp(inflate, 0.1, 3),
    stiffness: clamp(stiffness, 0, 1),
    wobble: clamp(wobble, 0, 1),
    grabRadius: clamp(grabRadius, 10, 400),
    stretch: clamp(stretch, 0, 1),
    press: clamp(press, 0, 1),
    shadow: clamp(shadow, 0, 1),
    intro,
    light: theme === 'light',
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const contentKey = `${settings.text}|${settings.src}|${settings.fontFamily}|${settings.fontWeight}`;
  const builtRef = useRef(contentKey);

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

    const surfaceProgram = link(gl, SURFACE);
    const shadowProgram = link(gl, SHADOW);
    if (!surfaceProgram || !shadowProgram) return undefined;
    const surface = locate(gl, surfaceProgram, [
      'uViewport',
      'uOffset',
      'uField',
      'uPaint',
      'uSlope',
      'uColor',
      'uPaintMix',
      'uMaterial',
      'uLight',
      'uInflate',
      'uTurn',
      'uClock',
      'uParts'
    ]);
    const shade = locate(gl, shadowProgram, [
      'uViewport',
      'uOffset',
      'uField',
      'uShadowColor',
      'uShadow',
      'uClock',
      'uParts'
    ]);

    const fieldTexture = gl.createTexture();
    const paintTexture = gl.createTexture();
    const slopeTexture = gl.createTexture();
    for (const texture of [fieldTexture, paintTexture, slopeTexture]) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    }

    const vao = gl.createVertexArray();
    const restBuffer = gl.createBuffer();
    const dynamicBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, restBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dynamicBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 8);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 36, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bindVertexArray(null);

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const partData = new Float32Array(256);
    const turnMatrix = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    const mesh = {
      cols: 0,
      rows: 0,
      spacing: 1,
      count: 0,
      indices: 0,
      restX: new Float32Array(0),
      restY: new Float32Array(0),
      x: new Float32Array(0),
      y: new Float32Array(0),
      vx: new Float32Array(0),
      vy: new Float32Array(0),
      dent: new Float32Array(0),
      dentV: new Float32Array(0),
      grip: new Float32Array(0),
      gripX: new Float32Array(0),
      gripY: new Float32Array(0),
      active: new Uint8Array(0),
      neighbors: new Int32Array(0),
      dynamic: new Float32Array(0),
      anchorX: new Float32Array(0),
      anchorY: new Float32Array(0),
      indexType: gl.UNSIGNED_SHORT,
      activeCount: 0,
      width: 1,
      height: 1
    };
    const state = {
      width: 1,
      height: 1,
      ready: false,
      fieldWidth: 1,
      fieldHeight: 1,
      fieldScale: 1,
      sdf: new Float32Array(0),
      parts: [],
      clock: settingsRef.current.intro && !reduce ? 0 : 10,
      colorKey: '',
      color: [0.31, 0.42, 1],
      pointer: { x: 0, y: 0, inside: false, down: false, startX: 0, startY: 0, startTime: 0, dragging: false },
      hover: { x: 0, y: 0, vx: 0, vy: 0, power: 0 },
      turn: { x: 0, y: 0, vx: 0, vy: 0 },
      accumulator: 0,
      energy: 1,
      buildToken: 0
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;
    let resizeTimer = 0;

    const toRgb = value => {
      if (!probe || !value) return [0.31, 0.42, 1];
      probe.fillStyle = '#000000';
      probe.fillStyle = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      return [r / 255, g / 255, b / 255];
    };

    const sampleSdf = (px, py) => {
      const fx = clamp(Math.round(px * state.fieldScale), 0, state.fieldWidth - 1);
      const fy = clamp(Math.round(py * state.fieldScale), 0, state.fieldHeight - 1);
      return state.sdf[fy * state.fieldWidth + fx] || -1e6;
    };

    const buildMesh = () => {
      const { width, height } = state;
      const spacing = Math.max(7, Math.sqrt((width * height) / MAX_NODES));
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const count = cols * rows;
      const sx = width / (cols - 1);
      const sy = height / (rows - 1);
      mesh.cols = cols;
      mesh.rows = rows;
      mesh.width = width;
      mesh.height = height;
      mesh.spacing = (sx + sy) / 2;
      mesh.count = count;
      mesh.restX = new Float32Array(count);
      mesh.restY = new Float32Array(count);
      mesh.x = new Float32Array(count);
      mesh.y = new Float32Array(count);
      mesh.vx = new Float32Array(count);
      mesh.vy = new Float32Array(count);
      mesh.dent = new Float32Array(count);
      mesh.dentV = new Float32Array(count);
      mesh.grip = new Float32Array(count);
      mesh.gripX = new Float32Array(count);
      mesh.gripY = new Float32Array(count);
      mesh.active = new Uint8Array(count);
      mesh.dynamic = new Float32Array(count * 9);
      const rest = new Float32Array(count * 2);
      const reach = -2.5 * mesh.spacing;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i;
          const px = i * sx;
          const py = j * sy;
          mesh.restX[k] = px;
          mesh.restY[k] = py;
          mesh.x[k] = px;
          mesh.y[k] = py;
          rest[k * 2] = px / width;
          rest[k * 2 + 1] = py / height;
          mesh.active[k] = state.ready && sampleSdf(px, py) > reach ? 1 : 0;
        }
      }
      const neighbors = new Int32Array(count * 8).fill(-1);
      const offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
      ];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i;
          if (!mesh.active[k]) continue;
          offsets.forEach(([di, dj], n) => {
            const ni = i + di;
            const nj = j + dj;
            if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) return;
            const nk = nj * cols + ni;
            if (mesh.active[nk]) neighbors[k * 8 + n] = nk;
          });
        }
      }
      mesh.neighbors = neighbors;
      mesh.activeCount = mesh.active.reduce((total, flag) => total + flag, 0);
      const margin = -(Math.min(width, height) * 0.14 + mesh.spacing * 3);
      const near = new Uint8Array(count);
      for (let k = 0; k < count; k++) near[k] = state.ready && sampleSdf(mesh.restX[k], mesh.restY[k]) > margin ? 1 : 0;
      const quads = [];
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = j * cols + i;
          const b = a + 1;
          const c = a + cols;
          const d = c + 1;
          if (near[a] || near[b] || near[c] || near[d]) quads.push(a, c, b, b, c, d);
        }
      }
      const indexData = count > 65535 ? new Uint32Array(quads) : new Uint16Array(quads);
      mesh.indexType = count > 65535 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      mesh.indices = quads.length;
      gl.bindBuffer(gl.ARRAY_BUFFER, restBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, rest, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
      writeDynamic();
    };

    const writeDynamic = () => {
      const { cols, rows, x, y, dent, dynamic, spacing } = mesh;
      const sx = mesh.width / Math.max(1, cols - 1);
      const sy = mesh.height / Math.max(1, rows - 1);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i;
          const l = i > 0 ? k - 1 : k;
          const r = i < cols - 1 ? k + 1 : k;
          const u = j > 0 ? k - cols : k;
          const d = j < rows - 1 ? k + cols : k;
          const spanX = (r - l) * sx || spacing;
          const spanY = ((d - u) / cols) * sy || spacing;
          const o = k * 9;
          dynamic[o] = x[k];
          dynamic[o + 1] = y[k];
          dynamic[o + 2] = (x[r] - x[l]) / spanX;
          dynamic[o + 3] = (y[r] - y[l]) / spanX;
          dynamic[o + 4] = (x[d] - x[u]) / spanY;
          dynamic[o + 5] = (y[d] - y[u]) / spanY;
          dynamic[o + 6] = dent[k];
          dynamic[o + 7] = (dent[r] - dent[l]) / spanX;
          dynamic[o + 8] = (dent[d] - dent[u]) / spanY;
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, dynamicBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, dynamic, gl.DYNAMIC_DRAW);
    };

    const rasterize = async () => {
      const s = settingsRef.current;
      const token = ++state.buildToken;
      const { width, height } = state;
      const scale = Math.min(1, MAX_FIELD / Math.max(width, height));
      const fw = Math.max(8, Math.round(width * scale));
      const fh = Math.max(8, Math.round(height * scale));
      const canvas2d = document.createElement('canvas');
      canvas2d.width = fw;
      canvas2d.height = fh;
      const ctx = canvas2d.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      let drawn = false;
      if (s.src) {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.decoding = 'async';
        image.src = s.src;
        try {
          await image.decode();
        } catch {
          return;
        }
        if (token !== state.buildToken) return;
        const fit = Math.min((fw * 0.78) / image.naturalWidth, (fh * 0.74) / image.naturalHeight);
        const w = image.naturalWidth * fit;
        const h = image.naturalHeight * fit;
        ctx.drawImage(image, (fw - w) / 2, (fh - h) / 2, w, h);
        drawn = true;
      } else {
        const family = s.fontFamily;
        const weight = s.fontWeight;
        if (document.fonts) await document.fonts.load(`${weight} 100px ${family}`).catch(() => null);
        if (token !== state.buildToken) return;
        const lines = s.text.split('\n');
        ctx.font = `${weight} 100px ${family}`;
        let widest = 1;
        let ascent = 0;
        let descent = 0;
        for (const line of lines) {
          const m = ctx.measureText(line || ' ');
          widest = Math.max(widest, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
          ascent = Math.max(ascent, m.actualBoundingBoxAscent);
          descent = Math.max(descent, m.actualBoundingBoxDescent);
        }
        const lineHeight = 100 * 1.02;
        const blockHeight = ascent + descent + lineHeight * (lines.length - 1);
        const size = Math.min((fw * 0.8) / widest, (fh * 0.7) / blockHeight) * 100;
        ctx.font = `${weight} ${size}px ${family}`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        const k = size / 100;
        const top = (fh - blockHeight * k) / 2 + ascent * k;
        lines.forEach((line, index) => {
          const m = ctx.measureText(line || ' ');
          const shift = (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
          ctx.fillText(line, fw / 2 + shift, top + index * lineHeight * k);
        });
        drawn = true;
      }
      if (!drawn || token !== state.buildToken) return;

      const pixels = ctx.getImageData(0, 0, fw, fh).data;
      const count = fw * fh;
      const mask = new Float32Array(count);
      const inside = new Float64Array(count);
      const outside = new Float64Array(count);
      for (let i = 0; i < count; i++) {
        const a = pixels[i * 4 + 3] / 255;
        mask[i] = a;
        inside[i] = a > 0.5 ? 1e10 : 0;
        outside[i] = a > 0.5 ? 0 : 1e10;
      }
      distanceField(inside, fw, fh);
      distanceField(outside, fw, fh);
      const binary = new Float32Array(count);
      const signed = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        binary[i] = mask[i] > 0.5 ? 1 : 0;
        signed[i] =
          mask[i] > 0.02 && mask[i] < 0.98 ? mask[i] - 0.5 : inside[i] > 0 ? inside[i] - 0.5 : 0.5 - outside[i];
      }
      const labels = new Int32Array(count);
      const parts = [];
      const queue = new Int32Array(count);
      for (let start = 0; start < count; start++) {
        if (!binary[start] || labels[start]) continue;
        const id = parts.length + 1;
        let head = 0;
        let tail = 0;
        let sumX = 0;
        let sumY = 0;
        let minX = Infinity;
        queue[tail++] = start;
        labels[start] = id;
        while (head < tail) {
          const i = queue[head++];
          const x = i % fw;
          const y = (i - x) / fw;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (x > 0 && binary[i - 1] && !labels[i - 1]) {
            labels[i - 1] = id;
            queue[tail++] = i - 1;
          }
          if (x < fw - 1 && binary[i + 1] && !labels[i + 1]) {
            labels[i + 1] = id;
            queue[tail++] = i + 1;
          }
          if (y > 0 && binary[i - fw] && !labels[i - fw]) {
            labels[i - fw] = id;
            queue[tail++] = i - fw;
          }
          if (y < fh - 1 && binary[i + fw] && !labels[i + fw]) {
            labels[i + fw] = id;
            queue[tail++] = i + fw;
          }
        }
        parts.push({ x: sumX / tail / scale, y: sumY / tail / scale, left: minX, size: tail, delay: 0 });
      }
      const order = [...parts].sort((a, b) => a.left - b.left);
      const gap = order.length > 1 ? Math.min(0.07, 0.5 / (order.length - 1)) : 0;
      order.forEach((part, rank) => {
        part.delay = rank * gap;
      });
      const owners = parts.length <= 64 ? nearestLabels(labels, fw, fh) : new Float32Array(count);
      const solution = blurField(inflateField(binary, fw, fh), fw, fh, 2);
      const edges = blurField(signed, fw, fh, 2);
      const shadowMask = blurField(binary, fw, fh, Math.max(4, Math.min(fw, fh) * 0.045));
      const field = new Float32Array(count * 4);
      const sdf = new Float32Array(count);
      const heights = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const distance = edges[i] / scale;
        sdf[i] = distance;
        heights[i] = Math.sqrt(Math.max(0, 2 * solution[i])) / scale;
        field[i * 4] = heights[i];
        field[i * 4 + 1] = distance;
        field[i * 4 + 2] = shadowMask[i];
        field[i * 4 + 3] = owners[i];
      }
      const slopes = new Float32Array(count * 2);
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          const i = y * fw + x;
          let gx = (heights[y * fw + Math.min(fw - 1, x + 1)] - heights[y * fw + Math.max(0, x - 1)]) * 0.5 * scale;
          let gy = (heights[Math.min(fh - 1, y + 1) * fw + x] - heights[Math.max(0, y - 1) * fw + x]) * 0.5 * scale;
          const steep = Math.hypot(gx, gy);
          if (steep > 7) {
            gx *= 7 / steep;
            gy *= 7 / steep;
          }
          slopes[i * 2] = gx;
          slopes[i * 2 + 1] = gy;
        }
      }
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, fw, fh, 0, gl.RGBA, gl.FLOAT, field);
      gl.bindTexture(gl.TEXTURE_2D, slopeTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, fw, fh, 0, gl.RG, gl.FLOAT, slopes);
      gl.bindTexture(gl.TEXTURE_2D, paintTexture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);
      state.fieldWidth = fw;
      state.fieldHeight = fh;
      state.fieldScale = scale;
      state.sdf = sdf;
      state.parts = parts;
      partData.fill(0);
      parts.slice(0, 64).forEach((part, index) => {
        partData[index * 4] = part.x / width;
        partData[index * 4 + 1] = part.y / height;
        partData[index * 4 + 2] = part.delay;
      });
      state.ready = true;
      buildMesh();
      wake();
    };

    const solve = (dt, s) => {
      const { count, x, y, vx, vy, restX, restY, dent, dentV, active, neighbors, grip, gripX, gripY, spacing } = mesh;
      const firm = 0.4 + s.stiffness * 1.2;
      const anchor = 350 * firm * firm;
      const couple = anchor * (52 / Math.sqrt(firm) / spacing) ** 2;
      const ratio = reduce ? 0.8 : 0.5 - s.wobble * 0.42;
      const damping = 2 * ratio * Math.sqrt(anchor);
      const dentAnchor = anchor * 1.4;
      const dentCouple = dentAnchor * (18 / spacing) ** 2;
      const dentDamping = 2 * (ratio + 0.06) * Math.sqrt(dentAnchor);
      const gripStiffness = anchor * 30;
      const gripDamping = 1.2 * Math.sqrt(gripStiffness);
      const brush = state.pointer.dragging ? 0 : 10;
      const hover = state.hover;
      const pressRadius = s.grabRadius * 0.32;
      const pressInv = 1 / (2 * pressRadius * pressRadius);
      const pressPower = hover.power * s.press;
      const pressDepth = state.pointer.dragging ? 1.6 : 1;
      let energy = 0;
      for (let k = 0; k < count; k++) {
        if (!active[k]) continue;
        const ux = x[k] - restX[k];
        const uy = y[k] - restY[k];
        let ax = -anchor * ux - damping * vx[k];
        let ay = -anchor * uy - damping * vy[k];
        let ad = -dentAnchor * dent[k] - dentDamping * dentV[k];
        const base = k * 8;
        for (let n = 0; n < 8; n++) {
          const m = neighbors[base + n];
          if (m < 0) continue;
          const weight = n < 4 ? 1 : 0.5;
          ax += couple * weight * (x[m] - restX[m] - ux);
          ay += couple * weight * (y[m] - restY[m] - uy);
          ad += dentCouple * weight * (dent[m] - dent[k]);
        }
        if (pressPower > 0.001) {
          const dx = x[k] - hover.x;
          const dy = y[k] - hover.y;
          const falloff = Math.exp(-(dx * dx + dy * dy) * pressInv);
          ad += dentAnchor * 2.6 * pressDepth * pressPower * falloff;
          ax += (anchor * 0.3 * dx + brush * hover.vx) * pressPower * falloff;
          ay += (anchor * 0.3 * dy + brush * hover.vy) * pressPower * falloff;
        }
        if (grip[k] > 0) {
          ax += grip[k] * (gripStiffness * (gripX[k] - x[k]) - gripDamping * vx[k]);
          ay += grip[k] * (gripStiffness * (gripY[k] - y[k]) - gripDamping * vy[k]);
        }
        vx[k] += ax * dt;
        vy[k] += ay * dt;
        dentV[k] += ad * dt;
        energy += Math.abs(vx[k]) + Math.abs(vy[k]) + Math.abs(dentV[k]) * spacing;
      }
      for (let k = 0; k < count; k++) {
        if (!active[k]) continue;
        x[k] += vx[k] * dt;
        y[k] += vy[k] * dt;
        dent[k] = clamp(dent[k] + dentV[k] * dt, -0.6, 0.85);
      }
      return energy;
    };

    const updateGrip = s => {
      const { pointer } = state;
      const { count, grip, gripX, gripY } = mesh;
      if (!pointer.dragging) return;
      const limit = Math.max(20, Math.min(state.width, state.height) * (0.08 + s.stretch * 0.32));
      const dx = pointer.x - pointer.startX;
      const dy = pointer.y - pointer.startY;
      const length = Math.hypot(dx, dy);
      const eased = length > 0 ? (limit * Math.tanh(length / limit)) / length : 0;
      for (let k = 0; k < count; k++) {
        if (grip[k] <= 0) continue;
        gripX[k] = mesh.anchorX[k] + dx * eased;
        gripY[k] = mesh.anchorY[k] + dy * eased;
      }
    };

    const grab = (px, py, s) => {
      const { count, x, y, grip, active } = mesh;
      const radius = s.grabRadius * 0.3;
      const inv = 1 / (2 * radius * radius);
      mesh.anchorX = new Float32Array(count);
      mesh.anchorY = new Float32Array(count);
      let total = 0;
      for (let k = 0; k < count; k++) {
        if (!active[k]) continue;
        const dx = x[k] - px;
        const dy = y[k] - py;
        const weight = Math.exp(-(dx * dx + dy * dy) * inv);
        grip[k] = weight > 0.03 ? weight : 0;
        mesh.anchorX[k] = x[k];
        mesh.anchorY[k] = y[k];
        total += grip[k];
      }
      return total > 0;
    };

    const release = () => {
      mesh.grip.fill(0);
      state.pointer.dragging = false;
    };

    const poke = (px, py, s) => {
      const { count, x, y, vx, vy, dentV, active } = mesh;
      const radius = s.grabRadius;
      const inv = 1 / (2 * radius * radius);
      const strength = 0.4 + s.press;
      for (let k = 0; k < count; k++) {
        if (!active[k]) continue;
        const dx = x[k] - px;
        const dy = y[k] - py;
        const falloff = Math.exp(-(dx * dx + dy * dy) * inv);
        dentV[k] += 9 * strength * falloff;
        vx[k] += dx * 9 * strength * falloff;
        vy[k] += dy * 9 * strength * falloff;
      }
    };

    const onSurface = (px, py) => {
      const { cols, rows, x, y, active, spacing } = mesh;
      let best = Infinity;
      let bestK = -1;
      const range = Math.ceil(80 / spacing);
      const ci = clamp(Math.round(px / (mesh.width / Math.max(1, cols - 1))), 0, cols - 1);
      const cj = clamp(Math.round(py / (mesh.height / Math.max(1, rows - 1))), 0, rows - 1);
      for (let j = Math.max(0, cj - range); j <= Math.min(rows - 1, cj + range); j++) {
        for (let i = Math.max(0, ci - range); i <= Math.min(cols - 1, ci + range); i++) {
          const k = j * cols + i;
          if (!active[k]) continue;
          const d = Math.hypot(x[k] - px, y[k] - py);
          if (d < best) {
            best = d;
            bestK = k;
          }
        }
      }
      if (bestK < 0) return false;
      return sampleSdf(mesh.restX[bestK] + (px - x[bestK]), mesh.restY[bestK] + (py - y[bestK])) > -4;
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      if (width !== state.width || height !== state.height) {
        const first = !state.ready && !state.buildToken;
        state.width = width;
        state.height = height;
        window.clearTimeout(resizeTimer);
        if (first) rasterize();
        else resizeTimer = window.setTimeout(rasterize, 160);
      }
      wake();
    };

    const render = () => {
      const s = settingsRef.current;
      const colorKey = s.color;
      if (colorKey !== state.colorKey) {
        state.colorKey = colorKey;
        state.color = toRgb(s.color);
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!state.ready || !mesh.indices) return;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, paintTexture);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, slopeTexture);

      if (s.shadow > 0) {
        gl.useProgram(shadowProgram);
        gl.uniform2f(shade.uViewport, mesh.width, mesh.height);
        const drop = Math.min(mesh.width, mesh.height) * 0.035 * s.inflate;
        gl.uniform2f(shade.uOffset, drop * 0.25, drop);
        gl.uniform1i(shade.uField, 0);
        if (s.light) gl.uniform3f(shade.uShadowColor, 0.08, 0.08, 0.14);
        else gl.uniform3f(shade.uShadowColor, 0, 0, 0);
        gl.uniform1f(shade.uShadow, s.shadow * (s.light ? 0.35 : 0.7));
        gl.uniform1f(shade.uClock, state.clock);
        gl.uniform4fv(shade.uParts, partData);
        gl.drawElements(gl.TRIANGLES, mesh.indices, mesh.indexType, 0);
      }

      gl.useProgram(surfaceProgram);
      gl.uniform2f(surface.uViewport, mesh.width, mesh.height);
      gl.uniform2f(surface.uOffset, 0, 0);
      gl.uniform1i(surface.uField, 0);
      gl.uniform1i(surface.uPaint, 1);
      gl.uniform1i(surface.uSlope, 2);
      const yaw = state.turn.x;
      const pitch = state.turn.y;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      turnMatrix[0] = cy;
      turnMatrix[1] = sy * sp;
      turnMatrix[2] = -sy * cp;
      turnMatrix[3] = 0;
      turnMatrix[4] = cp;
      turnMatrix[5] = sp;
      turnMatrix[6] = sy;
      turnMatrix[7] = -cy * sp;
      turnMatrix[8] = cy * cp;
      gl.uniformMatrix3fv(surface.uTurn, false, turnMatrix);
      gl.uniform3f(surface.uColor, state.color[0], state.color[1], state.color[2]);
      gl.uniform1f(surface.uPaintMix, s.src && s.imageColors ? 1 : 0);
      gl.uniform1f(surface.uMaterial, s.material);
      gl.uniform1f(surface.uLight, s.light ? 1 : 0);
      gl.uniform1f(surface.uInflate, s.inflate);
      gl.uniform1f(surface.uClock, state.clock);
      gl.uniform4fv(surface.uParts, partData);
      gl.drawElements(gl.TRIANGLES, mesh.indices, mesh.indexType, 0);
      gl.bindVertexArray(null);
    };

    const frame = now => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;

      if (reduce || !s.intro) state.clock = 10;
      else if (state.ready && state.clock < 10) state.clock = state.clock + dt > 1.8 ? 10 : state.clock + dt;

      const hover = state.hover;
      const pointer = state.pointer;
      const pressing =
        state.ready && (pointer.dragging || (pointer.inside && !pointer.down && onSurface(pointer.x, pointer.y)));
      const follow = 1 - Math.exp(-dt / 0.05);
      const nextX = hover.x + (pointer.x - hover.x) * follow;
      const nextY = hover.y + (pointer.y - hover.y) * follow;
      const blend = 1 - Math.exp(-dt / 0.04);
      hover.vx += ((nextX - hover.x) / Math.max(dt, 0.001) - hover.vx) * blend;
      hover.vy += ((nextY - hover.y) / Math.max(dt, 0.001) - hover.vy) * blend;
      hover.x = nextX;
      hover.y = nextY;
      const goal = pressing ? 1 : 0;
      hover.power += (goal - hover.power) * (1 - Math.exp(-dt / (pressing ? 0.12 : 0.25)));

      const turn = state.turn;
      const aimX = pointer.inside && !reduce ? (pointer.x / Math.max(1, mesh.width) - 0.5) * 0.7 : 0;
      const aimY = pointer.inside && !reduce ? (pointer.y / Math.max(1, mesh.height) - 0.5) * 0.4 : 0;
      turn.vx += (28 * (aimX - turn.x) - 10 * turn.vx) * dt;
      turn.vy += (28 * (aimY - turn.y) - 10 * turn.vy) * dt;
      turn.x += turn.vx * dt;
      turn.y += turn.vy * dt;
      const turning =
        Math.abs(aimX - turn.x) > 0.0005 ||
        Math.abs(aimY - turn.y) > 0.0005 ||
        Math.abs(turn.vx) > 0.001 ||
        Math.abs(turn.vy) > 0.001;

      let energy = 0;
      if (state.ready) {
        updateGrip(s);
        state.accumulator += dt;
        let steps = 0;
        while (state.accumulator >= STEP && steps < 40) {
          energy = solve(STEP, s);
          state.accumulator -= STEP;
          steps++;
        }
        if (steps === 40) state.accumulator = 0;
        writeDynamic();
      }
      state.energy = energy;
      render();

      const settling =
        !state.ready ||
        state.clock < 10 ||
        Math.abs(goal - hover.power) > 0.002 ||
        turning ||
        Math.hypot(pointer.x - hover.x, pointer.y - hover.y) > 0.1 ||
        pointer.dragging ||
        energy > 0.05 * Math.max(1, mesh.activeCount);
      if (settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const locatePointer = event => {
      const rect = container.getBoundingClientRect();
      state.pointer.x = event.clientX - rect.left;
      state.pointer.y = event.clientY - rect.top;
      state.pointer.inside =
        state.pointer.x >= 0 && state.pointer.y >= 0 && state.pointer.x <= rect.width && state.pointer.y <= rect.height;
    };

    const onPointerMove = event => {
      locatePointer(event);
      wake();
    };

    const onPointerDown = event => {
      locatePointer(event);
      if (!state.ready || !onSurface(state.pointer.x, state.pointer.y)) return;
      const s = settingsRef.current;
      state.pointer.down = true;
      state.pointer.startX = state.pointer.x;
      state.pointer.startY = state.pointer.y;
      state.pointer.startTime = performance.now();
      state.pointer.dragging = grab(state.pointer.x, state.pointer.y, s);
      container.setPointerCapture?.(event.pointerId);
      wake();
    };

    const onPointerUp = event => {
      if (!state.pointer.down) return;
      locatePointer(event);
      const s = settingsRef.current;
      const moved = Math.hypot(state.pointer.x - state.pointer.startX, state.pointer.y - state.pointer.startY);
      const quick = performance.now() - state.pointer.startTime < 260;
      release();
      if (moved < 8 && quick) poke(state.pointer.x, state.pointer.y, s);
      state.pointer.down = false;
      wake();
    };

    const onPointerLeave = () => {
      state.pointer.inside = false;
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
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    contentRef.current = () => {
      state.ready = false;
      state.clock = settingsRef.current.intro && !reduce ? 0 : 10;
      rasterize();
    };
    wakeRef.current = () => {
      if (!raf) render();
      wake();
    };

    return () => {
      alive = false;
      state.buildToken++;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      wakeRef.current = null;
      contentRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(restBuffer);
      gl.deleteBuffer(dynamicBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteTexture(fieldTexture);
      gl.deleteTexture(paintTexture);
      gl.deleteTexture(slopeTexture);
      gl.deleteProgram(surfaceProgram);
      gl.deleteProgram(shadowProgram);
    };
  }, []);

  useEffect(() => {
    if (builtRef.current === contentKey) return;
    builtRef.current = contentKey;
    contentRef.current?.();
  }, [contentKey]);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={containerRef}
      className={`elastic-mesh${className ? ` ${className}` : ''}`}
      style={style}
      role="img"
      aria-label={settings.src ? 'Elastic logo' : settings.text}
      {...rest}
    >
      <canvas ref={canvasRef} className="elastic-mesh-canvas" aria-hidden="true" />
    </div>
  );
};

export default ElasticMesh;
