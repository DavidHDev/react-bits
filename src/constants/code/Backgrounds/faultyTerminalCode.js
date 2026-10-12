import code from '@content/Backgrounds/FaultyTerminal/FaultyTerminal.jsx?raw';
import css from '@content/Backgrounds/FaultyTerminal/FaultyTerminal.css?raw';
import tailwind from '@tailwind/Backgrounds/FaultyTerminal/FaultyTerminal.jsx?raw';
import tsCode from '@ts-default/Backgrounds/FaultyTerminal/FaultyTerminal.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/FaultyTerminal/FaultyTerminal.tsx?raw';

export const faultyTerminal = {
  usage: `import FaultyTerminal from './FaultyTerminal';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <FaultyTerminal
    tint="#A7EF9E"
    glyphs="blocks"
    scale={1.5}
    digitSize={1.2}
    timeScale={0.5}
    brightness={0.75}
    glow={0.5}
    persistence={0.5}
    mouseStrength={0.5}
    mouseGlow={0.6}
    curvature={0.1}
    vignette={0.25}
    clickEffect="glitch"
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
