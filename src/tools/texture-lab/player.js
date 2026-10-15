const AHEAD = 4;
const END_GUARD = 1 / 120;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

class FramePlayer {
  constructor({ input, sink, duration, width, height, rotation }) {
    this.input = input;
    this.sink = sink;
    this.duration = duration;
    this.width = width;
    this.height = height;
    this.rotation = rotation;
    this.range = [0, duration];
    this.paused = true;
    this.anchorTime = 0;
    this.anchorClock = 0;
    this.current = null;
    this.queue = [];
    this.iterator = null;
    this.generation = 0;
    this.pumping = false;
    this.seeking = null;
    this.nextSeek = null;
    this.version = 0;
    this.disposed = false;
  }

  get currentTime() {
    if (this.paused) return this.anchorTime;
    return clamp(this.anchorTime + (performance.now() - this.anchorClock) / 1000, this.range[0], this.range[1]);
  }

  set currentTime(value) {
    this.seek(value);
  }

  setRange(start, end) {
    const a = clamp(start, 0, this.duration);
    const b = clamp(end, a, this.duration);
    this.range = [a, b];
    const time = this.currentTime;
    if (time < a || time > b) this.seek(a);
  }

  play() {
    if (this.disposed || !this.paused) return Promise.resolve();
    let start = this.anchorTime;
    if (start >= this.range[1] - END_GUARD || start < this.range[0]) start = this.range[0];
    this.paused = false;
    this.restart(start);
    return Promise.resolve();
  }

  pause() {
    if (this.paused) return;
    this.anchorTime = this.currentTime;
    this.paused = true;
    this.stopStream();
  }

  seek(value) {
    if (this.disposed) return;
    const time = clamp(value, this.range[0], Math.max(this.range[0], this.range[1] - END_GUARD));
    if (!this.paused) {
      this.restart(time);
      return;
    }
    this.anchorTime = time;
    this.stopStream();
    this.requestFrame(time);
  }

  restart(time) {
    this.anchorTime = time;
    this.anchorClock = performance.now();
    this.stopStream();
    const generation = this.generation;
    this.iterator = this.sink.samples(time, this.range[1]);
    this.pump(generation);
  }

  stopStream() {
    this.generation += 1;
    const iterator = this.iterator;
    this.iterator = null;
    if (iterator) iterator.return?.().catch(() => {});
    this.queue.forEach(sample => sample.close());
    this.queue = [];
  }

  async pump(generation) {
    if (this.pumping) return;
    this.pumping = true;
    try {
      while (!this.disposed && generation === this.generation && this.iterator && this.queue.length < AHEAD) {
        const { value, done } = await this.iterator.next();
        if (generation !== this.generation || this.disposed) {
          value?.close();
          break;
        }
        if (done || !value) break;
        this.queue.push(value);
      }
    } catch {
      this.queue.forEach(sample => sample.close());
      this.queue = [];
    } finally {
      this.pumping = false;
    }
    if (!this.disposed && generation !== this.generation && this.iterator && !this.paused) {
      this.pump(this.generation);
    }
  }

  async requestFrame(time) {
    if (this.seeking) {
      this.nextSeek = time;
      return;
    }
    this.seeking = this.sink
      .getSample(time)
      .then(sample => {
        if (this.disposed || !this.paused) {
          sample?.close();
          return;
        }
        if (sample) this.present(sample);
      })
      .catch(() => {})
      .finally(() => {
        this.seeking = null;
        if (this.nextSeek !== null) {
          const next = this.nextSeek;
          this.nextSeek = null;
          if (this.paused) this.requestFrame(next);
        }
      });
  }

  present(sample) {
    this.current?.close();
    this.current = sample;
    this.version += 1;
  }

  update() {
    if (this.disposed || this.paused) return;
    let time = this.anchorTime + (performance.now() - this.anchorClock) / 1000;
    if (time >= this.range[1] - END_GUARD) {
      this.restart(this.range[0]);
      time = this.range[0];
    }
    let next = null;
    while (this.queue.length && this.queue[0].timestamp <= time + 0.004) {
      next?.close();
      next = this.queue.shift();
    }
    if (next) this.present(next);
    if (this.iterator && !this.pumping && this.queue.length < AHEAD) this.pump(this.generation);
  }

  drawable() {
    const sample = this.current;
    if (!sample) return null;
    try {
      return {
        image: sample.toCanvasImageSource(),
        width: sample.codedWidth ?? sample.displayWidth,
        height: sample.codedHeight ?? sample.displayHeight,
        rotation: sample.rotation || 0,
        flip: Boolean(sample.flip)
      };
    } catch {
      return null;
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopStream();
    this.current?.close();
    this.current = null;
    this.input.dispose?.();
  }
}

class ElementPlayer {
  constructor(video, duration) {
    this.video = video;
    this.duration = duration;
    this.width = video.videoWidth;
    this.height = video.videoHeight;
    this.rotation = 0;
    this.range = [0, duration];
    this.version = 0;
  }

  get currentTime() {
    return this.video.currentTime;
  }

  set currentTime(value) {
    this.seek(value);
  }

  get paused() {
    return this.video.paused;
  }

  setRange(start, end) {
    const a = clamp(start, 0, this.duration);
    this.range = [a, clamp(end, a, this.duration)];
    const time = this.video.currentTime;
    if (time < this.range[0] || time > this.range[1]) this.seek(this.range[0]);
  }

  play() {
    if (this.video.currentTime >= this.range[1] - END_GUARD) this.video.currentTime = this.range[0];
    return this.video.play().catch(() => {});
  }

  pause() {
    this.video.pause();
  }

  seek(value) {
    this.video.currentTime = clamp(value, this.range[0], Math.max(this.range[0], this.range[1] - END_GUARD));
    this.version += 1;
  }

  update() {
    const video = this.video;
    if (video.paused) return;
    const time = video.currentTime;
    if (time >= this.range[1] - END_GUARD || time < this.range[0] - 0.05) video.currentTime = this.range[0];
    this.version += 1;
  }

  drawable() {
    const video = this.video;
    if (video.readyState < 2 || !video.videoWidth) return null;
    return { image: video, width: video.videoWidth, height: video.videoHeight, rotation: 0, flip: false };
  }

  dispose() {
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load();
  }
}

const elementPlayer = (url, start) =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.loop = false;
    video.playsInline = true;
    video.preload = 'auto';
    video.onloadeddata = () => {
      const finish = duration => resolve(new ElementPlayer(video, duration));
      if (Number.isFinite(video.duration)) {
        finish(video.duration);
        return;
      }
      const settle = () => {
        if (!Number.isFinite(video.duration)) return;
        video.removeEventListener('durationchange', settle);
        video.currentTime = start;
        finish(video.duration);
      };
      video.addEventListener('durationchange', settle);
      video.currentTime = 1e9;
    };
    video.onerror = () => reject(new Error('This video could not be opened.'));
    video.src = url;
  });

export async function openVideo({ file, url }) {
  if (typeof VideoDecoder !== 'undefined') {
    let input = null;
    try {
      const mb = await import('mediabunny');
      input = new mb.Input({ source: file ? new mb.BlobSource(file) : new mb.UrlSource(url), formats: mb.ALL_FORMATS });
      const track = await input.getPrimaryVideoTrack();
      if (track && (await track.canDecode())) {
        const duration = await input.computeDuration();
        const sink = new mb.VideoSampleSink(track);
        const first = await sink.getSample(await track.getFirstTimestamp());
        if (first && duration > 0) {
          const player = new FramePlayer({
            input,
            sink,
            duration,
            width: track.displayWidth,
            height: track.displayHeight,
            rotation: track.rotation || 0
          });
          player.present(first);
          return player;
        }
        first?.close();
      }
    } catch {
      input?.dispose?.();
      input = null;
    }
    input?.dispose?.();
  }
  return elementPlayer(url, 0);
}
