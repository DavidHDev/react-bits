import code from '@content/Micro/CodeSlots/CodeSlots.jsx?raw';
import css from '@content/Micro/CodeSlots/CodeSlots.css?raw';
import tailwind from '@tailwind/Micro/CodeSlots/CodeSlots.jsx?raw';
import tsCode from '@ts-default/Micro/CodeSlots/CodeSlots.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/CodeSlots/CodeSlots.tsx?raw';

export const codeSlots = {
  dependencies: `motion @hugeicons/react @hugeicons/core-free-icons`,
  usage: `import { useState } from 'react';
import CodeSlots from './CodeSlots';

const [status, setStatus] = useState('idle');

<CodeSlots
  length={6}
  status={status}
  onChange={() => setStatus('idle')}
  onComplete={async code => {
    const ok = await verify(code);
    setStatus(ok ? 'success' : 'error');
  }}
  accentColor="#f5f5f5"
  inkColor="#f5f5f5"
  slotColor="#27272a"
  digitColor="#18181b"
  dangerColor="#ff3b30"
  slotSize={44}
  gap={8}
  radius={12}
  bounce={0.2}
  settle={0.3}
  rise={8}
  cascade={20}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
