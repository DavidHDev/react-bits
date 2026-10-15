import { hexToRgb } from '../engine/assets';

const SHADER = `
uniform vec2 uAnchor;
uniform float uSpread;
uniform float uIntensity;
uniform float uStreaks;
uniform vec3 uHot;
uniform vec3 uMid;
uniform vec3 uFringe;
uniform vec4 uDrift;
uniform float uClock;

vec3 ramp(float heat) {
  float toMid = smoothstep(0.0, 0.5, heat);
  float toHot = smoothstep(0.55, 1.15, heat);
  return mix(mix(uFringe, uMid, toMid), uHot, toHot) * clamp(heat, 0.0, 1.6);
}

float band(float u, float center, float width) {
  return exp(-(u - center) * (u - center) / (width * width));
}

void main() {
  vec2 frame = uResolution / min(uResolution.x, uResolution.y);
  vec2 p = vUv * frame;
  vec2 anchor = uAnchor * frame;
  vec2 toCenter = frame * 0.5 - anchor;
  float reach = length(toCenter);
  vec2 dir = reach < 0.02 ? vec2(1.0, 0.0) : toCenter / max(reach, 0.001);
  vec2 rel = p - anchor;
  float u = dot(rel, dir);
  float v = rel.y * dir.x - rel.x * dir.y;

  float sp = max(uSpread, 0.05);
  float elong = sp * (1.5 + 0.7 * uDrift.z);
  float du = u / sp;
  float dv = v / elong;
  float r2 = du * du + dv * dv;
  float core = exp(-r2 * 1.9);
  float shoulder = exp(-r2 * 0.45) * 0.22;

  float along = exp(-dv * dv * 0.55);
  float c1 = sp * (0.42 + 0.22 * uDrift.y);
  float w1 = max(sp * (0.07 + 0.07 * uDrift.w), 0.008);
  float c2 = sp * (0.8 + 0.3 * uDrift.y);
  float w2 = max(sp * (0.16 + 0.12 * uDrift.w), 0.015);
  float streaks = (band(u, c1, w1) + band(u, c2, w2) * 0.45) * along * uStreaks;

  float heat = (core * 1.25 + shoulder + streaks * 0.85) * uIntensity * 2.2 * uDrift.x;
  heat = max(heat + (hash12(vUv * 1024.0 + vec2(uClock, uClock * 1.7)) - 0.5) * 0.012, 0.0);
  vec3 leak = vec3(ramp(heat * 1.08).r, ramp(heat).g, ramp(heat * 0.88).b);

  vec3 base = clamp(toLinear(texture(uInput, vUv).rgb), 0.0, 1.0);
  vec3 screened = 1.0 - (1.0 - base) * (1.0 - clamp(leak, 0.0, 1.0));
  vec3 color = clamp(screened + leak * 0.16, 0.0, 1.0);
  outColor = vec4(toGamma(color), 1.0);
}`;

const ANCHORS = {
  right: [0.95, 0.4],
  'top-right': [0.9, 0.1],
  top: [0.6, 0.04],
  'top-left': [0.1, 0.1],
  left: [0.05, 0.4],
  'bottom-left': [0.1, 0.9],
  bottom: [0.4, 0.96],
  'bottom-right': [0.9, 0.9]
};

const hash = (x, y) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return h - Math.floor(h);
};

const noise = (x, y) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};

const linear = hex => hexToRgb(hex).map(c => Math.pow(c, 2.2));

export default {
  id: 'leak',
  name: 'Light leak',
  category: 'light',
  blend: 'normal',
  description: 'Warm overexposed light bleeding in from one edge, with streak bands, color fringes and slow breathing.',
  animated: true,
  preview: { params: { intensity: 0.42, spread: 0.6 } },
  animates: params => params.speed > 0 && params.intensity > 0,
  params: [
    {
      key: 'position',
      label: 'Position',
      type: 'select',
      default: 'right',
      options: [
        { value: 'right', label: 'Right' },
        { value: 'top-right', label: 'Top right' },
        { value: 'top', label: 'Top' },
        { value: 'top-left', label: 'Top left' },
        { value: 'left', label: 'Left' },
        { value: 'bottom-left', label: 'Bottom left' },
        { value: 'bottom', label: 'Bottom' },
        { value: 'bottom-right', label: 'Bottom right' }
      ]
    },
    { key: 'intensity', label: 'Intensity', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { key: 'spread', label: 'Spread', type: 'number', min: 0.1, max: 1.5, step: 0.01, default: 0.45 },
    { key: 'streaks', label: 'Streaks', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'hot', label: 'Core', type: 'color', default: '#fff3c4' },
    { key: 'mid', label: 'Color', type: 'color', default: '#ff7a2f' },
    { key: 'fringe', label: 'Fringe', type: 'color', default: '#a63d8f' },
    { key: 'flicker', label: 'Flicker', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 4, step: 0.05, default: 1 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const seed = params.variation;
    const t = ctx.time * params.speed * 0.6 + seed * 7.9;
    const breathe = noise(t * 0.9, seed * 0.53 + 11.7) * 0.65 + noise(t * 2.7 + 41.3, seed * 0.29 + 5.1) * 0.35;
    const flicker = 1 + (0.25 + 1.5 * breathe - 1) * params.flicker;
    const drift = [
      flicker,
      noise(t * 0.13 + 3.1, seed * 0.41 + 27),
      noise(t * 0.09 + 17.7, seed * 0.61 + 8.4),
      noise(t * 0.17 + 51.2, seed * 0.23 + 2.9)
    ];
    const [x, y] = ANCHORS[params.position] || ANCHORS.right;
    return ctx.pass('light-leak', SHADER, {
      input,
      uniforms: {
        uAnchor: [x, 1 - y],
        uSpread: params.spread,
        uIntensity: params.intensity,
        uStreaks: params.streaks,
        uHot: linear(params.hot),
        uMid: linear(params.mid),
        uFringe: linear(params.fringe),
        uDrift: drift,
        uClock: t
      }
    });
  }
};
