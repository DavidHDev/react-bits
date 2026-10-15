import code from '@content/TextAnimations/MaskedHeading/MaskedHeading.jsx?raw';
import css from '@content/TextAnimations/MaskedHeading/MaskedHeading.css?raw';
import tailwind from '@tailwind/TextAnimations/MaskedHeading/MaskedHeading.jsx?raw';
import tsCode from '@ts-default/TextAnimations/MaskedHeading/MaskedHeading.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/MaskedHeading/MaskedHeading.tsx?raw';

export const maskedHeading = {
  dependencies: 'gsap',
  usage: `import MaskedHeading from './MaskedHeading';

<MaskedHeading
  text="Shot on location"
  mediaType="video"
  src="/reel.mp4"
  poster="/reel-poster.jpg"
  fillScale={1.3}
  parallax={34}
  reveal="scale"
  trigger="view"
  spotlight
  spotlightRadius={180}
  outline
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
