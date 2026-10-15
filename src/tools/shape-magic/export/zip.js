const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = bytes => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const toBytes = async data => {
  if (data instanceof Uint8Array) return data;
  if (typeof data === 'string') return new TextEncoder().encode(data);
  return new Uint8Array(await data.arrayBuffer());
};

const dosStamp = (date = new Date()) => ({
  time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
  day: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
});

export async function zipFiles(files) {
  const encoder = new TextEncoder();
  const stamp = dosStamp();
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = await toBytes(file.data);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, stamp.time, true);
    local.setUint16(12, stamp.day, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(local.buffer), name, data);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(12, stamp.time, true);
    entry.setUint16(14, stamp.day, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

export async function icoFromPngs(pngs) {
  const images = await Promise.all(
    pngs.map(async ({ size, blob }) => ({ size, bytes: new Uint8Array(await blob.arrayBuffer()) }))
  );
  const header = new DataView(new ArrayBuffer(6 + images.length * 16));
  header.setUint16(2, 1, true);
  header.setUint16(4, images.length, true);
  let offset = 6 + images.length * 16;
  images.forEach((image, index) => {
    const base = 6 + index * 16;
    header.setUint8(base, image.size >= 256 ? 0 : image.size);
    header.setUint8(base + 1, image.size >= 256 ? 0 : image.size);
    header.setUint16(base + 4, 1, true);
    header.setUint16(base + 6, 32, true);
    header.setUint32(base + 8, image.bytes.length, true);
    header.setUint32(base + 12, offset, true);
    offset += image.bytes.length;
  });
  return new Blob([new Uint8Array(header.buffer), ...images.map(image => image.bytes)], { type: 'image/x-icon' });
}
