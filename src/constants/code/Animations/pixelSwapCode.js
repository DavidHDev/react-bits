import code from '@content/Animations/PixelSwap/PixelSwap.jsx?raw';
import css from '@content/Animations/PixelSwap/PixelSwap.css?raw';
import tailwind from '@tailwind/Animations/PixelSwap/PixelSwap.jsx?raw';
import tsCode from '@ts-default/Animations/PixelSwap/PixelSwap.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/PixelSwap/PixelSwap.tsx?raw';

export const pixelSwap = {
  usage: `import PixelSwap from './PixelSwap';

<div style={{ width: 560 }}>
  <PixelSwap
    firstContent={
      <img
        src="/assets/demo/day-sky.webp"
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    }
    secondContent={
      <img
        src="/assets/demo/night-sky.webp"
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    }
    pattern="pointer"
    pixelSize={48}
    pixelRadius={0}
    duration={400}
    pixelDuration={350}
    randomness={0.2}
    bounce={0.3}
    trigger="hover"
    style={{ borderRadius: 18 }}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
