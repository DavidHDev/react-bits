import code from '@content/Animations/GradualBlur/GradualBlur.jsx?raw';
import tailwind from '@tailwind/Animations/GradualBlur/GradualBlur.jsx?raw';
import css from '@content/Animations/GradualBlur/GradualBlur.css?raw';
import tsCode from '@ts-default/Animations/GradualBlur/GradualBlur.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/GradualBlur/GradualBlur.tsx?raw';

export const gradualBlur = {
  usage: `// Component added by Ansh - github.com/ansh-dhanani

import GradualBlur from './GradualBlur';

<section style={{ position: 'relative', height: 500, overflow: 'hidden' }}>
  <div style={{ height: '100%', overflowY: 'auto' }}>
    {/* Scrolling content */}
  </div>

  <GradualBlur
    position="bottom"
    height="6rem"
    strength={2}
    layers={8}
    curve="linear"
    exponential
    tint="rgba(18, 15, 23, 0.6)"
    autoHide
  />
</section>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
