import code from '@content/Backgrounds/Dither/Dither.jsx?raw';
import css from '@content/Backgrounds/Dither/Dither.css?raw';
import tailwind from '@tailwind/Backgrounds/Dither/Dither.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Dither/Dither.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Dither/Dither.tsx?raw';

export const dither = {
  usage: `import Dither from './Dither';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Dither
    waveColor="#bcbcbc"
    backgroundColor="#120f17"
    ditherMode="bayer"
    colorNum={4}
    pixelSize={2}
    waveSpeed={0.05}
    waveFrequency={3}
    waveAmplitude={0.3}
    mouseEffect="erase"
    mouseRadius={0.3}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
