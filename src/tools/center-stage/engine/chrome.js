import { PHONE_POINTS, PHONE_STATUS } from './phone';

const SCALE = 3;
const BAR = 104;
const GAP = 6;
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

export const CHROME_BAR = BAR / PHONE_POINTS[1];

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

const layer = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  return { canvas, ctx };
};

const centerText = (ctx, text, x, y, font) => {
  ctx.font = font;
  const m = ctx.measureText(text);
  const ascent = m.actualBoundingBoxAscent;
  const descent = m.actualBoundingBoxDescent;
  ctx.fillText(text, x - m.width / 2, y + (ascent - descent) / 2);
  return m.width;
};

function statusGlyphs(ctx, cy) {
  const [width] = PHONE_POINTS;
  centerText(ctx, '9:41', 64, cy, `600 17px ${FONT}`);
  const right = width - 33;
  const batteryW = 25;
  const batteryH = 12;
  const bx = right - batteryW;
  const by = cy - batteryH / 2;
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.lineWidth = 1;
  roundRect(ctx, bx + 0.5, by + 0.5, batteryW - 1, batteryH - 1, 3.6);
  ctx.stroke();
  roundRect(ctx, right + 1.2, cy - 2.1, 1.6, 4.2, 0.8);
  ctx.fill();
  ctx.restore();
  roundRect(ctx, bx + 2, by + 2, batteryW - 4, batteryH - 4, 2.2);
  ctx.fill();
  const wx = bx - 6 - 7.7;
  const base = cy + 5.4;
  const bands = [
    [11, 8.6],
    [7.1, 4.8]
  ];
  bands.forEach(([outer, inner]) => {
    ctx.beginPath();
    ctx.arc(wx, base, outer, Math.PI * 1.25, Math.PI * 1.75);
    ctx.arc(wx, base, inner, Math.PI * 1.75, Math.PI * 1.25, true);
    ctx.closePath();
    ctx.fill();
  });
  ctx.beginPath();
  ctx.moveTo(wx, base);
  ctx.arc(wx, base, 3.2, Math.PI * 1.25, Math.PI * 1.75);
  ctx.closePath();
  ctx.fill();
  const sx = wx - 7.7 - 6 - 17;
  [3.6, 5.8, 8.2, 10.6].forEach((h, i) => {
    roundRect(ctx, sx + i * 4.7, base - h, 3, h, 0.9);
    ctx.fill();
  });
}

function barShapes(ctx, top) {
  const [width] = PHONE_POINTS;
  const size = 48;
  const y = top + BAR - 18 - size;
  const pills = [
    [12, y, size, size],
    [12 + size + 8, y, width - 2 * (12 + size + 8), size],
    [width - 12 - size, y, size, size]
  ];
  return { pills, y, size };
}

function barGlyphs(ctx, top, url) {
  const [width] = PHONE_POINTS;
  const { pills, y, size } = barShapes(ctx, top);
  const cy = y + size / 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(36 + 2.6, cy - 7.6);
  ctx.lineTo(36 - 4.2, cy);
  ctx.lineTo(36 + 2.6, cy + 7.6);
  ctx.stroke();
  [-7, 0, 7].forEach(dx => {
    ctx.beginPath();
    ctx.arc(width - 36 + dx, cy, 2.1, 0, Math.PI * 2);
    ctx.fill();
  });
  const [px, , pw] = pills[1];
  const label = url || 'reactbits.dev';
  ctx.font = `500 16px ${FONT}`;
  let text = label;
  while (ctx.measureText(text).width > pw - 84 && text.length > 4) text = `${text.slice(0, -2)}…`;
  centerText(ctx, text, px + pw / 2, cy, `500 16px ${FONT}`);
  ctx.lineWidth = 1.7;
  const tx = px + 24;
  roundRect(ctx, tx - 6.4, cy - 4.4, 10.6, 10.6, 2.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tx - 3.4, cy - 7.4);
  ctx.lineTo(tx + 4.6, cy - 7.4);
  ctx.arcTo(tx + 7.4, cy - 7.4, tx + 7.4, cy - 4.6, 2.8);
  ctx.lineTo(tx + 7.4, cy + 3.4);
  ctx.stroke();
  const rx = px + pw - 24;
  const ry = cy + 0.4;
  const radius = 6.6;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.arc(rx, ry, radius, -Math.PI * 0.22, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rx - 0.6, ry - radius - 3.6);
  ctx.lineTo(rx + 2.8, ry - radius);
  ctx.lineTo(rx - 0.6, ry - radius + 3.6);
  ctx.stroke();
}

export function drawChrome({ safari, url }) {
  const [width] = PHONE_POINTS;
  const statusH = PHONE_STATUS;
  const W = width * SCALE;
  const statusRows = statusH * SCALE;
  const gapRows = GAP * SCALE;
  const barRows = BAR * SCALE;
  const H = statusRows + gapRows + barRows;
  const glyph = layer(W, H);
  const pill = layer(W, H);
  const rim = layer(W, H);
  const shadow = layer(W, H);
  statusGlyphs(glyph.ctx, 28.8);
  const barTop = statusH + GAP;
  if (safari) {
    barGlyphs(glyph.ctx, barTop, url);
    const { pills } = barShapes(pill.ctx, barTop);
    pills.forEach(([x, y, w, h]) => {
      roundRect(pill.ctx, x, y, w, h, h / 2);
      pill.ctx.fill();
      const gradient = rim.ctx.createLinearGradient(0, y, 0, y + h);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.25)');
      gradient.addColorStop(1, 'rgba(255,255,255,0.6)');
      rim.ctx.strokeStyle = gradient;
      rim.ctx.lineWidth = 1;
      roundRect(rim.ctx, x + 0.5, y + 0.5, w - 1, h - 1, h / 2 - 0.5);
      rim.ctx.stroke();
      shadow.ctx.save();
      shadow.ctx.shadowColor = 'rgba(255,255,255,0.9)';
      shadow.ctx.shadowBlur = 14 * SCALE;
      shadow.ctx.shadowOffsetX = 2000 * SCALE;
      shadow.ctx.shadowOffsetY = 3 * SCALE;
      roundRect(shadow.ctx, x - 2000, y, w, h, h / 2);
      shadow.ctx.fill();
      shadow.ctx.restore();
    });
  }
  const read = item => item.ctx.getImageData(0, 0, W, H).data;
  const g = read(glyph);
  const p = read(pill);
  const r = read(rim);
  const s = read(shadow);
  const data = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i += 1) {
    data[i * 4] = g[i * 4 + 3];
    data[i * 4 + 1] = p[i * 4 + 3];
    data[i * 4 + 2] = r[i * 4 + 3];
    data[i * 4 + 3] = s[i * 4 + 3];
  }
  return {
    data,
    width: W,
    height: H,
    statusV: statusRows / H,
    barV: (statusRows + gapRows) / H
  };
}
