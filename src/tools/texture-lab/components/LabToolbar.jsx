import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown01Icon,
  Download04Icon,
  FullScreenIcon,
  Image01Icon,
  PauseIcon,
  PlayIcon,
  RecordIcon,
  SplitIcon,
  StopIcon,
  Upload04Icon,
  Video01Icon,
  WebcamIcon
} from '@hugeicons/core-free-icons';
import { Icon, Tip, Track } from '../../background-studio/components/ui';
import { SAMPLES } from '../media';

const ZOOMS = [
  { value: 'fit', label: 'Fit' },
  { value: 'actual', label: '100%' }
];

function MediaMenu({ media, onUpload, onCamera, onSample }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = event => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = action => {
    setOpen(false);
    action();
  };

  return (
    <div className="lab-menu-root" ref={rootRef}>
      <button
        type="button"
        className="docs-tool lab-media-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <Icon icon={media?.kind === 'video' ? Video01Icon : media?.kind === 'camera' ? WebcamIcon : Image01Icon} />
        <span className="lab-media-name">{media ? (media.kind === 'camera' ? 'Camera' : media.name) : 'Media'}</span>
        <Icon icon={ArrowDown01Icon} size={14} />
      </button>
      {open && (
        <div className="lab-menu" role="menu">
          <button type="button" role="menuitem" className="lab-menu-item" onClick={() => choose(onUpload)}>
            <Icon icon={Upload04Icon} />
            <span>Upload image or video</span>
            <kbd className="bs-kbd">⌘O</kbd>
          </button>
          <button type="button" role="menuitem" className="lab-menu-item" onClick={() => choose(onCamera)}>
            <Icon icon={WebcamIcon} />
            <span>Use camera</span>
          </button>
          <span className="lab-menu-label">Samples</span>
          {SAMPLES.map(sample => (
            <button
              key={sample.id}
              type="button"
              role="menuitem"
              className="lab-menu-item"
              onClick={() => choose(() => onSample(sample))}
            >
              <Icon icon={sample.kind === 'video' ? Video01Icon : Image01Icon} />
              <span>{sample.kind === 'video' ? `${sample.label} video` : `${sample.label} photo`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LabToolbar({
  media,
  playing,
  canPlay,
  zoom,
  recording,
  onUpload,
  onCamera,
  onSample,
  onZoom,
  onCompare,
  onTogglePlay,
  onRecord,
  onFullscreen,
  onExport
}) {
  const hold = event => {
    event.preventDefault();
    onCompare(true);
    const release = () => {
      onCompare(false);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  };

  return (
    <div className="docs-toolbar lab-toolbar">
      <div className="lab-toolbar-group lab-toolbar-start">
        <Tip label="Upload an image or video" hint="⌘O" placement="bottom">
          <button
            type="button"
            className="docs-tool lab-upload"
            aria-label="Upload an image or video"
            onClick={onUpload}
          >
            <Icon icon={Upload04Icon} />
            <span>Upload</span>
          </button>
        </Tip>
        <MediaMenu media={media} onUpload={onUpload} onCamera={onCamera} onSample={onSample} />
        <Track label="Zoom" value={zoom} options={ZOOMS} onChange={onZoom} className="lab-zoom" placement="bottom" />
      </div>
      <div className="lab-toolbar-group">
        <div className="docs-track bs-actions" role="group" aria-label="Preview controls">
          <Tip label="Hold to compare" hint="C" placement="bottom">
            <button
              type="button"
              className="docs-segment docs-segment--icon"
              aria-label="Hold to compare"
              onPointerDown={hold}
            >
              <Icon icon={SplitIcon} />
            </button>
          </Tip>
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
          {media?.kind === 'camera' && (
            <Tip label={recording ? 'Stop recording' : 'Record'} hint="R" placement="bottom">
              <button
                type="button"
                className="docs-segment docs-segment--icon lab-record"
                data-recording={recording ? '' : undefined}
                aria-label={recording ? 'Stop recording' : 'Record'}
                onClick={onRecord}
              >
                <Icon icon={recording ? StopIcon : RecordIcon} />
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
        <Tip label="Image, video, GIF or style" hint="E" placement="bottom">
          <button type="button" className="bs-export" onClick={onExport} disabled={!media}>
            <Icon icon={Download04Icon} />
            <span>Export</span>
          </button>
        </Tip>
      </div>
    </div>
  );
}
