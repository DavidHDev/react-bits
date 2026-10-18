import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Track } from '../background-studio/components/ui';
import { SOUNDS, SOUNDS_BY_ID } from './sounds/catalog';
import { createPlayer } from './engine/player';
import { CategoryFilter, LibraryScroll, LibrarySwitch, SoundList, SoundSearch } from './components/Library';
import { visibleSounds } from './sounds/browse';
import Stage from './components/Stage';
import Timeline from './components/Timeline';
import Panel from './components/Panel';
import { EFFECT_KEYS, PLAYBACK, TUNE } from './sounds/controls';
import ExportDialog from './components/ExportDialog';
import { readSharedSound } from './sounds/share';
import '../background-studio/studio.css';
import '../texture-lab/lab.css';
import './snd.css';

const WIDE_QUERY = '(min-width: 1280px)';
const DESKTOP_QUERY = '(min-width: 1024px)';
const STORE = 'sound-lab';

const SIDE_TABS = [
  { value: 'sounds', label: 'Sounds' },
  { value: 'tune', label: 'Tune' }
];

const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(`${STORE}-${key}`) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(`${STORE}-${key}`, JSON.stringify(value));
  } catch {
    return false;
  }
  return true;
};

const useMediaQuery = query => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
};

const isTyping = target =>
  typeof target?.closest === 'function' &&
  Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="slider"], [role="dialog"]'));

const DEFAULTS = Object.fromEntries([...TUNE, ...PLAYBACK].map(control => [control.key, control.fallback]));

const cleanTune = tune =>
  Object.fromEntries(
    Object.entries(tune).filter(([key, value]) =>
      EFFECT_KEYS.includes(key) ? Boolean(value) : Math.abs(value - (DEFAULTS[key] ?? 0)) > 1e-6
    )
  );

const withSettings = (tunes, id, settings) => {
  const next = { ...tunes };
  if (Object.keys(settings).length) next[id] = settings;
  else delete next[id];
  return next;
};

export default function SoundLab({ toolSelector }) {
  const wide = useMediaQuery(WIDE_QUERY);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const playerRef = useRef(null);
  if (!playerRef.current) playerRef.current = createPlayer();
  const player = playerRef.current;
  const [shared] = useState(readSharedSound);
  const [reveal, setReveal] = useState(() => shared?.id || null);
  const [library, setLibraryState] = useState(() =>
    shared ? SOUNDS_BY_ID[shared.id].library : read('library', 'interface')
  );
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(() => {
    if (shared) return shared.id;
    const stored = read('sound', 'pebble');
    return SOUNDS_BY_ID[stored] ? stored : 'pebble';
  });
  const [tunes, setTunes] = useState(() => {
    const stored = read('tunes', {});
    return shared ? withSettings(stored, shared.id, shared.tune) : stored;
  });
  const [infos, setInfos] = useState({});
  const [loop, setLoop] = useState(() => read('loop', false));
  const [exporting, setExporting] = useState(null);
  const [sideTab, setSideTab] = useState('sounds');
  const [playing, setPlaying] = useState(null);
  const tunesRef = useRef(tunes);
  tunesRef.current = tunes;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  const sound = SOUNDS_BY_ID[selectedId];
  const tune = useMemo(() => tunes[selectedId] || {}, [tunes, selectedId]);

  useEffect(() => player.subscribe(entry => setPlaying(entry ? entry.id : null)), [player]);
  useEffect(() => () => player.dispose(), [player]);

  const infosRef = useRef(infos);
  infosRef.current = infos;
  const demand = useRef({ stack: [], queued: new Set(), busy: false, alive: true });

  useEffect(() => {
    const state = demand.current;
    state.alive = true;
    return () => {
      state.alive = false;
    };
  }, []);

  const need = useCallback(
    target => {
      const state = demand.current;
      if (infosRef.current[target.id] || state.queued.has(target.id)) return;
      state.queued.add(target.id);
      state.stack.push(target);
      if (state.busy) return;
      state.busy = true;
      (async () => {
        let batch = {};
        let count = 0;
        const flush = () => {
          const add = batch;
          batch = {};
          count = 0;
          if (state.alive && Object.keys(add).length) setInfos(previous => ({ ...previous, ...add }));
        };
        while (state.stack.length && state.alive) {
          const item = state.stack.pop();
          const info = await player.inspect(item, tunesRef.current[item.id] || {}).catch(() => null);
          if (info) {
            batch[item.id] = info;
            count += 1;
          }
          if (count >= 4 || !state.stack.length) flush();
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        flush();
        state.busy = false;
      })();
    },
    [player]
  );

  useEffect(() => {
    let alive = true;
    player.render(sound, tune).then(result => {
      if (alive && result) setInfos(previous => ({ ...previous, [sound.id]: result.info }));
    });
    return () => {
      alive = false;
    };
  }, [player, sound, tune]);

  useEffect(() => {
    write('tunes', tunes);
  }, [tunes]);

  useEffect(() => {
    if (!shared) return;
    write('sound', shared.id);
    write('library', SOUNDS_BY_ID[shared.id].library);
  }, [shared]);

  useEffect(() => {
    const open = () => {
      const next = readSharedSound();
      if (!next) return;
      const target = SOUNDS_BY_ID[next.id];
      setTunes(previous => withSettings(previous, next.id, next.tune));
      setSelectedId(next.id);
      setLibraryState(target.library);
      setCategory('all');
      setQuery('');
      setReveal(next.id);
      write('sound', next.id);
      write('library', target.library);
    };
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []);

  const revealed = useCallback(() => setReveal(null), []);

  const setLibrary = value => {
    setLibraryState(value);
    setCategory('all');
    write('library', value);
  };

  const play = useCallback(
    (id = selectedId, offset = 0) => {
      const target = SOUNDS_BY_ID[id];
      if (!target) return;
      player.play(target, tunesRef.current[id] || {}, { offset, loop: loop && id === selectedId }).catch(() => null);
    },
    [player, selectedId, loop]
  );

  const type = useCallback(
    id => {
      const target = SOUNDS_BY_ID[id];
      if (target) player.play(target, tunesRef.current[id] || {}, { exclusive: false }).catch(() => null);
    },
    [player]
  );

  const select = useCallback(
    (target, { autoplay = true } = {}) => {
      setSelectedId(target.id);
      write('sound', target.id);
      if (target.library !== library && !query.trim()) setLibrary(target.library);
      if (autoplay) {
        player.play(target, tunesRef.current[target.id] || {}).catch(() => null);
      }
    },
    [player, library, query]
  );

  const visible = useMemo(() => visibleSounds(library, category, query), [library, category, query]);

  const step = direction => {
    const list = visible.length ? visible : SOUNDS;
    const index = list.findIndex(item => item.id === selectedId);
    const next = list[(index + direction + list.length) % list.length] || list[0];
    select(next);
  };

  const onTune = (key, value) =>
    setTunes(previous =>
      withSettings(previous, selectedId, cleanTune({ ...(previous[selectedId] || {}), [key]: value }))
    );

  const onReset = () =>
    setTunes(previous => {
      const current = previous[selectedId] || {};
      const effects = Object.fromEntries(EFFECT_KEYS.filter(key => current[key]).map(key => [key, current[key]]));
      return withSettings(previous, selectedId, effects);
    });

  const onEffect = (key, value) =>
    setTunes(previous =>
      withSettings(previous, selectedId, cleanTune({ ...(previous[selectedId] || {}), [key]: value }))
    );

  const toggleLoop = () =>
    setLoop(previous => {
      write('loop', !previous);
      if (previous) player.stop();
      return !previous;
    });

  const keys = useRef(null);
  keys.current = event => {
    if (exporting || event.defaultPrevented) return;
    const key = event.key.toLowerCase();
    if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
    if (key === ' ') {
      if (typeof event.target?.closest === 'function' && event.target.closest('button, a, [role="switch"]')) return;
      event.preventDefault();
      if (playing === selectedId) player.stop();
      else play();
    } else if (key === 'arrowdown' || key === 'arrowright') {
      event.preventDefault();
      step(1);
    } else if (key === 'arrowup' || key === 'arrowleft') {
      event.preventDefault();
      step(-1);
    } else if (key === 'e') {
      setExporting('last');
    } else if (key === 'l') {
      toggleLoop();
    } else if (key === 'escape') {
      player.stop();
    }
  };

  useEffect(() => {
    const down = event => keys.current?.(event);
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  const browser = (
    <>
      <LibrarySwitch value={library} onChange={setLibrary} />
      <SoundSearch value={query} onChange={setQuery} />
      {!query.trim() && <CategoryFilter library={library} value={category} onChange={setCategory} />}
      <LibraryScroll>
        <SoundList
          library={library}
          category={category}
          query={query}
          infos={infos}
          selected={selectedId}
          playingId={playing}
          reveal={reveal}
          onPick={select}
          onNeed={need}
          onRevealed={revealed}
        />
      </LibraryScroll>
    </>
  );

  const panel = <Panel sound={sound} tune={tune} onTune={onTune} onEffect={onEffect} onReset={onReset} />;

  const main = (
    <section className="lab-main" aria-label="Sound">
      <Stage
        sound={sound}
        player={player}
        onPlay={id => play(id)}
        onType={type}
        onExport={tab => setExporting(tab || 'last')}
      />
      <Timeline
        sound={sound}
        info={infos[selectedId]}
        player={player}
        loop={loop}
        onPlay={(id, offset) => play(id, offset)}
        onStop={() => player.stop()}
        onToggleLoop={toggleLoop}
      />
    </section>
  );

  return (
    <div className="lab snd" data-layout={wide ? 'wide' : desktop ? 'desktop' : 'compact'}>
      {wide && (
        <aside className="lab-rail snd-rail" aria-label="Sounds">
          {toolSelector}
          {browser}
        </aside>
      )}

      {main}

      {wide ? (
        panel
      ) : desktop ? (
        <aside className="lab-side" aria-label="Sounds and settings">
          {toolSelector}
          <Track label="Panels" value={sideTab} options={SIDE_TABS} onChange={setSideTab} className="lab-mobile-tabs" />
          {sideTab === 'tune' ? panel : browser}
        </aside>
      ) : (
        <section className="lab-mobile" aria-label="Sounds and settings">
          <Track label="Panels" value={sideTab} options={SIDE_TABS} onChange={setSideTab} className="lab-mobile-tabs" />
          {sideTab === 'tune' ? panel : <div className="lab-mobile-gallery">{browser}</div>}
        </section>
      )}

      {exporting && (
        <ExportDialog
          initialTab={exporting}
          sound={sound}
          tune={tune}
          info={infos[selectedId]}
          player={player}
          onPlay={id => play(id)}
          onClose={() => setExporting(null)}
        />
      )}
    </div>
  );
}
