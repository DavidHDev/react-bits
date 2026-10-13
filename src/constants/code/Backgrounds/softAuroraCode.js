import code from '@content/Backgrounds/SoftAurora/SoftAurora.jsx?raw';
import css from '@content/Backgrounds/SoftAurora/SoftAurora.css?raw';
import tailwind from '@tailwind/Backgrounds/SoftAurora/SoftAurora.jsx?raw';
import tsCode from '@ts-default/Backgrounds/SoftAurora/SoftAurora.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/SoftAurora/SoftAurora.tsx?raw';

export const softAurora = {
  dependencies: ``,
  usage: `import SoftAurora from './SoftAurora';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <SoftAurora
    speed={0.6}
    scale={1.5}
    brightness={1}
    color1="#f7f7f7"
    color2="#e100ff"
    bandHeight={0.5}
    bandSpread={1}
    enableMouseInteraction
    mouseInfluence={0.25}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
