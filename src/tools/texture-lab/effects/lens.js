const SHADER = `
uniform float uDistortion;
uniform float uChroma;
uniform float uVignette;
uniform float uVignetteSize;
uniform float uSoftness;
uniform float uZoom;

vec2 distort(vec2 uv, float k) {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 c = (uv - 0.5) * aspect;
  float r2 = dot(c, c);
  c *= (1.0 + k * r2) / uZoom;
  return c / aspect + 0.5;
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  float r = length((vUv - 0.5) * aspect);
  float edge = smoothstep(0.15, 0.85, r);
  float lod = edge * uSoftness * 4.0;
  vec2 uvG = distort(vUv, uDistortion);
  vec2 uvR = distort(vUv, uDistortion + uChroma * 0.06);
  vec2 uvB = distort(vUv, uDistortion - uChroma * 0.06);
  vec3 color = vec3(
    textureLod(uInput, uvR, lod).r,
    textureLod(uInput, uvG, lod).g,
    textureLod(uInput, uvB, lod).b
  );
  float vig = 1.0 - smootherstep(uVignetteSize * 0.55, uVignetteSize * 0.55 + 0.6, r);
  color *= mix(1.0, vig, uVignette);
  outColor = vec4(color, 1.0);
}`;

export default {
  id: 'lens',
  name: 'Lens',
  category: 'lens',
  blend: 'normal',
  description: 'Barrel distortion, soft corners, edge fringes and vignette.',
  animated: false,
  preview: { params: { distortion: 0.3, chroma: 0.9, vignette: 0.9 } },
  params: [
    { key: 'distortion', label: 'Distortion', type: 'number', min: -0.6, max: 0.6, step: 0.01, default: 0.12 },
    { key: 'chroma', label: 'Edge fringes', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'softness', label: 'Soft corners', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'vignette', label: 'Vignette', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'vignetteSize', label: 'Vignette size', type: 'number', min: 0.2, max: 1.5, step: 0.01, default: 0.85 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const k = params.distortion;
    return ctx.pass('lens', SHADER, {
      input: source,
      uniforms: {
        uDistortion: k,
        uChroma: params.chroma,
        uVignette: params.vignette,
        uVignetteSize: params.vignetteSize,
        uSoftness: params.softness,
        uZoom: k > 0 ? 1 + k * 0.42 : 1 + k * 0.05
      }
    });
  }
};
