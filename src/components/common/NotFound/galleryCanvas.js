import { categoryPreviews } from './categoryPreviews';

const SPEED = 24;
const CROSSFADE = 280;
const EXIT_DURATION = 700;
const mod = (value, period) => ((value % period) + period) % period;

const roundedRect = (context, x, y, width, height, radius) => {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
};

const drawCover = (context, source, sourceBox, x, y, width, height) => {
  const scale = Math.max(width / sourceBox.width, height / sourceBox.height);
  const croppedWidth = width / scale;
  const croppedHeight = height / scale;
  context.drawImage(
    source,
    sourceBox.x + (sourceBox.width - croppedWidth) / 2,
    sourceBox.y + (sourceBox.height - croppedHeight) / 2,
    croppedWidth,
    croppedHeight,
    x,
    y,
    width,
    height
  );
};

const createMedia = (item, wake) => {
  const image = new Image();
  let video = null;
  let playing = false;
  let disposed = false;

  image.onload = wake;
  image.src = item.poster;

  const pause = () => {
    playing = false;
    video?.pause();
  };

  const play = () => {
    if (playing || disposed) return;
    playing = true;
    video.play()?.catch(() => {
      // A browser may deny preview autoplay. The loaded still remains useful.
    });
  };

  const sync = shouldPlay => {
    if (!shouldPlay) {
      if (playing) pause();
      return;
    }
    if (!video) {
      video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.preload = 'auto';
      video.onloadeddata = wake;
      for (const type of ['webm', 'mp4']) {
        const source = document.createElement('source');
        source.src = `${item.video}.${type}`;
        source.type = `video/${type}`;
        video.appendChild(source);
      }
      video.load();
    }
    play();
  };

  return {
    name: item.name,
    image,
    get video() {
      return video;
    },
    sync,
    pause,
    dispose() {
      disposed = true;
      pause();
      image.onload = null;
      if (video) {
        video.onloadeddata = null;
        video.removeAttribute('src');
        video.replaceChildren();
        video.load();
      }
    }
  };
};

export const createGalleryCanvas = (canvas, onFrame) => {
  const context = canvas.getContext('2d');
  const scene = document.createElement('canvas');
  const sceneContext = scene.getContext('2d');
  let options = { active: false, category: null, theme: 'dark', reducedMotion: false };
  let deck = [];
  let previous = null;
  let transitionStart = 0;
  let exitUntil = 0;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let offset = 0;
  let last = 0;
  let frame = 0;
  let disposed = false;

  const visible = () => !disposed && !document.hidden && (options.active || performance.now() < exitUntil);
  const pause = () => deck.forEach(item => item.pause());
  const discardPrevious = () => {
    if (!previous) return;
    previous.width = 0;
    previous.height = 0;
    previous = null;
  };

  const drawCard = (item, x, y, cardWidth, cardHeight) => {
    const dark = options.theme !== 'light';
    const mediaHeight = cardHeight - 38;
    const inset = 5;
    sceneContext.save();
    roundedRect(sceneContext, x, y, cardWidth, cardHeight, 15);
    sceneContext.shadowColor = dark ? 'rgba(0,0,0,.22)' : 'rgba(26,23,42,.10)';
    sceneContext.shadowBlur = 16;
    sceneContext.shadowOffsetY = 6;
    sceneContext.fillStyle = dark ? '#17151c' : '#ffffff';
    sceneContext.fill();
    sceneContext.shadowColor = 'transparent';
    sceneContext.clip();
    sceneContext.fillStyle = '#08070b';
    roundedRect(sceneContext, x + inset, y + inset, cardWidth - inset * 2, mediaHeight - inset, 11);
    sceneContext.fill();
    sceneContext.save();
    sceneContext.clip();

    const video = item.video;
    if (!options.reducedMotion && video?.readyState >= 2 && video.videoWidth) {
      drawCover(
        sceneContext,
        video,
        { x: 0, y: 0, width: video.videoWidth, height: video.videoHeight },
        x + inset,
        y + inset,
        cardWidth - inset * 2,
        mediaHeight - inset
      );
    } else if (item.image.complete && item.image.naturalWidth) {
      // Existing OG images contain the preview at x=520, y=82. Crop the card
      // interior so their logo and page title never appear in this small gallery.
      const imageScale = item.image.naturalWidth / 1200;
      drawCover(
        sceneContext,
        item.image,
        { x: 524 * imageScale, y: 86 * imageScale, width: 672 * imageScale, height: 458 * imageScale },
        x + inset,
        y + inset,
        cardWidth - inset * 2,
        mediaHeight - inset
      );
    } else {
      sceneContext.fillStyle = 'rgba(236,231,248,.46)';
      sceneContext.font = '500 12px "Geist Mono", monospace';
      sceneContext.textAlign = 'center';
      sceneContext.fillText(`<${item.name.replaceAll(' ', '')} />`, x + cardWidth / 2, y + mediaHeight / 2 + 4);
    }
    sceneContext.restore();

    sceneContext.fillStyle = dark ? '#e8e5ed' : '#2b2733';
    sceneContext.font = '500 12px "Geist", sans-serif';
    sceneContext.textAlign = 'left';
    sceneContext.textBaseline = 'middle';
    sceneContext.fillText(item.name, x + 14, y + mediaHeight + 18);
    roundedRect(sceneContext, x + 0.5, y + 0.5, cardWidth - 1, cardHeight - 1, 14.5);
    sceneContext.strokeStyle = dark ? 'rgba(224,215,244,.13)' : 'rgba(43,29,67,.12)';
    sceneContext.lineWidth = 1;
    sceneContext.stroke();
    sceneContext.restore();
  };

  const draw = now => {
    const cardWidth = Math.min(222, Math.max(180, width * 0.55));
    const cardHeight = cardWidth * 0.63 + 38;
    const step = cardWidth + 16;
    const start = (width - cardWidth) / 2;
    const y = (height - cardHeight) / 2;
    const travel = mod(offset, deck.length * step);
    const progress = previous ? Math.min(1, (now - transitionStart) / CROSSFADE) : 1;
    const mix = options.reducedMotion ? 1 : 1 - (1 - progress) ** 3;

    sceneContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    sceneContext.clearRect(0, 0, width, height);
    if (previous && mix < 1) {
      sceneContext.globalAlpha = 1 - mix;
      sceneContext.drawImage(previous, 0, 0, width, height);
    }
    sceneContext.globalAlpha = mix;
    const first = Math.floor((travel - start - cardWidth - 20) / step);
    const last = Math.ceil((width + travel - start + 20) / step);
    const shown = new Set();
    for (let index = first; index <= last; index++) {
      const x = start + index * step - travel;
      if (x + cardWidth < -20 || x > width + 20) continue;
      const mediaIndex = mod(index, deck.length);
      shown.add(mediaIndex);
      drawCard(deck[mediaIndex], x, y, cardWidth, cardHeight);
    }
    sceneContext.globalAlpha = 1;
    deck.forEach((item, index) => item.sync(!options.reducedMotion && shown.has(index)));
    if (mix === 1) discardPrevious();

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.drawImage(scene, 0, 0, width, height);
    // Bake the edge fade into the shared live frame, including the reflection.
    const fade = Math.min(116, width * 0.21) / width;
    const mask = context.createLinearGradient(0, 0, width, 0);
    mask.addColorStop(0, 'transparent');
    mask.addColorStop(fade * 0.3, 'rgba(0,0,0,.15)');
    mask.addColorStop(fade * 0.68, 'rgba(0,0,0,.7)');
    mask.addColorStop(fade, '#000');
    mask.addColorStop(1 - fade, '#000');
    mask.addColorStop(1 - fade * 0.68, 'rgba(0,0,0,.7)');
    mask.addColorStop(1 - fade * 0.3, 'rgba(0,0,0,.15)');
    mask.addColorStop(1, 'transparent');
    context.globalCompositeOperation = 'destination-in';
    context.fillStyle = mask;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
    onFrame(canvas);
  };

  const tick = now => {
    frame = 0;
    if (!visible() || !deck.length || !width || !height) {
      last = 0;
      pause();
      return;
    }
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    if (!options.reducedMotion) offset += dt * SPEED;
    draw(now);
    if (!options.reducedMotion) frame = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (!frame && visible()) frame = requestAnimationFrame(tick);
  };

  const resize = () => {
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    const nextRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (!nextWidth || !nextHeight || (width === nextWidth && height === nextHeight && ratio === nextRatio)) return;
    width = nextWidth;
    height = nextHeight;
    ratio = nextRatio;
    canvas.width = scene.width = Math.round(width * ratio);
    canvas.height = scene.height = Math.round(height * ratio);
    wake();
  };

  const onVisibility = () => {
    last = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      pause();
    } else wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);
  resize();

  return {
    update(next) {
      const changedCategory = next.category && categoryPreviews[next.category] && options.category !== next.category;
      if (changedCategory) {
        discardPrevious();
        if (deck.length && scene.width && scene.height) {
          previous = document.createElement('canvas');
          previous.width = scene.width;
          previous.height = scene.height;
          previous.getContext('2d').drawImage(scene, 0, 0);
          transitionStart = performance.now();
        }
        deck.forEach(item => item.dispose());
        deck = categoryPreviews[next.category].map(item => createMedia(item, wake));
      }
      if (!next.active && options.active) exitUntil = performance.now() + EXIT_DURATION;
      if (next.active && !options.active) last = 0;
      options = { ...next, category: next.category || options.category };
      if (options.reducedMotion) pause();
      resize();
      wake();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      deck.forEach(item => item.dispose());
      discardPrevious();
      scene.width = 0;
      scene.height = 0;
    }
  };
};
