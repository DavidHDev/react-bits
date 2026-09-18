import code from '@content/Micro/JellyRadio/JellyRadio.jsx?raw';
import css from '@content/Micro/JellyRadio/JellyRadio.css?raw';
import tailwind from '@tailwind/Micro/JellyRadio/JellyRadio.jsx?raw';
import tsCode from '@ts-default/Micro/JellyRadio/JellyRadio.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/JellyRadio/JellyRadio.tsx?raw';

export const jellyRadio = {
  dependencies: `motion`,
  usage: `import JellyRadio from './JellyRadio';

<JellyRadio
  items={['Off', 'Low', 'Medium', 'High', 'Max']}
  defaultValue="Medium"
  onChange={(value, index) => console.log(value, index)}
  chipColor="#27272a"
  activeColor="#f5f5f5"
  textColor="#f5f5f5"
  activeTextColor="#18181b"
  size="md"
  gap={8}
  radius={18}
  swell={0.2}
  barge={6}
  shrink={0.05}
  jelly={1}
  bounce={0.25}
  stagger={22}
  stiffness={580}
/>

<JellyRadio
  items={[
    { value: 'list', label: 'List', icon: <ListIcon /> },
    { value: 'grid', label: 'Grid', icon: <GridIcon /> },
    { value: 'map', label: 'Map', disabled: true }
  ]}
  defaultValue="grid"
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
