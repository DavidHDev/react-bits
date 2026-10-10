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
    accentColor="#c6ff3d"
    shape="square"
    pulse={1}
    pulseSpeed={0.45}
    sparkle={0.04}
    speed={0.7}
    zoom={1.3}
    depth={10}
    edges={0.45}
    mouseInteraction={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
