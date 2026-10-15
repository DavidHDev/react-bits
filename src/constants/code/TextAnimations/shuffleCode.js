import code from '@content/TextAnimations/Shuffle/Shuffle.jsx?raw';
import css from '@content/TextAnimations/Shuffle/Shuffle.css?raw';
import tailwind from '@tailwind/TextAnimations/Shuffle/Shuffle.jsx?raw';
import tsCode from '@ts-default/TextAnimations/Shuffle/Shuffle.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/Shuffle/Shuffle.tsx?raw';

export const shuffle = {
  dependencies: `gsap @gsap/react`,
  usage: `import Shuffle from './Shuffle';

<Shuffle
  text="Hello World"
  effect="slide"
  shuffleDirection="right"
  duration={0.35}
  animationMode="evenodd"
  shuffleTimes={1}
  ease="power3.out"
  stagger={0.03}
  threshold={0.1}
  triggerOnce={true}
  triggerOnHover={true}
  hoverRadius={0}
  motionBlur={false}
  respectReducedMotion={true}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
