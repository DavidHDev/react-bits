const BLEND_MODES = {
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
  'color-dodge': 'color-dodge',
  'color-burn': 'color-burn',
  'hard-light': 'hard-light',
  'soft-light': 'soft-light',
  difference: 'difference',
  exclusion: 'exclusion',
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity',
  'plus-lighter': 'lighter'
};

export function collectLayers(root) {
  const view = root.ownerDocument.defaultView;
  const bounds = root.getBoundingClientRect();
  const layers = [];

  root.querySelectorAll('canvas, video').forEach(element => {
    const isVideo = element.tagName === 'VIDEO';
    if (isVideo ? !element.videoWidth : !element.width || !element.height) return;
    const rect = element.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    let opacity = 1;
    let blend = 'source-over';
    for (let node = element; node && node !== root.parentElement; node = node.parentElement) {
      const style = view.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      opacity *= Number(style.opacity);
      if (blend === 'source-over' && BLEND_MODES[style.mixBlendMode]) blend = BLEND_MODES[style.mixBlendMode];
    }
    if (opacity <= 0.001) return;

    const style = view.getComputedStyle(element);
    layers.push({
      element,
      x: rect.left - bounds.left,
      y: rect.top - bounds.top,
      width: rect.width,
      height: rect.height,
      opacity,
      blend,
      filter: style.filter && style.filter !== 'none' ? style.filter : 'none'
    });
  });

  return { width: bounds.width, height: bounds.height, layers };
}

export function drawLayers(context, scene, width, height, fill) {
  const scaleX = width / Math.max(scene.width, 1);
  const scaleY = height / Math.max(scene.height, 1);
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  context.filter = 'none';
  context.clearRect(0, 0, width, height);
  if (fill) {
    context.fillStyle = fill;
    context.fillRect(0, 0, width, height);
  }
  scene.layers.forEach(layer => {
    context.globalAlpha = layer.opacity;
    context.globalCompositeOperation = layer.blend;
    context.filter = layer.filter;
    try {
      context.drawImage(layer.element, layer.x * scaleX, layer.y * scaleY, layer.width * scaleX, layer.height * scaleY);
    } catch {
      return;
    }
  });
  context.restore();
}
