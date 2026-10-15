import code from '@content/Animations/Strands/Strands.jsx?raw';
import css from '@content/Animations/Strands/Strands.css?raw';
import tailwind from '@tailwind/Animations/Strands/Strands.jsx?raw';
import tsCode from '@ts-default/Animations/Strands/Strands.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/Strands/Strands.tsx?raw';

export const strands = {
  dependencies: ``,
  usage: `import Strands from './Strands';

<div style={{ width: '100%', height: '480px', position: 'relative' }}>
  <Strands />
</div>

<div style={{ width: '100%', height: '480px', position: 'relative' }}>
  <Strands listening />
</div>

<div style={{ width: '100%', height: '480px', position: 'relative' }}>
  <Strands level={micLevel} />
</div>

<div style={{ width: '100%', height: '320px', position: 'relative' }}>
  <Strands glass={false} energy={0.6} />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
