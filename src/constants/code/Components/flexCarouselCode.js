import code from '@content/Components/FlexCarousel/FlexCarousel.jsx?raw';
import css from '@content/Components/FlexCarousel/FlexCarousel.css?raw';
import tailwind from '@tailwind/Components/FlexCarousel/FlexCarousel.jsx?raw';
import tsCode from '@ts-default/Components/FlexCarousel/FlexCarousel.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/FlexCarousel/FlexCarousel.tsx?raw';

export const flexCarousel = {
  dependencies: `ogl`,
  usage: `import FlexCarousel from './FlexCarousel';

const items = [
  { src: '/images/one.jpg', alt: 'A chrome sculpture', title: 'Iridescence' },
  { src: '/images/two.jpg', alt: 'A figure on a white set', title: 'White Room' },
  { src: '/images/three.jpg', alt: 'A clay bust in profile', title: 'Clay Study', subtitle: 'Studio 04' }
];

<div style={{ width: '100%', height: '560px', position: 'relative' }}>
  <FlexCarousel
    items={items}
    preset="liquid"
    intro="rise"
    cardHeight={0.5}
    gap={12}
    squeeze={0.2}
    focusOnClick
    captions
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
