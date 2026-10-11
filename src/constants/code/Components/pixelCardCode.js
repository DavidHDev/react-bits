import code from '@content/Components/PixelCard/PixelCard.jsx?raw';
import css from '@content/Components/PixelCard/PixelCard.css?raw';
import tailwind from '@tailwind/Components/PixelCard/PixelCard.jsx?raw';
import tsCode from '@ts-default/Components/PixelCard/PixelCard.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/PixelCard/PixelCard.tsx?raw';

export const pixelCard = {
  usage: `import PixelCard from './PixelCard';

<PixelCard
  colors={['#f8fafc', '#f1f5f9', '#cbd5e1']}
  glowColor="#cbd5e1"
  shape="square"
  origin="center"
  gap={5}
  pixelSize={2}
  speed={35}
  revealDuration={600}
  spotlight={0.5}
  glow={0.5}
  opacity={0.35}
  fade={0.7}
  trigger="hover"
  radius={24}
  clickPulse
  intro
  theme="dark"
>
  <YourIcon />
</PixelCard>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
