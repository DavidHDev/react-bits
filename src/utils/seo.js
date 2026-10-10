import { getComponentCatalog } from './catalog.js';

export const SITE_URL = 'https://reactbits.dev';
export const DEFAULT_DESCRIPTION =
  'Free, open source React components for animated text, backgrounds, interactive cards and micro interactions. Explore live demos and copy the source.';

export const HOME_SEO = {
  title: 'React Bits — Free Animated React Components',
  description: DEFAULT_DESCRIPTION,
  heading: 'React components for creative developers',
  path: '/',
  intro:
    'Animated components and backgrounds that install as source you own. Tune every value, starting with this page’s background.'
};

export const INDEX_SEO = {
  title: 'Browse Free React Components | React Bits',
  description:
    'Browse the React Bits library of free animated React components. Find text effects, backgrounds, cards, galleries and micro interactions with live demos.',
  heading: 'Browse React Components',
  path: '/get-started/index',
  intro: 'Creative React components, ready to make your own.'
};

export const CATEGORY_SEO = {
  'text-animations': {
    title: 'React Text Animations — Free Components | React Bits',
    description:
      'Free React text animation components: split text, typewriter effects, rotating text, scroll reveals and more. Try live demos and customize the source.',
    heading: 'React Text Animations',
    label: 'Text Animations',
    path: '/c/text-animations',
    intro: 'Text effects that bring your words to life.'
  },
  animations: {
    title: 'React Animation Effects — Free Components | React Bits',
    description:
      'Explore free React animation effects for cursors, hover interactions, scroll reveals, borders and images. Customize each effect in a live demo.',
    heading: 'React Animation Effects',
    label: 'Animations',
    path: '/c/animations',
    intro: 'Cursors, hover effects and scroll reveals with character.'
  },
  components: {
    title: 'Interactive React UI Components — Free Library | React Bits',
    description:
      'Free interactive React UI components for cards, navigation, carousels and galleries. Preview each component and use the JavaScript or TypeScript source.',
    heading: 'Interactive React Components',
    label: 'Components',
    path: '/c/components',
    intro: 'Standout cards, navigation, carousels and galleries.'
  },
  backgrounds: {
    title: 'Animated React Backgrounds — Free Components | React Bits',
    description:
      'Free animated React backgrounds, including gradients, particles, grids and shader effects. Explore live previews and customize the look of your page.',
    heading: 'Animated React Backgrounds',
    label: 'Backgrounds',
    path: '/c/backgrounds',
    intro: 'Set the scene with gradients, particles and shaders.'
  },
  micro: {
    title: 'React Micro Interactions — Free Components | React Bits',
    description:
      'Free React micro interaction components for buttons, toggles, indicators and other interface details. Explore interactive demos and copy the source.',
    heading: 'React Micro Interactions',
    label: 'Micro',
    path: '/c/micro',
    intro: 'Small interactions that make every detail feel alive.'
  }
};

const catalog = getComponentCatalog();
const componentsByPath = new Map(catalog.map(item => [item.path, item]));
const componentTypes = {
  'text-animations': 'React Text Animation',
  animations: 'React Animation Effect',
  components: 'React Component',
  backgrounds: 'React Background',
  micro: 'React Micro Interaction'
};
const stopWords = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'to',
  'with',
  'your',
  'react',
  'component',
  'components',
  'animated',
  'animation',
  'effect',
  'effects',
  'customizable'
]);
const tokens = value =>
  new Set(
    String(value)
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter(word => word.length > 2 && !stopWords.has(word)) ?? []
  );

const relatedComponents = item => {
  const keywords = tokens(`${item.name} ${item.meta.description} ${(item.meta.tags ?? []).join(' ')}`);
  return catalog
    .filter(candidate => candidate.path !== item.path && candidate.categorySlug === item.categorySlug)
    .map(candidate => {
      const candidateKeywords = tokens(
        `${candidate.name} ${candidate.meta.description} ${(candidate.meta.tags ?? []).join(' ')}`
      );
      const score = [...keywords].filter(word => candidateKeywords.has(word)).length;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
    .slice(0, 3)
    .map(({ candidate }) => ({ name: candidate.name, path: candidate.path, description: candidate.meta.description }));
};

export const getComponentSEO = item => {
  const category = CATEGORY_SEO[item.categorySlug];
  const type = componentTypes[item.categorySlug] ?? 'React Component';
  return {
    title: `${item.name} — ${type} | React Bits`,
    description: `${item.meta.description} Explore the ${item.name} React demo and source code.`,
    heading: item.name,
    path: item.path,
    intro: item.meta.description,
    image: `/og/${item.categorySlug}/${item.slug}.jpg`,
    imageAlt: `${item.name}, a React Bits component`,
    category: { name: category?.label ?? item.category, path: category?.path ?? INDEX_SEO.path },
    related: relatedComponents(item)
  };
};

export const getComponentSEOByPath = path => {
  const item = componentsByPath.get(path);
  return item ? getComponentSEO(item) : null;
};
