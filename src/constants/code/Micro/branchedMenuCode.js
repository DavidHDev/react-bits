import code from '@content/Micro/BranchedMenu/BranchedMenu.jsx?raw';
import css from '@content/Micro/BranchedMenu/BranchedMenu.css?raw';
import tailwind from '@tailwind/Micro/BranchedMenu/BranchedMenu.jsx?raw';
import tsCode from '@ts-default/Micro/BranchedMenu/BranchedMenu.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/BranchedMenu/BranchedMenu.tsx?raw';

export const branchedMenu = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import { Download04Icon, Rocket01Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import BranchedMenu from './BranchedMenu';

<BranchedMenu
  items={[
    {
      label: 'Getting started',
      children: [
        { value: 'install', label: 'Installation', icon: Download04Icon },
        { value: 'quick', label: 'Quick start', icon: Rocket01Icon },
        { value: 'config', label: 'Configuration', icon: Settings02Icon }
      ]
    },
    { label: 'Components', children: [{ value: 'buttons', label: 'Buttons' }, { value: 'overlays', label: 'Overlays' }] }
  ]}
  defaultOpen={[0]}
  defaultActive="quick"
  onSelect={(value, item) => navigate(value)}
  color="#f5f5f5"
  accentColor="#f5f5f5"
  lineColor="#3f3f46"
  width={240}
  rowHeight={36}
  indent={40}
  trunk={14}
  radius={10}
  lineWidth={1.5}
  fontSize={14}
  drawDuration={400}
  foldDuration={300}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
