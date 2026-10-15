import code from '@content/TextAnimations/CurvedLoop/CurvedLoop.jsx?raw';
import css from '@content/TextAnimations/CurvedLoop/CurvedLoop.css?raw';
import tailwind from '@tailwind/TextAnimations/CurvedLoop/CurvedLoop.jsx?raw';
import tsCode from '@ts-default/TextAnimations/CurvedLoop/CurvedLoop.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/CurvedLoop/CurvedLoop.tsx?raw';

export const curvedLoop = {
  usage: `import CurvedLoop from './CurvedLoop';

<CurvedLoop
  marqueeText="Be ✦ Creative ✦ With ✦ React ✦ Bits ✦"
  shape="arc"
  speed={2}
  curveAmount={400}
  direction="left"
  fontSize={96}
  fontWeight={700}
  letterSpacing={0}
  separator=""
  outline={false}
  scrollBoost={0}
  edgeFade={0}
  interactive={true}
  pauseOnHover={false}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
