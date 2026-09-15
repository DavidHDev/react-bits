// Inspired by https://vercel.com/labs
import { useEffect, useRef, useState } from 'react';
import { effect, frame, init, sampler, storage, surface, target, uniforms } from 'vgpu';
import type { Gpu, StorageBuffer, Texture } from 'vgpu';

type ChargeBuffer = StorageBuffer & { destroy(): void };

import './ShapeWaves.css';

const SHAPE_MODES = { mixed: 0, squares: 1, circles: 2, triangles: 3 } as const;

export type ShapeWavesShapes = keyof typeof SHAPE_MODES;
const MAX_DPR = 2;
const MAX_MASK_SIZE = 1024;
const NOISE_CELLS = 32;
const TIME_RATE = 0.1;
const SIMULATION_STEP = 1 / 60;
const WAVE_SPEED = 0.42;
const WAVE_FRICTION = 0.94;
const WAVE_DECAY = 0.972;
const SETTLED_THRESHOLD = 0.01;
const INTRO_BAND = 0.2;
const INTRO_WARP = 0.3;
const INTRO_JITTER = 0.16;
const INTRO_END = 1 + INTRO_WARP + INTRO_JITTER + INTRO_BAND;

const NOISE_WGSL = `
fn mod289v3(x: vec3f) -> vec3f { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289v4(x: vec4f) -> vec4f { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn permute(x: vec4f) -> vec4f { return mod289v4(((x * 34.0) + 10.0) * x); }
fn taylorInvSqrt(r: vec4f) -> vec4f { return 1.79284291400159 - 0.85373472095314 * r; }
fn fadeCurve(t: vec3f) -> vec3f { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

fn cnoise(P: vec3f) -> f32 {
  var Pi0 = floor(P);
  var Pi1 = Pi0 + vec3f(1.0);
  Pi0 = mod289v3(Pi0);
  Pi1 = mod289v3(Pi1);
  let Pf0 = fract(P);
  let Pf1 = Pf0 - vec3f(1.0);
  let ix = vec4f(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  let iy = vec4f(Pi0.yy, Pi1.yy);
  let iz0 = Pi0.zzzz;
  let iz1 = Pi1.zzzz;

  let ixy = permute(permute(ix) + iy);
  let ixy0 = permute(ixy + iz0);
  let ixy1 = permute(ixy + iz1);

  var gx0 = ixy0 * (1.0 / 7.0);
  var gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  let gz0 = vec4f(0.5) - abs(gx0) - abs(gy0);
  let sz0 = step(gz0, vec4f(0.0));
  gx0 -= sz0 * (step(vec4f(0.0), gx0) - 0.5);
  gy0 -= sz0 * (step(vec4f(0.0), gy0) - 0.5);

  var gx1 = ixy1 * (1.0 / 7.0);
  var gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  let gz1 = vec4f(0.5) - abs(gx1) - abs(gy1);
  let sz1 = step(gz1, vec4f(0.0));
  gx1 -= sz1 * (step(vec4f(0.0), gx1) - 0.5);
  gy1 -= sz1 * (step(vec4f(0.0), gy1) - 0.5);

  var g000 = vec3f(gx0.x, gy0.x, gz0.x);
  var g100 = vec3f(gx0.y, gy0.y, gz0.y);
  var g010 = vec3f(gx0.z, gy0.z, gz0.z);
  var g110 = vec3f(gx0.w, gy0.w, gz0.w);
  var g001 = vec3f(gx1.x, gy1.x, gz1.x);
  var g101 = vec3f(gx1.y, gy1.y, gz1.y);
  var g011 = vec3f(gx1.z, gy1.z, gz1.z);
  var g111 = vec3f(gx1.w, gy1.w, gz1.w);

  let norm0 = taylorInvSqrt(vec4f(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  let norm1 = taylorInvSqrt(vec4f(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  let n000 = dot(g000, Pf0);
  let n100 = dot(g100, vec3f(Pf1.x, Pf0.yz));
  let n010 = dot(g010, vec3f(Pf0.x, Pf1.y, Pf0.z));
  let n110 = dot(g110, vec3f(Pf1.xy, Pf0.z));
  let n001 = dot(g001, vec3f(Pf0.xy, Pf1.z));
  let n101 = dot(g101, vec3f(Pf1.x, Pf0.y, Pf1.z));
  let n011 = dot(g011, vec3f(Pf0.x, Pf1.yz));
  let n111 = dot(g111, Pf1);

  let f = fadeCurve(Pf0);
  let nz = mix(vec4f(n000, n100, n010, n110), vec4f(n001, n101, n011, n111), f.z);
  let ny = mix(nz.xy, nz.zw, f.y);
  return 2.2 * mix(ny.x, ny.y, f.x);
}

fn fbm(p: vec3f) -> f32 {
  var total = 0.0;
  var amplitude = 1.0;
  var weight = 0.0;
  var frequency = 1.0;
  for (var i = 0; i < 2; i++) {
    total += amplitude * cnoise(p * frequency);
    weight += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return total / weight;
}
`;

const SCENE_SHADER = `
struct Params {
  resolution: vec4f,
  placement: vec4f,
  grid: vec4f,
  field: vec4f,
  motion: vec4f,
  color: vec4f,
  hover: vec4f,
  background: vec4f,
}
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var maskTexture: texture_2d<f32>;
@group(0) @binding(2) var maskSampler: sampler;
@group(0) @binding(3) var<storage, read> charges: array<f32>;

const SEED = vec2f(12.9898, 78.233);
const GLOW_THRESHOLD = 0.6;
${NOISE_WGSL}

fn sdIsoscelesTriangle(point: vec2f, q: vec2f) -> f32 {
  let p = vec2f(abs(point.x), point.y);
  let a = p - q * clamp(dot(p, q) / dot(q, q), 0.0, 1.0);
  let b = p - q * vec2f(clamp(p.x / q.x, 0.0, 1.0), 1.0);
  let s = -sign(q.y);
  let d = min(vec2f(dot(a, a), s * (p.x * q.y - p.y * q.x)), vec2f(dot(b, b), s * (p.y - q.y)));
  return -sqrt(d.x) * sign(d.y);
}

fn shapeDistance(p: vec2f, shape: i32, c: f32) -> f32 {
  if (shape == 0) { return max(abs(p.x), abs(p.y)) - c; }
  if (shape == 1) { return length(p) - c; }
  return sdIsoscelesTriangle(vec2f(p.x, p.y + c), vec2f(c, 2.0 * c));
}

fn hash21(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let resolution = params.resolution.xy;
  let cellPx = params.grid.x;
  let dotSize = params.grid.y;
  let mode = i32(params.grid.z + 0.5);
  let cols = i32(params.grid.w + 0.5);
  let background = params.background.rgb;
  let toSurface = params.hover.w < 0.5;

  let pixel = uv * resolution;
  let origin = params.placement.xy;
  let rows = i32(params.placement.z + 0.5);
  let cell = floor((pixel - origin) / cellPx);
  if (cell.y < 0.0 || i32(cell.y) >= rows || cell.x < 0.0 || i32(cell.x) >= cols) {
    return vec4f(background, select(0.0, 1.0, toSurface));
  }
  let center = origin + (cell + 0.5) * cellPx;
  let local = (pixel - center) / (cellPx * 0.5);
  let cellUv = center / resolution;

  if (params.motion.z > 0.5 && textureSampleLevel(maskTexture, maskSampler, cellUv, 0.0).r > 0.5) {
    return vec4f(background, select(0.0, 1.0, toSurface));
  }

  var level = 1.0;
  let fade = params.motion.w;
  if (fade > 0.0) {
    let q = abs(uv * 2.0 - 1.0);
    let radius = pow(pow(q.x, 2.5) + pow(q.y, 2.5), 1.0 / 2.5) / pow(2.0, 1.0 / 2.5);
    level = 1.0 - smoothstep(max(0.0, 1.0 - fade * 2.2), 1.0, radius);
  }
  let noise = fbm(vec3f((center + params.motion.xy) / params.field.x + SEED, params.field.w));
  let tone = clamp((noise * 0.5 + 0.5 - params.field.y) * params.field.z + 0.5, 0.0, 1.0);
  let band = i32(min(tone, 0.999999) * 3.0);

  var charge = 0.0;
  let index = i32(cell.y) * cols + i32(cell.x);
  if (index >= 0 && index < i32(arrayLength(&charges))) { charge = charges[index]; }
  let stepped = (band + i32(clamp(charge, 0.0, 0.999) * 3.0)) % 3;

  var shape = 2 - stepped;
  var size = dotSize;
  if (mode != 0) {
    shape = mode - 1;
    size = dotSize * mix(0.45, 1.0, f32(stepped) / 2.0);
  }
  let introProgress = params.placement.w;
  var front = 0.0;
  if (introProgress < ${INTRO_END.toFixed(2)}) {
    let radial = length((center - resolution * 0.5) / (resolution * 0.5)) * 0.70710678;
    let warp = cnoise(vec3f(cellUv * vec2f(3.2, 2.4) + SEED, 4.7)) * ${INTRO_WARP.toFixed(2)};
    let jitter = hash21(cell) * ${INTRO_JITTER.toFixed(2)};
    let spread = radial + warp + jitter + ${INTRO_WARP.toFixed(2)};
    let band = ${INTRO_BAND.toFixed(2)} * (0.6 + 0.8 * hash21(cell + vec2f(17.0, 9.0)));
    let t = clamp((introProgress - spread) / band, 0.0, 1.0);
    if (t <= 0.0) {
      return vec4f(background, select(0.0, 1.0, toSurface));
    }
    let back = t - 1.0;
    size = max(size * (1.0 + 2.70158 * back * back * back + 1.70158 * back * back), 0.02);
    front = 1.0 - smoothstep(0.0, 1.0, abs(introProgress - spread) / band);
  }
  let aa = 2.0 / cellPx;
  let coverage = smoothstep(aa, -aa, shapeDistance(local, shape, size));

  let tint = mix(params.color.rgb, params.hover.rgb, max(smoothstep(0.15, 0.85, charge), front * 0.35));

  let rgb = mix(background, tint, coverage * level);
  if (toSurface) { return vec4f(rgb, 1.0); }
  let luminance = dot(tint * level, vec3f(0.2126, 0.7152, 0.0722));
  let glow = max(0.0, (luminance - GLOW_THRESHOLD) / (1.0 - GLOW_THRESHOLD)) * coverage;
  return vec4f(rgb, glow);
}
`;

const BLUR_SHADER = `
struct Blur { direction: vec4f }
@group(0) @binding(0) var<uniform> blur: Blur;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
@group(0) @binding(2) var sourceSampler: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let sigma = blur.direction.z;
  let radius = i32(ceil(3.0 * sigma));
  var sum = vec3f(0.0);
  var weight = 0.0;
  for (var i = -radius; i <= radius; i++) {
    let offset = f32(i);
    let w = exp(-(offset * offset) / (2.0 * sigma * sigma));
    let sample = textureSampleLevel(sourceTexture, sourceSampler, uv + offset * blur.direction.xy, 0.0);
    sum += select(sample.rgb, sample.rgb * sample.a, blur.direction.w > 0.5) * w;
    weight += w;
  }
  return vec4f(sum / weight, 1.0);
}
`;

const COMPOSITE_SHADER = `
struct Composite { strength: vec4f }
@group(0) @binding(0) var<uniform> composite: Composite;
@group(0) @binding(1) var sceneTexture: texture_2d<f32>;
@group(0) @binding(2) var glowTexture: texture_2d<f32>;
@group(0) @binding(3) var linearSampler: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let scene = textureSampleLevel(sceneTexture, linearSampler, uv, 0.0).rgb;
  let glow = textureSampleLevel(glowTexture, linearSampler, uv, 0.0).rgb;
  return vec4f(scene + glow * composite.strength.x, 1.0);
}
`;

const parseColor = (value: string | undefined, fallback: string): [number, number, number] => {
  const source = typeof value === 'string' ? value.trim() : '';
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(source) || /^#?([\da-f]{6})$/i.exec(fallback);
  let hex = (match as RegExpExecArray)[1];
  if (hex.length === 3) hex = hex.replace(/./g, char => char + char);
  return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255) as [number, number, number];
};

export interface ShapeWavesProps {
  text?: string;
  fontFamily?: string;
  fontWeight?: string | number;
  textSize?: number;
  shapes?: ShapeWavesShapes;
  cellSize?: number;
  dotSize?: number;
  color?: string;
  hoverColor?: string;
  backgroundColor?: string;
  speed?: number;
  scale?: number;
  contrast?: number;
  brightness?: number;
  flow?: number;
  direction?: number;
  fade?: number;
  interactive?: boolean;
  splashRadius?: number;
  splashStrength?: number;
  glow?: number;
  intro?: boolean;
  introDuration?: number;
  introKey?: string | number;
  paused?: boolean;
  onError?: (error: Error) => void;
  className?: string;
}

interface ShapeWavesSettings {
  text: string;
  fontFamily: string;
  fontWeight: string | number;
  textSize: number;
  shapes: ShapeWavesShapes;
  cellSize: number;
  dotSize: number;
  color: string;
  hoverColor: string;
  backgroundColor: string;
  speed: number;
  scale: number;
  contrast: number;
  brightness: number;
  flow: number;
  direction: number;
  fade: number;
  interactive: boolean;
  splashRadius: number;
  splashStrength: number;
  glow: number;
  intro: boolean;
  introDuration: number;
  introKey: string | number;
  paused: boolean;
}

export default function ShapeWaves({
  text = '',
  fontFamily = 'Geist, "Geist Sans", system-ui, sans-serif',
  fontWeight = 500,
  textSize = 0.6,
  shapes = 'mixed',
  cellSize = 10,
  dotSize = 0.75,
  color = '#929292',
  hoverColor = '#ffffff',
  backgroundColor = '#000000',
  speed = 1,
  scale = 1,
  contrast = 1,
  brightness = 0.4,
  flow = 0,
  direction = 0,
  fade = 0.25,
  interactive = true,
  splashRadius = 40,
  splashStrength = 0.4,
  glow = 0.35,
  intro = true,
  introDuration = 1.6,
  introKey = 0,
  paused = false,
  onError,
  className = ''
}: ShapeWavesProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const settingsRef = useRef<ShapeWavesSettings>(null as unknown as ShapeWavesSettings);
  const applySettingsRef = useRef<() => void>(() => {});
  const applyMaskRef = useRef<() => void>(() => {});
  const onErrorRef = useRef<ShapeWavesProps['onError']>(onError);

  settingsRef.current = {
    text: String(text ?? ''),
    fontFamily,
    fontWeight,
    textSize,
    shapes,
    cellSize: Math.max(2, cellSize),
    dotSize,
    color,
    hoverColor,
    backgroundColor,
    speed,
    scale: Math.max(0.05, scale),
    contrast,
    brightness,
    flow,
    direction,
    fade,
    interactive,
    splashRadius,
    splashStrength,
    glow,
    intro,
    introDuration: Math.max(0.1, introDuration),
    introKey,
    paused
  };
  onErrorRef.current = onError;

  const settingsSignature = [
    shapes,
    cellSize,
    dotSize,
    color,
    hoverColor,
    backgroundColor,
    speed,
    scale,
    contrast,
    brightness,
    flow,
    direction,
    fade,
    interactive,
    splashRadius,
    splashStrength,
    glow,
    intro,
    introDuration,
    paused
  ].join('|');
  const maskSignature = [text, fontFamily, fontWeight, textSize].join('|');
  const replayRef = useRef<() => void>(() => {});

  useEffect(() => {
    applySettingsRef.current();
  }, [settingsSignature]);

  useEffect(() => {
    applyMaskRef.current();
  }, [maskSignature]);

  useEffect(() => {
    if (introKey) replayRef.current();
  }, [introKey]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;

    let disposed = false;
    let failed = false;
    let gpu: Gpu | undefined;
    let maskTexture: Texture | undefined;
    let chargeBuffer: ChargeBuffer | undefined;
    let frameId = 0;
    let lastFrameTime = 0;
    let time = 0;
    let drift: [number, number] = [0, 0];
    let dpr = 1;
    let visible = true;
    let presented = false;
    let cols = 1;
    let rows = 1;
    let cellPx = 10;
    let gridOrigin: [number, number] = [0, 0];
    let charges = new Float32Array(1);
    let heights = new Float32Array(1);
    let previousHeights = new Float32Array(1);
    let simulationBacklog = 0;
    let introStart = 0;
    let introProgress = INTRO_END;
    let introArmed = false;
    let chargesActive = false;
    let bounds: DOMRect | null = null;
    let unsubscribeGpuError: (() => void) | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let visibilityObserver: IntersectionObserver | undefined;
    let wakeRenderer: () => void = () => {};
    const pointer = { x: 0, y: 0, at: 0, inside: false };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const maskCanvas = document.createElement('canvas');
    const maskContext = maskCanvas.getContext('2d') as CanvasRenderingContext2D;

    const handleWake = () => wakeRenderer();
    const invalidateBounds = () => {
      bounds = null;
    };
    const splash = (x: number, y: number, strength: number) => {
      const settings = settingsRef.current;
      const sigma = Math.max(0.5, ((settings.splashRadius * dpr) / cellPx) * 0.5);
      const reach = Math.ceil(sigma * 2.5);
      const centerCol = (x * dpr - gridOrigin[0]) / cellPx - 0.5;
      const centerRow = (y * dpr - gridOrigin[1]) / cellPx - 0.5;
      const minRow = Math.max(0, Math.floor(centerRow - reach));
      const maxRow = Math.min(rows - 1, Math.ceil(centerRow + reach));
      const minCol = Math.max(0, Math.floor(centerCol - reach));
      const maxCol = Math.min(cols - 1, Math.ceil(centerCol + reach));
      for (let row = minRow; row <= maxRow; row++) {
        const dy = row - centerRow;
        for (let col = minCol; col <= maxCol; col++) {
          const dx = col - centerCol;
          const bump = strength * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
          const index = row * cols + col;
          heights[index] = Math.min(1.2, heights[index] + bump);
        }
      }
      chargesActive = true;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!settingsRef.current.interactive) return;
      if (!bounds) bounds = root.getBoundingClientRect();
      const now = performance.now();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const inside = x >= 0 && y >= 0 && x <= bounds.width && y <= bounds.height;
      if (inside) {
        const elapsed = pointer.inside ? Math.max(8, now - pointer.at) : 16;
        const travelled = pointer.inside ? Math.hypot(x - pointer.x, y - pointer.y) : 0;
        const speed = (travelled / elapsed) * 1000;
        splash(x, y, Math.min(1, 0.22 + speed * 0.0006) * settingsRef.current.splashStrength);
        wakeRenderer();
      }
      pointer.x = x;
      pointer.y = y;
      pointer.at = now;
      pointer.inside = inside;
    };

    const reportFailure = (error: unknown) => {
      if (disposed || failed) return;
      failed = true;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      unsubscribeGpuError?.();
      applySettingsRef.current = () => {};
      applyMaskRef.current = () => {};
      const failedGpu = gpu;
      gpu = undefined;
      failedGpu?.dispose();
      setReady(false);
      onErrorRef.current?.(error instanceof Error ? error : new Error(String(error)));
    };

    const measureSurface = (): [number, number] => {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      return [Math.max(1, Math.round(canvas.clientWidth * dpr)), Math.max(1, Math.round(canvas.clientHeight * dpr))];
    };

    void (async () => {
      try {
        const activeGpu = await init({ powerPreference: 'low-power' });
        gpu = activeGpu;
        if (disposed) return activeGpu.dispose();
        unsubscribeGpuError = activeGpu.onError(reportFailure);

        const initialSize = measureSurface();
        const outputFormat = (
          navigator as Navigator & { gpu: { getPreferredCanvasFormat(): string } }
        ).gpu.getPreferredCanvasFormat();
        const output = surface(activeGpu, canvas, { dpr, size: initialSize, autoResize: false, format: outputFormat });

        const params = uniforms(activeGpu, {
          resolution: [initialSize[0], initialSize[1], 1 / initialSize[0], 1 / initialSize[1]],
          placement: [0, 0, 1, 0],
          grid: [10, 0.75, 0, 1],
          field: [320, 0.5, 2.8, 0],
          motion: [0, 0, 0, 0.25],
          color: [0.573, 0.573, 0.573, 1],
          hover: [1, 1, 1, 0],
          background: [0, 0, 0, 1]
        });
        const linearSampler = sampler(activeGpu, {
          minFilter: 'linear',
          magFilter: 'linear',
          addressModeU: 'clamp-to-edge',
          addressModeV: 'clamp-to-edge'
        });
        const createMaskTexture = (maskWidth: number, maskHeight: number) =>
          activeGpu.device.createTexture({
            size: [maskWidth, maskHeight],
            format: 'rgba8unorm',
            usage: ['texture_binding', 'copy_dst', 'render_attachment'],
            label: 'shape-waves-mask'
          });
        const initialMaskTexture = createMaskTexture(1, 1);
        maskTexture = initialMaskTexture;
        const initialChargeBuffer = storage(activeGpu, 4, 'read') as ChargeBuffer;
        initialChargeBuffer.write(charges);
        chargeBuffer = initialChargeBuffer;

        const scene = effect(activeGpu, SCENE_SHADER, {
          label: 'shape-waves-scene',
          set: { params, maskTexture: initialMaskTexture, maskSampler: linearSampler, charges: initialChargeBuffer }
        });
        const sceneTarget = target(activeGpu, { size: initialSize, format: 'rgba8unorm', label: 'shape-waves-scene' });
        const glowSize = (size: readonly [number, number]): [number, number] => [
          Math.max(1, Math.ceil(size[0] / 2)),
          Math.max(1, Math.ceil(size[1] / 2))
        ];
        const glowA = target(activeGpu, {
          size: glowSize(initialSize),
          format: 'rgba8unorm',
          label: 'shape-waves-glow-a'
        });
        const glowB = target(activeGpu, {
          size: glowSize(initialSize),
          format: 'rgba8unorm',
          label: 'shape-waves-glow-b'
        });
        const blurParamsX = uniforms(activeGpu, { direction: [0, 0, 4, 1] });
        const blurParamsY = uniforms(activeGpu, { direction: [0, 0, 4, 0] });
        const blurX = effect(activeGpu, BLUR_SHADER, {
          label: 'shape-waves-glow-x',
          set: { blur: blurParamsX, sourceTexture: sceneTarget, sourceSampler: linearSampler }
        });
        const blurY = effect(activeGpu, BLUR_SHADER, {
          label: 'shape-waves-glow-y',
          set: { blur: blurParamsY, sourceTexture: glowA, sourceSampler: linearSampler }
        });
        const compositeParams = uniforms(activeGpu, { strength: [2, 0, 0, 0] });
        const composite = effect(activeGpu, COMPOSITE_SHADER, {
          label: 'shape-waves-composite',
          set: { composite: compositeParams, sceneTexture: sceneTarget, glowTexture: glowB, linearSampler }
        });
        await Promise.all([
          scene.compile({ colors: [outputFormat] }),
          scene.compile(sceneTarget),
          blurX.compile(glowA),
          blurY.compile(glowB),
          composite.compile({ colors: [outputFormat] })
        ]);
        if (disposed) return;

        const glowEnabled = () => settingsRef.current.glow > 0;
        let lastIntro = false;

        const configureGrid = () => {
          const settings = settingsRef.current;
          const [width, height] = output.size;
          const nextCols = Math.max(1, Math.round(width / (settings.cellSize * dpr)));
          cellPx = width / nextCols;
          const nextRows = Math.max(1, Math.floor(height / cellPx));
          gridOrigin = [0, (height - nextRows * cellPx) / 2];
          if (nextCols === cols && nextRows === rows && charges.length === cols * rows) return;
          cols = nextCols;
          rows = nextRows;
          charges = new Float32Array(cols * rows);
          heights = new Float32Array(cols * rows);
          previousHeights = new Float32Array(cols * rows);
          chargesActive = false;
          const nextBuffer = storage(activeGpu, charges.byteLength, 'read') as ChargeBuffer;
          nextBuffer.write(charges);
          scene.set({ charges: nextBuffer });
          chargeBuffer?.destroy();
          chargeBuffer = nextBuffer;
        };

        const stepRipples = () => {
          const lastCol = cols - 1;
          const lastRow = rows - 1;
          let peak = 0;
          for (let row = 0; row < rows; row++) {
            const up = (row === 0 ? row : row - 1) * cols;
            const down = (row === lastRow ? row : row + 1) * cols;
            const base = row * cols;
            for (let col = 0; col < cols; col++) {
              const index = base + col;
              const left = base + (col === 0 ? col : col - 1);
              const right = base + (col === lastCol ? col : col + 1);
              const height = heights[index];
              const laplacian = heights[left] + heights[right] + heights[up + col] + heights[down + col] - 4 * height;
              const velocity = (height - previousHeights[index]) * WAVE_FRICTION;
              const next = (height + velocity + WAVE_SPEED * laplacian) * WAVE_DECAY;
              previousHeights[index] = next;
              const charge = Math.min(1, Math.max(0, next));
              charges[index] = charge;
              if (charge > peak) peak = charge;
            }
          }
          const swap = heights;
          heights = previousHeights;
          previousHeights = swap;
          return peak;
        };

        const updateCharges = (deltaSeconds: number) => {
          if (!chargesActive) return false;
          simulationBacklog = Math.min(simulationBacklog + deltaSeconds, SIMULATION_STEP * 4);
          let peak = 1;
          while (simulationBacklog >= SIMULATION_STEP) {
            simulationBacklog -= SIMULATION_STEP;
            peak = stepRipples();
          }
          if (peak < SETTLED_THRESHOLD) {
            heights.fill(0);
            previousHeights.fill(0);
            charges.fill(0);
            chargesActive = false;
          }
          chargeBuffer?.write(charges);
          return chargesActive;
        };

        const isAnimating = () => {
          const settings = settingsRef.current;
          return visible && !document.hidden && !settings.paused && settings.speed > 0 && !reduceMotion.matches;
        };

        const render = (now: number) => {
          frameId = 0;
          if (disposed || failed) return;
          const settings = settingsRef.current;
          const deltaSeconds = lastFrameTime ? Math.min(0.1, (now - lastFrameTime) / 1000) : 0;
          lastFrameTime = now;
          const animating = isAnimating();
          if (animating) {
            time += deltaSeconds * TIME_RATE * settings.speed;
            const angle = (settings.direction * Math.PI) / 180;
            const distance = settings.flow * cellPx * deltaSeconds;
            drift = [drift[0] + Math.cos(angle) * distance, drift[1] + Math.sin(angle) * distance];
          }
          const hovering = visible && !document.hidden && updateCharges(deltaSeconds);
          if (introArmed) {
            introArmed = false;
            introStart = now;
            introProgress = 0;
          }
          const introPlaying = introProgress < INTRO_END;
          if (introPlaying) {
            introProgress = Math.min(INTRO_END, ((now - introStart) / 1000 / settings.introDuration) * INTRO_END);
          }
          params.set({ placement: [gridOrigin[0], gridOrigin[1], rows, introProgress] });
          params.set({
            field: [
              NOISE_CELLS * cellPx * settings.scale,
              0.5 - (settings.brightness - 0.5) * 0.4,
              2.8 * settings.contrast,
              time
            ]
          });
          params.set({ motion: [drift[0], drift[1], settings.text.trim() ? 1 : 0, settings.fade] });
          try {
            frame(activeGpu, currentFrame => {
              if (!glowEnabled()) {
                currentFrame.pass(output, scene);
                return;
              }
              currentFrame.pass(sceneTarget, scene);
              currentFrame.pass(glowA, blurX);
              currentFrame.pass(glowB, blurY);
              currentFrame.pass(output, composite);
            });
          } catch (error) {
            reportFailure(error);
            return;
          }
          if (!presented) {
            presented = true;
            setReady(true);
          }
          if (animating || hovering || introPlaying) frameId = requestAnimationFrame(render);
          else lastFrameTime = 0;
        };

        wakeRenderer = () => {
          if (disposed || failed || frameId) return;
          frameId = requestAnimationFrame(render);
        };

        const drawMask = () => {
          const settings = settingsRef.current;
          const content = settings.text.trim();
          const [surfaceWidth, surfaceHeight] = output.size;
          const hasText = content.length > 0;
          const maskScale = hasText ? Math.min(1, MAX_MASK_SIZE / Math.max(surfaceWidth, surfaceHeight)) : 0;
          const maskWidth = hasText ? Math.max(1, Math.round(surfaceWidth * maskScale)) : 1;
          const maskHeight = hasText ? Math.max(1, Math.round(surfaceHeight * maskScale)) : 1;

          maskCanvas.width = maskWidth;
          maskCanvas.height = maskHeight;
          maskContext.fillStyle = '#000';
          maskContext.fillRect(0, 0, maskWidth, maskHeight);

          if (hasText) {
            let fontPx = Math.max(1, settings.textSize * maskHeight);
            maskContext.font = `${settings.fontWeight} ${fontPx}px ${settings.fontFamily}`;
            const measured = maskContext.measureText(content).width;
            const maxWidth = maskWidth * 0.9;
            if (measured > maxWidth) {
              fontPx = Math.max(1, (fontPx * maxWidth) / measured);
              maskContext.font = `${settings.fontWeight} ${fontPx}px ${settings.fontFamily}`;
            }
            maskContext.textAlign = 'center';
            maskContext.textBaseline = 'middle';
            maskContext.fillStyle = '#fff';
            maskContext.fillText(content, maskWidth / 2, maskHeight / 2);
          }

          const nextTexture = createMaskTexture(maskWidth, maskHeight);
          activeGpu.gpu.queue.copyExternalImageToTexture({ source: maskCanvas }, { texture: nextTexture.gpu }, [
            maskWidth,
            maskHeight
          ]);
          scene.set({ maskTexture: nextTexture });
          maskTexture?.destroy();
          maskTexture = nextTexture;
        };

        const applySettings = () => {
          if (disposed || failed) return;
          const settings = settingsRef.current;
          configureGrid();
          params.set({
            placement: [gridOrigin[0], gridOrigin[1], rows, introProgress],
            grid: [cellPx, Math.min(1, Math.max(0.1, settings.dotSize)), SHAPE_MODES[settings.shapes] ?? 0, cols],
            color: [...parseColor(settings.color, '#929292'), 1],
            hover: [...parseColor(settings.hoverColor, '#ffffff'), glowEnabled() ? 1 : 0],
            background: [...parseColor(settings.backgroundColor, '#000000'), 1]
          });
          compositeParams.set({ strength: [2 * settings.glow, 0, 0, 0] });
          if (settings.intro !== lastIntro) {
            lastIntro = settings.intro;
            if (settings.intro && !reduceMotion.matches) introArmed = true;
          }
          if (!settings.interactive && chargesActive) {
            heights.fill(0);
            previousHeights.fill(0);
            charges.fill(0);
            chargesActive = false;
            chargeBuffer?.write(charges);
          }
          wakeRenderer();
        };

        const applyMask = () => {
          if (disposed || failed) return;
          drawMask();
          applySettings();
          const settings = settingsRef.current;
          if (!settings.text.trim() || !document.fonts?.load) return;
          document.fonts
            .load(`${settings.fontWeight} 32px ${settings.fontFamily}`)
            .then(() => {
              if (disposed || failed) return;
              drawMask();
              wakeRenderer();
            })
            .catch(() => {});
        };

        const resize = () => {
          if (disposed || failed) return;
          invalidateBounds();
          const nextSize = measureSurface();
          if (nextSize[0] !== output.size[0] || nextSize[1] !== output.size[1]) output.resize(nextSize);
          const [width, height] = output.size;
          sceneTarget.resize([width, height]);
          const half = glowSize([width, height]);
          glowA.resize(half);
          glowB.resize(half);
          blurParamsX.set({ direction: [1 / half[0], 0, 4, 1] });
          blurParamsY.set({ direction: [0, 1 / half[1], 4, 0] });
          params.set({ resolution: [width, height, 1 / width, 1 / height] });
          drawMask();
          applySettings();
        };

        applySettingsRef.current = applySettings;
        applyMaskRef.current = applyMask;
        replayRef.current = () => {
          if (disposed || failed || !settingsRef.current.intro || reduceMotion.matches) return;
          introArmed = true;
          wakeRenderer();
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
        visibilityObserver = new IntersectionObserver(
          entries => {
            visible = entries.some(entry => entry.isIntersecting);
            if (visible) wakeRenderer();
          },
          { threshold: 0 }
        );
        visibilityObserver.observe(root);
        document.addEventListener('visibilitychange', handleWake);
        reduceMotion.addEventListener('change', handleWake);
        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('scroll', invalidateBounds, { capture: true, passive: true });

        resize();
        applyMask();
      } catch (error) {
        reportFailure(error);
      }
    })();

    return () => {
      disposed = true;
      wakeRenderer = () => {};
      applySettingsRef.current = () => {};
      applyMaskRef.current = () => {};
      replayRef.current = () => {};
      document.removeEventListener('visibilitychange', handleWake);
      reduceMotion.removeEventListener('change', handleWake);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', invalidateBounds, { capture: true } as EventListenerOptions);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      unsubscribeGpuError?.();
      if (frameId) cancelAnimationFrame(frameId);
      maskTexture?.destroy();
      chargeBuffer?.destroy();
      gpu?.dispose();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`shape-waves ${className}`}
      data-ready={ready}
      style={{ backgroundColor }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="shape-waves__canvas" />
    </div>
  );
}
