import code from '@content/Backgrounds/AcidSquares/AcidSquares.jsx?raw';
import css from '@content/Backgrounds/AcidSquares/AcidSquares.css?raw';
import tailwind from '@tailwind/Backgrounds/AcidSquares/AcidSquares.jsx?raw';
import tsCode from '@ts-default/Backgrounds/AcidSquares/AcidSquares.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/AcidSquares/AcidSquares.tsx?raw';

export const acidSquares = {
  usage: `import AcidSquares from './AcidSquares';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <AcidSquares
    color="#120f17"
    accentColor="#ff4fb8"
    secondaryColor="#3b6bff"
    tileSize={1}
    gap={0.12}
    roundness={0.25}
    rotation={35}
    waves={1}
    pulse={1}
    lighting="split"
    tilt={0.7}
    grain={0.12}
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
