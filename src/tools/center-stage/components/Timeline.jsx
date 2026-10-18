import { useRef, useState } from 'react';
import { PauseIcon, PlayIcon, RepeatIcon, RepeatOffIcon, ReplayIcon } from '@hugeicons/core-free-icons';
import { Icon, Tip } from '../../background-studio/components/ui';

const stamp = seconds => {
  const total = Math.max(0, seconds);
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
};

export default function Timeline({
  time,
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
  const [active, setActive] = useState(false);
  const length = Math.max(0.5, duration);
  const local = cyclic && repeat ? ((time % length) + length) % length : Math.min(time, length);
  const progress = local / length;

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
      <span className="lab-time">{stamp(local)}</span>
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
          if (event.key === 'ArrowRight') onSeek(Math.min(length, local + length / 50));
          else if (event.key === 'ArrowLeft') onSeek(Math.max(0, local - length / 50));
        }}
      >
        <span className="lab-scrub-rail" />
        <span className="lab-scrub-range" style={{ left: 0, width: `${progress * 100}%` }} />
        <span className="lab-scrub-head" style={{ left: `${progress * 100}%` }} />
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
}
