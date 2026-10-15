import code from '@content/TextAnimations/BlurText/BlurText.jsx?raw';
import tailwind from '@tailwind/TextAnimations/BlurText/BlurText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/BlurText/BlurText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/BlurText/BlurText.tsx?raw';

export const blurText = {
  dependencies: 'motion',
  usage: `import BlurText from "./BlurText";

const handleAnimationComplete = () => {
  console.log('Animation completed!');
};

<BlurText
  text="Isn't this so cool?!"
  effect="blur"
  animateBy="words"
  direction="top"
  staggerFrom="start"
  trigger="view"
  delay={200}
  stepDuration={0.35}
  blur={10}
  distance={50}
  onAnimationComplete={handleAnimationComplete}
  className="text-2xl mb-8"
/>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
