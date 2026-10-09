import code from '@content/Animations/ShapeBlur/ShapeBlur.jsx?raw';
import css from '@content/Animations/ShapeBlur/ShapeBlur.css?raw';
import tailwind from '@tailwind/Animations/ShapeBlur/ShapeBlur.jsx?raw';
import tsCode from '@ts-default/Animations/ShapeBlur/ShapeBlur.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/ShapeBlur/ShapeBlur.tsx?raw';

export const shapeBlur = {
  usage: `import ShapeBlur from './ShapeBlur';

<div style={{ position: 'relative', height: 500 }}>
  <ShapeBlur
    size={0.6}
    fill={true}
    color="#ffffff"
    blur={16}
    lensSize={0.3}
    lensSoftness={0.7}
    chroma={0.3}
    idle={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
