const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
out vec4 outColor;
`;

const INIT = `${HEAD}
uniform sampler2D uSdf;
uniform float uLength;
void main() {
  float d = texelFetch(uSdf, ivec2(gl_FragCoord.xy), 0).r;
  outColor = vec4(d < 0.0 ? 1.0 - exp(d / uLength) : 0.0, 0.0, 0.0, 1.0);
}`;

const UPSAMPLE = `${HEAD}
uniform sampler2D uCoarse;
uniform sampler2D uSdf;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  if (texelFetch(uSdf, c, 0).r >= 0.0) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  ivec2 size = textureSize(uCoarse, 0);
  vec2 f = clamp((vec2(c) + 0.5) * 0.5 - 0.5, vec2(0.0), vec2(size - 1));
  ivec2 i0 = ivec2(floor(f));
  ivec2 i1 = min(i0 + 1, size - 1);
  vec2 t = f - vec2(i0);
  float a = mix(texelFetch(uCoarse, i0, 0).r, texelFetch(uCoarse, ivec2(i1.x, i0.y), 0).r, t.x);
  float b = mix(texelFetch(uCoarse, ivec2(i0.x, i1.y), 0).r, texelFetch(uCoarse, i1, 0).r, t.x);
  outColor = vec4(mix(a, b, t.y), 0.0, 0.0, 1.0);
}`;

const RELAX = `${HEAD}
uniform sampler2D uU;
uniform sampler2D uSdf;
uniform float uScreen;
uniform float uOmega;
uniform int uParity;
const float MIN_THETA = 0.1;

float side(ivec2 c, ivec2 o, ivec2 size, float dc, out float value) {
  ivec2 n = c + o;
  value = 0.0;
  if (n.x < 0 || n.y < 0 || n.x >= size.x || n.y >= size.y) return MIN_THETA;
  float dn = texelFetch(uSdf, n, 0).r;
  if (dn < 0.0) {
    value = texelFetch(uU, n, 0).r;
    return 1.0;
  }
  return clamp(dc / (dc - dn), MIN_THETA, 1.0);
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  float u = texelFetch(uU, c, 0).r;
  float dc = texelFetch(uSdf, c, 0).r;
  if (dc >= 0.0 || ((c.x + c.y) & 1) != uParity) {
    outColor = vec4(u, 0.0, 0.0, 1.0);
    return;
  }
  ivec2 size = textureSize(uU, 0);
  float ve;
  float vw;
  float vs;
  float vn;
  float te = side(c, ivec2(1, 0), size, dc, ve);
  float tw = side(c, ivec2(-1, 0), size, dc, vw);
  float ts = side(c, ivec2(0, 1), size, dc, vs);
  float tn = side(c, ivec2(0, -1), size, dc, vn);
  float kx = 2.0 / (te + tw);
  float ky = 2.0 / (ts + tn);
  float sum = uScreen + kx * (ve / te + vw / tw) + ky * (vs / ts + vn / tn);
  float diag = kx * (1.0 / te + 1.0 / tw) + ky * (1.0 / ts + 1.0 / tn) + uScreen;
  outColor = vec4(u + uOmega * (sum / diag - u), 0.0, 0.0, 1.0);
}`;

const GRADIENT = `${HEAD}
uniform sampler2D uU;
uniform sampler2D uSdf;
uniform float uUnit;
const float MIN_THETA = 0.08;

float slopeAlong(ivec2 c, ivec2 o, ivec2 size, float uc, float dc) {
  ivec2 p = c + o;
  ivec2 m = c - o;
  bool pr = p.x >= 0 && p.y >= 0 && p.x < size.x && p.y < size.y;
  bool mr = m.x >= 0 && m.y >= 0 && m.x < size.x && m.y < size.y;
  float dp = pr ? texelFetch(uSdf, p, 0).r : dc;
  float dm = mr ? texelFetch(uSdf, m, 0).r : dc;
  bool pIn = dp < 0.0;
  bool mIn = dm < 0.0;
  float up = pIn ? (pr ? texelFetch(uU, p, 0).r : uc) : 0.0;
  float um = mIn ? (mr ? texelFetch(uU, m, 0).r : uc) : 0.0;
  if (pIn && mIn) return (up - um) * 0.5;
  float tp = pIn ? 1.0 : clamp(dc / (dc - dp), MIN_THETA, 1.0);
  float tm = mIn ? 1.0 : clamp(dc / (dc - dm), MIN_THETA, 1.0);
  return (tm * tm * up - tp * tp * um - (tm * tm - tp * tp) * uc) / (tm * tp * (tm + tp));
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  float dc = texelFetch(uSdf, c, 0).r;
  if (dc >= 0.0) {
    outColor = vec4(0.0);
    return;
  }
  ivec2 size = textureSize(uU, 0);
  float uc = texelFetch(uU, c, 0).r;
  float gx = slopeAlong(c, ivec2(1, 0), size, uc, dc) * uUnit;
  float gr = slopeAlong(c, ivec2(0, 1), size, uc, dc) * uUnit;
  outColor = vec4(uc, gx, -gr, 1.0);
}`;

const DILATE = `${HEAD}
uniform sampler2D uSrc;
uniform float uUnit;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec4 own = texelFetch(uSrc, c, 0);
  if (own.a > 0.25) {
    outColor = own;
    return;
  }
  ivec2 size = textureSize(uSrc, 0);
  vec3 sum = vec3(0.0);
  float count = 0.0;
  for (int k = 0; k < 4; k++) {
    ivec2 o = k == 0 ? ivec2(1, 0) : k == 1 ? ivec2(-1, 0) : k == 2 ? ivec2(0, 1) : ivec2(0, -1);
    ivec2 n = c + o;
    if (n.x < 0 || n.y < 0 || n.x >= size.x || n.y >= size.y) continue;
    vec4 v = texelFetch(uSrc, n, 0);
    if (v.a < 0.25) continue;
    sum += vec3(v.x - (v.y * float(o.x) - v.z * float(o.y)) / uUnit, v.y, v.z);
    count += 1.0;
  }
  outColor = count > 0.0 ? vec4(sum / count, 0.5) : vec4(0.0);
}`;

const BLUR = `${HEAD}
uniform sampler2D uSrc;
uniform ivec2 uDir;
uniform float uSigma;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 size = textureSize(uSrc, 0);
  vec4 center = texelFetch(uSrc, c, 0);
  if (center.a < 0.25) {
    outColor = center;
    return;
  }
  vec3 sum = center.rgb;
  float total = 1.0;
  for (int k = 1; k <= 4; k++) {
    float w = exp(-float(k * k) / (2.0 * uSigma * uSigma));
    vec4 a = texelFetch(uSrc, clamp(c + uDir * k, ivec2(0), size - 1), 0);
    vec4 b = texelFetch(uSrc, clamp(c - uDir * k, ivec2(0), size - 1), 0);
    float wa = a.a > 0.25 ? w : 0.0;
    float wb = b.a > 0.25 ? w : 0.0;
    sum += wa * a.rgb + wb * b.rgb;
    total += wa + wb;
  }
  outColor = vec4(sum / total, center.a);
}`;

const SWEEPS = { coarsest: 60, middle: 10, finest: 16 };
const MIN_SIDE = 40;
const OMEGA = 1.6;
const SIGMA = 1.2;

const compile = (gl, source, names) => {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERTEX);
  gl.compileShader(vs);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, source);
  gl.compileShader(fs);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  const log = linked ? '' : gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!linked) {
    gl.deleteProgram(program);
    throw new Error(`Shape Magic surface shader failed: ${log}`);
  }
  return { program, loc: Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program, name)])) };
};

export const surfaceLevels = (width, height) => {
  let steps = 0;
  while (Math.min(width, height) / 2 ** steps > MIN_SIDE) steps += 1;
  const step = 2 ** steps;
  return {
    count: steps + 1,
    width: Math.ceil(width / step) * step,
    height: Math.ceil(height / step) * step
  };
};

export function createSurfaceSolver(gl, vao) {
  if (!gl.getExtension('EXT_color_buffer_float')) return null;
  let programs = null;
  let levels = [];
  let finest = null;
  let size = '';

  const ensurePrograms = () => {
    if (programs) return programs;
    programs = {
      init: compile(gl, INIT, ['uSdf', 'uLength']),
      upsample: compile(gl, UPSAMPLE, ['uCoarse', 'uSdf']),
      relax: compile(gl, RELAX, ['uU', 'uSdf', 'uScreen', 'uOmega', 'uParity']),
      gradient: compile(gl, GRADIENT, ['uU', 'uSdf', 'uUnit']),
      dilate: compile(gl, DILATE, ['uSrc', 'uUnit']),
      blur: compile(gl, BLUR, ['uSrc', 'uDir', 'uSigma'])
    };
    return programs;
  };

  const target = (width, height, format, filter = gl.NEAREST) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const formats = {
      r32: [gl.R32F, gl.RED],
      rgba32: [gl.RGBA32F, gl.RGBA],
      rgba16: [gl.RGBA16F, gl.RGBA]
    };
    const [internal, layout] = formats[format];
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, width, height, 0, layout, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return { texture, fbo, width, height };
  };

  const release = item => {
    if (!item) return;
    gl.deleteFramebuffer(item.fbo);
    gl.deleteTexture(item.texture);
  };

  const releaseAll = () => {
    levels.forEach(level => {
      release(level.sdf);
      level.u.forEach(release);
    });
    if (finest) Object.values(finest).forEach(release);
    levels = [];
    finest = null;
  };

  const prepare = (width, height, unit) => {
    const plan = surfaceLevels(width, height);
    const key = `${plan.width}x${plan.height}`;
    if (key !== size) {
      releaseAll();
      for (let index = 0; index < plan.count; index++) {
        const w = plan.width / 2 ** index;
        const h = plan.height / 2 ** index;
        levels.push({ width: w, height: h, sdf: target(w, h, 'r32'), u: [target(w, h, 'r32'), target(w, h, 'r32')] });
      }
      finest = {
        grad: target(plan.width, plan.height, 'rgba32'),
        temp: target(plan.width, plan.height, 'rgba32'),
        out: target(plan.width, plan.height, 'rgba16', gl.LINEAR)
      };
      size = key;
      gl.bindFramebuffer(gl.FRAMEBUFFER, levels[0].sdf.fbo);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        releaseAll();
        size = '';
        return null;
      }
    }
    levels.forEach((level, index) => {
      level.unit = unit / 2 ** index;
    });
    return levels.map(level => ({
      fbo: level.sdf.fbo,
      width: level.width,
      height: level.height,
      unit: level.unit
    }));
  };

  const pass = (program, output, textures, setup) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, output.fbo);
    gl.viewport(0, 0, output.width, output.height);
    gl.useProgram(program.program);
    textures.forEach(([name, texture], unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(program.loc[name], unit);
    });
    setup?.(program.loc);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const run = bevel => {
    const p = ensurePrograms();
    gl.disable(gl.BLEND);
    gl.bindVertexArray(vao);
    let previous = null;
    for (let index = levels.length - 1; index >= 0; index--) {
      const level = levels[index];
      const length = Math.max(bevel, 0.75 / level.unit);
      const pixels = Math.max(bevel * level.unit, 0.75);
      const screen = 1 / (pixels * pixels);
      if (previous) {
        pass(p.upsample, level.u[0], [
          ['uCoarse', previous.texture],
          ['uSdf', level.sdf.texture]
        ]);
      } else {
        pass(p.init, level.u[0], [['uSdf', level.sdf.texture]], loc => gl.uniform1f(loc.uLength, length));
      }
      const sweeps = index === levels.length - 1 ? SWEEPS.coarsest : index === 0 ? SWEEPS.finest : SWEEPS.middle;
      let read = 0;
      for (let sweep = 0; sweep < sweeps; sweep++) {
        for (let parity = 0; parity < 2; parity++) {
          pass(
            p.relax,
            level.u[1 - read],
            [
              ['uU', level.u[read].texture],
              ['uSdf', level.sdf.texture]
            ],
            loc => {
              gl.uniform1f(loc.uScreen, screen);
              gl.uniform1f(loc.uOmega, OMEGA);
              gl.uniform1i(loc.uParity, parity);
            }
          );
          read = 1 - read;
        }
      }
      previous = level.u[read];
    }
    const top = levels[0];
    pass(
      p.gradient,
      finest.grad,
      [
        ['uU', previous.texture],
        ['uSdf', top.sdf.texture]
      ],
      loc => gl.uniform1f(loc.uUnit, top.unit)
    );
    pass(p.dilate, finest.temp, [['uSrc', finest.grad.texture]], loc => gl.uniform1f(loc.uUnit, top.unit));
    pass(p.dilate, finest.grad, [['uSrc', finest.temp.texture]], loc => gl.uniform1f(loc.uUnit, top.unit));
    pass(p.blur, finest.temp, [['uSrc', finest.grad.texture]], loc => {
      gl.uniform2i(loc.uDir, 1, 0);
      gl.uniform1f(loc.uSigma, SIGMA);
    });
    pass(p.blur, finest.out, [['uSrc', finest.temp.texture]], loc => {
      gl.uniform2i(loc.uDir, 0, 1);
      gl.uniform1f(loc.uSigma, SIGMA);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
      texture: finest.out.texture,
      info: [top.unit / top.width, -top.unit / top.height, 1, 0]
    };
  };

  const dispose = () => {
    releaseAll();
    if (programs) Object.values(programs).forEach(item => gl.deleteProgram(item.program));
    programs = null;
  };

  return { prepare, run, dispose };
}
