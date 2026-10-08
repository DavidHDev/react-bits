import code from '@content/Animations/BlobCursor/BlobCursor.jsx?raw';
import css from '@content/Animations/BlobCursor/BlobCursor.css?raw';
import tailwind from '@tailwind/Animations/BlobCursor/BlobCursor.jsx?raw';
import tsCode from '@ts-default/Animations/BlobCursor/BlobCursor.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/BlobCursor/BlobCursor.tsx?raw';

export const blobCursor = {
  dependencies: `three`,
  usage: `import BlobCursor from './BlobCursor';

<div style={{ position: 'relative', height: '500px' }}>
  <BlobCursor material="chrome" color="#3B82F6" size={140} />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
