import { useEffect, useRef, useState } from 'react';
import { PlayIcon, RepeatIcon, RepeatOffIcon, StopIcon } from '@hugeicons/core-free-icons';
import { Icon, Tip } from '../../background-studio/components/ui';

const stamp = seconds => {
  const total = Math.max(0, seconds || 0);
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`;
};

export default function Timeline({ sound, info, player, loop, onPlay, onStop, onToggleLoop }) {
  const [progress, setProgress] = useState(null);
  const frame = useRef(0);
  const trackRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const value = player.progress();
      const next = value && value.id === sound.id ? value.value : null;
      setProgress(previous => (previous === next ? previous : next));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [player, sound.id]);

  const duration = info?.duration || 0;
  const playing = progress !== null;
  const bars = info?.wave || [];
  const width = 600;
  const height = 28;
  const step = bars.length ? width / bars.length : 0;

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
      <span className="lab-time">{stamp(playing ? progress * duration : 0)}</span>
      <div
        className="snd-scrub"
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Play from"
        aria-valuemin={0}
        aria-valuemax={Number(duration.toFixed(2))}
        aria-valuenow={Number(((progress || 0) * duration).toFixed(2))}
        onPointerDown={seek}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPlay(sound.id);
          }
        }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <clipPath id={`snd-played-${sound.id}`}>
              <rect x="0" y="0" width={(progress || 0) * width} height={height} />
            </clipPath>
          </defs>
          <g className="snd-scrub-bars">
            {bars.map((value, index) => {
              const h = Math.max(1.5, value * (height - 2));
              return (
                <rect
                  key={index}
                  x={index * step + step * 0.18}
                  y={(height - h) / 2}
                  width={Math.max(0.8, step * 0.64)}
                  height={h}
                  rx={Math.min(1, step * 0.3)}
                />
              );
            })}
          </g>
          {playing && (
            <g className="snd-scrub-played" clipPath={`url(#snd-played-${sound.id})`}>
              {bars.map((value, index) => {
                const h = Math.max(1.5, value * (height - 2));
                return (
                  <rect
                    key={index}
                    x={index * step + step * 0.18}
                    y={(height - h) / 2}
                    width={Math.max(0.8, step * 0.64)}
                    height={h}
                    rx={Math.min(1, step * 0.3)}
                  />
                );
              })}
            </g>
          )}
        </svg>
        {playing && <span className="snd-scrub-head" style={{ left: `${progress * 100}%` }} />}
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
