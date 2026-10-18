import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown01Icon,
  Download04Icon,
  FullScreenIcon,
  PauseIcon,
  PlayIcon,
  ScreenShareIcon,
  Upload04Icon
} from '@hugeicons/core-free-icons';
import { Icon, Tip } from '../../background-studio/components/ui';
import { ASPECTS } from '../engine/scene';

const Frame = ({ ratio }) => {
  const w = ratio >= 1 ? 16 : Math.round(16 * ratio);
  const h = ratio >= 1 ? Math.round(16 / ratio) : 16;
  return <span className="cst-aspect-shape" style={{ width: w, height: h }} aria-hidden="true" />;
};

function AspectMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = ASPECTS.find(item => item.value === value) || ASPECTS[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = event => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="lab-menu-root" ref={rootRef}>
      <button
        type="button"
        className="docs-tool cst-aspect-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(previous => !previous)}
      >
        <Frame ratio={current.ratio} />
        <span>{current.value}</span>
        <Icon icon={ArrowDown01Icon} size={14} />
      </button>
      {open && (
        <div className="lab-menu cst-aspect-menu" role="menu">
          <span className="lab-menu-label">Shot size</span>
          {ASPECTS.map(item => (
            <button
              key={item.value}
              type="button"
              role="menuitemradio"
              aria-checked={item.value === value}
              className="lab-menu-item"
              onClick={() => {
                setOpen(false);
                onChange(item.value);
              }}
            >
              <span className="cst-aspect-icon">
                <Frame ratio={item.ratio} />
              </span>
              <span>{item.hint}</span>
              <em className="cst-menu-meta">{item.value}</em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Toolbar({
  aspect,
  onAspect,
  playing,
  canPlay,
  onUpload,
  onUploadHint,
  canCapture,
  capturing,
  onCapture,
  onTogglePlay,
  onFullscreen,
  onExport
}) {
  return (
    <div className="docs-toolbar lab-toolbar cst-toolbar">
      <div className="lab-toolbar-group lab-toolbar-start">
        <Tip label="Upload a screenshot or recording" hint="⌘O" placement="bottom">
          <button
            type="button"
            className="docs-tool lab-upload"
            aria-label="Upload a screenshot or recording"
            onClick={onUpload}
            onPointerEnter={() => onUploadHint?.(true)}
            onPointerLeave={() => onUploadHint?.(false)}
            onFocus={() => onUploadHint?.(true)}
            onBlur={() => onUploadHint?.(false)}
          >
            <Icon icon={Upload04Icon} />
            <span>Upload</span>
          </button>
        </Tip>
        {canCapture && (
          <Tip label="Capture a website or an open tab" placement="bottom">
            <button
              type="button"
              className="docs-tool lab-upload cst-capture-button"
              aria-label="Capture a website or an open tab"
              aria-haspopup="dialog"
              data-state={capturing ? 'open' : undefined}
              onClick={onCapture}
              onPointerEnter={() => onUploadHint?.(true)}
              onPointerLeave={() => onUploadHint?.(false)}
              onFocus={() => onUploadHint?.(true)}
              onBlur={() => onUploadHint?.(false)}
            >
              <Icon icon={ScreenShareIcon} />
              <span>Capture</span>
            </button>
          </Tip>
        )}
        <AspectMenu value={aspect} onChange={onAspect} />
      </div>
      <div className="lab-toolbar-group">
        <div className="docs-track bs-actions" role="group" aria-label="Preview controls">
          {canPlay && (
            <Tip label={playing ? 'Pause' : 'Play'} hint="Space" placement="bottom">
              <button
                type="button"
                className="docs-segment docs-segment--icon"
                aria-label={playing ? 'Pause' : 'Play'}
                onClick={onTogglePlay}
              >
                <Icon icon={playing ? PauseIcon : PlayIcon} />
              </button>
            </Tip>
          )}
          <Tip label="Fullscreen" hint="F" placement="bottom">
            <button
              type="button"
              className="docs-segment docs-segment--icon"
              aria-label="Fullscreen"
              onClick={onFullscreen}
            >
              <Icon icon={FullScreenIcon} />
            </button>
          </Tip>
        </div>
        <Tip label="Image, video, GIF or link" hint="E" placement="bottom">
          <button type="button" className="bs-export" onClick={onExport}>
            <Icon icon={Download04Icon} />
            <span>Export</span>
          </button>
        </Tip>
      </div>
    </div>
  );
}
