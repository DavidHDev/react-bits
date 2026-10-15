import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon, Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import './HowItWorks.css';

const COMMAND = 'npx shadcn@latest add @react-bits/Aurora-TS-TW';

const OUTPUT = ['✔ Checking registry.', '✔ Created 1 file:', '  - components/Aurora.tsx'];

const CODE = [
  [
    ["'use client'", 'str'],
    [';', 'punc']
  ],
  [],
  [
    ['import', 'kw'],
    [' { useEffect, useRef } ', 'ink'],
    ['from', 'kw'],
    [" 'react'", 'str'],
    [';', 'punc']
  ],
  [],
  [
    ['const', 'kw'],
    [' Aurora ', 'ink'],
    ['= ({', 'punc']
  ],
  [
    ['  colorStops', 'attr'],
    [' = [', 'punc'],
    ["'#5227FF'", 'str'],
    [', ', 'punc'],
    ["'#7cff67'", 'str'],
    [', ', 'punc'],
    ["'#5227FF'", 'str'],
    ['],', 'punc']
  ],
  [
    ['  amplitude', 'attr'],
    [' = ', 'punc'],
    ['1', 'ink'],
    [',', 'punc']
  ],
  [
    ['  blend', 'attr'],
    [' = ', 'punc'],
    ['0.5', 'ink'],
    [',', 'punc']
  ],
  [
    ['  speed', 'attr'],
    [' = ', 'punc'],
    ['0.6', 'ink'],
    [',', 'punc']
  ],
  [
    ['}: ', 'punc'],
    ['AuroraProps', 'ink'],
    [') => {', 'punc']
  ],
  [
    ['  const', 'kw'],
    [' containerRef ', 'ink'],
    ['= ', 'punc'],
    ['useRef', 'ink'],
    ['<HTMLDivElement>(', 'punc'],
    ['null', 'kw'],
    [');', 'punc']
  ]
];

const EDITED_LINE = 8;
const EASE = [0.21, 0.47, 0.32, 0.98];

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard?.writeText(COMMAND);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button type="button" className="ln-how-copy" onClick={copy} aria-label="Copy install command">
      <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={13} strokeWidth={1.8} />
    </button>
  );
}

const HowItWorks = () => (
  <section className="ln-how-section">
    <div className="ln-how-inner">
      <m.div
        className="ln-how-copy-block"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <h2 className="ln-how-title">One command, and the code is yours.</h2>
        <p className="ln-how-sub">
          The CLI copies the component&apos;s source into your Vite, Next.js, Astro or Remix project. No wrapper
          library, no runtime dependency, nothing to lock you in.
        </p>
        <Link to="/get-started/installation" className="ln-how-btn">
          Installation guide
          <HugeiconsIcon icon={ArrowRight02Icon} size={17} strokeWidth={1.8} />
        </Link>
      </m.div>

      <m.div
        className="ln-how-visual"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.07, ease: EASE }}
      >
        <div className="ln-how-window ln-how-terminal">
          <div className="ln-how-bar">
            Terminal
            <CopyCommand />
          </div>
          <div className="ln-how-well ln-how-term">
            <div className="ln-how-term-line">
              <span className="ln-how-t-punc">$</span> {COMMAND}
            </div>
            {OUTPUT.map(line => (
              <div className="ln-how-term-line ln-how-t-muted" key={line}>
                {line}
              </div>
            ))}
          </div>
        </div>

        <div
          className="ln-how-window ln-how-editor"
          role="img"
          aria-label="Aurora.tsx open in your editor as plain source"
        >
          <div className="ln-how-bar">Aurora.tsx</div>
          <pre className="ln-how-well ln-how-code">
            <code>
              {CODE.map((line, index) => (
                <span className={`ln-how-line${index === EDITED_LINE ? ' is-edited' : ''}`} key={index}>
                  {line.length
                    ? line.map(([text, kind], part) => (
                        <span className={`ln-how-t-${kind}`} key={part}>
                          {text}
                        </span>
                      ))
                    : ' '}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </m.div>
    </div>
  </section>
);

export default HowItWorks;
