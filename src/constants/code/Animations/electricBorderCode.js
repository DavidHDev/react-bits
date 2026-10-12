import code from '@content/Animations/ElectricBorder/ElectricBorder.jsx?raw';
import css from '@content/Animations/ElectricBorder/ElectricBorder.css?raw';
import tailwind from '@tailwind/Animations/ElectricBorder/ElectricBorder.jsx?raw';
import tsCode from '@ts-default/Animations/ElectricBorder/ElectricBorder.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/ElectricBorder/ElectricBorder.tsx?raw';

export const electricBorder = {
  usage: `import ElectricBorder from './ElectricBorder';

<ElectricBorder
  color="#7df9ff"
  speed={1}
  chaos={0.5}
  spread={0.6}
  strands={3}
  thickness={1.5}
  borderRadius={24}
>
  <div style={{ width: 300, height: 360, borderRadius: 24 }}>
    Your content
  </div>
</ElectricBorder>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
