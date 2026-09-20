import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './PaperCrumple.css';
const spring = (value = 0) => ({ value, target: value, velocity: 0 });
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value, fallback) => (Number.isFinite(value) ? value : fallback);
function advance(s, dt, duration, instant) {
  if (instant || duration <= 0) {
    s.value = s.target;
    s.velocity = 0;
    return false;
  }
  const omega = 8 / Math.max(0.06, duration);
  const offset = s.value - s.target;
  const term = s.velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  s.value = s.target + (offset + term * dt) * decay;
  s.velocity = (s.velocity - omega * term * dt) * decay;
  if (Math.abs(s.value - s.target) < 0.0001 && Math.abs(s.velocity) < 0.001) {
    s.value = s.target;
    s.velocity = 0;
    return false;
  }
  return true;
}
function randomSource(seed) {
  let value = seed | 0;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let n = Math.imul(value ^ (value >>> 15), 1 | value);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
function createPaperPath(rest, triangles, shortSide, density, sharpness, depth, seed) {
  const count = rest.length / 3;
  const points = Float64Array.from(rest);
  const previous = Float64Array.from(rest);
  const before = Float64Array.from(rest);
  const edges = [];
  const hinges = [];
  const adjacency = new Map();
  const random = randomSource(seed);
  const guides = Array.from({ length: density }, () => {
    const angle = random() * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle), phase: random() * Math.PI * 2, weight: random() * 0.6 + 0.4 };
  });
  for (let t = 0; t < triangles.length; t += 3) {
    for (let k = 0; k < 3; k++) {
      const a = triangles[t + k],
        b = triangles[t + ((k + 1) % 3)],
        opposite = triangles[t + ((k + 2) % 3)];
      const key = Math.min(a, b) * count + Math.max(a, b);
      const other = adjacency.get(key);
      if (!other) {
        adjacency.set(key, { a, b, opposite });
        const length = Math.hypot(rest[a * 3] - rest[b * 3], rest[a * 3 + 1] - rest[b * 3 + 1]);
        edges.push(a * 3, b * 3, length);
      } else {
        const c = other.opposite * 3,
          d = opposite * 3;
        const length = Math.hypot(rest[c] - rest[d], rest[c + 1] - rest[d + 1]);
        const mx = (rest[c] + rest[d]) * 0.5,
          my = (rest[c + 1] + rest[d + 1]) * 0.5;
        let weakness = 0;
        for (const guide of guides) {
          const distance = Math.abs(Math.sin(((mx * guide.x + my * guide.y) / shortSide) * 4 + guide.phase));
          weakness = Math.max(weakness, Math.exp(-distance * distance * 80) * guide.weight);
        }
        hinges.push(c, d, length, 0.12 + (1 - weakness) * 0.75);
      }
    }
  }
  const spacing = Math.sqrt((shortSide * shortSide) / count);
  const thickness = shortSide * 0.008;
  const samples = [rest.slice()];
  const frameCount = 64;
  const stepsPerFrame = 3;
  const totalSteps = frameCount * stepsPerFrame;
  let initialRadius = 0;
  for (let i = 0; i < rest.length; i += 3)
    initialRadius = Math.max(initialRadius, Math.hypot(rest[i] / 0.94, rest[i + 1] / 1.02));
  initialRadius *= 1.02;
  function constrain(list, stride, stiffness, reverse) {
    for (let n = 0; n < list.length; n += stride) {
      const edge = reverse ? list.length - stride - n : n;
      const a = list[edge],
        b = list[edge + 1];
      const dx = points[b] - points[a],
        dy = points[b + 1] - points[a + 1],
        dz = points[b + 2] - points[a + 2];
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (length < 0.000001) continue;
      const weight = stride === 4 ? list[edge + 3] : 1;
      const amount = (1 - list[edge + 2] / length) * 0.5 * stiffness * weight;
      points[a] += dx * amount;
      points[b] -= dx * amount;
      points[a + 1] += dy * amount;
      points[b + 1] -= dy * amount;
      points[a + 2] += dz * amount;
      points[b + 2] -= dz * amount;
    }
  }
  function separateLayers() {
    const margin = thickness * 2;
    for (let t = 0; t < triangles.length; t += 3) {
      const a = triangles[t] * 3,
        b = triangles[t + 1] * 3,
        c = triangles[t + 2] * 3;
      const ax = points[a],
        ay = points[a + 1],
        az = points[a + 2];
      const bx = points[b] - ax,
        by = points[b + 1] - ay,
        bz = points[b + 2] - az;
      const cx = points[c] - ax,
        cy = points[c + 1] - ay,
        cz = points[c + 2] - az;
      let nx = by * cz - bz * cy,
        ny = bz * cx - bx * cz,
        nz = bx * cy - by * cx;
      const length = Math.hypot(nx, ny, nz);
      if (length < 0.0000001) continue;
      nx /= length;
      ny /= length;
      nz /= length;
      const minX = Math.min(ax, points[b], points[c]) - margin;
      const maxX = Math.max(ax, points[b], points[c]) + margin;
      const minY = Math.min(ay, points[b + 1], points[c + 1]) - margin;
      const maxY = Math.max(ay, points[b + 1], points[c + 1]) + margin;
      const minZ = Math.min(az, points[b + 2], points[c + 2]) - margin;
      const maxZ = Math.max(az, points[b + 2], points[c + 2]) + margin;
      const bb = bx * bx + by * by + bz * bz,
        cc = cx * cx + cy * cy + cz * cz;
      const bc = bx * cx + by * cy + bz * cz;
      const determinant = bb * cc - bc * bc;
      if (determinant < 0.0000000001) continue;
      for (let p = 0; p < points.length; p += 3) {
        if (p === a || p === b || p === c) continue;
        if (
          points[p] < minX ||
          points[p] > maxX ||
          points[p + 1] < minY ||
          points[p + 1] > maxY ||
          points[p + 2] < minZ ||
          points[p + 2] > maxZ
        )
          continue;
        const rx = rest[p] - (rest[a] + rest[b] + rest[c]) / 3;
        const ry = rest[p + 1] - (rest[a + 1] + rest[b + 1] + rest[c + 1]) / 3;
        if (rx * rx + ry * ry < spacing * spacing * 6) continue;
        const dx = points[p] - ax,
          dy = points[p + 1] - ay,
          dz = points[p + 2] - az;
        const distance = dx * nx + dy * ny + dz * nz;
        const previousDistance =
          (before[p] - before[a]) * nx + (before[p + 1] - before[a + 1]) * ny + (before[p + 2] - before[a + 2]) * nz;
        const side = previousDistance >= 0 ? 1 : -1;
        if (distance * side >= thickness || Math.abs(distance) > margin) continue;
        const pb = dx * bx + dy * by + dz * bz,
          pc = dx * cx + dy * cy + dz * cz;
        const u = (cc * pb - bc * pc) / determinant;
        const v = (bb * pc - bc * pb) / determinant;
        if (u < 0 || v < 0 || u + v > 1) continue;
        const w = 1 - u - v;
        const correction = (thickness * side - distance) / (1 + w * w + u * u + v * v);
        for (let axis = 0; axis < 3; axis++) {
          const normal = axis === 0 ? nx : axis === 1 ? ny : nz;
          const movement = normal * correction;
          points[p + axis] += movement;
          points[a + axis] -= movement * w;
          points[b + axis] -= movement * u;
          points[c + axis] -= movement * v;
        }
      }
    }
  }
  for (let step = 1; step <= totalSteps; step++) {
    const progress = step / totalSteps;
    const compression = progress * progress * (3 - 2 * progress);
    const radius = initialRadius * (1 - compression) + shortSide * (0.19 - depth * 0.025) * compression;
    before.set(points);
    for (let i = 0; i < points.length; i += 3) {
      const x = rest[i] / shortSide,
        y = rest[i + 1] / shortSide;
      let buckle = 0;
      for (const guide of guides) buckle += Math.sin((x * guide.x + y * guide.y) * 5 + guide.phase) * guide.weight;
      for (let axis = 0; axis < 3; axis++) {
        const velocity = (points[i + axis] - previous[i + axis]) * 0.55;
        previous[i + axis] = points[i + axis];
        points[i + axis] += clamp(velocity, -spacing * 0.15, spacing * 0.15);
      }
      points[i + 2] += (buckle / density) * shortSide * 0.0007 * Math.sin(progress * Math.PI);
    }
    for (let pass = 0; pass < 18; pass++) {
      constrain(hinges, 4, 0.45 * (1 - sharpness * 0.4), pass % 2 === 0);
      for (let i = 0; i < points.length; i += 3) {
        const x = points[i] / 0.94,
          y = points[i + 1] / 1.02,
          z = points[i + 2] / 0.86;
        const distance = Math.hypot(x, y, z);
        if (distance > radius) {
          const push = (1 - radius / distance) * 0.55;
          points[i] -= points[i] * push;
          points[i + 1] -= points[i + 1] * push;
          points[i + 2] -= points[i + 2] * push;
        }
      }
      constrain(edges, 3, 1, pass % 2 !== 0);
      if (pass === 8 || pass === 17) separateLayers();
    }
    for (let h = 0; h < hinges.length; h += 4) {
      const a = hinges[h],
        b = hinges[h + 1];
      const length = Math.hypot(points[a] - points[b], points[a + 1] - points[b + 1], points[a + 2] - points[b + 2]);
      if (length < hinges[h + 2] * 0.86) hinges[h + 2] += (length - hinges[h + 2]) * 0.12;
    }
    if (step % stepsPerFrame === 0) samples.push(Float32Array.from(points));
  }
  const folded = Float64Array.from(points);
  for (let step = 1; step <= 80; step++) {
    const t = step / 80;
    const unfold = t * t * (3 - 2 * t);
    for (let pass = 0; pass < 12; pass++) {
      for (let i = 0; i < points.length; i++) {
        const target = folded[i] + (rest[i] - folded[i]) * unfold;
        points[i] += (target - points[i]) * (i % 3 === 2 ? 0.04 : 0.22);
      }
      constrain(hinges, 4, 0.7, pass % 2 === 0);
      constrain(edges, 3, 1, pass % 2 !== 0);
    }
  }
  const creased = Float32Array.from(points);
  return { samples, creased };
}
const PaperCrumple = ({
  src,
  alt = 'Crumplable image',
  backSrc = '',
  width = 320,
  height = 400,
  sceneHeight = 560,
  imageFit = 'cover',
  releaseBehavior = 'restore',
  crumpleAmount = 0.85,
  crumpleDuration = 0.55,
  releaseDuration = 0.4,
  foldCount = 6,
  foldSharpness = 0.6,
  wrinkleDepth = 0.65,
  creaseStrength = 0.18,
  paperColor = '#f4f0e8',
  roughness = 0.92,
  paperTexture = 0.08,
  lightIntensity = 1.8,
  lightAngle = -35,
  shadow = true,
  shadowOpacity = 0.08,
  draggable = true,
  dragRotation = 10,
  dragRadius = 180,
  returnToOrigin = true,
  rotation = 0,
  seed = 7,
  detail = 64,
  disabled = false,
  resetKey = 0,
  onStateChange,
  onError,
  className = '',
  style
}) => {
  const pathCache = useRef(null);
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const hitRef = useRef(null);
  const resetRef = useRef(null);
  const cancelRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const options = useRef({
    releaseBehavior,
    crumpleAmount,
    crumpleDuration,
    releaseDuration,
    creaseStrength,
    draggable,
    dragRotation,
    dragRadius,
    returnToOrigin,
    disabled,
    onStateChange,
    onError
  });
  options.current = {
    releaseBehavior,
    crumpleAmount,
    crumpleDuration,
    releaseDuration,
    creaseStrength,
    draggable,
    dragRotation,
    dragRadius,
    returnToOrigin,
    disabled,
    onStateChange,
    onError
  };
  useEffect(() => {
    const root = rootRef.current,
      canvas = canvasRef.current,
      hit = hitRef.current;
    if (!root || !canvas || !hit) return;
    setStatus('loading');
    hit.disabled = true;
    hit.dataset.held = 'false';
    hit.setAttribute('aria-pressed', 'false');
    const initialRect = root.getBoundingClientRect();
    const initialWidth = Math.max(1, finite(width, 320));
    const initialHeight = Math.max(1, finite(height, 400));
    const initialScale = Math.min(
      1,
      Math.max(1, initialRect.width - 48) / initialWidth,
      Math.max(1, initialRect.height - 48) / initialHeight
    );
    root.style.setProperty('--pc-image-width', `${initialWidth * initialScale}px`);
    root.style.setProperty('--pc-image-height', `${initialHeight * initialScale}px`);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (error) {
      setStatus('error');
      options.current.onError?.(error instanceof Error ? error : new Error('WebGL is unavailable.'));
      return;
    }
    const paperWidth = Math.max(1, finite(width, 320));
    const paperHeight = Math.max(1, finite(height, 400));
    const aspect = paperHeight / paperWidth;
    const shortSide = Math.min(1, aspect);
    const resolution = Math.round(clamp(finite(detail, 64) / 4, 8, 24));
    const columns = Math.max(8, Math.round(resolution / Math.max(1, aspect)));
    const rows = Math.max(8, Math.round(resolution * Math.min(1, aspect)));
    const rng = randomSource(finite(seed, 7));
    const sharpness = clamp(finite(foldSharpness, 0.6), 0, 1);
    const foldTotal = Math.round(clamp(finite(foldCount, 6), 3, 16));
    const depth = clamp(finite(wrinkleDepth, 0.65), 0, 2);
    const count = (columns + 1) * (rows + 1);
    const original = new Float32Array(count * 3);
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const indices = [];
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= columns; col++) {
        const index = row * (columns + 1) + col;
        const u = (col + (col > 0 && col < columns ? (rng() - 0.5) * 0.5 : 0)) / columns;
        const v = (row + (row > 0 && row < rows ? (rng() - 0.5) * 0.5 : 0)) / rows;
        const x = u - 0.5,
          y = (v - 0.5) * aspect;
        original[index * 3] = x;
        original[index * 3 + 1] = y;
        uvs[index * 2] = u;
        uvs[index * 2 + 1] = v;
        if (col < columns && row < rows) {
          const a = index,
            b = index + 1,
            c = index + columns + 1,
            d = c + 1;
          if (rng() > 0.5) indices.push(a, b, d, a, d, c);
          else indices.push(a, b, c, b, d, c);
        }
      }
    }
    const pathKey = JSON.stringify([paperWidth, paperHeight, resolution, foldTotal, sharpness, depth, seed]);
    if (pathCache.current?.key !== pathKey) {
      pathCache.current = {
        key: pathKey,
        value: createPaperPath(original, indices, shortSide, foldTotal, sharpness, depth, finite(seed, 7))
      };
    }
    const paperPath = pathCache.current.value;
    const renderPositions = new Float32Array(indices.length * 3);
    const renderNormals = new Float32Array(indices.length * 3);
    const renderUvs = new Float32Array(indices.length * 2);
    const faceNormals = new Float32Array(indices.length);
    const incidentFaces = Array.from({ length: count }, () => []);
    for (let i = 0; i < indices.length; i++) {
      renderUvs[i * 2] = uvs[indices[i] * 2];
      renderUvs[i * 2 + 1] = uvs[indices[i] * 2 + 1];
      incidentFaces[indices[i]].push(Math.floor(i / 3) * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(renderPositions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('normal', new THREE.BufferAttribute(renderNormals, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(renderUvs, 2));
    const grainData = new Uint8Array(128 * 128 * 4);
    for (let i = 0; i < grainData.length; i += 4) {
      const value = 100 + Math.floor(rng() * 155);
      grainData[i] = grainData[i + 1] = grainData[i + 2] = value;
      grainData[i + 3] = 255;
    }
    const grain = new THREE.DataTexture(grainData, 128, 128);
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
    grain.repeat.set(5, 5 * aspect);
    grain.magFilter = THREE.LinearFilter;
    grain.minFilter = THREE.LinearFilter;
    grain.needsUpdate = true;
    const materialOptions = {
      roughness: clamp(finite(roughness, 0.92), 0, 1),
      metalness: 0,
      bumpMap: grain,
      bumpScale: clamp(finite(paperTexture, 0.08), 0, 1) * 0.32,
      alphaTest: 0.04,
      alphaToCoverage: true,
      flatShading: false
    };
    const frontMaterial = new THREE.MeshStandardMaterial({ ...materialOptions, side: THREE.FrontSide });
    const backMaterial = new THREE.MeshStandardMaterial({
      ...materialOptions,
      side: THREE.BackSide,
      color: backSrc ? '#ffffff' : paperColor
    });
    const lighting = { value: 0 };
    for (const material of [frontMaterial, backMaterial]) {
      material.onBeforeCompile = shader => {
        shader.uniforms.paperLighting = lighting;
        shader.fragmentShader = 'uniform float paperLighting;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
          #include <map_fragment>
          #ifdef USE_MAP
            if (vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0) discard;
            ${material === backMaterial && !backSrc ? 'diffuseColor.rgb = diffuse;' : ''}
          #endif
        `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <opaque_fragment>',
          `
          outgoingLight = mix(diffuseColor.rgb, outgoingLight, paperLighting);
          #include <opaque_fragment>
        `
        );
      };
      material.customProgramCacheKey = () => `paper-${material === backMaterial && !backSrc ? 'stock' : 'print'}`;
    }
    const depthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      alphaTest: 0.04,
      side: THREE.DoubleSide
    });
    depthMaterial.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        #ifdef USE_MAP
          if (vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0) discard;
        #endif
      `
      );
    };
    const sheet = new THREE.Group();
    const front = new THREE.Mesh(geometry, frontMaterial);
    const back = new THREE.Mesh(geometry, backMaterial);
    front.castShadow = shadow;
    front.receiveShadow = shadow;
    back.receiveShadow = shadow;
    front.customDepthMaterial = depthMaterial;
    sheet.add(front, back);
    const scene = new THREE.Scene();
    scene.add(sheet);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
    const ambient = new THREE.HemisphereLight(0xffffff, 0xa4a0b0, 1.35);
    scene.add(ambient);
    const light = new THREE.DirectionalLight(0xfffaf0, Math.max(0, finite(lightIntensity, 1.8)));
    light.castShadow = shadow;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.bias = -0.0002;
    light.shadow.normalBias = 0.6;
    light.shadow.radius = 3;
    scene.add(light, light.target);
    const floorGeometry = new THREE.PlaneGeometry(1, 1);
    const floorMaterial = new THREE.ShadowMaterial({
      opacity: clamp(finite(shadowOpacity, 0.08), 0, 1),
      depthWrite: false
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.visible = shadow;
    scene.add(floor);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = shadow;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const amount = spring(),
      memory = spring(),
      posX = spring(),
      posY = spring(),
      tiltX = spring(),
      tiltY = spring();
    const springs = [amount, memory, posX, posY, tiltX, tiltY];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const anchor = new THREE.Vector3(),
      world = new THREE.Vector3(),
      corner = new THREE.Vector3();
    const a = new THREE.Vector3(),
      b = new THREE.Vector3(),
      c = new THREE.Vector3();
    const weights = new THREE.Vector3(1, 0, 0);
    let gripIndices = [Math.floor(count / 2), 0, 0];
    let viewportWidth = 1,
      viewportHeight = 1,
      scale = paperWidth;
    let pointerX = 0,
      pointerY = 0,
      lastX = 0,
      lastY = 0,
      lastMove = 0;
    let speedX = 0,
      speedY = 0;
    let held = false,
      keyboard = false,
      pointerId = null;
    let peak = 0,
      disposed = false,
      ready = false,
      inView = true,
      contextLost = false;
    let frame = 0,
      lastTime = 0,
      state = 'flat';
    const textures = new Set();
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = media.matches;
    let previousAmount = -1,
      previousMemory = -1;
    const baseRotation = THREE.MathUtils.degToRad(finite(rotation, 0));
    function publish(next) {
      if (next === state) return;
      state = next;
      options.current.onStateChange?.(next);
    }
    function deform() {
      if (amount.value === previousAmount && memory.value === previousMemory) return;
      previousAmount = amount.value;
      previousMemory = memory.value;
      const fold = clamp(amount.value, 0, 1);
      const frame = fold * (paperPath.samples.length - 1);
      const lower = Math.floor(frame);
      const upper = Math.min(lower + 1, paperPath.samples.length - 1);
      const mix = frame - lower;
      const from = paperPath.samples[lower];
      const to = paperPath.samples[upper];
      for (let i = 0; i < positions.length; i++) {
        positions[i] = from[i] + (to[i] - from[i]) * mix;
        positions[i] += (paperPath.creased[i] - original[i]) * memory.value * (1 - fold);
      }
      for (let face = 0; face < indices.length; face += 3) {
        const a = indices[face] * 3,
          b = indices[face + 1] * 3,
          c = indices[face + 2] * 3;
        const bx = positions[b] - positions[a],
          by = positions[b + 1] - positions[a + 1],
          bz = positions[b + 2] - positions[a + 2];
        const cx = positions[c] - positions[a],
          cy = positions[c + 1] - positions[a + 1],
          cz = positions[c + 2] - positions[a + 2];
        const nx = by * cz - bz * cy,
          ny = bz * cx - bx * cz,
          nz = bx * cy - by * cx;
        const length = Math.hypot(nx, ny, nz) || 1;
        faceNormals[face] = nx / length;
        faceNormals[face + 1] = ny / length;
        faceNormals[face + 2] = nz / length;
      }
      for (let i = 0; i < indices.length; i++) {
        const source = indices[i] * 3;
        const face = Math.floor(i / 3) * 3;
        let nx = 0,
          ny = 0,
          nz = 0;
        for (const neighbor of incidentFaces[indices[i]]) {
          const dot =
            faceNormals[face] * faceNormals[neighbor] +
            faceNormals[face + 1] * faceNormals[neighbor + 1] +
            faceNormals[face + 2] * faceNormals[neighbor + 2];
          const weight = THREE.MathUtils.smoothstep(dot, 0.88 - (1 - sharpness) * 0.18, 0.98);
          nx += faceNormals[neighbor] * weight;
          ny += faceNormals[neighbor + 1] * weight;
          nz += faceNormals[neighbor + 2] * weight;
        }
        const length = Math.hypot(nx, ny, nz) || 1;
        renderPositions[i * 3] = positions[source];
        renderPositions[i * 3 + 1] = positions[source + 1];
        renderPositions[i * 3 + 2] = positions[source + 2];
        renderNormals[i * 3] = nx / length;
        renderNormals[i * 3 + 1] = ny / length;
        renderNormals[i * 3 + 2] = nz / length;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.normal.needsUpdate = true;
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      lighting.value = THREE.MathUtils.smoothstep(fold + memory.value, 0, 0.4);
    }
    function placeHitTarget() {
      const bounds = geometry.boundingBox;
      if (!bounds) return;
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (let i = 0; i < 8; i++) {
        corner.set(
          i & 1 ? bounds.max.x : bounds.min.x,
          i & 2 ? bounds.max.y : bounds.min.y,
          i & 4 ? bounds.max.z : bounds.min.z
        );
        corner.applyMatrix4(sheet.matrixWorld).project(camera);
        const x = ((corner.x + 1) * viewportWidth) / 2,
          y = ((1 - corner.y) * viewportHeight) / 2;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      hit.style.transform = `translate3d(${minX}px, ${minY}px, 0)`;
      hit.style.width = `${Math.max(24, maxX - minX)}px`;
      hit.style.height = `${Math.max(24, maxY - minY)}px`;
    }
    function setPointer(x, y) {
      pointer.set((x / viewportWidth) * 2 - 1, 1 - (y / viewportHeight) * 2);
      raycaster.setFromCamera(pointer, camera);
    }
    function render(time) {
      frame = 0;
      if (disposed || !ready || contextLost || !inView || document.hidden) return;
      const dt = lastTime ? Math.min(0.04, (time - lastTime) / 1000) : 1 / 60;
      lastTime = time;
      const opts = options.current;
      let moving = false;
      const duration = held ? finite(opts.crumpleDuration, 0.55) : finite(opts.releaseDuration, 0.4);
      for (const s of springs)
        moving = advance(s, dt, s === amount || s === memory ? duration : 0.42, reduceMotion || keyboard) || moving;
      peak = Math.max(peak, amount.value);
      deform();
      sheet.rotation.set(tiltX.value, tiltY.value, baseRotation);
      if (held && !keyboard && opts.draggable) {
        const attribute = geometry.attributes.position;
        anchor.set(0, 0, 0);
        for (let i = 0; i < 3; i++) {
          a.fromBufferAttribute(attribute, gripIndices[i]);
          anchor.addScaledVector(a, weights.getComponent(i));
        }
        anchor.multiplyScalar(scale).applyEuler(sheet.rotation);
        plane.constant = -anchor.z;
        setPointer(pointerX, pointerY);
        if (raycaster.ray.intersectPlane(plane, world)) {
          posX.value = posX.target = world.x - anchor.x;
          posY.value = posY.target = world.y - anchor.y;
          posX.velocity = posY.velocity = 0;
        }
      }
      sheet.position.set(posX.value, posY.value, 0);
      sheet.updateMatrixWorld(true);
      const shadowBounds = geometry.boundingBox;
      if (shadowBounds) {
        let backZ = Infinity;
        for (let i = 0; i < 8; i++) {
          corner.set(
            i & 1 ? shadowBounds.max.x : shadowBounds.min.x,
            i & 2 ? shadowBounds.max.y : shadowBounds.min.y,
            i & 4 ? shadowBounds.max.z : shadowBounds.min.z
          );
          corner.applyMatrix4(sheet.matrixWorld);
          backZ = Math.min(backZ, corner.z);
        }
        floor.position.z = backZ - scale * shortSide * 0.08;
      }
      renderer.render(scene, camera);
      placeHitTarget();
      if (moving) wake();
    }
    function wake() {
      if (!frame && !disposed && ready && inView && !document.hidden && !contextLost)
        frame = requestAnimationFrame(render);
    }
    function resize() {
      const rect = root.getBoundingClientRect();
      viewportWidth = Math.max(1, rect.width);
      viewportHeight = Math.max(1, rect.height);
      scale =
        paperWidth *
        Math.min(1, Math.max(1, viewportWidth - 48) / paperWidth, Math.max(1, viewportHeight - 48) / paperHeight);
      sheet.scale.setScalar(scale);
      camera.aspect = viewportWidth / viewportHeight;
      camera.position.z = viewportHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(viewportWidth, viewportHeight, false);
      const reach = Math.max(viewportWidth, viewportHeight);
      const angle = THREE.MathUtils.degToRad(finite(lightAngle, -35));
      light.position.set(Math.sin(angle) * reach, Math.cos(angle) * reach, reach * 4);
      light.shadow.camera.left = light.shadow.camera.bottom = -reach;
      light.shadow.camera.right = light.shadow.camera.top = reach;
      light.shadow.camera.near = 1;
      light.shadow.camera.far = reach * 6;
      light.shadow.camera.updateProjectionMatrix();
      floor.position.z = -scale * shortSide * 0.12;
      floor.scale.set(viewportWidth * 4, viewportHeight * 4, 1);
      root.style.setProperty('--pc-image-width', `${scale}px`);
      root.style.setProperty('--pc-image-height', `${scale * aspect}px`);
      if (!held) {
        const limitX = Math.max(0, (viewportWidth - scale) / 2 - 16);
        const limitY = Math.max(0, (viewportHeight - scale * aspect) / 2 - 16);
        posX.value = posX.target = clamp(posX.value, -limitX, limitX);
        posY.value = posY.target = clamp(posY.value, -limitY, limitY);
      }
      wake();
    }
    function finish(instant = false) {
      if (!held) return;
      const opts = options.current;
      held = false;
      hit.setAttribute('aria-pressed', 'false');
      hit.dataset.held = 'false';
      const captured = pointerId;
      pointerId = null;
      if (captured !== null && hit.hasPointerCapture(captured)) hit.releasePointerCapture(captured);
      if (opts.releaseBehavior === 'stay') {
        amount.target = amount.value;
        amount.velocity = 0;
      } else {
        amount.target = 0;
        memory.target =
          opts.releaseBehavior === 'creased'
            ? Math.max(memory.value, peak * clamp(finite(opts.creaseStrength, 0.18), 0, 1))
            : 0;
      }
      tiltX.target = tiltY.target = 0;
      if (opts.returnToOrigin && opts.releaseBehavior !== 'stay') {
        posX.target = posY.target = 0;
      } else {
        const bounds = geometry.boundingBox;
        const spanX = opts.releaseBehavior === 'stay' && bounds ? bounds.max.x - bounds.min.x : 1;
        const spanY = opts.releaseBehavior === 'stay' && bounds ? bounds.max.y - bounds.min.y : aspect;
        const halfWidth =
          ((Math.abs(Math.cos(baseRotation)) * spanX + Math.abs(Math.sin(baseRotation)) * spanY) * scale) / 2;
        const halfHeight =
          ((Math.abs(Math.sin(baseRotation)) * spanX + Math.abs(Math.cos(baseRotation)) * spanY) * scale) / 2;
        const limitX = Math.min(
          Math.max(0, finite(opts.dragRadius, 180)),
          Math.max(0, viewportWidth / 2 - halfWidth - 16)
        );
        const limitY = Math.min(
          Math.max(0, finite(opts.dragRadius, 180)),
          Math.max(0, viewportHeight / 2 - halfHeight - 16)
        );
        const coast = !reduceMotion && !keyboard && performance.now() - lastMove < 90 ? 0.06 : 0;
        posX.target = clamp(posX.value + speedX * coast, -limitX, limitX);
        posY.target = clamp(posY.value - speedY * coast, -limitY, limitY);
      }
      if (instant || keyboard || reduceMotion) for (const s of springs) advance(s, 0, 0, true);
      keyboard = false;
      publish(
        opts.releaseBehavior === 'stay' && amount.target > 0.001
          ? 'crumpled'
          : memory.target > 0.001
            ? 'creased'
            : 'flat'
      );
      wake();
    }
    function reset() {
      finish(true);
      for (const s of springs) s.target = s.value = s.velocity = 0;
      peak = 0;
      publish('flat');
      wake();
    }
    resetRef.current = reset;
    cancelRef.current = () => finish(true);
    function start() {
      held = true;
      peak = amount.value;
      amount.target = clamp(finite(options.current.crumpleAmount, 0.85), 0, 1);
      hit.setAttribute('aria-pressed', 'true');
      hit.dataset.held = 'true';
      publish('holding');
      wake();
    }
    function pointerDown(event) {
      if (!ready || options.current.disabled || held || event.button !== 0 || !event.isPrimary) return;
      const rect = root.getBoundingClientRect();
      pointerX = lastX = event.clientX - rect.left;
      pointerY = lastY = event.clientY - rect.top;
      setPointer(pointerX, pointerY);
      sheet.updateMatrixWorld(true);
      const intersection = raycaster.intersectObjects([front, back], false)[0];
      if (!intersection?.face) return;
      event.preventDefault();
      hit.dataset.pointer = 'true';
      hit.focus({ preventScroll: true });
      const { face } = intersection;
      gripIndices = [face.a, face.b, face.c];
      const attribute = geometry.attributes.position;
      a.fromBufferAttribute(attribute, face.a);
      b.fromBufferAttribute(attribute, face.b);
      c.fromBufferAttribute(attribute, face.c);
      THREE.Triangle.getBarycoord(sheet.worldToLocal(intersection.point.clone()), a, b, c, weights);
      keyboard = false;
      pointerId = event.pointerId;
      speedX = speedY = 0;
      lastMove = performance.now();
      hit.setPointerCapture(event.pointerId);
      start();
    }
    function pointerMove(event) {
      if (!held || event.pointerId !== pointerId || !options.current.draggable) return;
      const rect = root.getBoundingClientRect();
      const now = performance.now();
      const x = event.clientX - rect.left,
        y = event.clientY - rect.top;
      const dt = Math.max(0.008, (now - lastMove) / 1000);
      speedX = (x - lastX) / dt;
      speedY = (y - lastY) / dt;
      lastX = x;
      lastY = y;
      lastMove = now;
      pointerX = clamp(x, 12, viewportWidth - 12);
      pointerY = clamp(y, 12, viewportHeight - 12);
      const maxTilt = reduceMotion
        ? 0
        : THREE.MathUtils.degToRad(clamp(finite(options.current.dragRotation, 10), 0, 60));
      tiltX.target = clamp(speedY / 1800, -1, 1) * maxTilt;
      tiltY.target = clamp(speedX / 1800, -1, 1) * maxTilt;
      wake();
    }
    function pointerUp(event) {
      if (event.pointerId === pointerId) finish();
    }
    function pointerCancel(event) {
      if (event.pointerId === pointerId) finish(true);
    }
    function cancel() {
      finish(true);
    }
    function blur() {
      hit.dataset.pointer = 'false';
      cancel();
    }
    function keyDown(event) {
      if (options.current.disabled || !ready) return;
      hit.dataset.pointer = 'false';
      if (event.key === 'Escape') {
        event.preventDefault();
        reset();
        return;
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (event.repeat || held) return;
        keyboard = true;
        start();
        advance(amount, 0, 0, true);
        peak = Math.max(peak, amount.value);
      } else if (
        held &&
        keyboard &&
        options.current.draggable &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      ) {
        event.preventDefault();
        const step = event.shiftKey ? 30 : 12;
        const limit = Math.max(0, finite(options.current.dragRadius, 180));
        posX.target = clamp(
          posX.target + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0),
          -Math.min(limit, viewportWidth / 3),
          Math.min(limit, viewportWidth / 3)
        );
        posY.target = clamp(
          posY.target + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0),
          -Math.min(limit, viewportHeight / 3),
          Math.min(limit, viewportHeight / 3)
        );
        wake();
      }
    }
    function keyUp(event) {
      if (keyboard && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault();
        finish(true);
      }
    }
    function visibility() {
      lastTime = 0;
      if (document.hidden) cancel();
      else wake();
    }
    function motionChange() {
      reduceMotion = media.matches;
      if (reduceMotion) tiltX.target = tiltY.target = 0;
      wake();
    }
    function loseContext(event) {
      event.preventDefault();
      contextLost = true;
      cancel();
      hit.disabled = true;
      setStatus('error');
      options.current.onError?.(new Error('The WebGL context was lost.'));
    }
    function restoreContext() {
      contextLost = false;
      if (ready) {
        setStatus('ready');
        hit.disabled = options.current.disabled;
        wake();
      }
    }
    hit.addEventListener('pointerdown', pointerDown);
    hit.addEventListener('pointermove', pointerMove);
    hit.addEventListener('pointerup', pointerUp);
    hit.addEventListener('pointercancel', pointerCancel);
    hit.addEventListener('lostpointercapture', pointerUp);
    hit.addEventListener('keydown', keyDown);
    hit.addEventListener('keyup', keyUp);
    hit.addEventListener('blur', blur);
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', motionChange);
    canvas.addEventListener('webglcontextlost', loseContext);
    canvas.addEventListener('webglcontextrestored', restoreContext);
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    const intersectionObserver = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      lastTime = 0;
      if (!inView) cancel();
      else wake();
    });
    intersectionObserver.observe(root);
    deform();
    resize();
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    function load(url) {
      return new Promise((resolve, reject) => {
        loader.load(
          url,
          texture => {
            if (disposed) {
              texture.dispose();
              resolve(texture);
              return;
            }
            textures.add(texture);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            const image = texture.image;
            const imageAspect = image.width / image.height;
            const targetAspect = paperWidth / paperHeight;
            let rx = 1,
              ry = 1;
            if (imageFit === 'cover') {
              if (imageAspect > targetAspect) rx = targetAspect / imageAspect;
              else ry = imageAspect / targetAspect;
            } else {
              if (imageAspect > targetAspect) ry = imageAspect / targetAspect;
              else rx = targetAspect / imageAspect;
            }
            texture.repeat.set(rx, ry);
            texture.offset.set((1 - rx) / 2, (1 - ry) / 2);
            resolve(texture);
          },
          undefined,
          () => reject(new Error(`Unable to load paper image: ${url}. Remote images must allow CORS.`))
        );
      });
    }
    if (src) {
      Promise.all([load(src), backSrc ? load(backSrc) : Promise.resolve(null)])
        .then(([frontTexture, backTexture]) => {
          if (disposed) return;
          if (backTexture) {
            backTexture.repeat.x *= -1;
            backTexture.offset.x = 1 - backTexture.offset.x;
          }
          frontMaterial.map = frontTexture;
          backMaterial.map = backTexture || frontTexture;
          depthMaterial.map = frontTexture;
          frontMaterial.needsUpdate = backMaterial.needsUpdate = depthMaterial.needsUpdate = true;
          ready = true;
          setStatus('ready');
          hit.disabled = options.current.disabled;
          wake();
        })
        .catch(error => {
          if (disposed) return;
          setStatus('error');
          options.current.onError?.(error);
        });
    } else {
      setStatus('error');
      options.current.onError?.(new Error('PaperCrumple requires an image src.'));
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      if (pointerId !== null && hit.hasPointerCapture(pointerId)) hit.releasePointerCapture(pointerId);
      resetRef.current = cancelRef.current = null;
      observer.disconnect();
      intersectionObserver.disconnect();
      hit.removeEventListener('pointerdown', pointerDown);
      hit.removeEventListener('pointermove', pointerMove);
      hit.removeEventListener('pointerup', pointerUp);
      hit.removeEventListener('pointercancel', pointerCancel);
      hit.removeEventListener('lostpointercapture', pointerUp);
      hit.removeEventListener('keydown', keyDown);
      hit.removeEventListener('keyup', keyUp);
      hit.removeEventListener('blur', blur);
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', visibility);
      media.removeEventListener('change', motionChange);
      canvas.removeEventListener('webglcontextlost', loseContext);
      canvas.removeEventListener('webglcontextrestored', restoreContext);
      geometry.dispose();
      floorGeometry.dispose();
      frontMaterial.dispose();
      backMaterial.dispose();
      depthMaterial.dispose();
      floorMaterial.dispose();
      grain.dispose();
      textures.forEach(texture => texture.dispose());
      light.shadow.dispose();
      renderer.dispose();
    };
  }, [
    src,
    backSrc,
    width,
    height,
    imageFit,
    foldCount,
    foldSharpness,
    wrinkleDepth,
    paperColor,
    roughness,
    paperTexture,
    lightIntensity,
    lightAngle,
    shadow,
    shadowOpacity,
    rotation,
    seed,
    detail
  ]);
  useEffect(() => {
    resetRef.current?.();
  }, [resetKey]);
  useEffect(() => {
    if (disabled) cancelRef.current?.();
  }, [disabled]);
  const shadowFilter = shadow
    ? `drop-shadow(0 6px 10px rgb(0 0 0 / ${clamp(finite(shadowOpacity, 0.08), 0, 1)}))`
    : undefined;
  return (
    <div
      ref={rootRef}
      className={`paper-crumple ${className}`}
      style={{ height: sceneHeight, ...style }}
      data-status={status}
    >
      <canvas
        ref={canvasRef}
        className="paper-crumple-canvas"
        aria-hidden="true"
        style={{ visibility: status === 'ready' ? 'visible' : 'hidden', filter: shadowFilter }}
      />
      {status !== 'ready' && (
        <img
          className="paper-crumple-fallback"
          src={src || undefined}
          alt={alt}
          draggable={false}
          style={{
            objectFit: imageFit,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            filter: shadowFilter
          }}
        />
      )}
      <button
        ref={hitRef}
        type="button"
        className="paper-crumple-hit"
        disabled={disabled || status !== 'ready'}
        aria-label={`${alt}. Hold to crumple and drag. Keyboard: hold Space or Enter, arrow keys to move, Escape to reset.`}
        aria-pressed="false"
        style={{ visibility: status === 'ready' ? 'visible' : 'hidden' }}
      />
      <span className="paper-crumple-focus" aria-hidden="true" />
      <span className="paper-crumple-sr" role="status">
        {status === 'loading'
          ? 'Loading interactive paper.'
          : status === 'error'
            ? 'Interactive paper unavailable. Showing the original image.'
            : ''}
      </span>
    </div>
  );
};
export default PaperCrumple;
