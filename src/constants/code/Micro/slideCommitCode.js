import code from '@content/Micro/SlideCommit/SlideCommit.jsx?raw';
import css from '@content/Micro/SlideCommit/SlideCommit.css?raw';
import tailwind from '@tailwind/Micro/SlideCommit/SlideCommit.jsx?raw';
import tsCode from '@ts-default/Micro/SlideCommit/SlideCommit.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/SlideCommit/SlideCommit.tsx?raw';

export const slideCommit = {
  dependencies: `motion @hugeicons/react @hugeicons/core-free-icons`,
  usage: `import SlideCommit from './SlideCommit';

<SlideCommit
  label="Slide to pay"
  doneLabel="Paid"
  errorLabel="Payment failed"
  onConfirm={() => api.pay(order)}
  onDone={() => console.log('paid')}
  onError={reason => console.log(reason)}
  trackColor="#262626"
  handleColor="#f5f5f5"
  successColor="#22c55e"
  dangerColor="#e5484d"
  width={280}
  height={56}
  radius={28}
  speed={50}
  returnBounce={0.38}
  landingDip={0.026}
  holdMs={1500}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
