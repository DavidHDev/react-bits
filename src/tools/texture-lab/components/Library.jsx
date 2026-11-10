import { memo, startTransition, useEffect, useState } from 'react';
import { CATEGORIES, EFFECT_LIST, EFFECTS } from '../effects';
import { LOOK_GROUPS, LOOKS } from '../looks';

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

const NONE = {};

const useThumbs = store => {
  const [thumbs, setThumbs] = useState(() => store?.get() || NONE);
  useEffect(() => {
    if (!store) return undefined;
    setThumbs(store.get());
    return store.subscribe(() => startTransition(() => setThumbs(store.get())));
  }, [store]);
  return thumbs;
};

const Tile = memo(function Tile({ name, image, active, value, onPick, title, tileRef }) {
  return (
    <button
      type="button"
      className="lab-tile"
      aria-pressed={active}
      onClick={() => onPick(value)}
      title={title}
      ref={tileRef}
    >
      <span className="lab-tile-media">
        {image ? <img src={image} alt="" draggable={false} /> : <span className="lab-tile-wait" />}
      </span>
      <span className="lab-tile-name">{name}</span>
    </button>
  );
});

export function LooksGrid({ store, activeLook, onApply, query = '', watch }) {
  const thumbs = useThumbs(store);
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
              value={look}
              onPick={onApply}
              tileRef={watch?.(`look:${look.id}`)}
            />
          ))}
        </div>
      </section>
    );
  });
  return sections.some(Boolean) ? sections : <Empty query={query} kind="styles" />;
}

export function EffectsGrid({ store, onAdd, query = '', watch }) {
  const thumbs = useThumbs(store);
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
              value={effect.id}
              onPick={onAdd}
              tileRef={watch?.(`fx:${effect.id}`)}
            />
          ))}
        </div>
      </section>
    );
  });
  return sections.some(Boolean) ? sections : <Empty query={query} kind="effects" />;
}
