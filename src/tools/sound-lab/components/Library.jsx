import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { Icon, Track } from '../../background-studio/components/ui';
import { useScrollEdges } from '../../background-studio/hooks/useScrollEdges';
import PreviewSelect from '../../../components/common/Preview/PreviewSelect';
import { CATEGORIES, LIBRARIES, SOUNDS } from '../sounds/catalog';
import { formatSeconds, visibleSounds } from '../sounds/browse';
import { paintArt } from '../engine/art';
import { themeIsLight } from '../engine/velvet';

export function LibrarySwitch({ value, onChange }) {
  const options = LIBRARIES.map(item => ({
    value: item.id,
    label: (
      <>
        {item.label} <span className="snd-count">{SOUNDS.filter(sound => sound.library === item.id).length}</span>
      </>
    )
  }));
  return (
    <Track label="Library" value={value} options={options} onChange={onChange} className="lab-rail-tabs snd-library" />
  );
}

export function SoundSearch({ value, onChange }) {
  return (
    <label className="bs-search lab-search">
      <Icon icon={Search01Icon} size={15} />
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape' && value) {
            event.stopPropagation();
            onChange('');
          }
        }}
        placeholder={`Search ${SOUNDS.length} sounds`}
        aria-label="Search sounds"
        spellCheck={false}
        autoComplete="off"
      />
    </label>
  );
}

export function CategoryFilter({ library, value, onChange }) {
  const options = [
    { value: 'all', label: 'All sounds' },
    ...CATEGORIES.filter(item => item.library === library).map(item => ({ value: item.id, label: item.label }))
  ];
  return <PreviewSelect title="Show" options={options} value={value} onChange={onChange} />;
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

const useNear = ref => {
  const root = useContext(ScrollRoot);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || near) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return undefined;
    }
    return observeNear(root?.current || null, element, () => setNear(true));
  }, [ref, root, near]);
  return near;
};

const useLight = () => {
  const [light, setLight] = useState(themeIsLight);
  useEffect(() => {
    const observer = new MutationObserver(() => setLight(themeIsLight()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return light;
};

function SoundTile({ sound, info, light, active, playing, reveal, onPick, onNeed, onRevealed }) {
  const tileRef = useRef(null);
  const artRef = useRef(null);
  const near = useNear(tileRef);
  useEffect(() => {
    const tile = tileRef.current;
    const root = tile?.closest('.lab-scroll');
    if (!reveal || !root) return undefined;
    const center = () => {
      const box = tile.getBoundingClientRect();
      const frame = root.getBoundingClientRect();
      root.scrollTop += box.top - frame.top - (root.clientHeight - box.height) / 2;
    };
    center();
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        center();
        onRevealed();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [reveal, onRevealed]);
  useEffect(() => {
    if (near && !info) onNeed(sound);
  }, [near, info, sound, onNeed]);
  useEffect(() => {
    const canvas = artRef.current;
    if (!canvas || !info || !near) return;
    canvas.width = 256;
    canvas.height = 256;
    paintArt(canvas, sound, info, light);
  }, [sound, info, light, near]);
  return (
    <button
      ref={tileRef}
      type="button"
      className="snd-tile"
      aria-pressed={active}
      data-playing={playing ? '' : undefined}
      onClick={() => onPick(sound)}
    >
      <canvas ref={artRef} className="snd-tile-art" aria-hidden="true" />
      <span className="snd-tile-name">{sound.name}</span>
      <span className="snd-tile-time">{info ? formatSeconds(info.duration) : ''}</span>
    </button>
  );
}

export function SoundList({
  library,
  category,
  query,
  infos,
  selected,
  playingId,
  reveal,
  onPick,
  onNeed,
  onRevealed
}) {
  const light = useLight();
  const list = visibleSounds(library, category, query);
  if (!list.length) return <p className="lab-empty lab-empty--search">No sounds match “{query.trim()}”.</p>;
  const groups = query.trim()
    ? [{ id: 'results', label: `${list.length} ${list.length === 1 ? 'sound' : 'sounds'}`, sounds: list }]
    : CATEGORIES.filter(item => item.library === library)
        .map(item => ({ ...item, sounds: list.filter(sound => sound.category === item.id) }))
        .filter(item => item.sounds.length);
  return groups.map(group => (
    <section className="lab-group" key={group.id}>
      <h3 className="lab-group-title">{group.label}</h3>
      <div className="snd-grid">
        {group.sounds.map(sound => (
          <SoundTile
            key={sound.id}
            sound={sound}
            info={infos[sound.id]}
            light={light}
            active={selected === sound.id}
            playing={playingId === sound.id}
            reveal={reveal === sound.id}
            onPick={onPick}
            onNeed={onNeed}
            onRevealed={onRevealed}
          />
        ))}
      </div>
    </section>
  ));
}

export function LibraryScroll({ children }) {
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
