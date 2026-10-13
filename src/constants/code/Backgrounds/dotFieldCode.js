import code from '@content/Backgrounds/DotField/DotField.jsx?raw';
import css from '@content/Backgrounds/DotField/DotField.css?raw';
import tailwind from '@tailwind/Backgrounds/DotField/DotField.jsx?raw';
import tsCode from '@ts-default/Backgrounds/DotField/DotField.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/DotField/DotField.tsx?raw';

export const dotField = {
  dependencies: ``,
  usage: `import DotField from './DotField';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <DotField
    gradientFrom="#5227FF"
    gradientTo="#FF9FFC"
    dotRadius={1.5}
    dotSpacing={14}
    cursorRadius={240}
    bulgeStrength={0.6}
    glowRadius={160}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
