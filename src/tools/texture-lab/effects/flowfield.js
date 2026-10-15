import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const FLOW = `
uniform vec2 uWork;
uniform float uUnitPx;
uniform float uFreq;
uniform float uFollow;
uniform float uImageScale;
uniform float uEvolve;
uniform float uSeed;

vec2 gradDir(vec2 cell, float t) {
  vec2 h = hash22(cell + uSeed * 31.7);
  float a = h.x * TAU + t * (h.y > 0.5 ? 1.0 : -1.0) * (0.6 + h.y);
  return vec2(cos(a), sin(a));
}

vec2 gnoise(vec2 p, float t) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = gradDir(i, t);
  vec2 gb = gradDir(i + vec2(1.0, 0.0), t);
  vec2 gc = gradDir(i + vec2(0.0, 1.0), t);
  vec2 gd = gradDir(i + vec2(1.0, 1.0), t);
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  vec2 d = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd);
  return d + du * (u.yx * (va - vb - vc + vd) + vec2(vb, vc) - va);
}

void main() {
  vec2 pu = vUv * uWork / uUnitPx;
  vec2 g = gnoise(pu * uFreq + 3.1, uEvolve) + gnoise(pu * uFreq * 2.3 + 11.7, uEvolve * 1.6) * 0.3;
  vec2 e = 1.0 / vec2(textureSize(uInput, 0));
  float lx = luma(texture(uInput, vUv + vec2(e.x, 0.0)).rgb) - luma(texture(uInput, vUv - vec2(e.x, 0.0)).rgb);
  float ly = luma(texture(uInput, vUv + vec2(0.0, e.y)).rgb) - luma(texture(uInput, vUv - vec2(0.0, e.y)).rgb);
  vec2 slope = vec2(lx, ly) / (2.0 * e * uWork / uUnitPx);
  vec2 v = vec2(g.y, -g.x) + vec2(slope.y, -slope.x) * uImageScale * uFollow;
  float m = length(v);
  outColor = vec4(v / max(m, 1e-6), m, 1.0);
}`;

const PATH_COMMON = `
uniform vec2 uWork;
uniform float uSegments;
uniform float uPerRow;
uniform vec2 uGrid;
uniform vec2 uOrigin;
uniform float uCell;
uniform float uStep;
uniform float uSeed;

vec2 seedHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 seedOf(float index) {
  vec2 cell = vec2(mod(index, uGrid.x), floor(index / uGrid.x));
  return uOrigin + (cell + 0.1 + 0.8 * seedHash(cell + uSeed * 7.13)) * uCell;
}
`;

const PATHS = `
uniform sampler2D uFlow;
${PATH_COMMON}
void main() {
  vec2 texel = floor(gl_FragCoord.xy);
  float k = mod(texel.x, uSegments);
  float index = texel.y * uPerRow + floor(texel.x / uSegments);
  vec2 start = seedOf(index);
  vec2 x = start;
  vec2 scale = 1.0 / uWork;
  for (int i = 0; i < 96; i++) {
    if (float(i) >= k) break;
    vec2 dir = texture(uFlow, x * scale).xy;
    dir = texture(uFlow, (x + dir * uStep * 0.5) * scale).xy;
    x += dir * uStep;
  }
  vec2 offset = x - start;
  vec2 coarse = floor(offset / 16.0 + 0.5) * 16.0;
  outColor = vec4(coarse, offset - coarse);
}`;

const STROKE_VERTEX = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uPaths;
uniform sampler2D uTone;
uniform float uVisible;
uniform float uHalfWidth;
uniform float uTrail;
uniform float uTravel;
uniform float uClock;
uniform float uContrast;
uniform float uLight;
${PATH_COMMON}
out float vAcross;
out float vAlong;
out float vHalf;
flat out float vHead;
flat out float vLife;
flat out float vBright;

vec2 pointAt(float index, float k) {
  float row = floor(index / uPerRow);
  float column = mod(index, uPerRow) * uSegments + clamp(k, 0.0, uSegments - 1.0);
  vec4 t = texelFetch(uPaths, ivec2(int(column), int(row)), 0);
  return t.xy + t.zw;
}

void main() {
  float index = float(gl_InstanceID);
  float side = float(gl_VertexID % 2) * 2.0 - 1.0;
  vec2 cell = vec2(mod(index, uGrid.x), floor(index / uGrid.x));
  vec2 h = seedHash(cell + 71.3 + uSeed * 3.31);
  float age = fract(h.x + uClock);
  float head = age * uTravel;
  float first = clamp(floor((head - uTrail) / uStep), 0.0, max(uSegments - uVisible, 0.0));
  float k = min(first + float(gl_VertexID / 2), uSegments - 1.0);
  vec2 seed = seedOf(index);
  vec2 p = seed + pointAt(index, k);
  vec2 tangent = pointAt(index, k + 1.0) - pointAt(index, k - 1.0);
  tangent = length(tangent) > 1e-4 ? normalize(tangent) : vec2(1.0, 0.0);
  float l = dot(texture(uTone, p / uWork).rgb, vec3(0.2126, 0.7152, 0.0722));
  l = clamp((l - 0.5) * uContrast + 0.5, 0.0, 1.0);
  l = mix(l, 1.0 - l, uLight);
  vHalf = uHalfWidth * (0.6 + 0.7 * l);
  float extent = vHalf + 1.0;
  vec2 position = p + vec2(-tangent.y, tangent.x) * side * extent;
  gl_Position = vec4(position / uWork * 2.0 - 1.0, 0.0, 1.0);
  vAcross = side * extent;
  vAlong = k * uStep;
  vHead = head;
  vLife = smoothstep(0.0, 0.04, age) * (1.0 - smoothstep(0.72, 1.0, age));
  vBright = 0.55 + 0.45 * h.y;
}`;

const STROKE_FRAGMENT = `#version 300 es
precision highp float;
uniform float uTrail;
in float vAcross;
in float vAlong;
in float vHalf;
flat in float vHead;
flat in float vLife;
flat in float vBright;
out vec4 outColor;

void main() {
  float cover = clamp(vHalf + 0.5 - abs(vAcross), 0.0, 1.0) * min(vHalf * 2.0, 1.0);
  float d = vAlong;
  float along = smoothstep(vHead - uTrail, vHead - uTrail * 0.65, d);
  along *= smoothstep(vHead + 0.5, vHead - uTrail * 0.08, d);
  along *= smoothstep(-0.5, uTrail * 0.06, d);
  float a = cover * along * vLife;
  outColor = vec4(a, a * vBright, 0.0, a);
}`;

const COMPOSITE = `
uniform sampler2D uStrokes;
uniform vec3 uGround;
uniform vec3 uInk;
uniform float uMode;
uniform float uLight;
uniform float uContrast;

void main() {
  vec4 stroke = texture(uStrokes, vUv);
  float alpha = stroke.r;
  float bright = alpha > 0.001 ? stroke.g / alpha : 1.0;
  vec3 image = texture(uInput, vUv).rgb;
  float l = clamp((luma(image) - 0.5) * uContrast + 0.5, 0.0, 1.0);
  float tone = mix(l, 1.0 - l, uLight);
  vec3 color;
  if (uMode < 0.5) {
    vec3 hsv = rgb2hsv(image);
    float value = mix(0.17 + 0.83 * pow(tone, 0.85), 0.84 - 0.72 * pow(tone, 0.85), uLight);
    value *= mix(1.0, bright, 0.5);
    float saturation = min(hsv.y * mix(0.45, 1.5, smoothstep(0.04, 0.45, tone)), 1.0);
    color = mix(uGround, hsv2rgb(vec3(hsv.x, saturation, value)), alpha);
  } else {
    color = mix(uGround, uInk, alpha * (0.22 + 0.78 * tone) * mix(1.0, bright, 0.5));
  }
  outColor = vec4(color, 1.0);
}`;

const GROUNDS = { dark: [0.043, 0.039, 0.051], light: [0.949, 0.933, 0.902] };
const MAX_ROW = 2048;

function strokeProgram(gl, state) {
  if (state.program) return state.program;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader "flowfield-strokes" failed to compile.\n${log}`);
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, STROKE_VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, STROKE_FRAGMENT);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program "flowfield-strokes" failed to link: ${gl.getProgramInfoLog(program)}`);
  }
  const names = [
    'uPaths',
    'uTone',
    'uContrast',
    'uLight',
    'uVisible',
    'uHalfWidth',
    'uTrail',
    'uTravel',
    'uClock',
    'uWork',
    'uSegments',
    'uPerRow',
    'uGrid',
    'uOrigin',
    'uCell',
    'uStep',
    'uSeed'
  ];
  const uniforms = Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program, name)]));
  state.program = { program, uniforms, vao: gl.createVertexArray() };
  return state.program;
}

export default {
  id: 'flowfield',
  name: 'Flow lines',
  category: 'geometric',
  description: 'The picture traced by thousands of fine lines streaming along a smooth, swirling current.',
  animated: true,
  preview: { zoom: 2 },
  animates: params => params.drift > 0,
  params: [
    { key: 'density', label: 'Line density', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { key: 'length', label: 'Line length', type: 'number', min: 10, max: 200, step: 1, default: 70 },
    { key: 'width', label: 'Line width', type: 'number', min: 0.4, max: 6, step: 0.05, default: 2.2 },
    { key: 'curl', label: 'Curl', type: 'number', min: 0, max: 1, step: 0.01, default: 0.2 },
    { key: 'follow', label: 'Follow image', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.5, max: 2.5, step: 0.01, default: 1.4 },
    {
      key: 'color',
      label: 'Line color',
      type: 'select',
      default: 'image',
      options: [
        { value: 'image', label: 'From image' },
        { value: 'ink', label: 'Single ink' }
      ]
    },
    { key: 'ink', label: 'Ink', type: 'color', default: '#e4572e', when: params => params.color === 'ink' },
    {
      key: 'ground',
      label: 'Background',
      type: 'select',
      default: 'dark',
      options: [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' }
      ]
    },
    { key: 'drift', label: 'Drift', type: 'number', min: 0, max: 2, step: 0.01, default: 0.5 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params, state) {
    const gl = ctx.gl;
    const unit = ctx.unit;
    const fw = Math.max(8, Math.round(ctx.width / 4));
    const fh = Math.max(8, Math.round(ctx.height / 4));
    const tone = gaussianBlur(ctx, input, 7 * unit);
    const curl = Math.pow(params.curl, 1.4);
    const flow = ctx.pass('flowfield-flow', FLOW, {
      input: tone,
      target: ctx.target(fw, fh),
      uniforms: {
        uWork: [ctx.width, ctx.height],
        uUnitPx: unit,
        uFreq: (1.2 + curl * 8) / 1000,
        uFollow: params.follow,
        uImageScale: 150,
        uEvolve: ctx.time * params.drift * 0.1,
        uSeed: params.variation
      }
    });

    const spacing = (16 - 13 * params.density) * unit;
    const trail = Math.max(3, params.length * unit);
    const travel = trail * 1.6;
    const step = Math.max(travel / 72, 2.5 * unit, 1);
    const segments = Math.max(3, Math.ceil(travel / step) + 1);
    const visible = Math.min(segments, Math.ceil(trail / step) + 3);
    const cell = Math.max(2, Math.sqrt(spacing * trail * 0.75));
    const margin = travel;
    const grid = [Math.ceil((ctx.width + margin * 2) / cell), Math.ceil((ctx.height + margin * 2) / cell)];
    const count = grid[0] * grid[1];
    const perRow = Math.max(1, Math.floor(MAX_ROW / segments));
    const rows = Math.ceil(count / perRow);
    const common = {
      uWork: [ctx.width, ctx.height],
      uSegments: segments,
      uPerRow: perRow,
      uGrid: grid,
      uOrigin: [-margin, -margin],
      uCell: cell,
      uStep: step,
      uSeed: params.variation
    };
    const paths = ctx.pass('flowfield-paths', PATHS, {
      target: ctx.target(perRow * segments, rows, { filter: 'nearest' }),
      textures: { uFlow: flow },
      uniforms: common
    });
    ctx.release(flow);

    const strokes = ctx.target(ctx.width, ctx.height, { float: false });
    const program = strokeProgram(gl, state);
    const u = program.uniforms;
    gl.bindFramebuffer(gl.FRAMEBUFFER, strokes.fbo);
    gl.viewport(0, 0, strokes.width, strokes.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program.program);
    gl.bindVertexArray(program.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, paths.texture);
    gl.uniform1i(u.uPaths, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tone.texture);
    gl.uniform1i(u.uTone, 1);
    gl.uniform1f(u.uContrast, params.contrast);
    gl.uniform1f(u.uLight, params.ground === 'light' ? 1 : 0);
    gl.uniform1f(u.uVisible, visible);
    gl.uniform1f(u.uHalfWidth, Math.max(0.15, params.width * unit * 0.5));
    gl.uniform1f(u.uTrail, trail);
    gl.uniform1f(u.uTravel, travel);
    gl.uniform1f(u.uClock, (((ctx.time * params.drift * 30 * unit) / travel) % 1) + 1);
    gl.uniform2f(u.uWork, ctx.width, ctx.height);
    gl.uniform1f(u.uSegments, segments);
    gl.uniform1f(u.uPerRow, perRow);
    gl.uniform2f(u.uGrid, grid[0], grid[1]);
    gl.uniform2f(u.uOrigin, -margin, -margin);
    gl.uniform1f(u.uCell, cell);
    gl.uniform1f(u.uStep, step);
    gl.uniform1f(u.uSeed, params.variation);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.MAX);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, visible * 2, count);
    gl.disable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.bindVertexArray(ctx.engine.vao);
    gl.activeTexture(gl.TEXTURE0);
    ctx.release(paths);
    ctx.release(tone);

    const light = params.ground === 'light';
    const output = ctx.pass('flowfield-composite', COMPOSITE, {
      input,
      textures: { uStrokes: strokes },
      uniforms: {
        uGround: GROUNDS[params.ground] || GROUNDS.dark,
        uInk: hexToRgb(params.ink),
        uMode: params.color === 'ink' ? 1 : 0,
        uLight: light ? 1 : 0,
        uContrast: params.contrast
      }
    });
    ctx.release(strokes);
    return output;
  },
  dispose(gl, state) {
    if (state.program) {
      gl.deleteProgram(state.program.program);
      gl.deleteVertexArray(state.program.vao);
    }
    state.program = null;
  }
};
