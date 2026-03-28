import code from '@content/Animations/MagicRings/MagicRings.jsx?raw';
import css from '@content/Animations/MagicRings/MagicRings.css?raw';
import tailwind from '@tailwind/Animations/MagicRings/MagicRings.jsx?raw';
import tsCode from '@ts-default/Animations/MagicRings/MagicRings.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/MagicRings/MagicRings.tsx?raw';

export const magicRings = {
  dependencies: '',
  usage: `import MagicRings from './MagicRings';

<div style={{ width: '600px', height: '400px', position: 'relative' }}>
  <MagicRings
    color="#fc42ff"
    colorTwo="#42fcff"
    ringCount={6}
    speed={1}
    attenuation={10}
    lineThickness={2}
    baseRadius={0.35}
    radiusStep={0.1}
    scaleRate={0.1}
    opacity={1}
    blur={0}
    noiseAmount={0.1}
    rotation={0}
    ringGap={1.5}
    fadeIn={0.7}
    fadeOut={0.5}
    followMouse={false}
    mouseInfluence={0.2}
    hoverScale={1.2}
    parallax={0.05}
    clickBurst={false}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
