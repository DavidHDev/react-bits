import code from '@content/TextAnimations/ScrambledText/ScrambledText.jsx?raw';
import css from '@content/TextAnimations/ScrambledText/ScrambledText.css?raw';
import tailwind from '@tailwind/TextAnimations/ScrambledText/ScrambledText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/ScrambledText/ScrambledText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/ScrambledText/ScrambledText.tsx?raw';

export const scrambledTextCode = {
  dependencies: `gsap`,
  usage: `// Component inspired by Tom Miller from the GSAP community
// https://codepen.io/creativeocean/pen/NPWLwJM

import ScrambledText from './ScrambledText';

<ScrambledText
  className="scrambled-text-demo"
  effect="scramble"
  radius={100}
  strength={1}
  trail={0.6}
  duration={1.2}
  speed={0.5}
  scrambleChars=".:"
  clickBurst
  intro
>
  Lorem ipsum dolor sit amet consectetur adipisicing elit.
  Similique pariatur dignissimos porro eius quam doloremque
  et enim velit nobis maxime.
</ScrambledText>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
