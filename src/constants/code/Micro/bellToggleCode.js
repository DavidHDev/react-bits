import code from '@content/Micro/BellToggle/BellToggle.jsx?raw';
import css from '@content/Micro/BellToggle/BellToggle.css?raw';
import tailwind from '@tailwind/Micro/BellToggle/BellToggle.jsx?raw';
import tsCode from '@ts-default/Micro/BellToggle/BellToggle.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/BellToggle/BellToggle.tsx?raw';

export const bellToggle = {
  dependencies: `motion @hugeicons/react @hugeicons/core-free-icons`,
  usage: `import BellToggle from './BellToggle';

<BellToggle
  offLabel="Notify me"
  onLabel="You'll be notified"
  color="#f5f5f5"
  background="#27272a"
  onColor="#18181b"
  onBackground="#f5f5f5"
  size="md"
  radius={22}
  ringAmplitude={17}
  ringPasses={5}
  ringDecay={1}
  ringDuration={820}
  ringPivot={16}
  crossfadeMs={200}
  revealBounce={0}
  count={unread}
  badge
  badgeColor="#ef4444"
  waves
  clapper={false}
  defaultPressed={false}
  onChange={pressed => console.log(pressed)}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
