import code from '@content/TextAnimations/GlitchText/GlitchText.jsx?raw';
import css from '@content/TextAnimations/GlitchText/GlitchText.css?raw';
import tailwind from '@tailwind/TextAnimations/GlitchText/GlitchText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/GlitchText/GlitchText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/GlitchText/GlitchText.tsx?raw';

export const glitchText = {
  usage: `import GlitchText from './GlitchText';

<GlitchText
  mode="slices"
  trigger="always"
  speed={1}
  intensity={0.5}
  burstDuration={0.6}
  offset={10}
  skew={0}
  flicker={false}
  fontWeight={900}
  enableShadows={true}
  shadowColors={['#ff0000', '#00ffff']}
  className='custom-class'
>
  React Bits
</GlitchText>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
