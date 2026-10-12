import code from '@content/Animations/SwarmCursor/SwarmCursor.jsx?raw';
import css from '@content/Animations/SwarmCursor/SwarmCursor.css?raw';
import tailwind from '@tailwind/Animations/SwarmCursor/SwarmCursor.jsx?raw';
import tsCode from '@ts-default/Animations/SwarmCursor/SwarmCursor.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/SwarmCursor/SwarmCursor.tsx?raw';

export const swarmCursor = {
  usage: `import SwarmCursor from './SwarmCursor';

<div style={{ position: 'relative', width: '100%', height: '600px' }}>
  <SwarmCursor
    count={800}
    size={2.6}
    spread={90}
    swirl={0.6}
    clickEffect="burst"
  >
    {/* Your content here */}
  </SwarmCursor>
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
