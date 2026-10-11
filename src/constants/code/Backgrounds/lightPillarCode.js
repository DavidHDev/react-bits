import code from '@content/Backgrounds/LightPillar/LightPillar.jsx?raw';
import css from '@content/Backgrounds/LightPillar/LightPillar.css?raw';
import tailwind from '@tailwind/Backgrounds/LightPillar/LightPillar.jsx?raw';
import tsCode from '@ts-default/Backgrounds/LightPillar/LightPillar.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/LightPillar/LightPillar.tsx?raw';

export const lightPillar = {
  usage: `import LightPillar from './LightPillar';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LightPillar
    topColor="#5227FF"
    bottomColor="#FF9FFC"
    intensity={1}
    glowAmount={0.002}
    bloom={0.5}
    pillarWidth={3}
    pillarHeight={0.4}
    pillarRotation={25}
    rotationSpeed={0.3}
    interactive
    clickPulse
    intro
    quality="high"
    mixBlendMode="screen"
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
