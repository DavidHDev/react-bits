import code from '@content/Backgrounds/FluxLines/FluxLines.jsx?raw';
import css from '@content/Backgrounds/FluxLines/FluxLines.css?raw';
import tailwind from '@tailwind/Backgrounds/FluxLines/FluxLines.jsx?raw';
import tsCode from '@ts-default/Backgrounds/FluxLines/FluxLines.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/FluxLines/FluxLines.tsx?raw';

export const fluxLines = {
  usage: `import FluxLines from './FluxLines';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <FluxLines
    colors={['#ffffff', '#ffffff', '#ffffff']}
    glow={2}
    rimWidth={0.2}
    lineWidth={1}
    flowDirection="down"
    mouseInteraction
    clickSwirl
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
