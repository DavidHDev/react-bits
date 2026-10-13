import code from '@content/Backgrounds/Ballpit/Ballpit.jsx?raw';
import tailwind from '@tailwind/Backgrounds/Ballpit/Ballpit.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Ballpit/Ballpit.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Ballpit/Ballpit.tsx?raw';

export const ballpit = {
  usage: `// Component inspired by Kevin Levron:
// https://x.com/soju22/status/1858925191671271801

import Ballpit from './Ballpit';

<div style={{ position: 'relative', overflow: 'hidden', height: '500px', width: '100%' }}>
  <Ballpit
    count={200}
    colors={['#ffffff']}
    material="satin"
    gravity={0}
    drift={0.4}
    followCursor
    grab
    clickEffect="burst"
  />
</div>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
