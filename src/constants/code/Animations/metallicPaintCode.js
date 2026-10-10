import code from '@content/Animations/MetallicPaint/MetallicPaint.jsx?raw';
import css from '@content/Animations/MetallicPaint/MetallicPaint.css?raw';
import tailwind from '@tailwind/Animations/MetallicPaint/MetallicPaint.jsx?raw';
import tsCode from '@ts-default/Animations/MetallicPaint/MetallicPaint.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/MetallicPaint/MetallicPaint.tsx?raw';

export const metallicPaint = {
  usage: `import MetallicPaint from './MetallicPaint';
import logo from './logo.svg';

<div style={{ width: '100%', height: 500 }}>
  <MetallicPaint imageSrc={logo} />
</div>

<div style={{ width: '100%', height: 300 }}>
  <MetallicPaint text="Liquid" color="#f2c46b" edgeBend={0.9} />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
