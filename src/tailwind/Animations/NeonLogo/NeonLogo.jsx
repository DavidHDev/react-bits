'use client';

import { useEffect, useRef, useState } from 'react';

const FLOOR = 34;
const MAX_RENDER_DIM = 2400;
const GROW_SECONDS = 0.9;
const FLARE_LEAD = 1;
const FLARE_HOLD = 0.95;
const FLARE_SECONDS = 2.2;
const DEFAULT_COLORS = ['#ffc9f4', '#ea6fe0', '#d351b6', '#a6f3fa', '#6fd6f7', '#5aaef0', '#2b4bb8', '#121646'];
const DEFAULT_FONT = 'Inter, system-ui, sans-serif';

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform sampler2D uPalette;
uniform vec2 uRes;
uniform vec3 uBase;
uniform float uGain;
uniform float uGrow;
uniform vec3 uHand;
uniform vec3 uRadii;
uniform float uCool;
uniform float uSwell;
uniform float uLit;
uniform vec4 uFlare;
uniform float uFlareWidth;
uniform float uOpacity;
out vec4 outColor;

void main() {
  vec2 frag = gl_FragCoord.xy;
  float f = min(texture(uField, frag / uRes).r * uGain, 1.0) * uGrow;
  vec2 dv = frag - uHand.xy;
  float d2 = dot(dv, dv);
  float on = uHand.z;
  float m = uLit;
  if (on > 0.002) {
    f = min(f * (1.0 + uSwell * on * exp(-d2 / (uRadii.z * uRadii.z))), 1.0);
    float r = sqrt(d2) / uRadii.x;
    float k = r < 0.45 ? mix(1.0, 0.6, r / 0.45) : mix(0.6, 0.0, clamp((r - 0.45) / 0.55, 0.0, 1.0));
    f *= 1.0 - uCool * on * k;
    float t = clamp(1.0 - d2 / (uRadii.y * uRadii.y), 0.0, 1.0);
    m = max(m, on * t * t * (3.0 - 2.0 * t));
  }
  if (uFlare.z > 0.0) {
    float fd = length(frag - uFlare.xy);
    float lead = clamp((uFlare.z - fd) / uFlareWidth + 0.5, 0.0, 1.0);
    float trail = clamp((uFlare.w - fd) / uFlareWidth + 0.5, 0.0, 1.0);
    lead = lead * lead * (3.0 - 2.0 * lead);
    trail = trail * trail * (3.0 - 2.0 * trail);
    m = max(m, lead * (1.0 - trail));
  }
  vec4 heat = texture(uPalette, vec2((f * 255.0 + 0.5) / 256.0, 0.5));
  float grey = clamp((f * 255.0 - 70.0) / 45.0, 0.0, 1.0);
  vec3 rgb = mix(uBase, heat.rgb, m);
  float alpha = mix(grey, heat.a, m) * uOpacity;
  outColor = vec4(rgb * alpha, alpha);
}`;

const UNIFORMS = [
  'uField',
  'uPalette',
  'uRes',
  'uBase',
  'uGain',
  'uGrow',
  'uHand',
  'uRadii',
  'uCool',
  'uSwell',
  'uLit',
  'uFlare',
  'uFlareWidth',
  'uOpacity'
];

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

const startProgram = gl => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
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

const finishProgram = (gl, job) => {
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
  for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
};

const makeTexture = gl => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  return texture;
};

const keyedMask = (image, width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return image;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let pixels;
  try {
    pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return image;
  }
  const data = pixels.data;
  const w = canvas.width;
  const h = canvas.height;
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
  if (corners.some(index => data[index + 3] < 250)) return canvas;
  const key = [0, 1, 2].map(c => corners.reduce((sum, index) => sum + data[index + c], 0) / 4);
  for (let i = 0; i < data.length; i += 4) {
    const distance = Math.hypot(data[i] - key[0], data[i + 1] - key[1], data[i + 2] - key[2]);
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.round(255 * clamp((distance - 24) / 60, 0, 1));
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
};

const measureText = (context, text, font) => {
  context.font = font;
  const metrics = context.measureText(text);
  const left = metrics.actualBoundingBoxLeft || 0;
  const right = metrics.actualBoundingBoxRight || metrics.width;
  const ascent = metrics.actualBoundingBoxAscent || 72;
  const descent = metrics.actualBoundingBoxDescent || 0;
  return { left, right, ascent, descent, width: left + right, height: ascent + descent };
};

const strokeWidth = (paint, width, height, box) => {
  const scale = Math.min(1, 220 / Math.max(box[2], box[3], 1));
  const w = Math.max(2, Math.round(width * scale));
  const h = Math.max(2, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return 0;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  paint(context, 0);
  const data = context.getImageData(0, 0, w, h).data;
  const far = 1e6;
  const dist = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) dist[i] = data[i * 4 + 3] > 127 ? far : 0;
  const d2 = Math.SQRT2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!dist[i]) continue;
      let v = dist[i];
      if (x > 0) v = Math.min(v, dist[i - 1] + 1);
      if (y > 0) {
        v = Math.min(v, dist[i - w] + 1);
        if (x > 0) v = Math.min(v, dist[i - w - 1] + d2);
        if (x < w - 1) v = Math.min(v, dist[i - w + 1] + d2);
      }
      dist[i] = v;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (!dist[i]) continue;
      let v = dist[i];
      if (x < w - 1) v = Math.min(v, dist[i + 1] + 1);
      if (y < h - 1) {
        v = Math.min(v, dist[i + w] + 1);
        if (x < w - 1) v = Math.min(v, dist[i + w + 1] + d2);
        if (x > 0) v = Math.min(v, dist[i + w - 1] + d2);
      }
      dist[i] = v;
    }
  }
  const inside = [];
  for (let i = 0; i < w * h; i++) if (dist[i] > 0 && dist[i] < far) inside.push(dist[i]);
  if (!inside.length) return 0;
  inside.sort((a, b) => a - b);
  return (2 * inside[Math.floor(inside.length * 0.92)]) / scale;
};

const buildField = (canvas, shape, settings, width, height) => {
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.shadowColor = 'transparent';
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);
  if (!shape) return { unit: 1, box: [width / 2, height / 2, 0, 0] };
  const boxW = width * settings.scale;
  const boxH = height * settings.scale;
  const cx = width / 2;
  const cy = height / 2;
  let drawW = boxW;
  let drawH = boxH;
  let paint = null;
  if (shape.kind === 'text') {
    const base = `${settings.fontWeight} 100px ${settings.fontFamily}`;
    const m = measureText(context, shape.text, base);
    const k = Math.min(boxW / Math.max(m.width, 1), boxH / Math.max(m.height, 1));
    const font = `${settings.fontWeight} ${100 * k}px ${settings.fontFamily}`;
    drawW = m.width * k;
    drawH = m.height * k;
    const x = cx - drawW / 2 + m.left * k;
    const y = cy + ((m.ascent - m.descent) / 2) * k;
    paint = (target, offset) => {
      target.font = font;
      target.textAlign = 'left';
      target.textBaseline = 'alphabetic';
      target.fillStyle = '#fff';
      target.fillText(shape.text, x - offset, y);
    };
  } else {
    const image = shape.image;
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const k = Math.min(boxW / iw, boxH / ih);
    drawW = iw * k;
    drawH = ih * k;
    const source = keyedMask(image, drawW, drawH);
    paint = (target, offset) => target.drawImage(source, cx - drawW / 2 - offset, cy - drawH / 2, drawW, drawH);
  }
  const box = [cx, cy, drawW, drawH];
  const unit = Math.sqrt(Math.max(drawW * drawH, 1)) / 139;
  const stroke = strokeWidth(paint, width, height, box);
  const blurUnit = stroke > 0 ? Math.min(unit, stroke / 17) : unit;
  const offset = width * 3 + 64;
  context.shadowColor = '#fff';
  context.shadowBlur = (6 + settings.softness * 16) * blurUnit;
  context.shadowOffsetX = offset;
  context.shadowOffsetY = 0;
  paint(context, offset);
  paint(context, offset);
  context.shadowColor = 'transparent';
  return { unit, box };
};

const measureGain = canvas => {
  const probe = document.createElement('canvas');
  const scale = Math.min(1, 320 / Math.max(canvas.width, canvas.height));
  probe.width = Math.max(1, Math.round(canvas.width * scale));
  probe.height = Math.max(1, Math.round(canvas.height * scale));
  const context = probe.getContext('2d', { willReadFrequently: true });
  if (!context) return 1;
  context.drawImage(canvas, 0, 0, probe.width, probe.height);
  const data = context.getImageData(0, 0, probe.width, probe.height).data;
  let peak = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i] > peak) peak = data[i];
  return peak > 0 ? clamp(235 / peak, 1, 4) : 1;
};

const NeonLogo = ({
  src,
  text = 'NEON',
  fontFamily = DEFAULT_FONT,
  fontWeight = 500,
  scale = 0.7,
  baseColor = '#a855f7',
  colors = DEFAULT_COLORS,
  heat = 0.5,
  radius = 1.5,
  softness = 0.25,
  swell = 0.1,
  idle = 'drift',
  speed = 2,
  igniteOnClick = true,
  interactive = true,
  intro = true,
  opacity = 1,
  dpr,
  className = '',
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const releaseRef = useRef(0);
  const [generation, setGeneration] = useState(0);
  const [shape, setShape] = useState(null);
  const palette = Array.isArray(colors) && colors.length ? colors.map(String) : DEFAULT_COLORS;
  const settings = {
    src: src || '',
    text: String(text ?? ''),
    fontFamily: fontFamily || DEFAULT_FONT,
    fontWeight: num(fontWeight, 500),
    scale: clamp(num(scale, 0.7), 0.1, 1),
    baseColor: String(baseColor),
    colors: palette,
    heat: clamp(num(heat, 0.5), 0, 1),
    radius: clamp(num(radius, 1.5), 0.2, 3),
    softness: clamp(num(softness, 0.25), 0, 1),
    swell: clamp(num(swell, 0.1), 0, 2),
    idle,
    speed: clamp(num(speed, 2), 0, 4),
    igniteOnClick,
    interactive,
    intro,
    opacity: clamp(num(opacity, 1), 0, 1),
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const shapeRef = useRef(shape);
  shapeRef.current = shape;

  useEffect(() => {
    let alive = true;
    if (settings.src) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        if (alive) setShape({ kind: 'image', image, key: settings.src });
      };
      image.src = settings.src;
      return () => {
        alive = false;
        image.onload = null;
      };
    }
    const next = {
      kind: 'text',
      text: settings.text,
      key: `${settings.text}|${settings.fontFamily}|${settings.fontWeight}`
    };
    const fonts = document.fonts;
    if (!fonts?.load) {
      setShape(next);
      return undefined;
    }
    fonts
      .load(`${settings.fontWeight} 100px ${settings.fontFamily}`, settings.text || 'A')
      .catch(() => null)
      .then(() => {
        if (alive) setShape(next);
      });
    return () => {
      alive = false;
    };
  }, [settings.src, settings.text, settings.fontFamily, settings.fontWeight]);

  useEffect(() => {
    wakeRef.current?.(shape);
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
    let job = startProgram(gl);
    if (!job) return undefined;
    let surface = null;
    if (!parallel) {
      surface = finishProgram(gl, job);
      job = null;
      if (!surface) return undefined;
    }
    const vao = gl.createVertexArray();
    const fieldTexture = makeTexture(gl);
    const paletteTexture = makeTexture(gl);
    const fieldCanvas = document.createElement('canvas');
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeContext = probe.getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = {
      width: 1,
      height: 1,
      ratio: 1,
      shape: null,
      fieldKey: '',
      paletteKey: '',
      base: [0.66, 0.33, 0.97],
      baseKey: '',
      gain: 1,
      unit: 1,
      box: [0, 0, 0, 0],
      grow: 0,
      growing: false,
      shown: false,
      pointer: { x: 0, y: 0, inside: false },
      hand: { x: 0, y: 0, tx: 0, ty: 0, power: 0, placed: false },
      drift: 0,
      release: 1,
      anchor: null,
      flare: null
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;
    let lost = false;

    const toRgb = (value, fallback) => {
      if (!probeContext || !value) return fallback;
      const css = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
      probeContext.clearRect(0, 0, 1, 1);
      probeContext.fillStyle = '#000000';
      probeContext.fillStyle = css;
      probeContext.fillRect(0, 0, 1, 1);
      const [r, g, b] = probeContext.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    };

    const syncPalette = s => {
      const key = s.colors.join('|');
      if (key === state.paletteKey) return;
      state.paletteKey = key;
      const stops = s.colors.map(color => toRgb(color, [255, 255, 255]));
      if (stops.length === 1) stops.push(stops[0]);
      const table = new Uint8Array(256 * 4);
      for (let i = FLOOR; i < 256; i++) {
        const x = ((i - FLOOR) / (255 - FLOOR)) * (stops.length - 1);
        const k = Math.min(stops.length - 2, Math.floor(x));
        const f = x - k;
        for (let c = 0; c < 3; c++) table[i * 4 + c] = Math.round(stops[k][c] + (stops[k + 1][c] - stops[k][c]) * f);
        table[i * 4 + 3] = Math.round(255 * clamp((i - FLOOR) / 26, 0, 1));
      }
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, table);
    };

    const syncBase = s => {
      if (s.baseColor === state.baseKey) return;
      state.baseKey = s.baseColor;
      state.base = toRgb(s.baseColor, [168, 85, 247]).map(v => v / 255);
    };

    const syncField = () => {
      const s = settingsRef.current;
      const key = `${state.shape?.key ?? ''}|${canvas.width}x${canvas.height}|${s.scale}|${s.softness}`;
      if (key === state.fieldKey) return;
      state.fieldKey = key;
      const built = buildField(fieldCanvas, state.shape, s, canvas.width, canvas.height);
      if (!built) return;
      state.unit = built.unit;
      state.box = built.box;
      state.gain = state.shape ? measureGain(fieldCanvas) : 1;
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, fieldCanvas);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    };

    const render = () => {
      if (!surface || lost) return;
      const s = settingsRef.current;
      syncPalette(s);
      syncBase(s);
      syncField();
      const u = surface.uniforms;
      const r = state.ratio;
      const spread = s.radius;
      const unit = state.unit;
      const hand = state.hand;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(surface.program);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.uniform1i(u.uField, 0);
      gl.uniform1i(u.uPalette, 1);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform3f(u.uBase, state.base[0], state.base[1], state.base[2]);
      gl.uniform1f(u.uGain, state.gain);
      const grow = state.grow;
      gl.uniform1f(u.uGrow, grow * grow * (3 - 2 * grow));
      gl.uniform3f(u.uHand, hand.x * r, canvas.height - hand.y * r, hand.power);
      gl.uniform3f(
        u.uRadii,
        (60 + s.heat * 50) * unit * spread,
        (95 + s.heat * 55) * unit * spread,
        62 * unit * spread
      );
      gl.uniform1f(u.uCool, 0.35 + s.heat * 0.55);
      gl.uniform1f(u.uSwell, 0.75 * s.swell);
      gl.uniform1f(u.uLit, s.idle === 'lit' ? 1 : 0);
      const flare = state.flare;
      const flareWidth = 70 * unit;
      if (flare) {
        const [cx, cy, bw, bh] = state.box;
        const fx = flare.x * r;
        const fy = flare.y * r;
        const reach =
          Math.max(
            Math.hypot(fx - (cx - bw / 2), fy - (cy - bh / 2)),
            Math.hypot(fx - (cx + bw / 2), fy - (cy - bh / 2)),
            Math.hypot(fx - (cx - bw / 2), fy - (cy + bh / 2)),
            Math.hypot(fx - (cx + bw / 2), fy - (cy + bh / 2))
          ) +
          flareWidth * 1.5;
        const lead = clamp(flare.age / FLARE_LEAD, 0, 1);
        const trail = clamp((flare.age - FLARE_HOLD) / (FLARE_SECONDS - FLARE_HOLD), 0, 1);
        const leadFront = reach * (1 - (1 - lead) * (1 - lead)) - flareWidth;
        const trailFront = trail > 0 ? reach * trail * trail * (3 - 2 * trail) - flareWidth : -1e6;
        gl.uniform4f(u.uFlare, fx, canvas.height - fy, Math.max(leadFront, 0.001), trailFront);
      } else {
        gl.uniform4f(u.uFlare, 0, 0, 0, 0);
      }
      gl.uniform1f(u.uFlareWidth, flareWidth);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
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
      render();
    };

    const ready = () => {
      if (surface) return true;
      if (!job || !parallel || !gl.getProgramParameter(job.program, parallel.COMPLETION_STATUS_KHR)) return false;
      surface = finishProgram(gl, job);
      job = null;
      return Boolean(surface);
    };

    const driftTarget = () => {
      const [cx, cy, bw, bh] = state.box;
      const r = state.ratio || 1;
      const t = state.drift;
      return {
        x: (cx + Math.sin(t * 0.53) * bw * 0.42 + Math.sin(t * 1.31 + 1.7) * bw * 0.06) / r,
        y: (cy + Math.sin(t * 0.79 + 0.6) * bh * 0.32) / r
      };
    };

    const frame = now => {
      raf = 0;
      if (!alive || !visible || document.hidden || lost) return;
      if (!ready()) {
        if (job) raf = requestAnimationFrame(frame);
        return;
      }
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (state.growing) {
        state.grow = Math.min(1, state.grow + dt / GROW_SECONDS);
        if (state.grow >= 1) state.growing = false;
      }
      const hand = state.hand;
      const pointer = state.pointer;
      const hovering = s.interactive && pointer.inside;
      const drifting = !hovering && s.idle === 'drift' && !reduce && Boolean(state.shape);
      let want = 0;
      if (hovering) {
        hand.tx = pointer.x;
        hand.ty = pointer.y;
        state.anchor = { x: hand.x, y: hand.y };
        state.release = 0;
        want = 1;
      } else if (drifting) {
        state.drift += dt * s.speed;
        state.release = Math.min(1, state.release + dt / 1.4);
        const spot = driftTarget();
        const blend = state.release * state.release * (3 - 2 * state.release);
        const from = state.anchor || spot;
        hand.tx = from.x + (spot.x - from.x) * blend;
        hand.ty = from.y + (spot.y - from.y) * blend;
        want = state.grow;
      }
      if (!hand.placed && want) {
        hand.x = hand.tx;
        hand.y = hand.ty;
        hand.placed = true;
      }
      const follow = 1 - Math.pow(0.002, dt);
      hand.x += (hand.tx - hand.x) * follow;
      hand.y += (hand.ty - hand.y) * follow;
      hand.power += (want - hand.power) * (1 - Math.pow(0.01, dt));
      if (!want && hand.power < 0.004) {
        hand.power = 0;
        hand.placed = false;
      }
      if (state.flare) {
        state.flare.age += dt;
        if (state.flare.age >= FLARE_SECONDS) state.flare = null;
      }
      render();
      const settling =
        state.growing ||
        Math.abs(want - hand.power) > 0.004 ||
        Math.abs(hand.tx - hand.x) > 0.05 ||
        Math.abs(hand.ty - hand.y) > 0.05 ||
        Boolean(state.flare) ||
        drifting;
      if (settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && alive && visible && !document.hidden && !lost) raf = requestAnimationFrame(frame);
    };

    const adopt = next => {
      if (!next || next === state.shape) return;
      const first = !state.shown;
      state.shape = next;
      state.shown = true;
      const animate = !reduce && (first ? settingsRef.current.intro : true);
      state.grow = animate ? 0 : 1;
      state.growing = animate;
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
      if (!s.interactive || !s.igniteOnClick || event.button !== 0 || reduce) return;
      const spot = locate(event);
      if (!spot.inside) return;
      state.flare = { x: spot.x, y: spot.y, age: 0 };
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
    container.addEventListener('pointerdown', onPointerDown);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    adopt(shapeRef.current);
    resize();
    wake();
    wakeRef.current = next => {
      adopt(next);
      if (!raf) render();
      wake();
    };

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        gl.deleteVertexArray(vao);
        gl.deleteTexture(fieldTexture);
        gl.deleteTexture(paletteTexture);
        if (surface) gl.deleteProgram(surface.program);
        const release = () => {
          if (!job || gl.isContextLost()) return;
          if (parallel && !gl.getProgramParameter(job.program, parallel.COMPLETION_STATUS_KHR)) {
            requestAnimationFrame(release);
            return;
          }
          gl.deleteShader(job.vertex);
          gl.deleteShader(job.fragment);
          gl.deleteProgram(job.program);
          job = null;
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

export default NeonLogo;
