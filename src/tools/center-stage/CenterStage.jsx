import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Track } from '../background-studio/components/ui';
import { useShot } from './state/useShot';
import { useThumbnails } from './state/useThumbnails';
import { DEFAULT_PRESET, PRESETS, PRESETS_BY_ID } from './presets/index';
import {
  SAMPLES,
  carryOver,
  frameOf,
  isMediaFile,
  mediaSizes,
  openFile,
  openSample,
  releaseMedia,
  roleOf,
  shrinkImage
} from './media';
import { decodeShot, readSharedShot } from './share';
import { isLooping, slotFor, surfaceRole } from './engine/scene';
import { PresetFilter, PresetGrid, PresetSearch, GalleryScroll } from './components/PresetGallery';
import Panel from './components/Panel';
import Toolbar from './components/Toolbar';
import StageView from './components/StageView';
import Timeline from './components/Timeline';
import ExportDialog from './components/ExportDialog';
import '../background-studio/studio.css';
import '../texture-lab/lab.css';
import './cst.css';

const WIDE_QUERY = '(min-width: 1280px)';
const LOOP_KEY = 'center-stage-loop';

const readLoop = () => {
  try {
    return localStorage.getItem(LOOP_KEY) !== '0';
  } catch {
    return true;
  }
};

const storeLoop = value => {
  try {
    localStorage.setItem(LOOP_KEY, value ? '1' : '0');
  } catch {
    return false;
  }
  return true;
};
const GALLERY_SIDE = 2560;
const DESKTOP_QUERY = '(min-width: 1024px)';

const SIDE_TABS = [
  { value: 'presets', label: 'Presets' },
  { value: 'edit', label: 'Edit' }
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

const slotThumb = media => {
  const frame = frameOf(media);
  if (!frame) return null;
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 160 / Math.max(frame.width, frame.height));
  canvas.width = Math.max(1, Math.round(frame.width * scale));
  canvas.height = Math.max(1, Math.round(frame.height * scale));
  try {
    canvas.getContext('2d').drawImage(frame.image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch {
    return null;
  }
};

const initialShot = () => {
  const shared = readSharedShot();
  return shared ? { doc: shared, preset: null } : { doc: PRESETS_BY_ID[DEFAULT_PRESET].doc, preset: DEFAULT_PRESET };
};

export default function CenterStage({ toolSelector }) {
  const wide = useMediaQuery(WIDE_QUERY);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const [initial] = useState(initialShot);
  const shot = useShot(initial.doc, initial.preset);
  const { doc } = shot;
  const [slots, setSlots] = useState([null, null, null]);
  const [loadingSlots, setLoadingSlots] = useState(new Set([0, 1, 2]));
  const [selectedDevice, setSelectedDevice] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [repeat, setRepeat] = useState(readLoop);
  const [time, setTime] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [query, setQuery] = useState('');
  const [presetGroup, setPresetGroup] = useState('all');
  const [sideTab, setSideTab] = useState('presets');
  const [error, setError] = useState(null);
  const timeRef = useRef(0);
  const stageRef = useRef(null);
  const fileRef = useRef(null);
  const searchRef = useRef(null);
  const uploadTarget = useRef(null);
  const reserved = useRef(SAMPLES.length);
  const [highlight, setHighlight] = useState(null);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const shotRef = useRef(shot);
  shotRef.current = shot;

  const shown = slots;
  const sizes = useMemo(() => mediaSizes(slots), [slots]);
  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;
  const { thumbs, request: requestThumb } = useThumbnails(loadingSlots.size ? null : shown, 0);
  const slotThumbs = useMemo(() => shown.map(slotThumb), [shown]);
  const preset = shot.preset ? PRESETS_BY_ID[shot.preset] : null;
  const motionKind = doc.motion?.kind || 'none';
  const hasVideo = slots.some(media => media?.kind === 'video');
  const animated = motionKind !== 'none' || hasVideo || doc.background?.kind === 'reactbits';
  const isPlaying = playing && animated && !exporting;
  const loopLength =
    motionKind !== 'none'
      ? doc.motion.duration || 6
      : hasVideo
        ? Math.max(...slots.filter(media => media?.kind === 'video').map(media => media.duration))
        : 6;

  const putSlot = useCallback(async (slot, loader) => {
    setLoadingSlots(previous => new Set(previous).add(slot));
    setError(null);
    try {
      const media = await loader();
      setSlots(previous => {
        const next = [...previous];
        while (next.length < slot) next.push(null);
        if (next[slot] !== media) releaseMedia(next[slot]);
        next[slot] = media;
        return next;
      });
      if (media.kind === 'video') {
        media.player.setRange(0, media.duration);
        await media.player.play();
        setPlaying(true);
      }
      return media;
    } catch (problem) {
      toast.error(problem?.message || 'That file could not be opened.');
      return null;
    } finally {
      setLoadingSlots(previous => {
        const next = new Set(previous);
        next.delete(slot);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    SAMPLES.forEach(sample => putSlot(sample.slot, () => openSample(sample)));
    return () => slotsRef.current.forEach(releaseMedia);
  }, [putSlot]);

  const allocate = count => {
    const start = Math.max(reserved.current, slotsRef.current.length);
    reserved.current = start + count;
    return Array.from({ length: count }, (_, offset) => start + offset);
  };

  const isOwn = slot => slot !== null && Boolean(slotsRef.current[slot]) && !slotsRef.current[slot].sample;

  const fillTargets = index => {
    const devices = shotRef.current.doc.devices;
    if (index === 'all') return devices.map((_, position) => position);
    const device = devices[index] || devices[0];
    if (!device) return [];
    const target = devices[index] ? index : 0;
    const role = surfaceRole(device);
    const same = devices
      .map((_, position) => position)
      .filter(position => surfaceRole(devices[position]) === role && !devices[position].blank);
    const fresh = same.every(position => !isOwn(slotFor(devices[position], sizesRef.current)));
    return fresh ? [...new Set([target, ...same])] : [target];
  };

  const assignScreens = (targets, slot) => {
    const patch = {};
    targets.forEach(index => {
      patch[`devices.${index}.slot`] = slot;
      patch[`devices.${index}.pick`] = undefined;
      patch[`devices.${index}.blank`] = undefined;
    });
    shotRef.current.patch(patch);
  };

  const prepared = (file, gallery) => async () => {
    const media = await openFile(file);
    return gallery ? shrinkImage(media, GALLERY_SIDE) : Object.assign(media, { role: roleOf(media) });
  };

  const fillScreens = async (targets, file) => {
    if (!isMediaFile(file)) {
      toast.error('Drop an image or video file.');
      return;
    }
    const devices = shotRef.current.doc.devices;
    if (!targets.length || !devices.length) return;
    const current = targets.map(index => slotFor(devices[index], sizesRef.current));
    const first = current[0];
    const alone =
      first !== null &&
      isOwn(first) &&
      current.every(slot => slot === first) &&
      devices.every((device, index) => targets.includes(index) || slotFor(device, sizesRef.current) !== first);
    const [slot] = alone ? [first] : allocate(1);
    const media = await putSlot(slot, prepared(file, devices.length > 4));
    if (media) assignScreens(targets, slot);
  };

  const fillAll = async files => {
    const list = [...files].filter(isMediaFile);
    if (!list.length) {
      toast.error('Drop image or video files.');
      return;
    }
    if (list.length === 1) {
      fillScreens(fillTargets(selectedDevice), list[0]);
      return;
    }
    const gallery = shotRef.current.doc.devices.length > 4;
    const indices = allocate(list.length);
    const loaded = await Promise.all(list.map((file, position) => putSlot(indices[position], prepared(file, gallery))));
    const pools = { desktop: [], mobile: [] };
    loaded.forEach((media, position) => {
      if (media) pools[roleOf(media)].push(indices[position]);
    });
    const count = { desktop: 0, mobile: 0 };
    const patch = {};
    shotRef.current.doc.devices.forEach((device, index) => {
      const role = surfaceRole(device);
      const pool = pools[role].length ? pools[role] : pools[role === 'mobile' ? 'desktop' : 'mobile'];
      if (!pool.length) return;
      patch[`devices.${index}.slot`] = pool[count[role]++ % pool.length];
      patch[`devices.${index}.pick`] = undefined;
      patch[`devices.${index}.blank`] = undefined;
    });
    if (Object.keys(patch).length) shotRef.current.patch(patch);
  };

  const chooseFiles = target => {
    uploadTarget.current = target;
    if (fileRef.current) {
      fileRef.current.multiple = target === 'all';
      fileRef.current.click();
    }
  };

  const sampleScreen = (index, sample) => assignScreens([index], sample.slot);

  const blankScreen = index => shotRef.current.set(`devices.${index}.blank`, true);

  const highlightUpload = on => setHighlight(on ? fillTargets(selectedDevice) : null);

  const applyPreset = useCallback(
    item => {
      shot.applyPreset(item, { map: next => carryOver(next, slotsRef.current, surfaceRole) });
      setSelectedDevice(0);
      timeRef.current = 0;
      setTime(0);
      setPlaying(true);
    },
    [shot]
  );

  const stepPreset = direction => {
    const index = Math.max(
      0,
      PRESETS.findIndex(item => item.id === shot.preset)
    );
    applyPreset(PRESETS[(index + direction + PRESETS.length) % PRESETS.length]);
  };

  const endRef = useRef({ repeat, loopLength });
  endRef.current = { repeat, loopLength };

  const togglePlay = useCallback(() => {
    setPlaying(previous => {
      const next = !previous;
      const { repeat: looping, loopLength: end } = endRef.current;
      const restart = next && !looping && timeRef.current >= end - 0.02;
      if (restart) timeRef.current = 0;
      slotsRef.current.forEach(media => {
        if (media?.kind !== 'video') return;
        if (restart) media.player.seek(0);
        if (next) media.player.play();
        else media.player.pause();
      });
      return next;
    });
  }, []);

  const replay = useCallback(() => {
    timeRef.current = 0;
    setTime(0);
    slotsRef.current.forEach(media => {
      if (media?.kind !== 'video') return;
      media.player.seek(0);
      media.player.play();
    });
    setPlaying(true);
  }, []);

  const stopAtEnd = useCallback(() => {
    setPlaying(false);
    slotsRef.current.forEach(media => {
      if (media?.kind === 'video') media.player.pause();
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat(previous => {
      storeLoop(!previous);
      return !previous;
    });
  }, []);

  const seek = value => {
    timeRef.current = value;
    setTime(value);
    slotsRef.current.forEach(media => {
      if (media?.kind !== 'video') return;
      media.player.pause();
      media.player.seek(value % media.duration);
    });
    setPlaying(false);
  };

  const toggleFullscreen = useCallback(() => {
    const element = stageRef.current;
    if (!element) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else Promise.resolve(element.requestFullscreen?.()).catch(() => toast.error('Fullscreen is not available here'));
  }, []);

  const onCamera = useCallback(
    (values, key) =>
      shot.patch(Object.fromEntries(Object.entries(values).map(([name, value]) => [`camera.${name}`, value])), key),
    [shot]
  );

  const resetCamera = () => {
    const camera = preset?.doc.camera ?? {};
    shot.patch(
      { camera: { rx: 0, ry: 0, rz: 0, zoom: 1, fov: 28, x: 0, y: 0, pad: 0.14, target: null, ...camera } },
      'reset-camera'
    );
  };

  const pick = hit => {
    if (!hit) return;
    setSelectedDevice(hit.device);
    if ((doc.depth?.amount ?? 0) > 0.001) {
      shot.set(
        'depth.focus',
        { device: hit.device, u: Number(hit.u.toFixed(3)), v: Number(hit.v.toFixed(3)) },
        'focus'
      );
    }
    if (!wide) setSideTab('edit');
  };

  const addDevice = () => {
    const last = doc.devices[doc.devices.length - 1] || {};
    const phone = last.type !== 'phone';
    const next = phone
      ? { type: 'phone', finish: 'black', slot: 1, x: (last.x || 0) + 2.1, y: -0.2, z: 0.6, ry: -12 }
      : { type: 'phone', finish: 'silver', slot: 1, x: (last.x || 0) + 0.95, z: (last.z || 0) - 0.4, ry: last.ry || 0 };
    shot.set('devices', [...doc.devices, next], 'add-device');
    setSelectedDevice(doc.devices.length);
  };

  const removeDevice = index => {
    if (doc.devices.length < 2) return;
    shot.set(
      'devices',
      doc.devices.filter((_, position) => position !== index),
      'remove-device'
    );
    setSelectedDevice(Math.max(0, index - 1));
  };

  const keys = useRef(null);
  keys.current = event => {
    if (exporting || event.defaultPrevented) return;
    const key = event.key.toLowerCase();
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && key === 'o') {
      event.preventDefault();
      chooseFiles(fillTargets(selectedDevice));
      return;
    }
    if (modifier && (key === 'z' || key === 'y')) {
      if (typeof event.target?.matches === 'function' && event.target.matches('input, textarea')) return;
      event.preventDefault();
      if (key === 'y' || event.shiftKey) shot.redo();
      else shot.undo();
      return;
    }
    if (modifier || event.altKey || isTyping(event.target)) return;
    if (key === ' ') {
      if (typeof event.target?.closest === 'function' && event.target.closest('button, a')) return;
      event.preventDefault();
      togglePlay();
    } else if (key === 'f') {
      toggleFullscreen();
    } else if (key === 'l') {
      toggleRepeat();
    } else if (key === 'home') {
      event.preventDefault();
      replay();
    } else if (key === 'e') {
      setExporting(true);
    } else if (key === 'r') {
      resetCamera();
    } else if (key === 'arrowright' || key === 'arrowleft') {
      event.preventDefault();
      stepPreset(key === 'arrowright' ? 1 : -1);
    } else if (key === '/') {
      event.preventDefault();
      if (!wide) setSideTab('presets');
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  };

  useEffect(() => {
    const down = event => keys.current?.(event);
    const paste = event => {
      const file = [...(event.clipboardData?.files || [])].find(isMediaFile);
      if (file) {
        event.preventDefault();
        fillScreens(fillTargets(selectedDevice), file);
        return;
      }
      if (isTyping(event.target)) return;
      const text = event.clipboardData?.getData('text');
      const shared = text && decodeShot(text);
      if (shared) {
        event.preventDefault();
        shot.replace(shared);
        toast.success('Shot pasted');
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('paste', paste);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('paste', paste);
    };
  });

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
      depth = 0;
      setDropping(false);
      if (!hasFiles(event)) return;
      event.preventDefault();
      const files = [...(event.dataTransfer?.files || [])];
      if (files.length) fillAll(files);
    };
    const reset = () => {
      depth = 0;
      setDropping(false);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', reset, true);
    window.addEventListener('drop', drop);
    window.addEventListener('dragend', reset);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', reset, true);
      window.removeEventListener('drop', drop);
      window.removeEventListener('dragend', reset);
    };
  });

  const samplesOnly = slots.every(media => !media || media.sample);

  const gallery = (
    <>
      <PresetSearch inputRef={searchRef} value={query} onChange={setQuery} />
      <PresetFilter value={presetGroup} onChange={setPresetGroup} />
      <GalleryScroll>
        <PresetGrid
          thumbs={thumbs}
          active={shot.preset}
          onApply={applyPreset}
          onNeed={requestThumb}
          query={query}
          group={presetGroup}
        />
      </GalleryScroll>
    </>
  );

  const panel = (
    <Panel
      shot={shot}
      preset={preset}
      heroKeys={preset?.hero || ['turn', 'tilt', 'bgColor']}
      slots={shown}
      slotThumbs={slotThumbs}
      sizes={sizes}
      selectedDevice={selectedDevice}
      onSelectDevice={setSelectedDevice}
      onUploadScreen={index => chooseFiles([index])}
      onUploadAll={() => chooseFiles('all')}
      onSampleScreen={sampleScreen}
      onBlankScreen={blankScreen}
      onFileScreen={(index, file) => fillScreens([index], file)}
      onHighlight={setHighlight}
      onResetPreset={() => preset && applyPreset(preset)}
      onAddDevice={addDevice}
      onRemoveDevice={removeDevice}
    />
  );

  return (
    <div className="lab cst" data-layout={wide ? 'wide' : desktop ? 'desktop' : 'compact'}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime,.mov,.m4v"
        hidden
        onChange={event => {
          const files = [...(event.target.files || [])];
          const target = uploadTarget.current;
          if (files.length && target === 'all') fillAll(files);
          else if (files.length && Array.isArray(target)) fillScreens(target, files[0]);
          event.target.value = '';
          setHighlight(null);
        }}
      />

      {wide && (
        <aside className="lab-rail cst-rail" aria-label="Presets">
          {toolSelector}
          {gallery}
        </aside>
      )}

      <section className="lab-main" aria-label="Stage">
        <Toolbar
          aspect={doc.aspect}
          onAspect={value => shot.set('aspect', value)}
          playing={isPlaying}
          canPlay={animated}
          onUpload={() => chooseFiles(fillTargets(selectedDevice))}
          onUploadHint={highlightUpload}
          onTogglePlay={togglePlay}
          onFullscreen={toggleFullscreen}
          onExport={() => setExporting(true)}
        />
        <StageView
          ref={stageRef}
          doc={doc}
          slots={shown}
          playing={isPlaying}
          timeRef={timeRef}
          padding={desktop ? 40 : 0}
          onTick={setTime}
          onCamera={onCamera}
          onPick={pick}
          onDropFiles={(files, device) =>
            device === null || files.length > 1 ? fillAll(files) : fillScreens([device], files[0])
          }
          highlight={highlight}
          onResetCamera={resetCamera}
          loading={loadingSlots.size > 0 && slots.every(media => !media)}
          error={error}
          dropping={dropping}
          hint={desktop && samplesOnly}
          onUpload={() => chooseFiles(fillTargets(selectedDevice))}
          onUploadHint={highlightUpload}
          repeat={repeat}
          length={loopLength}
          onEnded={stopAtEnd}
        />
        {animated && (
          <Timeline
            time={time}
            duration={loopLength}
            cyclic={motionKind === 'none' || isLooping(motionKind)}
            repeat={repeat}
            playing={isPlaying}
            onTogglePlay={togglePlay}
            onReplay={replay}
            onToggleRepeat={toggleRepeat}
            onSeek={seek}
          />
        )}
      </section>

      {wide ? (
        panel
      ) : desktop ? (
        <aside className="lab-side" aria-label="Presets and settings">
          {toolSelector}
          <Track label="Panels" value={sideTab} options={SIDE_TABS} onChange={setSideTab} className="lab-mobile-tabs" />
          {sideTab === 'edit' ? panel : gallery}
        </aside>
      ) : (
        <section className="lab-mobile" aria-label="Presets and settings">
          <Track label="Panels" value={sideTab} options={SIDE_TABS} onChange={setSideTab} className="lab-mobile-tabs" />
          {sideTab === 'edit' ? (
            panel
          ) : (
            <>
              <PresetSearch inputRef={searchRef} value={query} onChange={setQuery} />
              <PresetFilter value={presetGroup} onChange={setPresetGroup} />
              <div className="lab-mobile-gallery">
                <PresetGrid
                  thumbs={thumbs}
                  active={shot.preset}
                  onApply={applyPreset}
                  onNeed={requestThumb}
                  query={query}
                  group={presetGroup}
                />
              </div>
            </>
          )}
        </section>
      )}

      {exporting && <ExportDialog doc={doc} slots={shown} time={timeRef.current} onClose={() => setExporting(false)} />}
    </div>
  );
}
