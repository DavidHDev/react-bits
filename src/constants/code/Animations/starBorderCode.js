import code from '@content/Animations/StarBorder/StarBorder.jsx?raw';
import css from '@content/Animations/StarBorder/StarBorder.css?raw';
import tailwind from '@tailwind/Animations/StarBorder/StarBorder.jsx?raw';
import tsCode from '@ts-default/Animations/StarBorder/StarBorder.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/StarBorder/StarBorder.tsx?raw';

export const starBorder = {
  usage: `import StarBorder from './StarBorder';

<StarBorder
  color="#ffffff"
  trailColor="#ffffff"
  duration={4}
  direction="clockwise"
  stars={1}
  trailLength={0.3}
  thickness={1}
  radius={12}
  glow={0.6}
  hover="lap"
  sparkle={false}
  clickPulse
  theme="dark"
>
  Get started
</StarBorder>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
