const LUMA_TABLE = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51,
  87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99
];

const CHROMA_TABLE = [
  17,
  18,
  24,
  47,
  99,
  99,
  99,
  99,
  18,
  21,
  26,
  66,
  99,
  99,
  99,
  99,
  24,
  26,
  56,
  99,
  99,
  99,
  99,
  99,
  47,
  66,
  99,
  99,
  99,
  99,
  99,
  99,
  ...Array(32).fill(99)
];

const SAMPLE = `
uniform float uCell;
uniform vec2 uImage;
uniform float uLod;

vec3 tap(vec2 p) {
  return textureLod(uInput, vec2(p.x / uImage.x, 1.0 - p.y / uImage.y), uLod).rgb;
}

void main() {
  vec2 center = (floor(gl_FragCoord.xy) + 0.5) * uCell;
  float q = uCell * 0.25;
  vec3 c = (tap(center + vec2(-q, -q)) + tap(center + vec2(q, -q)) + tap(center + vec2(-q, q)) + tap(center + vec2(q, q))) * 0.25;
  outColor = vec4(
    dot(c, vec3(0.299, 0.587, 0.114)) - 0.5,
    dot(c, vec3(-0.168736, -0.331264, 0.5)),
    dot(c, vec3(0.5, -0.418688, -0.081312)),
    1.0
  );
}`;

const ROWS = `
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  int u = p.x % 8;
  int start = p.x - u;
  vec3 sum = vec3(0.0);
  for (int x = 0; x < 8; x++) {
    sum += texelFetch(uInput, ivec2(start + x, p.y), 0).rgb * cos(float((2 * x + 1) * u) * PI / 16.0);
  }
  outColor = vec4(sum, 1.0);
}`;

const QUANTIZE = `
uniform vec4 uLumaSteps[16];
uniform vec4 uChromaSteps[16];

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  int u = p.x % 8;
  int v = p.y % 8;
  int start = p.y - v;
  vec3 sum = vec3(0.0);
  for (int y = 0; y < 8; y++) {
    sum += texelFetch(uInput, ivec2(p.x, start + y), 0).rgb * cos(float((2 * y + 1) * v) * PI / 16.0);
  }
  float cu = u == 0 ? 0.70710678 : 1.0;
  float cv = v == 0 ? 0.70710678 : 1.0;
  vec3 coefficient = sum * 0.25 * cu * cv;
  int index = v * 8 + u;
  float lumaStep = uLumaSteps[index / 4][index % 4];
  float chromaStep = uChromaSteps[index / 4][index % 4];
  vec3 q = vec3(lumaStep, chromaStep, chromaStep);
  vec3 kept = floor(coefficient / q + 0.5) * q;
  outColor = vec4(kept * cu * cv, 1.0);
}`;

const COLUMNS = `
uniform float uBlock;

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float cell = uBlock / 8.0;
  float top = uResolution.y - gl_FragCoord.y;
  float block = floor(top / uBlock);
  float local = top / cell - block * 8.0 - 0.5;
  int start = int(block) * 8;
  vec3 sum = vec3(0.0);
  for (int v = 0; v < 8; v++) {
    sum += texelFetch(uInput, ivec2(p.x, start + v), 0).rgb * cos((2.0 * local + 1.0) * float(v) * PI / 16.0);
  }
  outColor = vec4(sum, 1.0);
}`;

const DECODE = `
uniform sampler2D uChroma;
uniform vec2 uBlocks;

vec3 decodeRow(sampler2D partial, float size) {
  float cell = size / 8.0;
  float block = floor(gl_FragCoord.x / size);
  float local = gl_FragCoord.x / cell - block * 8.0 - 0.5;
  int start = int(block) * 8;
  int row = int(gl_FragCoord.y);
  vec3 sum = vec3(0.0);
  for (int u = 0; u < 8; u++) {
    sum += texelFetch(partial, ivec2(start + u, row), 0).rgb * cos((2.0 * local + 1.0) * float(u) * PI / 16.0);
  }
  return sum * 0.25;
}

void main() {
  float y = decodeRow(uInput, uBlocks.x).x + 0.5;
  vec2 c = decodeRow(uChroma, uBlocks.y).yz;
  vec3 rgb = vec3(y + 1.402 * c.y, y - 0.344136 * c.x - 0.714136 * c.y, y + 1.772 * c.x);
  outColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
}`;

const BLEED = { low: 1, medium: 2, high: 4 };

const steps = (table, quality) => {
  const q = Math.min(Math.max(quality, 1), 100);
  const scale = q < 50 ? 5000 / q : 200 - q * 2;
  const values = table.map(base => Math.min(Math.max(Math.floor((scale * base + 50) / 100), 1), 255) / 255);
  return Array.from({ length: 16 }, (_, index) => values.slice(index * 4, index * 4 + 4));
};

const encode = (ctx, source, block, quality) => {
  const cell = block / 8;
  const cols = Math.ceil(ctx.width / block) * 8;
  const rows = Math.ceil(ctx.height / block) * 8;
  const samples = ctx.pass('jpeg-sample', SAMPLE, {
    input: source,
    size: [cols, rows],
    uniforms: { uCell: cell, uImage: [ctx.width, ctx.height], uLod: Math.log2(Math.max(cell * 0.5, 1)) }
  });
  const frequencies = ctx.pass('jpeg-rows', ROWS, { input: samples, size: [cols, rows] });
  ctx.release(samples);
  const coefficients = ctx.pass('jpeg-quantize', QUANTIZE, {
    input: frequencies,
    size: [cols, rows],
    uniforms: { uLumaSteps: steps(LUMA_TABLE, quality), uChromaSteps: steps(CHROMA_TABLE, quality) }
  });
  ctx.release(frequencies);
  const partial = ctx.pass('jpeg-columns', COLUMNS, {
    input: coefficients,
    size: [cols, ctx.height],
    uniforms: { uBlock: block }
  });
  ctx.release(coefficients);
  return partial;
};

export default {
  id: 'jpeg',
  name: 'Compression',
  category: 'glitch',
  blend: 'normal',
  description: 'Heavy JPEG compression: blocky 8×8 tiles, ringing around edges and smeared color.',
  animated: false,
  params: [
    { key: 'quality', label: 'Quality', type: 'number', min: 1, max: 100, step: 1, default: 12 },
    { key: 'size', label: 'Block size', type: 'number', min: 4, max: 64, step: 1, default: 16 },
    {
      key: 'bleed',
      label: 'Color bleed',
      type: 'select',
      default: 'medium',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const block = Math.max(8, params.size * ctx.unit);
    const factor = BLEED[params.bleed] ?? 2;
    const luma = encode(ctx, source, block, params.quality);
    const chroma = factor === 1 ? luma : encode(ctx, source, block * factor, params.quality);
    const output = ctx.pass('jpeg-decode', DECODE, {
      input: luma,
      textures: { uChroma: chroma },
      uniforms: { uBlocks: [block, block * factor] }
    });
    ctx.release(luma);
    if (chroma !== luma) ctx.release(chroma);
    return output;
  }
};
