export function analyze(buffer, { peaks = 240 } = {}) {
  const rate = buffer.sampleRate;
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  const mono = new Float32Array(left.length);
  let peak = 0;
  for (let i = 0; i < left.length; i += 1) {
    mono[i] = (left[i] + right[i]) / 2;
    peak = Math.max(peak, Math.abs(mono[i]));
  }
  const window = Math.max(1, Math.round(rate * 0.01));
  let stop = mono.length;
  const floor = peak * 0.012;
  for (let end = mono.length; end > window; end -= window) {
    let max = 0;
    for (let i = end - window; i < end; i += 1) max = Math.max(max, Math.abs(mono[i]));
    if (max > floor) {
      stop = Math.min(mono.length, end + window * 4);
      break;
    }
  }
  const wave = new Float32Array(peaks);
  for (let bin = 0; bin < peaks; bin += 1) {
    const a = Math.floor((bin / peaks) * mono.length);
    const b = Math.max(a + 1, Math.floor(((bin + 1) / peaks) * mono.length));
    let max = 0;
    for (let i = a; i < b; i += 1) max = Math.max(max, Math.abs(mono[i]));
    wave[bin] = max;
  }
  const waveTop = Math.max(1e-6, ...wave);
  return {
    duration: buffer.length / rate,
    audible: stop / rate,
    wave: Array.from(wave, value => {
      const level = Math.max(0, 1 + (20 * Math.log10(Math.max(value / waveTop, 1e-6))) / 54);
      return Number(Math.pow(level, 1.6).toFixed(4));
    })
  };
}
