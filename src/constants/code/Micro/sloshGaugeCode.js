import code from '@content/Micro/SloshGauge/SloshGauge.jsx?raw';
import css from '@content/Micro/SloshGauge/SloshGauge.css?raw';
import tailwind from '@tailwind/Micro/SloshGauge/SloshGauge.jsx?raw';
import tsCode from '@ts-default/Micro/SloshGauge/SloshGauge.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/SloshGauge/SloshGauge.tsx?raw';

export const sloshGauge = {
  dependencies: ``,
  usage: `import { useState } from 'react';
import SloshGauge from './SloshGauge';

<SloshGauge value={progress} />

const [level, setLevel] = useState(60);

<SloshGauge
  value={level}
  onChange={setLevel}
  interactive
  showValue
  liquidColor="#f5f5f5"
  glassColor="#27272a"
  width={88}
  height={180}
  radius={20}
  ticks={4}
  viscosity={0.15}
  tilt={0.45}
  splash={0.42}
  unit="%"
  ariaLabel="Volume"
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
