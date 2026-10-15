const SHADER = `
uniform float uCount;
uniform vec2 uDirection;
uniform float uIntensity;
uniform float uSeed;
uniform float uSpeed;
uniform float uEdges;

float barHash(float x) {
  return (fract(sin(x * 12.9898) * 43758.5453) - 0.5) * 2.0;
}

vec2 edgeUv(vec2 uv) {
  if (uEdges < 0.5) return 1.0 - abs(1.0 - mod(uv, 2.0));
  if (uEdges < 1.5) return clamp(uv, 0.0, 1.0);
  return fract(uv);
}

vec3 sharpSample(vec2 uv) {
  vec2 size = uResolution;
  vec2 pos = uv * size;
  vec2 c = floor(pos - 0.5) + 0.5;
  vec2 f = pos - c;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 t0 = (c - 1.0) / size;
  vec2 t3 = (c + 2.0) / size;
  vec2 t12 = (c + w2 / w12) / size;
  vec3 r = texture(uInput, vec2(t0.x, t0.y)).rgb * w0.x * w0.y;
  r += texture(uInput, vec2(t12.x, t0.y)).rgb * w12.x * w0.y;
  r += texture(uInput, vec2(t3.x, t0.y)).rgb * w3.x * w0.y;
  r += texture(uInput, vec2(t0.x, t12.y)).rgb * w0.x * w12.y;
  r += texture(uInput, vec2(t12.x, t12.y)).rgb * w12.x * w12.y;
  r += texture(uInput, vec2(t3.x, t12.y)).rgb * w3.x * w12.y;
  r += texture(uInput, vec2(t0.x, t3.y)).rgb * w0.x * w3.y;
  r += texture(uInput, vec2(t12.x, t3.y)).rgb * w12.x * w3.y;
  r += texture(uInput, vec2(t3.x, t3.y)).rgb * w3.x * w3.y;
  return max(r, 0.0);
}

vec3 bar(vec2 p, float index, vec2 along, float aspect) {
  float seed = uSeed * 0.137;
  float rest = barHash(index + seed);
  float rate = barHash(index + seed + 42.7);
  float offset = (rest + uTime * uSpeed * rate * 0.2) * uIntensity;
  vec2 q = p + along * offset;
  return sharpSample(edgeUv(vec2(q.x / aspect + 0.5, q.y + 0.5)));
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);
  vec2 along = vec2(-uDirection.y, uDirection.x);
  float coord = dot(p, uDirection) * uCount / max(aspect, 1.0);
  float index = floor(coord);
  float f = coord - index;
  float footprint = max(length(vec2(dFdx(coord), dFdy(coord))), 1e-5);
  vec3 color = bar(p, index, along, aspect);
  float lower = f / footprint;
  float upper = (1.0 - f) / footprint;
  if (lower < 0.5) color = mix(bar(p, index - 1.0, along, aspect), color, lower + 0.5);
  else if (upper < 0.5) color = mix(bar(p, index + 1.0, along, aspect), color, upper + 0.5);
  outColor = vec4(color, 1.0);
}`;

const EDGES = { mirror: 0, stretch: 1, repeat: 2 };

export default {
  id: 'bars',
  name: 'Bar shift',
  category: 'glitch',
  blend: 'normal',
  description: 'Slices the picture into parallel bars and slides each one by its own amount.',
  animated: true,
  animates: params => params.speed > 0 && params.intensity > 0,
  params: [
    { key: 'count', label: 'Bars', type: 'number', min: 1, max: 30, step: 1, default: 6 },
    { key: 'angle', label: 'Angle', type: 'number', min: 0, max: 180, step: 1, default: 0 },
    { key: 'intensity', label: 'Shift', type: 'number', min: 0, max: 1, step: 0.01, default: 0.15 },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 2, step: 0.05, default: 0.5 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 },
    {
      key: 'edges',
      label: 'Edges',
      type: 'select',
      default: 'mirror',
      options: [
        { value: 'mirror', label: 'Mirror' },
        { value: 'stretch', label: 'Stretch' },
        { value: 'repeat', label: 'Repeat' }
      ]
    }
  ],
  render(ctx, input, params) {
    const angle = (params.angle * Math.PI) / 180;
    return ctx.pass('bars', SHADER, {
      input,
      uniforms: {
        uCount: params.count,
        uDirection: [Math.cos(angle), Math.sin(angle)],
        uIntensity: params.intensity,
        uSeed: params.variation,
        uSpeed: params.speed,
        uEdges: EDGES[params.edges] ?? 0
      }
    });
  }
};
