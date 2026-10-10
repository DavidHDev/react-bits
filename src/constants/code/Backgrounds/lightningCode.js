import code from '@content/Backgrounds/Lightning/Lightning.jsx?raw';
import css from '@content/Backgrounds/Lightning/Lightning.css?raw';
import tailwind from '@tailwind/Backgrounds/Lightning/Lightning.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Lightning/Lightning.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Lightning/Lightning.tsx?raw';

export const lightning = {
  usage: `import Lightning from './Lightning';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Lightning
    color="#4d6bff"
    bolts={1}
    spread={0.6}
    branches={0.5}
    xOffset={0}
    angle={0}
    size={1}
    thickness={1}
    glow={1}
    intensity={1}
    speed={1}
    flicker={0.6}
    mouseInteraction={true}
    mouseStrength={1}
    clickStrike={true}
    intro={true}
    fade={0}
    opacity={1}
    lightMode={false}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
