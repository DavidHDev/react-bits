import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { Image01Icon, Upload04Icon, Video01Icon, WebcamIcon } from '@hugeicons/core-free-icons';
import { Icon } from '../../background-studio/components/ui';
import { SAMPLES } from '../media';

const LabStage = forwardRef(function LabStage(
  { canvasRef, media, zoom, padding = 32, loading, error, comparing, dropping, hint, onUpload, onCamera, onSample },
  ref
) {
  const viewRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view) return undefined;
    const measure = () => setBox({ width: view.clientWidth, height: view.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    return () => observer.disconnect();
  }, []);

  const pad = padding;
  const hintSpace = hint ? 40 : 0;
  let width = 0;
  let height = 0;
  if (media && box.width) {
    if (zoom === 'actual') {
      const ratio = window.devicePixelRatio || 1;
      width = media.width / ratio;
      height = media.height / ratio;
    } else {
      const scale = Math.min((box.width - pad) / media.width, (box.height - pad - hintSpace) / media.height);
      width = Math.max(1, Math.floor(media.width * scale));
      height = Math.max(1, Math.floor(media.height * scale));
    }
  }

  return (
    <div
      className="lab-stage"
      ref={ref}
      data-zoom={zoom}
      style={media ? { '--lab-aspect': media.width / media.height } : undefined}
      data-dragging={dropping ? '' : undefined}
    >
      <div className="lab-view" ref={viewRef}>
        <div
          className="lab-canvas-wrap"
          style={{ width, height, marginBottom: hintSpace || undefined, visibility: media ? 'visible' : 'hidden' }}
        >
          <canvas ref={canvasRef} className="lab-canvas" />
          {comparing && <span className="lab-badge">Original</span>}
        </div>
      </div>

      {!media && !loading && (
        <div className="lab-empty-state">
          <p className="lab-empty-title">Drop an image or video</p>
          <p className="lab-empty-text">PNG, JPG, WebP, MP4, WebM or MOV. Everything stays in your browser.</p>
          <div className="lab-empty-actions">
            <button type="button" className="bs-export" onClick={onUpload}>
              <Icon icon={Upload04Icon} />
              <span>Open a file</span>
            </button>
            <button type="button" className="docs-tool" onClick={onCamera}>
              <Icon icon={WebcamIcon} />
              Use camera
            </button>
          </div>
          <div className="lab-empty-samples">
            {SAMPLES.map(sample => (
              <button key={sample.id} type="button" className="lab-sample" onClick={() => onSample(sample)}>
                <Icon icon={sample.kind === 'video' ? Video01Icon : Image01Icon} size={14} />
                {sample.kind === 'video' ? `${sample.label} video` : `${sample.label} photo`}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="lab-overlay">
          <span className="bs-spinner" />
        </div>
      )}
      {error && !loading && (
        <div className="lab-overlay lab-error" role="alert">
          <p>{error}</p>
        </div>
      )}
      {hint && media && !loading && !dropping && (
        <button type="button" className="lab-hint" onClick={onUpload}>
          <Icon icon={Upload04Icon} size={14} />
          <span>Drop, paste or upload your own photo or video</span>
        </button>
      )}
      {dropping && (
        <div className="lab-drop">
          <span>Drop to open</span>
        </div>
      )}
    </div>
  );
});

export default LabStage;
