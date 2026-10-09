import code from '@content/Components/Carousel/Carousel.jsx?raw';
import css from '@content/Components/Carousel/Carousel.css?raw';
import tailwind from '@tailwind/Components/Carousel/Carousel.jsx?raw';
import tsCode from '@ts-default/Components/Carousel/Carousel.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/Carousel/Carousel.tsx?raw';

export const carousel = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import Carousel from './Carousel';

const items = [
  { title: 'Open fields', description: 'Bright skies over rapeseed in full bloom.', image: '/fields.jpg' },
  { title: 'Moonrise', description: 'The same field, quiet under a full moon.', image: '/moon.jpg' },
  { title: 'The pier', description: 'Clear water and a long walk out.', image: '/pier.jpg' }
];

<div style={{ height: '600px', position: 'relative' }}>
  <Carousel
    items={items}
    baseWidth={300}
    aspectRatio={1.25}
    effect="tilt"
    indicator="dots"
    frame={true}
    arrows={false}
    loop={false}
    autoplay={false}
    autoplayDelay={3000}
    pauseOnHover={false}
    theme="dark"
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
