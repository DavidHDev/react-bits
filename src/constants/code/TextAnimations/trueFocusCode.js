import code from '@content/TextAnimations/TrueFocus/TrueFocus.jsx?raw';
import css from '@content/TextAnimations/TrueFocus/TrueFocus.css?raw';
import tailwind from '@tailwind/TextAnimations/TrueFocus/TrueFocus.jsx?raw';
import tsCode from '@ts-default/TextAnimations/TrueFocus/TrueFocus.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/TrueFocus/TrueFocus.tsx?raw';

export const trueFocus = {
  dependencies: `motion`,
  usage: `import TrueFocus from './TrueFocus';

<TrueFocus
  sentence="True Focus"
  manualMode={false}
  focusStyle="brackets"
  easing="smooth"
  order="sequential"
  blurAmount={5}
  focusScale={1}
  unfocusedOpacity={1}
  borderColor="#5227FF"
  cornerSize={16}
  borderWidth={3}
  animationDuration={0.5}
  pauseBetweenAnimations={1}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
