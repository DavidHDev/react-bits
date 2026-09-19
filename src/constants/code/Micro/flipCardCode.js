import code from '@content/Micro/FlipCard/FlipCard.jsx?raw';
import css from '@content/Micro/FlipCard/FlipCard.css?raw';
import tailwind from '@tailwind/Micro/FlipCard/FlipCard.jsx?raw';
import tsCode from '@ts-default/Micro/FlipCard/FlipCard.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/FlipCard/FlipCard.tsx?raw';

export const flipCard = {
  dependencies: `motion`,
  usage: `import FlipCard from './FlipCard';

<FlipCard
  front={<img src="/landscape.jpg" alt="Wooded landscape" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
  back={
    <div style={{ padding: 24 }}>
      <h3>Wooded Landscape</h3>
      <p>17th century · Rijksmuseum</p>
    </div>
  }
  axis="y"
  flipOnClick
  draggable
  dragDistance={0}
  tilt
  tiltMax={12}
  glare
  glareOpacity={0.22}
  hoverScale={1.03}
  perspective={1100}
  stiffness={170}
  damping={20}
  width={300}
  height={400}
  radius={22}
  background="#27272a"
  color="#f5f5f5"
  shadow
  shadowColor="#000000"
  shadowOpacity={0.45}
  onFlipChange={flipped => console.log(flipped)}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
