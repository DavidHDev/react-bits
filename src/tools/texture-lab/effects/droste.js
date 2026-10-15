const SHADER = `
uniform vec2 uCenter;
uniform vec4 uExtent;
uniform float uShape;
uniform float uRadius;
uniform float uLogScale;
uniform vec2 uBeta;
uniform vec2 uShift;
uniform float uBlend;
uniform float uDepth;
uniform float uSwirl;
uniform float uStretch;

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

float frameNorm(vec2 q) {
  if (uShape < 0.5) return length(q) / uRadius;
  vec2 f = abs(q / vec2(q.x > 0.0 ? uExtent.y : uExtent.x, q.y > 0.0 ? uExtent.w : uExtent.z));
  if (uShape < 1.5) return length(f);
  return max(f.x, f.y);
}

vec3 photo(vec2 q, float lod) {
  vec2 uv = clamp((uCenter + q) / uResolution, 0.0, 1.0);
  return textureLod(uInput, uv, max(lod, 0.0)).rgb;
}

void main() {
  vec2 q = vUv * uResolution - uCenter;
  float r = max(length(q), 1e-3);
  float lr = log(r / uRadius);
  vec2 w = cmul(vec2(lr, atan(q.y, q.x)), uBeta) + uShift;
  w.y -= uSwirl * lr;
  vec2 q2 = exp(w.x) * uRadius * vec2(cos(w.y), sin(w.y));
  float level = log(max(frameNorm(q2), 1e-9)) / uLogScale;
  float k = floor(level) + 1.0;
  float u = level - k + 1.0;
  vec2 q1 = q2 * exp(-k * uLogScale);
  float stretch = uStretch * uRadius * exp(w.x - k * uLogScale) / r;
  float lod = log2(max(stretch, 1e-6));
  vec3 color = photo(q1, lod);
  float aa = 1.5 * length(uBeta) / (r * uLogScale);
  float m = smoothstep(1.0 - max(uBlend, aa), 1.0, u);
  if (m > 0.0) color = mix(color, photo(q1 * exp(-uLogScale), lod - uLogScale / log(2.0)), m);
  float levels = max(0.0, log(uRadius / r) / uLogScale);
  color *= exp(-levels * uDepth * 0.9);
  outColor = vec4(color, 1.0);
}`;

const SHAPES = { circle: 0, oval: 1, frame: 2 };

export default {
  id: 'droste',
  name: 'Droste',
  category: 'distort',
  blend: 'normal',
  description: 'The picture spirals into a smaller copy of itself, again and again, like an Escher print.',
  animated: true,
  animates: params => params.zoom !== 0 || params.spin !== 0,
  params: [
    {
      key: 'shape',
      label: 'Shape',
      type: 'select',
      default: 'circle',
      options: [
        { value: 'circle', label: 'Circle' },
        { value: 'oval', label: 'Oval' },
        { value: 'frame', label: 'Picture frame' }
      ]
    },
    { key: 'scale', label: 'Ring scale', type: 'number', min: 1.5, max: 10, step: 0.05, default: 2.6 },
    { key: 'arms', label: 'Spiral arms', type: 'number', min: -3, max: 3, step: 1, default: 1 },
    { key: 'twist', label: 'Twist', type: 'number', min: -1, max: 2, step: 0.01, default: 1 },
    { key: 'repeats', label: 'Copies per turn', type: 'number', min: 1, max: 4, step: 1, default: 1 },
    { key: 'x', label: 'Horizontal center', type: 'number', min: 0.05, max: 0.95, step: 0.01, default: 0.5 },
    { key: 'y', label: 'Vertical center', type: 'number', min: 0.05, max: 0.95, step: 0.01, default: 0.5 },
    { key: 'rotation', label: 'Rotation', type: 'number', min: -180, max: 180, step: 1, default: 0 },
    { key: 'blend', label: 'Seam blend', type: 'number', min: 0, max: 1, step: 0.01, default: 0.1 },
    { key: 'depth', label: 'Depth shade', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { key: 'zoom', label: 'Zoom speed', type: 'number', min: -1, max: 1, step: 0.01, default: 0.2 },
    { key: 'spin', label: 'Spin', type: 'number', min: -1, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const cx = params.x * ctx.width;
    const cy = (1 - params.y) * ctx.height;
    const extent = [cx, ctx.width - cx, cy, ctx.height - cy];
    const logScale = Math.log(Math.max(params.scale, 1.05));
    const arms = Math.round(params.arms);
    const repeats = Math.max(1, Math.round(params.repeats));
    const wrap = (value, period) => ((value % period) + period) % period;
    const zoom = -wrap(ctx.time * params.zoom * logScale * 0.35, logScale);
    const turn = wrap((params.rotation * Math.PI) / 180 + ctx.time * params.spin * 0.6, Math.PI * 2);
    const lean = (arms * logScale) / (2 * Math.PI);
    const swirl = params.twist * 0.8 * (arms < 0 ? -1 : 1);
    const sum = 2 * repeats * repeats + lean * lean + (lean + swirl) * (lean + swirl);
    const det = repeats * repeats + lean * (lean + swirl);
    const stretch = Math.sqrt((sum + Math.sqrt(Math.max(sum * sum - 4 * det * det, 0))) / 2);
    return ctx.pass('droste', SHADER, {
      input: source,
      uniforms: {
        uCenter: [cx, cy],
        uExtent: extent,
        uShape: SHAPES[params.shape] ?? 0,
        uRadius: Math.max(1, Math.min(...extent)),
        uLogScale: logScale,
        uBeta: [repeats, -lean],
        uShift: [zoom, turn],
        uBlend: params.blend * 0.5,
        uDepth: params.depth,
        uSwirl: swirl,
        uStretch: stretch
      }
    });
  }
};
