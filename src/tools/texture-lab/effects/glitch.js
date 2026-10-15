const SHADER = `
uniform float uAmount;
uniform float uBlocks;
uniform float uSplit;
uniform float uSeed;
uniform float uActive;
uniform float uColorGlitch;

void main() {
  vec2 uv = vUv;
  float gate = uActive;
  float rows = mix(6.0, 28.0, hash11(uSeed * 1.3));
  float row = floor(uv.y * rows);
  float rowHash = hash12(vec2(row, uSeed));
  float slice = step(1.0 - uAmount * 0.55 * gate, rowHash);
  uv.x += (hash12(vec2(row, uSeed + 4.1)) - 0.5) * 0.18 * slice * uAmount;

  vec2 grid = vec2(mix(4.0, 18.0, hash11(uSeed + 7.0)), mix(8.0, 30.0, hash11(uSeed + 9.0)));
  vec2 block = floor(vUv * grid);
  float blockHash = hash12(block + uSeed * 3.17);
  float hit = step(1.0 - uBlocks * 0.35 * gate, blockHash);
  vec2 jump = (hash22(block + uSeed) - 0.5) * vec2(0.24, 0.06);
  uv += jump * hit;

  float split = uSplit * (0.004 + gate * 0.02) * (0.4 + slice * 1.6);
  vec3 color;
  color.r = texture(uInput, uv + vec2(split, 0.0)).r;
  color.g = texture(uInput, uv).g;
  color.b = texture(uInput, uv - vec2(split, split * 0.4)).b;

  if (hit > 0.5 && hash12(block + uSeed * 1.7) < uColorGlitch) {
    float mode = hash12(block + uSeed * 2.3);
    if (mode < 0.33) color = color.brg;
    else if (mode < 0.66) color = 1.0 - color;
    else color = vec3(step(0.5, luma(color))) * vec3(0.9, 1.0, 0.95);
  }
  float scan = step(0.985, hash12(vec2(floor(vUv.y * uResolution.y / max(uUnit, 1.0)), uSeed))) * gate;
  color = mix(color, vec3(hash12(vUv * uResolution + uSeed)), scan * 0.6);
  outColor = vec4(color, 1.0);
}`;

export default {
  id: 'glitch',
  name: 'Glitch',
  category: 'glitch',
  blend: 'normal',
  description: 'Bursts of sliced rows, jumping blocks and split color.',
  animated: true,
  preview: { params: { amount: 0.85, blocks: 0.7, split: 1, frequency: 1 } },
  animates: () => true,
  params: [
    { key: 'amount', label: 'Slices', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'blocks', label: 'Blocks', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'split', label: 'Color split', type: 'number', min: 0, max: 1.5, step: 0.01, default: 0.6 },
    { key: 'colorGlitch', label: 'Color errors', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { key: 'frequency', label: 'Frequency', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'speed', label: 'Speed', type: 'number', min: 0.2, max: 3, step: 0.05, default: 1 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 7 }
  ],
  render(ctx, input, params) {
    const tick = Math.floor(ctx.time * 14 * params.speed);
    const burstWindow = Math.floor(ctx.time * 2.2 * params.speed);
    const chance = Math.sin(burstWindow * 12.9898 + params.variation * 78.233) * 43758.5453;
    const burst = chance - Math.floor(chance) < params.frequency ? 1 : 0;
    const active = Math.max(0.12, burst);
    return ctx.pass('glitch', SHADER, {
      input,
      uniforms: {
        uAmount: params.amount,
        uBlocks: params.blocks,
        uSplit: params.split,
        uSeed: (tick % 251) * 1.618 + params.variation * 3.1,
        uActive: active,
        uColorGlitch: params.colorGlitch
      }
    });
  }
};
