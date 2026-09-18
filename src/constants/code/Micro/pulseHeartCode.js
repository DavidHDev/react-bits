import code from '@content/Micro/PulseHeart/PulseHeart.jsx?raw';
import css from '@content/Micro/PulseHeart/PulseHeart.css?raw';
import tailwind from '@tailwind/Micro/PulseHeart/PulseHeart.jsx?raw';
import tsCode from '@ts-default/Micro/PulseHeart/PulseHeart.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/PulseHeart/PulseHeart.tsx?raw';

export const pulseHeart = {
  dependencies: `@hugeicons/core-free-icons`,
  usage: `import PulseHeart from './PulseHeart';

<PulseHeart
  count={1204}
  defaultLiked={false}
  onChange={(liked, count) => console.log(liked, count)}
  showCount
  icon="heart"
  idleOutline
  size={40}
  corner={32}
  likedColor="#ff4d6d"
  idleColor="#8b8b93"
  pillColor="#232326"
  textColor="#f5f5f5"
  duration={560}
  dotSize={0.3}
  overshoot={1.7}
  beat={3}
  rollDuration={350}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
