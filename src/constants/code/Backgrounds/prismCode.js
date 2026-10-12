import code from '@content/Backgrounds/Prism/Prism.jsx?raw';
import css from '@content/Backgrounds/Prism/Prism.css?raw';
import tailwind from '@tailwind/Backgrounds/Prism/Prism.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Prism/Prism.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Prism/Prism.tsx?raw';

export const prism = {
  usage: `import Prism from './Prism';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Prism
    animationType="rotate"
    timeScale={0.5}
    height={3.5}
    baseWidth={5.5}
    scale={3.6}
    hueShift={0}
    colorFrequency={1}
    glow={1}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
