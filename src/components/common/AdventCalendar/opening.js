import * as THREE from 'three';
import {
  BOX,
  BODY_TOP,
  LID_BOTTOM,
  LID_CENTER,
  BOW_Y,
  writeRibbon,
  SPARK_FRAG,
  AURA_VERT,
  AURA_FRAG,
  premultipliedBlend
} from './giftScene';

const TAU = Math.PI * 2;
const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = t => {
  const v = clamp01(t);
  return v * v * (3 - 2 * v);
};
const easeInOut = t => {
  const v = clamp01(t);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
};
const easeOut = t => 1 - Math.pow(1 - clamp01(t), 3);
const easeIn = t => Math.pow(clamp01(t), 3);
const lerp = (a, b, t) => a + (b - a) * t;
const settle = t => {
  const v = clamp01(t);
  if (v >= 1) return 1;
  return 1 - Math.exp(-7 * v) * Math.cos(6.2 * v) * (1 - v);
};

export const TIMES = {
  fly: 0.82,
  wall: 0.92,
  wallDur: 0.3,
  lidArms: 1.16,
  lidDur: 0.3,
  bow: 1.38,
  charge: 1.5,
  pop: 1.98,
  tiles: 2.02,
  stagger: 0.008,
  flight: 0.9
};
export const OPEN_END = TIMES.tiles + TIMES.stagger * 23 + TIMES.flight;

const BURST_VERT = `
attribute vec3 aDir;
attribute vec4 aParams;
uniform float uTime;
uniform float uScale;
uniform vec3 uOrigin;
varying float vAlpha;
varying float vBokeh;
void main() {
  float t = max(uTime - aParams.w, 0.0);
  float life = aParams.z;
  float k = clamp(t / life, 0.0, 1.0);
  float drag = 3.2;
  vec3 p = uOrigin + aDir * aParams.x * (1.0 - exp(-drag * t)) / drag + vec3(0.0, -0.9, 0.0) * t * t;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float on = step(aParams.w, uTime) * smoothstep(0.0, 0.04, t);
  vAlpha = on * (1.0 - k) * (1.0 - k) * step(k, 0.999);
  vBokeh = 0.0;
  gl_PointSize = aParams.y * (1.0 - 0.4 * k) * uScale / -mv.z;
}
`;

const makeBurst = (look, count, seed, spread) => {
  let s = seed;
  const random = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const dir = new Float32Array(count * 3);
  const params = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    const a = random() * TAU;
    const up = spread.up + random() * spread.upRange;
    const h = Math.sqrt(Math.max(0, 1 - up * up));
    dir[i * 3] = Math.cos(a) * h;
    dir[i * 3 + 1] = up;
    dir[i * 3 + 2] = Math.sin(a) * h;
    params[i * 4] = spread.speed * (0.35 + random() * 0.65);
    params[i * 4 + 1] = spread.size * (0.6 + random() * 0.8);
    params[i * 4 + 2] = spread.life * (0.55 + random() * 0.45);
    params[i * 4 + 3] = random() * spread.delay;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geometry.setAttribute('aParams', new THREE.BufferAttribute(params, 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
  const material = new THREE.ShaderMaterial({
    vertexShader: BURST_VERT,
    fragmentShader: SPARK_FRAG,
    uniforms: {
      uTime: { value: -1 },
      uScale: { value: 600 },
      uOrigin: { value: new THREE.Vector3() },
      uColor: { value: new THREE.Vector3(...look.glow) },
      uCore: { value: new THREE.Vector3(...look.core) },
      uOpacity: { value: look.sparkOpacity }
    },
    ...premultipliedBlend
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = 3;
  points.frustumCulled = false;
  return points;
};

const roundedShape = (w, h, r) => {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
};

const PIECE_W = BOX.w / 2;
const PIECE_H = BOX.h / 3;
const TILE_T = 0.034;

export const createOpening = gift => {
  const { scene, root, camera, look, lid, bow, arms, body } = gift;
  const renderer = gift.getRenderer();
  const extras = [];
  let plan = null;

  const seam = gift.seam;

  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.4),
    new THREE.ShaderMaterial({
      vertexShader: AURA_VERT,
      fragmentShader: AURA_FRAG,
      uniforms: { uColor: { value: new THREE.Vector3(...look.core) }, uOpacity: { value: 0 } },
      ...premultipliedBlend,
      depthTest: false
    })
  );
  flash.renderOrder = 5;
  flash.visible = false;
  scene.add(flash);
  extras.push(flash);

  const bowBurst = makeBurst(look, 46, 31, { up: 0.1, upRange: 0.9, speed: 2.2, size: 0.11, life: 0.9, delay: 0.06 });
  bowBurst.material.uniforms.uOrigin.value.set(0, BOW_Y + 0.05, 0);
  gift.gift.add(bowBurst);
  const popBurst = makeBurst(look, 170, 77, {
    up: -0.15,
    upRange: 1.1,
    speed: 4.6,
    size: 0.12,
    life: 0.95,
    delay: 0.06
  });
  popBurst.material.uniforms.uOrigin.value.set(0, BODY_TOP, 0);
  gift.gift.add(popBurst);
  extras.push(bowBurst, popBurst);

  const retract = arms.map(arm => {
    const build = rest => {
      const lengths = [0];
      for (let i = 1; i < rest.length; i += 1) lengths.push(lengths[i - 1] + rest[i].p.distanceTo(rest[i - 1].p));
      const work = rest.map(s => ({ p: s.p.clone(), n: s.n.clone(), t: s.t.clone(), w: s.w }));
      return { rest, lengths, total: lengths[lengths.length - 1], work };
    };
    return { lid: build(arm.rest.lidArm), wall: build(arm.rest.wallArm) };
  });

  const writeTrim = (path, geometry, visible) => {
    const { rest, lengths, total, work } = path;
    const n = rest.length;
    const length = Math.max(0.0005, Math.min(total, visible));
    let i0 = 0;
    for (let i = 0; i < n; i += 1) {
      const s = (length * i) / (n - 1);
      while (i0 < n - 2 && lengths[i0 + 1] < s) i0 += 1;
      const span = lengths[i0 + 1] - lengths[i0] || 1;
      const u = clamp01((s - lengths[i0]) / span);
      const out = work[i];
      out.p.lerpVectors(rest[i0].p, rest[i0 + 1].p, u);
      out.n.lerpVectors(rest[i0].n, rest[i0 + 1].n, u).normalize();
      out.t.lerpVectors(rest[i0].t, rest[i0 + 1].t, u).normalize();
      if (visible < total) {
        const tail = clamp01(1 - (length - s) / 0.09);
        out.p.addScaledVector(out.n, 0.05 * tail * tail);
        out.n.addScaledVector(out.t, -0.9 * tail * tail).normalize();
      }
    }
    writeRibbon(geometry, work);
  };

  const tiles = [];
  const tileGroup = new THREE.Group();
  scene.add(tileGroup);
  extras.push(tileGroup);

  const warmTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  warmTexture.colorSpace = THREE.SRGBColorSpace;
  warmTexture.needsUpdate = true;
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: look.tileEdge, roughness: 0.7, metalness: 0 });
  const warmFace = new THREE.MeshBasicMaterial({
    map: warmTexture,
    color: '#ffffff',
    transparent: true,
    toneMapped: false
  });
  const warmTile = new THREE.Group();
  warmTile.add(
    new THREE.Mesh(
      new THREE.ExtrudeGeometry(roundedShape(0.3, 0.3, 0.04), {
        depth: 0.02,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.005,
        bevelSegments: 2
      }),
      [gift.tilePaper, edgeMaterial]
    ),
    new THREE.Mesh(new THREE.ShapeGeometry(roundedShape(0.3, 0.3, 0.04), 4), warmFace)
  );
  warmTile.visible = false;
  tileGroup.add(warmTile);
  const warmables = [warmTile, flash];

  const frameAt = t => {
    const u = easeInOut(t / TIMES.fly);
    const a = plan.from;
    const b = plan.to;
    const ax = a.x + a.size / 2;
    const ay = a.y + a.size / 2;
    const bx = b.x + b.size / 2;
    const by = b.y + b.size / 2;
    const cx = lerp(ax, bx, 0.62);
    const cy = Math.min(ay, by) - Math.min(260, plan.height * 0.22);
    const w0 = (1 - u) * (1 - u);
    const w1 = 2 * (1 - u) * u;
    const w2 = u * u;
    const x = w0 * ax + w1 * cx + w2 * bx;
    const y = w0 * ay + w1 * cy + w2 * by;
    const size = lerp(a.size, b.size, u);
    return { x: x - size / 2, y: y - size / 2, size };
  };

  const applyFrame = frame => {
    camera.aspect = 1;
    camera.setViewOffset(frame.size, frame.size, -frame.x, -frame.y, plan.width, plan.height);
    camera.updateProjectionMatrix();
    const scale = (frame.size * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    gift.sparks.material.uniforms.uScale.value = scale;
    bowBurst.material.uniforms.uScale.value = scale;
    popBurst.material.uniforms.uScale.value = scale;
  };

  const depth = camera.position.distanceTo(new THREE.Vector3(0, 0.08, 0));

  const worldAt = (px, py, frame) => {
    const wpp = (2 * depth * Math.tan((camera.fov * Math.PI) / 360)) / frame.size;
    const v = new THREE.Vector3(
      (px - (frame.x + frame.size / 2)) * wpp,
      -(py - (frame.y + frame.size / 2)) * wpp,
      -depth
    );
    camera.updateMatrixWorld();
    return { point: v.applyMatrix4(camera.matrixWorld), wpp };
  };

  const buildTiles = () => {
    const frame = plan.to;
    root.updateMatrixWorld(true);
    const giftMatrix = gift.gift.matrixWorld.clone();
    const project = new THREE.Vector3();
    camera.updateMatrixWorld();
    const pieces = [];
    for (let j = 0; j < 4; j += 1) {
      const dir = new THREE.Vector3(Math.sin((j * Math.PI) / 2), 0, Math.cos((j * Math.PI) / 2));
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(up, dir);
      const basis = new THREE.Matrix4().makeBasis(right.clone().negate(), up, dir.clone().negate());
      const qLocal = new THREE.Quaternion().setFromRotationMatrix(basis);
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 2; c += 1) {
          const local = dir
            .clone()
            .multiplyScalar(BOX.w / 2 - TILE_T / 2)
            .addScaledVector(right, (c - 0.5) * PIECE_W)
            .addScaledVector(up, (1 - r) * PIECE_H);
          const m = new THREE.Matrix4().compose(local, qLocal, new THREE.Vector3(1, 1, 1)).premultiply(giftMatrix);
          const p0 = new THREE.Vector3();
          const q0 = new THREE.Quaternion();
          m.decompose(p0, q0, new THREE.Vector3());
          project.copy(p0).project(camera);
          const sx = ((project.x + 1) / 2) * plan.width;
          const sy = ((1 - project.y) / 2) * plan.height;
          const viewZ = p0.clone().applyMatrix4(camera.matrixWorldInverse).z;
          pieces.push({ j, r, c, p0, q0, angle: Math.atan2(sy - plan.center[1], sx - plan.center[0]), depth: viewZ });
        }
      }
    }
    const byAngle = list => [...list].sort((a, b) => a.angle - b.angle);
    const targets = byAngle(
      plan.tiles.map(t => ({ ...t, angle: Math.atan2(t.cy - plan.center[1], t.cx - plan.center[0]) }))
    );
    const sortedPieces = byAngle(pieces);
    let s = 9;
    const random = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const q1 = camera.quaternion.clone();
    targets.forEach((target, k) => {
      const piece = sortedPieces[k];
      const { point, wpp } = worldAt(target.cx, target.cy, frame);
      const w1 = target.w * wpp;
      const h1 = target.h * wpp;
      const radius = Math.min(target.radius * wpp, w1 / 2, h1 / 2);
      const bevel = 0.005;
      const inset = 3 * wpp;
      const bodyGeometry = new THREE.ExtrudeGeometry(
        roundedShape(w1 - (bevel + inset) * 2, h1 - (bevel + inset) * 2, Math.max(0.001, radius - bevel - inset)),
        {
          depth: TILE_T - bevel * 2,
          bevelEnabled: true,
          bevelThickness: bevel,
          bevelSize: bevel,
          bevelSegments: 2,
          curveSegments: 6
        }
      );
      bodyGeometry.translate(0, 0, -TILE_T / 2 + bevel);
      const faceGeometry = new THREE.ShapeGeometry(roundedShape(w1, h1, radius), 8);
      const uv = faceGeometry.attributes.uv;
      const pos = faceGeometry.attributes.position;
      for (let i = 0; i < uv.count; i += 1) uv.setXY(i, pos.getX(i) / w1 + 0.5, pos.getY(i) / h1 + 0.5);
      faceGeometry.translate(0, 0, TILE_T / 2 + 0.0012);
      const faceMaterial = new THREE.MeshBasicMaterial({
        map: target.texture || null,
        color: '#ffffff',
        transparent: true,
        toneMapped: false
      });
      const group = new THREE.Group();
      const bodyMesh = new THREE.Mesh(bodyGeometry, [gift.tilePaper, edgeMaterial]);
      const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
      group.add(bodyMesh, faceMesh);
      group.visible = false;
      tileGroup.add(group);
      const axis = new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
      tiles.push({
        target,
        group,
        bodyMesh,
        faceMaterial,
        p0: piece.p0,
        q0: piece.q0,
        p1: point,
        q1,
        s0: new THREE.Vector2(PIECE_W / w1, PIECE_H / h1),
        axis,
        spin: (random() < 0.5 ? -1 : 1) * (0.5 + random() * 0.7),
        reach: 0.35 + random() * 0.45,
        lift: 0.5 + random() * 0.8,
        depth: piece.depth
      });
    });
    [...tiles]
      .sort((a, b) => b.depth - a.depth)
      .forEach((tile, k) => {
        tile.start = TIMES.tiles + k * TIMES.stagger;
      });
  };

  const center = new THREE.Vector3();
  const _q = new THREE.Quaternion();
  const _qs = new THREE.Quaternion();
  const _n = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  let built = false;

  const render = t => {
    const frame = frameAt(Math.min(t, TIMES.fly));
    applyFrame(frame);
    const time = plan.time + t;
    gift.idle(time, smooth(t / 0.3));
    const fly = easeInOut(t / TIMES.fly);
    root.rotation.y += TAU * fly;
    const lean = Math.sin(Math.PI * fly);
    gift.gift.rotation.z += -0.18 * lean;
    gift.gift.rotation.x += 0.1 * lean;
    const land = clamp01((t - TIMES.fly) / 0.5);
    if (land > 0 && land < 1) {
      const k = settle(land);
      gift.gift.position.y += -0.05 * (1 - k) * Math.sin(Math.PI * land);
    }

    const charge = clamp01((t - TIMES.charge) / (TIMES.pop - TIMES.charge));
    const rattle = charge * charge;
    const popped = t >= TIMES.pop;
    gift.gift.position.x = 0.008 * rattle * Math.sin(t * 73);
    if (!popped) {
      lid.position.y += 0.014 * rattle * Math.abs(Math.sin(t * 34));
      lid.rotation.x += 0.035 * rattle * Math.sin(t * 47);
      lid.rotation.z += 0.035 * rattle * Math.sin(t * 41 + 1);
    } else {
      const tl = (t - TIMES.pop) / 0.8;
      lid.position.set(0.35 * tl, LID_CENTER + 5.2 * tl - 1.6 * tl * tl, 0.2 * tl);
      lid.rotation.set(1.7 * tl, 0.6 * tl, -1.1 * tl);
      lid.visible = tl < 1;
    }
    const glow = popped ? 0 : smooth(charge) * (gift.theme === 'light' ? 0.22 : 0.16);
    gift.bodyPaper.emissive.setRGB(look.glow[0] * glow, look.glow[1] * glow, look.glow[2] * glow);
    gift.lidPaper.emissive.copy(gift.bodyPaper.emissive);
    const flicker = 0.85 + 0.15 * Math.sin(t * 31) * Math.sin(t * 17);
    seam.material.uniforms.uOpacity.value = popped ? 0 : smooth(charge) * flicker * (gift.theme === 'light' ? 0.75 : 1);

    const tb = (t - TIMES.bow) / 0.5;
    const tug = clamp01((t - TIMES.wall) / (TIMES.bow - TIMES.wall));
    if (tb <= 0 && tug > 0) {
      const k = Math.sin(Math.PI * tug);
      bow.rotation.set(0.05 * k * Math.sin(t * 40), 0.08 * k * Math.sin(t * 27), 0.05 * k * Math.sin(t * 33));
      bow.position.y = -0.012 * tug;
    }
    if (tb > 0) {
      const s = Math.max(0.0001, 1 - easeIn(tb));
      bow.scale.setScalar(s);
      bow.position.set(0, BOW_Y * (1 - s) + 0.45 * easeOut(tb), 0);
      bow.rotation.set(0, 3.4 * easeOut(tb), 0.4 * tb);
      bow.visible = tb < 1;
    }
    bowBurst.material.uniforms.uTime.value = t - TIMES.bow - 0.05;

    const wallPull = easeIn((t - TIMES.wall) / TIMES.wallDur);
    const lidPull = Math.pow(clamp01((t - TIMES.lidArms) / TIMES.lidDur), 2.2);
    arms.forEach((arm, k) => {
      const path = retract[k];
      if (wallPull > 0) {
        writeTrim(path.wall, arm.wallGeometry, path.wall.total * (1 - wallPull));
        arm.wallMesh.visible = wallPull < 1;
      }
      if (lidPull > 0) {
        writeTrim(path.lid, arm.lidGeometry, path.lid.total * (1 - lidPull));
        arm.lidMesh.visible = lidPull < 1;
      }
    });
    const wallEnd = lerp(-BOX.h / 2, LID_BOTTOM, wallPull);
    gift.bodyPaper.userData.ao.uRibbonCut.value = wallPull > 0 ? wallEnd : -10;
    gift.lidPaper.userData.ao.uRibbonCut.value = lidPull > 0 ? retract[0].lid.total * (1 - lidPull) : 10;
    gift.lidPaper.userData.ao.uBowFade.value = 1 - smooth(tb);

    const aura = gift.aura.material.uniforms.uOpacity;
    const after = clamp01((t - TIMES.pop) / 0.4);
    aura.value *= (1 + 0.9 * smooth(charge)) * (1 - after);
    gift.sparks.material.uniforms.uOpacity.value = look.sparkOpacity * (1 - after);
    gift.floor.material.uniforms.uOpacity.value *= (1 + 0.6 * smooth(charge)) * (1 - after);
    gift.shadow.material.opacity *= 1 - after;

    popBurst.material.uniforms.uTime.value = t - TIMES.pop;

    const tfl = (t - TIMES.pop) / 0.6;
    flash.visible = tfl > 0 && tfl < 1;
    if (flash.visible) {
      gift.gift.localToWorld(center.set(0, BODY_TOP, 0));
      toCam.subVectors(camera.position, center).normalize();
      flash.position.copy(center).addScaledVector(toCam, 0.6);
      flash.quaternion.copy(camera.quaternion);
      flash.scale.setScalar(0.5 + 2.4 * easeOut(tfl));
      flash.material.uniforms.uOpacity.value =
        Math.pow(1 - tfl, 2) * (gift.theme === 'light' ? 0.9 : 1.3) * smooth(tfl / 0.08);
    }

    const swap = t >= TIMES.pop + 0.03;
    if (swap && !built) {
      buildTiles();
      built = true;
    }
    body.visible = !swap;
    tiles.forEach(tile => {
      const u = clamp01((t - tile.start) / TIMES.flight);
      tile.group.visible = swap;
      if (!swap) return;
      const e = 1 - Math.pow(1 - u, 4);
      const er = easeInOut(Math.min(1, u * 1.15));
      const bump = Math.sin(Math.PI * Math.min(1, u / 0.75));
      const g = tile.group;
      tile.bodyMesh.visible = u < 0.93;
      g.position.lerpVectors(tile.p0, tile.p1, e);
      _n.subVectors(tile.p0, center.set(0, 0, 0))
        .setY(0)
        .normalize();
      g.position.addScaledVector(_n, tile.reach * bump * 1.2);
      toCam.subVectors(camera.position, g.position).normalize();
      g.position.addScaledVector(toCam, tile.lift * bump * 0.7);
      g.position.y += 0.25 * bump * tile.lift;
      _q.slerpQuaternions(tile.q0, tile.q1, er);
      _qs.setFromAxisAngle(tile.axis, Math.sin(Math.PI * er) * tile.spin);
      g.quaternion.copy(_q).multiply(_qs);
      const es = easeOut(Math.min(1, u * 1.3));
      g.scale.set(lerp(tile.s0.x, 1, es), lerp(tile.s0.y, 1, es), lerp(1, 0.02, smooth((u - 0.7) / 0.3)));
      _n.set(0, 0, 1).applyQuaternion(g.quaternion);
      toCam.subVectors(camera.position, g.position).normalize();
      const facing = Math.max(0, _n.dot(toCam));
      tile.faceMaterial.color.setScalar(lerp(0.45 + 0.55 * facing, 1, smooth((u - 0.85) / 0.15)));
    });

    gift.render();
  };

  const warm = () => {
    warmables.forEach(o => {
      o.visible = true;
    });
    const done = renderer.compileAsync
      ? renderer.compileAsync(scene, camera)
      : Promise.resolve(renderer.compile(scene, camera));
    warmables.forEach(o => {
      o.visible = false;
    });
    return done;
  };

  const start = next => {
    plan = next;
  };

  const dispose = () => {
    warmTexture.dispose();
    warmFace.dispose();
    edgeMaterial.dispose();
    extras.forEach(o => o.parent && o.parent.remove(o));
    tiles.forEach(tile => {
      tile.group.children.forEach(m => m.geometry.dispose());
      tile.faceMaterial.map?.dispose();
      tile.faceMaterial.dispose();
    });
  };

  return { start, render, warm, dispose, frameAt, tiles };
};
