import code from '@content/Animations/ElectricLogo/ElectricLogo.jsx?raw';
import css from '@content/Animations/ElectricLogo/ElectricLogo.css?raw';
import tailwind from '@tailwind/Animations/ElectricLogo/ElectricLogo.jsx?raw';
import tsCode from '@ts-default/Animations/ElectricLogo/ElectricLogo.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/ElectricLogo/ElectricLogo.tsx?raw';

export const electricLogo = {
  dependencies: `ogl`,
  usage: `import ElectricLogo from './ElectricLogo';

<div style={{ width: '100%', height: '480px', position: 'relative' }}>
  <ElectricLogo
    src="/logo.svg"
    color="#ecc7ff"
    glowColor="#ad6dff"
    scale={0.7}
    strands={4}
    bend={0.6}
    crackle={1.5}
    arcs={1}
    speed={2.5}
    interactive
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
