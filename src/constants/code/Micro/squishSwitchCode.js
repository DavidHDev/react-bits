import code from '@content/Micro/SquishSwitch/SquishSwitch.jsx?raw';
import css from '@content/Micro/SquishSwitch/SquishSwitch.css?raw';
import tailwind from '@tailwind/Micro/SquishSwitch/SquishSwitch.jsx?raw';
import tsCode from '@ts-default/Micro/SquishSwitch/SquishSwitch.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/SquishSwitch/SquishSwitch.tsx?raw';

export const squishSwitch = {
  dependencies: `motion`,
  usage: `import { useState } from 'react';
import SquishSwitch from './SquishSwitch';

const [airplane, setAirplane] = useState(false);

<SquishSwitch
  checked={airplane}
  onChange={setAirplane}
  label="Airplane mode"
  trackColor="#3f3f46"
  trackOnColor="#f5f5f5"
  width={76}
  height={38}
  radius={19}
  speed={50}
  stretch={36}
  hoverScale={1.035}
  colorDuration={320}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
