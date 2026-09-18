import code from '@content/Micro/RubberSegment/RubberSegment.jsx?raw';
import css from '@content/Micro/RubberSegment/RubberSegment.css?raw';
import tailwind from '@tailwind/Micro/RubberSegment/RubberSegment.jsx?raw';
import tsCode from '@ts-default/Micro/RubberSegment/RubberSegment.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/RubberSegment/RubberSegment.tsx?raw';

export const rubberSegment = {
  dependencies: `motion`,
  usage: `import RubberSegment from './RubberSegment';

<RubberSegment
  items={['Day', 'Week', 'Month', 'Year']}
  defaultValue="Week"
  onChange={(value, index) => console.log(value, index)}
  trackColor="#27272a"
  thumbColor="#fafafa"
  textColor="#fafafa"
  activeTextColor="#18181b"
  size="md"
  radius={10}
  inset={3}
  equalSlots
  stretch={100}
  squash={3}
  speed={1}
  glide={75}
  draggable
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
