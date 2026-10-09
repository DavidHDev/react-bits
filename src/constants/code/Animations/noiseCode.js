import code from '@content/Animations/Noise/Noise.jsx?raw';
import css from '@content/Animations/Noise/Noise.css?raw';
import tailwind from '@tailwind/Animations/Noise/Noise.jsx?raw';
import tsCode from '@ts-default/Animations/Noise/Noise.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/Noise/Noise.tsx?raw';

export const noise = {
  usage: `import Noise from './Noise';

<div style={{ position: 'relative', width: '100%', height: 500 }}>
  <img src="/photo.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  <Noise
    opacity={0.2}
    size={1}
    fps={24}
    blendMode="overlay"
    contrast={0.6}
    colored={false}
    dust={0}
    scratches={0}
    scanlines={0}
    flicker={0}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
