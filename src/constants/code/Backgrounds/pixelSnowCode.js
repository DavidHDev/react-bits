import code from '@content/Backgrounds/PixelSnow/PixelSnow.jsx?raw';
import css from '@content/Backgrounds/PixelSnow/PixelSnow.css?raw';
import tailwind from '@tailwind/Backgrounds/PixelSnow/PixelSnow.jsx?raw';
import tsCode from '@ts-default/Backgrounds/PixelSnow/PixelSnow.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/PixelSnow/PixelSnow.tsx?raw';

export const pixelSnow = {
  usage: `import PixelSnow from './PixelSnow';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PixelSnow
    color="#ffffff"
    variant="snowflake"
    density={0.5}
    speed={1}
    wind={0.25}
    flakeSize={1}
    pixelSize={3}
    glow={0.8}
    mouseInteraction={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
