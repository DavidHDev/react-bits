import code from '@content/Backgrounds/GhostFibers/GhostFibers.jsx?raw';
import css from '@content/Backgrounds/GhostFibers/GhostFibers.css?raw';
import tailwind from '@tailwind/Backgrounds/GhostFibers/GhostFibers.jsx?raw';
import tsCode from '@ts-default/Backgrounds/GhostFibers/GhostFibers.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/GhostFibers/GhostFibers.tsx?raw';

export const ghostFibers = {
  usage: `import GhostFibers from './GhostFibers';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GhostFibers
    glowColor="#2f5bff"
    speed={0.2}
    scale={2}
    rotationSpeed={0.25}
    layers={4}
    twist={0.1}
    threads={1}
    glow={2}
    brightness={1.4}
    vignette={0.8}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
