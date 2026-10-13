import code from '@content/Animations/AnimatedContent/AnimatedContent.jsx?raw';
import tailwind from '@tailwind/Animations/AnimatedContent/AnimatedContent.jsx?raw';
import tsCode from '@ts-default/Animations/AnimatedContent/AnimatedContent.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/AnimatedContent/AnimatedContent.tsx?raw';

export const animatedContent = {
  dependencies: `gsap`,
  usage: `import AnimatedContent from './AnimatedContent'

<AnimatedContent
  distance={100}
  direction="vertical"
  duration={0.8}
  ease="power3.out"
  blur={0}
  stagger={0.08}
  threshold={0.1}
>
  <h2>Ship it before lunch</h2>
  <p>Every child animates in turn.</p>
</AnimatedContent>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
