import code from '@content/Micro/FuseButton/FuseButton.jsx?raw';
import css from '@content/Micro/FuseButton/FuseButton.css?raw';
import tailwind from '@tailwind/Micro/FuseButton/FuseButton.jsx?raw';
import tsCode from '@ts-default/Micro/FuseButton/FuseButton.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/FuseButton/FuseButton.tsx?raw';

export const fuseButton = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import FuseButton from './FuseButton';

<FuseButton
  label="Archive"
  doneLabel="Archived"
  undoLabel="Undo"
  color="#f5f5f5"
  background="#27272a"
  fuseColor="#f5a524"
  size="md"
  radius={22}
  undoWindow={4000}
  fuse="outline"
  fuseThickness={1.5}
  crossfadeMs={200}
  commitOn="press"
  pauseOnHover
  settle="reset"
  onCommit={() => archive(item)}
  onUndo={() => restore(item)}
  onFuseEnd={() => purge(item)}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
