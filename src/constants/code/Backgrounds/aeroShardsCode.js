import code from '@content/Backgrounds/AeroShards/AeroShards.jsx?raw';
import css from '@content/Backgrounds/AeroShards/AeroShards.css?raw';
import tailwind from '@tailwind/Backgrounds/AeroShards/AeroShards.jsx?raw';
import tsCode from '@ts-default/Backgrounds/AeroShards/AeroShards.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/AeroShards/AeroShards.tsx?raw';

export const aeroShards = {
  dependencies: `vgpu`,
  usage: `import AeroShards from './AeroShards';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <AeroShards
    shardColor="#896ABD"
    accentColor="#A855F7"
    placement="full"
    material="glass"
    markers="plus"
    count={1300}
    depthOfField={0.75}
    vignette={0.3}
    mouseInteraction
    pulseOnClick
    holdToGather
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
