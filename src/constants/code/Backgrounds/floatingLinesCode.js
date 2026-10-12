import code from '@content/Backgrounds/FloatingLines/FloatingLines.jsx?raw';
import css from '@content/Backgrounds/FloatingLines/FloatingLines.css?raw';
import tailwind from '@tailwind/Backgrounds/FloatingLines/FloatingLines.jsx?raw';
import tsCode from '@ts-default/Backgrounds/FloatingLines/FloatingLines.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/FloatingLines/FloatingLines.tsx?raw';

export const floatingLines = {
  usage: `import FloatingLines from './FloatingLines';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <FloatingLines
    linesGradient={['#e945f5', '#ffffff']}
    enabledWaves={['top', 'middle', 'bottom']}
    lineCount={10}
    lineDistance={6}
    bendStrength={-0.5}
    interactive
    clickSwirl
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
