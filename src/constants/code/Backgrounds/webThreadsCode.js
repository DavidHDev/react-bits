import code from '@content/Backgrounds/WebThreads/WebThreads.jsx?raw';
import css from '@content/Backgrounds/WebThreads/WebThreads.css?raw';
import tailwind from '@tailwind/Backgrounds/WebThreads/WebThreads.jsx?raw';
import tsCode from '@ts-default/Backgrounds/WebThreads/WebThreads.tsx?raw';
import tsTailwind from '@ts-tailwind/Backgrounds/WebThreads/WebThreads.tsx?raw';

export const webThreads = {
  dependencies: ``,
  usage: `import WebThreads from './WebThreads';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <WebThreads
    colors={['#5227FF', '#FF9FFC']}
    coreColor="#FFFFFF"
    threadCount={6}
    spread={0.18}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
