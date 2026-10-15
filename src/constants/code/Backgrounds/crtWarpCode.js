import code from '@content/Backgrounds/CRTWarp/CRTWarp.jsx?raw';
import css from '@content/Backgrounds/CRTWarp/CRTWarp.css?raw';
import tailwind from '@tailwind/Backgrounds/CRTWarp/CRTWarp.jsx?raw';
import tsCode from '@ts-default/Backgrounds/CRTWarp/CRTWarp.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/CRTWarp/CRTWarp.tsx?raw';

export const crtWarp = {
  dependencies: ``,
  usage: `import CRTWarp from './CRTWarp';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <CRTWarp
    color="#c755f7"
    backgroundColor="#120f17"
    mask="aperture"
    curvature={0.25}
    persistence={0.4}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
