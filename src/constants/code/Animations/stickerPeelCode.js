import code from '@content/Animations/StickerPeel/StickerPeel.jsx?raw';
import css from '@content/Animations/StickerPeel/StickerPeel.css?raw';
import tailwind from '@tailwind/Animations/StickerPeel/StickerPeel.jsx?raw';
import tsCode from '@ts-default/Animations/StickerPeel/StickerPeel.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/StickerPeel/StickerPeel.tsx?raw';

export const stickerPeel = {
  usage: `import StickerPeel from './StickerPeel'
import logo from './assets/sticker.png'

<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <StickerPeel
    imageSrc={logo}
    width={200}
    finish="gloss"
    peelBackHoverPct={25}
    peelBackActivePct={40}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
