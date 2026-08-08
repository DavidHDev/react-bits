import code from '@content/Backgrounds/WaveBackground/WaveBackground.jsx?raw';
import css from '@content/Backgrounds/WaveBackground/WaveBackground.css?raw';
import tailwind from '@tailwind/Backgrounds/WaveBackground/WaveBackground.jsx?raw';
import tsCode from '@ts-default/Backgrounds/WaveBackground/WaveBackground.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/WaveBackground/WaveBackground.tsx?raw';

export const waveBackground = {
  dependencies: ``,
  usage: `import WaveBackground from './WaveBackground';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <WaveBackground
    speed={1}
    colorWaveStart="#0072ce"
    colorWaveEnd="#00d2ff"
    wavePointsColor="#00ffff"
    rows={65}
    cols={85}
    spacing={40}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
