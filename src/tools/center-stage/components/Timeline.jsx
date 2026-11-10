import { memo, useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon, RepeatIcon, RepeatOffIcon, ReplayIcon } from '@hugeicons/core-free-icons';
import { Icon, Tip } from '../../background-studio/components/ui';

const stamp = seconds => {
  const total = Math.max(0, seconds);
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
};

export default memo(function Timeline({
  timeRef,
  tickRef,
  duration,
  cyclic,
  repeat,
  playing,
  onTogglePlay,
  onReplay,
  onToggleRepeat,
  onSeek
}) {
  const trackRef = useRef(null);
  const stampRef = useRef(null);
  const rangeRef = useRef(null);
  const headRef = useRef(null);
  const [active, setActive] = useState(false);
  const length = Math.max(0.5, duration);
  const localOf = time => (cyclic && repeat ? ((time % length) + length) % length : Math.min(time, length));
  const local = localOf(timeRef.current);
  const progress = local / length;
  const view = useRef(null);
  view.current = { localOf, length };

  useEffect(() => {
    tickRef.current = time => {
      const { localOf: toLocal, length: span } = view.current;
      const value = toLocal(time);
      const percent = `${(value / span) * 100}%`;
      const text = stampRef.current?.firstChild;
      if (text) text.nodeValue = stamp(value);
      if (rangeRef.current) rangeRef.current.style.width = percent;
      if (headRef.current) headRef.current.style.left = percent;
      trackRef.current?.setAttribute('aria-valuenow', String(Number(value.toFixed(2))));
    };
    return () => {
      tickRef.current = null;
    };
  }, [tickRef]);

  const seekAt = clientX => {
    const rect = trackRef.current.getBoundingClientRect();
    onSeek(Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1) * length);
  };

  return (
    <div className="lab-timeline cst-timeline" data-active={active ? '' : undefined}>
      <span className="cst-transport">
        <Tip label={playing ? 'Pause' : 'Play'} hint="Space">
          <button
            type="button"
            className="lab-icon-button"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={onTogglePlay}
          >
            <Icon icon={playing ? PauseIcon : PlayIcon} size={15} />
          </button>
        </Tip>
        <Tip label="Replay" hint="Home">
          <button type="button" className="lab-icon-button" aria-label="Replay" onClick={onReplay}>
            <Icon icon={ReplayIcon} size={15} />
          </button>
        </Tip>
      </span>
      <span className="lab-time" ref={stampRef}>
        {stamp(local)}
      </span>
      <div
        className="lab-scrub"
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Playhead"
        aria-valuemin={0}
        aria-valuemax={length}
        aria-valuenow={Number(local.toFixed(2))}
        onPointerDown={event => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setActive(true);
          seekAt(event.clientX);
        }}
        onPointerMove={event => active && seekAt(event.clientX)}
        onPointerUp={() => setActive(false)}
        onPointerCancel={() => setActive(false)}
        onKeyDown={event => {
          const now = localOf(timeRef.current);
          if (event.key === 'ArrowRight') onSeek(Math.min(length, now + length / 50));
          else if (event.key === 'ArrowLeft') onSeek(Math.max(0, now - length / 50));
        }}
      >
        <span className="lab-scrub-rail" />
        <span className="lab-scrub-range" ref={rangeRef} style={{ left: 0, width: `${progress * 100}%` }} />
        <span className="lab-scrub-head" ref={headRef} style={{ left: `${progress * 100}%` }} />
      </div>
      <span className="lab-time lab-time--muted">{stamp(length)}</span>
      <Tip label={repeat ? 'Looping' : 'Plays once'} hint="L">
        <button
          type="button"
          className="lab-icon-button cst-repeat"
          aria-label="Loop playback"
          aria-pressed={repeat}
          data-on={repeat ? '' : undefined}
          onClick={onToggleRepeat}
        >
          <Icon icon={repeat ? RepeatIcon : RepeatOffIcon} size={15} />
        </button>
      </Tip>
    </div>
  );
});
