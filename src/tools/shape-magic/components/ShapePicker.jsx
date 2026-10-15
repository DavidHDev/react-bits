import { useEffect, useRef } from 'react';
import { TextIcon, Upload04Icon } from '@hugeicons/core-free-icons';
import { Icon } from '../../../tools/background-studio/components/ui';
import { PRIMITIVES } from '../engine/primitives';

export default function ShapePicker({ thumbs, onPick, onText, onLogo, onClose, placement = 'below' }) {
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
    <div className="smg-picker" data-placement={placement} ref={rootRef} role="menu">
      <div className="smg-picker-grid">
        {PRIMITIVES.map(primitive => (
          <button
            key={primitive.id}
            type="button"
            role="menuitem"
            className="smg-picker-item"
            title={primitive.name}
            onClick={() => onPick(primitive.id)}
          >
            <span className="smg-picker-thumb">
              {thumbs[`shape:${primitive.id}`] && (
                <img src={thumbs[`shape:${primitive.id}`]} alt="" draggable={false} />
              )}
            </span>
            <span className="smg-picker-name">{primitive.name}</span>
          </button>
        ))}
      </div>
      <div className="smg-picker-actions">
        <button type="button" role="menuitem" className="lab-menu-item" onClick={onText}>
          <Icon icon={TextIcon} />
          <span>Text</span>
        </button>
        <button type="button" role="menuitem" className="lab-menu-item" onClick={onLogo}>
          <Icon icon={Upload04Icon} />
          <span>Your logo</span>
        </button>
      </div>
    </div>
  );
}
