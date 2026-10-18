import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight02Icon,
  ArrowUpRight01Icon,
  Image01Icon,
  Motion01Icon,
  MousePointerClickIcon,
  PuzzleIcon,
  TextFontIcon
} from '@hugeicons/core-free-icons';
import { CornerDownLeft, Search } from 'lucide-react';
import useScrollToTop from '../hooks/useScrollToTop';
import DocsButtonBar from './DocsButtonBar';
import CopyPageButton from './CopyPageButton';
import CommandList from './CommandList';
import { CATEGORIES, TOTAL_COMPONENTS } from '../constants/Categories';
import { TOOLS } from '../constants/Tools';
import { TOOL_ICONS } from '../tools/toolIcons';
import { useOptions } from '../components/context/OptionsContext/useOptions';

const SLIDERS = [
  { label: 'Delay', value: 0.32 },
  { label: 'Duration', value: 0.64 },
  { label: 'Threshold', value: 0.48 }
];

const QUICK_START_STEPS = [
  {
    title: 'Find a component',
    description: 'Browse five categories or search for the effect you have in mind.',
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
    description: 'Tune props in the live preview or start from a preset. The code follows along.',
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
    description: 'Install the version you use with one command, or copy the source.',
    visual: (
      <span className="docs-qs-cli">
        <span className="docs-qs-prompt">$</span> npx shadcn@latest add
        <br />
        @react-bits/SplitText-TS-TW
      </span>
    )
  }
];

const CATEGORY_DETAILS = {
  'Text Animations': {
    icon: TextFontIcon,
    description: 'Split, scramble, blur and morph text, from headlines to scroll-driven reveals.'
  },
  Animations: {
    icon: Motion01Icon,
    description: 'Cursor effects, hover interactions and reveals that wrap around any element.'
  },
  Components: {
    icon: PuzzleIcon,
    description: 'Carousels, galleries, cards, menus and docks with the motion built in.'
  },
  Micro: {
    icon: MousePointerClickIcon,
    description: 'Small interactive pieces like toggles, sliders, buttons and loaders.'
  },
  Backgrounds: {
    icon: Image01Icon,
    description: 'Shader and canvas backgrounds for heroes and full pages, most with presets.'
  }
};

const LIBRARY = CATEGORIES.filter(category => CATEGORY_DETAILS[category.name]).map(category => ({
  name: category.name,
  path: `/c/${category.name.replace(/\s+/g, '-').toLowerCase()}`,
  count: category.subcategories.length,
  ...CATEGORY_DETAILS[category.name]
}));

const FLAVOURS = [
  { language: 'JavaScript', variants: ['JS-CSS', 'JS-TW'] },
  { language: 'TypeScript', variants: ['TS-CSS', 'TS-TW'] }
];

const TOOL_BLURBS = {
  'background-studio':
    'Start from a preset, tune any animated background live, then export the code, a 4K image or a looping video.',
  'center-stage':
    'Put a screenshot or recording on lifelike devices with depth and shadows. Perfect for launch videos or demos.',
  'shape-magic':
    'Design a logo mark or style your own logo with 3D materials. Export SVG, PNG, favicons, video or React.',
  'texture-lab':
    'Run photos, videos or your camera through 160 styles and 75+ effects, then export images, videos or GIFs.',
  'sound-lab':
    'Tune polished interface and video sounds live, then install one with a single command or download WAV, MP3 or OGG.'
};

const PRINCIPLES = [
  {
    title: 'You own the code',
    text: 'Components land in your project as source files, not an import, so you can change anything.'
  },
  {
    title: 'Props first',
    text: 'The details you would want to adjust are exposed as props, so most tweaks need no code edits.'
  },
  {
    title: 'Nothing to depend on',
    text: 'React Bits is not an npm package. Install only what you use; each component lists its own dependencies.'
  },
  {
    title: 'Your stack',
    text: 'JavaScript or TypeScript, plain CSS or Tailwind. All four flavours share the same props.'
  }
];

const Introduction = () => {
  useScrollToTop();
  const { languagePreset, stylePreset } = useOptions();
  const variant = `${languagePreset === 'TS' ? 'TS' : 'JS'}-${stylePreset === 'TW' ? 'TW' : 'CSS'}`;

  return (
    <section className="docs-section docs-intro">
      <div className="docs-page-header">
        <h1 className="docs-title">Introduction</h1>
        <CopyPageButton />
      </div>

      <p className="docs-lead">
        React Bits is a free, open source library of animated React components and backgrounds that you copy into your
        project and make your own.
      </p>

      <p className="docs-paragraph docs-intro-sublead">
        There are {TOTAL_COMPONENTS} of them across five categories. Tune any of them in a live preview, then install
        the exact version your project uses.
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
        <div className="docs-quickstart-actions">
          <Link to="/get-started/index" className="docs-quickstart-primary">
            Browse components
            <HugeiconsIcon icon={ArrowRight02Icon} size={15} strokeWidth={1.8} />
          </Link>
          <Link to="/get-started/installation" className="docs-quickstart-secondary">
            Installation guide
          </Link>
        </div>
      </div>

      <h2 className="docs-section-title">What&apos;s inside</h2>

      <p className="docs-paragraph">Every component belongs to one of five categories. Open one to browse it.</p>

      <div className="docs-intro-cats">
        {LIBRARY.map(category => (
          <Link key={category.name} to={category.path} className="docs-intro-cat">
            <span className="docs-intro-cat-icon" aria-hidden="true">
              <HugeiconsIcon icon={category.icon} size={18} strokeWidth={1.6} />
            </span>
            <div className="docs-intro-cat-text">
              <h3>
                {category.name} <span className="docs-intro-count">{category.count}</span>
              </h3>
              <p>{category.description}</p>
            </div>
            <HugeiconsIcon className="docs-intro-arrow" icon={ArrowUpRight01Icon} size={16} strokeWidth={1.8} />
          </Link>
        ))}
      </div>

      <h2 className="docs-section-title">Four flavours of every component</h2>

      <p className="docs-paragraph">
        Each component comes in JavaScript or TypeScript, styled with plain CSS or Tailwind. Pick yours once in the
        Preferences menu in the header and every code tab and install command on the site follows it.
      </p>

      <div className="docs-intro-flavours" aria-hidden="true">
        <span />
        <span className="docs-intro-flavour-head">CSS</span>
        <span className="docs-intro-flavour-head">Tailwind</span>
        {FLAVOURS.map(row => (
          <div className="docs-intro-flavour-row" key={row.language}>
            <span className="docs-intro-flavour-lang">{row.language}</span>
            {row.variants.map(name => (
              <code key={name} className={`docs-intro-flavour${name === variant ? ' is-active' : ''}`}>
                {name}
              </code>
            ))}
          </div>
        ))}
      </div>

      <p className="docs-paragraph">
        The ending of the install name picks the flavour: <code>JS-CSS</code>, <code>JS-TW</code>, <code>TS-CSS</code>{' '}
        or <code>TS-TW</code>. With the shadcn CLI it looks like this:
      </p>

      <CommandList
        items={[{ key: 'shadcn', label: 'shadcn', command: `npx shadcn@latest add @react-bits/SplitText-${variant}` }]}
      />

      <p className="docs-paragraph docs-intro-after">
        jsrepo works too, or you can copy the files from any component&apos;s Code tab. The{' '}
        <Link className="docs-inline-link" to="/get-started/installation">
          Installation guide
        </Link>{' '}
        walks through each option.
      </p>

      <h2 className="docs-section-title">Built for AI workflows</h2>

      <p className="docs-paragraph">
        Every component is plain, readable source, which makes it easy for coding agents to work with. A few extras
        help:
      </p>

      <ul className="docs-list docs-intro-list">
        <li className="docs-list-item">
          <strong>Copy for AI</strong> on every component copies a ready prompt, your configured code or the install
          command, or opens it in ChatGPT, Claude or v0.
        </li>
        <li className="docs-list-item">
          <strong>Copy as Markdown</strong> on every docs page, this one included, for pasting into a chat.
        </li>
        <li className="docs-list-item">
          <strong>MCP</strong> through the shadcn MCP server lets your agent find and install components for you.{' '}
          <Link className="docs-inline-link" to="/get-started/mcp">
            Set it up
          </Link>
        </li>
        <li className="docs-list-item">
          <strong>llms.txt</strong> gives language models a plain-text map of the whole library.{' '}
          <a className="docs-inline-link" href="/llms.txt" target="_blank" rel="noopener noreferrer">
            Open it
          </a>
        </li>
      </ul>

      <h2 className="docs-section-title">Free tools</h2>

      <p className="docs-paragraph">Five browser tools, free to use.</p>

      <div className="docs-intro-cats">
        {TOOLS.map(tool => (
          <Link key={tool.id} to={tool.path} className="docs-intro-cat">
            <span className="docs-intro-cat-icon" aria-hidden="true">
              <HugeiconsIcon icon={TOOL_ICONS[tool.id]} size={18} strokeWidth={1.6} />
            </span>
            <div className="docs-intro-cat-text">
              <h3>{tool.label}</h3>
              <p>{TOOL_BLURBS[tool.id]}</p>
            </div>
            <HugeiconsIcon className="docs-intro-arrow" icon={ArrowUpRight01Icon} size={16} strokeWidth={1.8} />
          </Link>
        ))}
      </div>

      <h2 className="docs-section-title">Principles</h2>

      <p className="docs-paragraph">
        React Bits exists to make expressive interfaces easy to build, and free. Four ideas shape every component:
      </p>

      <div className="docs-intro-principles">
        {PRINCIPLES.map(principle => (
          <div className="docs-intro-principle" key={principle.title}>
            <h3>{principle.title}</h3>
            <p>{principle.text}</p>
          </div>
        ))}
      </div>

      <h2 className="docs-section-title">Use motion with care</h2>

      <ul className="docs-list docs-intro-list">
        <li className="docs-list-item">
          <strong>Two or three per page.</strong> Effects compete for attention and for the GPU, so save them for the
          moments that matter.
        </li>
        <li className="docs-list-item">
          <strong>Plan for mobile.</strong> Swap heavy effects for lighter versions or static images on small screens.
        </li>
        <li className="docs-list-item">
          <strong>Test on real devices.</strong> Your machine is likely faster than your users&apos;, so check low-end
          phones and laptops before you ship.
        </li>
      </ul>

      <h2 className="docs-section-title">License</h2>

      <p className="docs-paragraph">
        React Bits is free for personal and commercial work under the MIT + Commons Clause license. Use the components
        in any app, website or product, client work included. What you can&apos;t do is sell, sublicense or redistribute
        the components themselves, on their own, in a bundle or as a port.{' '}
        <a
          className="docs-inline-link"
          href="https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the license
        </a>
      </p>

      <h2 className="docs-section-title">Keep exploring</h2>

      <ul className="docs-list docs-intro-list">
        <li className="docs-list-item">
          <strong>What&apos;s new.</strong> The{' '}
          <Link className="docs-inline-link" to="/get-started/changelog">
            changelog
          </Link>{' '}
          lists every new component and update by month, with an RSS feed.
        </li>
        <li className="docs-list-item">
          <strong>Vue and Svelte.</strong> Official ports live at{' '}
          <a className="docs-inline-link" href="https://vue-bits.dev/" target="_blank" rel="noopener noreferrer">
            Vue Bits
          </a>{' '}
          and{' '}
          <a className="docs-inline-link" href="https://sveltebits.xyz/" target="_blank" rel="noopener noreferrer">
            Svelte Bits
          </a>
          .
        </li>
        <li className="docs-list-item">
          <strong>The whole product.</strong>{' '}
          <Link className="docs-inline-link" to="/pro">
            React Bits Pro
          </Link>{' '}
          adds page sections, app UI blocks, full templates and agent skills.
        </li>
      </ul>

      <DocsButtonBar next={{ label: 'Installation', route: '/get-started/installation' }} />
    </section>
  );
};

export default Introduction;
