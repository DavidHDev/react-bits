import code from '@content/TextAnimations/CountUp/CountUp.jsx?raw';
import tailwind from '@tailwind/TextAnimations/CountUp/CountUp.jsx?raw';
import tsCode from '@ts-default/TextAnimations/CountUp/CountUp.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/CountUp/CountUp.tsx?raw';

export const countup = {
  dependencies: `motion`,
  usage: `import CountUp from './CountUp'

<CountUp
  from={0}
  to={100}
  mode="count"
  easing="easeOut"
  format="standard"
  separator=","
  prefix=""
  suffix=""
  direction="up"
  duration={1}
  delay={0}
  trigger="view"
  replayOnHover
  className="count-up-text"
/>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
