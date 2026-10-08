import code from '@content/TextAnimations/GradientText/GradientText.jsx?raw';
import css from '@content/TextAnimations/GradientText/GradientText.css?raw';
import tailwind from '@tailwind/TextAnimations/GradientText/GradientText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/GradientText/GradientText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/GradientText/GradientText.tsx?raw';

export const gradientText = {
  dependencies: ``,
  usage: `import GradientText from './GradientText';

<GradientText
  colors={['#5227FF', '#FF9FFC', '#B497CF']}
  animationSpeed={8}
  variant="flow"
  glow={0.4}
>
  Add a splash of color!
</GradientText>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
