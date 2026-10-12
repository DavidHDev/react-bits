import code from '@content/Backgrounds/LiquidChrome/LiquidChrome.jsx?raw';
import css from '@content/Backgrounds/LiquidChrome/LiquidChrome.css?raw';
import tailwind from '@tailwind/Backgrounds/LiquidChrome/LiquidChrome.jsx?raw';
import tsCode from '@ts-default/Backgrounds/LiquidChrome/LiquidChrome.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/LiquidChrome/LiquidChrome.tsx?raw';

export const liquidChrome = {
  usage: `import LiquidChrome from './LiquidChrome';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LiquidChrome
    color="#ffffff"
    speed={0.2}
    amplitude={0.3}
    detail={4}
    thickness={1}
    interactive={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
