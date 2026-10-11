import code from '@content/Backgrounds/ShapeGrid/ShapeGrid.jsx?raw';
import css from '@content/Backgrounds/ShapeGrid/ShapeGrid.css?raw';
import tailwind from '@tailwind/Backgrounds/ShapeGrid/ShapeGrid.jsx?raw';
import tsCode from '@ts-default/Backgrounds/ShapeGrid/ShapeGrid.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/ShapeGrid/ShapeGrid.tsx?raw';

export const shapeGrid = {
  usage: `import ShapeGrid from './ShapeGrid';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <ShapeGrid
    shape="square"
    direction="diagonal"
    lineColor="#2a2734"
    hoverColor="#ffffff"
    hoverFillColor="#ffffff"
    fillOpacity={0.15}
    cellSize={40}
    speed={0.5}
    tiltX={0}
    tiltY={0}
    rainbow={false}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
