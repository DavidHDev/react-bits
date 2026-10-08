'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import './BlobCursor.css';

const CORE = 8;
const HEAD_RADIUS = 0.7;
const HEAD_BLEND = 0.6;
const MAX_TRAIL = 16;
const MAX_DROPS = 96;
const MAX_PARTS = 48;
const DROP_LIFE = 30;
const MATERIALS = ['chrome', 'jelly', 'pearl', 'ink'];
const BLENDS = ['normal', 'difference', 'exclusion', 'multiply', 'screen', 'overlay'];
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"], [data-blob-grow]';

const FIELD = `
#define BLOB_MAX ${MAX_PARTS}
uniform vec4 blobSeg[BLOB_MAX];
uniform vec4 blobInfo[BLOB_MAX];
uniform int blobCount;
uniform int blobHeadEnd;
uniform int blobTubeEnd;
uniform float blobJoin;
uniform float blobLift;
uniform float blobTop;
uniform float blobRef;
uniform vec2 blobDepth;
varying vec2 vBlobSpot;

vec4 blobPart(vec2 p, int i, float z) {
  vec4 seg = blobSeg[i];
  vec2 r = blobInfo[i].xy;
  vec2 axis = seg.zw - seg.xy;
  float len = length(axis);
  if (len <= abs(r.x - r.y) + 0.001) {
    vec2 d = p - (r.x >= r.y ? seg.xy : seg.zw);
    float dist = max(sqrt(dot(d, d) + z * z), 0.0001);
    return vec4(dist - max(r.x, r.y), vec3(d, z) / dist);
  }
  vec2 dir = axis / len;
  vec2 rel = p - seg.xy;
  float u = dot(rel, dir);
  vec2 side = rel - dir * u;
  float w = sqrt(dot(side, side) + z * z);
  float b = (r.x - r.y) / len;
  float a = sqrt(1.0 - b * b);
  float along = a * u - b * w;
  vec3 f = vec3(a * w + b * u - r.x, a, b);
  if (along < 0.0) {
    float d = max(sqrt(w * w + u * u), 0.0001);
    f = vec3(d - r.x, w / d, u / d);
  } else if (along > a * len) {
    float d = max(sqrt(w * w + (u - len) * (u - len)), 0.0001);
    f = vec3(d - r.y, w / d, (u - len) / d);
  }
  return vec4(f.x, vec3(dir * f.z, 0.0) + vec3(side, z) / max(w, 0.0001) * f.y);
}

vec4 blobSmooth(vec4 a, vec4 b, float k) {
  float h = k > 0.0 ? max(k - abs(a.x - b.x), 0.0) / k : 0.0;
  float weight = b.x < a.x ? 1.0 - 0.5 * h * h : 0.5 * h * h;
  return vec4(min(a.x, b.x) - h * h * h * k / 6.0, mix(a.yzw, b.yzw, weight));
}

vec4 blobShape(vec2 p, float z) {
  vec4 body = blobPart(p, 0, z);
  for (int i = 1; i < BLOB_MAX; i++) {
    if (i >= blobHeadEnd) break;
    body = blobSmooth(body, blobPart(p, i, z), blobInfo[i].z);
  }
  if (blobTubeEnd > blobHeadEnd) {
    vec4 tube = blobPart(p, blobHeadEnd, z);
    for (int i = blobHeadEnd + 1; i < BLOB_MAX; i++) {
      if (i >= blobTubeEnd) break;
      tube = blobSmooth(tube, blobPart(p, i, z), blobInfo[i].z);
    }
    body = blobSmooth(body, tube, blobJoin);
  }
  for (int i = blobTubeEnd; i < BLOB_MAX; i++) {
    if (i >= blobCount) break;
    body = blobSmooth(body, blobPart(p, i, z), blobInfo[i].z);
  }
  return body;
}
`;

const SURFACE = `
  vec4 blobBase = blobShape(vBlobSpot, 0.0);
  float blobAlpha = clamp(0.5 - blobBase.x / max(fwidth(blobBase.x), 0.0001), 0.0, 1.0);
  if (blobAlpha <= 0.0) discard;
  float blobLow = 0.0;
  float blobHigh = blobTop;
  float blobZ = min(sqrt(max(-blobBase.x, 0.0) * max(2.0 * blobRef + blobBase.x, 0.0)), blobTop);
  for (int k = 0; k < 8; k++) {
    vec4 blobTry = blobShape(vBlobSpot, blobZ);
    if (blobTry.x > 0.0) blobHigh = blobZ;
    else blobLow = blobZ;
    float blobNext = blobZ - blobTry.x / max(blobTry.w, 0.0001);
    blobZ = blobNext > blobLow && blobNext < blobHigh ? blobNext : 0.5 * (blobLow + blobHigh);
  }
  vec4 blobAt = blobShape(vBlobSpot, blobZ);
  vec3 blobNormal = normalize(vec3(blobAt.yz, blobAt.w / blobLift));
  gl_FragDepth = blobDepth.x - blobDepth.y * blobZ * blobLift;
`;

const SURFACE_NORMAL = `
  float faceDirection = 1.0;
  vec3 normal = normalize((viewMatrix * vec4(blobNormal, 0.0)).xyz);
  vec3 nonPerturbedNormal = normal;
`;

const sculpt = (shader, uniforms, body) => {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('void main() {', 'varying vec2 vBlobSpot;\nvoid main() {')
    .replace(
      '#include <project_vertex>',
      '#include <project_vertex>\n\tvBlobSpot = (modelMatrix * vec4(transformed, 1.0)).xy;'
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('void main() {', `${FIELD}\nvoid main() {\n${body}`)
    .replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      'vec4 diffuseColor = vec4( diffuse, opacity * blobAlpha );'
    )
    .replace('#include <normal_fragment_begin>', SURFACE_NORMAL);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, t) => a + (b - a) * t;

const createBody = () => ({ x: 0, y: 0, vx: 0, vy: 0, size: 0 });

const BlobCursor = ({
  material = 'chrome',
  color = '#3B82F6',
  size = 140,
  morph = 0,
  morphSpeed = 0.4,
  depth = 1,
  trail = 16,
  lag = 0.55,
  goo = 1,
  stretch = 0.6,
  wobble = 1,
  drip = 0,
  splash = true,
  splashCount = 6,
  splashSpeed = 0.5,
  splashSize = 0.5,
  splashGravity = 0,
  regrow = 0.5,
  shine = 1,
  shadow = false,
  blend = 'normal',
  hideCursor = true,
  className = '',
  style
}) => {
  const rootRef = useRef(null);
  const settingsRef = useRef(null);
  const applyRef = useRef(null);

  settingsRef.current = {
    material: MATERIALS.includes(material) ? material : 'chrome',
    color,
    size: clamp(size, 12, 400),
    morph: clamp(morph, 0, 1),
    morphSpeed: clamp(morphSpeed, 0, 1),
    depth: clamp(depth, 0, 1),
    trail: clamp(Math.round(trail), 0, MAX_TRAIL),
    lag: clamp(lag, 0, 1),
    goo: clamp(goo, 0, 1),
    stretch: clamp(stretch, 0, 1),
    wobble: clamp(wobble, 0, 1),
    drip: clamp(drip, 0, 1),
    splash,
    splashCount: clamp(Math.round(splashCount), 1, 32),
    splashSpeed: clamp(splashSpeed, 0, 1),
    splashSize: clamp(splashSize, 0, 1),
    splashGravity: clamp(splashGravity, 0, 1),
    regrow: clamp(regrow, 0, 1),
    shine: clamp(shine, 0, 1),
    shadow,
    blend: BLENDS.includes(blend) ? blend : 'normal',
    hideCursor
  };

  useEffect(() => {
    applyRef.current?.();
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true });
    } catch {
      return undefined;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.shadowMap.autoUpdate = true;
    const canvas = renderer.domElement;
    canvas.className = 'blob-cursor-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    root.appendChild(canvas);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.03);
    pmrem.dispose();
    scene.environment = environment.texture;
    scene.environmentRotation.set(-0.9, 0.35, 0);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 6000);
    camera.position.set(0, 0, 2000);

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 14;
    key.shadow.blurSamples = 20;
    key.shadow.bias = -0.0004;
    scene.add(key, key.target);

    const field = {
      blobSeg: { value: new Float32Array(MAX_PARTS * 4) },
      blobInfo: { value: new Float32Array(MAX_PARTS * 4) },
      blobCount: { value: 0 },
      blobHeadEnd: { value: 0 },
      blobTubeEnd: { value: 0 },
      blobJoin: { value: 0 },
      blobLift: { value: 1 },
      blobTop: { value: 1 },
      blobRef: { value: 1 },
      blobDepth: {
        value: new THREE.Vector2(
          (camera.position.z - camera.near) / (camera.far - camera.near),
          1 / (camera.far - camera.near)
        )
      }
    };
    const coat = shader => sculpt(shader, field, SURFACE);
    const blobPhysical = new THREE.MeshPhysicalMaterial({ transparent: true });
    const blobFlat = new THREE.MeshBasicMaterial({ transparent: true });
    blobPhysical.onBeforeCompile = coat;
    blobFlat.onBeforeCompile = coat;
    const cast = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    cast.onBeforeCompile = shader => sculpt(shader, field, 'if (blobShape(vBlobSpot, 0.0).x > 0.0) discard;');
    const sprayPhysical = new THREE.MeshPhysicalMaterial();
    const sprayFlat = new THREE.MeshBasicMaterial();
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), blobPhysical);
    blob.castShadow = true;
    blob.frustumCulled = false;
    blob.customDepthMaterial = cast;
    scene.add(blob);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.22 }));
    ground.receiveShadow = true;
    scene.add(ground);

    const sphere = new THREE.SphereGeometry(1, 32, 24);
    const spray = new THREE.InstancedMesh(sphere, sprayPhysical, MAX_DROPS);
    spray.castShadow = true;
    spray.frustumCulled = false;
    spray.count = 0;
    scene.add(spray);
    const placement = new THREE.Matrix4();
    const spin = new THREE.Quaternion();
    const stretchAxis = new THREE.Vector3();
    const xAxis = new THREE.Vector3(1, 0, 0);
    const spot = new THREE.Vector3();
    const extent = new THREE.Vector3();

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const view = { width: 1, height: 1 };
    const pointer = { x: 0, y: 0, inside: false, down: false, hover: false, seen: false };
    const anchor = createBody();
    const core = Array.from({ length: CORE }, (_, i) => ({
      ...createBody(),
      spread: i / (CORE - 1),
      angle: (i / CORE) * Math.PI * 2,
      shape: 0,
      tx: 0,
      ty: 0,
      grow: 1
    }));
    const chain = Array.from({ length: MAX_TRAIL }, createBody);
    const drops = [];
    const swell = { value: 0, velocity: 0 };
    const mass = { value: 1, wait: 0 };
    const seeds = Array.from({ length: 4 }, () => Math.random() * Math.PI * 2);
    let clock = Math.random() * 60;
    let dripping = 0;
    let raf = 0;
    let last = 0;
    let alive = true;
    let restoreCursor = null;
    let calm = 0;

    const resize = () => {
      view.width = Math.max(1, root.clientWidth);
      view.height = Math.max(1, root.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(view.width, view.height, false);
      camera.left = -view.width / 2;
      camera.right = view.width / 2;
      camera.top = view.height / 2;
      camera.bottom = -view.height / 2;
      camera.updateProjectionMatrix();
      const reach = Math.max(view.width, view.height) * 0.75;
      const frustum = key.shadow.camera;
      frustum.left = -reach;
      frustum.right = reach;
      frustum.top = reach;
      frustum.bottom = -reach;
      frustum.near = 1;
      frustum.far = reach * 6;
      frustum.updateProjectionMatrix();
      ground.scale.set(view.width * 1.5, view.height * 1.5, 1);
      start();
    };

    const apply = () => {
      const s = settingsRef.current;
      const tint = new THREE.Color();
      try {
        tint.set(s.color);
      } catch {
        tint.set('#ffffff');
      }
      for (const physical of [blobPhysical, sprayPhysical]) {
        physical.color.copy(tint);
        physical.metalness = 0;
        physical.roughness = 0.2;
        physical.clearcoat = 0;
        physical.clearcoatRoughness = 0;
        physical.iridescence = 0;
        physical.envMapIntensity = 1;
        if (s.material === 'chrome') {
          physical.metalness = 1;
          physical.roughness = mix(0.3, 0.04, s.shine);
          physical.envMapIntensity = mix(0.9, 1.3, s.shine);
        } else if (s.material === 'jelly') {
          physical.roughness = mix(0.5, 0.18, s.shine);
          physical.clearcoat = 1;
          physical.clearcoatRoughness = mix(0.25, 0.02, s.shine);
          physical.envMapIntensity = mix(0.5, 0.9, s.shine);
        } else if (s.material === 'pearl') {
          physical.metalness = 0.35;
          physical.roughness = mix(0.4, 0.1, s.shine);
          physical.clearcoat = 1;
          physical.clearcoatRoughness = 0.05;
          physical.iridescence = 1;
          physical.iridescenceIOR = 1.75;
          physical.iridescenceThicknessRange = [240, 820];
          physical.envMapIntensity = 1.15;
        }
        physical.needsUpdate = true;
      }
      blobFlat.color.copy(tint);
      sprayFlat.color.copy(tint);
      const ink = s.material === 'ink';
      blob.material = ink ? blobFlat : blobPhysical;
      spray.material = ink ? sprayFlat : sprayPhysical;
      ground.material.opacity = 0.22;
      root.style.mixBlendMode = s.blend;
      const parent = root.parentElement;
      if (s.hideCursor && parent && !restoreCursor) {
        const previous = parent.style.cursor;
        parent.style.cursor = 'none';
        restoreCursor = () => {
          parent.style.cursor = previous;
        };
      } else if (!s.hideCursor && restoreCursor) {
        restoreCursor();
        restoreCursor = null;
      }
      start();
    };

    const place = (x, y) => {
      for (const body of [anchor, ...core, ...chain]) {
        body.x = x;
        body.y = y;
        body.vx = 0;
        body.vy = 0;
      }
    };

    const locate = event => {
      const rect = root.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
    };

    const onMove = event => {
      if (event.pointerType === 'touch' && !pointer.down) return;
      const spot = locate(event);
      if (spot.inside && (!pointer.inside || !pointer.seen) && swell.value < 0.05) place(spot.x, spot.y);
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = spot.inside;
      pointer.seen = true;
      const target = event.target instanceof Element ? event.target : null;
      pointer.hover = spot.inside && !!target?.closest(INTERACTIVE);
      start();
    };

    const burst = () => {
      const s = settingsRef.current;
      const radius = (s.size / 2) * Math.cbrt(mass.value);
      for (const ball of core) {
        const angle = Math.random() * Math.PI * 2;
        const push = radius * mix(4, 9, Math.random()) * mix(0.6, 1.2, s.wobble);
        ball.vx += Math.cos(angle) * push;
        ball.vy += Math.sin(angle) * push;
      }
      if (!s.splash) return;
      const size = mix(0.12, 0.42, s.splashSize);
      const speed = mix(320, 1600, s.splashSpeed);
      const offset = Math.random() * Math.PI * 2;
      const fresh = [];
      let lost = 0;
      for (let i = 0; i < s.splashCount; i++) {
        const angle = offset + (i / s.splashCount) * Math.PI * 2 + (Math.random() - 0.5) * (Math.PI / s.splashCount);
        const grain = Math.random();
        const pace = speed * mix(1.3, 0.75, grain) * mix(0.85, 1.15, Math.random());
        const r = (s.size / 2) * size * mix(0.65, 1.3, grain);
        const vx = Math.cos(angle) * pace + anchor.vx * 0.4;
        const vy = Math.sin(angle) * pace + anchor.vy * 0.4;
        lost += Math.pow(r / (s.size / 2), 3);
        fresh.push({
          x: anchor.x + Math.cos(angle) * radius * 0.35,
          y: anchor.y + Math.sin(angle) * radius * 0.35,
          vx,
          vy,
          cx: vx * 0.45,
          cy: vy * 0.45,
          r,
          share: 0,
          age: 0,
          life: DROP_LIFE,
          drag: 0.6,
          free: false,
          sink: -1
        });
      }
      const before = mass.value;
      mass.value = Math.max(0.2, before - clamp(lost * 2.4, 0.25, 0.7));
      mass.wait = 0.28;
      for (const drop of fresh) {
        drop.share = ((before - mass.value) * Math.pow(drop.r / (s.size / 2), 3)) / lost;
        if (drops.length >= MAX_DROPS) drops.shift();
        drops.push(drop);
      }
    };

    const onDown = event => {
      const spot = locate(event);
      if (!spot.inside) return;
      if (event.pointerType === 'touch' && swell.value < 0.05) place(spot.x, spot.y);
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = true;
      pointer.seen = true;
      pointer.down = true;
      swell.velocity -= 2;
      if (!reducedMotion) burst();
      start();
    };

    const onUp = event => {
      if (!pointer.down) return;
      pointer.down = false;
      swell.velocity += 1.2;
      if (event.pointerType === 'touch') pointer.inside = false;
      start();
    };

    const onLeave = event => {
      if (event.relatedTarget) return;
      pointer.inside = false;
      pointer.down = false;
      start();
    };

    const onBlur = () => {
      pointer.inside = false;
      pointer.down = false;
      start();
    };

    const integrate = (body, tx, ty, stiffness, damping, h, frameX = 0, frameY = 0) => {
      body.vx += ((tx - body.x) * stiffness - (body.vx - frameX) * damping) * h;
      body.vy += ((ty - body.y) * stiffness - (body.vy - frameY) * damping) * h;
      body.x += body.vx * h;
      body.y += body.vy * h;
    };

    const step = dt => {
      const s = settingsRef.current;
      const radius = s.size / 2;
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      const anchorStiffness = reducedMotion ? 2400 : mix(1200, 160, s.lag);
      const coreStiffness = mix(900, 260, s.lag);
      const linkStiffness = mix(30000, 1500, s.stretch);
      const linkDamping = 2 * Math.sqrt(linkStiffness) * mix(0.95, 0.65, s.wobble);
      const bounce = mix(0.95, 0.4, s.wobble);
      const visible = pointer.inside && pointer.seen;
      const swellTarget = visible ? (pointer.down ? 0.86 : pointer.hover ? 1.3 : 1) : 0;

      if (!reducedMotion) clock += dt * 4 * Math.pow(s.morphSpeed, 1.5);
      const bend = s.morph * (0.6 + 0.4 * Math.sin(clock * 0.71 + seeds[0]));
      const bendAngle = clock * 0.23 + seeds[1];
      const fold = s.morph * 0.8 * (0.5 + 0.5 * Math.sin(clock * 0.53 + seeds[2]));
      const foldAngle = seeds[3] - clock * 0.17;
      let strain = 0;
      for (const ball of core) {
        ball.shape = bend * Math.cos(2 * (ball.angle - bendAngle)) + fold * Math.cos(3 * (ball.angle - foldAngle));
        strain += (ball.shape * ball.shape) / CORE;
      }
      const hold = 1 / (1 + 0.3 * strain);
      for (const ball of core) {
        const out = radius * clamp(0.14 + 0.75 * ball.shape, 0, 0.8) * hold;
        ball.tx = Math.cos(ball.angle) * out;
        ball.ty = Math.sin(ball.angle) * out;
        ball.grow = (1 + 0.35 * ball.shape) * hold;
      }

      for (let i = 0; i < steps; i++) {
        integrate(anchor, pointer.x, pointer.y, anchorStiffness, 2 * Math.sqrt(anchorStiffness) * 0.9, h);
        for (const ball of core) {
          const k = coreStiffness * mix(1.3, 0.7, ball.spread);
          integrate(
            ball,
            anchor.x + ball.tx,
            anchor.y + ball.ty,
            k,
            2 * Math.sqrt(k) * bounce,
            h,
            anchor.vx,
            anchor.vy
          );
        }
        for (let c = 0; c < s.trail; c++) {
          const leader = c > 0 ? chain[c - 1] : anchor;
          integrate(chain[c], leader.x, leader.y, linkStiffness, linkDamping, h);
        }
        const fall = s.splashGravity * 2200;
        const inward = 1 - Math.exp(-18 * h);
        for (const drop of drops) {
          drop.age += h;
          if (drop.sink >= 0) {
            const sunk = Math.min(1, drop.sink + h / 0.14);
            mass.value = Math.min(1.35, mass.value + drop.share * (sunk - drop.sink));
            drop.sink = sunk;
            drop.x += (anchor.x - drop.x) * inward;
            drop.y += (anchor.y - drop.y) * inward;
            continue;
          }
          const ease = Math.exp(-drop.drag * h);
          drop.vx = drop.cx + (drop.vx - drop.cx) * ease;
          drop.vy = drop.cy + (drop.vy - drop.cy) * ease + fall * h;
          drop.x += drop.vx * h;
          drop.y += drop.vy * h;
        }
        swell.velocity +=
          ((swellTarget - swell.value) * 300 - swell.velocity * 2 * Math.sqrt(300) * mix(0.8, 0.38, s.wobble)) * h;
        swell.value += swell.velocity * h;
        if (swell.value < 0) {
          swell.value = 0;
          swell.velocity = Math.max(0, swell.velocity);
        }
      }

      const body = radius * Math.max(swell.value, 0) * Math.cbrt(mass.value);
      const touching = (drop, bodies) =>
        bodies.some(part => part.size > 0 && Math.hypot(drop.x - part.x, drop.y - part.y) < part.size + drop.r * 0.9);
      const tail = s.trail > 0 ? chain[s.trail - 1] : core[CORE - 1];
      const rush = Math.hypot(anchor.vx, anchor.vy);
      if (visible && !reducedMotion) dripping += dt * s.drip * 26 * clamp((rush - 600) / 1800, 0, 1);
      while (dripping >= 1) {
        dripping -= 1;
        const r = radius * mix(0.07, 0.17, Math.random());
        if (Math.hypot(tail.x - anchor.x, tail.y - anchor.y) < body + r * 2) continue;
        const share = Math.pow(r / radius, 3) * 2.4;
        mass.value = Math.max(0.2, mass.value - share);
        if (drops.length >= MAX_DROPS) drops.shift();
        drops.push({
          x: tail.x + (Math.random() - 0.5) * r,
          y: tail.y + (Math.random() - 0.5) * r,
          vx: tail.vx * 0.2,
          vy: tail.vy * 0.2,
          cx: 0,
          cy: 0,
          r,
          share,
          age: 0,
          life: mix(2.5, 4, Math.random()),
          drag: 9,
          free: true,
          sink: -1
        });
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        if (
          drop.free &&
          drop.sink < 0 &&
          drop.age > 0.3 &&
          swell.value > 0.05 &&
          (touching(drop, core) || touching(drop, chain))
        ) {
          drop.sink = 0;
          const kick = Math.min(0.5, drop.share * 4);
          for (const ball of core) {
            ball.vx += (drop.vx - anchor.vx) * kick;
            ball.vy += (drop.vy - anchor.vy) * kick;
          }
        }
        const margin = drop.r * 3;
        const outside =
          drop.x < -margin || drop.y < -margin || drop.x > view.width + margin || drop.y > view.height + margin;
        if (outside || drop.sink >= 1 || drop.age > drop.life) drops.splice(i, 1);
      }
      if (mass.wait > 0) mass.wait -= dt;
      else mass.value += (1 - mass.value) * (1 - Math.exp(-dt * mix(0.9, 6, s.regrow)));
    };

    const build = () => {
      const s = settingsRef.current;
      const full = (s.size / 2) * Math.max(swell.value, 0);
      const radius = full * Math.cbrt(mass.value);
      const present = radius >= 0.5;
      const blend = radius * mix(0.3, 0.9, s.goo);
      const release = radius + blend;
      const lift = mix(0.3, 1, s.depth);
      const room = MAX_PARTS - CORE - s.trail;
      const parts = [];
      const merging = [];
      spray.count = 0;
      for (const part of core) part.size = 0;
      for (const part of chain) part.size = 0;

      for (const drop of drops) {
        const gap = Math.hypot(drop.x - anchor.x, drop.y - anchor.y);
        const rise = drop.free || !present ? 1 : clamp((gap - radius * 0.55) / (radius * 0.6), 0, 1);
        const fade = Math.min(rise * rise * (3 - 2 * rise), drop.age / 0.06, (drop.life - drop.age) / 0.9);
        const r = drop.r * fade * (drop.sink < 0 ? 1 : Math.cbrt(1 - drop.sink));
        if (r < 0.6) continue;
        if (present && merging.length < room && (drop.sink >= 0 || (!drop.free && gap < release + r))) {
          const firm = drop.sink >= 0 ? 0 : clamp((gap - radius * 0.6) / (release + r - radius * 0.6), 0, 1);
          merging.push([
            drop.x,
            drop.y,
            drop.x,
            drop.y,
            r,
            r,
            Math.min(blend, r * 1.2) * (1 - firm * firm * (3 - 2 * firm))
          ]);
          continue;
        }
        drop.free = true;
        if (spray.count >= MAX_DROPS) continue;
        const speed = Math.hypot(drop.vx, drop.vy);
        const settle = present ? clamp((gap - release - r) / (r * 2), 0, 1) : 1;
        const pull = 1 + Math.min(speed / 2600, 0.6) * s.stretch * settle;
        stretchAxis.set(drop.vx, -drop.vy, 0);
        if (speed > 1) spin.setFromUnitVectors(xAxis, stretchAxis.normalize());
        else spin.identity();
        spot.set(drop.x - view.width / 2, view.height / 2 - drop.y, 0);
        extent.set(r * pull, r / Math.sqrt(pull), (r / Math.sqrt(pull)) * lift);
        placement.compose(spot, spin, extent);
        spray.setMatrixAt(spray.count, placement);
        spray.count++;
      }
      spray.instanceMatrix.needsUpdate = true;

      const floor = -(s.size / 2) * 0.9 * lift;
      ground.position.set(0, 0, floor);
      key.target.position.set(0, 0, floor);
      key.position.set(-0.42, 0.5, 0.76).multiplyScalar(Math.max(view.width, view.height) * 2);
      if (!present) return { blob: false, spray: spray.count > 0 };

      for (const ball of core) {
        const r = radius * HEAD_RADIUS * ball.grow;
        ball.size = r + radius * 0.3;
        parts.push([ball.x, ball.y, ball.x, ball.y, r, r, radius * HEAD_BLEND]);
      }
      const route = [anchor, ...chain.slice(0, s.trail)];
      const marks = [0];
      for (let c = 1; c < route.length; c++) {
        marks.push(marks[c - 1] + Math.hypot(route[c].x - route[c - 1].x, route[c].y - route[c - 1].y));
      }
      const length = marks[marks.length - 1];
      const grown = clamp(length / radius, 0, 1);
      const start = radius * mix(0.6, 0.95, grown * grown * (3 - 2 * grown));
      const taper = mix(0.75, 1.6, clamp(length / (radius * 6), 0, 1));
      const thickness = u => mix(radius * 0.1, start, Math.pow(1 - u, taper));
      const sample = distance => {
        let c = 1;
        while (c < marks.length - 1 && marks[c] < distance) c++;
        const span = marks[c] - marks[c - 1];
        const t = span > 0 ? clamp((distance - marks[c - 1]) / span, 0, 1) : 0;
        return [mix(route[c - 1].x, route[c].x, t), mix(route[c - 1].y, route[c].y, t)];
      };
      for (let c = 0; c < s.trail; c++) chain[c].size = thickness(length > 0 ? marks[c + 1] / length : 1);
      let previous = [anchor.x, anchor.y];
      for (let m = 1; m <= s.trail; m++) {
        const next = sample((length * m) / s.trail);
        parts.push([
          previous[0],
          previous[1],
          next[0],
          next[1],
          thickness((m - 1) / s.trail),
          thickness(m / s.trail),
          radius * 0.06
        ]);
        previous = next;
      }
      parts.push(...merging);

      const seg = field.blobSeg.value;
      const info = field.blobInfo.value;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      const join = radius * mix(0.2, 0.6, s.goo);
      let top = join;
      parts.forEach(([ax, ay, bx, by, r1, r2, k], i) => {
        const x1 = ax - view.width / 2;
        const y1 = view.height / 2 - ay;
        const x2 = bx - view.width / 2;
        const y2 = view.height / 2 - by;
        const reach = Math.max(r1, r2) + k;
        seg.set([x1, y1, x2, y2], i * 4);
        info.set([r1, r2, k, 0], i * 4);
        minX = Math.min(minX, x1 - reach, x2 - reach);
        maxX = Math.max(maxX, x1 + reach, x2 + reach);
        minY = Math.min(minY, y1 - reach, y2 - reach);
        maxY = Math.max(maxY, y1 + reach, y2 + reach);
        top = Math.max(top, reach);
      });
      field.blobCount.value = parts.length;
      field.blobHeadEnd.value = CORE;
      field.blobTubeEnd.value = CORE + s.trail;
      field.blobJoin.value = join;
      field.blobTop.value = top;
      field.blobRef.value = radius;
      field.blobLift.value = lift;
      blob.position.set((minX + maxX) / 2, (minY + maxY) / 2, 0);
      blob.scale.set(maxX - minX + 4, maxY - minY + 4, 1);
      return { blob: true, spray: spray.count > 0 };
    };

    const tick = now => {
      raf = 0;
      if (!alive) return;
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      step(dt);
      const built = build();
      const shown = built.blob || built.spray;
      blob.visible = built.blob;
      spray.visible = built.spray;
      ground.visible = shown && settingsRef.current.shadow;
      renderer.render(scene, camera);
      let energy =
        Math.hypot(anchor.vx, anchor.vy) +
        Math.abs(swell.velocity) * 40 +
        drops.length * 100 +
        Math.abs(1 - mass.value) * 400;
      for (const ball of core) energy += Math.hypot(ball.vx, ball.vy);
      for (let c = 0; c < settingsRef.current.trail; c++) energy += Math.hypot(chain[c].vx, chain[c].vy);
      const breathing =
        pointer.inside && settingsRef.current.morph > 0 && settingsRef.current.morphSpeed > 0 && !reducedMotion;
      calm = energy > 1.5 || breathing ? 0 : calm + dt;
      if (!shown && !pointer.inside) return;
      if (calm > 0.4) return;
      raf = requestAnimationFrame(tick);
    };

    function start() {
      if (raf || !alive) return;
      calm = 0;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    document.addEventListener('pointerout', onLeave);
    window.addEventListener('blur', onBlur);

    applyRef.current = apply;
    resize();
    apply();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      applyRef.current = null;
      restoreCursor?.();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('pointerout', onLeave);
      window.removeEventListener('blur', onBlur);
      blob.geometry.dispose();
      blobPhysical.dispose();
      blobFlat.dispose();
      cast.dispose();
      sphere.dispose();
      spray.dispose();
      sprayPhysical.dispose();
      sprayFlat.dispose();
      ground.geometry.dispose();
      ground.material.dispose();
      environment.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return <div ref={rootRef} className={`blob-cursor ${className}`.trim()} style={style} />;
};

export default BlobCursor;
