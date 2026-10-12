import code from '@content/Backgrounds/GradientBlinds/GradientBlinds.jsx?raw';
import css from '@content/Backgrounds/GradientBlinds/GradientBlinds.css?raw';
import tailwind from '@tailwind/Backgrounds/GradientBlinds/GradientBlinds.jsx?raw';
import tsCode from '@ts-default/Backgrounds/GradientBlinds/GradientBlinds.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/GradientBlinds/GradientBlinds.tsx?raw';

export const gradientBlinds = {
  usage: `import GradientBlinds from './GradientBlinds';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GradientBlinds
    gradientColors={['#FF9FFC', '#5227FF']}
    angle={20}
    blindCount={16}
    blindMinWidth={60}
    spotlightRadius={0.5}
    shine={0.4}
    relief={0.5}
    glow={0.4}
    sway={0.35}
    hoverTilt={0.6}
    clickEffect="ripple"
    noise={0.3}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
