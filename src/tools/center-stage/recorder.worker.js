import {
  BufferTarget,
  Mp4OutputFormat,
  Output,
  Quality,
  VideoSample,
  VideoSampleSource,
  canEncodeVideo
} from 'mediabunny';

const ENCODERS = [
  { codec: 'avc', hardwareAcceleration: 'prefer-software' },
  { codec: 'avc', hardwareAcceleration: 'no-preference' },
  { codec: 'vp9', hardwareAcceleration: 'prefer-software' },
  { codec: 'hevc', hardwareAcceleration: 'no-preference' },
  { codec: 'av1', hardwareAcceleration: 'no-preference' }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const even = value => Math.max(2, Math.floor(value / 2) * 2);
const bitrateFor = (width, height, fps) => Math.round(clamp(width * height * fps * 0.1, 4e6, 6e7));
const clock = () => performance.timeOrigin + performance.now();
const PROBE = [48, 27];

function changeWatcher() {
  if (typeof OffscreenCanvas !== 'function') return () => true;
  const canvas = new OffscreenCanvas(PROBE[0], PROBE[1]);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let previous = null;
  return frame => {
    try {
      context.drawImage(frame, 0, 0, PROBE[0], PROBE[1]);
    } catch {
      return true;
    }
    const data = context.getImageData(0, 0, PROBE[0], PROBE[1]).data;
    let diff = 0;
    if (previous) {
      for (let index = 0; index < data.length; index += 4) {
        diff +=
          Math.abs(data[index] - previous[index]) +
          Math.abs(data[index + 1] - previous[index + 1]) +
          Math.abs(data[index + 2] - previous[index + 2]);
      }
    }
    const moved = !previous || diff / (PROBE[0] * PROBE[1] * 3) > 0.02;
    previous = data;
    return moved;
  };
}

async function pickEncoding(format, width, height, fps) {
  const supported = format.getSupportedVideoCodecs();
  const long = Math.max(width, height);
  const sides = [long, 1920, 1280].filter((side, index) => index === 0 || side < long);
  for (const side of sides) {
    const scale = side / long;
    const size = { width: even(width * scale), height: even(height * scale) };
    const bitrate = bitrateFor(size.width, size.height, fps);
    for (const option of ENCODERS) {
      if (!supported.includes(option.codec)) continue;
      const ok = await canEncodeVideo(option.codec, {
        ...size,
        quality: new Quality({ bitrate }),
        frameRate: fps,
        hardwareAcceleration: option.hardwareAcceleration
      }).catch(() => false);
      if (ok) return { ...option, ...size, bitrate };
    }
  }
  return null;
}

let session = null;

async function start({ readable, fps, size }) {
  const reader = readable.getReader();
  const state = { stopping: false, cancelled: false, stoppedAt: 0, frames: 0, changes: [], held: null };
  session = {
    stop: at => {
      state.stopping = true;
      state.stoppedAt = at;
      reader.cancel().catch(() => {});
    },
    cancel: () => {
      state.cancelled = true;
      state.stopping = true;
      reader.cancel().catch(() => {});
    }
  };
  let output = null;
  let source = null;
  let target = null;
  let origin = null;
  const changed = changeWatcher();
  const add = async (frame, timestamp, duration) => {
    const sample = new VideoSample(frame, { timestamp, duration });
    try {
      await source.add(sample);
      state.frames += 1;
    } finally {
      sample.close();
      frame.close();
    }
  };
  const open = async frame => {
    const format = new Mp4OutputFormat({ fastStart: 'in-memory' });
    const encoding = await pickEncoding(format, frame.displayWidth, frame.displayHeight, fps);
    if (!encoding) throw new Error('This browser cannot record video at this size.');
    const exact = encoding.width === frame.codedWidth && encoding.height === frame.codedHeight;
    target = new BufferTarget();
    output = new Output({ format, target });
    source = new VideoSampleSource({
      codec: encoding.codec,
      quality: new Quality({ bitrate: encoding.bitrate }),
      hardwareAcceleration: encoding.hardwareAcceleration,
      keyFrameInterval: 1,
      contentHint: 'detail',
      sizeChangeBehavior: 'cover',
      ...(exact ? {} : { transform: { width: encoding.width, height: encoding.height } })
    });
    output.addVideoTrack(source, { frameRate: fps });
    await output.start();
  };
  try {
    const check = await pickEncoding(new Mp4OutputFormat(), size[0], size[1], fps);
    if (!check) throw new Error('This browser cannot record video at this size.');
    self.postMessage({ type: 'started', codec: check.codec });
    for (;;) {
      let result = null;
      try {
        result = await reader.read();
      } catch {
        break;
      }
      if (result.done || !result.value) break;
      const frame = result.value;
      if (state.cancelled) {
        frame.close();
        break;
      }
      if (!origin) {
        origin = { stamp: frame.timestamp, at: clock() };
        await open(frame);
        changed(frame);
        state.held = { frame, time: 0 };
        continue;
      }
      const time = Math.max((frame.timestamp - origin.stamp) / 1e6, state.held.time + 0.004);
      if (changed(frame)) state.changes.push(time);
      const held = state.held;
      state.held = { frame, time };
      await add(held.frame, held.time, time - held.time);
    }
    if (state.cancelled || !state.held) {
      state.held?.frame.close();
      await output?.cancel().catch(() => {});
      self.postMessage({ type: state.cancelled ? 'cancelled' : 'done', frames: 0 });
      return;
    }
    const end = Math.max(state.held.time + 1 / fps, ((state.stoppedAt || clock()) - origin.at) / 1000);
    const held = state.held;
    state.held = null;
    await add(held.frame, held.time, end - held.time);
    source.close();
    await output.finalize();
    const buffer = target.buffer;
    self.postMessage(
      {
        type: 'done',
        buffer,
        frames: state.frames,
        duration: end,
        origin: origin.at,
        first: state.changes[0] ?? null,
        last: state.changes[state.changes.length - 1] ?? null
      },
      [buffer]
    );
  } catch (problem) {
    state.held?.frame.close();
    reader.cancel().catch(() => {});
    await output?.cancel().catch(() => {});
    self.postMessage({ type: 'error', message: problem?.message || 'The recording failed.' });
  }
}

self.onmessage = ({ data }) => {
  if (data.type === 'start') start(data);
  else if (data.type === 'stop') session?.stop(data.at);
  else if (data.type === 'cancel') session?.cancel();
};
