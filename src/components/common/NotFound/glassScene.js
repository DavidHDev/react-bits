import {
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  LinearFilter,
  Mesh,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  Vector4,
  WebGLRenderer
} from 'three';
import { PANE_HEIGHT, PANE_WIDTH, SHARDS } from './shardGeometry';
import { createShardGeometry } from './glassGeometry';
import { createShardMotion, stepShardMotion } from './shardMotion';
import { createShardIntro, applyShardIntro } from './shardIntro';

const ELECTRIC_DEPTH = 180;
// Sample the actual 404 outline so selected faces catch a live stroke at rest.
const SIGN_TARGETS = [
  [162, 243],
  [353, 660],
  [588, 530],
  [656, 372],
  [959, 0],
  [1261, 372],
  [1471, 243],
  [1662, 660]
];

// The front hemisphere stays dim so the faces remain clear. Grazing cut walls
// reflect the rear hemisphere; broad rear cards reveal their thickness while
// the smaller, brighter strips give them moving white catchlights.
const createEnvironment = (renderer, light) => {
  const studio = new Scene();
  studio.background = new Color().setRGB(0.035, 0.035, 0.035);
  const cards = [];
  // The softbox has a narrow luminous core and gradual falloff across both
  // axes. Its reflection changes across a bevel instead of filling it with a
  // uniform gray band. A separate broad reflector preserves edge visibility.
  const softboxCanvas = document.createElement('canvas');
  softboxCanvas.width = 128;
  softboxCanvas.height = 256;
  const softboxContext = softboxCanvas.getContext('2d');
  const softboxPixels = softboxContext.createImageData(128, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 128; x++) {
      const across = (x / 127 - 0.5) * 2;
      const along = (y / 255 - 0.5) * 2;
      const radiance = Math.exp(-3.4 * across * across) * Math.exp(-Math.pow(along / 0.94, 8));
      const offset = (y * 128 + x) * 4;
      const value = Math.round(255 * radiance);
      softboxPixels.data.set([value, value, value, 255], offset);
    }
  }
  softboxContext.putImageData(softboxPixels, 0, 0);
  const softboxMap = new CanvasTexture(softboxCanvas);
  const reflectorCanvas = document.createElement('canvas');
  reflectorCanvas.width = 256;
  reflectorCanvas.height = 256;
  const reflectorContext = reflectorCanvas.getContext('2d');
  const reflectorGradient = reflectorContext.createLinearGradient(0, 240, 230, 15);
  reflectorGradient.addColorStop(0, '#464646');
  reflectorGradient.addColorStop(0.35, '#8b8b8b');
  reflectorGradient.addColorStop(0.68, '#ededed');
  reflectorGradient.addColorStop(1, '#939393');
  reflectorContext.fillStyle = reflectorGradient;
  reflectorContext.fillRect(0, 0, 256, 256);
  const reflectorMap = new CanvasTexture(reflectorCanvas);
  const lightCard = (position, width, height, intensity, roll = 0, map = softboxMap) => {
    const card = new Mesh(
      new PlaneGeometry(width, height),
      new MeshLambertMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: intensity, emissiveMap: map })
    );
    card.position.set(...position);
    card.lookAt(0, 0, 0);
    card.rotateZ(roll);
    studio.add(card);
    cards.push(card);
  };
  lightCard([0, 0, -8], 19, 15, light ? 0.2 : 1.6, 0, reflectorMap);
  lightCard([-5.5, 1, -5], 1.5, 10, 10, -0.2);
  lightCard([5.5, -2, -5], 1.2, 11, 14, 0.25);
  lightCard([-6, 2, 1], 4, 12, 0.35, -0.1);
  lightCard([6, 1, 1.5], 4, 12, 0.45, 0.2);
  lightCard([-5.8, 2.2, 1.5], 0.55, 9, 8, -0.1);
  lightCard([5.8, 1.2, 2], 0.5, 9, 11, 0.2);
  lightCard([-5, 5, 4], 5.5, 1.8, 0.65, -0.3);
  lightCard([-4, -5, 1], 5, 0.65, 8, -0.5);
  const generator = new PMREMGenerator(renderer);
  const environment = generator.fromScene(studio, 0, 0.1, 30, { size: 512 });
  cards.forEach(card => {
    card.geometry.dispose();
    card.material.dispose();
  });
  softboxMap.dispose();
  reflectorMap.dispose();
  generator.dispose();
  return environment;
};

// Finite studio cards introduce parallax across a single flat shard. The
// environment map alone lives at infinity, so a flat face samples nearly one
// constant color even when it should carry a soft reflected band.
const studioReflection = /* glsl */ `
  float glassStudioCard(vec3 origin, vec3 direction, float z, vec2 center, vec2 halfSize, float slope) {
    float rayZ = direction.z >= 0.0 ? max(direction.z, 0.002) : min(direction.z, -0.002);
    float distanceToCard = (z - origin.z) / rayZ;
    vec2 hit = origin.xy + direction.xy * distanceToCard - center;
    hit.x += hit.y * slope;
    vec2 uv = hit / halfSize;
    float crossFade = exp(-2.8 * uv.x * uv.x);
    float endFade = 1.0 - smoothstep(0.65, 1.0, abs(uv.y));
    return crossFade * endFade * step(0.0, distanceToCard) * step(0.002, abs(direction.z));
  }
`;

// Both the studio and the live electric canvas use the reflected view ray,
// rather than an outline tied to the shard's silhouette.
const reflectedElectricity = /* glsl */ `
  vec3 glassNormal = inverseTransformDirection(normal, viewMatrix);
  vec3 eye = normalize(cameraPosition - vWorldPosition);
  vec3 ray = reflect(-eye, glassNormal);
  float distanceToLight = (${ELECTRIC_DEPTH.toFixed(1)} - vWorldPosition.z) / max(ray.z, 0.001);
  vec2 hit = vWorldPosition.xy + ray.xy * distanceToLight;
  vec2 reflectedUV = (hit - electricBounds.xy) / electricBounds.zw + 0.5;
  float inside = step(0.0, reflectedUV.x) * step(reflectedUV.x, 1.0)
    * step(0.0, reflectedUV.y) * step(reflectedUV.y, 1.0) * step(0.0, ray.z);
  vec4 center = texture2D(electricFrame, reflectedUV);
  vec3 electric = center.rgb * center.a;
  float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(eye, glassNormal), 0.0), 5.0);
  float studio =
    0.7 * glassStudioCard(vWorldPosition, ray, 240.0, vec2(-260.0, 20.0), vec2(85.0, 560.0), -0.18) +
    0.45 * glassStudioCard(vWorldPosition, ray, 240.0, vec2(290.0, -10.0), vec2(70.0, 500.0), 0.22) +
    0.5 * glassStudioCard(vWorldPosition, ray, -180.0, vec2(-30.0, 0.0), vec2(410.0, 560.0), 0.12) +
    4.0 * glassStudioCard(vWorldPosition, ray, -180.0, vec2(-270.0, 20.0), vec2(32.0, 520.0), -0.25) +
    5.0 * glassStudioCard(vWorldPosition, ray, -180.0, vec2(250.0, -20.0), vec2(24.0, 520.0), 0.2);
  // On white, a dark studio flag supplies contrast; on dark, the same finite
  // reflector is luminous. Fresnel keeps nearly face-on glass transparent.
  outgoingLight *= 1.0 - electricInk * fresnel * min(studio, 1.0) * 0.65;
  outgoingLight += vec3(studio * fresnel * (1.0 - electricInk));
  float energy = center.a;
  outgoingLight += electric * fresnel * inside * 2.6 * (1.0 - electricInk);
  outgoingLight = mix(outgoingLight, electric / max(energy, 0.001), electricInk * inside * energy * 0.32);
  // A long Gaussian shoulder protects the text without a visible mask edge.
  vec2 centerDistance = (vWorldPosition.xy - vec2(0.0, -12.0)) / 155.0;
  float centerVisibility = 1.0 - exp(-dot(centerDistance, centerDistance) * 1.4);
  outgoingLight = mix(glassBackdrop, outgoingLight, vGlassVisibility * centerVisibility);
`;

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
  const environment = createEnvironment(renderer, light);
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
  const glassIntroTime = { value: 0 };
  const material = new MeshPhysicalMaterial({
    envMap: environment.texture,
    color: '#ffffff',
    metalness: 0,
    roughness: 0.012,
    transmission: 1,
    thickness: 2.6,
    ior: 1.5,
    dispersion: 0,
    attenuationColor: '#ffffff',
    attenuationDistance: Infinity,
    envMapIntensity: light ? 0.85 : 1,
    specularIntensity: 1
  });
  const shadeGlass = shader => {
    shader.uniforms.electricFrame = { value: electricFrame };
    shader.uniforms.electricBounds = { value: electricBounds };
    shader.uniforms.electricInk = { value: light ? 1 : 0 };
    shader.uniforms.glassBackdrop = { value: scene.background };
    shader.uniforms.glassIntroTime = glassIntroTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float glassVisibility;\nattribute vec2 glassEntrance;\nuniform float glassIntroTime;\nvarying float vGlassVisibility;'
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float arrival = clamp((glassIntroTime - glassEntrance.x) / glassEntrance.y, 0.0, 1.0);
        vGlassVisibility = glassVisibility * smoothstep(0.0, 0.6, arrival);`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform sampler2D electricFrame;\nuniform vec4 electricBounds;\nuniform float electricInk;\nuniform vec3 glassBackdrop;\nvarying float vGlassVisibility;\n${studioReflection}`
      )
      .replace('#include <opaque_fragment>', `${reflectedElectricity}\n#include <opaque_fragment>`);
  };
  material.onBeforeCompile = shadeGlass;
  // Light travels farther through a fractured cut than through a flat face.
  // Keep this absorption confined to the actual extruded cut and bevel.
  const cutMaterial = material.clone();
  cutMaterial.thickness = 5;
  cutMaterial.attenuationColor = new Color('#989898');
  cutMaterial.attenuationDistance = 9;
  cutMaterial.envMapIntensity = light ? 0.55 : 3.5;
  cutMaterial.onBeforeCompile = shadeGlass;
  const shards = SHARDS.map((shard, index) => {
    const geometry = createShardGeometry(shard);
    const intro = createShardIntro(shard, index);
    const entrance = new Float32Array(geometry.attributes.position.count * 2);
    for (let i = 0; i < entrance.length; i += 2) {
      entrance[i] = intro.delay;
      entrance[i + 1] = intro.duration;
    }
    geometry.setAttribute('glassEntrance', new Float32BufferAttribute(entrance, 2));
    // Fade whole outer fragments at different rates; no shared circular crop.
    const variation = Math.sin(index * 2.37) * 0.065 + Math.cos(index * 1.71) * 0.035;
    const visibility = Math.exp(-Math.pow(Math.max(0, shard.fadeDistance + variation) / 0.96, 4));
    geometry.setAttribute(
      'glassVisibility',
      new Float32BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(visibility), 1)
    );
    const mesh = new Mesh(geometry, [material, cutMaterial]);
    scene.add(mesh);
    const target = index < 12 && index % 7 !== 0 ? SIGN_TARGETS[index % SIGN_TARGETS.length] : null;
    return { mesh, motion: createShardMotion(shard, index), target, intro };
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
      // Leave room for drifting geometry; each outer fragment fades separately.
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
        shards.forEach(({ motion, target }) => {
          if (!target) return;
          const origin = new Vector3(motion.x, motion.y, motion.z);
          const towardSign = new Vector3(
            electricBounds.x + (target[0] / 1897 - 0.5) * 0.56 * electricBounds.z,
            electricBounds.y + (0.5 - target[1] / 742) * 0.56 * electricBounds.w,
            ELECTRIC_DEPTH
          )
            .sub(origin)
            .normalize();
          const normal = camera.position.clone().sub(origin).normalize().add(towardSign).normalize();
          motion.rx = Math.atan2(-normal.y, normal.z);
          motion.ry = Math.asin(normal.x);
        });
      }
    },
    render(time, pointer, dt, introTime = 3) {
      glassIntroTime.value = introTime;
      shards.forEach(shard => {
        const pose = stepShardMotion(shard.motion, time, pointer, dt);
        applyShardIntro(pose, shard.intro, introTime);
        shard.mesh.position.set(pose[0], pose[1], pose[2]);
        shard.mesh.rotation.set(pose[3], pose[4], pose[5]);
      });
      renderer.render(scene, camera);
    },
    dispose() {
      shards.forEach(({ mesh }) => {
        mesh.geometry.dispose();
      });
      material.dispose();
      cutMaterial.dispose();
      electricFrame.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
};
