import code from '@content/TextAnimations/CircularText/CircularText.jsx?raw';
import css from '@content/TextAnimations/CircularText/CircularText.css?raw';
import tailwind from '@tailwind/TextAnimations/CircularText/CircularText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/CircularText/CircularText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/CircularText/CircularText.tsx?raw';

export const circularText = {
  dependencies: `motion`,
  usage: `import CircularText from './CircularText';

<CircularText
  text="REACT*BITS*COMPONENTS*"
  onHover="speedUp"
  direction="clockwise"
  spinDuration={20}
  size={200}
  fontSize={24}
  draggable
  hoverTilt={20}
  className="custom-class"
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
