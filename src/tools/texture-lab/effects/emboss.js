import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { imageStats } from '../engine/stats';

const SHADE = `
uniform sampler2D uFine;
uniform sampler2D uBroad;
uniform sampler2D uStats;
uniform float uStatsTop;
uniform float uMaterial;
uniform float uSign;
uniform vec3 uTint;
uniform float uImage;
uniform float uDepth;
uniform float uLight;
uniform float uTexture;
uniform float uShadow;

float spread;

float heightAt(vec2 uv) {
  float fine = luma(texture(uFine, uv).rgb);
  float broad = luma(texture(uBroad, uv).rgb);
  return uSign * (fine - broad) / spread;
}

float grain(vec2 p) {
  if (uMaterial < 0.5) {
    return valueNoise(vec2(p.x * 0.02, p.y * 1.3)) * 0.12 + valueNoise(vec2(p.x * 0.07, p.y * 3.4) + 5.0) * 0.05;
  }
  if (uMaterial < 1.5) {
    return valueNoise(p * 0.5) * 0.22 + valueNoise(rotation(0.7) * p * 1.3 + 7.0) * 0.1 + valueNoise(p * vec2(0.18, 1.5) + 3.0) * 0.06;
  }
  return fbm(p * 0.07) * 2.6 + valueNoise(p * 0.55 + 11.0) * 0.35 + valueNoise(p * 1.7 + 4.0) * 0.12;
}

void main() {
  vec2 moments = textureLod(uStats, vec2(0.5), uStatsTop).rg;
  spread = max(sqrt(max(moments.y - moments.x * moments.x, 0.0)), 0.08) * 4.0;
  vec2 t = 1.0 / uResolution;
  float h = heightAt(vUv);
  float hl = heightAt(vUv - vec2(t.x, 0.0));
  float hr = heightAt(vUv + vec2(t.x, 0.0));
  float hd = heightAt(vUv - vec2(0.0, t.y));
  float hu = heightAt(vUv + vec2(0.0, t.y));
  vec2 slope = vec2(hr - hl, hu - hd) * 0.5 * uDepth;
  slope /= 1.0 + length(slope) * 0.45;
  vec2 p = vUv * uResolution / max(uUnit, 0.25);
  float gx = grain(p + vec2(0.4, 0.0)) - grain(p - vec2(0.4, 0.0));
  float gy = grain(p + vec2(0.0, 0.4)) - grain(p - vec2(0.0, 0.4));
  slope += vec2(gx, gy) / 0.8 * uTexture;
  vec3 n = normalize(vec3(-slope, 1.0));
  float elevation = uMaterial < 0.5 ? 0.62 : 0.72;
  vec3 light = normalize(vec3(cos(uLight) * cos(elevation), sin(uLight) * cos(elevation), sin(elevation)));
  float lambert = max(dot(n, light), 0.0) / light.z;

  vec2 toward = vec2(cos(uLight), sin(uLight)) * t * uUnit * 1.6;
  float occluded = 0.0;
  for (int i = 1; i <= 6; i++) {
    float k = float(i);
    float rise = heightAt(vUv + toward * k) - h;
    occluded = max(occluded, rise * uDepth / (k * uUnit * 1.6) - tan(elevation) * 0.35);
  }
  float shadow = 1.0 - smoothstep(0.0, 0.9, occluded) * uShadow;
  float cavity = clamp((hl + hr + hd + hu - 4.0 * h) * uDepth * 0.35, -1.0, 1.0);

  vec3 base;
  float diffuse;
  float shine;
  float gloss;
  if (uMaterial < 0.5) {
    base = vec3(0.776, 0.792, 0.824);
    diffuse = 0.85;
    shine = 0.55;
    gloss = 34.0;
  } else if (uMaterial < 1.5) {
    base = vec3(0.95, 0.935, 0.905);
    diffuse = 0.8;
    shine = 0.04;
    gloss = 6.0;
  } else {
    base = vec3(0.87, 0.85, 0.82);
    diffuse = 0.9;
    shine = 0.02;
    gloss = 4.0;
  }
  vec3 image = textureLod(uInput, vUv, 0.0).rgb;
  vec3 albedo = mix(base, image, uImage) * uTint;
  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, halfway), 0.0), gloss) - pow(halfway.z, gloss);
  float lit = 1.0 + (lambert - 1.0) * diffuse;
  lit = lit > 1.0 ? 1.0 + 0.3 * (1.0 - exp((1.0 - lit) / 0.3)) : 0.14 + 0.86 * max(lit, 0.0);
  lit *= shadow;
  lit *= 1.0 - max(cavity, 0.0) * (uMaterial > 1.5 ? 0.35 : 0.15);
  float glint = 0.3 * (1.0 - exp(-max(spec, 0.0) * shine / 0.3));
  vec3 color = albedo * lit + vec3(glint) * shadow;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

const MATERIALS = { metal: 0, paper: 1, plaster: 2 };

export default {
  id: 'emboss',
  name: 'Emboss',
  category: 'material',
  blend: 'normal',
  description: 'The picture pressed into metal, paper or plaster as raised or sunken relief.',
  animated: false,
  preview: { zoom: 2.5, params: { depth: 0.75 } },
  params: [
    {
      key: 'material',
      label: 'Material',
      type: 'select',
      default: 'metal',
      options: [
        { value: 'metal', label: 'Metal' },
        { value: 'paper', label: 'Paper' },
        { value: 'plaster', label: 'Plaster' }
      ]
    },
    {
      key: 'direction',
      label: 'Relief',
      type: 'select',
      default: 'raised',
      options: [
        { value: 'raised', label: 'Raised' },
        { value: 'pressed', label: 'Pressed in' }
      ]
    },
    { key: 'tint', label: 'Tint', type: 'color', default: '#ffffff' },
    { key: 'imageColor', label: 'Keep image color', type: 'boolean', default: false },
    { key: 'depth', label: 'Depth', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'detail', label: 'Detail', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'light', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 135 },
    { key: 'shadow', label: 'Shadows', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'texture', label: 'Surface texture', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const fineSigma = (2.6 - 2.1 * params.detail) * ctx.unit;
    const fine = gaussianBlur(ctx, source, fineSigma);
    const broad = gaussianBlur(ctx, source, 40 * ctx.unit, { maxSigma: 4 });
    const stats = imageStats(ctx, source);
    const output = ctx.pass('emboss', SHADE, {
      input: source,
      textures: { uFine: fine, uBroad: broad, uStats: stats.target },
      uniforms: {
        uStatsTop: stats.top,
        uMaterial: MATERIALS[params.material] ?? 0,
        uSign: params.direction === 'pressed' ? -1 : 1,
        uTint: hexToRgb(params.tint),
        uImage: params.imageColor ? 1 : 0,
        uDepth: (1.5 + 22 * params.depth) * ctx.unit,
        uLight: (params.light * Math.PI) / 180,
        uTexture: params.texture,
        uShadow: params.shadow
      }
    });
    ctx.release(fine);
    ctx.release(broad);
    ctx.release(stats.target);
    return output;
  }
};
