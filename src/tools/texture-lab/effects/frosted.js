import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const LINEAR = `
void main() {
  outColor = vec4(toLinear(texture(uInput, vUv).rgb), 1.0);
}`;

const SHADER = `
uniform sampler2D uBlur;
uniform float uTexture;
uniform float uScatter;
uniform float uSize;
uniform vec3 uTint;
uniform float uHaze;
uniform float uClear;
uniform float uClearSize;
uniform float uClock;
uniform float uSeed;

vec2 mirrorUv(vec2 uv) {
  return 1.0 - abs(1.0 - abs(uv));
}

vec3 sharpAt(vec2 p) {
  vec2 uv = mirrorUv(vec2(p.x / uResolution.x, 1.0 - p.y / uResolution.y));
  return toLinear(texture(uInput, uv).rgb);
}

vec3 frostAt(vec2 p) {
  vec2 uv = mirrorUv(vec2(p.x / uResolution.x, 1.0 - p.y / uResolution.y));
  return texture(uBlur, uv).rgb;
}

float dimples(vec2 q) {
  vec2 i = floor(q);
  vec2 f = fract(q);
  float sum = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec3 h = hash32(i + g + uSeed * 17.0);
      vec2 r = g + 0.1 + 0.8 * h.xy - f;
      float size = 0.75 + 0.5 * h.z;
      sum += exp(-7.0 * dot(r, r) / (size * size));
    }
  }
  return -log(sum + 1e-4) / 7.0;
}

float ripples(vec2 q) {
  vec2 w = vec2(fbm(q * 0.31 + uSeed), fbm(q * 0.31 + vec2(9.2, 3.7) + uSeed));
  float a = sin(q.y * 1.05 + w.x * 5.0 + sin(q.x * 0.37) * 1.2);
  float b = sin(dot(q, vec2(0.55, 0.62)) * 1.4 + w.y * 4.0);
  return a * 0.65 + b * 0.35;
}

float surface(vec2 q) {
  if (uTexture < 1.5) return dimples(q) + 0.35 * dimples(q * 2.3 + 11.0);
  return ripples(q);
}

vec2 slope(vec2 q, float e) {
  float h = surface(q);
  return vec2(surface(q + vec2(e, 0.0)) - h, surface(q + vec2(0.0, e)) - h) / e;
}

float dripPath(float y, float id) {
  return (valueNoise(vec2(y * 0.012, id * 13.1)) - 0.5) * 22.0 + (valueNoise(vec2(y * 0.06, id * 7.3)) - 0.5) * 4.0;
}

vec4 drop(vec2 d, vec2 radii) {
  vec2 n = d / radii;
  float r2 = dot(n, n);
  if (r2 >= 1.0) return vec4(0.0);
  float aa = 1.5 / (uUnit * min(radii.x, radii.y));
  float mask = 1.0 - smoothstep(1.0 - aa, 1.0, sqrt(r2));
  return vec4(n, mask, r2);
}

void lensDrop(vec4 b, float radius, float power, float amount, inout vec2 offset, inout float clear, inout float shade, inout float glint) {
  float m = b.z * amount;
  if (m <= 0.0) return;
  clear = max(clear, m);
  offset = mix(offset, -b.xy * radius * power, m);
  float weight = smoothstep(1.5, 8.0, radius);
  float rim = smoothstep(0.45, 1.0, b.w);
  float dark = 1.0 - (0.3 + 0.45 * weight) * rim * clamp(0.55 + b.y * 0.6, 0.0, 1.0);
  dark += 0.6 * smoothstep(0.55, 0.95, b.w) * smoothstep(0.3, 0.9, b.y) * (1.0 - smoothstep(0.95, 1.0, b.w));
  shade = mix(shade, dark, m);
  float spot = mix(0.42, 0.2, weight);
  float key = smoothstep(spot, 0.0, length(b.xy - vec2(-0.3, -0.42)));
  float bounce = 0.4 * smoothstep(0.3, 0.0, length(b.xy - vec2(0.2, 0.62)));
  glint = max(glint, m * (key + bounce * weight));
}

void drips(vec2 q, float H, inout vec2 offset, inout float clear, inout float shade, inout float glint) {
  float spacing = mix(170.0, 44.0, uClearSize);
  float col = floor(q.x / spacing);
  for (int k = -1; k <= 1; k++) {
    float c = col + float(k);
    vec3 r = hash32(vec2(c * 1.13 + 0.7, uSeed * 1.37 + 3.1));
    if (r.z > 0.8) continue;
    float life = uClock * mix(0.12, 0.26, r.x) + r.y;
    float cycle = floor(life);
    float phase = fract(life);
    vec3 s = hash32(vec2(c * 3.7 + 1.3, cycle * 1.91 + uSeed));
    float id = c * 7.0 + cycle * 3.0;
    float x0 = (c + 0.3 + 0.4 * s.x) * spacing;
    float start = (s.y * 0.7 - 0.1) * H;
    float travel = H * 1.25;
    float headY = start + travel * (phase + 0.0239 * sin(phase * TAU * 6.0));
    float radius = mix(10.0, 17.0, s.z);
    float fade = smoothstep(0.0, 0.04, phase) * (1.0 - smoothstep(0.8, 1.0, phase));
    float px = x0 + dripPath(q.y, id);
    if (q.y > start && q.y < headY) {
      float age = (headY - q.y) / travel;
      float width = radius * mix(0.62, 0.36, smoothstep(0.0, 0.4, age));
      width *= 0.8 + 0.4 * valueNoise(vec2(q.y * 0.12, id));
      float dx = abs(q.x - px);
      float aa = 1.0 / uUnit;
      float trail = 1.0 - smoothstep(width - aa, width + aa, dx);
      trail *= (1.0 - smoothstep(0.3, 0.85, age)) * smoothstep(0.0, radius, q.y - start) * fade;
      clear = max(clear, trail);
      float edge = smoothstep(width - 2.5, width, dx) * trail;
      shade = mix(shade, 0.72, edge);
      float pitch = radius * 2.0;
      float slot = floor(q.y / pitch);
      float bead = hash12(vec2(slot, id));
      if (bead > 0.4 && trail > 0.0) {
        float by = (slot + 0.3 + 0.4 * fract(bead * 9.1)) * pitch;
        float br = radius * mix(0.25, 0.45, fract(bead * 4.7));
        vec4 b = drop(vec2(q.x - x0 - dripPath(by, id), q.y - by), vec2(br * 0.9, br));
        lensDrop(b, br, 2.6, 1.0, offset, clear, shade, glint);
      }
    }
    vec2 hd = vec2(q.x - x0 - dripPath(headY, id), q.y - headY);
    vec2 radii = vec2(radius, radius * mix(1.1, 1.3, s.x));
    hd.x *= 1.0 + 0.3 * clamp(-hd.y / radii.y, 0.0, 1.0);
    vec4 h = drop(hd, radii);
    lensDrop(h, radius, 3.2, fade, offset, clear, shade, glint);
  }
}

void beads(vec2 q, float wiped, inout vec2 offset, inout float clear, inout float shade, inout float glint) {
  float cell = 15.0;
  vec2 i = floor(q / cell);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = i + vec2(float(x), float(y));
      vec3 h = hash32(g + uSeed * 5.31);
      if (h.z > 0.38) continue;
      vec2 center = (g + 0.2 + 0.6 * h.xy) * cell;
      float size = fract(h.z * 7.13);
      float radius = mix(1.8, 7.0, size * size * size);
      vec4 b = drop(q - center, vec2(radius));
      lensDrop(b, radius, 2.4, 1.0 - wiped, offset, clear, shade, glint);
    }
  }
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 q = p / uUnit;
  float H = uResolution.y / uUnit;
  vec2 offset = vec2(0.0);
  float sparkle = 0.0;
  float light = 0.0;

  if (uTexture < 0.5) {
    vec2 g = q / max(uSize * 0.13, 0.5);
    vec2 n = vec2(valueNoise(g + uSeed), valueNoise(g + vec2(31.7, 17.3) + uSeed)) - 0.5;
    n += 0.7 * (vec2(valueNoise(g * 2.1 + 5.1), valueNoise(g * 2.1 + 41.9)) - 0.5);
    n += 0.5 * (vec2(valueNoise(g * 0.31 + 9.7), valueNoise(g * 0.31 + 63.1)) - 0.5);
    offset = n * uScatter * 14.0;
    sparkle = valueNoise(g * 1.6 + 77.0) - 0.5 + 0.6 * (valueNoise(g * 3.3 + 13.0) - 0.5);
    sparkle *= 0.5;
  } else {
    float scale = uTexture < 1.5 ? uSize * 0.8 : uSize * 2.2;
    vec2 g = q / max(scale, 1.0);
    vec2 s = slope(g, 0.03);
    offset = -s * uScatter * scale * (uTexture < 1.5 ? 1.6 : 0.55);
    vec3 normal = normalize(vec3(-s * (uTexture < 1.5 ? 0.5 : 0.4), 1.0));
    vec3 L = normalize(vec3(-0.45, -0.6, 0.65));
    light = (dot(normal, L) / L.z - 1.0) * 0.35;
    float spec = pow(max(dot(reflect(-L, normal), vec3(0.0, 0.0, 1.0)), 0.0), 60.0);
    light += spec * 0.9;
    sparkle = (valueNoise(q * 0.9 + uSeed) - 0.5) * 0.12;
  }

  vec3 color = frostAt(p + offset * uUnit);
  color *= 1.0 + sparkle * uScatter + light * uScatter;
  vec3 tint = toLinear(uTint);
  color *= tint;
  color = mix(color, color * 0.55 + 0.32 * tint, uHaze);

  if (uClear > 0.5) {
    float clear = 0.0;
    vec2 lens = vec2(0.0);
    float shade = 1.0;
    float glint = 0.0;
    if (uClear < 1.5) {
      drips(q, H, lens, clear, shade, glint);
      beads(q, smoothstep(0.2, 0.6, clear), lens, clear, shade, glint);
    } else if (uClear < 2.5) {
      vec2 c = (p - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(c.y, c.x);
      float r = length(c * vec2(0.82, 1.0));
      float edge = mix(0.1, 0.42, uClearSize) * (1.0 + 0.14 * (fbm(vec2(cos(a), sin(a)) * 1.7 + uSeed) - 0.5));
      float fuzz = 0.035 * (0.6 + 0.8 * valueNoise(q * 0.08));
      clear = 1.0 - smoothstep(edge - fuzz, edge + fuzz, r);
    } else {
      float band = mix(0.06, 0.4, uClearSize) * uResolution.y;
      float d = abs(p.y - 0.5 * uResolution.y) - band;
      clear = 1.0 - smoothstep(-0.75, 0.75, d);
    }
    vec3 clean = sharpAt(p + lens * uUnit) * tint * shade + glint * 1.2;
    color = mix(color, clean, clamp(clear, 0.0, 1.0));
  }

  outColor = vec4(toGamma(color), 1.0);
}`;

const TEXTURES = { frosted: 0, hammered: 1, rippled: 2 };
const TEXTURE_BLUR = { frosted: 1, hammered: 0.55, rippled: 0.6 };
const CLEAR = { none: 0, drips: 1, spot: 2, band: 3 };

export default {
  id: 'frosted',
  name: 'Frosted glass',
  category: 'glass',
  blend: 'normal',
  description: 'Frosted, hammered or rippled glass that softens and scatters the picture, with optional drips.',
  animated: true,
  animates: params => params.clear === 'drips' && params.speed > 0,
  preview: { zoom: 1.5, params: { clear: 'drips', clearSize: 0.8 } },
  params: [
    {
      key: 'texture',
      label: 'Glass',
      type: 'select',
      default: 'frosted',
      options: [
        { value: 'frosted', label: 'Frosted' },
        { value: 'hammered', label: 'Hammered' },
        { value: 'rippled', label: 'Rippled' }
      ]
    },
    { key: 'frost', label: 'Frost', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'scatter', label: 'Scatter', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'size', label: 'Texture size', type: 'number', min: 4, max: 80, step: 0.5, default: 20 },
    { key: 'tint', label: 'Glass tint', type: 'color', default: '#ffffff' },
    { key: 'haze', label: 'Haze', type: 'number', min: 0, max: 1, step: 0.01, default: 0.12 },
    {
      key: 'clear',
      label: 'Clear glass',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: 'None' },
        { value: 'drips', label: 'Drips' },
        { value: 'spot', label: 'Wiped spot' },
        { value: 'band', label: 'Clear band' }
      ]
    },
    {
      key: 'clearSize',
      label: 'Clear amount',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
      when: params => params.clear !== 'none'
    },
    {
      key: 'speed',
      label: 'Drip speed',
      type: 'number',
      min: 0,
      max: 2,
      step: 0.01,
      default: 0.5,
      when: params => params.clear === 'drips'
    },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const linear = ctx.pass('frosted-linear', LINEAR, { input });
    const sigma = (0.6 + 27.4 * params.frost * params.frost) * (TEXTURE_BLUR[params.texture] ?? 1) * ctx.unit;
    const blurred = params.frost > 0 ? gaussianBlur(ctx, linear, sigma) : linear;
    const output = ctx.pass('frosted', SHADER, {
      input,
      textures: { uBlur: blurred },
      uniforms: {
        uTexture: TEXTURES[params.texture] ?? 0,
        uScatter: params.scatter,
        uSize: params.size,
        uTint: hexToRgb(params.tint),
        uHaze: params.haze,
        uClear: CLEAR[params.clear] ?? 0,
        uClearSize: params.clearSize,
        uClock: ctx.time * params.speed,
        uSeed: params.variation
      }
    });
    if (blurred !== linear) ctx.release(blurred);
    ctx.release(linear);
    return output;
  }
};
