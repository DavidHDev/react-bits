import code from '@content/Backgrounds/LightTunnel/LightTunnel.jsx?raw';
import css from '@content/Backgrounds/LightTunnel/LightTunnel.css?raw';
import tailwind from '@tailwind/Backgrounds/LightTunnel/LightTunnel.jsx?raw';
import tsCode from '@ts-default/Backgrounds/LightTunnel/LightTunnel.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/LightTunnel/LightTunnel.tsx?raw';

export const lightTunnel = {
  usage: `import LightTunnel from './LightTunnel';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LightTunnel
    cableColor="#ffffff"
    pulseColor="#ffffff"
    cableCount={56}
    pulseDensity={0.5}
    flowDirection="inward"
    mouseInteraction
    clickSurge
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
