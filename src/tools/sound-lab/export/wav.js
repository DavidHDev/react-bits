export function encodeWav(buffer, { bitDepth = 24, channels = buffer.numberOfChannels } = {}) {
  const rate = buffer.sampleRate;
  const frames = buffer.length;
  const sources = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  const mono = channels === 1 && sources.length > 1;
  const count = mono ? 1 : sources.length;
  const float = bitDepth === 32;
  const bytes = bitDepth / 8;
  const dataSize = frames * count * bytes;
  const view = new DataView(new ArrayBuffer(44 + dataSize));
  const text = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, float ? 3 : 1, true);
  view.setUint16(22, count, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * count * bytes, true);
  view.setUint16(32, count * bytes, true);
  view.setUint16(34, bitDepth, true);
  text(36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < frames; i += 1) {
    for (let channel = 0; channel < count; channel += 1) {
      let sample = mono ? (sources[0][i] + sources[1][i]) / 2 : sources[channel][i];
      sample = Math.max(-1, Math.min(1, sample));
      if (float) {
        view.setFloat32(offset, sample, true);
      } else if (bitDepth === 24) {
        const value = Math.round(sample < 0 ? sample * 0x800000 : sample * 0x7fffff);
        view.setUint8(offset, value & 0xff);
        view.setUint8(offset + 1, (value >> 8) & 0xff);
        view.setUint8(offset + 2, (value >> 16) & 0xff);
      } else {
        view.setInt16(offset, Math.round(sample < 0 ? sample * 0x8000 : sample * 0x7fff), true);
      }
      offset += bytes;
    }
  }
  return new Blob([view.buffer], { type: 'audio/wav' });
}
