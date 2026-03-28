import code from '@content/Animations/OrbitImages/OrbitImages.jsx?raw';
import css from '@content/Animations/OrbitImages/OrbitImages.css?raw';
import tailwind from '@tailwind/Animations/OrbitImages/OrbitImages.jsx?raw';
import tsCode from '@ts-default/Animations/OrbitImages/OrbitImages.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/OrbitImages/OrbitImages.tsx?raw';

export const orbitImages = {
  dependencies: `motion`,
  usage: `// Component created by Dominik Koch
// https://x.com/dominikkoch

import OrbitImages from './OrbitImages'

const images = [
  "https://picsum.photos/300/300?grayscale&random=1",
  "https://picsum.photos/300/300?grayscale&random=2",
  "https://picsum.photos/300/300?grayscale&random=3",
  "https://picsum.photos/300/300?grayscale&random=4",
  "https://picsum.photos/300/300?grayscale&random=5",
  "https://picsum.photos/300/300?grayscale&random=6",
];

<OrbitImages
  images={images}
  shape="ellipse"
  radiusX={340}
  radiusY={80}
  rotation={-8}
  duration={30}
  itemSize={80}
  responsive={true}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
