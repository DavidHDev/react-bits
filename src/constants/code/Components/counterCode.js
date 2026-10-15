import code from '@content/Components/Counter/Counter.jsx?raw';
import css from '@content/Components/Counter/Counter.css?raw';
import tailwind from '@tailwind/Components/Counter/Counter.jsx?raw';
import tsCode from '@ts-default/Components/Counter/Counter.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/Counter/Counter.tsx?raw';

export const counter = {
  dependencies: ``,
  usage: `import Counter from './Counter';

<Counter
  value={1284}
  fontSize={80}
  fontWeight={600}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
