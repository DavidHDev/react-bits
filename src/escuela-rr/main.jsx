import { createRoot } from 'react-dom/client';

import PixelCard from '../content/Components/PixelCard/PixelCard';
import PixelTransition from '../content/Animations/PixelTransition/PixelTransition';
import SideRays from '../content/Backgrounds/SideRays/SideRays';
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

const sideRaysHost = document.getElementById('rr-siderays-root');
if (sideRaysHost) {
  createRoot(sideRaysHost).render(
    <SideRays
      rayColor1="#FFC46B"
      rayColor2="#96c8ff"
      origin="top-right"
      speed={1.15}
      intensity={1.1}
      spread={2}
      density={5}
      followMouse={false}
      intro={false}
      opacity={0.3}
      maxDevicePixelRatio={1}
      className="rr-siderays"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        mixBlendMode: 'screen'
      }}
    />
  );
}

mountHeroPixelCard();
