const NAMES = {
  phone: 'Phone',
  tablet: 'Tablet',
  laptop: 'Laptop',
  monitor: 'Display',
  browser: 'Browser',
  window: 'Window',
  card: 'Card'
};

const VIEWPORTS = {
  '16:10': [2880, 1800],
  '16:9': [2880, 1620],
  '4:3': [2400, 1800],
  '3:2': [2700, 1800],
  '1:1': [2000, 2000],
  '4:5': [1600, 2000],
  '3:4': [1500, 2000],
  '9:16': [1125, 2000],
  '9:19.5': [1206, 2622]
};

export function targetSize(device) {
  switch (device.type) {
    case 'phone':
      return { size: [1206, 2622], hint: 'An iPhone 16 or 17 Pro screenshot fits exactly.' };
    case 'tablet':
      return device.orientation === 'portrait'
        ? { size: [1668, 2420], hint: 'An 11 inch iPad Pro screenshot fits exactly.' }
        : { size: [2420, 1668], hint: 'An 11 inch iPad Pro screenshot fits exactly.' };
    case 'laptop':
      return { size: [3024, 1964], hint: 'A 14 inch MacBook Pro screenshot fits exactly.' };
    case 'monitor':
      return { size: [5120, 2880], hint: 'Any 16:9 capture fits, 2560 × 1440 or larger looks sharp.' };
    default: {
      const viewport = device.viewport && device.viewport !== 'auto' ? VIEWPORTS[device.viewport] : null;
      if (viewport) return { size: viewport, hint: 'Captures at this ratio fit exactly.' };
      return {
        size: [2880, 1800],
        flexible: true,
        hint: 'The frame follows your capture and full-page captures scroll. A 1440 × 900 window at 2× looks sharp.'
      };
    }
  }
}

const ratioOf = size => size[0] / size[1];

const PAGE_NAMES = {
  browser: 'browser frame',
  window: 'window frame',
  card: 'card',
  phone: 'phone screen',
  tablet: 'tablet screen',
  laptop: 'laptop screen',
  monitor: 'display'
};

export function pageSize(device) {
  const { size } = targetSize(device);
  const density = size[0] < size[1] && size[0] <= 1300 ? 3 : 2;
  return {
    size: [Math.round(size[0] / density), Math.round(size[1] / density)],
    density,
    name: PAGE_NAMES[device.type] || 'screen'
  };
}

export const surfaceNames = devices => {
  const totals = new Map();
  devices.forEach(device => {
    const name = NAMES[device.type] || 'Screen';
    totals.set(name, (totals.get(name) || 0) + 1);
  });
  const seen = new Map();
  return devices.map(device => {
    const name = NAMES[device.type] || 'Screen';
    const count = (seen.get(name) || 0) + 1;
    seen.set(name, count);
    return totals.get(name) > 1 ? `${name} ${count}` : name;
  });
};

export function surfaceGuide(doc, device, media) {
  const target = targetSize(device);
  let note = null;
  if (device.blank) note = 'Screen off';
  else if (media && target.size) {
    const have = media.width / media.height;
    const page = device.type === 'browser' || device.type === 'window' ? 1 : 0.62;
    const want = target.flexible ? (have < page ? 1.6 : Math.min(have, 2.6)) : ratioOf(target.size);
    const tall = have < want * 0.96;
    const wide = have > want * 1.04;
    const fit = device.fit || 'cover';
    const scrolling = doc.motion?.kind === 'scroll';
    if (tall && fit === 'cover')
      note =
        have < want * 0.7
          ? scrolling
            ? 'Full page, scrolls with the motion'
            : 'Tall capture, shows the top. Use Scroll to move'
          : 'Trimmed at the bottom';
    else if (wide && fit === 'cover') note = 'Trimmed at the sides';
    else if ((tall || wide) && fit === 'contain') note = 'Letterboxed to fit';
    const long = Math.max(media.width, media.height);
    const needed = Math.max(...target.size) * 0.5;
    if (!note && long < needed) note = 'Low resolution, may look soft';
  }
  return { size: target.size, flexible: Boolean(target.flexible), hint: target.hint, note };
}
