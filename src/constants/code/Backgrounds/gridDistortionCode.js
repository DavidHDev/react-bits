import code from '@content/Backgrounds/GridDistortion/GridDistortion.jsx?raw';
import css from '@content/Backgrounds/GridDistortion/GridDistortion.css?raw';
import tailwind from '@tailwind/Backgrounds/GridDistortion/GridDistortion.jsx?raw';
import tsCode from '@ts-default/Backgrounds/GridDistortion/GridDistortion.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/GridDistortion/GridDistortion.tsx?raw';

export const gridDistortion = {
  usage: `import GridDistortion from './GridDistortion';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GridDistortion
    imageSrc="/assets/demo/night-landscape.webp"
    grid={15}
    radius={0.18}
    strength={0.15}
    relaxation={0.96}
    mode="drag"
    softness={0}
    chroma={0}
    idle={0.3}
    clickRipple={true}
    intro={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
