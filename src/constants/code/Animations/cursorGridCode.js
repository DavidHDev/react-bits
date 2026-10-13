import code from '@content/Animations/CursorGrid/CursorGrid.jsx?raw';
import css from '@content/Animations/CursorGrid/CursorGrid.css?raw';
import tailwind from '@tailwind/Animations/CursorGrid/CursorGrid.jsx?raw';
import tsCode from '@ts-default/Animations/CursorGrid/CursorGrid.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/CursorGrid/CursorGrid.tsx?raw';

export const cursorGrid = {
  usage: `import CursorGrid from './CursorGrid';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <CursorGrid
    cellSize={60}
    color="#ffffff"
    highlight="area"
    gridStyle="lines"
    radius={140}
    holdTime={400}
    fadeDuration={800}
    fillOpacity={0.06}
    gridOpacity={0.08}
    spotlight={0.6}
    clickPulse
  >
    {/* Your content here */}
  </CursorGrid>
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
