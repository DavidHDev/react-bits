import code from '@content/Backgrounds/LineWaves/LineWaves.jsx?raw';
import css from '@content/Backgrounds/LineWaves/LineWaves.css?raw';
import tailwind from '@tailwind/Backgrounds/LineWaves/LineWaves.jsx?raw';
import tsCode from '@ts-default/Backgrounds/LineWaves/LineWaves.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/LineWaves/LineWaves.tsx?raw';

export const lineWaves = {
  usage: `import LineWaves from './LineWaves';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LineWaves
    color1="#ffffff"
    color2="#ffffff"
    color3="#ffffff"
    speed={0.3}
    lineCount={72}
    lineWidth={1.3}
    highlight={1}
    warpIntensity={1}
    rotation={-33}
    enableMouseInteraction={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
