import code from '@content/Backgrounds/Grainient/Grainient.jsx?raw';
import css from '@content/Backgrounds/Grainient/Grainient.css?raw';
import tailwind from '@tailwind/Backgrounds/Grainient/Grainient.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Grainient/Grainient.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Grainient/Grainient.tsx?raw';

export const grainient = {
  usage: `import Grainient from './Grainient';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Grainient
    colors={['#120f17', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa']}
    angle={55}
    flow={0.8}
    silk={0.35}
    grainAmount={0.08}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
