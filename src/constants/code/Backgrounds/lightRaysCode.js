import code from '@content/Backgrounds/LightRays/LightRays.jsx?raw';
import css from '@content/Backgrounds/LightRays/LightRays.css?raw';
import tailwind from '@tailwind/Backgrounds/LightRays/LightRays.jsx?raw';
import tsCode from '@ts-default/Backgrounds/LightRays/LightRays.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/LightRays/LightRays.tsx?raw';

export const lightRays = {
  dependencies: ``,
  usage: `import LightRays from './LightRays';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LightRays
    raysOrigin="top-center"
    raysColor="#ffffff"
    raysSpeed={1}
    lightSpread={0.5}
    rayLength={3}
    glow={0.6}
    haze={0.25}
    followMouse
    mouseInfluence={0.1}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
