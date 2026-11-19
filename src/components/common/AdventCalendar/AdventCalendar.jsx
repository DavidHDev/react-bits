import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, GiftIcon, Share08Icon, SquareLock02Icon, Tick02Icon } from '@hugeicons/core-free-icons';
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
  weekdayOf,
  writeOpened
} from './days';
import { advAsset } from './assets';

const SHARE_URL = 'https://reactbits.dev/#advent';

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = t => {
  const v = clamp01(t);
  return v * v * (3 - 2 * v);
};
const easeOut = t => 1 - Math.pow(1 - clamp01(t), 3);
const pad = n => String(n).padStart(2, '0');

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

const Door = ({ day, index, state, opened, ready, onPick, register }) => {
  const hero = day === DAYS;
  const label = state === 'today' ? 'Today' : hero ? 'Christmas Eve' : weekdayOf(day);
  return (
    <button
      ref={register}
      type="button"
      className={`adv-door adv-door--${state}${hero ? ' adv-door--hero' : ''}${opened && ready ? ' is-open' : ''}`}
      style={{ gridArea: `d${day}`, '--i': index }}
      aria-label={state === 'locked' ? `Day ${day}, opens ${dateLabel(day)}` : `Day ${day}`}
      aria-pressed={state === 'locked' ? undefined : opened}
      onClick={() => onPick(day)}
    >
      <span className="adv-door-inside">
        <HugeiconsIcon icon={GiftIcon} size={hero ? 30 : 20} strokeWidth={1.6} />
        <span className="adv-door-inside-day">Day {day}</span>
      </span>
      <span className="adv-door-leaf">
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
            {state === 'locked' && (
              <span className="adv-lock">
                <HugeiconsIcon icon={SquareLock02Icon} size={14} strokeWidth={1.8} />
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

const AdventCalendar = ({ origin, stageModule, onStarted, onClosed }) => {
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const backdropRef = useRef(null);
  const headRef = useRef(null);
  const infoRef = useRef(null);
  const gridRef = useRef(null);
  const closeRef = useRef(null);
  const tileRefs = useRef([]);
  const stageRef = useRef(null);
  const rafRef = useRef(0);
  const [narrow] = useState(() => window.innerWidth < 720);
  const [today] = useState(currentDay);
  const [opened, setOpened] = useState(readOpened);
  const [ready, setReady] = useState(false);
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState('');
  const [shared, setShared] = useState(false);
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
      time += dt;
      const t = Math.min(time, OPEN_END);
      opening.render(t);
      reveal(t, TIMES.pop, OPEN_END);
      if (time >= OPEN_END) {
        setReady(true);
        window.setTimeout(releaseStage, 520);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return releaseStage;
  }, [onStarted, origin, reduce, releaseStage, reveal, stageModule, theme]);

  useEffect(() => {
    if (ready) closeRef.current?.focus({ preventScroll: true });
  }, [ready]);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    releaseStage();
    window.setTimeout(() => {
      document.documentElement.classList.remove('adv-locked');
      onClosed();
    }, 280);
  }, [closing, onClosed, releaseStage]);

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

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
    setOpened(current => {
      const next = new Set(current);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      writeOpened(next);
      return next;
    });
  };

  return createPortal(
    <div
      ref={rootRef}
      className={`adv-overlay${ready ? ' is-ready' : ''}${plain ? ' is-reduced' : ''}${closing ? ' is-leaving' : ''}`}
    >
      <div ref={backdropRef} className="adv-backdrop" onClick={close} />
      <div className="adv-scene" onClick={event => event.target === event.currentTarget && close()}>
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
              <button type="button" className="adv-action" onClick={share}>
                <HugeiconsIcon icon={shared ? Tick02Icon : Share08Icon} size={15} strokeWidth={1.8} />
                <span>{shared ? 'Link copied' : 'Share'}</span>
              </button>
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
              {days.map(({ day, state }, index) => (
                <Door
                  key={day}
                  day={day}
                  index={index}
                  state={state}
                  opened={opened.has(day)}
                  ready={ready}
                  onPick={pick}
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
