import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Menu01Icon } from '@hugeicons/core-free-icons';

import PreviewStageContext from './PreviewStageContext';
import { DEMO_NARROW_WIDTH, demoModesFor, demoView } from './demoModes';
import logo from '../../../assets/logos/react-bits-logo.svg';
import mark from '../../../assets/logos/react-bits-logo-small.svg';
import './BackgroundContent.css';

const DESCRIPTION = 'React Bits brings motion and character to your interface, one copy-paste component at a time.';

const LINKS = ['Docs', 'Showcase', 'Pricing'];

const FADE_MS = 200;
const MORPH_MS = 440;

let rememberedMode = 'none';

const Copy = ({ headline }) => (
  <div className="bgc-copy">
    <p className="bgc-title">{headline}</p>
    <p className="bgc-text">{DESCRIPTION}</p>
    <div className="bgc-cta">
      <span className="bgc-button bgc-button--primary">
        Start building
        <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={1.8} />
      </span>
      <span className="bgc-button bgc-button--ghost">Browse components</span>
    </div>
  </div>
);

const Landing = ({ headline, active }) => (
  <div className="bgc-window" aria-hidden="true" data-active={active ? '' : undefined}>
    <div className="bgc-window-bar">
      <span className="bgc-window-dots">
        <i />
        <i />
        <i />
      </span>
      <span className="bgc-window-url">reactbits.dev</span>
    </div>
    <div className="bgc-site">
      <div className="bgc-nav">
        <img className="bgc-logo" src={logo} alt="" draggable={false} />
        <div className="bgc-links">
          {LINKS.map(link => (
            <span key={link}>{link}</span>
          ))}
        </div>
        <span className="bgc-button bgc-button--primary bgc-button--small">Get started</span>
      </div>
      <Copy headline={headline} />
    </div>
  </div>
);

const Phone = ({ headline, active }) => (
  <div className="bgc-phone" aria-hidden="true" data-active={active ? '' : undefined}>
    <div className="bgc-phone-screen">
      <div className="bgc-phone-status">
        <span>9:41</span>
        <span className="bgc-phone-island" />
        <span className="bgc-phone-battery">
          <i />
        </span>
      </div>
      <div className="bgc-nav">
        <img className="bgc-logo" src={logo} alt="" draggable={false} />
        <span className="bgc-menu">
          <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={1.6} />
        </span>
      </div>
      <Copy headline={headline} />
      <span className="bgc-phone-home" />
    </div>
  </div>
);

const Card = ({ headline, active }) => (
  <div className="bgc-card" aria-hidden="true" data-active={active ? '' : undefined}>
    <div className="bgc-card-fade" />
    <span className="bgc-card-badge">
      <img src={mark} alt="" draggable={false} />
    </span>
    <div className="bgc-card-body">
      <p className="bgc-card-title">{headline}</p>
      <p className="bgc-card-text">{DESCRIPTION}</p>
      <div className="bgc-card-actions">
        <span className="bgc-button bgc-button--primary bgc-button--small">Get started</span>
        <span className="bgc-card-link">
          Learn more
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  </div>
);

const ModeSwitch = ({ modes, mode, onChange }) => {
  const index = Math.max(
    0,
    modes.findIndex(item => item.value === mode)
  );

  return (
    <div className="bgc-switch" role="group" aria-label="Demo content" style={{ '--bgc-index': index }}>
      <span className="bgc-switch-pill" aria-hidden="true" />
      {modes.map(item => (
        <Tooltip.Root key={item.value} openDelay={300} closeDelay={80} positioning={{ placement: 'bottom', gutter: 8 }}>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              className="bgc-switch-button"
              aria-label={item.label}
              aria-pressed={mode === item.value}
              onClick={() => onChange(item.value)}
            >
              <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content className="docs-tooltip">{item.label}</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      ))}
    </div>
  );
};

const BackgroundContent = ({ headline = 'Build interfaces that feel alive' }) => {
  const stage = useContext(PreviewStageContext);
  const demo = stage?.demo ?? null;
  const rootRef = useRef(null);
  const [localMode, setLocalMode] = useState(rememberedMode);
  const target = demo ? demo.mode : localMode;
  const [narrow, setNarrow] = useState(false);
  const view = demoView(target, narrow);
  const setDemoNarrow = demo?.setNarrow;
  const setDemoPresent = demo?.setPresent;
  const [shape, setShape] = useState(view);
  const [clip, setClip] = useState(view);
  const [shown, setShown] = useState(view);
  const [hidden, setHidden] = useState(false);
  const current = useRef(view);
  const animate = useRef(false);
  const timers = useRef([]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const measure = () => setNarrow(root.clientWidth < DEMO_NARROW_WIDTH);
    measure();
    const frame = requestAnimationFrame(() => {
      animate.current = true;
    });
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    setDemoNarrow?.(narrow);
  }, [setDemoNarrow, narrow]);

  useEffect(() => {
    if (!setDemoPresent) return undefined;
    setDemoPresent(true);
    return () => setDemoPresent(false);
  }, [setDemoPresent]);

  useLayoutEffect(() => {
    if (view === current.current) return;
    current.current = view;
    timers.current.forEach(clearTimeout);
    setShape(view);
    if (!animate.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setClip(view);
      setShown(view);
      setHidden(false);
      return;
    }
    setHidden(true);
    setShown(null);
    timers.current = [
      setTimeout(() => setClip(view), FADE_MS),
      setTimeout(() => {
        setShown(view);
        setHidden(false);
      }, MORPH_MS)
    ];
  }, [view]);

  const select = next => {
    if (demo) {
      demo.setMode(next);
      return;
    }
    rememberedMode = next;
    setLocalMode(next);
  };

  const controls = <ModeSwitch modes={demoModesFor(narrow)} mode={view} onChange={select} />;
  let switcher = controls;
  if (stage?.hasControls) switcher = stage.controls ? createPortal(controls, stage.controls) : null;

  return (
    <div ref={rootRef} className="bgc" data-mode={shape} data-clip={clip} data-hidden={hidden ? '' : undefined}>
      <span className="bgc-veil" />
      <Landing headline={headline} active={shown === 'landing'} />
      <Phone headline={headline} active={shown === 'mobile'} />
      <Card headline={headline} active={shown === 'card'} />
      <span className="bgc-shell" />
      {switcher}
    </div>
  );
};

export default BackgroundContent;
