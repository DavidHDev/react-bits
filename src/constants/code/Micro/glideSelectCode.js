import code from '@content/Micro/GlideSelect/GlideSelect.jsx?raw';
import css from '@content/Micro/GlideSelect/GlideSelect.css?raw';
import tailwind from '@tailwind/Micro/GlideSelect/GlideSelect.jsx?raw';
import tsCode from '@ts-default/Micro/GlideSelect/GlideSelect.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/GlideSelect/GlideSelect.tsx?raw';

export const glideSelect = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import GlideSelect from './GlideSelect';

const formats = [
  { value: 'png', label: 'PNG', tag: 'Lossless' },
  { value: 'jpg', label: 'JPG', tag: 'Smallest' },
  { value: 'webp', label: 'WebP', tag: 'Modern' },
  { value: 'svg', label: 'SVG', tag: 'Vector' },
  { value: 'pdf', label: 'PDF', tag: 'Print' }
];

<GlideSelect
  options={formats}
  defaultValue="png"
  onChange={(value, option) => console.log(value, option)}
  ariaLabel="Export format"
  showTags
  accentColor="#f5f5f5"
  surfaceColor="#27272a"
  highlightColor="#3f3f46"
  textColor="#f5f5f5"
  size="md"
  radius={10}
  menuWidth={176}
  placement="bottom"
  align="left"
  popDuration={180}
  glideDuration={220}
  rememberPosition
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
