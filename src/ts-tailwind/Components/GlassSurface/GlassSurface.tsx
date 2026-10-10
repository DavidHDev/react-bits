'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef, useId, type CSSProperties, type ReactNode, type RefObject } from 'react';

export type GlassSurfaceChannel = 'R' | 'G' | 'B';

export type GlassSurfaceRenderer = 'auto' | 'svg' | 'webgl';

export type GlassSurfaceBackdrop = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

interface GlassSettings {
  backdrop?: RefObject<GlassSurfaceBackdrop | null> | GlassSurfaceBackdrop | null;
  displace: number;
  saturation: number;
  distortionScale: number;
  redOffset: number;
  greenOffset: number;
  blueOffset: number;
  xChannel: GlassSurfaceChannel;
  yChannel: GlassSurfaceChannel;
}

interface ShapeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ShapeTrace {
  box: ShapeBox;
  depth: Float32Array;
  w: number;
  h: number;
  ratio: number;
  line: string;
  glow: string;
}

interface CachedTrace extends ShapeTrace {
  image: HTMLImageElement;
  width: number;
  height: number;
}

type ShapeArt =
  | { src: string; box: ShapeBox; line: string; glow: string; failed?: false }
  | { src: string; failed: true };

export interface GlassSurfaceProps {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: GlassSurfaceChannel;
  yChannel?: GlassSurfaceChannel;
  mixBlendMode?: CSSProperties['mixBlendMode'];
  refraction?: boolean;
  renderer?: GlassSurfaceRenderer;
  backdrop?: RefObject<GlassSurfaceBackdrop | null> | GlassSurfaceBackdrop | null;
  shape?: string;
  className?: string;
  style?: CSSProperties;
}

const FAR = 1e20;

const GLASS_VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const GLASS_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uBackdrop;
uniform sampler2D uMap;
uniform vec2 uCanvas;
uniform vec2 uSize;
uniform vec2 uOrigin;
uniform vec2 uStep;
uniform vec3 uScale;
uniform ivec2 uChannel;
uniform float uSpread;
uniform float uLod;
uniform float uSaturation;
out vec4 outColor;

vec4 bend(vec2 p) {
  vec4 map = texture(uMap, clamp(p / uSize, 0.0, 1.0));
  vec2 shift = vec2(map[uChannel.x], map[uChannel.y]) - 0.5;
  vec2 base = uOrigin + p * uStep;
  vec4 red = textureLod(uBackdrop, base + shift * uScale.r * uStep, uLod);
  vec4 green = textureLod(uBackdrop, base + shift * uScale.g * uStep, uLod);
  vec4 blue = textureLod(uBackdrop, base + shift * uScale.b * uStep, uLod);
  return vec4(red.r, green.g, blue.b, (red.a + green.a + blue.a) / 3.0);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uCanvas * uSize;
  vec4 color = vec4(0.0);
  if (uSpread < 0.05) {
    color = bend(p);
  } else {
    float total = 0.0;
    for (int j = -2; j <= 2; j++) {
      for (int i = -2; i <= 2; i++) {
        vec2 offset = vec2(float(i), float(j)) * uSpread * 0.8;
        float weight = exp(-dot(offset, offset) / (2.0 * uSpread * uSpread));
        color += bend(p + offset) * weight;
        total += weight;
      }
    }
    color /= total;
  }
  vec3 rgb = color.a > 0.0 ? color.rgb / color.a : vec3(0.0);
  float s = uSaturation;
  mat3 tone = mat3(
    0.213 + 0.787 * s, 0.213 - 0.213 * s, 0.213 - 0.213 * s,
    0.715 - 0.715 * s, 0.715 + 0.285 * s, 0.715 - 0.715 * s,
    0.072 - 0.072 * s, 0.072 - 0.072 * s, 0.072 + 0.928 * s
  );
  rgb = clamp(tone * rgb, 0.0, 1.0);
  outColor = vec4(rgb * color.a, color.a);
}`;

const CHANNELS: Record<string, number> = { R: 0, G: 1, B: 2, A: 3 };

const compileGlass = (gl: WebGL2RenderingContext) => {
  const make = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  };
  const vertex = make(gl.VERTEX_SHADER, GLASS_VERTEX);
  const fragment = make(gl.FRAGMENT_SHADER, GLASS_FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
};

const resolveBackdrop = (backdrop: GlassSurfaceProps['backdrop']): GlassSurfaceBackdrop | null => {
  if (typeof window === 'undefined' || !backdrop) return null;
  const node = typeof backdrop === 'object' && 'current' in backdrop ? backdrop.current : backdrop;
  if (node instanceof HTMLImageElement || node instanceof HTMLVideoElement || node instanceof HTMLCanvasElement) {
    return node;
  }
  return null;
};

const sourceSize = (node: GlassSurfaceBackdrop): [number, number] => {
  if (node instanceof HTMLImageElement) return [node.naturalWidth, node.naturalHeight];
  if (node instanceof HTMLVideoElement) return [node.videoWidth, node.videoHeight];
  return [node.width, node.height];
};

const placeAxis = (value: string | undefined, free: number) => {
  if (!value) return free / 2;
  if (value.endsWith('%')) return (parseFloat(value) / 100) * free;
  const px = parseFloat(value);
  return Number.isFinite(px) ? px : free / 2;
};

const contentBox = (node: GlassSurfaceBackdrop) => {
  const rect = node.getBoundingClientRect();
  const [naturalWidth, naturalHeight] = sourceSize(node);
  const style = getComputedStyle(node);
  const fit = style.objectFit || 'fill';
  if (!naturalWidth || !naturalHeight || fit === 'fill') {
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  }
  const contain = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
  const cover = Math.max(rect.width / naturalWidth, rect.height / naturalHeight);
  const scale = fit === 'cover' ? cover : fit === 'contain' ? contain : fit === 'none' ? 1 : Math.min(1, contain);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const [px, py] = (style.objectPosition || '50% 50%').split(' ');
  return {
    x: rect.left + placeAxis(px, rect.width - width),
    y: rect.top + placeAxis(py ?? px, rect.height - height),
    width,
    height
  };
};

const distanceLine = (f: Float64Array, d: Float64Array, v: Int32Array, z: Float64Array, n: number) => {
  let k = 0;
  v[0] = 0;
  z[0] = -FAR;
  z[1] = FAR;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = FAR;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
};

const distanceGrid = (grid: Float32Array, w: number, h: number) => {
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    distanceLine(f, d, v, z, h);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    distanceLine(f, d, v, z, w);
    for (let x = 0; x < w; x++) grid[y * w + x] = d[x];
  }
};

const blurLine = (src: Float32Array, dst: Float32Array, offset: number, stride: number, n: number, r: number) => {
  const scale = 1 / (2 * r + 1);
  let sum = src[offset] * (r + 1);
  for (let i = 1; i <= r; i++) sum += src[offset + Math.min(i, n - 1) * stride];
  for (let i = 0; i < n; i++) {
    dst[offset + i * stride] = sum * scale;
    sum += src[offset + Math.min(i + r + 1, n - 1) * stride] - src[offset + Math.max(i - r, 0) * stride];
  }
};

const blurGrid = (grid: Float32Array, w: number, h: number, r: number) => {
  const tmp = new Float32Array(w * h);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) blurLine(grid, tmp, y * w, 1, w, r);
    for (let x = 0; x < w; x++) blurLine(tmp, grid, x, w, h, r);
  }
};

const settle = (x: number) => 1 / (1 + Math.exp(-1.702 * x));

const paint = (w: number, h: number, fill: (data: Uint8ClampedArray) => void) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  const image = context.createImageData(w, h);
  fill(image.data);
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
};

const shade = (depth: Float32Array, w: number, h: number, falloff: (t: number) => number) =>
  paint(w, h, data => {
    data.fill(255);
    for (let i = 0; i < w * h; i++) data[i * 4 + 3] = 255 * (1 - falloff(depth[i]));
  });

const traceShape = (image: HTMLImageElement, width: number, height: number, ratio: number): ShapeTrace => {
  const naturalWidth = image.naturalWidth || width;
  const naturalHeight = image.naturalHeight || height;
  const fit = Math.min(width / naturalWidth, height / naturalHeight);
  const box = {
    x: (width - naturalWidth * fit) / 2,
    y: (height - naturalHeight * fit) / 2,
    width: naturalWidth * fit,
    height: naturalHeight * fit
  };
  const w = Math.max(2, Math.round(width * ratio));
  const h = Math.max(2, Math.round(height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  context.drawImage(image, box.x * ratio, box.y * ratio, box.width * ratio, box.height * ratio);
  const pixels = context.getImageData(0, 0, w, h).data;
  const outside = new Float32Array(w * h);
  const inside = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const edge = 0.5 - pixels[i * 4 + 3] / 255;
    outside[i] = edge >= 0.5 ? FAR : Math.max(edge, 0) ** 2;
    inside[i] = edge <= -0.5 ? FAR : Math.min(edge, 0) ** 2;
  }
  distanceGrid(outside, w, h);
  distanceGrid(inside, w, h);
  const depth = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) depth[i] = (Math.sqrt(inside[i]) - Math.sqrt(outside[i])) / ratio;
  return {
    box,
    depth,
    w,
    h,
    ratio,
    line: shade(depth, w, h, t => settle(t - 1)),
    glow: shade(depth, w, h, t => settle((t - 4) / 5))
  };
};

const bendShape = (trace: ShapeTrace, edge: number, softness: number, calm: number, level: number) => {
  const { depth, w, h, ratio } = trace;
  const reach = edge + softness * 2;
  const field = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) field[i] = Math.min(Math.max(depth[i], -6), reach);
  blurGrid(field, w, h, Math.max(1, Math.round(Math.max(1.5, softness * 0.35) * ratio)));
  return paint(w, h, data => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const dx = field[i + (x < w - 1 ? 1 : 0)] - field[i - (x > 0 ? 1 : 0)];
        const dy = field[i + (y < h - 1 ? w : 0)] - field[i - (y > 0 ? w : 0)];
        const still = calm * settle((depth[i] - edge) / softness);
        const bend = (1 - still) * ratio * 0.25;
        const shift = still * (level - 0.5);
        data[i * 4] = 255 * (0.5 + dx * bend + shift);
        data[i * 4 + 1] = 255 * (0.5 + dy * bend + shift);
        data[i * 4 + 2] = 255 * (0.5 + shift);
        data[i * 4 + 3] = 255;
      }
    }
  });
};

const WEBGL_SHADOW = [
  '0px 4px 16px rgba(17, 17, 26, 0.05)',
  '0px 8px 24px rgba(17, 17, 26, 0.05)',
  '0px 16px 56px rgba(17, 17, 26, 0.05)'
].join(', ');

const FRAME_SHADOW = [
  '0 0 2px 1px light-dark(color-mix(in oklch, black, transparent 85%), color-mix(in oklch, white, transparent 65%)) inset',
  '0 0 10px 4px light-dark(color-mix(in oklch, black, transparent 90%), color-mix(in oklch, white, transparent 85%)) inset',
  '0px 4px 16px rgba(17, 17, 26, 0.05) inset',
  '0px 8px 24px rgba(17, 17, 26, 0.05) inset',
  '0px 16px 56px rgba(17, 17, 26, 0.05) inset'
].join(', ');

const LINE = {
  svg: 'light-dark(color-mix(in oklch, black, transparent 85%), color-mix(in oklch, white, transparent 65%))',
  fallback: 'light-dark(color-mix(in oklch, black, transparent 88%), color-mix(in oklch, white, transparent 72%))'
};

const GLOW = {
  svg: 'light-dark(color-mix(in oklch, black, transparent 90%), color-mix(in oklch, white, transparent 85%))',
  fallback: 'light-dark(color-mix(in oklch, white, transparent 72%), color-mix(in oklch, white, transparent 90%))'
};

const SVG_SHADOW = [
  '0 0 2px 1px light-dark(color-mix(in oklch, black, transparent 85%), color-mix(in oklch, white, transparent 65%)) inset',
  '0 0 10px 4px light-dark(color-mix(in oklch, black, transparent 90%), color-mix(in oklch, white, transparent 85%)) inset',
  '0px 4px 16px rgba(17, 17, 26, 0.05)',
  '0px 8px 24px rgba(17, 17, 26, 0.05)',
  '0px 16px 56px rgba(17, 17, 26, 0.05)',
  '0px 4px 16px rgba(17, 17, 26, 0.05) inset',
  '0px 8px 24px rgba(17, 17, 26, 0.05) inset',
  '0px 16px 56px rgba(17, 17, 26, 0.05) inset'
].join(', ');

const FALLBACK_SHADOW = [
  'inset 0 1px 0 0 light-dark(hsl(0 0% 100% / 0.85), hsl(0 0% 100% / 0.3))',
  'inset 0 -1px 0 0 light-dark(hsl(0 0% 100% / 0.35), hsl(0 0% 100% / 0.08))',
  '0 0 2px 1px light-dark(color-mix(in oklch, black, transparent 88%), color-mix(in oklch, white, transparent 72%)) inset',
  '0 0 12px 3px light-dark(color-mix(in oklch, white, transparent 72%), color-mix(in oklch, white, transparent 90%)) inset',
  '0px 4px 16px rgba(17, 17, 26, 0.06)',
  '0px 8px 24px rgba(17, 17, 26, 0.06)',
  '0px 16px 56px rgba(17, 17, 26, 0.06)'
].join(', ');

const SHEEN =
  'linear-gradient(135deg, light-dark(hsl(0 0% 100% / 0.42), hsl(0 0% 100% / 0.14)) 0%, transparent 42%, transparent 64%, light-dark(hsl(0 0% 100% / 0.18), hsl(0 0% 100% / 0.05)) 100%)';

const RIM =
  'linear-gradient(150deg, light-dark(hsl(0 0% 100% / 0.7), hsl(0 0% 100% / 0.34)), light-dark(hsl(0 0% 100% / 0.1), hsl(0 0% 100% / 0.03)) 45%, light-dark(hsl(0 0% 100% / 0.08), hsl(0 0% 100% / 0.02)) 60%, light-dark(hsl(0 0% 100% / 0.42), hsl(0 0% 100% / 0.18)))';

const RING = 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)';

const GlassSurface = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  refraction = true,
  renderer = 'auto',
  backdrop,
  shape,
  className = '',
  style = {}
}: GlassSurfaceProps) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;
  const softId = `soft-${uniqueId}`;

  const [svgSupported, setSvgSupported] = useState<boolean>(false);
  const [blurSupported, setBlurSupported] = useState<boolean>(true);
  const [checked, setChecked] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [boxSize, setBoxSize] = useState<string>('');
  const [loaded, setLoaded] = useState<{ src: string; image: HTMLImageElement | null }>({ src: '', image: null });
  const [art, setArt] = useState<ShapeArt | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);
  const traceRef = useRef<CachedTrace | null>(null);
  const shapeMapRef = useRef<string>('');
  const mapUrlRef = useRef('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef<GlassSettings | null>(null);
  settingsRef.current = {
    backdrop,
    displace,
    saturation,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel
  };

  const generateDisplacementMap = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width || 400;
    const actualHeight = rect?.height || 200;
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

    const svgContent = `
      <svg width="${actualWidth}" height="${actualHeight}" viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
          <filter id="${softId}" filterUnits="userSpaceOnUse" x="0" y="0" width="${actualWidth}" height="${actualHeight}" color-interpolation-filters="sRGB">
            <feGaussianBlur stdDeviation="${blur}" />
          </filter>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" filter="url(#${softId})" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  const updateDisplacementMap = () => {
    mapUrlRef.current = shapeMapRef.current || generateDisplacementMap();
    feImageRef.current?.setAttribute('href', mapUrlRef.current);
  };

  useEffect(() => {
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });

    gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString());
  }, [
    boxSize,
    width,
    height,
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const element = containerRef.current;
      if (element) setBoxSize(`${element.offsetWidth}x${element.offsetHeight}`);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!shape) return undefined;
    let alive = true;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => alive && setLoaded({ src: shape, image });
    image.onerror = () => alive && setLoaded({ src: shape, image: null });
    image.src = shape;
    return () => {
      alive = false;
    };
  }, [shape]);

  const shapeImage = shape && loaded.src === shape ? loaded.image : null;

  useEffect(() => {
    const element = containerRef.current;
    const w = element?.offsetWidth || 0;
    const h = element?.offsetHeight || 0;
    let map = '';
    let trace: CachedTrace | null = null;
    if (shapeImage && w && h) {
      const ratio = Math.min(2, window.devicePixelRatio || 1, Math.sqrt(400000 / (w * h)));
      trace = traceRef.current;
      try {
        if (!trace || trace.image !== shapeImage || trace.width !== w || trace.height !== h || trace.ratio !== ratio) {
          trace = { image: shapeImage, width: w, height: h, ...traceShape(shapeImage, w, h, ratio) };
          traceRef.current = trace;
        }
        map = bendShape(trace, Math.min(w, h) * borderWidth * 0.5, Math.max(blur, 0.5), opacity, brightness / 100);
      } catch {
        trace = null;
        traceRef.current = null;
      }
    }
    shapeMapRef.current = map;
    updateDisplacementMap();
    if (shape && trace) setArt({ src: shape, box: trace.box, line: trace.line, glow: trace.glow });
    else if (shape && loaded.src === shape) setArt({ src: shape, failed: true });
  }, [shape, loaded, boxSize, borderWidth, blur, opacity, brightness]);

  useEffect(() => {
    setSvgSupported(supportsSVGFilters());
    setBlurSupported(
      CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
    );
    setChecked(true);
  }, []);

  const webgl =
    checked &&
    refraction &&
    Boolean(backdrop) &&
    !webglFailed &&
    (renderer === 'webgl' || (renderer === 'auto' && !svgSupported));
  const refractive = !webgl && svgSupported && refraction;
  const frosted = !webgl && !refractive;

  useEffect(() => {
    if (!webgl) return undefined;
    const canvas = canvasRef.current;
    const element = containerRef.current;
    const gl = canvas?.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });
    const program = gl ? compileGlass(gl) : null;
    if (!canvas || !element || !gl || !program) {
      setWebglFailed(true);
      return undefined;
    }

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    [
      'uBackdrop',
      'uMap',
      'uCanvas',
      'uSize',
      'uOrigin',
      'uStep',
      'uScale',
      'uChannel',
      'uSpread',
      'uLod',
      'uSaturation'
    ].forEach(name => {
      uniforms[name] = gl.getUniformLocation(program, name);
    });
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    const makeTexture = () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return texture;
    };
    const backdropTexture = makeTexture();
    const mapTexture = makeTexture();
    const mapCanvas = document.createElement('canvas');
    const mapContext = mapCanvas.getContext('2d');
    const picture = {
      node: null as GlassSurfaceBackdrop | null,
      key: '',
      width: 0,
      height: 0,
      mipmapped: false,
      ready: false
    };
    const map = { url: '', ready: false };
    let frame = 0;
    let visible = true;
    let drawn = '';

    const loadMap = (url: string) => {
      map.url = url;
      const image = new Image();
      image.onload = () => {
        if (map.url !== url || !mapContext) return;
        const ratio = Math.min(2, window.devicePixelRatio || 1);
        mapCanvas.width = Math.max(1, Math.round(element.offsetWidth * ratio));
        mapCanvas.height = Math.max(1, Math.round(element.offsetHeight * ratio));
        mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        mapContext.drawImage(image, 0, 0, mapCanvas.width, mapCanvas.height);
        gl.bindTexture(gl.TEXTURE_2D, mapTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mapCanvas);
        map.ready = true;
        drawn = '';
      };
      image.src = url;
    };

    const upload = (node: GlassSurfaceBackdrop) => {
      const still = node instanceof HTMLImageElement;
      gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, node);
      if (still) gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, still ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      [picture.width, picture.height] = sourceSize(node);
      picture.mipmapped = still;
      picture.ready = true;
    };

    const tick = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      frame = requestAnimationFrame(tick);
      const s = settingsRef.current;
      if (!s) return;
      if (mapUrlRef.current && mapUrlRef.current !== map.url) loadMap(mapUrlRef.current);
      const node = resolveBackdrop(s.backdrop);
      if (!node) return;
      let key = '';
      if (node instanceof HTMLImageElement) key = node.complete && node.naturalWidth ? node.currentSrc || node.src : '';
      else if (node instanceof HTMLVideoElement)
        key = node.readyState >= 2 ? `${node.currentSrc}|${node.currentTime}` : '';
      else key = `${node.width}x${node.height}|${performance.now()}`;
      if (key && (node !== picture.node || key !== picture.key)) {
        try {
          upload(node);
        } catch {
          setWebglFailed(true);
          return;
        }
        picture.node = node;
        picture.key = key;
        drawn = '';
      }
      if (!picture.ready || !map.ready) return;

      const layoutWidth = element.offsetWidth;
      const layoutHeight = element.offsetHeight;
      if (!layoutWidth || !layoutHeight) return;
      const box = element.getBoundingClientRect();
      const content = contentBox(node);
      if (!content.width || !content.height) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(layoutWidth * ratio));
      const height = Math.max(1, Math.round(layoutHeight * ratio));
      const signature = [
        box.left,
        box.top,
        box.width,
        box.height,
        content.x,
        content.y,
        content.width,
        content.height,
        width,
        height,
        picture.key,
        map.url,
        s.displace,
        s.saturation,
        s.distortionScale,
        s.redOffset,
        s.greenOffset,
        s.blueOffset,
        s.xChannel,
        s.yChannel
      ].join('|');
      if (signature === drawn) return;
      drawn = signature;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const scaleX = box.width / layoutWidth;
      const scaleY = box.height / layoutHeight;
      const texelsPerPixel = (picture.width / content.width) * (scaleX / ratio);
      const spreadTexels = (picture.width / content.width) * scaleX * Math.max(0, s.displace);
      const lod = picture.mipmapped
        ? Math.max(0, Math.log2(Math.max(texelsPerPixel, spreadTexels * 0.5, 0.000001)))
        : 0;
      gl.viewport(0, 0, width, height);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
      gl.uniform1i(uniforms.uBackdrop, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mapTexture);
      gl.uniform1i(uniforms.uMap, 1);
      gl.uniform2f(uniforms.uCanvas, width, height);
      gl.uniform2f(uniforms.uSize, layoutWidth, layoutHeight);
      gl.uniform2f(uniforms.uOrigin, (box.left - content.x) / content.width, (box.top - content.y) / content.height);
      gl.uniform2f(uniforms.uStep, scaleX / content.width, scaleY / content.height);
      gl.uniform3f(
        uniforms.uScale,
        s.distortionScale + s.redOffset,
        s.distortionScale + s.greenOffset,
        s.distortionScale + s.blueOffset
      );
      gl.uniform2i(uniforms.uChannel, CHANNELS[s.xChannel] ?? 0, CHANNELS[s.yChannel] ?? 1);
      gl.uniform1f(uniforms.uSpread, Math.max(0, s.displace));
      gl.uniform1f(uniforms.uLod, lod);
      gl.uniform1f(uniforms.uSaturation, s.saturation);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const wake = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      setWebglFailed(true);
    };
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      wake();
    });
    intersection.observe(element);
    document.addEventListener('visibilitychange', wake);
    canvas.addEventListener('webglcontextlost', onLost);
    wake();

    return () => {
      cancelAnimationFrame(frame);
      intersection.disconnect();
      document.removeEventListener('visibilitychange', wake);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteTexture(backdropTexture);
      gl.deleteTexture(mapTexture);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
  }, [webgl]);

  const supportsSVGFilters = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    if (isWebkit || isFirefox) {
      return false;
    }

    const div = document.createElement('div');
    div.style.backdropFilter = `url(#${filterId})`;

    return div.style.backdropFilter !== '';
  };

  const outline = shape && art?.src === shape && !art.failed ? art : null;
  const maskUrl = outline ? `url("${outline.src.replace(/"/g, '%22').replace(/[\n\r]+/g, ' ')}")` : '';
  const maskPlace = outline
    ? `${outline.box.x}px ${outline.box.y}px / ${outline.box.width}px ${outline.box.height}px no-repeat`
    : '';
  const shapeStyle: CSSProperties = outline
    ? { borderRadius: 0, boxShadow: 'none', WebkitMask: `${maskUrl} ${maskPlace}`, mask: `${maskUrl} ${maskPlace}` }
    : shape && art?.src !== shape
      ? { opacity: 0, transition: 'none' }
      : {};

  const frost = blurSupported
    ? `light-dark(hsl(0 0% 100% / ${0.12 + backgroundOpacity * 0.5}), hsl(0 0% 100% / ${0.04 + backgroundOpacity * 0.3}))`
    : 'light-dark(hsl(0 0% 100% / 0.72), hsl(0 0% 12% / 0.72))';
  const fallbackFilter = `blur(12px) saturate(${saturation * 1.4}) brightness(1.04)`;

  const modeStyle: CSSProperties = webgl
    ? { boxShadow: WEBGL_SHADOW }
    : refractive
      ? {
          background: `light-dark(hsl(0 0% 100% / ${backgroundOpacity}), hsl(0 0% 0% / ${backgroundOpacity}))`,
          backdropFilter: `url(#${filterId}) saturate(${saturation})`,
          boxShadow: SVG_SHADOW
        }
      : {
          background: frost,
          WebkitBackdropFilter: fallbackFilter,
          backdropFilter: fallbackFilter,
          boxShadow: FALLBACK_SHADOW
        };

  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    ...modeStyle,
    ...shapeStyle
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden transition-opacity duration-[260ms] ease-out focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:[outline-color:light-dark(#007aff,#0a84ff)] ${className}`}
      style={containerStyle}
    >
      <svg
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />

            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" id="redchannel" result="dispRed" />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="red"
            />

            <feDisplacementMap
              ref={greenChannelRef}
              in="SourceGraphic"
              in2="map"
              id="greenchannel"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="green"
            />

            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="blue"
            />

            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      {webgl && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full rounded-[inherit]"
        />
      )}
      {webgl && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: `light-dark(hsl(0 0% 100% / ${backgroundOpacity}), hsl(0 0% 0% / ${backgroundOpacity}))`,
            boxShadow: outline ? 'none' : FRAME_SHADOW
          }}
        />
      )}
      {frosted && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: SHEEN }}
        />
      )}
      {frosted && !outline && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] p-[3px]"
          style={{
            background: RIM,
            WebkitMask: RING,
            WebkitMaskComposite: 'xor',
            mask: RING,
            maskComposite: 'exclude'
          }}
        />
      )}
      {outline && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: frosted ? GLOW.fallback : GLOW.svg,
            WebkitMaskImage: `url(${outline.glow})`,
            maskImage: `url(${outline.glow})`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%'
          }}
        />
      )}
      {outline && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: frosted ? LINE.fallback : LINE.svg,
            WebkitMaskImage: `url(${outline.line})`,
            maskImage: `url(${outline.line})`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%'
          }}
        />
      )}

      <div className="relative z-[1] flex h-full w-full items-center justify-center rounded-[inherit] p-2">
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
