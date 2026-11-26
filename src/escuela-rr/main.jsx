import { createRoot } from 'react-dom/client';

import PixelCard from '../content/Components/PixelCard/PixelCard';
import PixelTransition from '../content/Animations/PixelTransition/PixelTransition';
import Lightning from '../content/Backgrounds/Lightning/Lightning';
import BrandArtwork from './BrandArtwork';

import './pixel-effects.css';

function mountHeroPixelCard() {
  const hero = document.querySelector('#hero');
  if (!hero) return;

  let host = null;
  let root = null;
  const sync = () => {
    const next = hero.querySelector('.welcome .deco');
    if (next === host) return;
    if (root) root.unmount();
    root = null;
    host = next;
    if (!host) return;

    root = createRoot(host);
    root.render(
      <PixelCard
        className="pixel-hero-effect"
        variant="blue"
        theme="dark"
        trigger="hover"
        origin="pointer"
        gap={12}
        pixelSize={2.5}
        revealDuration={650}
        spotlight={0.75}
        glow={0.45}
        opacity={0.62}
        fade={0.72}
        intro={false}
      />
    );
  };

  const observer = new MutationObserver(sync);
  observer.observe(hero, { childList: true, subtree: true });
  sync();
}

const brandHost = document.getElementById('rr-brand-pixel');
if (brandHost) {
  createRoot(brandHost).render(
    <PixelTransition
      firstContent={<BrandArtwork />}
      secondContent={<BrandArtwork alternate />}
      gridSize={8}
      pixelColor="#c8d2ff"
      animationStepDuration={0.34}
      pattern="ripple"
      randomness={0.18}
      pixelAnimation="grow"
      pixelShape="square"
      trigger="hover"
      aspectRatio="100%"
      className="pixel-brand-transition"
    />
  );
}

const lightningHost = document.getElementById('rr-lightning-root');
if (lightningHost) {
  createRoot(lightningHost).render(
    <Lightning
      color="#7f91ff"
      bolts={1}
      spread={0.75}
      branches={0.28}
      angle={-8}
      thickness={0.82}
      glow={0.78}
      intensity={0.72}
      speed={0.42}
      flicker={0.18}
      mouseInteraction={false}
      clickStrike={false}
      intro={false}
      fade={0.85}
      opacity={0.28}
      dpr={1}
      className="rr-lightning-canvas"
    />
  );
}

mountHeroPixelCard();
