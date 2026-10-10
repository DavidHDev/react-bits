import code from '@content/Backgrounds/PlasmaWave/PlasmaWave.jsx?raw';
import css from '@content/Backgrounds/PlasmaWave/PlasmaWave.css?raw';
import tailwind from '@tailwind/Backgrounds/PlasmaWave/PlasmaWave.jsx?raw';
import tsCode from '@ts-default/Backgrounds/PlasmaWave/PlasmaWave.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/PlasmaWave/PlasmaWave.tsx?raw';

export const plasmaWave = {
  usage: `import PlasmaWave from './PlasmaWave';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PlasmaWave
    colors={['#A855F7', '#06B6D4']}
    speed={1}
    bend1={1}
    bend2={0.5}
    thickness={0.3}
    glow={1}
    core={0.6}
    mouseInteraction={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
