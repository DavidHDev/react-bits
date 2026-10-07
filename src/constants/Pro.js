import proSummary from './pro-summary.generated.json';
import { Blocks, Box, LayoutTemplate, Bot, Component } from 'lucide-react';

export const PRO_COUNTS = proSummary.counts;
export const PRO_TIERS = proSummary.tiers;
export const PRO_PLAN_ACCESS = proSummary.plans;
export const PRO_SHOWCASE_ITEMS = proSummary.showcase;

export const PRO_SUMMARY =
  `${PRO_COUNTS.components} components, ${PRO_COUNTS.blocks} blocks, ${PRO_COUNTS.appUi} app UI blocks, ` +
  `${PRO_COUNTS.templates} templates and ${PRO_COUNTS.agentKit} agent skills`;

export const PRO_SECTIONS = [
  {
    slug: 'components',
    label: 'Components',
    pageTitle: 'Pro Components',
    icon: Component,
    manifestKey: 'components',
    groupKey: 'components',
    countKey: 'components',
    countNoun: 'components',
    countLabel: 'animated components',
    tagline: 'Shaders, 3D, cursor effects and text, in Tailwind or plain CSS.',
    description:
      'Shaders, cursor effects, galleries and text animations, in Tailwind or vanilla CSS. One CLI command drops the real source into your project.',
    seoTitle: 'React Bits Pro - Animated React Components',
    seoDescription:
      'Browse every animated React component in React Bits Pro. Shader effects, custom cursors, galleries, 3D text and more, with Tailwind and CSS variants.',
    proPath: '/docs/components'
  },
  {
    slug: 'blocks',
    label: 'Blocks',
    pageTitle: 'Animated Blocks',
    icon: Blocks,
    manifestKey: 'blocks',
    variantLevel: true,
    previewDir: 'blocks',
    countKey: 'blocks',
    countNoun: 'blocks',
    categoryCountKey: 'blockCategories',
    categoryNoun: 'categories',
    countLabel: 'page sections',
    tagline: 'Heroes, pricing, FAQs and footers that stack into a full landing page.',
    description:
      'Heroes, pricing, FAQs, footers and every other section a landing page needs, each a single editable file. A full page is a few minutes of work.',
    seoTitle: 'React Bits Pro - React UI Blocks & Page Sections',
    seoDescription:
      'Browse React UI blocks from React Bits Pro: hero sections, pricing tables, FAQs, footers, auth screens and more, each in multiple ready-to-ship variants.',
    proPath: '/docs/blocks'
  },
  {
    slug: 'app-ui',
    label: 'App UI',
    countLabel: 'app UI blocks',
    pageTitle: 'Application UI',
    icon: Box,
    manifestKey: 'appUi',
    variantLevel: true,
    previewDir: 'app-ui',
    countKey: 'appUi',
    countNoun: 'app UI blocks',
    categoryCountKey: 'appUiCategories',
    categoryNoun: 'categories',
    tagline: 'Dashboards, tables, AI chat and auth, restyled from one theme panel.',
    description:
      'Dashboards, data tables, AI chat, forms, overlays and auth flows. Shared theme tokens restyle every screen at once, so they land looking like your product.',
    seoTitle: 'React Bits Pro - React App UI, Dashboards & AI Interfaces',
    seoDescription:
      'Dashboards, data tables, AI chat interfaces, forms, overlays and auth flows for React apps, from React Bits Pro.',
    proPath: '/docs/app-ui'
  },
  {
    slug: 'templates',
    label: 'Templates',
    pageTitle: 'Templates',
    icon: LayoutTemplate,
    manifestKey: 'templates',
    freeCount: 1,
    countKey: 'templates',
    countNoun: 'templates',
    countLabel: 'full templates',
    tagline: 'Multi-page Next.js sites. Swap the copy and deploy.',
    description:
      'Full multi-page Next.js templates, wired end to end. Download the project, swap the copy, deploy. The Portfolio template is free.',
    seoTitle: 'React Bits Pro - React & Next.js Website Templates',
    seoDescription:
      'Complete React and Next.js templates from React Bits Pro: SaaS, agency, portfolio, finance, AI and security sites, with live previews. One template is free.',
    proPath: '/docs/templates'
  },
  {
    slug: 'agent-kit',
    label: 'Agent Kit',
    sidebarLabel: 'Skills',
    countLabel: 'agent skills',
    pageTitle: 'Agent Kit',
    icon: Bot,
    manifestKey: 'agentKit',
    freeCount: 1,
    countKey: 'agentKit',
    countNoun: 'skills, prompts & recipes',
    tagline: 'Give Claude Code, Cursor and Copilot real design taste.',
    description:
      'Skills that teach Claude Code, Cursor and Copilot to build pages that look designed. They autoload once installed, so asking for the style is enough.',
    seoTitle: 'React Bits Pro - Agent Kit for Claude Code, Cursor & Copilot',
    seoDescription:
      'Design skills, prompts and recipes that teach AI coding agents to build well-designed React pages. Works with Claude Code, Cursor and Copilot. Includes a free skill.',
    proPath: '/docs/agent-kit'
  }
];

export const PRO_FAQ = [
  {
    q: 'Is the free React Bits going away?',
    a: 'No. Every component on this site stays free, open source and maintained. Pro is a separate library that sits on top of it, and it is what funds the free one.'
  },
  {
    q: 'Do I need to install a package?',
    a: 'No. The shadcn CLI copies real source files into your project, or you can paste them in by hand. There is no react-bits dependency to add or upgrade, and nothing to rip out later.'
  },
  {
    q: 'Can I use it on client work and SaaS?',
    a: 'Yes. One license covers one developer for unlimited commercial projects, including client work and your own products. The only thing you cannot do is repackage the code as a competing library or template.'
  },
  {
    q: 'Is it a subscription?',
    a: 'Your choice. Lifetime is a one-time payment that includes every future update. Annual is a yearly subscription you can cancel any time. Either way, code already in your project stays there permanently.'
  },
  {
    q: 'Can I match it to my brand?',
    a: 'Yes, and you restyle every app UI block at once. They share CSS custom properties for accent, base grey, font and radius, so a live theme panel with six presets changes all of them without editing a single file.'
  },
  {
    q: 'How does this work with AI?',
    a: 'Agents wire up logic well and invent visuals badly, so you hand them ours. Every file is readable, idiomatic source, and a SKILL.md teaches your agent the whole library so it installs the right piece instead of guessing.'
  },
  {
    q: 'What stack does it use?',
    a: 'Next.js 16, React 19, TypeScript and Tailwind CSS 4, with motion, GSAP or Three.js where an effect needs it. It is React-specific, so it will not drop into Vue or Svelte as-is.'
  },
  {
    q: 'How often does it get updates?',
    a: 'Every month, across the whole library: components, blocks, app UI, templates and agent skills. Lifetime buyers get all of it at no extra cost, so your library keeps growing without you doing anything.'
  },
  {
    q: 'Can I judge the quality before paying?',
    a: 'Yes, and you should. The full catalogue is previewable on the Pro site, the Pro docs are open to browse, and a complete template plus an agent skill are free. All sales are final, so please look first.'
  }
];

export const PRO_FREE_COPY = {
  'portfolio-template': 'A complete personal portfolio, animated and ready to deploy.',
  'terminal-dark': 'Teaches your agent to build dev-tool pages that look like real software.'
};

export const PRO_TESTIMONIALS = [
  {
    handle: '@shadcn',
    avatar: 'https://pbs.twimg.com/profile_images/1593304942210478080/TUYae5z7_400x400.jpg',
    text: 'Everything about this is next level.',
    url: 'https://x.com/shadcn/status/1962854085587275932'
  },
  {
    handle: '@JuzzBk',
    avatar: 'https://pbs.twimg.com/profile_images/2067474986286424064/hOqiQRjz_400x400.jpg',
    text: "I don't really invest in so many digital products but this is one of those I won't ever regret.",
    url: 'https://x.com/JuzzBk/status/2076791586374181298'
  },
  {
    handle: '@MajorBaguette',
    avatar: 'https://pbs.twimg.com/profile_images/1671069355872796677/l5NFDO8o_400x400.png',
    text: 'A product so well crafted that it becomes an instant classic in your stack? My last one is React Bits.',
    url: 'https://x.com/MajorBaguette/status/1968616151421776293'
  },
  {
    handle: '@juandadotdev',
    avatar: null,
    text: "Paid once, and he keeps shipping updates. Easiest value I've gotten from any tool.",
    url: 'https://x.com/juandadotdev/status/2082117331103162412'
  },
  {
    handle: '@MaartenSlebos',
    avatar: null,
    text: 'I start from a template and customize it with my agents using the React Bits skill. Makes my life so much easier.',
    url: 'https://x.com/MaartenSlebos'
  },
  {
    handle: '@NeuralAA',
    avatar: 'https://pbs.twimg.com/profile_images/1907255350740369408/hs1GAAg2_400x400.jpg',
    text: 'Incredibly creative components, with the hard things made fluid and performant.',
    url: 'https://x.com/NeuralAA/status/2083487874196890071'
  },
  {
    handle: '@gregberge_',
    avatar: 'https://pbs.twimg.com/profile_images/1722358890807861248/75S7CB3G_400x400.jpg',
    text: 'React Bits: A stellar collection of React components to make your landing pages shine ✨',
    url: 'https://x.com/gregberge_/status/1896425347866059041'
  },
  {
    handle: '@justine_chang39',
    avatar: 'https://pbs.twimg.com/profile_images/2038292993556533248/p5lPVFXv_400x400.jpg',
    text: '@davidhaz is cooking some of the most beautiful components I have ever seen with React Bits.',
    url: 'https://x.com/justine_chang39/status/1968195651457724550'
  },
  {
    handle: '@theorcdev',
    avatar: 'https://pbs.twimg.com/profile_images/1756766826736893952/6Gvg6jha_400x400.jpg',
    text: "If you haven't seen React Bits yet, you need to. David is grinding harder than any warrior you've seen before.",
    url: 'https://x.com/theorcdev/status/1963881697205715128'
  },
  {
    handle: '@adeelibr',
    avatar: 'https://pbs.twimg.com/profile_images/1859351824576245760/k0aPYRHF_400x400.jpg',
    text: 'An amazing list of curated react components - from text animation, hover effects, to really cool backgrounds.',
    url: 'https://x.com/adeelibr/status/1969517849065422974'
  },
  {
    handle: '@nolansym',
    avatar: 'https://pbs.twimg.com/profile_images/1882700369060642816/CU7TLjtQ_400x400.jpg',
    text: 'Genuinely blown away by the animation quality.',
    url: 'https://x.com/nolansym'
  },
  {
    handle: '@GibsonSMurray',
    avatar: 'https://pbs.twimg.com/profile_images/2072160805710143488/J0uL0tQ1_400x400.jpg',
    text: 'React Bits has got to be the most artistic component lib I have seen in a while 🤌',
    url: 'https://x.com/GibsonSMurray/status/1889909058838339626'
  },
  {
    handle: '@Logreg_n_coffee',
    avatar: 'https://pbs.twimg.com/profile_images/1554006663853592576/Gxtolzbo_400x400.jpg',
    text: 'Literally the coolest library for React.',
    url: 'https://x.com/Logreg_n_coffee/status/1889573533425991992'
  },
  {
    handle: '@syskey_dmg',
    avatar: 'https://pbs.twimg.com/profile_images/1918646280223608832/nqBF4zh__400x400.jpg',
    text: 'A sleek, minimal, and super dev-friendly React component library. Clean UI, easy to use, and perfect for modern projects.',
    url: 'https://x.com/syskey_dmg/status/1929762648922398754'
  },
  {
    handle: '@mrterrycarson',
    avatar: 'https://pbs.twimg.com/profile_images/833004663142117377/SjMv4aVQ_400x400.jpg',
    text: 'Great one to have for sure.',
    url: 'https://x.com/mrterrycarson/status/2077031484712493338'
  }
];

export { CATEGORY_PRO_GROUPS, PRO_UPSELLS, HIDDEN_TEMPLATE_SLUGS, PRO_SHOWCASE } from './pro-categories';
