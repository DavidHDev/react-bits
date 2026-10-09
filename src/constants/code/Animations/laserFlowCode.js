import code from '@content/Animations/LaserFlow/LaserFlow.jsx?raw';
import css from '@content/Animations/LaserFlow/LaserFlow.css?raw';
import tailwind from '@tailwind/Animations/LaserFlow/LaserFlow.jsx?raw';
import tsCode from '@ts-default/Animations/LaserFlow/LaserFlow.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/LaserFlow/LaserFlow.tsx?raw';

export const laserFlow = {
  usage: `import { useRef } from 'react';
import LaserFlow from './LaserFlow';

export default function Hero() {
  const cardRef = useRef(null);

  return (
    <div style={{ position: 'relative', height: '600px', overflow: 'hidden' }}>
      <LaserFlow
        surfaceRef={cardRef}
        beamPosition={0.6}
        color="#3847ff"
        intensity={1.8}
        flare={1.5}
        spread={1.5}
        spill={1}
        fog={0.2}
        dust={1.6}
        revealImage="/your-ui.png"
        revealRadius={220}
        revealOpacity={0.6}
      />

      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          left: '18%',
          right: '28%',
          top: '52%',
          bottom: '-24px',
          borderRadius: '14px',
          background: '#0b0b0d'
        }}
      >
        {/* Your content here */}
      </div>
    </div>
  );
}`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
