const SHADER = `
uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;
uniform float uVibrance;
uniform float uTemperature;
uniform float uTint;
uniform float uHighlights;
uniform float uShadows;
uniform float uFade;
uniform float uSharpen;

void main() {
  vec3 color = texture(uInput, vUv).rgb;
  if (uSharpen > 0.0) {
    vec2 t = 1.0 / uResolution;
    vec3 blur = (
      texture(uInput, vUv + vec2(t.x, 0.0)).rgb +
      texture(uInput, vUv - vec2(t.x, 0.0)).rgb +
      texture(uInput, vUv + vec2(0.0, t.y)).rgb +
      texture(uInput, vUv - vec2(0.0, t.y)).rgb
    ) * 0.25;
    color += (color - blur) * uSharpen * 1.5;
  }

  vec3 linear = toLinear(color) * exp2(uExposure);
  linear *= vec3(1.0 + uTemperature * 0.28 + uTint * 0.08, 1.0 - uTint * 0.16, 1.0 - uTemperature * 0.32 + uTint * 0.08);
  color = toGamma(linear);

  float l = luma(color);
  float shadowMask = 1.0 - smoothstep(0.0, 0.55, l);
  float highlightMask = smoothstep(0.45, 1.0, l);
  color += color * uShadows * shadowMask * 0.9 + uShadows * shadowMask * 0.06;
  color += (uHighlights > 0.0 ? (1.0 - color) : color) * uHighlights * highlightMask * 0.6;

  color = (color - 0.5) * uContrast + 0.5;

  float gray = luma(color);
  color = mix(vec3(gray), color, uSaturation);
  float chroma = max(color.r, max(color.g, color.b)) - min(color.r, min(color.g, color.b));
  color = mix(vec3(luma(color)), color, 1.0 + uVibrance * (1.0 - clamp(chroma * 1.6, 0.0, 1.0)));

  color = color * (1.0 - uFade * 0.22) + uFade * 0.09;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

export default {
  id: 'adjust',
  name: 'Adjust',
  category: 'color',
  blend: 'normal',
  description: 'Exposure, contrast, color balance and tone.',
  animated: false,
  preview: { params: { contrast: 1.25, saturation: 1.5, temperature: 0.35 } },
  params: [
    { key: 'exposure', label: 'Exposure', type: 'number', min: -2, max: 2, step: 0.01, default: 0 },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { key: 'saturation', label: 'Saturation', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { key: 'vibrance', label: 'Vibrance', type: 'number', min: -1, max: 1, step: 0.01, default: 0 },
    { key: 'temperature', label: 'Temperature', type: 'number', min: -1, max: 1, step: 0.01, default: 0 },
    { key: 'tint', label: 'Tint', type: 'number', min: -1, max: 1, step: 0.01, default: 0 },
    { key: 'highlights', label: 'Highlights', type: 'number', min: -1, max: 1, step: 0.01, default: 0 },
    { key: 'shadows', label: 'Shadows', type: 'number', min: -1, max: 1, step: 0.01, default: 0 },
    { key: 'fade', label: 'Fade', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'sharpen', label: 'Sharpen', type: 'number', min: 0, max: 2, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    return ctx.pass('adjust', SHADER, {
      input,
      uniforms: {
        uExposure: params.exposure,
        uContrast: params.contrast,
        uSaturation: params.saturation,
        uVibrance: params.vibrance,
        uTemperature: params.temperature,
        uTint: params.tint,
        uHighlights: params.highlights,
        uShadows: params.shadows,
        uFade: params.fade,
        uSharpen: params.sharpen
      }
    });
  }
};
