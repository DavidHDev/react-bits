import code from '@content/Micro/ScrubField/ScrubField.jsx?raw';
import css from '@content/Micro/ScrubField/ScrubField.css?raw';
import tailwind from '@tailwind/Micro/ScrubField/ScrubField.jsx?raw';
import tsCode from '@ts-default/Micro/ScrubField/ScrubField.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/ScrubField/ScrubField.tsx?raw';

export const scrubField = {
  dependencies: `motion`,
  usage: `import ScrubField from './ScrubField';

<ScrubField
  label="Radius"
  suffix="px"
  defaultValue={24}
  min={0}
  max={100}
  step={1}
  size="md"
  sensitivity={2}
  rubberReach={8}
  returnDuration={300}
  coarseMultiplier={10}
  fineMultiplier={0.1}
  showDelta
  showDirty={false}
  showFill
  accent="#f5f5f5"
  chipColor="#27272a"
  onChange={value => setRadius(value)}
  onCommit={value => save(value)}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
