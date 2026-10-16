import { parseColor } from '../../../components/common/Preview/colorMath';
import { FIELD_RANGE, MASK_SLOTS, MASK_TYPE, VERTEX, buildFragment } from './shader';
import { PRIMITIVE_INDEX, primitiveSlots } from './primitives';
import { smoothFor } from '../state/doc';
import { layoutParams, packParams } from './materialParams';
import { createSurfaceSolver } from './surfaceGpu';
import { solveSurface as solveSurfaceCpu } from './surface';
import { markLayers, shaderVariant, variantKey } from './shaderVariant';

export { markLayers } from './shaderVariant';

const OPS = { add: 0, merge: 1, cut: 2, keep: 3, exclude: 4 };
const PATTERNS = { none: 0, lines: 1, rings: 2, rays: 3, grid: 4, dots: 5, halftone: 6 };
const LAYOUTS = { radial: 0, row: 1, column: 2 };
const FILLS = { none: 0, solid: 1, linear: 2, radial: 3, conic: 4, logo: 5, texture: 6, material: 7 };
const BACKGROUNDS = { none: 0, color: 1, linear: 2 };
const RAD = Math.PI / 180;

const rgba = (value, fallback = [1, 1, 1, 1]) => {
  const color = parseColor(value);
  return color ? [color.r, color.g, color.b, color.a ?? 1] : fallback;
};

const startProgram = (gl, vertex, fragment) => {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vertex);
  gl.compileShader(vs);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fragment);
  gl.compileShader(fs);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  return { program, vs, fs };
};

const finishProgram = (gl, { program, vs, fs }) => {
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  const log = linked ? '' : gl.getShaderInfoLog(fs) || gl.getShaderInfoLog(vs) || gl.getProgramInfoLog(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!linked) {
    gl.deleteProgram(program);
    throw new Error(`Shape Magic shader failed: ${log}`);
  }
  return program;
};

const UNIFORMS = [
  'uCountA',
  'uCountB',
  'uType',
  'uA',
  'uB',
  'uXf',
  'uRep',
  'uMod',
  'uPat',
  'uPat2',
  'uMarkA',
  'uMarkB',
  'uMorph',
  'uMask0',
  'uMask1',
  'uMask2',
  'uMask3',
  'uMaskInfo',
  'uLogoTex',
  'uLogoLayer',
  'uResolution',
  'uCenter',
  'uUnit',
  'uEncode',
  'uTime',
  'uFill',
  'uColor1',
  'uColor2',
  'uColor3',
  'uOutline',
  'uOutlineColor',
  'uShadow',
  'uShadowOffset',
  'uShadowColor',
  'uGlow',
  'uGlowColor',
  'uBevel',
  'uMatTex',
  'uSurfTex',
  'uSurfInfo',
  'uMatP',
  'uMatC',
  'uSurface',
  'uBg',
  'uBgColor1',
  'uBgColor2'
];

export const encodeLayer = (layer, maskSlots = {}) => {
  const slot = maskSlots[layer.id];
  const masked = layer.type === 'text' || layer.type === 'image';
  const type = masked ? (slot !== undefined ? MASK_TYPE + slot : -1) : (PRIMITIVE_INDEX[layer.type] ?? 0);
  const [a, b] = primitiveSlots(layer.type, layer.params);
  return {
    type,
    a,
    b,
    xf: [layer.x ?? 0, layer.y ?? 0, Math.max(layer.size ?? 1, 0.001), (layer.rotation ?? 0) * RAD],
    rep: [
      Math.max(1, Math.round(layer.repeat ?? 1)),
      LAYOUTS[layer.layout] ? (layer.gap ?? 2.3) : (layer.spin ?? 0) * RAD,
      layer.mirror ? 1 : 0,
      layer.flip ? 1 : 0
    ],
    mod: [layer.round ?? 0, layer.outline ?? 0, OPS[layer.op] ?? 0, smoothFor(layer)],
    pat: [PATTERNS[layer.pattern] ?? 0, layer.density ?? 8, layer.weight ?? 0.5, (layer.patternAngle ?? 0) * RAD],
    pat2: [layer.bulge ?? 0, layer.taper ?? 0, layer.invert ? 1 : 0, LAYOUTS[layer.layout] ?? 0]
  };
};

const sceneArrays = capacity => ({
  type: new Int32Array(capacity * 2),
  ...Object.fromEntries(
    ['a', 'b', 'xf', 'rep', 'mod', 'pat', 'pat2'].map(name => [name, new Float32Array(capacity * 8)])
  )
});

export function createRenderer(canvas, { preserve = false } = {}) {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: preserve
  });
  if (!gl) throw new Error('WebGL2 is not available.');

  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const programs = new Map();
  const pending = new Map();
  let current = null;
  let loc = {};
  let disposed = false;
  let lastVariant = shaderVariant();
  const keyOf = (def, variant = lastVariant) => `${def?.id || ''}|${variantKey(variant)}`;
  const touch = key => {
    const entry = programs.get(key);
    if (entry) {
      programs.delete(key);
      programs.set(key, entry);
    }
    return entry;
  };
  const start = (def, variant) => {
    if (!pending.size) {
      for (const [key, entry] of programs) {
        if (programs.size < 32) break;
        if (entry === current) continue;
        gl.deleteProgram(entry.program);
        programs.delete(key);
      }
    }
    const layout = def ? layoutParams(def.params) : null;
    const source = buildFragment(
      def
        ? {
            glsl: def.glsl,
            kind: def.kind,
            outside: Boolean(def.outside),
            normals: def.normals !== false,
            reach: def.reach,
            defines: layout.defines
          }
        : null,
      { ...variant, bevel: def && def.kind !== 'fill' ? def.normals !== false : variant.bevel }
    );
    return { def, layout, variant, started: startProgram(gl, VERTEX, source) };
  };
  const settle = (key, record) => {
    pending.delete(key);
    const program = finishProgram(gl, record.started);
    const entry = {
      program,
      layout: record.layout,
      def: record.def,
      capacity: record.variant.capacity,
      arrays: sceneArrays(record.variant.capacity),
      loc: Object.fromEntries(UNIFORMS.map(name => [name, gl.getUniformLocation(program, name)]))
    };
    programs.set(key, entry);
    return entry;
  };
  const programFor = (def, variant) => {
    const key = keyOf(def, variant);
    return touch(key) || settle(key, pending.get(key) || start(def, variant));
  };
  const prepareAsync = (def, variant = lastVariant) => {
    if (disposed) return Promise.reject(new Error('Renderer was disposed.'));
    const key = keyOf(def, variant);
    if (programs.has(key)) return Promise.resolve(touch(key));
    if (pending.has(key)) return pending.get(key).promise;
    const record = start(def, variant);
    record.promise = new Promise((resolve, reject) => {
      const check = () => {
        if (programs.has(key)) {
          resolve(programs.get(key));
          return;
        }
        if (disposed || pending.get(key) !== record || gl.isContextLost()) {
          reject(new Error('Shader compile was cancelled.'));
          return;
        }
        if (parallel && !gl.getProgramParameter(record.started.program, parallel.COMPLETION_STATUS_KHR)) {
          setTimeout(check, 16);
          return;
        }
        try {
          resolve(settle(key, record));
        } catch (problem) {
          reject(problem);
        }
      };
      setTimeout(check, 0);
    });
    pending.set(key, record);
    return record.promise;
  };
  const switchProgram = (def, variant) => {
    current = programFor(def, variant);
    loc = current.loc;
    arrays = current.arrays;
    gl.useProgram(current.program);
  };

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const solver = createSurfaceSolver(gl, vao);
  const anisotropy = gl.getExtension('EXT_texture_filter_anisotropic');

  const emptyMask = () => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([1]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  };
  const masks = Array.from({ length: MASK_SLOTS }, () => ({
    texture: emptyMask(),
    info: [1, 1, 0, 0],
    key: null,
    color: null
  }));
  const blankColor = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, blankColor);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  let logoIndex = -1;
  let logoTexture = blankColor;

  const NO_SURFACE = [0, 0, 0, 0];
  const surfTexture = gl.createTexture();
  const uploadSurface = field => {
    gl.bindTexture(gl.TEXTURE_2D, surfTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (!field) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 1, 1, 0, gl.RGBA, gl.FLOAT, new Float32Array(4));
      return;
    }
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, field.width, field.height, 0, gl.RGBA, gl.FLOAT, field.data);
  };
  uploadSurface(null);
  let surface = { key: '', ready: false, texture: surfTexture, info: NO_SURFACE };
  let surfaceOn = false;

  const matTexture = gl.createTexture();
  const setMaterialTexture = source => {
    gl.bindTexture(gl.TEXTURE_2D, matTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (!source) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      return;
    }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    if (anisotropy) {
      const most = gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, most));
    }
  };
  setMaterialTexture(null);

  let arrays = null;

  let readTarget = null;

  const setMask = (slot, field) => {
    const mask = masks[slot];
    if (!mask) return;
    if (!field) {
      mask.info = [1, 1, 0, 0];
      mask.key = null;
      if (mask.color) {
        gl.deleteTexture(mask.color);
        mask.color = null;
      }
      gl.bindTexture(gl.TEXTURE_2D, mask.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([1]));
      return;
    }
    if (mask.key === field.key) return;
    if (!field.data) return;
    gl.bindTexture(gl.TEXTURE_2D, mask.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, field.width, field.height, 0, gl.RED, gl.FLOAT, field.data);
    mask.info = [field.halfW, field.halfH, 0, 0];
    mask.key = field.key;
    if (mask.color) {
      gl.deleteTexture(mask.color);
      mask.color = null;
    }
    if (field.color) {
      mask.color = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, mask.color);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, field.color);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
  };

  const writeScene = (mark, offset, maskSlots) => {
    const layers = markLayers(mark);
    layers.forEach((layer, index) => {
      const i = offset + index;
      const encoded = encodeLayer(layer, maskSlots);
      if (offset === 0 && logoIndex < 0 && layer.type === 'image' && maskSlots[layer.id] !== undefined) {
        const color = masks[maskSlots[layer.id]]?.color;
        if (color) {
          logoIndex = i;
          logoTexture = color;
        }
      }
      arrays.type[i] = encoded.type;
      arrays.a.set(encoded.a, i * 4);
      arrays.b.set(encoded.b, i * 4);
      arrays.xf.set(encoded.xf, i * 4);
      arrays.rep.set(encoded.rep, i * 4);
      arrays.mod.set(encoded.mod, i * 4);
      arrays.pat.set(encoded.pat, i * 4);
      arrays.pat2.set(encoded.pat2, i * 4);
    });
    return layers.length;
  };

  const markUniform = mark => [
    Math.max(mark?.scale ?? 1, 0.001),
    (mark?.rotation ?? 0) * RAD,
    mark?.x ?? 0,
    mark?.y ?? 0
  ];

  const applyScene = ({ a, b = null, morph = 0, maskSlots = {} }) => {
    logoIndex = -1;
    logoTexture = blankColor;
    const countA = writeScene(a, 0, maskSlots);
    const countB = b ? writeScene(b, current.capacity, maskSlots) : 0;
    gl.uniform1i(loc.uCountA, countA);
    gl.uniform1i(loc.uCountB, countB);
    gl.uniform1iv(loc.uType, arrays.type);
    gl.uniform4fv(loc.uA, arrays.a);
    gl.uniform4fv(loc.uB, arrays.b);
    gl.uniform4fv(loc.uXf, arrays.xf);
    gl.uniform4fv(loc.uRep, arrays.rep);
    gl.uniform4fv(loc.uMod, arrays.mod);
    gl.uniform4fv(loc.uPat, arrays.pat);
    gl.uniform4fv(loc.uPat2, arrays.pat2);
    gl.uniform4fv(loc.uMarkA, markUniform(a));
    gl.uniform4fv(loc.uMarkB, markUniform(b || a));
    gl.uniform1f(loc.uMorph, b ? morph : 0);
    const info = new Float32Array(MASK_SLOTS * 4);
    masks.forEach((mask, slot) => {
      gl.activeTexture(gl.TEXTURE0 + slot);
      gl.bindTexture(gl.TEXTURE_2D, mask.texture);
      gl.uniform1i(loc[`uMask${slot}`], slot);
      info.set(mask.info, slot * 4);
    });
    gl.uniform4fv(loc.uMaskInfo, info);
    gl.activeTexture(gl.TEXTURE0 + MASK_SLOTS);
    gl.bindTexture(gl.TEXTURE_2D, logoTexture);
    gl.uniform1i(loc.uLogoTex, MASK_SLOTS);
    gl.uniform1i(loc.uLogoLayer, logoIndex);
    gl.activeTexture(gl.TEXTURE0 + MASK_SLOTS + 1);
    gl.bindTexture(gl.TEXTURE_2D, matTexture);
    gl.uniform1i(loc.uMatTex, MASK_SLOTS + 1);
    gl.activeTexture(gl.TEXTURE0 + MASK_SLOTS + 2);
    gl.bindTexture(gl.TEXTURE_2D, surfaceOn ? surface.texture : surfTexture);
    gl.uniform1i(loc.uSurfTex, MASK_SLOTS + 2);
    gl.uniform4fv(loc.uSurfInfo, surfaceOn ? surface.info : NO_SURFACE);
  };

  const applyStyle = (style = {}) => {
    const fill = style.fill || { kind: 'solid', color1: '#ffffff' };
    const kind = FILLS[fill.kind] ?? 1;
    gl.uniform4fv(loc.uFill, [kind, (fill.angle ?? 0) * RAD, fill.extent ?? 1, fill.stops === 3 ? 1 : 0]);
    gl.uniform4fv(loc.uColor1, rgba(fill.color1 ?? '#ffffff'));
    gl.uniform4fv(loc.uColor2, rgba(fill.color2 ?? fill.color1 ?? '#ffffff'));
    gl.uniform4fv(loc.uColor3, rgba(fill.color3 ?? fill.color2 ?? '#ffffff'));

    const outline = style.outline || {};
    gl.uniform4fv(loc.uOutline, [outline.on ? 1 : 0, outline.width ?? 0.04, outline.mode === 'center' ? 1 : 0, 0]);
    gl.uniform4fv(loc.uOutlineColor, rgba(outline.color ?? '#000000'));

    const shadow = style.shadow || {};
    gl.uniform4fv(loc.uShadow, [shadow.on ? (shadow.opacity ?? 0.35) : 0, shadow.blur ?? 0.12, 0, 0]);
    gl.uniform4fv(loc.uShadowOffset, [shadow.x ?? 0, shadow.y ?? 0.08, 0, 0]);
    gl.uniform4fv(loc.uShadowColor, rgba(shadow.color ?? '#000000'));

    const glow = style.glow || {};
    gl.uniform4fv(loc.uGlow, [glow.on ? (glow.intensity ?? 0.8) : 0, glow.radius ?? 0.12, 0, 0]);
    gl.uniform4fv(loc.uGlowColor, rgba(glow.color ?? fill.color1 ?? '#ffffff'));

    const gloss = style.gloss || {};
    gl.uniform4fv(loc.uBevel, [
      gloss.strength ?? 0.25,
      (gloss.angle ?? 225) * RAD,
      gloss.on ? Math.max(gloss.bevel ?? 0.4, 0.005) : 0,
      gloss.bend ?? 2.5
    ]);

    const material = style.material;
    if (current.def) {
      const def = current.def;
      const values = material?.values || {};
      const packed = packParams(current.layout, values);
      gl.uniform4fv(loc.uMatP, packed.floats);
      gl.uniform4fv(loc.uMatC, packed.colors);
      const surfaceParam = typeof def.surface === 'string' ? def.params.find(item => item.name === def.surface) : null;
      const surface =
        typeof def.surface === 'number' ? def.surface : (values[def.surface] ?? surfaceParam?.default ?? 0.2);
      gl.uniform4fv(loc.uSurface, [Number(surface) || 0.2, 0, 0, 0]);
    }

    const background = style.background || { kind: 'none' };
    gl.uniform4fv(loc.uBg, [
      BACKGROUNDS[background.kind] ?? 0,
      (background.angle ?? 180) * RAD,
      background.extent ?? 1,
      0
    ]);
    gl.uniform4fv(loc.uBgColor1, rgba(background.color1 ?? '#000000', [0, 0, 0, 1]));
    gl.uniform4fv(loc.uBgColor2, rgba(background.color2 ?? background.color1 ?? '#000000', [0, 0, 0, 1]));
  };

  const frame = ({ width, height, unit, center, encode = false, time = 0 }) => {
    gl.uniform2f(loc.uResolution, width, height);
    gl.uniform2f(loc.uCenter, center?.[0] ?? width / 2, center?.[1] ?? height / 2);
    gl.uniform1f(loc.uUnit, unit ?? Math.min(width, height) / 2);
    gl.uniform1f(loc.uEncode, Number(encode) || 0);
    gl.uniform1f(loc.uTime, time);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const solveSurface = (scene, bevel, width, height, resolution) => {
    const scale = Math.min(1, resolution / Math.max(width, height));
    const fieldW = Math.max(16, Math.round(width * scale));
    const fieldH = Math.max(16, Math.round(height * scale));
    const key = JSON.stringify([
      scene.a,
      scene.b || null,
      scene.b ? scene.morph : 0,
      scene.maskSlots || {},
      masks.map(mask => mask.key),
      fieldW,
      fieldH,
      bevel
    ]);
    if (key === surface.key) return surface.ready;
    surfaceOn = false;
    const plan = solver?.prepare(fieldW, fieldH, Math.min(fieldW, fieldH) / 2);
    if (plan) {
      switchProgram(null, shaderVariant(scene));
      applyScene(scene);
      plan.forEach(level => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, level.fbo);
        frame({
          width: level.width,
          height: level.height,
          unit: level.unit,
          center: [level.width / 2, level.height / 2],
          encode: 2
        });
      });
      const result = solver.run(bevel);
      surface = { key, ready: true, texture: result.texture, info: result.info };
      return true;
    }
    if (scene.b) {
      surface = { key, ready: false, texture: surfTexture, info: NO_SURFACE };
      return false;
    }
    const long = 288;
    const w = Math.max(16, Math.round(width >= height ? long : (long * width) / height));
    const h = Math.max(16, Math.round(width >= height ? (long * height) / width : long));
    const field = solveSurfaceCpu(readField({ scene, width: w, height: h }), bevel);
    uploadSurface(field);
    surface = { key, ready: true, texture: surfTexture, info: [field.unit / w, field.unit / h, 1, 0] };
    return true;
  };

  const draw = ({ scene, style, width, height, unit, center, time = 0, surfaceResolution = 768 }) => {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const gloss = style?.gloss;
    surfaceOn = Boolean(
      gloss?.on && solveSurface(scene, Math.max(gloss.bevel ?? 0.4, 0.005), width, height, surfaceResolution)
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    switchProgram(style?.material?.def || null, shaderVariant(scene, style));
    applyScene(scene);
    applyStyle(style);
    frame({ width, height, unit, center, time });
  };

  const ensureReadTarget = (width, height) => {
    if (readTarget && readTarget.width === width && readTarget.height === height) return readTarget;
    if (readTarget) {
      gl.deleteFramebuffer(readTarget.fbo);
      gl.deleteTexture(readTarget.texture);
    }
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    readTarget = { fbo, texture, width, height };
    return readTarget;
  };

  const readField = ({ scene, width, height, unit, center }) => {
    const target = ensureReadTarget(width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    switchProgram(null, shaderVariant(scene));
    applyScene(scene);
    frame({ width, height, unit, center, encode: true });
    const bytes = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const field = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      const row = (height - 1 - y) * width;
      for (let x = 0; x < width; x++) {
        const i = (row + x) * 4;
        const v = (bytes[i] * 65536 + bytes[i + 1] * 256 + bytes[i + 2]) / 16777215;
        field[y * width + x] = (v - 0.5) * FIELD_RANGE;
      }
    }
    return {
      data: field,
      width,
      height,
      unit: unit ?? Math.min(width, height) / 2,
      center: center ?? [width / 2, height / 2]
    };
  };

  const dispose = () => {
    disposed = true;
    masks.forEach(mask => {
      gl.deleteTexture(mask.texture);
      if (mask.color) gl.deleteTexture(mask.color);
    });
    gl.deleteTexture(blankColor);
    if (readTarget) {
      gl.deleteFramebuffer(readTarget.fbo);
      gl.deleteTexture(readTarget.texture);
    }
    gl.deleteTexture(matTexture);
    gl.deleteTexture(surfTexture);
    solver?.dispose();
    gl.deleteBuffer(quad);
    gl.deleteVertexArray(vao);
    programs.forEach(entry => gl.deleteProgram(entry.program));
    programs.clear();
    pending.forEach(record => {
      gl.deleteProgram(record.started.program);
      gl.deleteShader(record.started.vs);
      gl.deleteShader(record.started.fs);
    });
    pending.clear();
  };

  const prepareScene = (scene, style = {}) => {
    const variant = shaderVariant(scene, style);
    lastVariant = variant;
    const work = [prepareAsync(style.material?.def || null, variant)];
    if (style.gloss?.on) work.push(prepareAsync(null, shaderVariant(scene)));
    return Promise.all(work);
  };

  const prepare = def => prepareAsync(def || null);

  const isReady = def => programs.has(keyOf(def));

  return {
    gl,
    draw,
    readField,
    setMask,
    setMaterialTexture,
    prepare,
    prepareAsync,
    prepareScene,
    isReady,
    dispose
  };
}
