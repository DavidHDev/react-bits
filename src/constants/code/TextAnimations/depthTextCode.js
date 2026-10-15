import code from '@content/TextAnimations/DepthText/DepthText.jsx?raw';
import css from '@content/TextAnimations/DepthText/DepthText.css?raw';
import tailwind from '@tailwind/TextAnimations/DepthText/DepthText.jsx?raw';
import tsCode from '@ts-default/TextAnimations/DepthText/DepthText.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/DepthText/DepthText.tsx?raw';

export const depthText = {
  dependencies: ``,
  usage: `import DepthText from './DepthText';

<DepthText
  text="Elevate"
  layers={34}
  depth={2.4}
  depthColor="#7c3aed"
  gradientDepth={false}
  hoverPush={0.5}
  float={false}
  tilt={7.5}
  pointerTracking
  smoothing={0.14}
  perspective={900}
  autoOrbit
  orbitSpeed={0.35}
  fontSize="clamp(3rem, 12vw, 7rem)"
  fontWeight={900}
  shadow
  outline={false}
  intro
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
