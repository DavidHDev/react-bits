import code from '@content/Components/Masonry/Masonry.jsx?raw';
import tailwind from '@tailwind/Components/Masonry/Masonry.jsx?raw';
import tsCode from '@ts-default/Components/Masonry/Masonry.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/Masonry/Masonry.tsx?raw';
import css from '@content/Components/Masonry/Masonry.css?raw';

export const masonry = {
  dependencies: `gsap`,
  usage: `import Masonry from './Masonry';

const items = [
    {
      id: "1",
      img: "https://picsum.photos/id/1015/600/900?grayscale",
      url: "https://example.com/one",
      height: 400,
    },
    {
      id: "2",
      img: "https://picsum.photos/id/1011/600/750?grayscale",
      url: "https://example.com/two",
      height: 250,
    },
    {
      id: "3",
      img: "https://picsum.photos/id/1020/600/800?grayscale",
      url: "https://example.com/three",
      height: 600,
    },
    // ... more items
];

<Masonry
  items={items}
  ease="power3.out"
  duration={0.6}
  stagger={0.05}
  animateFrom="bottom"
  scaleOnHover={true}
  hoverScale={0.95}
  blurToFocus={true}
  colorShiftOnHover={false}
  adjustHeight={false}
/>
`,
  code,
  tailwind,
  tsCode,
  tsTailwind,
  css
};
