import code from '@content/Backgrounds/DotGrid/DotGrid.jsx?raw';
import css from '@content/Backgrounds/DotGrid/DotGrid.css?raw';
import tailwind from '@tailwind/Backgrounds/DotGrid/DotGrid.jsx?raw';
import tsCode from '@ts-default/Backgrounds/DotGrid/DotGrid.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/DotGrid/DotGrid.tsx?raw';

export const dotGrid = {
  usage: `import DotGrid from './DotGrid';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <DotGrid
    baseColor="#3a3446"
    activeColor="#ffffff"
    shape="circle"
    dotSize={5}
    gap={18}
    proximity={140}
    strength={1}
    bounce={0.6}
    tension={0.4}
    returnDuration={0.8}
    shockRadius={320}
    shockStrength={5}
    swell={0.8}
    stretch={0.5}
    glow={0.5}
    fade={0}
    intro={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
