'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture, type OGLRenderingContext } from 'ogl';

export type WarpTextLens = 'bulge' | 'pinch' | 'swirl';

export interface Props {
  text?: string;
  color?: string;
  warpStrength?: number;
  warpScale?: number;
  speed?: number;
  pointerInfluence?: number;
  pointerStrength?: number;
  refraction?: number;
  chromatic?: number;
  ripple?: boolean;
  clickRipple?: boolean;
  idleDrift?: number;
  lens?: WarpTextLens;
  intro?: boolean;
  fontSize?: string | number;
  fontWeight?: string | number;
  fontFamily?: string;
  letterSpacing?: string | number;
  lineHeight?: string | number;
  className?: string;
  style?: CSSProperties;
}

interface RuntimeProps {
  text: string;
  color: string;
  fontSize: string | number;
  fontWeight: string | number;
  fontFamily: string;
  letterSpacing: string | number;
  lineHeight: string | number;
  warpStrength: number;
  warpScale: number;
  speed: number;
  pointerInfluence: number;
  pointerStrength: number;
  refraction: number;
  chromatic: number;
  ripple: boolean;
  clickRipple: boolean;
  idleDrift: number;
  lens: WarpTextLens;
  intro: boolean;
}

interface RuntimeContext {
  program: Program;
  rasterize: () => void;
}

interface BuildTextCanvasArgs {
  container: HTMLElement;
  width: number;
  height: number;
  dpr: number;
  props: RuntimeProps;
}

interface TextRaster {
  canvas: HTMLCanvasElement;
  ink: string;
}

const LENS_MODES: Record<WarpTextLens, number> = { bulge: 0, pinch: 1, swirl: 2 };
const INTRO_MS = 1600;
const RIPPLE_LIFE = 1.6;
const MAX_CLICKS = 4;

const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform sampler2D uTextTexture;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform float uTime;
uniform float uWarpStrength;
uniform float uWarpScale;
uniform float uSpeed;
uniform float uPointerInfluence;
uniform float uPointerStrength;
uniform float uRefraction;
uniform float uChromatic;
uniform float uRipple;
uniform float uMotion;
uniform float uLens;
uniform float uIntro;
uniform float uReveal;
uniform float uBackdrop;
uniform vec4 uClicks[4];

in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

vec4 sampleText(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec4(0.0);
  }
  return texture(uTextTexture, uv);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float time = uTime * uSpeed;
  float scale = max(uWarpScale, 0.001);

  vec2 drift = vec2(time * 0.055, -time * 0.045);
  float n1 = fbm(uv * scale * 3.1 + drift);
  float n2 = fbm((uv + 19.17) * scale * 3.4 - drift.yx);
  vec2 ambient = (vec2(n1, n2) - 0.5) * (uWarpStrength * 0.045 * uMotion + uIntro * 0.18);

  vec2 pointerDelta = uv - uPointer;
  vec2 aspectDelta = vec2(pointerDelta.x * aspect, pointerDelta.y);
  float dist = length(aspectDelta);
  float radius = max(uPointerInfluence, 0.001);
  float t = clamp(dist / radius, 0.0, 1.0);
  float lens = smoothstep(radius, 0.0, dist) * uPointerActive;
  float bulge = t * (1.0 - t) * (1.0 - t) * 6.75 * uPointerActive;
  vec2 dir = dist > 0.0001 ? vec2(aspectDelta.x / aspect, aspectDelta.y) / dist : vec2(0.0);

  float rippleWave = sin(dist * 28.0 - time * 4.2) * 0.5 + 0.5;
  float rippleRing = (rippleWave - 0.5) * uRipple;
  vec2 pointerWarp = dir * rippleRing * bulge * uPointerStrength * 0.016;

  if (uLens > 1.5) {
    float twist = (1.0 - t) * (1.0 - t) * uPointerActive * uPointerStrength * 2.4;
    float s = sin(twist);
    float c = cos(twist);
    vec2 turned = vec2(aspectDelta.x * c - aspectDelta.y * s, aspectDelta.x * s + aspectDelta.y * c);
    pointerWarp += vec2(turned.x / aspect, turned.y) - pointerDelta;
  } else {
    float side = uLens > 0.5 ? -1.0 : 1.0;
    pointerWarp -= dir * side * bulge * uPointerStrength * 0.045;
  }

  vec2 shock = vec2(0.0);
  float shockLight = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 click = uClicks[i];
    if (click.w <= 0.0) continue;
    vec2 clickDelta = uv - click.xy;
    vec2 clickAspect = vec2(clickDelta.x * aspect, clickDelta.y);
    float clickDist = length(clickAspect);
    float age = click.z;
    float offset = (clickDist - age * 0.9) / (0.06 + age * 0.06);
    float fade = 1.0 - smoothstep(0.0, 1.6, age);
    float energy = exp(-offset * offset) * fade * smoothstep(0.0, 0.08, age) * click.w;
    vec2 clickDir = clickDist > 0.0001 ? vec2(clickAspect.x / aspect, clickAspect.y) / clickDist : vec2(0.0);
    shock -= clickDir * offset * energy * 0.09;
    shockLight += energy;
  }

  vec2 bend = pointerWarp + shock;
  vec2 rest = uv + ambient;
  vec2 splitDir = ambient + bend;
  float splitLen = length(splitDir);
  splitDir = splitLen > 0.00001 ? splitDir / splitLen : vec2(0.7071, 0.7071);
  vec2 split = splitDir * uRefraction * 0.16 * (0.35 + lens * 1.65 + uIntro * 3.0);
  float dispersion = uChromatic * 0.5;

  vec3 ink = vec3(0.0);
  vec3 cover = vec3(0.0);
  vec3 weight = vec3(0.0);
  for (int i = 0; i < 7; i++) {
    float k = 1.0 - float(i) / 3.0;
    vec4 tap = sampleText(rest + bend * (1.0 + dispersion * k) + split * k);
    vec3 band = vec3(max(k, 0.0), 1.0 - abs(k), max(-k, 0.0));
    ink += tap.rgb * band;
    cover += tap.a * band;
    weight += band;
  }
  ink /= weight;
  cover /= weight;
  float a = max(max(cover.r, cover.g), cover.b);
  vec3 color = ink + (a - cover) * uBackdrop;
  color = min(color + (lens + shockLight * 0.5) * cover.g * 0.055, vec3(a));
  fragColor = vec4(color, a) * uReveal;
}
`;

const getFontValue = (value: string | number): string => (typeof value === 'number' ? `${value}px` : value);

const smooth = (value: number): number => value * value * (3 - 2 * value);

const getLuminance = (color: string): number => {
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 1;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

const measureLine = (ctx: CanvasRenderingContext2D, line: string, letterSpacing: number): number => {
  const chars = Array.from(line);
  const textWidth = chars.reduce((width, char) => width + ctx.measureText(char).width, 0);
  return textWidth + Math.max(0, chars.length - 1) * letterSpacing;
};

const drawLine = (ctx: CanvasRenderingContext2D, line: string, x: number, y: number, letterSpacing: number): void => {
  const chars = Array.from(line);
  let cursor = x - measureLine(ctx, line, letterSpacing) / 2;

  chars.forEach((char, index) => {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + (index === chars.length - 1 ? 0 : letterSpacing);
  });
};

const buildTextCanvas = ({ container, width, height, dpr, props }: BuildTextCanvasArgs): TextRaster => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));

  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, ink: props.color };

  const probe = document.createElement('span');
  probe.textContent = props.text;
  Object.assign(probe.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    whiteSpace: 'pre',
    inset: '0 auto auto 0',
    color: props.color,
    fontFamily: props.fontFamily,
    fontSize: getFontValue(props.fontSize),
    fontWeight: String(props.fontWeight),
    letterSpacing: getFontValue(props.letterSpacing),
    lineHeight: typeof props.lineHeight === 'number' ? String(props.lineHeight) : props.lineHeight
  });
  container.appendChild(probe);
  const computed = window.getComputedStyle(probe);
  let fontSizePx = parseFloat(computed.fontSize) || 96;
  const ink = computed.color || props.color;
  const fontFamily = computed.fontFamily || 'sans-serif';
  const fontWeight = computed.fontWeight || String(props.fontWeight);
  let letterSpacing = computed.letterSpacing === 'normal' ? 0 : parseFloat(computed.letterSpacing) || 0;
  let lineHeight = parseFloat(computed.lineHeight);
  if (!Number.isFinite(lineHeight)) {
    lineHeight = fontSizePx * (typeof props.lineHeight === 'number' ? props.lineHeight : 0.92);
  }
  probe.remove();

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const lines = String(props.text || '').split('\n');
  const applyFont = () => {
    ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
  };
  applyFont();

  const maxWidth = width * 0.86;
  const maxHeight = height * 0.78;
  const widest = Math.max(...lines.map(line => measureLine(ctx, line, letterSpacing)), 1);
  const blockHeight = Math.max(lineHeight * lines.length, 1);
  const fit = Math.min(1, maxWidth / widest, maxHeight / blockHeight);

  if (fit < 1) {
    fontSizePx *= fit;
    letterSpacing *= fit;
    lineHeight *= fit;
    applyFont();
  }

  const startY = height / 2 - (lineHeight * (lines.length - 1)) / 2;
  lines.forEach((line, index) => drawLine(ctx, line, width / 2, startY + index * lineHeight, letterSpacing));

  return { canvas, ink };
};

const syncUniforms = (program: Program, props: RuntimeProps): void => {
  const uniforms = program.uniforms;
  uniforms.uWarpStrength.value = props.warpStrength;
  uniforms.uWarpScale.value = props.warpScale;
  uniforms.uSpeed.value = props.speed;
  uniforms.uPointerInfluence.value = props.pointerInfluence;
  uniforms.uPointerStrength.value = props.pointerStrength;
  uniforms.uRefraction.value = props.refraction;
  uniforms.uChromatic.value = props.chromatic;
  uniforms.uRipple.value = props.ripple ? 1 : 0;
  uniforms.uLens.value = LENS_MODES[props.lens] ?? 0;
};

const WarpText = ({
  text = 'Bend the moment',
  color = 'currentColor',
  warpStrength = 0.08,
  warpScale = 1.7,
  speed = 0.55,
  pointerInfluence = 0.42,
  pointerStrength = 0.38,
  refraction = 0.018,
  chromatic = 0,
  ripple = true,
  clickRipple = true,
  idleDrift = 0.2,
  lens = 'bulge',
  intro = true,
  fontSize = 'clamp(3rem, 10vw, 9rem)',
  fontWeight = 800,
  fontFamily = 'inherit',
  letterSpacing = '-0.06em',
  lineHeight = 0.9,
  className = '',
  style
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef<RuntimeProps>({
    text,
    color,
    fontSize,
    fontWeight,
    fontFamily,
    letterSpacing,
    lineHeight,
    warpStrength,
    warpScale,
    speed,
    pointerInfluence,
    pointerStrength,
    refraction,
    chromatic,
    ripple,
    clickRipple,
    idleDrift,
    lens,
    intro
  });
  const contextRef = useRef<RuntimeContext | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    propsRef.current = {
      text,
      color,
      fontSize,
      fontWeight,
      fontFamily,
      letterSpacing,
      lineHeight,
      warpStrength,
      warpScale,
      speed,
      pointerInfluence,
      pointerStrength,
      refraction,
      chromatic,
      ripple,
      clickRipple,
      idleDrift,
      lens,
      intro
    };

    if (contextRef.current) syncUniforms(contextRef.current.program, propsRef.current);
  }, [
    text,
    color,
    fontSize,
    fontWeight,
    fontFamily,
    letterSpacing,
    lineHeight,
    warpStrength,
    warpScale,
    speed,
    pointerInfluence,
    pointerStrength,
    refraction,
    chromatic,
    ripple,
    clickRipple,
    idleDrift,
    lens,
    intro
  ]);

  useEffect(() => {
    contextRef.current?.rasterize();
  }, [text, color, fontSize, fontWeight, fontFamily, letterSpacing, lineHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return undefined;

    let renderer: Renderer;
    let gl: OGLRenderingContext;
    let program: Program;
    let geometry: Triangle;
    let mesh: Mesh;
    let texture: Texture;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let raf = 0;
    let disposed = false;
    let contextLost = false;
    let visible = true;
    let pageVisible = !document.hidden;
    let reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let rasterVersion = 0;
    let textReady = false;
    let introProgress = propsRef.current.intro && !reduceMotion ? 0 : 1;
    let lastFrame = 0;
    let frame = 0;
    let lastInk = '';

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, activeTarget: 0 };
    const clicks = Array.from({ length: MAX_CLICKS }, () => [0.5, 0.5, 0, 0]);
    let clickSlot = 0;
    const startTime = performance.now();

    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
      });
      gl = renderer.gl;
    } catch (error) {
      console.warn('WarpText: WebGL could not be initialized.', error);
      setFailed(true);
      return undefined;
    }

    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    texture = new Texture(gl, {
      generateMipmaps: false,
      premultiplyAlpha: true,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE
    });

    geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTextTexture: { value: texture },
        uResolution: { value: new Float32Array([1, 1]) },
        uPointer: { value: new Float32Array([0.5, 0.5]) },
        uPointerActive: { value: 0 },
        uTime: { value: 0 },
        uWarpStrength: { value: propsRef.current.warpStrength },
        uWarpScale: { value: propsRef.current.warpScale },
        uSpeed: { value: propsRef.current.speed },
        uPointerInfluence: { value: propsRef.current.pointerInfluence },
        uPointerStrength: { value: propsRef.current.pointerStrength },
        uRefraction: { value: propsRef.current.refraction },
        uChromatic: { value: propsRef.current.chromatic },
        uRipple: { value: propsRef.current.ripple ? 1 : 0 },
        uMotion: { value: reduceMotion ? 0 : 1 },
        uLens: { value: LENS_MODES[propsRef.current.lens] ?? 0 },
        uIntro: { value: 0 },
        uReveal: { value: 0 },
        uBackdrop: { value: 0 },
        uClicks: { value: clicks }
      }
    });
    mesh = new Mesh(gl, { geometry, program });

    const renderOnce = () => {
      if (disposed || contextLost) return;
      renderer.render({ scene: mesh });
    };

    const rasterize = async () => {
      const version = ++rasterVersion;
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch (error) {
          void error;
        }
      }
      if (disposed || contextLost || version !== rasterVersion) return;

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      lastInk = window.getComputedStyle(container).color;
      const raster = buildTextCanvas({
        container,
        width: rect.width,
        height: rect.height,
        dpr,
        props: propsRef.current
      });
      texture.image = raster.canvas;
      texture.needsUpdate = true;
      program.uniforms.uBackdrop.value = getLuminance(raster.ink) < 0.5 ? 1 : 0;
      textReady = true;
      renderOnce();
    };

    const resize = () => {
      if (disposed || contextLost) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      renderer.dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setSize(rect.width, rect.height);
      program.uniforms.uResolution.value[0] = gl.drawingBufferWidth;
      program.uniforms.uResolution.value[1] = gl.drawingBufferHeight;
      rasterize();
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointer.tx = (event.clientX - rect.left) / rect.width;
      pointer.ty = 1 - (event.clientY - rect.top) / rect.height;
      pointer.activeTarget = 1;
    };

    const onPointerLeave = (): void => {
      pointer.activeTarget = 0;
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (!propsRef.current.clickRipple) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const click = clicks[clickSlot];
      clickSlot = (clickSlot + 1) % clicks.length;
      click[0] = (event.clientX - rect.left) / rect.width;
      click[1] = 1 - (event.clientY - rect.top) / rect.height;
      click[2] = 0;
      click[3] = reduceMotion ? 0.35 : 1;
    };

    const onContextLost = (event: Event): void => {
      event.preventDefault();
      contextLost = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      setFailed(true);
    };

    const onVisibility = (): void => {
      pageVisible = !document.hidden;
      if (pageVisible && visible && !raf) raf = requestAnimationFrame(loop);
      if (!pageVisible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onReducedMotion = (event: MediaQueryListEvent): void => {
      reduceMotion = event.matches;
      if (reduceMotion) introProgress = 1;
      program.uniforms.uMotion.value = reduceMotion ? 0 : 1;
      renderOnce();
    };

    const loop = (now: number): void => {
      if (disposed || contextLost) return;

      const elapsed = (now - startTime) * 0.001;
      const delta = lastFrame ? Math.min(now - lastFrame, 50) : 16;
      lastFrame = now;
      frame += 1;

      if (textReady && introProgress < 1) introProgress = Math.min(1, introProgress + delta / INTRO_MS);
      const settle = 1 - introProgress;

      if (textReady && frame % 15 === 0 && window.getComputedStyle(container).color !== lastInk) rasterize();

      const drift = Math.min(Math.max(propsRef.current.idleDrift, 0), 1);
      const engaged = pointer.activeTarget > 0;
      const idleX = 0.5 + Math.sin(elapsed * 0.33) * (0.08 + drift * 0.2);
      const idleY = 0.5 + Math.cos(elapsed * 0.27) * (0.06 + drift * 0.2);
      const follow = 1 - Math.exp(-delta / (engaged ? 130 : 470));

      pointer.x += ((engaged ? pointer.tx : idleX) - pointer.x) * follow;
      pointer.y += ((engaged ? pointer.ty : idleY) - pointer.y) * follow;
      pointer.active += ((engaged ? 1 : drift) - pointer.active) * (1 - Math.exp(-delta / 270));

      clicks.forEach(click => {
        if (click[3] <= 0) return;
        click[2] += delta / 1000;
        if (click[2] > RIPPLE_LIFE) click[3] = 0;
      });

      program.uniforms.uPointer.value[0] = pointer.x;
      program.uniforms.uPointer.value[1] = pointer.y;
      program.uniforms.uPointerActive.value = reduceMotion ? pointer.active * 0.35 : pointer.active;
      program.uniforms.uTime.value = reduceMotion ? 0 : elapsed;
      program.uniforms.uIntro.value = settle * settle * settle;
      program.uniforms.uReveal.value = textReady ? smooth(Math.min(1, introProgress / 0.45)) : 0;

      renderOnce();
      raf = requestAnimationFrame(loop);
    };

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    intersectionObserver = new IntersectionObserver(
      ([entry]: IntersectionObserverEntry[]) => {
        visible = entry.isIntersecting;
        if (visible && pageVisible && !raf) raf = requestAnimationFrame(loop);
        if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(container);

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    document.addEventListener('visibilitychange', onVisibility);
    mediaQuery?.addEventListener('change', onReducedMotion);

    syncUniforms(program, propsRef.current);
    contextRef.current = { program, rasterize };
    resize();
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      contextRef.current = null;
      if (raf) cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibility);
      mediaQuery?.removeEventListener('change', onReducedMotion);

      if (!contextLost) {
        try {
          if (texture?.texture) gl.deleteTexture(texture.texture);
          geometry?.remove?.();
          program?.remove?.();
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        } catch (error) {
          void error;
        }
      }

      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative block min-h-[220px] w-full overflow-hidden isolate rounded-[inherit] ${className}`.trim()}
      style={style}
      role="img"
      aria-label={text}
    >
      {failed && (
        <span
          className="absolute inset-0 flex items-center justify-center whitespace-pre-line px-[7%] text-center"
          aria-hidden="true"
          style={{
            color,
            fontFamily,
            fontWeight,
            fontSize: getFontValue(fontSize),
            letterSpacing: getFontValue(letterSpacing),
            lineHeight
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default WarpText;
