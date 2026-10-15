import code from '@content/Backgrounds/GhostFibers/GhostFibers.jsx?raw';
import css from '@content/Backgrounds/GhostFibers/GhostFibers.css?raw';
import tailwind from '@tailwind/Backgrounds/GhostFibers/GhostFibers.jsx?raw';
import tsCode from '@ts-default/Backgrounds/GhostFibers/GhostFibers.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/GhostFibers/GhostFibers.tsx?raw';

export const ghostFibers = {
  usage: `import GhostFibers from './GhostFibers';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GhostFibers
    glowColor="#8b5cf6"
    layers={3}
    twist={1.2}
    threads={72}
    fiberStyle="dots"
    depthOfField={0.85}
    hoverEffect="focus"
    intro={true}
    mouseInteraction={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
