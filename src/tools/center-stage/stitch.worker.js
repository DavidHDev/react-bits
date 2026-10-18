const PROBE_WIDTH = 192;
const CELL = [24, 6];
const CHUNK = 1024;
const MAX_SIDE = 16384;
const MAX_WIDTH = 2880;
const MAX_SCREENS = 12;
const EXACT_SCREENS = 17;
const MAX_ROWS = 27500;
const STRIPS = [0.15, 0.32, 0.5, 0.68, 0.85];
const STRIP = 64;
const MISMATCH = 26;
const RESET_AFTER = 4;
const UNSURE = 7;
const ANCHOR_STEP = 0.35;
const SCROLLBAR = 14;
const SETTLE_AFTER = 450;
const SAMPLE = 480;
const BLOCK = 6;
const SHADOW_ROWS = 256;
const HEADER = 0.1;
const BAND_LIMIT = 0.35;
const HEADER_LIMIT = 0.25;
const BAND_MARGIN = 0.012;
const OVERLAP = 0.25;
const REACH = 0.18;
const DRIFT = 2;
const NEAR = 3;
const MATCH = 6;
const TEXTURE = 6;
const ALIGN_ROWS = 320;
const NOISE = 2;
const FIXED = 10;
const BIAS = 6;
const KEEP = 1.5;
const DOM_MARGIN = 6;

const luminance = (data, count) => {
  const out = new Uint8Array(count);
  for (let index = 0, offset = 0; index < count; index += 1, offset += 4) {
    out[index] = (data[offset] * 77 + data[offset + 1] * 150 + data[offset + 2] * 29) >> 8;
  }
  return out;
};

const blockDiffs = (a, b, out) => {
  const width = a.length;
  for (let block = 0; block < out.length; block += 1) {
    const start = block * BLOCK;
    const end = Math.min(width, start + BLOCK);
    let sum = 0;
    for (let x = start; x < end; x += 1) sum += Math.abs(a[x] - b[x]);
    out[block] = Math.max(0, sum / (end - start) - NOISE);
  }
  return out;
};

class Shadow {
  constructor(width) {
    this.width = width;
    this.chunks = new Map();
  }

  row(y) {
    const index = Math.floor(y / SHADOW_ROWS);
    const chunk = this.chunks.get(index);
    if (!chunk) return null;
    const start = (y - index * SHADOW_ROWS) * this.width;
    return chunk.subarray(start, start + this.width);
  }

  write(luma, from, rows, at) {
    const width = this.width;
    for (let row = 0; row < rows; row += 1) {
      const y = at + row;
      const index = Math.floor(y / SHADOW_ROWS);
      let chunk = this.chunks.get(index);
      if (!chunk) {
        chunk = new Uint8Array(width * SHADOW_ROWS);
        this.chunks.set(index, chunk);
      }
      const source = (from + row) * width;
      chunk.set(luma.subarray(source, source + width), (y - index * SHADOW_ROWS) * width);
    }
  }
}

class Stitcher {
  constructor(width, height, scale) {
    this.width = width;
    this.height = height;
    this.pageScale = scale || 2;
    this.scale = Math.min(1, MAX_WIDTH / width);
    this.outWidth = Math.round(width * this.scale);
    const probeHeight = Math.max(24, Math.round((height * PROBE_WIDTH) / width));
    this.probe = new OffscreenCanvas(PROBE_WIDTH, probeHeight);
    this.probeContext = this.probe.getContext('2d', { willReadFrequently: true });
    this.strip = new OffscreenCanvas(STRIP, height);
    this.stripContext = this.strip.getContext('2d', { willReadFrequently: true });
    this.ratio = height / probeHeight;
    this.sampleWidth = Math.min(SAMPLE, width);
    this.blocks = Math.ceil(this.sampleWidth / BLOCK);
    this.sample = new OffscreenCanvas(this.sampleWidth, height);
    this.sampleContext = this.sample.getContext('2d');
    this.sampleContext.imageSmoothingQuality = 'medium';
    this.slot = new OffscreenCanvas(width, height);
    this.slotContext = this.slot.getContext('2d');
    this.candidate = null;
    this.reset();
  }

  reset() {
    this.candidate = null;
    this.chunks = new Map();
    this.shadow = new Shadow(this.sampleWidth);
    this.top = Infinity;
    this.bottom = -Infinity;
    this.first = null;
    this.last = null;
    this.header = 0;
    this.footer = 0;
    this.headers = [];
    this.before = null;
    this.beforeOffset = 0;
    this.anchor = null;
    this.previous = null;
    this.misses = 0;
    this.wheelBase = null;
    this.bias = 0;
    this.stuck = 0;
    this.edge = 0;
    this.trim = 0;
    this.exact = false;
    this.started = false;
    this.movedAt = 0;
    this.settled = null;
  }

  probeOf(frame) {
    const { probe, probeContext } = this;
    probeContext.drawImage(frame, 0, 0, probe.width, probe.height);
    return luminance(probeContext.getImageData(0, 0, probe.width, probe.height).data, probe.width * probe.height);
  }

  stripsOf(frame) {
    return STRIPS.map(at => {
      const x = Math.max(0, Math.min(this.width - STRIP, Math.round(at * this.width - STRIP / 2)));
      this.stripContext.drawImage(frame, x, 0, STRIP, this.height, 0, 0, STRIP, this.height);
      const data = luminance(this.stripContext.getImageData(0, 0, STRIP, this.height).data, STRIP * this.height);
      let detail = 0;
      for (let y = 0; y < this.height - 1; y += 2) {
        const row = y * STRIP;
        for (let column = 0; column < STRIP; column += 4)
          detail += Math.abs(data[row + column] - data[row + STRIP + column]);
      }
      return { data, detail: detail / ((this.height / 2) * (STRIP / 4)) };
    });
  }

  lumaOf(frame) {
    const { sample, sampleContext } = this;
    sampleContext.drawImage(frame, 0, 0, this.width - this.trim, this.height, 0, 0, sample.width, sample.height);
    return luminance(sampleContext.getImageData(0, 0, sample.width, sample.height).data, sample.width * sample.height);
  }

  rowOf(luma, row) {
    return luma.subarray(row * this.sampleWidth, (row + 1) * this.sampleWidth);
  }

  coarse(previous, current, predicted, range) {
    const width = this.probe.width;
    const height = this.probe.height;
    const [cellWidth, cellHeight] = CELL;
    const cells = [];
    for (let y = 0; y + cellHeight <= height; y += cellHeight) {
      for (let x = 0; x + cellWidth <= width; x += cellWidth) {
        let sum = 0;
        let square = 0;
        for (let row = 0; row < cellHeight; row += 1) {
          for (let column = 0; column < cellWidth; column += 1) {
            const value = current[(y + row) * width + x + column];
            sum += value;
            square += value * value;
          }
        }
        const count = cellWidth * cellHeight;
        const mean = sum / count;
        if (square / count - mean * mean > 16) cells.push([x, y]);
      }
    }
    if (cells.length < 4) return null;
    const limit = Math.floor(height * 0.85);
    const from = Math.max(-limit, range ? Math.floor(range[0]) : -limit);
    const to = Math.min(limit, range ? Math.ceil(range[1]) : limit);
    let best = null;
    for (let shift = from; shift <= to; shift += 1) {
      const diffs = [];
      for (const [x, y] of cells) {
        if (y + shift < 0 || y + shift + cellHeight > height) continue;
        let diff = 0;
        for (let row = 0; row < cellHeight; row += 1) {
          const a = (y + row) * width + x;
          const b = (y + shift + row) * width + x;
          for (let column = 0; column < cellWidth; column += 1)
            diff += Math.abs(current[a + column] - previous[b + column]);
        }
        diffs.push(diff / (cellWidth * cellHeight));
      }
      if (diffs.length < Math.max(4, cells.length * 0.25)) continue;
      diffs.sort((a, b) => a - b);
      const keep = Math.max(3, Math.floor(diffs.length * 0.5));
      let score = 0;
      for (let index = 0; index < keep; index += 1) score += diffs[index];
      score = score / keep + (Math.abs(shift - predicted) / height) * (range ? 1 : 4);
      if (!best || score < best.score) best = { shift, score };
    }
    return best;
  }

  refine(previous, current, coarse, range) {
    const center = Math.round(coarse * this.ratio);
    const textured = current.map((strip, index) => (strip.detail > 1.5 ? index : -1)).filter(index => index >= 0);
    if (!textured.length) return { shift: center, exact: center, score: 0 };
    const span = Math.ceil(this.ratio * 2) + 4;
    const low = range ? Math.max(center - span, Math.floor(range[0])) : center - span;
    const high = range ? Math.min(center + span, Math.ceil(range[1])) : center + span;
    const rows = new Float32Array(Math.ceil(this.height / 2));
    const scores = new Map();
    const scoreAt = shift => {
      if (scores.has(shift)) return scores.get(shift);
      let total = 0;
      let used = 0;
      for (const index of textured) {
        const a = current[index].data;
        const b = previous[index].data;
        const start = Math.max(0, -shift);
        const end = Math.min(this.height, this.height - shift);
        if (end - start < this.height * 0.15) continue;
        let count = 0;
        for (let y = start; y < end; y += 2) {
          const rowA = y * STRIP;
          const rowB = (y + shift) * STRIP;
          let diff = 0;
          for (let x = 0; x < STRIP; x += 2) diff += Math.abs(a[rowA + x] - b[rowB + x]);
          rows[count] = diff / (STRIP / 2);
          count += 1;
        }
        if (!count) continue;
        const sorted = rows.subarray(0, count).sort();
        const keep = Math.max(1, Math.floor(count * 0.7));
        let sum = 0;
        for (let index = 0; index < keep; index += 1) sum += sorted[index];
        total += sum / keep;
        used += 1;
      }
      const score = used ? total / used : Infinity;
      scores.set(shift, score);
      return score;
    };
    let best = null;
    for (let shift = low; shift <= high; shift += 1) {
      const score = scoreAt(shift);
      if (!best || score < best.score) best = { shift, score };
    }
    if (!best || !Number.isFinite(best.score)) return { shift: center, exact: center, score: 0 };
    const before = scoreAt(best.shift - 1);
    const after = scoreAt(best.shift + 1);
    const curve = before - 2 * best.score + after;
    const nudge =
      Number.isFinite(before) && Number.isFinite(after) && curve > 1e-6
        ? Math.max(-0.5, Math.min(0.5, (before - after) / (2 * curve)))
        : 0;
    return { shift: best.shift, exact: best.shift + nudge, score: best.score };
  }

  draw(frame, from, rows, at) {
    if (rows <= 0) return;
    const start = Math.round(at * this.scale);
    const end = Math.round((at + rows) * this.scale);
    this.top = Math.min(this.top, at);
    this.bottom = Math.max(this.bottom, at + rows);
    if (end <= start) return;
    const ratio = rows / (end - start);
    const first = Math.floor(start / CHUNK);
    const last = Math.floor((end - 1) / CHUNK);
    for (let index = first; index <= last; index += 1) {
      let chunk = this.chunks.get(index);
      if (!chunk) {
        chunk = new OffscreenCanvas(this.outWidth, CHUNK);
        this.chunks.set(index, chunk);
      }
      const context = chunk.getContext('2d');
      const lo = Math.max(start, index * CHUNK);
      const hi = Math.min(end, (index + 1) * CHUNK);
      const sourceY = from + (lo - start) * ratio;
      const sourceRows = (hi - lo) * ratio;
      context.drawImage(frame, 0, sourceY, this.width, sourceRows, 0, lo - index * CHUNK, this.outWidth, hi - lo);
      if (this.edge > 0) {
        const x = this.outWidth - this.edge;
        context.drawImage(chunk, x - 1, lo - index * CHUNK, 1, hi - lo, x, lo - index * CHUNK, this.edge, hi - lo);
      }
    }
  }

  bands(hint) {
    const margin = DOM_MARGIN * this.pageScale;
    const limit = Math.round(this.height * BAND_LIMIT);
    this.header = hint.top > 0 ? Math.min(limit, Math.round(hint.top + margin)) : 0;
    this.footer = hint.bottom > 0 ? Math.min(limit, Math.round(hint.bottom + margin)) : 0;
  }

  region(offset) {
    const topmost = this.first === null || offset <= this.first;
    const bottommost = this.last === null || offset >= this.last;
    return {
      top: offset + (topmost ? 0 : this.header),
      bottom: offset + this.height - (bottommost ? 0 : this.footer),
      topmost,
      bottommost
    };
  }

  detectHeader(luma, offset) {
    const before = this.before;
    if (!before) return;
    const delta = Math.round(offset - this.beforeOffset);
    const height = this.height;
    if (Math.abs(delta) < 16 || Math.abs(delta) > height * 0.7) return;
    const limit = Math.round(height * HEADER_LIMIT);
    const same = new Float32Array(this.blocks);
    const moved = new Float32Array(this.blocks);
    let last = -1;
    let run = 0;
    for (let y = 0; y < limit; y += 1) {
      const shifted = y + delta;
      if (shifted < 0 || shifted >= height) continue;
      const current = this.rowOf(luma, y);
      blockDiffs(this.rowOf(before, y), current, same);
      blockDiffs(this.rowOf(before, shifted), current, moved);
      let fixed = 0;
      let scrolled = 0;
      for (let block = 0; block < this.blocks; block += 1) {
        if (same[block] === 0 && moved[block] > FIXED) fixed += 1;
        else if (moved[block] === 0 && same[block] > FIXED) scrolled += 1;
      }
      if (fixed >= 3 && fixed >= (fixed + scrolled) * 0.6) {
        last = y;
        run = 0;
      } else if (scrolled >= 3 && scrolled > fixed * 2) {
        run += 1;
        if (run >= 6) break;
      }
    }
    if (last < 0) return;
    this.headers.push(Math.min(limit, last + 1 + Math.round(height * BAND_MARGIN)));
    if (this.headers.length > 7) this.headers.shift();
    if (this.headers.length < 3) return;
    const sorted = [...this.headers].sort((a, b) => a - b);
    this.header = Math.max(Math.round(height * HEADER), sorted[Math.floor(sorted.length / 2)]);
  }

  align(luma, base, from, to) {
    if (to - from < 24) return 0;
    const height = this.height;
    const width = this.sampleWidth;
    const reach = Math.round(height * REACH);
    const step = Math.max(1, Math.floor((to - from) / ALIGN_ROWS));
    const rows = [];
    for (let y = from; y < to; y += step) {
      const row = y - base;
      if (row < 2 || row >= height) continue;
      const current = this.rowOf(luma, row);
      const above = this.rowOf(luma, row - 2);
      const blocks = [];
      for (let block = 0; block < this.blocks; block += 1) {
        const start = block * BLOCK;
        const end = Math.min(width, start + BLOCK);
        let sum = 0;
        for (let x = start; x < end; x += 1) sum += Math.abs(current[x] - above[x]);
        if (sum / (end - start) > TEXTURE) blocks.push(block);
      }
      if (blocks.length >= 2) rows.push({ row, blocks });
    }
    if (rows.length < 8) return 0;
    const score = (shift, stride) => {
      let matched = 0;
      let seen = 0;
      for (const { row, blocks } of rows) {
        const target = this.shadow.row(base + shift + row);
        if (!target) continue;
        const current = this.rowOf(luma, row);
        let sum = 0;
        let count = 0;
        for (const block of blocks) {
          const start = block * BLOCK;
          const end = Math.min(width, start + BLOCK);
          for (let x = start; x < end; x += stride) {
            sum += Math.abs(current[x] - target[x]);
            count += 1;
          }
        }
        seen += 1;
        if (sum / count <= MATCH) matched += 1;
      }
      return seen < rows.length * 0.5 ? -1 : matched - (Math.abs(shift) / reach) * DRIFT;
    };
    const search = (from, to, step, stride) => {
      let best = { shift: 0, value: -Infinity };
      for (let shift = from; shift <= to; shift += step) {
        const value = score(shift, stride);
        if (value > best.value) best = { shift, value };
      }
      return best;
    };
    const still = score(0, 1);
    const near = search(-NEAR, NEAR, 1, 1);
    const coarse = search(-reach, reach, 2, 2);
    const far = search(coarse.shift - NEAR, coarse.shift + NEAR, 1, 1);
    if (far.value > near.value * 1.15 + 2) return far.shift;
    return near.value > still + 1 ? near.shift : 0;
  }

  differences(luma, base, from, to) {
    const blocks = this.blocks;
    const out = new Float32Array((to - from) * blocks);
    for (let y = from; y < to; y += 1) {
      const target = this.shadow.row(y);
      if (!target) continue;
      blockDiffs(this.rowOf(luma, y - base), target, out.subarray((y - from) * blocks, (y - from + 1) * blocks));
    }
    return out;
  }

  tear(diffs, from, to, row) {
    const blocks = this.blocks;
    const above = (Math.min(to - 1, Math.max(from, row - 1)) - from) * blocks;
    const below = (Math.min(to - 1, Math.max(from, row)) - from) * blocks;
    let sum = 0;
    for (let block = 0; block < blocks; block += 1) sum += Math.min(diffs[above + block], diffs[below + block]);
    return sum;
  }

  topSeam(diffs, from, to, limit) {
    const span = Math.max(1, to - from);
    const last = limit !== null && limit >= from ? Math.min(to, limit) : to;
    let row = from;
    let cost = Infinity;
    for (let at = from; at <= last; at += 1) {
      const value = this.tear(diffs, from, to, at) + (BIAS * (at - from)) / span;
      if (value < cost) {
        cost = value;
        row = at;
      }
    }
    return { row, cost };
  }

  bottomSeam(diffs, from, to, start, limit) {
    const low = Math.max(from, start);
    const first = limit !== null && limit <= to ? Math.max(low, limit) : low;
    const span = Math.max(1, to - low);
    let row = to;
    let cost = Infinity;
    for (let at = to; at >= first; at -= 1) {
      const value = this.tear(diffs, from, to, at) + (BIAS * (to - at)) / span;
      if (value < cost) {
        cost = value;
        row = at;
      }
    }
    return { row, cost: Number.isFinite(cost) ? cost : 0 };
  }

  evaluate(luma, base) {
    const region = this.region(base);
    const plan = { region, start: region.top, end: region.bottom, cost: 0 };
    if (!Number.isFinite(this.top)) return plan;
    const from = Math.max(region.top, this.top);
    const to = Math.min(region.bottom, this.bottom);
    if (to <= from) {
      if (region.top >= this.bottom) plan.start = Math.max(base, this.bottom);
      else plan.end = Math.min(base + this.height, this.top);
      plan.cost = Infinity;
      return plan;
    }
    const diffs = this.differences(luma, base, from, to);
    const fringe = region.bottommost && base > this.last && this.footer ? this.last + this.height - this.footer : null;
    const band = region.topmost && base < this.first && this.header ? this.first + this.header : null;
    if (region.top >= this.top) {
      const seam = this.topSeam(diffs, from, to, fringe);
      plan.start = seam.row;
      plan.cost += seam.cost;
    }
    if (region.bottom <= this.bottom) {
      const seam = this.bottomSeam(diffs, from, to, plan.start, band);
      plan.end = seam.row;
      plan.cost += seam.cost;
    }
    return plan;
  }

  commit(source, offset, sampled = null) {
    const height = this.height;
    const luma = sampled || this.lumaOf(source);
    let base = Math.round(offset);
    if (!this.exact) this.detectHeader(luma, base);
    if (Number.isFinite(this.top) && !this.exact) {
      const region = this.region(base);
      const shift = this.align(luma, base, Math.max(region.top, this.top), Math.min(region.bottom, this.bottom));
      if (shift) {
        base += shift;
        this.shiftTracking(shift);
      }
    }
    const plan = this.evaluate(luma, base);
    const start = Math.max(plan.start, base);
    const end = Math.min(plan.end, base + height);
    if (end > start) {
      this.draw(source, start - base, end - start, start);
      this.shadow.write(luma, start - base, end - start, start);
    }
    if (plan.region.topmost) this.first = this.first === null ? base : Math.min(this.first, base);
    if (plan.region.bottommost) this.last = this.last === null ? base : Math.max(this.last, base);
    this.before = luma;
    this.beforeOffset = base;
  }

  need() {
    return Math.round(this.height * OVERLAP + Math.max(this.header, this.footer));
  }

  inside(region) {
    return region.top >= this.top && region.bottom <= this.bottom;
  }

  overlap(region) {
    return Math.min(region.bottom, this.bottom) - Math.max(region.top, this.top);
  }

  consider(frame) {
    const held = this.candidate;
    if (held) {
      const region = this.region(Math.round(this.previous.offset));
      const down = held.region.bottom > this.bottom && region.bottom < held.region.bottom;
      const up = held.region.top < this.top && region.top > held.region.top;
      if (down || up) this.flush();
    }
    let region = this.region(Math.round(this.previous.offset));
    if (this.inside(region)) {
      frame.close();
      return;
    }
    const need = this.need();
    if (this.overlap(region) < need && this.candidate) {
      this.flush();
      region = this.region(Math.round(this.previous.offset));
      if (this.inside(region)) {
        frame.close();
        return;
      }
    }
    const base = Math.round(this.previous.offset);
    if (this.overlap(region) < need) {
      this.commit(frame, base);
      frame.close();
      return;
    }
    const luma = this.lumaOf(frame);
    const plan = this.evaluate(luma, base);
    const kept = this.candidate;
    if (!kept || plan.cost <= kept.cost * KEEP + BIAS * 2) {
      this.slotContext.drawImage(frame, 0, 0);
      this.candidate = { offset: base, region: plan.region, luma, cost: plan.cost };
    }
    frame.close();
  }

  flush() {
    const candidate = this.candidate;
    if (!candidate) return;
    this.candidate = null;
    this.commit(this.slot, candidate.offset, candidate.luma);
  }

  settle(frame) {
    this.flush();
    this.commit(frame, this.previous.offset);
    this.settled = Math.round(this.previous.offset);
  }

  overflows(offset) {
    if (!Number.isFinite(this.top)) return false;
    const base = Math.round(offset);
    const limit = Math.min(this.height * (this.exact ? EXACT_SCREENS : MAX_SCREENS), MAX_ROWS);
    return Math.max(this.bottom, base + this.height) - Math.min(this.top, base) > limit;
  }

  shiftTracking(shift) {
    if (this.anchor) this.anchor.offset += shift;
    if (this.previous) this.previous.offset += shift;
    this.bias += shift;
  }

  guide(previous, wheel) {
    if (wheel === null || wheel === undefined) return null;
    if (this.wheelBase === null) this.wheelBase = wheel - previous.offset / this.pageScale;
    const target = (wheel - this.wheelBase) * this.pageScale + this.bias;
    const low = Math.min(previous.offset, target);
    const high = Math.max(previous.offset, target);
    const margin = this.height * 0.06 + (high - low) * 0.12;
    return { target, range: [low - margin, high + margin] };
  }

  rebase(previous, wheel, offset) {
    if (wheel === null || wheel === undefined || this.wheelBase === null) return;
    const target = (wheel - this.wheelBase) * this.pageScale + this.bias;
    if (Math.abs(offset - previous.offset) < 0.5 && Math.abs(target - offset) > this.height * 0.02) {
      this.stuck += 1;
      if (this.stuck > 6) {
        this.bias += offset - target;
        this.stuck = 0;
      }
    } else this.stuck = 0;
  }

  track(probe, strips, offset) {
    const previous = this.previous;
    this.movedAt = performance.now();
    this.settled = null;
    this.previous = { offset, velocity: offset - previous.offset };
    if (Math.abs(offset - this.anchor.offset) > this.height * ANCHOR_STEP) this.anchor = { probe, strips, offset };
  }

  begin(frame, offset, exact, probe, strips, total) {
    this.started = true;
    this.exact = exact;
    if (total > 0) {
      this.scale = Math.min(1, MAX_WIDTH / this.width, MAX_SIDE / total);
      this.outWidth = Math.round(this.width * this.scale);
    }
    this.edge = exact ? 0 : Math.round(SCROLLBAR * this.pageScale * this.scale);
    this.trim = exact ? 0 : Math.min(this.width - 1, Math.round(SCROLLBAR * this.pageScale));
    if (!exact) {
      this.header = Math.round(this.height * HEADER);
      this.footer = 0;
      this.anchor = { probe: probe || this.probeOf(frame), strips: strips || this.stripsOf(frame), offset };
    }
    this.previous = { offset, velocity: 0 };
    this.movedAt = performance.now();
    this.commit(frame, offset);
  }

  push(frame, hint = {}) {
    const exact = typeof hint.offset === 'number';
    if (exact) this.bands(hint);
    if (!this.started) {
      const offset = exact ? hint.offset : 0;
      this.begin(frame, offset, exact, null, null, hint.total);
      frame.close();
      return { result: 'start', offset };
    }
    if (exact) {
      if (this.overflows(hint.offset)) {
        frame.close();
        return { result: 'full', offset: hint.offset };
      }
      this.previous = { offset: hint.offset, velocity: 0 };
      this.commit(frame, hint.offset);
      frame.close();
      return { result: 'moved', offset: hint.offset };
    }
    const previous = this.previous;
    const probe = this.probeOf(frame);
    const strips = this.stripsOf(frame);
    const anchor = this.anchor;
    const guide = this.guide(previous, hint.wheel);
    const toAnchor = value => (value - anchor.offset) / this.ratio;
    const predicted = toAnchor(guide ? guide.target : previous.offset + previous.velocity);
    const coarse = this.coarse(
      anchor.probe,
      probe,
      predicted,
      guide ? [toAnchor(guide.range[0]) - 1, toAnchor(guide.range[1]) + 1] : null
    );
    if (!coarse) {
      frame.close();
      return { result: 'flat', offset: previous.offset };
    }
    if (coarse.score > MISMATCH) {
      this.misses += 1;
      if (this.misses < RESET_AFTER || guide) {
        frame.close();
        return { result: 'unsure', offset: previous.offset };
      }
      this.reset();
      this.begin(frame, 0, false, probe, strips);
      frame.close();
      return { result: 'reset', offset: 0 };
    }
    this.misses = 0;
    const fine = this.refine(
      anchor.strips,
      strips,
      coarse.shift,
      guide ? [guide.range[0] - anchor.offset, guide.range[1] - anchor.offset] : null
    );
    if (fine.score > UNSURE) {
      frame.close();
      return { result: 'unsure', offset: previous.offset };
    }
    const offset = anchor.offset + fine.exact;
    this.rebase(previous, hint.wheel, offset);
    if (Math.abs(offset - previous.offset) < 0.25) {
      const quiet = performance.now() - this.movedAt >= SETTLE_AFTER;
      const position = Math.round(previous.offset);
      if ((hint.last || (hint.settle && quiet)) && this.settled !== position) this.settle(frame);
      else if (hint.last) this.flush();
      frame.close();
      return { result: 'still', offset };
    }
    if (this.overflows(offset)) {
      frame.close();
      return { result: 'full', offset };
    }
    this.track(probe, strips, offset);
    this.consider(frame);
    if (hint.last) this.flush();
    return { result: 'moved', offset };
  }

  finish() {
    if (!this.started) return null;
    this.flush();
    if (!Number.isFinite(this.top)) return null;
    const total = this.bottom - this.top;
    const origin = Math.round(this.top * this.scale);
    const span = Math.max(1, Math.round(this.bottom * this.scale) - origin);
    const fit = Math.min(1, MAX_SIDE / span, MAX_SIDE / this.outWidth);
    const width = Math.max(1, Math.round(this.outWidth * fit));
    const height = Math.max(1, Math.round(span * fit));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    context.imageSmoothingQuality = 'high';
    for (const [index, chunk] of this.chunks) {
      const top = Math.round((index * CHUNK - origin) * fit);
      const bottom = Math.round(((index + 1) * CHUNK - origin) * fit);
      if (bottom <= 0 || top >= height || bottom <= top) continue;
      context.drawImage(chunk, 0, 0, this.outWidth, CHUNK, 0, top, width, bottom - top);
    }
    const screens = total / this.height;
    this.reset();
    return { bitmap: canvas.transferToImageBitmap(), screens };
  }

  screens() {
    return Number.isFinite(this.top) ? (this.bottom - this.top) / this.height : 0;
  }
}

let stitcher = null;
let pageScale = 2;

const sameShape = (frame, target) =>
  Math.abs(frame.displayWidth / frame.displayHeight - target.width / target.height) < 0.01;

self.onmessage = async ({ data }) => {
  if (data.type === 'scale') {
    pageScale = data.scale || 2;
  } else if (data.type === 'frame') {
    let frame = data.frame;
    try {
      const resized = stitcher && (stitcher.width !== frame.displayWidth || stitcher.height !== frame.displayHeight);
      if (resized && stitcher.started && sameShape(frame, stitcher)) {
        const source = frame;
        frame = await createImageBitmap(source, {
          resizeWidth: stitcher.width,
          resizeHeight: stitcher.height,
          resizeQuality: 'high'
        });
        source.close();
      } else if (!stitcher || resized) {
        stitcher?.reset();
        stitcher = new Stitcher(frame.displayWidth, frame.displayHeight, pageScale);
      }
      const hint = {};
      const scale = stitcher.pageScale;
      if (typeof data.offset === 'number') {
        hint.offset = data.offset * scale;
        hint.top = (data.top || 0) * scale;
        hint.bottom = (data.bottom || 0) * scale;
        hint.total = (data.total || 0) * scale;
      }
      if (typeof data.wheel === 'number') hint.wheel = data.wheel;
      if (data.settle) hint.settle = true;
      if (data.last) hint.last = true;
      const outcome = stitcher.push(frame, hint);
      self.postMessage({
        type: 'progress',
        result: outcome.result,
        position: outcome.offset / stitcher.height,
        screens: stitcher.screens()
      });
    } catch (problem) {
      frame.close();
      self.postMessage({
        type: 'progress',
        result: 'error',
        message: problem?.message,
        screens: stitcher?.screens() || 0
      });
    }
  } else if (data.type === 'finish') {
    try {
      const page = stitcher?.finish();
      if (!page) self.postMessage({ type: 'done', bitmap: null, screens: 0 });
      else self.postMessage({ type: 'done', bitmap: page.bitmap, screens: page.screens }, [page.bitmap]);
    } catch (problem) {
      self.postMessage({ type: 'error', message: problem?.message || 'The page could not be stitched.' });
    }
  } else if (data.type === 'cancel') {
    stitcher?.reset();
    stitcher = null;
  }
};
