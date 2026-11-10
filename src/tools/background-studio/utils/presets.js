const MODULES = import.meta.glob('../../../demo/*/presets/*.js');

const cache = new Map();
const resolved = new Map();
const keys = new Map();

const keyFor = name => Object.keys(MODULES).find(key => key.endsWith(`/presets/${name}.js`));

const moduleKey = name => {
  if (!keys.has(name)) keys.set(name, keyFor(name));
  return keys.get(name);
};

export const componentNameOf = background => background.name || background.label.replace(/[^A-Za-z0-9]/g, '');

export const hasPresets = background => Boolean(background && moduleKey(componentNameOf(background)));

export function loadPresets(background) {
  const key = background && moduleKey(componentNameOf(background));
  if (!key) return Promise.resolve(null);
  if (!cache.has(key)) {
    cache.set(
      key,
      MODULES[key]()
        .then(module => ({
          options: module.PRESET_OPTIONS || [],
          resolve: (value, context) => {
            if (!module.PRESETS?.[value]) return {};
            const props = { ...module.presetProps(value, context) };
            delete props.preset;
            return props;
          }
        }))
        .catch(() => null)
        .then(presets => {
          resolved.set(key, presets);
          return presets;
        })
    );
  }
  return cache.get(key);
}

export function peekPresets(background) {
  const key = background && moduleKey(componentNameOf(background));
  if (!key) return null;
  return resolved.has(key) ? resolved.get(key) : undefined;
}
