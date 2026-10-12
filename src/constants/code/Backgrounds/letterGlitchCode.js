import code from '@content/Backgrounds/LetterGlitch/LetterGlitch.jsx?raw';
import css from '@content/Backgrounds/LetterGlitch/LetterGlitch.css?raw';
import tailwind from '@tailwind/Backgrounds/LetterGlitch/LetterGlitch.jsx?raw';
import tsCode from '@ts-default/Backgrounds/LetterGlitch/LetterGlitch.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/LetterGlitch/LetterGlitch.tsx?raw';

export const letterGlitch = {
  usage: `import LetterGlitch from './LetterGlitch';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LetterGlitch
    glitchColors={['#ffffff', '#61dca3']}
    glitchAmount={0.5}
    speed={1}
    flow={0.5}
    clickEffect="tear"
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
