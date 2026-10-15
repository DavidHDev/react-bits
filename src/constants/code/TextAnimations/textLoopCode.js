import code from '@content/TextAnimations/TextLoop/TextLoop.jsx?raw';
import css from '@content/TextAnimations/TextLoop/TextLoop.css?raw';
import tailwind from '@tailwind/TextAnimations/TextLoop/TextLoop.jsx?raw';
import tsCode from '@ts-default/TextAnimations/TextLoop/TextLoop.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/TextLoop/TextLoop.tsx?raw';

export const textLoop = {
  dependencies: `gsap`,
  usage: `import TextLoop from './TextLoop';

<TextLoop
  text="React ✦ Bits"
  shape="wave"
  speed={90}
  direction="forward"
  separator="✦"
  curviness={90}
  tilt={0}
  fontSize={46}
  fontWeight={800}
  letterSpacing={2}
  uppercase
  ribbon
  ribbonColor="#5227FF"
  ribbonWidth={86}
  edgeFade={0}
  cross={false}
  crossAngle={16}
  draggable={false}
  scrollBoost={0}
  outline={false}
  pauseOnHover
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
