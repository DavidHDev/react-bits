import { m, AnimatePresence } from 'motion/react';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { TOOL_ICONS } from '../../../tools/toolIcons';
import { TOOLS } from '../../../constants/Tools';
import {
  FiType,
  FiCircle,
  FiLayers,
  FiImage,
  FiCode,
  FiGrid,
  FiZap,
  FiBox,
  FiStar,
  FiHeart,
  FiEye,
  FiCompass
} from 'react-icons/fi';
import { useStars } from '../../../hooks/useStars';
import useInView from '../../../hooks/useInView';
import { COMPONENT_COUNT } from '@/constants/Categories';
import rbLogo from '../../../assets/logos/react-bits-logo-small.svg';
import './Features.css';

/* ─── 1. Component Name Marquee ─── */

const toSlug = s => s.toLowerCase().replace(/\s+/g, '-');

const ROW_A = [
  { name: 'Dot Field', cat: 'backgrounds' },
  { name: 'Line Waves', cat: 'backgrounds' },
  { name: 'Blob Cursor', cat: 'animations' },
  { name: 'Soft Aurora', cat: 'backgrounds' },
  { name: 'Magnet Lines', cat: 'backgrounds' },
  { name: 'Antigravity', cat: 'animations' },
  { name: 'Ballpit', cat: 'backgrounds' },
  { name: 'Pixel Trail', cat: 'animations' },
  { name: 'Magic Rings', cat: 'backgrounds' }
];

const ROW_B = [
  { name: 'Radar', cat: 'backgrounds' },
  { name: 'Shape Grid', cat: 'backgrounds' },
  { name: 'Ribbons', cat: 'animations' },
  { name: 'Grainient', cat: 'backgrounds' },
  { name: 'Orbit Images', cat: 'animations' },
  { name: 'Metallic Paint', cat: 'animations' },
  { name: 'Balatro', cat: 'backgrounds' },
  { name: 'Aurora', cat: 'backgrounds' },
  { name: 'Splash Cursor', cat: 'animations' },
  { name: 'Beams', cat: 'backgrounds' }
];

const ComponentMarquee = () => (
  <div className="ln-feat-marquee">
    <div className="ln-feat-marquee-track">
      <div className="ln-feat-marquee-scroll">
        {[...ROW_A, ...ROW_A].map((c, i) => (
          <Link key={i} to={`/${c.cat}/${toSlug(c.name)}`} className="ln-feat-pill">
            {c.name}
          </Link>
        ))}
      </div>
    </div>
    <div className="ln-feat-marquee-track">
      <div className="ln-feat-marquee-scroll ln-feat-marquee-scroll--rev">
        {[...ROW_B, ...ROW_B].map((c, i) => (
          <Link key={i} to={`/${c.cat}/${toSlug(c.name)}`} className="ln-feat-pill">
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  </div>
);

/* ─── 2. Free Tools List ─── */

/* ─── 2. Free Tools (Floating Icon Boxes) ─── */

const DOCK_BOOST = 0.42;
const DOCK_SPREAD = 64;
const DOCK_REACH = 90;
const WAVE_PERIOD = 3.6;
const WAVE_STEP = 0.24;
const WAVE_LIFT = 9;

const waveAt = (time, index) => {
  const phase = ((((time - index * WAVE_STEP) % WAVE_PERIOD) + WAVE_PERIOD) % WAVE_PERIOD) / WAVE_PERIOD;
  return phase < 0.42 ? Math.sin((Math.PI * phase) / 0.42) ** 2 : 0;
};

const ToolsFloat = () => {
  const areaRef = useRef(null);
  const namesRef = useRef(null);
  const [active, setActive] = useState(null);
  const [shown, setShown] = useState(0);
  const [widths, setWidths] = useState([]);

  useEffect(() => {
    const names = namesRef.current;
    if (!names) return undefined;
    const measure = () => setWidths([...names.children].map(child => Math.ceil(child.getBoundingClientRect().width)));
    measure();
    document.fonts?.ready.then(measure);
    return undefined;
  }, []);

  const focus = index => {
    setActive(index);
    setShown(index);
  };

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return undefined;
    const items = [...area.querySelectorAll('.ln-feat-dock-item')];
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const state = {
      pointer: null,
      centers: [],
      scales: items.map(() => 1),
      idle: still ? 0 : 1,
      since: 0,
      visible: false,
      frame: 0,
      last: 0
    };

    const measure = () => {
      const box = area.getBoundingClientRect();
      state.centers = items.map(item => {
        const rect = item.getBoundingClientRect();
        return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
      });
    };

    const tick = now => {
      state.frame = 0;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 0.016;
      state.last = now;
      const engaged = state.pointer !== null;
      const restful = !engaged && !still && now - state.since > 900;
      const targetIdle = restful ? 1 : 0;
      state.idle += (targetIdle - state.idle) * (1 - Math.exp(-dt / (targetIdle ? 0.5 : 0.09)));
      let busy = Math.abs(targetIdle - state.idle) > 0.002 || (!still && (state.idle > 0.002 || !engaged));
      const time = now / 1000;
      items.forEach((item, index) => {
        let target = 1;
        if (engaged && state.centers[index]) {
          const dx = state.pointer.x - state.centers[index].x;
          const dy = state.pointer.y - state.centers[index].y;
          target = 1 + DOCK_BOOST * Math.exp(-((dx / DOCK_SPREAD) ** 2)) * Math.exp(-((dy / DOCK_REACH) ** 2));
        }
        const next = still ? target : state.scales[index] + (target - state.scales[index]) * (1 - Math.exp(-dt / 0.07));
        if (Math.abs(next - target) > 0.001) busy = true;
        state.scales[index] = next;
        item.style.setProperty('--s', next.toFixed(4));
        item.style.setProperty('--lift', `${(-WAVE_LIFT * waveAt(time, index) * state.idle).toFixed(2)}px`);
      });
      if (busy && state.visible && !document.hidden) state.frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!state.frame && state.visible && !document.hidden) {
        state.last = 0;
        state.frame = requestAnimationFrame(tick);
      }
    };

    const move = event => {
      if (event.pointerType !== 'mouse') return;
      const box = area.getBoundingClientRect();
      if (state.pointer === null) measure();
      state.pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
      wake();
    };

    const leave = () => {
      state.pointer = null;
      state.since = performance.now();
      wake();
    };

    const watcher = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      wake();
    });
    watcher.observe(area);
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', wake);
    return () => {
      cancelAnimationFrame(state.frame);
      watcher.disconnect();
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', wake);
    };
  }, []);

  return (
    <div className="ln-feat-tools" ref={areaRef} onPointerLeave={() => setActive(null)}>
      <div
        className="ln-feat-dock-title"
        data-on={active === null ? undefined : ''}
        style={{ '--n': shown, width: widths[shown] ? `${widths[shown]}px` : undefined }}
        aria-hidden="true"
      >
        <span className="ln-feat-dock-names" ref={namesRef}>
          {TOOLS.map(tool => (
            <span key={tool.id} className="ln-feat-dock-name">
              {tool.label}
            </span>
          ))}
        </span>
      </div>
      <div className="ln-feat-dock">
        {TOOLS.map((tool, index) => (
          <Link
            key={tool.id}
            to={tool.path}
            className="ln-feat-dock-item"
            aria-label={tool.label}
            onPointerEnter={() => focus(index)}
            onFocus={() => focus(index)}
            onBlur={() => setActive(null)}
          >
            <HugeiconsIcon icon={TOOL_ICONS[tool.id]} size={20} strokeWidth={1.6} />
          </Link>
        ))}
      </div>
    </div>
  );
};

/* ─── 3. Category Orbits ─── */

const CategorySelector = () => (
  <div className="ln-feat-orbit">
    <div className="ln-feat-orbit-center">
      <img src={rbLogo} alt="" width={18} height={18} />
    </div>
    <div className="ln-feat-orbit-ring ln-feat-orbit-ring--1">
      <div className="ln-feat-orbit-node ln-feat-orbit-node--top">
        <FiType size={16} />
      </div>
      <div className="ln-feat-orbit-node ln-feat-orbit-node--right">
        <FiCode size={16} />
      </div>
      <div className="ln-feat-orbit-node ln-feat-orbit-node--bottom">
        <FiLayers size={16} />
      </div>
      <div className="ln-feat-orbit-node ln-feat-orbit-node--left">
        <FiGrid size={16} />
      </div>
    </div>
    <div className="ln-feat-orbit-ring ln-feat-orbit-ring--2">
      <div className="ln-feat-orbit-node ln-feat-orbit-node--top">
        <FiZap size={16} />
      </div>
      <div className="ln-feat-orbit-node ln-feat-orbit-node--tr">
        <FiStar size={16} />
      </div>
      <div className="ln-feat-orbit-node ln-feat-orbit-node--right">
        <FiCircle size={16} />
      </div>
      <div className="ln-feat-orbit-node ln-feat-orbit-node--br">
        <FiEye size={16} />
      </div>
      <div className="ln-feat-orbit-node ln-feat-orbit-node--bottom">
        <FiBox size={16} />
      </div>
      <div className="ln-feat-orbit-node ln-feat-orbit-node--bl">
        <FiHeart size={16} />
      </div>
      <div className="ln-feat-orbit-node ln-feat-orbit-node--left">
        <FiImage size={16} />
      </div>
      <div className="ln-feat-orbit-node ln-feat-orbit-node--tl">
        <FiCompass size={16} />
      </div>
    </div>
  </div>
);

/* ─── 4. Code Variants ─── */

const VARIANTS = [
  { label: 'JS + CSS', accent: 'rgba(255,255,255,0.5)' },
  { label: 'TS + CSS', accent: 'rgba(255,255,255,0.5)' },
  { label: 'JS + Tailwind', accent: 'rgba(255,255,255,0.5)' },
  { label: 'TS + Tailwind', accent: 'rgba(255,255,255,0.5)' }
];

const VariantTabs = () => {
  const [active, setActive] = useState(0);
  const [ref, visible] = useInView();

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setActive(p => (p + 1) % 4), 2200);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <div className="ln-feat-vrows" ref={ref}>
      {VARIANTS.map((v, i) => (
        <m.div
          key={i}
          className="ln-feat-vrow"
          animate={{
            opacity: i === active ? 1 : 0.3
          }}
          transition={{ duration: 0.4 }}
        >
          <div className="ln-feat-vrow-dot" style={{ background: v.accent }} />
          <span className="ln-feat-vrow-label">{v.label}</span>
          <div className="ln-feat-vrow-bars">
            <div className="ln-feat-vrow-bar" style={{ width: `${35 + i * 8}%` }} />
            <div className="ln-feat-vrow-bar" style={{ width: `${20 + ((i + 2) % 4) * 7}%` }} />
            <div className="ln-feat-vrow-bar" style={{ width: `${45 + ((i + 1) % 3) * 10}%` }} />
          </div>
        </m.div>
      ))}
    </div>
  );
};

/* ─── 5. AI Chat ─── */

const AI_CONVOS = [
  {
    q: 'add a glowing card',
    lines: [
      { cls: 'kw', text: 'import ' },
      { cls: 'comp', text: 'BorderGlow' },
      { cls: 'kw', text: ' from ' },
      { cls: 'str', text: '"./BorderGlow"' }
    ],
    jsx: [
      { cls: 'tag', text: '<' },
      { cls: 'comp', text: 'BorderGlow' },
      { cls: 'attr', text: ' glowIntensity' },
      { cls: 'punc', text: '=' },
      { cls: 'num', text: '{0.8}' },
      { cls: 'tag', text: ' />' }
    ]
  },
  {
    q: 'animate hero text',
    lines: [
      { cls: 'kw', text: 'import ' },
      { cls: 'comp', text: 'SplitText' },
      { cls: 'kw', text: ' from ' },
      { cls: 'str', text: '"./SplitText"' }
    ],
    jsx: [
      { cls: 'tag', text: '<' },
      { cls: 'comp', text: 'SplitText' },
      { cls: 'attr', text: ' animation' },
      { cls: 'punc', text: '=' },
      { cls: 'str', text: '"fadeUp"' },
      { cls: 'tag', text: ' />' }
    ]
  },
  {
    q: 'particle background',
    lines: [
      { cls: 'kw', text: 'import ' },
      { cls: 'comp', text: 'Ballpit' },
      { cls: 'kw', text: ' from ' },
      { cls: 'str', text: '"./Ballpit"' }
    ],
    jsx: [
      { cls: 'tag', text: '<' },
      { cls: 'comp', text: 'Ballpit' },
      { cls: 'attr', text: ' count' },
      { cls: 'punc', text: '=' },
      { cls: 'num', text: '{200}' },
      { cls: 'tag', text: ' />' }
    ]
  }
];

const AITerminal = () => {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState('prompt'); // prompt | thinking | code
  const [codeLines, setCodeLines] = useState(0);
  const timers = useRef([]);
  const [ref, visible] = useInView();

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    if (!visible) return;
    const conv = AI_CONVOS[idx];
    setTyped('');
    setPhase('prompt');
    setCodeLines(0);

    // Pre-schedule the entire typing sequence so there's no per-char setState race
    let delay = 300;
    for (let c = 0; c <= conv.q.length; c++) {
      const slice = conv.q.slice(0, c);
      schedule(() => setTyped(slice), delay);
      delay += 50;
    }

    // Thinking phase
    schedule(() => setPhase('thinking'), delay);
    delay += 900;

    // Code lines
    schedule(() => {
      setPhase('code');
      setCodeLines(1);
    }, delay);
    delay += 280;
    schedule(() => setCodeLines(2), delay);
    delay += 280;
    schedule(() => setCodeLines(3), delay);
    delay += 2400;

    // Next conversation
    schedule(() => setIdx(p => (p + 1) % AI_CONVOS.length), delay);

    return clearTimers;
  }, [idx, visible, clearTimers, schedule]);

  const conv = AI_CONVOS[idx];

  return (
    <div className="ln-feat-aichat" ref={ref}>
      <AnimatePresence mode="wait">
        <m.div
          key={idx}
          className="ln-feat-aichat-inner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="ln-feat-aichat-head">
            <div className="ln-feat-aichat-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="ln-feat-aichat-title">Editor</span>
          </div>

          <div className="ln-feat-aichat-prompt-row">
            <span className="ln-feat-aichat-chevron">$</span>
            <span className="ln-feat-aichat-prompt">{typed}</span>
            {phase === 'prompt' && <span className="ln-feat-aichat-cursor" />}
          </div>

          {phase === 'thinking' && (
            <div className="ln-feat-aichat-thinking">
              <span />
              <span />
              <span />
            </div>
          )}

          {phase === 'code' && (
            <div className="ln-feat-aichat-code-block">
              {codeLines >= 1 && (
                <m.div
                  className="ln-feat-aichat-code-line"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="ln-feat-aichat-ln">1</span>
                  {conv.lines.map((t, j) => (
                    <span key={j} className={`ac-${t.cls}`}>
                      {t.text}
                    </span>
                  ))}
                </m.div>
              )}
              {codeLines >= 2 && (
                <m.div
                  className="ln-feat-aichat-code-line"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="ln-feat-aichat-ln">2</span>
                </m.div>
              )}
              {codeLines >= 3 && (
                <m.div
                  className="ln-feat-aichat-code-line"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="ln-feat-aichat-ln">3</span>
                  {conv.jsx.map((t, j) => (
                    <span key={j} className={`ac-${t.cls}`}>
                      {t.text}
                    </span>
                  ))}
                </m.div>
              )}
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── 6. Star Card ─── */

const StarCard = () => {
  const stars = useStars();
  const formatted = useMemo(
    () => (stars >= 1000 ? `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(stars)),
    [stars]
  );

  return (
    <div className="ln-feat-stars">
      <span className="ln-feat-stars-label">GitHub Stars</span>
      <span className="ln-feat-stars-count">{formatted}</span>
      <div className="ln-feat-stars-chart">
        <svg viewBox="0 0 200 50" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="starFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 45 C15 43,30 40,45 36 C60 32,75 30,90 26 C105 22,115 24,125 20 C140 15,155 12,170 10 C180 8,190 5,200 3 L200 50 L0 50Z"
            fill="url(#starFill)"
          />
          <m.path
            d="M0 45 C15 43,30 40,45 36 C60 32,75 30,90 26 C105 22,115 24,125 20 C140 15,155 12,170 10 C180 8,190 5,200 3"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        </svg>
      </div>
    </div>
  );
};

/* ─── Card data ─── */

const CARDS = [
  {
    title: `${COMPONENT_COUNT}+ Components`,
    desc: "Backgrounds, text effects, animations, creative UI components. The stuff you'd build from scratch, already done and battle-tested.",
    span: 5,
    visual: <ComponentMarquee />
  },
  {
    title: 'Visual Editors',
    desc: 'Five free tools to play with components & create stunning assets for your work.',
    span: 3,
    visual: <ToolsFloat />
  },
  {
    title: 'Well Organized',
    desc: "Five clear categories so you're not scrolling through a wall of unrelated stuff.",
    span: 4,
    visual: <CategorySelector />
  },
  {
    title: 'Pick Your Stack',
    desc: 'JavaScript or TypeScript, CSS or Tailwind. Every component comes in all four flavors for full flexibility.',
    span: 4,
    visual: <VariantTabs />
  },
  {
    title: 'AI-Ready',
    desc: 'The docs give you ready-to-use prompts. Works great with Cursor, Copilot, and v0. Describe what you need, drop it in, ship.',
    span: 5,
    visual: <AITerminal />
  },
  {
    title: 'Growing Fast',
    desc: "React's fastest-growing component library on GitHub. Not even close.",
    span: 3,
    visual: <StarCard />
  }
];

/* ─── Features Section ─── */

const Features = () => (
  <section className="ln-features-section">
    <div className="ln-features-inner">
      <h2 className="ln-features-title">What&apos;s inside</h2>

      <div className="ln-features-grid">
        {CARDS.map((card, i) => (
          <m.div
            key={card.title}
            className={`ln-features-card ln-features-card--span-${card.span}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.07, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <div className="ln-features-card-visual">{card.visual}</div>
            <div className="ln-features-card-body">
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          </m.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
