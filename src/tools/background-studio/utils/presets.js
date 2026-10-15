const MODULES = import.meta.glob('../../../demo/*/presets/*.js');

const cache = new Map();

const moduleKey = name => Object.keys(MODULES).find(key => key.endsWith(`/presets/${name}.js`));

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
    );
  }
  return cache.get(key);
}
