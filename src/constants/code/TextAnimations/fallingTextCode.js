import code from '@content/TextAnimations/FallingText/FallingText.jsx?raw';
import css from '@content/TextAnimations/FallingText/FallingText.css?raw';
import tailwind from '@tailwind/TextAnimations/FallingText/FallingText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/FallingText/FallingText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/FallingText/FallingText.tsx?raw';

export const fallingText = {
  dependencies: 'matter-js',
  usage: `import FallingText from './FallingText';

<div style={{ height: '400px', position: 'relative' }}>
  <FallingText
    text="Some sentences are built to last. This one falls apart on contact."
    highlightWords={['falls', 'apart']}
    trigger="hover"
    fontSize="2rem"
    gravity={1}
    restoreDelay={2}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
