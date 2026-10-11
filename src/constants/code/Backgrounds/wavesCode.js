import code from '@content/Backgrounds/Waves/Waves.jsx?raw';
import css from '@content/Backgrounds/Waves/Waves.css?raw';
import tailwind from '@tailwind/Backgrounds/Waves/Waves.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Waves/Waves.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Waves/Waves.tsx?raw';

export const waves = {
  usage: `import Waves from './Waves';

<div style={{ position: 'relative', width: '100%', height: '600px' }}>
  <Waves
    lineColor="#ffffff"
    spacing={10}
    amplitude={32}
    twist={1}
    speed={1}
    mouseRadius={175}
    mouseStrength={1}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
