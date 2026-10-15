import { hexToRgb } from '../engine/assets';

const SHADER = `
uniform vec3 uShadowTone;
uniform vec3 uHighlightTone;
uniform float uBalance;
uniform float uSplit;
uniform float uCurve;
uniform float uBlacks;
uniform float uRolloff;
uniform float uSaturation;
uniform float uSkin;

vec3 rolloff(vec3 c, float knee) {
  vec3 over = max(c - knee, 0.0);
  return min(c, vec3(knee)) + (1.0 - knee) * (1.0 - exp(-over / max(1.0 - knee, 1e-3)));
}

void main() {
  vec3 color = texture(uInput, vUv).rgb;
  float l = luma(color);
  vec3 hsv = rgb2hsv(color);
  float skin = smoothstep(0.12, 0.02, abs(hsv.x - 0.07)) * smoothstep(0.1, 0.3, hsv.y) * uSkin;
  float w = smoothstep(0.05, 0.95, clamp(l + uBalance * 0.35, 0.0, 1.0));
  vec3 shadowTint = uShadowTone - luma(uShadowTone);
  vec3 highlightTint = uHighlightTone - luma(uHighlightTone);
  vec3 tint = shadowTint * (1.0 - w) * (1.0 - w) + highlightTint * w * w;
  color += tint * uSplit * 0.75 * (1.0 - skin * 0.7);
  color = clamp(color, 0.0, 1.0);
  vec3 s = color * color * (3.0 - 2.0 * color);
  color = mix(color, s, uCurve);
  color = uBlacks >= 0.0 ? color * (1.0 - uBlacks) + uBlacks : max(color + uBlacks, 0.0) / (1.0 + uBlacks);
  color = mix(color, rolloff(color, 0.62), uRolloff);
  color = mix(vec3(luma(color)), color, uSaturation);
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

export default {
  id: 'grade',
  name: 'Color grade',
  category: 'color',
  blend: 'normal',
  description: 'Split toning and a film curve, from teal and orange to bleach bypass.',
  animated: false,
  params: [
    { key: 'shadows', label: 'Shadow tone', type: 'color', default: '#1f7a8c' },
    { key: 'highlights', label: 'Highlight tone', type: 'color', default: '#ffa45c' },
    { key: 'split', label: 'Toning', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    { key: 'balance', label: 'Balance', type: 'number', min: -1, max: 1, step: 0.01, default: 0 },
    { key: 'curve', label: 'Film curve', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'blacks', label: 'Blacks', type: 'number', min: -0.2, max: 0.2, step: 0.005, default: 0.03 },
    { key: 'rolloff', label: 'Highlight rolloff', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'saturation', label: 'Saturation', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { key: 'skin', label: 'Protect skin', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 }
  ],
  render(ctx, input, params) {
    return ctx.pass('grade', SHADER, {
      input,
      uniforms: {
        uShadowTone: hexToRgb(params.shadows),
        uHighlightTone: hexToRgb(params.highlights),
        uSplit: params.split,
        uBalance: params.balance,
        uCurve: params.curve,
        uBlacks: params.blacks,
        uRolloff: params.rolloff,
        uSaturation: params.saturation,
        uSkin: params.skin
      }
    });
  }
};
