import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  CATEGORY_PRO_GROUPS,
  HIDDEN_TEMPLATE_SLUGS,
  PRO_SHOWCASE,
  PRO_UPSELLS
} from '../src/constants/pro-categories.js';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/pro-manifest.json'), 'utf8'));
const hasAsset = asset => typeof asset === 'string' && fs.existsSync(path.join(root, 'public', asset));
const catalogAsset = relative => {
  const asset = relative ? `/rbp/${relative}` : null;
  return hasAsset(asset) ? asset : null;
};
const componentMedia = item => {
  const local = suffix => {
    const asset = `/assets/pro/components/${item.slug}${suffix}.webp`;
    return fs.existsSync(path.join(root, 'public', asset)) ? asset : null;
  };
  return {
    animated: catalogAsset(item.media?.animated) || local(''),
    poster: catalogAsset(item.media?.poster) || local('-poster') || catalogAsset(item.preview?.dark)
  };
};

const categories = Object.fromEntries(
  Object.entries({
    ...CATEGORY_PRO_GROUPS,
    default: { noun: 'components', pitch: 'Components, page blocks, app UI and templates, built to work together.' }
  }).map(([category, config]) => {
    const groups = config.groups || (config.group ? [config.group] : null);
    const items = manifest.components.filter(item => !groups || groups.includes(item.group));
    const preferred = PRO_UPSELLS[category]?.featured.map(item => item.slug) || [];
    const withMedia = items.filter(item => {
      const media = componentMedia(item);
      return media.animated || media.poster;
    });
    const featured = [...withMedia].sort((a, b) => {
      const aIndex = preferred.indexOf(a.slug);
      const bIndex = preferred.indexOf(b.slug);
      return (aIndex < 0 ? preferred.length : aIndex) - (bIndex < 0 ? preferred.length : bIndex);
    });
    return [
      category,
      {
        count: items.length,
        noun: config.noun,
        pitch: config.pitch,
        path: PRO_UPSELLS[category]?.path || '/docs/components',
        items: featured.slice(0, 4).map(item => ({
          name: item.name,
          slug: item.slug,
          href: item.href,
          media: componentMedia(item)
        }))
      }
    ];
  })
);

const SHOWCASE_SIZE = 12;

const spread = (items, size) => {
  if (items.length <= size) return items;
  const stride = items.length / size;
  return Array.from({ length: size }, (_, index) => items[Math.floor(index * stride)]);
};

const featuredFirst = (items, section, key = item => item.slug) => {
  const bySlug = new Map(items.map(item => [key(item), item]));
  const featured = (PRO_SHOWCASE[section] || []).map(slug => bySlug.get(slug)).filter(Boolean);
  const rest = spread(
    items.filter(item => !featured.includes(item)),
    SHOWCASE_SIZE * 2
  );
  return [...featured, ...rest];
};

const curated = (section, slug) => {
  const base = `/assets/pro/showcase/${section}/${slug}`;
  if (!hasAsset(`${base}-dark.webp`)) return null;
  return {
    image: `${base}-dark.webp`,
    ...(hasAsset(`${base}-light.webp`) ? { imageLight: `${base}-light.webp` } : {})
  };
};

const SECTION_PATHS = {
  components: '/docs/components',
  blocks: '/docs/blocks',
  'app-ui': '/docs/app-ui',
  templates: '/docs/templates',
  'agent-kit': '/docs/agent-kit'
};

const SECTION_LABELS = {
  components: 'Component',
  blocks: 'Page block',
  'app-ui': 'App UI block',
  templates: 'Template',
  'agent-kit': 'Agent Kit item'
};

const numberedSet = section => {
  const dir = path.join(root, 'public/assets/pro/showcase', section);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map(file => /^(\d+)-dark\.webp$/.exec(file)?.[1])
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b))
    .slice(0, SHOWCASE_SIZE)
    .map(number => ({
      name: `${SECTION_LABELS[section]} ${Number(number)}`,
      slug: `${section}-${number}`,
      href: `${manifest.site}${SECTION_PATHS[section]}`,
      ...curated(section, number)
    }));
};

const showcaseOf = (section, items, image) => {
  const numbered = numberedSet(section);
  if (numbered.length) return numbered;
  return items
    .map(item => ({
      name: item.name,
      slug: item.slug,
      href: item.href,
      ...(curated(section, item.slug) || { image: image(item) })
    }))
    .filter(item => hasAsset(item.image))
    .slice(0, SHOWCASE_SIZE);
};

const variantsOf = categories => categories.flatMap(category => category.variants || []);

const hiddenTemplates = new Set(HIDDEN_TEMPLATE_SLUGS);

const showcase = {
  components: showcaseOf(
    'components',
    featuredFirst(manifest.components, 'components'),
    item => componentMedia(item).poster
  ),
  blocks: showcaseOf(
    'blocks',
    featuredFirst(variantsOf(manifest.blocks), 'blocks'),
    item => `/assets/pro/blocks/${item.slug}.webp`
  ),
  'app-ui': showcaseOf(
    'app-ui',
    featuredFirst(variantsOf(manifest.appUi), 'app-ui'),
    item => `/assets/pro/app-ui/${item.slug}.webp`
  ),
  templates: showcaseOf(
    'templates',
    manifest.templates.filter(item => !hiddenTemplates.has(item.slug)),
    item => `/assets/pro/templates/${item.slug}.webp`
  ),
  'agent-kit': showcaseOf(
    'agent-kit',
    featuredFirst(manifest.agentKit, 'agent-kit', item => `${item.kind}-${item.slug}`),
    item => `/assets/pro/agent-kit/${item.kind}-${item.slug}.webp`
  )
};

const PLAN_RANK = { free: 0, starter: 1, pro: 2, ultimate: 3 };

const reach = (items, plan, size = () => 1) =>
  items
    .filter(item => item.isFree || PLAN_RANK[item.tier] <= PLAN_RANK[plan])
    .reduce((total, item) => total + size(item), 0);

const plans = Object.fromEntries(
  Object.keys(PLAN_RANK).map(plan => [
    plan,
    {
      components: reach(manifest.components, plan),
      blocks: reach(manifest.blocks, plan, item => item.count),
      appUi: reach(manifest.appUi, plan, item => item.count),
      templates: reach(manifest.templates, plan),
      agentKit: reach([...manifest.agentKit, manifest.agentSkill].filter(Boolean), plan)
    }
  ])
);

const tiers = manifest.tiers.map(({ id, name, lifetime, annual, popular, ctaText }) => ({
  id,
  name,
  lifetime,
  annual,
  popular: Boolean(popular),
  ctaText
}));

const summary = {
  counts: manifest.counts,
  assets: { baseUrl: manifest.assets.baseUrl },
  startingPrice: Math.min(...manifest.tiers.map(tier => tier.lifetime)),
  tiers,
  plans,
  showcase,
  categories
};

const output = path.join(root, 'src/constants/pro-summary.generated.json');
const content = `${JSON.stringify(summary, null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) {
    throw new Error('Pro summary is stale. Run npm run pro:summary.');
  }
  console.log('Pro category summary is up to date.');
} else {
  fs.writeFileSync(output, content);
  console.log(`Wrote Pro category summary (${fs.statSync(output).size} bytes).`);
}
