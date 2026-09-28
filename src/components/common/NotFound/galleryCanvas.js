import { categoryPreviews } from './categoryPreviews';

const SPEED = 24;
const MORPH_SPRING = 12;
const MEDIA_WAIT = 180;
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

const createMedia = (item, poster, wake) => {
  const image = poster.image;
  let video = null;
  let playing = false;
  let disposed = false;

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
    get ready() {
      return (
        (video?.readyState >= 2 && video.videoWidth > 0) || (image.complete && image.naturalWidth > 0) || poster.failed
      );
    },
    sync,
    pause,
    dispose() {
      disposed = true;
      pause();
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
  const layerCanvas = document.createElement('canvas');
  const layerContext = layerCanvas.getContext('2d');
  const posters = new Map();
  let options = { active: false, category: null, theme: 'dark', reducedMotion: false };
  let layers = [];
  let requested = null;
  let target = null;
  let requestedAt = 0;
  let exitUntil = 0;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let offset = 0;
  let last = 0;
  let frame = 0;
  let disposed = false;

  const visible = () => !disposed && !document.hidden && (options.active || performance.now() < exitUntil);
  const pause = () => layers.forEach(layer => layer.deck.forEach(item => item.pause()));
  const getPoster = item => {
    if (!posters.has(item.poster)) {
      const image = new Image();
      const poster = { image, failed: false };
      image.onload = wake;
      image.onerror = () => {
        poster.failed = true;
        wake();
      };
      image.src = item.poster;
      posters.set(item.poster, poster);
    }
    return posters.get(item.poster);
  };

  const drawCard = (item, x, y, cardWidth, cardHeight) => {
    const dark = options.theme !== 'light';
    const mediaHeight = cardHeight - 38;
    const inset = 5;
    layerContext.save();
    roundedRect(layerContext, x, y, cardWidth, cardHeight, 15);
    layerContext.shadowColor = dark ? 'rgba(0,0,0,.22)' : 'rgba(26,23,42,.10)';
    layerContext.shadowBlur = 16;
    layerContext.shadowOffsetY = 6;
    layerContext.fillStyle = dark ? '#17151c' : '#ffffff';
    layerContext.fill();
    layerContext.shadowColor = 'transparent';
    layerContext.clip();
    layerContext.fillStyle = '#08070b';
    roundedRect(layerContext, x + inset, y + inset, cardWidth - inset * 2, mediaHeight - inset, 11);
    layerContext.fill();
    layerContext.save();
    layerContext.clip();

    const video = item.video;
    if (!options.reducedMotion && video?.readyState >= 2 && video.videoWidth) {
      drawCover(
        layerContext,
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
        layerContext,
        item.image,
        { x: 524 * imageScale, y: 86 * imageScale, width: 672 * imageScale, height: 458 * imageScale },
        x + inset,
        y + inset,
        cardWidth - inset * 2,
        mediaHeight - inset
      );
    } else {
      layerContext.fillStyle = 'rgba(236,231,248,.46)';
      layerContext.font = '500 12px "Geist Mono", monospace';
      layerContext.textAlign = 'center';
      layerContext.fillText(`<${item.name.replaceAll(' ', '')} />`, x + cardWidth / 2, y + mediaHeight / 2 + 4);
    }
    layerContext.restore();

    layerContext.fillStyle = dark ? '#e8e5ed' : '#2b2733';
    layerContext.font = '500 12px "Geist", sans-serif';
    layerContext.textAlign = 'left';
    layerContext.textBaseline = 'middle';
    layerContext.fillText(item.name, x + 14, y + mediaHeight + 18);
    roundedRect(layerContext, x + 0.5, y + 0.5, cardWidth - 1, cardHeight - 1, 14.5);
    layerContext.strokeStyle = dark ? 'rgba(224,215,244,.13)' : 'rgba(43,29,67,.12)';
    layerContext.lineWidth = 1;
    layerContext.stroke();
    layerContext.restore();
  };

  const draw = (now, dt) => {
    const cardWidth = Math.min(222, Math.max(180, width * 0.55));
    const cardHeight = cardWidth * 0.63 + 38;
    const step = cardWidth + 16;
    const start = (width - cardWidth) / 2;
    const y = (height - cardHeight) / 2;
    const travel = mod(offset, requested.deck.length * step);
    const first = Math.floor((travel - start - cardWidth - 20) / step);
    const last = Math.ceil((width + travel - start + 20) / step);
    const shown = new Set();
    for (let index = first; index <= last; index++) {
      const x = start + index * step - travel;
      if (x + cardWidth >= -20 && x <= width + 20) shown.add(mod(index, requested.deck.length));
    }
    const outgoing = layers
      .filter(layer => layer !== requested && layer.weight > 0.04)
      .sort((a, b) => b.weight - a.weight)[0];

    // Prepare the incoming imagery while the outgoing category keeps playing.
    // Posters are shared across visits; videos only play on visible cards.
    layers.forEach(layer => {
      layer.deck.forEach((item, index) =>
        item.sync(!options.reducedMotion && shown.has(index) && (layer === requested || layer === outgoing))
      );
    });
    if (
      options.reducedMotion ||
      now - requestedAt >= MEDIA_WAIT ||
      [...shown].every(index => requested.deck[index].ready)
    ) {
      target = requested;
    }

    const decay = Math.exp(-MORPH_SPRING * dt);
    layers.forEach(layer => {
      const destination = layer === target ? 1 : 0;
      if (options.reducedMotion) {
        layer.weight = destination;
        layer.velocity = 0;
        return;
      }
      // An exact critically damped spring keeps its velocity when retargeted.
      const displacement = layer.weight - destination;
      const impulse = (layer.velocity + MORPH_SPRING * displacement) * dt;
      layer.weight = destination + (displacement + impulse) * decay;
      layer.velocity = (layer.velocity - MORPH_SPRING * impulse) * decay;
    });
    layers = layers.filter(layer => {
      if (layer === requested || layer === target || layer.weight > 0.002 || Math.abs(layer.velocity) > 0.02)
        return true;
      layer.deck.forEach(item => item.dispose());
      return false;
    });
    const totalWeight = layers.reduce((total, layer) => total + Math.max(0, layer.weight), 0) || 1;

    sceneContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    sceneContext.clearRect(0, 0, width, height);
    layers.forEach(layer => {
      const weight = Math.max(0, layer.weight) / totalWeight;
      if (weight < 0.001) return;
      layerContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      layerContext.clearRect(0, 0, width, height);
      for (let index = first; index <= last; index++) {
        const x = start + index * step - travel;
        if (x + cardWidth < -20 || x > width + 20) continue;
        drawCard(layer.deck[mod(index, layer.deck.length)], x, y, cardWidth, cardHeight);
      }

      const scale = options.reducedMotion ? 1 : 0.94 + 0.06 * weight;
      sceneContext.save();
      sceneContext.translate(width / 2, height / 2);
      sceneContext.scale(scale, scale);
      sceneContext.translate(-width / 2, -height / 2);
      sceneContext.globalAlpha = weight;
      // Blend premultiplied layers without dimming the card shells mid-morph.
      sceneContext.globalCompositeOperation = 'lighter';
      sceneContext.filter = options.reducedMotion ? 'none' : `blur(${(1 - weight) * 3 * ratio}px)`;
      sceneContext.drawImage(layerCanvas, 0, 0, width, height);
      sceneContext.restore();
    });

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
    if (!visible() || !requested || !width || !height) {
      last = 0;
      pause();
      return;
    }
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    if (!options.reducedMotion) offset += dt * SPEED;
    draw(now, dt);
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
    canvas.width = scene.width = layerCanvas.width = Math.round(width * ratio);
    canvas.height = scene.height = layerCanvas.height = Math.round(height * ratio);
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
        requested = layers.find(layer => layer.category === next.category);
        if (!requested) {
          requested = {
            category: next.category,
            deck: categoryPreviews[next.category].map(item => createMedia(item, getPoster(item), wake)),
            weight: layers.length ? 0 : 1,
            velocity: 0
          };
          layers.push(requested);
        }
        requestedAt = performance.now();
        if (!target) target = requested;
      }
      if (next.active && !options.active) Object.values(categoryPreviews).flat().forEach(getPoster);
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
      layers.forEach(layer => layer.deck.forEach(item => item.dispose()));
      posters.forEach(({ image }) => {
        image.onload = null;
        image.onerror = null;
      });
      posters.clear();
      scene.width = layerCanvas.width = 0;
      scene.height = layerCanvas.height = 0;
    }
  };
};
