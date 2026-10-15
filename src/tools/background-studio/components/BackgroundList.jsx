import { useEffect, useMemo, useRef, useState } from 'react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { CATALOG, matchesQuery, thumbnailFor } from '../utils/catalog';
import { useScrollEdges } from '../hooks/useScrollEdges';
import { Icon } from './ui';

const Thumb = ({ entry, light }) => {
  const [failed, setFailed] = useState(false);
  return (
    <span className="bs-thumb" aria-hidden="true">
      {!failed && (
        <img
          src={thumbnailFor(entry, light)}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
};

export default function BackgroundList({ activeId, light, onSelect, autoFocus = false, onEscape }) {
  const [query, setQuery] = useState('');
  const listRef = useRef(null);
  const items = useMemo(() => CATALOG.filter(entry => matchesQuery(entry, query)), [query]);
  const edges = useScrollEdges(listRef);

  const placed = useRef(false);

  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector('[aria-current="true"]');
    if (!list || !active) return;
    const top = active.offsetTop - list.offsetTop;
    const bottom = top + active.offsetHeight;
    if (!placed.current) {
      placed.current = true;
      list.scrollTop = Math.max(0, top - (list.clientHeight - active.offsetHeight) / 2);
    } else if (top < list.scrollTop + 8) list.scrollTop = Math.max(0, top - 8);
    else if (bottom > list.scrollTop + list.clientHeight - 8) list.scrollTop = bottom - list.clientHeight + 8;
  }, [activeId, items]);

  const onKeyDown = event => {
    if (event.key === 'Enter' && items[0]) {
      event.preventDefault();
      onSelect(items[0].id);
    } else if (event.key === 'Escape') {
      if (query) {
        event.stopPropagation();
        setQuery('');
      } else {
        onEscape?.();
      }
    }
  };

  return (
    <div className="bs-browser">
      <label className="bs-search">
        <Icon icon={Search01Icon} size={15} />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Search ${CATALOG.length} backgrounds`}
          aria-label="Search backgrounds"
          spellCheck={false}
          autoComplete="off"
          autoFocus={autoFocus}
        />
      </label>
      <div
        className="bs-scroll-shell"
        data-top={edges.top ? '' : undefined}
        data-bottom={edges.bottom ? '' : undefined}
      >
        <div className="bs-list" ref={listRef}>
          {items.map(entry => (
            <button
              key={entry.id}
              type="button"
              className="bs-item"
              aria-current={entry.id === activeId ? 'true' : undefined}
              onClick={() => onSelect(entry.id)}
            >
              <Thumb key={`${entry.id}-${light}`} entry={entry} light={light} />
              <span className="bs-item-label">{entry.label}</span>
              {entry.isNew && <span className="bs-tag bs-tag--new">New</span>}
            </button>
          ))}
          {!items.length && <p className="bs-empty">Nothing matches “{query.trim()}”.</p>}
        </div>
      </div>
    </div>
  );
}
