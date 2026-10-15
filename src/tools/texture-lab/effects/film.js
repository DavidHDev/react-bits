const SHADER = `
uniform float uWeave;
uniform float uFlicker;
uniform float uDust;
uniform float uScratches;
uniform float uSeed;
uniform float uFade;
uniform float uWarmth;

void main() {
  vec2 weave = (vec2(hash11(uSeed), hash11(uSeed + 3.1)) - 0.5) * vec2(0.6, 1.0) * uWeave * 3.0 * uUnit / uResolution;
  vec3 color = texture(uInput, vUv + weave).rgb;
  color *= 1.0 + (hash11(uSeed * 1.7 + 0.3) - 0.5) * uFlicker * 0.16;

  vec2 grid = uResolution / max(uUnit * 46.0, 8.0);
  vec2 p = vUv * grid;
  vec2 cell = floor(p);
  vec2 f = fract(p);
  float h = hash12(cell + uSeed * 1.31);
  if (h < uDust * 0.09) {
    vec2 center = 0.2 + hash22(cell + uSeed * 2.07) * 0.6;
    float size = mix(0.04, 0.16, hash12(cell + uSeed * 3.3));
    vec2 d = (f - center) * vec2(1.0, mix(0.5, 1.8, hash12(cell + 9.1)));
    float hair = abs(d.y + sin(d.x * 18.0 + h * 40.0) * 0.05);
    float speck = h < uDust * 0.06 ? smoothstep(size, size * 0.35, length(d)) : smoothstep(0.012, 0.0, hair) * step(abs(d.x), size * 2.5);
    vec3 tone = h < uDust * 0.03 ? vec3(0.02) : vec3(0.96, 0.94, 0.9);
    color = mix(color, tone, speck * 0.85);
  }

  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float epoch = floor(uTime * 0.6 + fi * 0.37);
    float alive = step(0.45, hash11(epoch * 3.1 + fi));
    float x = hash11(epoch * 7.3 + fi * 11.0) + sin(uTime * 3.0 + fi) * 0.002;
    float width = (0.6 + hash11(epoch + fi) * 1.2) * uUnit / uResolution.x;
    float line = smoothstep(width, 0.0, abs(vUv.x - x)) * alive * (0.6 + hash11(uSeed + fi) * 0.4);
    color = mix(color, color * 0.55 + vec3(0.18), line * uScratches);
  }

  color = color * (1.0 - uFade * 0.16) + vec3(0.05, 0.04, 0.035) * uFade;
  color *= vec3(1.0 + uWarmth * 0.06, 1.0, 1.0 - uWarmth * 0.08);
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

export default {
  id: 'film',
  name: 'Film',
  category: 'film',
  blend: 'normal',
  description: 'Projector weave, flicker, dust and scratches.',
  animated: true,
  preview: { params: { dust: 1, scratches: 0.9, fade: 0.5 } },
  animates: () => true,
  params: [
    { key: 'weave', label: 'Gate weave', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'flicker', label: 'Flicker', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'dust', label: 'Dust', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'scratches', label: 'Scratches', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'fade', label: 'Fade', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'warmth', label: 'Warmth', type: 'number', min: -1, max: 1, step: 0.01, default: 0.25 },
    { key: 'fps', label: 'Frame rate', type: 'number', min: 6, max: 30, step: 1, default: 18 }
  ],
  render(ctx, input, params) {
    const seed = (Math.floor(ctx.time * params.fps) % 997) * 1.371 + 0.5;
    return ctx.pass('film', SHADER, {
      input,
      uniforms: {
        uWeave: params.weave,
        uFlicker: params.flicker,
        uDust: params.dust,
        uScratches: params.scratches,
        uSeed: seed,
        uFade: params.fade,
        uWarmth: params.warmth
      }
    });
  }
};
