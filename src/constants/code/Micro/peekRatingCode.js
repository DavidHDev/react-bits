import code from '@content/Micro/PeekRating/PeekRating.jsx?raw';
import css from '@content/Micro/PeekRating/PeekRating.css?raw';
import tailwind from '@tailwind/Micro/PeekRating/PeekRating.jsx?raw';
import tsCode from '@ts-default/Micro/PeekRating/PeekRating.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/PeekRating/PeekRating.tsx?raw';

export const peekRating = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import PeekRating from './PeekRating';

<PeekRating
  defaultValue={3}
  count={5}
  shape="star"
  labels={['Poor', 'Fair', 'Good', 'Great', 'Superb']}
  activeColor="#f5b400"
  idleColor="#52525b"
  tipColor="#27272a"
  tipTextColor="#f5f5f5"
  size={32}
  lift={7}
  magnify={1.15}
  riseDuration={320}
  popScale={1.3}
  showTip
  allowClear
  onChange={value => console.log('rated', value)}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
