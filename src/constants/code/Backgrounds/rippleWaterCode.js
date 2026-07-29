import code from '@content/Backgrounds/RippleWater/RippleWater.jsx?raw';
import tailwind from '@tailwind/Backgrounds/RippleWater/RippleWater.jsx?raw';
import tsCode from '@ts-default/Backgrounds/RippleWater/RippleWater.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/RippleWater/RippleWater.tsx?raw';

export const rippleWater = {
  dependencies: ``,
  usage: `import RippleWater from './RippleWater';

<div style={{ position: 'relative', height: '500px', overflow: 'hidden' }}>
  <RippleWater
    fromColor="#52ade3"
    toColor="#013565"
    color="#a8d8f5"
    waveAmplitude={1}
    waveSpeed={1}
    shimmer={1}
    reflection={0.38}
    rippleStrength={1}
    interactive
  />
</div>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
