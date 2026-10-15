import { hexToRgb } from '../engine/assets';

const NOISE_SIZE = 128;
const PATTERN = 666.6667;

const SHADER = `
uniform sampler2D uNoise;
uniform vec3 uPaper;
uniform vec3 uShadow;
uniform float uFade;
uniform float uBend;
uniform float uAngle;
uniform float uSeed;
uniform float uRoughness;
uniform float uRoughnessSize;
uniform float uRoughnessRows;
uniform float uFiber;
uniform float uFiberSize;
uniform float uFolds;
uniform vec2 uFoldLines;
uniform float uWrinkles;
uniform float uWrinkleSize;
uniform float uCrumples;
uniform float uCrumpleCount;
uniform float uDrops;

float lst(float edge0, float edge1, float x) {
  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

float paperHash21(vec2 p) {
  p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

vec2 paperHash22(vec2 p) {
  p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
  p += dot(p, p.yx + 19.19);
  return fract(vec2(p.x * p.y, p.x + p.y));
}

float getRoughness(vec2 p, vec2 lightDir, vec2 seedShift, float basePixel, float pixel) {
  vec2 u = p / vec2(2.0, 4.0);
  float w = 100.0 * basePixel;
  float eps = 4.0 * w;
  float size = mix(3.2, 0.8, uRoughnessSize);
  float logLac = log2(2.1);
  float level = -log2(w + 1e-8) / logLac;
  float baseLevel = floor(level) - 2.0;
  float fade = fract(level);
  vec2 px = (u.x + vec2(eps, -eps)) * 0.1;
  float py = u.y * 0.1;
  vec2 sum = vec2(0.0);
  float norm = 0.0;
  float amp = 0.5;
  float freq = exp2(baseLevel * logLac);
  for (int i = 0; i < 4; i++) {
    float absIdx = baseLevel + float(i);
    vec2 qx = size * px * freq;
    float qy = size * py * freq;
    float wi = 1.0;
    if (i == 0) wi = 1.0 - fade;
    if (i == 3) wi = fade;
    float visible = smoothstep(0.35, 1.0, 1.0 / (50.0 * size * freq * pixel));
    vec2 fx = fract(qx);
    float fy = fract(qy);
    vec2 shift = 0.5 + absIdx * 0.3 + seedShift;
    float uvY = floor(qy) / 50.0 + shift.y;
    vec2 s0a = textureLod(uNoise, fract(vec2(floor(qx.x) / 50.0 + shift.x, uvY)), 0.0).rg;
    vec2 s1a = textureLod(uNoise, fract(vec2(ceil(qx.x) / 50.0 + shift.x, uvY)), 0.0).rg;
    vec2 s0b = textureLod(uNoise, fract(vec2(floor(qx.y) / 50.0 + shift.x, uvY)), 0.0).rg;
    vec2 s1b = textureLod(uNoise, fract(vec2(ceil(qx.y) / 50.0 + shift.x, uvY)), 0.0).rg;
    vec2 ny0 = mix(vec2(s0a.r, s0b.r), vec2(s0a.g, s0b.g), fy);
    vec2 ny1 = mix(vec2(s1a.r, s1b.r), vec2(s1a.g, s1b.g), fy);
    vec2 n = mix(ny0, ny1, fx);
    sum += amp * wi * visible * n;
    norm += amp * wi;
    amp *= 0.8;
    freq *= 2.1;
  }
  vec2 r = sum / norm;
  float dx = 0.5 + r.x - r.y;
  float grain = 3.0 * dx * dx - 0.7;
  float rowBand = fract(dot(p, lightDir) * 0.05 * size);
  return grain + 0.6 * uRoughnessRows * (rowBand - 0.5);
}

float getFiber(vec2 p, vec2 seedShift, float basePixel, float pixel) {
  float size = mix(4.0, 1.0, uFiberSize);
  float w = 50.0 * basePixel;
  float level = -log2(w + 1e-8);
  float baseLevel = floor(level) - 3.0;
  float fade = fract(level);
  vec2 grad = vec2(0.0);
  float scale = 1.0;
  float amp = 1.0;
  float freq = pow(1.7, baseLevel);
  for (int i = 0; i < 5; i++) {
    float absIdx = baseLevel + float(i);
    vec2 q = size * p * freq;
    float an = absIdx * 0.8;
    float rc = cos(an);
    float rs = sin(an);
    q = vec2(rc * q.x - rs * q.y, rs * q.x + rc * q.y);
    float wi = 1.0;
    if (i == 0) wi = 1.0 - fade;
    if (i == 4) wi = fade;
    wi *= smoothstep(0.35, 1.0, 1.0 / (50.0 * size * freq * pixel));
    vec2 iq = floor(q);
    vec2 fq = fract(q);
    float shift = absIdx * 0.3;
    vec4 uv = fract(vec4(iq, iq + 1.0) / 50.0 + 0.5 + shift + seedShift.xyxy);
    float aF = textureLod(uNoise, uv.xy, 0.0).b;
    float bF = textureLod(uNoise, uv.zy, 0.0).b;
    float cF = textureLod(uNoise, uv.xw, 0.0).b;
    float dF = textureLod(uNoise, uv.zw, 0.0).b;
    vec2 s = fq * fq * (3.0 - 2.0 * fq);
    vec2 du = 8.0 * fq * (1.0 - fq);
    float dx = du.x * mix(bF - aF, dF - cF, s.y);
    float dy = du.y * mix(cF - aF, dF - bF, s.x);
    grad += wi * amp * scale * vec2(rc * dx + rs * dy, -rs * dx + rc * dy);
    scale *= 1.7;
    amp *= 0.5;
    freq *= 1.7;
  }
  return clamp(0.333 * length(grad), 0.0, 1.0);
}

vec2 smoothNoise(vec2 p) {
  vec2 t = p * 50.0 - 0.5;
  vec2 i = floor(t);
  vec2 f = fract(t);
  f = f * f * (3.0 - 2.0 * f);
  return textureLod(uNoise, fract((i + f + 0.5) / vec2(50.0)), 0.0).rg;
}

float getDrops(vec2 uv, vec2 seedShift) {
  vec2 cell = floor(uv);
  vec2 local = fract(uv);
  float minDist = 1.0;
  for (int y = -1; y < 2; y += 1) {
    for (int x = -1; x < 2; x += 1) {
      vec2 neighbor = vec2(float(y), float(x));
      vec2 offset = paperHash22(cell + neighbor + 50.0 * seedShift);
      vec2 pos = neighbor + offset - local;
      minDist *= min(1.0, dot(pos, pos));
    }
  }
  return 0.5 * lst(0.09, 0.08, sqrt(sqrt(minDist)));
}

vec2 getCellTilt(float idx, float radius) {
  vec2 rand = paperHash22(vec2(idx + 31.0, idx * uSeed + 17.0));
  float an = rand.x * TAU;
  return vec2(cos(an), sin(an)) * mix(0.3, 1.7, rand.y * rand.y) * mix(0.7, 1.0, radius);
}

vec2 getCrumpleDetail(vec2 uv, float freq, float shift, float basePixel, out float depth) {
  depth = 0.0;
  vec2 v = uv * freq;
  float pixel = 0.9 * freq * basePixel;
  vec2 base = floor(v);
  float n1 = 9.0;
  float n2 = 9.0;
  vec2 s1 = vec2(0.0);
  vec2 s2 = vec2(0.0);
  vec2 q1 = vec2(0.0);
  vec2 q2 = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cell = base + vec2(float(x), float(y));
      vec2 q = paperHash22(vec2(cell.y * 1.9 + 3.1 + shift, cell.x * 1.3 + 0.11 * uSeed));
      if (q.y > 0.8) continue;
      vec2 r = paperHash22(vec2(cell.x + 0.37 * uSeed + shift + 11.1, cell.y - 0.21 * uSeed + 5.7));
      vec2 s = cell + 0.06 + 0.88 * r;
      vec2 d = v - s;
      float dsq = dot(d, d);
      if (dsq < n1) {
        n2 = n1;
        s2 = s1;
        q2 = q1;
        n1 = dsq;
        s1 = s;
        q1 = q;
      } else if (dsq < n2) {
        n2 = dsq;
        s2 = s;
        q2 = q;
      }
    }
  }
  if (n1 > 8.0) return vec2(0.0);
  float an1 = q1.x * TAU;
  float mag1 = q1.y / 0.8;
  vec2 t1 = vec2(cos(an1), sin(an1)) * mix(0.3, 1.7, mag1 * mag1);
  float an2 = q2.x * TAU;
  float mag2 = q2.y / 0.8;
  vec2 t2 = vec2(cos(an2), sin(an2)) * mix(0.3, 1.7, mag2 * mag2);
  vec2 span = s1 - s2;
  float spanLen = max(length(span), 1e-4);
  float toEdge = (n2 - n1) / (2.0 * spanLen);
  float pair = paperHash21(s1 + s2 + 1.7 * abs(s1 - s2));
  float pairSoft = 0.05 + 0.1 * step(pair, 0.4);
  float b = clamp(toEdge / max(1.5 * pixel, 0.5 * pairSoft), 0.0, 1.0);
  b = b * b * (3.0 - 2.0 * b);
  float d1 = max(sqrt(n1), 1e-4);
  depth = 0.2 * d1;
  float shoulderAmt = max(0.0, 1.0 - toEdge / 0.42) * b;
  vec2 shoulder = vec2(0.0);
  if (shoulderAmt > 0.0) {
    float d2 = max(sqrt(n2), 1e-4);
    shoulder = shoulderAmt * ((v - s2) / d2 - (v - s1) / d1);
  }
  vec2 mid = 0.5 * (t1 + t2);
  return mid + (t1 - mid) * b + 0.9 * shoulder;
}

vec4 getCrumples(vec2 uv) {
  float crumpleN = max(2.0, floor(uCrumpleCount + 0.5));
  float near = 60000.0;
  float nearB = 60000.0;
  float idx = 0.0;
  float rad = 0.0;
  vec2 nearP = vec2(0.0);
  vec2 nearPb = vec2(0.0);
  vec4 seeds[15];
  for (int i = 0; i < 15; i++) {
    if (float(i) >= crumpleN) break;
    vec2 rand = paperHash22(vec2(float(i), float(i) * uSeed));
    float an = rand.x * TAU;
    vec2 p = vec2(cos(an), sin(an)) * rand.y;
    seeds[i] = vec4(p, rand);
    vec2 d = uv - p;
    float dsq = dot(d, d);
    if (dsq < near) {
      nearB = near;
      nearPb = nearP;
      near = dsq;
      idx = float(i);
      rad = rand.y;
      nearP = p;
    } else if (dsq < nearB) {
      nearB = dsq;
      nearPb = p;
    }
  }
  float l = sqrt(near);
  float lb = sqrt(nearB);
  vec2 dir = (uv - nearP) / max(l, 1e-4);
  float edge = lst(0.0, 0.5, lb - l);
  float shoulderLimit = l + 0.5;
  vec2 tilt = getCellTilt(idx, rad);
  float tiltSum = 1.0;
  vec2 wide = vec2(0.0);
  float wideSum = 0.0;
  float toEdge = 9.0;
  float edgeSoft = 0.0;
  for (int i = 0; i < 15; i++) {
    if (float(i) >= crumpleN) break;
    if (float(i) == idx) continue;
    vec4 seed = seeds[i];
    vec2 p = seed.xy;
    vec2 rand = seed.zw;
    vec2 d = uv - p;
    float dsq = dot(d, d);
    if (dsq < shoulderLimit * shoulderLimit) {
      float di = sqrt(dsq);
      float shoulder = lst(0.5, 0.0, di - l);
      wide += shoulder * (d / max(di, 1e-4) - dir);
      wideSum += shoulder;
    }
    float pairSoft = 0.01 + 0.05 * step(0.2, rand.x) + 0.3 * rand.y;
    float toBisector = (dsq - near) / (0.2 * max(length(p - nearP), 1e-4));
    if (toBisector < toEdge) {
      toEdge = toBisector;
      edgeSoft = pairSoft;
    }
    float w = 1.0 - toBisector / pairSoft;
    if (w > 0.0) {
      w *= w;
      tilt += w * getCellTilt(float(i), rand.y);
      tiltSum += w;
    }
  }
  float blend = clamp(toEdge / edgeSoft, 0.0, 1.0);
  vec2 sharp = (1.0 - edge) * ((uv - nearPb) / max(lb, 1e-4) - dir);
  vec2 rounding = mix(sharp, wide / max(wideSum, 1.0), min(2.0 * edgeSoft, 1.0));
  float radial = l / max(l + toEdge, 1e-4);
  return vec4(tilt / tiltSum + rounding * blend * radial, 0.2 * l, edge);
}

void foldAxis(float coord, float extent, float lines, float noise, out float dx, out float count) {
  if (lines < 0.5) {
    count = 1.0;
    dx = 0.5;
    return;
  }
  float panel = extent / (lines + 1.0);
  float period = lines < 1.5 ? 2.0 : min(2.0, 1.6 * panel);
  count = 1.0 / period;
  float local = (coord + 0.5 * extent) / panel;
  float k = clamp(floor(local + 0.5), 1.0, lines);
  dx = clamp(((local - k) * panel + noise) * count, -0.5, 0.5);
}

void getFolds(vec2 coord, vec2 extent, vec2 noise, float basePixel, out vec2 slope, out vec2 dark, out vec2 lift) {
  vec2 dx;
  vec2 count;
  foldAxis(coord.x, extent.x, uFoldLines.x, noise.x, dx.x, count.x);
  foldAxis(coord.y, extent.y, uFoldLines.y, noise.y, dx.y, count.y);
  noise *= count;
  vec2 adx = abs(dx);
  vec2 t = clamp(adx / 0.3, 0.0, 1.0);
  dark = t * t * (3.0 - 2.0 * t);
  lift = 1.0 - t;
  lift *= lift;
  vec2 crease = clamp(dx / max(count * basePixel, 1e-5), -1.0, 1.0);
  slope = crease * (1.0 - dark);
  vec2 lineWidth = 0.02 * count * mix(vec2(2.5), vec2(0.8), dark.yx) + 0.1 * noise;
  slope -= 1.0 - smoothstep(vec2(0.0), lineWidth, adx);
  slope *= step(0.5, uFoldLines);
}

vec2 mirrorUv(vec2 uv) {
  return 1.0 - abs(1.0 - abs(uv));
}

void main() {
  vec2 imageUV = vec2(vUv.x, 1.0 - vUv.y);
  float toPattern = 1.0 / (uUnit * ${PATTERN.toFixed(4)});
  vec2 patternUV = (imageUV - 0.5) * uResolution * toPattern;
  vec2 extent = uResolution * toPattern;
  float basePixel = 1.0 / ${PATTERN.toFixed(4)};
  float aaPixel = max(basePixel, toPattern);

  float pattern = 0.0;
  float crumpleDepth = 0.0;
  float wrinkleDepth = 0.0;
  float foldDepth = 0.0;
  float roughness = 0.0;
  float fiber = 0.0;
  float drops = 0.0;

  float grazing = 0.7;
  float lightRad = radians(uAngle);
  vec2 lightDir = vec2(sin(lightRad), -cos(lightRad));
  float foldAngleInSector = mod(uAngle, 90.0);
  float foldLightRad = radians(uAngle - foldAngleInSector + mix(12.0, 78.0, foldAngleInSector / 90.0));
  vec2 foldLightDir = vec2(sin(foldLightRad), -cos(foldLightRad));
  vec2 relief = vec2(0.0);
  vec2 foldSlope = vec2(0.0);
  float reliefAmount = 0.0;
  float foldInk = 1.0;
  vec2 crumpleFlow = vec2(0.0);

  vec2 warpNoise = vec2(0.0);
  if (uCrumples > 0.0 || uFolds > 0.0 || uWrinkles > 0.0) {
    warpNoise = smoothNoise(patternUV * 0.1 + 0.2 + 0.6 * fract(0.017 * uSeed)) - 0.5;
  }
  vec2 crumplesUV = patternUV * 0.9 + 0.012 * warpNoise;

  if (uCrumples > 0.0) {
    vec4 crumples = getCrumples(crumplesUV);
    vec2 crumpleTilt = 0.5 * uCrumples * crumples.xy;
    crumpleTilt -= 0.1 * max(dot(crumpleTilt, lightDir), 0.0) * lightDir;
    relief += crumpleTilt;
    reliefAmount += 0.6 * uCrumples;
    crumpleFlow = crumples.w * crumpleTilt;
    crumpleDepth = clamp(5.0 * crumples.z, 0.0, 1.0);
  }

  if (uWrinkles > 0.0) {
    float detailFreq = mix(10.0, 1.0, uWrinkleSize);
    float detailAmp = 0.2;
    vec2 detailGrad = vec2(0.0);
    float detailDepth = 0.0;
    float depthSum = 0.0;
    for (int i = 0; i < 3; i++) {
      float layerDepth;
      detailGrad += detailAmp * getCrumpleDetail(crumplesUV, detailFreq, 31.0 * float(i), aaPixel, layerDepth);
      detailDepth += detailAmp * layerDepth;
      depthSum += detailAmp;
      detailAmp *= 0.5 + 0.2 * detailGrad.x;
      detailFreq *= 2.1;
    }
    vec2 detailTilt = 1.5 * uWrinkles * detailGrad;
    detailTilt -= 0.65 * max(dot(detailTilt, lightDir), 0.0) * lightDir;
    relief += detailTilt;
    reliefAmount += 0.6 * uWrinkles;
    wrinkleDepth = clamp(5.0 * detailDepth / max(depthSum, 1e-4), 0.0, 1.0);
  }

  if (uFolds > 0.0 && uFoldLines.x + uFoldLines.y > 0.5) {
    vec2 foldNoise = 0.005 * warpNoise;
    vec2 slope;
    vec2 dark;
    vec2 lift;
    getFolds(patternUV + 0.03 * crumpleFlow, extent, foldNoise, aaPixel, slope, dark, lift);
    foldSlope = uFolds * slope;
    reliefAmount += uFolds;
    vec2 ink = mix(vec2(0.96), vec2(1.0), dark);
    float flatness = dark.x * dark.y;
    foldInk *= mix(1.0, ink.x * ink.y * mix(0.5, 0.3, flatness), uFolds);
    foldDepth = uFolds * (lift.y * foldLightDir.y - lift.x * foldLightDir.x);
  }

  float unlit = cos(grazing);
  if (reliefAmount > 0.0) {
    float lightFalloff = clamp(0.5 + dot(imageUV - 0.5, lightDir), 0.0, 1.0);
    float lightPower = mix(0.5, 1.0, lightFalloff);
    float slope = clamp(dot(relief, lightDir) + dot(foldSlope, foldLightDir), -1.2, 1.2);
    float lit = max(cos(slope + grazing), 0.0);
    pattern += (clamp(reliefAmount, 0.0, 1.0) * unlit + (lit - unlit)) * foldInk * lightPower;
  }

  patternUV += 0.04 * crumpleFlow;
  vec2 seedShift = floor(fract(uSeed * vec2(0.7548776662, 0.5698402909)) * 50.0) / 50.0;

  if (uRoughness > 0.0) {
    roughness = uRoughness * getRoughness(1000.0 * patternUV, lightDir, seedShift, basePixel, toPattern);
    pattern += roughness;
  }
  if (uFiber > 0.0) {
    fiber = uFiber * getFiber(50.0 * patternUV, seedShift, basePixel, toPattern);
    pattern += fiber;
  }
  if (uDrops > 0.0) {
    drops = uDrops * getDrops(patternUV * 10.0, seedShift);
  }
  pattern = clamp(pattern, 0.0, 1.0);

  vec2 centered = imageUV - 0.5;
  float edgeDist = 2.0 * max(abs(centered.x), abs(centered.y));
  float wrinkleDistortion = mix(0.38, 0.0175, smoothstep(0.0, 1.0, edgeDist));
  float scaleDistortion = 0.15 * uCrumples * (crumpleDepth - 0.5) + wrinkleDistortion * uWrinkles * (wrinkleDepth - 0.5) + 0.05 * foldDepth;
  vec2 linearDistortion = 0.002 * lightDir * drops;
  float radialDistortion = 0.02 * (roughness + fiber);
  centered *= 1.0 - uBend * scaleDistortion;
  centered -= uBend * linearDistortion;
  vec2 sampleUV = 0.5 + centered * (1.0 - abs(uBend) * radialDistortion * dot(centered, centered));

  vec3 image = texture(uInput, mirrorUv(vec2(sampleUV.x, 1.0 - sampleUV.y))).rgb;
  vec3 sheet = uShadow * pattern + uPaper * (1.0 - pattern);
  float maxC = max(max(image.r, image.g), image.b);
  float minC = min(min(image.r, image.g), image.b);
  float sat = maxC > 0.0 ? (maxC - minC) / maxC : 0.0;
  float midC = image.r + image.g + image.b - maxC - minC;
  float secondaryness = maxC > minC ? (midC - minC) / (maxC - minC) : 0.0;
  float satDampen = sat * (1.0 - 0.5 * secondaryness);
  float darkDampen = 1.0 - luma(image);
  float dampen = 0.7 * uFade * max(satDampen, darkDampen);
  vec3 color = image * sheet;
  color = mix(color, vec3(1.0), 0.6 * pow(dampen, 2.0 + 3.0 * pattern));
  color *= mix(vec3(1.0), 0.5 * uShadow, drops);
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

const makeNoise = () => {
  const data = new Uint8Array(NOISE_SIZE * NOISE_SIZE * 4);
  let seed = 0x9e3779b9;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      const pick = random();
      const value = random();
      data[i + c] = Math.round((pick < 0.3 ? value * 0.03 : pick < 0.5 ? 0.97 + value * 0.03 : value) * 255);
    }
    data[i + 3] = 255;
  }
  return data;
};

export default {
  id: 'paper',
  name: 'Paper',
  category: 'film',
  blend: 'normal',
  description: 'A sheet of real paper under the image: grain, fibers, wrinkles, creases and drops.',
  animated: false,
  params: [
    { key: 'paper', label: 'Paper', type: 'color', default: '#ffffff' },
    { key: 'shadow', label: 'Shadow', type: 'color', default: '#cccccc' },
    { key: 'grain', label: 'Grain', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    {
      key: 'grainSize',
      label: 'Grain size',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
      when: params => params.grain > 0
    },
    {
      key: 'laid',
      label: 'Laid lines',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0,
      when: params => params.grain > 0
    },
    { key: 'fibers', label: 'Fibers', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    {
      key: 'fiberSize',
      label: 'Fiber size',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
      when: params => params.fibers > 0
    },
    { key: 'wrinkles', label: 'Wrinkles', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    {
      key: 'wrinkleSize',
      label: 'Wrinkle size',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.65,
      when: params => params.wrinkles > 0
    },
    { key: 'crumples', label: 'Crumples', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    {
      key: 'facets',
      label: 'Crumple facets',
      type: 'number',
      min: 2,
      max: 15,
      step: 1,
      default: 6,
      when: params => params.crumples > 0
    },
    { key: 'folds', label: 'Folds', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    {
      key: 'foldsX',
      label: 'Vertical folds',
      type: 'number',
      min: 0,
      max: 5,
      step: 1,
      default: 1,
      when: params => params.folds > 0
    },
    {
      key: 'foldsY',
      label: 'Horizontal folds',
      type: 'number',
      min: 0,
      max: 5,
      step: 1,
      default: 1,
      when: params => params.folds > 0
    },
    { key: 'drops', label: 'Drops', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'bend', label: 'Bend', type: 'number', min: -1, max: 1, step: 0.01, default: 0.3 },
    { key: 'fade', label: 'Ink fade', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { key: 'angle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 300 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 4 }
  ],
  render(ctx, input, params) {
    const noise = ctx.shared('paper-noise', engine => ({
      texture: engine.createTexture(NOISE_SIZE, NOISE_SIZE, {
        float: false,
        filter: 'linear',
        wrap: 'repeat',
        data: makeNoise()
      })
    }));
    return ctx.pass('paper', SHADER, {
      input,
      textures: { uNoise: noise },
      uniforms: {
        uPaper: hexToRgb(params.paper),
        uShadow: hexToRgb(params.shadow),
        uFade: params.fade,
        uBend: params.bend,
        uAngle: params.angle,
        uSeed: params.variation,
        uRoughness: params.grain,
        uRoughnessSize: params.grainSize,
        uRoughnessRows: params.laid,
        uFiber: params.fibers,
        uFiberSize: params.fiberSize,
        uFolds: params.folds,
        uFoldLines: [params.foldsX, params.foldsY],
        uWrinkles: params.wrinkles,
        uWrinkleSize: params.wrinkleSize,
        uCrumples: params.crumples,
        uCrumpleCount: params.facets,
        uDrops: params.drops
      }
    });
  }
};
