import code from '@content/Micro/ThoughtLine/ThoughtLine.jsx?raw';
import css from '@content/Micro/ThoughtLine/ThoughtLine.css?raw';
import tailwind from '@tailwind/Micro/ThoughtLine/ThoughtLine.jsx?raw';
import tsCode from '@ts-default/Micro/ThoughtLine/ThoughtLine.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/ThoughtLine/ThoughtLine.tsx?raw';

export const thoughtLine = {
  dependencies: `motion @hugeicons/react @hugeicons/core-free-icons`,
  usage: `import ThoughtLine from './ThoughtLine';

<ThoughtLine
  working={isStreaming}
  steps={['Reading the question', 'Searching your notes', 'Drafting an answer']}
  label="Thinking…"
  doneLabel="Thought for"
  glyph="sparkle"
  fontSize={16}
  breathPeriod={1.6}
  breathDepth={0.45}
  settleDuration={350}
  settleBlur={2}
  collapsible
  collapseOnSettle
  showTimer
  onSettle={seconds => console.log(\`thought for \${seconds}s\`)}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
