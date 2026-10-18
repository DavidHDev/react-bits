import { ColorTarget, ImageTexture, LayerTarget, Mesh, Program, createContext, createTexture, fullscreen } from './gl';
import {
  BACKGROUND_FS,
  BLIT_FS,
  COMPOSITE_FS,
  DECAL_FS,
  DEPTH_FS,
  DEVICE_FS,
  DEVICE_VS,
  DOWNSAMPLE_FS,
  FINAL_FS,
  FULLSCREEN_VS,
  QUAD_DEPTH_FS,
  QUAD_FS,
  SHADOW_FS,
  SHADOW_RESOLVE_FS,
  SHADOW_VS
} from './shaders';
import { drawArt, slabGeometry } from './devices';
import { PHONE_MM, PHONE_POINTS, phoneFrame, phoneGeometry, plateauOutline, windowShape } from './phone';
import { CHROME_BAR, drawChrome } from './chrome';
import { PHONE_FS, PHONE_VS } from './phoneShaders';
import { LAPTOP, displayGeometry, drawLegends, keyboardKeys, laptopGeometry } from './hardware';
import { laptopParts } from './scene';
import {
  DEG,
  chain,
  clamp,
  dot,
  hexToRgb,
  invert,
  luminance,
  mixRgb,
  multiply,
  normalMatrix,
  normalize,
  scale,
  scaling,
  sub,
  translation
} from './math';

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const BG_KINDS = {
  solid: 0,
  gradient: 1,
  mesh: 2,
  spotlight: 3,
  studio: 0,
  ambient: 0,
  image: 0,
  backdrop: 0,
  transparent: 0
};

export class Renderer {
  constructor(canvas, { preserve = false, samples = 4 } = {}) {
    this.canvas = canvas;
    this.context = createContext(canvas, { preserve });
    this.gl = this.context.gl;
    this.samples = samples;
    const gl = this.gl;
    this.programs = {
      device: new Program(gl, DEVICE_VS, DEVICE_FS, 'device'),
      phone: new Program(gl, PHONE_VS, PHONE_FS, 'phone'),
      depth: new Program(gl, DEVICE_VS, DEPTH_FS, 'depth'),
      quad: new Program(gl, DEVICE_VS, QUAD_FS, 'quad'),
      quadDepth: new Program(gl, DEVICE_VS, QUAD_DEPTH_FS, 'quad-depth'),
      decal: new Program(gl, DEVICE_VS, DECAL_FS, 'decal'),
      shadow: new Program(gl, SHADOW_VS, SHADOW_FS, 'shadow'),
      shadowResolve: new Program(gl, FULLSCREEN_VS, SHADOW_RESOLVE_FS, 'shadow-resolve'),
      background: new Program(gl, FULLSCREEN_VS, BACKGROUND_FS, 'background'),
      downsample: new Program(gl, FULLSCREEN_VS, DOWNSAMPLE_FS, 'downsample'),
      composite: new Program(gl, FULLSCREEN_VS, COMPOSITE_FS, 'composite'),
      blit: new Program(gl, FULLSCREEN_VS, BLIT_FS, 'blit'),
      final: new Program(gl, FULLSCREEN_VS, FINAL_FS, 'final')
    };
    this.tri = fullscreen(gl);
    this.meshes = new Map();
    this.arts = new Map();
    this.chromes = new Map();
    this.media = new Map();
    this.backgroundImage = new ImageTexture(this.context);
    this.typeTexture = new ImageTexture(this.context);
    this.typeKey = null;
    this.overlayTexture = new ImageTexture(this.context);
    this.overlayKey = null;
    this.quadMesh = new Mesh(gl, {
      position: new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]),
      normal: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
      uv: new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]),
      index: new Uint16Array([0, 1, 2, 0, 2, 3])
    });
    this.blank = createTexture(gl, { width: 1, height: 1, internal: gl.RGBA8, levels: 1 });
    gl.bindTexture(gl.TEXTURE_2D, this.blank);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    this.size = null;
    this.lost = false;
    canvas.addEventListener?.('webglcontextlost', event => {
      event.preventDefault();
      this.lost = true;
    });
  }

  get maxSize() {
    return Math.min(this.context.maxTexture, this.context.maxRenderbuffer);
  }

  ensureTargets(width, height) {
    if (this.size && this.size[0] === width && this.size[1] === height) return;
    this.disposeTargets();
    const gl = this.gl;
    const samples = width * height > 5.5e6 ? Math.min(this.samples, 4) : this.samples;
    this.layer = new LayerTarget(this.context, width, height, { samples });
    const half = [Math.max(2, width >> 1), Math.max(2, height >> 1)];
    this.reflection = new LayerTarget(this.context, half[0], half[1], { samples: Math.min(2, this.samples) });
    const float = this.context.floatTargets;
    this.accum = new ColorTarget(gl, width, height, { internal: float ? gl.RGBA16F : gl.RGBA8 });
    this.layer.mrt = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.layer.mrt);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.layer.color, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.layer.depth, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.size = [width, height];
  }

  disposeTargets() {
    const gl = this.gl;
    if (this.layer) {
      if (this.layer.mrt) gl.deleteFramebuffer(this.layer.mrt);
      this.layer.dispose();
    }
    this.reflection?.dispose();
    this.accum?.dispose();
    this.layer = null;
    this.reflection = null;
    this.accum = null;
    this.shadowRaw = null;
    this.shadowMip = null;
    this.size = null;
  }

  setMedia(slot, source, width, height, { mips = true } = {}) {
    let texture = this.media.get(slot);
    if (!texture) {
      texture = new ImageTexture(this.context);
      this.media.set(slot, texture);
    }
    texture.upload(source, width, height, { mips });
    texture.aspect = width / height;
    return texture;
  }

  clearMedia(slot) {
    this.media.get(slot)?.dispose();
    this.media.delete(slot);
  }

  setBackgroundImage(source, width, height) {
    if (!source) {
      this.backgroundImage.dispose();
      this.backgroundImage.aspect = 0;
      return;
    }
    this.backgroundImage.upload(source, width, height, { mips: true });
    this.backgroundImage.aspect = width / height;
  }

  mesh(key, build) {
    if (!this.meshes.has(key)) this.meshes.set(key, build());
    return this.meshes.get(key);
  }

  slabMeshes(body) {
    const key = `slab|${body.w.toFixed(4)}|${body.h.toFixed(4)}|${body.radius.toFixed(4)}|${body.squircle ? 1 : 0}|${body.thickness.toFixed(4)}`;
    return this.mesh(key, () => {
      const geo = slabGeometry(body);
      return {
        front: new Mesh(this.gl, geo.front),
        back: new Mesh(this.gl, geo.back),
        band: new Mesh(this.gl, geo.band)
      };
    });
  }

  phoneMeshes(spec) {
    return this.mesh(`handheld|${spec.id}`, () => {
      const geo = phoneGeometry(spec);
      return {
        body: new Mesh(this.gl, geo.body),
        plateau: new Mesh(this.gl, geo.plateau),
        details: new Mesh(this.gl, geo.details)
      };
    });
  }

  artFor(item, pixelsPerUnit) {
    const { layout, device } = item;
    const scale = clamp(pixelsPerUnit, 64, 2400);
    const bucket = Math.pow(2, Math.ceil(Math.log2(scale) * 2) / 2);
    const capped = Math.min(bucket, (this.maxSize - 16) / Math.max(layout.body.w, layout.body.h));
    const key = [
      layout.type,
      device.finish,
      device.url,
      device.title,
      device.lights,
      device.notch,
      device.orientation,
      layout.body.w.toFixed(3),
      layout.body.h.toFixed(3),
      layout.screen.radius,
      capped.toFixed(1)
    ].join('|');
    if (this.arts.has(key)) return this.arts.get(key);
    const canvas = drawArt(layout, device, capped);
    let texture = null;
    if (canvas) {
      texture = new ImageTexture(this.context);
      texture.upload(canvas, canvas.width, canvas.height, { mips: true });
    }
    this.arts.set(key, texture);
    if (this.arts.size > 48) {
      const first = this.arts.keys().next().value;
      this.arts.get(first)?.dispose();
      this.arts.delete(first);
    }
    return texture;
  }

  chromeTexture(chrome) {
    const key = chrome.safari ? `safari|${chrome.url}` : 'status';
    const cached = this.chromes.get(key);
    if (cached) return cached;
    const art = drawChrome(chrome);
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, art.width, art.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, art.data);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const entry = { texture, statusV: art.statusV, barV: art.barV };
    this.chromes.set(key, entry);
    if (this.chromes.size > 12) {
      const first = this.chromes.keys().next().value;
      gl.deleteTexture(this.chromes.get(first).texture);
      this.chromes.delete(first);
    }
    return entry;
  }

  buildMips(target, texture, levels) {
    const gl = this.gl;
    const program = this.programs.downsample.use();
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    for (let level = 1; level < levels; level += 1) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, level - 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, level - 1);
      target.bindLevel(texture, level);
      const [w, h] = target.levelSize(level - 1);
      program
        .texture('uSource', texture)
        .set('uTexel', [1 / w, 1 / h])
        .set('uLevel', 0);
      this.tri.draw();
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, levels - 1);
  }

  buildShadowMips() {
    const gl = this.gl;
    const mip = this.shadowMip;
    const program = this.programs.downsample.use();
    gl.disable(gl.BLEND);
    for (let level = 1; level < mip.levels; level += 1) {
      gl.bindTexture(gl.TEXTURE_2D, mip.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, level - 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, level - 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, mip.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, mip.texture, level);
      const w = Math.max(1, mip.width >> level);
      const h = Math.max(1, mip.height >> level);
      gl.viewport(0, 0, w, h);
      program
        .texture('uSource', mip.texture)
        .set('uTexel', [1 / Math.max(1, mip.width >> (level - 1)), 1 / Math.max(1, mip.height >> (level - 1))])
        .set('uLevel', 0);
      this.tri.draw();
    }
    gl.bindTexture(gl.TEXTURE_2D, mip.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, mip.levels - 1);
  }

  lighting(scene, env) {
    return {
      uLightDir: scene.lightDir,
      uCamPos: scene.camera.eye,
      uAmbient: 0.56,
      uKey: 0.52,
      uEnvTop: env.top,
      uEnvHorizon: env.horizon,
      uEnvBottom: env.bottom,
      uGlare: clamp(scene.doc.light?.glare ?? 0.05, 0, 1),
      uScreenLight: 1
    };
  }

  drawPhone(item, scene, mode, extra = {}) {
    const { layout, model } = item;
    const base = extra.mirror ? multiply(extra.mirror, model) : model;
    const partModel = multiply(base, scaling(PHONE_MM));
    const s = layout.spec;
    const meshes = this.phoneMeshes(s);
    if (mode !== 'color') {
      const program = mode === 'depth' ? this.programs.depth : this.programs.shadow;
      program.set('uModel', partModel);
      if (mode === 'depth') program.set('uNormalMatrix', normalMatrix(partModel));
      program.set('uKind', 1).set('uBody', [1, 1]).set('uRadius', 0).set('uSquircle', 0);
      meshes.body.draw();
      meshes.plateau.draw();
      if (mode === 'depth') meshes.details.draw();
      return program;
    }
    const ph = layout.phone;
    const frame = phoneFrame(s);
    const plate = plateauOutline(s);
    const program = this.programs.phone.use();
    const media = item.slot !== null && item.slot !== undefined ? this.media.get(item.slot) : null;
    const win = windowShape(s);
    const key = this.studio?.key || [0, 0, 1];
    const inv = invert(partModel);
    const localKey = [
      inv[0] * key[0] + inv[4] * key[1] + inv[8] * key[2],
      inv[1] * key[0] + inv[5] * key[1] + inv[9] * key[2]
    ];
    const keyLength = Math.hypot(localKey[0], localKey[1]) || 1;
    const shadowDir = [-localKey[0] / keyLength, -localKey[1] / keyLength];
    const rough = ph.metal === 'polished' ? 0.14 : ph.metal === 'brushed' ? 0.3 : 0.4;
    const island = s.camera
      ? [s.camera.center[0], s.camera.center[1], s.camera.size[0] / 2, s.camera.size[1] / 2]
      : ph.island
        ? [0, s.h / 2 - s.bezel - 2.15 - ph.island[1] / 2, ph.island[0] / 2, ph.island[1] / 2]
        : null;
    const lenses = [...s.lenses, [1e4, 1e4], [1e4, 1e4]].slice(0, 3).flat();
    const chrome = layout.chrome?.status || layout.chrome?.safari ? this.chromeTexture(layout.chrome) : null;
    program
      .set('uModel', partModel)
      .set('uNormalMatrix', normalMatrix(partModel))
      .set('uOpacity', extra.opacity ?? 1)
      .set(
        'uMetal',
        ph.finish.rgb.map(c => Math.pow(c, 2.2))
      )
      .set('uRough', rough)
      .set('uBrushed', ph.metal === 'brushed' ? 1 : 0)
      .set('uGlass', ph.glass)
      .set('uGlassRough', ph.glassFinish === 'matte' ? 0.3 : 0.03)
      .set('uGlassLights', 1)
      .set('uSize', [s.w, s.h])
      .set('uMidZ', frame.mid)
      .set('uScreen', [s.w / 2 - s.bezel, s.h / 2 - s.bezel, s.screenCorner, s.exponent])
      .set('uScreenCenter', [0, 0])
      .set('uScreenCorners', [s.screenCorner, s.screenCorner])
      .set('uChin', 0)
      .set('uHasIsland', island ? 1 : 0)
      .set('uIsland', island || [0, 0, 1, 1])
      .set('uIslandRadius', island ? island[3] : 1)
      .set('uIslandCam', island ? [island[2] - island[3], 0, island[3] * 0.34] : [0, 0, 0])
      .texture('uMedia', media?.texture || this.blank)
      .set('uHasMedia', media?.texture ? 1 : 0)
      .set('uMediaXform', item.mediaXform)
      .set('uMediaCrop', item.crop)
      .set('uScreenFill', item.device.fill ? hexToRgb(item.device.fill) : [0.015, 0.015, 0.02])
      .set('uScreenGlow', ph.glow * (item.wake ?? 1))
      .set('uHasChrome', chrome ? 1 : 0)
      .texture('uChrome', chrome?.texture || this.blank)
      .set('uChromeLayout', chrome ? [layout.chrome.top, CHROME_BAR, chrome.statusV, chrome.barV] : [0, 0, 0, 0])
      .set('uChromeBar', [layout.chrome?.safari ? 1 : 0, 1 - 42 / PHONE_POINTS[1]])
      .set('uHasWindow', win ? 1 : 0)
      .set('uWindow', win ? [...win.center, ...win.half] : [0, 0, 1, 1])
      .set('uWindowCorners', win ? [win.top, win.bottom] : [1, 1])
      .set('uShadowDir', shadowDir)
      .set('uPlateau', [plate.center[0], plate.center[1], plate.w / 2, plate.h / 2])
      .set('uPlateauCorners', [plate.r, plate.low])
      .setArray('uLenses', lenses, 2)
      .set('uLensOuter', s.lens.outer)
      .set('uFlash', s.flash)
      .set('uLidar', s.lidar)
      .set('uMic', s.mic)
      .set(
        'uControl',
        s.control ? [s.h / 2 - s.control.at, frame.mid, s.control.length / 2, s.control.height / 2] : [1e4, 0, 1, 1]
      )
      .set('uAntenna', s.antenna ? s.h / 2 - s.antenna : 1e4)
      .set('uPortEdge', s.port === 'right' ? 1 : 0)
      .set('uHasPort', 1)
      .set('uTrackpad', [1e4, 1e4, 1, 1])
      .set('uGrille', [1e4, 1e4, 1e4, 1e4])
      .set('uKeyboard', [0, 0, 1, 1])
      .texture('uLegend', this.blank);
    meshes.body.draw();
    meshes.plateau.draw();
    meshes.details.draw();
    return program;
  }

  drawDeviceParts(item, scene, mode, extra = {}) {
    const { layout, model } = item;
    if (layout.type === 'laptop' || layout.type === 'monitor') return this.drawHardware(item, scene, mode, extra);
    if (layout.spec) return this.drawPhone(item, scene, mode, extra);
    const program =
      mode === 'depth' ? this.programs.depth : mode === 'shadow' ? this.programs.shadow : this.programs.device;
    if (mode === 'color')
      program
        .use()
        .set('uOpacity', extra.opacity ?? 1)
        .set('uFlatChrome', ['browser', 'window', 'card'].includes(layout.type) ? 1 : 0);
    const base = extra.mirror ? multiply(extra.mirror, model) : model;
    const ppu = scene.pixelsPerUnit * (item.device.scale || 1) * (extra.artScale || 1);
    const setCommon = (partModel, kind, body, squircle) => {
      program.set('uModel', partModel);
      if (mode !== 'shadow') program.set('uNormalMatrix', normalMatrix(partModel));
      program
        .set('uKind', kind)
        .set('uBody', [body.w, body.h])
        .set('uRadius', body.radius)
        .set('uSquircle', squircle ? 1 : 0);
    };
    const drawSlab = (partModel, body, front) => {
      const meshes = this.slabMeshes(body);
      const squircle = body.squircle;
      if (mode === 'color') {
        program.set('uBandColor', layout.band).set('uMetal', layout.metal).set('uGloss', layout.gloss);
      }
      setCommon(partModel, 1, body, squircle);
      meshes.band.draw();
      const twoSided = mode === 'color' && Boolean(item.device.twoSided);
      if (mode === 'color') program.set('uTwoSided', twoSided ? 1 : 0);
      if (twoSided) front.setup?.();
      setCommon(partModel, 2, body, squircle);
      meshes.back.draw();
      if (mode === 'color') program.set('uTwoSided', 0);
      setCommon(partModel, front.kind, body, squircle);
      if (mode === 'color') front.setup?.();
      meshes.front.draw();
    };
    const screenSetup = () => {
      const art = this.artFor(item, ppu);
      const media = item.slot !== null && item.slot !== undefined ? this.media.get(item.slot) : null;
      const { body, screen } = layout;
      program.texture('uArt', art?.texture || this.blank).set('uHasArt', art?.texture ? 1 : 0);
      program.set('uScreenRect', [
        screen.x / body.w,
        screen.y / body.h,
        (screen.x + screen.w) / body.w,
        (screen.y + screen.h) / body.h
      ]);
      program.set('uScreenRadius', screen.radius);
      program.texture('uMedia', media?.texture || this.blank).set('uHasMedia', media?.texture ? 1 : 0);
      program.set('uMediaXform', item.mediaXform).set('uMediaCrop', item.crop);
      program.set('uScreenFill', item.device.fill ? hexToRgb(item.device.fill) : [0.04, 0.04, 0.05]);
      program.set('uBodyColor', layout.bodyColor);
    };

    drawSlab(base, layout.body, { kind: 0, setup: screenSetup });
    return program;
  }

  hardwareMeshes(type) {
    return this.mesh(`hardware|${type}`, () => {
      const geo = type === 'laptop' ? laptopGeometry() : displayGeometry();
      return Object.fromEntries(Object.entries(geo).map(([name, data]) => [name, new Mesh(this.gl, data)]));
    });
  }

  legendTexture() {
    if (!this.legends) {
      const { canvas } = drawLegends(LAPTOP, 12);
      this.legends = new ImageTexture(this.context);
      this.legends.upload(canvas, canvas.width, canvas.height, { mips: true });
    }
    return this.legends;
  }

  drawHardware(item, scene, mode, extra = {}) {
    const { layout, model } = item;
    const base = extra.mirror ? multiply(extra.mirror, model) : model;
    const k = PHONE_MM;
    const meshes = this.hardwareMeshes(layout.type);
    const parts = [];
    if (layout.type === 'laptop') {
      const { lid, deck, axis } = laptopParts(layout);
      parts.push({ model: multiply(base, multiply(deck, scaling(k))), mesh: meshes.base, role: 'base' });
      parts.push({ model: multiply(base, multiply(lid, scaling(k))), mesh: meshes.lid, role: 'lid' });
      parts.push({ model: multiply(base, multiply(axis, scaling(k))), mesh: meshes.hinge, role: 'hinge' });
    } else {
      const scaled = multiply(base, scaling(k));
      parts.push({ model: scaled, mesh: meshes.panel, role: 'panel' });
      parts.push({ model: scaled, mesh: meshes.stand, role: 'stand' });
    }
    if (mode !== 'color') {
      const program = mode === 'depth' ? this.programs.depth : this.programs.shadow;
      parts.forEach(part => {
        program.set('uModel', part.model);
        if (mode === 'depth') program.set('uNormalMatrix', normalMatrix(part.model));
        program.set('uKind', 1).set('uBody', [1, 1]).set('uRadius', 0).set('uSquircle', 0);
        part.mesh.draw();
      });
      return program;
    }
    const s = layout.spec;
    const hw = layout.hardware;
    const legends = layout.type === 'laptop' ? this.legendTexture().texture : this.blank;
    const program = this.programs.phone.use();
    const media = item.slot !== null && item.slot !== undefined ? this.media.get(item.slot) : null;
    const rough = hw.metal === 'polished' ? 0.14 : hw.metal === 'brushed' ? 0.3 : 0.4;
    program
      .set('uOpacity', extra.opacity ?? 1)
      .set(
        'uMetal',
        hw.finish.rgb.map(c => Math.pow(c, 2.2))
      )
      .set('uRough', rough)
      .set('uBrushed', hw.metal === 'brushed' ? 1 : 0)
      .set('uGlass', hw.glass)
      .set('uGlassRough', hw.glassFinish === 'matte' ? 0.3 : 0.03)
      .set('uGlassLights', 0.08)
      .texture('uMedia', media?.texture || this.blank)
      .set('uHasMedia', media?.texture ? 1 : 0)
      .set('uMediaXform', item.mediaXform)
      .set('uMediaCrop', item.crop)
      .set('uScreenFill', item.device.fill ? hexToRgb(item.device.fill) : [0.015, 0.015, 0.02])
      .set('uScreenGlow', hw.glow * (item.wake ?? 1))
      .set('uHasChrome', 0)
      .texture('uChrome', this.blank)
      .set('uHasWindow', 0)
      .set('uHasPort', 0)
      .set('uAntenna', 1e4)
      .set('uControl', [1e4, 0, 1, 1])
      .set('uPlateau', [1e4, 1e4, 1, 1])
      .set('uPlateauCorners', [1, 1])
      .setArray('uLenses', [1e4, 1e4, 1e4, 1e4, 1e4, 1e4], 2)
      .set('uFlash', [1e4, 1e4, 1])
      .set('uLidar', [1e4, 1e4, 1])
      .set('uMic', [1e4, 1e4, 1])
      .set('uShadowDir', [0, -1]);
    if (layout.type === 'laptop') {
      const L = s.lid;
      const screenW = s.w - L.bezelSide * 2;
      const screenH = L.h - L.bezelTop - L.bezelBottom;
      const screenTop = L.h / 2 - L.bezelTop;
      const [nw, nh, nr] = L.notch;
      const { rect } = keyboardKeys(s);
      const kbBottom = rect[1];
      const pad = s.trackpad;
      const grilleIn = rect[2] / 2 + s.grille.inset;
      program
        .set('uSize', [s.w, L.h])
        .set('uScreen', [screenW / 2, screenH / 2, L.screenTop, L.exponent])
        .set('uScreenCenter', [0, (L.bezelBottom - L.bezelTop) / 2])
        .set('uScreenCorners', [L.screenTop, L.screenBottom])
        .set('uChin', L.bezelBottom - L.bezelSide)
        .set('uHasIsland', 1)
        .set('uIsland', [0, screenTop - nh + (nh + nr) / 2, nw / 2, (nh + nr) / 2])
        .set('uIslandRadius', nr)
        .set('uIslandCam', [0, -nr / 2, 0.95])
        .set('uKeyboard', rect)
        .texture('uLegend', legends)
        .set('uTrackpad', [0, kbBottom - pad.gap - pad.h / 2, pad.w / 2, pad.h / 2])
        .set('uTrackpadRadius', pad.corner)
        .set('uGrille', [grilleIn, s.w / 2 - s.grille.inset - s.base.top, rect[1], rect[1] + rect[3]])
        .set('uGrillePitch', [s.grille.pitch, s.grille.hole]);
    } else {
      const screenW = s.w - s.bezel * 2;
      const screenH = s.h - s.bezel * 2;
      program
        .set('uSize', [s.w, s.h])
        .set('uScreen', [screenW / 2, screenH / 2, s.screenCorner, 2])
        .set('uScreenCenter', [0, 0])
        .set('uScreenCorners', [s.screenCorner, s.screenCorner])
        .set('uChin', 0)
        .set('uHasIsland', 1)
        .set('uIsland', [0, s.h / 2 - s.bezel / 2, 1.4, 1.4])
        .set('uIslandRadius', 1.4)
        .set('uIslandCam', [0, 0, 1.0])
        .set('uKeyboard', [0, 0, 1, 1])
        .texture('uLegend', this.blank)
        .set('uTrackpad', [1e4, 1e4, 1, 1])
        .set('uTrackpadRadius', 1)
        .set('uGrille', [1e4, 1e4, 1e4, 1e4])
        .set('uGrillePitch', [1, 0.1]);
    }
    parts.forEach(part => {
      program.set('uModel', part.model).set('uNormalMatrix', normalMatrix(part.model));
      part.mesh.draw();
    });
    return program;
  }

  ensureShadowMaps(size) {
    if (this.shadowMip?.width === size) return;
    this.disposeShadowMaps();
    const gl = this.gl;
    const float = this.context.floatTargets;
    const internal = float ? gl.RG16F : gl.RGBA8;
    this.shadowRaw = new ColorTarget(gl, size * 2, size * 2, { internal });
    const levels = Math.max(1, Math.floor(Math.log2(size)) - 1);
    this.shadowMip = {
      texture: createTexture(gl, { width: size, height: size, internal, levels }),
      width: size,
      height: size,
      levels,
      fbo: gl.createFramebuffer()
    };
  }

  disposeShadowMaps() {
    const gl = this.gl;
    this.shadowRaw?.dispose();
    if (this.shadowMip) {
      gl.deleteTexture(this.shadowMip.texture);
      gl.deleteFramebuffer(this.shadowMip.fbo);
    }
    this.shadowRaw = null;
    this.shadowMip = null;
  }

  renderShadows(scene, strength) {
    const info = scene.shadow;
    if (!info) return null;
    const gl = this.gl;
    const float = this.context.floatTargets;
    const size = scene.preview ? 1024 : 2048;
    this.ensureShadowMaps(size);
    const heightScale = float ? 1 : 1 / Math.max(info.maxHeight * 1.2, 1e-3);
    this.shadowRaw.begin();
    gl.clearColor(float ? 1e4 : 1, 1, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.MIN);
    gl.disable(gl.DEPTH_TEST);
    const program = this.programs.shadow.use();
    program
      .set('uNormal', info.normal)
      .set('uOffset', info.offset)
      .set('uLight', scene.lightDir)
      .set('uFacing', info.facing)
      .set('uAxisU', info.axisU)
      .set('uAxisV', info.axisV)
      .set('uRegion', [info.origin[0], info.origin[1], info.side])
      .set('uHeightScale', heightScale);
    scene.devices.forEach(item => {
      if (item.device.hidden || item.device.shadow === false || (item.opacity ?? 1) < 0.01) return;
      program.set('uOpacity', item.opacity ?? 1);
      this.drawDeviceParts(item, scene, 'shadow');
    });
    gl.blendEquation(gl.FUNC_ADD);
    gl.disable(gl.BLEND);
    const mip = this.shadowMip;
    gl.bindFramebuffer(gl.FRAMEBUFFER, mip.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, mip.texture, 0);
    gl.viewport(0, 0, mip.width, mip.height);
    this.programs.shadowResolve
      .use()
      .texture('uSource', this.shadowRaw.texture)
      .set('uTexel', [1 / (size * 2), 1 / (size * 2)]);
    this.tri.draw();
    this.buildShadowMips();
    const perUnit = size / info.side;
    const heightLod = Math.log2(Math.max((scene.size * 0.16 * perUnit) / 0.85, 1));
    return {
      heightScale,
      strength,
      shape: [
        Math.max(1.2, info.sharp * perUnit),
        info.spread * perUnit,
        info.ambient * perUnit,
        Math.min(heightLod, mip.levels - 1)
      ],
      contact: [info.contact[0] * perUnit, info.contactHeight[0], info.contact[1] * perUnit, info.contactHeight[1]]
    };
  }

  renderReflection(scene, env) {
    const gl = this.gl;
    const target = this.reflection;
    const plane = scene.plane;
    const mirror = chain(translation(0, plane[3] * 2, 0), scaling(1, -1, 1));
    target.beginColor();
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.prepareColor(scene, env, 1);
    this.drawColorItems(scene, scene.devices, { mirror, artScale: 0.5 });
    target.resolveColor();
    target.beginDepth();
    const depth = this.programs.depth.use();
    depth
      .set('uView', scene.camera.view)
      .set('uProj', scene.camera.proj)
      .set('uFloat', this.context.floatTargets ? 1 : 0)
      .set('uDepthScale', 1 / Math.max(scene.size * 6, 1e-3))
      .set('uHeightMode', 1)
      .set('uPlane', [0, 1, 0, plane[3]]);
    gl.disable(gl.BLEND);
    scene.devices.forEach(item => {
      if (item.device.hidden) return;
      this.drawDeviceParts(item, scene, 'depth', { mirror });
    });
    gl.disable(gl.DEPTH_TEST);
    this.buildMips(target, target.color, target.levels);
    this.buildMips(target, target.depth, target.levels);
  }

  prepareColor(scene, env, mirrored) {
    const device = this.programs.device.use();
    Object.entries(this.lighting(scene, env)).forEach(([key, value]) => device.set(key, value));
    device
      .set('uView', scene.camera.view)
      .set('uProj', scene.camera.proj)
      .set('uMirrored', mirrored)
      .set('uPlane', [0, 0, 0, 0])
      .setArray('uLightPos', env.studio.positions, 4)
      .setArray('uLightColor', env.studio.colors, 4)
      .set('uSkyTop', env.studio.top)
      .set('uSkyHorizon', env.studio.horizon)
      .set('uSkyGround', env.studio.ground)
      .set('uExposure', env.studio.exposure);
    const phone = this.programs.phone.use();
    phone.set('uView', scene.camera.view).set('uProj', scene.camera.proj).set('uCamPos', scene.camera.eye);
    const studio = env.studio;
    this.studio = studio;
    phone
      .setArray('uLightPos', studio.positions, 4)
      .setArray('uLightColor', studio.colors, 4)
      .set('uSkyTop', studio.top)
      .set('uSkyHorizon', studio.horizon)
      .set('uSkyGround', studio.ground)
      .set('uExposure', studio.exposure);
  }

  studioFor(scene, background) {
    const light = scene.doc.light || {};
    const lin = background.map(c => Math.pow(clamp(c, 0, 1), 2.2));
    const t = clamp((luminance(background) - 0.12) / 0.6, 0, 1);
    const turn = (clamp(light.angle ?? -24, -90, 90) + 24) * DEG * 0.6;
    const lift = (clamp(light.height ?? 58, 8, 89) - 58) / 60;
    const center = scene.center || scene.camera.target;
    const size = scene.size;
    const place = ([x, y, z], radius) => {
      const c = Math.cos(turn);
      const sn = Math.sin(turn);
      const rx = x * c + z * sn;
      const rz = -x * sn + z * c;
      return [center[0] + rx * size, center[1] + (y + lift) * size, center[2] + rz * size, radius * size];
    };
    const keep = 1 - t * 0.3;
    const rig = [
      { p: place([-1.25, 1.3, 1.3], 0.55), c: [6.4, 6.25, 6.0].map(v => v * keep), g: 1 },
      { p: place([-2.3, -0.05, 0.35], 0.42), c: [3.0, 2.95, 2.9].map(v => v * keep), g: 1 },
      { p: place([0.3, 2.4, -0.5], 0.7), c: [2.2, 2.2, 2.25].map(v => v * keep), g: 1 },
      { p: place([2.3, 0.6, -0.9], 0.42), c: [2.4, 2.4, 2.5].map(v => v * keep), g: 1 },
      { p: place([0.15, 1.0, 2.7], 1.35), c: [1.5, 1.5, 1.52].map(v => v * (1 - t * 0.5)), g: 0 },
      { p: place([0, -2.6, 0.6], 1.6), c: lin.map(v => v * (0.6 + t * 0.6)), g: 0.3 }
    ];
    const dark = { top: [0.03, 0.03, 0.033], horizon: [0.012, 0.012, 0.013], ground: [0.004, 0.004, 0.004] };
    const bright = { top: [0.46, 0.46, 0.48], horizon: [0.24, 0.24, 0.25], ground: lin.map(c => c * 0.24) };
    const top = mixRgb(dark.top, bright.top, t);
    const horizon = mixRgb(dark.horizon, bright.horizon, t);
    const ground = mixRgb(dark.ground, bright.ground, t);
    const keyPos = rig[0].p;
    return {
      key: normalize([keyPos[0] - center[0], keyPos[1] - center[1], keyPos[2] - center[2]]),
      positions: rig.flatMap(item => item.p),
      colors: rig.flatMap(item => [...item.c, item.g]),
      top: mixRgb(top, lin, 0.3),
      horizon: mixRgb(
        horizon,
        lin.map(c => c * 0.9),
        0.55
      ),
      ground: mixRgb(
        ground,
        lin.map(c => c * 0.5),
        0.5
      ),
      exposure: 1
    };
  }

  envFor(scene, bgColor) {
    const lum = luminance(bgColor);
    const dark = { top: [0.62, 0.63, 0.66], horizon: [0.26, 0.26, 0.28], bottom: [0.05, 0.05, 0.06] };
    const light = { top: [1.0, 1.0, 1.0], horizon: [0.78, 0.78, 0.8], bottom: [0.42, 0.42, 0.44] };
    const t = clamp((lum - 0.08) / 0.7, 0, 1);
    return {
      top: mixRgb(dark.top, light.top, t),
      horizon: mixRgb(dark.horizon, light.horizon, t),
      bottom: mixRgb(dark.bottom, light.bottom, t),
      studio: this.studioFor(scene, bgColor)
    };
  }

  composite(target, scene, { opacity = 1, sharp = false } = {}) {
    const gl = this.gl;
    this.accum.begin();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    const program = this.programs.composite.use();
    const maxLod = target.levels - 1;
    const dilate = clamp(Math.ceil(Math.log2(Math.max(scene.cocScale * 0.35, 4))), 2, maxLod);
    program
      .texture('uColor', target.color)
      .texture('uDepth', target.depth)
      .set('uFloat', this.context.floatTargets ? 1 : 0)
      .set('uDepthScale', this.depthScale)
      .set('uFocus', scene.focusDepth)
      .set('uCocScale', scene.cocScale)
      .set('uMaxLod', maxLod)
      .set('uDilateLod', dilate)
      .set('uOpacity', opacity)
      .set('uSharp', sharp || scene.cocScale < 0.25 ? 1 : 0);
    this.tri.draw();
  }

  render(scene, options = {}) {
    if (this.lost) return;
    const gl = this.gl;
    const { width, height } = scene;
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    this.ensureTargets(width, height);
    const float = this.context.floatTargets;
    this.depthScale = float ? 1 : 1 / Math.max(scene.camera.far, 1);
    const doc = scene.doc;
    const bg = doc.background || {};
    const colors = (bg.colors || []).map(hexToRgb);
    while (colors.length < 4) colors.push(colors[colors.length - 1] || [0.05, 0.05, 0.06]);
    const transparent = bg.kind === 'transparent';
    const env = this.envFor(scene, transparent ? [0.3, 0.3, 0.3] : colors[0]);
    const light = doc.light || {};
    const shadowStrength = clamp(light.shadow ?? 0.5, 0, 1);

    gl.disable(gl.SCISSOR_TEST);
    this.accum.begin();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let shadow = null;
    if (shadowStrength > 0.001 && scene.devices.length) shadow = this.renderShadows(scene, shadowStrength);
    const reflect = clamp(light.reflection ?? 0, 0, 1) > 0.001 && scene.receiver === 'floor';
    if (reflect) this.renderReflection(scene, env);

    const layer = this.layer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, layer.mrt);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    const program = this.programs.background.use();
    const studio = bg.kind === 'studio';
    const kind = BG_KINDS[bg.kind] ?? 0;
    const imageKinds =
      bg.kind === 'ambient' || bg.kind === 'image' || bg.kind === 'backdrop' || bg.kind === 'reactbits';
    const ambientSource = bg.kind === 'ambient' ? this.media.get(bg.slot ?? 0) : null;
    const image = imageKinds
      ? ambientSource?.texture
        ? ambientSource
        : this.backgroundImage.texture
          ? this.backgroundImage
          : null
      : null;
    let xform = [1, 1, 0, 0];
    if (image) {
      const canvasAspect = width / height;
      const zoomIn = bg.kind === 'ambient' ? 1.25 : 1;
      if (image.aspect > canvasAspect) {
        const fx = canvasAspect / image.aspect / zoomIn;
        xform = [fx, 1 / zoomIn, (1 - fx) / 2, (1 - 1 / zoomIn) / 2];
      } else {
        const fy = image.aspect / canvasAspect / zoomIn;
        xform = [1 / zoomIn, fy, (1 - 1 / zoomIn) / 2, (1 - fy) / 2];
      }
    }
    const imageBlur =
      bg.kind === 'ambient'
        ? Math.log2(Math.max(2, width * 0.06 * (bg.blur ?? 1)))
        : (bg.blur ?? 0) > 0
          ? Math.log2(1 + width * 0.02 * bg.blur)
          : 0;
    const center = scene.camera.target;
    program
      .set('uInvViewProj', scene.camera.invViewProj)
      .set('uCamPos', scene.camera.eye)
      .set('uKind', kind)
      .set('uColorA', colors[0])
      .set('uColorB', colors[1])
      .set('uColorC', colors[2])
      .set('uColorD', colors[3])
      .set('uAngle', bg.angle ?? 90)
      .set('uAspect', [width / Math.max(width, height), height / Math.max(width, height)])
      .set('uStudio', studio ? 1 : 0)
      .set('uFloorY', scene.floorY)
      .set('uWallZ', scene.wallZ)
      .set('uCurve', scene.size * 1.1)
      .set('uFloorColor', colors[0])
      .set('uWallColor', colors[1])
      .set('uPoolCenter', [center[0], scene.floorY, center[2]])
      .set('uPoolRadius', scene.size * (bg.pool ?? 1.1))
      .set('uPoolStrength', bg.light ?? 0.35)
      .set('uSpot', bg.spot ?? (bg.kind === 'spotlight' ? 0.35 : 0))
      .set('uSpotCenter', bg.spotCenter || [0.5, 0.62])
      .set('uSpotSize', bg.spotSize ?? 0.42)
      .set('uVignette', transparent ? 0 : (doc.finish?.vignette ?? 0.18))
      .texture('uImage', image?.texture || this.blank)
      .set('uHasImage', image ? 1 : 0)
      .set('uImageXform', xform)
      .set('uImageBlur', imageBlur)
      .set('uImageDim', bg.dim ?? (bg.kind === 'ambient' ? 0.45 : 0))
      .set('uImageSaturation', bg.saturation ?? (bg.kind === 'ambient' ? 1.15 : 1))
      .texture('uShadow', shadow ? this.shadowMip.texture : this.blank)
      .set('uHasShadow', shadow ? 1 : 0)
      .set('uShadowOpacity', shadowStrength)
      .set('uShadowHeightScale', shadow ? shadow.heightScale : 1)
      .set('uShadowMaxLod', shadow ? this.shadowMip.levels - 1 : 0)
      .set('uShadowTint', mixRgb(hexToRgb(light.tint || '#000000'), [0, 0, 0], 0.4))
      .set('uShadowAxisU', scene.shadow?.axisU || [1, 0, 0])
      .set('uShadowAxisV', scene.shadow?.axisV || [0, 1, 0])
      .set(
        'uShadowRegion',
        scene.shadow ? [scene.shadow.origin[0], scene.shadow.origin[1], scene.shadow.side] : [0, 0, 1]
      )
      .set('uShadowShape', shadow ? shadow.shape : [1, 1, 1, 1])
      .set('uShadowContact', shadow ? shadow.contact : [1, 1, 1, 1])
      .set('uShadowFloor', scene.receiver === 'floor' ? 1 : 0)
      .texture('uReflection', reflect ? this.reflection.color : this.blank)
      .texture('uReflectionDepth', reflect ? this.reflection.depth : this.blank)
      .set('uHasReflection', reflect ? 1 : 0)
      .set('uReflectionStrength', clamp(light.reflection ?? 0, 0, 1))
      .set('uReflectionBlur', scene.pixelsPerUnit * 0.5 * (0.4 + (light.softness ?? 0.5)))
      .set('uReflectionMaxLod', this.reflection.levels - 1)
      .set('uFloat', float ? 1 : 0)
      .set('uDepthScale', this.depthScale)
      .set('uTime', scene.time)
      .set('uTransparent', transparent ? 1 : 0);
    this.tri.draw();
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    if (scene.cocScale >= 0.25) {
      this.buildMips(layer, layer.color, layer.levels);
      this.buildMips(layer, layer.depth, layer.levels);
    }
    this.composite(layer, scene);

    const type = options.type;
    const order = this.layerOrder(scene, type);
    order.forEach(entry => {
      if (entry.kind === 'type') this.renderTypeLayer(scene, type, env);
      else this.renderDeviceLayer(scene, entry.items, env);
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    const final = this.programs.final.use();
    const overlay = options.overlay;
    if (overlay && overlay.key !== this.overlayKey) {
      this.overlayTexture.upload(overlay.canvas, overlay.canvas.width, overlay.canvas.height, { mips: false });
      this.overlayKey = overlay.key;
    }
    final
      .texture('uSource', this.accum.texture)
      .texture('uOverlay', overlay ? this.overlayTexture.texture : this.blank)
      .set('uHasOverlay', overlay ? 1 : 0)
      .set('uGrain', transparent ? 0 : clamp(doc.finish?.grain ?? 0.12, 0, 1))
      .set('uSeed', options.seed ?? Math.floor(scene.time * 24) % 97)
      .set('uSize', [width, height])
      .set('uOpaque', transparent ? 0 : 1)
      .set('uBackdrop', colors[0]);
    this.tri.draw();
  }

  layerOrder(scene, type) {
    const groups = new Map();
    scene.devices.forEach(item => {
      if (item.device.hidden) return;
      const key =
        item.device.layer ??
        (scene.devices.length > 6 || scene.motion?.each || scene.motion?.group ? 'all' : `d${item.index}`);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const entries = [...groups.values()].map(items => {
      const depth = Math.max(...items.map(item => scene.depthOf([item.model[12], item.model[13], item.model[14]])));
      return { kind: 'devices', items, depth };
    });
    if (type && type.canvas) entries.push({ kind: 'type', depth: type.depth });
    return entries.sort((a, b) => b.depth - a.depth);
  }

  drawColorItems(scene, items, extra = {}) {
    const gl = this.gl;
    const faded = [];
    items.forEach(item => {
      if (item.device.hidden) return;
      const opacity = item.opacity ?? clamp(item.device.opacity ?? 1, 0, 1);
      if (opacity < 0.002) return;
      if (opacity < 0.998) {
        faded.push({ item, opacity, depth: scene.depthOf([item.model[12], item.model[13], item.model[14]]) });
        return;
      }
      this.drawDeviceParts(item, scene, 'color', { ...extra, opacity: 1 });
    });
    faded
      .sort((a, b) => b.depth - a.depth)
      .forEach(({ item, opacity }) => {
        gl.colorMask(false, false, false, false);
        this.drawDeviceParts(item, scene, 'color', { ...extra, opacity: 1 });
        gl.colorMask(true, true, true, true);
        gl.depthMask(false);
        this.drawDeviceParts(item, scene, 'color', { ...extra, opacity });
        gl.depthMask(true);
      });
  }

  drawRestShadows(scene, items) {
    const resting = items.filter(item => item.device.rest);
    if (!resting.length) return;
    const gl = this.gl;
    const decal = this.programs.decal.use();
    decal.set('uView', scene.camera.view).set('uProj', scene.camera.proj).set('uPlane', [0, 0, 0, 0]);
    gl.depthMask(false);
    resting.forEach(item => {
      const { body } = item.layout;
      const soft = Math.min(body.w, body.h) * 0.07;
      const pad = soft * 2.6;
      const model = multiply(
        item.model,
        chain(translation(0, 0, -body.thickness / 2 - 0.0006), scaling(body.w + pad * 2, body.h + pad * 2, 1))
      );
      decal
        .set('uModel', model)
        .set('uNormalMatrix', normalMatrix(model))
        .set('uBody', [body.w, body.h])
        .set('uPad', [pad, pad])
        .set('uRadius', body.radius || 0)
        .set('uSoft', soft)
        .set('uStrength', 0.55 * (item.opacity ?? 1));
      this.quadMesh.draw();
    });
    gl.depthMask(true);
  }

  renderDeviceLayer(scene, items, env) {
    const gl = this.gl;
    const layer = this.layer;
    layer.beginColor();
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.drawRestShadows(scene, items);
    this.prepareColor(scene, env, 0);
    this.drawColorItems(scene, items);
    layer.resolveColor();
    layer.beginDepth();
    gl.disable(gl.BLEND);
    const depth = this.programs.depth.use();
    depth
      .set('uView', scene.camera.view)
      .set('uProj', scene.camera.proj)
      .set('uFloat', this.context.floatTargets ? 1 : 0)
      .set('uDepthScale', this.depthScale)
      .set('uHeightMode', 0)
      .set('uPlane', [0, 0, 0, 0]);
    items.forEach(item => this.drawDeviceParts(item, scene, 'depth'));
    gl.disable(gl.DEPTH_TEST);
    if (scene.cocScale >= 0.25) {
      this.buildMips(layer, layer.color, layer.levels);
      this.buildMips(layer, layer.depth, layer.levels);
    }
    this.composite(layer, scene);
  }

  renderTypeLayer(scene, type) {
    const gl = this.gl;
    const layer = this.layer;
    if (type.key !== this.typeKey) {
      this.typeTexture.upload(type.canvas, type.canvas.width, type.canvas.height, { mips: true });
      this.typeKey = type.key;
    }
    layer.beginColor();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    const quad = this.programs.quad.use();
    quad
      .set('uView', scene.camera.view)
      .set('uProj', scene.camera.proj)
      .set('uModel', type.model)
      .set('uNormalMatrix', normalMatrix(type.model))
      .set('uPlane', [0, 0, 0, 0])
      .texture('uTexture', this.typeTexture.texture)
      .set('uOpacity', type.opacity);
    this.quadMesh.draw();
    layer.resolveColor();
    layer.beginDepth();
    gl.disable(gl.BLEND);
    const depth = this.programs.quadDepth.use();
    depth
      .set('uView', scene.camera.view)
      .set('uProj', scene.camera.proj)
      .set('uModel', type.model)
      .set('uNormalMatrix', normalMatrix(type.model))
      .set('uPlane', [0, 0, 0, 0])
      .texture('uTexture', this.typeTexture.texture)
      .set('uFloat', this.context.floatTargets ? 1 : 0)
      .set('uDepthScale', this.depthScale);
    this.quadMesh.draw();
    if (scene.cocScale >= 0.25) {
      this.buildMips(layer, layer.color, layer.levels);
      this.buildMips(layer, layer.depth, layer.levels);
    }
    this.composite(layer, scene);
  }

  readPixels() {
    const gl = this.gl;
    const [width, height] = this.size;
    const pixels = new Uint8Array(width * height * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels;
  }

  dispose() {
    this.disposeTargets();
    this.disposeShadowMaps();
    Object.values(this.programs).forEach(program => program.dispose());
    this.meshes.forEach(group => Object.values(group).forEach(mesh => mesh.dispose()));
    this.meshes.clear();
    this.arts.forEach(texture => texture?.dispose());
    this.arts.clear();
    this.chromes.forEach(entry => this.gl.deleteTexture(entry.texture));
    this.chromes.clear();
    this.media.forEach(texture => texture.dispose());
    this.media.clear();
    this.backgroundImage.dispose();
    this.legends?.dispose();
    this.typeTexture.dispose();
    this.overlayTexture.dispose();
    this.quadMesh.dispose();
    this.tri.dispose();
    this.gl.deleteTexture(this.blank);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export function typePlacement(scene, typeDoc, canvasInfo) {
  if (!canvasInfo) return null;
  const { camera } = scene;
  const { basis } = camera;
  const position = typeDoc.position || 'behind';
  const distance = camera.distance;
  const depthFactor = clamp(typeDoc.depth ?? 0.45, 0, 1);
  const behind = position === 'behind';
  const planeDistance = behind ? distance + (scene.size * 0.15 + distance * 0.55 * depthFactor) : distance;
  const frameW = 2 * camera.tanX * planeDistance;
  const frameH = 2 * camera.tanY * planeDistance;
  const aspect = canvasInfo.width / canvasInfo.height;
  let w = frameW * clamp(typeDoc.size ?? 0.8, 0.05, 1.6);
  let h = w / aspect;
  if (h > frameH * 0.92) {
    h = frameH * 0.92;
    w = h * aspect;
  }
  let offsetY = 0;
  if (position === 'top') offsetY = frameH / 2 - h / 2 - frameH * 0.06;
  else if (position === 'bottom') offsetY = -(frameH / 2 - h / 2 - frameH * 0.06);
  else offsetY = frameH * (typeDoc.offset ?? 0.04);
  const center = sub(camera.eye, scale(basis.w, planeDistance));
  const pos = [center[0] + basis.v[0] * offsetY, center[1] + basis.v[1] * offsetY, center[2] + basis.v[2] * offsetY];
  const rot = [
    basis.u[0],
    basis.u[1],
    basis.u[2],
    0,
    basis.v[0],
    basis.v[1],
    basis.v[2],
    0,
    basis.w[0],
    basis.w[1],
    basis.w[2],
    0,
    0,
    0,
    0,
    1
  ];
  const model = chain(translation(pos[0], pos[1], pos[2]), rot, scaling(w, h, 1));
  const viewDepth = dot(sub(camera.eye, pos), basis.w);
  return { model, depth: viewDepth };
}

export { IDENTITY };
