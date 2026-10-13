import code from '@content/Animations/FadeContent/FadeContent.jsx?raw';
import tailwind from '@tailwind/Animations/FadeContent/FadeContent.jsx?raw';
import tsCode from '@ts-default/Animations/FadeContent/FadeContent.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/FadeContent/FadeContent.tsx?raw';

export const fadeContent = {
  dependencies: `gsap`,
  usage: `import FadeContent from './FadeContent'

<FadeContent
  effect="mist"
  duration={1.8}
  ease="power2.out"
  stagger={0.1}
  threshold={0.1}
>
  <h2>Slow light over the bay</h2>
  <p>Every child fades in turn.</p>
</FadeContent>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
