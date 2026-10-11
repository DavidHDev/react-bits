import { useContext } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { ReloadIcon } from '@hugeicons/core-free-icons';

import PreviewStageContext from './PreviewStageContext';

const RefreshButton = ({ onClick }) => {
  const stage = useContext(PreviewStageContext);
  const button = (
    <button type="button" className="docs-refresh" onClick={onClick} aria-label="Refresh animation">
      <HugeiconsIcon icon={ReloadIcon} size={16} strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
  if (!stage?.hasControls) return button;
  return stage.controls ? createPortal(button, stage.controls) : null;
};

export default RefreshButton;
