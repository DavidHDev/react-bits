import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DEMO_MODES, demoModesFor, demoView } from '../../components/common/Preview/demoModes';
import { useStudioState } from './hooks/useStudioState';
import { useStageFrame } from './hooks/useStageFrame';
import { sameValue, serializeValue, writeDocument } from './utils/params';
import { canvasToBlob, downloadBlob } from './utils/download';
import BackgroundList from './components/BackgroundList';
import StageToolbar from './components/StageToolbar';
import Stage from './components/Stage';
import Panel from './components/Panel';
import Picker from './components/Picker';
import ExportDialog from './components/ExportDialog';
import './studio.css';

const WIDE_QUERY = '(min-width: 1280px)';
const DESKTOP_QUERY = '(min-width: 1024px)';
const PAGE_FILL = { dark: '#120f17', light: '#ffffff' };

let rememberedMode = 'none';

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
  const [mode, setModeState] = useState(rememberedMode);
  const [narrow, setNarrow] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [stageSize, setStageSize] = useState(null);
  const stageRef = useRef(null);
  const keyRef = useRef(null);

  const onKeyDown = useCallback(event => keyRef.current?.(event), []);
  const frame = useStageFrame({ entry, renderProps: state.renderProps, ready: state.ready, light, onKeyDown });

  const setMode = useCallback(value => {
    rememberedMode = value;
    setModeState(value);
  }, []);

  const modes = useMemo(
    () => demoModesFor(narrow).map(item => ({ value: item.value, label: item.label, icon: item.icon })),
    [narrow]
  );

  const shareUrl = useCallback(() => {
    const query = writeDocument(state.doc, entry).toString();
    return `${window.location.origin}${window.location.pathname}?${query}`;
  }, [state.doc, entry]);

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
      await navigator.clipboard.writeText(shareUrl());
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  }, [shareUrl]);

  const saveSnapshot = useCallback(async () => {
    try {
      const canvas = await frame.snapshot(PAGE_FILL[light ? 'light' : 'dark']);
      const blob = await canvasToBlob(canvas, 'image/png');
      downloadBlob(blob, `${entry.id}-${canvas.width}x${canvas.height}.png`);
      toast.success('Snapshot saved');
    } catch {
      toast.error('Could not save a snapshot');
    }
  }, [frame, light, entry.id]);

  const openExport = useCallback(tab => {
    const rect = stageRef.current?.getBoundingClientRect();
    setStageSize(rect ? { width: rect.width, height: rect.height } : null);
    setExporting(tab);
  }, []);

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
      state.step(key === 'arrowleft' ? -1 : 1);
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

  const picker = !wide && <Picker entry={entry} light={light} onSelect={state.selectBackground} />;

  return (
    <div className="bs" data-layout={wide ? 'wide' : desktop ? 'desktop' : 'compact'}>
      {wide && (
        <aside className="bs-rail" aria-label="Backgrounds">
          {toolSelector}
          <BackgroundList activeId={entry.id} light={light} onSelect={state.selectBackground} />
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
          onExport={() => openExport('code')}
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
      />

      {exporting && (
        <ExportDialog initialTab={exporting} state={state} stageSize={stageSize} onClose={() => setExporting(null)} />
      )}
    </div>
  );
}
