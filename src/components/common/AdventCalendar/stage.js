import { createGiftScene } from './giftScene';
import { createOpening } from './opening';

export const CORNER_DISTANCE = 6.6;

let cached = null;

const pause = stage =>
  new Promise(resolve => {
    if (stage.urgent) resolve();
    else if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolve(), { timeout: 400 });
    else window.setTimeout(resolve, 60);
  });

const release = stage => {
  const { gift, opening, canvas } = stage;
  opening?.dispose();
  if (gift) {
    gift.scene.traverse(object => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      materials.forEach(material => {
        Object.values(material).forEach(value => value?.isTexture && value.dispose());
        material.dispose();
      });
    });
    gift.scene.environment?.dispose();
    const renderer = gift.getRenderer();
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
    }
  }
  canvas?.remove();
};

const build = async stage => {
  await pause(stage);
  if (stage.disposed) return null;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  stage.gift = createGiftScene({ theme: stage.theme, pixelRatio, distance: CORNER_DISTANCE });
  await pause(stage);
  if (stage.disposed) return null;
  stage.canvas = document.createElement('canvas');
  stage.canvas.className = 'adv-stage';
  stage.canvas.setAttribute('aria-hidden', 'true');
  stage.gift.attach(stage.canvas);
  stage.gift.getRenderer().setSize(window.innerWidth, window.innerHeight, false);
  await pause(stage);
  if (stage.disposed) return null;
  stage.opening = createOpening(stage.gift);
  await pause(stage);
  if (stage.disposed) return null;
  await stage.opening.warm().catch(() => {});
  await pause(stage);
  if (stage.disposed) return null;
  stage.gift.render();
  return stage.disposed ? null : stage;
};

export const prepareStage = (theme, { urgent = false } = {}) => {
  if (cached?.theme === theme) {
    if (urgent) cached.urgent = true;
    return cached;
  }
  if (cached) disposeStage(cached);
  const stage = { theme, urgent, disposed: false, gift: null, canvas: null, opening: null };
  stage.ready = build(stage).catch(() => null);
  cached = stage;
  return stage;
};

export const takeStage = theme => {
  if (!cached || cached.theme !== theme || !cached.opening) return null;
  const stage = cached;
  cached = null;
  return stage;
};

export const disposeStage = stage => {
  if (!stage || stage.disposed) return;
  stage.disposed = true;
  if (cached === stage) cached = null;
  release(stage);
};

export { drawTileFace } from './tileFaces';
export { OPEN_END, TIMES } from './opening';
