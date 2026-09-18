import code from '@content/Micro/StatusMark/StatusMark.jsx?raw';
import css from '@content/Micro/StatusMark/StatusMark.css?raw';
import tailwind from '@tailwind/Micro/StatusMark/StatusMark.jsx?raw';
import tsCode from '@ts-default/Micro/StatusMark/StatusMark.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/StatusMark/StatusMark.tsx?raw';

export const statusMark = {
  dependencies: `motion`,
  usage: `import StatusMark from './StatusMark';

<StatusMark
  status="running"
  progress={0.62}
  label="Draft supplier emails"
  color="currentColor"
  doneColor="#22c55e"
  errorColor="#ef4444"
  size={20}
  strokeWidth={2}
  dashes={8}
  fontSize={14}
  spinDuration={1100}
  arcLength={0.68}
  drawDuration={240}
  fillOpacity={0.06}
  strike
  strikeDelay={60}
/>

<StatusMark status="done" size={16} />`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
