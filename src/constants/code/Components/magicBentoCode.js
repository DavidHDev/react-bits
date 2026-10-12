import code from '@content/Components/MagicBento/MagicBento.jsx?raw';
import css from '@content/Components/MagicBento/MagicBento.css?raw';
import tailwind from '@tailwind/Components/MagicBento/MagicBento.jsx?raw';
import tsCode from '@ts-default/Components/MagicBento/MagicBento.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/MagicBento/MagicBento.tsx?raw';

export const magicBento = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import MagicBento from './MagicBento';

<MagicBento
  columns={4}
  rowHeight={200}
  gap={12}
  radius={20}
  enableBorderGlow={true}
  enableSpotlight={true}
  spotlightRadius={300}
  clickEffect={true}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
