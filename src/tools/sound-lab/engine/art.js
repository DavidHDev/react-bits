import { ART_FRAG, INK, createProgram } from './velvet';

const SAMPLES = 24;

let shared;

const setup = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    preserveDrawingBuffer: true
  });
  if (!gl) return null;
  const program = createProgram(gl, ART_FRAG);
  if (!program) return null;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  const names = ['uResolution', 'uLight', 'uInk', 'uTint', 'uSeed', 'uEnvelope'];
  const uniforms = Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program, name)]));
  return { canvas, gl, uniforms };
};

const seedOf = id => {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 997) / 997;
};

const envelopeOf = wave => {
  const raw = new Float32Array(SAMPLES);
  const per = wave.length / SAMPLES;
  for (let i = 0; i < SAMPLES; i += 1) {
    let max = 0;
    for (let j = Math.floor(i * per); j < Math.floor((i + 1) * per); j += 1) max = Math.max(max, wave[j]);
    raw[i] = max;
  }
  const out = new Float32Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i += 1) {
    let sum = 0;
    let weight = 0;
    for (let k = -3; k <= 3; k += 1) {
      const j = Math.min(SAMPLES - 1, Math.max(0, i + k));
      const w = Math.exp(-(k * k) / 4);
      sum += raw[j] * w;
      weight += w;
    }
    out[i] = 0.15 + 0.85 * (sum / weight);
  }
  return out;
};

export function paintArt(target, sound, info, light) {
  if (shared === undefined) shared = setup();
  if (!shared || !info?.wave) return false;
  const { canvas, gl, uniforms } = shared;
  const { width, height } = target;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const palette = light ? INK.light : INK.dark;
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(uniforms.uResolution, width, height);
  gl.uniform1f(uniforms.uLight, light ? 1 : 0);
  gl.uniform3f(uniforms.uInk, ...palette.ink);
  gl.uniform3f(uniforms.uTint, ...palette.tint);
  gl.uniform1f(uniforms.uSeed, seedOf(sound.id));
  gl.uniform1fv(uniforms.uEnvelope, envelopeOf(info.wave));
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  const context = target.getContext('2d');
  context.clearRect(0, 0, width, height);
  context.drawImage(canvas, 0, 0);
  return true;
}
