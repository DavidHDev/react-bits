import code from '@content/TextAnimations/EchoText/EchoText.jsx?raw';
import css from '@content/TextAnimations/EchoText/EchoText.css?raw';
import tailwind from '@tailwind/TextAnimations/EchoText/EchoText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/EchoText/EchoText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/EchoText/EchoText.tsx?raw';

export const echoText = {
  dependencies: ``,
  usage: `import EchoText from './EchoText';

<EchoText
  text="Motion Echo"
  echoes={12}
  lag={0.24}
  offset={36}
  direction="right"
  fade={0.72}
  blur={3}
  tint="#7dd3fc"
  echoStyle="solid"
  echoScale={1}
  mode="both"
  trail="pointer"
  clickBurst
  cursorRadius={320}
  duration={900}
  ease="ease-out"
  fontSize="clamp(3rem, 9vw, 7rem)"
  fontWeight={800}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
