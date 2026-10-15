import { hexToRgb } from '../engine/assets';
import { STATS_GLSL, imageStats } from '../engine/stats';

const CELLS = `
${STATS_GLSL}
uniform vec2 uCellPx;
uniform vec2 uImage;
uniform float uLod;
uniform float uInvert;

void main() {
  vec2 origin = floor(gl_FragCoord.xy) * uCellPx;
  vec3 sum = vec3(0.0);
  for (int y = 0; y < 4; y++) {
    for (int x = 0; x < 4; x++) {
      vec2 p = origin + (vec2(float(x), float(y)) + 0.5) * 0.25 * uCellPx;
      sum += textureLod(uInput, min(p, uImage - 0.5) / uImage, uLod).rgb;
    }
  }
  vec3 color = sum / 16.0;
  float l = luma(color);
  l = clamp(mix(l, autoLevel(l), 0.55), 0.0, 1.0);
  l = uInvert > 0.5 ? 1.0 - l : l;
  outColor = vec4(color, l);
}`;

const TRACE = `
uniform sampler2D uCells;
uniform vec2 uGrid;
uniform float uAspect;
uniform float uHeight;
uniform float uBase;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uDir;
uniform vec2 uCenter;
uniform float uScale;
uniform vec3 uBackground;
uniform float uShade;
uniform float uGap;
uniform float uPalette;
uniform vec3 uLow;
uniform vec3 uHigh;
uniform float uCellPx;

vec4 cellAt(vec2 c) {
  return texelFetch(uCells, ivec2(clamp(c, vec2(0.0), uGrid - 1.0)), 0);
}

vec3 albedo(vec4 cell) {
  if (uPalette > 0.5) return mix(uLow, uHigh, smoothstep(0.0, 1.0, cell.a));
  return cell.rgb;
}

vec3 wallShade(vec3 color, vec3 n, float lift, float along) {
  float side = dot(n, uRight) * 0.5 + 0.5;
  float light = mix(1.0 - 0.3 * uShade, 1.0 - 0.62 * uShade, side);
  float ao = mix(1.0 - 0.45 * uShade, 1.0, smoothstep(0.0, 0.35, lift));
  float edge = smoothstep(0.0, 1.2 / uCellPx, min(along, 1.0 - along));
  return color * light * ao * mix(1.0 - 0.35 * uShade, 1.0, edge);
}

vec3 topShade(vec3 color, vec2 f) {
  vec2 e = min(f, 1.0 - f);
  float edge = smoothstep(0.0, 1.4 / uCellPx, min(e.x, e.y));
  return color * mix(1.0 - 0.22 * uShade, 1.0, edge);
}

vec3 trace(vec2 screen) {
  vec3 o = screen.x * uRight + screen.y * uUp - uDir * 8.0;
  vec3 dirSign = vec3(uDir.x >= 0.0 ? 1.0 : -1.0, uDir.y >= 0.0 ? 1.0 : -1.0, uDir.z >= 0.0 ? 1.0 : -1.0);
  vec3 d = dirSign * max(abs(uDir), vec3(1e-6));
  float top = uBase + uHeight;
  vec3 lo = vec3(-0.5 * uAspect, 0.0, -0.5);
  vec3 hi = vec3(0.5 * uAspect, top, 0.5);
  vec3 t1 = (lo - o) / d;
  vec3 t2 = (hi - o) / d;
  vec3 tn = min(t1, t2);
  vec3 tf = max(t1, t2);
  float t0 = max(max(tn.x, tn.y), tn.z);
  float tEnd = min(min(tf.x, tf.y), tf.z);
  if (t0 >= tEnd) return uBackground;

  vec2 toGrid = vec2(uGrid.x / uAspect, uGrid.y);
  vec2 gd = d.xz * toGrid;
  vec2 gridOrigin = (o.xz + vec2(0.5 * uAspect, 0.5)) * toGrid;
  vec2 g = gridOrigin + gd * t0;
  vec2 cell = clamp(floor(g), vec2(0.0), uGrid - 1.0);
  vec2 stepDir = dirSign.xz;
  vec2 tDelta = abs(1.0 / gd);
  vec2 tMax = t0 + ((cell + max(stepDir, 0.0)) - g) / gd;

  vec3 n = tn.y >= max(tn.x, tn.z) ? vec3(0.0, 1.0, 0.0) : (tn.x > tn.z ? vec3(-stepDir.x, 0.0, 0.0) : vec3(0.0, 0.0, -stepDir.y));
  float t = t0;
  float previous = 0.0;
  float halfGap = uGap * 0.5;
  float tFloor = halfGap > 0.0 ? (uBase - o.y) / d.y : 1e9;

  if (halfGap > 0.0 && o.y + d.y * t0 <= uBase) {
    vec2 hit = g;
    float along = abs(n.x) > 0.5 ? fract(hit.y) : fract(hit.x);
    return wallShade(albedo(cellAt(cell)) * 0.4, n, 1.0, along);
  }

  for (int i = 0; i < 1200; i++) {
    vec4 data = cellAt(cell);
    float h = uBase + data.a * uHeight;
    float tExit = min(min(tMax.x, tMax.y), tEnd);
    vec3 color = albedo(data);

    vec2 b1 = (cell + halfGap - gridOrigin) / gd;
    vec2 b2 = (cell + 1.0 - halfGap - gridOrigin) / gd;
    vec2 bn = min(b1, b2);
    vec2 bf = max(b1, b2);
    float bIn = max(max(bn.x, bn.y), t);
    float bOut = min(min(bf.x, bf.y), tExit);

    float hitT = 1e9;
    float kind = 0.0;
    if (bIn < bOut) {
      float yIn = o.y + d.y * bIn;
      if (yIn <= h) {
        hitT = bIn;
        kind = 1.0;
      } else if (o.y + d.y * bOut <= h) {
        hitT = (h - o.y) / d.y;
        kind = 2.0;
      }
    }
    if (tFloor >= t && tFloor <= tExit && tFloor < hitT) {
      return color * 0.3 + uBackground * 0.15;
    }
    if (kind > 1.5) {
      return topShade(color, fract(gridOrigin + gd * hitT));
    }
    if (kind > 0.5) {
      vec3 wn = n;
      if (bIn > t + 1e-6) wn = bn.x > bn.y ? vec3(-stepDir.x, 0.0, 0.0) : vec3(0.0, 0.0, -stepDir.y);
      vec2 hit = gridOrigin + gd * hitT;
      if (wn.y > 0.5) return topShade(color, fract(hit));
      float along = abs(wn.x) > 0.5 ? fract(hit.y) : fract(hit.x);
      float floorY = halfGap > 0.0 && bIn > t + 1e-6 ? uBase : previous;
      float lift = (o.y + d.y * hitT - floorY) * uGrid.y;
      return wallShade(color, wn, lift, along);
    }

    previous = h;
    if (tExit >= tEnd) break;
    t = tExit;
    if (tMax.x < tMax.y) {
      cell.x += stepDir.x;
      tMax.x += tDelta.x;
      n = vec3(-stepDir.x, 0.0, 0.0);
    } else {
      cell.y += stepDir.y;
      tMax.y += tDelta.y;
      n = vec3(0.0, 0.0, -stepDir.y);
    }
    if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= uGrid.x || cell.y >= uGrid.y) break;
  }
  return uBackground;
}

vec3 traceAt(vec2 frag) {
  return trace((frag - 0.5 * uResolution) / uScale + uCenter);
}
`;

const RAYCAST = `
${TRACE}
void main() {
  outColor = vec4(traceAt(gl_FragCoord.xy), 1.0);
}`;

const REFINE = `
${TRACE}
uniform sampler2D uFirst;

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 limit = ivec2(uResolution) - 1;
  vec3 c = texelFetch(uFirst, p, 0).rgb;
  float l = luma(c);
  float contrast = abs(luma(texelFetch(uFirst, min(p + ivec2(1, 0), limit), 0).rgb) - l);
  contrast = max(contrast, abs(luma(texelFetch(uFirst, max(p - ivec2(1, 0), ivec2(0)), 0).rgb) - l));
  contrast = max(contrast, abs(luma(texelFetch(uFirst, min(p + ivec2(0, 1), limit), 0).rgb) - l));
  contrast = max(contrast, abs(luma(texelFetch(uFirst, max(p - ivec2(0, 1), ivec2(0)), 0).rgb) - l));
  if (contrast < 0.025) {
    outColor = vec4(c, 1.0);
    return;
  }
  vec2 f = gl_FragCoord.xy;
  vec3 sum = c;
  sum += traceAt(f + vec2(0.125, 0.375));
  sum += traceAt(f + vec2(0.375, -0.125));
  sum += traceAt(f + vec2(-0.125, -0.375));
  sum += traceAt(f + vec2(-0.375, 0.125));
  outColor = vec4(sum * 0.2, 1.0);
}`;

export default {
  id: 'extrude',
  name: 'Iso extrude',
  category: 'geometric',
  blend: 'normal',
  description: 'Extrudes the picture into isometric bars whose height follows brightness, like a city relief map.',
  animated: true,
  animates: params => params.turn !== 0,
  params: [
    { key: 'size', label: 'Cell size', type: 'number', min: 3, max: 40, step: 0.5, default: 9 },
    { key: 'height', label: 'Height', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { key: 'rotation', label: 'Rotation', type: 'number', min: 0, max: 360, step: 1, default: 45 },
    { key: 'tilt', label: 'View angle', type: 'number', min: 15, max: 89, step: 1, default: 35 },
    { key: 'zoom', label: 'Zoom', type: 'number', min: 0.5, max: 2.5, step: 0.01, default: 1 },
    { key: 'invert', label: 'Dark is tall', type: 'boolean', default: false },
    {
      key: 'palette',
      label: 'Colors',
      type: 'select',
      default: 'image',
      options: [
        { value: 'image', label: 'From image' },
        { value: 'gradient', label: 'Two tone' }
      ]
    },
    {
      key: 'low',
      label: 'Low color',
      type: 'color',
      default: '#10206a',
      when: params => params.palette === 'gradient'
    },
    {
      key: 'high',
      label: 'High color',
      type: 'color',
      default: '#8ff4ff',
      when: params => params.palette === 'gradient'
    },
    { key: 'shading', label: 'Side shading', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'gap', label: 'Spacing', type: 'number', min: 0, max: 0.7, step: 0.01, default: 0 },
    { key: 'background', label: 'Background', type: 'color', default: '#0d0f14' },
    { key: 'turn', label: 'Turn', type: 'number', min: -1, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const aspect = ctx.width / ctx.height;
    const long = Math.max(aspect, 1);
    const cellWorld = (Math.max(params.size, 1) / 1000) * long;
    const nx = Math.max(2, Math.round(aspect / cellWorld));
    const nz = Math.max(2, Math.round(1 / cellWorld));
    const cellPx = [ctx.width / nx, ctx.height / nz];
    const stats = imageStats(ctx, input);
    const cells = ctx.pass('extrude-cells', CELLS, {
      input: source,
      target: ctx.target(nx, nz, { filter: 'nearest' }),
      textures: { uStats: stats.target },
      uniforms: {
        uStatsTop: stats.top,
        uCellPx: cellPx,
        uImage: [ctx.width, ctx.height],
        uLod: Math.max(0, Math.log2(Math.max(cellPx[0], cellPx[1]) / 4)),
        uInvert: params.invert
      }
    });
    const theta = ((params.rotation + params.turn * ctx.time * 24) * Math.PI) / 180;
    const phi = (Math.min(Math.max(params.tilt, 5), 89.5) * Math.PI) / 180;
    const forward = [Math.sin(theta), 0, Math.cos(theta)];
    const right = [Math.cos(theta), 0, -Math.sin(theta)];
    const up = [Math.sin(phi) * forward[0], Math.cos(phi), Math.sin(phi) * forward[2]];
    const dir = [Math.cos(phi) * forward[0], -Math.sin(phi), Math.cos(phi) * forward[2]];
    const height = params.height * 0.12;
    const base = 0.014;
    const radius = Math.hypot(aspect / 2, 0.5);
    const span = [2 * radius, 2 * radius * Math.sin(phi) + (height + base) * Math.cos(phi)];
    const scale = Math.min((ctx.width * 0.9) / span[0], (ctx.height * 0.9) / span[1]) * params.zoom;
    const uniforms = {
      uGrid: [nx, nz],
      uAspect: aspect,
      uHeight: height,
      uBase: base,
      uRight: right,
      uUp: up,
      uDir: dir,
      uCenter: [0, ((height + base) * Math.cos(phi)) / 2],
      uScale: scale,
      uBackground: hexToRgb(params.background),
      uShade: params.shading,
      uGap: params.gap,
      uPalette: params.palette === 'gradient',
      uLow: hexToRgb(params.low),
      uHigh: hexToRgb(params.high),
      uCellPx: scale / nz
    };
    const first = ctx.pass('extrude-trace', RAYCAST, { input, textures: { uCells: cells }, uniforms });
    const output = ctx.pass('extrude-refine', REFINE, { input, textures: { uCells: cells, uFirst: first }, uniforms });
    ctx.release(first);
    ctx.release(cells);
    ctx.release(stats.target);
    return output;
  }
};
