import code from '@content/Components/FlyingPosters/FlyingPosters.jsx?raw';
import css from '@content/Components/FlyingPosters/FlyingPosters.css?raw';
import tailwind from '@tailwind/Components/FlyingPosters/FlyingPosters.jsx?raw';
import tsCode from '@ts-default/Components/FlyingPosters/FlyingPosters.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/FlyingPosters/FlyingPosters.tsx?raw';

export const flyingPosters = {
  usage: `import FlyingPosters from './FlyingPosters';

const items = [
  '/assets/demo/day-portrait.webp',
  '/assets/demo/night-landscape.webp',
  '/assets/demo/day-landscape.webp',
  '/assets/demo/night-portrait.webp'
];

<div style={{ height: 600, position: 'relative' }}>
  <FlyingPosters
    items={items}
    planeWidth={320}
    planeHeight={320}
    distortion={3}
    scrollEase={0.01}
    cameraFov={45}
    cameraZ={20}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
