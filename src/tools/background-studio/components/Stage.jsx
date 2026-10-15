import { forwardRef, useMemo } from 'react';
import BackgroundContent from '../../../components/common/Preview/BackgroundContent';
import PreviewStageContext from '../../../components/common/Preview/PreviewStageContext';

const noop = () => {};

const Stage = forwardRef(function Stage({ frame, mode, onModeChange, onNarrowChange, onRetry }, ref) {
  const { iframeRef, src, status, error, paused } = frame;

  const stage = useMemo(
    () => ({
      controls: null,
      hasControls: true,
      demo: { mode, setMode: onModeChange, setNarrow: onNarrowChange, setPresent: noop }
    }),
    [mode, onModeChange, onNarrowChange]
  );

  return (
    <div className="demo-container bs-stage" ref={ref} data-status={status}>
      <iframe ref={iframeRef} src={src} className="bs-frame" title="Background preview" allow="fullscreen" />
      <PreviewStageContext.Provider value={stage}>
        <BackgroundContent />
      </PreviewStageContext.Provider>
      <div className="bs-overlay bs-loading" aria-hidden={status !== 'loading'}>
        <span className="bs-spinner" />
      </div>
      {status === 'error' && (
        <div className="bs-overlay bs-error" role="alert">
          <p>This background could not start here.</p>
          {error?.message && <p className="bs-error-detail">{error.message}</p>}
          <button type="button" className="docs-tool" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
      {paused && status !== 'error' && <span className="bs-overlay bs-paused">Paused</span>}
    </div>
  );
});

export default Stage;
