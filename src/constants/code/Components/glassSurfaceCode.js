import code from '@content/Components/GlassSurface/GlassSurface.jsx?raw';
import css from '@content/Components/GlassSurface/GlassSurface.css?raw';
import tailwind from '@tailwind/Components/GlassSurface/GlassSurface.jsx?raw';
import tsCode from '@ts-default/Components/GlassSurface/GlassSurface.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/GlassSurface/GlassSurface.tsx?raw';

export const glassSurface = {
  usage: `import GlassSurface from './GlassSurface';

<GlassSurface
  width={320}
  height={76}
  borderRadius={38}
  distortionScale={-180}
  displace={0.5}
  backgroundOpacity={0.1}
>
  <span>Your content</span>
</GlassSurface>

<GlassSurface shape="/logo.svg" width={280} height={280} />`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
