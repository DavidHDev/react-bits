import code from '@content/Backgrounds/RippleGrid/RippleGrid.jsx?raw';
import css from '@content/Backgrounds/RippleGrid/RippleGrid.css?raw';
import tailwind from '@tailwind/Backgrounds/RippleGrid/RippleGrid.jsx?raw';
import tsCode from '@ts-default/Backgrounds/RippleGrid/RippleGrid.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/RippleGrid/RippleGrid.tsx?raw';

export const rippleGrid = {
  usage: `import RippleGrid from './RippleGrid';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <RippleGrid color="#ffffff" cellSize={48} rippleStrength={1} autoRipple="center" />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
