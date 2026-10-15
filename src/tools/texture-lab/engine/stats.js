const STATS = `
uniform vec2 uStep;

void main() {
  vec3 c = texture(uInput, vUv + uStep * vec2(-0.25, -0.25)).rgb;
  c += texture(uInput, vUv + uStep * vec2(0.25, -0.25)).rgb;
  c += texture(uInput, vUv + uStep * vec2(-0.25, 0.25)).rgb;
  c += texture(uInput, vUv + uStep * vec2(0.25, 0.25)).rgb;
  float l = luma(c * 0.25);
  outColor = vec4(l, l * l, 0.0, 1.0);
}`;

const SIZE = 64;

export function imageStats(ctx, input) {
  const target = ctx.pass('image-stats', STATS, {
    input,
    target: ctx.target(SIZE, SIZE),
    uniforms: { uStep: [1 / SIZE, 1 / SIZE] }
  });
  ctx.mipmap(target);
  return { target, top: Math.log2(SIZE) };
}

export const STATS_GLSL = `
uniform sampler2D uStats;
uniform float uStatsTop;

float autoLevel(float value) {
  vec2 moments = textureLod(uStats, vec2(0.5), uStatsTop).rg;
  float spread = sqrt(max(moments.y - moments.x * moments.x, 1e-5));
  return clamp((value - moments.x) / (spread * 4.2) + 0.5, 0.0, 1.0);
}
`;
