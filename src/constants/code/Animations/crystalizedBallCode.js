import code from '@content/Animations/CrystalizedBall/CrystalizedBall.jsx?raw';
import css from '@content/Animations/CrystalizedBall/CrystalizedBall.css?raw';
import tailwind from '@tailwind/Animations/CrystalizedBall/CrystalizedBall.jsx?raw';
import tsCode from '@ts-default/Animations/CrystalizedBall/CrystalizedBall.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/CrystalizedBall/CrystalizedBall.tsx?raw';

export const crystalizedBall = {
  dependencies: `ogl`,
  usage: `import CrystalizedBall from './CrystalizedBall';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <CrystalizedBall
    preset="plasma"
    color="#F25BD0"
    size={0.7}
    crackle={0.85}
    fill={0.5}
    interactive
    hoverStrength={0.7}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
