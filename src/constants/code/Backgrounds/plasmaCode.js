import code from '@content/Backgrounds/Plasma/Plasma.jsx?raw';
import css from '@content/Backgrounds/Plasma/Plasma.css?raw';
import tailwind from '@tailwind/Backgrounds/Plasma/Plasma.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Plasma/Plasma.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Plasma/Plasma.tsx?raw';

export const plasma = {
  usage: `import Plasma from './Plasma';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Plasma
    color="#a6a3b8"
    speed={1}
    direction="forward"
    scale={1}
    twist={1}
    softness={0.5}
    shine={1}
    mouseInteractive={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
