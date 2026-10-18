export function createContext(canvas, { preserve = false } = {}) {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: preserve,
    powerPreference: 'high-performance'
  });
  if (!gl) throw new Error('WebGL 2 is not available in this browser.');
  const float = gl.getExtension('EXT_color_buffer_float');
  if (!float) gl.getExtension('EXT_color_buffer_half_float');
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  gl.getExtension('OES_texture_float_linear');
  return {
    gl,
    floatTargets: Boolean(float),
    aniso,
    maxAniso: aniso ? gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1,
    maxTexture: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxRenderbuffer: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    maxSamples: gl.getParameter(gl.MAX_SAMPLES)
  };
}

const HEADER = '#version 300 es\nprecision highp float;\nprecision highp int;\n';

function compile(gl, type, source, label) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, HEADER + source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader ${label} failed: ${log}`);
  }
  return shader;
}

export class Program {
  constructor(gl, vertex, fragment, label = 'program') {
    this.gl = gl;
    const vs = compile(gl, gl.VERTEX_SHADER, vertex, `${label}.vert`);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragment, `${label}.frag`);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.bindAttribLocation(program, 1, 'aNormal');
    gl.bindAttribLocation(program, 2, 'aUv');
    gl.bindAttribLocation(program, 3, 'aPart');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
      throw new Error(`Program ${label} failed: ${gl.getProgramInfoLog(program)}`);
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = program;
    this.locations = new Map();
    this.units = new Map();
  }

  use() {
    this.gl.useProgram(this.program);
    return this;
  }

  location(name) {
    if (!this.locations.has(name)) this.locations.set(name, this.gl.getUniformLocation(this.program, name));
    return this.locations.get(name);
  }

  set(name, value) {
    const gl = this.gl;
    const loc = this.location(name);
    if (loc === null) return this;
    if (typeof value === 'number') gl.uniform1f(loc, value);
    else if (typeof value === 'boolean') gl.uniform1f(loc, value ? 1 : 0);
    else if (value.length === 2) gl.uniform2fv(loc, value);
    else if (value.length === 3) gl.uniform3fv(loc, value);
    else if (value.length === 4) gl.uniform4fv(loc, value);
    else if (value.length === 9) gl.uniformMatrix3fv(loc, false, value);
    else if (value.length === 16) gl.uniformMatrix4fv(loc, false, value);
    return this;
  }

  setInt(name, value) {
    const loc = this.location(name);
    if (loc !== null) this.gl.uniform1i(loc, value);
    return this;
  }

  setArray(name, values, size) {
    const loc = this.location(name);
    if (loc === null) return this;
    const gl = this.gl;
    if (size === 1) gl.uniform1fv(loc, values);
    else if (size === 2) gl.uniform2fv(loc, values);
    else if (size === 3) gl.uniform3fv(loc, values);
    else gl.uniform4fv(loc, values);
    return this;
  }

  texture(name, texture) {
    const gl = this.gl;
    const loc = this.location(name);
    if (loc === null) return this;
    let unit = this.units.get(name);
    if (unit === undefined) {
      unit = this.units.size;
      this.units.set(name, unit);
      gl.uniform1i(loc, unit);
    }
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    return this;
  }

  dispose() {
    this.gl.deleteProgram(this.program);
  }
}

export class Mesh {
  constructor(gl, { position, normal, uv, part, index }) {
    this.gl = gl;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.buffers = [];
    const attribute = (slot, data, size) => {
      if (!data) return;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(slot);
      gl.vertexAttribPointer(slot, size, gl.FLOAT, false, 0, 0);
      this.buffers.push(buffer);
    };
    attribute(0, position, 3);
    attribute(1, normal, 3);
    attribute(2, uv, 2);
    attribute(3, part, 1);
    if (index) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
      this.buffers.push(buffer);
      this.count = index.length;
      this.indexed = true;
      this.indexType = index instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    } else {
      this.count = position.length / 3;
      this.indexed = false;
    }
    gl.bindVertexArray(null);
  }

  draw() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    if (this.indexed) gl.drawElements(gl.TRIANGLES, this.count, this.indexType, 0);
    else gl.drawArrays(gl.TRIANGLES, 0, this.count);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    this.buffers.forEach(buffer => gl.deleteBuffer(buffer));
    gl.deleteVertexArray(this.vao);
  }
}

export function fullscreen(gl) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return {
    draw() {
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
    }
  };
}

export const levelsFor = (width, height, cap = 10) =>
  Math.max(1, Math.min(cap, Math.floor(Math.log2(Math.max(width, height))) + 1));

export function createTexture(gl, { width, height, internal, levels = 1, filter, wrap }) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texStorage2D(gl.TEXTURE_2D, levels, internal, width, height);
  const min = filter === 'nearest' ? gl.NEAREST : levels > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter === 'nearest' ? gl.NEAREST : gl.LINEAR);
  const mode = wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mode);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mode);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, levels - 1);
  return texture;
}

export class ImageTexture {
  constructor(context) {
    this.context = context;
    this.gl = context.gl;
    this.texture = null;
    this.width = 0;
    this.height = 0;
    this.source = null;
  }

  upload(source, width, height, { mips = true } = {}) {
    const gl = this.gl;
    if (!this.texture || this.width !== width || this.height !== height) {
      if (this.texture) gl.deleteTexture(this.texture);
      this.texture = gl.createTexture();
      this.width = width;
      this.height = height;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (mips) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      if (this.context.aniso) {
        gl.texParameterf(
          gl.TEXTURE_2D,
          this.context.aniso.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(16, this.context.maxAniso)
        );
      }
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    this.source = source;
    return this;
  }

  dispose() {
    if (this.texture) this.gl.deleteTexture(this.texture);
    this.texture = null;
  }
}

export class LayerTarget {
  constructor(context, width, height, { samples = 4 } = {}) {
    const gl = context.gl;
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.levels = levelsFor(width, height, 9);
    this.floatDepth = context.floatTargets;
    this.samples = Math.max(0, Math.min(samples, context.maxSamples || 0));

    this.color = createTexture(gl, {
      width,
      height,
      internal: gl.RGBA8,
      levels: this.levels
    });
    this.depth = createTexture(gl, {
      width,
      height,
      internal: this.floatDepth ? gl.RG16F : gl.RGBA8,
      levels: this.levels
    });

    this.msaa = gl.createFramebuffer();
    this.msaaColor = gl.createRenderbuffer();
    this.msaaDepth = gl.createRenderbuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaa);
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaColor);
    if (this.samples > 1) gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.RGBA8, width, height);
    else gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.msaaColor);
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaDepth);
    if (this.samples > 1)
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.DEPTH_COMPONENT24, width, height);
    else gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.msaaDepth);

    this.colorFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.colorFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.color, 0);

    this.zbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.zbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
    this.depthFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.depth, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.zbuffer);

    this.mipFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  levelSize(level) {
    return [Math.max(1, this.width >> level), Math.max(1, this.height >> level)];
  }

  beginColor() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaa);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  resolveColor() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaa);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.colorFbo);
    gl.blitFramebuffer(0, 0, this.width, this.height, 0, 0, this.width, this.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }

  beginDirectColor() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.colorFbo);
    gl.viewport(0, 0, this.width, this.height);
  }

  beginDepth() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFbo);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  bindLevel(texture, level) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.mipFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, level);
    const [w, h] = this.levelSize(level);
    gl.viewport(0, 0, w, h);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteTexture(this.color);
    gl.deleteTexture(this.depth);
    gl.deleteRenderbuffer(this.msaaColor);
    gl.deleteRenderbuffer(this.msaaDepth);
    gl.deleteRenderbuffer(this.zbuffer);
    gl.deleteFramebuffer(this.msaa);
    gl.deleteFramebuffer(this.colorFbo);
    gl.deleteFramebuffer(this.depthFbo);
    gl.deleteFramebuffer(this.mipFbo);
  }
}

export class ColorTarget {
  constructor(gl, width, height, { levels = 1, internal } = {}) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.levels = levels;
    this.texture = createTexture(gl, { width, height, internal: internal || gl.RGBA8, levels });
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  begin() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.width, this.height);
  }

  dispose() {
    this.gl.deleteTexture(this.texture);
    this.gl.deleteFramebuffer(this.fbo);
  }
}
