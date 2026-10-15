import code from '@content/TextAnimations/ScrollReveal/ScrollReveal.jsx?raw';
import css from '@content/TextAnimations/ScrollReveal/ScrollReveal.css?raw';
import tailwind from '@tailwind/TextAnimations/ScrollReveal/ScrollReveal.jsx?raw';
import tsCode from '@ts-default/TextAnimations/ScrollReveal/ScrollReveal.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/ScrollReveal/ScrollReveal.tsx?raw';

export const scrollReveal = {
  dependencies: `gsap`,
  usage: `import ScrollReveal from './ScrollReveal';

<ScrollReveal
  highlightColor=""
  mode="scrub"
  splitBy="words"
  effect="fade"
  stagger={0.05}
  duration={0.8}
  smoothing={0}
  baseOpacity={0.1}
  baseRotation={3}
  baseOffset={0}
  enableBlur={true}
  blurStrength={4}
>
  When does a man die? When he is hit by a bullet? No! When he suffers a disease?
  No! When he ate a soup made out of a poisonous mushroom?
  No! A man dies when he is forgotten!
</ScrollReveal>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
