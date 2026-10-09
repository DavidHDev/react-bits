'use client';

import { useEffect, useRef } from 'react';

const ROOT = 'relative h-full w-full';
const CANVAS = 'pointer-events-none absolute inset-0 block h-full w-full';
const CONTENT = 'relative z-[1] flex h-full w-full items-center justify-center';

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const SHAPE = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uDpr;
uniform int uShape;
uniform float uSides;
uniform vec2 uHalf;
uniform float uRadius;
uniform float uRound;
uniform sampler2D uFieldTexture;
uniform vec2 uField;
uniform float uThickness;
uniform float uFill;
uniform float uEchoes;
uniform float uSpacing;
uniform float uAngle;
out vec4 outColor;

const float PI = 3.14159265;

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sdPolygon(vec2 p, float r, float n) {
  float an = PI / n;
  vec2 acs = vec2(cos(an), sin(an));
  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p.y += clamp(-p.y, 0.0, r * acs.y);
  return length(p) * sign(p.x);
}

float sdStar(vec2 p, float r, float n, float m) {
  float an = PI / n;
  float en = PI / m;
  vec2 acs = vec2(cos(an), sin(an));
  vec2 ecs = vec2(cos(en), sin(en));
  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
  return length(p) * sign(p.x);
}

float shapeDistance(vec2 p) {
  if (uShape < 0) return 1e5;
  float c = cos(uAngle);
  float s = sin(uAngle);
  p = mat2(c, -s, s, c) * p;
  if (uShape == 0) return sdRoundBox(p, uHalf, uRound);
  if (uShape == 1) return length(p) - uRadius;
  if (uShape == 2) return sdPolygon(p, uRadius - uRound, uSides) - uRound;
  if (uShape == 3) return sdStar(p, uRadius - uRound, uSides, mix(2.0, uSides, 0.42)) - uRound;
  vec2 uv = p / (2.0 * uField.x) + 0.5;
  vec2 inside = clamp(uv, 0.0, 1.0);
  float d = texture(uFieldTexture, vec2(inside.x, 1.0 - inside.y)).r * uField.y;
  return d + length((uv - inside) * 2.0 * uField.x);
}

void main() {
  vec2 p = gl_FragCoord.xy / uDpr - 0.5 * uResolution;
  float d = shapeDistance(p);
  float aa = 1.0 / uDpr;
  float hw = 0.5 * uThickness;
  float cover = uFill > 0.5 ? clamp(0.5 - d / aa, 0.0, 1.0) : 0.0;
  for (int i = 0; i < 24; i++) {
    if (float(i) >= uEchoes) break;
    if (uFill > 0.5 && i == 0) continue;
    float x = uFill > 0.5 ? d - float(i) * uSpacing : d + float(i) * uSpacing;
    cover = max(cover, clamp((hw - abs(x)) / aa + 0.5, 0.0, 1.0));
  }
  outColor = vec4(cover, 0.0, 0.0, 1.0);
}`;

const BLUR = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform float uLod;
uniform vec2 uStep;
uniform vec2 uScale;
out vec4 outColor;

void main() {
  vec2 size = vec2(textureSize(uSource, int(uLod)));
  vec2 center = gl_FragCoord.xy * uScale;
  float sum = textureLod(uSource, center / size, uLod).r * 6.0;
  sum += textureLod(uSource, (center - uStep) / size, uLod).r * 4.0;
  sum += textureLod(uSource, (center + uStep) / size, uLod).r * 4.0;
  sum += textureLod(uSource, (center - 2.0 * uStep) / size, uLod).r;
  sum += textureLod(uSource, (center + 2.0 * uStep) / size, uLod).r;
  outColor = vec4(sum / 16.0, 0.0, 0.0, 1.0);
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uPyramid;
uniform float uMaxLod;
uniform vec2 uResolution;
uniform float uDpr;
uniform float uThickness;
uniform float uFill;
uniform float uEchoes;
uniform float uSpacing;
uniform vec3 uColor;
uniform float uBackdrop;
uniform float uBlur;
uniform vec3 uLens;
uniform vec2 uLensShape;
uniform float uFocus;
uniform float uChroma;
out vec4 outColor;

float bspline(vec2 uv, float lod) {
  vec2 size = vec2(textureSize(uPyramid, int(lod)));
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 p0 = (i - 0.5 + w1 / g0) / size;
  vec2 p1 = (i + 1.5 + w3 / g1) / size;
  float a = textureLod(uPyramid, p0, lod).r;
  float b = textureLod(uPyramid, vec2(p1.x, p0.y), lod).r;
  float c = textureLod(uPyramid, vec2(p0.x, p1.y), lod).r;
  float d = textureLod(uPyramid, p1, lod).r;
  return g0.y * (g0.x * a + g1.x * b) + g1.y * (g0.x * c + g1.x * d);
}

float blurred(vec2 uv, float sigma) {
  if (sigma <= 0.6) return textureLod(uPyramid, uv, 0.0).r;
  float lod = sigma < 1.7 ? (sigma - 0.6) / 1.1 : log2(sigma / 0.866);
  lod = clamp(lod, 0.0, uMaxLod);
  float base = floor(lod);
  float t = lod - base;
  float a = base < 0.5 ? textureLod(uPyramid, uv, 0.0).r : bspline(uv, base);
  if (t < 0.001) return a;
  return mix(a, bspline(uv, min(base + 1.0, uMaxLod)), t);
}

void main() {
  vec2 texel = 1.0 / vec2(textureSize(uPyramid, 0));
  vec2 uv = gl_FragCoord.xy * texel;
  vec2 p = gl_FragCoord.xy / uDpr - 0.5 * uResolution;
  vec2 toLens = p - uLens.xy;
  float lensDistance = length(toLens);
  float lens = uLens.z * (1.0 - smoothstep(uLensShape.x * (1.0 - uLensShape.y), uLensShape.x, lensDistance));
  float amount = mix(lens, 1.0 - lens, uFocus);
  float sigma = uBlur * amount * uDpr;
  vec2 dir = lensDistance > 0.001 ? toLens / lensDistance : vec2(0.0);
  vec2 split = dir * uChroma * 0.3 * sigma * texel;
  vec3 cover = vec3(
    blurred(uv - split, sigma * (1.0 + uChroma * 0.25)),
    blurred(uv, sigma),
    blurred(uv + split, sigma * (1.0 - uChroma * 0.2))
  );
  if (uFill < 0.5) {
    float spread = sigma / uDpr;
    float reach = uEchoes > 1.5 ? min(spread, uSpacing) : spread;
    cover *= 1.0 + 0.6 * max(reach - 0.5, 0.0) / max(uThickness, 0.5);
  }
  cover = mix(cover, 0.85 + 0.15 * (1.0 - exp((0.85 - cover) / 0.15)), step(0.85, cover));
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  cover = clamp(cover + grain / 255.0, 0.0, 1.0);
  float alpha = max(max(cover.r, cover.g), cover.b);
  outColor = vec4(uColor * cover + (alpha - cover) * uBackdrop, alpha);
}`;

const SHAPES = ['rect', 'circle', 'polygon', 'star'];
const FIELD = 512;
const PAD = 0.35;
const FAR = 1e20;

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

const link = (gl, vertex, source) => {
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
  const program = gl.createProgram();
  if (!fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
};

const locate = (gl, program, names) => {
  const map = {};
  for (const name of names) map[name] = gl.getUniformLocation(program, name);
  return map;
};

const sweep = (grid, offset, stride, length, f, v, z) => {
  for (let q = 0; q < length; q++) f[q] = grid[offset + q * stride];
  let k = 0;
  v[0] = 0;
  z[0] = -FAR;
  z[1] = FAR;
  for (let q = 1; q < length; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * (q - v[k]));
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * (q - v[k]));
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = FAR;
  }
  k = 0;
  for (let q = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    const gap = q - v[k];
    grid[offset + q * stride] = gap * gap + f[v[k]];
  }
};

const distanceTransform = (grid, size) => {
  const f = new Float64Array(size);
  const v = new Int32Array(size);
  const z = new Float64Array(size + 1);
  for (let x = 0; x < size; x++) sweep(grid, x, size, size, f, v, z);
  for (let y = 0; y < size; y++) sweep(grid, y * size, 1, size, f, v, z);
};

const buildField = image => {
  const raster = document.createElement('canvas');
  raster.width = FIELD;
  raster.height = FIELD;
  const ctx = raster.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const width = image.naturalWidth || FIELD;
  const height = image.naturalHeight || FIELD;
  const scale = FIELD / (1 + PAD) / Math.max(width, height);
  ctx.drawImage(image, (FIELD - width * scale) / 2, (FIELD - height * scale) / 2, width * scale, height * scale);
  const pixels = ctx.getImageData(0, 0, FIELD, FIELD).data;
  const outside = new Float64Array(FIELD * FIELD);
  const inside = new Float64Array(FIELD * FIELD);
  for (let i = 0; i < FIELD * FIELD; i++) {
    const alpha = pixels[i * 4 + 3] / 255;
    const edge = 0.5 - alpha;
    outside[i] = alpha >= 0.999 ? 0 : alpha <= 0.001 ? FAR : edge > 0 ? edge * edge : 0;
    inside[i] = alpha >= 0.999 ? FAR : alpha <= 0.001 ? 0 : edge < 0 ? edge * edge : 0;
  }
  distanceTransform(outside, FIELD);
  distanceTransform(inside, FIELD);
  const field = new Float32Array(FIELD * FIELD);
  for (let i = 0; i < FIELD * FIELD; i++) field[i] = Math.sqrt(outside[i]) - Math.sqrt(inside[i]);
  return field;
};

const ShapeBlur = ({
  shape = 'rect',
  src,
  sides = 6,
  size = 0.8,
  roundness = 0.2,
  thickness = 2,
  fill = false,
  echoes = 1,
  spacing = 12,
  color = '#ffffff',
  blur = 16,
  lensSize = 0.3,
  lensSoftness = 0.7,
  focus = false,
  chroma = 0.3,
  rotation = 0,
  spin = 0,
  idle = true,
  children,
  className = '',
  style
}) => {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const controlRef = useRef(null);
  const settings = {
    shape: Math.max(0, SHAPES.indexOf(shape)),
    src: src || '',
    sides: clamp(Math.round(sides), 3, 12),
    size: clamp(size, 0.05, 1),
    roundness: clamp(roundness, 0, 1),
    thickness: clamp(thickness, 0.5, 40),
    fill,
    echoes: clamp(Math.round(echoes), 1, 24),
    spacing: Math.max(1, spacing),
    color,
    blur: Math.max(0, blur),
    lensSize: clamp(lensSize, 0.02, 2),
    lensSoftness: clamp(lensSoftness, 0, 1),
    focus,
    chroma: clamp(chroma, 0, 1),
    rotation,
    spin,
    idle
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!root || !canvas || !gl) return undefined;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    if (!vertex) return undefined;
    const shapeProgram = link(gl, vertex, SHAPE);
    const blurProgram = link(gl, vertex, BLUR);
    const compositeProgram = link(gl, vertex, COMPOSITE);
    if (!shapeProgram || !blurProgram || !compositeProgram) return undefined;

    const shapeUniforms = locate(gl, shapeProgram, [
      'uResolution',
      'uDpr',
      'uShape',
      'uSides',
      'uHalf',
      'uRadius',
      'uRound',
      'uFieldTexture',
      'uField',
      'uThickness',
      'uFill',
      'uEchoes',
      'uSpacing',
      'uAngle'
    ]);
    const blurUniforms = locate(gl, blurProgram, ['uSource', 'uLod', 'uStep', 'uScale']);
    const compositeUniforms = locate(gl, compositeProgram, [
      'uPyramid',
      'uMaxLod',
      'uResolution',
      'uDpr',
      'uThickness',
      'uFill',
      'uEchoes',
      'uSpacing',
      'uColor',
      'uBackdrop',
      'uBlur',
      'uLens',
      'uLensShape',
      'uFocus',
      'uChroma'
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const precise = Boolean(gl.getExtension('EXT_color_buffer_float'));
    const format = precise ? gl.R16F : gl.R8;
    const framebuffer = gl.createFramebuffer();

    const fieldTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([1e4]));

    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeCtx = probe.getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const pointer = { x: 0, y: 0, active: false };
    const lens = { x: 0, y: 0, power: 0, placed: false };
    const pyramid = { texture: null, temps: [], sizes: [], levels: 0, key: '' };
    const state = {
      width: 1,
      height: 1,
      dpr: 1,
      time: 0,
      angle: 0,
      color: [1, 1, 1],
      backdrop: 0,
      colorKey: '',
      image: 'none',
      request: 0
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;

    const allocate = () => {
      if (pyramid.texture) gl.deleteTexture(pyramid.texture);
      pyramid.temps.forEach(texture => gl.deleteTexture(texture));
      const width = canvas.width;
      const height = canvas.height;
      pyramid.levels = Math.min(10, Math.floor(Math.log2(Math.max(width, height))) + 1);
      pyramid.sizes = [];
      for (let k = 0; k < pyramid.levels; k++) {
        pyramid.sizes.push([Math.max(1, width >> k), Math.max(1, height >> k)]);
      }
      const configure = () => {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      pyramid.texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pyramid.texture);
      gl.texStorage2D(gl.TEXTURE_2D, pyramid.levels, format, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      configure();
      pyramid.temps = [null];
      for (let k = 1; k < pyramid.levels; k++) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texStorage2D(gl.TEXTURE_2D, 1, format, pyramid.sizes[k][0], pyramid.sizes[k - 1][1]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        configure();
        pyramid.temps.push(texture);
      }
      pyramid.key = '';
    };

    const resolveColor = value => {
      if (value === state.colorKey) return;
      state.colorKey = value;
      canvas.style.color = value;
      const computed = getComputedStyle(canvas).color;
      canvas.style.color = '';
      if (!probeCtx) return;
      probeCtx.clearRect(0, 0, 1, 1);
      probeCtx.fillStyle = computed;
      probeCtx.fillRect(0, 0, 1, 1);
      const [r, g, b] = probeCtx.getImageData(0, 0, 1, 1).data;
      state.color = [r / 255, g / 255, b / 255];
      state.backdrop = 0.2126 * state.color[0] + 0.7152 * state.color[1] + 0.0722 * state.color[2] < 0.5 ? 1 : 0;
    };

    const wander = t => {
      const s = settingsRef.current;
      const minHalf = Math.min(state.width, state.height) / 2;
      const inset = (1 - s.size) * minHalf;
      const reachX = s.shape === 0 && !s.src ? state.width / 2 - inset : s.size * minHalf;
      const reachY = s.shape === 0 && !s.src ? state.height / 2 - inset : s.size * minHalf;
      return [
        reachX * (0.75 * Math.sin(t * 0.37) + 0.2 * Math.sin(t * 1.13 + 1.7)),
        reachY * (0.7 * Math.sin(t * 0.53 + 0.9) + 0.2 * Math.cos(t * 0.91 + 0.4))
      ];
    };

    const drawShape = s => {
      const { width, height } = state;
      const minHalf = Math.min(width, height) / 2;
      const inset = (1 - s.size) * minHalf;
      const halfX = Math.max(1, width / 2 - inset);
      const halfY = Math.max(1, height / 2 - inset);
      const radius = s.size * minHalf;
      const fieldHalf = radius * (1 + PAD);
      let shapeIndex = s.shape;
      if (s.src) shapeIndex = state.image === 'ready' ? 4 : state.image === 'failed' ? s.shape : -1;
      const round =
        shapeIndex === 0
          ? s.roundness * Math.min(halfX, halfY)
          : s.roundness * radius * (shapeIndex === 3 ? 0.12 : 0.3);
      const angle = ((s.rotation + state.angle) * Math.PI) / 180;
      const key = [
        canvas.width,
        canvas.height,
        shapeIndex,
        s.sides,
        halfX,
        halfY,
        radius,
        round,
        s.thickness,
        s.fill,
        s.echoes,
        s.spacing,
        angle.toFixed(5)
      ].join('|');
      if (key === pyramid.key) return;
      pyramid.key = key;

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pyramid.texture, 0);
      gl.viewport(0, 0, pyramid.sizes[0][0], pyramid.sizes[0][1]);
      gl.useProgram(shapeProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.uniform1i(shapeUniforms.uFieldTexture, 0);
      gl.uniform2f(shapeUniforms.uResolution, width, height);
      gl.uniform1f(shapeUniforms.uDpr, state.dpr);
      gl.uniform1i(shapeUniforms.uShape, shapeIndex);
      gl.uniform1f(shapeUniforms.uSides, s.sides);
      gl.uniform2f(shapeUniforms.uHalf, halfX, halfY);
      gl.uniform1f(shapeUniforms.uRadius, radius);
      gl.uniform1f(shapeUniforms.uRound, round);
      gl.uniform2f(shapeUniforms.uField, fieldHalf, (2 * fieldHalf) / FIELD);
      gl.uniform1f(shapeUniforms.uThickness, s.thickness);
      gl.uniform1f(shapeUniforms.uFill, s.fill ? 1 : 0);
      gl.uniform1f(shapeUniforms.uEchoes, s.echoes);
      gl.uniform1f(shapeUniforms.uSpacing, s.spacing);
      gl.uniform1f(shapeUniforms.uAngle, angle);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.useProgram(blurProgram);
      gl.uniform1i(blurUniforms.uSource, 0);
      for (let k = 1; k < pyramid.levels; k++) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pyramid.temps[k], 0);
        gl.viewport(0, 0, pyramid.sizes[k][0], pyramid.sizes[k - 1][1]);
        gl.bindTexture(gl.TEXTURE_2D, pyramid.texture);
        gl.uniform1f(blurUniforms.uLod, k - 1);
        gl.uniform2f(blurUniforms.uStep, 1, 0);
        gl.uniform2f(blurUniforms.uScale, 2, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pyramid.texture, k);
        gl.viewport(0, 0, pyramid.sizes[k][0], pyramid.sizes[k][1]);
        gl.bindTexture(gl.TEXTURE_2D, pyramid.temps[k]);
        gl.uniform1f(blurUniforms.uLod, 0);
        gl.uniform2f(blurUniforms.uStep, 0, 1);
        gl.uniform2f(blurUniforms.uScale, 1, 2);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const render = () => {
      const s = settingsRef.current;
      if (!pyramid.texture) return;
      resolveColor(s.color);
      gl.bindVertexArray(vao);
      gl.disable(gl.BLEND);
      drawShape(s);

      const { width, height } = state;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(compositeProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pyramid.texture);
      gl.uniform1i(compositeUniforms.uPyramid, 0);
      gl.uniform1f(compositeUniforms.uMaxLod, pyramid.levels - 1);
      gl.uniform2f(compositeUniforms.uResolution, width, height);
      gl.uniform1f(compositeUniforms.uDpr, state.dpr);
      gl.uniform1f(compositeUniforms.uThickness, s.thickness);
      gl.uniform1f(compositeUniforms.uFill, s.fill ? 1 : 0);
      gl.uniform1f(compositeUniforms.uEchoes, s.echoes);
      gl.uniform1f(compositeUniforms.uSpacing, s.spacing);
      gl.uniform3f(compositeUniforms.uColor, state.color[0], state.color[1], state.color[2]);
      gl.uniform1f(compositeUniforms.uBackdrop, state.backdrop);
      gl.uniform1f(compositeUniforms.uBlur, s.blur);
      gl.uniform3f(compositeUniforms.uLens, lens.x, lens.y, lens.power);
      gl.uniform2f(compositeUniforms.uLensShape, s.lensSize * Math.min(width, height), s.lensSoftness);
      gl.uniform1f(compositeUniforms.uFocus, s.focus ? 1 : 0);
      gl.uniform1f(compositeUniforms.uChroma, s.chroma);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = now => {
      raf = 0;
      if (!alive || !visible) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      state.time += dt;
      if (!reduce) state.angle = (state.angle + s.spin * dt) % 360;

      const drifting = !pointer.active && s.idle && !reduce;
      let targetX = lens.x;
      let targetY = lens.y;
      let targetPower = 0;
      if (pointer.active) {
        targetX = pointer.x;
        targetY = pointer.y;
        targetPower = 1;
      } else if (drifting) {
        [targetX, targetY] = wander(state.time);
        targetPower = 0.85;
      }
      if (!lens.placed) {
        lens.x = targetX;
        lens.y = targetY;
        lens.placed = true;
      }
      const follow = 1 - Math.exp(-dt * (pointer.active ? 10 : 3));
      lens.x += (targetX - lens.x) * follow;
      lens.y += (targetY - lens.y) * follow;
      lens.power += (targetPower - lens.power) * (1 - Math.exp(-dt * 4));

      render();

      const settled =
        Math.abs(targetX - lens.x) < 0.1 &&
        Math.abs(targetY - lens.y) < 0.1 &&
        Math.abs(targetPower - lens.power) < 0.002;
      if (!settled || drifting || (s.spin && !reduce)) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (raf || !alive || !visible) return;
      raf = requestAnimationFrame(frame);
    };

    const load = value => {
      const request = ++state.request;
      state.image = value ? 'loading' : 'none';
      wake();
      if (!value) return;
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        if (!alive || request !== state.request) return;
        let field = null;
        try {
          field = buildField(image);
        } catch {
          field = null;
        }
        if (!field) {
          state.image = 'failed';
          wake();
          return;
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, FIELD, FIELD, 0, gl.RED, gl.FLOAT, field);
        state.image = 'ready';
        wake();
      };
      image.onerror = () => {
        if (!alive || request !== state.request) return;
        state.image = 'failed';
        wake();
      };
      image.src = value;
    };

    const onPointerMove = event => {
      const rect = root.getBoundingClientRect();
      const margin = settingsRef.current.lensSize * Math.min(rect.width, rect.height);
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer.active = x > -margin && y > -margin && x < rect.width + margin && y < rect.height + margin;
      pointer.x = x - rect.width / 2;
      pointer.y = rect.height / 2 - y;
      wake();
    };

    const onPointerLeave = () => {
      pointer.active = false;
      wake();
    };

    const resize = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.width = Math.max(1, root.clientWidth);
      state.height = Math.max(1, root.clientHeight);
      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      allocate();
      render();
      wake();
    };

    controlRef.current = { load, wake };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    visibility.observe(root);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      controlRef.current = null;
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      if (pyramid.texture) gl.deleteTexture(pyramid.texture);
      pyramid.temps.forEach(texture => gl.deleteTexture(texture));
      gl.deleteTexture(fieldTexture);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shapeProgram);
      gl.deleteProgram(blurProgram);
      gl.deleteProgram(compositeProgram);
      gl.deleteShader(vertex);
    };
  }, []);

  useEffect(() => {
    controlRef.current?.load(src || '');
  }, [src]);

  useEffect(() => {
    controlRef.current?.wake();
  });

  return (
    <div ref={rootRef} className={`${ROOT}${className ? ` ${className}` : ''}`} style={style}>
      <canvas ref={canvasRef} className={CANVAS} aria-hidden="true" />
      {children && <div className={CONTENT}>{children}</div>}
    </div>
  );
};

export default ShapeBlur;
