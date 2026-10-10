import code from '@content/Components/AnimatedList/AnimatedList.jsx?raw';
import css from '@content/Components/AnimatedList/AnimatedList.css?raw';
import tailwind from '@tailwind/Components/AnimatedList/AnimatedList.jsx?raw';
import tsCode from '@ts-default/Components/AnimatedList/AnimatedList.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/AnimatedList/AnimatedList.tsx?raw';

export const animatedList = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import AnimatedList from './AnimatedList'

const items = [
  { title: 'Brand assets', description: '24 files', meta: '2m' },
  { title: 'Launch hero.png', description: '2.4 MB', meta: '18m' },
  { title: 'Product tour.mp4', description: '148 MB', meta: '1h' },
  { title: 'Pricing notes', description: '1,240 words', meta: '3h' }
];

<AnimatedList
  items={items}
  onItemSelect={(item, index) => console.log(item, index)}
  animation="pop"
  theme="dark"
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
