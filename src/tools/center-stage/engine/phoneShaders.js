import { COMMON, STUDIO } from './shaders';

export const PHONE_VS = `
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUv;
in float aPart;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform mat3 uNormalMatrix;
centroid out vec3 vWorld;
centroid out vec3 vNormal;
centroid out vec3 vLocal;
centroid out vec3 vLocalNormal;
centroid out vec2 vUv;
flat out float vPart;
void main() {
  vec4 world = uModel * vec4(aPosition, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(uNormalMatrix * aNormal);
  vLocal = aPosition;
  vLocalNormal = aNormal;
  vUv = aUv;
  vPart = aPart;
  gl_Position = uProj * uView * world;
}`;

export const PHONE_FS = `
${COMMON}
${STUDIO}
centroid in vec3 vWorld;
centroid in vec3 vNormal;
centroid in vec3 vLocal;
centroid in vec3 vLocalNormal;
centroid in vec2 vUv;
flat in float vPart;
uniform mat3 uNormalMatrix;
uniform vec3 uCamPos;
uniform float uOpacity;
uniform vec3 uMetal;
uniform float uRough;
uniform float uBrushed;
uniform float uGlass;
uniform float uGlassRough;
uniform float uGlassLights;
uniform vec2 uSize;
uniform float uChin;
uniform float uMidZ;
uniform vec4 uScreen;
uniform vec2 uScreenCenter;
uniform vec2 uScreenCorners;
uniform vec4 uIsland;
uniform float uIslandRadius;
uniform vec3 uIslandCam;
uniform float uHasIsland;
uniform sampler2D uMedia;
uniform float uHasMedia;
uniform vec4 uMediaXform;
uniform vec4 uMediaCrop;
uniform vec3 uScreenFill;
uniform float uScreenGlow;
uniform sampler2D uChrome;
uniform float uHasChrome;
uniform vec4 uChromeLayout;
uniform vec2 uChromeBar;
uniform float uHasWindow;
uniform vec4 uWindow;
uniform vec2 uWindowCorners;
uniform float uPortEdge;
uniform float uHasPort;
uniform vec4 uKeyboard;
uniform sampler2D uLegend;
uniform vec4 uTrackpad;
uniform float uTrackpadRadius;
uniform vec4 uGrille;
uniform vec2 uGrillePitch;
uniform vec2 uShadowDir;
uniform vec4 uPlateau;
uniform vec2 uPlateauCorners;
uniform vec2 uLenses[3];
uniform float uLensOuter;
uniform vec3 uFlash;
uniform vec3 uLidar;
uniform vec3 uMic;
uniform vec4 uControl;
uniform float uAntenna;
out vec4 outColor;

float sdSuper(vec2 p, vec2 halfSize, float r, float n) {
  vec2 q = abs(p) - halfSize + r;
  vec2 m = max(q, 0.0) / max(r, 1e-4);
  float k = pow(pow(m.x, n) + pow(m.y, n), 1.0 / n);
  return (k - 1.0) * r + min(max(q.x, q.y), 0.0);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float grain(vec2 p) {
  vec2 cell = p * 14.0;
  float fade = 1.0 - smoothstep(0.35, 0.8, max(fwidth(cell.x), fwidth(cell.y)));
  return (hash12(floor(cell)) - 0.5) * fade;
}

vec3 satinMetal(vec3 base, vec3 n, vec3 v, float rough, vec3 tangentLocal, vec2 grainAt) {
  vec3 color;
  if (uBrushed > 0.5) {
    vec3 t = normalize(uNormalMatrix * tangentLocal);
    vec3 b = normalize(cross(n, t));
    color = vec3(0.0);
    for (int i = -2; i <= 2; i++) color += metalLit(vWorld, base, normalize(n + b * float(i) * 0.1), v, rough, 0.14);
    color /= 5.0;
  } else {
    color = metalLit(vWorld, base, n, v, rough, 0.14);
  }
  return color * (1.0 + grain(grainAt) * 0.07);
}

vec3 polishedMetal(vec3 n, vec3 v) {
  return metalLit(vWorld, min(uMetal * 1.12 + 0.01, vec3(1.0)), n, v, 0.17, 0.05);
}

float antennaMask(vec2 p, float reach) {
  if (abs(p.x) < uSize.x * 0.5 - reach) return 0.0;
  float d = abs(abs(p.y) - uAntenna) - 0.42;
  return coverage(d);
}

vec3 antennaColor(vec3 n, vec3 v) {
  vec3 tone = mix(uMetal, vec3(0.5), 0.18);
  return metalLit(vWorld, tone * 0.82, n, v, 0.55, 0.45);
}

vec3 screenMedia(vec2 local, float lod) {
  if (uHasMedia < 0.5) return uScreenFill;
  vec2 muv = local * uMediaXform.xy + uMediaXform.zw;
  vec2 inside = step(vec2(0.0), muv) * step(muv, vec2(1.0));
  vec2 cuv = mix(uMediaCrop.xy, uMediaCrop.zw, clamp(muv, 0.0, 1.0));
  vec4 m = textureLod(uMedia, cuv, lod);
  return mix(uScreenFill, m.rgb + uScreenFill * (1.0 - m.a), inside.x * inside.y);
}

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec3 phoneChrome(vec3 media, vec2 local, vec2 content) {
  float top = uChromeLayout.x;
  if (local.y < top) {
    float t = clamp(local.y / top, 0.0, 1.0);
    float ease = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    vec3 edge = (screenMedia(vec2(0.02, 0.002), 4.0) + screenMedia(vec2(0.98, 0.002), 4.0)) * 0.5;
    vec3 row = screenMedia(vec2(local.x, 0.0), mix(4.5, 0.0, ease));
    vec3 fill = mix(row, edge, (1.0 - ease) * 0.3);
    vec3 band = vec3(0.0);
    for (int i = 0; i < 6; i++) band += screenMedia(vec2((float(i) + 0.5) / 6.0, 0.0), 4.0);
    vec3 tone = mix(band / 6.0, edge, 0.15);
    float glyph = texture(uChrome, vec2(local.x, local.y / top * uChromeLayout.z)).r;
    vec3 ink = mix(vec3(1.0), vec3(0.0), smoothstep(0.5, 0.64, luma(tone)));
    return mix(fill, ink, glyph);
  }
  float barTop = 1.0 - uChromeLayout.y;
  if (uChromeBar.x < 0.5 || local.y < barTop) return media;
  vec4 g = texture(uChrome, vec2(local.x, mix(uChromeLayout.w, 1.0, (local.y - barTop) / uChromeLayout.y)));
  if (g.g + g.a <= 0.0) return media;
  float cy = (uChromeBar.y - top) / (1.0 - top);
  float tone = luma(screenMedia(vec2(0.2, cy), 5.0)) + luma(screenMedia(vec2(0.5, cy), 5.0)) + luma(screenMedia(vec2(0.8, cy), 5.0));
  float light = smoothstep(0.42, 0.62, tone / 3.0);
  vec3 under = screenMedia(content, 4.0) * 0.4;
  under += screenMedia(content + vec2(0.03, 0.0), 4.0) * 0.15;
  under += screenMedia(content - vec2(0.03, 0.0), 4.0) * 0.15;
  under += screenMedia(content + vec2(0.0, 0.014), 4.0) * 0.15;
  under += screenMedia(content - vec2(0.0, 0.014), 4.0) * 0.15;
  vec3 tint = mix(vec3(0.17, 0.17, 0.18), vec3(0.985), light);
  vec3 glass = mix(under, tint, mix(0.52, 0.7, light));
  glass += g.b * mix(0.2, 0.45, light) * (vec3(1.0) - glass);
  vec3 base = media * (1.0 - g.a * mix(0.4, 0.14, light));
  base = mix(base, glass, g.g);
  vec3 ink = mix(vec3(1.0), vec3(0.06), light);
  return mix(base, ink, g.r);
}

float screenDistance(vec2 sp) {
  return sp.y > 0.0 ? sdSuper(sp, uScreen.xy, uScreenCorners.x, uScreen.w) : sdSuper(sp, uScreen.xy, uScreenCorners.y, uScreen.w);
}

vec3 frontFace(vec3 n, vec3 v) {
  vec2 p = vLocal.xy;
  vec2 sp = p - uScreenCenter;
  float screen = coverage(screenDistance(sp));
  vec3 emit = vec3(0.0);
  if (screen > 0.0) {
    vec2 local = vec2((sp.x + uScreen.x) / (2.0 * uScreen.x), (uScreen.y - sp.y) / (2.0 * uScreen.y));
    float top = uHasChrome > 0.5 ? uChromeLayout.x : 0.0;
    vec2 content = vec2(local.x, (local.y - top) / (1.0 - top));
    vec3 media = uScreenFill;
    if (uHasMedia > 0.5) {
      vec2 muv = content * uMediaXform.xy + uMediaXform.zw;
      vec2 inside = step(vec2(0.0), muv) * step(muv, vec2(1.0));
      vec2 cuv = mix(uMediaCrop.xy, uMediaCrop.zw, clamp(muv, 0.0, 1.0));
      vec4 m = texture(uMedia, cuv);
      media = mix(uScreenFill, m.rgb + uScreenFill * (1.0 - m.a), inside.x * inside.y);
    }
    if (uHasChrome > 0.5) media = phoneChrome(media, local, content);
    float nv = clamp(dot(n, v), 0.0, 1.0);
    emit = toLinear(media) * uScreenGlow * mix(0.88, 1.0, nv) * screen;
  }
  if (uHasIsland > 0.5) {
    vec2 ip = p - uIsland.xy;
    float island = coverage(sdRoundRect(ip, uIsland.zw, uIslandRadius));
    float lr = length(ip - uIslandCam.xy);
    float lens = coverage(lr - uIslandCam.z);
    float ring = lens - coverage(lr - uIslandCam.z * 0.7);
    float core = coverage(lr - uIslandCam.z * 0.32);
    vec3 cam = vec3(0.004, 0.005, 0.012) + vec3(0.012, 0.012, 0.035) * ring + vec3(0.025, 0.02, 0.07) * core;
    emit = mix(emit, cam * lens, island);
  }
  vec3 reflection = screenGlass(vWorld, n, v, uGlassRough, 0.04, uGlassLights) * uGlass;
  vec3 black = vec3(0.0015) * studioIrradiance(vWorld, n);
  vec3 glass = toSrgb(emit + tonemap((reflection + black) * uExposure));
  if (uChin <= 0.0) return glass;
  float edge = p.y + uSize.y * 0.5 - uChin;
  float strip = coverage(edge);
  if (strip <= 0.0) return glass;
  vec3 metal = finishColor(metalLit(vWorld, uMetal * 0.97, n, v, uRough + 0.06, 0.3));
  float groove = 1.0 - coverage(abs(edge + 0.18) - 0.18) * 0.55;
  return mix(glass, metal * groove, strip);
}

vec3 rimFace(vec3 n, vec3 v) {
  vec3 lit = dielectricLit(vWorld, vec3(0.003), n, v, uGlassRough > 0.2 ? 0.3 : 0.06, 0.05);
  return finishColor(lit * mix(0.5, 1.0, uGlass));
}

vec3 bandFace(vec3 n, vec3 v) {
  vec3 ln = normalize(vLocalNormal);
  vec3 tangent = abs(ln.z) < 0.92 ? normalize(vec3(-ln.y, ln.x, 0.0)) : vec3(1.0, 0.0, 0.0);
  vec2 along = abs(ln.x) > abs(ln.y) ? vLocal.yz : vLocal.xz;
  vec3 color = satinMetal(uMetal, n, v, uRough, tangent, along);
  float ant = antennaMask(vLocal.xy, 2.6);
  if (ant > 0.0) color = mix(color, antennaColor(n, v), ant);
  float halfW = uSize.x * 0.5;
  if (ln.x > 0.7 && vLocal.x > halfW - 0.3) {
    vec2 cp = vec2(vLocal.y - uControl.x, vLocal.z - uControl.y);
    float dc = sdRoundRect(cp, uControl.zw, uControl.w);
    float outer = coverage(dc);
    if (outer > 0.0) {
      float inner = coverage(dc + 0.42);
      vec3 sapphire = metalLit(vWorld, uMetal * 0.92, n, v, 0.16, 0.2);
      vec3 ring = polishedMetal(n, v);
      vec3 control = mix(ring, sapphire, inner);
      float groove = coverage(abs(dc + 0.42) - 0.05);
      control = mix(control, control * 0.25, groove);
      color = mix(color, control, outer);
    }
  }
  bool bottomPort = uHasPort > 0.5 && uPortEdge < 0.5 && ln.y < -0.7 && vLocal.y < -uSize.y * 0.5 + 0.6;
  bool rightPort = uHasPort > 0.5 && uPortEdge > 0.5 && ln.x > 0.7 && vLocal.x > uSize.x * 0.5 - 0.6;
  if (bottomPort || rightPort) {
    vec2 bp = bottomPort ? vec2(vLocal.x, vLocal.z - uMidZ) : vec2(vLocal.y, vLocal.z - uMidZ);
    float port = sdRoundRect(bp, vec2(4.45, 1.6), 1.6);
    float holes = 1e3;
    for (int i = 0; i < 6; i++) {
      float x = 10.2 + float(i) * 2.15;
      holes = min(holes, length(bp - vec2(x, 0.0)) - 0.5);
      holes = min(holes, length(bp - vec2(-x, 0.0)) - 0.5);
    }
    float screws = min(length(bp - vec2(6.6, 0.0)), length(bp - vec2(-6.6, 0.0))) - 0.6;
    vec3 bevel = polishedMetal(n, v);
    float portMask = coverage(port + 0.28);
    float portRim = coverage(abs(port + 0.14) - 0.14);
    color = mix(color, bevel, portRim);
    color = mix(color, vec3(0.0015), portMask);
    float holeRim = coverage(abs(holes + 0.08) - 0.08);
    color = mix(color, bevel * 0.8, holeRim);
    color = mix(color, vec3(0.0012), coverage(holes + 0.16));
    vec3 screw = metalLit(vWorld, vec3(0.5), n, v, 0.25, 0.1);
    color = mix(color, screw, coverage(screws) * 0.9);
  }
  return finishColor(color);
}

vec3 backFace(vec3 n, vec3 v) {
  vec2 p = vLocal.xy;
  vec3 metal = satinMetal(uMetal, n, v, uRough, vec3(0.0, 1.0, 0.0), p);
  vec3 color = metal;
  if (uHasWindow > 0.5) {
    vec2 wp = p - uWindow.xy;
    float dw = wp.y > 0.0 ? sdSuper(wp, uWindow.zw, uWindowCorners.x, 2.0) : sdSuper(wp, uWindow.zw, uWindowCorners.y, uScreen.w);
    float inside = coverage(dw);
    vec3 glass = metalLit(vWorld, uMetal * 0.97, n, v, 0.56, 0.3) + glassOnly(vWorld, n, v, 0.4, 0.04) * 0.5;
    color = mix(metal, glass, inside);
    float seam = coverage(abs(dw) - 0.07);
    color = mix(color, color * 0.55, seam * 0.6);
  }
  vec2 pp = p - uPlateau.xy;
  vec2 ps = pp + uShadowDir * 1.1;
  float dp = ps.y > 0.0 ? sdSuper(ps, uPlateau.zw, uPlateauCorners.x, uScreen.w) : sdSuper(ps, uPlateau.zw, uPlateauCorners.y, 2.0);
  float dc = pp.y > 0.0 ? sdSuper(pp, uPlateau.zw, uPlateauCorners.x, uScreen.w) : sdSuper(pp, uPlateau.zw, uPlateauCorners.y, 2.0);
  color *= mix(0.5, 1.0, smoothstep(-0.4, 3.2, dp)) * mix(0.72, 1.0, smoothstep(0.0, 0.9, dc));
  float ant = antennaMask(p, 2.5);
  if (ant > 0.0) color = mix(color, antennaColor(n, v), ant);
  return finishColor(color);
}

vec3 plateauFace(vec3 n, vec3 v) {
  vec2 p = vLocal.xy;
  float ao = 1.0;
  for (int i = 0; i < 3; i++) {
    float d = length(p - uLenses[i]) - uLensOuter;
    float drop = length(p - uLenses[i] + uShadowDir * 1.3) - uLensOuter;
    ao *= mix(0.55, 1.0, smoothstep(0.0, 0.9, d)) * mix(0.55, 1.0, smoothstep(-0.6, 2.6, drop));
  }
  vec3 color = satinMetal(uMetal, n, v, uRough, vec3(1.0, 0.0, 0.0), p) * ao;
  float fd = length(p - uFlash.xy);
  float flash = coverage(fd - uFlash.z);
  if (flash > 0.0) {
    float t = fd / uFlash.z;
    float rings = 0.5 + 0.5 * cos(t * 30.0);
    vec3 diffuser = vec3(0.86, 0.84, 0.78) * mix(0.84, 1.0, rings) * mix(1.1, 0.88, smoothstep(0.15, 0.8, t));
    vec3 lens = dielectricLit(vWorld, diffuser, n, v, 0.12, 0.05) + glassOnly(vWorld, n, v, 0.04, 0.04);
    float rim = coverage(abs(fd - uFlash.z + 0.24) - 0.2);
    lens = mix(lens, lens * 0.45, rim);
    color = mix(color, lens, flash);
  }
  float ld = length(p - uLidar.xy);
  float lidar = coverage(ld - uLidar.z);
  if (lidar > 0.0) {
    vec3 glass = vec3(0.0015) + glassOnly(vWorld, n, v, 0.05, 0.012);
    float rim = coverage(abs(ld - uLidar.z + 0.16) - 0.14);
    glass = mix(glass, polishedMetal(n, v) * 0.55, rim);
    color = mix(color, glass, lidar);
  }
  float md = length(p - uMic.xy) - uMic.z;
  color = mix(color, vec3(0.002), coverage(md));
  return finishColor(color);
}

vec3 lensFace(vec3 n, vec3 v) {
  vec2 q = vUv;
  float rr = length(q);
  vec3 ax = normalize(uNormalMatrix * vec3(1.0, 0.0, 0.0));
  vec3 ay = normalize(uNormalMatrix * vec3(0.0, 1.0, 0.0));
  float nvc = clamp(dot(n, v), 1e-3, 1.0);
  vec3 coverTint = mix(vec3(0.75, 0.6, 1.0), vec3(1.0), pow(1.0 - nvc, 3.0));
  vec3 cover = glassOnly(vWorld, n, v, 0.02, 0.01) * coverTint;
  float retainer = smoothstep(0.84, 0.87, rr);
  float lip = coverage(abs(rr - 0.825) - 0.014);
  vec3 bent = normalize(n + (ax * q.x + ay * q.y) * 0.8);
  float nv = clamp(dot(bent, v), 1e-3, 1.0);
  vec3 tint = mix(vec3(0.55, 0.45, 1.0), vec3(0.5, 0.75, 0.9), smoothstep(0.2, 0.8, rr));
  vec3 coat = studioSpecular(vWorld, bent, v, 0.06, 1.0) * (0.018 + 0.2 * pow(1.0 - nv, 5.0)) * tint;
  float iris = coverage(abs(rr - 0.44) - 0.012);
  float pupil = 1.0 - smoothstep(0.1, 0.18, rr);
  vec3 interior = vec3(0.0008) + vec3(0.006, 0.0065, 0.01) * iris + vec3(0.003, 0.003, 0.012) * pupil;
  vec3 element = interior + coat;
  vec3 ring = vec3(0.0012) + glassOnly(vWorld, n, v, 0.45, 0.01);
  vec3 color = mix(element, ring, retainer);
  color = mix(color, color + vec3(0.006), lip);
  return finishColor(color + cover);
}

vec3 keyTop(vec3 n, vec3 v) {
  vec2 kuv = vec2((vLocal.x - uKeyboard.x) / uKeyboard.z, (uKeyboard.y + uKeyboard.w - vLocal.y) / uKeyboard.w);
  float legend = texture(uLegend, kuv).a;
  vec3 cap = dielectricLit(vWorld, vec3(0.011), n, v, 0.55, 0.04);
  vec3 ink = dielectricLit(vWorld, vec3(0.36), n, v, 0.62, 0.04);
  return finishColor(mix(cap, ink, legend * 0.92));
}

vec3 deckFace(vec3 n, vec3 v) {
  vec2 p = vLocal.xy;
  vec3 color = satinMetal(uMetal, n, v, uRough, vec3(1.0, 0.0, 0.0), p);
  float dt = sdRoundRect(p - uTrackpad.xy, uTrackpad.zw, uTrackpadRadius);
  float pad = coverage(dt);
  if (pad > 0.0) color = mix(color, metalLit(vWorld, uMetal * 0.97, n, v, max(uRough * 0.72, 0.12), 0.1), pad);
  color = mix(color, color * 0.42, coverage(abs(dt) - 0.11) * 0.85);
  float gx = abs(p.x);
  if (gx > uGrille.x && gx < uGrille.y && p.y > uGrille.z && p.y < uGrille.w) {
    vec2 cell = vec2(gx - uGrille.x, p.y - uGrille.z) / uGrillePitch.x;
    vec2 offset = (fract(cell) - 0.5) * uGrillePitch.x;
    float holes = coverage(length(offset) - uGrillePitch.y);
    float fade = 1.0 - smoothstep(0.3, 0.65, fwidth(cell.x));
    float density = 3.14159 * uGrillePitch.y * uGrillePitch.y / (uGrillePitch.x * uGrillePitch.x);
    color = mix(color, vec3(0.003), mix(density, holes, fade) * 0.94);
  }
  return finishColor(color);
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(uCamPos - vWorld);
  normalFootprint(n);
  int part = int(vPart + 0.5);
  vec3 color;
  if (part == 2) color = frontFace(n, v);
  else if (part == 0) color = rimFace(n, v);
  else if (part == 3) color = backFace(n, v);
  else if (part == 4) color = plateauFace(n, v);
  else if (part == 5) color = finishColor(polishedMetal(n, v));
  else if (part == 6) color = lensFace(n, v);
  else if (part == 7) color = finishColor(vec3(0.0015) + glassOnly(vWorld, n, v, 0.5, 0.012) * 0.6);
  else if (part == 8) color = finishColor(dielectricLit(vWorld, vec3(0.011), n, v, 0.58, 0.04));
  else if (part == 9) color = keyTop(n, v);
  else if (part == 10) color = deckFace(n, v);
  else if (part == 11) color = finishColor(metalLit(vWorld, vec3(0.05), n, v, 0.36, 0.3));
  else if (part == 12) color = finishColor(dielectricLit(vWorld, vec3(0.0035), n, v, 0.8, 0.02));
  else color = bandFace(n, v);
  outColor = vec4(color * uOpacity, uOpacity);
}`;
