import code from '@content/Backgrounds/Scanner/Scanner.jsx?raw';
import css from '@content/Backgrounds/Scanner/Scanner.css?raw';
import tailwind from '@tailwind/Backgrounds/Scanner/Scanner.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Scanner/Scanner.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Scanner/Scanner.tsx?raw';

export const scanner = {
  usage: `import Scanner from './Scanner';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Scanner
    color1="#5227FF"
    color2="#FF9FFC"
    color3="#FFFFFF"
    speed={0.5}
    sweepSpeed={0.25}
    sweepWidth={1.6}
    trail={0.5}
    ripple={0.22}
    bandDensity={11}
    glow={0.6}
    scanDirection="vertical"
    colorSpread={0.7}
    scanline
    scanlineIntensity={0.5}
    mouseInteraction
    clickEffect="ping"
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
