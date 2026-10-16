import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Engine } from './engine/engine';
import { EFFECTS, EFFECT_LIST } from './effects';
import { LOOKS, LOOKS_BY_ID } from './looks';
import { useLayers } from './state/useLayers';
import { useThumbnails } from './state/useThumbnails';
import {
  isMediaFile,
  loadFile,
  loadSample,
  mediaFrame,
  randomSampleVideo,
  releaseMedia,
  startCamera,
  workSize
} from './media';
import { decodeLook, readSharedLook } from './share';
import { EffectsGrid, GallerySearch, GalleryScroll, LooksGrid } from './components/Gallery';
import LayersPanel from './components/LayersPanel';
import LabToolbar from './components/LabToolbar';
import LabStage from './components/LabStage';
import LabTimeline from './components/LabTimeline';
import ExportDialog from './components/ExportDialog';
import { Track } from '../background-studio/components/ui';
import { downloadBlob } from '../background-studio/utils/download';
import '../background-studio/studio.css';
import './lab.css';

const WIDE_QUERY = '(min-width: 1280px)';
const DESKTOP_QUERY = '(min-width: 1024px)';
const DEFAULT_LOOK = 'soft-type';
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
  const stack = useLayers();
  const { add: addLayer, applyLook, replace: replaceLayers } = stack;
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [railTab, setRailTab] = useState('looks');
  const [mobileTab, setMobileTab] = useState('looks');
  const [zoom, setZoom] = useState('fit');
  const [comparing, setComparing] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [defaultSample] = useState(randomSampleVideo);
  const [trim, setTrim] = useState([0, 0]);
  const [thumbVersion, setThumbVersion] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [strength, setStrength] = useState(1);
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

  const thumbs = useThumbnails(media, thumbVersion);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let engine;
    try {
      engine = new Engine(canvas);
    } catch (problem) {
      setError(problem.message);
      return undefined;
    }
    engineRef.current = engine;
    let raf = 0;
    let last = performance.now();
    let shown = -1;
    let shownMedia = null;
    const tick = now => {
      raf = requestAnimationFrame(tick);
      const state = live.current;
      if (!state.media) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const media = state.media;
      const kind = media.kind;
      if (kind !== 'video' && (state.playing || kind === 'camera')) clock.current += dt;
      let fresh = false;
      if (kind === 'video') {
        media.player.update();
        fresh = media.player.version !== shown || shownMedia !== media;
      }
      const moving = kind === 'camera' || fresh || (state.playing && state.animated);
      if (!moving && !dirty.current) return;
      const frame = mediaFrame(media);
      if (!frame) return;
      dirty.current = false;
      if (kind === 'video') {
        shown = media.player.version;
        shownMedia = media;
      }
      try {
        if (kind !== 'image') engine.setSource(frame.image, frame.width, frame.height);
        const time = kind === 'video' ? media.player.currentTime : clock.current;
        engine.render(state.layers, EFFECTS, {
          ...workSize(media),
          time,
          frame: Math.round(time * 30),
          original: state.comparing,
          mirror: Boolean(media.mirror),
          rotation: frame.rotation,
          flip: frame.flip,
          strength: state.strength
        });
      } catch (problem) {
        console.error(problem);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    dirty.current = true;
  }, [stack.layers, comparing, media, zoom, strength]);

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

  const openMedia = useCallback(async loader => {
    setLoading(true);
    setError(null);
    try {
      const next = await loader();
      releaseMedia(mediaRef.current);
      mediaRef.current = next;
      if (next.kind === 'image') engineRef.current?.setSource(next.element, next.width, next.height);
      if (next.kind === 'video') {
        setTrim([0, next.duration]);
        next.player.setRange(0, next.duration);
        await next.player.play();
        setPlaying(true);
      }
      clock.current = 0;
      setMedia(next);
      setThumbVersion(version => version + 1);
    } catch (problem) {
      setError(problem?.message || 'That file could not be opened.');
    } finally {
      setLoading(false);
    }
  }, []);

  const openFile = useCallback(file => openMedia(() => loadFile(file)), [openMedia]);
  const openSample = useCallback(sample => openMedia(() => loadSample(sample)), [openMedia]);
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

  useEffect(() => {
    const shared = readSharedLook();
    if (shared) replaceLayers(shared);
    else applyLook(LOOKS_BY_ID[DEFAULT_LOOK]);
    openSample(defaultSample);
    return () => releaseMedia(mediaRef.current);
  }, [applyLook, defaultSample, openSample, replaceLayers]);

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
      const file = [...(event.clipboardData?.files || [])].find(isMediaFile);
      if (file) {
        event.preventDefault();
        openFile(file);
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
  }, [openFile, replaceLayers]);

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
      const file = [...(event.dataTransfer?.files || [])].find(isMediaFile);
      if (file) openFile(file);
      else toast.error('Drop an image or video file.');
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
  }, [openFile]);

  const canPlay = Boolean(media) && media.kind !== 'camera' && (media.kind === 'video' || animated);
  const isPlaying = playing;

  const library = tab =>
    tab === 'looks' ? (
      <LooksGrid thumbs={thumbs} activeLook={stack.look} onApply={pickLook} query={queries.looks} />
    ) : (
      <EffectsGrid thumbs={thumbs} onAdd={addEffect} query={queries.effects} />
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
        accept="image/*,video/mp4,video/webm,video/quicktime,.mov,.m4v"
        hidden
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) openFile(file);
          event.target.value = '';
        }}
      />

      {wide && (
        <aside className="lab-rail" aria-label="Styles and effects">
          {toolSelector}
          <Track label="Library" value={railTab} options={RAIL_TABS} onChange={setRailTab} className="lab-rail-tabs" />
          {search(railTab)}
          <GalleryScroll>{library(railTab)}</GalleryScroll>
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
              <GalleryScroll>{library(mobileTab)}</GalleryScroll>
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
              <div className="lab-mobile-gallery">{library(mobileTab)}</div>
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
          onClose={() => setExporting(false)}
        />
      )}
    </div>
  );
}
