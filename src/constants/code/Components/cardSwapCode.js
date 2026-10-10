import code from '@content/Components/CardSwap/CardSwap.jsx?raw';
import css from '@content/Components/CardSwap/CardSwap.css?raw';
import tailwind from '@tailwind/Components/CardSwap/CardSwap.jsx?raw';
import tsCode from '@ts-default/Components/CardSwap/CardSwap.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/CardSwap/CardSwap.tsx?raw';

export const cardSwap = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import CardSwap, { Card } from './CardSwap'

const items = [
  { title: 'Golden hour', image: '/photos/sky.jpg' },
  { title: 'Canola field', image: '/photos/field.jpg' },
  { title: 'The pier', image: '/photos/pier.jpg' },
  { title: 'Pink drift', image: '/photos/clouds.jpg' }
];

<div style={{ height: 600 }}>
  <CardSwap items={items} delay={4000} />
</div>

<div style={{ height: 600 }}>
  <CardSwap width={420} height={300}>
    <Card>Your content</Card>
    <Card>Your content</Card>
    <Card>Your content</Card>
  </CardSwap>
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
