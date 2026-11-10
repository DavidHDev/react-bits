import { ORB_BAKED_FRAG, ORB_FRAG, ORB_TABLE, ORB_TABLES_FRAG, ORB_VERT, VERT } from './velvet';

const NAMES = [
  'uResolution',
  'uTime',
  'uFlow',
  'uTurn',
  'uEnergy',
  'uPulse',
  'uBands',
  'uLight',
  'uInk',
  'uTint',
  'uIntro',
  'uHover',
  'uExtent'
];

const SIDES = 12;

const discStrip = () => {
  const reach = 1 / Math.cos(Math.PI / SIDES);
  const corner = index => [
    Math.cos((index / SIDES) * Math.PI * 2) * reach,
    Math.sin((index / SIDES) * Math.PI * 2) * reach
  ];
  const strip = [corner(0)];
  for (let low = 1, high = SIDES - 1; low <= high; low += 1, high -= 1) {
    strip.push(corner(low));
    if (low !== high) strip.push(corner(high));
  }
  return new Float32Array(strip.flat());
};

const start = (gl, vertex, fragment) => {
  const program = gl.createProgram();
  [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment]
  ].forEach(([type, source]) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  });
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  return program;
};

const finish = (gl, program) => {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = NAMES.map(name => [name, gl.getUniformLocation(program, name)]).filter(([, at]) => at);
  return { program, uniforms, sent: new Map() };
};

const shape = (gl, points) => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { vao, buffer, count: points.length / 2 };
};

const createTable = gl => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, ORB_TABLE, 2);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texture, framebuffer, complete };
};

const send = (gl, pass, values) => {
  pass.uniforms.forEach(([name, at]) => {
    const value = values[name];
    const last = pass.sent.get(name);
    if (typeof value === 'number') {
      if (last === value) return;
      pass.sent.set(name, value);
      gl.uniform1f(at, value);
      return;
    }
    if (last && last.every((item, index) => item === value[index])) return;
    pass.sent.set(name, value.slice());
    if (value.length === 2) gl.uniform2f(at, value[0], value[1]);
    else gl.uniform3f(at, value[0], value[1], value[2]);
  });
};

const reachOf = (values, side) => {
  const intro = Math.min(1, Math.max(0, values.uIntro));
  const appear = intro * intro * (3 - 2 * intro);
  const radius = 0.44 * (0.94 + 0.06 * appear) * (1 + 0.026 * values.uEnergy + 0.02 * values.uPulse);
  return radius * side * (values.uLight > 0.5 ? 1.2 : 1) + 4;
};

export function createOrbRenderer(gl) {
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const floats = (gl.getSupportedExtensions() || []).includes('EXT_color_buffer_float');
  const screen = shape(gl, new Float32Array([-1, -1, 3, -1, -1, 3]));
  const disc = shape(gl, discStrip());
  const extent = [1, 1];

  let tables = null;
  let pending = null;
  let passes = null;
  let failed = false;

  const begin = baked => {
    pending = baked
      ? [start(gl, VERT, ORB_TABLES_FRAG), start(gl, ORB_VERT, ORB_BAKED_FRAG)]
      : [start(gl, ORB_VERT, ORB_FRAG)];
  };

  const settle = () => {
    if (passes) return true;
    if (gl.isContextLost()) failed = true;
    if (failed || !pending) return false;
    if (parallel && pending.some(program => !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)))
      return false;
    const linked = pending.map(program => finish(gl, program));
    const baked = pending.length === 2;
    pending = null;
    if (linked.some(item => !item)) {
      linked.forEach(item => item && gl.deleteProgram(item.program));
      if (baked) begin(false);
      else failed = true;
      return false;
    }
    const main = linked[linked.length - 1];
    if (baked && !gl.getExtension('EXT_color_buffer_float')) {
      linked.forEach(item => gl.deleteProgram(item.program));
      begin(false);
      return false;
    }
    if (baked) {
      tables = createTable(gl);
      if (!tables.complete) {
        gl.deleteFramebuffer(tables.framebuffer);
        gl.deleteTexture(tables.texture);
        tables = null;
        linked.forEach(item => gl.deleteProgram(item.program));
        begin(false);
        return false;
      }
      gl.useProgram(main.program);
      gl.uniform1i(gl.getUniformLocation(main.program, 'uTables'), 0);
      passes = [{ ...linked[0], target: tables.framebuffer, shape: screen }];
    } else {
      passes = [];
    }
    passes.push({ ...main, target: null, shape: disc });
    return true;
  };

  begin(floats);

  return {
    get baked() {
      return Boolean(tables && passes);
    },
    get failed() {
      return failed;
    },
    ready: settle,
    draw(values, width, height) {
      if (!settle()) return false;
      const reach = reachOf(values, Math.min(width, height));
      extent[0] = reach / (width / 2);
      extent[1] = reach / (height / 2);
      values.uExtent = extent;
      if (tables) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tables.texture);
      }
      passes.forEach(pass => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, pass.target);
        if (pass.target) {
          gl.viewport(0, 0, ORB_TABLE, 2);
        } else {
          gl.viewport(0, 0, width, height);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.useProgram(pass.program);
        send(gl, pass, values);
        gl.bindVertexArray(pass.shape.vao);
        gl.drawArrays(pass.target ? gl.TRIANGLES : gl.TRIANGLE_STRIP, 0, pass.shape.count);
      });
      gl.bindVertexArray(null);
      return true;
    },
    dispose() {
      pending?.forEach(program => gl.deleteProgram(program));
      passes?.forEach(pass => gl.deleteProgram(pass.program));
      if (tables) {
        gl.deleteFramebuffer(tables.framebuffer);
        gl.deleteTexture(tables.texture);
      }
      [screen, disc].forEach(item => {
        gl.deleteBuffer(item.buffer);
        gl.deleteVertexArray(item.vao);
      });
    }
  };
}
