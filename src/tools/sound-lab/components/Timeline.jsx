import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { PlayIcon, RepeatIcon, RepeatOffIcon, StopIcon } from '@hugeicons/core-free-icons';
import { Icon, Tip } from '../../background-studio/components/ui';

const stamp = seconds => {
  const total = Math.max(0, seconds || 0);
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`;
};

const WIDTH = 600;
const HEIGHT = 28;

const Bars = ({ bars }) => {
  const step = bars.length ? WIDTH / bars.length : 0;
  return bars.map((value, index) => {
    const h = Math.max(1.5, value * (HEIGHT - 2));
    return (
      <rect
        key={index}
        x={index * step + step * 0.18}
        y={(HEIGHT - h) / 2}
        width={Math.max(0.8, step * 0.64)}
        height={h}
        rx={Math.min(1, step * 0.3)}
      />
    );
  });
};

function Timeline({ sound, info, player, loop, onPlay, onStop, onToggleLoop }) {
  const [playing, setPlaying] = useState(false);
  const progressRef = useRef(0);
  const trackRef = useRef(null);
  const timeRef = useRef(null);
  const clipRef = useRef(null);
  const headRef = useRef(null);

  const duration = info?.duration || 0;
  const bars = info?.wave;
  const shape = useMemo(() => <Bars bars={bars || []} />, [bars]);

  useEffect(() => {
    let frame = 0;
    const show = value => {
      const at = value ?? 0;
      progressRef.current = at;
      if (timeRef.current) timeRef.current.textContent = stamp(value === null ? 0 : at * duration);
      if (trackRef.current) trackRef.current.setAttribute('aria-valuenow', String(Number((at * duration).toFixed(2))));
      if (clipRef.current) clipRef.current.setAttribute('width', String(at * WIDTH));
      if (headRef.current) headRef.current.style.left = `${at * 100}%`;
    };
    const tick = () => {
      const value = player.progress();
      const next = value && value.id === sound.id ? value.value : null;
      setPlaying(next !== null);
      show(next);
      frame = next === null ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const unsubscribe = player.subscribe(wake);
    tick();
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, [player, sound.id, duration]);

  const progress = playing ? progressRef.current : 0;

  const seek = event => {
    const rect = trackRef.current.getBoundingClientRect();
    const fraction = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 0.995);
    onPlay(sound.id, fraction * duration);
  };

  return (
    <div className="lab-timeline snd-timeline">
      <span className="snd-transport">
        <Tip label={playing ? 'Stop' : 'Play'} hint="Space">
          <button
            type="button"
            className="lab-icon-button"
            aria-label={playing ? 'Stop' : 'Play'}
            onClick={() => (playing ? onStop() : onPlay(sound.id))}
          >
            <Icon icon={playing ? StopIcon : PlayIcon} size={15} />
          </button>
        </Tip>
      </span>
      <span className="lab-time" ref={timeRef}>
        {stamp(playing ? progress * duration : 0)}
      </span>
      <div
        className="snd-scrub"
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Play from"
        aria-valuemin={0}
        aria-valuemax={Number(duration.toFixed(2))}
        aria-valuenow={Number((progress * duration).toFixed(2))}
        onPointerDown={seek}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPlay(sound.id);
          }
        }}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <clipPath id={`snd-played-${sound.id}`}>
              <rect ref={clipRef} x="0" y="0" width={progress * WIDTH} height={HEIGHT} />
            </clipPath>
          </defs>
          <g className="snd-scrub-bars">{shape}</g>
          {playing && (
            <g className="snd-scrub-played" clipPath={`url(#snd-played-${sound.id})`}>
              {shape}
            </g>
          )}
        </svg>
        {playing && <span className="snd-scrub-head" ref={headRef} style={{ left: `${progress * 100}%` }} />}
      </div>
      <span className="lab-time lab-time--muted">{stamp(duration)}</span>
      <Tip label={loop ? 'Looping' : 'Plays once'} hint="L">
        <button
          type="button"
          className="lab-icon-button snd-loop"
          aria-label="Loop playback"
          aria-pressed={loop}
          data-on={loop ? '' : undefined}
          onClick={onToggleLoop}
        >
          <Icon icon={loop ? RepeatIcon : RepeatOffIcon} size={15} />
        </button>
      </Tip>
    </div>
  );
}

export default memo(Timeline);
