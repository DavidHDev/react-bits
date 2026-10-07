import useScrollToTop from '../hooks/useScrollToTop';
import DocsButtonBar from './DocsButtonBar';
import CopyPageButton from './CopyPageButton';
import { Link } from 'react-router-dom';
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react';
import HeroBand from '../components/landingnew/Hero/HeroBand';
import { useColorModeValue } from '../components/setup/color-mode';

const SLIDERS = [
  { label: 'Delay', value: 0.32 },
  { label: 'Duration', value: 0.64 },
  { label: 'Threshold', value: 0.48 }
];

const QUICK_START_STEPS = [
  {
    title: 'Choose a component',
    description: 'Browse by category or search for the interaction you need.',
    visual: (
      <>
        <span className="docs-qs-field">
          <Search size={12} />
          split te
          <span className="docs-qs-caret" />
        </span>
        <span className="docs-qs-result is-active">
          Split Text
          <CornerDownLeft size={11} />
        </span>
        <span className="docs-qs-result">Split Flap Text</span>
      </>
    )
  },
  {
    title: 'Make it yours',
    description: 'Tune the preview and send settings to your usage code.',
    visual: SLIDERS.map(({ label, value }) => (
      <span className="docs-qs-slider" key={label}>
        {label}
        <span className="docs-qs-track">
          <span className="docs-qs-fill" style={{ width: `${value * 100}%` }} />
        </span>
      </span>
    ))
  },
  {
    title: 'Add it to your project',
    description: 'Copy the source or install your chosen variant with the CLI.',
    visual: (
      <span className="docs-qs-cli">
        <span className="docs-qs-prompt">$</span> npx shadcn@latest add
        <br />
        @react-bits/SplitText-TS-TW
      </span>
    )
  }
];

const Introduction = () => {
  useScrollToTop();
  const light = useColorModeValue(true, false);

  return (
    <section className="docs-section">
      <div className="docs-page-header">
        <h1 className="docs-title">Introduction</h1>
        <CopyPageButton />
      </div>

      <p className="docs-lead">
        React Bits is an open-source collection of expressive UI components for adding motion and personality without
        adopting an entire design system.
      </p>

      <p className="docs-lead">
        Pick a component, tune it in the preview, then copy or install the exact variant for your stack. React Bits
        makes it easy to be creative, and works great with AI.
      </p>

      <div className="docs-quickstart">
        <div className="docs-quickstart-steps">
          {QUICK_START_STEPS.map(({ title, description, visual }, index) => (
            <div className="docs-quickstart-step" key={title}>
              <div className="docs-quickstart-well" aria-hidden="true">
                {visual}
              </div>
              <div className="docs-quickstart-text">
                <span className="docs-quickstart-index">Step {index + 1}</span>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="docs-quickstart-cta">
          <div className="docs-quickstart-cta-card">
            <div className="docs-quickstart-band" aria-hidden="true">
              <HeroBand
                className="docs-quickstart-band-canvas"
                color="#A855F7"
                speed={0.2}
                frequency={1}
                noise={0.15}
                bandWidth={0.14}
                rotation={90}
                fadeTop={0.75}
                iterations={1}
                intensity={1.25}
                scale={1}
                warpStrength={1}
                yOffset={0.3}
                mouseInfluence={0}
                lightMode={light}
              />
            </div>
            <div className="docs-quickstart-actions">
              <Link to="/get-started/index" className="docs-quickstart-primary">
                Browse components
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link to="/get-started/installation" className="docs-quickstart-secondary">
                Installation guide
              </Link>
            </div>
          </div>
        </div>
      </div>

      <h2 className="docs-section-title">Mission</h2>

      <p className="docs-paragraph dim">
        The goal of React Bits is simple - provide flexible, visually stunning and most importantly, free components
        that take web projects to the next level.
      </p>
      <p className="docs-paragraph">To make that happen, the project is committed to the following principles:</p>

      <ul className="docs-list">
        <li className="docs-list-item">
          <span className="docs-highlight">Free For All:</span> You own the code, and it&apos;s free to use in your
          projects
        </li>
        <li className="docs-list-item">
          <span className="docs-highlight">Prop-First Approach:</span> Easy customization through thoughtfully exposed
          props
        </li>
        <li className="docs-list-item">
          <span className="docs-highlight">Fully Modular:</span> Install strictly what you need, React Bits is not a
          dependency
        </li>
        <li className="docs-list-item">
          <span className="docs-highlight">Free Choice:</span> JS or TS, plain CSS or Tailwind, the code is all here
        </li>
      </ul>

      <h3 className="docs-subtitle">Free For All</h3>

      <p className="docs-paragraph">
        Every component you choose to bring into your project is yours to modify or extend, because you get full
        visibility of the code, not just an import.
      </p>

      <h3 className="docs-subtitle">Prop-First Approach</h3>

      <p className="docs-paragraph">
        Every component is designed to be flexible and customizable, with props that allow you to adjust the look and
        feel without having to always dive into the code.
      </p>

      <h3 className="docs-subtitle">Fully Modular</h3>

      <p className="docs-paragraph">
        React Bits is not your classic NPM library, you install only the components you need by either copying the code
        or using the CLI, without pulling in a whole library.
      </p>

      <h3 className="docs-subtitle">Free Choice</h3>

      <p className="docs-paragraph">
        I don&apos;t want to dictate how you build your projects. Whether you prefer JavaScript or TypeScript, plain CSS
        or Tailwind, it&apos;s all here for you to use as you see fit.
      </p>

      <p className="docs-paragraph dim">
        P.S. The header has a neat dropdown to help you choose your preferred technologies.
      </p>

      <h2 className="docs-section-title">Performance</h2>

      <p className="docs-paragraph dim">
        While we do everything possible to optimize components and offer the best experience, here are some tips to keep
        in mind when using React Bits:
      </p>

      <ul className="docs-list">
        <li className="docs-list-item">
          <span className="docs-highlight">Less Is More:</span> Using more than 2-3 components on a page is not advised,
          it can overload your page with animations, potentially impacting performance or UX
        </li>
        <li className="docs-list-item">
          <span className="docs-highlight">Mobile Optimization:</span> Consider disabling certain effects on mobile and
          replacing them with static placeholders instead
        </li>
        <li className="docs-list-item">
          <span className="docs-highlight">Test Thoroughly:</span> Your device may be high-end, but be considerate of
          your users - always test on multiple devices before going live
        </li>
      </ul>

      <DocsButtonBar next={{ label: 'Installation', route: '/get-started/installation' }} />
    </section>
  );
};

export default Introduction;
