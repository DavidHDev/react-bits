import { EFFECTS, PLAYBACK, TUNE } from './controls.js';
import { SOUNDS_BY_ID } from './catalog.js';

const NUMERIC = [...TUNE, ...PLAYBACK];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const snap = (control, value) => {
  const clamped = clamp(value, control.min, control.max);
  if (control.scale === 'log') return Number(clamped.toPrecision(3));
  return Number((Math.round(clamped / control.step) * control.step).toFixed(4));
};

const changed = (control, value) =>
  typeof control.fallback === 'number' ? Math.abs(value - control.fallback) > 1e-6 : value !== control.fallback;

const readControl = (control, value) => {
  if (control.type === 'switch') return typeof value === 'boolean' ? value : control.fallback;
  if (control.type === 'choice')
    return control.options.some(option => option.value === value) ? value : control.fallback;
  const number = Number(value);
  return value !== null && value !== '' && Number.isFinite(number) ? snap(control, number) : control.fallback;
};

export const sanitizeTune = raw => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  NUMERIC.forEach(control => {
    const value = readControl(control, raw[control.key]);
    if (changed(control, value)) out[control.key] = value;
  });
  EFFECTS.forEach(effect => {
    const source = raw[effect.key];
    if (!source || typeof source !== 'object' || Array.isArray(source)) return;
    out[effect.key] = Object.fromEntries(
      effect.controls.map(control => [control.key, readControl(control, source[control.key])])
    );
  });
  return out;
};

const writeValue = (control, value) => {
  if (control.type === 'switch') return value ? 'on' : 'off';
  if (control.type === 'choice') return value;
  return String(value);
};

const writeEffect = (effect, settings) => {
  const parts = effect.controls
    .filter(control => changed(control, settings[control.key]))
    .map(control => `${control.key}:${writeValue(control, settings[control.key])}`);
  return parts.length ? parts.join(',') : 'on';
};

const readEffect = (effect, value) => {
  const settings = {};
  value.split(',').forEach(pair => {
    const [key, raw] = pair.split(':');
    const control = effect.controls.find(item => item.key === key);
    if (control && raw !== undefined) settings[key] = control.type === 'switch' ? raw === 'on' : raw;
  });
  return settings;
};

export const shareUrl = (sound, tune = {}) => {
  const clean = sanitizeTune(tune);
  const parts = [`sound=${sound.id}`];
  NUMERIC.forEach(control => {
    if (clean[control.key] !== undefined) parts.push(`${control.key}=${clean[control.key]}`);
  });
  EFFECTS.forEach(effect => {
    if (clean[effect.key]) parts.push(`${effect.key}=${writeEffect(effect, clean[effect.key])}`);
  });
  const url = new URL(window.location.href);
  url.hash = parts.join('&');
  return url.toString();
};

export function readSharedSound() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const id = params.get('sound');
  if (!id || !SOUNDS_BY_ID[id]) return null;
  const raw = {};
  NUMERIC.forEach(control => {
    if (params.has(control.key)) raw[control.key] = params.get(control.key);
  });
  EFFECTS.forEach(effect => {
    if (params.has(effect.key)) raw[effect.key] = readEffect(effect, params.get(effect.key));
  });
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  return { id, tune: sanitizeTune(raw) };
}

const describe = (control, value) => {
  if (control.type === 'switch') return control.label;
  if (control.type === 'choice') {
    const option = control.options.find(item => item.value === value);
    return option?.long || option?.label;
  }
  const text = control.format(value);
  return text.toLowerCase().includes(control.label.toLowerCase().replace(/s$/, '')) ? text : `${control.label} ${text}`;
};

export const shareRows = (tune = {}) => {
  const clean = sanitizeTune(tune);
  return [
    ...NUMERIC.filter(control => clean[control.key] !== undefined).map(control => ({
      key: control.key,
      label: control.label,
      value: control.format(clean[control.key])
    })),
    ...EFFECTS.filter(effect => clean[effect.key]).map(effect => {
      const settings = clean[effect.key];
      const parts = effect.controls
        .filter(control => changed(control, settings[control.key]))
        .map(control => describe(control, settings[control.key]));
      return { key: effect.key, label: effect.label, value: parts.length ? parts.join(' · ') : 'Default' };
    })
  ];
};
