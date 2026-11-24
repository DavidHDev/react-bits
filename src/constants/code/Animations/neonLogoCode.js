import code from '@content/Animations/NeonLogo/NeonLogo.jsx?raw';
import css from '@content/Animations/NeonLogo/NeonLogo.css?raw';
import tailwind from '@tailwind/Animations/NeonLogo/NeonLogo.jsx?raw';
import tsCode from '@ts-default/Animations/NeonLogo/NeonLogo.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/NeonLogo/NeonLogo.tsx?raw';

export const neonLogo = {
  usage: `import NeonLogo from './NeonLogo';

<div style={{ width: '100%', height: '400px', position: 'relative' }}>
  <NeonLogo
    text="Miami"
    colors={['#ffc9f4', '#ea6fe0', '#d351b6', '#a6f3fa', '#6fd6f7', '#5aaef0', '#2b4bb8', '#121646']}
    baseColor="#a855f7"
    heat={0.5}
    radius={1.5}
    softness={0.25}
    swell={0.1}
    idle="drift"
    speed={2}
    igniteOnClick={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
