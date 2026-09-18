import code from '@content/Micro/FolderFloat/FolderFloat.jsx?raw';
import css from '@content/Micro/FolderFloat/FolderFloat.css?raw';
import tailwind from '@tailwind/Micro/FolderFloat/FolderFloat.jsx?raw';
import tsCode from '@ts-default/Micro/FolderFloat/FolderFloat.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/FolderFloat/FolderFloat.tsx?raw';

export const folderFloat = {
  dependencies: `matter-js`,
  usage: `import FolderFloat from './FolderFloat';

<FolderFloat
  items={['Try a warmer palette', 'Tighten the spacing', 'Logo feels small', 'Love the new hero']}
  label="Design feedback"
  sublabel="4 notes"
  trigger="hover"
  closeOnSelect
  physics
  drift={0.5}
  onSelect={(value, index) => console.log(value, index)}
  folderColor="#3f3f46"
  frontColor="#52525b"
  paperColor="#f5f5f5"
  itemColor="#f5f5f5"
  itemTextColor="#18181b"
  labelColor="#f5f5f5"
  width={200}
  height={148}
  radius={14}
  spread={180}
  lift={26}
  tilt={8}
  flapAngle={34}
  restAngle={16}
  openDuration={520}
  stagger={45}
  bounce={0.3}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
