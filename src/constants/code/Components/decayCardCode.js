import code from '@content/Components/DecayCard/DecayCard.jsx?raw';
import css from '@content/Components/DecayCard/DecayCard.css?raw';
import tailwind from '@tailwind/Components/DecayCard/DecayCard.jsx?raw';
import tsCode from '@ts-default/Components/DecayCard/DecayCard.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/DecayCard/DecayCard.tsx?raw';

export const decayCard = {
  usage: `import DecayCard from './DecayCard';

<DecayCard
  image="https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop"
  width={300}
  height={400}
  intensity={0.5}
  sensitivity={0.5}
  hoverDecay={0.05}
  recovery={0.6}
  idle={0.35}
  grain={0.25}
  detail={5}
  pattern={4}
  flow={0}
  chroma={0}
  travel={50}
  tilt={10}
  scope="window"
  radius={0}
  grayscale={false}
>
  <h3>Afterglow</h3>
</DecayCard>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
