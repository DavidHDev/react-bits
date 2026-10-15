import { PRIMITIVES } from './primitives.js';
import { MAT_COLORS, MAT_FLOATS } from './materialParams.js';
import { MAX_LAYERS } from './shaderVariant.js';

export { MAX_LAYERS } from './shaderVariant.js';
export const MASK_SLOTS = 4;
export const MASK_TYPE = 100;
export const FIELD_RANGE = 4;

export const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const dispatch = types =>
  PRIMITIVES.flatMap((primitive, index) =>
    !types || types.includes(index) ? [`  if (t == ${index}) return sd_${primitive.id}(p, a, b);`] : []
  ).join('\n');

const materialPrelude = material => `
${material.kind === 'fill' ? '#define HAS_FILL_MATERIAL 1' : '#define HAS_MATERIAL 1'}
#define MATERIAL_OUTSIDE ${material.outside ? 'true' : 'false'}
#define MATERIAL_NORMALS ${material.normals === false ? 'false' : 'true'}
#define MATERIAL_REACH ${(material.reach ?? 0.32).toFixed(4)}
uniform vec4 uMatP[${MAT_FLOATS / 4}];
uniform vec4 uMatC[${MAT_COLORS}];
uniform vec4 uSurface;
${material.defines || ''}

struct Surface {
  vec2 p;
  vec2 uv;
  vec2 frag;
  vec2 res;
  float unit;
  float px;
  float d;
  float aa;
  float cov;
  vec2 n;
  float slope;
  float time;
};
`;

const fillHelpers = material => `
${material.glsl}
`;

const materialHelpers = material => `
float shapeAt(vec2 q) {
  return scene(q);
}

vec4 backdropAt(vec2 q) {
  return backgroundColor(q);
}

float surfaceRim(Surface s, float width) {
  return clamp(1.0 + s.d / max(width, 1e-4), 0.0, 1.0);
}

vec3 domeNormal(Surface s, float width) {
  float x = min(surfaceRim(s, width), 0.985) * smoothstep(0.15, 0.85, s.slope);
  return normalize(vec3(s.n * x, sqrt(1.0 - x * x)));
}

float domeHeight(Surface s, float width) {
  float x = surfaceRim(s, width);
  return sqrt(max(1.0 - x * x, 0.0));
}

${material.glsl}
`;

export const buildFragment = (
  material = null,
  {
    capacity = MAX_LAYERS,
    types = null,
    morph = true,
    patterns = true,
    radialCopies = true,
    linearCopies = true,
    shadow = true,
    bevel = true
  } = {}
) => `#version 300 es
precision highp float;
precision highp int;
#define PI 3.14159265359
#define TAU 6.28318530718
#define MAXL ${capacity}
${material ? materialPrelude(material) : ''}
uniform int uCountA;
uniform int uCountB;
uniform int uType[${capacity * 2}];
uniform vec4 uA[${capacity * 2}];
uniform vec4 uB[${capacity * 2}];
uniform vec4 uXf[${capacity * 2}];
uniform vec4 uRep[${capacity * 2}];
uniform vec4 uMod[${capacity * 2}];
uniform vec4 uPat[${capacity * 2}];
uniform vec4 uPat2[${capacity * 2}];
uniform vec4 uMarkA;
uniform vec4 uMarkB;
uniform float uMorph;
uniform sampler2D uMask0;
uniform sampler2D uMask1;
uniform sampler2D uMask2;
uniform sampler2D uMask3;
uniform vec4 uMaskInfo[${MASK_SLOTS}];
uniform sampler2D uLogoTex;
uniform int uLogoLayer;
uniform sampler2D uMatTex;
uniform sampler2D uSurfTex;
uniform vec4 uSurfInfo;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uUnit;
uniform float uEncode;
uniform float uTime;

uniform vec4 uFill;
uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;
uniform vec4 uOutline;
uniform vec4 uOutlineColor;
uniform vec4 uShadow;
uniform vec4 uShadowOffset;
uniform vec4 uShadowColor;
uniform vec4 uGlow;
uniform vec4 uGlowColor;
uniform vec4 uBevel;
uniform vec4 uBg;
uniform vec4 uBgColor1;
uniform vec4 uBgColor2;

out vec4 outColor;

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, s, -s, c);
}

float smin(float a, float b, float k) {
  if (k <= 0.0) return min(a, b);
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float smax(float a, float b, float k) {
  return -smin(-a, -b, k);
}

${PRIMITIVES.filter((_, index) => !types || types.includes(index))
  .map(primitive => primitive.glsl)
  .join('\n\n')}

float primitive(int t, vec2 p, vec4 a, vec4 b) {
  if (t < 0) return 1000.0;
  if (abs(p.x) + abs(p.y) < 1e-6) p.x = 1e-6;
${dispatch(types)}
  return length(p) - 1.0;
}

float maskTexel(int slot, vec2 uv) {
  if (slot == 0) return texture(uMask0, uv).r;
  if (slot == 1) return texture(uMask1, uv).r;
  if (slot == 2) return texture(uMask2, uv).r;
  return texture(uMask3, uv).r;
}

float sampleMask(int slot, vec2 q) {
  vec2 half_ = uMaskInfo[slot].xy;
  vec2 c = clamp(q, -half_, half_);
  vec2 uv = c / half_ * 0.5 + 0.5;
  float inner = maskTexel(slot, uv);
  return inner + length(q - c);
}

vec2 copyPoint(vec2 p, float n, float phase, int k) {
  float sector = TAU / n;
  float a = atan(p.y, p.x + 1e-9) - phase;
  a = mod(a + sector * 0.5, sector) - sector * 0.5 + float(k) * sector;
  return length(p) * vec2(cos(a), sin(a));
}

int copyReach(float n) {
  return n < 1.5 ? 0 : n < 4.5 ? 1 : 2;
}

vec2 layerPoint(int i, vec2 p) {
  vec4 xf = uXf[i];
  vec2 q = rot2(-xf.w) * (p - xf.xy) / xf.z;
  if (uRep[i].w > 0.5) q.x = -q.x;
  return q;
}

float stripeField(float u, float spacing, float weight) {
  return abs(mod(u + spacing * 0.5, spacing) - spacing * 0.5) - weight * spacing * 0.5;
}

float sphereWarp(float x, float bulge, out float slope) {
  float c = clamp(x, -0.999, 0.999);
  slope = mix(1.0, (2.0 / PI) / sqrt(1.0 - c * c), bulge);
  return mix(x, asin(c) * 2.0 / PI, bulge);
}

float patternField(int i, vec2 q) {
  vec4 pat = uPat[i];
  vec4 pat2 = uPat2[i];
  float type = pat.x;
  float spacing = 2.0 / max(pat.y, 1.0);
  float weight = clamp(pat.z, 0.02, 0.98);
  float bulge = clamp(pat2.x, 0.0, 1.0);
  float taper = clamp(pat2.y, 0.0, 1.0);
  vec2 r = rot2(-pat.w) * q;
  if (type < 1.5) {
    float slope;
    float u = sphereWarp(r.y, bulge, slope);
    float w = weight * mix(1.0, 1.0 - taper, clamp((u + 1.0) * 0.5, 0.0, 1.0));
    return stripeField(u, spacing, w) / slope;
  }
  if (type < 2.5) {
    float rho = length(r);
    float w = weight * mix(1.0, 1.0 - taper, clamp(rho, 0.0, 1.0));
    return stripeField(rho, spacing, w);
  }
  if (type < 3.5) {
    float rho = length(r);
    float sector = TAU / max(pat.y, 1.0);
    float a = abs(mod(atan(r.y, r.x) + sector * 0.5, sector) - sector * 0.5);
    float wedge = (a - weight * sector * 0.5) * rho;
    float beam = sin(min(a, PI * 0.5)) * rho - weight * spacing * 0.25;
    return mix(wedge, beam, taper);
  }
  if (type < 4.5) {
    float sy;
    float v = sphereWarp(r.y, bulge, sy);
    float lat = sqrt(max(1.0 - r.y * r.y * bulge, 1e-3));
    float sx;
    float u = sphereWarp(r.x / lat, bulge, sx);
    float a = stripeField(u, spacing, weight * 0.5) / (sx / lat);
    float b = stripeField(v, spacing, weight * 0.5) / sy;
    return min(a, b);
  }
  vec2 cell = floor(r / spacing + 0.5) * spacing;
  float fade =
    type < 5.5
      ? clamp((cell.x + 1.0) * 0.5, 0.0, 1.0)
      : smoothstep(0.0, 1.0, length(cell));
  float radius = weight * spacing * 0.5 * (1.0 - taper * fade);
  return length(r - cell) - max(radius, 0.0);
}

float shapeCore(int i, vec2 q) {
  int t = uType[i];
  float d = t >= ${MASK_TYPE} ? sampleMask(t - ${MASK_TYPE}, q) : primitive(t, q, uA[i], uB[i]);
  ${
    patterns
      ? `if (uPat[i].x > 0.5) {
    float f = patternField(i, q);
    d = uPat2[i].z > 0.5 ? max(d, -f) : max(d, f);
  }`
      : ''
  }
  return d;
}

vec2 rowAxis(int i) {
  return uPat2[i].w < 1.5 ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
}

vec2 rowFold(int i, vec2 q) {
  vec4 rep = uRep[i];
  if (uPat2[i].w < 0.5 || rep.x < 1.5) return q;
  vec2 axis = rowAxis(i);
  float gap = max(rep.y, 0.01);
  float start = -gap * (rep.x - 1.0) * 0.5;
  float k = clamp(floor((dot(q, axis) - start) / gap + 0.5), 0.0, rep.x - 1.0);
  return q - axis * (start + k * gap);
}

float layerShape(int i, vec2 p) {
  vec2 q = layerPoint(i, p);
  ${
    linearCopies
      ? `vec4 rep = uRep[i];
  float d;
  if (uPat2[i].w > 0.5 && rep.x > 1.5) {
    vec2 axis = rowAxis(i);
    float gap = max(rep.y, 0.01);
    float start = -gap * (rep.x - 1.0) * 0.5;
    float k = clamp(floor((dot(q, axis) - start) / gap + 0.5), 0.0, rep.x - 1.0);
    d = 1e5;
    for (int j = -1; j <= 1; j++) {
      float kk = clamp(k + float(j), 0.0, rep.x - 1.0);
      d = min(d, shapeCore(i, q - axis * (start + kk * gap)));
    }
  } else {
    d = shapeCore(i, q);
  }`
      : 'float d = shapeCore(i, q);'
  }
  return d * uXf[i].z;
}

float layerSD(int i, vec2 p) {
  vec4 rep = uRep[i];
  if (rep.z > 0.5) p.x = abs(p.x);
  ${
    radialCopies
      ? `int reach = uPat2[i].w > 0.5 ? 0 : copyReach(rep.x);
  float d = 1e5;
  for (int k = -2; k <= 2; k++) {
    if (k < -reach || k > reach) continue;
    d = min(d, layerShape(i, reach > 0 ? copyPoint(p, rep.x, rep.y, k) : p));
  }`
      : 'float d = min(1e5, layerShape(i, p));'
  }
  vec4 m = uMod[i];
  d -= m.x;
  if (m.y > 0.0) d = abs(d) - m.y;
  return d;
}

float combine(float d, float s, float op, float k) {
  if (op < 0.5) return min(d, s);
  if (op < 1.5) return smin(d, s, k);
  if (op < 2.5) return smax(d, -s, k);
  if (op < 3.5) return smax(d, s, k);
  return max(min(d, s), -max(d, s));
}

float sceneRange(int start, int count, vec4 mark, vec2 p) {
  p = rot2(-mark.y) * (p - mark.zw) / mark.x;
  float d = 1e5;
  for (int k = 0; k < MAXL; k++) {
    if (k >= count) break;
    int i = start + k;
    float s = layerSD(i, p);
    d = k == 0 ? s : combine(d, s, uMod[i].z, uMod[i].w);
  }
  return d * mark.x;
}

float scene(vec2 p) {
  ${
    morph
      ? `int passes = uMorph > 0.0 && uMorph < 1.0 ? 2 : 1;
  int first = uMorph >= 1.0 ? 1 : 0;
  float result[2];
  result[0] = 1e5;
  result[1] = 1e5;
  for (int s = 0; s < 2; s++) {
    if (s >= passes) break;
    bool second = first + s == 1;
    result[s] = sceneRange(second ? MAXL : 0, second ? uCountB : uCountA, second ? uMarkB : uMarkA, p);
  }
  return passes == 2 ? mix(result[0], result[1], uMorph) : result[0];`
      : 'return sceneRange(0, uCountA, uMarkA, p);'
  }
}

vec4 encodeField(float d) {
  float v = floor(clamp(d / ${FIELD_RANGE.toFixed(1)} + 0.5, 0.0, 1.0) * 16777215.0);
  float r = floor(v / 65536.0);
  v -= r * 65536.0;
  float g = floor(v / 256.0);
  float b = v - g * 256.0;
  return vec4(r, g, b, 255.0) / 255.0;
}

vec4 over(vec4 base, vec4 top) {
  return top + base * (1.0 - top.a);
}

vec3 toLinear(vec3 c) {
  return pow(c, vec3(2.2));
}

vec3 toDisplay(vec3 c) {
  return pow(max(c, 0.0), vec3(1.0 / 2.2));
}

vec4 materialColor(vec2 p) {
  vec2 uv = (p * uUnit + uCenter) / uResolution;
  vec4 t = texture(uMatTex, uv);
  float a = t.a + uColor1.a * (1.0 - t.a);
  if (a < 1e-4) return vec4(0.0);
  vec3 c = (t.rgb * t.a + uColor1.rgb * uColor1.a * (1.0 - t.a)) / a;
  return vec4(c, a);
}

${material?.kind === 'fill' ? fillHelpers(material) : ''}
vec4 gradientColor(vec4 kind, vec2 p) {
  if (kind.x < 1.5) return uColor1;
#ifdef HAS_FILL_MATERIAL
  if (kind.x > 6.5) return fill(p, uTime);
#endif
  if (kind.x > 5.5) return materialColor(p);
  if (kind.x > 4.5) {
    if (uLogoLayer < 0) return uColor1;
    int slot = uType[uLogoLayer] - ${MASK_TYPE};
    vec2 h = uMaskInfo[slot].xy;
    vec4 rep = uRep[uLogoLayer];
    vec2 m = rot2(-uMarkA.y) * (p - uMarkA.zw) / uMarkA.x;
    if (rep.z > 0.5) m.x = abs(m.x);
    int reach = uPat2[uLogoLayer].w > 0.5 ? 0 : copyReach(rep.x);
    for (int k = -2; k <= 2; k++) {
      if (k < -reach || k > reach) continue;
      vec2 q = rowFold(uLogoLayer, layerPoint(uLogoLayer, reach > 0 ? copyPoint(m, rep.x, rep.y, k) : m));
      vec2 uv = q / h * 0.5 + 0.5;
      if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) continue;
      vec4 c = texture(uLogoTex, uv);
      if (c.a >= 0.02) return vec4(c.rgb / c.a, 1.0);
    }
    return uColor1;
  }
  float t;
  if (kind.x < 2.5) {
    vec2 dir = vec2(sin(kind.y), -cos(kind.y));
    t = dot(p, dir) * 0.5 / max(kind.z, 0.05) + 0.5;
  } else if (kind.x < 3.5) {
    t = length(p) / max(kind.z, 0.05);
  } else {
    t = fract((atan(p.x, -p.y) - kind.y) / TAU);
  }
  t = clamp(t, 0.0, 1.0);
  vec3 c;
  float alpha;
  if (kind.w > 0.5) {
    float u = t * 2.0;
    vec3 a = u < 1.0 ? toLinear(uColor1.rgb) : toLinear(uColor2.rgb);
    vec3 b = u < 1.0 ? toLinear(uColor2.rgb) : toLinear(uColor3.rgb);
    float f = u < 1.0 ? u : u - 1.0;
    c = toDisplay(mix(a, b, f));
    alpha = u < 1.0 ? mix(uColor1.a, uColor2.a, f) : mix(uColor2.a, uColor3.a, f);
  } else {
    c = toDisplay(mix(toLinear(uColor1.rgb), toLinear(uColor2.rgb), t));
    alpha = mix(uColor1.a, uColor2.a, t);
  }
  return vec4(c, alpha);
}

vec4 backgroundColor(vec2 p) {
  if (uBg.x < 0.5) return vec4(0.0);
  if (uBg.x < 1.5) return uBgColor1;
  vec2 dir = vec2(sin(uBg.y), -cos(uBg.y));
  float t = clamp(dot(p, dir) * 0.5 / max(uBg.z, 0.05) + 0.5, 0.0, 1.0);
  vec3 c = toDisplay(mix(toLinear(uBgColor1.rgb), toLinear(uBgColor2.rgb), t));
  return vec4(c, mix(uBgColor1.a, uBgColor2.a, t));
}
vec3 bevelNormal(vec2 p, float d, vec2 g, float bw, out vec2 shift) {
  vec2 n;
  float rim;
  vec3 N;
  if (uSurfInfo.z > 0.5) {
    vec4 sf = texture(uSurfTex, p * uSurfInfo.xy + 0.5);
    float q = 1.0 - clamp(sf.x, 0.0, 1.0);
    float slope = q / max(sqrt(max(1.0 - q * q, 0.0)), 0.12);
    n = -sf.yz * bw * q;
    rim = 1.0;
    N = normalize(vec3(-sf.yz * slope * bw, 1.0));
  } else {
    float glen = length(g);
    n = glen > 1e-5 ? g / glen : vec2(0.0);
    rim = min(clamp(1.0 + d / bw, 0.0, 1.0), 0.985) * smoothstep(0.15, 0.85, glen);
    N = normalize(vec3(n * rim, sqrt(1.0 - rim * rim)));
  }
  shift = n * rim * rim * bw * uBevel.w * 0.6;
  return N;
}

vec3 dither(vec2 f) {
  float a = fract(52.9829189 * fract(dot(f, vec2(0.06711056, 0.00583715))));
  float b = fract(52.9829189 * fract(dot(f + vec2(17.0, 31.0), vec2(0.06711056, 0.00583715))));
  return vec3((a + b - 1.0) / 255.0);
}

float bevelLight(vec3 N) {
  vec3 L = normalize(vec3(cos(uBevel.y) * 0.62, sin(uBevel.y) * 0.62, 0.78));
  float diffuse = max(dot(N, L), 0.0) / L.z;
  float occlusion = mix(1.0, 0.78, 1.0 - N.z);
  return mix(1.0, diffuse * occlusion, uBevel.x);
}
${material && material.kind !== 'fill' ? materialHelpers(material) : ''}
void main() {
  vec2 frag = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 p = (frag - uCenter) / uUnit;
  float px = 1.0 / uUnit;
  bool shadowed = ${shadow ? 'uEncode < 0.5 && uShadow.x > 0.0' : 'false'};
#ifdef HAS_MATERIAL
  bool beveled = ${bevel ? 'uEncode < 0.5 && MATERIAL_NORMALS' : 'false'};
  float bw = max(uSurface.x, px);
#else
  bool lit = uEncode < 0.5 && uFill.x > 0.5 && uBevel.z > 0.0;
  bool beveled = ${bevel ? 'lit && uSurfInfo.z < 0.5' : 'false'};
  float bw = max(uBevel.z, px);
#endif
  float e = clamp(bw * 0.2, px * 1.5, max(bw * 0.5, px * 1.5));
  ${
    shadow || bevel
      ? `vec2 points[6];
  points[0] = p;
  int count = 1;
  int shadowAt = -1;
  if (shadowed) {
    shadowAt = count;
    points[count] = p - uShadowOffset.xy;
    count += 1;
  }
  int glossAt = -1;
  if (beveled) {
    glossAt = count;
    points[count] = p + vec2(e, 0.0);
    points[count + 1] = p - vec2(e, 0.0);
    points[count + 2] = p + vec2(0.0, e);
    points[count + 3] = p - vec2(0.0, e);
    count += 4;
  }
  float values[6];
  for (int k = 0; k < 6; k++) {
    if (k >= count) break;
    values[k] = scene(points[k]);
  }
  float d = values[0];
  float aa = clamp(length(vec2(dFdx(d), dFdy(d))), px * 0.5, px * 1.5);
  vec2 g = glossAt >= 0
    ? vec2(values[glossAt] - values[glossAt + 1], values[glossAt + 2] - values[glossAt + 3]) / (2.0 * e)
    : vec2(0.0);`
      : `float d = scene(p);
  float aa = clamp(length(vec2(dFdx(d), dFdy(d))), px * 0.5, px * 1.5);
  vec2 g = vec2(0.0);`
  }
  if (uEncode > 1.5) {
    outColor = vec4(d, 0.0, 0.0, 1.0);
    return;
  }
  if (uEncode > 0.5) {
    outColor = encodeField(d);
    return;
  }

  vec4 bg = backgroundColor(p);
  vec4 col = vec4(bg.rgb * bg.a, bg.a);

  ${
    shadow
      ? `if (shadowAt >= 0) {
    float ds = values[shadowAt];
    float blur = max(uShadow.y, px);
    float a = (1.0 - smoothstep(-blur, blur, ds)) * uShadow.x;
    col = over(col, vec4(uShadowColor.rgb, 1.0) * a * uShadowColor.a);
  }`
      : ''
  }

  if (uGlow.x > 0.0) {
    float g = exp(-max(d, 0.0) / max(uGlow.y, 0.01)) * uGlow.x;
    g *= clamp(d / aa + 0.5, 0.0, 1.0);
    col = over(col, vec4(uGlowColor.rgb, 1.0) * clamp(g, 0.0, 1.0) * uGlowColor.a);
  }

  if (uOutline.x > 0.0) {
    float w = uOutline.y;
    float dout = uOutline.z > 0.5 ? abs(d) - w * 0.5 : d - w;
    float c = clamp(0.5 - dout / aa, 0.0, 1.0);
    col = over(col, vec4(uOutlineColor.rgb, 1.0) * c * uOutlineColor.a);
  }

#ifdef HAS_MATERIAL
  {
    Surface s;
    s.p = p;
    s.uv = frag / uResolution;
    s.frag = frag;
    s.res = uResolution;
    s.unit = uUnit;
    s.px = px;
    s.d = d;
    s.aa = aa;
    s.cov = clamp(0.5 - d / aa, 0.0, 1.0);
    s.slope = length(g);
    s.n = s.slope > 1e-5 ? g / s.slope : vec2(0.0);
    s.time = uTime;
    vec4 m = material(s);
    float reach = 1.0 - smoothstep(MATERIAL_REACH * 0.55, MATERIAL_REACH, d);
    float ma = clamp(MATERIAL_OUTSIDE ? m.a * max(reach, s.cov) : m.a * s.cov, 0.0, 1.0);
    col = over(col, vec4(clamp(m.rgb, 0.0, 1.0) * ma, ma));
  }
#else
  float fillCov = clamp(0.5 - d / aa, 0.0, 1.0);
  if (uFill.x > 0.5 && (uFill.x < 6.5 || fillCov > 0.0)) {
    float cov = fillCov;
    vec4 fc;
    if (lit) {
      vec2 shift;
      vec3 N = bevelNormal(p, d, g, bw, shift);
      bool bend = uFill.x < 4.5 || uFill.x > 5.5;
      fc = gradientColor(uFill, bend ? p + shift : p);
      fc.rgb = clamp(fc.rgb * bevelLight(N) + dither(gl_FragCoord.xy), 0.0, 1.0);
    } else {
      fc = gradientColor(uFill, p);
    }
    col = over(col, vec4(fc.rgb, 1.0) * fc.a * cov);
  }
#endif

  outColor = col;
}`;
