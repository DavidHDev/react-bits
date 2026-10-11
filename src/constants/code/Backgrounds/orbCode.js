import code from '@content/Backgrounds/Orb/Orb.jsx?raw';
import css from '@content/Backgrounds/Orb/Orb.css?raw';
import tailwind from '@tailwind/Backgrounds/Orb/Orb.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Orb/Orb.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Orb/Orb.tsx?raw';

export const orb = {
  usage: `import Orb from './Orb';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Orb
    colors={['#9c43fe', '#4cc2e9', '#101499']}
    hoverIntensity={1}
    trail={1}
    rotateOnHover
    followCursor
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
