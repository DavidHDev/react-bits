'use client';

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode
} from 'react';
import './Folder.css';

export interface FolderItem {
  title?: string;
  description?: string;
  image?: string;
  alt?: string;
  content?: ReactNode;
}

export type FolderEntry = FolderItem | string | number | ReactElement;

export interface FolderProps {
  items?: FolderEntry[];
  label?: string;
  mode?: 'flap' | 'book';
  variant?: 'solid' | 'glass' | 'matte';
  color?: string;
  paperColor?: string;
  tabPosition?: 'left' | 'center' | 'right';
  layout?: 'spread' | 'stack' | 'row';
  size?: number;
  openOn?: 'click' | 'hover';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onItemClick?: (item: FolderEntry, index: number) => void;
  onItemDrop?: (item: FolderEntry, index: number, inside: boolean) => void;
  draggable?: boolean;
  zoomOnClick?: boolean;
  peek?: boolean;
  intro?: boolean;
  tilt?: number;
  bounce?: number;
  speed?: number;
  frost?: number;
  closeOnOutsideClick?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

type Matrix = number[];
type Rgb = number[];
type Phase = 'open' | 'receive' | 'peek' | 'rest';

interface Geometry {
  book: boolean;
  scale: number;
  w: number;
  h: number;
  tabH: number;
  r: number;
  shoulder: number;
  corners: number[];
  tabW: number;
  tabX: number;
  frontTop: number;
  frontH: number;
  docW: number;
  docH: number;
}

interface Slot {
  x: number;
  y: number;
  z: number;
  r: number;
  ry: number;
  s: number;
}

interface View {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Target {
  texture: WebGLTexture | null;
  frame: WebGLFramebuffer | null;
}

interface Pane {
  matrix: Matrix;
  width: number;
  height: number;
  radii: number[];
  spine: number;
  bleed: number;
  morph: number;
  insideTop: number[];
  insideBottom: number[];
  tabRatio: number;
  gutter: number[];
  bevel: number;
  strength: number;
  split: number;
  lens: number;
  frost: number;
  tint: number[];
  haze: number;
  dim: number;
  glint: number;
  shine: number;
  light: number[];
}

interface Scene {
  dpr: number;
  depth: number;
  origin: number[];
  view: View;
  layers: { key: string; matrix: Matrix; width: number; height: number; alpha: number }[];
  glass: Pane;
}

interface Renderer {
  upload: (key: string, source: HTMLCanvasElement) => void;
  prune: (keys: Set<string>) => void;
  render: (scene: Scene) => void;
  dispose: () => void;
}

interface Spring {
  value: number;
  velocity: number;
}

interface ItemState {
  x: Spring;
  y: Spring;
  z: Spring;
  r: Spring;
  ry: Spring;
  s: Spring;
  hover: Spring;
  mx: Spring;
  my: Spring;
  alpha: Spring;
  place: 'inside' | 'out';
  rank: number;
  layer: 'inside' | 'out' | 'drag' | 'focus';
  elevated: boolean;
  insertUntil: number;
  insertFrom: 'side' | 'top' | null;
  outX: number;
  outY: number;
  outR: number;
  outS: number;
  outOrder: number;
  localX: number;
  localY: number;
  fresh: boolean;
}

interface DragState {
  index: number;
  id: number;
  clientX: number;
  clientY: number;
  downX: number;
  downY: number;
  grabX: number;
  grabY: number;
  scale: number;
  clip: Bounds | null;
  active: boolean;
  samples: number[][];
}

interface EngineState {
  raf: number;
  last: number;
  ready: boolean;
  hovered: boolean;
  pressed: boolean;
  pointerX: number;
  pointerY: number;
  deskX: number;
  deskY: number;
  hoveredItem: number;
  phase: Phase;
  previous: Phase;
  changedAt: number;
  front: Spring;
  rx: Spring;
  ry: Spring;
  lift: Spring;
  squash: Spring;
  items: ItemState[];
  focus: number;
  drag: DragState | null;
  receiving: boolean;
  receiveUntil: number;
  suppressClick: boolean;
  dropCount: number;
  intro: { phase: 'wait' | 'run' | 'done'; start: number; opening: boolean };
  anchor: Spring;
  appear: number;
  content: { key: string; entries: FolderEntry[] | null; renderer: Renderer | null };
}

interface Settings {
  open: boolean;
  layout: string;
  openOn: string;
  peek: boolean;
  intro: boolean;
  draggable: boolean;
  zoomOnClick: boolean;
  closeOnOutsideClick: boolean;
  onItemClick?: (item: FolderEntry, index: number) => void;
  onItemDrop?: (item: FolderEntry, index: number, inside: boolean) => void;
  tilt: number;
  bounce: number;
  speed: number;
  frost: number;
  count: number;
  entries: FolderEntry[];
  glass: boolean;
  light: boolean;
  tint: Rgb;
  insideTop: string;
  insideBottom: string;
  insideTone: number[][];
  content: string;
  depth: number;
  view: View;
  g: Geometry;
}

interface Engine {
  wake: () => void;
  invalidate: () => void;
  consumeClick: () => boolean;
  interactive: (index: number) => boolean;
  select: (index: number) => void;
  blur: () => boolean;
}

const TAU = Math.PI * 2;
const STEP = 1 / 240;
const MAX_ITEMS = 6;
const DEFAULT_ITEMS: FolderEntry[] = [{ title: 'Brand guidelines' }, { title: 'Launch plan' }, { title: 'Moodboard' }];

const PILE_TURN = [0.5, -1.1, 1.5, -0.7, 1.2, -1.6];
const BOOK_REST = [
  { x: 0.14, y: -0.004, r: 1.4 },
  { x: 0.115, y: 0.008, r: -1.1 },
  { x: 0.09, y: 0, r: 0.6 }
];
const BOOK_PEEK = [
  { x: 0.27, y: -0.016, r: 4.5 },
  { x: 0.2, y: 0.014, r: 1.2 },
  { x: 0.14, y: 0, r: -1.2 }
];
const FLAP_REST = [
  { x: 0.16, rise: 0, r: 3 },
  { x: -0.17, rise: 0.05, r: -3.5 },
  { x: 0, rise: 0.1, r: 0.5 },
  { x: 0.25, rise: 0.08, r: 5 },
  { x: -0.25, rise: 0.09, r: -5.5 },
  { x: 0.08, rise: 0.12, r: 1.5 }
];
const SPREAD_TURN = [4, -5, 3, -6, 5, -3];
const SPREAD_DROP = [0.03, -0.04, 0.05, -0.02, 0.04, -0.05];
const DROP_TURN = [-6, 4, -3, 7, -5, 3];
const BOOK_ANGLES: Record<Phase, number> = { open: -180, receive: -24, peek: -13, rest: 0 };
const FLAP_ANGLES: Record<Phase, number> = { open: -64, receive: -30, peek: -15, rest: 0 };
const LAYERS = { out: 50, drag: 80, focus: 90 };

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseColor = (() => {
  let context: CanvasRenderingContext2D | null = null;
  const cache = new Map<string, Rgb>();
  return (value: string): Rgb => {
    const key = String(value);
    const cached = cache.get(key);
    if (cached) return cached;
    let rgb: Rgb = [61, 139, 255];
    if (typeof document !== 'undefined') {
      context ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      if (context) {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = '#3d8bff';
        context.fillStyle = key;
        context.fillRect(0, 0, 1, 1);
        rgb = Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
      }
    }
    cache.set(key, rgb);
    return rgb;
  };
})();

const mixRgb = (rgb: Rgb, target: Rgb, amount: number): Rgb =>
  rgb.map((channel, i) => Math.round(channel + (target[i] - channel) * amount));
const rgbString = (rgb: Rgb) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
const luma = (rgb: Rgb) => (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;

const multiply = (a: Matrix, b: Matrix): Matrix => {
  const out: Matrix = new Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[row] * b[col * 4] + a[4 + row] * b[col * 4 + 1] + a[8 + row] * b[col * 4 + 2] + a[12 + row] * b[col * 4 + 3];
    }
  }
  return out;
};

const chain = (...list: Matrix[]) => list.reduce(multiply);
const move = (x: number, y: number, z = 0): Matrix => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
const stretch = (x: number, y: number): Matrix => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const turnX = (degrees: number): Matrix => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
};

const turnY = (degrees: number): Matrix => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
};

const turnZ = (degrees: number): Matrix => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};

const toCss = (m: Matrix) => `matrix3d(${m.map(v => (Math.abs(v) < 1e-7 ? 0 : Number(v.toFixed(6)))).join(', ')})`;

const measureFolder = (
  book: boolean,
  scale: number,
  labelWidth: number,
  hasLabel: boolean,
  tabPosition: string
): Geometry => {
  const w = (book ? 180 : 224) * scale;
  const h = (book ? 232 : 176) * scale;
  const tabH = 20 * scale;
  const r = 12 * scale;
  const shoulder = tabH * 0.75;
  const frontTop = book ? tabH : tabH + h * 0.3;
  const corners = book ? [0, r, r, 0] : [r, r, r, r];
  const maxTab = w - corners[0] - corners[1] - shoulder * 2 - 10 * scale;
  const tabW = clamp(hasLabel ? labelWidth + 14 * scale + shoulder : w * 0.34, Math.min(w * 0.3, maxTab), maxTab);
  const tabX =
    tabPosition === 'left'
      ? corners[0] + 5 * scale + shoulder
      : tabPosition === 'center'
        ? (w - tabW) / 2
        : w - corners[1] - 5 * scale - shoulder - tabW;
  const docW = book ? w * 0.8 : w * 0.54;
  return {
    book,
    scale,
    w,
    h,
    tabH,
    r,
    shoulder,
    corners,
    tabW,
    tabX,
    frontTop,
    frontH: tabH + h - frontTop,
    docW,
    docH: docW * (book ? 1.28 : 1.22)
  };
};

const backPath = (g: Geometry) => {
  const { w, h, tabX, tabW, tabH, shoulder } = g;
  const [tl, tr, br, bl] = g.corners;
  const top = tabH;
  const bottom = tabH + h;
  return [
    `M 0 ${top + tl}`,
    `Q 0 ${top} ${tl} ${top}`,
    `L ${tabX - shoulder} ${top}`,
    `C ${tabX} ${top} ${tabX} 0 ${tabX + shoulder} 0`,
    `L ${tabX + tabW - shoulder} 0`,
    `C ${tabX + tabW} 0 ${tabX + tabW} ${top} ${tabX + tabW + shoulder} ${top}`,
    `L ${w - tr} ${top}`,
    `Q ${w} ${top} ${w} ${top + tr}`,
    `L ${w} ${bottom - br}`,
    `Q ${w} ${bottom} ${w - br} ${bottom}`,
    `L ${bl} ${bottom}`,
    `Q 0 ${bottom} 0 ${bottom - bl}`,
    'Z'
  ].join(' ');
};

const VERTEX = `#version 300 es
layout(location = 0) in vec2 aCorner;
uniform mat4 uModel;
uniform vec2 uSize;
uniform float uDepth;
uniform vec2 uOrigin;
uniform vec4 uView;
uniform float uBleed;
out vec2 vLocal;
out vec2 vUv;
void main() {
  vLocal = aCorner * (uSize + vec2(uBleed, 0.0)) - vec2(uBleed, 0.0);
  vUv = aCorner;
  vec4 q = uModel * vec4(vLocal, 0.0, 1.0);
  float w = 1.0 - q.z / uDepth;
  vec2 p = q.xy - uOrigin + (uOrigin - uView.xy) * w;
  vec2 clip = p / uView.zw * 2.0 - w;
  gl_Position = vec4(clip.x, -clip.y, 0.0, w);
}`;

const PAINT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uImage;
uniform float uAlpha;
out vec4 outColor;
void main() {
  outColor = texture(uImage, vUv) * uAlpha;
}`;

const SCREEN = `#version 300 es
layout(location = 0) in vec2 aCorner;
out vec2 vUv;
void main() {
  vUv = aCorner;
  gl_Position = vec4(aCorner * 2.0 - 1.0, 0.0, 1.0);
}`;

const BLUR = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uImage;
uniform vec2 uStep;
uniform float uSigma;
out vec4 outColor;
void main() {
  float spacing = max(1.0, uSigma * 2.5 / 24.0);
  int reach = int(min(ceil(uSigma * 2.5 / spacing), 24.0));
  vec4 sum = texture(uImage, vUv);
  float total = 1.0;
  for (int i = 1; i <= 24; i++) {
    if (i > reach) break;
    float x = float(i) * spacing;
    float weight = exp(-0.5 * x * x / (uSigma * uSigma));
    sum += (texture(uImage, vUv + uStep * x) + texture(uImage, vUv - uStep * x)) * weight;
    total += 2.0 * weight;
  }
  outColor = sum / total;
}`;

const GLASS = `#version 300 es
precision highp float;
in vec2 vLocal;
uniform mat4 uModel;
uniform vec2 uSize;
uniform float uDepth;
uniform vec2 uOrigin;
uniform vec4 uView;
uniform sampler2D uBehind;
uniform vec4 uRadii;
uniform float uSpine;
uniform float uLens;
uniform float uMorph;
uniform vec3 uInsideTop;
uniform vec3 uInsideBottom;
uniform float uTabRatio;
uniform vec2 uGutter;
uniform float uBevel;
uniform float uStrength;
uniform float uSplit;
uniform vec4 uTint;
uniform float uHaze;
uniform float uDim;
uniform float uGlint;
uniform float uShine;
uniform vec2 uLight;
out vec4 outColor;

float box(vec2 p, vec2 b, vec4 r) {
  float k = p.x > 0.0 ? (p.y > 0.0 ? r.z : r.y) : (p.y > 0.0 ? r.w : r.x);
  vec2 q = abs(p) - b + k;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - k;
}

float shape(vec2 p) {
  vec2 halfSize = vec2(uSize.x + uSpine, uSize.y) * 0.5;
  return box(p - vec2(uSize.x - halfSize.x, halfSize.y), halfSize, uRadii);
}

vec2 locate(vec2 p) {
  vec4 q = uModel * vec4(p, 0.0, 1.0);
  float w = 1.0 - q.z / uDepth;
  vec2 s = uOrigin + (q.xy - uOrigin) / w;
  vec2 uv = (s - uView.xy) / uView.zw;
  return vec2(uv.x, 1.0 - uv.y);
}

void main() {
  float d = shape(vLocal);
  float aa = max(fwidth(d), 1e-3);
  float cover = clamp(0.5 - d / aa, 0.0, 1.0);
  if (cover <= 0.0) discard;
  float e = 0.5;
  vec2 n = vec2(
    shape(vLocal + vec2(e, 0.0)) - shape(vLocal - vec2(e, 0.0)),
    shape(vLocal + vec2(0.0, e)) - shape(vLocal - vec2(0.0, e))
  );
  n /= max(length(n), 1e-5);
  float inside = max(0.0, -d);
  float t = 1.0 - clamp(inside / uBevel, 0.0, 1.0);
  vec2 bend = -n * pow(t, 2.0) * uStrength + (uSize * 0.5 - vLocal) * uLens;
  vec2 p = vLocal + bend;
  vec2 uv = locate(p);
  mat2 jac = mat2(locate(p + vec2(1.0, 0.0)) - uv, locate(p + vec2(0.0, 1.0)) - uv);
  vec4 seen = texture(uBehind, uv);
  if (uSplit > 0.0) {
    vec2 split = jac * (bend * uSplit);
    seen.r = texture(uBehind, uv + split).r;
    seen.b = texture(uBehind, uv - split).b;
  }
  vec4 color = vec4(uTint.rgb, 1.0) * uTint.a + seen * (1.0 - uTint.a);
  color.rgb = mix(color.rgb, vec3(color.a), uHaze + uGlint);
  color.rgb *= 1.0 - uDim;
  float band = 0.0;
  if (uMorph > 0.0) {
    band = (1.0 - smoothstep(0.0, uSize.x * 0.75, vLocal.x)) * uMorph;
    vec3 solid = mix(uInsideTop, uInsideBottom, uTabRatio + vLocal.y / uSize.y * (1.0 - uTabRatio));
    color = mix(color, vec4(solid, 1.0), band);
  }
  if (uGutter.y > 0.0) color.rgb *= 1.0 - uGutter.y * (1.0 - smoothstep(0.0, uGutter.x, vLocal.x));
  float facing = dot(n, uLight);
  float edge = clamp(inside / aa, 0.0, 1.0);
  vec2 span = vLocal / uSize;
  float across = uLight.x > 0.0 ? 1.0 - span.x : span.x;
  float sheen = smoothstep(0.85, 0.0, across * 0.55 + span.y) * 0.07 * uShine * (1.0 - band);
  float light = (max(facing, 0.0) * 0.85 + max(-facing, 0.0) * 0.28) * t * t * t * uShine + sheen;
  light += exp(-inside / 0.9) * (0.16 + 0.3 * max(facing, 0.0)) * uShine;
  float shade = max(-facing, 0.0) * t * t * 0.22 * (1.0 - band);
  color = color * (1.0 - shade) + vec4(0.0, 0.0, 0.0, shade);
  light = clamp(light * edge * (1.0 - band), 0.0, 1.0);
  color = color * (1.0 - light) + vec4(light);
  outColor = color * cover;
}`;

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  names: string[]
): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
  const uniforms: Program['uniforms'] = {};
  names.forEach(name => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });
  return { program, uniforms };
};

const PLACED = ['uModel', 'uSize', 'uDepth', 'uOrigin', 'uView', 'uBleed'];

const createGlass = (canvas: HTMLCanvasElement): Renderer | null => {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) return null;
  const paint = link(gl, VERTEX, PAINT, [...PLACED, 'uImage', 'uAlpha']);
  const blur = link(gl, SCREEN, BLUR, ['uImage', 'uStep', 'uSigma']);
  const glass = link(gl, VERTEX, GLASS, [
    ...PLACED,
    'uBehind',
    'uRadii',
    'uSpine',
    'uLens',
    'uMorph',
    'uInsideTop',
    'uInsideBottom',
    'uTabRatio',
    'uGutter',
    'uBevel',
    'uStrength',
    'uSplit',
    'uTint',
    'uHaze',
    'uDim',
    'uGlint',
    'uShine',
    'uLight'
  ]);
  if (!paint || !blur || !glass) return null;

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const makeTarget = (): Target => ({ texture: gl.createTexture(), frame: gl.createFramebuffer() });
  const targets = [makeTarget(), makeTarget(), makeTarget()];
  const size = { width: 0, height: 0 };
  const textures = new Map<string, WebGLTexture>();

  const placed = (program: Program, scene: Scene) => {
    gl.uniform1f(program.uniforms.uDepth, scene.depth);
    gl.uniform2f(program.uniforms.uOrigin, scene.origin[0], scene.origin[1]);
    gl.uniform4f(program.uniforms.uView, scene.view.x, scene.view.y, scene.view.width, scene.view.height);
  };

  const resize = (width: number, height: number) => {
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    if (size.width === width && size.height === height) return;
    size.width = width;
    size.height = height;
    targets.forEach(target => {
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.frame);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    });
  };

  const pass = (source: Target, target: Target, stepX: number, stepY: number, sigma: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.frame);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform2f(blur.uniforms.uStep, stepX, stepY);
    gl.uniform1f(blur.uniforms.uSigma, sigma);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  return {
    upload(key: string, source: HTMLCanvasElement) {
      let texture = textures.get(key);
      if (!texture) {
        texture = gl.createTexture() as WebGLTexture;
        textures.set(key, texture);
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    },
    prune(keys: Set<string>) {
      textures.forEach((texture, key) => {
        if (keys.has(key)) return;
        gl.deleteTexture(texture);
        textures.delete(key);
      });
    },
    render(scene: Scene) {
      if (gl.isContextLost()) return;
      const width = Math.max(1, Math.round(scene.view.width * scene.dpr));
      const height = Math.max(1, Math.round(scene.view.height * scene.dpr));
      resize(width, height);
      const [sharp, half, soft] = targets;
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindFramebuffer(gl.FRAMEBUFFER, sharp.frame);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(paint.program);
      placed(paint, scene);
      gl.uniform1i(paint.uniforms.uImage, 0);
      gl.uniform1f(paint.uniforms.uBleed, 0);
      scene.layers.forEach(layer => {
        const texture = textures.get(layer.key);
        if (!texture) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniformMatrix4fv(paint.uniforms.uModel, false, layer.matrix);
        gl.uniform2f(paint.uniforms.uSize, layer.width, layer.height);
        gl.uniform1f(paint.uniforms.uAlpha, layer.alpha);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      });

      const pane = scene.glass;
      const sigma = pane.frost * scene.dpr;
      let behind = sharp;
      if (sigma > 0.35) {
        gl.disable(gl.BLEND);
        gl.useProgram(blur.program);
        gl.uniform1i(blur.uniforms.uImage, 0);
        pass(sharp, half, 1 / width, 0, sigma);
        pass(half, soft, 0, 1 / height, sigma);
        gl.enable(gl.BLEND);
        behind = soft;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const u = glass.uniforms;
      gl.useProgram(glass.program);
      placed(glass, scene);
      gl.bindTexture(gl.TEXTURE_2D, behind.texture);
      gl.uniform1i(u.uBehind, 0);
      gl.uniformMatrix4fv(u.uModel, false, pane.matrix);
      gl.uniform2f(u.uSize, pane.width, pane.height);
      gl.uniform1f(u.uBleed, pane.bleed);
      gl.uniform4fv(u.uRadii, pane.radii);
      gl.uniform1f(u.uSpine, pane.spine);
      gl.uniform1f(u.uLens, pane.lens);
      gl.uniform1f(u.uMorph, pane.morph);
      gl.uniform3fv(u.uInsideTop, pane.insideTop);
      gl.uniform3fv(u.uInsideBottom, pane.insideBottom);
      gl.uniform1f(u.uTabRatio, pane.tabRatio);
      gl.uniform2fv(u.uGutter, pane.gutter);
      gl.uniform1f(u.uBevel, pane.bevel);
      gl.uniform1f(u.uStrength, pane.strength);
      gl.uniform1f(u.uSplit, pane.split);
      gl.uniform4fv(u.uTint, pane.tint);
      gl.uniform1f(u.uHaze, pane.haze);
      gl.uniform1f(u.uDim, pane.dim);
      gl.uniform1f(u.uGlint, pane.glint);
      gl.uniform1f(u.uShine, pane.shine);
      gl.uniform2fv(u.uLight, pane.light);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      textures.forEach(texture => gl.deleteTexture(texture));
      textures.clear();
      targets.forEach(target => {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.frame);
      });
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(paint.program);
      gl.deleteProgram(blur.program);
      gl.deleteProgram(glass.program);
    }
  };
};

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const offsetWithin = (element: HTMLElement, root: HTMLElement): [number, number] | null => {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return node === root ? [x, y] : null;
};

const isClear = (color: string) => !color || color === 'transparent' || /rgba?\([^)]*[,/]\s*0\s*\)$/.test(color);

const drawText = (
  ctx: CanvasRenderingContext2D,
  element: Element,
  x: number,
  y: number,
  width: number,
  style: CSSStyleDeclaration
) => {
  const text = Array.from(element.childNodes)
    .filter(node => node.nodeType === 3)
    .map(node => node.textContent)
    .join('')
    .trim();
  if (!text) return;
  const size = parseFloat(style.fontSize) || 12;
  const lineHeight = parseFloat(style.lineHeight) || size * 1.2;
  const left = x + (parseFloat(style.paddingLeft) || 0);
  const top = y + (parseFloat(style.paddingTop) || 0);
  const room = width - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.fillStyle = style.color;
  ctx.textBaseline = 'middle';
  const fit = (line: string) => {
    if (ctx.measureText(line).width <= room) return line;
    let cut = line;
    while (cut.length > 1 && ctx.measureText(`${cut}…`).width > room) cut = cut.slice(0, -1);
    return `${cut.trimEnd()}…`;
  };
  if (style.whiteSpace === 'nowrap') {
    ctx.fillText(fit(text), left, top + lineHeight / 2);
    return;
  }
  let line = '';
  let row = 0;
  text.split(/\s+/).forEach(word => {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > room) {
      ctx.fillText(line, left, top + lineHeight * (row + 0.5));
      row += 1;
      line = word;
    } else {
      line = next;
    }
  });
  if (line) ctx.fillText(line, left, top + lineHeight * (row + 0.5));
};

const rasterize = (node: HTMLElement, dpr: number, skipImages: boolean) => {
  const width = Math.max(1, node.offsetWidth);
  const height = Math.max(1, node.offsetHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  const pending: HTMLImageElement[] = [];
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, pending };
  ctx.scale(dpr, dpr);
  const paint = (element: HTMLElement, x: number, y: number) => {
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    const w = element.offsetWidth;
    const h = element.offsetHeight;
    const radius = parseFloat(style.borderTopLeftRadius) || 0;
    const opacity = element !== node && Number.isFinite(parseFloat(style.opacity)) ? parseFloat(style.opacity) : 1;
    ctx.save();
    ctx.globalAlpha *= opacity;
    if (!isClear(style.backgroundColor)) {
      ctx.fillStyle = style.backgroundColor;
      roundedRect(ctx, x, y, w, h, radius);
      ctx.fill();
    }
    if (style.overflow !== 'visible') {
      roundedRect(ctx, x, y, w, h, radius);
      ctx.clip();
    }
    if (element instanceof HTMLImageElement) {
      if (!element.complete || !element.naturalWidth) pending.push(element);
      else if (!skipImages) {
        const ratio = Math.max(w / element.naturalWidth, h / element.naturalHeight);
        const sw = w / ratio;
        const sh = h / ratio;
        ctx.drawImage(element, (element.naturalWidth - sw) / 2, (element.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
      }
    } else {
      drawText(ctx, element, x, y, w, style);
      Array.from(element.children).forEach(child => {
        const at = offsetWithin(child as HTMLElement, node);
        if (at) paint(child as HTMLElement, at[0], at[1]);
      });
    }
    ctx.restore();
  };
  paint(node, 0, 0);
  return { canvas, pending };
};

const paintBack = (g: Geometry, top: string, bottom: string, dpr: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(g.w * dpr));
  canvas.height = Math.max(1, Math.round((g.tabH + g.h) * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(dpr, dpr);
  const fill = ctx.createLinearGradient(0, 0, 0, g.tabH + g.h);
  fill.addColorStop(0, top);
  fill.addColorStop(1, bottom);
  ctx.fillStyle = fill;
  ctx.fill(new Path2D(backPath(g)));
  return canvas;
};

const DocumentCard = ({ title, description }: { title?: string; description?: string }) => (
  <div className="folder-doc">
    {title ? <span className="folder-doc-title">{title}</span> : <span className="folder-doc-heading" />}
    {description && <span className="folder-doc-text">{description}</span>}
    <span className="folder-doc-line" style={{ width: '92%' }} />
    <span className="folder-doc-line" style={{ width: '84%' }} />
    <span className="folder-doc-line" style={{ width: '88%' }} />
    <span className="folder-doc-block" />
    <span className="folder-doc-line" style={{ width: '80%' }} />
    <span className="folder-doc-line" style={{ width: '62%' }} />
  </div>
);

const renderItem = (item: FolderEntry): ReactNode => {
  if (isValidElement(item)) return item;
  if (typeof item === 'string' || typeof item === 'number') return <DocumentCard title={String(item)} />;
  if (item && typeof item === 'object') {
    if (item.image) {
      return (
        <div className="folder-photo">
          <img src={item.image} alt={item.alt ?? item.title ?? ''} draggable={false} />
        </div>
      );
    }
    if (item.content) return item.content;
    return <DocumentCard title={item.title} description={item.description} />;
  }
  return <DocumentCard />;
};

const placeBook = (rank: number, count: number, phase: Phase, layout: string, g: Geometry): Slot => {
  const pileX = g.w / 2;
  const pileY = g.frontTop + g.frontH / 2;
  if (phase === 'open') {
    if (layout === 'row') {
      const gap = 10 * g.scale;
      const fit = Math.min(0.8, (g.w * 1.86 - gap * (count - 1)) / (count * g.docW));
      const step = g.docW * fit + gap;
      return { x: g.w / 2 + (rank - (count - 1) / 2) * step, y: pileY, z: 0, r: 0, ry: 0, s: fit };
    }
    if (layout === 'stack') {
      const fit = 0.74;
      const strip = Math.min(26 * g.scale, (g.h * 0.36) / Math.max(1, count - 1));
      const top = g.frontTop + 14 * g.scale + (count - 1) * strip;
      return { x: g.w, y: top + (g.docH * fit) / 2 - rank * strip, z: 0, r: 0, ry: 0, s: fit };
    }
    const fit = count > 4 ? 0.58 : count > 3 ? 0.64 : 0.72;
    const span = count === 2 ? g.w : Math.min(g.w * 1.3, g.w * 0.6 * (count - 1));
    const x = count > 1 ? span / 2 - (rank * span) / (count - 1) : g.w * 0.5;
    return { x: g.w / 2 + x, y: pileY + SPREAD_DROP[rank] * g.h, z: 0, r: SPREAD_TURN[rank], ry: 0, s: fit };
  }
  const offsets = phase === 'rest' ? BOOK_REST : BOOK_PEEK;
  const offset = offsets[rank] ?? { x: 0.06, y: 0, r: PILE_TURN[rank] ?? 0 };
  return {
    x: pileX + offset.x * g.w,
    y: pileY + offset.y * g.h + rank * 0.8 * g.scale,
    z: 0,
    r: offset.r,
    ry: 0,
    s: 1
  };
};

const placeFlap = (
  rank: number,
  count: number,
  phase: Phase,
  layout: string,
  g: Geometry,
  pointer: number | null
): Slot => {
  const rest = FLAP_REST[rank] ?? FLAP_REST[FLAP_REST.length - 1];
  const floor = g.tabH + g.h - 5 * g.scale - g.docH / 2;
  const mid = (count - 1) / 2;
  if (phase === 'open') {
    const lift = g.tabH - g.h * 0.02;
    if (layout === 'stack') {
      const strip = Math.min(30 * g.scale, (g.h * 0.62) / Math.max(1, count - 1));
      const fit = 1.04 - rank * 0.05;
      return {
        x: g.w / 2,
        y: g.tabH + g.h * 0.1 - rank * strip - (g.docH * (1.04 - fit)) / 2,
        z: -rank * 18 * g.scale,
        r: 0,
        ry: 0,
        s: fit
      };
    }
    const gap = 12 * g.scale;
    const fit = Math.min(0.94, (g.w * 2.3 - gap * (count - 1)) / (count * g.docW));
    const step = g.docW * fit + gap;
    const tidy = layout === 'row';
    return {
      x: g.w / 2 + (rank - mid) * step,
      y: lift + (tidy ? 0 : SPREAD_DROP[rank] * g.h * 0.7),
      z: 0,
      r: tidy ? 0 : SPREAD_TURN[rank] * 0.55,
      ry: 0,
      s: fit
    };
  }
  const part = phase === 'receive' ? 1.7 : phase === 'peek' ? 1.3 : 1;
  const x = g.w / 2 + rest.x * g.w * part;
  if (phase === 'rest') return { x, y: floor - rest.rise * g.h, z: 0, r: rest.r, ry: 0, s: 1 };
  const near = phase === 'peek' && pointer != null ? Math.max(0, 1 - Math.abs(pointer - x) / (g.w * 0.32)) : 0;
  const rise = rest.rise + (phase === 'receive' ? 0.03 : 0.1);
  return { x, y: floor - rise * g.h - near * near * g.h * 0.09, z: 0, r: rest.r * 1.6, ry: 0, s: 1 };
};

const Folder = ({
  items,
  label,
  mode = 'flap',
  variant = 'solid',
  color = '#3d8bff',
  paperColor = '#ffffff',
  tabPosition = 'right',
  layout = 'spread',
  size = 1,
  openOn = 'click',
  open,
  defaultOpen = false,
  onOpenChange,
  onItemClick,
  onItemDrop,
  draggable = true,
  zoomOnClick = true,
  peek = true,
  intro = true,
  tilt = 0.5,
  bounce = 0.4,
  speed = 1,
  frost = 0.25,
  closeOnOutsideClick = true,
  theme = 'dark',
  className = '',
  style,
  children
}: FolderProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLSpanElement>(null);
  const castRef = useRef<HTMLSpanElement>(null);
  const shadeRef = useRef<HTMLSpanElement>(null);
  const glassRef = useRef<HTMLCanvasElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const measureRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [labelWidth, setLabelWidth] = useState(0);
  const [outside, setOutside] = useState<number[]>([]);
  const [gpu, setGpu] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? Boolean(open) : internalOpen;
  const book = mode === 'book';
  const glass = variant === 'glass';

  const entries = useMemo<FolderEntry[]>(() => {
    const custom = Children.toArray(children).filter(isValidElement);
    const source = custom.length ? custom : items?.length ? items : DEFAULT_ITEMS;
    return source.slice(0, MAX_ITEMS);
  }, [children, items]);
  const count = entries.length;

  const scale = Math.max(0.3, Number(size) || 1);
  const g = measureFolder(book, scale, labelWidth, Boolean(label), tabPosition);
  const total = g.tabH + g.h;
  const view = book
    ? { x: -0.75 * g.w, y: -0.25 * total, width: 2.5 * g.w, height: 1.5 * total }
    : { x: -0.25 * g.w, y: -0.1 * total, width: 1.5 * g.w, height: 1.3 * total };

  useIsomorphicLayoutEffect(() => {
    const node = measureRef.current;
    if (!node) return undefined;
    let active = true;
    const measure = () => {
      if (active) setLabelWidth(node.offsetWidth);
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => {
      active = false;
    };
  }, [label, scale]);

  const setOpen = useCallback(
    (next: boolean | ((open: boolean) => boolean)) => {
      const value = typeof next === 'function' ? next(isOpen) : next;
      if (!isControlled) setInternalOpen(value);
      if (value !== isOpen) onOpenChange?.(value);
    },
    [isControlled, isOpen, onOpenChange]
  );

  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  const rgb = parseColor(color);
  const paper = parseColor(paperColor);
  const backTone = mixRgb(rgb, [0, 0, 0], 0.16);
  const insideTop = rgbString(mixRgb(rgb, [0, 0, 0], 0.08));
  const insideBottom = rgbString(backTone);

  const settingsRef = useRef<Settings>(null as unknown as Settings);
  settingsRef.current = {
    open: isOpen,
    layout,
    openOn,
    peek,
    intro,
    draggable,
    zoomOnClick,
    closeOnOutsideClick,
    onItemClick,
    onItemDrop,
    tilt: clamp(tilt, 0, 1.5),
    bounce: clamp(bounce, 0, 1),
    speed: clamp(speed, 0.2, 3),
    frost: clamp(frost, 0, 1),
    count,
    entries,
    glass,
    light: theme === 'light',
    tint: rgb,
    insideTop,
    insideBottom,
    insideTone: [mixRgb(rgb, [0, 0, 0], 0.08).map(v => v / 255), backTone.map(v => v / 255)],
    content: `${mode}|${scale}|${paperColor}|${color}|${g.tabX}|${g.tabW}`,
    depth: Math.round(Math.max(g.w, g.h) * 5),
    view,
    g
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const spring = (value: number): Spring => ({ value, velocity: 0 });
    const state: EngineState = {
      raf: 0,
      last: 0,
      ready: false,
      hovered: false,
      pressed: false,
      pointerX: 0,
      pointerY: 0,
      deskX: 0,
      deskY: 0,
      hoveredItem: -1,
      phase: 'rest',
      previous: 'rest',
      changedAt: 0,
      front: spring(0),
      rx: spring(0),
      ry: spring(0),
      lift: spring(0),
      squash: spring(1),
      items: [],
      focus: -1,
      drag: null,
      receiving: false,
      receiveUntil: 0,
      suppressClick: false,
      dropCount: 0,
      intro: { phase: 'done', start: 0, opening: false },
      anchor: spring(0),
      appear: 1,
      content: { key: '', entries: null, renderer: null }
    };

    const ensureItems = (n: number) => {
      while (state.items.length < n) {
        state.items.push({
          x: spring(0),
          y: spring(0),
          z: spring(0),
          r: spring(0),
          ry: spring(0),
          s: spring(1),
          hover: spring(0),
          mx: spring(0),
          my: spring(0),
          alpha: spring(1),
          place: 'inside',
          rank: 0,
          layer: 'inside',
          elevated: false,
          insertUntil: 0,
          insertFrom: null,
          outX: 0,
          outY: 0,
          outR: 0,
          outS: 1,
          outOrder: 0,
          localX: 0,
          localY: 0,
          fresh: true
        });
      }
      if (state.items.length > n) {
        state.items.length = n;
        if (state.focus >= n) state.focus = -1;
        syncOutside();
      }
    };

    const syncOutside = () => {
      const list: number[] = [];
      state.items.forEach((item, index) => {
        if (item.place === 'out') list.push(index);
      });
      setOutside(previous =>
        previous.length === list.length && previous.every((value, i) => value === list[i]) ? previous : list
      );
    };

    const integrate = (item: Spring, target: number, omega: number, zeta: number, dt: number) => {
      const k = omega * omega;
      const d = 2 * zeta * omega;
      const steps = Math.max(1, Math.ceil(dt / STEP));
      const step = dt / steps;
      for (let i = 0; i < steps; i++) {
        item.velocity += (k * (target - item.value) - d * item.velocity) * step;
        item.value += item.velocity * step;
      }
      return Math.abs(target - item.value) > 0.01 || Math.abs(item.velocity) > 0.01;
    };

    const snap = (item: Spring, value: number) => {
      item.value = value;
      item.velocity = 0;
    };

    const shiftOf = () => {
      const { g: geometry } = settingsRef.current;
      return geometry.book ? (geometry.w / 2) * clamp(-state.front.value / 180, 0, 1) : 0;
    };

    const toDesk = (clientX: number, clientY: number) => {
      const box = root.getBoundingClientRect();
      const kx = root.offsetWidth / (box.width || 1);
      const ky = root.offsetHeight / (box.height || 1);
      return [(clientX - box.left) * kx, (clientY - box.top) * ky];
    };

    const clipBounds = (): Bounds => {
      const box = root.getBoundingClientRect();
      let left = 0;
      let top = 0;
      let right = window.innerWidth;
      let bottom = window.innerHeight;
      for (let node = root.parentElement; node && node !== document.body; node = node.parentElement) {
        const computed = getComputedStyle(node);
        if (/(hidden|clip|auto|scroll)/.test(`${computed.overflowX} ${computed.overflowY}`)) {
          const rect = node.getBoundingClientRect();
          left = Math.max(left, rect.left);
          top = Math.max(top, rect.top);
          right = Math.min(right, rect.right);
          bottom = Math.min(bottom, rect.bottom);
          break;
        }
      }
      const kx = root.offsetWidth / (box.width || 1);
      const ky = root.offsetHeight / (box.height || 1);
      return {
        left: (left - box.left) * kx,
        top: (top - box.top) * ky,
        right: (right - box.left) * kx,
        bottom: (bottom - box.top) * ky
      };
    };

    const overFolder = (x: number, y: number) => {
      const { g: geometry } = settingsRef.current;
      const shift = shiftOf();
      if (geometry.book) {
        const left = state.front.value < -90 ? shift - geometry.w : shift;
        return x >= left && x <= shift + geometry.w && y >= geometry.tabH * 0.5 && y <= geometry.tabH + geometry.h;
      }
      return x >= 0 && x <= geometry.w && y >= 0 && y <= geometry.tabH + geometry.h;
    };

    const inPocket = (item: ItemState) => {
      const { g: geometry } = settingsRef.current;
      const halfW = (geometry.docW * item.s.value) / 2;
      const halfH = (geometry.docH * item.s.value) / 2;
      if (geometry.book) {
        if (state.front.value < -60) return false;
        const shift = shiftOf();
        return (
          item.x.value - halfW < shift + geometry.w &&
          item.x.value + halfW > shift &&
          item.y.value + halfH > geometry.tabH &&
          item.y.value - halfH < geometry.tabH + geometry.h
        );
      }
      if (state.front.value < -45) return false;
      return (
        item.y.value + halfH > geometry.frontTop + 4 * geometry.scale &&
        item.x.value + halfW > 0 &&
        item.x.value - halfW < geometry.w
      );
    };

    const velocityOf = (samples: number[][]) => {
      if (samples.length < 2) return [0, 0];
      const first = samples[0];
      const last = samples[samples.length - 1];
      const span = Math.max(0.016, (last[0] - first[0]) / 1000);
      return [(last[1] - first[1]) / span, (last[2] - first[2]) / span];
    };

    const phaseOf = (s: Settings, time: number): Phase => {
      if (s.open) return 'open';
      if (state.receiving || time < state.receiveUntil) return 'receive';
      if (s.peek && state.hovered && !state.drag?.active) return 'peek';
      return 'rest';
    };

    const place = (rank: number, inside: number, phase: Phase, s: Settings) => {
      if (s.g.book) return placeBook(rank, inside, phase, s.layout, s.g);
      const pointer = state.hovered ? ((state.pointerX + 1) / 2) * s.g.w : null;
      return placeFlap(rank, inside, phase, s.layout, s.g, pointer);
    };

    const approach = (item: ItemState, slot: Slot, s: Settings): Slot => {
      const { g: geometry } = s;
      if (item.insertFrom === 'side') {
        return { ...slot, x: Math.max(slot.x, geometry.w + geometry.docW * 0.54 * slot.s) };
      }
      return { ...slot, y: Math.min(slot.y, geometry.frontTop - geometry.docH * 0.5 * slot.s - 8 * geometry.scale) };
    };

    const frame = (now: number) => {
      state.raf = 0;
      const s = settingsRef.current;
      const { g: geometry } = s;
      ensureItems(s.count);
      const time = now / 1000;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;
      const zeta = reduce ? 1 : 1 - 0.72 * s.bounce;
      const frontOmega = TAU * (geometry.book ? 1.55 : 2) * s.speed;
      const itemOmega = TAU * 2.1 * s.speed;
      const soft = TAU * 1.6 * s.speed;
      const phase = phaseOf(s, time);
      if (phase !== state.phase) {
        state.previous = state.phase;
        state.phase = phase;
        state.changedAt = now;
      }
      const elapsed = (now - state.changedAt) / 1000;
      let busy = time < state.receiveUntil;

      const ranks: number[] = [];
      state.items.forEach((item, index) => {
        if (item.place === 'inside') ranks.push(index);
      });
      const inside = ranks.length;
      ranks.forEach((index, rank) => {
        state.items[index].rank = rank;
      });
      if (state.focus >= 0 && phase !== 'open' && state.items[state.focus]?.place === 'inside') state.focus = -1;

      const intro = state.intro;
      if (!state.ready) intro.opening = s.open;
      if (intro.phase === 'run' && !intro.opening && (s.open || state.drag?.active)) intro.phase = 'done';
      const introTime = intro.phase === 'run' ? time - intro.start : 0;
      const staged = intro.phase !== 'done' && !intro.opening;
      const closeAt = (0.16 + inside * 0.085 + 0.3) / s.speed;
      const holding = staged && introTime < closeAt;
      const dropAt = (rank: number) => (0.16 + (inside - 1 - rank) * 0.085) / s.speed;
      const introPose = (item: ItemState, slot: Slot): Slot =>
        geometry.book
          ? { ...slot, r: slot.r + (item.rank % 2 ? 7 : -6), s: slot.s * 1.12 }
          : {
              ...slot,
              y: slot.y - (geometry.h * 0.8 + geometry.docH * 0.5),
              r: slot.r + (item.rank % 2 ? 9 : -7)
            };
      if (intro.phase === 'run') {
        busy = true;
        if (introTime > (intro.opening ? 1.4 : closeAt + 1) / s.speed) intro.phase = 'done';
      }
      const appear = intro.phase === 'wait' ? 0 : intro.phase === 'run' ? clamp(introTime / (0.34 / s.speed), 0, 1) : 1;
      state.appear = 1 - (1 - appear) ** 3;

      const closing = state.previous === 'open' && phase !== 'open';
      const frontDelay = closing && !reduce ? ((geometry.book ? 0.1 : 0.06) + 0.035 * inside) / s.speed : 0;
      const frontPhase = elapsed < frontDelay ? state.previous : phase;
      const frontTarget = holding
        ? geometry.book
          ? -150
          : -42
        : (geometry.book ? BOOK_ANGLES : FLAP_ANGLES)[frontPhase];

      if (!state.ready) {
        state.ready = true;
        const opening = intro.phase !== 'done' && intro.opening;
        if (opening) {
          state.phase = 'rest';
          state.previous = 'rest';
        }
        snap(state.front, opening ? 0 : frontTarget);
        snap(state.anchor, staged ? 1 : 0);
        state.items.forEach(item => {
          const slot = place(item.rank, inside, opening ? 'rest' : phase, s);
          const target = staged ? introPose(item, slot) : slot;
          snap(item.x, target.x);
          snap(item.y, target.y);
          snap(item.z, target.z);
          snap(item.r, target.r);
          snap(item.ry, target.ry);
          snap(item.s, target.s);
          snap(item.alpha, staged ? 0 : 1);
          snap(item.hover, staged && geometry.book ? 3 : 0);
          item.fresh = false;
        });
      }

      if (intro.phase === 'wait') {
        write();
        state.last = 0;
        return;
      }

      busy = integrate(state.front, frontTarget, frontOmega, zeta, dt) || busy;
      const restitution = 0.2 + 0.35 * s.bounce;
      if (geometry.book && state.front.value < -180) {
        state.front.value = -360 - state.front.value;
        state.front.velocity = -state.front.velocity * restitution;
      } else if (state.front.value > 0) {
        state.front.value = -state.front.value;
        state.front.velocity = -state.front.velocity * restitution;
      }
      if (elapsed < frontDelay) busy = true;
      busy = integrate(state.anchor, staged ? 1 : 0, frontOmega, 1, dt) || busy;

      const engaged = state.hovered && !reduce;
      busy = integrate(state.rx, engaged ? -state.pointerY * 8 * s.tilt : 0, soft, 1, dt) || busy;
      busy = integrate(state.ry, engaged ? state.pointerX * 10 * s.tilt : 0, soft, 1, dt) || busy;
      busy = integrate(state.lift, state.hovered && phase !== 'open' ? 1 : 0, soft, 1, dt) || busy;
      busy = integrate(state.squash, state.pressed ? 0.975 : 1, TAU * 3.2, 0.6, dt) || busy;

      const opening = phase === 'open' && state.previous !== 'open';
      const drag = state.drag?.active ? state.drag : null;
      const hover = state.hoveredItem;
      const hovering = !drag && hover >= 0 && state.items[hover] ? state.items[hover] : null;
      const lead =
        hovering && hovering.place === 'inside' && phase === 'open' ? place(hovering.rank, inside, 'open', s) : null;
      const focusScale = clamp(((geometry.tabH + geometry.h) * 1.18) / geometry.docH, 1.2, 2.2);
      const focusY = geometry.book ? geometry.tabH + geometry.h / 2 : geometry.tabH + geometry.h * 0.36;

      state.items.forEach((item, index) => {
        if (item.fresh) {
          const start = place(item.rank, inside, 'rest', s);
          snap(item.x, start.x);
          snap(item.y, start.y);
          snap(item.r, start.r);
          item.fresh = false;
        }
        let target: Slot;
        let omega = itemOmega;
        let damping = zeta;
        let lift = 0;
        let fade = 1;
        let magnet = false;
        if (state.focus === index) {
          target = { x: geometry.w / 2, y: focusY, z: 0, r: 0, ry: 0, s: focusScale };
          lift = 2.4;
          item.layer = 'focus';
        } else if (drag && drag.index === index) {
          const [vx] = velocityOf(drag.samples);
          target = {
            x: state.deskX + drag.grabX,
            y: state.deskY + drag.grabY,
            z: 0,
            r: clamp(vx * 0.012, -14, 14),
            ry: 0,
            s: drag.scale * 1.05
          };
          omega = TAU * 5;
          damping = 0.78;
          lift = 1.4;
          if (!item.elevated && !inPocket(item)) item.elevated = true;
          item.layer = item.elevated ? 'drag' : 'inside';
        } else if (item.place === 'out') {
          target = { x: item.outX, y: item.outY, z: 0, r: item.outR, ry: 0, s: item.outS };
          lift = hover === index ? 1 : 0.15;
          magnet = hover === index;
          item.layer = 'out';
        } else {
          const order = opening ? (geometry.book ? inside - 1 - item.rank : item.rank) : item.rank;
          const delay = reduce
            ? 0
            : opening
              ? ((geometry.book ? 0.16 : 0.05) + order * (geometry.book ? 0.055 : 0.045)) / s.speed
              : (order * 0.03) / s.speed;
          const active = elapsed >= delay ? phase : state.previous;
          target = place(item.rank, inside, active, s);
          if (elapsed < delay) busy = true;
          if (staged && introTime < dropAt(item.rank)) {
            target = introPose(item, target);
            fade = 0;
            lift = geometry.book ? 3 : 0;
            item.layer = 'inside';
          } else if (item.insertUntil > time) {
            busy = true;
            target = approach(item, target, s);
            item.layer = 'drag';
            lift = 0.6;
          } else {
            item.insertUntil = 0;
            item.elevated = false;
            item.layer = 'inside';
            if (lead && active === 'open') {
              if (hover === index) {
                target = { ...target, y: target.y - 6 * geometry.scale, r: target.r * 0.2, ry: 0, s: target.s * 1.05 };
                lift = 1;
                magnet = true;
              } else {
                const distance = target.x - lead.x;
                target = {
                  ...target,
                  x:
                    target.x +
                    Math.sign(distance) * 12 * geometry.scale * Math.max(0, 1 - Math.abs(distance) / (geometry.w * 1.1))
                };
                lift = 0.2;
              }
            } else if (active === 'open') {
              lift = 0.2;
            }
          }
        }
        busy = integrate(item.x, target.x, omega, damping, dt) || busy;
        busy = integrate(item.y, target.y, omega, damping, dt) || busy;
        if (!geometry.book && item.layer === 'inside') {
          const tilt = (item.r.value * Math.PI) / 180;
          const reach =
            ((geometry.docW * Math.abs(Math.sin(tilt)) + geometry.docH * Math.abs(Math.cos(tilt))) * item.s.value) / 2;
          const floor = geometry.tabH + geometry.h - 2 * geometry.scale - reach;
          if (item.y.value > floor) {
            item.y.value = floor;
            if (item.y.velocity > 0) item.y.velocity *= -0.25;
          }
        }
        busy = integrate(item.z, target.z, itemOmega, zeta, dt) || busy;
        busy = integrate(item.r, target.r, omega, damping, dt) || busy;
        busy = integrate(item.ry, target.ry, itemOmega, zeta, dt) || busy;
        busy = integrate(item.s, target.s, itemOmega, zeta, dt) || busy;
        busy = integrate(item.hover, lift, itemOmega, zeta, dt) || busy;
        busy = integrate(item.alpha, fade, TAU * 3 * s.speed, 1, dt) || busy;
        busy = integrate(item.mx, magnet ? item.localX * 7 * geometry.scale : 0, soft, 0.85, dt) || busy;
        busy = integrate(item.my, magnet ? item.localY * 7 * geometry.scale : 0, soft, 0.85, dt) || busy;
      });

      write();
      if (busy || drag) state.raf = requestAnimationFrame(frame);
      else state.last = 0;
    };

    const refreshContent = (renderer: Renderer, s: Settings) => {
      if (
        state.content.key === s.content &&
        state.content.entries === s.entries &&
        state.content.renderer === renderer
      ) {
        return;
      }
      state.content = { key: s.content, entries: s.entries, renderer };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const keys = new Set(['back']);
      renderer.upload('back', paintBack(s.g, s.insideTop, s.insideBottom, dpr));
      itemRefs.current.slice(0, s.count).forEach((node, index) => {
        if (!node) return;
        const key = `item-${index}`;
        keys.add(key);
        let result = rasterize(node, dpr, false);
        try {
          renderer.upload(key, result.canvas);
        } catch {
          result = rasterize(node, dpr, true);
          renderer.upload(key, result.canvas);
        }
        result.pending.forEach(image => image.addEventListener('load', invalidate, { once: true }));
      });
      renderer.prune(keys);
    };

    const write = () => {
      const s = settingsRef.current;
      const { w, h, tabH, frontTop, frontH, docW, docH, scale, book: isBook } = s.g;
      const pivotX = w / 2;
      const pivotY = tabH + h / 2;
      const theta = state.front.value;
      const angle = (theta * Math.PI) / 180;
      const unfold = isBook ? clamp(-theta / 180, 0, 1) : 0;
      const shift = (w / 2) * unfold * (1 - state.anchor.value);
      const zoom = (1 + state.lift.value * 0.012) * state.squash.value * (0.94 + 0.06 * state.appear);
      root.style.opacity = state.appear < 0.999 ? state.appear.toFixed(3) : '';
      const desk = chain(
        move(pivotX, pivotY),
        turnX(state.rx.value),
        turnY(state.ry.value),
        stretch(zoom, zoom),
        move(-pivotX, -pivotY)
      );
      const folder = multiply(desk, move(shift, 0));
      const flipped = isBook && theta < -90;
      const frontZ = flipped ? '3' : '40';

      if (backRef.current) {
        backRef.current.style.transform = toCss(folder);
        backRef.current.style.setProperty('--folder-gutter', unfold.toFixed(3));
        backRef.current.style.setProperty(
          '--folder-label',
          (isBook ? 1 : 1 - clamp((-theta - 18) / 26, 0, 1)).toFixed(3)
        );
      }

      const frontMatrix = isBook
        ? chain(folder, move(0, frontTop, 2 * scale * (1 - unfold)), turnY(theta))
        : chain(folder, move(0, tabH + h, 2 * scale), turnX(theta), move(0, -frontH));
      const facing = isBook
        ? Math.sin(angle) * -0.42 + Math.cos(angle) * 0.9
        : Math.sin(angle) * 0.5 + Math.cos(angle) * 0.86;
      const light = (flipped ? -facing : facing) / (isBook ? 0.9 : 0.86);
      const glint = clamp((light - 1) * 0.9, 0, 0.18);
      const dim = clamp((1 - light) * (isBook ? 0.5 : 0.22), 0, 0.5);

      const front = frontRef.current;
      if (front) {
        front.style.transform = toCss(frontMatrix);
        front.style.zIndex = frontZ;
        front.dataset.face = flipped ? 'inner' : 'outer';
        front.style.setProperty('--folder-glint', glint.toFixed(3));
        front.style.setProperty('--folder-dim', dim.toFixed(3));
      }

      const rise = isBook ? Math.max(0, Math.sin(-angle)) : 0;
      if (groundRef.current) {
        groundRef.current.style.transform = toCss(multiply(folder, move(0, isBook ? tabH : tabH + h)));
        groundRef.current.style.opacity = (0.75 + state.lift.value * 0.25).toFixed(3);
      }
      if (castRef.current) {
        castRef.current.style.transform = toCss(
          chain(folder, move(w * rise * 0.12, frontTop + h * rise * 0.04), stretch(Math.cos(angle), 1))
        );
        castRef.current.style.opacity = (flipped ? 1 - rise * 0.7 : 0).toFixed(3);
      }
      if (shadeRef.current) {
        const edge = w * Math.cos(angle) + w * rise * 0.36;
        shadeRef.current.style.transform = toCss(
          chain(folder, move(0, frontTop + h * rise * 0.03), stretch(edge / w, 1))
        );
        shadeRef.current.style.zIndex = edge > 0 ? '39' : '2';
        shadeRef.current.style.opacity = (clamp(rise * 4, 0, 1) * (1 - rise * 0.45)).toFixed(3);
      }

      const outs = state.items
        .map((item, index): [ItemState, number] => [item, index])
        .filter(([item]) => item.layer === 'out')
        .sort((a, b) => a[0].outOrder - b[0].outOrder)
        .map(([, index]) => index);
      const matrices: { index: number; matrix: Matrix; layer: number; alpha: number; inside: boolean }[] = [];
      state.items.forEach((item, index) => {
        const node = itemRefs.current[index];
        const z = 3 * scale + item.z.value + item.hover.value * 26 * scale;
        const matrix = chain(
          desk,
          move(item.x.value + item.mx.value, item.y.value + item.my.value, z),
          turnY(item.ry.value),
          turnZ(item.r.value),
          stretch(item.s.value, item.s.value),
          move(-docW / 2, -docH / 2)
        );
        let layer = 10 + s.count - item.rank;
        if (item.layer === 'inside' && state.phase === 'open' && state.hoveredItem === index) layer = 30;
        if (item.layer === 'out') layer = LAYERS.out + outs.indexOf(index);
        if (item.layer === 'drag') layer = LAYERS.drag;
        if (item.layer === 'focus') layer = LAYERS.focus;
        matrices.push({ index, matrix, layer, alpha: clamp(item.alpha.value, 0, 1), inside: item.layer === 'inside' });
        if (!node) return;
        node.style.transform = toCss(matrix);
        node.style.zIndex = String(layer);
        node.style.setProperty('--folder-lift', clamp(item.hover.value, 0, 2.4).toFixed(3));
        node.style.opacity = item.alpha.value < 0.995 ? Math.max(0, item.alpha.value).toFixed(3) : '';
      });

      const canvas = glassRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer || !s.glass) return;
      canvas.style.zIndex = frontZ;
      refreshContent(renderer, s);
      const layers: Scene['layers'] = [];
      if (!flipped) {
        layers.push({ key: 'back', matrix: folder, width: w, height: tabH + h, alpha: 1 });
        matrices
          .filter(entry => entry.inside)
          .sort((a, b) => a.layer - b.layer)
          .forEach(entry =>
            layers.push({
              key: `item-${entry.index}`,
              matrix: entry.matrix,
              width: docW,
              height: docH,
              alpha: entry.alpha
            })
          );
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.render({
        dpr,
        depth: s.depth,
        origin: [pivotX, pivotY],
        view: s.view,
        layers,
        glass: {
          matrix: frontMatrix,
          width: w,
          height: frontH,
          radii: isBook ? [0, s.g.r, s.g.r, 0] : [s.g.r, s.g.r, s.g.r, s.g.r],
          spine: isBook ? w * 2 : 0,
          bleed: flipped ? 2 : 0,
          morph: isBook ? clamp((unfold - 0.55) / 0.45, 0, 1) ** 2 : 0,
          insideTop: s.insideTone[0],
          insideBottom: s.insideTone[1],
          tabRatio: tabH / (tabH + h),
          gutter: [12 * scale, isBook ? 0.12 * unfold : 0],
          bevel: 12 * scale,
          strength: 14 * scale,
          split: 0.26,
          lens: 0.02,
          frost: s.frost * 6 * scale,
          tint: [s.tint[0] / 255, s.tint[1] / 255, s.tint[2] / 255, s.light ? 0.1 : 0.14],
          haze: 0.04 + s.frost * 0.1,
          dim: dim * 0.8,
          glint,
          shine: s.light ? 0.72 : 0.85,
          light: flipped ? [0.55, -0.83] : [-0.55, -0.83]
        }
      });
    };

    const wake = () => {
      if (!state.raf) state.raf = requestAnimationFrame(frame);
    };

    const beginIntro = () => {
      if (state.intro.phase !== 'wait') return;
      state.intro.phase = 'run';
      state.intro.start = performance.now() / 1000;
      wake();
    };

    const invalidate = () => {
      state.content.key = '';
      wake();
    };

    const updateReceiving = () => {
      const drag = state.drag;
      const item = drag ? state.items[drag.index] : null;
      state.receiving = Boolean(
        drag?.active && item && (item.place === 'out' || item.elevated) && overFolder(state.deskX, state.deskY)
      );
    };

    const startDrag = (drag: DragState) => {
      const item = state.items[drag.index];
      if (!item) return;
      drag.active = true;
      drag.grabX = item.x.value - drag.downX;
      drag.grabY = item.y.value - drag.downY;
      drag.scale = item.place === 'out' ? item.outS : item.s.value;
      drag.clip = clipBounds();
      state.suppressClick = true;
      if (state.focus === drag.index) state.focus = -1;
      item.elevated = item.place === 'out' || !inPocket(item);
      root.dataset.dragging = '';
    };

    const drop = (drag: DragState, cancelled: boolean) => {
      const s = settingsRef.current;
      const item = state.items[drag.index];
      state.receiving = false;
      delete root.dataset.dragging;
      if (!item) return;
      const time = performance.now() / 1000;
      const [vx, vy] = cancelled ? [0, 0] : velocityOf(drag.samples);
      if (overFolder(state.deskX, state.deskY)) {
        const entering = item.place === 'out' || item.elevated;
        item.place = 'inside';
        if (entering && !reduce) {
          item.insertUntil = time + 0.24 / s.speed;
          item.insertFrom = s.g.book ? (state.front.value < -90 ? null : 'side') : 'top';
          if (!item.insertFrom) item.insertUntil = 0;
          state.receiveUntil = item.insertUntil ? item.insertUntil + 0.14 / s.speed : 0;
        }
        item.elevated = false;
        syncOutside();
        s.onItemDrop?.(s.entries[drag.index], drag.index, true);
        return;
      }
      const clip = drag.clip ?? clipBounds();
      const halfW = (s.g.docW * drag.scale) / 2;
      const halfH = (s.g.docH * drag.scale) / 2;
      const x = state.deskX + drag.grabX + clamp(vx, -2400, 2400) * 0.09;
      const y = state.deskY + drag.grabY + clamp(vy, -2400, 2400) * 0.09;
      item.place = 'out';
      item.elevated = true;
      const margin = 8 * s.g.scale;
      const reachX = halfW * 1.08 + margin;
      const reachY = halfH * 1.08 + margin;
      item.outX = clamp(x, clip.left + reachX, Math.max(clip.left + reachX, clip.right - reachX));
      item.outY = clamp(y, clip.top + reachY, Math.max(clip.top + reachY, clip.bottom - reachY));
      item.outR = clamp(item.r.value * 0.5 + clamp(vx, -2400, 2400) * 0.003 + DROP_TURN[drag.index % 6] * 0.6, -12, 12);
      item.outS = drag.scale;
      state.dropCount += 1;
      item.outOrder = state.dropCount;
      syncOutside();
      s.onItemDrop?.(s.entries[drag.index], drag.index, false);
    };

    const onMove = (event: PointerEvent) => {
      const drag = state.drag;
      if (drag && event.pointerId === drag.id) {
        const [x, y] = toDesk(event.clientX, event.clientY);
        state.deskX = x;
        state.deskY = y;
        const now = performance.now();
        drag.samples.push([now, x, y]);
        while (drag.samples.length > 2 && now - drag.samples[0][0] > 100) drag.samples.shift();
        if (!drag.active) {
          const threshold = event.pointerType === 'touch' ? 8 : 4;
          if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) > threshold) startDrag(drag);
        }
        if (drag.active) updateReceiving();
        wake();
      }
      if (event.pointerType === 'touch') return;
      const box = root.getBoundingClientRect();
      state.pointerX = clamp(((event.clientX - box.left) / box.width) * 2 - 1, -1.5, 1.5);
      state.pointerY = clamp(((event.clientY - box.top) / box.height) * 2 - 1, -1.5, 1.5);
      const target = (event.target as Element | null)?.closest?.('[data-folder-item]');
      const index = target && root.contains(target) ? Number(target.getAttribute('data-folder-item')) : -1;
      state.hoveredItem = index;
      if (target && index >= 0 && !state.drag?.active) {
        const rect = target.getBoundingClientRect();
        const item = state.items[index];
        if (item) {
          item.localX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
          item.localY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
        }
      }
      if (!state.hovered) {
        state.hovered = true;
        if (settingsRef.current.openOn === 'hover') setOpenRef.current(true);
      }
      wake();
    };

    const onLeave = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || state.drag?.active) return;
      state.hovered = false;
      state.pressed = false;
      state.hoveredItem = -1;
      if (settingsRef.current.openOn === 'hover') setOpenRef.current(false);
      wake();
    };

    const onDown = (event: PointerEvent) => {
      if (event.button > 0) return;
      state.suppressClick = false;
      const target = (event.target as Element | null)?.closest?.('[data-folder-item]');
      if (target && root.contains(target) && settingsRef.current.draggable) {
        const [x, y] = toDesk(event.clientX, event.clientY);
        state.deskX = x;
        state.deskY = y;
        state.drag = {
          index: Number(target.getAttribute('data-folder-item')),
          id: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          downX: x,
          downY: y,
          grabX: 0,
          grabY: 0,
          scale: 1,
          clip: null,
          active: false,
          samples: [[performance.now(), x, y]]
        };
        try {
          target.setPointerCapture(event.pointerId);
        } catch {
          state.drag.id = event.pointerId;
        }
      } else {
        state.pressed = true;
      }
      wake();
    };

    const onUp = (event: PointerEvent) => {
      state.pressed = false;
      const drag = state.drag;
      if (drag && event.pointerId === drag.id) {
        state.drag = null;
        if (drag.active) drop(drag, event.type === 'pointercancel');
      }
      wake();
    };

    const onDocumentDown = (event: PointerEvent) => {
      if (root.contains(event.target as Node)) return;
      const s = settingsRef.current;
      if (state.focus >= 0) {
        state.focus = -1;
        wake();
      }
      if (s.open && s.closeOnOutsideClick) setOpenRef.current(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (state.focus >= 0) {
        state.focus = -1;
        wake();
        return;
      }
      const s = settingsRef.current;
      if (s.open && s.closeOnOutsideClick) setOpenRef.current(false);
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.addEventListener('pointerdown', onDocumentDown);
    document.addEventListener('keydown', onKey);
    document.fonts?.ready.then(invalidate);

    let observer: IntersectionObserver | null = null;
    if (settingsRef.current.intro && !reduce) {
      state.intro.phase = 'wait';
      root.style.opacity = '0';
      if (typeof IntersectionObserver === 'undefined') {
        beginIntro();
      } else {
        observer = new IntersectionObserver(
          entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            observer?.disconnect();
            beginIntro();
          },
          { threshold: 0.2 }
        );
        observer.observe(root);
      }
    }

    engineRef.current = {
      wake,
      invalidate,
      consumeClick: () => {
        if (!state.suppressClick) return false;
        state.suppressClick = false;
        return true;
      },
      interactive: index => settingsRef.current.open || state.items[index]?.place === 'out' || state.focus === index,
      select: index => {
        const s = settingsRef.current;
        if (s.zoomOnClick) state.focus = state.focus === index ? -1 : index;
        s.onItemClick?.(s.entries[index], index);
        wake();
      },
      blur: () => {
        if (state.focus < 0) return false;
        state.focus = -1;
        wake();
        return true;
      }
    };
    wake();

    return () => {
      cancelAnimationFrame(state.raf);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('pointerdown', onDocumentDown);
      document.removeEventListener('keydown', onKey);
      observer?.disconnect();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!glass) return undefined;
    const canvas = glassRef.current;
    if (!canvas) return undefined;
    const renderer = createGlass(canvas);
    if (!renderer) return undefined;
    rendererRef.current = renderer;
    setGpu(true);
    const onLost = (event: Event) => {
      event.preventDefault();
      rendererRef.current = null;
      setGpu(false);
    };
    canvas.addEventListener('webglcontextlost', onLost);
    engineRef.current?.invalidate();
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost);
      renderer.dispose();
      if (rendererRef.current === renderer) rendererRef.current = null;
      setGpu(false);
    };
  }, [glass]);

  useEffect(() => {
    engineRef.current?.wake();
  });

  const toggle = () => {
    if (engineRef.current?.blur()) return;
    if (openOn === 'hover') return;
    setOpen(!isOpen);
  };

  const onItemActivate = (event: ReactMouseEvent<HTMLDivElement>, index: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.consumeClick()) {
      event.stopPropagation();
      return;
    }
    if (!engine.interactive(index)) return;
    event.stopPropagation();
    engine.select(index);
  };

  const vars = {
    '--folder-rgb': rgb.join(', '),
    '--folder-base': rgbString(rgb),
    '--folder-front-top': rgbString(mixRgb(rgb, [255, 255, 255], 0.12)),
    '--folder-front-bottom': rgbString(mixRgb(rgb, [0, 0, 0], 0.06)),
    '--folder-inside-top': insideTop,
    '--folder-inside-bottom': insideBottom,
    '--folder-tab-ink': luma(backTone) > 0.6 ? 'rgba(0, 0, 0, 0.72)' : 'rgba(255, 255, 255, 0.92)',
    '--folder-paper': rgbString(paper),
    '--folder-paper-ink': rgbString(mixRgb(paper, [0, 0, 0], 0.11)),
    '--folder-paper-ink-strong': rgbString(mixRgb(paper, [0, 0, 0], 0.28)),
    '--folder-paper-text': rgbString(mixRgb(paper, [0, 0, 0], 0.72)),
    '--folder-w': `${g.w}px`,
    '--folder-h': `${g.h}px`,
    '--folder-tab-h': `${g.tabH}px`,
    '--folder-front-y': `${g.frontTop}px`,
    '--folder-front-h': `${g.frontH}px`,
    '--folder-r': `${g.r}px`,
    '--folder-front-radius': book ? `0 ${g.r}px ${g.r}px 0` : `${g.r}px`,
    '--folder-doc-w': `${g.docW}px`,
    '--folder-doc-h': `${g.docH}px`,
    '--folder-frost': `${(1.5 + clamp(frost, 0, 1) * 10) * scale}px`,
    '--folder-depth': `${settingsRef.current.depth}px`,
    '--folder-scale': scale,
    ...style
  } as CSSProperties;

  const shape = backPath(g);

  return (
    <div
      ref={rootRef}
      className={`folder-root${className ? ` ${className}` : ''}`}
      data-mode={book ? 'book' : 'flap'}
      data-variant={variant}
      data-theme={theme === 'light' ? 'light' : 'dark'}
      data-open={isOpen ? '' : undefined}
      data-gl={glass && gpu ? '' : undefined}
      data-draggable={draggable ? '' : undefined}
      style={vars}
    >
      <div
        className="folder-stage"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={label ? `${label} folder` : 'Folder'}
        onClick={toggle}
        onKeyDown={event => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
          }
        }}
      >
        <span ref={groundRef} className="folder-layer folder-ground" aria-hidden="true" />
        {book && <span ref={castRef} className="folder-layer folder-cast" aria-hidden="true" />}

        <div ref={backRef} className="folder-layer folder-back" aria-hidden="true">
          <div className="folder-back-fill" style={{ clipPath: `path('${shape}')` }}>
            {book && <span className="folder-gutter" />}
          </div>
          <svg className="folder-back-rim" width={g.w} height={total} viewBox={`0 0 ${g.w} ${total}`}>
            <path className="folder-focus" d={shape} />
          </svg>
          {label && (
            <span className="folder-tab-text" style={{ left: g.tabX, width: g.tabW }}>
              {label}
            </span>
          )}
        </div>

        {entries.map((item, index) => {
          const interactive = isOpen || outside.includes(index);
          return (
            <div
              key={isValidElement(item) && item.key != null ? item.key : index}
              ref={node => {
                itemRefs.current[index] = node;
              }}
              className="folder-layer folder-item"
              data-folder-item={index}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : -1}
              onClick={event => onItemActivate(event, index)}
              onKeyDown={event => {
                if (!interactive || (event.key !== 'Enter' && event.key !== ' ')) return;
                event.preventDefault();
                event.stopPropagation();
                engineRef.current?.select(index);
              }}
            >
              {renderItem(item)}
            </div>
          );
        })}

        {book && <span ref={shadeRef} className="folder-layer folder-shade" aria-hidden="true" />}

        <div ref={frontRef} className="folder-layer folder-front" data-face="outer" aria-hidden="true">
          <div className="folder-face folder-face-outer" />
          {book && (
            <div className="folder-face folder-face-inner">
              <span className="folder-inner-gutter" />
            </div>
          )}
        </div>

        {glass && (
          <canvas
            ref={glassRef}
            className="folder-glass"
            aria-hidden="true"
            style={{ left: view.x, top: view.y, width: view.width, height: view.height }}
          />
        )}
      </div>

      {label && (
        <span ref={measureRef} className="folder-tab-text folder-measure" aria-hidden="true">
          {label}
        </span>
      )}
    </div>
  );
};

export default Folder;
