import { useRef } from 'react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { CATEGORIES, EFFECT_LIST, EFFECTS } from '../effects';
import { LOOK_GROUPS, LOOKS } from '../looks';
import { Icon } from '../../background-studio/components/ui';
import { useScrollEdges } from '../../background-studio/hooks/useScrollEdges';

const matches = (query, fields) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fields.filter(Boolean).join(' ').toLowerCase();
  return words.every(word => text.includes(word));
};

const Empty = ({ query, kind }) => (
  <p className="lab-empty lab-empty--search">
    No {kind} match “{query.trim()}”.
  </p>
);

export function GallerySearch({ value, onChange, placeholder, inputRef }) {
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
        placeholder={placeholder}
        aria-label={placeholder}
        spellCheck={false}
        autoComplete="off"
      />
    </label>
  );
}

const Tile = ({ name, image, active, onClick, title }) => (
  <button type="button" className="lab-tile" aria-pressed={active} onClick={onClick} title={title}>
    <span className="lab-tile-media">
      {image ? <img src={image} alt="" draggable={false} /> : <span className="lab-tile-wait" />}
    </span>
    <span className="lab-tile-name">{name}</span>
  </button>
);

export function LooksGrid({ thumbs, activeLook, onApply, query = '' }) {
  const sections = LOOK_GROUPS.map(group => {
    const looks = LOOKS.filter(
      look =>
        look.group === group.id &&
        matches(query, [look.name, group.label, look.tags, ...look.layers.map(layer => EFFECTS[layer.type]?.name)])
    );
    if (!looks.length) return null;
    return (
      <section className="lab-group" key={group.id}>
        <h3 className="lab-group-title">{group.label}</h3>
        <div className="lab-grid">
          {looks.map(look => (
            <Tile
              key={look.id}
              name={look.name}
              image={thumbs[`look:${look.id}`]}
              active={activeLook === look.id}
              onClick={() => onApply(look)}
            />
          ))}
        </div>
      </section>
    );
  });
  return sections.some(Boolean) ? sections : <Empty query={query} kind="styles" />;
}

export function EffectsGrid({ thumbs, onAdd, query = '' }) {
  const sections = CATEGORIES.map(category => {
    const effects = EFFECT_LIST.filter(
      effect => effect.category === category.id && matches(query, [effect.name, effect.description, category.label])
    );
    if (!effects.length) return null;
    return (
      <section className="lab-group" key={category.id}>
        <h3 className="lab-group-title">{category.label}</h3>
        <div className="lab-grid">
          {effects.map(effect => (
            <Tile
              key={effect.id}
              name={effect.name}
              title={effect.description}
              image={thumbs[`fx:${effect.id}`]}
              active={false}
              onClick={() => onAdd(effect.id)}
            />
          ))}
        </div>
      </section>
    );
  });
  return sections.some(Boolean) ? sections : <Empty query={query} kind="effects" />;
}

export function GalleryScroll({ children }) {
  const scrollRef = useRef(null);
  const edges = useScrollEdges(scrollRef);
  return (
    <div className="lab-scroll-shell" data-top={edges.top ? '' : undefined} data-bottom={edges.bottom ? '' : undefined}>
      <div className="lab-scroll" ref={scrollRef}>
        {children}
      </div>
    </div>
  );
}
