import code from '@content/Backgrounds/PrismaticBurst/PrismaticBurst.jsx?raw';
import css from '@content/Backgrounds/PrismaticBurst/PrismaticBurst.css?raw';
import tailwind from '@tailwind/Backgrounds/PrismaticBurst/PrismaticBurst.jsx?raw';
import tsCode from '@ts-default/Backgrounds/PrismaticBurst/PrismaticBurst.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/PrismaticBurst/PrismaticBurst.tsx?raw';

export const prismaticBurst = {
  usage: `import PrismaticBurst from './PrismaticBurst';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PrismaticBurst
    colors={['#A855F7', '#7C3AED', '#6366F1']}
    animationType="rotate3d"
    intensity={2}
    speed={0.5}
    zoom={1}
    rayWidth={1}
    twist={0}
    mouseInteraction
    clickBurst
    intro
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
