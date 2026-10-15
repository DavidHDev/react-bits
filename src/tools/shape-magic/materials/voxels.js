export default {
  id: 'voxels',
  name: 'Voxels',
  kind: 'shape',
  group: 'volume',
  source: 'shaders.com',
  animated: false,
  heavy: true,
  outside: true,
  normals: false,
  surface: 0.05,
  params: [
    { name: 'colorA', label: 'Top', type: 'color', default: '#6ea8ff' },
    { name: 'colorB', label: 'Base', type: 'color', default: '#1d2b4f' },
    {
      name: 'palette',
      label: 'Palette',
      type: 'select',
      options: [
        { value: 0, label: 'Solid' },
        { value: 1, label: 'Height' },
        { value: 2, label: 'Depth' },
        { value: 3, label: 'Random' },
        { value: 4, label: 'Top / sides' }
      ],
      default: 1
    },
    { name: 'size', label: 'Voxel size', type: 'number', min: 0.025, max: 0.15, step: 0.001, default: 0.05 },
    { name: 'height', label: 'Height', type: 'number', min: 0, max: 0.5, step: 0.01, default: 0.3 },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.05, max: 0.8, step: 0.01, default: 0.6 },
    { name: 'tilt', label: 'Tilt', type: 'number', min: 0, max: 0.8, step: 0.01, default: 0.35 },
    { name: 'lightAngle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 225 },
    { name: 'shadows', label: 'Shadows', type: 'number', min: 0, max: 1, step: 0.01, default: 0.85 },
    { name: 'seams', label: 'Seams', type: 'number', min: 0, max: 1, step: 0.01, default: 0.2 },
    { name: 'jitter', label: 'Jitter', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { name: 'gloss', label: 'Gloss', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 }
  ],
  glsl: `
uint m_hash(uvec3 v) {
  uint h = v.x * 0x8da6b343u ^ v.y * 0xd8163841u ^ v.z * 0xcb1ab31fu;
  h ^= h >> 16u;
  h *= 0x7feb352du;
  h ^= h >> 15u;
  h *= 0x846ca68bu;
  h ^= h >> 16u;
  return h;
}

vec3 m_toLab(vec3 c) {
  vec3 lms = vec3(
    dot(c, vec3(0.4122214708, 0.5363325363, 0.0514459929)),
    dot(c, vec3(0.2119034982, 0.6806995451, 0.1073969566)),
    dot(c, vec3(0.0883024619, 0.2817188376, 0.6299787005))
  );
  lms = pow(max(lms, 0.0), vec3(1.0 / 3.0));
  return vec3(
    dot(lms, vec3(0.2104542553, 0.793617785, -0.0040720468)),
    dot(lms, vec3(1.9779984951, -2.428592205, 0.4505937099)),
    dot(lms, vec3(0.0259040371, 0.7827717662, -0.808675766))
  );
}

vec3 m_fromLab(vec3 l) {
  vec3 lms = vec3(
    l.x + 0.3963377774 * l.y + 0.2158037573 * l.z,
    l.x - 0.1055613458 * l.y - 0.0638541728 * l.z,
    l.x - 0.0894841775 * l.y - 1.291485548 * l.z
  );
  lms = lms * lms * lms;
  return vec3(
    dot(lms, vec3(4.0767416621, -3.3077115913, 0.2309699292)),
    dot(lms, vec3(-1.2684380046, 2.6097574011, -0.3413193965)),
    dot(lms, vec3(-0.0041960863, -0.7034186147, 1.707614701))
  );
}

float m_column(vec2 cell, float v, float layers, float width) {
  float d = shapeAt(cell * v);
  if (d > -0.02 * v) return 0.0;
  float x = clamp(-d / width, 0.0, 1.0);
  float dome = sqrt(max(1.0 - (1.0 - x) * (1.0 - x), 0.0));
  return (floor(layers * dome + 0.5) + 1.0) * v;
}

struct m_Hit {
  float z;
  float axis;
  float prev;
  float h;
  vec2 cell;
  vec2 stp;
};

m_Hit m_trace(vec2 p, vec2 e, float top, float v, float layers, float width) {
  vec2 a = (p + e * top) / v + 0.5;
  vec2 dir = p / v + 0.5 - a;
  vec2 cell = floor(a);
  vec2 stp = vec2(dir.x < 0.0 ? -1.0 : 1.0, dir.y < 0.0 ? -1.0 : 1.0);
  vec2 inv = 1.0 / max(abs(dir), vec2(1e-6));
  vec2 tMax = vec2(
    (stp.x > 0.0 ? cell.x + 1.0 - a.x : a.x - cell.x) * inv.x,
    (stp.y > 0.0 ? cell.y + 1.0 - a.y : a.y - cell.y) * inv.y
  );
  float sIn = 0.0;
  float axis = -1.0;
  float prev = 0.0;
  m_Hit hit = m_Hit(-1.0, -1.0, 0.0, 0.0, cell, stp);
  for (int i = 0; i < 24; i++) {
    float sOut = min(min(tMax.x, tMax.y), 1.0);
    float h = m_column(cell, v, layers, width);
    float zIn = top * (1.0 - sIn);
    if (h > 0.0 && h >= top * (1.0 - sOut)) {
      bool side = h >= zIn;
      hit = m_Hit(side ? zIn : h, side ? axis : -1.0, prev, h, cell, stp);
      break;
    }
    if (sOut >= 1.0) break;
    prev = h;
    if (tMax.x < tMax.y) {
      cell.x += stp.x;
      sIn = tMax.x;
      tMax.x += inv.x;
      axis = 0.0;
    } else {
      cell.y += stp.y;
      sIn = tMax.y;
      tMax.y += inv.y;
      axis = 1.0;
    }
  }
  return hit;
}

vec3 m_shade(m_Hit hit, vec2 p, vec2 e, float v, float layers, float width, float px) {
  vec2 hp = p + e * hit.z;
  vec2 cc = hit.cell * v;
  float half_ = v * 0.5;
  float level = hit.axis < 0.0 ? hit.h / v - 1.0 : floor(hit.z / v - 1e-4);
  vec3 l = vec3(hp - cc, hit.z - (level + 0.5) * v);
  vec3 faceN = hit.axis < 0.0 ? vec3(0.0, 0.0, 1.0) : (hit.axis < 0.5 ? vec3(-hit.stp.x, 0.0, 0.0) : vec3(0.0, -hit.stp.y, 0.0));
  vec3 tangent = 1.0 - abs(faceN);
  vec3 al = abs(l) * tangent;
  float edge = clamp(max(max(al.x, al.y), al.z) / half_, 0.0, 1.0);
  float rEff = max(half_ * 0.12, px * 0.9);
  vec3 n = normalize(faceN * rEff + sign(l) * max(abs(l) - (half_ - rEff), 0.0) * tangent);

  float az = radians(P_lightAngle);
  float el = radians(42.0);
  vec3 L = normalize(vec3(cos(az) * cos(el), sin(az) * cos(el), sin(el)));
  vec3 V = normalize(vec3(e, 1.0));

  float shadow = 1.0;
  if (P_shadows > 0.001 && dot(n, L) > -0.12) {
    shadow = 0.0;
    vec2 ld = normalize(vec2(cos(az), sin(az)));
    float rise = tan(el);
    for (int k = 1; k <= 3; k++) {
      float dist = float(k) * 0.75 * v;
      vec2 pk = hp + ld * dist + faceN.xy * v * 0.05;
      float hk = m_column(floor(pk / v + 0.5), v, layers, width);
      shadow = max(shadow, smoothstep(0.0, v * 0.35, hk - (hit.z + dist * rise)));
    }
  }

  uint hsh = m_hash(uvec3(uvec2(ivec2(hit.cell + 4096.0)), uint(level + 1.0)));
  float rnd = float(hsh & 65535u) / 65535.0;
  vec3 ca = toLinear(C_colorA.rgb);
  vec3 cb = toLinear(C_colorB.rgb);
  float pt = 0.0;
  if (P_palette > 0.5 && P_palette < 1.5) pt = clamp(0.5 + cc.y / 1.8, 0.0, 1.0);
  if (P_palette > 1.5 && P_palette < 2.5) pt = 1.0 - (level + 0.5) / (layers + 1.0);
  if (P_palette > 2.5 && P_palette < 3.5) pt = rnd;
  if (P_palette > 3.5) pt = 1.0 - smoothstep(0.35, 0.75, n.z);
  vec3 base = P_palette < 0.5 ? ca : m_fromLab(mix(m_toLab(ca), m_toLab(cb), pt));
  vec3 albedo = base * (1.0 + (rnd - 0.5) * P_jitter * 0.6);

  float ao = hit.axis >= 0.0 ? mix(0.55, 1.0, smoothstep(0.0, v * 0.8, hit.z - hit.prev)) : 1.0;
  float ndl = clamp((dot(n, L) + 0.12) / 1.12, 0.0, 1.0);
  float lit = 1.0 - shadow * P_shadows;
  vec3 key = vec3(1.0, 0.89, 0.74) * 1.1;
  vec3 sky = vec3(0.35, 0.45, 0.68);
  vec3 ambient = mix(sky * 0.35, sky, clamp(-n.y, 0.0, 1.0)) * 0.55 * ao;
  float shin = exp2(mix(3.0, 7.5, P_gloss));
  float lobe = pow(clamp(dot(n, normalize(L + V)), 0.0, 1.0), shin) * mix(0.2, 1.4, P_gloss);
  float rim = 0.02 + pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 5.0) * P_gloss * 0.5;
  float sw = 0.04 + P_seams * 0.12;
  float fw = px / half_;
  float seam = smoothstep(1.0 - sw - fw, 1.0 - sw + fw, edge) * sw / max(sw, fw);
  vec3 rgb = albedo * (key * ndl * lit + ambient) + key * lobe * 0.6 * lit + sky * rim * 0.3 * ao;
  return rgb * (1.0 - P_seams * 0.75 * seam);
}

vec4 material(Surface s) {
  float v = P_size;
  float layers = clamp(floor(P_height / v + 0.5), 0.0, 16.0);
  float width = max(P_bevel, v);
  float top = (layers + 1.0) * v + 1e-4;
  vec2 e = vec2(0.70710678) * P_tilt;
  if (s.d > top * P_tilt + v) return vec4(0.0);
  vec2 off = vec2(0.25, -0.25) * s.px;
  m_Hit h1 = m_trace(s.p + off, e, top, v, layers, width);
  m_Hit h2 = m_trace(s.p - off, e, top, v, layers, width);
  float w1 = h1.z >= 0.0 ? 1.0 : 0.0;
  float w2 = h2.z >= 0.0 ? 1.0 : 0.0;
  if (w1 + w2 < 0.5) return vec4(0.0);
  vec3 c1 = w1 > 0.5 ? m_shade(h1, s.p + off, e, v, layers, width, s.px) : vec3(0.0);
  bool same = w1 > 0.5 && h1.axis == h2.axis && all(equal(h1.cell, h2.cell)) && abs(h1.z - h2.z) < v * 0.5;
  vec3 c2 = w2 > 0.5 ? (same ? c1 : m_shade(h2, s.p - off, e, v, layers, width, s.px)) : vec3(0.0);
  vec3 rgb = (c1 * w1 + c2 * w2) / (w1 + w2);
  return vec4(toDisplay(clamp(rgb, 0.0, 1.0)), (w1 + w2) * 0.5);
}
`
};
