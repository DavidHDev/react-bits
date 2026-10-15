import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const LINEAR = `
void main() {
  outColor = vec4(toLinear(texture(uInput, vUv).rgb), 1.0);
}`;

const SHADER = `
uniform sampler2D uBack;
uniform sampler2D uSoft;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uIndex;
uniform float uSpread;
uniform float uHighlight;
uniform float uRim;
uniform float uCaustic;
uniform vec3 uTint;
uniform vec3 uLight;

vec2 mirrorUv(vec2 uv) {
  return 1.0 - abs(1.0 - abs(uv));
}

vec3 sharpAt(vec2 p) {
  return toLinear(texture(uInput, mirrorUv(p / uResolution)).rgb);
}

vec3 backAt(vec2 p) {
  return texture(uBack, mirrorUv(p / uResolution)).rgb;
}

vec3 softAt(vec2 p) {
  return texture(uSoft, mirrorUv(p / uResolution)).rgb;
}

float shadowAt(vec2 d, vec2 dir) {
  vec2 s = d + dir * 0.42;
  vec2 a = vec2(dot(s, dir), dot(s, vec2(-dir.y, dir.x)));
  float e = length(a / vec2(1.08, 0.98));
  float ring = smoothstep(0.55, 0.96, e) * (1.0 - smoothstep(0.96, 1.14, e));
  float body = 1.0 - smoothstep(0.8, 1.12, e);
  return ring * 0.5 + body * 0.2;
}

float causticAt(vec2 d, vec2 dir) {
  vec2 s = d + dir * 1.03;
  vec2 a = vec2(dot(s, dir), dot(s, vec2(-dir.y, dir.x)));
  float core = exp(-dot(a * vec2(13.0, 6.5), a * vec2(13.0, 6.5)));
  float halo = exp(-dot(a * vec2(3.6, 2.4), a * vec2(3.6, 2.4)));
  return core * 1.2 + halo * 0.25;
}

vec2 throughBall(vec3 n1, float index) {
  vec3 t1 = refract(vec3(0.0, 0.0, -1.0), n1, 1.0 / index);
  vec3 s2 = n1 + t1 * (-2.0 * dot(n1, t1));
  vec3 t2 = refract(t1, -s2, index);
  if (dot(t2, t2) < 1e-4) t2 = reflect(t1, -s2);
  float depth = 6.0;
  float k = (-depth - s2.z) / min(t2.z, -0.05);
  return s2.xy + t2.xy * k;
}

void main() {
  vec2 p = vUv * uResolution;
  vec2 d = (p - uCenter) / uRadius;
  float r = length(d);
  float aa = 1.5 / uRadius;
  float inside = 1.0 - smoothstep(1.0 - aa, 1.0, r);
  vec2 dir = normalize(uLight.xy);

  vec3 back = backAt(p);
  back *= 1.0 - shadowAt(d, dir) * uCaustic * 0.5;
  back += vec3(1.0, 0.9, 0.72) * causticAt(d, dir) * uCaustic * 1.6;

  vec3 color = back;
  if (r < 1.0) {
    vec2 dd = d / max(r, 1.0);
    float z = sqrt(max(1.0 - dot(dd, dd), 0.0));
    vec3 n1 = vec3(dd, z);
    vec3 refracted;
    if (uSpread > 0.001) {
      vec2 qr = throughBall(n1, uIndex - uSpread);
      vec2 qg = throughBall(n1, uIndex);
      vec2 qb = throughBall(n1, uIndex + uSpread);
      refracted = vec3(
        sharpAt(uCenter + qr * uRadius).r,
        sharpAt(uCenter + qg * uRadius).g,
        sharpAt(uCenter + qb * uRadius).b
      );
    } else {
      refracted = sharpAt(uCenter + throughBall(n1, uIndex) * uRadius);
    }
    float f0 = pow((uIndex - 1.0) / (uIndex + 1.0), 2.0);
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - z, 5.0);
    refracted *= toLinear(uTint) * (1.0 - fresnel) * (1.0 - 0.45 * smoothstep(0.8, 1.0, r));

    vec3 rv = reflect(vec3(0.0, 0.0, -1.0), n1);
    vec3 env = softAt(uCenter + rv.xy * uRadius * 1.6) * 0.9;
    env += vec3(0.25) * smoothstep(-0.2, 0.8, rv.y);
    vec3 reflection = env * fresnel * (0.4 + 1.6 * uRim);

    vec3 L = normalize(uLight);
    float lobe = max(dot(rv, L), 0.0);
    float spec = exp((lobe - 1.0) * 7.0) * 0.35 + exp((lobe - 1.0) * 38.0) * 0.85 + pow(lobe, 1200.0) * 3.0;
    vec2 exitSpot = -dir * 0.78;
    spec += exp(-dot(d - exitSpot, d - exitSpot) * 60.0) * 0.5;
    vec3 highlight = vec3(spec) * uHighlight;

    float rim = smoothstep(0.92, 0.995, r) * (1.0 - smoothstep(0.995, 1.0, r));
    vec3 rimLight = vec3(rim) * uRim * 0.6;

    float side = dot(d / max(r, 1e-4), -dir);
    float arc = smoothstep(0.3, 0.95, side);
    float band = smoothstep(0.8, 0.955, r) * (1.0 - smoothstep(0.96, 0.995, r));
    float haze = smoothstep(0.5, 0.95, r) * 0.22;
    vec3 inner = vec3(1.0, 0.9, 0.75) * arc * arc * (band * 1.3 + haze) * uCaustic;

    vec3 ball = refracted + reflection + highlight + rimLight + inner;
    color = mix(back, ball, inside);
  }

  outColor = vec4(toGamma(color), 1.0);
}`;

export default {
  id: 'orb',
  name: 'Glass orb',
  category: 'glass',
  blend: 'normal',
  description: 'A crystal ball that flips the scene inside, with rim light, caustics and rainbow edges.',
  animated: true,
  animates: params => params.float > 0,
  params: [
    { key: 'size', label: 'Size', type: 'number', min: 0.1, max: 1.2, step: 0.01, default: 0.72 },
    { key: 'x', label: 'Horizontal', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'y', label: 'Vertical', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'refraction', label: 'Refraction', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'dispersion', label: 'Rainbow edges', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'highlight', label: 'Highlight', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'rim', label: 'Rim light', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'caustic', label: 'Caustic glow', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'tint', label: 'Glass tint', type: 'color', default: '#ffffff' },
    {
      key: 'background',
      label: 'Background',
      type: 'select',
      default: 'blurred',
      options: [
        { value: 'image', label: 'Image' },
        { value: 'blurred', label: 'Blurred' }
      ]
    },
    {
      key: 'blur',
      label: 'Background blur',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.4,
      when: params => params.background === 'blurred'
    },
    { key: 'float', label: 'Float', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const linear = ctx.pass('orb-linear', LINEAR, { input });
    const soft = gaussianBlur(ctx, linear, 14 * ctx.unit);
    const blurred =
      params.background === 'blurred' && params.blur > 0
        ? gaussianBlur(ctx, linear, (2 + 30 * params.blur) * ctx.unit)
        : null;
    const short = Math.min(ctx.width, ctx.height);
    const t = ctx.time;
    const bob = params.float;
    const cx = params.x * ctx.width + Math.sin(t * 0.55) * short * 0.012 * bob;
    const cy = (1 - params.y) * ctx.height + Math.sin(t * 0.9) * short * 0.03 * bob;
    const spin = Math.sin(t * 0.35) * 0.25 * bob;
    const light = [-0.55 + spin, 0.65, 0.55];
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const bend = 0.4 + 4.1 * Math.pow(params.refraction, 1.5);
    const focal = 6 / (1 + bend);
    const index = (2 * focal) / (2 * focal - 1);
    const output = ctx.pass('orb', SHADER, {
      input: source,
      textures: { uBack: blurred || linear, uSoft: soft },
      uniforms: {
        uCenter: [cx, cy],
        uRadius: Math.max(2, params.size * short * 0.5),
        uIndex: index,
        uSpread: (index - 1) * params.dispersion * 0.12,
        uHighlight: params.highlight,
        uRim: params.rim,
        uCaustic: params.caustic,
        uTint: hexToRgb(params.tint),
        uLight: light
      }
    });
    if (blurred) ctx.release(blurred);
    ctx.release(soft);
    ctx.release(linear);
    return output;
  }
};
