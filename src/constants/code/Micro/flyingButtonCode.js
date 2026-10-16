import code from '@content/Micro/FlyingButton/FlyingButton.jsx?raw';
import css from '@content/Micro/FlyingButton/FlyingButton.css?raw';
import tailwind from '@tailwind/Micro/FlyingButton/FlyingButton.jsx?raw';
import tsCode from '@ts-default/Micro/FlyingButton/FlyingButton.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/FlyingButton/FlyingButton.tsx?raw';

export const flyingButton = {
  dependencies: ``,
  usage: `import FlyingButton from './FlyingButton';

<div style={{ position: 'relative', height: 440 }}>
  <FlyingButton
    theme="dark"
    size="medium"
    altitude={170}
    hoverTime={2.4}
    jets={2}
    thrusters
    trigger="hover"
    carryCursor
    smoke={1}
    turbulence={1}
    wobble={1}
    ramp={false}
    thrustColor="#8ec5ff"
    smokeColor="#eef1f6"
    onClick={() => console.log('Lift off')}
  >
    Take off
  </FlyingButton>
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
