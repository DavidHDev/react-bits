const SHADER = `
uniform float uSpread;
uniform float uBias;
uniform float uAngle;
uniform float uPerspective;
uniform float uCount;
uniform float uDispersion;
uniform float uHue;
uniform float uFocusCenter;
uniform float uFocusEdges;
uniform float uSwirl;
uniform float uNoise;
uniform float uBulge;
uniform float uCircle;
uniform float uGrain;

vec3 hueColor(float hue) {
  vec3 rgb = clamp(abs(mod(hue * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return rgb * rgb * (3.0 - 2.0 * rgb);
}

float dispersionCurve(float t, float biasPow) {
  float mirroredT = uBias < 0.0 ? 1.0 - t : t;
  float curved = pow(mirroredT, biasPow);
  return uBias < 0.0 ? 1.0 - curved : curved;
}

vec2 getSpread(vec2 fromCenter, float radius, vec2 warpedUV, float edgeAA, float inradius, float outradius, float reach, float aspect, out float outStrength) {
  vec2 uniformDir = vec2(cos(uAngle), sin(uAngle));
  float invInradius = 1.0 / inradius;
  vec2 radialDir = fromCenter * invInradius;
  float maxLen = (outradius + reach) * invInradius;
  float radialLen = radius * invInradius;
  if (radialLen > maxLen) radialDir *= maxLen / radialLen;
  vec2 spreadDir = mix(uniformDir, radialDir, uPerspective);

  float bandProximity = smoothstep(inradius * 0.8, inradius, radius);
  float lensCircleMaxing = bandProximity * uCircle * uCircle * uCircle;
  spreadDir = mix(spreadDir, radialDir, lensCircleMaxing);

  vec2 warpedAbs = abs(warpedUV - 0.5);
  float inner = mix(1.0, smoothstep(0.0, mix(inradius, outradius, uFocusCenter), radius), uFocusCenter);
  float boxDist = max(warpedAbs.x, warpedAbs.y) * 2.0;
  float outer = mix(1.0, 1.0 - min(boxDist, 1.0), uFocusEdges);
  float strength = inner * outer;
  strength *= mix(1.0, mix(0.15, 0.03, max(-uBulge, 0.0)), lensCircleMaxing);

  vec2 outside = max(warpedAbs - 0.5, 0.0);
  float margin = max(reach * length(spreadDir) * (1.0 - uCircle), edgeAA);
  strength *= 1.0 - smoothstep(0.0, margin, length(outside));

  outStrength = strength;
  vec2 axis = spreadDir * (reach * strength);
  if (uNoise > 0.0) {
    float turn = (valueNoise(fromCenter * 4.5) - 0.5) * 2.0 * uNoise;
    axis = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * axis;
  }
  axis.x /= aspect;
  return axis;
}

vec2 lensWarp(vec2 fromCenter, float radius, float inradius, float aspect, out float bulgeFade) {
  bulgeFade = 1.0;
  if (uBulge == 0.0 && uCircle <= 0.0) return fromCenter;
  if (radius < 1e-5) return fromCenter;
  float r = radius;
  if (uBulge != 0.0) {
    float rn = radius / inradius;
    float bulge = abs(uBulge) * (uBulge > 0.0 ? 1.4 : 1.2);
    if (uBulge > 0.0) bulgeFade = 1.0 - smoothstep(1.45, 1.53, rn * bulge);
    float map = uBulge > 0.0 ? tan(min(rn * bulge, 1.53)) / tan(bulge) : atan(rn * tan(bulge)) / bulge;
    float bulgeScale = map / rn;
    fromCenter *= bulgeScale;
    r *= bulgeScale;
  }
  if (uCircle > 0.0) {
    vec2 dir = fromCenter / max(r, 1e-5);
    vec2 halfBox = vec2(aspect, 1.0) * 0.5;
    float rBox = min(halfBox.x / max(abs(dir.x), 1e-4), halfBox.y / max(abs(dir.y), 1e-4));
    float band = inradius * mix(0.03, 0.2, 0.5 * (uBulge + 1.0));
    float innerEdge = inradius - band;
    float over = smoothstep(0.0, 1.0, (r - innerEdge) / band);
    float g = r + (rBox - inradius) * pow(over, 14.0);
    fromCenter = dir * mix(r, g, uCircle);
  }
  return fromCenter;
}

float boxFrame(vec2 uv) {
  vec2 invAA = 1.0 / clamp(fwidth(uv), 1e-5, 0.02);
  vec2 lo = clamp(uv * invAA + 0.5, 0.0, 1.0);
  vec2 hi = clamp((1.0 - uv) * invAA + 0.5, 0.0, 1.0);
  return lo.x * hi.x * lo.y * hi.y;
}

vec3 tap(vec2 uv) {
  uv = 1.0 - abs(1.0 - abs(uv));
  return texture(uInput, vec2(uv.x, 1.0 - uv.y)).rgb;
}

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  float aspect = uResolution.x / uResolution.y;
  float invAspect = 1.0 / aspect;
  float inradius = 0.5 * min(aspect, 1.0);
  float outradius = 0.5 * length(vec2(aspect, 1.0));
  float reach = 0.7 * pow(uSpread, 1.3 + 2.7 * uSpread);

  vec2 fromCenter = uv - 0.5;
  fromCenter.x *= aspect;
  float radius = length(fromCenter);

  float bulgeFade;
  vec2 warpedFromCenter = lensWarp(fromCenter, radius, inradius, aspect, bulgeFade);
  vec2 baseUV = vec2(warpedFromCenter.x * invAspect, warpedFromCenter.y) + 0.5;
  float inside = boxFrame(baseUV) * bulgeFade;
  vec2 baseDerivative = fwidth(baseUV);
  float edgeAA = clamp(2.0 * max(baseDerivative.x, baseDerivative.y), 0.001, 0.02);

  float spreadStrength;
  vec2 spreadAxis = getSpread(fromCenter, radius, baseUV, edgeAA, inradius, outradius, reach, aspect, spreadStrength);

  if (uGrain > 0.0) {
    float grainSeed = valueNoise((uv - 0.5) * uResolution * 0.8 / uUnit);
    vec2 jit = fract(grainSeed * vec2(157.31, 113.57)) * 2.0 - 1.0;
    spreadAxis += jit * 0.3 * uGrain * length(spreadAxis);
  }

  float count = floor(uCount);
  float invCount = 1.0 / count;
  float invSpan = 1.0 / max(count - 1.0, 1.0);
  float hueBase = uHue + 0.5;
  float biasPower = 1.0 + 2.0 * abs(uBias);
  float dispersionPower = pow(uDispersion, 0.8);
  float warpedRadius = length(warpedFromCenter);
  float swirlAngle = uSwirl * 0.4 * PI * spreadStrength * uSpread * min(1.0, inradius / max(warpedRadius, 1e-4));

  vec3 colorSum = vec3(0.0);
  vec3 weightSum = vec3(0.0);
  for (int i = 0; i < 50; i++) {
    float layer = float(i);
    if (layer >= count) break;
    float hue = hueBase + layer * invCount;
    float spread = layer * invSpan;
    if (uBias != 0.0) spread = dispersionCurve(spread, biasPower);
    float fanPos = 1.0 - 2.0 * spread;
    vec2 tapUV = baseUV + spreadAxis * fanPos - 0.5;
    if (uSwirl != 0.0) {
      tapUV.x *= aspect;
      tapUV = rotation(-swirlAngle * fanPos) * tapUV;
      tapUV.x *= invAspect;
    }
    vec3 weight = 1.0 - dispersionPower * hueColor(hue);
    colorSum += tap(tapUV + 0.5) * weight;
    weightSum += weight;
  }
  vec3 color = colorSum / max(weightSum, 1e-4);
  outColor = vec4(color * inside, 1.0);
}`;

export default {
  id: 'refract',
  name: 'Lens split',
  category: 'distort',
  blend: 'normal',
  description: 'Splits the picture into a fan of shifted color layers, like shooting through a prism.',
  animated: false,
  preview: { params: { spread: 1.2 } },
  params: [
    { key: 'spread', label: 'Spread', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    {
      key: 'angle',
      label: 'Direction',
      type: 'number',
      min: 0,
      max: 360,
      step: 1,
      default: 0,
      when: params => params.radial < 1
    },
    { key: 'radial', label: 'Radial', type: 'number', min: 0, max: 1, step: 0.01, default: 0.1 },
    { key: 'layers', label: 'Layers', type: 'number', min: 2, max: 50, step: 1, default: 35 },
    { key: 'bias', label: 'Balance', type: 'number', min: -1, max: 1, step: 0.01, default: 1 },
    { key: 'dispersion', label: 'Rainbow', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    {
      key: 'hue',
      label: 'Hue',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.6,
      when: params => params.dispersion > 0
    },
    { key: 'swirl', label: 'Swirl', type: 'number', min: -1, max: 1, step: 0.01, default: 0.35 },
    { key: 'clearCenter', label: 'Clear center', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { key: 'clearEdges', label: 'Clear edges', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { key: 'turbulence', label: 'Turbulence', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'bulge', label: 'Bulge', type: 'number', min: -1, max: 1, step: 0.01, default: 0 },
    { key: 'circle', label: 'Round lens', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'scatter', label: 'Scatter', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    return ctx.pass('refract', SHADER, {
      input,
      uniforms: {
        uSpread: params.spread,
        uBias: params.bias,
        uAngle: (params.angle * Math.PI) / 180,
        uPerspective: params.radial,
        uCount: params.layers,
        uDispersion: params.dispersion,
        uHue: params.hue,
        uFocusCenter: params.clearCenter,
        uFocusEdges: params.clearEdges,
        uSwirl: params.swirl,
        uNoise: params.turbulence,
        uBulge: params.bulge,
        uCircle: params.circle,
        uGrain: params.scatter
      }
    });
  }
};
