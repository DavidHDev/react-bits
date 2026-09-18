import code from '@content/Micro/WakeSlider/WakeSlider.jsx?raw';
import css from '@content/Micro/WakeSlider/WakeSlider.css?raw';
import tailwind from '@tailwind/Micro/WakeSlider/WakeSlider.jsx?raw';
import tsCode from '@ts-default/Micro/WakeSlider/WakeSlider.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/WakeSlider/WakeSlider.tsx?raw';

export const wakeSlider = {
  dependencies: `motion`,
  usage: `import WakeSlider from './WakeSlider';

<div style={{ width: 320 }}>
  <WakeSlider
    defaultValue={50}
    min={0}
    max={100}
    step={1}
    bars={32}
    height={56}
    restHeight={12}
    gap={4}
    fillColor="#f5f5f5"
    trackColor="#27272a"
    sensitivity={1}
    reach={6}
    skew={0.6}
    glide={0.3}
    smoothing={100}
    showValue
    onChange={value => console.log('value', value)}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
