import code from '@content/Backgrounds/Topography/Topography.jsx?raw';
import css from '@content/Backgrounds/Topography/Topography.css?raw';
import tailwind from '@tailwind/Backgrounds/Topography/Topography.jsx?raw';
import tsCode from '@ts-default/Backgrounds/Topography/Topography.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/Topography/Topography.tsx?raw';

export const topography = {
  usage: `import Topography from './Topography';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Topography
    color="#4f7cff"
    lineCount={22}
    lineWidth={1.2}
    elevation={1}
    foreground={0.2}
    tilt={32}
    speed={0.25}
    direction="forward"
    glow={0.6}
    depthOfField={0.4}
    fog={0.35}
    hoverEffect="lift"
    clickEffect="pulse"
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
