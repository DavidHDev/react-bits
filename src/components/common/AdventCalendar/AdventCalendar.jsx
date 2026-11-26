import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowUpRight01Icon,
  Cancel01Icon,
  GiftIcon,
  Settings01Icon,
  Share08Icon,
  SquareLock02Icon,
  Tick02Icon
} from '@hugeicons/core-free-icons';
import {
  DAYS,
  LAYOUT_NARROW,
  LAYOUT_WIDE,
  YEAR,
  areas,
  currentDay,
  dateLabel,
  nextUnlock,
  readOpened,
  spanOf,
  weekdayOf,
  writeOpened
} from './days';
import { advAsset } from './assets';
import { fetchGift } from '../../advent/runtime';
import { meltDoor } from './melt';

const SHARE_URL = 'https://reactbits.dev/#advent';

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = t => {
  const v = clamp01(t);
  return v * v * (3 - 2 * v);
};
const easeOut = t => 1 - Math.pow(1 - clamp01(t), 3);
const pad = n => String(n).padStart(2, '0');
const INTRO_KEY = `rb-advent-${YEAR}-intro`;

const readIntro = () => {
  try {
    return localStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
};

const writeIntro = () => {
  try {
    localStorage.setItem(INTRO_KEY, '1');
  } catch {
    return;
  }
};

const neighbour = (layout, day, key) => {
  const step = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[key];
  if (!step) return null;
  let row = layout.findIndex(cells => cells.includes(day));
  let col = layout[row].indexOf(day);
  for (;;) {
    row += step[0];
    col += step[1];
    if (row < 0 || row >= layout.length || col < 0 || col >= layout[0].length) return null;
    const next = layout[row][col];
    if (next && next !== day) return next;
  }
};

const useCountdown = target => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);
  if (!target) return null;
  const left = Math.max(0, Math.floor((target.getTime() - now) / 1000));
  return {
    d: Math.floor(left / 86400),
    h: Math.floor((left % 86400) / 3600),
    m: Math.floor((left % 3600) / 60),
    s: left % 60
  };
};

const Info = ({ today, message, theme, register }) => {
  const [target] = useState(nextUnlock);
  const left = useCountdown(target);
  const label =
    message || (today <= 0 ? 'First door opens in' : today >= DAYS ? 'All doors are open' : 'Next door opens in');
  return (
    <div ref={register} className="adv-info" style={{ gridArea: 'info' }}>
      <div className="adv-info-text">
        <span className="adv-info-label" aria-live="polite">
          {label}
        </span>
        {left ? (
          <span className="adv-count" aria-label={`${left.d} days ${left.h} hours ${left.m} minutes`}>
            {left.d > 0 && (
              <span className="adv-count-unit">
                <span className="adv-count-num">{left.d}</span>d
              </span>
            )}
            <span className="adv-count-unit">
              <span className="adv-count-num">{pad(left.h)}</span>h
            </span>
            <span className="adv-count-unit">
              <span className="adv-count-num">{pad(left.m)}</span>m
            </span>
            <span className="adv-count-unit">
              <span className="adv-count-num">{pad(left.s)}</span>s
            </span>
          </span>
        ) : (
          <span className="adv-count">
            <span className="adv-count-num">Merry Christmas</span>
          </span>
        )}
      </div>
      <img className="adv-info-gift" src={advAsset(`gift-${theme}.webp`)} alt="" draggable="false" />
    </div>
  );
};

const Door = ({ day, delay, state, opened, title, wide, ready, theme, onPick, onKeyDown, register }) => {
  const hero = day === DAYS;
  const label = state === 'today' ? 'Today' : hero ? 'Christmas Eve' : weekdayOf(day);
  const doorRef = useRef(null);
  const leafRef = useRef(null);
  const wasOpened = useRef(opened);
  const [melted, setMelted] = useState(opened);

  useEffect(() => {
    const before = wasOpened.current;
    wasOpened.current = opened;
    if (!opened || before || !ready) return undefined;
    const door = doorRef.current;
    const leaf = leafRef.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!door || !leaf || reduce) {
      setMelted(true);
      return undefined;
    }
    return meltDoor(door, leaf, {
      seed: day * 7 + 3,
      duration: hero ? 1900 : 1500,
      frost: theme === 'light' ? '#cdd6e6' : '#eef3ff',
      onDone: () => setMelted(true)
    });
  }, [opened, ready, day, hero, theme]);

  return (
    <button
      ref={el => {
        doorRef.current = el;
        register(el);
      }}
      type="button"
      className={`adv-door adv-door--${state}${hero ? ' adv-door--hero' : ''}${wide ? ' adv-door--wide' : ''}${opened && ready ? ' is-open' : ''}${melted ? ' is-melted' : ''}`}
      style={{ gridArea: `d${day}`, '--d': `${delay}ms` }}
      aria-label={
        state === 'locked'
          ? `Day ${day}, opens ${dateLabel(day)}`
          : opened && title
            ? `Day ${day}: ${title.title}${title.note ? `, ${title.note}` : ''}`
            : `Day ${day}`
      }
      aria-pressed={state === 'locked' ? undefined : opened}
      onClick={() => onPick(day)}
      onKeyDown={event => onKeyDown(event, day)}
    >
      <span className="adv-door-inside">
        <span className="adv-inside-top">
          <span className="adv-inside-num">{day}</span>
          <span className="adv-inside-icon">
            <span className="adv-inside-glyph">
              <HugeiconsIcon
                icon={Array.isArray(title?.icon) ? title.icon : GiftIcon}
                size={hero ? 22 : 15}
                strokeWidth={1.6}
              />
            </span>
            <span className="adv-inside-arrow">
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={hero ? 24 : 16} strokeWidth={1.8} />
            </span>
          </span>
        </span>
        <span className={`adv-inside-bottom${title?.note ? ' has-note' : ''}`}>
          <span className="adv-inside-title">{title?.short || title?.title || ''}</span>
          {title?.note && <span className="adv-inside-note">{title.note}</span>}
        </span>
      </span>
      <span ref={leafRef} className="adv-door-leaf">
        <span className="adv-door-face">
          {hero && (
            <span className="adv-door-fx" aria-hidden="true">
              <span className="adv-glow" />
              <span className="adv-dust" />
              <span className="adv-dust adv-dust--far" />
            </span>
          )}
          <span className="adv-door-content">
            <span className="adv-num">{day}</span>
            <span className="adv-meta">{label}</span>
            {state === 'locked' ? (
              <span className="adv-lock">
                <HugeiconsIcon icon={SquareLock02Icon} size={14} strokeWidth={1.8} />
              </span>
            ) : (
              <span className="adv-go">
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={hero ? 24 : 16} strokeWidth={1.8} />
              </span>
            )}
          </span>
          {state === 'today' && <span className="adv-door-ring" />}
        </span>
        <span className="adv-door-back" />
      </span>
    </button>
  );
};

const AdventCalendar = ({
  origin,
  stageModule,
  onStarted,
  onClosed,
  openingAnimationDisabled,
  onOpeningAnimationChange
}) => {
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const backdropRef = useRef(null);
  const headRef = useRef(null);
  const infoRef = useRef(null);
  const gridRef = useRef(null);
  const closeRef = useRef(null);
  const settingsRef = useRef(null);
  const settingsTriggerRef = useRef(null);
  const switchRef = useRef(null);
  const tileRefs = useRef([]);
  const stageRef = useRef(null);
  const rafRef = useRef(0);
  const [narrow] = useState(() => window.innerWidth < 860);
  const [today] = useState(currentDay);
  const [quick] = useState(readIntro);
  const skipRef = useRef(false);
  const [opened, setOpened] = useState(readOpened);
  const [titles, setTitles] = useState({});
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState('');
  const [shared, setShared] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [plain, setPlain] = useState(false);
  const reduce = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, []);
  const layout = narrow ? LAYOUT_NARROW : LAYOUT_WIDE;
  const theme = origin.theme;

  const days = useMemo(
    () =>
      Array.from({ length: DAYS }, (_, i) => {
        const day = i + 1;
        return { day, state: day > today ? 'locked' : day === today ? 'today' : 'past' };
      }),
    [today]
  );

  const reveal = useCallback((t, pop, end) => {
    const panel = panelRef.current;
    if (panel) {
      panel.style.setProperty('--adv-s', smooth((t - pop - 0.2) / 0.55).toFixed(3));
      panel.style.setProperty('--adv-sc', (0.95 + 0.05 * easeOut((t - pop - 0.2) / 0.7)).toFixed(4));
    }
    const h = clamp01((t - end + 0.6) / 0.55);
    [headRef.current, infoRef.current].forEach((el, k) => {
      if (!el) return;
      const v = clamp01(h * 1.15 - k * 0.15);
      el.style.opacity = smooth(v).toFixed(3);
      el.style.transform = `translateY(${((1 - easeOut(v)) * 8).toFixed(2)}px)`;
    });
    if (backdropRef.current) backdropRef.current.style.opacity = smooth(t / 0.6).toFixed(3);
  }, []);

  const releaseStage = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (stageRef.current) {
      stageModule?.disposeStage(stageRef.current);
      stageRef.current = null;
    }
  }, [stageModule]);

  useLayoutEffect(() => {
    document.documentElement.classList.add('adv-locked');
    const finishPlain = () => {
      setPlain(true);
      reveal(99, 0, 0);
      setReady(true);
      onStarted?.();
    };
    const stage = !reduce && stageModule ? stageModule.takeStage(theme) : null;
    if (!stage) {
      finishPlain();
      return releaseStage;
    }
    stageRef.current = stage;
    const { gift, opening, canvas } = stage;
    const THREE = gift.THREE;
    const box = rootRef.current.getBoundingClientRect();
    const width = box.width;
    const height = box.height;
    rootRef.current.appendChild(canvas);
    gift.getRenderer().setSize(width, height, false);
    const grid = gridRef.current.getBoundingClientRect();
    const center = [grid.left + grid.width / 2 - box.left, grid.top + grid.height / 2 - box.top];
    const size = Math.max(300, Math.min(720, Math.min(width, height) * (width < 720 ? 0.98 : 0.78)));
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const tiles = tileRefs.current.map(el => {
      const r = el.getBoundingClientRect();
      const face = el.querySelector('.adv-door-face');
      const texture = new THREE.CanvasTexture(stageModule.drawTileFace(el, pixelRatio));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      return {
        cx: r.left + r.width / 2 - box.left,
        cy: r.top + r.height / 2 - box.top,
        w: r.width,
        h: r.height,
        radius: parseFloat(getComputedStyle(face).borderTopLeftRadius) || 14,
        texture
      };
    });
    opening.start({
      width,
      height,
      time: origin.time,
      from: { ...origin.rect, x: origin.rect.x - box.left, y: origin.rect.y - box.top },
      to: { x: center[0] - size / 2, y: center[1] - size / 2, size },
      center,
      tiles
    });
    const { OPEN_END, TIMES } = stageModule;
    try {
      opening.render(0);
    } catch {
      releaseStage();
      finishPlain();
      return releaseStage;
    }
    reveal(0, TIMES.pop, OPEN_END);
    let time = 0;
    let last = 0;
    let started = false;
    const tick = now => {
      if (!started) {
        started = true;
        onStarted?.();
      }
      const dt = last ? Math.min(0.034, (now - last) / 1000) : 0;
      last = now;
      const rush = quick && time > TIMES.fly - 0.05 && time < TIMES.pop - 0.06 ? 3.2 : 1;
      time += dt * (skipRef.current ? 4.5 : rush);
      const t = Math.min(time, OPEN_END);
      opening.render(t);
      reveal(t, TIMES.pop, OPEN_END);
      if (time >= OPEN_END) {
        setReady(true);
        writeIntro();
        window.setTimeout(releaseStage, 520);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return releaseStage;
  }, [onStarted, origin, quick, reduce, releaseStage, reveal, stageModule, theme]);

  useEffect(() => {
    if (ready) closeRef.current?.focus({ preventScroll: true });
  }, [ready]);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    releaseStage();
    const panel = panelRef.current;
    if (panel && origin.rect && !plain) {
      const box = panel.getBoundingClientRect();
      const x = origin.rect.x + origin.rect.size / 2 - (box.left + box.width / 2);
      const y = origin.rect.y + origin.rect.size * 0.56 - (box.top + box.height / 2);
      panel.style.setProperty('--adv-exit-x', `${x.toFixed(1)}px`);
      panel.style.setProperty('--adv-exit-y', `${y.toFixed(1)}px`);
    }
    if (backdropRef.current) backdropRef.current.style.opacity = '0';
    window.setTimeout(
      () => {
        document.documentElement.classList.remove('adv-locked');
        onClosed();
      },
      plain ? 240 : 300
    );
  }, [closing, onClosed, origin.rect, plain, releaseStage]);

  const skip = useCallback(() => {
    if (!ready) skipRef.current = true;
  }, [ready]);

  const dismiss = useCallback(() => {
    if (ready) close();
    else skip();
  }, [close, ready, skip]);

  useEffect(() => {
    if (!settingsOpen) return undefined;
    switchRef.current?.focus({ preventScroll: true });
    const dismissOutside = event => {
      if (!settingsRef.current?.contains(event.target)) setSettingsOpen(false);
    };
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('focusin', dismissOutside);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('focusin', dismissOutside);
    };
  }, [settingsOpen]);

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
          settingsTriggerRef.current?.focus({ preventScroll: true });
          return;
        }
        close();
        return;
      }
      if (!ready && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        skip();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll('button:not([disabled])')].filter(
        el => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panelRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !panelRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, ready, settingsOpen, skip]);

  const lead = Math.min(DAYS, Math.max(1, today));
  const delayOf = day => Math.round(60 + 420 * (1 - Math.pow(1 - Math.abs(day - lead) / (DAYS - 1), 2)));

  const moveFocus = useCallback(
    (event, day) => {
      const next = neighbour(layout, day, event.key);
      if (!next) return;
      event.preventDefault();
      tileRefs.current[next - 1]?.focus();
    },
    [layout]
  );

  useEffect(() => {
    if (!message) return undefined;
    const id = window.setTimeout(() => setMessage(''), 2600);
    return () => window.clearTimeout(id);
  }, [message]);

  useEffect(() => {
    if (!shared) return undefined;
    const id = window.setTimeout(() => setShared(false), 2000);
    return () => window.clearTimeout(id);
  }, [shared]);

  const share = useCallback(async () => {
    const data = {
      title: 'React Bits Advent Calendar',
      text: 'A new door opens every day until Christmas Eve.',
      url: SHARE_URL
    };
    try {
      if (navigator.share && window.matchMedia?.('(pointer: coarse)').matches) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(SHARE_URL);
      setShared(true);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    let active = true;
    [...opened]
      .filter(day => day <= today && !titles[day])
      .forEach(day => {
        fetchGift(day, 'meta')
          .then(meta => {
            if (active && meta?.title)
              setTitles(current => ({
                ...current,
                [day]: { title: meta.title, short: meta.short, icon: meta.icon, note: meta.tile }
              }));
          })
          .catch(() => {});
      });
    return () => {
      active = false;
    };
  }, [opened, today, titles]);

  const pick = day => {
    if (!ready || closing) return;
    if (day > today) {
      setMessage("This door isn't open yet.");
      const el = tileRefs.current[day - 1];
      el?.classList.remove('is-shaking');
      void el?.offsetWidth;
      el?.classList.add('is-shaking');
      return;
    }
    if (opened.has(day)) {
      close();
      navigate(`/advent/${day}${window.location.search}`);
      return;
    }
    setOpened(current => {
      const next = new Set(current);
      next.add(day);
      writeOpened(next);
      return next;
    });
  };

  return createPortal(
    <div
      ref={rootRef}
      className={`adv-overlay${ready ? ' is-ready' : ''}${plain ? ' is-reduced' : ''}${closing ? ' is-leaving' : ''}`}
    >
      <div ref={backdropRef} className="adv-backdrop" onClick={dismiss} />
      <div className="adv-scene" onClick={event => event.target === event.currentTarget && dismiss()}>
        <div
          ref={panelRef}
          className={`adv-panel${narrow ? ' is-narrow' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="adv-title"
          aria-describedby="adv-lede"
        >
          <div className="adv-surface" />
          <header ref={headRef} className="adv-head">
            <div className="adv-titles">
              <p className="adv-eyebrow">December 1–24, {YEAR}</p>
              <h2 id="adv-title" className="adv-title">
                React Bits Advent Calendar
              </h2>
              <p id="adv-lede" className="adv-lede">
                A new door opens every day until Christmas Eve.
              </p>
            </div>
            <div className="adv-actions">
              <button
                type="button"
                className="adv-action"
                onClick={share}
                aria-label={shared ? 'Link copied' : 'Share calendar'}
              >
                <HugeiconsIcon icon={shared ? Tick02Icon : Share08Icon} size={15} strokeWidth={1.8} />
                <span>{shared ? 'Link copied' : 'Share'}</span>
              </button>
              <div className="adv-settings" ref={settingsRef}>
                <button
                  ref={settingsTriggerRef}
                  type="button"
                  className="adv-action adv-action--icon"
                  aria-label="Calendar settings"
                  title="Calendar settings"
                  aria-expanded={settingsOpen}
                  aria-controls="adv-settings-panel"
                  disabled={!ready}
                  onClick={() => setSettingsOpen(open => !open)}
                >
                  <HugeiconsIcon icon={Settings01Icon} size={17} strokeWidth={1.8} />
                </button>
                <div id="adv-settings-panel" className="adv-settings-panel" hidden={!settingsOpen}>
                  <button
                    ref={switchRef}
                    type="button"
                    role="switch"
                    aria-checked={openingAnimationDisabled}
                    className="adv-settings-option"
                    onClick={() => onOpeningAnimationChange(!openingAnimationDisabled)}
                  >
                    Disable opening animation
                    <span className="adv-switch-track" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="adv-action adv-action--icon"
                onClick={close}
                aria-label="Close the advent calendar"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
              </button>
            </div>
          </header>
          <div className="adv-well">
            <div
              ref={gridRef}
              className="adv-grid"
              style={{
                gridTemplateAreas: areas(layout),
                gridTemplateColumns: `repeat(${layout[0].length}, minmax(0, 1fr))`,
                gridTemplateRows: narrow
                  ? `auto repeat(${layout.length - 1}, var(--adv-row))`
                  : `repeat(${layout.length}, var(--adv-row))`
              }}
            >
              <Info today={today} message={message} theme={theme} register={infoRef} />
              {days.map(({ day, state }) => (
                <Door
                  key={day}
                  day={day}
                  delay={delayOf(day)}
                  state={state}
                  opened={opened.has(day)}
                  title={titles[day]}
                  wide={spanOf(layout, day).cols > 1}
                  ready={ready}
                  theme={theme}
                  onPick={pick}
                  onKeyDown={moveFocus}
                  register={el => {
                    tileRefs.current[day - 1] = el;
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdventCalendar;
