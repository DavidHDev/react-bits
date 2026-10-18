'use client';

import { useCallback, useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const db = value => Math.pow(10, value / 20);

const random = seed => {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 1831565813) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const filterType = type => (type === 'highpass' || type === 'bandpass' ? type : 'lowpass');

const normalizeTune = (tune = {}) => ({
  pitch: clamp(tune.pitch ?? 0, -24, 24),
  tone: clamp(tune.tone ?? 0, -1, 1),
  length: clamp(tune.length ?? 1, 0.25, 4),
  space: clamp(tune.space ?? 0, -1, 1),
  punch: clamp(tune.punch ?? 0, -1, 1),
  volume: clamp(tune.volume ?? 0, -48, 12),
  variation: clamp(tune.variation ?? 0, 0, 1),
  reverb: tune.reverb
    ? {
        mix: clamp(tune.reverb.mix ?? 0.25, 0, 1),
        decay: clamp(tune.reverb.decay ?? 1.4, 0.1, 12),
        tone: clamp(tune.reverb.tone ?? 0, -1, 1)
      }
    : null,
  echo: tune.echo
    ? {
        time: clamp(tune.echo.time ?? 0.24, 0.01, 2),
        feedback: clamp(tune.echo.feedback ?? 0.35, 0, 0.95),
        mix: clamp(tune.echo.mix ?? 0.25, 0, 1),
        tone: clamp(tune.echo.tone ?? 0, -1, 1),
        pingPong: Boolean(tune.echo.pingPong)
      }
    : null,
  filter: tune.filter
    ? {
        type: filterType(tune.filter.type),
        cutoff: clamp(tune.filter.cutoff ?? 1e3, 20, 2e4),
        resonance: clamp(tune.filter.resonance ?? 0.4, 0, 1),
        sweep: clamp(tune.filter.sweep ?? 0, -1, 1)
      }
    : null,
  chorus: tune.chorus
    ? {
        mix: clamp(tune.chorus.mix ?? 0.5, 0, 1),
        rate: clamp(tune.chorus.rate ?? 0.9, 0.05, 8),
        depth: clamp(tune.chorus.depth ?? 0.5, 0, 1)
      }
    : null,
  lofi: tune.lofi
    ? {
        bits: clamp(Math.round(tune.lofi.bits ?? 5), 2, 16),
        rate: clamp(tune.lofi.rate ?? 6e3, 500, 48e3),
        mix: clamp(tune.lofi.mix ?? 0.7, 0, 1)
      }
    : null
});

const rampShape = (ramp, scaleTime, log) => {
  if (typeof ramp === 'number') return () => ramp;
  if ('points' in ramp) {
    const points = ramp.points.map(([time, value]) => [time * scaleTime, value]);
    return time => {
      if (time <= points[0][0]) return points[0][1];
      for (let i = 1; i < points.length; i += 1) {
        const [t1, v1] = points[i];
        if (time <= t1) {
          const [t0, v0] = points[i - 1];
          const y = t1 > t0 ? (time - t0) / (t1 - t0) : 1;
          const s = y * y * (3 - 2 * y);
          return log && v0 > 0 && v1 > 0 ? v0 * Math.pow(v1 / v0, s) : v0 + (v1 - v0) * s;
        }
      }
      return points[points.length - 1][1];
    };
  }
  const delay = (ramp.delay ?? 0) * scaleTime;
  const span = Math.max(1e-4, (ramp.time ?? 0.1) * scaleTime);
  const curve = ramp.curve ?? 2;
  return time => {
    const y = clamp((time - delay) / span, 0, 1);
    const e = curve >= 1 ? 1 - Math.pow(1 - y, curve) : Math.pow(y, 1 / curve);
    return log && ramp.from > 0 && ramp.to > 0
      ? ramp.from * Math.pow(ramp.to / ramp.from, e)
      : ramp.from + (ramp.to - ramp.from) * e;
  };
};

const envelopeLength = (env, stretch) =>
  ((env.attack ?? 2e-3) + (env.hold ?? 0) + (env.decay ?? 0.2) + ((env.sustain ?? 0) > 0 ? (env.release ?? 0.1) : 0)) *
  stretch;

const envelopeShape = (env, stretch, decayScale = 1) => {
  const attack = Math.max(4e-4, (env.attack ?? 2e-3) * stretch);
  const hold = (env.hold ?? 0) * stretch;
  const decay = Math.max(2e-3, (env.decay ?? 0.2) * stretch * decayScale);
  const sustain = clamp(env.sustain ?? 0, 0, 1);
  const release = Math.max(2e-3, (env.release ?? 0.1) * stretch);
  const k = env.curve ?? 5;
  const rise = env.rise;
  const fall = y => (Math.exp(-k * y) - Math.exp(-k)) / (1 - Math.exp(-k));
  return time => {
    if (time <= 0) return 0;
    if (time < attack) {
      const y = time / attack;
      return rise ? Math.pow(y, rise) : Math.sin((y * Math.PI) / 2);
    }
    let t = time - attack;
    if (t < hold) return 1;
    t -= hold;
    if (t < decay) return sustain + (1 - sustain) * fall(t / decay);
    if (sustain <= 0) return 0;
    t -= decay;
    if (t < release) return sustain * fall(t / release);
    return 0;
  };
};

const applyCurve = (param, shape, start, length, rate, map = v => v) => {
  const steps = clamp(Math.ceil(length * rate), 2, 4096);
  const values = new Float32Array(steps);
  for (let i = 0; i < steps; i += 1) values[i] = map(shape((i / (steps - 1)) * length));
  param.value = values[0];
  param.setValueCurveAtTime(values, start, length);
};

const noiseBuffer = (context, color, length, seed) => {
  const frames = Math.max(1, Math.ceil(length * context.sampleRate));
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const data = buffer.getChannelData(0);
  const next = random(seed);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let brown = 0;
  const density = 45 / context.sampleRate;
  for (let i = 0; i < frames; i += 1) {
    const white = next() * 2 - 1;
    if (color === 'crackle') {
      data[i] = next() < density ? white * (0.4 + next() * 0.6) : 0;
    } else if (color === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else if (color === 'brown') {
      brown = (brown + 0.02 * white) / 1.02;
      data[i] = brown * 3.5;
    } else {
      data[i] = white;
    }
  }
  return buffer;
};

const impulse = (context, decay, predelay, damp, seed) => {
  const rate = context.sampleRate;
  const length = Math.ceil((decay * 1.15 + predelay) * rate);
  const buffer = context.createBuffer(2, length, rate);
  const taps = [71e-4, 0.0113, 0.0167, 0.0229, 0.0311, 0.0373];
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    const next = random(seed * 31 + channel * 977 + 17);
    let low = 0;
    let energy = 0;
    for (let i = 0; i < length; i += 1) {
      const time = i / rate - predelay;
      if (time < 0) continue;
      const cutoff = damp * Math.pow(0.18, time / decay) + 300;
      const a = 1 - Math.exp((-TAU * cutoff) / rate);
      low += a * (next() * 2 - 1 - low);
      const swell = Math.min(1, time / 4e-3);
      const value = low * Math.exp((-6.9 * time) / decay) * swell;
      data[i] = value;
      energy += value * value;
    }
    taps.forEach((tap, index) => {
      const at = Math.round((predelay + tap * (channel ? 1.13 : 1)) * rate);
      if (at < length) data[at] += (0.5 - index * 0.06) * Math.sqrt(energy / length) * 3;
    });
    let total = 0;
    for (let i = 0; i < length; i += 1) total += data[i] * data[i];
    const scale = 1 / Math.sqrt(Math.max(total, 1e-12));
    for (let i = 0; i < length; i += 1) data[i] *= scale;
  }
  return buffer;
};

const shaper = amount => {
  const curve = new Float32Array(2048);
  const drive = 1 + amount * 6;
  const norm = Math.tanh(drive);
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / norm;
  }
  return curve;
};

const filters = layer => (layer.filter ? (Array.isArray(layer.filter) ? layer.filter : [layer.filter]) : []);

const decodePcm = data => {
  const bytes = atob(data);
  const pcm = new Float32Array(bytes.length >> 1);
  for (let i = 0; i < pcm.length; i += 1) {
    const value = bytes.charCodeAt(i * 2) | (bytes.charCodeAt(i * 2 + 1) << 8);
    pcm[i] = (value >= 32768 ? value - 65536 : value) / 32768;
  }
  return pcm;
};

const variantsOf = recipe =>
  recipe.layers.reduce(
    (count, layer) =>
      layer.type === 'sample' ? Math.max(count, (layer.data ?? recipe.samples?.data ?? []).length) : count,
    1
  );

const buildLayer = (context, layer, index, destination, recipe, tune, end, variant) => {
  const rate = context.sampleRate;
  const stretch = tune.length;
  const ratio = Math.pow(2, tune.pitch / 12);
  const start = (layer.at ?? 0) * stretch;
  const env = layer.env ?? { attack: 2e-3, decay: 0.2 };
  const sample = layer.type === 'sample' ? layer : null;
  const bank = sample?.data ? { rate: sample.rate ?? 48e3, data: sample.data } : sample ? recipe.samples : void 0;
  const pcm =
    sample && bank?.data.length ? decodePcm(bank.data[(variant + (sample.offset ?? 0)) % bank.data.length]) : null;
  const speed = sample ? ratio * Math.pow(2, (sample.pitch ?? 0) / 12) : ratio;
  const natural = pcm && bank ? pcm.length / bank.rate / speed : 0;
  const span = Math.min((pcm && !layer.env ? natural : envelopeLength(env, stretch)) + 0.01, end - start);
  if (span <= 0) return;
  const nyquist = rate / 2 - 100;
  let gain = db(layer.gain ?? 0);
  if (layer.punch) gain *= db(tune.punch * 6);
  const output = context.createGain();
  output.gain.value = gain;
  let tail = output;
  if (layer.tremolo) {
    const depth = clamp(layer.tremolo.depth, 0, 1);
    const wobble = context.createGain();
    wobble.gain.value = 1 - depth / 2;
    const lfo = context.createOscillator();
    lfo.frequency.value = layer.tremolo.rate;
    const swing = context.createGain();
    swing.gain.value = depth / 2;
    lfo.connect(swing);
    swing.connect(wobble.gain);
    lfo.start(start);
    lfo.stop(start + span);
    output.connect(wobble);
    tail = wobble;
  }
  filters(layer).forEach(spec => {
    const node = context.createBiquadFilter();
    node.type = spec.type;
    if (spec.gain !== void 0) node.gain.value = spec.gain;
    const freqShape2 = rampShape(spec.freq, stretch, true);
    applyCurve(node.frequency, freqShape2, start, span, 400, value => clamp(value * ratio, 10, nyquist));
    if (spec.q !== void 0) applyCurve(node.Q, rampShape(spec.q, stretch, false), start, span, 200);
    tail.connect(node);
    tail = node;
  });
  if (layer.pan !== void 0) {
    const panner = context.createStereoPanner();
    applyCurve(panner.pan, rampShape(layer.pan, stretch, false), start, span, 200, value => clamp(value, -1, 1));
    tail.connect(panner);
    tail = panner;
  }
  tail.connect(destination);
  const seed = (recipe.seed ?? 1) * 7919 + index * 104729;
  if (layer.type === 'sample') {
    if (!pcm || !bank) return;
    const buffer = context.createBuffer(1, pcm.length, bank.rate);
    buffer.copyToChannel(pcm, 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = speed;
    if (layer.env) {
      const amp = context.createGain();
      applyCurve(amp.gain, envelopeShape(env, stretch), start, span, 600);
      source.connect(amp);
      amp.connect(output);
    } else {
      source.connect(output);
    }
    source.start(start);
    return;
  }
  if (layer.type === 'noise') {
    const source = context.createBufferSource();
    source.buffer = noiseBuffer(context, layer.color ?? 'white', span + 0.05, seed);
    const amp = context.createGain();
    applyCurve(amp.gain, envelopeShape(env, stretch), start, span, 600);
    source.connect(amp);
    amp.connect(output);
    source.start(start);
    source.stop(start + span);
    return;
  }
  const freqShape = rampShape(layer.freq, stretch, true);
  const partials = layer.partials
    ? layer.partials.map(([partialRatio, partialGain, decay]) => [partialRatio, partialGain, decay ?? 1])
    : [[1, 1, 1]];
  const voices = Math.max(1, Math.round(layer.voices ?? 1));
  const spread = layer.detune ?? 0;
  partials.forEach(([partialRatio, partialGain, decayScale], partialIndex) => {
    const amp = context.createGain();
    applyCurve(amp.gain, envelopeShape(env, stretch, decayScale), start, span, 600, value => value * partialGain);
    amp.connect(output);
    for (let voice = 0; voice < voices; voice += 1) {
      const osc = context.createOscillator();
      if (layer.harmonics && !layer.partials) {
        const real = new Float32Array(layer.harmonics.length + 1);
        const imag = new Float32Array(layer.harmonics.length + 1);
        layer.harmonics.forEach((value, harmonic) => {
          imag[harmonic + 1] = value;
        });
        osc.setPeriodicWave(context.createPeriodicWave(real, imag));
      } else {
        osc.type = layer.wave ?? 'sine';
      }
      const offset = voices > 1 ? (voice / (voices - 1) - 0.5) * 2 * spread : 0;
      applyCurve(osc.frequency, freqShape, start, span, 400, value => clamp(value * ratio * partialRatio, 1, nyquist));
      osc.detune.value = offset;
      if (layer.vibrato) {
        const lfo = context.createOscillator();
        const depth = context.createGain();
        lfo.frequency.value = layer.vibrato.rate;
        depth.gain.value = layer.vibrato.depth;
        lfo.connect(depth);
        depth.connect(osc.detune);
        lfo.start(start);
        lfo.stop(start + span);
      }
      if (layer.fm && partialIndex === 0) {
        const fm = layer.fm;
        const mod = context.createOscillator();
        const depth = context.createGain();
        applyCurve(mod.frequency, freqShape, start, span, 400, value => clamp(value * ratio * fm.ratio, 1, nyquist));
        const indexShape = rampShape(fm.index, stretch, false);
        applyCurve(depth.gain, time => indexShape(time) * freqShape(time) * ratio * fm.ratio, start, span, 400);
        mod.connect(depth);
        depth.connect(osc.frequency);
        mod.start(start);
        mod.stop(start + span);
      }
      let target = amp;
      if (voices > 1) {
        const voiceGain = context.createGain();
        voiceGain.gain.value = 1 / Math.sqrt(voices);
        const pan = context.createStereoPanner();
        pan.pan.value = clamp((voice / (voices - 1) - 0.5) * 2 * (recipe.width ?? 0.6), -1, 1);
        voiceGain.connect(pan);
        pan.connect(amp);
        target = voiceGain;
      }
      osc.connect(target);
      osc.start(start);
      osc.stop(start + span);
    }
  });
};

const loudness = (channels, rate) => {
  const window2 = Math.max(1, Math.round(rate * 0.05));
  let best = 0;
  const length = channels[0].length;
  for (let start = 0; start < length; start += Math.round(window2 / 2)) {
    let sum = 0;
    const stop = Math.min(length, start + window2);
    for (let i = start; i < stop; i += 1) {
      for (const data of channels) sum += data[i] * data[i];
    }
    best = Math.max(best, sum / ((stop - start) * channels.length));
  }
  return Math.sqrt(best);
};

const finish = (buffer, recipe, tune) => {
  const rate = buffer.sampleRate;
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  if (recipe.stutter) {
    const next = random((recipe.seed ?? 1) * 131 + 7);
    const slice = Math.max(32, Math.round(recipe.stutter.slice * tune.length * rate));
    const copies = channels.map(data => data.slice());
    for (let start = 0; start < copies[0].length; start += slice) {
      const roll = next();
      const repeat = roll < recipe.stutter.chance;
      const gate = roll > 1 - recipe.stutter.chance * 0.35;
      const from = repeat ? Math.max(0, start - slice) : start;
      channels.forEach((data, channel) => {
        for (let i = 0; i < slice && start + i < data.length; i += 1) {
          const edge = Math.min(1, i / 48, (slice - i) / 48);
          data[start + i] = gate ? 0 : copies[channel][from + i] * edge;
        }
      });
    }
  }
  if (recipe.crush) {
    const levels = Math.pow(2, Math.round(16 - recipe.crush * 12));
    const hold = Math.max(1, Math.round(1 + recipe.crush * 10));
    channels.forEach(data => {
      let held = 0;
      for (let i = 0; i < data.length; i += 1) {
        if (i % hold === 0) held = Math.round(data[i] * levels) / levels;
        data[i] = data[i] * (1 - recipe.crush) + held * recipe.crush;
      }
    });
  }
  if (recipe.reverse) channels.forEach(data => data.reverse());
  const floor = db(-70);
  let first = channels[0].length;
  channels.forEach(data => {
    for (let i = 0; i < first; i += 1) {
      if (Math.abs(data[i]) > floor) {
        first = i;
        break;
      }
    }
  });
  const lead = Math.max(0, first - Math.round(rate * 2e-3));
  if (lead > 0) {
    channels.forEach(data => {
      data.copyWithin(0, lead);
      data.fill(0, data.length - lead);
    });
  }
  let last = 0;
  channels.forEach(data => {
    for (let i = data.length - 1; i > last; i -= 1) {
      if (Math.abs(data[i]) > floor) {
        last = i;
        break;
      }
    }
  });
  const length = Math.min(buffer.length, last + Math.round(rate * 0.02));
  const fadeOut = Math.min(Math.round(rate * 0.02), length);
  const fadeIn = Math.round(rate * 6e-4);
  let mean = 0;
  channels.forEach(data => {
    for (let i = 0; i < length; i += 1) mean += data[i];
  });
  mean /= length * channels.length;
  const level = loudness(channels, rate);
  const target = db(recipe.loudness ?? -16);
  let gain = level > 1e-6 ? target / level : 1;
  let peak = 0;
  channels.forEach(data => {
    for (let i = 0; i < length; i += 1) peak = Math.max(peak, Math.abs(data[i] - mean));
  });
  if (peak * gain > db(-1)) gain = db(-1) / peak;
  gain *= db(tune.volume) * db(recipe.gain ?? 0);
  channels.forEach(data => {
    for (let i = 0; i < data.length; i += 1) {
      if (i >= length) {
        data[i] = 0;
        continue;
      }
      let value = (data[i] - mean) * gain;
      if (i < fadeIn) value *= Math.sin(((i / fadeIn) * Math.PI) / 2);
      const remaining = length - i;
      if (remaining < fadeOut) value *= 0.5 - 0.5 * Math.cos((remaining / fadeOut) * Math.PI);
      data[i] = Math.abs(value) > 0.999 ? Math.sign(value) * 0.999 : value;
    }
  });
  return { buffer, length };
};

const trimmed = (source, length) => {
  if (length >= source.length) return source;
  const buffer = new AudioBuffer({ length, numberOfChannels: source.numberOfChannels, sampleRate: source.sampleRate });
  for (let channel = 0; channel < source.numberOfChannels; channel += 1) {
    buffer.copyToChannel(source.getChannelData(channel).subarray(0, length), channel);
  }
  return buffer;
};

const channelsOf = buffer =>
  Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));

const peakOf = channels => {
  let peak = 0;
  channels.forEach(data => {
    for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, Math.abs(data[i]));
  });
  return peak;
};

const balance = mix => [Math.cos((mix * Math.PI) / 2), Math.sin((mix * Math.PI) / 2)];

const predelayOf = decay => clamp(4e-3 + decay * 6e-3, 4e-3, 0.03);

const addEcho = (context, input, echo) => {
  const [dryLevel, wetLevel] = balance(echo.mix);
  const output = context.createGain();
  const dry = context.createGain();
  dry.gain.value = dryLevel;
  input.connect(dry);
  dry.connect(output);
  const wet = context.createGain();
  wet.gain.value = wetLevel;
  wet.connect(output);
  const send = context.createGain();
  if (echo.pingPong) {
    send.channelCount = 1;
    send.channelCountMode = 'explicit';
  }
  input.connect(send);
  const nyquist = context.sampleRate / 2 - 200;
  const taps = (echo.pingPong ? [-0.7, 0.7] : [0]).map(side => {
    const delay = context.createDelay(2.5);
    delay.delayTime.value = echo.time;
    const damp = context.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = Math.min(nyquist, 4200 * Math.pow(2, echo.tone * 1.6));
    damp.Q.value = 0.5;
    const thin = context.createBiquadFilter();
    thin.type = 'highpass';
    thin.frequency.value = 140;
    thin.Q.value = 0.5;
    const pan = context.createStereoPanner();
    pan.pan.value = side;
    delay.connect(damp);
    damp.connect(thin);
    thin.connect(pan);
    pan.connect(wet);
    return { delay, thin };
  });
  taps.forEach((tap, index) => {
    const feedback = context.createGain();
    feedback.gain.value = echo.feedback;
    tap.thin.connect(feedback);
    feedback.connect(taps[(index + 1) % taps.length].delay);
  });
  send.connect(taps[0].delay);
  return output;
};

const addReverb = (context, input, reverb, seed) => {
  const [dryLevel, wetLevel] = balance(reverb.mix);
  const output = context.createGain();
  const dry = context.createGain();
  dry.gain.value = dryLevel;
  input.connect(dry);
  dry.connect(output);
  const thin = context.createBiquadFilter();
  thin.type = 'highpass';
  thin.frequency.value = 160;
  thin.Q.value = 0.5;
  const convolver = context.createConvolver();
  convolver.normalize = false;
  const damp = Math.min(context.sampleRate / 2 - 500, 6500 * Math.pow(2, reverb.tone * 1.4));
  convolver.buffer = impulse(context, reverb.decay, predelayOf(reverb.decay), damp, seed + 101);
  const wet = context.createGain();
  wet.gain.value = wetLevel;
  input.connect(thin);
  thin.connect(convolver);
  convolver.connect(wet);
  wet.connect(output);
  return output;
};

const addFilter = (context, input, filter, span) => {
  const node = context.createBiquadFilter();
  const nyquist = context.sampleRate / 2 - 200;
  const from = clamp(filter.cutoff, 20, nyquist);
  node.type = filter.type;
  node.Q.value = 0.5 * Math.pow(16, filter.resonance);
  node.frequency.setValueAtTime(from, 0);
  if (filter.sweep !== 0) {
    const to = clamp(filter.cutoff * Math.pow(2, filter.sweep * 4), 20, nyquist);
    node.frequency.exponentialRampToValueAtTime(to, Math.max(0.05, span));
  }
  input.connect(node);
  return node;
};

const sine = (context, phase) =>
  context.createPeriodicWave(new Float32Array([0, Math.sin(phase)]), new Float32Array([0, Math.cos(phase)]));

const addChorus = (context, input, chorus) => {
  const [dryLevel, wetLevel] = balance(chorus.mix);
  const output = context.createGain();
  const dry = context.createGain();
  dry.gain.value = dryLevel;
  input.connect(dry);
  dry.connect(output);
  const wet = context.createGain();
  wet.gain.value = wetLevel;
  wet.connect(output);
  [-0.75, 0.75].forEach((side, index) => {
    const delay = context.createDelay(0.1);
    delay.delayTime.value = 0.014 + index * 5e-3;
    const lfo = context.createOscillator();
    lfo.setPeriodicWave(sine(context, (index * Math.PI) / 2));
    lfo.frequency.value = chorus.rate * (1 + index * 0.13);
    const depth = context.createGain();
    depth.gain.value = 3e-4 + chorus.depth * 27e-4;
    lfo.connect(depth);
    depth.connect(delay.delayTime);
    lfo.start();
    const pan = context.createStereoPanner();
    pan.pan.value = side;
    input.connect(delay);
    delay.connect(pan);
    pan.connect(wet);
  });
  return output;
};

const crunch = (source, lofi) => {
  const rate = source.sampleRate;
  const hold = Math.max(1, rate / lofi.rate);
  const steps = Math.pow(2, lofi.bits - 1);
  const squash = Math.log(256);
  const smooth = 1 - Math.exp((-TAU * Math.min(rate * 0.45, lofi.rate * 0.45)) / rate);
  const [dryLevel, wetLevel] = balance(lofi.mix);
  const buffer = new AudioBuffer({
    length: source.length,
    numberOfChannels: source.numberOfChannels,
    sampleRate: rate
  });
  for (let channel = 0; channel < source.numberOfChannels; channel += 1) {
    const input = source.getChannelData(channel);
    const output = buffer.getChannelData(channel);
    let held = 0;
    let phase = hold;
    let low = 0;
    for (let i = 0; i < input.length; i += 1) {
      phase += 1;
      if (phase >= hold) {
        phase -= hold;
        const level = Math.round((Math.log(1 + 255 * Math.abs(input[i])) / squash) * steps) / steps;
        held = (Math.sign(input[i]) * (Math.pow(256, level) - 1)) / 255;
      }
      low += smooth * (held - low);
      output[i] = input[i] * dryLevel + low * wetLevel;
    }
  }
  return buffer;
};

const settle = (buffer, reference) => {
  const rate = buffer.sampleRate;
  const channels = channelsOf(buffer);
  const source = channelsOf(reference);
  const level = loudness(channels, rate);
  let gain = level > 1e-9 ? loudness(source, rate) / level : 1;
  const ceiling = Math.max(peakOf(source), db(-1));
  const peak = peakOf(channels);
  if (peak * gain > ceiling) gain = ceiling / peak;
  const floor = db(-70);
  let last = 0;
  channels.forEach(data => {
    for (let i = data.length - 1; i > last; i -= 1) {
      if (Math.abs(data[i] * gain) > floor) {
        last = i;
        break;
      }
    }
  });
  const length = Math.min(buffer.length, last + Math.round(rate * 0.02));
  const fade = Math.min(Math.round(rate * 0.02), length);
  channels.forEach(data => {
    for (let i = 0; i < length; i += 1) {
      let value = data[i] * gain;
      const remaining = length - i;
      if (remaining < fade) value *= 0.5 - 0.5 * Math.cos((remaining / fade) * Math.PI);
      data[i] = Math.abs(value) > 0.999 ? Math.sign(value) * 0.999 : value;
    }
  });
  return trimmed(buffer, length);
};

const applyEffects = async (dry, settings, seed) => {
  const echo = settings.echo && settings.echo.mix > 0 ? settings.echo : null;
  const reverb = settings.reverb && settings.reverb.mix > 0 ? settings.reverb : null;
  const chorus = settings.chorus && settings.chorus.mix > 0 ? settings.chorus : null;
  const lofi = settings.lofi && settings.lofi.mix > 0 ? settings.lofi : null;
  const filter = settings.filter;
  if (!echo && !reverb && !chorus && !lofi && !filter) return dry;
  const rate = dry.sampleRate;
  const echoTail = echo ? echo.time * (1 + Math.log(1e-3) / Math.log(Math.max(0.05, echo.feedback))) : 0;
  const reverbTail = reverb ? reverb.decay * 1.15 + predelayOf(reverb.decay) : 0;
  const total = dry.duration + Math.min(12, echoTail) + reverbTail + (chorus ? 0.03 : 0) + 0.05;
  const context = new OfflineAudioContext(dry.numberOfChannels, Math.ceil(total * rate), rate);
  const source = context.createBufferSource();
  source.buffer = lofi ? crunch(dry, lofi) : dry;
  let chain = source;
  if (filter) chain = addFilter(context, chain, filter, dry.duration);
  if (chorus) chain = addChorus(context, chain, chorus);
  if (echo) chain = addEcho(context, chain, echo);
  if (reverb) chain = addReverb(context, chain, reverb, seed);
  chain.connect(context.destination);
  source.start();
  return settle(await context.startRendering(), dry);
};

async function renderSound(recipe, tune = {}, options = {}) {
  const t = normalizeTune(tune);
  const rate = options.sampleRate ?? 48e3;
  const channelCount = options.channels ?? 2;
  const reverb = recipe.reverb;
  const spaceMix = reverb ? clamp(reverb.mix * (t.space < 0 ? 1 + t.space : 1 + t.space * 1.6), 0, 0.9) : 0;
  const spaceDecay = reverb ? reverb.decay * (1 + Math.max(0, t.space) * 0.8) : 0;
  const echoTail = recipe.echo
    ? (recipe.echo.time * Math.log(1e-3)) / Math.log(Math.max(0.05, recipe.echo.feedback))
    : 0;
  const body = recipe.duration * t.length;
  const end = body + (spaceMix > 0 ? spaceDecay * 1.1 + (reverb?.predelay ?? 0) : 0) + echoTail + 0.05;
  const context = new OfflineAudioContext(channelCount, Math.ceil(end * rate), rate);
  const bus = context.createGain();
  const variant = Math.max(0, Math.floor(options.variant ?? 0));
  recipe.layers.forEach((layer, index) => buildLayer(context, layer, index, bus, recipe, t, body, variant));
  const highpass = context.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = recipe.highpass ?? 24;
  highpass.Q.value = 0.6;
  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = clamp((recipe.lowpass ?? 16e3) * (1 + t.tone * 0.35), 400, rate / 2 - 200);
  lowpass.Q.value = 0.5;
  const low = context.createBiquadFilter();
  low.type = 'lowshelf';
  low.frequency.value = 280;
  low.gain.value = -t.tone * 4;
  const high = context.createBiquadFilter();
  high.type = 'highshelf';
  high.frequency.value = 3600;
  high.gain.value = t.tone * 7;
  bus.connect(highpass);
  highpass.connect(low);
  low.connect(high);
  high.connect(lowpass);
  let chain = lowpass;
  const drive = clamp((recipe.drive ?? 0) + Math.max(0, t.punch) * 0.25, 0, 1);
  if (drive > 0) {
    const headroom = context.createGain();
    headroom.gain.value = 0.5;
    const shape = context.createWaveShaper();
    shape.curve = shaper(drive);
    shape.oversample = '4x';
    chain.connect(headroom);
    headroom.connect(shape);
    chain = shape;
  }
  const mix = context.createGain();
  chain.connect(mix);
  if (reverb && spaceMix > 0) {
    const convolver = context.createConvolver();
    convolver.normalize = false;
    convolver.buffer = impulse(context, spaceDecay, reverb.predelay ?? 0.01, reverb.damp ?? 6500, recipe.seed ?? 1);
    const wet = context.createGain();
    wet.gain.value = spaceMix * 2.2;
    if (reverb.lowcut) {
      const lowcut = context.createBiquadFilter();
      lowcut.type = 'highpass';
      lowcut.frequency.value = reverb.lowcut;
      lowcut.Q.value = 0.5;
      chain.connect(lowcut);
      lowcut.connect(convolver);
    } else {
      chain.connect(convolver);
    }
    convolver.connect(wet);
    wet.connect(mix);
  }
  if (recipe.echo) {
    const delay = context.createDelay(4);
    delay.delayTime.value = recipe.echo.time * t.length;
    const feedback = context.createGain();
    feedback.gain.value = clamp(recipe.echo.feedback, 0, 0.92);
    const damp = context.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = recipe.echo.damp ?? 4200;
    const wet = context.createGain();
    wet.gain.value = recipe.echo.mix;
    chain.connect(delay);
    delay.connect(damp);
    damp.connect(feedback);
    feedback.connect(delay);
    damp.connect(wet);
    wet.connect(mix);
  }
  mix.connect(context.destination);
  const rendered = await context.startRendering();
  const { buffer, length } = finish(rendered, recipe, t);
  return applyEffects(trimmed(buffer, length), t, recipe.seed ?? 1);
}

let sharedContext = null;

let masterVolume = 1;

let muted = false;

const cache = /* @__PURE__ */ new Map();

const ids = /* @__PURE__ */ new WeakMap();

const lastVariant = /* @__PURE__ */ new WeakMap();

let nextId = 1;

const recipeId = recipe => {
  let id = ids.get(recipe);
  if (!id) {
    id = nextId;
    nextId += 1;
    ids.set(recipe, id);
  }
  return id;
};

const audio = () => {
  if (!sharedContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    sharedContext = new Context({ latencyHint: 'interactive' });
  }
  return sharedContext;
};

const pickVariant = recipe => {
  const count = variantsOf(recipe);
  if (count < 2) return 0;
  const last = lastVariant.get(recipe) ?? -1;
  let next = Math.floor(Math.random() * (last < 0 ? count : count - 1));
  if (last >= 0 && next >= last) next += 1;
  lastVariant.set(recipe, next);
  return next;
};

const bufferFor = (recipe, tune, rate, variant = 0) => {
  const shape = {
    pitch: tune.pitch,
    tone: tune.tone,
    length: tune.length,
    space: tune.space,
    punch: tune.punch,
    reverb: tune.reverb,
    echo: tune.echo,
    filter: tune.filter,
    chorus: tune.chorus,
    lofi: tune.lofi
  };
  const key = `${recipeId(recipe)}:${rate}:${variant}:${JSON.stringify(shape)}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = renderSound(recipe, shape, { sampleRate: rate, variant });
    cache.set(key, pending);
    if (cache.size > 96) cache.delete(cache.keys().next().value);
  }
  return pending;
};

function setSoundVolume(value) {
  masterVolume = clamp(value, 0, 1);
}

function setSoundMuted(value) {
  muted = value;
}

function preloadSound(recipe, tune = {}) {
  if (typeof window === 'undefined') return;
  for (let variant = 0; variant < variantsOf(recipe); variant += 1) {
    bufferFor(recipe, tune, audio().sampleRate, variant).catch(() => void 0);
  }
}

async function playSound(recipe, tune = {}) {
  if (typeof window === 'undefined' || muted || masterVolume <= 0) return;
  const context = audio();
  if (context.state === 'suspended') await context.resume();
  const buffer = await bufferFor(recipe, tune, context.sampleRate, pickVariant(recipe));
  const source = context.createBufferSource();
  source.buffer = buffer;
  const variation = clamp(tune.variation ?? 0, 0, 1);
  if (variation > 0) source.detune.value = (Math.random() * 2 - 1) * variation * 80;
  const gain = context.createGain();
  gain.gain.value = masterVolume * db(clamp(tune.volume ?? 0, -48, 12));
  source.connect(gain);
  gain.connect(context.destination);
  source.start();
  await new Promise(resolve => {
    source.onended = () => resolve();
  });
}

function useSound(recipe, tune = {}) {
  const latest = useRef({ recipe, tune });
  latest.current = { recipe, tune };
  const key = JSON.stringify(tune);
  useEffect(() => {
    preloadSound(latest.current.recipe, latest.current.tune);
  }, [recipe, key]);
  return useCallback(() => {
    playSound(latest.current.recipe, latest.current.tune).catch(() => void 0);
  }, []);
}

export { playSound, preloadSound, renderSound, setSoundMuted, setSoundVolume, useSound };
