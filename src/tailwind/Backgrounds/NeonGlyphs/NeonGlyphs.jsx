'use client';

import { useEffect, useRef, useState } from 'react';

const MAX_COLORS = 8;
const MAX_CLICKS = 4;
const MAX_STEPS = 56;
const MAX_RENDER_DIM = 2400;
const BLOOM_LEVELS = 6;
const INTRO_SECONDS = 2.4;
const CLICK_SECONDS = 1.6;
const ATLAS_CELL = 64;
const ATLAS_COLUMNS = 16;
const DEFAULT_COLORS = ['#a6f3fa', '#ea6fe0', '#6fd6f7', '#d351b6', '#5aaef0'];
const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=<>?!';
const DEFAULT_FONT = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const SCENE = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
uniform vec2 uRes;
uniform vec2 uAtlasGrid;
uniform float uCount;
uniform float uCell;
uniform mat3 uBasis;
uniform float uFocal;
uniform float uDepth;
uniform float uTime;
uniform float uGlyphTime;
uniform float uDensity;
uniform float uFlicker;
uniform float uBrightness;
uniform float uSeed;
uniform vec3 uColors[${MAX_COLORS}];
uniform float uColorCount;
uniform vec4 uHover;
uniform vec4 uClicks[${MAX_CLICKS}];
uniform float uIntro;
out vec4 outColor;

float h21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float h31(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

vec3 pick(float h) {
  return uColors[int(min(floor(h * uColorCount), uColorCount - 1.0))];
}

float glyph(float id, vec2 local, float lod) {
  vec2 q = (floor(clamp(local, 0.0, 0.999) * 14.0) + 0.5) / 14.0;
  float index = min(floor(id * uCount), uCount - 1.0);
  float column = mod(index, uAtlasGrid.x);
  float row = floor(index / uAtlasGrid.x);
  vec2 uv = vec2((column + q.x) / uAtlasGrid.x, (row + 1.0 - q.y) / uAtlasGrid.y);
  return textureLod(uAtlas, uv, lod).a;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - 0.5 * uRes) / uRes.y;
  vec3 rd = normalize(vec3(p, -uFocal));
  vec3 U = uBasis[0];
  vec3 V = uBasis[1];
  vec3 N = uBasis[2];
  vec3 C = vec3(0.0, 0.0, -uFocal);
  float half_ = 0.5 * uDepth * uCell;
  float dn = dot(rd, N);
  float cn = dot(C, N);
  float tNear = 0.0;
  float tFar = 40.0 * uFocal;
  if (abs(dn) > 1e-5) {
    float ta = (cn - half_) / dn;
    float tb = (cn + half_) / dn;
    tNear = max(min(ta, tb), 0.0);
    tFar = max(ta, tb);
  } else if (abs(cn) > half_) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  if (tFar <= tNear) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float stepLen = 0.5 * uCell;
  float count = min(ceil((tFar - tNear) / stepLen), ${MAX_STEPS.toFixed(1)});
  vec3 right = normalize(cross(rd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, rd);
  float jitter = fract(52.9829189 * fract(dot(frag, vec2(0.06711056, 0.00583715))));
  float t = tNear + stepLen * jitter;
  vec3 P0 = rd * t - C;
  vec3 L = vec3(dot(P0, U), dot(P0, V), dot(P0, N)) / uCell;
  vec3 dL = vec3(dot(rd, U), dot(rd, V), dot(rd, N)) * 0.5;
  float depthScale = uFocal * uRes.y * uCell / max(-rd.z, 0.05);
  vec3 flow = vec3(0.9 * sin(uTime * 0.05), uTime * 0.22, 0.6 * sin(uTime * 0.037));
  vec3 accum = vec3(0.0);

  for (int i = 0; i < ${MAX_STEPS}; i++) {
    if (float(i) >= count) break;
    float tt = t + float(i) * stepLen;
    float layer = floor(L.z);
    vec3 Lp = L + vec3(h21(vec2(layer, 5.3) + uSeed), h21(vec2(layer, 8.1) + uSeed), 0.0) - flow;
    vec3 cell = floor(Lp);
    float appear = clamp((uIntro - abs(cell.x) * 0.012 - abs(cell.y) * 0.016 - h31(cell + uSeed + 19.0) * 0.7) / 0.35, 0.0, 1.0);
    if (appear > 0.0) {
      float cycle = uTime * (0.06 + 0.07 * h31(cell + uSeed + 2.7)) + h31(cell + uSeed + 4.9);
      float slot = floor(cycle);
      float phase = cycle - slot;
      vec3 id = cell + slot * 31.0;
      bool present = h31(id + uSeed + 13.7) < uDensity;
      float power = present ? (1.0 + 1.6 * h31(id + uSeed + 9.0)) * smoothstep(0.0, 0.2, phase) * (1.0 - smoothstep(0.7, 1.0, phase)) : 0.0;
      vec3 color = pick(h31(id + uSeed + 3.0));
      float rate = 4.0;
      if (uHover.w > 0.001) {
        vec2 hv = (cell.xy + 0.5 - uHover.xy) / uHover.z;
        float w = exp(-dot(hv, hv)) * uHover.w;
        if (present) {
          power *= 1.0 + 1.2 * w;
          rate += 10.0 * w;
        } else if (w > 0.02 && h31(cell + uSeed + 63.0) < w * 0.25) {
          present = true;
          power = 1.4 * w;
          rate = 12.0;
        }
      }
      for (int c = 0; c < ${MAX_CLICKS}; c++) {
        vec4 click = uClicks[c];
        if (click.w <= 0.0) continue;
        float reach = length(cell.xy + 0.5 - click.xy) - click.z * 16.0;
        float fade = 1.0 - click.z / ${CLICK_SECONDS.toFixed(1)};
        float ring = exp(-reach * reach / 5.0) * fade * fade;
        if (ring < 0.03) continue;
        if (present) {
          power *= 1.0 + 2.5 * ring;
          color = mix(color, vec3(1.0), 0.4 * ring);
          rate = max(rate, 16.0);
        } else if (h31(cell + uSeed + float(c) * 5.1 + 71.0) < ring * 0.5) {
          present = true;
          power = 2.0 * ring;
          color = mix(color, vec3(1.0), 0.3);
          rate = 16.0;
        }
      }
      if (present && power > 0.001) {
        vec3 bob = 0.1 * sin(uTime * (0.4 + 0.5 * vec3(h31(id + 1.1), h31(id + 2.2), h31(id + 3.3))) + 6.2831 * vec3(h31(id + 4.4), h31(id + 5.5), h31(id + 6.6)));
        vec3 offset = (Lp - cell - 0.5 - bob) / 0.8;
        vec3 world = U * offset.x + V * offset.y + N * offset.z;
        vec2 local = vec2(dot(world, right), dot(world, up)) + 0.5;
        if (local.x > 0.0 && local.x < 1.0 && local.y > 0.0 && local.y < 1.0) {
          float pixels = depthScale / tt * 0.8;
          float lod = clamp(log2(64.0 / max(pixels, 1.0)), 2.0, 6.0);
          float seedHash = h31(id + uSeed + 11.0);
          float charId = h31(id * 1.31 + floor(uGlyphTime * rate + seedHash * 9.0) * 17.17 + uSeed);
          float ink = glyph(charId, local, lod);
          float cover = smoothstep(0.25, 0.45, ink) * ink;
          if (cover > 0.0) {
            float beat = floor(uTime * 3.5 + seedHash * 3.0);
            if (h31(id * 0.73 + beat * 9.13 + uSeed) > 1.0 - uFlicker) {
              power *= 5.5;
              color = mix(color, vec3(1.0), 0.4);
            }
            color = mix(color, pick(fract(seedHash + 0.37 + uTime * 0.05 + Lp.y * 0.012)), 0.25);
            float fog = exp(-tt / uCell * 0.0086);
            accum += color * cover * power * appear * fog * smoothstep(1.5, 4.0, pixels);
          }
        }
      }
    }
    L += dL;
  }

  outColor = vec4(accum * 0.3 * uBrightness, 1.0);
}`;

const DOWN = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy * 2.0 * uTexel;
  vec3 c = texture(uSource, uv + vec2(-0.5, -0.5) * uTexel).rgb;
  c += texture(uSource, uv + vec2(0.5, -0.5) * uTexel).rgb;
  c += texture(uSource, uv + vec2(-0.5, 0.5) * uTexel).rgb;
  c += texture(uSource, uv + vec2(0.5, 0.5) * uTexel).rgb;
  outColor = vec4(min(c * 0.25, vec3(2.0)), 1.0);
}`;

const BLUR = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uStep;
uniform vec2 uSize;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  vec3 c = texture(uSource, uv).rgb * 0.2270270;
  c += texture(uSource, uv + uStep * 1.3846154).rgb * 0.3162162;
  c += texture(uSource, uv - uStep * 1.3846154).rgb * 0.3162162;
  c += texture(uSource, uv + uStep * 3.2307692).rgb * 0.0702703;
  c += texture(uSource, uv - uStep * 3.2307692).rgb * 0.0702703;
  outColor = vec4(c, 1.0);
}`;

const UP = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform sampler2D uBase;
uniform vec2 uSize;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  outColor = vec4(texture(uBase, uv).rgb + texture(uSource, uv).rgb * 0.8, 1.0);
}`;

const ACCUM = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform sampler2D uPrev;
uniform vec2 uRes;
uniform float uGlow;
uniform float uBlend;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 bloom = texture(uBloom, uv).rgb;
  vec3 current = texture(uScene, uv).rgb + bloom * uGlow;
  vec3 previous = texture(uPrev, uv).rgb;
  outColor = vec4(mix(previous, current, uBlend), 1.0);
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uFade;
uniform float uAberration;
uniform float uLightMode;
uniform float uOpacity;
out vec4 outColor;

float feather(float x, float w) {
  if (w <= 0.0) return 1.0;
  float t = clamp(min(x, 1.0 - x) / w, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float mask(vec2 uv) {
  return feather(uv.x, uFade * 0.34) * feather(uv.y, uFade * 0.44);
}

vec3 lightAt(vec2 uv) {
  return texture(uScene, uv).rgb;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float m = mask(uv);
  vec2 dir = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float edge = 1.0 - m;
  vec2 shift = dir * uAberration * (0.004 + 0.05 * edge * edge) / vec2(uRes.x / uRes.y, 1.0);
  vec2 ur = uv + shift;
  vec2 ub = uv - shift;
  vec3 c = vec3(lightAt(ur).r * mask(ur), lightAt(uv).g * m, lightAt(ub).b * mask(ub));
  float peak = max(max(c.r, c.g), c.b);
  if (peak <= 0.0005) {
    outColor = vec4(0.0);
    return;
  }
  float mapped = peak < 0.75 ? peak : 0.75 + 0.25 * (1.0 - exp(-(peak - 0.75) / 0.25));
  vec3 col = c * (mapped / peak);
  col = mix(col, vec3(mapped), smoothstep(0.9, 2.6, peak) * 0.55);
  float alpha;
  if (uLightMode > 0.5) {
    vec3 hue = c / peak;
    float lum = dot(hue, vec3(0.2126, 0.7152, 0.0722));
    hue = clamp(mix(vec3(lum), hue, 1.7), 0.0, 1.0);
    lum = dot(hue, vec3(0.2126, 0.7152, 0.0722));
    vec3 ink = clamp(hue * (0.46 / max(lum, 0.2)), 0.0, 1.0);
    float lift = max(peak - 0.14, 0.0) / 0.86;
    alpha = (1.0 - exp(-3.2 * lift)) * 0.95;
    col = ink * alpha;
  } else {
    alpha = max(max(col.r, col.g), col.b);
  }
  outColor = vec4(col, alpha) * uOpacity;
}`;

const SCENE_UNIFORMS = [
  'uAtlas',
  'uRes',
  'uAtlasGrid',
  'uCount',
  'uCell',
  'uBasis',
  'uFocal',
  'uDepth',
  'uTime',
  'uGlyphTime',
  'uDensity',
  'uFlicker',
  'uBrightness',
  'uSeed',
  'uColors',
  'uColorCount',
  'uHover',
  'uClicks',
  'uIntro'
];

const PROGRAMS = {
  scene: { source: SCENE, uniforms: SCENE_UNIFORMS },
  down: { source: DOWN, uniforms: ['uSource', 'uTexel'] },
  blur: { source: BLUR, uniforms: ['uSource', 'uStep', 'uSize'] },
  up: { source: UP, uniforms: ['uSource', 'uBase', 'uSize'] },
  accum: { source: ACCUM, uniforms: ['uScene', 'uBloom', 'uPrev', 'uRes', 'uGlow', 'uBlend'] },
  composite: { source: COMPOSITE, uniforms: ['uScene', 'uRes', 'uFade', 'uAberration', 'uLightMode', 'uOpacity'] }
};

const NAMES = Object.keys(PROGRAMS);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const startProgram = (gl, source) => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, source);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  return { program, vertex, fragment };
};

const finishProgram = (gl, job, names) => {
  const { program, vertex, fragment } = job;
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked && !gl.isContextLost()) {
    const broken = [vertex, fragment].filter(shader => !gl.getShaderParameter(shader, gl.COMPILE_STATUS));
    if (broken.length) broken.forEach(shader => console.error(gl.getShaderInfoLog(shader)));
    else console.error(gl.getProgramInfoLog(program));
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!linked) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = {};
  for (const name of names) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
};

const buildAtlas = (gl, characters, fontFamily) => {
  const list = [...new Set([...characters].filter(char => char.trim()))];
  if (!list.length) list.push('#');
  const columns = Math.min(ATLAS_COLUMNS, list.length);
  const rows = Math.ceil(list.length / columns);
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_CELL * columns;
  canvas.height = ATLAS_CELL * rows;
  const context = canvas.getContext('2d');
  if (context) {
    context.font = `500 ${Math.round(ATLAS_CELL * 0.74)}px ${fontFamily}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#fff';
    list.forEach((char, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      context.fillText(char, column * ATLAS_CELL + ATLAS_CELL / 2, row * ATLAS_CELL + ATLAS_CELL / 2 + 2);
    });
  }
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { texture, count: list.length, grid: [columns, rows] };
};

const planeBasis = (tilt, turn, rotation) => {
  const a = (tilt * Math.PI) / 180;
  const b = (turn * Math.PI) / 180;
  const c = (rotation * Math.PI) / 180;
  const roll = v => [v[0] * Math.cos(c) - v[1] * Math.sin(c), v[0] * Math.sin(c) + v[1] * Math.cos(c), v[2]];
  const pitch = v => [v[0], v[1] * Math.cos(a) + v[2] * Math.sin(a), -v[1] * Math.sin(a) + v[2] * Math.cos(a)];
  const yaw = v => [v[0] * Math.cos(b) + v[2] * Math.sin(b), v[1], -v[0] * Math.sin(b) + v[2] * Math.cos(b)];
  const apply = v => yaw(pitch(roll(v)));
  return [apply([1, 0, 0]), apply([0, 1, 0]), apply([0, 0, 1])];
};

const NeonGlyphs = ({
  colors = DEFAULT_COLORS,
  characters = DEFAULT_CHARACTERS,
  fontFamily = DEFAULT_FONT,
  cellSize = 16,
  depth = 12,
  tilt = 25,
  turn = 0,
  rotation = 0,
  perspective = 60,
  sway = 0.5,
  speed = 0.15,
  density = 0.1,
  trails = 0.25,
  glow = 0.75,
  flicker = 0.5,
  scramble = 0.5,
  brightness = 1,
  fade = 0.75,
  aberration = 0.5,
  variation = 0,
  opacity = 1,
  intro = true,
  mouseInteraction = true,
  burstOnClick = true,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const releaseRef = useRef(0);
  const [generation, setGeneration] = useState(0);
  const palette = (Array.isArray(colors) && colors.length ? colors : DEFAULT_COLORS).slice(0, MAX_COLORS).map(String);
  const settings = {
    colors: palette,
    characters: String(characters || DEFAULT_CHARACTERS),
    fontFamily: fontFamily || DEFAULT_FONT,
    cellSize: clamp(num(cellSize, 16), 6, 80),
    depth: clamp(Math.round(num(depth, 12)), 1, 32),
    tilt: clamp(num(tilt, 25), -80, 80),
    turn: clamp(num(turn, 0), -80, 80),
    rotation: num(rotation, 0),
    perspective: clamp(num(perspective, 60), 10, 120),
    sway: clamp(num(sway, 0.5), 0, 2),
    speed: Math.max(0, num(speed, 0.15)),
    density: clamp(num(density, 0.1), 0, 1),
    trails: clamp(num(trails, 0.25), 0, 1),
    glow: clamp(num(glow, 0.75), 0, 3),
    flicker: clamp(num(flicker, 0.5), 0, 1),
    scramble: clamp(num(scramble, 0.5), 0, 4),
    brightness: Math.max(0, num(brightness, 1)),
    fade: clamp(num(fade, 0.75), 0, 1),
    aberration: clamp(num(aberration, 0.5), 0, 2),
    variation: num(variation, 0),
    opacity: clamp(num(opacity, 1), 0, 1),
    intro,
    mouseInteraction,
    burstOnClick,
    lightMode,
    paused,
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    wakeRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;
    cancelAnimationFrame(releaseRef.current);
    releaseRef.current = 0;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'default'
    });
    if (!gl) return undefined;
    const parallel = gl.getExtension('KHR_parallel_shader_compile');
    const floatTargets = Boolean(gl.getExtension('EXT_color_buffer_float'));
    const jobs = {};
    const programs = {};
    let broken = false;
    for (const name of NAMES) {
      const job = startProgram(gl, PROGRAMS[name].source);
      if (!job) broken = true;
      else jobs[name] = job;
    }
    const finishAll = () => {
      for (const name of NAMES) {
        const job = jobs[name];
        if (!job) continue;
        delete jobs[name];
        const done = finishProgram(gl, job, PROGRAMS[name].uniforms);
        if (done) programs[name] = done;
        else broken = true;
      }
      return !broken;
    };
    if (!parallel) finishAll();
    const vao = gl.createVertexArray();
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeContext = probe.getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const colorData = new Float32Array(MAX_COLORS * 3);
    const clickData = new Float32Array(MAX_CLICKS * 4);
    const state = {
      time: 0,
      glyphTime: 0,
      clock: 0,
      intro: settingsRef.current.intro && !reduce && !settingsRef.current.paused ? 0 : INTRO_SECONDS,
      width: 1,
      height: 1,
      ratio: 1,
      paletteKey: '',
      colorCount: 1,
      atlas: null,
      atlasKey: '',
      targets: null,
      flip: 0,
      fresh: true,
      pointer: { x: 0, y: 0, inside: false },
      hover: { x: 0, y: 0, vx: 0, vy: 0, presence: 0, placed: false },
      lean: { x: 0, y: 0, vx: 0, vy: 0 },
      angles: { tilt: 0, turn: 0 },
      clicks: []
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;
    let lost = false;

    const toRgb = value => {
      if (!probeContext || !value) return [1, 1, 1];
      const css = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
      probeContext.clearRect(0, 0, 1, 1);
      probeContext.fillStyle = '#000000';
      probeContext.fillStyle = css;
      probeContext.fillRect(0, 0, 1, 1);
      const [r, g, b] = probeContext.getImageData(0, 0, 1, 1).data;
      return [r / 255, g / 255, b / 255];
    };

    const syncPalette = s => {
      const key = s.colors.join('|');
      if (key === state.paletteKey) return;
      state.paletteKey = key;
      colorData.fill(0);
      s.colors.forEach((color, index) => colorData.set(toRgb(color), index * 3));
      state.colorCount = s.colors.length;
    };

    const syncAtlas = s => {
      const key = `${s.fontFamily}|${s.characters}`;
      if (key === state.atlasKey && state.atlas) return;
      state.atlasKey = key;
      if (state.atlas) gl.deleteTexture(state.atlas.texture);
      state.atlas = buildAtlas(gl, s.characters, s.fontFamily);
      document.fonts?.load?.(`500 64px ${s.fontFamily}`, s.characters).then(
        () => {
          if (!alive || state.atlasKey !== key || gl.isContextLost()) return;
          if (state.atlas) gl.deleteTexture(state.atlas.texture);
          state.atlas = buildAtlas(gl, s.characters, s.fontFamily);
          wakeRef.current?.();
        },
        () => {}
      );
    };

    const makeTarget = (width, height) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        floatTargets ? gl.RGBA16F : gl.RGBA8,
        width,
        height,
        0,
        gl.RGBA,
        floatTargets ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
        null
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { texture, framebuffer, width, height };
    };

    const freeTarget = target => {
      gl.deleteTexture(target.texture);
      gl.deleteFramebuffer(target.framebuffer);
    };

    const freeTargets = () => {
      if (!state.targets) return;
      freeTarget(state.targets.scene);
      state.targets.trail.forEach(freeTarget);
      state.targets.levels.forEach(level => {
        freeTarget(level.a);
        freeTarget(level.b);
      });
      state.targets = null;
    };

    const syncTargets = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (state.targets && state.targets.width === w && state.targets.height === h) return;
      freeTargets();
      const quality = Math.min(1, 1.5 / Math.max(state.ratio, 1));
      const sw = Math.max(1, Math.round(w * quality));
      const sh = Math.max(1, Math.round(h * quality));
      const levels = [];
      let lw = sw;
      let lh = sh;
      for (let i = 0; i < BLOOM_LEVELS; i++) {
        lw = Math.max(1, Math.round(lw / 2));
        lh = Math.max(1, Math.round(lh / 2));
        levels.push({ a: makeTarget(lw, lh), b: makeTarget(lw, lh) });
      }
      state.targets = {
        width: w,
        height: h,
        scene: makeTarget(sw, sh),
        trail: [makeTarget(w, h), makeTarget(w, h)],
        levels
      };
      state.flip = 0;
      state.fresh = true;
    };

    const syncAngles = () => {
      const s = settingsRef.current;
      const t = state.clock;
      state.angles.tilt = s.tilt + s.sway * 4 * Math.sin(t * 0.17 + 1.1) + state.lean.y;
      state.angles.turn = s.turn + s.sway * 9 * Math.sin(t * 0.11) + state.lean.x;
    };

    const project = (px, py) => {
      const s = settingsRef.current;
      const focal = 1 / Math.tan((s.perspective * Math.PI) / 180 / 2);
      const [U, V, N] = planeBasis(state.angles.tilt, state.angles.turn, s.rotation);
      const d = [(px - state.width / 2) / state.height, (state.height / 2 - py) / state.height, -focal];
      const dn = d[0] * N[0] + d[1] * N[1] + d[2] * N[2];
      if (dn > -1e-5) return null;
      const t = (-focal * N[2]) / dn;
      const P = [d[0] * t, d[1] * t, d[2] * t + focal];
      const cell = s.cellSize / state.height;
      return {
        x: (P[0] * U[0] + P[1] * U[1] + P[2] * U[2]) / cell,
        y: (P[0] * V[0] + P[1] * V[1] + P[2] * V[2]) / cell
      };
    };

    const draw = (program, target, width, height) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
      gl.viewport(0, 0, width, height);
      gl.useProgram(program.program);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const bind = (unit, texture) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    };

    const render = dt => {
      const { scene, down, blur, up, accum, composite } = programs;
      if (!scene || !down || !blur || !up || !accum || !composite || broken || lost) return;
      const s = settingsRef.current;
      syncPalette(s);
      syncAtlas(s);
      syncTargets();
      if (!state.atlas || !state.targets) return;
      const targets = state.targets;
      const w = canvas.width;
      const h = canvas.height;
      gl.disable(gl.BLEND);
      gl.bindVertexArray(vao);

      syncAngles();
      const u = scene.uniforms;
      gl.useProgram(scene.program);
      bind(0, state.atlas.texture);
      gl.uniform1i(u.uAtlas, 0);
      gl.uniform2f(u.uRes, targets.scene.width, targets.scene.height);
      gl.uniform2f(u.uAtlasGrid, state.atlas.grid[0], state.atlas.grid[1]);
      gl.uniform1f(u.uCount, state.atlas.count);
      const cell = s.cellSize / state.height;
      gl.uniform1f(u.uCell, cell);
      const [U, V, N] = planeBasis(state.angles.tilt, state.angles.turn, s.rotation);
      gl.uniformMatrix3fv(u.uBasis, false, [...U, ...V, ...N]);
      gl.uniform1f(u.uFocal, 1 / Math.tan((s.perspective * Math.PI) / 180 / 2));
      gl.uniform1f(u.uDepth, s.depth);
      gl.uniform1f(u.uTime, state.time);
      gl.uniform1f(u.uGlyphTime, state.glyphTime);
      gl.uniform1f(u.uDensity, s.density);
      gl.uniform1f(u.uFlicker, s.flicker * 0.07);
      gl.uniform1f(u.uBrightness, s.brightness);
      gl.uniform1f(u.uSeed, (s.variation % 1000) * 13.37);
      gl.uniform3fv(u.uColors, colorData);
      gl.uniform1f(u.uColorCount, state.colorCount);
      gl.uniform4f(u.uHover, state.hover.x, state.hover.y, 5.5, state.hover.presence);
      clickData.fill(0);
      state.clicks.forEach((click, index) => {
        clickData[index * 4] = click.x;
        clickData[index * 4 + 1] = click.y;
        clickData[index * 4 + 2] = state.clock - click.start;
        clickData[index * 4 + 3] = 1;
      });
      gl.uniform4fv(u.uClicks, clickData);
      gl.uniform1f(u.uIntro, state.intro);
      draw(scene, targets.scene, targets.scene.width, targets.scene.height);

      let source = targets.scene;
      targets.levels.forEach(level => {
        gl.useProgram(down.program);
        bind(0, source.texture);
        gl.uniform1i(down.uniforms.uSource, 0);
        gl.uniform2f(down.uniforms.uTexel, 1 / source.width, 1 / source.height);
        draw(down, level.a, level.a.width, level.a.height);
        gl.useProgram(blur.program);
        gl.uniform1i(blur.uniforms.uSource, 0);
        gl.uniform2f(blur.uniforms.uSize, level.a.width, level.a.height);
        bind(0, level.a.texture);
        gl.uniform2f(blur.uniforms.uStep, 1 / level.a.width, 0);
        draw(blur, level.b, level.a.width, level.a.height);
        bind(0, level.b.texture);
        gl.uniform2f(blur.uniforms.uStep, 0, 1 / level.a.height);
        draw(blur, level.a, level.a.width, level.a.height);
        source = level.a;
      });
      for (let i = targets.levels.length - 2; i >= 0; i--) {
        const level = targets.levels[i];
        gl.useProgram(up.program);
        bind(0, targets.levels[i + 1].a.texture);
        bind(1, level.a.texture);
        gl.uniform1i(up.uniforms.uSource, 0);
        gl.uniform1i(up.uniforms.uBase, 1);
        gl.uniform2f(up.uniforms.uSize, level.b.width, level.b.height);
        draw(up, level.b, level.b.width, level.b.height);
        const swap = level.a;
        level.a = level.b;
        level.b = swap;
      }

      const read = targets.trail[state.flip];
      const write = targets.trail[1 - state.flip];
      const au = accum.uniforms;
      gl.useProgram(accum.program);
      bind(0, targets.scene.texture);
      bind(1, targets.levels[0].a.texture);
      bind(2, read.texture);
      gl.uniform1i(au.uScene, 0);
      gl.uniform1i(au.uBloom, 1);
      gl.uniform1i(au.uPrev, 2);
      gl.uniform2f(au.uRes, w, h);
      gl.uniform1f(au.uGlow, s.glow * (s.lightMode ? 0.25 : 1.8));
      const tau = s.trails * 0.15;
      gl.uniform1f(au.uBlend, state.fresh || tau <= 0.001 ? 1 : 1 - Math.exp(-Math.max(dt, 1 / 240) / tau));
      draw(accum, write, w, h);
      state.flip = 1 - state.flip;
      state.fresh = false;

      const cu = composite.uniforms;
      gl.useProgram(composite.program);
      bind(0, write.texture);
      gl.uniform1i(cu.uScene, 0);
      gl.uniform2f(cu.uRes, w, h);
      gl.uniform1f(cu.uFade, s.fade);
      gl.uniform1f(cu.uAberration, s.aberration);
      gl.uniform1f(cu.uLightMode, s.lightMode ? 1 : 0);
      gl.uniform1f(cu.uOpacity, s.opacity);
      draw(composite, null, w, h);
      gl.bindVertexArray(null);
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const base = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      const longest = Math.max(width, height) * base;
      const ratio = longest > MAX_RENDER_DIM ? (base * MAX_RENDER_DIM) / longest : base;
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      state.width = width;
      state.height = height;
      state.ratio = pixelHeight / height;
      state.fresh = true;
      render(0);
    };

    const pending = () => NAMES.filter(name => jobs[name]);

    const compiling = () =>
      NAMES.some(name => {
        const job = jobs[name];
        return Boolean(job && parallel && !gl.getProgramParameter(job.program, parallel.COMPLETION_STATUS_KHR));
      });

    const ready = () => {
      if (broken) return false;
      const waiting = pending();
      if (!waiting.length) return true;
      if (!parallel || compiling()) return false;
      return finishAll();
    };

    const frame = now => {
      raf = 0;
      if (!alive || !visible || document.hidden || lost) return;
      if (!ready()) {
        if (!broken && pending().length) raf = requestAnimationFrame(frame);
        return;
      }
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const moving = !s.paused && !reduce;
      if (moving) {
        state.clock += dt;
        state.intro += dt;
        state.time += dt * s.speed;
        state.glyphTime += dt * s.scramble;
        state.clicks = state.clicks.filter(click => state.clock - click.start < CLICK_SECONDS);
      } else if (state.intro < INTRO_SECONDS) {
        state.intro = INTRO_SECONDS;
      }
      const { pointer, hover, lean } = state;
      const leaning = s.mouseInteraction && pointer.inside && !reduce;
      const leanX = leaning ? ((pointer.x / state.width) * 2 - 1) * 5 : 0;
      const leanY = leaning ? ((pointer.y / state.height) * 2 - 1) * 3 : 0;
      if (dt > 0) {
        lean.vx += (40 * (leanX - lean.x) - 12 * lean.vx) * dt;
        lean.vy += (40 * (leanY - lean.y) - 12 * lean.vy) * dt;
        lean.x += lean.vx * dt;
        lean.y += lean.vy * dt;
      }
      syncAngles();
      const target = leaning ? project(pointer.x, pointer.y) : null;
      if (target) {
        if (!hover.placed) {
          hover.x = target.x;
          hover.y = target.y;
          hover.vx = 0;
          hover.vy = 0;
          hover.placed = true;
        }
        if (dt > 0) {
          hover.vx += (90 * (target.x - hover.x) - 18 * hover.vx) * dt;
          hover.vy += (90 * (target.y - hover.y) - 18 * hover.vy) * dt;
          hover.x += hover.vx * dt;
          hover.y += hover.vy * dt;
        }
      }
      const goal = target ? 1 : 0;
      hover.presence += (goal - hover.presence) * (1 - Math.exp(-dt / (goal > hover.presence ? 0.25 : 0.6)));
      if (!target && hover.presence < 0.001) hover.placed = false;
      render(dt);
      const animating = moving && (s.speed > 0 || s.scramble > 0 || s.sway > 0 || state.clicks.length > 0);
      const settling =
        Math.abs(goal - hover.presence) > 0.002 ||
        state.intro < INTRO_SECONDS ||
        Math.hypot(lean.vx, lean.vy) > 0.01 ||
        Math.hypot(leanX - lean.x, leanY - lean.y) > 0.01;
      if (animating || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && alive && visible && !document.hidden && !lost) raf = requestAnimationFrame(frame);
    };

    const locate = event => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
    };

    const onPointerMove = event => {
      const spot = locate(event);
      state.pointer.x = spot.x;
      state.pointer.y = spot.y;
      state.pointer.inside = spot.inside;
      wake();
    };

    const onPointerDown = event => {
      const s = settingsRef.current;
      if (!s.mouseInteraction || !s.burstOnClick || event.button !== 0 || reduce || s.paused) return;
      if (
        event.target instanceof Element &&
        event.target.closest('a, button, input, textarea, select, label, [role="button"]')
      )
        return;
      const spot = locate(event);
      if (!spot.inside) return;
      const point = project(spot.x, spot.y);
      if (!point) return;
      state.clicks.push({ x: point.x, y: point.y, start: state.clock });
      while (state.clicks.length > MAX_CLICKS) state.clicks.shift();
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

    const onLost = event => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onRestored = () => setGeneration(value => value + 1);

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
    window.addEventListener('pointerdown', onPointerDown);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    resize();
    wake();
    wakeRef.current = () => {
      if (!raf) render(0);
      wake();
    };

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        gl.deleteVertexArray(vao);
        freeTargets();
        if (state.atlas) gl.deleteTexture(state.atlas.texture);
        NAMES.forEach(name => {
          const program = programs[name];
          if (program) gl.deleteProgram(program.program);
        });
        const release = () => {
          const waiting = pending();
          if (!waiting.length || gl.isContextLost()) return;
          if (compiling()) {
            requestAnimationFrame(release);
            return;
          }
          waiting.forEach(name => {
            const job = jobs[name];
            if (!job) return;
            gl.deleteShader(job.vertex);
            gl.deleteShader(job.fragment);
            gl.deleteProgram(job.program);
            delete jobs[name];
          });
        };
        release();
      }
      const free = () => {
        releaseRef.current = 0;
        if (!canvas.isConnected && !gl.isContextLost()) gl.getExtension('WEBGL_lose_context')?.loseContext();
      };
      if (canvas.isConnected) releaseRef.current = requestAnimationFrame(free);
      else free();
    };
  }, [generation]);

  return (
    <div
      ref={containerRef}
      className={['relative h-full w-full overflow-hidden', className].filter(Boolean).join(' ')}
      {...rest}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
};

export default NeonGlyphs;
