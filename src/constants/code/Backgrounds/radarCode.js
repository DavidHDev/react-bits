import code from '@content/Backgrounds/Radar/Radar.jsx?raw';
import css from '@content/Backgrounds/Radar/Radar.css?raw';
import tailwind from '@tailwind/Backgrounds/Radar/Radar.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Radar/Radar.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Radar/Radar.tsx?raw';

export const radar = {
  usage: `import Radar from './Radar';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Radar
    color="#3ef09a"
    mode="sweep"
    speed={1}
    trail={0.35}
    scale={0.9}
    ringCount={6}
    spokeCount={12}
    targets={6}
    clutter={0.35}
    mouseInteraction={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
