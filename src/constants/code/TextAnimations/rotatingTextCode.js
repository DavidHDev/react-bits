import code from '@content/TextAnimations/RotatingText/RotatingText.jsx?raw';
import css from '@content/TextAnimations/RotatingText/RotatingText.css?raw';
import tailwind from '@tailwind/TextAnimations/RotatingText/RotatingText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/RotatingText/RotatingText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/RotatingText/RotatingText.tsx?raw';

export const rotatingText = {
  dependencies: `motion`,
  usage: `import RotatingText from './RotatingText';

<RotatingText
  texts={['React', 'Bits', 'Is', 'Cool!']}
  effect="slide"
  direction="up"
  highlight={true}
  highlightColor="#a855f7"
  staggerFrom="last"
  staggerDuration={0.025}
  splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
  rotationInterval={2000}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
