import { hexToRgb } from '../engine/assets';

const COLUMNS = `
uniform vec2 uGridMin;
uniform vec2 uImage;
uniform float uEdge;
uniform float uHeight;
uniform float uRelief;

vec3 area(vec2 center, float lod) {
  vec3 sum = vec3(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y)) * uEdge * 0.42;
      sum += textureLod(uInput, clamp((center + o) / uImage, 0.0, 1.0), lod).rgb;
    }
  }
  return sum / 9.0;
}

float rise(vec3 c) {
  float l = clamp(luma(c), 0.0, 1.0);
  return uRelief > 1.5 ? 1.0 - l : l;
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy) + uGridMin;
  vec2 corner = vec2((cell.x - cell.y) * 0.8660254, -1.5 * (cell.x + cell.y) - 1.0);
  vec2 center = uImage * 0.5 + corner * uEdge;
  float lod = log2(max(uEdge * 0.5, 1.0));
  float n = 0.0;
  if (uRelief > 0.5 && uHeight > 0.0) {
    float guess = rise(area(center, lod + 1.0)) * uHeight;
    guess = rise(area(center + vec2(0.0, guess * uEdge), lod + 1.0)) * uHeight;
    n = floor(rise(area(center + vec2(0.0, guess * uEdge), lod)) * uHeight + 0.5);
  }
  vec3 color = area(center + vec2(0.0, n * uEdge), lod);
  outColor = vec4(color, n);
}`;

const MARCH = `
uniform sampler2D uColumns;
uniform vec2 uGridMin;
uniform vec2 uGridSize;
uniform float uEdge;
uniform float uHeight;
uniform float uGap;
uniform vec3 uFaces;
uniform float uOutline;
uniform float uDepth;
uniform vec3 uBackground;

vec4 column(vec2 cell) {
  vec2 t = cell - uGridMin;
  if (t.x < 0.0 || t.y < 0.0 || t.x >= uGridSize.x || t.y >= uGridSize.y) return vec4(0.0, 0.0, 0.0, -1.0);
  return texelFetch(uColumns, ivec2(t), 0);
}

vec3 shadeRay(vec2 p) {
  float a = p.x * 0.57735027 - p.y;
  float b = -p.x * 0.57735027 - p.y;
  float z = (2.0 * p.y + uHeight) / 3.0 + 1.5;
  float zEnd = (2.0 * p.y - 1.0) / 3.0 - 1.5;
  vec2 xy = vec2(a, b) + z;
  vec2 cell = floor(xy);
  float g = uGap * 0.5;
  for (int k = 0; k < 160; k++) {
    if (z < zEnd) break;
    vec2 rem = xy - cell;
    float tExit = min(rem.x, rem.y);
    vec4 col = column(cell);
    if (col.a >= 0.0) {
      float base = -(cell.x + cell.y);
      float top = base + col.a;
      float tx0 = xy.x - (cell.x + 1.0 - g);
      float ty0 = xy.y - (cell.y + 1.0 - g);
      float tz0 = z - top;
      float tIn = max(max(tx0, ty0), max(tz0, 0.0));
      float tOut = min(min(xy.x - (cell.x + g), xy.y - (cell.y + g)), z - base + 1.0);
      if (tIn <= tOut && tIn <= tExit) {
        vec3 h = vec3(xy - tIn, z - tIn);
        vec2 f = h.xy - cell;
        float face;
        vec2 uv;
        if (tz0 >= max(tx0, ty0)) {
          face = 0.0;
          uv = f;
        } else if (tx0 >= ty0) {
          face = 2.0;
          uv = vec2(f.y, h.z);
        } else {
          face = 1.0;
          uv = vec2(f.x, h.z);
        }
        vec3 color = col.rgb * (face < 0.5 ? uFaces.x : (face < 1.5 ? uFaces.y : uFaces.z));
        if (face > 0.5) {
          float lift = clamp((h.z - base + 1.0) / max(col.a + 1.0, 1.0), 0.0, 1.0);
          color *= 1.0 - uDepth * (1.0 - lift) * 0.35;
        }
        if (uOutline > 0.0) {
          float across = min(uv.x - g, 1.0 - g - uv.x);
          float along = face < 0.5 ? min(uv.y - g, 1.0 - g - uv.y) : abs(fract(uv.y + 0.5) - 0.5);
          float d = min(across, along) * uEdge;
          float width = max(uEdge * 0.035, 0.45) * (0.6 + uOutline * 0.8);
          float line = 1.0 - smoothstep(width - 0.5, width + 0.5, d);
          color = mix(color, color * 0.18, line * min(uOutline * 1.4, 1.0));
        }
        return color;
      }
    }
    xy -= tExit;
    z -= tExit;
    if (rem.x <= rem.y) cell.x -= 1.0;
    else cell.y -= 1.0;
  }
  return uBackground;
}

void main() {
  vec2 p = vUv * uResolution - uResolution * 0.5;
  vec3 sum = shadeRay((p + vec2(-0.375, 0.125)) / uEdge);
  sum += shadeRay((p + vec2(0.125, 0.375)) / uEdge);
  sum += shadeRay((p + vec2(0.375, -0.125)) / uEdge);
  sum += shadeRay((p + vec2(-0.125, -0.375)) / uEdge);
  outColor = vec4(sum * 0.25, 1.0);
}`;

const LIGHTS = { left: [1, 0.72, 0.48], right: [1, 0.48, 0.72], top: [1, 0.6, 0.6], below: [0.55, 0.9, 0.75] };

export default {
  id: 'voxel',
  name: 'Voxels',
  category: 'pixel',
  description: 'The picture rebuilt from shaded isometric cubes, flat or stacked by brightness.',
  animated: false,
  params: [
    { key: 'size', label: 'Cube size', type: 'number', min: 3, max: 40, step: 0.5, default: 9 },
    {
      key: 'relief',
      label: 'Relief',
      type: 'select',
      default: 'brightness',
      options: [
        { value: 'flat', label: 'Flat' },
        { value: 'brightness', label: 'By brightness' },
        { value: 'darkness', label: 'By darkness' }
      ]
    },
    {
      key: 'height',
      label: 'Height',
      type: 'number',
      min: 1,
      max: 12,
      step: 1,
      default: 3,
      when: params => params.relief !== 'flat'
    },
    {
      key: 'light',
      label: 'Light',
      type: 'select',
      default: 'left',
      options: [
        { value: 'left', label: 'From the left' },
        { value: 'right', label: 'From the right' },
        { value: 'top', label: 'From above' },
        { value: 'below', label: 'From below' }
      ]
    },
    { key: 'shading', label: 'Shading', type: 'number', min: 0, max: 1, step: 0.01, default: 0.75 },
    { key: 'outline', label: 'Outline', type: 'number', min: 0, max: 1, step: 0.01, default: 0.15 },
    { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 0.6, step: 0.01, default: 0 },
    { key: 'background', label: 'Background', type: 'color', default: '#0a090d', when: params => params.gap > 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const edge = Math.max(2, params.size * ctx.unit);
    const relief = params.relief === 'darkness' ? 2 : params.relief === 'flat' ? 0 : 1;
    const height = relief ? Math.max(0, Math.round(params.height)) : 0;
    const w = ctx.width / edge;
    const h = ctx.height / edge;
    const span = w / Math.sqrt(3) / 2 + h / 6;
    const min = Math.floor(-span - 3);
    const max = Math.ceil(span + height / 3 + 3);
    const size = max - min + 1;
    const columns = ctx.pass('voxel-columns', COLUMNS, {
      input: source,
      target: ctx.target(size, size, { filter: 'nearest' }),
      uniforms: { uGridMin: [min, min], uImage: [ctx.width, ctx.height], uEdge: edge, uHeight: height, uRelief: relief }
    });
    const shading = Math.min(1, Math.max(0, params.shading));
    const faces = (LIGHTS[params.light] || LIGHTS.left).map(f => 1 + (f - 1) * shading);
    const output = ctx.pass('voxel-march', MARCH, {
      input: source,
      textures: { uColumns: columns },
      uniforms: {
        uGridMin: [min, min],
        uGridSize: [size, size],
        uEdge: edge,
        uHeight: height,
        uGap: params.gap,
        uFaces: faces,
        uOutline: params.outline,
        uDepth: relief && height > 0 ? shading : 0,
        uBackground: hexToRgb(params.background)
      }
    });
    ctx.release(columns);
    return output;
  }
};
