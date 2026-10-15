import { useEffect, useRef, useState } from 'react';
import {
  Download04Icon,
  KeyboardIcon,
  Magnet01Icon,
  PauseIcon,
  PlayIcon,
  PlusSignIcon,
  TextIcon,
  Upload04Icon
} from '@hugeicons/core-free-icons';
import { Icon, Tip } from '../../../tools/background-studio/components/ui';
import ShapePicker from './ShapePicker';

const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const CMD = MAC ? '⌘' : 'Ctrl ';
const ALT = MAC ? '⌥' : 'Alt ';

const SHORTCUTS = [
  {
    title: 'Select',
    items: [
      ['Add to selection', '⇧ click'],
      ['Select several', 'Drag on empty space'],
      ['Select all', `${CMD}A`],
      ['Edit text', 'Double-click']
    ]
  },
  {
    title: 'Move and shape',
    items: [
      ['Nudge', 'Arrows, ⇧ for more'],
      ['Move in a straight line', '⇧ while dragging'],
      ['Skip snapping', `Hold ${CMD}`],
      ['Rotate in 15° steps', '⇧ while rotating'],
      ['Duplicate while dragging', `Hold ${ALT}`]
    ]
  },
  {
    title: 'Arrange',
    items: [
      ['Align left, center, right', `${ALT}A  ${ALT}H  ${ALT}D`],
      ['Align top, middle, bottom', `${ALT}W  ${ALT}V  ${ALT}S`],
      ['Flip', '⇧H  ⇧V'],
      ['Forward, backward', `${CMD}]  ${CMD}[`],
      ['To front, to back', `⇧${CMD}]  ⇧${CMD}[`],
      ['Hide', `⇧${CMD}H`]
    ]
  },
  {
    title: 'Edit',
    items: [
      ['Copy, cut, paste', `${CMD}C  ${CMD}X  ${CMD}V`],
      ['Duplicate', `${CMD}D`],
      ['Delete', '⌫'],
      ['Undo, redo', `${CMD}Z  ⇧${CMD}Z`],
      ['Add text', 'T'],
      ['Upload a logo', `${CMD}O`],
      ['Play or pause', 'Space'],
      ['Export', 'E']
    ]
  }
];

function Shortcuts({ onClose }) {
  const rootRef = useRef(null);
  useEffect(() => {
    const onPointer = event => {
      if (!rootRef.current?.contains(event.target) && !event.target.closest?.('[aria-expanded="true"]')) onClose();
    };
    const onKey = event => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="smg-shortcuts" ref={rootRef} role="dialog" aria-label="Keyboard shortcuts">
      {SHORTCUTS.map(group => (
        <section key={group.title} className="smg-shortcuts-group">
          <h3>{group.title}</h3>
          {group.items.map(([label, keys]) => (
            <div key={label} className="smg-shortcut">
              <span>{label}</span>
              <kbd>{keys}</kbd>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

export default function Toolbar({
  thumbs,
  canPlay,
  playing,
  snapping,
  onToggleSnapping,
  onTogglePlay,
  onUpload,
  onAddShape,
  onAddText,
  onExport
}) {
  const [picking, setPicking] = useState(false);
  const [helping, setHelping] = useState(false);
  return (
    <div className="docs-toolbar lab-toolbar smg-toolbar">
      <div className="lab-toolbar-group lab-toolbar-start">
        <Tip label="Upload an SVG or PNG logo" hint={`${CMD}O`} placement="bottom">
          <button type="button" className="docs-tool lab-upload" aria-label="Upload a logo" onClick={onUpload}>
            <Icon icon={Upload04Icon} />
            <span>Upload logo</span>
          </button>
        </Tip>
        <div className="lab-menu-root">
          <button
            type="button"
            className="docs-tool smg-tool"
            aria-haspopup="menu"
            aria-expanded={picking}
            onClick={() => setPicking(value => !value)}
          >
            <Icon icon={PlusSignIcon} />
            <span>Shape</span>
          </button>
          {picking && (
            <ShapePicker
              thumbs={thumbs}
              onPick={type => {
                setPicking(false);
                onAddShape(type);
              }}
              onText={() => {
                setPicking(false);
                onAddText();
              }}
              onLogo={() => {
                setPicking(false);
                onUpload();
              }}
              onClose={() => setPicking(false)}
            />
          )}
        </div>
        <Tip label="Add text" hint="T" placement="bottom">
          <button type="button" className="docs-tool smg-tool" aria-label="Add text" onClick={onAddText}>
            <Icon icon={TextIcon} />
            <span>Text</span>
          </button>
        </Tip>
      </div>
      <div className="lab-toolbar-group">
        <div className="docs-track bs-actions" role="group" aria-label="Editor">
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
          <Tip label={snapping ? 'Snapping on' : 'Snapping off'} hint={`Hold ${CMD} to skip`} placement="bottom">
            <button
              type="button"
              className="docs-segment docs-segment--icon smg-snap"
              aria-label="Snapping"
              aria-pressed={snapping}
              onClick={onToggleSnapping}
            >
              <Icon icon={Magnet01Icon} />
            </button>
          </Tip>
        </div>
        <div className="lab-menu-root">
          <Tip label="Shortcuts" placement="bottom">
            <button
              type="button"
              className="docs-tool docs-tool--icon"
              aria-label="Keyboard shortcuts"
              aria-expanded={helping}
              onClick={() => setHelping(value => !value)}
            >
              <Icon icon={KeyboardIcon} />
            </button>
          </Tip>
          {helping && <Shortcuts onClose={() => setHelping(false)} />}
        </div>
        <Tip label="SVG, PNG, favicon, video or code" hint="E" placement="bottom">
          <button type="button" className="bs-export" onClick={onExport}>
            <Icon icon={Download04Icon} />
            <span>Export</span>
          </button>
        </Tip>
      </div>
    </div>
  );
}
