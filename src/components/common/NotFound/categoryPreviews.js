import { componentMetadata } from '../../../constants/Information';

const CURATED = {
  'Text Animations': ['SplitText', 'DecryptedText', 'Shuffle', 'BlurText', 'TextType'],
  Animations: ['ElectricLogo', 'MetallicPaint', 'Ribbons', 'MagicRings', 'OrbitImages'],
  Components: ['MagicBento', 'TiltedCard', 'DomeGallery', 'CardSwap', 'GlassIcons'],
  Backgrounds: ['Grainient', 'Aurora', 'LiquidEther', 'Galaxy', 'LightRays'],
  Micro: ['SquishSwitch', 'HoldButton', 'SpringCheck', 'PulseHeart', 'VoicePill']
};

export const categoryPreviews = Object.fromEntries(
  Object.entries(CURATED).map(([category, names]) => [
    category,
    names.map(name => {
      const metadata = componentMetadata[`${category.replaceAll(' ', '')}/${name}`];
      return {
        name: metadata.name.replace(/([a-z0-9])([A-Z])/g, '$1 $2'),
        video: metadata.videoUrl.replace(/\.(webm|mp4)$/, ''),
        poster: `/og${new URL(metadata.docsUrl).pathname}.jpg`
      };
    })
  ])
);
