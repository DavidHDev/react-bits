import code from '@content/Animations/MetaBalls/MetaBalls.jsx?raw';
import css from '@content/Animations/MetaBalls/MetaBalls.css?raw';
import tailwind from '@tailwind/Animations/MetaBalls/MetaBalls.jsx?raw';
import tsCode from '@ts-default/Animations/MetaBalls/MetaBalls.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/MetaBalls/MetaBalls.tsx?raw';

export const metaBalls = {
  dependencies: ``,
  usage: `import MetaBalls from './MetaBalls';

<div style={{ width: '100%', height: '480px', position: 'relative' }}>
  <MetaBalls
    color="#ffffff"
    cursorBallColor="#ffffff"
    variant="solid"
    motion="orbit"
    ballCount={15}
    animationSize={30}
    gooeyness={0.5}
    stretch={0.5}
    wobble={0.5}
    enableTransparency={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
