import code from '@content/TextAnimations/ASCIIText/ASCIIText.jsx?raw';
import tailwind from '@tailwind/TextAnimations/ASCIIText/ASCIIText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/ASCIIText/ASCIIText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/ASCIIText/ASCIIText.tsx?raw';

export const asciiText = {
  usage: `import ASCIIText from './ASCIIText';

<div style={{ position: 'relative', width: '100%', height: 440 }}>
  <ASCIIText
    text="Hey!"
    asciiFontSize={8}
    colors={['#ff6188', '#fc9867', '#ffd866']}
    textScale={1}
    blocks={0.9}
    waves={1}
    waveSpeed={1}
    chroma={1}
    tilt={1}
    hueShift={1}
    scramble={0.6}
    clickRipple
    idle
    interactive
  />
</div>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
