import code from '@content/Micro/TearTicket/TearTicket.jsx?raw';
import css from '@content/Micro/TearTicket/TearTicket.css?raw';
import tailwind from '@tailwind/Micro/TearTicket/TearTicket.jsx?raw';
import tsCode from '@ts-default/Micro/TearTicket/TearTicket.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/TearTicket/TearTicket.tsx?raw';

export const tearTicket = {
  dependencies: `motion`,
  usage: `import TearTicket from './TearTicket';

<TearTicket
  image="/spectrum.jpg"
  imageAlt="Visitors in a walkway of coloured glass"
  stub={
    <div>
      <h3>Admit one</h3>
      <p>Rooftop gallery · Until 30 Nov</p>
      <span>No. 284619</span>
    </div>
  }
  orientation="horizontal"
  scrim
  imageRadius={8}
  onTear={() => markAsUsed(ticket.id)}
  width={460}
  height={250}
  stubSize={150}
  radius={16}
  holes={12}
  holeSize={6}
  notch={3}
  roughness={0}
  tearAngle={30}
  stretch={30}
  resistance={0.45}
  rotate={4}
  tilt
  tiltMax={9}
  tiltReach={260}
  parallax={6}
  perspective={1000}
  background="#27272a"
  color="#f5f5f5"
  border
  borderWidth={1}
  recenter
>
  <span>Spectrum</span>
</TearTicket>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
