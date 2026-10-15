const SHADER = `
uniform float uStrength;
uniform float uScale;
uniform float uSpeed;
uniform float uSplit;

vec2 flow(vec2 p, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t * 0.8)));
  vec2 r = vec2(fbm(p + q * 1.7 + vec2(1.7, 9.2) + t * 0.3), fbm(p + q * 1.7 + vec2(8.3, 2.8) - t * 0.25));
  return r - 0.5;
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = vUv * aspect * uScale;
  float t = uTime * uSpeed * 0.2;
  vec2 offset = flow(p, t) * uStrength / aspect;
  vec3 color;
  if (uSplit > 0.0) {
    color.r = texture(uInput, vUv + offset * (1.0 + uSplit * 0.35)).r;
    color.g = texture(uInput, vUv + offset).g;
    color.b = texture(uInput, vUv + offset * (1.0 - uSplit * 0.35)).b;
  } else {
    color = texture(uInput, vUv + offset).rgb;
  }
  outColor = vec4(color, 1.0);
}`;

export default {
  id: 'warp',
  name: 'Warp',
  category: 'distort',
  blend: 'normal',
  description: 'A slow liquid flow that bends the image.',
  animated: true,
  preview: { params: { strength: 0.16 } },
  animates: params => params.speed > 0 && params.strength > 0,
  params: [
    { key: 'strength', label: 'Strength', type: 'number', min: 0, max: 0.4, step: 0.001, default: 0.06 },
    { key: 'scale', label: 'Scale', type: 'number', min: 0.3, max: 8, step: 0.05, default: 2 },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.05, default: 1 },
    { key: 'split', label: 'Color split', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    return ctx.pass('warp', SHADER, {
      input,
      uniforms: { uStrength: params.strength, uScale: params.scale, uSpeed: params.speed, uSplit: params.split }
    });
  }
};
