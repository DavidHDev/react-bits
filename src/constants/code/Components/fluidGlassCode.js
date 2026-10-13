import code from '@content/Components/FluidGlass/FluidGlass.jsx?raw';
import css from '@content/Components/FluidGlass/FluidGlass.css?raw';
import tailwind from '@tailwind/Components/FluidGlass/FluidGlass.jsx?raw';
import tsCode from '@ts-default/Components/FluidGlass/FluidGlass.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/FluidGlass/FluidGlass.tsx?raw';

export const fluidGlass = {
  dependencies: ``,
  usage: `import FluidGlass from './FluidGlass';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <FluidGlass
    text="Look closer."
    src="/hero.jpg"
    shape="lens"
    size={260}
    refraction={1}
    dispersion={0.35}
    interaction="follow"
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
