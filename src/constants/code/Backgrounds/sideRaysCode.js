import code from '@content/Backgrounds/SideRays/SideRays.jsx?raw';
import css from '@content/Backgrounds/SideRays/SideRays.css?raw';
import tailwind from '@tailwind/Backgrounds/SideRays/SideRays.jsx?raw';
import tsCode from '@ts-default/Backgrounds/SideRays/SideRays.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/SideRays/SideRays.tsx?raw';

export const sideRays = {
  usage: `import SideRays from './SideRays';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <SideRays
    rayColor1="#FFC46B"
    rayColor2="#96c8ff"
    origin="top-right"
    speed={2.5}
    intensity={2}
    spread={2}
    density={5}
    followMouse={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
