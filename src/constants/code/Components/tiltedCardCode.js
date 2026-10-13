import code from '@content/Components/TiltedCard/TiltedCard.jsx?raw';
import css from '@content/Components/TiltedCard/TiltedCard.css?raw';
import tailwind from '@tailwind/Components/TiltedCard/TiltedCard.jsx?raw';
import tsCode from '@ts-default/Components/TiltedCard/TiltedCard.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/TiltedCard/TiltedCard.tsx?raw';

export const tiltedCard = {
  dependencies: ``,
  usage: `import TiltedCard, { TiltedCardLayer } from './TiltedCard';

<TiltedCard
  imageSrc="https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop"
  altText="Sunset clouds"
  captionText="Afterglow"
  containerHeight="320px"
  containerWidth="320px"
  imageHeight="320px"
  imageWidth="320px"
  rotateAmplitude={12}
  scaleOnHover={1.05}
  glare={0.5}
  shadow={0.5}
  backContent={<p style={{ padding: 20 }}>The back of the card</p>}
>
  <TiltedCardLayer depth={30}>
    <h3 style={{ position: 'absolute', left: 20, bottom: 16, color: '#fff' }}>Afterglow</h3>
  </TiltedCardLayer>
</TiltedCard>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
