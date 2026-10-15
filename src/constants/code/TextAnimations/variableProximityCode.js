import code from '@content/TextAnimations/VariableProximity/VariableProximity.jsx?raw';
import css from '@content/TextAnimations/VariableProximity/VariableProximity.css?raw';
import tailwind from '@tailwind/TextAnimations/VariableProximity/VariableProximity.jsx?raw';
import tsCode from '@ts-default/TextAnimations/VariableProximity/VariableProximity.tsx?raw';
import tsTailwind from '@ts-tailwind/TextAnimations/VariableProximity/VariableProximity.tsx?raw';

export const variableProximity = {
  usage: `import { useRef } from 'react';
import VariableProximity from './VariableProximity';

const containerRef = useRef(null);

<div
ref={containerRef}
style={{position: 'relative'}}
>
  <VariableProximity
    label={'Hover me! And then star React Bits on GitHub, or else...'}
    className={'variable-proximity-demo'}
    fromFontVariationSettings="'wght' 400, 'opsz' 9"
    toFontVariationSettings="'wght' 1000, 'opsz' 40"
    containerRef={containerRef}
    radius={100}
    falloff='linear'
    smoothing={0.2}
    scale={1}
    lift={0}
    idleWave={false}
    fontSize={64}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
