import { useEffect, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { MIN_PREVIEW_WIDTH } from '../../../hooks/usePreviewFrame';

const INDICATOR_MS = 2000;
const KEY_STEP = 10;
const KEY_STEP_LARGE = 50;
const HANDLE_INSET = 32;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const PreviewStage = ({ frame, visible }) =>
  frame ? (
    <div
      className="preview-stage"
      aria-hidden="true"
      data-visible={visible ? '' : undefined}
      style={{ top: frame.top, left: frame.left, width: frame.fullWidth, height: frame.height }}
    />
  ) : null;

const PreviewResizer = ({ frame, width, onWidthChange, onResizingChange }) => {
  const [dragging, setDragging] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const drag = useRef(null);
  const hideTimer = useRef(0);
  const lastWidth = useRef(width);

  useEffect(() => {
    if (lastWidth.current === width) return undefined;
    lastWidth.current = width;
    if (width === null) {
      setShowIndicator(false);
      return undefined;
    }
    setShowIndicator(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowIndicator(false), INDICATOR_MS);
    return undefined;
  }, [width]);

  useEffect(
    () => () => {
      clearTimeout(hideTimer.current);
      delete document.documentElement.dataset.previewResizing;
    },
    []
  );

  if (!frame) return null;

  const current = width ?? frame.fullWidth;

  const commit = next => {
    const rounded = Math.round(clamp(next, MIN_PREVIEW_WIDTH, frame.fullWidth));
    onWidthChange(rounded >= frame.fullWidth ? null : rounded);
  };

  const finishDrag = event => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    onResizingChange(false);
    delete document.documentElement.dataset.previewResizing;
  };

  return (
    <>
      <div
        className="preview-resize-handle"
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label="Drag to resize preview"
        aria-valuemin={MIN_PREVIEW_WIDTH}
        aria-valuemax={frame.fullWidth}
        aria-valuenow={Math.round(current)}
        data-dragging={dragging ? '' : undefined}
        style={{
          top: frame.top + HANDLE_INSET,
          left: frame.left + current,
          height: Math.max(0, frame.height - HANDLE_INSET * 2)
        }}
        onPointerDown={event => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: event.pointerId, startX: event.clientX, startWidth: current };
          setDragging(true);
          onResizingChange(true);
          document.documentElement.dataset.previewResizing = '';
        }}
        onPointerMove={event => {
          if (drag.current?.id !== event.pointerId) return;
          commit(drag.current.startWidth + event.clientX - drag.current.startX);
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={finishDrag}
        onDoubleClick={() => onWidthChange(null)}
        onKeyDown={event => {
          const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
          const targets = {
            ArrowLeft: current - step,
            ArrowRight: current + step,
            Home: MIN_PREVIEW_WIDTH,
            End: frame.fullWidth
          };
          if (!(event.key in targets)) return;
          event.preventDefault();
          commit(targets[event.key]);
        }}
      >
        <span className="preview-resize-bar" />
        <GripVertical className="preview-resize-grip" aria-hidden="true" />
      </div>
      <div
        className="preview-width-indicator"
        aria-hidden="true"
        data-visible={dragging || (showIndicator && width !== null) ? '' : undefined}
        style={{ top: frame.top + frame.height, left: frame.left + frame.fullWidth / 2 }}
      >
        {Math.round(current)}px
      </div>
    </>
  );
};

export default PreviewResizer;
