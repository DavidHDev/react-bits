import code from '@content/Backgrounds/PatternWaves/PatternWaves.jsx?raw';
import css from '@content/Backgrounds/PatternWaves/PatternWaves.css?raw';
import tailwind from '@tailwind/Backgrounds/PatternWaves/PatternWaves.jsx?raw';
import tsCode from '@ts-default/Backgrounds/PatternWaves/PatternWaves.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/PatternWaves/PatternWaves.tsx?raw';

export const patternWaves = {
  dependencies: `ogl`,
  usage: `import PatternWaves from './PatternWaves';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PatternWaves
    preset="silk"
    color="#ffffff"
    backgroundColor="#000000"
    fade="edges"
    interactive
    cursorSize={50}
    cursorStrength={0.6}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
