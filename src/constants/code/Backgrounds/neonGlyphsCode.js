import code from '@content/Backgrounds/NeonGlyphs/NeonGlyphs.jsx?raw';
import css from '@content/Backgrounds/NeonGlyphs/NeonGlyphs.css?raw';
import tailwind from '@tailwind/Backgrounds/NeonGlyphs/NeonGlyphs.jsx?raw';
import tsCode from '@ts-default/Backgrounds/NeonGlyphs/NeonGlyphs.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/NeonGlyphs/NeonGlyphs.tsx?raw';

export const neonGlyphs = {
  usage: `import NeonGlyphs from './NeonGlyphs';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <NeonGlyphs
    colors={['#a6f3fa', '#ea6fe0', '#6fd6f7', '#d351b6', '#5aaef0']}
    cellSize={16}
    depth={12}
    tilt={25}
    turn={0}
    perspective={60}
    sway={0.5}
    density={0.1}
    speed={0.15}
    trails={0.25}
    glow={0.75}
    scramble={0.5}
    fade={0.75}
    aberration={0.5}
    mouseInteraction={true}
    burstOnClick={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
