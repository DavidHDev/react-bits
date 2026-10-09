'use client';

import { useEffect, useRef, useState } from 'react';

const SCOPES = ['window', 'card'];
const BLEED = 1.24;

const ROOT = 'relative flex-none will-change-transform';
const CANVAS = 'pointer-events-none absolute top-[-12%] left-[-12%] block h-[124%] w-[124%]';
const FALLBACK = 'absolute top-[8.33%] left-[8.33%] h-[83.33%] w-[83.33%] object-cover';
const CONTENT = 'pointer-events-none absolute right-[8.33%] bottom-[8.33%] left-[8.33%] p-5 text-white';

const VERTEX = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform vec2 uSize;
uniform vec2 uImageSize;
uniform float uUnit;
uniform float uScale;
uniform float uIdle;
uniform float uFrequency;
uniform int uOctaves;
uniform float uSeed;
uniform float uRadius;
uniform float uTime;
uniform float uFlow;
uniform float uChroma;
uniform float uGray;
uniform float uReady;
in vec2 vUv;
out vec4 fragColor;

vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n = 1.0 / 7.0;
  vec3 ns = n * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float turbulence(vec2 p, float z) {
  float sum = 0.0;
  float amp = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= uOctaves) break;
    sum += abs(snoise(vec3(p, z))) * amp;
    p = p * 2.0 + 19.19;
    amp *= 0.5;
  }
  return clamp(sum * 0.45 + 0.231, 0.0, 1.0);
}

float roundedBox(vec2 p, vec2 extent, float r) {
  vec2 q = abs(p) - extent + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec3 sampleImage(vec2 view) {
  vec2 uv = view / vec2(600.0, 750.0);
  float card = 600.0 / 750.0;
  float image = uImageSize.x / max(1.0, uImageSize.y);
  vec2 scale = card > image ? vec2(1.0, image / card) : vec2(card / image, 1.0);
  return texture(uImage, (uv - 0.5) * scale + 0.5).rgb;
}

void main() {
  vec2 view = vec2(300.0, 375.0) + (vUv * uSize - uSize * 0.5) / uUnit;
  float inside = min(min(view.x, 600.0 - view.x), min(view.y, 750.0 - view.y));
  float rim = 1.0 - smoothstep(0.0, 160.0, inside);
  float drift = snoise(vec3(view * 0.004 + uSeed * 0.37, uTime * 0.12)) * 0.5 + 0.5;
  float idle = uIdle * mix(smoothstep(0.55, 0.95, drift) * 0.5, 0.25 + 0.75 * smoothstep(0.3, 0.8, drift), rim);
  float scale = uScale * mix(0.2, 1.0, rim) + idle * 120.0;
  vec2 offset = vec2(0.0);
  if (scale > 0.01) {
    vec2 p = view * uFrequency + vec2(uSeed * 17.31, uSeed * 9.17);
    float z = uTime * (uFlow * 0.35 + uIdle * 0.5) + uSeed * 3.1;
    float red = turbulence(p, z);
    float blue = turbulence(p + vec2(31.7, 47.3), z + 5.3);
    offset = scale * (vec2(red, blue) - 0.5);
  }
  vec2 source = view + offset;
  float edge = roundedBox(source - vec2(300.0, 375.0), vec2(300.0, 375.0), uRadius);
  float alpha = (1.0 - smoothstep(-0.75 / uUnit, 0.75 / uUnit, edge)) * uReady;
  vec3 color = sampleImage(source);
  if (uChroma > 0.0) {
    vec2 split = offset * uChroma * 0.08 + vec2(uChroma * min(scale, 200.0) * 0.012, 0.0);
    color.r = sampleImage(source + split).r;
    color.b = sampleImage(source - split).b;
  }
  color = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), uGray);
  fragColor = vec4(color * alpha, alpha);
}`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const soften = (value, bound) => {
  if (value > bound) return bound + (value - bound) * 0.2;
  if (value < -bound) return -bound + (value + bound) * 0.2;
  return value;
};

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const DecayCard = ({
  image = 'https://images.unsplash.com/photo-1762846818262-33c197852fa8?w=900&q=80&auto=format&fit=crop',
  width = 300,
  height = 400,
  intensity = 0.5,
  sensitivity = 0.5,
  hoverDecay = 0.05,
  recovery = 0.6,
  grain = 0.25,
  detail = 5,
  pattern = 4,
  idle = 0.35,
  flow = 0,
  chroma = 0,
  travel = 50,
  tilt = 10,
  scope = 'window',
  radius = 0,
  grayscale = false,
  children,
  className = '',
  style
}) => {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const loadRef = useRef(null);
  const wakeRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const settings = {
    intensity: clamp(intensity, 0, 2),
    sensitivity: clamp(sensitivity, 0, 1),
    hoverDecay: clamp(hoverDecay, 0, 1),
    recovery: Math.max(0.05, recovery),
    frequency: 0.003 + clamp(grain, 0, 1) * 0.047,
    octaves: clamp(Math.round(detail), 1, 8),
    seed: Math.round(pattern),
    idle: clamp(idle, 0, 1),
    flow: clamp(flow, 0, 2),
    chroma: clamp(chroma, 0, 2),
    travel: Math.max(0, travel),
    tilt: clamp(tilt, 0, 45),
    scope: SCOPES.includes(scope) ? scope : 'window',
    radius: Math.max(0, radius),
    grayscale
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    let program = null;
    let texture = null;
    let buffer = null;
    const uniforms = {};

    if (gl) {
      const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
      const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
      if (vertex && fragment) {
        program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.bindAttribLocation(program, 0, 'position');
        gl.linkProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          gl.deleteProgram(program);
          program = null;
        }
      }
      if (program) {
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
        for (const name of [
          'uImage',
          'uSize',
          'uImageSize',
          'uUnit',
          'uScale',
          'uIdle',
          'uFrequency',
          'uOctaves',
          'uSeed',
          'uRadius',
          'uTime',
          'uFlow',
          'uChroma',
          'uGray',
          'uReady'
        ]) {
          uniforms[name] = gl.getUniformLocation(program, name);
        }
      }
    }
    if (!program) setFallback(true);

    const state = {
      x: 0,
      y: 0,
      rotate: 0,
      level: 0,
      time: 0,
      cursorX: window.innerWidth / 2,
      cursorY: window.innerHeight / 2,
      lastX: window.innerWidth / 2,
      lastY: window.innerHeight / 2,
      seen: false,
      hovered: false,
      visible: true,
      ready: false,
      imageWidth: 1,
      imageHeight: 1
    };
    let raf = 0;
    let last = performance.now();
    let alive = true;
    let calm = 0;
    let tick = 0;

    const draw = () => {
      if (!gl || !program) return;
      const s = settingsRef.current;
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;
      const unit = Math.max(w / 720, h / 900) / BLEED;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.uImage, 0);
      gl.uniform2f(uniforms.uSize, w, h);
      gl.uniform2f(uniforms.uImageSize, state.imageWidth, state.imageHeight);
      gl.uniform1f(uniforms.uUnit, unit);
      gl.uniform1f(uniforms.uScale, state.level * s.intensity * 440);
      gl.uniform1f(uniforms.uIdle, s.idle);
      gl.uniform1f(uniforms.uFrequency, s.frequency);
      gl.uniform1i(uniforms.uOctaves, s.octaves);
      gl.uniform1f(uniforms.uSeed, s.seed);
      gl.uniform1f(uniforms.uRadius, Math.min(300, (s.radius * (w / Math.max(1, canvas.clientWidth))) / unit));
      gl.uniform1f(uniforms.uTime, state.time);
      gl.uniform1f(uniforms.uFlow, reduce ? 0 : s.flow);
      gl.uniform1f(uniforms.uChroma, s.chroma);
      gl.uniform1f(uniforms.uGray, s.grayscale ? 1 : 0);
      gl.uniform1f(uniforms.uReady, state.ready ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = now => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      state.time += dt;

      const speed = Math.hypot(state.cursorX - state.lastX, state.cursorY - state.lastY) / dt;
      state.lastX = state.cursorX;
      state.lastY = state.cursorY;

      let nx = 0;
      let ny = 0;
      if (s.scope === 'card') {
        if (state.hovered) {
          const rect = root.getBoundingClientRect();
          nx = clamp(((state.cursorX - rect.left) / Math.max(1, rect.width)) * 2 - 1, -1, 1);
          ny = clamp(((state.cursorY - rect.top) / Math.max(1, rect.height)) * 2 - 1, -1, 1);
        }
      } else if (state.seen) {
        nx = clamp((state.cursorX / Math.max(1, window.innerWidth)) * 2 - 1, -1, 1);
        ny = clamp((state.cursorY / Math.max(1, window.innerHeight)) * 2 - 1, -1, 1);
      }
      const follow = 1 - Math.exp(-dt / 0.16);
      const targetX = reduce ? 0 : soften(nx * 120, s.travel);
      const targetY = reduce ? 0 : soften(ny * 120, s.travel);
      const targetRotate = reduce ? 0 : nx * s.tilt;
      state.x += (targetX - state.x) * follow;
      state.y += (targetY - state.y) * follow;
      state.rotate += (targetRotate - state.rotate) * follow;

      const active = s.scope === 'window' || state.hovered;
      let wanted = active ? clamp(speed / (2400 - 2100 * s.sensitivity), 0, 1) ** 2 : 0;
      if (state.hovered) wanted = Math.max(wanted, s.hoverDecay);
      const tau = wanted > state.level ? 0.08 : s.recovery;
      state.level += (wanted - state.level) * (1 - Math.exp(-dt / tau));

      root.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${state.rotate.toFixed(3)}deg)`;

      const settling =
        Math.abs(targetX - state.x) + Math.abs(targetY - state.y) + Math.abs(targetRotate - state.rotate) > 0.05 ||
        Math.abs(wanted - state.level) > 0.002 ||
        (state.level > 0.002 && s.flow > 0 && !reduce) ||
        speed > 1;
      const animating = s.idle > 0 && !reduce;
      tick = (tick + 1) % 2;
      if (settling || !animating || tick === 0) draw();
      calm = settling ? 0 : calm + dt;
      if (state.visible && (calm < 0.25 || animating)) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !alive || !state.visible) return;
      calm = 0;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      draw();
    };

    loadRef.current = src => {
      state.ready = false;
      draw();
      if (!src) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => {
        if (!alive) return;
        if (!gl || !program) {
          setFallback(true);
          return;
        }
        try {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.generateMipmap(gl.TEXTURE_2D);
          state.imageWidth = img.naturalWidth || 1;
          state.imageHeight = img.naturalHeight || 1;
          state.ready = true;
          setFallback(false);
          draw();
        } catch {
          setFallback(true);
        }
      };
      img.onerror = () => {
        if (alive) setFallback(true);
      };
      img.src = src;
    };

    const onMove = event => {
      state.cursorX = event.clientX;
      state.cursorY = event.clientY;
      if (!state.seen) {
        state.seen = true;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
      }
      wake();
    };
    const onEnter = () => {
      state.hovered = true;
      wake();
    };
    const onLeave = () => {
      state.hovered = false;
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibility = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      if (state.visible) wake();
    });
    visibility.observe(root);
    window.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      loadRef.current = null;
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      if (gl) {
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      }
    };
  }, []);

  useEffect(() => {
    loadRef.current?.(image);
  }, [image]);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div ref={rootRef} className={`${ROOT}${className ? ` ${className}` : ''}`} style={{ width, height, ...style }}>
      <canvas ref={canvasRef} className={CANVAS} aria-hidden="true" />
      {fallback && image && (
        <img
          className={FALLBACK}
          src={image}
          alt=""
          style={{ borderRadius: radius, filter: grayscale ? 'grayscale(1)' : undefined }}
        />
      )}
      {children && <div className={CONTENT}>{children}</div>}
    </div>
  );
};

export default DecayCard;
