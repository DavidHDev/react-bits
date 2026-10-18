export const COMMON = `
float sdRoundRect(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

float sdSquircle(vec2 p, vec2 halfSize, float radius) {
  vec2 q = max(abs(p) - halfSize + radius, 0.0) / max(radius, 1e-5);
  float n = 4.0;
  float k = pow(pow(q.x, n) + pow(q.y, n), 1.0 / n);
  vec2 r = abs(p) - halfSize + radius;
  float inner = min(max(r.x, r.y), 0.0);
  return (k - 1.0) * radius + inner;
}

float coverage(float d) {
  float w = max(fwidth(d), 1e-5);
  return clamp(0.5 - d / w, 0.0, 1.0);
}

vec3 envGradient(vec3 dir, vec3 top, vec3 horizon, vec3 bottom) {
  float y = dir.y;
  vec3 upper = mix(horizon, top, smoothstep(0.0, 0.85, y));
  vec3 lower = mix(horizon, bottom, smoothstep(0.0, 0.7, -y));
  return y > 0.0 ? upper : lower;
}
`;

export const STUDIO = `
uniform vec4 uLightPos[6];
uniform vec4 uLightColor[6];
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uSkyGround;
uniform float uExposure;

vec3 toLinear(vec3 c) {
  return pow(max(c, 0.0), vec3(2.2));
}

vec3 toSrgb(vec3 c) {
  return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

float aces1(float x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

vec3 tonemap(vec3 c) {
  float peak = max(max(c.r, c.g), c.b);
  float mapped = aces1(peak);
  vec3 hue = c * (mapped / max(peak, 1e-5));
  return mix(hue, aces(c), smoothstep(0.55, 1.0, mapped));
}

vec3 skyColor(vec3 d, float blur) {
  float y = d.y / (1.0 + blur * 1.2);
  float up = smoothstep(-0.1, 0.95, y);
  float down = smoothstep(0.0, 0.8, -y);
  return uSkyHorizon + (uSkyTop - uSkyHorizon) * up + (uSkyGround - uSkyHorizon) * down;
}

float gKernel = 0.0;

void normalFootprint(vec3 n) {
  vec3 dx = dFdx(n);
  vec3 dy = dFdy(n);
  gKernel = min(0.5 * (dot(dx, dx) + dot(dy, dy)), 0.18);
}

float lobeSharpness(float rough, float nv) {
  float a = max(rough * rough, 0.0016);
  float a2 = min(a * a + gKernel, 1.0);
  return min(2.0 / a2 / (4.0 * max(nv, 0.3)), 40000.0);
}

void studioLights(vec3 p, vec3 n, vec3 r, float sharp, float glass, out vec3 spec, out vec3 irr) {
  spec = vec3(0.0);
  irr = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    vec4 light = uLightPos[i];
    float weight = mix(1.0, uLightColor[i].w, glass);
    vec3 d = light.xyz - p;
    float dist = max(length(d), 1e-4);
    vec3 l = d / dist;
    float s = clamp(light.w / dist, 0.03, 0.92);
    float lam = 4.0 / (s * s);
    vec3 amp = uLightColor[i].rgb * 2.0 * weight;
    float c = lam * sharp / (lam + sharp);
    float vis = smoothstep(-0.3, 0.2, dot(n, l));
    spec += amp * (c / lam) * exp(c * (dot(r, l) - 1.0)) * vis;
    float lm = max(length(lam * l + 2.133 * n), 1e-4);
    irr += amp * (7.351 * exp(lm - lam - 2.133) * (1.0 - exp(-2.0 * lm)) / lm);
  }
}

vec3 studioSpecular(vec3 p, vec3 n, vec3 v, float rough, float glass) {
  float nv = clamp(dot(n, v), 1e-3, 1.0);
  vec3 r = reflect(-v, n);
  vec3 spec;
  vec3 irr;
  studioLights(p, n, r, lobeSharpness(rough, nv), glass, spec, irr);
  float horizon = clamp(1.0 + dot(r, n), 0.0, 1.0);
  return (spec + skyColor(r, clamp(rough * 1.4, 0.0, 1.0))) * horizon * horizon;
}

vec3 studioIrradiance(vec3 p, vec3 n) {
  vec3 spec;
  vec3 irr;
  studioLights(p, n, n, 1.0, 0.0, spec, irr);
  return irr / 3.14159 + skyColor(n, 1.0);
}

vec3 metalLit(vec3 p, vec3 base, vec3 n, vec3 v, float rough, float dye) {
  float nv = clamp(dot(n, v), 1e-3, 1.0);
  vec3 r = reflect(-v, n);
  vec3 spec;
  vec3 irr;
  studioLights(p, n, r, lobeSharpness(rough, nv), 0.0, spec, irr);
  float horizon = clamp(1.0 + dot(r, n), 0.0, 1.0);
  spec = (spec + skyColor(r, clamp(rough * 1.4, 0.0, 1.0))) * horizon * horizon;
  float fw = pow(1.0 - nv, 5.0);
  vec3 F = base + (max(vec3(1.0 - rough), base) - base) * fw;
  float coat = 0.025 + 0.35 * fw;
  vec3 diffuse = base * (irr / 3.14159 + skyColor(n, 1.0)) * dye;
  return (F + coat) * spec + diffuse;
}

vec3 dielectricLit(vec3 p, vec3 albedo, vec3 n, vec3 v, float rough, float f0) {
  float nv = clamp(dot(n, v), 1e-3, 1.0);
  vec3 r = reflect(-v, n);
  vec3 spec;
  vec3 irr;
  studioLights(p, n, r, lobeSharpness(rough, nv), 0.0, spec, irr);
  float horizon = clamp(1.0 + dot(r, n), 0.0, 1.0);
  spec = (spec + skyColor(r, clamp(rough * 1.4, 0.0, 1.0))) * horizon * horizon;
  float F = f0 + (max(1.0 - rough, f0) - f0) * pow(1.0 - nv, 5.0);
  return albedo * (irr / 3.14159 + skyColor(n, 1.0)) * (1.0 - F) + spec * F;
}

vec3 glassOnly(vec3 p, vec3 n, vec3 v, float rough, float f0) {
  float nv = clamp(dot(n, v), 1e-3, 1.0);
  float F = f0 + (max(1.0 - rough, f0) - f0) * pow(1.0 - nv, 5.0);
  return studioSpecular(p, n, v, rough, 1.0) * F;
}

vec3 screenGlass(vec3 p, vec3 n, vec3 v, float rough, float f0, float lights) {
  float nv = clamp(dot(n, v), 1e-3, 1.0);
  vec3 r = reflect(-v, n);
  vec3 spec;
  vec3 irr;
  studioLights(p, n, r, lobeSharpness(rough, nv), 1.0, spec, irr);
  float horizon = clamp(1.0 + dot(r, n), 0.0, 1.0);
  float F = f0 + (max(1.0 - rough, f0) - f0) * pow(1.0 - nv, 5.0);
  return (spec * lights + skyColor(r, clamp(rough * 1.4, 0.0, 1.0))) * horizon * horizon * F;
}

vec3 finishColor(vec3 linear) {
  return toSrgb(tonemap(linear * uExposure));
}
`;

export const DEVICE_VS = `
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUv;
in float aPart;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform mat3 uNormalMatrix;
uniform vec4 uPlane;
centroid out vec3 vWorld;
centroid out vec3 vNormal;
centroid out vec2 vUv;
out float vDepth;
out float vPlaneDist;
void main() {
  vec4 world = uModel * vec4(aPosition, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(uNormalMatrix * aNormal);
  vUv = aUv;
  vPlaneDist = dot(uPlane.xyz, world.xyz) - uPlane.w;
  vec4 view = uView * world;
  vDepth = -view.z;
  gl_Position = uProj * view;
}`;

export const DEVICE_FS = `
${COMMON}
${STUDIO}
centroid in vec3 vWorld;
centroid in vec3 vNormal;
centroid in vec2 vUv;
in float vDepth;
in float vPlaneDist;
uniform float uKind;
uniform vec2 uBody;
uniform float uRadius;
uniform float uSquircle;
uniform float uMirrored;
uniform sampler2D uArt;
uniform float uHasArt;
uniform vec4 uScreenRect;
uniform float uScreenRadius;
uniform sampler2D uMedia;
uniform float uHasMedia;
uniform vec4 uMediaXform;
uniform vec4 uMediaCrop;
uniform vec3 uScreenFill;
uniform vec3 uBodyColor;
uniform vec3 uBandColor;
uniform float uMetal;
uniform float uGloss;
uniform vec3 uLightDir;
uniform vec3 uCamPos;
uniform float uAmbient;
uniform float uKey;
uniform vec3 uEnvTop;
uniform vec3 uEnvHorizon;
uniform vec3 uEnvBottom;
uniform float uGlare;
uniform float uScreenLight;
uniform float uOpacity;
uniform float uFlatChrome;
uniform float uTwoSided;
out vec4 outColor;

vec3 studioMaterial(vec3 base, vec3 n, vec3 v, float metal, float gloss) {
  vec3 lin = toLinear(base);
  float rough = mix(0.56, 0.3, gloss);
  vec3 m = metalLit(vWorld, lin, n, v, rough, 0.18);
  vec3 d = dielectricLit(vWorld, lin, n, v, min(rough + 0.12, 0.8), 0.04);
  return finishColor(mix(d, m, clamp(metal * 1.2, 0.0, 1.0)));
}

vec3 satin(vec3 base, vec3 n, vec3 v, float metal, float gloss) {
  vec3 l = normalize(-uLightDir);
  float wrap = clamp((dot(n, l) + 0.35) / 1.35, 0.0, 1.0);
  vec3 h = normalize(l + v);
  float spec = pow(max(dot(n, h), 0.0), mix(10.0, 48.0, gloss)) * mix(0.08, 0.35, gloss);
  vec3 r = reflect(-v, n);
  vec3 env = envGradient(r, uEnvTop, uEnvHorizon, uEnvBottom);
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 diffuse = base * (uAmbient + uKey * wrap);
  vec3 metallic = base * env * 1.35;
  vec3 color = mix(diffuse, metallic, metal);
  color += env * fres * mix(0.06, 0.18, gloss) * (1.0 - metal * 0.5);
  color += vec3(spec) * mix(vec3(1.0), base * 1.6, metal);
  return color;
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(uCamPos - vWorld);
  normalFootprint(n);
  bool facing = uMirrored > 0.5 ? !gl_FrontFacing : gl_FrontFacing;
  if (!facing) n = -n;
  bool backFace = uTwoSided > 0.5 && uKind > 1.5 && uKind < 2.5;
  if (uKind < 0.5 || (uKind > 2.5 && uKind < 3.5) || backFace) {
    vec2 p = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * uBody;
    float d = uSquircle > 0.5 ? sdSquircle(p, uBody * 0.5, uRadius) : sdRoundRect(p, uBody * 0.5, uRadius);
    float alpha = coverage(d);
    if (alpha <= 0.0) discard;
    vec4 art = uHasArt > 0.5 ? texture(uArt, vUv) : vec4(0.0);
    vec3 base = uBodyColor;
    float screen = 0.0;
    if (uKind < 0.5 || backFace) {
      vec2 size = (uScreenRect.zw - uScreenRect.xy) * uBody;
      vec2 local = (vUv - uScreenRect.xy) / max(uScreenRect.zw - uScreenRect.xy, vec2(1e-5));
      vec2 sp = (vec2(local.x, 1.0 - local.y) - 0.5) * size;
      float ds = sdRoundRect(sp, size * 0.5, uScreenRadius);
      screen = coverage(ds);
      if (screen > 0.0) {
        vec3 media = uScreenFill;
        if (uHasMedia > 0.5) {
          vec2 muv = local * uMediaXform.xy + uMediaXform.zw;
          vec2 inside = step(vec2(0.0), muv) * step(muv, vec2(1.0));
          vec2 cuv = mix(uMediaCrop.xy, uMediaCrop.zw, clamp(muv, 0.0, 1.0));
          vec4 m = texture(uMedia, cuv);
          media = mix(uScreenFill, m.rgb + uScreenFill * (1.0 - m.a), inside.x * inside.y);
        }
        base = mix(base, media, screen);
      }
    }
    vec3 color = art.rgb + base * (1.0 - art.a);
    vec3 shaded = uKind > 2.5 ? studioMaterial(color, n, v, uMetal, uGloss) : satin(color, n, v, 0.0, uGloss);
    if ((uKind < 0.5 || backFace) && uFlatChrome > 0.5) {
      vec3 lf = normalize(-uLightDir);
      float wrapLight = clamp((dot(n, lf) + 0.35) / 1.35, 0.0, 1.0);
      shaded = color * mix(0.95, 1.02, wrapLight);
    }
    float viewFacing = max(dot(n, v), 0.0);
    vec3 emissive = color * mix(0.86, 1.0, viewFacing) * uScreenLight;
    vec3 outRgb = mix(shaded, emissive, screen * (1.0 - art.a));
    vec3 r = reflect(-v, n);
    float sheen = smoothstep(0.15, 0.95, r.y) * (0.35 + 0.65 * pow(1.0 - viewFacing, 3.0));
    outRgb += uGlare * sheen * envGradient(r, uEnvTop, uEnvHorizon, uEnvBottom);
    float a = alpha * uOpacity;
    outColor = vec4(outRgb * a, a);
    return;
  }
  if (uKind < 1.5) {
    vec3 color = studioMaterial(uBandColor, n, v, uMetal, uGloss);
    outColor = vec4(color * uOpacity, uOpacity);
    return;
  }
  if (uKind < 2.5) {
    vec2 p = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * uBody;
    float d = uSquircle > 0.5 ? sdSquircle(p, uBody * 0.5, uRadius) : sdRoundRect(p, uBody * 0.5, uRadius);
    float alpha = coverage(d);
    if (alpha <= 0.0) discard;
    vec3 color = studioMaterial(uBandColor, n, v, uMetal, uGloss);
    float a = alpha * uOpacity;
    outColor = vec4(color * a, a);
    return;
  }
  vec3 color = studioMaterial(uBandColor, n, v, uMetal, uGloss);
  outColor = vec4(color * uOpacity, uOpacity);
}`;

export const DEPTH_FS = `
${COMMON}
centroid in vec3 vWorld;
centroid in vec3 vNormal;
centroid in vec2 vUv;
in float vDepth;
in float vPlaneDist;
uniform float uKind;
uniform vec2 uBody;
uniform float uRadius;
uniform float uSquircle;
uniform float uFloat;
uniform float uDepthScale;
uniform float uHeightMode;
out vec4 outColor;
void main() {
  if (uKind < 0.5 || (uKind > 1.5 && uKind < 3.5)) {
    vec2 p = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * uBody;
    float d = uSquircle > 0.5 ? sdSquircle(p, uBody * 0.5, uRadius) : sdRoundRect(p, uBody * 0.5, uRadius);
    if (d > 0.0) discard;
  }
  float value = uHeightMode > 0.5 ? abs(vPlaneDist) : vDepth;
  if (uFloat > 0.5) outColor = vec4(value, 1.0, 0.0, 1.0);
  else outColor = vec4(clamp(value * uDepthScale, 0.0, 1.0), 1.0, 0.0, 1.0);
}`;

export const DECAL_FS = `
${COMMON}
centroid in vec3 vWorld;
centroid in vec3 vNormal;
centroid in vec2 vUv;
in float vDepth;
in float vPlaneDist;
uniform vec2 uBody;
uniform vec2 uPad;
uniform float uRadius;
uniform float uSoft;
uniform float uStrength;
out vec4 outColor;
void main() {
  vec2 size = uBody + uPad * 2.0;
  vec2 p = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * size;
  float d = sdRoundRect(p, uBody * 0.5, uRadius);
  float near = 1.0 - smoothstep(-uSoft * 0.35, uSoft * 0.35, d);
  float far = 1.0 - smoothstep(-uSoft, uSoft * 2.2, d);
  float a = uStrength * clamp(near * 0.55 + far * 0.45, 0.0, 1.0);
  outColor = vec4(0.0, 0.0, 0.0, a);
}`;

export const QUAD_FS = `
centroid in vec3 vWorld;
centroid in vec3 vNormal;
centroid in vec2 vUv;
in float vDepth;
in float vPlaneDist;
uniform sampler2D uTexture;
uniform float uOpacity;
out vec4 outColor;
void main() {
  vec4 c = texture(uTexture, vUv);
  outColor = c * uOpacity;
}`;

export const QUAD_DEPTH_FS = `
centroid in vec3 vWorld;
centroid in vec3 vNormal;
centroid in vec2 vUv;
in float vDepth;
in float vPlaneDist;
uniform sampler2D uTexture;
uniform float uFloat;
uniform float uDepthScale;
out vec4 outColor;
void main() {
  float a = texture(uTexture, vUv).a;
  if (a < 0.02) discard;
  if (uFloat > 0.5) outColor = vec4(vDepth, 1.0, 0.0, 1.0);
  else outColor = vec4(clamp(vDepth * uDepthScale, 0.0, 1.0), 1.0, 0.0, 1.0);
}`;

export const SHADOW_VS = `
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUv;
in float aPart;
uniform mat4 uModel;
uniform vec3 uNormal;
uniform float uOffset;
uniform vec3 uLight;
uniform float uFacing;
uniform vec3 uAxisU;
uniform vec3 uAxisV;
uniform vec3 uRegion;
out vec2 vUv;
out float vHeight;
void main() {
  vec4 world = uModel * vec4(aPosition, 1.0);
  float h = dot(uNormal, world.xyz) - uOffset;
  vec3 projected = world.xyz + uLight * (-max(h, 0.0) / uFacing);
  vec2 plane = (vec2(dot(projected, uAxisU), dot(projected, uAxisV)) - uRegion.xy) / uRegion.z;
  vUv = aUv;
  vHeight = h;
  gl_Position = vec4(plane * 2.0 - 1.0, 0.0, 1.0);
}`;

export const SHADOW_FS = `
${COMMON}
in vec2 vUv;
in float vHeight;
uniform float uKind;
uniform vec2 uBody;
uniform float uRadius;
uniform float uSquircle;
uniform float uHeightScale;
uniform float uOpacity;
out vec4 outColor;
void main() {
  if (vHeight < -1e-4) discard;
  if (uOpacity < 0.999) {
    vec3 p3 = fract(vec3(gl_FragCoord.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    if (fract((p3.x + p3.y) * p3.z) > uOpacity) discard;
  }
  if (uKind < 0.5 || (uKind > 1.5 && uKind < 3.5)) {
    vec2 p = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * uBody;
    float d = uSquircle > 0.5 ? sdSquircle(p, uBody * 0.5, uRadius) : sdRoundRect(p, uBody * 0.5, uRadius);
    if (d > 0.0) discard;
  }
  outColor = vec4(max(vHeight, 0.0) * uHeightScale, 0.0, 0.0, 0.0);
}`;

export const SHADOW_RESOLVE_FS = `
in vec2 vUv;
uniform sampler2D uSource;
uniform vec2 uTexel;
out vec4 outColor;
void main() {
  vec2 sum = vec2(0.0);
  for (int y = 0; y < 2; y++) {
    for (int x = 0; x < 2; x++) {
      vec4 raw = textureLod(uSource, vUv + (vec2(float(x), float(y)) - 0.5) * uTexel, 0.0);
      float cov = 1.0 - raw.g;
      sum += vec2(cov, cov * min(raw.r, 1e3));
    }
  }
  outColor = vec4(sum * 0.25, 0.0, 1.0);
}`;

export const FULLSCREEN_VS = `
in vec3 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition.xy * 0.5 + 0.5;
  gl_Position = vec4(aPosition.xy, 0.0, 1.0);
}`;

export const DOWNSAMPLE_FS = `
in vec2 vUv;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uLevel;
out vec4 outColor;
vec4 tap(vec2 offset) {
  return textureLod(uSource, vUv + offset * uTexel, uLevel);
}
void main() {
  vec4 a = tap(vec2(-2.0, 2.0));
  vec4 b = tap(vec2(0.0, 2.0));
  vec4 c = tap(vec2(2.0, 2.0));
  vec4 d = tap(vec2(-2.0, 0.0));
  vec4 e = tap(vec2(0.0, 0.0));
  vec4 f = tap(vec2(2.0, 0.0));
  vec4 g = tap(vec2(-2.0, -2.0));
  vec4 h = tap(vec2(0.0, -2.0));
  vec4 i = tap(vec2(2.0, -2.0));
  vec4 j = tap(vec2(-1.0, 1.0));
  vec4 k = tap(vec2(1.0, 1.0));
  vec4 l = tap(vec2(-1.0, -1.0));
  vec4 m = tap(vec2(1.0, -1.0));
  vec4 color = e * 0.125;
  color += (a + c + g + i) * 0.03125;
  color += (b + d + f + h) * 0.0625;
  color += (j + k + l + m) * 0.125;
  outColor = color;
}`;

export const BICUBIC = `
vec4 cubicWeights(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x;
  float y = s.y - 4.0 * s.x;
  float z = s.z - 4.0 * s.y + 6.0 * s.x;
  float w = 6.0 - x - y - z;
  return vec4(x, y, z, w) * (1.0 / 6.0);
}

vec4 bicubicLevel(sampler2D tex, vec2 uv, float level) {
  vec2 size = vec2(textureSize(tex, int(level)));
  vec2 inv = 1.0 / size;
  vec2 coord = uv * size - 0.5;
  vec2 fxy = fract(coord);
  coord -= fxy;
  vec4 xc = cubicWeights(fxy.x);
  vec4 yc = cubicWeights(fxy.y);
  vec4 c = coord.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 s = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
  vec4 offset = c + vec4(xc.yw, yc.yw) / s;
  offset *= inv.xxyy;
  vec4 s0 = textureLod(tex, offset.xz, level);
  vec4 s1 = textureLod(tex, offset.yz, level);
  vec4 s2 = textureLod(tex, offset.xw, level);
  vec4 s3 = textureLod(tex, offset.yw, level);
  float sx = s.x / (s.x + s.y);
  float sy = s.z / (s.z + s.w);
  return mix(mix(s3, s2, sx), mix(s1, s0, sx), sy);
}

vec4 sampleBlur(sampler2D tex, vec2 uv, float lod) {
  float l0 = floor(lod);
  float t = lod - l0;
  vec4 a = l0 < 0.5 ? textureLod(tex, uv, 0.0) : bicubicLevel(tex, uv, l0);
  if (t < 0.001) return a;
  vec4 b = bicubicLevel(tex, uv, l0 + 1.0);
  return mix(a, b, t);
}
`;

export const COMPOSITE_FS = `
${BICUBIC}
in vec2 vUv;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform float uFloat;
uniform float uDepthScale;
uniform float uFocus;
uniform float uCocScale;
uniform float uMaxLod;
uniform float uDilateLod;
uniform float uOpacity;
uniform float uSharp;
out vec4 outColor;

float readDepth(vec2 uv, float level) {
  vec4 d = textureLod(uDepth, uv, level);
  if (d.g < 1e-4) return -1.0;
  float z = d.r / d.g;
  return uFloat > 0.5 ? z : z / max(uDepthScale, 1e-6);
}

void main() {
  if (uSharp > 0.5) {
    outColor = textureLod(uColor, vUv, 0.0) * uOpacity;
    return;
  }
  float zExact = readDepth(vUv, 0.0);
  float zWide = readDepth(vUv, uDilateLod);
  float cov = textureLod(uDepth, vUv, 0.0).g;
  float z = zExact > 0.0 ? zExact : zWide;
  if (z <= 0.0) {
    vec4 c = textureLod(uColor, vUv, 0.0);
    outColor = c * uOpacity;
    return;
  }
  if (zExact > 0.0 && zWide > 0.0 && cov < 0.999) z = mix(zWide, zExact, cov);
  float coc = uCocScale * abs(z - uFocus) / max(z, 1e-4);
  float sigma = coc / 2.3;
  float lod = clamp(log2(max(sigma, 1e-3) / 0.85), 0.0, uMaxLod);
  vec4 color = sampleBlur(uColor, vUv, lod);
  outColor = color * uOpacity;
}`;

export const BLIT_FS = `
in vec2 vUv;
uniform sampler2D uSource;
out vec4 outColor;
void main() {
  outColor = textureLod(uSource, vUv, 0.0);
}`;

export const FINAL_FS = `
in vec2 vUv;
uniform sampler2D uSource;
uniform sampler2D uOverlay;
uniform float uHasOverlay;
uniform float uGrain;
uniform float uSeed;
uniform vec2 uSize;
uniform float uOpaque;
uniform vec3 uBackdrop;
out vec4 outColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec4 c = textureLod(uSource, vUv, 0.0);
  if (uHasOverlay > 0.5) {
    vec4 o = textureLod(uOverlay, vec2(vUv.x, 1.0 - vUv.y), 0.0);
    c = o + c * (1.0 - o.a);
  }
  if (uOpaque > 0.5) c = vec4(c.rgb + uBackdrop * (1.0 - c.a), 1.0);
  vec2 px = vUv * uSize;
  float n = hash12(px + uSeed * 17.0) + hash12(px * 1.37 + uSeed * 9.0) - 1.0;
  float g = uGrain * n;
  vec3 rgb = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
  rgb += g * 0.06 * c.a;
  float dither = (hash12(px + 0.5) - 0.5) / 255.0;
  rgb += dither;
  outColor = vec4(clamp(rgb, 0.0, 1.0) * c.a, c.a);
}`;

export const BACKGROUND_FS = `
${COMMON}
${BICUBIC}
in vec2 vUv;
uniform mat4 uInvViewProj;
uniform vec3 uCamPos;
uniform float uKind;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorD;
uniform float uAngle;
uniform vec2 uAspect;
uniform float uStudio;
uniform float uFloorY;
uniform float uWallZ;
uniform float uCurve;
uniform vec3 uFloorColor;
uniform vec3 uWallColor;
uniform vec3 uPoolCenter;
uniform float uPoolRadius;
uniform float uPoolStrength;
uniform float uSpot;
uniform vec2 uSpotCenter;
uniform float uSpotSize;
uniform float uVignette;
uniform sampler2D uImage;
uniform float uHasImage;
uniform vec4 uImageXform;
uniform float uImageBlur;
uniform float uImageDim;
uniform float uImageSaturation;
uniform sampler2D uShadow;
uniform float uHasShadow;
uniform float uShadowOpacity;
uniform float uShadowHeightScale;
uniform float uShadowMaxLod;
uniform vec3 uShadowTint;
uniform vec3 uShadowAxisU;
uniform vec3 uShadowAxisV;
uniform vec3 uShadowRegion;
uniform vec4 uShadowShape;
uniform vec4 uShadowContact;
uniform float uShadowFloor;
uniform sampler2D uReflection;
uniform sampler2D uReflectionDepth;
uniform float uHasReflection;
uniform float uReflectionStrength;
uniform float uReflectionBlur;
uniform float uReflectionMaxLod;
uniform float uFloat;
uniform float uDepthScale;
uniform float uTime;
uniform float uTransparent;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outDepth;

vec3 ray(vec2 uv) {
  vec4 near = uInvViewProj * vec4(uv * 2.0 - 1.0, -1.0, 1.0);
  vec4 far = uInvViewProj * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
  return normalize(far.xyz / far.w - near.xyz / near.w);
}

vec3 meshGradient(vec2 p) {
  vec2 q = p;
  float t = uTime * 0.04;
  vec2 c1 = vec2(-0.55 + 0.08 * sin(t * 6.283), 0.45);
  vec2 c2 = vec2(0.6, 0.35 + 0.06 * cos(t * 6.283));
  vec2 c3 = vec2(0.15, -0.55);
  float w1 = exp(-dot(q - c1, q - c1) * 2.2);
  float w2 = exp(-dot(q - c2, q - c2) * 2.0);
  float w3 = exp(-dot(q - c3, q - c3) * 1.8);
  float w0 = 0.35;
  vec3 col = uColorA * w0 + uColorB * w1 + uColorC * w2 + uColorD * w3;
  return col / (w0 + w1 + w2 + w3);
}

float ditherNoise(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z) + fract((p3.y + p3.z) * p3.x) - 1.0;
}

vec3 saturateColor(vec3 c, float s) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), c, s);
}

void main() {
  vec2 p = (vUv - 0.5) * uAspect;
  vec3 dir = ray(vUv);
  vec3 color = uColorA;
  float depth = 1e4;
  float onFloor = 0.0;
  vec3 hit = uCamPos + dir * 50.0;

  float tFloor = dir.y < -1e-4 ? (uFloorY - uCamPos.y) / dir.y : 1e9;
  float tWall = dir.z < -1e-4 ? (uWallZ - uCamPos.z) / dir.z : 1e9;
  if (uStudio < 0.5) depth = tWall > 0.0 && tWall < 1e8 ? tWall : 1e3;
  if (uStudio > 0.5) {
    vec3 floorHit = uCamPos + dir * tFloor;
    bool useFloor = tFloor > 0.0 && (floorHit.z > uWallZ + uCurve || tFloor < tWall);
    float t = useFloor ? tFloor : tWall;
    if (t > 1e8) t = 60.0;
    hit = uCamPos + dir * t;
    depth = t;
    if (useFloor && floorHit.z < uWallZ + uCurve) {
      float k = clamp((uWallZ + uCurve - floorHit.z) / max(uCurve, 1e-3), 0.0, 1.0);
      onFloor = 1.0 - smoothstep(0.0, 1.0, k);
    } else {
      onFloor = useFloor ? 1.0 : 0.0;
    }
    float rise = clamp((hit.y - uFloorY) / max(uCurve * 3.0, 1e-3), 0.0, 1.0);
    vec3 surface = mix(uFloorColor, uWallColor, smoothstep(0.0, 1.0, 1.0 - onFloor));
    float floorDist = length(hit.xz - uPoolCenter.xz) / max(uPoolRadius, 1e-3);
    float pool = exp(-floorDist * floorDist * 0.9);
    float floorLight = mix(0.7, 1.0, pool) * mix(1.0, 0.92, smoothstep(1.2, 3.5, floorDist));
    float wallDist = length(vec2(hit.x - uPoolCenter.x, (hit.y - uFloorY) * 0.8 - uPoolRadius * 0.35)) / max(uPoolRadius * 1.6, 1e-3);
    float wallLight = mix(0.74, 1.0, exp(-wallDist * wallDist)) * mix(1.0, 0.86, smoothstep(0.3, 1.0, rise));
    float lightAmount = mix(wallLight, floorLight, onFloor);
    color = surface * mix(1.0, lightAmount, clamp(0.55 + uPoolStrength, 0.0, 1.0));
    float far = smoothstep(8.0, 30.0, depth);
    color = mix(color, uWallColor * 0.86, far * 0.5);
  } else if (uKind < 0.5) {
    color = uColorA;
  } else if (uKind < 1.5) {
    float a = radians(uAngle);
    vec2 d = vec2(cos(a), sin(a));
    float t = clamp(dot(p / max(uAspect.x, uAspect.y), d) + 0.5, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    color = t < 0.5 ? mix(uColorA, uColorB, t * 2.0) : mix(uColorB, uColorC, t * 2.0 - 1.0);
  } else if (uKind < 2.5) {
    color = meshGradient(p / max(uAspect.x, uAspect.y) * 1.6);
  } else if (uKind < 3.5) {
    float r = length(p / max(uAspect.x, uAspect.y) - vec2(0.0, 0.12));
    color = mix(uColorB, uColorA, smoothstep(0.0, 0.85, r));
  }

  if (uHasImage > 0.5 && uStudio < 0.5) {
    vec2 iuv = vec2(vUv.x, 1.0 - vUv.y) * uImageXform.xy + uImageXform.zw;
    vec4 img = uImageBlur > 0.0 ? sampleBlur(uImage, iuv, uImageBlur) : texture(uImage, iuv);
    vec3 ic = img.a > 0.0 ? img.rgb / img.a : vec3(0.0);
    ic = saturateColor(ic, uImageSaturation);
    ic = mix(ic, uColorA, uImageDim);
    color = mix(color, ic, img.a);
  }

  if (uSpot > 0.0) {
    vec2 sp = (vUv - uSpotCenter) * uAspect / max(uAspect.x, uAspect.y);
    float spot = exp(-dot(sp, sp) / max(uSpotSize * uSpotSize, 1e-4));
    color = mix(color, color * (1.0 + 1.6 * uSpot) + uColorB * uSpot * 0.25, spot);
  }

  if (uHasReflection > 0.5 && uReflectionStrength > 0.0) {
    vec2 ruv = vUv;
    vec4 rd = textureLod(uReflectionDepth, ruv, 0.0);
    float h = rd.g > 1e-4 ? rd.r / rd.g : 0.0;
    vec4 wide = textureLod(uReflectionDepth, ruv, 4.0);
    float hw = wide.g > 1e-4 ? wide.r / wide.g : h;
    float height = rd.g > 0.5 ? h : hw;
    if (uFloat < 0.5) height /= max(uDepthScale, 1e-6);
    float lod = clamp(log2(1.0 + height * uReflectionBlur), 0.0, uReflectionMaxLod);
    vec4 refl = sampleBlur(uReflection, ruv, lod);
    float fade = exp(-height * 2.4);
    color = mix(color, color * (1.0 - refl.a * uReflectionStrength * fade) + refl.rgb * uReflectionStrength * fade, onFloor);
  }

  float shadeAmount = 0.0;
  if (uHasShadow > 0.5) {
    vec3 receiverHit = uShadowFloor > 0.5 ? uCamPos + dir * tFloor : uCamPos + dir * tWall;
    bool onReceiver = uShadowFloor > 0.5 ? (tFloor > 0.0 && tFloor < 1e8) : (tWall > 0.0 && tWall < 1e8);
    vec2 suv = (vec2(dot(receiverHit, uShadowAxisU), dot(receiverHit, uShadowAxisV)) - uShadowRegion.xy) / uShadowRegion.z;
    if (onReceiver && suv.x > 0.0 && suv.y > 0.0 && suv.x < 1.0 && suv.y < 1.0) {
      vec4 coarse = bicubicLevel(uShadow, suv, uShadowShape.w);
      vec4 fine = bicubicLevel(uShadow, suv, max(uShadowShape.w - 2.0, 0.0));
      float hCoarse = coarse.r > 1e-4 ? coarse.g / coarse.r : 0.0;
      float hFine = fine.r > 1e-4 ? fine.g / fine.r : hCoarse;
      float height = mix(hCoarse, hFine, smoothstep(0.1, 0.8, fine.r)) / max(uShadowHeightScale, 1e-6);
      float sigma = uShadowShape.x + height * uShadowShape.y;
      float airborne = 1.0 / (1.0 + height / max(uShadowContact.w * 10.0, 1e-3));
      float lod = clamp(log2(max(sigma, 0.85) / 0.85), 0.0, uShadowMaxLod);
      float direct = sampleBlur(uShadow, suv, lod).r;
      float ambient = sampleBlur(uShadow, suv, clamp(log2(uShadowShape.z / 0.85), 0.0, uShadowMaxLod)).r;
      vec4 tight = sampleBlur(uShadow, suv, clamp(log2(uShadowContact.x / 0.85), 0.0, uShadowMaxLod));
      vec4 wide = sampleBlur(uShadow, suv, clamp(log2(uShadowContact.z / 0.85), 0.0, uShadowMaxLod));
      float tightHeight = tight.r > 1e-4 ? tight.g / tight.r / max(uShadowHeightScale, 1e-6) : 1e9;
      float wideHeight = wide.r > 1e-4 ? wide.g / wide.r / max(uShadowHeightScale, 1e-6) : 1e9;
      float crease = tight.r * exp(-tightHeight / max(uShadowContact.y, 1e-4));
      float contact = wide.r * exp(-wideHeight / max(uShadowContact.w, 1e-4));
      float occ = 1.0 - (1.0 - direct * 0.82 * airborne) * (1.0 - ambient * 0.4) * (1.0 - crease * 0.5) * (1.0 - contact * 0.35);
      float shade = clamp(occ * uShadowOpacity, 0.0, 0.85);
      if (uShadowFloor > 0.5 && uStudio > 0.5) shade *= onFloor;
      shadeAmount = shade;
      color = mix(color, color * uShadowTint, shade);
    }
  }

  if (uVignette > 0.0) {
    vec2 q = (vUv - 0.5) * 2.0;
    float v = 1.0 - dot(q * vec2(0.85, 1.0), q * vec2(0.85, 1.0)) * 0.25;
    color *= mix(1.0, smoothstep(0.0, 1.0, v), uVignette);
  }

  color += ditherNoise(gl_FragCoord.xy) * (1.2 / 255.0) * step(min(min(color.r, color.g), color.b), 0.996);
  outColor = uTransparent > 0.5 ? vec4(0.0, 0.0, 0.0, shadeAmount * 0.85) : vec4(color, 1.0);
  float z = depth;
  if (uFloat > 0.5) outDepth = vec4(z, 1.0, 0.0, 1.0);
  else outDepth = vec4(clamp(z * uDepthScale, 0.0, 1.0), 1.0, 0.0, 1.0);
}`;
