import code from '@content/Micro/RefineFrame/RefineFrame.jsx?raw';
import css from '@content/Micro/RefineFrame/RefineFrame.css?raw';
import tailwind from '@tailwind/Micro/RefineFrame/RefineFrame.jsx?raw';
import tsCode from '@ts-default/Micro/RefineFrame/RefineFrame.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/RefineFrame/RefineFrame.tsx?raw';

export const refineFrame = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import RefineFrame from './RefineFrame';

<RefineFrame
  status={job.status}
  aspectRatio="4 / 3"
  width={320}
  radius={16}
  background="#27272a"
  color="#f5f5f5"
  stageDuration={400}
  sweep
  showStatus
  hideAfter={1200}
  retryLabel="Retry"
  onRetry={() => job.restart()}
>
  <img src={job.url} alt={job.prompt} crossOrigin="anonymous" />
</RefineFrame>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
