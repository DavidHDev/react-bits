import code from '@content/Animations/Cubes/Cubes.jsx?raw';
import css from '@content/Animations/Cubes/Cubes.css?raw';
import tailwind from '@tailwind/Animations/Cubes/Cubes.jsx?raw';
import tsCode from '@ts-default/Animations/Cubes/Cubes.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/Cubes/Cubes.tsx?raw';

export const cubes = {
  usage: `// CREDIT
// Component inspired from Can Tastemel's original work for the lambda.ai landing page
// https://cantastemel.com

import Cubes from './Cubes'

<div style={{ height: '600px', position: 'relative' }}>
  <Cubes
    gridSize={10}
    faceColor="#120F17"
    edgeColor="#ffffff"
    maxAngle={45}
    radius={3}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
