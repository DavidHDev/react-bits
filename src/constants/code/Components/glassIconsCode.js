import code from '@content/Components/GlassIcons/GlassIcons.jsx?raw';
import css from '@content/Components/GlassIcons/GlassIcons.css?raw';
import tailwind from '@tailwind/Components/GlassIcons/GlassIcons.jsx?raw';
import tsCode from '@ts-default/Components/GlassIcons/GlassIcons.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/GlassIcons/GlassIcons.tsx?raw';

export const glassIcons = {
  usage: `import { HugeiconsIcon } from '@hugeicons/react';
import { Folder01Icon, Book02Icon, FavouriteIcon, CloudIcon, Note01Icon, ChartHistogramIcon } from '@hugeicons/core-free-icons';
import GlassIcons from './GlassIcons';

const items = [
  { icon: <HugeiconsIcon icon={Folder01Icon} />, color: 'blue', label: 'Files', href: '/files' },
  { icon: <HugeiconsIcon icon={Book02Icon} />, color: 'purple', label: 'Books' },
  { icon: <HugeiconsIcon icon={FavouriteIcon} />, color: 'red', label: 'Health' },
  { icon: <HugeiconsIcon icon={CloudIcon} />, color: 'indigo', label: 'Weather' },
  { icon: <HugeiconsIcon icon={Note01Icon} />, color: 'orange', label: 'Notes' },
  { icon: <HugeiconsIcon icon={ChartHistogramIcon} />, color: 'green', label: 'Stats', onClick: () => {} }
];

<div style={{ height: '600px', position: 'relative' }}>
  <GlassIcons
    items={items}
    size={82}
    gap={66}
    columns={3}
    roundness={0.6}
    refraction={0.8}
    bevel={0.6}
    dispersion={0}
    frost={0.2}
    shine={0.85}
    tint="#dfdfdf"
    tintOpacity={0.2}
    iconColor="#ffffff"
    plate="tilt"
    tilt={30}
    spread={0.5}
    hover="press"
    parallax={1}
    labels="hover"
    intro={true}
    theme="dark"
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
