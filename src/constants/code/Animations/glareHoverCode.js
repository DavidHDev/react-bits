import code from '@content/Animations/GlareHover/GlareHover.jsx?raw';
import css from '@content/Animations/GlareHover/GlareHover.css?raw';
import tailwind from '@tailwind/Animations/GlareHover/GlareHover.jsx?raw';
import tsCode from '@ts-default/Animations/GlareHover/GlareHover.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/GlareHover/GlareHover.tsx?raw';

export const glareHover = {
  usage: `import GlareHover from './GlareHover';

<GlareHover
  width="360px"
  height="240px"
  borderRadius="20px"
  mode="hover"
  variant="streak"
  glareColor="#ffffff"
  glareOpacity={0.5}
  glareSize={30}
  softness={0.6}
  glareAngle={-45}
  blendMode="screen"
  rimGlint={true}
  transitionDuration={650}
>
  <img src="/photo.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
</GlareHover>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
