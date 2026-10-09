import code from '@content/Backgrounds/GridMotion/GridMotion.jsx?raw';
import css from '@content/Backgrounds/GridMotion/GridMotion.css?raw';
import tailwind from '@tailwind/Backgrounds/GridMotion/GridMotion.jsx?raw';
import tsCode from '@ts-default/Backgrounds/GridMotion/GridMotion.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/GridMotion/GridMotion.tsx?raw';

export const gridMotion = {
  usage: `import GridMotion from './GridMotion';

const items = [
  'https://images.unsplash.com/photo-1705032033999-efa3082e1a4e?w=640&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1721407964262-f9864b562453?w=640&q=75&auto=format&fit=crop',
  'Any text works too',
  <div key="custom">Or your own JSX</div>
];

<div style={{ position: 'relative', width: '100%', height: 600 }}>
  <GridMotion
    items={items}
    rows={4}
    aspectRatio={1.33}
    gap={16}
    radius={14}
    angle={-12}
    tilt={0}
    speed={24}
    direction="alternate"
    parallax={0.5}
    spotlight={0.6}
    dim={0.35}
    fade={0.5}
    grayscale={false}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
