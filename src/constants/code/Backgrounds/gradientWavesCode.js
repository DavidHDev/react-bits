import code from '@content/Backgrounds/GradientWaves/GradientWaves.jsx?raw';
import css from '@content/Backgrounds/GradientWaves/GradientWaves.css?raw';
import tailwind from '@tailwind/Backgrounds/GradientWaves/GradientWaves.jsx?raw';
import tsCode from '@ts-default/Backgrounds/GradientWaves/GradientWaves.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/GradientWaves/GradientWaves.tsx?raw';

export const gradientWaves = {
  dependencies: ``,
  usage: `import GradientWaves from './GradientWaves';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GradientWaves
    horizonColor="#5227FF"
    waveColor="#FF9FFC"
    crestColor="#FFFFFF"
    speed={0.4}
    amplitude={2.5}
    relief={1}
    lightAngle={120}
    mouseInteraction
    swellOnClick
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
