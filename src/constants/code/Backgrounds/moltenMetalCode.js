import code from '@content/Backgrounds/MoltenMetal/MoltenMetal.jsx?raw';
import css from '@content/Backgrounds/MoltenMetal/MoltenMetal.css?raw';
import tailwind from '@tailwind/Backgrounds/MoltenMetal/MoltenMetal.jsx?raw';
import tsCode from '@ts-default/Backgrounds/MoltenMetal/MoltenMetal.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/MoltenMetal/MoltenMetal.tsx?raw';

export const moltenMetal = {
  dependencies: ``,
  usage: `import MoltenMetal from './MoltenMetal';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <MoltenMetal
    colors={['#5227FF', '#FF9FFC']}
    coreColor="#FFFFFF"
    speed={0.35}
    scale={4}
    detail={3}
    glow={1.6}
    thickness={1}
    haze={0.75}
    mouseInteraction
    flareOnClick
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
