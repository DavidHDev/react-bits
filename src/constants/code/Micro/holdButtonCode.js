import code from '@content/Micro/HoldButton/HoldButton.jsx?raw';
import css from '@content/Micro/HoldButton/HoldButton.css?raw';
import tailwind from '@tailwind/Micro/HoldButton/HoldButton.jsx?raw';
import tsCode from '@ts-default/Micro/HoldButton/HoldButton.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/HoldButton/HoldButton.tsx?raw';

export const holdButton = {
  dependencies: ``,
  usage: `import HoldButton from './HoldButton';

<HoldButton
  doneLabel="Deleted"
  backgroundColor="#27272a"
  fillColor="#5227FF"
  textColor="#f5f5f5"
  fillTextColor="#ffffff"
  size="md"
  radius={14}
  fillDirection="right"
  holdTime={2000}
  releaseTime={200}
  pressScale={0.97}
  wave
  waveAmplitude={6}
  glow
  resetAfter={1200}
  onHold={() => console.log('confirmed')}
>
  Hold to delete
</HoldButton>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
