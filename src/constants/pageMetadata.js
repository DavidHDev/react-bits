export const PAGE_METADATA = {
  '/get-started/introduction': {
    title: 'Introduction to React Bits | Free React Components',
    heading: 'Introduction',
    description:
      'Free, open source animated React components and backgrounds in JavaScript or TypeScript, with plain CSS or Tailwind. See what is inside, how to install it and how it works with AI.',
    intro:
      'React Bits is a free, open source library of animated React components and backgrounds that you copy into your project and make your own.'
  },
  '/get-started/installation': {
    title: 'Install React Bits Components | React Bits',
    heading: 'Installation',
    description:
      'Install React Bits components with the shadcn or jsrepo CLI, or copy the source. Choose JavaScript or TypeScript and CSS or Tailwind.',
    intro:
      'Every component installs as source code you own. Pull it in with one CLI command, or copy the files by hand.'
  },
  '/get-started/mcp': {
    title: 'React Component Registry MCP Setup | React Bits',
    heading: 'MCP Server',
    description:
      'Connect your coding agent to the React Bits registry through the shadcn MCP server to discover and install components.',
    intro: 'Connect your coding agent to the React Bits registry through the shadcn MCP server.'
  },
  '/get-started/changelog': {
    title: 'React Bits Changelog | New Components and Updates',
    heading: 'Changelog',
    description: 'Keep up with the newest additions to React Bits.',
    intro: 'Keep up with the newest additions to React Bits.'
  },
  '/tools': {
    title: 'Free Background, Shape, Texture, Mockup and Sound Tools | React Bits',
    heading: 'Creative tools',
    description:
      'Create animated backgrounds, SVG shapes, image textures, device mockups and interface sounds with free browser-based tools from React Bits.',
    intro:
      'Free tools that run in your browser. Make a background, a shape, a texture, a product shot or a sound, tune it live, then take it into your project.',
    image: '/og/tools/index.jpg',
    imageAlt:
      'Background Studio, Shape Magic, Texture Lab, Center Stage and Sound Lab, free creative tools by React Bits.'
  },
  '/showcase': {
    title: 'React Bits - Showcase',
    heading: 'Showcase',
    description: 'See how developers around the world are using React Bits components in their projects.',
    intro: 'See how developers around the world are using React Bits in their projects.'
  },
  '/sponsors': {
    title: 'React Bits - Sponsors',
    heading: 'Sponsors',
    description:
      'Support the open-source React Bits component library. Explore sponsorship opportunities and meet the project’s supporters.',
    intro: 'Support the open-source React Bits component library.'
  },
  '/pro': {
    title: 'React Bits Pro - Components, Blocks, App UI & Templates',
    heading: 'React Bits Pro',
    description:
      'See everything that ships with React Bits Pro: animated components, marketing blocks, app UI blocks, complete Next.js templates and an Agent Kit for AI coding tools. Lifetime or annual, full source, yours to edit.',
    intro:
      'Animated components, marketing blocks, app UI blocks, complete Next.js templates and an Agent Kit for AI coding tools.'
  },
  '/favorites': {
    title: 'React Bits - Favorites',
    heading: 'Favorites',
    description: 'Your saved React Bits components on this browser.',
    intro: 'Your saved React Bits components on this browser.',
    robots: 'noindex, follow'
  }
};

export const getToolSEO = tool => ({
  title: `${tool.label} | Free Creative Tool by React Bits`,
  heading: tool.label,
  description: tool.description,
  intro: tool.description,
  path: tool.path,
  image: `/og/tools/${tool.id}.jpg`,
  imageAlt: `${tool.label}, a free creative tool by React Bits.`
});
