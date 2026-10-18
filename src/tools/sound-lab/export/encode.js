import { encodeWav } from './wav';

let mp3Ready = null;

const ensureMp3 = async () => {
  if (!mp3Ready) {
    mp3Ready = (async () => {
      const { canEncodeAudio } = await import('mediabunny');
      if (await canEncodeAudio('mp3')) return;
      const { registerMp3Encoder } = await import('@mediabunny/mp3-encoder');
      registerMp3Encoder();
    })();
  }
  return mp3Ready;
};

const mixDown = buffer => {
  if (buffer.numberOfChannels === 1) return buffer;
  const mono = new AudioBuffer({ length: buffer.length, numberOfChannels: 1, sampleRate: buffer.sampleRate });
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const out = mono.getChannelData(0);
  for (let i = 0; i < buffer.length; i += 1) out[i] = (left[i] + right[i]) / 2;
  return mono;
};

export async function canEncode(format) {
  if (format === 'wav') return true;
  if (typeof AudioEncoder === 'undefined' && format !== 'mp3') return false;
  const { canEncodeAudio } = await import('mediabunny');
  if (format === 'ogg') return canEncodeAudio('opus');
  if (format === 'mp3') return true;
  return false;
}

export async function encodeAudio(buffer, { format = 'wav', bitDepth = 24, bitrate = 320, channels = 2 } = {}) {
  if (format === 'wav') return encodeWav(buffer, { bitDepth, channels });
  const source = channels === 1 ? mixDown(buffer) : buffer;
  const { Output, BufferTarget, AudioBufferSource, Mp3OutputFormat, OggOutputFormat } = await import('mediabunny');
  if (format === 'mp3') await ensureMp3();
  const output = new Output({
    format: format === 'mp3' ? new Mp3OutputFormat() : new OggOutputFormat(),
    target: new BufferTarget()
  });
  const track = new AudioBufferSource({ codec: format === 'mp3' ? 'mp3' : 'opus', bitrate: bitrate * 1000 });
  output.addAudioTrack(track);
  await output.start();
  await track.add(source);
  await output.finalize();
  return new Blob([output.target.buffer], { type: format === 'mp3' ? 'audio/mpeg' : 'audio/ogg' });
}
