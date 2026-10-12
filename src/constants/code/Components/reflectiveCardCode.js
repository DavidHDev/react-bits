import code from '@content/Components/ReflectiveCard/ReflectiveCard.jsx?raw';
import css from '@content/Components/ReflectiveCard/ReflectiveCard.css?raw';
import tailwind from '@tailwind/Components/ReflectiveCard/ReflectiveCard.jsx?raw';
import tsCode from '@ts-default/Components/ReflectiveCard/ReflectiveCard.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/ReflectiveCard/ReflectiveCard.tsx?raw';

export const reflectiveCard = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import ReflectiveCard from './ReflectiveCard';

<ReflectiveCard
  name="Alexander Doe"
  role="Senior Developer"
  videoSrc="/videos/reflection.mp4"
  webcam={false}
  tint="#ffffff"
  metalness={1}
  roughness={0.3}
  blurStrength={6}
  shine={1}
  glare={0.5}
/>
`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
