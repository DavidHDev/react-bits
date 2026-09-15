import code from '@content/Backgrounds/ShapeWaves/ShapeWaves.jsx?raw';
import css from '@content/Backgrounds/ShapeWaves/ShapeWaves.css?raw';
import tailwind from '@tailwind/Backgrounds/ShapeWaves/ShapeWaves.jsx?raw';
import tsCode from '@ts-default/Backgrounds/ShapeWaves/ShapeWaves.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/ShapeWaves/ShapeWaves.tsx?raw';

export const shapeWaves = {
  dependencies: `vgpu`,
  usage: `import ShapeWaves from './ShapeWaves';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <ShapeWaves
    text="React Bits"
    fontFamily='Geist, "Geist Sans", system-ui, sans-serif'
    fontWeight={500}
    textSize={0.6}
    shapes="mixed"
    cellSize={10}
    dotSize={0.75}
    color="#929292"
    hoverColor="#ffffff"
    backgroundColor="#000000"
    speed={1}
    scale={1}
    contrast={1}
    brightness={0.4}
    flow={0}
    direction={0}
    fade={0.25}
    interactive={true}
    splashRadius={40}
    splashStrength={0.4}
    glow={0.35}
    paused={false}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
