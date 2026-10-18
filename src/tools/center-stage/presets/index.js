import { LEGACY } from './legacy';
import { REVEALS } from './reveals';
import { GALLERIES } from './galleries';
import { ISOMETRIC } from './isometric';
import { EXTRAS } from './extras';
import { DEPTH } from './depth';
import { PERSPECTIVE } from './perspective';
import { WHITE } from './shared';

export const PRESET_GROUPS = [
  { id: 'essentials', label: 'Essentials' },
  { id: 'depth', label: 'Depth' },
  { id: 'reveals', label: 'Reveals' },
  { id: 'galleries', label: 'Galleries' },
  { id: 'devices', label: 'Devices' },
  { id: 'motion', label: 'Motion' },
  { id: 'perspective', label: 'Perspective' },
  { id: 'isometric', label: 'Isometric' },
  { id: 'type', label: 'Type' },
  { id: 'scenes', label: 'Scenes' },
  { id: 'arrange', label: 'Arrangements' }
];

const luminance = hex => {
  const value = parseInt(String(hex).replace('#', ''), 16);
  if (!Number.isFinite(value)) return 0;
  return (0.2126 * ((value >> 16) & 255) + 0.7152 * ((value >> 8) & 255) + 0.0722 * (value & 255)) / 255;
};

const KEEP = new Set(['image', 'ambient', 'transparent', 'reactbits']);

const polish = preset => {
  const doc = preset.doc;
  const bg = doc.background;
  if (!bg || KEEP.has(bg.kind) || luminance(bg.colors?.[0]) < 0.6) return preset;
  const floor = bg.kind === 'studio' || doc.light?.receiver === 'floor';
  return {
    ...preset,
    doc: {
      ...doc,
      background: { kind: 'solid', colors: WHITE },
      light: floor ? { ...doc.light, receiver: 'floor' } : doc.light,
      finish: { ...doc.finish, grain: 0, vignette: 0 }
    }
  };
};

export const PRESETS = [...LEGACY, ...DEPTH, ...PERSPECTIVE, ...REVEALS, ...GALLERIES, ...ISOMETRIC, ...EXTRAS].map(
  polish
);

export const PRESETS_BY_ID = Object.fromEntries(PRESETS.map(preset => [preset.id, preset]));
export const DEFAULT_PRESET = 'center-stage';
