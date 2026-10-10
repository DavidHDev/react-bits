import code from '@content/Animations/Ribbons/Ribbons.jsx?raw';
import css from '@content/Animations/Ribbons/Ribbons.css?raw';
import tailwind from '@tailwind/Animations/Ribbons/Ribbons.jsx?raw';
import tsCode from '@ts-default/Animations/Ribbons/Ribbons.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/Ribbons/Ribbons.tsx?raw';

export const ribbons = {
  usage: `import Ribbons from './Ribbons';

<div style={{ height: '500px', position: 'relative', overflow: 'hidden' }}>
  <Ribbons
    colors={['#3847ff', '#7c84ff', '#c7cbff']}
    thickness={30}
    length={1.4}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
