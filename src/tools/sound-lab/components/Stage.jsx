import { forwardRef } from 'react';
import { Download04Icon, KeyboardIcon } from '@hugeicons/core-free-icons';
import { Icon, Tip } from '../../background-studio/components/ui';
import Orb from './Orb';

const QUIET_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape', 'Fn', 'OS']);

function TypeField({ sound, onType }) {
  return (
    <label className="bs-search snd-type">
      <Icon icon={KeyboardIcon} size={16} />
      <input
        placeholder={`Type to hear ${sound.name}`}
        aria-label={`Type to hear ${sound.name}`}
        spellCheck={false}
        autoComplete="off"
        onKeyDown={event => {
          if (event.repeat || event.metaKey || event.ctrlKey || QUIET_KEYS.has(event.key)) return;
          onType(sound.id);
          if (event.key === 'Enter') event.currentTarget.value = '';
        }}
      />
    </label>
  );
}

const Stage = forwardRef(function Stage({ sound, player, onPlay, onType, onExport }, ref) {
  return (
    <div className="lab-stage snd-stage" ref={ref} data-library={sound.library}>
      <div className="snd-view">
        <header className="snd-head">
          <div className="snd-heading">
            <h2 className="snd-title">{sound.name}</h2>
            <p className="snd-desc">{sound.description}</p>
          </div>
          <Tip label="Code or audio file" hint="E" placement="bottom">
            <button type="button" className="bs-export snd-export" onClick={() => onExport(null)}>
              <Icon icon={Download04Icon} />
              <span>Export</span>
            </button>
          </Tip>
        </header>
        <div className="snd-center">
          <button type="button" className="snd-orb" onClick={() => onPlay(sound.id)} aria-label={`Play ${sound.name}`}>
            <Orb player={player} />
          </button>
        </div>
        {sound.category === 'type' ? (
          <TypeField sound={sound} onType={onType} />
        ) : (
          <button type="button" className="snd-play" onClick={() => onPlay(sound.id)}>
            Play
          </button>
        )}
      </div>
    </div>
  );
});

export default Stage;
