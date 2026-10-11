import code from '@content/Backgrounds/Aurora/Aurora.jsx?raw';
import css from '@content/Backgrounds/Aurora/Aurora.css?raw';
import tailwind from '@tailwind/Backgrounds/Aurora/Aurora.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Aurora/Aurora.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Aurora/Aurora.tsx?raw';

export const aurora = {
  usage: `import Aurora from './Aurora';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Aurora
    colorStops={['#5227FF', '#7cff67', '#5227FF']}
    amplitude={1}
    blend={0.5}
    height={0.45}
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
