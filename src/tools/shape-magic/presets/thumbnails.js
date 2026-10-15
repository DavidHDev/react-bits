import { PRIMITIVES } from '../engine/primitives.js';
import { MARKS } from './marks.js';

export const THUMBNAILS = [
  ...['dark', 'light'].flatMap(theme =>
    MARKS.map(preset => ({
      key: `mark:${preset.id}`,
      file: `mark-${preset.id}-${theme}.webp`,
      size: 220,
      light: theme === 'light',
      preset
    }))
  ),
  ...PRIMITIVES.map(primitive => ({
    key: `shape:${primitive.id}`,
    file: `shape-${primitive.id}.webp`,
    size: 96,
    preset: { mark: { layers: [{ type: primitive.id, size: 0.78 }] } },
    style: { fill: { kind: 'solid', color1: '#ffffff' } }
  }))
];

const urls = light =>
  Object.fromEntries(
    THUMBNAILS.filter(item => item.light === undefined || item.light === light).map(item => [
      item.key,
      `/assets/shape-magic/${item.file}`
    ])
  );

export const STATIC_THUMBNAILS = { dark: urls(false), light: urls(true) };
