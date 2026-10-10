import code from '@content/Backgrounds/SlicedWaves/SlicedWaves.jsx?raw';
import css from '@content/Backgrounds/SlicedWaves/SlicedWaves.css?raw';
import tailwind from '@tailwind/Backgrounds/SlicedWaves/SlicedWaves.jsx?raw';
import tsCode from '@ts-default/Backgrounds/SlicedWaves/SlicedWaves.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/SlicedWaves/SlicedWaves.tsx?raw';

export const slicedWaves = {
  usage: `import SlicedWaves from './SlicedWaves';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <SlicedWaves
    color1="#ffd9a8"
    color2="#ff5fa2"
    color3="#5b8cff"
    ribbons={3}
    spacing={28}
    perspective={0.45}
    blur={0.6}
    glow={1}
    position={0.78}
    mouseInteraction={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
