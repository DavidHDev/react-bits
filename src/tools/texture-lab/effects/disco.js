import { hexToRgb } from '../engine/assets';

const TILES = `
uniform float uShape;
uniform float uTile;
uniform float uRadius;
uniform vec2 uCenter;
uniform float uRows;
uniform float uSpin;
uniform float uTilt;
uniform float uGap;
uniform float uSparkle;
uniform float uClock;
uniform float uSeed;
uniform float uLod;
uniform float uRoom;
uniform float uStars;
uniform vec3 uTint;

vec3 rotX(vec3 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z);
}

vec3 rotY(vec3 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

vec3 photo(vec2 px) {
  return toLinear(textureLod(uInput, clamp(px / uResolution, 0.0, 1.0), uLod).rgb);
}

float glint(vec3 n, vec3 light, float sharp) {
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  return pow(max(dot(r, normalize(light)), 0.0), sharp);
}

void main() {
  vec2 p = vUv * uResolution - uCenter;
  vec3 center;
  vec2 cell;
  vec2 local;
  vec2 foot;
  float facing = 1.0;
  float inside = 1.0;
  vec2 sampleAt;

  if (uShape < 0.5) {
    vec2 q = p / uRadius;
    float r2 = dot(q, q);
    inside = 1.0 - smoothstep(1.0 - 2.0 / uRadius, 1.0, sqrt(r2));
    vec3 n = vec3(q, sqrt(max(1.0 - r2, 0.0)));
    vec3 b = rotY(rotX(n, -uTilt), uSpin);
    float lat = asin(clamp(b.y, -1.0, 1.0));
    float lon = atan(b.x, b.z);
    float alpha = PI / uRows;
    float fy = (lat + PI * 0.5) / alpha;
    float row = floor(fy);
    float latC = -PI * 0.5 + (row + 0.5) * alpha;
    float count = max(3.0, floor(TAU * cos(latC) / alpha + 0.5));
    float shift = hash11(row * 7.13 + uSeed);
    float fx = (lon / TAU + 0.5) * count + shift;
    float col = floor(fx);
    float lonC = ((col + 0.5 - shift) / count - 0.5) * TAU;
    vec3 c = vec3(cos(latC) * sin(lonC), sin(latC), cos(latC) * cos(lonC));
    center = rotX(rotY(c, -uSpin), uTilt);
    cell = vec2(mod(col, count), row);
    local = vec2(fract(fx), fract(fy));
    vec2 dLon = vec2(dFdx(lon), dFdy(lon));
    dLon -= TAU * floor(dLon / TAU + 0.5);
    foot = vec2(length(dLon) * count / TAU, length(vec2(dFdx(lat), dFdy(lat))) / alpha);
    facing = n.z;
    vec2 flat2 = center.xy;
    float len = length(flat2);
    float bulge = len > 1e-4 ? mix(1.0, (asin(min(len, 1.0)) / len) * 0.6366, 0.35) : 0.7781;
    sampleAt = uCenter + flat2 * bulge * uRadius * 1.08;
  } else {
    vec2 g = p / uTile;
    cell = floor(g);
    local = fract(g);
    foot = vec2(1.0 / uTile);
    center = vec3(0.0, 0.0, 1.0);
    sampleAt = uCenter + (cell + 0.5) * uTile;
  }

  vec3 h = hash32(cell + uSeed * 17.31);
  vec3 tilted = normalize(center + vec3(h.x - 0.5, h.y - 0.5, 0.0) * 0.32);
  vec3 tile = photo(sampleAt);
  float shade = 0.72 + 0.5 * h.z;
  shade *= mix(1.0, 0.45 + 0.55 * facing, 0.6);
  float lit = luma(tile);

  float spin = uShape < 0.5 ? 0.0 : uSpin;
  vec3 keyLight = vec3(cos(spin) * -0.55, 0.6 + sin(spin) * 0.25, 0.75);
  vec3 fillLight = vec3(0.65, -0.35 + cos(spin * 1.3) * 0.2, 0.7);
  float spec = glint(tilted, keyLight, 90.0) + 0.6 * glint(tilted, fillLight, 140.0);
  float phase = uClock * (0.6 + h.y * 1.1) + h.x * TAU;
  float twinkle = pow(max(sin(phase), 0.0), 18.0) * step(h.z, 0.3 + 0.5 * uSparkle);
  float flash = (spec * 2.4 + twinkle * 2.0) * uSparkle * (0.7 + 0.5 * lit);

  vec2 edge = min(local, 1.0 - local);
  float gap = uGap * 0.14;
  vec2 dist = (edge - gap) / max(foot, vec2(1e-5));
  float body = clamp(min(dist.x, dist.y) + 0.5, 0.0, 1.0);
  float bevel = (smoothstep(0.35, 0.0, local.y - gap) - smoothstep(0.35, 0.0, 1.0 - local.y - gap)) * 0.18;

  vec2 off = local - 0.5;
  float spot = exp(-dot(off, off) * 40.0);
  vec3 mirror = pow(tile, vec3(1.3)) + vec3(0.010, 0.011, 0.013) * (0.4 + h.y);
  vec3 color = mirror * shade * (1.0 + bevel) + uTint * flash * (0.4 + spot * 1.5);
  color *= mix(0.05, 1.0, body);
  float star = step(fract(h.z * 13.7 + h.x * 3.1), uStars);
  float energy = (spec * 1.6 + twinkle * 1.8) * uSparkle * star * spot * body * smoothstep(0.08, 0.6, lit);

  if (uShape < 0.5) {
    vec3 room = toLinear(texture(uInput, vUv).rgb) * uRoom;
    vec2 sp = p / (uTile * 2.4);
    sp.x += uSpin * 5.0 * (1.0 + 0.25 * sin(floor(sp.y) * 1.7));
    vec2 sc = floor(sp);
    vec3 sh = hash32(sc + 91.7 + uSeed);
    vec2 sf = fract(sp) - 0.5 - (sh.xy - 0.5) * 0.45;
    float mark = smoothstep(0.2, 0.1, length(sf)) * step(sh.z, 0.32);
    float flick = 0.55 + 0.45 * sin(uClock * (0.4 + sh.x) + sh.y * TAU);
    room += uTint * mark * flick * (room * 3.0 + 0.05) * uSparkle;
    color = mix(room, color, inside);
    energy *= inside;
  }
  outColor = vec4(color, energy);
}`;

const PREFILTER = `
uniform vec2 uTexel;
uniform float uThreshold;
uniform vec3 uTint;

vec3 tap(vec2 uv) {
  vec4 t = texture(uInput, uv);
  vec3 c = t.rgb;
  float bright = max(c.r, max(c.g, c.b));
  float k = smoothstep(uThreshold, uThreshold + 0.4, bright);
  return c * k * 0.6;
}

void main() {
  vec3 a = tap(vUv + uTexel * vec2(-1.0, -1.0));
  vec3 b = tap(vUv + uTexel * vec2(1.0, -1.0));
  vec3 c = tap(vUv + uTexel * vec2(-1.0, 1.0));
  vec3 d = tap(vUv + uTexel * vec2(1.0, 1.0));
  outColor = vec4((a + b + c + d) * 0.25, 1.0);
}`;

const DOWN = `
uniform vec2 uTexel;

void main() {
  vec2 t = uTexel;
  vec3 a = texture(uInput, vUv + t * vec2(-2.0, 2.0)).rgb;
  vec3 b = texture(uInput, vUv + t * vec2(0.0, 2.0)).rgb;
  vec3 c = texture(uInput, vUv + t * vec2(2.0, 2.0)).rgb;
  vec3 d = texture(uInput, vUv + t * vec2(-2.0, 0.0)).rgb;
  vec3 e = texture(uInput, vUv).rgb;
  vec3 f = texture(uInput, vUv + t * vec2(2.0, 0.0)).rgb;
  vec3 g = texture(uInput, vUv + t * vec2(-2.0, -2.0)).rgb;
  vec3 h = texture(uInput, vUv + t * vec2(0.0, -2.0)).rgb;
  vec3 i = texture(uInput, vUv + t * vec2(2.0, -2.0)).rgb;
  vec3 j = texture(uInput, vUv + t * vec2(-1.0, 1.0)).rgb;
  vec3 k = texture(uInput, vUv + t * vec2(1.0, 1.0)).rgb;
  vec3 l = texture(uInput, vUv + t * vec2(-1.0, -1.0)).rgb;
  vec3 m = texture(uInput, vUv + t * vec2(1.0, -1.0)).rgb;
  vec3 color = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  outColor = vec4(color, 1.0);
}`;

const UP = `
uniform sampler2D uLower;
uniform vec2 uTexel;

void main() {
  vec4 d = vec4(1.0, 1.0, -1.0, 0.0) * uTexel.xyxy;
  vec3 s = texture(uLower, vUv - d.xy).rgb;
  s += texture(uLower, vUv - d.wy).rgb * 2.0;
  s += texture(uLower, vUv - d.zy).rgb;
  s += texture(uLower, vUv + d.zw).rgb * 2.0;
  s += texture(uLower, vUv).rgb * 4.0;
  s += texture(uLower, vUv + d.xw).rgb * 2.0;
  s += texture(uLower, vUv + d.zy).rgb;
  s += texture(uLower, vUv + d.wy).rgb * 2.0;
  s += texture(uLower, vUv + d.xy).rgb;
  outColor = vec4(texture(uInput, vUv).rgb + s / 16.0 * 0.75, 1.0);
}`;

const SPARKS = `
uniform vec2 uSpan;
uniform vec3 uTint;
uniform float uCut;
uniform float uGain;

void main() {
  float a = texture(uInput, vUv + uSpan * vec2(-0.25, -0.25)).a;
  float b = texture(uInput, vUv + uSpan * vec2(0.25, -0.25)).a;
  float c = texture(uInput, vUv + uSpan * vec2(-0.25, 0.25)).a;
  float d = texture(uInput, vUv + uSpan * vec2(0.25, 0.25)).a;
  float e = max(max(a, b), max(c, d));
  outColor = vec4(uTint * max(e - uCut, 0.0) * uGain, 1.0);
}`;

const STREAK = `
uniform sampler2D uAccum;
uniform vec2 uStep;
uniform float uDecay;
uniform float uFinal;
uniform float uScale;

void main() {
  vec3 sum = texture(uInput, vUv).rgb;
  float w = 1.0;
  for (int s = 1; s < 4; s++) {
    w *= uDecay;
    vec2 o = uStep * float(s);
    sum += (texture(uInput, vUv + o).rgb + texture(uInput, vUv - o).rgb) * w;
  }
  if (uFinal > 0.5) sum = sum * uScale + texture(uAccum, vUv).rgb;
  outColor = vec4(sum, 1.0);
}`;

const COMPOSITE = `
uniform sampler2D uBloom;
uniform sampler2D uSmall;
uniform sampler2D uFlares;
uniform float uGlow;
uniform float uFlare;
uniform float uLevels;

void main() {
  vec4 tiles = texture(uInput, vUv);
  vec3 base = clamp(tiles.rgb, 0.0, 1.0);
  vec3 mean = texture(uSmall, vec2(0.25)).rgb + texture(uSmall, vec2(0.75, 0.25)).rgb;
  mean += texture(uSmall, vec2(0.25, 0.75)).rgb + texture(uSmall, vec2(0.75)).rgb;
  float energy = luma(mean * 0.25);
  vec3 bloom = texture(uBloom, vUv).rgb / max(uLevels * 0.4, 1.0);
  bloom *= uGlow * 2.0 / (1.0 + energy * 6.0);
  vec3 flares = texture(uFlares, vUv).rgb;
  vec3 light = max(tiles.rgb - 1.0, 0.0) + bloom + flares * uFlare;
  vec3 color = 1.0 - (1.0 - base) * exp(-light);
  outColor = vec4(toGamma(color), 1.0);
}`;

const FLARE_BUFFER = 800;

export default {
  id: 'disco',
  name: 'Mirror ball',
  category: 'light',
  description: 'The picture as glittering mirror tiles on a spinning disco ball, with bloom and star flares.',
  animated: true,
  animates: params => params.spin !== 0 || (params.twinkle > 0 && params.sparkle > 0),
  params: [
    {
      key: 'shape',
      label: 'Shape',
      type: 'select',
      default: 'ball',
      options: [
        { value: 'ball', label: 'Mirror ball' },
        { value: 'flat', label: 'Flat tiles' }
      ]
    },
    { key: 'size', label: 'Tile size', type: 'number', min: 4, max: 60, step: 0.5, default: 18 },
    {
      key: 'zoom',
      label: 'Ball size',
      type: 'number',
      min: 0.3,
      max: 1.6,
      step: 0.01,
      default: 1.1,
      when: params => params.shape === 'ball'
    },
    { key: 'spin', label: 'Spin', type: 'number', min: -1, max: 1, step: 0.01, default: 0.2 },
    { key: 'gap', label: 'Grout', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'sparkle', label: 'Glitter', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'twinkle', label: 'Twinkle', type: 'number', min: 0, max: 3, step: 0.01, default: 1 },
    { key: 'glow', label: 'Bloom', type: 'number', min: 0, max: 2, step: 0.01, default: 0.7 },
    { key: 'flares', label: 'Star flares', type: 'number', min: 0, max: 2, step: 0.01, default: 0.8 },
    {
      key: 'rays',
      label: 'Flare rays',
      type: 'select',
      default: '6',
      options: [
        { value: '4', label: 'Four' },
        { value: '6', label: 'Six' },
        { value: '8', label: 'Eight' }
      ]
    },
    { key: 'tint', label: 'Light color', type: 'color', default: '#fff1dc' },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const ball = params.shape !== 'flat';
    const tile = Math.max(2, params.size * ctx.unit);
    const half = Math.hypot(ctx.width, ctx.height) / 2;
    const radius = Math.max(8, params.zoom * half);
    const rows = Math.max(6, Math.round((Math.PI * radius) / tile));
    const tint = hexToRgb(params.tint);
    const tiles = ctx.pass('disco-tiles', TILES, {
      input: source,
      uniforms: {
        uShape: ball ? 0 : 1,
        uTile: tile,
        uRadius: radius,
        uCenter: [ctx.width / 2, ctx.height / 2],
        uRows: rows,
        uSpin: ctx.time * params.spin * 0.6,
        uTilt: 0.32,
        uGap: params.gap,
        uSparkle: params.sparkle,
        uClock: ctx.time * params.twinkle * 2.2,
        uSeed: params.variation * 1.37,
        uLod: Math.max(0, Math.log2(tile) - 1.2),
        uRoom: 0.16,
        uStars: 0.06,
        uTint: tint
      }
    });

    const w = Math.max(2, Math.round(ctx.width / 2));
    const h = Math.max(2, Math.round(ctx.height / 2));
    const pre = ctx.pass('disco-prefilter', PREFILTER, {
      input: tiles,
      target: ctx.target(w, h),
      uniforms: { uTexel: [1 / ctx.width, 1 / ctx.height], uThreshold: 0.6, uTint: tint }
    });
    const chain = [pre];
    let current = pre;
    while (chain.length < 7 && Math.min(current.width, current.height) > 12) {
      const next = ctx.pass('disco-down', DOWN, {
        input: current,
        target: ctx.target(Math.max(1, Math.round(current.width / 2)), Math.max(1, Math.round(current.height / 2))),
        uniforms: { uTexel: [1 / current.width, 1 / current.height] }
      });
      chain.push(next);
      current = next;
    }
    let lower = chain[chain.length - 1];
    for (let index = chain.length - 2; index >= 0; index -= 1) {
      const level = chain[index];
      const up = ctx.pass('disco-up', UP, {
        input: level,
        target: ctx.target(level.width, level.height),
        textures: { uLower: lower },
        uniforms: { uTexel: [1 / lower.width, 1 / lower.height] }
      });
      if (!chain.includes(lower)) ctx.release(lower);
      lower = up;
    }
    const bloom = lower;

    const fit = Math.min(1, FLARE_BUFFER / Math.max(ctx.width, ctx.height));
    const fw = Math.max(2, Math.round(ctx.width * fit));
    const fh = Math.max(2, Math.round(ctx.height * fit));
    const sparks = ctx.pass('disco-sparks', SPARKS, {
      input: tiles,
      target: ctx.target(fw, fh),
      uniforms: { uSpan: [1 / fw, 1 / fh], uTint: tint, uCut: 0.1, uGain: 12 }
    });
    const empty = ctx.shared('disco-empty', engine => ({
      texture: engine.createTexture(1, 1, { data: new Uint8Array([0, 0, 0, 255]) })
    }));
    const count = Number(params.rays) || 6;
    const axes = count / 2;
    const reach = (120 * Math.max(fw, fh)) / 1000;
    let flares = null;
    for (let k = 0; k < axes; k += 1) {
      const theta = Math.PI / 2 + (k * Math.PI) / axes + 0.2;
      const lambda = reach * (k % 2 === 0 ? 1 : 0.62);
      const passes = Math.max(2, Math.min(5, Math.ceil(Math.log(lambda * 4 + 1) / Math.log(4))));
      let norm = 1;
      for (let i = 0; i < passes; i += 1) {
        const a = Math.exp(-Math.pow(4, i) / lambda);
        norm *= 1 + 2 * (a + a * a + a * a * a);
      }
      let streak = sparks;
      for (let i = 0; i < passes; i += 1) {
        const stride = Math.pow(4, i);
        const next = ctx.pass('disco-streak', STREAK, {
          input: streak,
          target: ctx.target(fw, fh),
          textures: { uAccum: flares || empty },
          uniforms: {
            uStep: [(Math.cos(theta) * stride) / fw, (Math.sin(theta) * stride) / fh],
            uDecay: Math.exp(-stride / lambda),
            uFinal: i === passes - 1,
            uScale: 6 / norm
          }
        });
        if (streak !== sparks) ctx.release(streak);
        streak = next;
      }
      if (flares) ctx.release(flares);
      flares = streak;
    }

    const output = ctx.pass('disco-composite', COMPOSITE, {
      input: tiles,
      textures: { uBloom: bloom, uSmall: chain[chain.length - 1], uFlares: flares },
      uniforms: { uGlow: params.glow, uFlare: params.flares, uLevels: chain.length }
    });
    chain.forEach(target => ctx.release(target));
    if (!chain.includes(bloom)) ctx.release(bloom);
    ctx.release(tiles);
    ctx.release(sparks);
    ctx.release(flares);
    return output;
  }
};
