import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { useColorMode } from '../../setup/color-mode';
import useNearOnce from '../../../hooks/useNearOnce';
import { TOOLS } from '../../../constants/Tools';
import logo from '../../../assets/logos/react-bits-logo-small.svg';
import './Tools.css';

const Topography = lazy(() => import('../../../content/Backgrounds/Topography/Topography'));
const MetallicPaint = lazy(() => import('../../../content/Animations/MetallicPaint/MetallicPaint'));
const SoundPreview = lazy(() => import('./SoundPreview'));

const BLURBS = {
  'background-studio':
    'Pick an animated background, start from a preset, tune it live, then export the code, a 4K image or a looping video.',
  'center-stage': 'Turn screenshots and recordings into polished product shots. Perfect for launch videos or demos.',
  'shape-magic':
    'Design a logo mark or style your own logo with 3D materials. Export SVG, PNG, favicons, video or React.',
  'texture-lab':
    'Stack animated effects on a photo, video or your camera, then export an image, a video, a GIF or a shareable style.',
  'sound-lab':
    'Interface and video sounds, tune them live, then install one with a single command or download WAV, MP3 or OGG.'
};

const POSTERS = { 'background-studio': 'topography', 'shape-magic': 'metallicpaint' };

const Preview = ({ id, light }) => {
  const lite = document.documentElement.hasAttribute('data-lite');
  if (id === 'center-stage') {
    return (
      <img
        className="ln-tools-shot ln-tools-shot--fit"
        src={`/assets/images/center-stage-shot${light ? '-light' : ''}.webp`}
        alt=""
        loading="lazy"
        decoding="async"
      />
    );
  }
  if (id === 'sound-lab') {
    return lite ? (
      <img
        className="ln-tools-shot"
        src={`/assets/images/sound-lab-orb${light ? '-light' : ''}.webp`}
        alt=""
        loading="lazy"
        decoding="async"
      />
    ) : (
      <SoundPreview />
    );
  }
  if (POSTERS[id] && lite) {
    return (
      <img
        className="ln-tools-poster"
        src={`/assets/video/${POSTERS[id]}${light ? '-light' : ''}.webp`}
        alt=""
        loading="lazy"
        decoding="async"
      />
    );
  }
  if (id === 'background-studio') {
    return (
      <Topography
        color={light ? '#3f3f46' : '#d4d4d8'}
        lightMode={light}
        tilt={30}
        lineCount={22}
        majorLines={false}
        glow={0.15}
        depthOfField={0}
        speed={0.18}
        intro={false}
      />
    );
  }
  if (id === 'shape-magic') {
    return (
      <MetallicPaint
        imageSrc={logo}
        scale={0.74}
        dispersion={0.06}
        lightMode={light}
        backgroundColor="transparent"
        intro={false}
      />
    );
  }
  return <img src="/assets/images/soft-type-daisy.webp" alt="" loading="lazy" decoding="async" />;
};

function ToolCard({ tool, light }) {
  const [ref, near] = useNearOnce('400px 0px');

  return (
    <Link to={tool.path} className="browse-card ln-tools-card" ref={ref}>
      <div className="browse-card-well ln-tools-well" aria-hidden="true">
        <Suspense fallback={null}>{near && <Preview id={tool.id} light={light} />}</Suspense>
      </div>
      <div className="ln-tools-caption">
        <div className="ln-tools-name">
          <h3 className="browse-card-title">{tool.label}</h3>
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} strokeWidth={1.8} />
        </div>
        <p className="ln-tools-desc">{BLURBS[tool.id]}</p>
      </div>
    </Link>
  );
}

const Tools = () => {
  const { resolvedTheme } = useColorMode();
  const light = resolvedTheme === 'light';

  return (
    <section className="ln-tools-section">
      <div className="ln-tools-inner">
        <header className="ln-tools-head">
          <h2 className="ln-tools-title">Five free tools, in your browser.</h2>
        </header>
        <div className="ln-tools-grid">
          {TOOLS.map(tool => (
            <ToolCard key={tool.id} tool={tool} light={light} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Tools;
