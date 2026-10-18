import { renderSound } from '../../../sounds/ts/react-bits-sound';
import { analyze } from './analysis';

const SHAPE_KEYS = ['pitch', 'tone', 'length', 'space', 'punch', 'reverb', 'echo', 'filter', 'chorus', 'lofi'];

const BANDS = [
  [40, 320],
  [320, 2600],
  [2600, 12000]
];

const shapeOf = (tune = {}) =>
  Object.fromEntries(SHAPE_KEYS.filter(key => tune[key] !== undefined).map(key => [key, tune[key]]));

const keyOf = (id, tune = {}, variant = 0) => `${id}:${variant}:${JSON.stringify(shapeOf(tune))}`;

const variantsOf = sound =>
  sound.recipe.layers.reduce(
    (count, layer) =>
      layer.type === 'sample' ? Math.max(count, (layer.data || sound.recipe.samples?.data || []).length) : count,
    1
  );

export function createPlayer() {
  let context = null;
  let master = null;
  let analyser = null;
  let level = new Float32Array(1024);
  let spectrum = new Float32Array(512);
  const renders = new Map();
  const inspected = new Map();
  const listeners = new Set();
  let current = null;

  const ensure = () => {
    if (!context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      context = new Context({ latencyHint: 'interactive' });
      master = context.createGain();
      analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      level = new Float32Array(analyser.fftSize);
      spectrum = new Float32Array(analyser.frequencyBinCount);
      master.connect(analyser);
      analyser.connect(context.destination);
    }
    return context;
  };

  const emit = () => listeners.forEach(listener => listener(current));

  const lastVariant = new Map();

  const pickVariant = sound => {
    const count = variantsOf(sound);
    if (count < 2) return 0;
    const last = lastVariant.get(sound.id) ?? -1;
    let next = Math.floor(Math.random() * (last < 0 ? count : count - 1));
    if (last >= 0 && next >= last) next += 1;
    lastVariant.set(sound.id, next);
    return next;
  };

  const render = (sound, tune = {}, variant = 0) => {
    const key = keyOf(sound.id, tune, variant);
    let pending = renders.get(key);
    if (!pending) {
      const rate = context?.sampleRate || 48000;
      pending = renderSound(sound.recipe, shapeOf(tune), { sampleRate: rate, variant }).then(buffer => ({
        buffer,
        info: analyze(buffer)
      }));
      renders.set(key, pending);
      pending.catch(() => renders.delete(key));
      if (renders.size > 160) renders.delete(renders.keys().next().value);
    }
    return pending;
  };

  const inspect = (sound, tune = {}) => {
    const key = keyOf(sound.id, tune);
    if (renders.has(key)) return renders.get(key).then(result => result.info);
    let pending = inspected.get(key);
    if (!pending) {
      const rate = context?.sampleRate || 48000;
      pending = renderSound(sound.recipe, shapeOf(tune), { sampleRate: rate }).then(analyze);
      inspected.set(key, pending);
      pending.catch(() => inspected.delete(key));
      if (inspected.size > 600) inspected.delete(inspected.keys().next().value);
    }
    return pending;
  };

  const stop = () => {
    if (current?.source) {
      try {
        current.source.onended = null;
        current.source.stop();
      } catch {
        current = null;
      }
    }
    current = null;
    emit();
  };

  const play = async (sound, tune = {}, { offset = 0, exclusive = true, loop = false } = {}) => {
    const audio = ensure();
    if (audio.state === 'suspended') await audio.resume();
    const { buffer, info } = await render(sound, tune, pickVariant(sound));
    if (exclusive) stop();
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    const variation = Math.min(1, Math.max(0, tune.variation || 0));
    if (variation > 0) source.detune.value = (Math.random() * 2 - 1) * variation * 80;
    const gain = audio.createGain();
    gain.gain.value = Math.pow(10, (tune.volume || 0) / 20);
    source.connect(gain);
    gain.connect(master);
    const start = audio.currentTime + 0.005;
    const from = Math.min(Math.max(0, offset), buffer.duration - 0.01);
    source.start(start, from);
    const rate = Math.pow(2, source.detune.value / 1200);
    const entry = { id: sound.id, source, start: start - from / rate, duration: buffer.duration / rate, info, loop };
    if (exclusive) current = entry;
    source.onended = () => {
      if (current === entry) {
        current = null;
        emit();
      }
    };
    emit();
    return entry;
  };

  return {
    render,
    inspect,
    play,
    stop,
    preload: (sound, tune) => render(sound, tune).catch(() => null),
    progress() {
      if (!current || !context) return null;
      const elapsed = context.currentTime - current.start;
      const value = current.loop ? (elapsed % current.duration) / current.duration : elapsed / current.duration;
      return { id: current.id, value: Math.max(0, Math.min(1, value)) };
    },
    level() {
      if (!analyser) return 0;
      analyser.getFloatTimeDomainData(level);
      let sum = 0;
      for (let i = 0; i < level.length; i += 1) sum += level[i] * level[i];
      return 1 - Math.exp(-Math.sqrt(sum / level.length) * 6);
    },
    bands(out = [0, 0, 0]) {
      if (!analyser) return out.fill(0);
      analyser.getFloatFrequencyData(spectrum);
      const step = context.sampleRate / analyser.fftSize;
      BANDS.forEach(([low, high], index) => {
        const from = Math.max(1, Math.floor(low / step));
        const to = Math.min(spectrum.length - 1, Math.ceil(high / step));
        let sum = 0;
        for (let i = from; i <= to; i += 1) sum += Math.pow(10, spectrum[i] / 10);
        const db = 10 * Math.log10(sum / (to - from + 1) + 1e-12);
        out[index] = Math.min(1, Math.max(0, (db + 90) / 55));
      });
      return out;
    },
    playing: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      stop();
      context?.close();
      context = null;
    }
  };
}
