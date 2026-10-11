import code from '@content/Backgrounds/Galaxy/Galaxy.jsx?raw';
import css from '@content/Backgrounds/Galaxy/Galaxy.css?raw';
import tailwind from '@tailwind/Backgrounds/Galaxy/Galaxy.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Galaxy/Galaxy.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Galaxy/Galaxy.tsx?raw';

export const galaxy = {
  usage: `import Galaxy from './Galaxy';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Galaxy
    density={1}
    glowIntensity={0.3}
    flareIntensity={1}
    starSpeed={0.5}
    mouseRepulsion
    clickWarp
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
