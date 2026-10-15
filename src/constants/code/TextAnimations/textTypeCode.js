import code from '@content/TextAnimations/TextType/TextType.jsx?raw';
import css from '@content/TextAnimations/TextType/TextType.css?raw';
import tailwind from '@tailwind/TextAnimations/TextType/TextType.jsx?raw';
import tsCode from '@ts-default/TextAnimations/TextType/TextType.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/TextType/TextType.tsx?raw';

export const textType = {
  dependencies: `gsap`,
  usage: `import TextType from './TextType';

<TextType
  text={["Text typing effect", "for your websites", "Happy coding!"]}
  typingSpeed={75}
  pauseDuration={1500}
  deletingSpeed={50}
  deleteMode="backspace"
  typeEffect="fade"
  mistakes={0.2}
  cursorStyle="bar"
  cursorGlide
  showCursor
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
