import { DEFAULT_DOC } from './engine/scene';

const KEY = 'shot';

const strip = (value, base) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object' || !base || typeof base !== 'object' || Array.isArray(base)) return value;
  const out = {};
  Object.keys(value).forEach(key => {
    const next = strip(value[key], base[key]);
    if (next === undefined) return;
    if (JSON.stringify(next) === JSON.stringify(base[key])) return;
    if (next && typeof next === 'object' && !Array.isArray(next) && !Object.keys(next).length) return;
    out[key] = next;
  });
  return out;
};

const toBase64 = text =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64 = value => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '==='.slice((padded.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
};

export const shotJson = doc =>
  JSON.stringify({ app: 'center-stage', version: 1, shot: strip(doc, DEFAULT_DOC) }, null, 2);

export const shotUrl = doc => {
  const url = new URL(window.location.href);
  url.hash = `${KEY}=${toBase64(JSON.stringify(strip(doc, DEFAULT_DOC)))}`;
  return url.toString();
};

export function decodeShot(text) {
  if (!text) return null;
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      return parsed?.app === 'center-stage' && parsed.shot ? parsed.shot : null;
    }
    const match = trimmed.match(/(?:#|^)shot=([A-Za-z0-9_-]+)/);
    return match ? JSON.parse(fromBase64(match[1])) : null;
  } catch {
    return null;
  }
}

export function readSharedShot() {
  const shot = decodeShot(window.location.hash.slice(1));
  if (shot) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return shot;
}
