import code from '@content/Backgrounds/Balatro/Balatro.jsx?raw';
import css from '@content/Backgrounds/Balatro/Balatro.css?raw';
import tailwind from '@tailwind/Backgrounds/Balatro/Balatro.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Balatro/Balatro.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Balatro/Balatro.tsx?raw';

export const balatro = {
  dependencies: ``,
  usage: `import Balatro from './Balatro';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Balatro
    color1="#DE443B"
    color2="#006BB4"
    color3="#162325"
    swirl={0.25}
    pixelSize={1.5}
    mouseInteraction
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
