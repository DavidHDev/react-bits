import code from '@content/Backgrounds/Hyperspeed/Hyperspeed.jsx?raw';
import css from '@content/Backgrounds/Hyperspeed/Hyperspeed.css?raw';
import tailwind from '@tailwind/Backgrounds/Hyperspeed/Hyperspeed.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Hyperspeed/Hyperspeed.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Hyperspeed/Hyperspeed.tsx?raw';

export const hyperspeed = {
  dependencies: `three`,
  usage: `import Hyperspeed from './Hyperspeed';

<div style={{ position: 'relative', width: '100%', height: 600 }}>
  <Hyperspeed
    curve="winding"
    curvature={1}
    speed={1}
    boost={3}
    fov={90}
    boostFov={130}
    lanes={3}
    roadWidth={10}
    medianWidth={2}
    density={40}
    trailLength={1}
    lightSize={1}
    poles={20}
    dust={100}
    glow={0.6}
    reflections={0.5}
    roadOpacity={0.1}
    steer={0.35}
    tailColors={['#d856bf', '#6750a2', '#c247ac']}
    headColors={['#03b3c3', '#0e5ea5', '#324555']}
    poleColors={['#03b3c3']}
    interactive
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
