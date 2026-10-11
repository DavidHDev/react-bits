import code from '@content/Backgrounds/Ferrofluid/Ferrofluid.jsx?raw';
import css from '@content/Backgrounds/Ferrofluid/Ferrofluid.css?raw';
import tailwind from '@tailwind/Backgrounds/Ferrofluid/Ferrofluid.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Ferrofluid/Ferrofluid.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Ferrofluid/Ferrofluid.tsx?raw';

export const ferrofluid = {
  usage: `import Ferrofluid from './Ferrofluid';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Ferrofluid
    colors={['#ffffff', '#ffffff', '#ffffff']}
    spikeHeight={1}
    sharpness={2.5}
    tilt={48}
    magnets={2}
    mouseInteraction
    clickPulse
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
