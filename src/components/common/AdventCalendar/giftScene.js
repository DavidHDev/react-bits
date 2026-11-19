import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const BOX = {
  w: 1,
  h: 0.86,
  lidW: 1.065,
  lidH: 0.25,
  lidOverlap: 0.19,
  radius: 0.022,
  ribbon: 0.15,
  lift: 0.0035
};
export const BODY_TOP = BOX.h / 2;
export const LID_BOTTOM = BODY_TOP - BOX.lidOverlap;
export const LID_TOP = LID_BOTTOM + BOX.lidH;
export const LID_CENTER = (LID_TOP + LID_BOTTOM) / 2;
export const LOOP_PERIOD = 8;
const HOP_START = 5.2 / LOOP_PERIOD;
const HOP_LENGTH = 2.3 / LOOP_PERIOD;
const TAU = Math.PI * 2;

const THEMES = {
  dark: {
    paper: '#f2eef7',
    paperRough: 0.62,
    paperSheen: 0.35,
    paperCoat: 0.06,
    ribbon: '#7134e6',
    ribbonSheen: '#c9a8ff',
    glow: [0.55, 0.36, 1.0],
    core: [1.0, 0.97, 1.0],
    tileEdge: '#1d1923',
    auraOpacity: 0.95,
    floorGlow: 0.5,
    sparkOpacity: 1,
    shadow: 0.3,
    exposure: 1,
    env: 0.6,
    key: 2.2,
    rimColor: '#b996ff',
    rim: 1.7,
    fill: 0.9
  },
  light: {
    paper: '#b264ff',
    paperRough: 0.5,
    paperSheen: 0.25,
    paperSheenColor: '#c3a8ff',
    paperCoat: 0.3,
    ribbon: '#f6f3fa',
    ribbonSheen: '#ffffff',
    ribbonSheenAmount: 0.25,
    glow: [0.62, 0.4, 1.0],
    core: [0.52, 0.27, 0.95],
    tileEdge: '#e6e6eb',
    auraOpacity: 0.42,
    floorGlow: 0.22,
    sparkOpacity: 0.85,
    shadow: 0.34,
    exposure: 1.05,
    env: 0.8,
    key: 2.6,
    rimColor: '#c9b0ff',
    rim: 1.6,
    fill: 1.1
  }
};

const random = (seed => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
})(23);

const paperTexture = () => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const field = new Float32Array(size * size);
  for (let i = 0; i < field.length; i += 1) field[i] = random();
  const at = (x, y) => field[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.5;
      const i = (y * size + x) * 4;
      image.data[i] = 128 + dx * 60;
      image.data[i + 1] = 128 + dy * 60;
      image.data[i + 2] = 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
};

const studioEnvironment = () => {
  const env = new THREE.Scene();
  const sky = new THREE.SphereGeometry(10, 48, 24);
  const colors = [];
  const p = sky.attributes.position;
  for (let i = 0; i < p.count; i += 1) {
    const y = p.getY(i) / 10;
    const v = y > 0 ? 0.42 + 0.3 * y : 0.42 + 0.28 * y;
    colors.push(v, v, v * 1.02);
  }
  sky.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  env.add(new THREE.Mesh(sky, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const panel = (w, h, intensity, position, color = '#ffffff') => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    mesh.position.copy(position);
    mesh.lookAt(0, 0, 0);
    env.add(mesh);
  };
  panel(6, 4, 3.2, new THREE.Vector3(-4, 6, 4));
  panel(2, 7, 2.2, new THREE.Vector3(6, 2, -3), '#efe6ff');
  panel(7, 2, 1.1, new THREE.Vector3(0, 1, 7));
  return env;
};

const shadowTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (let i = 0; i <= 16; i += 1) {
    const t = i / 16;
    g.addColorStop(t, `rgba(0,0,0,${Math.exp(-t * t * 4.5) * (1 - t * t)})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
};

export const RIB_T = 0.024;

const ring = (() => {
  const pts = [];
  const flat = 5;
  const cap = 6;
  for (let i = 0; i < flat; i += 1) pts.push({ s: -1 + (2 * i) / (flat - 1), cap: 0, a: Math.PI / 2 });
  for (let i = 1; i < cap; i += 1) pts.push({ s: 1, cap: 1, a: Math.PI / 2 - (Math.PI * i) / cap });
  for (let i = 0; i < flat; i += 1) pts.push({ s: 1 - (2 * i) / (flat - 1), cap: 0, a: -Math.PI / 2 });
  for (let i = 1; i < cap; i += 1) pts.push({ s: -1, cap: 1, a: -Math.PI / 2 - (Math.PI * i) / cap });
  return pts;
})();
const RING = ring.length;

export const ribbonGeometry = (samples, width, { closed = false, thickness = RIB_T, ao = null } = {}) => {
  const count = samples.length;
  const positions = new Float32Array(count * RING * 3);
  const normals = new Float32Array(count * RING * 3);
  const colors = new Float32Array(count * RING * 3).fill(1);
  const index = [];
  const rows = closed ? count : count - 1;
  for (let i = 0; i < rows; i += 1) {
    const i2 = (i + 1) % count;
    for (let k = 0; k < RING; k += 1) {
      const k2 = (k + 1) % RING;
      const a = i * RING + k;
      const b = i * RING + k2;
      const c = i2 * RING + k;
      const d = i2 * RING + k2;
      index.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(index);
  geometry.userData = { count, width, thickness, ao };
  writeRibbon(geometry, samples);
  return geometry;
};

const _b = new THREE.Vector3();
const _p = new THREE.Vector3();
const _n = new THREE.Vector3();
export const writeRibbon = (geometry, samples) => {
  const { count, width, thickness, ao } = geometry.userData;
  const pos = geometry.attributes.position.array;
  const nor = geometry.attributes.normal.array;
  const col = geometry.attributes.color.array;
  const r = thickness / 2;
  for (let i = 0; i < count; i += 1) {
    const s = samples[i];
    _b.crossVectors(s.t, s.n).normalize();
    const half = Math.max((s.w ?? 1) * width * 0.5 - r, 0.001);
    for (let k = 0; k < RING; k += 1) {
      const q = ring[k];
      const ca = Math.cos(q.a);
      const sa = Math.sin(q.a);
      const px = q.s * half + (q.cap ? ca * r : 0);
      const py = r + sa * r;
      const o = (i * RING + k) * 3;
      _p.copy(s.p).addScaledVector(_b, px).addScaledVector(s.n, py);
      _n.copy(_b)
        .multiplyScalar(q.cap ? ca : 0)
        .addScaledVector(s.n, q.cap ? sa : Math.sign(sa))
        .normalize();
      pos[o] = _p.x;
      pos[o + 1] = _p.y;
      pos[o + 2] = _p.z;
      nor[o] = _n.x;
      nor[o + 1] = _n.y;
      nor[o + 2] = _n.z;
      const v = ao ? ao(_p, _n, s, i / (count - 1)) : 1;
      col[o] = v;
      col[o + 1] = v;
      col[o + 2] = v;
    }
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.normal.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.computeBoundingSphere();
};

const sampleSegment = (out, a, b, normal, steps) => {
  const t = new THREE.Vector3().subVectors(b, a).normalize();
  for (let i = 0; i < steps; i += 1) {
    out.push({ p: new THREE.Vector3().lerpVectors(a, b, i / steps), n: normal.clone(), t: t.clone() });
  }
};

const sampleArc = (out, center, r, axis, startDir, steps) => {
  for (let i = 0; i < steps; i += 1) {
    const n = startDir.clone().applyAxisAngle(axis, (Math.PI / 2) * (i / steps));
    out.push({ p: center.clone().addScaledVector(n, r), n, t: n.clone().applyAxisAngle(axis, Math.PI / 2) });
  }
};

export const LID_R = 0.036;
export const BODY_R = 0.03;

export const armRest = j => {
  const dir = new THREE.Vector3(Math.sin((j * Math.PI) / 2), 0, Math.cos((j * Math.PI) / 2));
  const up = new THREE.Vector3(0, 1, 0);
  const down = new THREE.Vector3(0, -1, 0);
  const axis = new THREE.Vector3().crossVectors(up, dir).normalize();
  const L = BOX.lift;
  const lidHalf = BOX.lidW / 2;
  const r = LID_R;
  const at = (d, y) => new THREE.Vector3(0, y, 0).addScaledVector(dir, d);
  const lidArm = [];
  const top = LID_TOP + L;
  const cross = j % 2 ? RIB_T * 0.85 : 0;
  const steps = 26;
  for (let i = 0; i < steps; i += 1) {
    const d = (lidHalf - r) * (i / steps);
    const k = Math.min(1, Math.max(0, (d - 0.05) / 0.09));
    const y = top + cross * (1 - k * k * (3 - 2 * k));
    lidArm.push({ p: at(d, y), n: up.clone(), t: dir.clone() });
  }
  sampleArc(lidArm, at(lidHalf - r, LID_TOP - r), r + L, axis, up, 9);
  sampleSegment(lidArm, at(lidHalf + L, LID_TOP - r), at(lidHalf + L, LID_BOTTOM + r), dir, 6);
  sampleArc(lidArm, at(lidHalf - r, LID_BOTTOM + r), r + L, axis, dir, 9);
  lidArm.push({ p: at(lidHalf - r, LID_BOTTOM - L), n: down.clone(), t: dir.clone().negate() });
  lidArm.push({ p: at(lidHalf - r - 0.012, LID_BOTTOM - L), n: down.clone(), t: dir.clone().negate() });
  for (let i = 1; i < lidArm.length; i += 1) {
    const s = lidArm[i];
    const prev = lidArm[i - 1];
    if (i < steps) s.t = new THREE.Vector3().subVectors(s.p, prev.p).normalize();
  }
  for (let i = 1; i < steps; i += 1) {
    const s = lidArm[i];
    s.n = up
      .clone()
      .sub(s.t.clone().multiplyScalar(s.t.dot(up)))
      .normalize();
  }
  const half = BOX.w / 2;
  const rb = BODY_R;
  const wallArm = [];
  sampleSegment(wallArm, at(half + L, LID_BOTTOM + 0.05), at(half + L, -BOX.h / 2 + rb), dir, 26);
  sampleArc(wallArm, at(half - rb, -BOX.h / 2 + rb), rb + L, axis, dir, 9);
  wallArm.push({ p: at(half - rb, -BOX.h / 2 - L), n: down.clone(), t: dir.clone().negate() });
  wallArm.push({ p: at(half - rb - 0.02, -BOX.h / 2 - L), n: down.clone(), t: dir.clone().negate() });
  return { lidArm, wallArm, dir, axis };
};

const BOW_RY = 0.034;
const BOW_RZ = 0.062;
export const BOW_Y = LID_TOP + BOX.lift + RIB_T * 1.85 + BOW_RY + RIB_T * 0.6;

const loopSamples = sign => {
  const pts = [
    [0.0, 0.0],
    [0.06, 0.055],
    [0.13, 0.135],
    [0.225, 0.192],
    [0.32, 0.2],
    [0.38, 0.152],
    [0.378, 0.082],
    [0.305, 0.032],
    [0.18, 0.004],
    [0.07, -0.006]
  ];
  const curve = new THREE.CatmullRomCurve3(
    pts.map(([u, v]) => new THREE.Vector3(u * sign * 1.42, v * 1.02, 0)),
    true,
    'centripetal'
  );
  const q = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.62 * sign)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.14 * sign))
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.22));
  const plane = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
  const out = [];
  const n = 84;
  for (let i = 0; i < n; i += 1) {
    const t = i / n;
    const p = curve.getPointAt(t).applyQuaternion(q);
    const tan = curve.getTangentAt(t).applyQuaternion(q);
    const nn = new THREE.Vector3().crossVectors(tan, plane).normalize();
    const pinch = Math.min(1, Math.min(t, 1 - t) / 0.2);
    const w = 0.55 + 0.45 * pinch * pinch * (3 - 2 * pinch);
    out.push({ p: p.add(new THREE.Vector3(0, BOW_Y, 0)), n: nn, t: tan, w, pinch });
  }
  const centroid = out.reduce((acc, s) => acc.add(s.p), new THREE.Vector3()).multiplyScalar(1 / out.length);
  const facing = out.reduce((acc, s) => acc + s.n.dot(new THREE.Vector3().subVectors(s.p, centroid)), 0);
  if (facing < 0) out.forEach(s => s.n.negate());
  return { samples: out, centroid };
};

const knotSamples = () => {
  const out = [];
  const n = 40;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * TAU;
    const p = new THREE.Vector3(0, BOW_Y + Math.sin(a) * BOW_RY, Math.cos(a) * BOW_RZ);
    const nrm = new THREE.Vector3(0, Math.sin(a) / BOW_RY, Math.cos(a) / BOW_RZ).normalize();
    const t = new THREE.Vector3(0, Math.cos(a) * BOW_RY, -Math.sin(a) * BOW_RZ).normalize();
    out.push({ p, n: nrm, t, w: 1 });
  }
  return out;
};

const paperShader = (material, { body }) => {
  material.customProgramCacheKey = () => (body ? 'gift-paper-body' : 'gift-paper-lid');
  material.userData.ao = { uRibbonCut: { value: body ? -10 : 10 }, uRibbonFade: { value: 1 }, uBowFade: { value: 1 } };
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, material.userData.ao);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vGiftPos;\nvarying vec3 vGiftNormal;\nuniform float uOffsetY;'
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvGiftPos = transformed + vec3(0.0, uOffsetY, 0.0);\nvGiftNormal = normal;'
      );
    shader.uniforms.uOffsetY = { value: body ? 0 : LID_CENTER };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vGiftPos;
varying vec3 vGiftNormal;
uniform float uRibbonCut;
uniform float uRibbonFade;
uniform float uBowFade;
float giftAO(vec3 p, vec3 n) {
  vec3 an = abs(n);
  float d = an.y > 0.5 ? min(abs(p.x), abs(p.z)) : (an.z > an.x ? abs(p.x) : abs(p.z));
  float e = max(d - ${(BOX.ribbon / 2).toFixed(4)}, 0.0);
  float cover = uRibbonFade;
  ${
    body
      ? 'cover *= smoothstep(uRibbonCut + 0.06, uRibbonCut + 0.1, p.y);'
      : `float s = an.y > 0.5 ? max(abs(p.x), abs(p.z)) : ${(BOX.lidW / 2 - LID_R + (LID_R * Math.PI) / 2).toFixed(4)} + (${(LID_TOP - LID_R).toFixed(4)} - p.y);
  cover *= 1.0 - smoothstep(uRibbonCut - 0.11, uRibbonCut - 0.07, s);`
  }
  float ao = 1.0 - 0.34 * exp(-e / 0.009) * cover;
  ${
    body
      ? `float u = max(${LID_BOTTOM.toFixed(4)} - p.y, 0.0);
  ao *= 1.0 - 0.62 * exp(-u / 0.028) * (1.0 - an.y);
  ao *= 1.0 - 0.18 * exp(-(p.y + ${(BOX.h / 2).toFixed(4)}) / 0.05);`
      : `float r = length(p.xz * vec2(1.0, 1.25));
  ao *= 1.0 - 0.32 * exp(-r * r / 0.035) * step(0.5, n.y) * uBowFade;`
  }
  return ao;
}`
      )
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nfloat giftOcc = giftAO(vGiftPos, vGiftNormal);\ndiffuseColor.rgb *= giftOcc;'
      )
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\nreflectedLight.indirectSpecular *= giftOcc;');
  };
};

const SPARK_VERT = `
attribute vec4 aSeed;
attribute vec4 aLife;
uniform float uPhase;
uniform float uScale;
varying float vAlpha;
varying float vBokeh;
void main() {
  float life = fract(uPhase * aLife.y + aLife.x);
  float ang = aSeed.x + life * aLife.z;
  float rad = aSeed.y * (1.0 + 0.12 * life);
  vec3 p = vec3(cos(ang) * rad, aSeed.z + life * aSeed.w, sin(ang) * rad);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float fade = smoothstep(0.0, 0.28, life) * (1.0 - smoothstep(0.62, 1.0, life));
  float tw = 0.78 + 0.22 * sin(6.2831853 * (uPhase * 2.0 + aLife.x * 5.0));
  vBokeh = step(aLife.w, 0.5);
  float cz = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z;
  float front = smoothstep(cz - 0.25, cz + 0.2, mv.z);
  vAlpha = fade * tw * mix(1.0, 0.32 * (1.0 - front), vBokeh);
  float size = mix(0.1 + 0.08 * fract(aLife.x * 13.7), 0.26 + 0.14 * fract(aLife.x * 5.3), vBokeh);
  gl_PointSize = size * uScale / -mv.z;
}
`;

export const SPARK_FRAG = `
uniform vec3 uColor;
uniform vec3 uCore;
uniform float uOpacity;
varying float vAlpha;
varying float vBokeh;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d) * 4.0;
  if (r2 >= 1.0) discard;
  float halo = exp(-r2 * 3.0) * (1.0 - r2) * (1.0 - r2);
  float core = exp(-r2 * 18.0);
  float spark = halo * 0.5 + core * 0.85;
  float soft = halo * 0.85;
  float total = mix(spark, soft, vBokeh);
  float a = min(total * vAlpha * uOpacity, 1.0);
  vec3 c = mix(uColor, uCore, clamp(core * (1.0 - vBokeh) / max(total, 1e-4), 0.0, 1.0));
  gl_FragColor = vec4(c * a, a);
}
`;

export const AURA_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv * 2.0 - 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const AURA_FRAG = `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float r2 = dot(vUv, vUv);
  if (r2 >= 1.0) discard;
  float edge = (1.0 - r2) * (1.0 - r2);
  float wide = exp(-r2 * 2.2) * edge;
  float tight = exp(-r2 * 7.5) * edge;
  float a = (wide * 0.55 + tight * 0.6) * uOpacity;
  gl_FragColor = vec4(uColor * a, a);
}
`;

const FLOOR_FRAG = `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float r2 = dot(vUv, vUv);
  if (r2 >= 1.0) discard;
  float a = exp(-r2 * 3.0) * (1.0 - r2) * (1.0 - r2) * uOpacity;
  gl_FragColor = vec4(uColor * a, a);
}
`;

export const SEAM_FRAG = `
uniform vec3 uColor;
uniform vec3 uCore;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float v = vUv.y * 0.5 + 0.5;
  float a = (pow(v, 5.0) * 0.8 + pow(v, 24.0) * 0.6) * uOpacity;
  vec3 c = mix(uColor, uCore, pow(v, 10.0));
  gl_FragColor = vec4(c * a, a);
}
`;

export const premultipliedBlend = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneMinusSrcAlphaFactor
};

const makeSparks = look => {
  const count = 46;
  const seed = new Float32Array(count * 4);
  const life = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    const bokeh = i % 6 === 0;
    seed[i * 4] = random() * TAU;
    seed[i * 4 + 1] = bokeh ? 0.85 + random() * 0.3 : 0.6 + random() * 0.45;
    seed[i * 4 + 2] = -0.5 + random() * 0.5;
    seed[i * 4 + 3] = 0.4 + random() * 0.45;
    life[i * 4] = (i + random() * 0.6) / count;
    life[i * 4 + 1] = 1;
    life[i * 4 + 2] = (random() < 0.5 ? -1 : 1) * (0.25 + random() * 0.4);
    life[i * 4 + 3] = bokeh ? 0.2 : 0.7 + random() * 0.3;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  geometry.setAttribute('aLife', new THREE.BufferAttribute(life, 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3);
  const material = new THREE.ShaderMaterial({
    vertexShader: SPARK_VERT,
    fragmentShader: SPARK_FRAG,
    uniforms: {
      uPhase: { value: 0 },
      uScale: { value: 600 },
      uBurst: { value: 0 },
      uColor: { value: new THREE.Vector3(...look.glow) },
      uCore: { value: new THREE.Vector3(...look.core) },
      uOpacity: { value: look.sparkOpacity }
    },
    ...premultipliedBlend
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = 2;
  return points;
};

const makeAura = look => {
  const material = new THREE.ShaderMaterial({
    vertexShader: AURA_VERT,
    fragmentShader: AURA_FRAG,
    uniforms: { uColor: { value: new THREE.Vector3(...look.glow) }, uOpacity: { value: look.auraOpacity } },
    ...premultipliedBlend
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), material);
  mesh.renderOrder = -1;
  return mesh;
};

export const createGiftScene = ({ theme: themeName = 'dark', pixelRatio = 1, distance = 4.5 } = {}) => {
  const theme = THEMES[themeName] ? themeName : 'dark';
  const look = THEMES[theme];
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  scene.add(root);
  const gift = new THREE.Group();
  root.add(gift);

  const paperNormal = paperTexture();
  const paperParams = {
    color: look.paper,
    roughness: look.paperRough,
    metalness: 0,
    sheen: look.paperSheen,
    sheenColor: new THREE.Color(look.paperSheenColor || '#ffffff'),
    sheenRoughness: 0.8,
    clearcoat: look.paperCoat,
    clearcoatRoughness: theme === 'light' ? 0.34 : 0.6,
    normalMap: paperNormal,
    normalScale: new THREE.Vector2(0.1, 0.1)
  };
  const bodyPaper = new THREE.MeshPhysicalMaterial(paperParams);
  const lidPaper = new THREE.MeshPhysicalMaterial(paperParams);
  paperShader(bodyPaper, { body: true });
  paperShader(lidPaper, { body: false });

  const ribbonMat = new THREE.MeshPhysicalMaterial({
    color: look.ribbon,
    vertexColors: true,
    roughness: 0.42,
    metalness: 0,
    specularIntensity: 0.55,
    sheen: look.ribbonSheenAmount ?? 0.6,
    sheenColor: new THREE.Color(look.ribbonSheen),
    sheenRoughness: 0.5
  });

  const body = new THREE.Mesh(new RoundedBoxGeometry(BOX.w, BOX.h, BOX.w, 8, BODY_R), bodyPaper);
  body.receiveShadow = true;
  body.castShadow = true;
  gift.add(body);
  const lid = new THREE.Group();
  lid.position.y = LID_CENTER;
  gift.add(lid);
  const lidMesh = new THREE.Mesh(new RoundedBoxGeometry(BOX.lidW, BOX.lidH, BOX.lidW, 8, LID_R), lidPaper);
  lidMesh.castShadow = true;
  lidMesh.receiveShadow = true;
  lid.add(lidMesh);
  const lidAnchor = new THREE.Group();
  lidAnchor.position.y = -LID_CENTER;
  lid.add(lidAnchor);

  const lidArmAO = p => {
    const d2 = p.x * p.x + p.z * p.z;
    return 1 - 0.45 * Math.exp(-d2 / 0.014);
  };
  const wallArmAO = p => {
    const u = LID_BOTTOM - p.y;
    return u < 0 ? 0.35 : 1 - 0.6 * Math.exp(-u / 0.03);
  };
  const arms = [0, 1, 2, 3].map(j => {
    const rest = armRest(j);
    const lidGeometry = ribbonGeometry(rest.lidArm, BOX.ribbon, { ao: lidArmAO });
    const wallGeometry = ribbonGeometry(rest.wallArm, BOX.ribbon, { ao: wallArmAO });
    const lidMeshArm = new THREE.Mesh(lidGeometry, ribbonMat);
    const wallMeshArm = new THREE.Mesh(wallGeometry, ribbonMat);
    const group = new THREE.Group();
    gift.add(group);
    [lidMeshArm, wallMeshArm].forEach(m => {
      m.castShadow = true;
      m.receiveShadow = true;
    });
    group.add(wallMeshArm);
    lidAnchor.add(lidMeshArm);
    return { j, rest, group, lidGeometry, wallGeometry, lidMesh: lidMeshArm, wallMesh: wallMeshArm };
  });

  const bow = new THREE.Group();
  lidAnchor.add(bow);
  const bowSpin = new THREE.Group();
  bowSpin.rotation.y = -0.55;
  bow.add(bowSpin);
  const _to = new THREE.Vector3();
  const loops = [-1, 1].map(sign => {
    const { samples, centroid } = loopSamples(sign);
    const ao = (p, n, s) => {
      _to.subVectors(p, centroid).normalize();
      const inner = Math.max(0, -n.dot(_to));
      return (1 - 0.42 * inner) * (0.62 + 0.38 * s.pinch);
    };
    const mesh = new THREE.Mesh(ribbonGeometry(samples, 0.158, { closed: true, ao }), ribbonMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    bowSpin.add(mesh);
    return mesh;
  });
  const knot = new THREE.Mesh(
    ribbonGeometry(knotSamples(), 0.13, { closed: true, ao: (p, n) => 1 - 0.35 * Math.max(0, -n.y) }),
    ribbonMat
  );
  knot.castShadow = true;
  knot.receiveShadow = true;
  bowSpin.add(knot);
  const tails = [];

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 2.1),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, opacity: look.shadow, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -BOX.h / 2 - 0.004;
  root.add(shadow);

  const aura = makeAura(look);
  scene.add(aura);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.4),
    new THREE.ShaderMaterial({
      vertexShader: AURA_VERT,
      fragmentShader: FLOOR_FRAG,
      uniforms: { uColor: { value: new THREE.Vector3(...look.glow) }, uOpacity: { value: look.floorGlow } },
      ...premultipliedBlend
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -BOX.h / 2 - 0.006;
  floor.renderOrder = -1;
  root.add(floor);
  const sparks = makeSparks(look);
  root.add(sparks);

  const key = new THREE.DirectionalLight('#ffffff', look.key);
  key.position.set(-3.3, 3.6, 1.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -1;
  key.shadow.camera.right = 1;
  key.shadow.camera.top = 1;
  key.shadow.camera.bottom = -1;
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 7;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.01;
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(look.rimColor, look.rim);
  rim.position.set(2.6, 1.4, -2.4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffffff', look.fill);
  fill.position.set(2.4, 0.8, 3.2);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  const placeCamera = () => {
    const elev = 0.38;
    const dist = distance;
    camera.position.set(0, Math.sin(elev) * dist + 0.05, Math.cos(elev) * dist);
    camera.lookAt(0, 0.08, 0);
  };
  placeCamera();
  root.rotation.y = 0.62;

  const auraAt = new THREE.Vector3(0, 0.08, 0);
  const placeAura = () => {
    const away = new THREE.Vector3().subVectors(auraAt, camera.position).normalize();
    aura.position.copy(auraAt).addScaledVector(away, 0.9);
    aura.quaternion.copy(camera.quaternion);
  };

  const seam = new THREE.Mesh(
    new THREE.CylinderGeometry((BOX.w / 2 + 0.004) * Math.SQRT2, (BOX.w / 2 + 0.004) * Math.SQRT2, 0.16, 4, 1, true),
    new THREE.ShaderMaterial({
      vertexShader: AURA_VERT,
      fragmentShader: SEAM_FRAG,
      uniforms: {
        uColor: { value: new THREE.Vector3(...look.glow) },
        uCore: { value: new THREE.Vector3(...look.core) },
        uOpacity: { value: 0 }
      },
      side: THREE.DoubleSide,
      ...premultipliedBlend
    })
  );
  seam.rotation.y = Math.PI / 4;
  seam.position.y = LID_BOTTOM - 0.08;
  seam.renderOrder = 1;
  gift.add(seam);

  const clamp01 = v => Math.min(1, Math.max(0, v));
  const smooth = v => {
    const x = clamp01(v);
    return x * x * (3 - 2 * x);
  };

  const hopPose = (phase, k) => {
    const h = (phase - HOP_START) / HOP_LENGTH;
    const pose = { y: 0, squash: 0, lid: 0, tilt: 0, roll: 0, glow: 0 };
    if (h <= 0 || h >= 1 || k <= 0) return pose;
    if (h < 0.16) pose.squash = -0.05 * smooth(h / 0.16);
    else if (h < 0.22) pose.squash = -0.05 + 0.09 * smooth((h - 0.16) / 0.06);
    else if (h < 0.56) pose.squash = 0.04 * (1 - smooth((h - 0.22) / 0.2));
    else {
      const u = (h - 0.56) / 0.44;
      pose.squash = -0.045 * Math.exp(-5 * u) * Math.cos(9 * u);
    }
    const air = clamp01((h - 0.2) / 0.36);
    pose.y = 0.11 * 4 * air * (1 - air);
    const peek = clamp01((h - 0.24) / 0.42);
    const lift = Math.sin(Math.PI * peek);
    const settle = h > 0.66 ? (h - 0.66) / 0.34 : 0;
    pose.lid =
      0.05 * lift * lift + 0.008 * Math.exp(-6 * settle) * Math.abs(Math.sin(10 * settle)) * (settle > 0 ? 1 : 0);
    pose.tilt = 0.09 * lift * Math.sin(Math.PI * peek * 0.8);
    pose.roll =
      0.045 * Math.sin(Math.PI * air) +
      (h > 0.56 ? 0.018 * Math.exp(-5 * ((h - 0.56) / 0.44)) * Math.sin(12 * ((h - 0.56) / 0.44)) : 0);
    pose.glow = lift;
    Object.keys(pose).forEach(key => {
      pose[key] *= k;
    });
    return pose;
  };

  const idle = (time, calm = 0) => {
    const phase = (((time / LOOP_PERIOD) % 1) + 1) % 1;
    const wave = phase * TAU * 2;
    const s = Math.sin(wave);
    const c = Math.cos(wave);
    const hop = hopPose(phase, 1 - calm);
    const sy = 1 + hop.squash;
    const sxz = 1 - hop.squash * 0.6;
    gift.scale.set(sxz, sy, sxz);
    gift.position.y = 0.03 + 0.028 * s + hop.y + (BOX.h / 2) * (sy - 1);
    root.rotation.y = 0.62 + 0.07 * Math.sin(phase * TAU + 0.6);
    gift.rotation.z = 0.012 * c + hop.roll;
    gift.rotation.x = 0.01 * s;
    lid.position.set(0, LID_CENTER + hop.lid, 0);
    lid.rotation.set(hop.tilt, 0, -hop.tilt * 0.4);
    const lift = 0.03 + 0.028 * s + hop.y;
    shadow.scale.setScalar(1 - lift * 0.6);
    shadow.material.opacity = look.shadow * (1 - lift * 2.2);
    floor.material.uniforms.uOpacity.value =
      look.floorGlow * (0.9 + 0.1 * Math.sin(phase * TAU * 2)) * (1 + 0.25 * hop.glow) * (1 - hop.y * 2.5);
    sparks.material.uniforms.uPhase.value = (phase * 2) % 1;
    aura.material.uniforms.uOpacity.value =
      look.auraOpacity * (0.88 + 0.12 * Math.sin(phase * TAU * 2)) * (1 + 0.35 * hop.glow);
    seam.material.uniforms.uOpacity.value = hop.glow * (theme === 'light' ? 0.6 : 0.85);
  };

  let renderer = null;
  let pmrem = null;
  const attach = canvas => {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = look.exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(studioEnvironment(), 0.035).texture;
    scene.environmentIntensity = look.env;
    return renderer;
  };

  const resize = (width, height) => {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    sparks.material.uniforms.uScale.value =
      (height * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
  };

  const render = () => {
    placeAura();
    renderer.render(scene, camera);
  };

  idle(0);

  const tilePaper = new THREE.MeshPhysicalMaterial(paperParams);

  return {
    seam,
    bodyPaper,
    lidPaper,
    THREE,
    scene,
    root,
    gift,
    body,
    lid,
    lidMesh,
    arms,
    bow,
    bowSpin,
    loops,
    tails,
    knot,
    shadow,
    floor,
    aura,
    sparks,
    camera,
    look,
    ribbonMat,
    tilePaper,
    idle,
    attach,
    resize,
    render,
    placeCamera,
    theme,
    getRenderer: () => renderer
  };
};
