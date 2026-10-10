import code from '@content/Components/GooeyNav/GooeyNav.jsx?raw';
import css from '@content/Components/GooeyNav/GooeyNav.css?raw';
import tailwind from '@tailwind/Components/GooeyNav/GooeyNav.jsx?raw';
import tsCode from '@ts-default/Components/GooeyNav/GooeyNav.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/GooeyNav/GooeyNav.tsx?raw';

export const gooeyNav = {
  usage: `import GooeyNav from './GooeyNav';

const items = [
  { label: 'Home', href: '#' },
  { label: 'Work', href: '#' },
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#' }
];

<GooeyNav
  items={items}
  initialActiveIndex={0}
  theme="dark"
  size="md"
  frame={true}
  particleCount={15}
  spread={56}
  animationTime={600}
  timeVariance={300}
  gooeyness={0.5}
  wobble={0.5}
  hoverEffect={true}
  onChange={(index, item) => console.log(index, item.label)}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
