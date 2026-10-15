const HEX = /^#?[0-9a-fA-F]{3,8}$/;

export const sameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const withHash = value => (value.startsWith('#') ? value : `#${value}`);

export function serializeValue(value) {
  if (Array.isArray(value)) {
    return value.map(item => (typeof item === 'string' && HEX.test(item) ? item.replace(/^#/, '') : item)).join(',');
  }
  if (typeof value === 'string' && value.startsWith('#') && HEX.test(value)) return value.slice(1);
  return String(value);
}

export function parseValue(raw, definition) {
  switch (definition?.type) {
    case 'number': {
      const value = Number(raw);
      return Number.isFinite(value) ? value : undefined;
    }
    case 'boolean':
      return raw === 'true';
    case 'color':
      return HEX.test(raw) ? withHash(raw) : undefined;
    case 'colorArray': {
      const colors = raw.split(',').filter(item => HEX.test(item));
      return colors.length ? colors.map(withHash) : undefined;
    }
    case 'rgbArray': {
      const values = raw.split(',').map(Number);
      return values.length === 3 && values.every(Number.isFinite) ? values : undefined;
    }
    case 'select':
      return definition.options?.some(option => (option.value ?? option) === raw) ? raw : undefined;
    case 'text':
      return raw;
    default:
      return undefined;
  }
}

export function readDocument(searchParams, fallbackId, getBackground) {
  const requested = searchParams.get('bg');
  const background = getBackground(requested) || getBackground(fallbackId);
  const changes = {};
  (background.props || []).forEach(definition => {
    const raw = searchParams.get(definition.name);
    if (raw === null) return;
    const value = parseValue(raw, definition);
    if (value !== undefined) changes[definition.name] = value;
  });
  return { id: background.id, preset: searchParams.get('preset') || null, changes };
}

export function writeDocument(document, background) {
  const params = new URLSearchParams();
  params.set('bg', document.id);
  if (document.preset) params.set('preset', document.preset);
  (background?.props || []).forEach(definition => {
    if (definition.name in document.changes) {
      params.set(definition.name, serializeValue(document.changes[definition.name]));
    }
  });
  return params;
}
