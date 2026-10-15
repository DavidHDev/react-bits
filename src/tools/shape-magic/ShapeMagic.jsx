import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Track } from '../../tools/background-studio/components/ui';
import { GallerySearch, GalleryScroll } from '../../tools/texture-lab/components/Gallery';
import { createRenderer } from './engine/renderer';
import { MAX_LAYERS } from './engine/shader';
import { bindMasks, loadField, maskPlan } from './engine/masks';
import { useHistory } from './state/useHistory';
import { morphPhase } from './state/motion';
import { useFillThumbs, useStaticThumbs } from './state/useThumbnails';
import { useMarkMask } from './state/useMarkMask';
import { useMaterialFrame } from './state/useMaterialFrame';
import {
  DEFAULT_EFFECTS,
  createDoc,
  createImageLayer,
  createLayer,
  createTextLayer,
  inkFill,
  isMaskLayer,
  nextId
} from './state/doc';
import { proceduralFor, styleFor } from './state/style';
import { artboardHalf, flipPatch, positionFor, seedBounds, seedFrame, unionBounds } from './state/geometry';
import { DEFAULT_MARK, MARKS, MARKS_BY_ID } from './presets/marks';
import { MATERIALS, backgroundDefaults, backgroundValues, materialFor } from './presets/materials';
import { loadPresets } from '../../tools/background-studio/utils/presets';
import Toolbar from './components/Toolbar';
import Stage from './components/Stage';
import Inspector from './components/Inspector';
import { MarksGrid, MaterialsGrid } from './components/Gallery';
import ExportDialog from './components/ExportDialog';
import '../../tools/background-studio/studio.css';
import '../../tools/texture-lab/lab.css';
import './smg.css';

const WIDE_QUERY = '(min-width: 1280px)';
const DESKTOP_QUERY = '(min-width: 1024px)';
const SNAP_KEY = 'rb-shape-magic-snapping';
const CLIPBOARD_MARK = 'shapeMagicLayers';

const RAIL_TABS = [
  { value: 'marks', label: 'Marks' },
  { value: 'materials', label: 'Materials' }
];

const MOBILE_TABS = [
  { value: 'marks', label: 'Marks' },
  { value: 'materials', label: 'Materials' },
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

const useLightTheme = () => {
  const read = () => document.documentElement.getAttribute('data-theme') === 'light';
  const [light, setLight] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setLight(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  }, []);
  return light;
};

const readSnapping = () => {
  try {
    return window.localStorage.getItem(SNAP_KEY) !== 'off';
  } catch {
    return true;
  }
};

const writeSnapping = on => {
  try {
    window.localStorage.setItem(SNAP_KEY, on ? 'on' : 'off');
  } catch {
    return;
  }
};

const readFile = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const isLogoFile = file =>
  /^image\/(svg\+xml|png|jpeg|webp|gif)$/.test(file?.type || '') || /\.(svg|png|jpe?g|webp)$/i.test(file?.name || '');

const isTyping = target =>
  Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]'));

const DEFAULT_MATERIAL = 'fx:thermal';

const markFromPreset = preset => ({ ...createDoc(preset).mark, preset: preset.id });

const cloneLayer = (layer, patch = {}) => ({
  ...layer,
  id: nextId(),
  params: { ...layer.params },
  ...(layer.text ? { text: { ...layer.text } } : {}),
  ...(layer.image ? { image: { ...layer.image } } : {}),
  ...patch
});

let memoryClipboard = null;

export default function ShapeMagic({ toolSelector }) {
  const wide = useMediaQuery(WIDE_QUERY);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const light = useLightTheme();
  const history = useHistory(() => ({
    ...createDoc(MARKS_BY_ID[DEFAULT_MARK], { light }),
    material: { id: DEFAULT_MATERIAL, props: {}, preset: DEFAULT_MATERIAL }
  }));
  const { doc, set, replace } = history;
  const [selection, setSelection] = useState([]);
  const [railTab, setRailTab] = useState('marks');
  const [mobileTab, setMobileTab] = useState('marks');
  const [queries, setQueries] = useState({});
  const [maskVersion, setMaskVersion] = useState(0);
  const [artboard, setArtboard] = useState(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [userLogo, setUserLogo] = useState(false);
  const [snapping, setSnapping] = useState(readSnapping);
  const [focusText, setFocusText] = useState(0);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const renderRequestRef = useRef(0);
  const materialRequestRef = useRef(0);
  const fileRef = useRef(null);
  const searchRef = useRef(null);
  const clockRef = useRef(0);
  const dirtyRef = useRef(true);
  const captureRef = useRef(-1);
  const docRef = useRef(doc);
  docRef.current = doc;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  useEffect(() => {
    replace(current => (current.fill?.ink ? { ...current, fill: { ...current.fill, ...inkFill(light) } } : current));
  }, [light, replace]);

  const materialsVisible = wide ? railTab === 'materials' : mobileTab === 'materials';
  const staticThumbs = useStaticThumbs(light);
  const fillThumbs = useFillThumbs(doc, light, materialsVisible && previewReady);
  const thumbs = useMemo(() => ({ ...staticThumbs, ...fillThumbs }), [staticThumbs, fillThumbs]);
  const material = materialFor(doc);
  const procedural = material.kind === 'procedural' ? material.def : null;
  const morphing = doc.morph.on && Boolean(doc.morph.target);
  const textureActive = material.kind === 'background';
  const metalActive = material.kind === 'metal' && !morphing;
  const materialActive = textureActive || metalActive;
  const maskUrl = useMarkMask(doc, metalActive);
  const animatedMaterial = Boolean(procedural?.animated);
  const looping = morphing || textureActive || animatedMaterial;

  const materialProps = useMemo(() => {
    if (material.kind === 'metal') {
      return {
        ...material.props,
        imageSrc: maskUrl || undefined,
        scale: 1,
        intro: false,
        backgroundColor: 'transparent'
      };
    }
    if (material.kind === 'background') return backgroundValues(material);
    return {};
  }, [material, maskUrl]);

  const frameId =
    material.kind === 'metal' ? 'metal' : material.kind === 'background' ? `bg:${material.entry.id}` : null;
  const frame = useMaterialFrame({
    id: frameId,
    props: materialProps,
    active: materialActive && (material.kind !== 'metal' || Boolean(maskUrl)),
    capture: textureActive,
    playing
  });

  const maskLists = [doc.mark.layers, morphing ? doc.morph.target.layers : null];
  const plan = maskPlan(maskLists);
  const planKey = plan.keys.join('|');

  useEffect(() => {
    let cancelled = false;
    [...docRef.current.mark.layers, ...(docRef.current.morph.on ? docRef.current.morph.target?.layers || [] : [])]
      .filter(isMaskLayer)
      .forEach(layer =>
        loadField(layer)
          .then(() => !cancelled && setMaskVersion(version => version + 1))
          .catch(problem => !cancelled && toast.error(problem?.message || 'That logo could not be read.'))
      );
    return () => {
      cancelled = true;
    };
  }, [planKey]);

  const ensureRenderer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (rendererRef.current && rendererRef.current.gl.canvas !== canvas) {
      rendererRef.current.dispose();
      rendererRef.current = null;
      captureRef.current = -1;
    }
    if (!rendererRef.current) {
      try {
        rendererRef.current = createRenderer(canvas);
      } catch (problem) {
        toast.error(problem.message);
        return null;
      }
    }
    return rendererRef.current;
  }, []);

  const draw = useCallback(
    async time => {
      if (!artboard) return;
      const renderer = ensureRenderer();
      if (!renderer) return;
      const request = ++renderRequestRef.current;
      const current = docRef.current;
      const morph = current.morph.on && current.morph.target;
      const currentPlan = maskPlan([current.mark.layers, morph ? current.morph.target.layers : null]);
      bindMasks(renderer, currentPlan.keys);
      const ratio = Math.min(window.devicePixelRatio || 1, proceduralFor(current)?.heavy ? 1 : 2);
      const scene = {
        a: current.mark,
        b: morph ? current.morph.target : null,
        morph: morph ? morphPhase(time, current.morph) : 0,
        maskSlots: currentPlan.slots
      };
      const style = styleFor(current);
      try {
        await renderer.prepareScene(scene, style);
        if (request !== renderRequestRef.current || rendererRef.current !== renderer) return;
        renderer.draw({
          scene,
          style,
          width: Math.round(artboard.width * ratio),
          height: Math.round(artboard.height * ratio),
          time,
          surfaceResolution: morph ? 512 : 768
        });
        setPreviewReady(true);
      } catch (problem) {
        if (request === renderRequestRef.current && rendererRef.current === renderer) {
          toast.error(problem?.message?.slice(0, 160) || 'The preview could not be rendered.');
        }
      }
    },
    [artboard, ensureRenderer]
  );

  const feedPointer = useCallback(
    (type, x, y, buttons) => frame.bridge?.pointer?.(type, x, y, buttons),
    [frame.bridge]
  );

  const pullCapture = useCallback(() => {
    const bridge = frame.bridge;
    const renderer = rendererRef.current;
    if (!bridge?.capture || !renderer) return false;
    const capture = bridge.capture();
    if (!capture || capture.version === captureRef.current || capture.canvas.width < 2) return false;
    renderer.setMaterialTexture(capture.canvas);
    captureRef.current = capture.version;
    return true;
  }, [frame.bridge]);

  useEffect(() => {
    captureRef.current = -1;
    rendererRef.current?.setMaterialTexture(null);
    dirtyRef.current = true;
  }, [frameId]);

  useEffect(() => {
    dirtyRef.current = true;
    if (looping) return;
    draw(clockRef.current);
  }, [doc, draw, maskVersion, looping]);

  useEffect(() => {
    if (!looping) return undefined;
    let raf = 0;
    let cancelled = false;
    let last = performance.now();
    const tick = async now => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      let dirty = dirtyRef.current;
      dirtyRef.current = false;
      if (playing) {
        clockRef.current += dt;
        if (morphing || animatedMaterial) dirty = true;
      }
      if (textureActive && pullCapture()) dirty = true;
      if (dirty) await draw(clockRef.current);
      if (!cancelled) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [looping, playing, morphing, animatedMaterial, textureActive, draw, pullCapture]);

  useEffect(
    () => () => {
      renderRequestRef.current += 1;
      materialRequestRef.current += 1;
      rendererRef.current?.dispose();
      rendererRef.current = null;
    },
    []
  );

  const updateDoc = useCallback((update, key) => set(update, key), [set]);

  const updateLayers = useCallback(
    (patches, key) =>
      updateDoc(
        current => ({
          ...current,
          mark: {
            ...current.mark,
            layers: current.mark.layers.map(layer =>
              patches[layer.id]
                ? {
                    ...layer,
                    ...(typeof patches[layer.id] === 'function' ? patches[layer.id](layer) : patches[layer.id])
                  }
                : layer
            )
          }
        }),
        key
      ),
    [updateDoc]
  );

  const updateLayer = useCallback(
    (id, patch, key) => updateLayers({ [id]: patch }, key ? `layer-${id}-${key}` : undefined),
    [updateLayers]
  );

  const roomFor = useCallback(count => {
    if (docRef.current.mark.layers.length + count <= MAX_LAYERS) return true;
    toast.error(`A mark can have up to ${MAX_LAYERS} layers.`);
    return false;
  }, []);

  const addLayer = useCallback(
    layer => {
      if (!roomFor(1)) return;
      updateDoc(current => ({
        ...current,
        preset: null,
        mark: { ...current.mark, layers: [...current.mark.layers, layer] }
      }));
      setSelection([layer.id]);
      if (!desktop) setMobileTab('edit');
    },
    [updateDoc, desktop, roomFor]
  );

  const duplicateLayers = useCallback(
    (ids, key, offset = true) => {
      const sources = docRef.current.mark.layers.filter(layer => ids.includes(layer.id));
      if (!sources.length || !roomFor(sources.length)) return [];
      const copies = new Map(
        sources.map(layer => [
          layer.id,
          cloneLayer(layer, offset ? { x: (layer.x ?? 0) + 0.08, y: (layer.y ?? 0) + 0.08 } : {})
        ])
      );
      updateDoc(current => {
        const layers = [];
        current.mark.layers.forEach(layer => {
          layers.push(layer);
          if (copies.has(layer.id)) layers.push(copies.get(layer.id));
        });
        return { ...current, preset: null, mark: { ...current.mark, layers } };
      }, key);
      const list = [...copies.values()];
      setSelection(list.map(layer => layer.id));
      return list;
    },
    [updateDoc, roomFor]
  );

  const removeLayers = useCallback(
    ids =>
      updateDoc(current => {
        const layers = current.mark.layers.filter(layer => !ids.includes(layer.id));
        if (!layers.length) return current;
        return { ...current, mark: { ...current.mark, layers } };
      }),
    [updateDoc]
  );

  const reorder = useCallback(
    (ids, direction) =>
      updateDoc(current => {
        const layers = [...current.mark.layers];
        const picked = layers.filter(layer => ids.includes(layer.id));
        if (!picked.length) return current;
        if (direction === 'front' || direction === 'back') {
          const rest = layers.filter(layer => !ids.includes(layer.id));
          return {
            ...current,
            mark: { ...current.mark, layers: direction === 'front' ? [...rest, ...picked] : [...picked, ...rest] }
          };
        }
        const step = direction === 'forward' ? 1 : -1;
        const order = step > 0 ? [...layers.keys()].reverse() : [...layers.keys()];
        order.forEach(index => {
          if (!ids.includes(layers[index].id)) return;
          const target = index + step;
          if (target < 0 || target >= layers.length || ids.includes(layers[target].id)) return;
          [layers[index], layers[target]] = [layers[target], layers[index]];
        });
        return { ...current, mark: { ...current.mark, layers } };
      }),
    [updateDoc]
  );

  const selectedLayers = useCallback(
    () => docRef.current.mark.layers.filter(layer => selectionRef.current.includes(layer.id)),
    []
  );

  const alignSelection = useCallback(
    mode => {
      const current = docRef.current;
      const layers = selectedLayers().filter(layer => layer.visible !== false);
      if (!layers.length) return;
      const [halfW, halfH] = artboardHalf(current.artboard);
      const frameBounds =
        layers.length === 1
          ? { minX: -halfW, maxX: halfW, cx: 0, minY: -halfH, maxY: halfH, cy: 0 }
          : unionBounds(layers.map(layer => seedBounds(layer, current.mark)));
      const patches = {};
      layers.forEach(layer => {
        const bounds = seedBounds(layer, current.mark);
        const center = seedFrame(layer, current.mark).center;
        let dx = 0;
        let dy = 0;
        if (mode === 'left') dx = frameBounds.minX - bounds.minX;
        if (mode === 'hcenter') dx = frameBounds.cx - bounds.cx;
        if (mode === 'right') dx = frameBounds.maxX - bounds.maxX;
        if (mode === 'top') dy = frameBounds.minY - bounds.minY;
        if (mode === 'vcenter') dy = frameBounds.cy - bounds.cy;
        if (mode === 'bottom') dy = frameBounds.maxY - bounds.maxY;
        patches[layer.id] = positionFor(layer, current.mark, [center[0] + dx, center[1] + dy]);
      });
      updateLayers(patches);
    },
    [selectedLayers, updateLayers]
  );

  const distributeSelection = useCallback(
    axis => {
      const current = docRef.current;
      const layers = selectedLayers().filter(layer => layer.visible !== false);
      if (layers.length < 3) return;
      const index = axis === 'x' ? 0 : 1;
      const placed = layers
        .map(layer => ({ layer, center: seedFrame(layer, current.mark).center }))
        .sort((a, b) => a.center[index] - b.center[index]);
      const first = placed[0].center[index];
      const last = placed[placed.length - 1].center[index];
      const patches = {};
      placed.forEach((item, order) => {
        const center = [...item.center];
        center[index] = first + ((last - first) * order) / (placed.length - 1);
        patches[item.layer.id] = positionFor(item.layer, current.mark, center);
      });
      updateLayers(patches);
    },
    [selectedLayers, updateLayers]
  );

  const flipSelection = useCallback(
    axis => {
      const current = docRef.current;
      const layers = selectedLayers();
      if (!layers.length) return;
      const pivot =
        layers.length > 1
          ? (bounds => [bounds.cx, bounds.cy])(unionBounds(layers.map(layer => seedBounds(layer, current.mark))))
          : null;
      const patches = {};
      layers.forEach(layer => {
        patches[layer.id] = flipPatch(layer, current.mark, axis, pivot);
      });
      updateLayers(patches);
    },
    [selectedLayers, updateLayers]
  );

  const toggleSelectionVisibility = useCallback(() => {
    const layers = selectedLayers();
    if (!layers.length) return;
    const show = layers.every(layer => layer.visible === false);
    updateLayers(Object.fromEntries(layers.map(layer => [layer.id, { visible: show }])));
  }, [selectedLayers, updateLayers]);

  const pasteLayers = useCallback(
    layers => {
      if (!layers?.length || !roomFor(layers.length)) return;
      const existing = new Set(docRef.current.mark.layers.map(layer => layer.id));
      const copies = layers.map(layer =>
        cloneLayer(layer, existing.has(layer.id) ? { x: (layer.x ?? 0) + 0.06, y: (layer.y ?? 0) + 0.06 } : {})
      );
      updateDoc(current => ({
        ...current,
        preset: null,
        mark: { ...current.mark, layers: [...current.mark.layers, ...copies] }
      }));
      setSelection(copies.map(layer => layer.id));
    },
    [updateDoc, roomFor]
  );

  const selectLayer = useCallback((id, { toggle = false } = {}) => {
    setSelection(previous => {
      if (!toggle) return [id];
      return previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id];
    });
  }, []);

  const actions = useMemo(
    () => ({
      select: setSelection,
      selectLayer,
      updateLayer,
      updateLayers,
      addShape: type =>
        addLayer(
          createLayer(type, {
            size: 0.34,
            x: 0.5,
            y: -0.5,
            op: docRef.current.mark.layers.length ? 'exclude' : 'add'
          })
        ),
      addText: () =>
        addLayer(createTextLayer('Mark', { size: 0.6, op: docRef.current.mark.layers.length ? 'cut' : 'add' })),
      upload: () => fileRef.current?.click(),
      removeLayer: id => removeLayers([id]),
      removeSelection: () => removeLayers(selectionRef.current),
      duplicateLayer: id => duplicateLayers([id]),
      duplicateSelection: () => duplicateLayers(selectionRef.current),
      moveLayer: (id, target) =>
        updateDoc(current => {
          const layers = [...current.mark.layers];
          const index = layers.findIndex(layer => layer.id === id);
          if (index < 0) return current;
          const [layer] = layers.splice(index, 1);
          layers.splice(target, 0, layer);
          return { ...current, mark: { ...current.mark, layers } };
        }),
      reorderSelection: direction => reorder(selectionRef.current, direction),
      toggleLayer: (id, visible) => updateLayer(id, { visible }),
      toggleSelectionVisibility,
      alignSelection,
      distributeSelection,
      flipSelection,
      setSelectionOp: op =>
        updateDoc(current => ({
          ...current,
          mark: {
            ...current.mark,
            layers: current.mark.layers.map((layer, index) =>
              index > 0 && selectionRef.current.includes(layer.id) ? { ...layer, op } : layer
            )
          }
        })),
      setFill: (patch, key) =>
        updateDoc(current => ({ ...current, fill: { ...current.fill, ink: false, ...patch } }), key && `fill-${key}`),
      setEffect: (name, patch, key) =>
        updateDoc(
          current => ({ ...current, effects: { ...current.effects, [name]: { ...current.effects[name], ...patch } } }),
          key && `effect-${key}`
        ),
      setMark: (patch, key) => updateDoc(current => ({ ...current, mark: { ...current.mark, ...patch } }), key),
      setArtboard: patch => updateDoc(current => ({ ...current, artboard: { ...current.artboard, ...patch } })),
      setBackground: (patch, key) =>
        updateDoc(
          current => ({
            ...current,
            artboard: { ...current.artboard, background: { ...current.artboard.background, ...patch } }
          }),
          key
        ),
      setMaterialProp: (name, value) =>
        updateDoc(
          current => ({
            ...current,
            material: { ...current.material, props: { ...current.material.props, [name]: value } }
          }),
          `material-${name}`
        ),
      setMaterialBase: base =>
        updateDoc(current => ({ ...current, material: { ...current.material, base } }), 'material-base'),
      applyLook: async value => {
        const entry = materialFor(docRef.current).entry;
        const presets = entry ? await loadPresets(entry) : null;
        if (!presets) return;
        const defaults = backgroundDefaults(entry);
        const lookProps = presets.resolve(value, { light: false, defaults, props: defaults });
        updateDoc(current =>
          current.material?.id === `bg:${entry.id}`
            ? { ...current, material: { ...current.material, look: value, lookProps, props: {} } }
            : current
        );
      },
      setMorph: (patch, key) =>
        updateDoc(current => {
          const next = { ...current.morph, ...patch };
          if (next.on && !next.target)
            next.target = markFromPreset(MARKS_BY_ID[current.preset === 'm-astroid' ? 'm-metaball' : 'm-astroid']);
          return { ...current, morph: next };
        }, key),
      setMorphTarget: id =>
        updateDoc(current => ({ ...current, morph: { ...current.morph, target: markFromPreset(MARKS_BY_ID[id]) } }))
    }),
    [
      selectLayer,
      updateLayer,
      updateLayers,
      addLayer,
      removeLayers,
      duplicateLayers,
      updateDoc,
      reorder,
      toggleSelectionVisibility,
      alignSelection,
      distributeSelection,
      flipSelection
    ]
  );

  const applyMark = useCallback(
    preset => {
      const fresh = createDoc(preset, { light });
      updateDoc(current => ({
        ...current,
        preset: preset.id,
        name: preset.name,
        mark: fresh.mark,
        fill: current.material?.id === 'flat' || !current.material ? fresh.fill : current.fill,
        effects: { ...current.effects, glow: fresh.effects.glow, gloss: fresh.effects.gloss }
      }));
      setSelection([]);
      setUserLogo(false);
    },
    [updateDoc, light]
  );

  const applyMaterial = useCallback(
    async item => {
      const request = ++materialRequestRef.current;
      if (item.kind === 'procedural') {
        try {
          await (ensureRenderer()?.prepareAsync(item.def) ?? Promise.resolve());
        } catch (problem) {
          if (request === materialRequestRef.current) {
            toast.error(problem?.message?.slice(0, 160) || 'That material could not start.');
          }
          return;
        }
      }
      if (request !== materialRequestRef.current) return;
      updateDoc(current => {
        const family = bevelFamily(item);
        const kept = family === bevelFamily(materialFor(current));
        if (item.kind === 'procedural') {
          return {
            ...current,
            material: { id: item.id, props: {}, preset: item.id },
            effects: family === 'auto' && !kept ? { ...current.effects, gloss: BEVEL_ON } : current.effects
          };
        }
        if (item.kind === 'flat') {
          return {
            ...current,
            material: { id: 'flat', props: {}, preset: item.id },
            fill: { ...current.fill, extent: 1, stops: 2, ink: false, ...item.fill },
            effects: {
              ...current.effects,
              glow: item.effects?.glow
                ? { ...DEFAULT_EFFECTS.glow, ...item.effects.glow }
                : { ...current.effects.glow, on: false },
              gloss: item.effects?.gloss
                ? { ...DEFAULT_EFFECTS.gloss, ...item.effects.gloss }
                : { ...current.effects.gloss, on: false }
            }
          };
        }
        if (item.kind === 'metal')
          return { ...current, material: { id: 'metal', props: { ...item.props }, preset: item.id } };
        return {
          ...current,
          material: { id: item.id, props: {}, base: current.material?.base ?? '#0c0b10', preset: item.id },
          effects: kept ? current.effects : { ...current.effects, gloss: BEVEL_ON }
        };
      });
    },
    [updateDoc, ensureRenderer]
  );

  const addLogo = useCallback(
    async file => {
      if (!isLogoFile(file)) {
        toast.error('Use an SVG, PNG, JPG or WebP logo.');
        return;
      }
      try {
        const src = await readFile(file);
        const name = file.name.replace(/\.[^.]+$/, '') || 'Logo';
        const layer = createImageLayer(
          { name, src, key: `${file.name}:${file.size}:${file.lastModified}` },
          { size: 0.86 }
        );
        await loadField(layer);
        updateDoc(current => ({
          ...current,
          preset: null,
          name,
          mark: { ...current.mark, scale: 1, rotation: 0, layers: [layer] },
          fill: { ...current.fill, kind: 'logo' },
          material: { id: 'flat', props: {} },
          morph: { ...current.morph, on: false }
        }));
        setSelection([layer.id]);
        setUserLogo(true);
        toast.success('Logo added. Pick a material to style it.');
        if (wide) setRailTab('materials');
        else setMobileTab('materials');
      } catch (problem) {
        toast.error(problem?.message || 'That logo could not be read.');
      }
    },
    [updateDoc, wide]
  );

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
      const file = event.dataTransfer?.files?.[0];
      if (file) addLogo(file);
    };
    const copyLayers = event => {
      if (isTyping(event.target)) return false;
      const layers = docRef.current.mark.layers.filter(layer => selectionRef.current.includes(layer.id));
      if (!layers.length) return false;
      memoryClipboard = layers;
      event.clipboardData?.setData('text/plain', JSON.stringify({ [CLIPBOARD_MARK]: 1, layers }));
      event.preventDefault();
      return true;
    };
    const copy = event => {
      copyLayers(event);
    };
    const cut = event => {
      if (copyLayers(event)) removeLayers(selectionRef.current);
    };
    const paste = event => {
      const file = [...(event.clipboardData?.files || [])].find(isLogoFile);
      if (file) {
        event.preventDefault();
        addLogo(file);
        return;
      }
      if (isTyping(event.target)) return;
      const text = event.clipboardData?.getData('text/plain');
      let layers = null;
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed?.[CLIPBOARD_MARK] && Array.isArray(parsed.layers)) layers = parsed.layers;
        } catch {
          layers = null;
        }
      }
      if (!layers && !text && memoryClipboard) layers = memoryClipboard;
      if (!layers) return;
      event.preventDefault();
      pasteLayers(layers);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    window.addEventListener('copy', copy);
    window.addEventListener('cut', cut);
    window.addEventListener('paste', paste);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
      window.removeEventListener('copy', copy);
      window.removeEventListener('cut', cut);
      window.removeEventListener('paste', paste);
    };
  }, [addLogo, pasteLayers, removeLayers]);

  const toggleSnapping = useCallback(() => {
    setSnapping(value => {
      writeSnapping(!value);
      return !value;
    });
  }, []);

  const canPlay = looping;

  const keys = useRef(null);
  keys.current = event => {
    if (isTyping(event.target) || exporting) return;
    const meta = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    const code = event.code;
    const hasSelection = selection.length > 0;
    if (meta && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) history.redo();
      else history.undo();
    } else if (meta && key === 'y') {
      event.preventDefault();
      history.redo();
    } else if (meta && key === 'd') {
      event.preventDefault();
      if (hasSelection) duplicateLayers(selection);
    } else if (meta && key === 'a') {
      event.preventDefault();
      setSelection(doc.mark.layers.map(layer => layer.id));
    } else if (meta && key === 'o') {
      event.preventDefault();
      fileRef.current?.click();
    } else if (meta && event.shiftKey && key === 'h') {
      event.preventDefault();
      toggleSelectionVisibility();
    } else if (meta && (code === 'BracketRight' || code === 'BracketLeft')) {
      event.preventDefault();
      if (!hasSelection) return;
      const up = code === 'BracketRight';
      reorder(selection, event.shiftKey ? (up ? 'front' : 'back') : up ? 'forward' : 'backward');
    } else if (meta) {
      return;
    } else if (event.altKey && hasSelection && ['KeyA', 'KeyD', 'KeyH', 'KeyW', 'KeyS', 'KeyV'].includes(code)) {
      event.preventDefault();
      alignSelection(
        { KeyA: 'left', KeyD: 'right', KeyH: 'hcenter', KeyW: 'top', KeyS: 'bottom', KeyV: 'vcenter' }[code]
      );
    } else if (event.shiftKey && hasSelection && (key === 'h' || key === 'v')) {
      event.preventDefault();
      flipSelection(key === 'h' ? 'x' : 'y');
    } else if ((key === 'backspace' || key === 'delete') && hasSelection) {
      event.preventDefault();
      removeLayers(selection);
      setSelection([]);
    } else if (key === 'escape') {
      setSelection([]);
    } else if (key === 'e') {
      setExporting(true);
    } else if (key === 't') {
      actions.addText();
    } else if (key === ' ' && canPlay) {
      event.preventDefault();
      setPlaying(value => !value);
    } else if (key === '/') {
      event.preventDefault();
      requestAnimationFrame(() => searchRef.current?.focus());
    } else if (hasSelection && key.startsWith('arrow')) {
      event.preventDefault();
      const step = event.shiftKey ? 0.05 : 0.01;
      const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
      const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
      const current = docRef.current;
      const patches = {};
      current.mark.layers
        .filter(layer => selection.includes(layer.id))
        .forEach(layer => {
          const center = seedFrame(layer, current.mark).center;
          patches[layer.id] = positionFor(layer, current.mark, [center[0] + dx, center[1] + dy]);
        });
      updateLayers(patches, 'nudge');
    }
  };

  useEffect(() => {
    const down = event => keys.current?.(event);
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    setSelection(previous => {
      const next = previous.filter(id => doc.mark.layers.some(layer => layer.id === id));
      return next.length === previous.length ? previous : next;
    });
  }, [doc]);

  const editText = useCallback(
    id => {
      setSelection([id]);
      setFocusText(value => value + 1);
      if (!desktop) setMobileTab('edit');
    },
    [desktop]
  );

  const activeMaterial = doc.material?.preset || (doc.material?.id === 'flat' ? null : doc.material?.id);

  const library = tab =>
    tab === 'marks' ? (
      <MarksGrid thumbs={thumbs} activeId={doc.preset} onApply={applyMark} query={queries.marks || ''} />
    ) : (
      <MaterialsGrid
        thumbs={thumbs}
        activeId={activeMaterial}
        light={light}
        onApply={applyMaterial}
        query={queries.materials || ''}
      />
    );

  const search = tab => (
    <GallerySearch
      inputRef={searchRef}
      value={queries[tab] ?? ''}
      onChange={value => setQueries(previous => ({ ...previous, [tab]: value }))}
      placeholder={tab === 'materials' ? `Search ${MATERIALS.length} materials` : `Search ${MARKS.length} marks`}
    />
  );

  const panel = (
    <Inspector
      doc={doc}
      selection={selection}
      thumbs={thumbs}
      history={history}
      actions={actions}
      focusText={focusText}
    />
  );

  const materialLayer = materialActive && (
    <iframe
      ref={frame.iframeRef}
      src={frame.src}
      title="Material preview"
      className="smg-material"
      data-ready={frame.status === 'ready' ? '' : undefined}
      data-source={textureActive ? '' : undefined}
      tabIndex={-1}
    />
  );

  return (
    <div className="lab smg" data-layout={wide ? 'wide' : desktop ? 'desktop' : 'compact'}>
      <input
        ref={fileRef}
        type="file"
        accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg,.png,.jpg,.jpeg,.webp"
        hidden
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) addLogo(file);
          event.target.value = '';
        }}
      />

      {wide && (
        <aside className="lab-rail" aria-label="Marks and materials">
          {toolSelector}
          <Track label="Library" value={railTab} options={RAIL_TABS} onChange={setRailTab} className="lab-rail-tabs" />
          {search(railTab)}
          <GalleryScroll>{library(railTab)}</GalleryScroll>
        </aside>
      )}

      <section className="lab-main" aria-label="Editor">
        <Toolbar
          thumbs={thumbs}
          canPlay={canPlay}
          playing={playing}
          snapping={snapping}
          onToggleSnapping={toggleSnapping}
          onTogglePlay={() => setPlaying(value => !value)}
          onUpload={() => fileRef.current?.click()}
          onAddShape={type => actions.addShape(type)}
          onAddText={actions.addText}
          onExport={() => setExporting(true)}
        />
        <Stage
          canvasRef={canvasRef}
          doc={doc}
          selection={selection}
          onSelect={setSelection}
          onLayersChange={updateLayers}
          onDuplicate={(ids, key) => duplicateLayers(ids, key, false)}
          onEditText={editText}
          onMeasure={setArtboard}
          material={materialLayer}
          dropping={dropping}
          hint={desktop && !userLogo}
          snapping={snapping}
          padding={desktop ? 40 : 14}
          onUpload={() => fileRef.current?.click()}
          onPointerFeed={materialActive ? feedPointer : undefined}
        />
      </section>

      {wide ? (
        panel
      ) : desktop ? (
        <aside className="lab-side" aria-label="Library and settings">
          {toolSelector}
          <Track
            label="Panels"
            value={mobileTab}
            options={MOBILE_TABS}
            onChange={setMobileTab}
            className="lab-mobile-tabs"
          />
          {mobileTab === 'edit' ? (
            panel
          ) : (
            <>
              {search(mobileTab)}
              <GalleryScroll>{library(mobileTab)}</GalleryScroll>
            </>
          )}
        </aside>
      ) : (
        <section className="lab-mobile" aria-label="Library and settings">
          <Track
            label="Panels"
            value={mobileTab}
            options={MOBILE_TABS}
            onChange={setMobileTab}
            className="lab-mobile-tabs"
          />
          {mobileTab === 'edit' ? (
            panel
          ) : (
            <>
              {search(mobileTab)}
              <div className="lab-mobile-gallery">{library(mobileTab)}</div>
            </>
          )}
        </section>
      )}

      {exporting && <ExportDialog doc={doc} light={light} onClose={() => setExporting(false)} />}
    </div>
  );
}

const BEVEL_ON = { ...DEFAULT_EFFECTS.gloss, on: true };

const bevelFamily = item => {
  if (!item) return 'flat';
  if (item.kind === 'procedural') return item.def.kind === 'fill' ? 'auto' : 'shape';
  if (item.kind === 'background') return 'auto';
  return item.kind || 'flat';
};
