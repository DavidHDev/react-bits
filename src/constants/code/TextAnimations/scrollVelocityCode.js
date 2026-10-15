import code from '@content/TextAnimations/ScrollVelocity/ScrollVelocity.jsx?raw';
import css from '@content/TextAnimations/ScrollVelocity/ScrollVelocity.css?raw';
import tailwind from '@tailwind/TextAnimations/ScrollVelocity/ScrollVelocity.jsx?raw';
import tsCode from '@ts-default/TextAnimations/ScrollVelocity/ScrollVelocity.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/ScrollVelocity/ScrollVelocity.tsx?raw';

export const scrollVelocity = {
  dependencies: `motion`,
  usage: `import ScrollVelocity from './ScrollVelocity';

<ScrollVelocity
  texts={['React Bits', 'Scroll Down']}
  velocity={100}
  skewWithVelocity={16}
  scaleWithVelocity={0.18}
  draggable
  fontSize={104}
  fontWeight={900}
  className="custom-scroll-text"
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
