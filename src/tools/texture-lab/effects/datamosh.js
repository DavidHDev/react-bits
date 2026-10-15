const SEED = `
uniform float uLod;
void main() {
  outColor = vec4(textureLod(uInput, vUv, uLod).rgb, 0.0);
}`;

const LUMA_PASS = `
uniform float uLod;
void main() {
  outColor = vec4(luma(textureLod(uInput, vUv, uLod).rgb), 0.0, 0.0, 1.0);
}`;

const MATCH = `
uniform sampler2D uPrevious;

float block[64];
float coarse[16];

float fineCost(ivec2 origin, ivec2 offset, ivec2 limit) {
  float sum = 0.0;
  for (int i = 0; i < 64; i++) {
    ivec2 p = clamp(origin + ivec2(i % 8, i / 8) + offset, ivec2(0), limit);
    sum += abs(block[i] - texelFetch(uPrevious, p, 0).r);
  }
  return sum / 64.0 + 0.0015 * length(vec2(offset));
}

float coarseCost(vec2 origin, vec2 offset, vec2 size) {
  float sum = 0.0;
  for (int i = 0; i < 16; i++) {
    vec2 p = origin + vec2(float(i % 4), float(i / 4)) * 2.0 + 1.0 + offset;
    sum += abs(coarse[i] - texture(uPrevious, p / size).r);
  }
  return sum / 16.0 + 0.0015 * length(offset);
}

void main() {
  ivec2 isize = textureSize(uInput, 0);
  vec2 size = vec2(isize);
  ivec2 limit = isize - 1;
  ivec2 origin = ivec2(floor(gl_FragCoord.xy)) * 8;
  vec2 o = vec2(origin);
  for (int i = 0; i < 64; i++) {
    block[i] = texelFetch(uInput, clamp(origin + ivec2(i % 8, i / 8), ivec2(0), limit), 0).r;
  }
  for (int i = 0; i < 16; i++) {
    coarse[i] = texture(uInput, (o + vec2(float(i % 4), float(i / 4)) * 2.0 + 1.0) / size).r;
  }

  vec2 guess = vec2(0.0);
  float bestCoarse = coarseCost(o, guess, size);
  for (int y = -3; y <= 3; y++) {
    for (int x = -3; x <= 3; x++) {
      vec2 d = vec2(float(x), float(y)) * 2.0;
      float c = coarseCost(o, d, size);
      if (c < bestCoarse) {
        bestCoarse = c;
        guess = d;
      }
    }
  }

  ivec2 center = ivec2(guess);
  ivec2 found = center;
  float best = 1e9;
  for (int i = 0; i < 9; i++) {
    ivec2 d = center + ivec2(i % 3 - 1, i / 3 - 1);
    float c = fineCost(origin, d, limit);
    if (c < best) {
      best = c;
      found = d;
    }
  }
  float still = fineCost(origin, ivec2(0), limit);
  if (best >= still - 0.002) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float l = fineCost(origin, found - ivec2(1, 0), limit);
  float r = fineCost(origin, found + ivec2(1, 0), limit);
  float d = fineCost(origin, found - ivec2(0, 1), limit);
  float u = fineCost(origin, found + ivec2(0, 1), limit);
  vec2 offset = vec2(found);
  offset.x += clamp((l - r) / max(2.0 * (l - 2.0 * best + r), 1e-5), -0.5, 0.5);
  offset.y += clamp((d - u) / max(2.0 * (d - 2.0 * best + u), 1e-5), -0.5, 0.5);
  float trust = smoothstep(0.002, 0.01, still - best);
  outColor = vec4(offset * trust / size, trust, 1.0);
}`;

const STEP = `
uniform sampler2D uLive;
uniform sampler2D uMotion;
uniform float uSimTime;
uniform float uSimDt;
uniform float uSeed;
uniform float uIntensity;
uniform float uBlock;
uniform float uDrift;
uniform float uChurn;
uniform float uFollow;
uniform vec2 uLumaSize;
uniform float uLod;
uniform float uQuant;
uniform float uDecay;

float moshHash(float p) {
  uint u = floatBitsToUint(p * 3141592653.0);
  return float(u * u * 3141592653u) / 4294967295.0;
}

vec2 blockMotion(vec2 low, vec2 high) {
  ivec2 cells = textureSize(uMotion, 0);
  ivec2 first = clamp(ivec2(floor(low * uLumaSize / 8.0)), ivec2(0), cells - 1);
  ivec2 last = clamp(ivec2(floor(high * uLumaSize / 8.0 - 0.001)), ivec2(0), cells - 1);
  vec3 sum = vec3(0.0);
  for (int y = 0; y < 8; y++) {
    if (first.y + y > last.y) break;
    for (int x = 0; x < 8; x++) {
      if (first.x + x > last.x) break;
      sum += texelFetch(uMotion, first + ivec2(x, y), 0).xyz;
    }
  }
  return sum.z > 0.001 ? sum.xy / sum.z : vec2(0.0);
}

void main() {
  vec2 pos = vUv * uResolution / uUnit;
  float churnRate = 0.15 + uChurn * 0.8;
  float fine = max(uBlock, 8.0 / uUnit);
  float coarse = fine * 2.6;
  vec2 cb = floor(pos / coarse);
  float cPhase = moshHash(cb.x * 91.17 + cb.y * 41.23 + uSeed * 3.7);
  float cEpoch = floor(uSimTime * churnRate * 0.25 + cPhase);
  float pick = moshHash(cb.x * 12.9898 + cb.y * 78.233 + cEpoch * 37.71 + uSeed * 3.7);
  float bs = pick < 0.35 ? coarse : fine;
  vec2 b = floor(pos / bs);

  float bPhase = moshHash(b.x * 127.1 + b.y * 311.7 + uSeed * 17.9);
  float bRate = churnRate * (0.7 + 0.6 * moshHash(b.x * 53.7 + b.y * 97.3 + uSeed * 5.3));
  float bEpoch = floor(uSimTime * bRate + bPhase);
  float bh = b.x * 127.1 + b.y * 311.7 + bEpoch * 74.7 + uSeed * 17.9;
  float h1 = moshHash(bh + 0.13);
  float h2 = moshHash(bh + 7.77);
  float h3 = moshHash(bh + 23.19);

  vec2 toUv = uUnit / uResolution;
  vec2 bc = (b + 0.5) * bs * toUv;
  float field = 0.5
    + 0.25 * sin(bc.x * 2.7 + uSimTime * 0.31 + uSeed) * sin(bc.y * 2.1 - uSimTime * 0.23 + uSeed * 0.4)
    + 0.25 * sin((bc.x + bc.y) * 1.6 + uSimTime * 0.17 + uSeed * 0.7);
  float thresh = 1.0 - uIntensity * 0.55;
  float hold = smoothstep(thresh - 0.09, thresh + 0.09, field + (h1 - 0.5) * 0.3);

  float flowAngle = sin(bc.x * 1.9 + uSeed * 3.1) * 1.7 + cos(bc.y * 2.3 - uSeed * 2.7) * 1.3 + uSimTime * 0.15;
  float angle = flowAngle + (h2 - 0.5) * 1.1;
  float mag = (0.5 + 0.5 * h3) * uDrift * uSimDt * 10.0 * bs;
  vec2 follow = uFollow > 0.0 ? blockMotion(b * bs * toUv, (b + 1.0) * bs * toUv) * uFollow : vec2(0.0);
  vec2 source = vUv - vec2(cos(angle), sin(angle)) * mag * toUv + follow;
  float inside = step(0.0, source.x) * step(source.x, 1.0) * step(0.0, source.y) * step(source.y, 1.0);

  vec3 previous = texture(uInput, clamp(source, 0.0, 1.0)).rgb;
  vec3 quant = (floor(previous * 18.0) + 0.5) / 18.0;
  vec3 held = mix(previous, quant, uQuant) * uDecay;
  float rekey = clamp(uSimDt * (1.2 + (1.0 - uIntensity) * 2.0), 0.0, 0.2);
  vec3 fresh = textureLod(uLive, vUv, uLod).rgb;
  float w = hold * inside;
  outColor = vec4(mix(fresh, mix(held, fresh, rekey), w), w);
}`;

const COMPOSITE = `
uniform sampler2D uState;
uniform float uLod;
void main() {
  vec4 state = texture(uState, vUv);
  vec3 live = texture(uInput, vUv).rgb;
  vec3 low = textureLod(uInput, vUv, uLod).rgb;
  outColor = vec4(state.rgb + (1.0 - state.a) * (live - low), 1.0);
}`;

const MAX_SIDE = 2048;
const LUMA_SIDE = 250;
const MAX_JUMP = 0.5;
const TICK = 1 / 60;
const MAX_TICKS = 8;
const WARM_TIME = 1.2;
const WARM_MAX = 96;

const destroy = (gl, target) => {
  gl.deleteTexture(target.texture);
  gl.deleteFramebuffer(target.fbo);
};

const allocate = (ctx, state) => {
  const key = `${ctx.width}x${ctx.height}`;
  if (state.key === key && state.history) return false;
  [...(state.history || []), ...(state.luma || [])].forEach(target => ctx.release(target));
  const long = Math.max(ctx.width, ctx.height);
  const scale = Math.min(1, MAX_SIDE / long);
  const lumaScale = Math.min(1, LUMA_SIDE / long);
  const w = Math.max(1, Math.round(ctx.width * scale));
  const h = Math.max(1, Math.round(ctx.height * scale));
  const lw = Math.max(8, Math.round(ctx.width * lumaScale));
  const lh = Math.max(8, Math.round(ctx.height * lumaScale));
  state.history = [ctx.engine.target(w, h), ctx.engine.target(w, h)];
  state.luma = [ctx.engine.target(lw, lh), ctx.engine.target(lw, lh)];
  state.key = key;
  state.lod = Math.log2(1 / scale);
  state.lumaLod = Math.log2(1 / lumaScale);
  return true;
};

export default {
  id: 'datamosh',
  name: 'Datamosh',
  category: 'glitch',
  blend: 'normal',
  description: 'Corrupted video: blocks freeze and drag their pixels across the frame in melting trails.',
  animated: true,
  animates: params => params.speed > 0 && params.intensity > 0,
  params: [
    { key: 'intensity', label: 'Intensity', type: 'number', min: 0, max: 1, step: 0.01, default: 0.7 },
    { key: 'size', label: 'Block size', type: 'number', min: 16, max: 200, step: 1, default: 60 },
    { key: 'drift', label: 'Drift', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'churn', label: 'Churn', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'follow', label: 'Follow motion', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 4, step: 0.05, default: 1 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 7 }
  ],
  render(ctx, input, params, state) {
    const elapsed = ctx.time - state.time;
    const resized = allocate(ctx, state);
    const reset = resized || !(elapsed >= 0) || elapsed > MAX_JUMP;
    const source = (state.lod > 0 || state.lumaLod > 0) && !input.mipmapped ? ctx.mipmap(input) : input;
    const speed = Math.max(params.speed, 0);
    const uniforms = {
      uSeed: params.variation,
      uIntensity: params.intensity,
      uBlock: params.size,
      uDrift: params.drift,
      uChurn: params.churn,
      uLod: state.lod,
      uLumaSize: [state.luma[0].width, state.luma[0].height]
    };
    const step = (read, simTime, simDt, motion, follow) =>
      ctx.pass('datamosh-step', STEP, {
        input: state.history[read],
        target: state.history[1 - read],
        textures: { uLive: source, uMotion: motion },
        uniforms: {
          ...uniforms,
          uSimTime: simTime,
          uSimDt: simDt,
          uFollow: follow,
          uQuant: 1 - Math.pow(0.88, simDt * 60),
          uDecay: Math.pow(0.9985, simDt * 60)
        }
      });
    const lumaOf = target =>
      ctx.pass('datamosh-luma', LUMA_PASS, { input: source, target, uniforms: { uLod: state.lumaLod } });

    if (reset) {
      state.history.forEach(target =>
        ctx.pass('datamosh-seed', SEED, { input: source, target, uniforms: { uLod: state.lod } })
      );
      state.luma.forEach(lumaOf);
      state.current = 0;
      state.lumaCurrent = 0;
      state.carry = 0;
      state.last = { simTime: ctx.time * speed, simDt: 0, ticks: 1 };
      const count = speed > 0 ? Math.min(WARM_MAX, Math.ceil(WARM_TIME / (TICK * speed))) : 0;
      for (let index = 0; index < count; index += 1) {
        step(state.current, (ctx.time - (count - 1 - index) * TICK) * speed, TICK * speed, state.luma[0], 0);
        state.current = 1 - state.current;
      }
      if (count) state.last.simDt = TICK * speed;
    } else {
      let ticks = 0;
      let span = TICK;
      if (elapsed > 1e-6) {
        const pending = state.carry + elapsed;
        ticks = Math.max(0, Math.round(pending / TICK));
        if (ticks > MAX_TICKS) {
          span = pending / MAX_TICKS;
          ticks = MAX_TICKS;
          state.carry = 0;
        } else {
          state.carry = pending - ticks * TICK;
        }
      }
      const lumaRead = ticks ? state.lumaCurrent : 1 - state.lumaCurrent;
      const lumaWrite = 1 - lumaRead;
      lumaOf(state.luma[lumaWrite]);
      const motion = ctx.pass('datamosh-match', MATCH, {
        input: state.luma[lumaWrite],
        size: [Math.ceil(state.luma[0].width / 8), Math.ceil(state.luma[0].height / 8)],
        textures: { uPrevious: state.luma[lumaRead] }
      });
      if (ticks) {
        for (let index = 0; index < ticks; index += 1) {
          step(
            state.current,
            (ctx.time - (ticks - 1 - index) * span) * speed,
            span * speed,
            motion,
            params.follow / ticks
          );
          state.current = 1 - state.current;
        }
        state.last = { simTime: ctx.time * speed, simDt: span * speed, ticks };
      } else {
        step(1 - state.current, state.last.simTime, state.last.simDt, motion, params.follow / state.last.ticks);
      }
      ctx.release(motion);
      state.lumaCurrent = lumaWrite;
    }
    state.time = ctx.time;
    return ctx.pass('datamosh-composite', COMPOSITE, {
      input,
      textures: { uState: state.history[state.current] },
      uniforms: { uLod: state.lod }
    });
  },
  dispose(gl, state) {
    [...(state.history || []), ...(state.luma || [])].forEach(target => destroy(gl, target));
    state.history = null;
    state.luma = null;
    state.key = null;
  }
};
