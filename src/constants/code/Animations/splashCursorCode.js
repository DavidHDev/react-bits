import code from '@content/Animations/SplashCursor/SplashCursor.jsx?raw';
import css from '@content/Animations/SplashCursor/SplashCursor.css?raw';
import tailwind from '@tailwind/Animations/SplashCursor/SplashCursor.jsx?raw';
import tsCode from '@ts-default/Animations/SplashCursor/SplashCursor.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/SplashCursor/SplashCursor.tsx?raw';

export const splashCursor = {
  usage: `import SplashCursor from './SplashCursor';

<SplashCursor
  rainbow
  size={1}
  force={1}
  swirl={3}
  trail={1}
  clickSplash
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
