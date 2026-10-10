import { HugeiconsIcon } from '@hugeicons/react';
import { ReloadIcon } from '@hugeicons/core-free-icons';

const RefreshButton = ({ onClick }) => (
  <button type="button" className="docs-refresh" onClick={onClick} aria-label="Refresh animation">
    <HugeiconsIcon icon={ReloadIcon} size={16} strokeWidth={1.6} aria-hidden="true" />
  </button>
);

export default RefreshButton;
