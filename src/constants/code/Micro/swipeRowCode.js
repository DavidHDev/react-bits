import code from '@content/Micro/SwipeRow/SwipeRow.jsx?raw';
import css from '@content/Micro/SwipeRow/SwipeRow.css?raw';
import tailwind from '@tailwind/Micro/SwipeRow/SwipeRow.jsx?raw';
import tsCode from '@ts-default/Micro/SwipeRow/SwipeRow.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/SwipeRow/SwipeRow.tsx?raw';

export const swipeRow = {
  dependencies: `motion @hugeicons/react @hugeicons/core-free-icons`,
  usage: `import SwipeRow from './SwipeRow';
import { HugeiconsIcon } from '@hugeicons/react';
import { Archive02Icon, Delete02Icon } from '@hugeicons/core-free-icons';

<SwipeRow
  actions={[
    { id: 'delete', label: 'Delete', icon: <HugeiconsIcon icon={Delete02Icon} size={20} /> },
    { id: 'archive', label: 'Archive', icon: <HugeiconsIcon icon={Archive02Icon} size={20} />, dismiss: true }
  ]}
  onAction={action => console.log(action.id)}
  onCommit={action => removeRow(item.id, action.id)}
  actionColor="#e5484d"
  drawerColor="#3f3f46"
  rowColor="#27272a"
  textColor="#f5f5f5"
  height={64}
  radius={16}
  actionWidth={80}
  direction="left"
  snapBounce={0.2}
  resistance={0.55}
  collapseMs={200}
  commitAt={0.6}
  fullSwipe
  style={{ marginBottom: 8 }}
>
  <span>Design review notes</span>
</SwipeRow>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
