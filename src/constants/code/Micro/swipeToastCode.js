import code from '@content/Micro/SwipeToast/SwipeToast.jsx?raw';
import css from '@content/Micro/SwipeToast/SwipeToast.css?raw';
import tailwind from '@tailwind/Micro/SwipeToast/SwipeToast.jsx?raw';
import tsCode from '@ts-default/Micro/SwipeToast/SwipeToast.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/SwipeToast/SwipeToast.tsx?raw';

export const swipeToast = {
  dependencies: `motion @hugeicons/react @hugeicons/core-free-icons`,
  usage: `import { useState } from 'react';
import SwipeToast from './SwipeToast';

const [open, setOpen] = useState(true);

<SwipeToast
  open={open}
  onClose={reason => setOpen(false)}
  title="File archived"
  description="Moved to Archive"
  actionLabel="Undo"
  onAction={() => restore()}
  background="#27272a"
  color="#f5f5f5"
  fuseColor="#f5a524"
  width={356}
  radius={12}
  slideMs={400}
  settleBounce={0.2}
  swipeDistance={40}
  duration={4000}
  fuse="bottom"
  pauseOnHover
  closeButton={false}
/>

const [toasts, setToasts] = useState([]);
const notify = () => setToasts(t => [...t, { id: Date.now() }]);

<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
  {toasts.map(t => (
    <SwipeToast key={t.id} inline title="Link copied" duration={2500} onClose={() => setToasts(s => s.filter(x => x.id !== t.id))} />
  ))}
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
