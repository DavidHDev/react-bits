import code from '@content/Backgrounds/GradientASCII/GradientASCII.jsx?raw';
import css from '@content/Backgrounds/GradientASCII/GradientASCII.css?raw';
import tailwind from '@tailwind/Backgrounds/GradientASCII/GradientASCII.jsx?raw';
import tsCode from '@ts-default/Backgrounds/GradientASCII/GradientASCII.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/GradientASCII/GradientASCII.tsx?raw';

export const gradientASCII = {
  usage: `import GradientASCII from './GradientASCII';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GradientASCII
    colors={['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']}
    shape="horizon"
    characters=" =+xX0S8#@"
    cellSize={18}
    density={0.8}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
