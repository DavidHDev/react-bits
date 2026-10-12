import code from '@content/Backgrounds/MagnetLines/MagnetLines.jsx?raw';
import css from '@content/Backgrounds/MagnetLines/MagnetLines.css?raw';
import tailwind from '@tailwind/Backgrounds/MagnetLines/MagnetLines.jsx?raw';
import tsCode from '@ts-default/Backgrounds/MagnetLines/MagnetLines.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/MagnetLines/MagnetLines.tsx?raw';

export const magnetLines = {
  usage: `import MagnetLines from './MagnetLines';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <MagnetLines
    lineColor="#efefef"
    spacing={30}
    lineWidth={2}
    lineHeight={18}
    mode="orbit"
    shape="line"
    radius={200}
    fade={0.65}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
