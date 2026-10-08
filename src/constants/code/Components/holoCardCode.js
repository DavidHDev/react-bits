import code from '@content/Components/HoloCard/HoloCard.jsx?raw';
import css from '@content/Components/HoloCard/HoloCard.css?raw';
import tailwind from '@tailwind/Components/HoloCard/HoloCard.jsx?raw';
import tsCode from '@ts-default/Components/HoloCard/HoloCard.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/HoloCard/HoloCard.tsx?raw';

export const holoCard = {
  dependencies: ``,
  usage: `import HoloCard from './HoloCard';
import card from './pikachu.webp';

<HoloCard image={card} alt="Pikachu" preset="bursts" />`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
