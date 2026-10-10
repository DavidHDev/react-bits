import code from '@content/Backgrounds/Beams/Beams.jsx?raw';
import css from '@content/Backgrounds/Beams/Beams.css?raw';
import tailwind from '@tailwind/Backgrounds/Beams/Beams.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Beams/Beams.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Beams/Beams.tsx?raw';

export const beams = {
  usage: `import Beams from './Beams';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Beams
    color="#ffffff"
    beamWidth={140}
    rotation={30}
    speed={1}
    glow={0.6}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
