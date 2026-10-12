import code from '@content/Backgrounds/MagicRings/MagicRings.jsx?raw';
import css from '@content/Backgrounds/MagicRings/MagicRings.css?raw';
import tailwind from '@tailwind/Backgrounds/MagicRings/MagicRings.jsx?raw';
import tsCode from '@ts-default/Backgrounds/MagicRings/MagicRings.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/MagicRings/MagicRings.tsx?raw';

export const magicRings = {
  usage: `import MagicRings from './MagicRings';

<div style={{ width: '100%', height: '500px', position: 'relative' }}>
  <MagicRings
    color="#A855F7"
    colorTwo="#6366F1"
    motion="pulse"
    ringCount={6}
    speed={1}
    lineThickness={2}
    glow={1}
    hoverScale={1.2}
    clickBurst={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
