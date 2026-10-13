import code from '@content/Backgrounds/PixelBlast/PixelBlast.jsx?raw';
import css from '@content/Backgrounds/PixelBlast/PixelBlast.css?raw';
import tailwind from '@tailwind/Backgrounds/PixelBlast/PixelBlast.jsx?raw';
import tsCode from '@ts-default/Backgrounds/PixelBlast/PixelBlast.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/PixelBlast/PixelBlast.tsx?raw';

export const pixelBlast = {
  usage: `import PixelBlast from './PixelBlast';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PixelBlast
    variant="square"
    pixelSize={3}
    color="#B497CF"
    patternScale={2}
    patternDensity={1}
    softness={0.6}
    glow={0.4}
    twinkle={0.25}
    drift={0.2}
    hoverEffect="reveal"
    enableRipples
    edgeFade={0.25}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
