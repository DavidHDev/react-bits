import code from '@content/Components/InfiniteMenu/InfiniteMenu.jsx?raw';
import css from '@content/Components/InfiniteMenu/InfiniteMenu.css?raw';
import tailwind from '@tailwind/Components/InfiniteMenu/InfiniteMenu.jsx?raw';
import tsCode from '@ts-default/Components/InfiniteMenu/InfiniteMenu.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/InfiniteMenu/InfiniteMenu.tsx?raw';

export const infiniteMenu = {
  usage: `import InfiniteMenu from './InfiniteMenu';

const items = [
  {
    image: '/assets/demo/day-portrait.webp',
    link: 'https://reactbits.dev',
    title: 'The Pier',
    description: 'Concrete and open water under a bright morning sky.'
  },
  {
    image: '/assets/demo/night-landscape.webp',
    link: 'https://reactbits.dev',
    title: 'Moonlit Field',
    description: 'A single pole in a field of rapeseed under the full moon.'
  },
  {
    image: '/assets/demo/day-landscape.webp',
    link: 'https://reactbits.dev',
    title: 'Rapeseed',
    description: 'The same field at noon, yellow all the way to the horizon.'
  }
];

<div style={{ height: 600, position: 'relative' }}>
  <InfiniteMenu
    items={items}
    count={160}
    tileSize={0.63}
    roundness={0.2}
    zoom={1.65}
    pullBack={1}
    stretch={0.6}
    inertia={0.6}
    autoplay={3}
    grayscale={true}
    dim={0.5}
    intro={true}
    showInfo={true}
    theme="dark"
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
