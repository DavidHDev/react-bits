import code from '@content/TextAnimations/TechText/TechText.jsx?raw';
import css from '@content/TextAnimations/TechText/TechText.css?raw';
import tailwind from '@tailwind/TextAnimations/TechText/TechText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/TechText/TechText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/TechText/TechText.tsx?raw';

export const techText = {
  dependencies: ``,
  usage: `import TechText from './TechText';

<div style={{ width: '100%', height: '480px', position: 'relative' }}>
  <TechText
    text="React Bits"
    fontWeight={600}
    fontSize={150}
    reveal="letter"
    dashLength={4}
    dashGap={2}
    specks={15}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
