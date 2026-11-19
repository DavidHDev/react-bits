const colorsOf = value => value.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || [];

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const drawTileFace = (tile, pixelRatio) => {
  const face = tile.querySelector('.adv-door-face');
  const box = face.getBoundingClientRect();
  const style = getComputedStyle(face);
  const radius = parseFloat(style.borderTopLeftRadius) || 14;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(box.width * pixelRatio));
  canvas.height = Math.max(2, Math.round(box.height * pixelRatio));
  const ctx = canvas.getContext('2d');
  ctx.scale(canvas.width / box.width, canvas.height / box.height);
  const w = box.width;
  const h = box.height;
  roundRect(ctx, 0, 0, w, h, radius);
  ctx.save();
  ctx.clip();
  const stops = colorsOf(style.backgroundImage);
  if (stops.length >= 2) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    stops.forEach((color, i) => g.addColorStop(i / (stops.length - 1), color));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = stops[0] || style.backgroundColor;
  }
  ctx.fillRect(0, 0, w, h);
  const inset = style.boxShadow.match(
    /(rgba?\([^)]+\))\s+0px\s+1px\s+0px\s+0px\s+inset|inset\s+0px\s+1px\s+0px\s+0px\s+(rgba?\([^)]+\))/
  );
  if (inset) {
    ctx.fillStyle = inset[1] || inset[2];
    ctx.fillRect(0, 0, w, 1);
  }
  ctx.restore();
  return canvas;
};
