const COMMON = `
uniform vec2 uCenter;
uniform float uShort;
uniform float uEdges;

vec2 toUv(vec2 q) {
  return (uCenter * uResolution + q * uShort) / uResolution;
}

vec2 edgeUv(vec2 uv) {
  if (uEdges < 0.5) return clamp(uv, 0.5 / uResolution, 1.0 - 0.5 / uResolution);
  if (uEdges < 1.5) return 1.0 - abs(1.0 - mod(uv, 2.0));
  return fract(uv);
}

vec3 fetch(vec2 uv, vec2 dx, vec2 dy) {
  return textureGrad(uInput, edgeUv(uv), dx, dy).rgb;
}
`;

const WARP = `
${COMMON}
uniform float uType;
uniform float uRadius;
uniform float uStrength;
uniform float uPhase;
uniform float uOption;
uniform float uCurve;
uniform float uCount;
uniform float uRotation;
uniform float uSeamless;

vec2 twirl(vec2 q) {
  float x = length(q) / uRadius;
  if (x >= 1.0) return q;
  float f = (1.0 - x) * (1.0 - x);
  return rotation(uStrength * 3.0 * PI * f) * q;
}

vec2 pinch(vec2 q) {
  float r = length(q);
  float x = r / uRadius;
  if (x >= 1.0 || x <= 0.0) return q;
  float power = exp(-1.1 * uStrength);
  float x4 = x * x * x * x;
  float f = mix(pow(x, power), x, x4);
  return q * (f / x);
}

vec2 bulge(vec2 q) {
  float r = length(q);
  float x = r / uRadius;
  if (x >= 1.0 || x <= 0.0) return q;
  float sphere = uStrength >= 0.0 ? asin(x) / (0.5 * PI) : sin(x * 0.5 * PI);
  float x2 = x * x;
  float f = mix(x, sphere, (uStrength >= 0.0 ? uStrength * 1.6 : -uStrength) * (1.0 - x2 * x2 * x2));
  return q * (f / x);
}

vec2 shear(vec2 q) {
  vec2 s = uOption < 0.5 ? q : q.yx;
  float y = s.y;
  float f = y;
  if (uCurve > 0.5 && uCurve < 1.5) f = y * y * 2.0 - 0.35;
  if (uCurve > 1.5) f = sin(y * PI * 1.6) * 0.32;
  s.x -= uStrength * f;
  return uOption < 0.5 ? s : s.yx;
}

float zig(float x) {
  return mix(sin(x * TAU), 1.0 - 4.0 * abs(fract(x + 0.25) - 0.5), 0.5);
}

vec2 zigzag(vec2 q) {
  float r = length(q);
  float x = r / uRadius;
  if (x >= 1.0) return q;
  float fall = (1.0 - x * x) * (1.0 - x * x) * smoothstep(0.0, 0.1, x);
  float w = zig(x * uCount - uPhase) * fall * uStrength * 0.06;
  vec2 s = q;
  if (uOption < 0.5 || uOption > 1.5) s = rotation(w / max(r, 0.03)) * s;
  if (uOption > 0.5) s *= 1.0 + w / max(r, 0.03);
  return s;
}

void main() {
  vec2 q = (vUv - uCenter) * uResolution / uShort;
  if (uType > 3.5 && uType < 4.5) {
    vec2 uv;
    vec2 dx;
    vec2 dy;
    if (uOption < 0.5) {
      float r = length(q) / uRadius;
      float th = atan(q.y, q.x);
      float u = (0.75 - th / TAU + uRotation) * uCount + uSeamless * 0.25;
      uv = vec2(u, r);
      vec2 qx = dFdx(q);
      vec2 qy = dFdy(q);
      float rr = max(dot(q, q), 1e-6);
      vec2 n = vec2(-q.y, q.x) / rr;
      vec2 g = q / max(length(q), 1e-4) / uRadius;
      float k = uCount * (1.0 + uSeamless);
      dx = vec2(-dot(n, qx) / TAU * k, dot(g, qx));
      dy = vec2(-dot(n, qy) / TAU * k, dot(g, qy));
      uv.x = uSeamless > 0.5 ? abs(2.0 * fract(uv.x + 0.5) - 1.0) : fract(uv.x);
    } else {
      float u = uSeamless > 0.5 ? vUv.x * 0.5 - 0.25 : vUv.x;
      float th = (0.75 + uRotation - u / uCount) * TAU;
      float r = vUv.y * uRadius;
      uv = toUv(vec2(cos(th), sin(th)) * r);
      dx = dFdx(uv);
      dy = dFdy(uv);
    }
    outColor = vec4(fetch(uv, dx, dy), 1.0);
    return;
  }
  vec2 s = q;
  if (uType < 0.5) s = twirl(q);
  else if (uType < 1.5) s = pinch(q);
  else if (uType < 2.5) s = bulge(q);
  else if (uType < 3.5) s = shear(q);
  else s = zigzag(q);
  vec2 uv = toUv(s);
  outColor = vec4(fetch(uv, dFdx(uv), dFdy(uv)), 1.0);
}`;

const SMUDGE = `
uniform vec2 uDirection;
uniform float uStep;
uniform float uLength;
uniform float uStreaks;
uniform float uPhase;
uniform float uUnitPx;
uniform float uShift;
uniform float uPower;
uniform float uFirst;
uniform float uFinal;

float decay(vec2 p) {
  vec2 n = vec2(-uDirection.y, uDirection.x);
  float across = dot(p, n) / uUnitPx;
  float coarse = valueNoise(vec2(across * 0.015 + 3.7, uPhase * 0.12));
  float mid = valueNoise(vec2(across * 0.1, 7.3 + uPhase * 0.2));
  float fine = valueNoise(vec2(across * 0.6, 1.9 + uPhase * 0.35));
  float v = coarse * 0.15 + mid * 0.35 + fine * 0.5;
  float drip = smoothstep(0.38, 0.78, v);
  float len = max(uLength * mix(1.0, 0.06 + drip * drip * 2.0, uStreaks), 0.5);
  return exp(-uStep / len);
}

vec4 load(vec2 uv) {
  vec4 c = texture(uInput, clamp(uv, 0.5 / uResolution, 1.0 - 0.5 / uResolution));
  if (uFirst < 0.5) return c;
  float l = luma(c.rgb);
  float w = 0.02 + l * l * l * 3.0;
  return vec4(c.rgb * w, w);
}

void main() {
  vec2 p = vUv * uResolution;
  float weight = pow(decay(p), uPower);
  vec4 sum = load(vUv) + load((p - uDirection * uShift) / uResolution) * weight;
  if (uFinal > 0.5) sum = vec4(sum.rgb / max(sum.a, 1e-5), 1.0);
  outColor = sum;
}`;

const TYPES = { twirl: 0, pinch: 1, bulge: 2, shear: 3, polar: 4, zigzag: 5, smudge: 6 };
const EDGES = { stretch: 0, mirror: 1, repeat: 2 };
const STYLES = { around: 0, out: 1, pond: 2 };
const CURVES = { straight: 0, bow: 1, wave: 2 };

const optionFor = (type, params) => {
  if (type === 4) return params.polarMode === 'unwrap' ? 1 : 0;
  if (type === 3) return params.axis === 'vertical' ? 1 : 0;
  return STYLES[params.style] ?? 0;
};

const radial = params => ['twirl', 'pinch', 'bulge', 'polar', 'zigzag'].includes(params.type);

export default {
  id: 'distort',
  name: 'Distort',
  category: 'distort',
  blend: 'normal',
  description: 'Twirl, pinch, bulge, shear, smudge, zigzag or wrap the picture into polar coordinates.',
  animated: true,
  animates: params => params.speed > 0,
  params: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      default: 'twirl',
      options: [
        { value: 'twirl', label: 'Twirl' },
        { value: 'pinch', label: 'Pinch' },
        { value: 'bulge', label: 'Bulge' },
        { value: 'polar', label: 'Polar coordinates' },
        { value: 'shear', label: 'Shear' },
        { value: 'smudge', label: 'Smudge' },
        { value: 'zigzag', label: 'Zigzag' }
      ]
    },
    {
      key: 'strength',
      label: 'Strength',
      type: 'number',
      min: -1,
      max: 1,
      step: 0.01,
      default: 0.5,
      when: params => params.type !== 'polar'
    },
    {
      key: 'radius',
      label: 'Radius',
      type: 'number',
      min: 0.05,
      max: 1.5,
      step: 0.01,
      default: 0.5,
      when: radial
    },
    {
      key: 'centerX',
      label: 'Center X',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
      when: params => params.type !== 'smudge'
    },
    {
      key: 'centerY',
      label: 'Center Y',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
      when: params => params.type !== 'smudge'
    },
    {
      key: 'polarMode',
      label: 'Mapping',
      type: 'select',
      default: 'wrap',
      options: [
        { value: 'wrap', label: 'Wrap into a circle' },
        { value: 'unwrap', label: 'Unwrap a circle' }
      ],
      when: params => params.type === 'polar'
    },
    {
      key: 'repeats',
      label: 'Repeats',
      type: 'number',
      min: 1,
      max: 8,
      step: 1,
      default: 1,
      when: params => params.type === 'polar'
    },
    {
      key: 'seamless',
      label: 'Seamless',
      type: 'boolean',
      default: true,
      when: params => params.type === 'polar'
    },
    {
      key: 'rotation',
      label: 'Rotation',
      type: 'number',
      min: 0,
      max: 360,
      step: 1,
      default: 0,
      when: params => params.type === 'polar'
    },
    {
      key: 'axis',
      label: 'Axis',
      type: 'select',
      default: 'horizontal',
      options: [
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' }
      ],
      when: params => params.type === 'shear'
    },
    {
      key: 'curve',
      label: 'Curve',
      type: 'select',
      default: 'straight',
      options: [
        { value: 'straight', label: 'Straight' },
        { value: 'bow', label: 'Bow' },
        { value: 'wave', label: 'Wave' }
      ],
      when: params => params.type === 'shear'
    },
    {
      key: 'angle',
      label: 'Direction',
      type: 'number',
      min: 0,
      max: 360,
      step: 1,
      default: 270,
      when: params => params.type === 'smudge'
    },
    {
      key: 'streaks',
      label: 'Streaks',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.85,
      when: params => params.type === 'smudge'
    },
    {
      key: 'ridges',
      label: 'Ridges',
      type: 'number',
      min: 1,
      max: 30,
      step: 0.5,
      default: 14,
      when: params => params.type === 'zigzag'
    },
    {
      key: 'style',
      label: 'Style',
      type: 'select',
      default: 'around',
      options: [
        { value: 'around', label: 'Around center' },
        { value: 'out', label: 'Out from center' },
        { value: 'pond', label: 'Pond ripples' }
      ],
      when: params => params.type === 'zigzag'
    },
    {
      key: 'edges',
      label: 'Edges',
      type: 'select',
      default: 'stretch',
      options: [
        { value: 'stretch', label: 'Stretch' },
        { value: 'mirror', label: 'Mirror' },
        { value: 'repeat', label: 'Repeat' }
      ],
      when: params => ['polar', 'shear'].includes(params.type) || (params.type !== 'smudge' && params.radius > 0.6)
    },
    { key: 'speed', label: 'Motion', type: 'number', min: 0, max: 2, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const type = TYPES[params.type] ?? 0;
    const t = ctx.time * params.speed;
    const shortSide = Math.min(ctx.width, ctx.height);
    if (type === 6) {
      const angle = (params.angle * Math.PI) / 180;
      const direction = [Math.cos(angle), Math.sin(angle)];
      const sign = params.strength < 0 ? -1 : 1;
      const dir = [direction[0] * sign, direction[1] * sign];
      const length = Math.abs(params.strength) * 140 * ctx.unit;
      const stepPx = Math.max(1, ctx.unit);
      let current = input;
      let reach = 1;
      const passes = Math.max(1, Math.min(10, Math.ceil(Math.log2((length * 4) / stepPx + 1))));
      for (let index = 0; index < passes; index += 1) {
        const next = ctx.pass('distort-smudge', SMUDGE, {
          input: current,
          uniforms: {
            uDirection: dir,
            uStep: stepPx,
            uLength: Math.max(length, 0.5),
            uStreaks: params.streaks,
            uPhase: t,
            uUnitPx: Math.max(ctx.unit, 0.5),
            uShift: stepPx * reach,
            uPower: reach,
            uFirst: index === 0 ? 1 : 0,
            uFinal: index === passes - 1 ? 1 : 0
          }
        });
        if (current !== input) ctx.release(current);
        current = next;
        reach *= 2;
      }
      return current;
    }
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const breathe = params.speed > 0 ? 0.7 + 0.3 * Math.cos(t * 0.8) : 1;
    let strength = params.strength;
    let rotation = (params.rotation || 0) / 360;
    let phase = 0;
    if (type <= 2) strength *= breathe;
    if (type === 3) strength *= params.speed > 0 ? Math.cos(t * 0.6) : 1;
    if (type === 4) rotation += t * 0.03;
    if (type === 5) phase = t * 0.6;
    return ctx.pass('distort-warp', WARP, {
      input: source,
      uniforms: {
        uType: type,
        uCenter: [params.centerX, 1 - params.centerY],
        uShort: shortSide,
        uEdges: EDGES[params.edges] ?? 0,
        uRadius: params.radius * (type === 4 ? 1.6 : type === 5 ? 1.8 : 1),
        uSeamless: params.seamless ? 1 : 0,
        uStrength: type === 3 ? strength * 0.8 : strength,
        uPhase: phase,
        uOption: optionFor(type, params),
        uCurve: CURVES[params.curve] ?? 0,
        uCount: type === 4 ? Math.max(1, Math.round(params.repeats)) : params.ridges,
        uRotation: rotation
      }
    });
  }
};
