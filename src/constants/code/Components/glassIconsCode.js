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
    size={72}
    gap={56}
    columns={3}
    roundness={0.5}
    refraction={0.4}
    bevel={0.5}
    dispersion={0.4}
    frost={0.4}
    shine={0.7}
    tint="#ffffff"
    tintOpacity={0.12}
    iconColor="#ffffff"
    plate="tilt"
    tilt={15}
    spread={0.5}
    hover="lift"
    parallax={0.5}
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
