import {
  Camera01Icon,
  Download04Icon,
  FullScreenIcon,
  Link04Icon,
  PauseIcon,
  PlayIcon,
  RepeatIcon
} from '@hugeicons/core-free-icons';
import { Icon, Tip, Track } from './ui';

const Action = ({ label, hint, icon, onClick, disabled }) => (
  <Tip label={label} hint={hint} placement="bottom">
    <button
      type="button"
      className="docs-segment docs-segment--icon"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon icon={icon} />
    </button>
  </Tip>
);

export default function StageToolbar({
  picker,
  mode,
  modes,
  onModeChange,
  paused,
  disabled,
  onTogglePause,
  onRestart,
  onSnapshot,
  onFullscreen,
  onCopyLink,
  onExport
}) {
  return (
    <div className="docs-toolbar bs-toolbar">
      <div className="bs-toolbar-group bs-toolbar-start">
        {picker}
        <Track
          label="Preview content"
          value={mode}
          options={modes}
          onChange={onModeChange}
          iconOnly
          placement="bottom"
        />
      </div>

      <div className="bs-toolbar-group">
        <div className="docs-track bs-actions" role="group" aria-label="Preview controls">
          <Action
            label={paused ? 'Play' : 'Pause'}
            hint="Space"
            icon={paused ? PlayIcon : PauseIcon}
            onClick={onTogglePause}
            disabled={disabled}
          />
          <Action label="Replay intro" hint="R" icon={RepeatIcon} onClick={onRestart} disabled={disabled} />
          <Action label="Save snapshot" hint="S" icon={Camera01Icon} onClick={onSnapshot} disabled={disabled} />
          <Action label="Fullscreen" hint="F" icon={FullScreenIcon} onClick={onFullscreen} />
        </div>

        <Tip label="Copy link" placement="bottom">
          <button
            type="button"
            className="docs-tool docs-tool--icon bs-link"
            aria-label="Copy link"
            onClick={onCopyLink}
          >
            <Icon icon={Link04Icon} />
          </button>
        </Tip>

        <Tip label="Code, image or video" hint="E" placement="bottom">
          <button type="button" className="bs-export" onClick={onExport}>
            <Icon icon={Download04Icon} />
            <span>Export</span>
          </button>
        </Tip>
      </div>
    </div>
  );
}
