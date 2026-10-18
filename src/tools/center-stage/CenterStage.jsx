import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Track } from '../background-studio/components/ui';
import LabTimeline from '../texture-lab/components/LabTimeline';
import { useShot } from './state/useShot';
import { useThumbnails } from './state/useThumbnails';
import { DEFAULT_PRESET, PRESETS, PRESETS_BY_ID } from './presets/index';
import {
  SAMPLES,
  carryOver,
  clipRange,
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
import {
  RECORD_LIMIT,
  canCapture,
  canRecord,
  captureProblem,
  isQuietCancel,
  openCapture,
  openPage,
  pageAddress,
  pageHost,
  surfaceLabel
} from './capture';
import { pageSize } from './guide';
import { isLooping, slotFor, surfaceRole } from './engine/scene';
import { PresetFilter, PresetGrid, PresetSearch, GalleryScroll } from './components/PresetGallery';
import Panel from './components/Panel';
import Toolbar from './components/Toolbar';
import StageView from './components/StageView';
import Timeline from './components/Timeline';
import ExportDialog from './components/ExportDialog';
import CaptureDialog from './components/CaptureDialog';
import CaptureHud from './components/CaptureHud';
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
const PAGE_KEY = 'center-stage-page';

const readPage = () => {
  try {
    return localStorage.getItem(PAGE_KEY) || '';
  } catch {
    return '';
  }
};

const storePage = value => {
  try {
    localStorage.setItem(PAGE_KEY, value);
  } catch {
    return false;
  }
  return true;
};
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
  const [capture, setCaptureState] = useState(null);
  const [trimming, setTrimming] = useState(null);
  const [captureDialog, setCaptureDialog] = useState(null);
  const [pageScreens, setPageScreens] = useState(0);
  const pageRef = useRef(null);
  const scrollRef = useRef(null);
  const [, setTrimTick] = useState(0);
  const [supportsCapture] = useState(canCapture);
  const [supportsRecord] = useState(canRecord);
  const captureRef = useRef(null);
  const captureActions = useRef(null);
  const arming = useRef(false);
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
        ? Math.max(...slots.filter(media => media?.kind === 'video').map(media => clipRange(media).length))
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
        const range = clipRange(media);
        media.player.setRange(range.start, range.end);
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

  const targetSlot = targets => {
    const devices = shotRef.current.doc.devices;
    const current = targets.map(index => slotFor(devices[index], sizesRef.current));
    const first = current[0];
    const alone =
      first !== null &&
      isOwn(first) &&
      current.every(slot => slot === first) &&
      devices.every((device, index) => targets.includes(index) || slotFor(device, sizesRef.current) !== first);
    return alone ? first : allocate(1)[0];
  };

  const fillScreens = async (targets, file) => {
    if (!isMediaFile(file)) {
      toast.error('Drop an image or video file.');
      return;
    }
    const devices = shotRef.current.doc.devices;
    if (!targets.length || !devices.length) return;
    const slot = targetSlot(targets);
    const media = await putSlot(slot, prepared(file, devices.length > 4));
    if (media) assignScreens(targets, slot);
  };

  const setCapture = value => {
    captureRef.current = value;
    setCaptureState(value);
  };

  const freezeCapture = live => {
    const still = live.snapshot();
    setSlots(previous => {
      const index = previous.indexOf(live);
      if (index < 0) return previous;
      const next = [...previous];
      next[index] = still;
      return next;
    });
    live.release();
    if (captureRef.current?.media === live) setCapture(null);
  };

  const resumeCapture = live => {
    const current = captureRef.current;
    if (current?.media !== live || live.released) return;
    if (live.ended) freezeCapture(live);
    else setCapture({ media: live, status: 'live', startedAt: null, canScroll: live.canDrive(), opening: false });
  };

  const startCapture = async (targets, options) => {
    const busy = captureRef.current?.status;
    if (!targets.length || busy === 'recording' || busy === 'saving') return;
    let live = null;
    try {
      live = await openCapture(options);
    } catch (problem) {
      if (!isQuietCancel(problem)) toast.error(captureProblem(problem));
      return;
    } finally {
      setHighlight(null);
    }
    const previous = captureRef.current;
    if (!shotRef.current.doc.devices.length || previous?.status === 'recording' || previous?.status === 'saving') {
      live.release();
      return;
    }
    const slot = targetSlot(targets);
    if (previous && slotsRef.current[slot] !== previous.media) freezeCapture(previous.media);
    live.role = roleOf(live);
    live.onEnd(() => captureActions.current?.ended(live));
    live.onResize(() => setSlots(current => (current.includes(live) ? [...current] : current)));
    live.onHelper(() => {
      const latest = captureRef.current;
      if (latest?.media !== live || live.released || latest.scrolling) return;
      setCapture({ ...latest, canScroll: live.canDrive() });
    });
    const media = await putSlot(slot, () => Promise.resolve(live));
    if (!media) {
      live.release();
      return;
    }
    assignScreens(targets, slot);
    const opening = live.opening;
    setCapture({ media: live, status: 'live', startedAt: null, canScroll: live.canDrive(), opening: Boolean(opening) });
    opening?.then(() => {
      const latest = captureRef.current;
      if (latest?.media !== live || live.released) return;
      setCapture({
        ...latest,
        opening: false,
        canScroll: latest.status === 'live' ? live.canDrive() : latest.canScroll
      });
    });
  };

  const followForwarding = (live, status, forwarding) =>
    forwarding.then(ok => {
      const latest = captureRef.current;
      if (latest?.media === live && latest.status === status) setCapture({ ...latest, forwarding: ok });
    });

  const startRecording = async () => {
    const current = captureRef.current;
    if (!current || current.status !== 'live' || arming.current) return;
    const live = current.media;
    const forwarding = live.forward(stageRef.current);
    arming.current = true;
    try {
      const recorder = await live.record({
        limit: RECORD_LIMIT,
        onLimit: () => captureActions.current?.stopRecording(),
        onFail: problem => captureActions.current?.failRecording(problem)
      });
      if (captureRef.current?.media !== live) {
        recorder.cancel();
        live.unforward();
        return;
      }
      scrollRef.current = null;
      setCapture({
        media: live,
        status: 'recording',
        startedAt: recorder.started,
        forwarding: null,
        canScroll: live.canDrive(),
        scrolling: false
      });
      followForwarding(live, 'recording', forwarding);
    } catch (problem) {
      live.unforward();
      toast.error(problem?.message || 'The recording could not start.');
    } finally {
      arming.current = false;
    }
  };

  const autoScroll = () => {
    const current = captureRef.current;
    if (!current || current.status !== 'recording' || current.scrolling) return;
    const scroller = current.media.scrollPage();
    if (!scroller) return;
    scrollRef.current = { scroller, since: current.startedAt, times: null };
    setCapture({ ...current, scrolling: true });
    scroller.done.then(times => {
      if (scrollRef.current?.scroller !== scroller) return;
      if (times) {
        scrollRef.current.times = times;
        setTimeout(() => captureActions.current?.stopRecording(), 700);
        return;
      }
      scrollRef.current = null;
      const latest = captureRef.current;
      if (latest?.status === 'recording')
        setCapture({ ...latest, scrolling: false, canScroll: latest.media.canDrive() });
    });
  };

  const stopRecording = async () => {
    const current = captureRef.current;
    if (!current || current.status !== 'recording') return;
    const live = current.media;
    const recorder = live.recorder;
    const scrolled = scrollRef.current;
    scrolled?.scroller.stop();
    scrollRef.current = null;
    live.unforward();
    setCapture({ ...current, status: 'saving' });
    let result = null;
    try {
      result = recorder ? await recorder.stop() : null;
    } catch (problem) {
      if (!live.released) toast.error(problem?.message || 'The recording could not be saved.');
      resumeCapture(live);
      return;
    }
    if (live.released) return;
    if (!result) {
      toast(`Nothing changed in the ${surfaceLabel(live).toLowerCase()} while recording.`);
      resumeCapture(live);
      return;
    }
    const slot = slotsRef.current.indexOf(live);
    if (slot < 0) return;
    const clip = await putSlot(slot, async () => {
      const media = await openFile(result.file);
      const times = scrolled?.times;
      const origin = result.origin ? result.origin - performance.timeOrigin : scrolled?.since;
      const span = times
        ? [Math.max(0, (times.start - origin) / 1000 - 0.4), (times.end - origin) / 1000 + 0.6]
        : [result.start, result.end];
      const trim =
        span[1] === null
          ? undefined
          : {
              start: Math.min(span[0], media.duration),
              end: Math.min(Math.max(span[1], span[0] + 0.5), media.duration)
            };
      return Object.assign(media, { role: live.role, name: `${surfaceLabel(live)} recording`, trim });
    });
    if (!clip) {
      resumeCapture(live);
      return;
    }
    setTrimming(slot);
  };

  const trimVideo = (slot, [start, end]) => {
    const media = slotsRef.current[slot];
    if (media?.kind !== 'video') return;
    media.trim = { start, end };
    setTrimTick(tick => tick + 1);
  };

  const failRecording = problem => {
    const current = captureRef.current;
    if (!current || current.status !== 'recording') return;
    current.media.recorder?.cancel();
    toast.error(problem?.message || 'The recording stopped unexpectedly.');
    resumeCapture(current.media);
  };

  const startPage = () => {
    const current = captureRef.current;
    if (!current || current.status !== 'live') return;
    const live = current.media;
    const auto = live.canDrive();
    const forwarding = auto ? null : live.forward(stageRef.current);
    setPageScreens(1);
    live.startPage({ onProgress: setPageScreens, onEnd: () => captureActions.current?.finishPage() });
    setCapture({ media: live, status: 'paging', auto, forwarding: null, startedAt: null, canScroll: auto });
    if (forwarding) followForwarding(live, 'paging', forwarding);
  };

  const finishPage = async () => {
    const current = captureRef.current;
    if (!current || current.status !== 'paging') return;
    const live = current.media;
    setCapture({ ...current, status: 'building' });
    let still = null;
    try {
      still = await live.finishPage();
    } catch (problem) {
      toast.error(problem?.message || 'The page could not be stitched.');
    }
    if (live.released) return;
    if (!still) {
      resumeCapture(live);
      return;
    }
    setSlots(previous => {
      const index = previous.indexOf(live);
      if (index < 0) return previous;
      const next = [...previous];
      next[index] = still;
      return next;
    });
    live.release();
    if (captureRef.current?.media === live) setCapture(null);
    toast(`Full page captured, ${still.screens.toFixed(1)} screens tall`);
  };

  const cancelPage = () => {
    const current = captureRef.current;
    if (!current || current.status !== 'paging') return;
    current.media.cancelPage();
    resumeCapture(current.media);
  };

  const captureEnded = live => {
    const current = captureRef.current;
    if (current?.media !== live) {
      if (slotsRef.current.includes(live)) freezeCapture(live);
      return;
    }
    if (current.status === 'recording') stopRecording();
    else if (current.status === 'paging') finishPage();
    else if (current.status === 'live') freezeCapture(live);
  };

  captureActions.current = { ended: captureEnded, stopRecording, failRecording, finishPage };

  const dialogDevice = captureDialog ? doc.devices[captureDialog.targets[0]] || doc.devices[0] : null;
  const capturePage = dialogDevice ? pageSize(dialogDevice) : null;

  const openCaptureDialog = targets => {
    const busy = captureRef.current?.status;
    if (busy && busy !== 'live') return;
    setCaptureDialog({ targets, step: 'url' });
  };

  const closeCaptureDialog = useCallback(() => {
    pageRef.current?.page?.close?.();
    pageRef.current = null;
    setCaptureDialog(null);
  }, []);

  const openPageWindow = text => {
    const menu = captureDialog;
    if (!menu) return;
    const url = pageAddress(text);
    if (!url) {
      toast.error('Enter a web address, like reactbits.dev');
      return;
    }
    storePage(text.trim());
    const devices = shotRef.current.doc.devices;
    const size = pageSize(devices[menu.targets[0]] || devices[0]);
    const host = pageHost(url);
    pageRef.current?.page?.close?.();
    const page = openPage(host);
    if (!page) {
      toast.error('Allow pop-ups for this site, then try again.');
      return;
    }
    pageRef.current = { page, url, size: size.size, density: size.density, host };
    setCaptureDialog({ ...menu, step: 'opened', host });
  };

  const sharePage = () => {
    const menu = captureDialog;
    if (!menu) return;
    setCaptureDialog(null);
    const opened = pageRef.current;
    pageRef.current = null;
    startCapture(menu.targets, {
      density: opened?.density,
      page: opened?.page,
      host: opened?.host,
      url: opened?.url,
      size: opened?.size
    });
  };

  const shareTab = () => {
    const menu = captureDialog;
    if (!menu) return;
    pageRef.current?.page?.close?.();
    pageRef.current = null;
    setCaptureDialog(null);
    startCapture(menu.targets);
  };

  const backToAddress = () => setCaptureDialog(current => current && { ...current, step: 'url' });

  useEffect(() => {
    if (trimming !== null && slots[trimming]?.kind !== 'video') setTrimming(null);
  }, [slots, trimming]);

  useEffect(() => {
    const current = captureRef.current;
    if (!current || slots.includes(current.media)) return;
    current.media.release();
    captureRef.current = null;
    setCaptureState(null);
  }, [slots]);

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
        if (restart) media.player.seek(clipRange(media).start);
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
      media.player.seek(clipRange(media).start);
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
      const range = clipRange(media);
      media.player.pause();
      media.player.seek(range.start + (value % range.length));
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
    if (key === 'escape' && trimming !== null) {
      setTrimming(null);
      return;
    }
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
      onTrimScreen={index => {
        const slot = slotFor(shotRef.current.doc.devices[index], sizesRef.current);
        if (slot !== null && slotsRef.current[slot]?.kind === 'video') setTrimming(slot);
      }}
      onCaptureScreen={
        supportsCapture && capture?.status !== 'recording' && capture?.status !== 'saving'
          ? index => openCaptureDialog([index])
          : null
      }
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
          canCapture={supportsCapture}
          capturing={Boolean(capture) || Boolean(captureDialog)}
          onCapture={() => openCaptureDialog(fillTargets(selectedDevice))}
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
          onCapture={supportsCapture ? () => openCaptureDialog(fillTargets(selectedDevice)) : null}
          forwarding={Boolean(capture?.forwarding)}
          hud={
            capture && (
              <CaptureHud
                capture={capture}
                screens={pageScreens}
                canRecord={supportsRecord}
                onFullPage={startPage}
                onRecord={startRecording}
                onDone={() => captureRef.current && freezeCapture(captureRef.current.media)}
                onFinishPage={finishPage}
                onCancelPage={cancelPage}
                onStopRecording={stopRecording}
                onAutoScroll={autoScroll}
                onShowPage={() => captureRef.current?.media.showWindow()}
              />
            )
          }
          repeat={repeat}
          length={loopLength}
          onEnded={stopAtEnd}
        />
        {trimming !== null && slots[trimming]?.kind === 'video' ? (
          <LabTimeline
            media={slots[trimming]}
            playing={isPlaying}
            trim={[clipRange(slots[trimming]).start, clipRange(slots[trimming]).end]}
            onTrim={value => trimVideo(trimming, value)}
            onTogglePlay={togglePlay}
          >
            <button type="button" className="cst-trim-done" onClick={() => setTrimming(null)}>
              Done
            </button>
          </LabTimeline>
        ) : (
          animated && (
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
          )
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
      {captureDialog && capturePage && (
        <CaptureDialog
          dialog={captureDialog}
          page={capturePage}
          initialUrl={readPage()}
          onOpen={openPageWindow}
          onShare={sharePage}
          onShareTab={shareTab}
          onBack={backToAddress}
          onClose={closeCaptureDialog}
        />
      )}
    </div>
  );
}
