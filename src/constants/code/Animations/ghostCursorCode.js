import code from '@content/Animations/GhostCursor/GhostCursor.jsx?raw';
import css from '@content/Animations/GhostCursor/GhostCursor.css?raw';
import tailwind from '@tailwind/Animations/GhostCursor/GhostCursor.jsx?raw';
import tsCode from '@ts-default/Animations/GhostCursor/GhostCursor.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/GhostCursor/GhostCursor.tsx?raw';

export const ghostCursor = {
  usage: `import GhostCursor from './GhostCursor';

<div style={{ height: 600, position: 'relative' }}>
  <GhostCursor
    color="#B497CF"
    size={80}
    trailLength={50}
    inertia={0.5}
    turbulence={0.5}
    drift={0.3}
    bloomStrength={0.6}
    grainIntensity={0.05}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
