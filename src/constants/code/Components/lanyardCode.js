import code from '@content/Components/Lanyard/Lanyard.jsx?raw';
import css from '@content/Components/Lanyard/Lanyard.css?raw';
import tailwind from '@tailwind/Components/Lanyard/Lanyard.jsx?raw';
import tsCode from '@ts-default/Components/Lanyard/Lanyard.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/Lanyard/Lanyard.tsx?raw';

export const lanyard = {
  dependencies: `three`,
  usage: `import Lanyard from './Lanyard';

<div style={{ width: '100%', height: '600px' }}>
  <Lanyard frontImage="/card-front.png" backImage="/card-back.png" strapImage="/band.png" />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
