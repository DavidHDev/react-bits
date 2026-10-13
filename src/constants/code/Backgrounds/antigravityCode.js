import code from '@content/Backgrounds/Antigravity/Antigravity.jsx?raw';
import css from '@content/Backgrounds/Antigravity/Antigravity.css?raw';
import tailwind from '@tailwind/Backgrounds/Antigravity/Antigravity.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Antigravity/Antigravity.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Antigravity/Antigravity.tsx?raw';

export const antigravity = {
  usage: `import Antigravity from './Antigravity';

<div style={{ width: '100%', height: '400px', position: 'relative' }}>
  <Antigravity
    colors={['#5227FF', '#FF9FFC', '#B497CF']}
    count={1500}
    magnetRadius={9}
    ringRadius={7}
    particleSize={0.9}
    autoAnimate={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
