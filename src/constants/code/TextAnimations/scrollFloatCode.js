import code from '@content/TextAnimations/ScrollFloat/ScrollFloat.jsx?raw';
import css from '@content/TextAnimations/ScrollFloat/ScrollFloat.css?raw';
import tailwind from '@tailwind/TextAnimations/ScrollFloat/ScrollFloat.jsx?raw';
import tsCode from '@ts-default/TextAnimations/ScrollFloat/ScrollFloat.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/ScrollFloat/ScrollFloat.tsx?raw';

export const scrollFloat = {
  dependencies: `gsap`,
  usage: `import ScrollFloat from './ScrollFloat';

<ScrollFloat
  effect="float"
  splitBy="chars"
  direction="up"
  order="start"
  fromColor="currentColor"
  animationDuration={1}
  ease="back.inOut(2)"
  scrollStart="center bottom+=50%"
  scrollEnd="bottom bottom-=40%"
  stagger={0.03}
  distance={120}
  stretch={2.3}
  smoothing={0}
>
  React Bits
</ScrollFloat>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
