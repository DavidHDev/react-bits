import { parseColor } from '../../../components/common/Preview/colorMath.js';

export const MAT_FLOATS = 32;
export const MAT_COLORS = 16;

const CHANNELS = ['x', 'y', 'z', 'w'];

const floatSlot = index => `uMatP[${Math.floor(index / 4)}].${CHANNELS[index % 4]}`;

export function layoutParams(params = []) {
  let floats = 0;
  let colors = 0;
  const slots = [];
  const defines = [];
  params.forEach(param => {
    if (param.type === 'color') {
      slots.push({ param, color: colors });
      defines.push(`#define C_${param.name} uMatC[${colors}]`);
      colors += 1;
    } else if (param.type === 'colorArray') {
      const size = Math.max(1, param.maxItems ?? 4);
      slots.push({ param, color: colors, size, count: floats });
      defines.push(`#define C_${param.name}(k) uMatC[${colors} + (k)]`);
      defines.push(`#define N_${param.name} ${floatSlot(floats)}`);
      colors += size;
      floats += 1;
    } else {
      slots.push({ param, float: floats });
      defines.push(`#define P_${param.name} ${floatSlot(floats)}`);
      floats += 1;
    }
  });
  if (floats > MAT_FLOATS || colors > MAT_COLORS) {
    throw new Error(`Material uses ${floats} numbers and ${colors} colors, more than the shader allows.`);
  }
  return { slots, defines: defines.join('\n') };
}

const rgba = value => {
  const color = parseColor(value);
  return color ? [color.r, color.g, color.b, color.a ?? 1] : [1, 1, 1, 1];
};

const numberFor = (param, value) => {
  if (param.type === 'boolean') return value ? 1 : 0;
  if (param.type === 'select') {
    if (typeof value === 'number') return value;
    const index = (param.options || []).findIndex(option => option.value === value);
    return index < 0 ? 0 : index;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const defaultValues = params => Object.fromEntries((params || []).map(param => [param.name, param.default]));

export function packParams(layout, values = {}) {
  const floats = new Float32Array(MAT_FLOATS);
  const colors = new Float32Array(MAT_COLORS * 4);
  layout.slots.forEach(slot => {
    const { param } = slot;
    const value = values[param.name] ?? param.default;
    if (slot.color !== undefined && slot.size) {
      const list = (Array.isArray(value) ? value : [value]).filter(Boolean).slice(0, slot.size);
      list.forEach((item, index) => colors.set(rgba(item), (slot.color + index) * 4));
      floats[slot.count] = list.length;
    } else if (slot.color !== undefined) {
      colors.set(rgba(value), slot.color * 4);
    } else {
      floats[slot.float] = numberFor(param, value);
    }
  });
  return { floats, colors };
}
