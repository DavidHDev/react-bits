import { createContext, useContext, useEffect, useRef } from 'react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '../../background-studio/components/ui';
import { useScrollEdges } from '../../background-studio/hooks/useScrollEdges';
import PreviewSelect from '../../../components/common/Preview/PreviewSelect';
import { PRESET_GROUPS, PRESETS } from '../presets/index';
import { MOTION_KINDS } from '../engine/scene';

const matches = (query, fields) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fields.filter(Boolean).join(' ').toLowerCase();
  return words.every(word => text.includes(word));
};

export function PresetSearch({ value, onChange, inputRef }) {
  return (
    <label className="bs-search lab-search">
      <Icon icon={Search01Icon} size={15} />
      <input
        ref={inputRef}
        value={value}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape' && value) {
            event.stopPropagation();
            onChange('');
          }
        }}
        placeholder={`Search ${PRESETS.length} presets`}
        aria-label="Search presets"
        spellCheck={false}
        autoComplete="off"
      />
    </label>
  );
}

const deviceWords = preset => preset.doc.devices?.map(device => device.type).join(' ');

const motionWords = preset => {
  const kind = preset.doc.motion?.kind;
  return kind ? `${kind} ${MOTION_KINDS.find(item => item.value === kind)?.label || ''}` : '';
};

const FILTERS = [
  { value: 'all', label: 'All presets' },
  ...PRESET_GROUPS.map(({ id, label }) => ({ value: id, label }))
];

export function PresetFilter({ value, onChange }) {
  return <PreviewSelect title="Show" options={FILTERS} value={value} onChange={onChange} />;
}

const ScrollRoot = createContext(null);

const observers = new Map();

const observeNear = (root, element, onNear) => {
  let entry = observers.get(root);
  if (!entry) {
    const callbacks = new Map();
    const observer = new IntersectionObserver(
      records =>
        records.forEach(record => {
          if (!record.isIntersecting) return;
          const callback = callbacks.get(record.target);
          callbacks.delete(record.target);
          observer.unobserve(record.target);
          callback?.();
        }),
      { root, rootMargin: '300px 0px' }
    );
    entry = { observer, callbacks };
    observers.set(root, entry);
  }
  entry.callbacks.set(element, onNear);
  entry.observer.observe(element);
  return () => {
    entry.callbacks.delete(element);
    entry.observer.unobserve(element);
  };
};

function PresetTile({ preset, thumb, active, onApply, onNeed }) {
  const ref = useRef(null);
  const root = useContext(ScrollRoot);

  useEffect(() => {
    const element = ref.current;
    if (!element || !onNeed) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      onNeed(preset.id);
      return undefined;
    }
    return observeNear(root?.current || null, element, () => onNeed(preset.id));
  }, [preset.id, onNeed, root]);

  return (
    <button ref={ref} type="button" className="lab-tile cst-tile" aria-pressed={active} onClick={() => onApply(preset)}>
      <span className="lab-tile-media cst-tile-media">
        {thumb ? <img src={thumb} alt="" draggable={false} decoding="async" /> : <span className="lab-tile-wait" />}
      </span>
      <span className="lab-tile-name">{preset.name}</span>
    </button>
  );
}

export function PresetGrid({ thumbs, active, onApply, onNeed, query = '', group: only = 'all' }) {
  const sections = PRESET_GROUPS.map(group => {
    if (only !== 'all' && group.id !== only) return null;
    const presets = PRESETS.filter(
      preset =>
        preset.group === group.id &&
        matches(query, [
          preset.name,
          group.label,
          deviceWords(preset),
          motionWords(preset),
          preset.doc.background?.kind,
          preset.tags
        ])
    );
    if (!presets.length) return null;
    return (
      <section className="lab-group" key={group.id}>
        <h3 className="lab-group-title">{group.label}</h3>
        <div className="lab-grid">
          {presets.map(preset => (
            <PresetTile
              key={preset.id}
              preset={preset}
              thumb={thumbs[preset.id]}
              active={active === preset.id}
              onApply={onApply}
              onNeed={onNeed}
            />
          ))}
        </div>
      </section>
    );
  });
  return sections.some(Boolean) ? (
    sections
  ) : (
    <p className="lab-empty lab-empty--search">No presets match “{query.trim()}”.</p>
  );
}

export function GalleryScroll({ children }) {
  const scrollRef = useRef(null);
  const edges = useScrollEdges(scrollRef);
  return (
    <div className="lab-scroll-shell" data-top={edges.top ? '' : undefined} data-bottom={edges.bottom ? '' : undefined}>
      <div className="lab-scroll" ref={scrollRef}>
        <ScrollRoot.Provider value={scrollRef}>{children}</ScrollRoot.Provider>
      </div>
    </div>
  );
}
