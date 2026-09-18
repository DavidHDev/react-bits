import code from '@content/Micro/LatticeLoader/LatticeLoader.jsx?raw';
import css from '@content/Micro/LatticeLoader/LatticeLoader.css?raw';
import tailwind from '@tailwind/Micro/LatticeLoader/LatticeLoader.jsx?raw';
import tsCode from '@ts-default/Micro/LatticeLoader/LatticeLoader.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/LatticeLoader/LatticeLoader.tsx?raw';

export const latticeLoader = {
  dependencies: '',
  usage: `import LatticeLoader from './LatticeLoader';

<LatticeLoader
  status={isDone ? 'done' : 'working'}
  label="Thinking"
  doneLabel="Done in"
  errorLabel="Failed after"
  pattern="orbit"
  grid={3}
  shape="round"
  doneColor="#22c55e"
  errorColor="#ef4444"
  cellSize={6}
  gap={2}
  fontSize={14}
  step={90}
  idleOpacity={0.15}
  glow={false}
  glowColor=""
  showTimer
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
