import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cancel01Icon, Image01Icon, SourceCodeIcon, Video01Icon } from '@hugeicons/core-free-icons';
import CodeExport from './CodeExport';
import MediaExport from './MediaExport';
import { Icon, Track } from './ui';

const TABS = [
  { value: 'code', label: 'Code', icon: SourceCodeIcon },
  { value: 'image', label: 'Image', icon: Image01Icon },
  { value: 'video', label: 'Video', icon: Video01Icon }
];

let rememberedTab = null;

export default function ExportDialog({ initialTab, state, stageSize, onClose }) {
  const [tab, setTabState] = useState(() => rememberedTab || initialTab);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;

  const setTab = value => {
    rememberedTab = value;
    setTabState(value);
  };

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = event => {
      if (event.key !== 'Escape' || busyRef.current) return;
      if (event.target?.closest?.('[data-scope="menu"], [role="menu"], [role="listbox"]')) return;
      event.stopPropagation();
      closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous && typeof previous.focus === 'function') previous.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div
      className="bs-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="bs-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bs-export-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="bs-dialog-head">
          <h2 id="bs-export-title" className="bs-dialog-title">
            Export {state.entry.label}
          </h2>
          <Track
            label="Export as"
            value={tab}
            options={TABS.map(item => ({ ...item, disabled: busy && item.value !== tab }))}
            onChange={setTab}
          />
          <button
            type="button"
            className="docs-tool bs-dialog-close"
            aria-label="Close"
            onClick={onClose}
            disabled={busy}
          >
            <Icon icon={Cancel01Icon} />
          </button>
        </header>
        <div className="bs-dialog-body">
          {tab === 'code' ? (
            <CodeExport state={state} />
          ) : (
            <MediaExport key={tab} kind={tab} state={state} stageSize={stageSize} onBusyChange={setBusy} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
