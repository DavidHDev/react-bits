import code from '@content/TextAnimations/FuzzyText/FuzzyText.jsx?raw';
import tailwind from '@tailwind/TextAnimations/FuzzyText/FuzzyText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/FuzzyText/FuzzyText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/FuzzyText/FuzzyText.tsx?raw';

export const fuzzyText = {
  usage: `import FuzzyText from './FuzzyText';

<FuzzyText
  colorSplit={0}
  trigger="hover"
  direction="horizontal"
  baseIntensity={0.2}
  hoverIntensity={0.5}
  fuzzRange={30}
  sliceSize={1}
  fps={60}
  transitionDuration={0}
  intro={true}
  introDuration={1400}
  letterSpacing={0}
  enableHover={true}
  clickEffect={false}
  glitchMode={false}
  glitchInterval={2000}
  glitchDuration={200}
>
  404
</FuzzyText>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
