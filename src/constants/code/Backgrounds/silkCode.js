import code from '@content/Backgrounds/Silk/Silk.jsx?raw';
import css from '@content/Backgrounds/Silk/Silk.css?raw';
import tailwind from '@tailwind/Backgrounds/Silk/Silk.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Silk/Silk.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Silk/Silk.tsx?raw';

export const silkCode = {
  usage: `import Silk from './Silk';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Silk
    color="#5227FF"
    sheenColor="#ffffff"
    speed={5}
    scale={1}
    rotation={0}
    sheen={0.5}
    depth={0.5}
    glow={0.3}
    noiseIntensity={1.5}
    mouseInteraction
    clickRipple
    intro
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
