import code from '@content/Animations/HalftoneReveal/HalftoneReveal.jsx?raw';
import css from '@content/Animations/HalftoneReveal/HalftoneReveal.css?raw';
import tailwind from '@tailwind/Animations/HalftoneReveal/HalftoneReveal.jsx?raw';
import tsCode from '@ts-default/Animations/HalftoneReveal/HalftoneReveal.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/HalftoneReveal/HalftoneReveal.tsx?raw';

export const halftoneReveal = {
  usage: `import HalftoneReveal from './HalftoneReveal';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <HalftoneReveal
    src="https://images.unsplash.com/photo-1693250707557-a846a014b321?q=80&w=1400&auto=format&fit=crop"
    mode="mono"
    shape="dot"
    cellSize={6}
    angle={45}
    inkColor="#120f17"
    paperColor="#ffffff"
    revealRadius={160}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
