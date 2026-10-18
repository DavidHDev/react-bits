import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuPlus } from 'react-icons/lu';

import { TOTAL_COMPONENTS } from '../../../constants/Categories';
import { PRO_COUNTS, PRO_TIERS } from '../../../constants/Pro';
import { proLinkProps } from '../../../utils/pro';
import './FAQ.css';

const PLACEMENT = 'landing-faq';
const ANNUAL_FROM = Math.min(...PRO_TIERS.map(tier => tier.annual));
const LIFETIME_FROM = Math.min(...PRO_TIERS.map(tier => tier.lifetime));

const QUESTIONS = [
  {
    q: 'What is included in the free library?',
    a: (
      <>
        All {TOTAL_COMPONENTS} components and backgrounds on this site, across five categories: Text Animations,
        Animations, Components, Micro and Backgrounds. The three creative tools are free too. You can use all of it in
        personal and commercial projects, and it stays free.
      </>
    )
  },
  {
    q: 'What does React Bits Pro add?',
    a: (
      <>
        {PRO_COUNTS.components} more animated components, {PRO_COUNTS.blocks} page sections, {PRO_COUNTS.appUi} app UI
        blocks, {PRO_COUNTS.templates} complete Next.js templates and {PRO_COUNTS.agentKit} agent skills for AI coding
        tools. Like the free library, everything installs as source you own.
      </>
    )
  },
  {
    q: 'What are the four flavours?',
    a: (
      <>
        Every component comes in JavaScript or TypeScript, styled with plain CSS or Tailwind. Pick yours in the
        Preferences menu in the header and every code tab and install command follows it. With the CLI, the ending of
        the name picks the flavour: JS-CSS, JS-TW, TS-CSS or TS-TW.
      </>
    )
  },
  {
    q: 'Is React Bits only for React?',
    a: (
      <>
        The components on this site are built for React, so they work in Next.js, Vite, Astro or Remix. Working in
        another framework? There are official ports for Vue and Svelte:{' '}
        <a className="ln-faq-link" href="https://vue-bits.dev/" target="_blank" rel="noopener noreferrer">
          Vue Bits
        </a>{' '}
        and{' '}
        <a className="ln-faq-link" href="https://sveltebits.xyz/" target="_blank" rel="noopener noreferrer">
          Svelte Bits
        </a>
        .
      </>
    )
  },
  {
    q: 'What are the tools for?',
    a: (
      <>
        Background Studio, Center Stage, Shape Magic, Texture Lab and Sound Lab are free apps that run in your browser.
        Tune an animated background, turn a screenshot into a product shot, design a logo mark with 3D materials,
        restyle photos and videos or shape interface sounds, then export code, images, video or audio.{' '}
        <Link className="ln-faq-link" to="/tools">
          Open the tools
        </Link>
      </>
    )
  },
  {
    q: 'Where do I get Pro, and what does it cost?',
    a: (
      <>
        On{' '}
        <a className="ln-faq-link" {...proLinkProps('/', PLACEMENT, { sameTab: true })}>
          pro.reactbits.dev
        </a>
        . Plans start at ${ANNUAL_FROM} a year, or ${LIFETIME_FROM} once for lifetime access with every future update.
        You can browse the whole catalogue before you buy, and one template and one agent skill are free.
      </>
    )
  },
  {
    q: 'Can I use React Bits in commercial projects?',
    a: (
      <>
        Yes. The free library is licensed MIT + Commons Clause: use the components in any app, website or product,
        client work included, but don&apos;t sell, sublicense or redistribute the components themselves. A Pro license
        covers one developer for unlimited commercial projects.
      </>
    )
  },
  {
    q: 'Do I need to install a package?',
    a: (
      <>
        No. The shadcn or jsrepo CLI copies the source into your project, or you can paste it in by hand. There is no
        react-bits dependency to keep updated, and it works in any React setup, including Vite, Next.js, Astro and
        Remix.
      </>
    )
  },
  {
    q: 'Does it work with AI coding tools?',
    a: (
      <>
        Yes. Every component has a Copy for AI menu, docs pages export to Markdown, llms.txt maps the whole library and
        the shadcn MCP server lets your agent install components for you. Pro adds agent skills that teach Claude Code,
        Cursor and Copilot to build pages that look designed.
      </>
    )
  }
];

const FAQ = () => {
  const [open, setOpen] = useState(null);

  return (
    <section className="ln-faq-section">
      <div className="ln-faq-inner prox-faq-layout">
        <div className="prox-faq-aside">
          <h2 className="ln-faq-title">Questions, answered</h2>
          <p className="ln-faq-sub">What&apos;s free, what&apos;s in Pro and how the pieces fit together.</p>
        </div>

        <div className="prox-faq">
          {QUESTIONS.map((item, index) => {
            const isOpen = open === index;
            return (
              <div className={`prox-faq-item${isOpen ? ' open' : ''}`} key={item.q}>
                <button
                  type="button"
                  className="prox-faq-q"
                  id={`ln-faq-q-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={`ln-faq-panel-${index}`}
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  <span>{item.q}</span>
                  <LuPlus className="prox-faq-icon" size={17} />
                </button>

                <div
                  className="prox-faq-panel"
                  id={`ln-faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`ln-faq-q-${index}`}
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                >
                  <div className="prox-faq-panel-inner">
                    <p className="prox-faq-a">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
