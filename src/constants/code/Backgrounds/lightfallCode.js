import code from '@content/Backgrounds/Lightfall/Lightfall.jsx?raw';
import css from '@content/Backgrounds/Lightfall/Lightfall.css?raw';
import tailwind from '@tailwind/Backgrounds/Lightfall/Lightfall.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Lightfall/Lightfall.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Lightfall/Lightfall.tsx?raw';

export const lightfall = {
  usage: `import Lightfall from './Lightfall';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Lightfall
    colors={['#ffffff']}
    backgroundColor="#94a3b8"
    speed={0.3}
    streakCount={2}
    streakWidth={0.8}
    twinkle={0.3}
    backgroundGlow={0.1}
    headGlow={0.6}
    bloom={0.35}
    mouseInteraction
    holdToWarp
    intro
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
