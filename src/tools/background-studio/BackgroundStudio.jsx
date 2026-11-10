import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DEMO_MODES, demoModesFor, demoView } from '../../components/common/Preview/demoModes';
import { useStudioState } from './hooks/useStudioState';
import { useStageFrame } from './hooks/useStageFrame';
import { sameValue, serializeValue, writeDocument } from './utils/params';
import { canvasToBlob, downloadBlob } from './utils/download';
import { oneOf, recall, remember } from './utils/remember';
import { CATALOG, findEntry } from './utils/catalog';
import { loadPresets } from './utils/presets';
import BackgroundList from './components/BackgroundList';
import StageToolbar from './components/StageToolbar';
import Stage from './components/Stage';
import Panel from './components/Panel';
import Picker from './components/Picker';
import ExportDialog from './components/ExportDialog';
import SessionSave from './components/SessionSave';
import './studio.css';

const INTENT_MS = 90;
const WIDE_QUERY = '(min-width: 1280px)';
const DESKTOP_QUERY = '(min-width: 1024px)';
const PAGE_FILL = { dark: '#120f17', light: '#ffffff' };

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

const neighborOf = (id, direction) => {
  const index = CATALOG.findIndex(item => item.id === id);
  return index < 0 ? null : CATALOG[(index + direction + CATALOG.length) % CATALOG.length].id;
};

const whenIdle = callback =>
  typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback(callback, { timeout: 600 })
    : window.setTimeout(callback, 200);

const isEditable = target =>
  typeof target?.closest === 'function' &&
  Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="slider"], [role="spinbutton"], [role="dialog"], [role="menu"], [role="listbox"]'
    )
  );

export default function BackgroundStudio({ toolSelector }) {
  const state = useStudioState();
  const { entry, light } = state;
  const wide = useMediaQuery(WIDE_QUERY);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const [mode, setModeState] = useState(() => oneOf(recall('mode'), DEMO_MODES, 'none'));
  const [narrow, setNarrow] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [stageSize, setStageSize] = useState(null);
  const stageRef = useRef(null);
  const keyRef = useRef(null);

  const onKeyDown = useCallback(event => keyRef.current?.(event), []);
  const frame = useStageFrame({ entry, renderProps: state.renderProps, ready: state.ready, light, onKeyDown });

  const setMode = useCallback(value => {
    remember('mode', value);
    setModeState(value);
  }, []);

  const modes = useMemo(
    () => demoModesFor(narrow).map(item => ({ value: item.value, label: item.label, icon: item.icon })),
    [narrow]
  );

  const latest = useRef(null);
  latest.current = { doc: state.doc, entry, light, frame };

  const docsHref = useMemo(() => {
    const params = new URLSearchParams();
    if (state.doc.preset) params.set('preset', state.doc.preset);
    (entry.props || []).forEach(definition => {
      const value = state.props[definition.name];
      if (value !== undefined && !sameValue(value, state.defaults[definition.name])) {
        params.set(definition.name, serializeValue(value));
      }
    });
    const query = params.toString();
    return query ? `${entry.docsPath}?${query}` : entry.docsPath;
  }, [entry, state.doc.preset, state.props, state.defaults]);

  const copyLink = useCallback(async () => {
    try {
      const { doc, entry: current } = latest.current;
      const query = writeDocument(doc, current).toString();
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?${query}`);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  }, []);

  const saveSnapshot = useCallback(async () => {
    const { frame: current, light: isLight, entry: active } = latest.current;
    try {
      const canvas = await current.snapshot(PAGE_FILL[isLight ? 'light' : 'dark']);
      const blob = await canvasToBlob(canvas, 'image/png');
      downloadBlob(blob, `${active.id}-${canvas.width}x${canvas.height}.png`);
      toast.success('Snapshot saved');
    } catch {
      toast.error('Could not save a snapshot');
    }
  }, []);

  const openExport = useCallback(tab => {
    const rect = stageRef.current?.getBoundingClientRect();
    setStageSize(rect ? { width: rect.width, height: rect.height } : null);
    setExporting(tab);
  }, []);

  const openCodeExport = useCallback(() => openExport('code'), [openExport]);

  const intent = useRef({ id: null, timer: 0, step: null });

  const preloadEntry = useCallback(id => {
    const target = findEntry(id);
    if (!target || target.id === latest.current.entry.id) return;
    loadPresets(target);
    latest.current.frame.preload(target.id);
  }, []);

  const onIntent = useCallback(
    id => {
      const current = intent.current;
      if (current.id === id) return;
      clearTimeout(current.timer);
      current.id = id;
      if (id) current.timer = setTimeout(() => preloadEntry(id), INTENT_MS);
    },
    [preloadEntry]
  );

  const onStepIntent = useCallback(
    direction => onIntent(direction ? neighborOf(latest.current.entry.id, direction) : null),
    [onIntent]
  );

  useEffect(() => () => clearTimeout(intent.current.timer), []);

  useEffect(() => {
    const step = intent.current.step;
    if (!step || step.id !== entry.id) return undefined;
    if (frame.status === 'loading') step.loading = true;
    if (frame.status !== 'ready' || !step.loading) return undefined;
    intent.current.step = null;
    let handle = whenIdle(() => {
      handle = 0;
      preloadEntry(neighborOf(entry.id, step.direction));
    });
    return () => {
      if (!handle) return;
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
  }, [frame.status, entry.id, preloadEntry]);

  const toggleFullscreen = useCallback(() => {
    const element = stageRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    const request = element.requestFullscreen || element.webkitRequestFullscreen;
    if (request) Promise.resolve(request.call(element)).catch(() => toast.error('Fullscreen is not available here'));
  }, []);

  keyRef.current = event => {
    if (exporting || event.defaultPrevented) return;
    const key = event.key.toLowerCase();
    const modifier = event.metaKey || event.ctrlKey;

    if (modifier && !event.altKey && (key === 'z' || key === 'y')) {
      if (typeof event.target?.matches === 'function' && event.target.matches('input, textarea')) return;
      event.preventDefault();
      if (key === 'y' || event.shiftKey) state.redo();
      else state.undo();
      return;
    }

    if (modifier || event.altKey || isEditable(event.target)) return;

    if (key === 'arrowleft' || key === 'arrowright') {
      if (event.shiftKey) return;
      event.preventDefault();
      const direction = key === 'arrowleft' ? -1 : 1;
      intent.current.step = { direction, id: neighborOf(entry.id, direction) };
      state.step(direction);
    } else if (key === ' ') {
      if (typeof event.target?.closest === 'function' && event.target.closest('button, a')) return;
      event.preventDefault();
      frame.togglePause();
    } else if (key === 'r') {
      frame.restart();
    } else if (key === 'f') {
      toggleFullscreen();
    } else if (key === 's') {
      saveSnapshot();
    } else if (key === 'e') {
      openExport('code');
    }
  };

  useEffect(() => {
    const handler = event => keyRef.current?.(event);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { selectBackground } = state;
  const picker = useMemo(
    () => !wide && <Picker entry={entry} light={light} onSelect={selectBackground} onIntent={onIntent} />,
    [wide, entry, light, selectBackground, onIntent]
  );

  return (
    <div className="bs" data-layout={wide ? 'wide' : desktop ? 'desktop' : 'compact'}>
      {wide && (
        <aside className="bs-rail" aria-label="Backgrounds">
          {toolSelector}
          <BackgroundList activeId={entry.id} light={light} onSelect={selectBackground} onIntent={onIntent} />
        </aside>
      )}

      <section className="bs-main" aria-label="Preview">
        <StageToolbar
          picker={picker}
          mode={demoView(mode, narrow)}
          modes={modes.length ? modes : DEMO_MODES}
          onModeChange={setMode}
          paused={frame.paused}
          disabled={!frame.bridge}
          onTogglePause={frame.togglePause}
          onRestart={frame.restart}
          onSnapshot={saveSnapshot}
          onFullscreen={toggleFullscreen}
          onCopyLink={copyLink}
          onExport={openCodeExport}
        />
        <Stage
          ref={stageRef}
          frame={frame}
          mode={mode}
          onModeChange={setMode}
          onNarrowChange={setNarrow}
          onRetry={frame.restart}
        />
      </section>

      <Panel
        state={state}
        toolSelector={!wide && desktop ? toolSelector : null}
        docsHref={docsHref}
        onStep={state.step}
        onStepIntent={onStepIntent}
      />

      {exporting && (
        <ExportDialog initialTab={exporting} state={state} stageSize={stageSize} onClose={() => setExporting(null)} />
      )}

      <SessionSave studio={state.session} />
    </div>
  );
}
