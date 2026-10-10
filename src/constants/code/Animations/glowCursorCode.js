import code from '@content/Animations/GlowCursor/GlowCursor.jsx?raw';
import css from '@content/Animations/GlowCursor/GlowCursor.css?raw';
import tailwind from '@tailwind/Animations/GlowCursor/GlowCursor.jsx?raw';
import tsCode from '@ts-default/Animations/GlowCursor/GlowCursor.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/GlowCursor/GlowCursor.tsx?raw';

export const glowCursor = {
  usage: `import GlowCursor from './GlowCursor';

<div style={{ position: 'relative', width: '100%', height: '500px' }}>
  <GlowCursor
    color="#5f8bff"
    intensity={1.3}
    trailWidth={3}
    linger={1.4}
    glow={1.2}
    clickBurst
    theme="dark"
  >
    {/* Your content here */}
  </GlowCursor>
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
