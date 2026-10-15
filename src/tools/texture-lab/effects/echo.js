import { hexToRgb } from '../engine/assets';

const TRAIL = `
uniform float uPersistence;
uniform vec2 uSpread;
uniform vec2 uDrift;
uniform float uZoom;
uniform float uHue;

vec4 decayed(sampler2D history, vec2 uv) {
  vec2 b = (uv - 0.5) / max(uZoom, 0.01) + 0.5 - uDrift;
  vec4 sum = texture(history, b - uSpread);
  sum += texture(history, b + vec2(uSpread.x, -uSpread.y));
  sum += texture(history, b + vec2(-uSpread.x, uSpread.y));
  sum += texture(history, b + uSpread);
  vec4 trail = sum * 0.25 * uPersistence;
  if (uHue != 0.0 && trail.a > 0.0001) {
    vec3 hsv = rgb2hsv(trail.rgb / trail.a);
    trail.rgb = hsv2rgb(vec3(fract(hsv.x + uHue), hsv.y, hsv.z)) * trail.a;
  }
  return trail;
}
`;

const LIVE = `
uniform float uLod;
void main() {
  outColor = vec4(textureLod(uInput, vUv, uLod).rgb, 1.0);
}`;

const CLEAR = `
void main() {
  outColor = vec4(0.0);
}`;

const STEP = `
uniform sampler2D uLive;
uniform sampler2D uPrevious;
uniform float uThreshold;
uniform float uStamp;
${TRAIL}
void main() {
  vec4 trail = decayed(uInput, vUv);
  vec3 live = texture(uLive, vUv).rgb;
  vec3 previous = texture(uPrevious, vUv).rgb;
  float change = dot(abs(live - previous), vec3(0.299, 0.587, 0.114));
  float m = smoothstep(uThreshold, uThreshold * 2.0 + 0.001, change);
  vec3 s = live * m;
  vec3 rgb = s + trail.rgb * (1.0 - m);
  if (uStamp > 1.5) rgb = s + trail.rgb;
  else if (uStamp > 0.5) rgb = s + trail.rgb - s * trail.rgb;
  outColor = vec4(rgb, m + trail.a * (1.0 - m));
}`;

const COMPOSITE = `
uniform sampler2D uHistory;
uniform float uOpacity;
uniform float uBlend;
uniform float uTint;
uniform vec3 uColor;
${TRAIL}
vec3 blendWith(vec3 b, vec3 s) {
  if (uBlend < 0.5) return s;
  if (uBlend < 1.5) return b + s;
  if (uBlend < 2.5) return 1.0 - (1.0 - b) * (1.0 - s);
  if (uBlend < 3.5) return b * s;
  if (uBlend < 4.5) return max(b, s);
  if (uBlend < 5.5) return min(b, s);
  return abs(b - s);
}

void main() {
  vec3 live = texture(uInput, vUv).rgb;
  vec4 trail = decayed(uHistory, vUv);
  if (uTint > 0.5 && uTint < 1.5) {
    float a = max(trail.a, 0.0001);
    float lum = dot(trail.rgb / a, vec3(0.299, 0.587, 0.114));
    trail.rgb = uColor * lum * 1.5 * trail.a;
  }
  vec3 straight = trail.a > 0.001 ? trail.rgb / trail.a : vec3(0.0);
  float alpha = clamp(trail.a, 0.0, 1.0) * uOpacity;
  outColor = vec4(blendWith(live, straight) * alpha + live * (1.0 - alpha), 1.0);
}`;

const BLENDS = { normal: 0, add: 1, screen: 2, multiply: 3, lighten: 4, darken: 5, difference: 6 };
const TINTS = { none: 0, color: 1, rainbow: 2 };
const MAX_SIDE = 1600;
const MAX_JUMP = 0.5;

const destroy = (gl, target) => {
  gl.deleteTexture(target.texture);
  gl.deleteFramebuffer(target.fbo);
};

const allocate = (ctx, state) => {
  const scale = Math.min(1, MAX_SIDE / Math.max(ctx.width, ctx.height));
  const w = Math.max(1, Math.round(ctx.width * scale));
  const h = Math.max(1, Math.round(ctx.height * scale));
  const key = `${ctx.width}x${ctx.height}`;
  if (state.key === key && state.history) return false;
  [...(state.history || []), ...(state.live || [])].forEach(target => ctx.release(target));
  state.history = [ctx.engine.target(w, h), ctx.engine.target(w, h)];
  state.live = [ctx.engine.target(w, h, { float: false }), ctx.engine.target(w, h, { float: false })];
  state.key = key;
  state.lod = Math.log2(1 / scale);
  return true;
};

export default {
  id: 'echo',
  name: 'Echo',
  category: 'glitch',
  blend: 'normal',
  description: 'Anything that moves leaves a soft, fading trail, like a long exposure.',
  animated: false,
  params: [
    { key: 'length', label: 'Trail length', type: 'number', min: 0.05, max: 4, step: 0.01, default: 1 },
    { key: 'threshold', label: 'Motion threshold', type: 'number', min: 0.01, max: 0.5, step: 0.01, default: 0.06 },
    { key: 'softness', label: 'Softness', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { key: 'opacity', label: 'Trail opacity', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    {
      key: 'blend',
      label: 'Trail blend',
      type: 'select',
      default: 'normal',
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'add', label: 'Add' },
        { value: 'screen', label: 'Screen' },
        { value: 'multiply', label: 'Multiply' },
        { value: 'lighten', label: 'Lighten' },
        { value: 'darken', label: 'Darken' },
        { value: 'difference', label: 'Difference' }
      ]
    },
    {
      key: 'tint',
      label: 'Trail color',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: 'Original' },
        { value: 'color', label: 'Single color' },
        { value: 'rainbow', label: 'Rainbow' }
      ]
    },
    { key: 'color', label: 'Color', type: 'color', default: '#33aaff', when: params => params.tint === 'color' },
    { key: 'drift', label: 'Drift', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    {
      key: 'angle',
      label: 'Drift angle',
      type: 'number',
      min: 0,
      max: 360,
      step: 1,
      default: 90,
      when: params => params.drift > 0
    },
    { key: 'zoom', label: 'Zoom', type: 'number', min: -1, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params, state) {
    const elapsed = ctx.time - state.time;
    const resized = allocate(ctx, state);
    const reset = resized || !(elapsed >= 0) || elapsed > MAX_JUMP;
    const source = state.lod > 0 && !input.mipmapped ? ctx.mipmap(input) : input;
    const sample = (target, lod) => ctx.pass('echo-live', LIVE, { input: source, target, uniforms: { uLod: lod } });
    if (reset) {
      state.history.forEach(target => ctx.pass('echo-clear', CLEAR, { target }));
      sample(state.live[0], state.lod);
      state.current = 0;
      state.dt = 0;
    }
    const advance = !reset && elapsed > 1e-6;
    const dt = advance ? elapsed : state.dt;
    const read = reset || advance ? state.current : 1 - state.current;
    const write = 1 - read;

    const spread = params.softness * 2 * Math.sqrt(Math.max(dt, 0) * 60);
    const angle = (params.angle * Math.PI) / 180;
    const drift = params.drift * 500 * dt;
    const blend = BLENDS[params.blend] ?? 0;
    const tint = TINTS[params.tint] ?? 0;
    const trail = {
      uPersistence: Math.exp(-dt / Math.max(params.length, 0.001)),
      uSpread: [(spread * ctx.unit) / ctx.width, (spread * ctx.unit) / ctx.height],
      uDrift: [(Math.cos(angle) * drift * ctx.unit) / ctx.width, (Math.sin(angle) * drift * ctx.unit) / ctx.height],
      uZoom: Math.pow(1 + params.zoom * 0.03, dt * 60),
      uHue: tint === 2 ? 0.35 * dt : 0
    };

    sample(state.live[write], state.lod);
    ctx.pass('echo-step', STEP, {
      input: state.history[read],
      target: state.history[write],
      textures: { uLive: state.live[write], uPrevious: state.live[read] },
      uniforms: { ...trail, uThreshold: params.threshold, uStamp: blend === 2 ? 1 : blend === 1 ? 2 : 0 }
    });
    const output = ctx.pass('echo-composite', COMPOSITE, {
      input,
      textures: { uHistory: state.history[read] },
      uniforms: { ...trail, uOpacity: params.opacity, uBlend: blend, uTint: tint, uColor: hexToRgb(params.color) }
    });

    state.current = write;
    state.time = ctx.time;
    state.dt = dt;
    return output;
  },
  dispose(gl, state) {
    [...(state.history || []), ...(state.live || [])].forEach(target => destroy(gl, target));
    state.history = null;
    state.live = null;
    state.key = null;
  }
};
