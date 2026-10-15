import { HEADER, VERTEX } from './glsl';

const MIX_SHADER = `
uniform sampler2D uBase;
uniform float uMix;
uniform float uBlend;

vec3 overlayBlend(vec3 b, vec3 s) {
  return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b));
}

vec3 softLight(vec3 b, vec3 s) {
  vec3 d = mix(sqrt(b), ((16.0 * b - 12.0) * b + 4.0) * b, step(b, vec3(0.25)));
  return mix(b - (1.0 - 2.0 * s) * b * (1.0 - b), b + (2.0 * s - 1.0) * (d - b), step(0.5, s));
}

vec3 blendWith(vec3 b, vec3 s, float mode) {
  if (mode < 0.5) return s;
  if (mode < 1.5) return 1.0 - (1.0 - b) * (1.0 - s);
  if (mode < 2.5) return b * s;
  if (mode < 3.5) return overlayBlend(b, s);
  if (mode < 4.5) return softLight(b, s);
  if (mode < 5.5) return min(b + s, 1.0);
  if (mode < 6.5) return abs(b - s);
  if (mode < 7.5) return max(b, s);
  return min(b, s);
}

void main() {
  vec3 base = texture(uBase, vUv).rgb;
  vec3 layer = texture(uInput, vUv).rgb;
  outColor = vec4(mix(base, blendWith(base, layer, uBlend), uMix), 1.0);
}`;

const BLIT_SHADER = `
uniform sampler2D uOriginal;
uniform float uSplit;
uniform float uStrength;
void main() {
  vec3 color = texture(uInput, vUv).rgb;
  if (uStrength < 1.0) color = mix(texture(uOriginal, vUv).rgb, color, uStrength);
  if (uSplit >= 0.0 && vUv.x < uSplit) color = texture(uOriginal, vUv).rgb;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

const RESAMPLE_SHADER = `
uniform float uMirror;
uniform float uTurns;
void main() {
  vec2 d = vec2(mix(vUv.x, 1.0 - vUv.x, uMirror), vUv.y);
  vec2 uv = d;
  if (uTurns > 2.5) uv = vec2(d.y, 1.0 - d.x);
  else if (uTurns > 1.5) uv = 1.0 - d;
  else if (uTurns > 0.5) uv = vec2(1.0 - d.y, d.x);
  outColor = vec4(texture(uInput, uv).rgb, 1.0);
}`;

export const BLEND_MODES = [
  'normal',
  'screen',
  'multiply',
  'overlay',
  'soft-light',
  'add',
  'difference',
  'lighten',
  'darken'
];

const LINE_OFFSET = HEADER.split('\n').length;

export class Engine {
  constructor(canvas, { preserve = false } = {}) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: preserve,
      powerPreference: 'high-performance'
    });
    if (!gl) throw new Error('WebGL 2 is not available in this browser.');
    this.canvas = canvas;
    this.gl = gl;
    this.floatTargets = Boolean(gl.getExtension('EXT_color_buffer_float'));
    gl.getExtension('OES_texture_float_linear');
    this.programs = new Map();
    this.free = [];
    this.textures = new Map();
    this.source = null;
    this.lost = false;
    this.layerState = new Map();

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.buffer = buffer;

    this.vertex = this.compile(gl.VERTEX_SHADER, VERTEX, 'vertex');

    canvas.addEventListener('webglcontextlost', this.onLost);
  }

  onLost = event => {
    event.preventDefault();
    this.lost = true;
  };

  compile(type, source, name) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) || '';
      const fixed = log.replace(/ERROR: 0:(\d+)/g, (_, line) => `ERROR: ${name}:${Number(line) - LINE_OFFSET}`);
      gl.deleteShader(shader);
      throw new Error(`Shader "${name}" failed to compile.\n${fixed}`);
    }
    return shader;
  }

  program(name, body) {
    const cached = this.programs.get(name);
    if (cached) return cached;
    const gl = this.gl;
    const fragment = this.compile(gl.FRAGMENT_SHADER, `${HEADER}\n${body}`, name);
    const program = gl.createProgram();
    gl.attachShader(program, this.vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program "${name}" failed to link: ${gl.getProgramInfoLog(program)}`);
    }
    const uniforms = new Map();
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let index = 0; index < count; index += 1) {
      const info = gl.getActiveUniform(program, index);
      const key = info.name.replace(/\[0\]$/, '');
      uniforms.set(key, { location: gl.getUniformLocation(program, info.name), type: info.type, size: info.size });
    }
    const entry = { program, uniforms };
    this.programs.set(name, entry);
    return entry;
  }

  createTexture(width, height, { float = false, filter = 'linear', wrap = 'clamp', data = null } = {}) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const useFloat = float && this.floatTargets;
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      useFloat ? gl.RGBA16F : gl.RGBA8,
      width,
      height,
      0,
      gl.RGBA,
      useFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
      data
    );
    const mode = filter === 'nearest' ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mode);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mode);
    const repeat = wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat);
    return texture;
  }

  target(width, height, { float = true, filter = 'linear' } = {}) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const index = this.free.findIndex(
      item => item.width === w && item.height === h && item.float === float && item.filter === filter
    );
    if (index >= 0) return this.free.splice(index, 1)[0];
    const gl = this.gl;
    const texture = this.createTexture(w, h, { float, filter });
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, fbo, width: w, height: h, float, filter, mipmapped: false };
  }

  release(target) {
    if (!target || !target.fbo || this.free.includes(target)) return;
    if (target.mipmapped) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, target.filter === 'nearest' ? gl.NEAREST : gl.LINEAR);
    }
    target.mipmapped = false;
    this.free.push(target);
    if (this.free.length > 24) this.disposeTarget(this.free.shift());
  }

  disposeTarget(target) {
    const gl = this.gl;
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.fbo);
  }

  mipmap(target) {
    if (!target || target.mipmapped) return target;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    target.mipmapped = true;
    return target;
  }

  setSource(media, width, height) {
    const gl = this.gl;
    if (!this.source || this.source.width !== width || this.source.height !== height) {
      if (this.source) gl.deleteTexture(this.source.texture);
      this.source = { texture: gl.createTexture(), width, height, mipmapped: false };
      gl.bindTexture(gl.TEXTURE_2D, this.source.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.source.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, media);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    this.source.mipmapped = true;
  }

  shared(name, create) {
    if (!this.textures.has(name)) this.textures.set(name, create(this));
    return this.textures.get(name);
  }

  draw(entry, { target = null, width, height, uniforms = {}, textures = {} }) {
    const gl = this.gl;
    gl.useProgram(entry.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.width : width, target ? target.height : height);
    let unit = 0;
    Object.entries(textures).forEach(([name, value]) => {
      const info = entry.uniforms.get(name);
      if (!info || !value) return;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, value.texture || value);
      gl.uniform1i(info.location, unit);
      unit += 1;
    });
    Object.entries(uniforms).forEach(([name, value]) => {
      const info = entry.uniforms.get(name);
      if (!info || value === undefined || value === null) return;
      if (typeof value === 'number' || typeof value === 'boolean') {
        gl.uniform1f(info.location, Number(value));
      } else if (info.size > 1) {
        const flat = Array.isArray(value[0]) ? value.flat() : value;
        const width = flat.length / info.size;
        if (width === 4) gl.uniform4fv(info.location, flat);
        else if (width === 3) gl.uniform3fv(info.location, flat);
        else if (width === 2) gl.uniform2fv(info.location, flat);
        else gl.uniform1fv(info.location, flat);
      } else if (value.length === 2) gl.uniform2fv(info.location, value);
      else if (value.length === 3) gl.uniform3fv(info.location, value);
      else if (value.length === 4) gl.uniform4fv(info.location, value);
      else if (value.length === 9) gl.uniformMatrix3fv(info.location, false, value);
    });
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  context({ width, height, time, frame }) {
    const engine = this;
    const unit = Math.max(width, height) / 1000;
    return {
      engine,
      gl: engine.gl,
      width,
      height,
      time,
      frame,
      unit,
      px: value => Math.max(1, Math.round(value * unit)),
      target: (w = width, h = height, options) => engine.target(w, h, options),
      release: target => engine.release(target),
      mipmap: target => engine.mipmap(target),
      shared: (name, create) => engine.shared(name, create),
      pass(name, body, { input, target, size, uniforms = {}, textures = {} } = {}) {
        const out = target === undefined ? engine.target(size?.[0] ?? width, size?.[1] ?? height) : target;
        const w = out ? out.width : (size?.[0] ?? width);
        const h = out ? out.height : (size?.[1] ?? height);
        engine.draw(engine.program(name, body), {
          target: out,
          width: w,
          height: h,
          uniforms: { uResolution: [w, h], uTime: time, uFrame: frame, uUnit: unit * (w / width), ...uniforms },
          textures: { uInput: input, ...textures }
        });
        return out;
      }
    };
  }

  render(
    layers,
    effects,
    {
      width,
      height,
      time = 0,
      frame = 0,
      split = -1,
      original = false,
      mirror = false,
      rotation = 0,
      flip = false,
      strength = 1
    } = {}
  ) {
    if (!this.source || this.lost) return;
    const w = Math.max(1, Math.round(width || this.source.width));
    const h = Math.max(1, Math.round(height || this.source.height));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    const ctx = this.context({ width: w, height: h, time, frame });
    const owned = new Set();
    let base = this.source;
    const turns = ((Math.round((rotation || 0) / 90) % 4) + 4) % 4 | 0;
    const mirrored = Boolean(mirror) !== Boolean(flip);
    if (mirrored || turns || this.source.width !== w || this.source.height !== h) {
      base = ctx.pass('resample', RESAMPLE_SHADER, {
        input: this.source,
        target: this.target(w, h, { float: false }),
        uniforms: { uMirror: mirrored ? 1 : 0, uTurns: turns }
      });
      owned.add(base);
    }
    let current = base;

    if (!original) {
      layers.forEach(layer => {
        const effect = effects[layer.type];
        if (!layer.visible || !effect || layer.mix <= 0) return;
        if (!this.layerState.has(layer.id)) this.layerState.set(layer.id, { type: layer.type });
        const state = this.layerState.get(layer.id);
        const output = effect.render(ctx, current, layer.params, state);
        if (!output || output === current) return;
        let next = output;
        const blend = Math.max(0, BLEND_MODES.indexOf(layer.blend || 'normal'));
        if (layer.mix < 1 || blend > 0) {
          next = ctx.pass('layer-mix', MIX_SHADER, {
            input: output,
            textures: { uBase: current },
            uniforms: { uMix: layer.mix, uBlend: blend }
          });
          this.release(output);
        }
        if (current !== base) this.release(current);
        current = next;
      });
    }

    if (this.layerState.size > layers.length) {
      const alive = new Set(layers.map(layer => layer.id));
      this.layerState.forEach((state, id) => {
        if (alive.has(id)) return;
        effects[state.type]?.dispose?.(this.gl, state);
        this.layerState.delete(id);
      });
    }

    this.draw(this.program('blit', BLIT_SHADER), {
      target: null,
      width: w,
      height: h,
      uniforms: { uSplit: split, uStrength: Math.min(Math.max(strength, 0), 1), uResolution: [w, h] },
      textures: { uInput: current, uOriginal: base }
    });
    if (current !== base) this.release(current);
    owned.forEach(target => this.release(target));
  }

  dispose() {
    const gl = this.gl;
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.free.forEach(target => this.disposeTarget(target));
    this.free = [];
    this.programs.forEach(entry => gl.deleteProgram(entry.program));
    this.programs.clear();
    this.textures.forEach(texture => gl.deleteTexture(texture.texture || texture));
    this.textures.clear();
    if (this.source) gl.deleteTexture(this.source.texture);
    gl.deleteBuffer(this.buffer);
    gl.deleteVertexArray(this.vao);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
