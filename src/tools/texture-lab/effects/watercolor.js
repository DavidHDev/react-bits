import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { abstractImage } from './paint';

const WASH = `
uniform sampler2D uSoft;
uniform vec3 uPaper;
uniform float uEdges;
uniform float uGranulation;
uniform float uBleed;
uniform float uLightness;
uniform float uDrift;

float paperNoise(vec2 p) {
  return fbm(p * 0.35) * 0.6 + valueNoise(p * 1.7) * 0.4;
}

void main() {
  vec2 p = vUv * uResolution / max(uUnit, 0.3);
  vec2 bleed = vec2(fbm(p * 0.018 + uDrift), fbm(p * 0.018 + 17.3 - uDrift)) - 0.5;
  vec2 uv = vUv + bleed * uBleed * 14.0 * uUnit / uResolution;
  vec3 wash = toLinear(texture(uInput, uv).rgb);
  vec3 soft = toLinear(texture(uSoft, uv).rgb);

  vec3 paper = toLinear(uPaper);
  vec3 transmit = clamp(wash / max(paper, vec3(0.05)), 0.0, 1.0);
  vec3 density = -log(max(transmit, vec3(0.004)));
  density *= 1.0 - uLightness * 0.55;

  float rim = max(luma(soft) - luma(wash), 0.0);
  density *= 1.0 + smoothstep(0.0, 0.06, rim) * uEdges * 1.1;

  float grain = paperNoise(p);
  float turbulence = fbm(p * 0.01 + 3.7);
  density *= 1.0 + (grain - 0.5) * uGranulation * 1.4 + (turbulence - 0.5) * uGranulation * 0.6;

  vec3 color = paper * exp(-max(density, 0.0));
  float tooth = valueNoise(p * 2.3) - 0.5;
  color *= 1.0 + tooth * 0.05 * uGranulation;
  outColor = vec4(toGamma(color), 1.0);
}`;

export default {
  id: 'watercolor',
  name: 'Watercolor',
  category: 'art',
  description: 'Transparent washes with wet edges and pigment settling into the paper.',
  animated: true,
  animates: params => params.bleed > 0 && params.speed > 0,
  params: [
    { key: 'radius', label: 'Brush', type: 'number', min: 2, max: 24, step: 0.1, default: 9 },
    { key: 'edges', label: 'Wet edges', type: 'number', min: 0, max: 1, step: 0.01, default: 0.65 },
    { key: 'granulation', label: 'Granulation', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'bleed', label: 'Bleed', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'lightness', label: 'Lightness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'paper', label: 'Paper', type: 'color', default: '#fbf7ee' },
    { key: 'speed', label: 'Flow', type: 'number', min: 0, max: 2, step: 0.01, default: 0.3 }
  ],
  render(ctx, input, params) {
    const { painted, tensor } = abstractImage(ctx, input, { radius: params.radius, flow: 0.7, sharpness: 9 });
    ctx.release(tensor);
    const soft = gaussianBlur(ctx, painted, Math.max(1, params.radius * ctx.unit * 0.6));
    const output = ctx.pass('watercolor-wash', WASH, {
      input: painted,
      textures: { uSoft: soft },
      uniforms: {
        uPaper: hexToRgb(params.paper),
        uEdges: params.edges,
        uGranulation: params.granulation,
        uBleed: params.bleed,
        uLightness: params.lightness,
        uDrift: ctx.time * params.speed * 0.05
      }
    });
    ctx.release(painted);
    ctx.release(soft);
    return output;
  }
};
