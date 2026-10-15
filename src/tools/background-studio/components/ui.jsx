import { useLayoutEffect, useRef, useState } from 'react';
import { Portal, Tooltip } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';

export const Icon = ({ icon, size = 16 }) => (
  <HugeiconsIcon icon={icon} size={size} strokeWidth={1.6} aria-hidden="true" />
);

export const Tip = ({ label, hint, placement = 'top', children }) => (
  <Tooltip.Root openDelay={300} closeDelay={80} positioning={{ placement, gutter: 8 }}>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Portal>
      <Tooltip.Positioner>
        <Tooltip.Content className="docs-tooltip bs-tooltip">
          {label}
          {hint && <kbd className="bs-kbd">{hint}</kbd>}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Portal>
  </Tooltip.Root>
);

export const Track = ({ label, value, options, onChange, iconOnly = false, className = '', placement = 'top' }) => {
  const trackRef = useRef(null);
  const [pill, setPill] = useState(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const measure = () => {
      const active = track.querySelector('[aria-pressed="true"]');
      setPill(previous => {
        if (!active) return null;
        const next = { x: active.offsetLeft, width: active.offsetWidth, ready: Boolean(previous) };
        return previous && previous.x === next.x && previous.width === next.width ? previous : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [value, options]);

  return (
    <div className={`docs-track bs-track ${className}`} role="group" aria-label={label} ref={trackRef} data-pill="">
      <span
        className="docs-pill"
        aria-hidden="true"
        data-ready={pill?.ready ? '' : undefined}
        style={pill ? { width: pill.width, transform: `translateX(${pill.x}px)` } : { opacity: 0 }}
      />
      {options.map(option => {
        const button = (
          <button
            key={option.value}
            type="button"
            className={`docs-segment${iconOnly ? ' docs-segment--icon' : ''}`}
            aria-label={iconOnly ? option.label : undefined}
            aria-pressed={value === option.value}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            {option.icon && <Icon icon={option.icon} />}
            {!iconOnly && option.label}
          </button>
        );
        return iconOnly ? (
          <Tip key={option.value} label={option.label} placement={placement}>
            {button}
          </Tip>
        ) : (
          button
        );
      })}
    </div>
  );
};
