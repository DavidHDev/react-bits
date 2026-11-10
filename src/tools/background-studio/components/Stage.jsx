import { forwardRef, memo, useLayoutEffect, useMemo, useRef } from 'react';
import BackgroundContent from '../../../components/common/Preview/BackgroundContent';
import PreviewStageContext from '../../../components/common/Preview/PreviewStageContext';

const noop = () => {};
const FADE_MS = 320;

const Stage = forwardRef(function Stage({ frame, mode, onModeChange, onNarrowChange, onRetry }, ref) {
  const { iframeRef, src, status, error, paused } = frame;
  const spinnerRef = useRef(null);
  const busy = status === 'loading' || status === 'booting';

  useLayoutEffect(() => {
    const spinner = spinnerRef.current;
    if (!spinner) return undefined;
    if (busy) {
      spinner.removeAttribute('data-idle');
      return undefined;
    }
    const timer = setTimeout(() => spinner.setAttribute('data-idle', ''), FADE_MS);
    return () => clearTimeout(timer);
  }, [busy]);

  const stage = useMemo(
    () => ({
      controls: null,
      hasControls: true,
      demo: { mode, setMode: onModeChange, setNarrow: onNarrowChange, setPresent: noop }
    }),
    [mode, onModeChange, onNarrowChange]
  );

  const content = useMemo(
    () => (
      <PreviewStageContext.Provider value={stage}>
        <BackgroundContent />
      </PreviewStageContext.Provider>
    ),
    [stage]
  );

  return (
    <div className="demo-container bs-stage" ref={ref} data-status={status}>
      <iframe ref={iframeRef} src={src} className="bs-frame" title="Background preview" allow="fullscreen" />
      {content}
      <div className="bs-overlay bs-loading" aria-hidden={status !== 'loading'}>
        <span className="bs-spinner" ref={spinnerRef} />
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

export default memo(Stage);
