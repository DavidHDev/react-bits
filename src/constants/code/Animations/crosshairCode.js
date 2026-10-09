import code from '@content/Animations/Crosshair/Crosshair.jsx?raw';
import tailwind from '@tailwind/Animations/Crosshair/Crosshair.jsx?raw';
import tsCode from '@ts-default/Animations/Crosshair/Crosshair.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/Crosshair/Crosshair.tsx?raw';

export const crosshair = {
  dependencies: ``,
  usage: `import { useRef } from 'react';
import Crosshair from './Crosshair';

const Hero = () => {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} style={{ position: 'relative', height: 400 }}>
      <Crosshair
        containerRef={containerRef}
        color="#ffffff"
        targetEffect="lock"
        thickness={1}
        opacity={0.85}
        smoothing={0.35}
        showCoordinates
      />
      <a href="/docs">Read the docs</a>
    </div>
  );
};`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
