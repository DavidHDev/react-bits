import {
  CanvasTexture,
  Color,
  EquirectangularReflectionMapping,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector4,
  WebGLRenderer
} from 'three';
import { PANE_HEIGHT, PANE_WIDTH, SHARDS } from './shardGeometry';
import { createShardGeometry } from './glassGeometry';
import { createShardMotion, stepShardMotion } from './shardMotion';

// Broad studio softboxes give clear glass something to reflect. A narrow strip
// catches the fractured bevels as they turn, without drawing artificial outlines.
const createEnvironment = renderer => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  context.fillStyle = '#141218';
  context.fillRect(0, 0, 1024, 512);
  const softbox = (x, y, rx, ry, color) => {
    context.save();
    context.translate(x, y);
    context.scale(rx, ry);
    const gradient = context.createRadialGradient(0, 0, 0.08, 0, 0, 1);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.4, color);
    gradient.addColorStop(1, 'rgba(25, 22, 32, 0)');
    context.fillStyle = gradient;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  };
  softbox(240, 160, 150, 100, '#a4a0ae');
  softbox(740, 260, 70, 200, '#e9e6f2');
  softbox(520, 420, 250, 80, '#50435d');
  const texture = new CanvasTexture(canvas);
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = SRGBColorSpace;
  const generator = new PMREMGenerator(renderer);
  const environment = generator.fromEquirectangular(texture);
  texture.dispose();
  generator.dispose();
  return environment;
};

// A reflected view ray intersects the live electric canvas above the glass.
// Every tilted fragment catches a different part, with dielectric Fresnel.
const reflectedElectricity = /* glsl */ `
  vec3 glassNormal = inverseTransformDirection(normal, viewMatrix);
  vec3 eye = normalize(cameraPosition - vWorldPosition);
  vec3 ray = reflect(-eye, glassNormal);
  float distanceToLight = (310.0 - vWorldPosition.z) / max(ray.z, 0.001);
  vec2 hit = vWorldPosition.xy + ray.xy * distanceToLight;
  vec2 reflectedUV = (hit - electricBounds.xy) / electricBounds.zw + 0.5;
  float inside = step(0.0, reflectedUV.x) * step(reflectedUV.x, 1.0)
    * step(0.0, reflectedUV.y) * step(reflectedUV.y, 1.0) * step(0.0, ray.z);
  vec4 center = texture2D(electricFrame, reflectedUV);
  vec4 left = texture2D(electricFrame, reflectedUV + vec2(0.0015, 0.0));
  vec4 right = texture2D(electricFrame, reflectedUV - vec2(0.0015, 0.0));
  vec3 electric = center.rgb * center.a + (left.rgb * left.a + right.rgb * right.a) * 0.3;
  float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(eye, glassNormal), 0.0), 5.0);
  float energy = center.a + (left.a + right.a) * 0.3;
  outgoingLight += electric * fresnel * inside * 0.65 * (1.0 - electricInk);
  outgoingLight = mix(outgoingLight, electric / max(energy, 0.001), electricInk * inside * energy * 0.08);
`;

// Small preblurred silhouettes provide the broad, faint contact shadows of
// suspended clear glass without hard opaque shadow-map silhouettes.
const createShadow = (shard, light) => {
  const padding = 35;
  const width = shard.width + padding * 2;
  const height = shard.height + padding * 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * 1.5);
  canvas.height = Math.ceil(height * 1.5);
  const context = canvas.getContext('2d');
  context.scale(1.5, 1.5);
  context.filter = 'blur(10px)';
  context.fillStyle = '#000';
  context.beginPath();
  shard.vertices.forEach((point, index) => {
    context[index ? 'lineTo' : 'moveTo'](point.x - shard.x + padding, point.y - shard.y + padding);
  });
  context.closePath();
  context.fill();
  const texture = new CanvasTexture(canvas);
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: light ? 0.045 : 0.16,
    depthWrite: false
  });
  return new Mesh(new PlaneGeometry(width, height), material);
};

export const createGlassScene = (container, theme) => {
  let renderer;
  try {
    renderer = new WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' });
  } catch {
    // The decoration is optional; navigation and the page message stay intact.
    return null;
  }
  const light = theme === 'light';
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.transmissionResolutionScale = 0.75;
  renderer.setClearColor(light ? '#ffffff' : '#120f17', 1);
  renderer.domElement.className = 'nf-glass-canvas';
  container.appendChild(renderer.domElement);
  const scene = new Scene();
  scene.background = new Color(light ? '#ffffff' : '#120f17');
  const environment = createEnvironment(renderer);
  scene.environment = environment.texture;

  const camera = new PerspectiveCamera(24, 1, 10, 2400);
  camera.position.z = 1400;
  const source = document.createElement('canvas');
  source.width = 640;
  source.height = 256;
  const context = source.getContext('2d');
  const electricFrame = new CanvasTexture(source);
  electricFrame.colorSpace = SRGBColorSpace;
  electricFrame.minFilter = LinearFilter;
  electricFrame.magFilter = LinearFilter;
  electricFrame.generateMipmaps = false;
  const electricBounds = new Vector4(0, 70, 520, 205);
  const material = new MeshPhysicalMaterial({
    envMap: environment.texture,
    color: light ? '#ffffff' : '#e2ddea',
    metalness: 0,
    roughness: 0.065,
    transmission: 1,
    thickness: 3.2,
    ior: 1.5,
    dispersion: 0.12,
    attenuationColor: '#ccc3de',
    attenuationDistance: 120,
    envMapIntensity: light ? 0.85 : 0.28,
    specularIntensity: 1
  });
  material.onBeforeCompile = shader => {
    shader.uniforms.electricFrame = { value: electricFrame };
    shader.uniforms.electricBounds = { value: electricBounds };
    shader.uniforms.electricInk = { value: light ? 1 : 0 };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform sampler2D electricFrame;\nuniform vec4 electricBounds;\nuniform float electricInk;'
      )
      .replace('#include <opaque_fragment>', `${reflectedElectricity}\n#include <opaque_fragment>`);
  };
  const edgeMaterial = material.clone();
  edgeMaterial.roughness = 0.085;
  edgeMaterial.envMapIntensity = light ? 1.05 : 1.65;
  edgeMaterial.onBeforeCompile = material.onBeforeCompile;

  const shards = SHARDS.map((shard, index) => {
    const geometry = createShardGeometry(shard);
    const mesh = new Mesh(geometry, [material, edgeMaterial]);
    scene.add(mesh);
    const shadow = createShadow(shard, light);
    scene.add(shadow);
    return { mesh, shadow, motion: createShardMotion(shard, index) };
  });

  let previousWidth = 0;
  let previousHeight = 0;
  let previousDpr = 0;

  return {
    capture(canvas) {
      // Copy synchronously before the browser clears OGL's drawing buffer.
      context.clearRect(0, 0, source.width, source.height);
      context.drawImage(canvas, 0, 0, source.width, source.height);
      electricFrame.needsUpdate = true;
    },
    resize(rect, stage) {
      const scale = rect.width / PANE_WIDTH;
      // Canvas padding, not an outer fade or a rectangular shard boundary.
      const width = rect.width + 120 * scale;
      const height = rect.height + 120 * scale;
      // Supersample thin glass highlights even on a standard-density display.
      const dpr = Math.min(2, Math.sqrt(2200000 / (width * height)));
      if (width !== previousWidth || height !== previousHeight || dpr !== previousDpr) {
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height);
        previousWidth = width;
        previousHeight = height;
        previousDpr = dpr;
      }
      camera.aspect = width / height;
      camera.fov = (2 * Math.atan((PANE_HEIGHT + 120) / (2 * camera.position.z)) * 180) / Math.PI;
      camera.updateProjectionMatrix();
      if (stage) {
        electricBounds.set(
          (stage.left + stage.width / 2 - rect.left - rect.width / 2) / scale,
          -(stage.top + stage.height / 2 - rect.top - rect.height / 2) / scale,
          stage.width / scale,
          stage.height / scale
        );
      }
    },
    render(time, pointer, dt) {
      shards.forEach(shard => {
        const pose = stepShardMotion(shard.motion, time, pointer, dt);
        shard.mesh.position.set(pose[0], pose[1], pose[2]);
        shard.mesh.rotation.set(pose[3], pose[4], pose[5]);
        shard.shadow.position.set(shard.mesh.position.x + 3, shard.mesh.position.y - 7, -24);
        shard.shadow.rotation.z = shard.mesh.rotation.z;
        shard.shadow.scale.set(Math.cos(shard.mesh.rotation.y), Math.cos(shard.mesh.rotation.x), 1);
      });
      renderer.render(scene, camera);
    },
    dispose() {
      shards.forEach(({ mesh, shadow }) => {
        mesh.geometry.dispose();
        shadow.geometry.dispose();
        shadow.material.map.dispose();
        shadow.material.dispose();
      });
      material.dispose();
      edgeMaterial.dispose();
      electricFrame.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
};
