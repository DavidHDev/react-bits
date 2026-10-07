export const CATEGORY_PRO_GROUPS = {
  backgrounds: {
    group: 'Backgrounds',
    noun: 'backgrounds',
    pitch: 'Shader scenes and animated surfaces made to sit behind real content.'
  },
  'text-animations': {
    group: 'Text',
    noun: 'text animations',
    pitch: 'Scroll reveals, 3D type and glitch effects for headlines that need to land.'
  },
  animations: {
    group: 'Cursor Effects',
    noun: 'cursor effects',
    pitch: 'Cursor trails and pointer effects that give a site its own feel.'
  },
  components: {
    noun: 'components',
    pitch: 'Galleries, cards and interactive pieces for pages that need more than the basics.'
  }
};

export const PRO_UPSELLS = {
  backgrounds: {
    eyebrow: 'More backgrounds in Pro',
    title: 'Build the atmosphere, not just the backdrop.',
    description: 'Editable shader scenes with responsive defaults and one-command installs.',
    path: '/docs/components?category=Backgrounds',
    noun: 'backgrounds',
    featured: [
      { slug: 'glass-tiles', name: 'Glass Tiles' },
      { slug: 'radial-liquid', name: 'Radial Liquid' },
      { slug: 'vortex', name: 'Vortex' },
      { slug: 'chroma-blinds', name: 'Chroma Blinds' }
    ]
  },
  'text-animations': {
    eyebrow: 'More text effects in Pro',
    title: 'Give every headline a point of view.',
    description: 'Expressive headline effects for reveals, scroll moments and hero typography.',
    path: '/docs/components?category=Text',
    noun: 'text animations',
    featured: [
      { slug: 'glitch-text', name: 'Glitch Text' },
      { slug: 'ascii-ripple', name: 'ASCII Ripple' },
      { slug: 'speeding-text', name: 'Speeding Text' },
      { slug: 'staggered-text', name: 'Staggered Text' }
    ]
  },
  animations: {
    eyebrow: 'More interactions in Pro',
    title: 'Turn movement into a signature.',
    description: 'Smooth cursor effects and responsive interactions, ready for real projects.',
    path: '/docs/components?category=Cursor%20Effects',
    noun: 'cursor effects',
    featured: [
      { slug: 'glass-cursor', name: 'Glass Cursor' },
      { slug: 'dither-cursor', name: 'Dither Cursor' },
      { slug: 'smooth-cursor', name: 'Smooth Cursor' }
    ]
  },
  components: {
    eyebrow: 'More UI in Pro',
    title: 'Go from a component to a complete product.',
    description: 'Polished UI components, page blocks and app screens built to work together.',
    path: '/docs/components',
    noun: 'components',
    featured: [
      { slug: 'reel-gallery', name: 'Reel Gallery' },
      { slug: 'shader-card', name: 'Shader Card' },
      { slug: 'comparison-slider', name: 'Comparison Slider' }
    ]
  },
  default: {
    eyebrow: 'React Bits Pro',
    title: 'Build the whole product with one library.',
    description: 'Components, page blocks, app UI, templates, the Agent Kit and page builders, ready to launch.',
    path: '/',
    noun: 'components',
    featured: [
      { slug: 'aurora-beam', name: 'Aurora Beam' },
      { slug: 'smooth-cursor', name: 'Smooth Cursor' },
      { slug: 'circle-gallery', name: 'Circle Gallery' }
    ]
  }
};

export const HIDDEN_TEMPLATE_SLUGS = ['ai-app-template', 'minimal-landing'];

export const PRO_SHOWCASE = {
  components: [
    'glowing-ridges',
    'long-exposure',
    'prismatic-slats',
    'astral-shell',
    'glyph-tide',
    'vapor-type',
    'radial-liquid',
    'synaptic-shift',
    'glass-tiles',
    'dither-wave',
    'passage-gallery',
    'orbit-reel'
  ],
  blocks: [
    'bento-31',
    'hero-23',
    'bento-2',
    'pricing-6',
    'bento-37',
    'hero-24',
    'bento-1',
    'social-proof-3',
    'bento-20',
    'cta-5',
    'bento-34',
    'ecommerce-6',
    'bento-12',
    'stats-5',
    'bento-5',
    'showcase-2'
  ],
  'app-ui': [
    'filtering-1',
    'monitoring-6',
    'analytics-14',
    'analytics-5',
    'dashboard-1',
    'dashboard-3',
    'kanban-1',
    'monitoring-10',
    'tool-calls-3',
    'scheduling-6',
    'file-manager-2',
    'analytics-13',
    'data-table-2',
    'chat-2',
    'editor-4',
    'command-menu-3'
  ],
  'agent-kit': [
    'skill-neobrutalism',
    'skill-playful-motion',
    'skill-swiss-grid',
    'skill-terminal-dark',
    'skill-editorial',
    'skill-luxury-serif',
    'skill-apple-minimal',
    'skill-corporate-trust',
    'prompt-fintech',
    'prompt-consumer-hardware',
    'prompt-ecommerce-brand',
    'recipe-saas-homepage'
  ],
  templates: []
};
