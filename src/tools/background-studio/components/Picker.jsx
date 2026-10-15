import { useEffect, useRef, useState } from 'react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import BackgroundList from './BackgroundList';
import { Icon } from './ui';

const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

export default function Picker({ entry, light, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="bs-picker" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="docs-tool bs-picker-button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(value => !value)}
      >
        <span className="bs-picker-name">{entry.label}</span>
        <Icon icon={ArrowDown01Icon} size={14} />
      </button>
      {open && <div className="bs-picker-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />}
      {open && (
        <div className="bs-picker-panel" role="dialog" aria-label="Choose a background">
          <BackgroundList
            activeId={entry.id}
            light={light}
            autoFocus={finePointer()}
            onEscape={() => setOpen(false)}
            onSelect={id => {
              onSelect(id);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
