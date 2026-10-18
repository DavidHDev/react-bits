import { useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { Icon, Tip } from '../../background-studio/components/ui';

const MIN_SPAN = 0.2;
const FRAME = 1 / 30;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const format = seconds => {
  const s = Math.max(0, seconds || 0);
  const minutes = Math.floor(s / 60);
  const rest = s - minutes * 60;
  return `${minutes}:${rest.toFixed(1).padStart(4, '0')}`;
};

export default function LabTimeline({ media, playing, trim, onTrim, onTogglePlay, children }) {
  const player = media.player;
  const duration = media.duration || 0;
  const [time, setTime] = useState(player.currentTime);
  const [active, setActive] = useState(null);
  const trackRef = useRef(null);
  const trimRef = useRef(trim);
  const finishRef = useRef(null);
  trimRef.current = trim;

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setTime(player.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [player]);

  useEffect(() => () => finishRef.current?.(), []);

  const at = clientX => {
    const rect = trackRef.current.getBoundingClientRect();
    return clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1) * duration;
  };

  const setStart = value => {
    const [, end] = trimRef.current;
    const start = clamp(value, 0, end - MIN_SPAN);
    trimRef.current = [start, end];
    onTrim([start, end]);
    player.setRange(start, end);
    return start;
  };

  const setEnd = value => {
    const [start] = trimRef.current;
    const end = clamp(value, start + MIN_SPAN, duration);
    trimRef.current = [start, end];
    onTrim([start, end]);
    player.setRange(start, end);
    return end;
  };

  const begin = (event, mode) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    finishRef.current?.();
    const target = event.currentTarget;
    const pointerId = event.pointerId;
    try {
      target.setPointerCapture(pointerId);
    } catch {
      target.releasePointerCapture?.(pointerId);
    }
    const wasPlaying = !player.paused;
    if (wasPlaying) player.pause();
    setActive(mode);
    const apply = clientX => {
      const value = at(clientX);
      if (mode === 'start') player.seek(setStart(value));
      else if (mode === 'end') player.seek(setEnd(value));
      else player.seek(clamp(value, trimRef.current[0], trimRef.current[1]));
    };
    apply(event.clientX);
    const move = moveEvent => {
      if (moveEvent.pointerId === pointerId) apply(moveEvent.clientX);
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      target.removeEventListener('lostpointercapture', finish);
      finishRef.current = null;
      setActive(null);
      if (!wasPlaying) return;
      if (mode === 'end') player.seek(trimRef.current[0]);
      player.play();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    target.addEventListener('lostpointercapture', finish);
    finishRef.current = finish;
  };

  const nudge = (event, mode) => {
    const step = event.shiftKey ? 1 : FRAME;
    const keys = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step };
    const [start, end] = trimRef.current;
    let value = null;
    if (event.key in keys) {
      const base = mode === 'start' ? start : mode === 'end' ? end : player.currentTime;
      value = base + keys[event.key];
    } else if (event.key === 'Home') value = mode === 'end' ? start : 0;
    else if (event.key === 'End') value = mode === 'start' ? end : duration;
    if (value === null) return;
    event.preventDefault();
    event.stopPropagation();
    if (mode === 'start') player.seek(setStart(value));
    else if (mode === 'end') player.seek(setEnd(value));
    else player.seek(clamp(value, start, end));
  };

  const pct = value => `${(clamp(value, 0, duration) / Math.max(duration, 0.001)) * 100}%`;

  return (
    <div className="lab-timeline" data-active={active || undefined}>
      <Tip label={playing ? 'Pause' : 'Play'} hint="Space">
        <button
          type="button"
          className="lab-icon-button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={onTogglePlay}
        >
          <Icon icon={playing ? PauseIcon : PlayIcon} />
        </button>
      </Tip>
      <span className="lab-time">{format(time)}</span>
      <div
        className="lab-scrub"
        ref={trackRef}
        role="slider"
        aria-label="Playhead"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={Number(time.toFixed(2))}
        aria-valuetext={format(time)}
        tabIndex={0}
        onPointerDown={event => begin(event, 'seek')}
        onKeyDown={event => nudge(event, 'seek')}
      >
        <span className="lab-scrub-rail" />
        <span className="lab-scrub-range" style={{ left: pct(trim[0]), width: pct(trim[1] - trim[0]) }} />
        <span className="lab-scrub-head" style={{ left: pct(time) }} />
        <span
          className="lab-trim lab-trim--start"
          style={{ left: pct(trim[0]) }}
          role="slider"
          tabIndex={0}
          aria-label="Trim start"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Number(trim[0].toFixed(2))}
          aria-valuetext={format(trim[0])}
          data-active={active === 'start' || undefined}
          onPointerDown={event => begin(event, 'start')}
          onKeyDown={event => nudge(event, 'start')}
        />
        <span
          className="lab-trim lab-trim--end"
          style={{ left: pct(trim[1]) }}
          role="slider"
          tabIndex={0}
          aria-label="Trim end"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Number(trim[1].toFixed(2))}
          aria-valuetext={format(trim[1])}
          data-active={active === 'end' || undefined}
          onPointerDown={event => begin(event, 'end')}
          onKeyDown={event => nudge(event, 'end')}
        />
      </div>
      <span className="lab-time lab-time--muted">{format(trim[1] - trim[0])}</span>
      {children}
    </div>
  );
}
