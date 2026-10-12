import code from '@content/Backgrounds/GridScan/GridScan.jsx?raw';
import css from '@content/Backgrounds/GridScan/GridScan.css?raw';
import tailwind from '@tailwind/Backgrounds/GridScan/GridScan.jsx?raw';
import tsCode from '@ts-default/Backgrounds/GridScan/GridScan.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/GridScan/GridScan.tsx?raw';

export const gridScan = {
  usage: `import GridScan from './GridScan';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GridScan
    linesColor="#4d4757"
    scanColor="#7dd3fc"
    cells={8}
    depth={3}
    scanDuration={2.4}
    scanDelay={1.6}
    clickEffect="ping"
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
