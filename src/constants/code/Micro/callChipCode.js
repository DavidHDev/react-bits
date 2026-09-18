import code from '@content/Micro/CallChip/CallChip.jsx?raw';
import css from '@content/Micro/CallChip/CallChip.css?raw';
import tailwind from '@tailwind/Micro/CallChip/CallChip.jsx?raw';
import tsCode from '@ts-default/Micro/CallChip/CallChip.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/CallChip/CallChip.tsx?raw';

export const callChip = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import CallChip from './CallChip';

<CallChip
  icon="terminal"
  name="bash"
  argument="npm test"
  status={call.status}
  expectedMs={2500}
  size={34}
  radius={10}
  color="currentColor"
  surfaceColor="#27272a"
  progressColor="currentColor"
  progressOpacity={0.08}
  doneColor="#22c55e"
  errorColor="#ef4444"
  washOpacity={0.14}
  shake={6}
  showTimer
  onRetry={() => rerun(call.id)}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
