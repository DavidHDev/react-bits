import code from '@content/Micro/WarmTooltip/WarmTooltip.jsx?raw';
import css from '@content/Micro/WarmTooltip/WarmTooltip.css?raw';
import tailwind from '@tailwind/Micro/WarmTooltip/WarmTooltip.jsx?raw';
import tsCode from '@ts-default/Micro/WarmTooltip/WarmTooltip.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/WarmTooltip/WarmTooltip.tsx?raw';

export const warmTooltip = {
  dependencies: `motion`,
  usage: `import WarmTooltip, { WarmTooltipGroup } from './WarmTooltip';

<WarmTooltipGroup delay={400} warmWindow={300} travel={320} lean={0}>
  <WarmTooltip
    content="Bold"
    shortcut="⌘B"
    side="top"
    surfaceColor="#f5f5f5"
    inkColor="#18181b"
    size="md"
    radius={8}
    gap={8}
    arrow
    popDuration={160}
    popScale={0.94}
    popBlur={4}
    showFuse={false}
  >
    <button type="button" aria-label="Bold">
      <BoldIcon />
    </button>
  </WarmTooltip>
  <WarmTooltip content="Italic" shortcut="⌘I">
    <button type="button" aria-label="Italic">
      <ItalicIcon />
    </button>
  </WarmTooltip>
  <WarmTooltip content="Add link" shortcut="⌘K">
    <button type="button" aria-label="Link">
      <LinkIcon />
    </button>
  </WarmTooltip>
</WarmTooltipGroup>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
