import { BACKGROUNDS, getDocsPath } from '../backgrounds';
import { componentMetadata } from '../../../constants/Information';
import { NEW, UPDATED } from '../../../constants/Badges';
import { componentNameOf } from './presets';

export { themeDefaults } from './theme';

export const DEFAULT_BACKGROUND = 'topography';

const META_BY_PATH = new Map(Object.values(componentMetadata).map(meta => [new URL(meta.docsUrl).pathname, meta]));

const CODE_MODULES = import.meta.glob('../../../constants/code/{Backgrounds,Animations}/*Code.js');

export const CATALOG = BACKGROUNDS.filter(background => !background.hidden)
  .map(background => {
    const docsPath = getDocsPath(background);
    const meta = META_BY_PATH.get(docsPath) || {};
    return {
      ...background,
      name: componentNameOf(background),
      docsPath,
      category: docsPath.split('/')[1],
      description: meta.description || '',
      tags: meta.tags || [],
      isNew: NEW.includes(background.label),
      isUpdated: UPDATED.includes(background.label)
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

const BY_ID = new Map(CATALOG.map(entry => [entry.id, entry]));

export const findEntry = id => BY_ID.get(id) || null;

export const thumbnailFor = (entry, light) => `/assets/studio/${entry.id}-${light ? 'light' : 'dark'}.webp`;

export function loadCode(entry) {
  const key = Object.keys(CODE_MODULES).find(
    path => path.split('/').pop().toLowerCase() === `${entry.name.toLowerCase()}code.js`
  );
  if (!key) return Promise.resolve(null);
  return CODE_MODULES[key]().then(module => Object.values(module).find(value => value && value.usage) || null);
}

export function matchesQuery(entry, query) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  return (
    entry.label.toLowerCase().includes(text) ||
    entry.tags.some(tag => tag.toLowerCase().includes(text)) ||
    entry.description.toLowerCase().includes(text)
  );
}
