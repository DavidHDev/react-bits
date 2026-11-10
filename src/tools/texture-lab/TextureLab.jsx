import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Engine } from './engine/engine';
import { warmPatterns } from './engine/patterns';
import { ensureGlyphFont } from './engine/assets';
import { EFFECTS, EFFECT_LIST } from './effects';
import { LOOKS, LOOKS_BY_ID } from './looks';
import { useLayers } from './state/useLayers';
import { useThumbnails } from './state/useThumbnails';
import { restoreState, restoredFile, trimFor } from './state/restore';
import {
  SAMPLES,
  isMediaFile,
  loadFile,
  loadSample,
  mediaFrame,
  randomSampleVideo,
  releaseMedia,
  startCamera,
  workSize
} from './media';
import { compactLayers, decodeLook, isStyleFile } from './share';
import { GallerySearch, GalleryScroll } from './components/Gallery';
import { EffectsGrid, LooksGrid } from './components/Library';
import LayersPanel from './components/LayersPanel';
import LabToolbar from './components/LabToolbar';
import LabStage from './components/LabStage';
import LabTimeline from './components/LabTimeline';
import ExportDialog from './components/ExportDialog';
import { Track } from '../background-studio/components/ui';
import { downloadBlob } from '../background-studio/utils/download';
import { loadFile as loadSavedFile, readSession, removeFile, saveFile, useSessionSave } from '../session';
import '../background-studio/studio.css';
import './lab.css';

const WIDE_QUERY = '(min-width: 1280px)';
const DESKTOP_QUERY = '(min-width: 1024px)';
const SESSION = 'texture-lab';
const MEDIA_SLOT = 'media';
const STYLE_LIMIT = 1048576;
const UPRIGHT = { rotation: 0, flip: false };
const WARM_SIZE = { width: 1280, height: 720 };
const LOOK_COUNT = LOOKS.length;
const EFFECT_COUNT = EFFECT_LIST.length;

const RAIL_TABS = [
  { value: 'looks', label: 'Styles' },
  { value: 'effects', label: 'Effects' }
];

const MOBILE_TABS = [
  { value: 'looks', label: 'Styles' },
  { value: 'effects', label: 'Effects' },
  { value: 'layers', label: 'Layers' }
];

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
  Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [role="slider"], [role="dialog"], [role="menu"]')
  );

export default function TextureLab({ toolSelector }) {
  const wide = useMediaQuery(WIDE_QUERY);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const [initial] = useState(() => restoreState(readSession(SESSION), window.location.hash));
  const stack = useLayers(initial.stack);
  const { add: addLayer, applyLook, replace: replaceLayers } = stack;
  const [media, setMedia] = useState(null);
  const [source, setSource] = useState(initial.media);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [railTab, setRailTab] = useState('looks');
  const [mobileTab, setMobileTab] = useState('looks');
  const [zoom, setZoom] = useState('fit');
  const [comparing, setComparing] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [defaultSample] = useState(randomSampleVideo);
  const [trim, setTrim] = useState(initial.trim);
  const [thumbVersion, setThumbVersion] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportSettings, setExportSettings] = useState(initial.export);
  const [recording, setRecording] = useState(false);
  const [strength, setStrength] = useState(initial.strength);
  const [queries, setQueries] = useState({ looks: '', effects: '' });
  const searchRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const fileRef = useRef(null);
  const engineRef = useRef(null);
  const clock = useRef(0);
  const dirty = useRef(true);
  const recorder = useRef(null);
  const mediaRef = useRef(null);
  const request = useRef(0);

  const library = wide ? railTab : mobileTab === 'effects' ? 'effects' : 'looks';
  const { store: thumbs, watch } = useThumbnails(media, thumbVersion, engineRef, library);

  const session = useMemo(
    () => ({
      look: stack.look,
      layers: compactLayers(stack.layers),
      selected: stack.layers.findIndex(layer => layer.id === stack.selected),
      strength,
      trim,
      media: source,
      export: exportSettings,
      share: initial.share
    }),
    [stack.look, stack.layers, stack.selected, strength, trim, source, exportSettings, initial.share]
  );

  useSessionSave(SESSION, session);

  const animated = useMemo(
    () =>
      stack.layers.some(layer => {
        const effect = EFFECTS[layer.type];
        if (!layer.visible || !effect?.animated) return false;
        return effect.animates ? effect.animates(layer.params) : true;
      }),
    [stack.layers]
  );

  const live = useRef({});
  live.current = { layers: stack.layers, media, comparing, playing, animated, strength };
  const wake = useRef(() => {});
  const owner = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let engine;
    try {
      engine = new Engine(canvas, { preview: true });
    } catch (problem) {
      setError(problem.message);
      return undefined;
    }
    engineRef.current = engine;
    const warming = setTimeout(() => engine.warm(live.current.layers, EFFECTS, WARM_SIZE), 0);
    let raf = 0;
    let last = performance.now();
    let shown = -1;
    let shownMedia = null;
    let uploaded = -1;
    let polled = 0;
    let orient = UPRIGHT;
    const tick = now => {
      raf = 0;
      const state = live.current;
      const media = state.media;
      if (!media) return;
      const dt = Math.min(Math.max(now - last, 0) / 1000, 0.1);
      last = now;
      const kind = media.kind;
      const player = kind === 'video' ? media.player : null;
      const camera = kind === 'camera';
      if (camera || (player ? !player.paused : state.playing && state.animated)) {
        raf = requestAnimationFrame(tick);
      }
      if (kind !== 'video' && (state.playing || camera)) clock.current += dt;
      let stamp = 0;
      if (player) {
        player.update();
        stamp = player.version;
      } else if (camera) {
        polled -= 1;
        stamp = media.frames?.live() ? media.frames.count : polled;
      }
      const streamed = Boolean(player) || camera;
      const fresh = streamed && (stamp !== shown || shownMedia !== media);
      const moving = fresh || (camera ? state.animated : state.playing && state.animated);
      if (!moving && !dirty.current) return;
      const upload = streamed && (stamp !== uploaded || owner.current !== media);
      if (!upload && owner.current !== media) return;
      const frame = upload ? mediaFrame(media) : null;
      if (upload && !frame) return;
      dirty.current = false;
      if (streamed) {
        shown = stamp;
        shownMedia = media;
      }
      try {
        if (upload) {
          engine.setSource(frame.image, frame.width, frame.height);
          owner.current = media;
          uploaded = stamp;
          orient = { rotation: frame.rotation, flip: frame.flip };
        } else if (kind === 'image') orient = UPRIGHT;
        const time = player ? player.currentTime : clock.current;
        engine.render(state.layers, EFFECTS, {
          ...workSize(media),
          time,
          frame: Math.round(time * 30),
          original: state.comparing,
          mirror: Boolean(media.mirror),
          rotation: orient.rotation,
          flip: orient.flip,
          strength: state.strength
        });
      } catch (problem) {
        console.error(problem);
      }
    };
    wake.current = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    wake.current();
    return () => {
      clearTimeout(warming);
      cancelAnimationFrame(raf);
      raf = 0;
      wake.current = () => {};
      engine.dispose();
      engineRef.current = null;
      owner.current = null;
    };
  }, []);

  useEffect(() => {
    dirty.current = true;
    wake.current();
  }, [stack.layers, comparing, media, zoom, strength]);

  useEffect(() => {
    warmPatterns();
    ensureGlyphFont();
  }, []);

  useEffect(() => {
    wake.current();
  }, [playing, animated]);

  useEffect(() => media?.player?.onFrame?.(() => wake.current()), [media]);

  const pickLook = useCallback(
    look => {
      applyLook(look);
      setStrength(1);
    },
    [applyLook]
  );

  useEffect(() => {
    if (media?.kind === 'video') media.player.setRange(trim[0], trim[1]);
  }, [media, trim]);

  const openMedia = useCallback(async (loader, { trim: range, stored = false } = {}) => {
    request.current += 1;
    const current = request.current;
    setLoading(true);
    setError(null);
    try {
      const next = await loader();
      if (current !== request.current) {
        releaseMedia(next);
        return null;
      }
      releaseMedia(mediaRef.current);
      mediaRef.current = next;
      if (next.kind === 'image' && engineRef.current) {
        const frame = mediaFrame(next);
        engineRef.current.setSource(frame.image, frame.width, frame.height, { bottomUp: frame.bottomUp, owner: next });
        owner.current = next;
      }
      if (next.kind === 'video') {
        const span = trimFor(range, next.duration);
        setTrim(span);
        next.player.setRange(span[0], span[1]);
        await next.player.play();
        if (mediaRef.current !== next) return null;
        setPlaying(true);
      }
      clock.current = 0;
      setMedia(next);
      setThumbVersion(version => version + 1);
      if (next.file) {
        if (!stored) saveFile(SESSION, MEDIA_SLOT, next.file, { name: next.file.name, type: next.file.type });
        setSource({ kind: 'file', name: next.file.name, size: next.file.size });
      } else if (next.sample) {
        removeFile(SESSION, MEDIA_SLOT);
        setSource({ kind: 'sample', id: next.sample });
      }
      return true;
    } catch (problem) {
      if (current !== request.current) return null;
      setError(problem?.message || 'That file could not be opened.');
      return false;
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, []);

  const openFile = useCallback(file => openMedia(() => loadFile(file, { texels: true })), [openMedia]);
  const openSample = useCallback((sample, range) => openMedia(() => loadSample(sample), { trim: range }), [openMedia]);
  const openCamera = useCallback(
    () =>
      openMedia(async () => {
        try {
          return await startCamera();
        } catch (problem) {
          throw new Error(problem?.name === 'NotAllowedError' ? 'Camera access was blocked.' : problem.message);
        }
      }),
    [openMedia]
  );

  const importStyle = useCallback(
    async file => {
      const text = file.size > STYLE_LIMIT ? '' : await file.text().catch(() => '');
      const look = decodeLook(text);
      if (!look?.length) {
        toast.error('That file is not a Texture Lab style');
        return;
      }
      replaceLayers(look);
      toast.success('Style imported');
    },
    [replaceLayers]
  );

  useEffect(() => {
    const start = request.current;
    const saved = initial.media;
    if (saved?.kind === 'file') {
      loadSavedFile(SESSION, MEDIA_SLOT).then(record => {
        if (request.current !== start) return;
        const file = restoredFile(record, saved);
        if (!file) {
          openSample(defaultSample);
          return;
        }
        openMedia(() => loadFile(file, { texels: true }), { trim: initial.trim, stored: true }).then(opened => {
          if (opened === false) openSample(defaultSample);
        });
      });
    } else {
      const sample = SAMPLES.find(item => item.id === saved?.id);
      openSample(sample || defaultSample, sample ? initial.trim : null);
    }
    return () => {
      request.current += 1;
      releaseMedia(mediaRef.current);
    };
  }, [defaultSample, initial, openMedia, openSample]);

  const togglePlay = useCallback(() => {
    const current = live.current.media;
    if (current?.kind === 'video') {
      if (current.player.paused) {
        current.player.play();
        setPlaying(true);
      } else {
        current.player.pause();
        setPlaying(false);
        setThumbVersion(version => version + 1);
      }
      return;
    }
    setPlaying(value => !value);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const element = stageRef.current;
    if (!element) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else Promise.resolve(element.requestFullscreen?.()).catch(() => toast.error('Fullscreen is not available here'));
  }, []);

  const toggleRecording = useCallback(() => {
    if (recorder.current) {
      recorder.current.stop();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas?.captureStream || typeof MediaRecorder === 'undefined') {
      toast.error('Recording is not available in this browser');
      return;
    }
    const type = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'].find(item =>
      MediaRecorder.isTypeSupported(item)
    );
    const chunks = [];
    const instance = new MediaRecorder(canvas.captureStream(30), { mimeType: type, videoBitsPerSecond: 12e6 });
    instance.ondataavailable = event => event.data.size && chunks.push(event.data);
    instance.onstop = () => {
      recorder.current = null;
      setRecording(false);
      const blob = new Blob(chunks, { type: instance.mimeType });
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      downloadBlob(blob, `camera-${stamp}.${instance.mimeType.includes('mp4') ? 'mp4' : 'webm'}`);
      toast.success('Recording saved');
    };
    instance.start(250);
    recorder.current = instance;
    setRecording(true);
  }, []);

  useEffect(() => {
    if (media?.kind !== 'camera' && recorder.current) recorder.current.stop();
  }, [media]);

  const addEffect = useCallback(
    type => {
      addLayer(type);
      if (!wide) setMobileTab('layers');
    },
    [addLayer, wide]
  );

  const keys = useRef(null);
  keys.current = event => {
    if (exporting || event.defaultPrevented) return;
    const key = event.key.toLowerCase();
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && key === 'o') {
      event.preventDefault();
      fileRef.current?.click();
      return;
    }
    if (modifier && (key === 'z' || key === 'y')) {
      if (typeof event.target?.matches === 'function' && event.target.matches('input, textarea')) return;
      event.preventDefault();
      if (key === 'y' || event.shiftKey) stack.redo();
      else stack.undo();
      return;
    }
    if (modifier && key === 'd' && stack.selected) {
      event.preventDefault();
      stack.duplicate(stack.selected);
      return;
    }
    if (modifier || event.altKey || isTyping(event.target)) return;
    if (key === ' ') {
      if (typeof event.target?.closest === 'function' && event.target.closest('button, a')) return;
      event.preventDefault();
      togglePlay();
    } else if (key === 'c' && !event.repeat) {
      setComparing(true);
    } else if ((key === 'backspace' || key === 'delete') && stack.selected) {
      event.preventDefault();
      stack.remove(stack.selected);
    } else if (key === 'f') {
      toggleFullscreen();
    } else if (key === 'e') {
      setExporting(true);
    } else if (key === 'r' && live.current.media?.kind === 'camera') {
      toggleRecording();
    } else if (key === '/') {
      event.preventDefault();
      if (!searchRef.current) {
        if (wide) setRailTab('looks');
        else setMobileTab('looks');
      }
      requestAnimationFrame(() => searchRef.current?.focus());
    } else if (key === '0') {
      setZoom('fit');
    } else if (key === '1') {
      setZoom('actual');
    }
  };

  useEffect(() => {
    const down = event => keys.current?.(event);
    const up = event => {
      if (event.key.toLowerCase() === 'c') setComparing(false);
    };
    const paste = event => {
      const files = [...(event.clipboardData?.files || [])];
      const file = files.find(isMediaFile);
      if (file) {
        event.preventDefault();
        openFile(file);
        return;
      }
      const style = files.find(isStyleFile);
      if (style) {
        event.preventDefault();
        importStyle(style);
        return;
      }
      const text = event.clipboardData?.getData('text');
      const look = text && decodeLook(text);
      if (look) {
        event.preventDefault();
        replaceLayers(look);
        toast.success('Style pasted');
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('paste', paste);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('paste', paste);
    };
  }, [importStyle, openFile, replaceLayers]);

  useEffect(() => {
    let depth = 0;
    const hasFiles = event => [...(event.dataTransfer?.types || [])].includes('Files');
    const enter = event => {
      if (!hasFiles(event)) return;
      depth += 1;
      setDropping(true);
    };
    const leave = event => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) setDropping(false);
    };
    const over = event => {
      if (hasFiles(event)) event.preventDefault();
    };
    const drop = event => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDropping(false);
      const files = [...(event.dataTransfer?.files || [])];
      const file = files.find(isMediaFile);
      const style = files.find(isStyleFile);
      if (style) importStyle(style);
      if (file) openFile(file);
      if (!file && !style) toast.error('Drop an image, video or style file.');
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  }, [importStyle, openFile]);

  const canPlay = Boolean(media) && media.kind !== 'camera' && (media.kind === 'video' || animated);
  const isPlaying = playing;

  const gallery = tab =>
    tab === 'looks' ? (
      <LooksGrid store={thumbs} activeLook={stack.look} onApply={pickLook} query={queries.looks} watch={watch} />
    ) : (
      <EffectsGrid store={thumbs} onAdd={addEffect} query={queries.effects} watch={watch} />
    );

  const search = tab => (
    <GallerySearch
      inputRef={searchRef}
      value={queries[tab] ?? ''}
      onChange={value => setQueries(previous => ({ ...previous, [tab]: value }))}
      placeholder={tab === 'effects' ? `Search ${EFFECT_COUNT} effects` : `Search ${LOOK_COUNT} styles`}
    />
  );

  const panel = (
    <LayersPanel
      stack={stack}
      look={stack.look ? LOOKS_BY_ID[stack.look] : null}
      strength={strength}
      onStrength={setStrength}
      onResetLook={() => stack.look && pickLook(LOOKS_BY_ID[stack.look])}
      onAdd={() => {
        if (wide) setRailTab('effects');
        else setMobileTab('effects');
      }}
    />
  );

  return (
    <div className="lab" data-layout={wide ? 'wide' : desktop ? 'desktop' : 'compact'}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime,.mov,.m4v,.json,application/json"
        hidden
        onChange={event => {
          const file = event.target.files?.[0];
          if (file && isStyleFile(file)) importStyle(file);
          else if (file) openFile(file);
          event.target.value = '';
        }}
      />

      {wide && (
        <aside className="lab-rail" aria-label="Styles and effects">
          {toolSelector}
          <Track label="Library" value={railTab} options={RAIL_TABS} onChange={setRailTab} className="lab-rail-tabs" />
          {search(railTab)}
          <GalleryScroll>{gallery(railTab)}</GalleryScroll>
        </aside>
      )}

      <section className="lab-main" aria-label="Editor">
        <LabToolbar
          media={media}
          playing={isPlaying}
          canPlay={canPlay}
          zoom={zoom}
          recording={recording}
          onUpload={() => fileRef.current?.click()}
          onCamera={openCamera}
          onSample={openSample}
          onZoom={setZoom}
          onCompare={setComparing}
          onTogglePlay={togglePlay}
          onRecord={toggleRecording}
          onFullscreen={toggleFullscreen}
          onExport={() => setExporting(true)}
        />
        <LabStage
          ref={stageRef}
          canvasRef={canvasRef}
          media={media}
          zoom={zoom}
          padding={desktop ? 32 : 0}
          loading={loading}
          error={error}
          comparing={comparing}
          dropping={dropping}
          hint={desktop && zoom === 'fit' && Boolean(media?.sample)}
          onUpload={() => fileRef.current?.click()}
          onCamera={openCamera}
          onSample={openSample}
        />
        {media?.kind === 'video' && (
          <LabTimeline media={media} playing={isPlaying} trim={trim} onTrim={setTrim} onTogglePlay={togglePlay} />
        )}
      </section>

      {wide ? (
        panel
      ) : desktop ? (
        <aside className="lab-side" aria-label="Library and layers">
          {toolSelector}
          <Track
            label="Panels"
            value={mobileTab}
            options={MOBILE_TABS}
            onChange={setMobileTab}
            className="lab-mobile-tabs"
          />
          {mobileTab === 'layers' ? (
            panel
          ) : (
            <>
              {search(mobileTab)}
              <GalleryScroll>{gallery(mobileTab)}</GalleryScroll>
            </>
          )}
        </aside>
      ) : (
        <section className="lab-mobile" aria-label="Library and layers">
          <Track
            label="Panels"
            value={mobileTab}
            options={MOBILE_TABS}
            onChange={setMobileTab}
            className="lab-mobile-tabs"
          />
          {mobileTab === 'layers' ? (
            panel
          ) : (
            <>
              {search(mobileTab)}
              <div className="lab-mobile-gallery">{gallery(mobileTab)}</div>
            </>
          )}
        </section>
      )}

      {exporting && media && (
        <ExportDialog
          media={media}
          layers={stack.layers}
          strength={strength}
          serializable={stack.serializable}
          trim={trim}
          clock={media.kind === 'video' ? media.player.currentTime : clock.current}
          settings={exportSettings}
          onSettings={setExportSettings}
          onImport={importStyle}
          onClose={() => setExporting(false)}
        />
      )}
    </div>
  );
}
