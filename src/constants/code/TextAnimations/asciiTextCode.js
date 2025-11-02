import code from '@content/TextAnimations/ASCIIText/ASCIIText.jsx?raw';
import tailwind from '@tailwind/TextAnimations/ASCIIText/ASCIIText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/ASCIIText/ASCIIText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/ASCIIText/ASCIIText.tsx?raw';

export const asciiText = {
  dependencies: `three`,
  usage: `// Component ported and enhanced from https://codepen.io/JuanFuentes/pen/eYEeoyE

// NOTE: The component uses position: absolute and width/height: 100%, which requires a parent container with explicit dimensions.

import ASCIIText from './ASCIIText';

<div className="relative w-full h-[500px]">
  <ASCIIText
    text='hello_world'
    enableWaves={true}
    asciiFontSize={8}
  />
</div>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
