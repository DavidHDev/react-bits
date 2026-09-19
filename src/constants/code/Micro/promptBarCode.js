import code from '@content/Micro/PromptBar/PromptBar.jsx?raw';
import css from '@content/Micro/PromptBar/PromptBar.css?raw';
import tailwind from '@tailwind/Micro/PromptBar/PromptBar.jsx?raw';
import tsCode from '@ts-default/Micro/PromptBar/PromptBar.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/PromptBar/PromptBar.tsx?raw';

export const promptBar = {
  dependencies: `motion @hugeicons/react @hugeicons/core-free-icons`,
  usage: `import { useRef, useState } from 'react';
import { Attachment01Icon, Globe02Icon } from '@hugeicons/core-free-icons';
import PromptBar from './PromptBar';

const [busy, setBusy] = useState(false);
const controller = useRef(null);

const send = async (text, { attachments, model, effort }) => {
  setBusy(true);
  controller.current = new AbortController();
  await ask({ text, attachments, model: model.key, effort, signal: controller.current.signal }).catch(() => {});
  setBusy(false);
};

<PromptBar
  placeholder="Ask anything"
  sources={[
    { key: 'files', name: 'Photos & files', description: 'Upload from this device', icon: Attachment01Icon, attach: true },
    { key: 'web', name: 'Web search', description: 'Live results', icon: Globe02Icon }
  ]}
  commands={[{ key: 'summarize', name: '/summarize', description: 'Digest the thread so far' }]}
  models={[
    { key: 'nova-3', name: 'Nova 3', tag: 'Flagship' },
    { key: 'nova-mini', name: 'Nova Mini', tag: 'Fast' }
  ]}
  efforts={['Low', 'Medium', 'High', 'Extra', 'Max']}
  busy={busy}
  onSend={send}
  onStop={() => controller.current?.abort()}
  onAttach={() => pickFiles()}
  onDictate={() => transcribe()}
  background="#27272a"
  color="#f5f5f5"
  menuBackground="#323236"
  sparkColor="#b39dff"
  sparkBoost={1}
  width={400}
  radius={16}
  maxRows={5}
  morphDuration={240}
  squash={0.12}
  tilt={8}
  pressScale={0.96}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
