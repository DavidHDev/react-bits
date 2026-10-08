import code from '@content/TextAnimations/ShinyText/ShinyText.jsx?raw';
import css from '@content/TextAnimations/ShinyText/ShinyText.css?raw';
import tailwind from '@tailwind/TextAnimations/ShinyText/ShinyText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/ShinyText/ShinyText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/ShinyText/ShinyText.tsx?raw';

export const shinyText = {
  dependencies: ``,
  usage: `import ShinyText from './ShinyText';

<ShinyText
  text="Shiny Text Effect"
  color="#b5b5b5"
  shineColor="#ffffff"
  speed={2}
  shineWidth={40}
  softness={0.8}
  trigger="loop"
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
