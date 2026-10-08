import code from '@content/Components/SpotlightCard/SpotlightCard.jsx?raw';
import css from '@content/Components/SpotlightCard/SpotlightCard.css?raw';
import tailwind from '@tailwind/Components/SpotlightCard/SpotlightCard.jsx?raw';
import tsCode from '@ts-default/Components/SpotlightCard/SpotlightCard.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/SpotlightCard/SpotlightCard.tsx?raw';

export const spotlightCard = {
  dependencies: ``,
  usage: `import SpotlightCard from './SpotlightCard';

<SpotlightCard
  theme="dark"
  spotlightColor="#ffffff"
  intensity={0.15}
  spotlightSize={240}
  softness={0.7}
  shape="circle"
  borderGlow={0.6}
  proximity={80}
  smoothing={0.3}
  grain={0}
  ambient={false}
  flare
>
  <h3>Ethan Harrison</h3>
  <p>Product designer</p>
  <button>Get in touch</button>
</SpotlightCard>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
