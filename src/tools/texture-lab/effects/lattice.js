import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const SHADER = `
uniform sampler2D uTone;
uniform float uPitch;
uniform float uAngle;
uniform float uBend;
uniform float uWidth;
uniform float uWeight;
uniform float uWeave;
uniform float uDepth;
uniform float uMode;
uniform vec3 uWarpColor;
uniform vec3 uWeftColor;
uniform vec3 uGround;
uniform float uContrast;
uniform float uRipple;
uniform float uPhase;
uniform float uLod;

float toneOf(vec3 c) {
  float l = clamp((luma(c) - 0.5) * uContrast + 0.5, 0.0, 1.0);
  return mix(l, 1.0 - l, smoothstep(0.35, 0.65, luma(uGround)));
}

float over(float i, float j) {
  if (uWeave < 0.5) return mod(i + j, 2.0) < 0.5 ? 1.0 : -1.0;
  if (uWeave < 1.5) return mod(i + j, 4.0) < 1.5 ? 1.0 : -1.0;
  return mod(floor(i * 0.5) + floor(j * 0.5), 2.0) < 0.5 ? 1.0 : -1.0;
}

vec3 vivid(vec3 c, float tone) {
  vec3 hsv = rgb2hsv(c);
  float dark = smoothstep(0.35, 0.65, luma(uGround));
  float value = mix(0.1 + 0.9 * pow(tone, 0.9), 0.9 - 0.75 * pow(tone, 0.9), dark);
  return hsv2rgb(vec3(hsv.x, clamp(hsv.y * mix(0.5, 1.45, smoothstep(0.04, 0.45, tone)), 0.0, 1.0), value));
}

void main() {
  vec2 p = vUv * uResolution;
  vec3 soft = texture(uTone, vUv).rgb;
  float tone = toneOf(soft);
  vec2 q = rotation(uAngle) * (p - 0.5 * uResolution) / uPitch;
  float bend = (luma(soft) - 0.5) * uBend;
  q += vec2(bend, -bend);
  if (uRipple > 0.0) {
    q.x += sin(q.y * 0.21 + uPhase * 1.3) * uRipple * 0.9 + sin(q.y * 0.07 - uPhase * 0.7 + q.x * 0.05) * uRipple * 1.4;
    q.y += sin(q.x * 0.17 - uPhase * 1.1) * uRipple * 0.9 + sin(q.x * 0.06 + uPhase * 0.6 - q.y * 0.04) * uRipple * 1.4;
  }
  vec2 aa = max(fwidth(q), vec2(1e-4)) * 0.8;

  float i = floor(q.x);
  float fu = q.x - i - 0.5;
  float j = floor(q.y);
  float fv = q.y - j - 0.5;
  float jv = floor(q.y - 0.5);
  float rv = q.y - 0.5 - jv;
  float iu = floor(q.x - 0.5);
  float ru = q.x - 0.5 - iu;
  float hw = mix(over(i, jv), over(i, jv + 1.0), smoothstep(0.0, 1.0, rv));
  float hf = -mix(over(iu, j), over(iu + 1.0, j), smoothstep(0.0, 1.0, ru));
  float sw = (over(i, jv + 1.0) - over(i, jv)) * 6.0 * rv * (1.0 - rv);
  float sf = -(over(iu + 1.0, j) - over(iu, j)) * 6.0 * ru * (1.0 - ru);

  float w = uWidth * mix(1.0, 0.12 + 0.88 * tone, uWeight) * 0.5;
  float cw = smoothstep(w + aa.x, w - aa.x, abs(fu)) * clamp(w / aa.x, 0.0, 1.0);
  float cf = smoothstep(w + aa.y, w - aa.y, abs(fv)) * clamp(w / aa.y, 0.0, 1.0);

  vec3 image = textureLod(uInput, vUv, uLod).rgb;
  vec3 baseWarp = uWarpColor * (0.08 + 0.92 * tone);
  vec3 baseWeft = uWeftColor * (0.08 + 0.92 * tone);
  if (uMode < 0.5) {
    baseWarp = vivid(image, tone);
    baseWeft = baseWarp * 0.9;
  }

  vec3 light = normalize(vec3(-0.45, 0.55, 0.7));
  float xw = clamp(fu / max(w, 1e-3), -1.0, 1.0);
  vec3 nw = normalize(vec3(xw, -sw * 0.35, sqrt(max(1.0 - xw * xw, 0.0)) + 0.05));
  float xf = clamp(fv / max(w, 1e-3), -1.0, 1.0);
  vec3 nf = normalize(vec3(-sf * 0.35, xf, sqrt(max(1.0 - xf * xf, 0.0)) + 0.05));
  mat2 back = rotation(-uAngle);
  nw.xy = back * nw.xy;
  nf.xy = back * nf.xy;
  float dw = 0.4 + 0.6 * max(dot(nw, light), 0.0);
  float df = 0.4 + 0.6 * max(dot(nf, light), 0.0);
  float ow = 0.55 + 0.45 * (hw * 0.5 + 0.5);
  float of = 0.55 + 0.45 * (hf * 0.5 + 0.5);
  float shadeW = mix(1.0, dw * ow * 1.3, uDepth);
  float shadeF = mix(1.0, df * of * 1.3, uDepth);
  vec3 warpColor = baseWarp * shadeW;
  vec3 weftColor = baseWeft * shadeF;

  float gap = 1.0 - uDepth * 0.5 * max(smoothstep(w + 0.25, w, abs(fu)), smoothstep(w + 0.25, w, abs(fv)));
  vec3 color = uGround * gap;
  float warpTop = smoothstep(-0.15, 0.15, hw - hf);
  vec3 under = mix(warpColor, weftColor, warpTop);
  float underCover = mix(cw, cf, warpTop);
  under *= 1.0 - uDepth * 0.45 * smoothstep(w + 0.22, w, mix(abs(fv), abs(fu), warpTop));
  color = mix(color, under, underCover);
  vec3 top = mix(weftColor, warpColor, warpTop);
  float topCover = mix(cf, cw, warpTop);
  color = mix(color, top, topCover);
  outColor = vec4(color, 1.0);
}`;

const WEAVES = { plain: 0, twill: 1, basket: 2 };

export default {
  id: 'lattice',
  name: 'Lattice',
  category: 'geometric',
  description: 'An over-and-under woven lattice that bends and shades with the picture.',
  animated: true,
  preview: { zoom: 2 },
  animates: params => params.ripple > 0,
  params: [
    {
      key: 'weave',
      label: 'Weave',
      type: 'select',
      default: 'plain',
      options: [
        { value: 'plain', label: 'Plain' },
        { value: 'twill', label: 'Twill' },
        { value: 'basket', label: 'Basket' }
      ]
    },
    { key: 'size', label: 'Thread spacing', type: 'number', min: 4, max: 60, step: 0.5, default: 18 },
    { key: 'width', label: 'Thread width', type: 'number', min: 0.2, max: 1, step: 0.01, default: 0.72 },
    { key: 'weight', label: 'Width by tone', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'bend', label: 'Bend', type: 'number', min: 0, max: 6, step: 0.01, default: 3 },
    { key: 'angle', label: 'Angle', type: 'number', min: 0, max: 90, step: 1, default: 0 },
    { key: 'depth', label: 'Depth', type: 'number', min: 0, max: 1, step: 0.01, default: 0.7 },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.5, max: 2.5, step: 0.01, default: 1.15 },
    {
      key: 'color',
      label: 'Thread color',
      type: 'select',
      default: 'image',
      options: [
        { value: 'image', label: 'From image' },
        { value: 'custom', label: 'Two colors' }
      ]
    },
    {
      key: 'warpColor',
      label: 'Vertical threads',
      type: 'color',
      default: '#f1e7d4',
      when: params => params.color === 'custom'
    },
    {
      key: 'weftColor',
      label: 'Horizontal threads',
      type: 'color',
      default: '#d2563b',
      when: params => params.color === 'custom'
    },
    { key: 'ground', label: 'Background', type: 'color', default: '#0b0a0e' },
    { key: 'ripple', label: 'Ripple', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const pitch = Math.max(2, params.size * ctx.unit);
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const tone = gaussianBlur(ctx, input, pitch * 0.9);
    const output = ctx.pass('lattice', SHADER, {
      input: source,
      textures: { uTone: tone },
      uniforms: {
        uPitch: pitch,
        uAngle: (params.angle * Math.PI) / 180,
        uBend: params.bend,
        uWidth: params.width,
        uWeight: params.weight,
        uWeave: WEAVES[params.weave] ?? 0,
        uDepth: params.depth,
        uMode: params.color === 'custom' ? 1 : 0,
        uWarpColor: hexToRgb(params.warpColor),
        uWeftColor: hexToRgb(params.weftColor),
        uGround: hexToRgb(params.ground),
        uContrast: params.contrast,
        uRipple: params.ripple,
        uPhase: ctx.time,
        uLod: Math.max(0, Math.log2(pitch * 0.25))
      }
    });
    ctx.release(tone);
    return output;
  }
};
