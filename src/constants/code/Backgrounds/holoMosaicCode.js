import code from '@content/Backgrounds/HoloMosaic/HoloMosaic.jsx?raw';
import css from '@content/Backgrounds/HoloMosaic/HoloMosaic.css?raw';
import tailwind from '@tailwind/Backgrounds/HoloMosaic/HoloMosaic.jsx?raw';
import tsCode from '@ts-default/Backgrounds/HoloMosaic/HoloMosaic.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/HoloMosaic/HoloMosaic.tsx?raw';

export const holoMosaic = {
  usage: `import HoloMosaic from './HoloMosaic';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <HoloMosaic
    color="#120f17"
    metalColor="#e8ebf1"
    spectrum="full"
    tileSize={1}
    gap={0.08}
    scatter={0.3}
    tilt={0.35}
    saturation={0.1}
    intensity={1.25}
    ripple={0.6}
    glitter={0.85}
    sheen={0.8}
    grain={0.08}
    speed={0.5}
    intro={true}
    mouseInteraction={true}
    flipOnClick={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
