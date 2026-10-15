import { defaultValues, layoutParams } from '../engine/materialParams';

const round = value => (typeof value === 'number' ? Math.round(value * 10000) / 10000 : value);

const literal = value => JSON.stringify(Array.isArray(value) ? value.map(round) : round(value));

const glslNumber = value => {
  const number = round(Number(value) || 0);
  return Number.isInteger(number) ? `${number}.0` : String(number);
};

const BEVEL = { bevel: 0.4, bend: 2.5, strength: 0.25, angle: 225 };

const bevelOf = gloss =>
  gloss?.on ? { ...BEVEL, ...gloss, bevel: Math.max(gloss.bevel ?? BEVEL.bevel, 0.005) } : null;

const bevelHelpers = bevel => {
  const angle = (bevel.angle * Math.PI) / 180;
  return `
vec3 bevelNormal(vec2 p, out vec2 shift) {
  vec4 sf = texture(uSurf, p * uFieldScale + 0.5);
  float q = 1.0 - clamp(sf.x, 0.0, 1.0);
  float slope = q / max(sqrt(max(1.0 - q * q, 0.0)), 0.12);
  shift = -sf.yz * q * ${glslNumber(bevel.bevel * bevel.bevel * bevel.bend * 0.6)};
  return normalize(vec3(-sf.yz * slope * ${glslNumber(bevel.bevel)}, 1.0));
}

vec3 dither(vec2 f) {
  float a = fract(52.9829189 * fract(dot(f, vec2(0.06711056, 0.00583715))));
  float b = fract(52.9829189 * fract(dot(f + vec2(17.0, 31.0), vec2(0.06711056, 0.00583715))));
  return vec3((a + b - 1.0) / 255.0);
}

float bevelLight(vec3 N) {
  vec3 L = normalize(vec3(${glslNumber(Math.cos(angle) * 0.62)}, ${glslNumber(Math.sin(angle) * 0.62)}, 0.78));
  float diffuse = max(dot(N, L), 0.0) / L.z;
  float occlusion = mix(1.0, 0.78, 1.0 - N.z);
  return mix(1.0, diffuse * occlusion, ${glslNumber(bevel.strength)});
}
`;
};

const prelude = (def, layout) => `#version 300 es
precision highp float;
#define PI 3.14159265359
#define TAU 6.28318530718
#define MATERIAL_OUTSIDE ${def.outside ? 'true' : 'false'}
#define MATERIAL_REACH ${(def.reach ?? 0.32).toFixed(4)}
uniform sampler2D uField;
uniform sampler2D uSurf;
uniform vec2 uFieldScale;
uniform vec2 uResolution;
uniform float uTime;
uniform vec4 uMatP[8];
uniform vec4 uMatC[16];
uniform vec4 uSurface;
out vec4 outColor;
${layout.defines}

struct Surface {
  vec2 p;
  vec2 uv;
  vec2 frag;
  vec2 res;
  float unit;
  float px;
  float d;
  float aa;
  float cov;
  vec2 n;
  float slope;
  float time;
};

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, s, -s, c);
}

float smin(float a, float b, float k) {
  if (k <= 0.0) return min(a, b);
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float smax(float a, float b, float k) {
  return -smin(-a, -b, k);
}

vec4 over(vec4 base, vec4 top) {
  return top + base * (1.0 - top.a);
}

vec3 toLinear(vec3 c) {
  return pow(c, vec3(2.2));
}

vec3 toDisplay(vec3 c) {
  return pow(max(c, 0.0), vec3(1.0 / 2.2));
}

float shapeAt(vec2 q) {
  return texture(uField, q * uFieldScale + 0.5).r;
}

vec4 backdropAt(vec2 q) {
  return vec4(0.0);
}

float surfaceRim(Surface s, float width) {
  return clamp(1.0 + s.d / max(width, 1e-4), 0.0, 1.0);
}

vec3 domeNormal(Surface s, float width) {
  float x = min(surfaceRim(s, width), 0.985) * smoothstep(0.15, 0.85, s.slope);
  return normalize(vec3(s.n * x, sqrt(1.0 - x * x)));
}

float domeHeight(Surface s, float width) {
  float x = surfaceRim(s, width);
  return sqrt(max(1.0 - x * x, 0.0));
}
`;

const surfaceBlock = (surfaceWidth, normals = true) => `
  float unit = min(uResolution.x, uResolution.y) * 0.5;
  vec2 frag = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 p = (frag - uResolution * 0.5) / unit;
  float px = 1.0 / unit;
  float bw = max(${surfaceWidth}, px);
  float e = clamp(bw * 0.2, px * 1.5, max(bw * 0.5, px * 1.5));
  float d = shapeAt(p);
  float aa = clamp(length(vec2(dFdx(d), dFdy(d))), px * 0.5, px * 1.5);
  vec2 g = ${normals ? 'vec2(shapeAt(p + vec2(e, 0.0)) - shapeAt(p - vec2(e, 0.0)), shapeAt(p + vec2(0.0, e)) - shapeAt(p - vec2(0.0, e))) / (2.0 * e)' : 'vec2(0.0)'};
  Surface s;
  s.p = p;
  s.uv = frag / uResolution;
  s.frag = frag;
  s.res = uResolution;
  s.unit = unit;
  s.px = px;
  s.d = d;
  s.aa = aa;
  s.cov = clamp(0.5 - d / aa, 0.0, 1.0);
  s.slope = length(g);
  s.n = s.slope > 1e-5 ? g / s.slope : vec2(0.0);
  s.time = uTime;
`;

const shapeShader = (def, layout) => `${prelude(def, layout)}
${def.glsl}

void main() {
${surfaceBlock('uSurface.x', def.normals !== false)}
  vec4 m = material(s);
  float reach = 1.0 - smoothstep(MATERIAL_REACH * 0.55, MATERIAL_REACH, d);
  float a = clamp(MATERIAL_OUTSIDE ? m.a * max(reach, s.cov) : m.a * s.cov, 0.0, 1.0);
  outColor = vec4(clamp(m.rgb, 0.0, 1.0) * a, a);
}
`;

const fillShader = (def, layout, bevel) => `${prelude(def, layout)}
${def.glsl}
${bevel ? bevelHelpers(bevel) : ''}
void main() {
${surfaceBlock('0.2', false)}
  vec4 fc;${
    bevel
      ? `
  vec2 shift;
  vec3 N = bevelNormal(p, shift);
  fc = fill(p + shift, uTime);
  fc.rgb = clamp(fc.rgb * bevelLight(N) + dither(gl_FragCoord.xy), 0.0, 1.0);`
      : `
  fc = fill(p, uTime);`
  }
  float a = clamp(fc.a * s.cov, 0.0, 1.0);
  outColor = vec4(clamp(fc.rgb, 0.0, 1.0) * a, a);
}
`;

const packLines = layout =>
  layout.slots
    .map(slot => {
      const name = slot.param.name;
      if (slot.color !== undefined && slot.size) {
        return `  const ${name}List = (Array.isArray(${name}) ? ${name} : [${name}]).slice(0, ${slot.size});
  ${name}List.forEach((value, index) => colors.set(toRgba(value), (${slot.color} + index) * 4));
  floats[${slot.count}] = ${name}List.length;`;
      }
      if (slot.color !== undefined) return `  colors.set(toRgba(${name}), ${slot.color * 4});`;
      if (slot.param.type === 'boolean') return `  floats[${slot.float}] = ${name} ? 1 : 0;`;
      return `  floats[${slot.float}] = Number(${name}) || 0;`;
    })
    .join('\n');

const CREDITS = {
  'shaders.com':
    'Material adapted from Shaders.com by Shader Effects Inc., MIT License, https://github.com/shader-effects-inc/shaders',
  paper: 'Material adapted from Paper Shaders, Apache License 2.0, https://github.com/paper-design/shaders'
};

const SOLVER = `
const shrink = (data, width, height) => {
  const w = Math.max(1, Math.floor(width / 2));
  const h = Math.max(1, Math.floor(height / 2));
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * 2 * width + x * 2;
      const r = Math.min(x * 2 + 1, width - 1) - x * 2;
      const d = (Math.min(y * 2 + 1, height - 1) - y * 2) * width;
      out[y * w + x] = (data[i] + data[i + r] + data[i + d] + data[i + d + r]) * 0.25;
    }
  }
  return { data: out, width: w, height: h };
};

const grow = (coarse, cw, ch, width, height) => {
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const fy = Math.min(Math.max((y + 0.5) / 2 - 0.5, 0), ch - 1);
    const y0 = Math.floor(fy);
    const y1 = Math.min(y0 + 1, ch - 1);
    for (let x = 0; x < width; x++) {
      const fx = Math.min(Math.max((x + 0.5) / 2 - 0.5, 0), cw - 1);
      const x0 = Math.floor(fx);
      const x1 = Math.min(x0 + 1, cw - 1);
      const a = coarse[y0 * cw + x0] * (1 - fx + x0) + coarse[y0 * cw + x1] * (fx - x0);
      const b = coarse[y1 * cw + x0] * (1 - fx + x0) + coarse[y1 * cw + x1] * (fx - x0);
      out[y * width + x] = a * (1 - fy + y0) + b * (fy - y0);
    }
  }
  return out;
};

const relaxLevel = (sdf, width, height, unit, length, start, sweeps) => {
  const pixels = Math.max(length * unit, 0.75);
  const screen = 1 / (pixels * pixels);
  const count = width * height;
  const inside = new Uint8Array(count);
  for (let i = 0; i < count; i++) inside[i] = sdf[i] < 0 ? 1 : 0;
  const weights = new Float32Array(count * 4);
  const diagonal = new Float32Array(count);
  const theta = (c, n) => Math.max(0.1, Math.min(1, sdf[c] / (sdf[c] - sdf[n])));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = y * width + x;
      if (!inside[c]) continue;
      const near = [x + 1 < width ? c + 1 : -1, x > 0 ? c - 1 : -1, y + 1 < height ? c + width : -1, y > 0 ? c - width : -1];
      const t = near.map(n => (n >= 0 && inside[n] ? 1 : n >= 0 ? theta(c, n) : 0.1));
      const kx = 2 / (t[0] + t[1]);
      const ky = 2 / (t[2] + t[3]);
      near.forEach((n, k) => {
        weights[c * 4 + k] = n >= 0 && inside[n] ? (k < 2 ? kx : ky) / t[k] : 0;
      });
      diagonal[c] = kx * (1 / t[0] + 1 / t[1]) + ky * (1 / t[2] + 1 / t[3]) + screen;
    }
  }
  const u = start || new Float32Array(count);
  for (let i = 0; i < count; i++) {
    if (!inside[i]) u[i] = 0;
    else if (!start) u[i] = 1 - Math.exp((sdf[i] * unit) / pixels);
  }
  for (let sweep = 0; sweep < sweeps; sweep++) {
    for (let parity = 0; parity < 2; parity++) {
      for (let y = 0; y < height; y++) {
        for (let x = (y + parity) & 1; x < width; x += 2) {
          const c = y * width + x;
          if (!inside[c]) continue;
          const w = c * 4;
          const sum =
            screen +
            weights[w] * (u[c + 1] || 0) +
            weights[w + 1] * (u[c - 1] || 0) +
            weights[w + 2] * (u[c + width] || 0) +
            weights[w + 3] * (u[c - width] || 0);
          u[c] += 1.6 * (sum / diagonal[c] - u[c]);
        }
      }
    }
  }
  return u;
};

const inflate = (field, length) => {
  const { data, width, height } = field;
  const unit = Math.min(width, height) / 2;
  const levels = [{ data, width, height, unit }];
  while (Math.min(levels[levels.length - 1].width, levels[levels.length - 1].height) > 40) {
    const last = levels[levels.length - 1];
    levels.push({ ...shrink(last.data, last.width, last.height), unit: last.unit / 2 });
  }
  let u = null;
  for (let index = levels.length - 1; index >= 0; index--) {
    const level = levels[index];
    const coarser = levels[index + 1];
    const start = u && coarser ? grow(u, coarser.width, coarser.height, level.width, level.height) : null;
    const sweeps = index === levels.length - 1 ? 60 : index === 0 ? 14 : 10;
    u = relaxLevel(level.data, level.width, level.height, level.unit, length, start, sweeps);
  }
  const out = new Float32Array(width * height * 4);
  const inside = i => data[i] < 0;
  const theta = (c, n) => Math.max(0.08, Math.min(1, data[c] / (data[c] - data[n])));
  const slope = (c, plus, minus) => {
    const pIn = plus < 0 || inside(plus);
    const mIn = minus < 0 || inside(minus);
    const up = plus < 0 ? u[c] : pIn ? u[plus] : 0;
    const um = minus < 0 ? u[c] : mIn ? u[minus] : 0;
    if (pIn && mIn) return (up - um) / 2;
    const tp = pIn ? 1 : theta(c, plus);
    const tm = mIn ? 1 : theta(c, minus);
    return (tm * tm * up - tp * tp * um - (tm * tm - tp * tp) * u[c]) / (tm * tp * (tm + tp));
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = y * width + x;
      if (!inside(c)) continue;
      out[c * 4] = u[c];
      out[c * 4 + 1] = slope(c, x + 1 < width ? c + 1 : -1, x > 0 ? c - 1 : -1) * unit;
      out[c * 4 + 2] = slope(c, y + 1 < height ? c + width : -1, y > 0 ? c - width : -1) * unit;
      out[c * 4 + 3] = 1;
    }
  }
  const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let ring = 0; ring < 2; ring++) {
    const next = out.slice();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const c = (y * width + x) * 4;
        if (out[c + 3] > 0.25) continue;
        let sum = 0;
        let gx = 0;
        let gy = 0;
        let count = 0;
        for (const [dx, dy] of sides) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const k = (ny * width + nx) * 4;
          if (out[k + 3] < 0.25) continue;
          sum += out[k] - (out[k + 1] * dx + out[k + 2] * dy) / unit;
          gx += out[k + 1];
          gy += out[k + 2];
          count += 1;
        }
        if (!count) continue;
        next[c] = sum / count;
        next[c + 1] = gx / count;
        next[c + 2] = gy / count;
        next[c + 3] = 0.5;
      }
    }
    out.set(next);
  }
  const weights = [1, 2, 3, 4].map(k => Math.exp(-(k * k) / 2.88));
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const source = out.slice();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const c = (y * width + x) * 4;
        if (source[c + 3] < 0.25) continue;
        let total = 1;
        const sum = [source[c], source[c + 1], source[c + 2]];
        for (let k = 1; k <= 4; k++) {
          for (const sign of [1, -1]) {
            const nx = Math.min(width - 1, Math.max(0, x + dx * k * sign));
            const ny = Math.min(height - 1, Math.max(0, y + dy * k * sign));
            const n = (ny * width + nx) * 4;
            if (source[n + 3] < 0.25) continue;
            const w = weights[k - 1];
            sum[0] += w * source[n];
            sum[1] += w * source[n + 1];
            sum[2] += w * source[n + 2];
            total += w;
          }
        }
        out[c] = sum[0] / total;
        out[c + 1] = sum[1] / total;
        out[c + 2] = sum[2] / total;
      }
    }
  }
  return out;
};
`;

export function proceduralCode(def, values, { name, gloss, assetName, aspect }) {
  const layout = layoutParams(def.params);
  const settings = { ...defaultValues(def.params), ...values };
  const bevel = def.kind === 'fill' ? bevelOf(gloss) : null;
  const fragment = def.kind === 'fill' ? fillShader(def, layout, bevel) : shapeShader(def, layout);
  const names = def.params.map(param => param.name);
  const surface = typeof def.surface === 'number' ? def.surface : (settings[def.surface] ?? 0.2);
  const signature = names.map(param => `${param} = ${literal(settings[param])}`).join(',\n  ');
  const list = names.join(', ');
  const credit = CREDITS[def.source] ? `\n${name}.credits = '${CREDITS[def.source]}';\n` : '';
  const inflated = Boolean(bevel);
  const code = `import { useEffect, useRef } from 'react';
import logo from './${assetName}';

const VERTEX = \`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}\`;

const FRAGMENT = \`${fragment.replace(/`/g, '\\`')}\`;

const toRgba = value => {
  const hex = String(value || '#ffffff').replace('#', '');
  const full = hex.length <= 4 ? hex.split('').map(char => char + char).join('') : hex;
  const channel = index => parseInt(full.slice(index, index + 2), 16) / 255;
  return [channel(0), channel(2), channel(4), full.length >= 8 ? channel(6) : 1];
};

const solve = (grid, offset, stride, length, f, v, z) => {
  for (let i = 0; i < length; i++) f[i] = grid[offset + i * stride];
  let k = 0;
  v[0] = 0;
  z[0] = -1e20;
  z[1] = 1e20;
  for (let q = 1; q < length; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    grid[offset + q * stride] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
};

const distances = (grid, width, height) => {
  const size = Math.max(width, height);
  const f = new Float64Array(size);
  const v = new Int32Array(size);
  const z = new Float64Array(size + 1);
  for (let x = 0; x < width; x++) solve(grid, x, width, height, f, v, z);
  for (let y = 0; y < height; y++) solve(grid, y * width, 1, width, f, v, z);
};

const loadField = src =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const long = 640;
      const ratio = image.width / image.height || 1;
      const width = Math.round(ratio >= 1 ? long : long * ratio);
      const height = Math.round(ratio >= 1 ? long / ratio : long);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      const outer = new Float64Array(width * height);
      const inner = new Float64Array(width * height);
      for (let i = 0; i < width * height; i++) {
        const a = pixels[i * 4 + 3] / 255;
        const edge = 0.5 - a;
        outer[i] = a >= 1 ? 0 : a <= 0 ? 1e20 : edge > 0 ? edge * edge : 0;
        inner[i] = a <= 0 ? 0 : a >= 1 ? 1e20 : edge < 0 ? edge * edge : 0;
      }
      distances(outer, width, height);
      distances(inner, width, height);
      const unit = Math.min(width, height) / 2;
      const data = new Float32Array(width * height);
      for (let i = 0; i < data.length; i++) data[i] = (Math.sqrt(outer[i]) - Math.sqrt(inner[i])) / unit;
      resolve({ data, width, height });
    };
    image.onerror = reject;
    image.src = src;
  });

${inflated ? SOLVER : ''}
const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

export default function ${name}({
  src = logo,
  className,
  style,
  ${signature}
}) {
  const canvasRef = useRef(null);
  const settings = useRef({});
  settings.current = { ${list} };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return undefined;
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uniform = name => gl.getUniformLocation(program, name);
    const texture = gl.createTexture();
    const surface = gl.createTexture();
    let field = null;
    let frame = 0;
    let alive = true;
    const started = performance.now();

    const pack = ({ ${list} }) => {
      const floats = new Float32Array(32);
      const colors = new Float32Array(64);
${packLines(layout)}
      return { floats, colors };
    };

    const render = now => {
      frame = requestAnimationFrame(render);
      if (!field) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const { floats, colors } = pack(settings.current);
      const fieldUnit = Math.min(field.width, field.height) / 2;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uniform('uResolution'), width, height);
      gl.uniform2f(uniform('uFieldScale'), fieldUnit / field.width, fieldUnit / field.height);
      gl.uniform1f(uniform('uTime'), (now - started) / 1000);
      gl.uniform4fv(uniform('uMatP'), floats);
      gl.uniform4fv(uniform('uMatC'), colors);
      gl.uniform4f(uniform('uSurface'), ${glslNumber(surface).replace(/\.0$/, '')}, 0, 0, 0);
      gl.uniform1i(uniform('uField'), 0);
      gl.uniform1i(uniform('uSurf'), 1);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    loadField(src)
      .then(result => {
        if (!alive) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, result.width, result.height, 0, gl.RED, gl.FLOAT, result.data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);${
          inflated
            ? `
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, surface);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, result.width, result.height, 0, gl.RGBA, gl.FLOAT, inflate(result, ${round(bevel?.bevel)}));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.activeTexture(gl.TEXTURE0);`
            : ''
        }
        field = result;
      })
      .catch(() => {});
    frame = requestAnimationFrame(render);

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      gl.deleteTexture(texture);
      gl.deleteTexture(surface);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', aspectRatio: '${aspect}', ...style }}
    />
  );
}
${credit}`;
  return { code, install: null };
}
