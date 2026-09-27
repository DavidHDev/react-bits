'use client';

import { useEffect, useRef, useState } from 'react';
import { draw, effect, frame, init, sampler, surface, target, uniforms } from 'vgpu';

import './AeroShards.css';

const PLACEMENTS = { right: 0, left: 1, center: 2, full: 3 };
const MATERIALS = { pearl: 0, chrome: 1, satin: 2 };
const INTERACTIONS = { none: 0, repel: 1, attract: 2 };
const EFFECTS = { none: 0, dither: 1, ascii: 2 };
const FLOWS = { stream: 0, vortex: 1, ribbon: 2 };
const RIPPLE_SPEED = 4.2;
const RIPPLE_TAIL = 1.8;
const MATERIAL_PRESETS = {
  pearl: { roughness: 0.46, brightness: 0.92, glow: 0.54, highlightMix: 0.78 },
  chrome: { roughness: 0.1, brightness: 1.12, glow: 0.38, highlightMix: 0.9 },
  satin: { roughness: 0.74, brightness: 0.84, glow: 0.42, highlightMix: 0.66 }
};
const DETAIL_PRESETS = {
  bold: { count: 0.58, size: 1.32 },
  balanced: { count: 1, size: 0.96 },
  fine: { count: 1.15, size: 0.7 }
};
const QUALITY_PRESETS = {
  low: { count: 1900, dpr: 1.5, supersamplePixels: 3000000 },
  medium: { count: 3200, dpr: 2, supersamplePixels: 6000000 },
  high: { count: 4600, dpr: 2, supersamplePixels: 8000000 }
};
const RUNTIME_QUALITY = [{ countScale: 1 }, { countScale: 0.86 }, { countScale: 0.72 }];
// Only the halo is downsampled. Shard edges keep their display-resolution detail.
const BLOOM_SCALES = [0.25, 0.22, 0.18];
const FRAME_STATES = {
  interactive: { interval: 1000 / 60, continuous: true },
  settling: { interval: 1000 / 60, continuous: true },
  ambient: { interval: 1000 / 60, continuous: true },
  partial: { interval: 1000 / 12, continuous: false }
};

const resolveFrameInterval = (frameState, refreshInterval) =>
  frameState.continuous ? Math.max(frameState.interval, refreshInterval) : frameState.interval;

const advanceFrameDeadline = (timestamp, deadline, interval, reset) => {
  const nextDeadline = deadline + interval;
  return reset || nextDeadline <= timestamp - 0.5 ? timestamp + interval : nextDeadline;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createFormation = flow => ({ weights: layoutVector(flow), velocity: [0, 0, 0, 0] });

const advanceFormation = (state, flow, elapsed, duration, frozen) => {
  const goal = layoutVector(flow);
  if (frozen) {
    state.weights = goal;
    state.velocity.fill(0);
    return;
  }
  const response = 6 / duration;
  const decay = Math.exp(-response * elapsed);
  for (let i = 0; i < 4; i += 1) {
    const offset = state.weights[i] - goal[i];
    const momentum = state.velocity[i] + response * offset;
    state.weights[i] = goal[i] + (offset + momentum * elapsed) * decay;
    state.velocity[i] = (state.velocity[i] - response * momentum * elapsed) * decay;
  }
  if (state.weights.every((value, i) => Math.abs(value - goal[i]) < 0.0001 && Math.abs(state.velocity[i]) < 0.001)) {
    state.weights = goal;
    state.velocity.fill(0);
  }
};

const resolvePathLength = (aspect, weights) => {
  const side = 2.65 + 0.61 * aspect + 0.09 * aspect * aspect;
  const center = 2.3 + 2 * aspect + 0.35 * aspect * aspect;
  const full = Math.hypot(2.44 * aspect, Math.sqrt(5));
  const mobile = Math.hypot(2.56 * aspect, 1);
  return aspect < 0.82
    ? mobile * (weights[0] + weights[1] + weights[2]) + full * weights[3]
    : side * (weights[0] + weights[1]) + center * weights[2] + full * weights[3];
};

const createHold = () => ({ pointerId: null, elapsed: 0, amount: 0, velocity: 0, phase: 0 });

const advanceHold = (hold, elapsed, disabled) => {
  if (disabled) {
    hold.pointerId = null;
    hold.elapsed = 0;
    hold.amount = 0;
    hold.velocity = 0;
    return;
  }
  const previousElapsed = hold.elapsed;
  hold.elapsed = hold.pointerId === null ? 0 : hold.elapsed + elapsed;
  // A short click remains a ripple. Gathering starts only after a deliberate hold.
  const engaging = hold.pointerId !== null && hold.elapsed > 0.15;
  const step = engaging && previousElapsed < 0.15 ? hold.elapsed - 0.15 : elapsed;
  const target = engaging ? 1 : 0;
  const response = engaging ? 3.8 : 3.2;
  const decay = Math.exp(-response * step);
  const offset = hold.amount - target;
  const momentum = hold.velocity + response * offset;
  hold.amount = target + (offset + momentum * step) * decay;
  hold.velocity = (hold.velocity - response * momentum * step) * decay;
  if (Math.abs(hold.amount - target) < 0.0001 && Math.abs(hold.velocity) < 0.001) {
    hold.amount = target;
    hold.velocity = 0;
  }
  if (hold.amount > 0) hold.phase += elapsed * (0.35 + hold.amount * 0.5);
};

const resetPointerMotion = pointer => {
  pointer.velocity ??= [0, 0];
  pointer.velocity[0] = 0;
  pointer.velocity[1] = 0;
  pointer.presenceVelocity = 0;
};

const advancePointer = (pointer, elapsed) => {
  if (elapsed <= 0) return;

  // Exact critically damped motion keeps velocity continuous through direction changes.
  const response = 26;
  const decay = Math.exp(-response * elapsed);
  for (let axis = 0; axis < 2; axis += 1) {
    const offset = pointer.position[axis] - pointer.raw[axis];
    const momentum = pointer.velocity[axis] + response * offset;
    pointer.position[axis] = pointer.raw[axis] + (offset + momentum * elapsed) * decay;
    pointer.velocity[axis] = (pointer.velocity[axis] - response * momentum * elapsed) * decay;
  }

  // Let the field ease into contact, then release a little more slowly.
  const presenceTarget = pointer.active ? 1 : 0;
  const presenceResponse = pointer.active ? 24 : 12;
  const presenceDecay = Math.exp(-presenceResponse * elapsed);
  const presenceOffset = pointer.presence - presenceTarget;
  const presenceMomentum = pointer.presenceVelocity + presenceResponse * presenceOffset;
  const nextPresence = presenceTarget + (presenceOffset + presenceMomentum * elapsed) * presenceDecay;
  pointer.presence = clamp(nextPresence, 0, 1);
  pointer.presenceVelocity = (pointer.presenceVelocity - presenceResponse * presenceMomentum * elapsed) * presenceDecay;

  if (nextPresence !== pointer.presence) pointer.presenceVelocity = 0;
  if (Math.abs(pointer.presence - presenceTarget) < 0.001 && Math.abs(pointer.presenceVelocity) < 0.01) {
    pointer.presence = presenceTarget;
    pointer.presenceVelocity = 0;
  }
};

const createRipples = () => Array.from({ length: 4 }, () => ({ origin: [0.5, 0.5], age: 0, duration: 0, strength: 0 }));

const startRipple = (ripples, origin, aspect, strength = 1) => {
  // Preserve waves already in flight; rapid clicks never reset a visible wave.
  const ripple = ripples.find(value => value.strength === 0);
  if (!ripple) return false;
  ripple.origin = [...origin];
  ripple.age = 0;
  const farthestX = (1 + Math.abs(origin[0] * 2 - 1)) * aspect;
  const farthestY = 1 + Math.abs(origin[1] * 2 - 1);
  ripple.duration = Math.hypot(farthestX, farthestY) / RIPPLE_SPEED + RIPPLE_TAIL;
  ripple.strength = strength;
  return true;
};

const advanceRipples = (ripples, elapsed, disabled) => {
  for (const ripple of ripples) {
    if (disabled) ripple.strength = 0;
    if (!ripple.strength) continue;
    ripple.age += elapsed;
    if (ripple.age >= ripple.duration) ripple.strength = 0;
  }
};

const layoutVector = placement => [0, 1, 2, 3].map(index => (index === placement ? 1 : 0));

const mixColor = (from, to, amount) => [
  from[0] + (to[0] - from[0]) * amount,
  from[1] + (to[1] - from[1]) * amount,
  from[2] + (to[2] - from[2]) * amount,
  1
];

const SHARD_SHADER = `
struct ViewParams {
  viewport: vec4f,
  shape: vec4f,
  effects: vec4f,
  composition: vec4f,
  transport: vec4f,
  formation: vec4f,
  gather: vec4f,
  pointer: vec4f,
  shock: vec4f,
  shockB: vec4f,
  shockC: vec4f,
  shockD: vec4f,
  material: vec4f,
  light: vec4f,
  environment: vec4f,
  baseColor: vec4f,
  highlightColor: vec4f,
  accentColor: vec4f,
}

struct PathSample {
  position: vec3f,
  tangent: vec3f,
  phase: f32,
}

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(flat, first) baseAlpha: vec4f,
  @location(1) @interpolate(flat, first) creaseColor: vec3f,
  @location(2) localCoord: vec2f,
}

@group(0) @binding(0) var<uniform> view: ViewParams;

fn hashU32(value: u32) -> u32 {
  var state = value * 747796405u + 2891336453u;
  let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

fn unitFloat(value: u32) -> f32 {
  return f32(hashU32(value)) * (1.0 / 4294967296.0);
}

fn safeNormalize(value: vec3f) -> vec3f {
  return value / max(length(value), 0.0001);
}

fn safeNormalize2(value: vec2f) -> vec2f {
  return value / max(length(value), 0.0001);
}

fn cubic(p0: f32, p1: f32, p2: f32, p3: f32, t: f32) -> f32 {
  let oneMinusT = 1.0 - t;
  return oneMinusT * oneMinusT * oneMinusT * p0
    + 3.0 * oneMinusT * oneMinusT * t * p1
    + 3.0 * oneMinusT * t * t * p2
    + t * t * t * p3;
}

fn cubicDerivative(p0: f32, p1: f32, p2: f32, p3: f32, t: f32) -> f32 {
  let oneMinusT = 1.0 - t;
  return 3.0 * oneMinusT * oneMinusT * (p1 - p0)
    + 6.0 * oneMinusT * t * (p2 - p1)
    + 3.0 * t * t * (p3 - p2);
}

fn sideArc(phase: f32) -> f32 {
  let lookup = array<f32, 32>(
    0.000000, 0.052475, 0.097829, 0.135121, 0.166845, 0.195164, 0.221458, 0.246639,
    0.271368, 0.296184, 0.321577, 0.348019, 0.375973, 0.405832, 0.437746, 0.471327,
    0.505474, 0.538781, 0.570323, 0.599945, 0.628000, 0.655048, 0.681734, 0.708795,
    0.737169, 0.768244, 0.804295, 0.848010, 0.894805, 0.935083, 0.969270, 1.000000,
  );
  let scaled = clamp(phase, 0.0, 0.999999) * 31.0;
  let index = min(u32(floor(scaled)), 30u);
  return mix(lookup[index], lookup[index + 1u], fract(scaled));
}

fn fullArc(phase: f32) -> f32 {
  let lookup = array<f32, 32>(
    0.000000, 0.028092, 0.055939, 0.083892, 0.112291, 0.141449, 0.171637, 0.203033,
    0.235650, 0.269282, 0.303537, 0.337982, 0.372308, 0.406392, 0.440263, 0.474026,
    0.507794, 0.541636, 0.575553, 0.609470, 0.643257, 0.676761, 0.709855, 0.742465,
    0.774594, 0.806319, 0.837790, 0.869218, 0.900862, 0.933020, 0.965991, 1.000000,
  );
  let scaled = clamp(phase, 0.0, 0.999999) * 31.0;
  let index = min(u32(floor(scaled)), 30u);
  return mix(lookup[index], lookup[index + 1u], fract(scaled));
}

fn centerArc(phase: f32) -> f32 {
  let lookup = array<f32, 32>(
    0.000000, 0.028692, 0.059794, 0.096620, 0.140315, 0.179839, 0.212476, 0.241834,
    0.270282, 0.299332, 0.329968, 0.362347, 0.395341, 0.427241, 0.457283, 0.485900,
    0.514192, 0.543773, 0.577230, 0.618093, 0.661144, 0.696770, 0.727388, 0.756064,
    0.784657, 0.814415, 0.845979, 0.878880, 0.911508, 0.942489, 0.971712, 1.000000,
  );
  let scaled = clamp(phase, 0.0, 0.999999) * 31.0;
  let index = min(u32(floor(scaled)), 30u);
  return mix(lookup[index], lookup[index + 1u], fract(scaled));
}

fn mobileArc(phase: f32) -> f32 {
  let lookup = array<f32, 32>(
    0.000000, 0.028885, 0.057970, 0.087431, 0.117400, 0.147935, 0.179017, 0.210560,
    0.242467, 0.274689, 0.307272, 0.340367, 0.374193, 0.408970, 0.444794, 0.481483,
    0.518517, 0.555206, 0.591030, 0.625807, 0.659633, 0.692728, 0.725311, 0.757533,
    0.789440, 0.820983, 0.852065, 0.882600, 0.912569, 0.942030, 0.971115, 1.000000,
  );
  let scaled = clamp(phase, 0.0, 0.999999) * 31.0;
  let index = min(u32(floor(scaled)), 30u);
  return mix(lookup[index], lookup[index + 1u], fract(scaled));
}

fn sidePath(seedPhase: f32, distance: f32, aspect: f32, mirror: f32) -> PathSample {
  let pi = 3.14159265359;
  let pathLength = 2.65 + 0.61 * aspect + 0.09 * aspect * aspect;
  let phase = fract(seedPhase + distance / pathLength);
  let t = sideArc(phase);
  let x = cubic(1.24, 1.02, -0.28, 0.12, t) + sin(t * pi * 4.0 + 0.34) * 0.055;
  let y = cubic(1.38, 0.72, -0.56, -1.38, t) + sin(t * pi * 2.0 - 0.6) * 0.04;
  let z = sin(t * pi * 3.0) * 0.18;
  let derivative = vec3f(
    mirror * aspect * (
      cubicDerivative(1.24, 1.02, -0.28, 0.12, t)
        + cos(t * pi * 4.0 + 0.34) * pi * 4.0 * 0.055
    ),
    cubicDerivative(1.38, 0.72, -0.56, -1.38, t)
      + cos(t * pi * 2.0 - 0.6) * pi * 2.0 * 0.04,
    cos(t * pi * 3.0) * pi * 3.0 * 0.18,
  );
  var sample: PathSample;
  sample.position = vec3f(mirror * aspect * x, y, z);
  sample.tangent = safeNormalize(derivative);
  sample.phase = phase;
  return sample;
}

fn centerPath(seedPhase: f32, distance: f32, aspect: f32) -> PathSample {
  let pi = 3.14159265359;
  let pathLength = 2.3 + 2.0 * aspect + 0.35 * aspect * aspect;
  let phase = fract(seedPhase + distance / pathLength);
  let t = centerArc(phase);
  let angle = mix(-0.25 * pi, 1.75 * pi, t);
  let angleDerivative = 2.0 * pi;
  let radius = 0.72 + sin(t * pi * 4.0) * 0.12;
  let radiusDerivative = cos(t * pi * 4.0) * pi * 4.0 * 0.12;
  let derivative = vec3f(
    aspect * (
      -sin(angle) * angleDerivative * radius
        + cos(angle) * radiusDerivative
    ),
    cos(angle) * angleDerivative * radius
      + sin(angle) * radiusDerivative,
    cos(t * pi * 2.0) * pi * 2.0 * 0.16,
  );
  var sample: PathSample;
  sample.position = vec3f(
    cos(angle) * radius * aspect,
    sin(angle) * radius,
    sin(t * pi * 2.0) * 0.16,
  );
  sample.tangent = safeNormalize(derivative);
  sample.phase = phase;
  return sample;
}

fn fullPath(seedPhase: f32, distance: f32, aspect: f32) -> PathSample {
  let pi = 3.14159265359;
  let pathWidth = 2.44 * aspect;
  let pathLength = sqrt(pathWidth * pathWidth + 5.0);
  let phase = fract(seedPhase + distance / pathLength);
  let t = fullArc(phase);
  let derivative = vec3f(
    aspect * 2.44,
    cos((t * 1.72 - 0.2) * pi) * 1.72 * pi * 0.54
      + cos(t * pi * 3.0) * pi * 3.0 * 0.12,
    -sin(t * pi * 2.0 - 0.7) * pi * 2.0 * 0.22,
  );
  var sample: PathSample;
  sample.position = vec3f(
    mix(-aspect * 1.22, aspect * 1.22, t),
    sin((t * 1.72 - 0.2) * pi) * 0.54 + sin(t * pi * 3.0) * 0.12,
    cos(t * pi * 2.0 - 0.7) * 0.22,
  );
  sample.tangent = safeNormalize(derivative);
  sample.phase = phase;
  return sample;
}

fn mobilePath(seedPhase: f32, distance: f32, aspect: f32) -> PathSample {
  let pi = 3.14159265359;
  let pathWidth = 2.56 * aspect;
  let pathLength = sqrt(pathWidth * pathWidth + 1.0);
  let phase = fract(seedPhase + distance / pathLength);
  let t = mobileArc(phase);
  let derivative = vec3f(
    aspect * 2.56,
    cos(t * pi) * pi * 0.28 + cos(t * pi * 3.0) * pi * 3.0 * 0.06,
    -sin(t * pi * 2.0) * pi * 2.0 * 0.16,
  );
  var sample: PathSample;
  sample.position = vec3f(
    mix(-aspect * 1.28, aspect * 1.28, t),
    -0.86 + sin(t * pi) * 0.28 + sin(t * pi * 3.0) * 0.06,
    cos(t * pi * 2.0) * 0.16,
  );
  sample.tangent = safeNormalize(derivative);
  sample.phase = phase;
  return sample;
}

fn weightedPath(seedPhase: f32, phaseOffset: f32, aspect: f32, weights: vec4f) -> PathSample {
  // Every placement samples the same point along the stream, including its wrap seam.
  let phase = fract(seedPhase + phaseOffset);
  var result: PathSample;
  result.position = vec3f(0.0);
  result.tangent = vec3f(0.0);
  result.phase = phase;

  if (aspect < 0.82) {
    let compactWeight = weights.x + weights.y + weights.z;
    if (compactWeight > 0.0001) {
      let compact = mobilePath(phase, 0.0, aspect);
      result.position += compact.position * compactWeight;
      result.tangent += compact.tangent * compactWeight;
    }
    if (weights.w > 0.0001) {
      let wide = fullPath(phase, 0.0, aspect);
      result.position += wide.position * weights.w;
      result.tangent += wide.tangent * weights.w;
    }
  } else {
    if (weights.x > 0.0001) {
      let right = sidePath(phase, 0.0, aspect, 1.0);
      result.position += right.position * weights.x;
      result.tangent += right.tangent * weights.x;
    }
    if (weights.y > 0.0001) {
      let left = sidePath(phase, 0.0, aspect, -1.0);
      result.position += left.position * weights.y;
      result.tangent += left.tangent * weights.y;
    }
    if (weights.z > 0.0001) {
      let center = centerPath(phase, 0.0, aspect);
      result.position += center.position * weights.z;
      result.tangent += center.tangent * weights.z;
    }
    if (weights.w > 0.0001) {
      let wide = fullPath(phase, 0.0, aspect);
      result.position += wide.position * weights.w;
      result.tangent += wide.tangent * weights.w;
    }
  }

  result.tangent = safeNormalize(result.tangent + vec3f(0.0001, 0.0, 0.0));
  return result;
}

fn pointerField(delta: vec2f, radius: f32, flow: vec2f, depth: f32) -> vec2f {
  // A curved Gaussian follows the flow, with a long, boundary-free tail.
  let offset = delta / max(radius, 0.001);
  let along = dot(offset, flow);
  let across = dot(offset, vec2f(-flow.y, flow.x));
  let alongSquared = along * along;
  let layer = depth * inverseSqrt(1.0 + depth * depth);
  let bend = (0.22 * alongSquared + 0.12 * layer * along) / (1.0 + alongSquared);
  let curvedAcross = (across + bend) / (1.0 + layer * 0.18);
  let falloff = exp(-0.28 * alongSquared - 1.2 * curvedAcross * curvedAcross);
  return offset * falloff;
}

fn rippleWave(age: f32) -> f32 {
  if (age <= 0.0 || age >= ${RIPPLE_TAIL}) { return 0.0; }
  let attack = smoothstep(0.0, 0.14, age);
  let release = 1.0 - smoothstep(1.4, ${RIPPLE_TAIL}, age);
  return sin(age * 10.0) * exp(-age * 3.2) * attack * release;
}

fn rippleDisplacement(position: vec3f, pulse: vec4f) -> vec4f {
  if (pulse.w <= 0.0001) { return vec4f(0.0); }
  let perspective = 1.0 / max(0.62, 1.0 - position.z * 0.34);
  let delta = (position.xy * perspective - pulse.xy) * view.viewport.z;
  let distance = sqrt(dot(delta, delta) + 0.0016) - 0.04;
  let wave = rippleWave(pulse.z - distance / ${RIPPLE_SPEED}) * pulse.w;
  let radial = delta / (distance + 0.12);
  return vec4f(radial * wave * 0.28, wave * 0.12, abs(wave));
}

fn shardVertex(index: u32) -> vec3f {
  let fold = 0.34;
  let vertices = array<vec3f, 6>(
    vec3f(0.0, 1.0, fold),
    vec3f(-0.72, 0.0, 0.0),
    vec3f(0.0, -1.0, fold),
    vec3f(0.0, 1.0, fold),
    vec3f(0.0, -1.0, fold),
    vec3f(0.72, 0.0, 0.0)
  );
  return vertices[index % 6u];
}

fn softbox(direction: vec3f, center: vec2f, size: vec2f) -> f32 {
  let q = abs((direction.xy - center) / size);
  let q2 = q * q;
  let q4 = q2 * q2;
  return exp(-(q4.x + q4.y));
}

fn aces(color: vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), vec3f(0.0), vec3f(1.0));
}

@vertex
fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOut {
  let seedPhase = unitFloat(instanceIndex * 1664525u + 1013904223u);
  let seedLane = unitFloat(instanceIndex * 2246822519u + 3266489917u);
  let seedDepth = unitFloat(instanceIndex * 668265263u + 374761393u);
  let seedScale = unitFloat(instanceIndex * 1597334677u + 3812015801u);
  let aspect = view.viewport.x;
  let path = weightedPath(seedPhase, view.transport.x, aspect, view.composition);
  var direction = path.tangent;
  var planarNormal = safeNormalize2(vec2f(-direction.y, direction.x));

  let signedLane = seedLane * 2.0 - 1.0;
  let lane = sign(signedLane) * pow(abs(signedLane), 0.72);
  let widthProfile = 0.46 + pow(max(sin(path.phase * 3.14159265359), 0.0), 0.72) * 0.54;
  let looseSeed = unitFloat(instanceIndex * 3266489917u + 668265263u);
  let loose = smoothstep(0.92, 1.0, looseSeed);
  let flowWave = sin(path.phase * 37.6991118431 + seedDepth * 12.0);
  let laneWidth = (lane * 0.56 + flowWave * 0.055 * view.shape.z) * view.shape.x
    * widthProfile * (1.0 + loose * 0.72);
  let depthLane = (seedDepth * 2.0 - 1.0) * view.shape.y
    + cos(path.phase * 31.4159265359 + seedLane * 8.0) * 0.06 * view.shape.z;
  var renderPosition = path.position + vec3f(planarNormal * laneWidth, depthLane);

  if (view.formation.y + view.formation.z > 0.00001) {
    let center = vec2f((view.composition.x - view.composition.y) * aspect * 0.56, 0.0);
    var formedPosition = renderPosition * view.formation.x;
    var formedDirection = direction * view.formation.x;
    if (view.formation.y > 0.00001) {
      let radius = 0.16 + sqrt(seedLane) * 0.74 * (0.45 + view.shape.x * 0.55);
      // Constant tangential travel speed; inner rings turn faster without speeding up.
      let angle = seedPhase * 6.28318530718 + view.viewport.w / radius;
      let radial = vec2f(cos(angle), sin(angle));
      let position = vec3f(center + radial * radius, (seedDepth - 0.5) * view.shape.y * 0.65 + radial.y * 0.2);
      formedPosition += position * view.formation.y;
      formedDirection += safeNormalize(vec3f(-radial.y, radial.x, radial.x * 0.2)) * view.formation.y;
    }
    if (view.formation.z > 0.00001) {
      let phase = fract(seedPhase + view.viewport.w / (aspect * 3.0 + 2.0));
      let angle = phase * 6.28318530718;
      let ribbonWidth = (seedLane - 0.5) * 0.54 * view.shape.x;
      let position = vec3f(
        mix(-aspect * 1.35, aspect * 1.35, phase) + center.x * 0.5,
        sin(angle) * 0.42 + cos(angle * 2.0) * ribbonWidth,
        (cos(angle) * 0.35 + sin(angle * 2.0) * ribbonWidth + (seedDepth - 0.5) * 0.12) * view.shape.y
      );
      let tangent = safeNormalize(vec3f(aspect * 2.7, cos(angle) * 2.638938, -sin(angle) * 2.199115 * view.shape.y));
      formedPosition += position * view.formation.z;
      formedDirection += tangent * view.formation.z;
    }
    renderPosition = formedPosition;
    direction = safeNormalize(formedDirection + vec3f(0.0, 0.0, 0.02 * view.formation.x * (1.0 - view.formation.x)));
    planarNormal = safeNormalize2(vec2f(-direction.y, direction.x));
  }

  if (abs(view.pointer.w) > 0.0001) {
    let field = pointerField(
      view.pointer.xy - renderPosition.xy,
      view.pointer.z,
      vec2f(planarNormal.y, -planarNormal.x),
      renderPosition.z,
    );
    let lateral = field - direction.xy * dot(field, direction.xy);
    renderPosition += vec3f(lateral * view.pointer.w * 0.36, 0.0);
    direction = safeNormalize(vec3f(direction.xy + lateral * view.pointer.w * 0.65, direction.z));
  }

  if (view.gather.z > 0.00001) {
    // A Gaussian cloud has a dense center and soft outskirts, never a ring or a hard outline.
    let relative = (renderPosition.xy - view.gather.xy) * view.viewport.z;
    let reach = length(relative);
    let radius = sqrt(-2.0 * log(max(seedLane, 0.0001)));
    let angle = seedPhase * 6.28318530718 + view.gather.w * (0.3 + seedDepth * 0.18);
    let orbit = vec2f(cos(angle), sin(angle));
    let layer = seedDepth * 6.28318530718;
    let drift = vec2f(sin(layer + view.gather.w * 0.22), cos(layer * 1.7 - view.gather.w * 0.18)) * 0.055;
    let cloud = orbit * radius * vec2f(0.2, 0.16) + drift;
    let cluster = vec3f(view.gather.xy + cloud / view.viewport.z, (seedDepth - 0.5) * 0.42);
    // Distant layers arrive later; there is no single closing boundary.
    let amount = pow(view.gather.z, 1.0 + seedDepth * 0.65 + min(reach, 4.0) * 0.12);
    let curledDirection = safeNormalize(vec3f(-orbit.y, orbit.x, sin(layer) * 0.35));
    renderPosition = mix(renderPosition, cluster, amount);
    direction = safeNormalize(mix(direction, curledDirection, amount));
  }

  var rippleLight = 0.0;
  if (view.shock.w + view.shockB.w + view.shockC.w + view.shockD.w > 0.0001) {
    let displacement = rippleDisplacement(renderPosition, view.shock)
      + rippleDisplacement(renderPosition, view.shockB)
      + rippleDisplacement(renderPosition, view.shockC)
      + rippleDisplacement(renderPosition, view.shockD);
    rippleLight = min(displacement.w, 1.5);
    if (dot(displacement.xyz, displacement.xyz) > 0.0) {
      renderPosition += displacement.xyz;
      direction = safeNormalize(direction + displacement.xyz * 0.7);
    }
  }

  let shapeLocal = shardVertex(vertexIndex);
  var local = shapeLocal;
  local.x *= mix(0.72, 1.08, seedLane);
  local.y *= mix(0.82, 1.12, seedDepth);
  local.x += (seedDepth - 0.5) * (1.0 - abs(local.y)) * 0.16;

  var side = cross(vec3f(0.0, 0.0, 1.0), direction);
  let sideLengthSquared = dot(side, side);
  if (sideLengthSquared > 0.0001) {
    side *= inverseSqrt(sideLengthSquared);
  } else {
    side = vec3f(1.0, 0.0, 0.0);
  }
  let facing = cross(direction, side);
  let rollDirection = mix(-1.5, 1.7, seedDepth);
  let roll = seedLane * 6.28318530718 + view.viewport.w * rollDirection * view.effects.x * 2.4;
  let rollSin = sin(roll);
  let rollCos = cos(roll);
  let bankedSide = side * rollCos + facing * rollSin;
  let bankedFacing = facing * rollCos - side * rollSin;
  let depthScale = mix(0.56, 1.58, clamp(renderPosition.z * 0.62 + 0.5, 0.0, 1.0));
  let scaleShape = 0.46 + seedScale * 0.58 + pow(seedScale, 12.0) * 1.55;
  let size = view.viewport.y * scaleShape * depthScale * (1.0 - view.gather.z * 0.3);
  let width = size * 0.72;
  let lengthScale = size * 1.26 * view.effects.z;
  let world = renderPosition
    + direction * local.y * lengthScale
    + bankedSide * local.x * width
    + bankedFacing * local.z * width;

  let perspective = 1.0 / max(0.62, 1.0 - world.z * 0.34);
  let ndc = world.xy * view.viewport.z / vec2f(aspect, 1.0) * perspective;
  let depth = clamp(0.56 - world.z * 0.24, 0.03, 0.97);
  let triangle = vertexIndex / 3u;
  let corner = vertexIndex % 3u;
  var mapped = vec3f(0.0);
  var mappedCrease = vec3f(0.0);
  var shardAlpha = 0.0;

  if (corner == 0u) {
    let facetSide = select(-1.0, 1.0, triangle == 1u);
    let localNormal = vec3f(facetSide * 0.394903, 0.0, 0.918723);
    let normal = bankedSide * localNormal.x + bankedFacing * localNormal.z;
    let viewDirection = normalize(vec3f(-renderPosition.xy * 0.08, 1.0));
    let pointerShift = vec2f(view.light.w, view.shape.w);
    let keyDirection = view.light.xyz;
    let halfDirection = normalize(keyDirection + viewDirection);
    let roughness = clamp(view.material.x, 0.04, 0.96);
    let materialKind = view.material.y;
    let glow = view.material.w;
    let reflection = reflect(-viewDirection, normal);
    let broad = softbox(
      reflection,
      vec2f(-0.34, 0.28) + pointerShift * 0.36,
      vec2f(0.52, 0.22) + roughness * 0.3,
    );
    let strip = softbox(
      reflection,
      vec2f(0.48, -0.08) - pointerShift * 0.2,
      vec2f(0.12, 0.72),
    );
    let diffuse = max(dot(normal, keyDirection), 0.0);
    let specularPower = mix(92.0, 9.0, roughness);
    let specular = pow(max(dot(normal, halfDirection), 0.0), specularPower);
    let fresnelBase = 1.0 - max(dot(normal, viewDirection), 0.0);
    let fresnelSquared = fresnelBase * fresnelBase;
    let fresnel = fresnelSquared * fresnelSquared;
    let facet = mix(0.76, 1.0, smoothstep(-0.08, 0.08, normal.x));
    let depthFog = smoothstep(-0.68, 0.58, renderPosition.z);
    let depthTint = mix(view.accentColor.rgb * 0.52, view.baseColor.rgb, depthFog);
    var color = depthTint * (0.1 + diffuse * 0.3) * facet;
    color += view.highlightColor.rgb * (broad * mix(0.3, 0.86, 1.0 - roughness)) * (1.0 + glow * 0.14);
    color += view.accentColor.rgb * strip * (0.12 + fresnel * 0.42);
    color += view.highlightColor.rgb * specular * mix(0.82, 1.0, seedDepth);
    color += mix(view.baseColor.rgb, view.accentColor.rgb, seedLane) * fresnel * (0.15 + glow * 0.16);
    color += view.accentColor.rgb * (broad * 0.045 + fresnel * 0.075) * glow;
    var creaseColor = color + view.highlightColor.rgb * (0.08 + specular * 0.22);

    if (materialKind > 0.5 && materialKind < 1.5) {
      let materialLight = view.highlightColor.rgb * (broad + specular) * 0.32;
      color = color * 1.1 + materialLight;
      creaseColor = creaseColor * 1.1 + materialLight;
    } else if (materialKind >= 1.5) {
      let satinColor = view.baseColor.rgb * (0.46 + diffuse * 0.46);
      color = mix(color, satinColor, 0.56);
      creaseColor = mix(creaseColor, satinColor, 0.56);
    }

    // A light page acts as a broad fill light, keeping shaded facets in the chosen palette.
    let fill = mix(view.accentColor.rgb, view.baseColor.rgb, depthFog)
      * (0.38 + diffuse * 0.12) * facet * view.environment.x;
    color += fill;
    creaseColor += fill;

    // Reuse the displacement wave, so the accent catches each facet as the ripple arrives.
    let pulseColor = mix(view.accentColor.rgb, view.highlightColor.rgb, 0.18);
    color += pulseColor * rippleLight * (0.85 + fresnel * 0.45);
    creaseColor += pulseColor * rippleLight * 1.35;

    let fog = mix(0.42, 1.0, depthFog);
    let exposure = fog * view.material.z * view.effects.w;
    mapped = aces(color * exposure);
    mappedCrease = aces(creaseColor * exposure);
    shardAlpha = mix(0.58, 0.97, depthFog);
    // Open path endpoints can cross the viewport while morphing. Taper only that moving seam.
    let seam = smoothstep(0.0, 0.035, path.phase) * (1.0 - smoothstep(0.965, 1.0, path.phase));
    shardAlpha *= mix(1.0, seam, view.transport.y * view.formation.x * (1.0 - view.gather.z));
  }

  var out: VertexOut;
  out.position = vec4f(ndc, depth, 1.0);
  out.baseAlpha = vec4f(mapped, shardAlpha);
  out.creaseColor = mappedCrease - mapped;
  out.localCoord = shapeLocal.xy;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4f {
  let crease = (1.0 - smoothstep(0.015, 0.11, abs(in.localCoord.x)))
    * (1.0 - smoothstep(0.78, 1.0, abs(in.localCoord.y)));
  var coverage = 1.0;
  if (view.effects.y > 0.001) {
    let diamondDistance = 1.0 - abs(in.localCoord.y) - abs(in.localCoord.x) / 0.72;
    let edgeWidth = max(fwidth(diamondDistance) * view.effects.y, 0.0001);
    coverage = smoothstep(0.0, edgeWidth, diamondDistance);
  }
  let mapped = in.baseAlpha.rgb + in.creaseColor * crease;
  let coveredAlpha = in.baseAlpha.a * coverage;
  return vec4f(mapped * coveredAlpha, coveredAlpha);
}
`;

const BLOOM_SHADER = `
struct PostParams {
  viewport: vec4f,
  bloomInfo: vec4f,
  finishing: vec4f,
  background: vec4f,
  temporal: vec4f,
  tint: vec4f,
}

@group(0) @binding(0) var sceneTexture: texture_2d<f32>;
@group(0) @binding(1) var sceneSampler: sampler;
@group(0) @binding(2) var<uniform> post: PostParams;

fn visibleResidual(uv: vec2f) -> vec4f {
  let scene = textureSampleLevel(sceneTexture, sceneSampler, uv, 0.0).rgb;
  let residual = scene - post.background.rgb;
  let energy = dot(abs(residual), vec3f(0.2126, 0.7152, 0.0722));
  let threshold = post.bloomInfo.z;
  let knee = post.bloomInfo.w;
  let contribution = smoothstep(threshold - knee, threshold + knee, energy);
  let coverage = energy * contribution;
  // Store a premultiplied palette halo on light surfaces, never negative radiance.
  return vec4f(mix(residual * contribution, post.tint.rgb * coverage, post.finishing.w), coverage);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let offset = post.bloomInfo.xy * 0.25;
  var glow = visibleResidual(uv + offset);
  glow += visibleResidual(uv - offset);
  glow += visibleResidual(uv + vec2f(offset.x, -offset.y));
  glow += visibleResidual(uv + vec2f(-offset.x, offset.y));
  return glow * 0.25;
}
`;

const BLOOM_BLUR_SHADER = `
struct BlurParams {
  direction: vec4f,
}

@group(0) @binding(0) var bloomTexture: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var<uniform> blur: BlurParams;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let nearOffset = blur.direction.xy * 1.3846153846;
  let farOffset = blur.direction.xy * 3.2307692308;
  var color = textureSampleLevel(bloomTexture, linearSampler, uv, 0.0) * 0.2270270270;
  color += textureSampleLevel(bloomTexture, linearSampler, uv + nearOffset, 0.0) * 0.3162162162;
  color += textureSampleLevel(bloomTexture, linearSampler, uv - nearOffset, 0.0) * 0.3162162162;
  color += textureSampleLevel(bloomTexture, linearSampler, uv + farOffset, 0.0) * 0.0702702703;
  color += textureSampleLevel(bloomTexture, linearSampler, uv - farOffset, 0.0) * 0.0702702703;
  return color;
}
`;

// Compact 5×7 glyphs keep ASCII self-contained: no font downloads, canvas atlas, or readbacks.
// Space, punctuation, directional strokes, and dense glyphs cover the six shape samples.
const ASCII_GLYPHS = [
  [0, 0, 0, 0, 0, 0, 0], // space
  [0, 0, 0, 0, 0, 12, 12], // .
  [0, 12, 12, 0, 12, 12, 0], // :
  [0, 0, 0, 31, 0, 0, 0], // -
  [0, 0, 31, 0, 31, 0, 0], // =
  [4, 4, 4, 4, 4, 4, 4], // |
  [1, 2, 2, 4, 8, 8, 16], // /
  [16, 8, 8, 4, 2, 2, 1], // backslash
  [0, 4, 4, 31, 4, 4, 0], // +
  [0, 21, 14, 31, 14, 21, 0], // *
  [0, 17, 10, 4, 10, 17, 0], // x
  [2, 4, 8, 16, 8, 4, 2], // <
  [8, 4, 2, 1, 2, 4, 8], // >
  [3, 4, 8, 8, 8, 4, 3], // (
  [24, 4, 2, 2, 2, 4, 24], // )
  [0, 0, 14, 17, 17, 14, 0], // o
  [14, 17, 17, 17, 17, 17, 14], // O
  [10, 10, 31, 10, 31, 10, 10], // #
  [14, 17, 23, 21, 23, 16, 14], // @
  [17, 27, 21, 21, 17, 17, 17], // M
  [17, 17, 17, 21, 21, 27, 17], // W
  [14, 17, 17, 31, 17, 17, 17] // A
];
const ASCII_SAMPLES = [
  [0.28, 0.26],
  [0.72, 0.14],
  [0.28, 0.56],
  [0.72, 0.44],
  [0.28, 0.86],
  [0.72, 0.74]
];
const ASCII_SHAPES = ASCII_GLYPHS.map(rows =>
  ASCII_SAMPLES.map(([cx, cy]) => {
    let sum = 0;
    let count = 0;
    for (let y = 0; y < 28; y += 1) {
      for (let x = 0; x < 20; x += 1) {
        if (((x + 0.5) / 20 - cx) ** 2 * 0.36 + ((y + 0.5) / 28 - cy) ** 2 > 0.26 ** 2) continue;
        sum += (rows[Math.floor(y / 4)] >> (4 - Math.floor(x / 4))) & 1;
        count += 1;
      }
    }
    return sum / Math.max(count, 1);
  })
);
for (let sample = 0; sample < 6; sample += 1) {
  const peak = Math.max(...ASCII_SHAPES.map(shape => shape[sample]));
  for (const shape of ASCII_SHAPES) shape[sample] /= Math.max(peak, 0.001);
}

const STYLE_COMMON = `
struct StyleParams {
  viewport: vec4f,
  background: vec4f,
  mode: vec4f,
}
@group(0) @binding(0) var sourceTexture: texture_2d<f32>;
@group(0) @binding(1) var sourceSampler: sampler;
@group(0) @binding(2) var<uniform> style: StyleParams;

fn sampleSource(pixel: vec2f) -> vec3f {
  if (any(pixel < vec2f(0.0)) || any(pixel >= style.viewport.xy)) { return style.background.rgb; }
  return textureSampleLevel(sourceTexture, sourceSampler, pixel / style.viewport.xy, 0.0).rgb;
}
fn inkLevel(color: vec3f) -> f32 {
  // Measure contrast against the chosen background, not black: white stays empty too.
  return clamp(dot(abs(color - style.background.rgb), vec3f(0.2126, 0.7152, 0.0722)) * 2.4, 0.0, 1.0);
}
`;

const ASCII_CELL_SHADER = `${STYLE_COMMON}
const INNER = array<vec2f, 6>(${ASCII_SAMPLES.map(point => `vec2f(${point.join(', ')})`).join(', ')});
const OUTER = array<vec2f, 10>(
  vec2f(0.28, -0.2), vec2f(0.72, -0.2), vec2f(-0.22, 0.25), vec2f(1.22, 0.25),
  vec2f(-0.22, 0.5), vec2f(1.22, 0.5), vec2f(-0.22, 0.75), vec2f(1.22, 0.75),
  vec2f(0.28, 1.2), vec2f(0.72, 1.2)
);
const RING = array<vec2f, 6>(vec2f(1.0, 0.0), vec2f(0.5, 0.8660254), vec2f(-0.5, 0.8660254),
  vec2f(-1.0, 0.0), vec2f(-0.5, -0.8660254), vec2f(0.5, -0.8660254));
const SHAPES = array<vec3f, ${ASCII_GLYPHS.length * 2}>(
  ${ASCII_SHAPES.flatMap(shape => [shape.slice(0, 3), shape.slice(3)])
    .map(part => `vec3f(${part.map(value => value.toFixed(6)).join(', ')})`)
    .join(',\n  ')}
);
fn edgeContrast(value: f32, outside: f32) -> f32 {
  let peak = max(max(value, outside), 0.0001);
  return value * value / peak;
}
@fragment
fn fs_main(@builtin(position) pixel: vec4f) -> @location(0) vec4f {
  let base = floor(pixel.xy) * style.viewport.zw;
  var values: array<f32, 6>;
  var colorSum = vec3f(0.0);
  var weightSum = 0.0;
  for (var i = 0u; i < 6u; i++) {
    let center = base + INNER[i] * style.viewport.zw;
    var color = sampleSource(center);
    for (var tap = 0u; tap < 6u; tap++) {
      color += sampleSource(center + RING[tap] * style.viewport.w * 0.161);
    }
    color /= 7.0;
    values[i] = inkLevel(color);
    colorSum += color * values[i];
    weightSum += values[i];
  }
  if (weightSum < 0.025) { return vec4f(style.background.rgb, 0.0); }
  var edges: array<f32, 10>;
  for (var i = 0u; i < 10u; i++) { edges[i] = inkLevel(sampleSource(base + OUTER[i] * style.viewport.zw)); }
  values[0] = edgeContrast(values[0], max(max(edges[0], edges[1]), max(edges[2], edges[4])));
  values[1] = edgeContrast(values[1], max(max(edges[0], edges[1]), max(edges[3], edges[5])));
  values[2] = edgeContrast(values[2], max(edges[2], max(edges[4], edges[6])));
  values[3] = edgeContrast(values[3], max(edges[3], max(edges[5], edges[7])));
  values[4] = edgeContrast(values[4], max(max(edges[4], edges[6]), max(edges[8], edges[9])));
  values[5] = edgeContrast(values[5], max(max(edges[5], edges[7]), max(edges[8], edges[9])));
  let peak = max(max(max(values[0], values[1]), max(values[2], values[3])), max(values[4], values[5]));
  let gain = 1.0 / max(peak, 0.001);
  let a = vec3f(values[0], values[1], values[2]);
  let b = vec3f(values[3], values[4], values[5]);
  // Normalize shape separately from ink color so thin, dim shards do not all select space.
  let shapeA = a * sqrt(a * gain) * gain;
  let shapeB = b * sqrt(b * gain) * gain;
  var best = 0u;
  var bestDistance = 100.0;
  for (var glyph = 0u; glyph < ${ASCII_GLYPHS.length}u; glyph++) {
    let da = shapeA - SHAPES[glyph * 2u];
    let db = shapeB - SHAPES[glyph * 2u + 1u];
    let distance = dot(da, da) + dot(db, db);
    if (distance < bestDistance) { best = glyph; bestDistance = distance; }
  }
  // RGB stores the scene palette; alpha is an exact byte-sized glyph index, not opacity.
  let ink = style.background.rgb + (colorSum / weightSum - style.background.rgb) * 2.2;
  return vec4f(clamp(ink, vec3f(0.0), vec3f(1.0)), f32(best) / 255.0);
}
`;

const STYLE_SHADER = `${STYLE_COMMON}
@group(0) @binding(3) var asciiCells: texture_2d<f32>;
const GLYPHS = array<vec2u, ${ASCII_GLYPHS.length}>(
  ${ASCII_GLYPHS.map(rows => `vec2u(${rows.slice(0, 4).reduce((sum, row, i) => sum + row * 2 ** (i * 5), 0)}u, ${rows.slice(4).reduce((sum, row, i) => sum + row * 2 ** (i * 5), 0)}u)`).join(',\n  ')}
);
// A centered Bayer screen distributes quantization error across a stable 4×4 grid.
const THRESHOLDS = array<f32, 16>(
  0.03125, 0.53125, 0.15625, 0.65625, 0.78125, 0.28125, 0.90625, 0.40625,
  0.21875, 0.71875, 0.09375, 0.59375, 0.96875, 0.46875, 0.84375, 0.34375
);
fn glyphBit(glyph: u32, point: vec2i) -> f32 {
  if (any(point < vec2i(0)) || point.x >= 5 || point.y >= 7) { return 0.0; }
  let row = u32(point.y);
  let bits = select(GLYPHS[glyph].x, GLYPHS[glyph].y, row >= 4u);
  let shift = (row % 4u) * 5u + 4u - u32(point.x);
  return f32((bits >> shift) & 1u);
}
fn orderedDither(color: vec3f, background: vec3f, threshold: f32) -> vec3f {
  let residual = color - background;
  let levels = abs(residual) * 3.0;
  let quantized = (floor(levels) + step(vec3f(threshold), fract(levels))) / 3.0;
  return clamp(background + sign(residual) * quantized, vec3f(0.0), vec3f(1.0));
}
@fragment
fn fs_main(@builtin(position) pixel: vec4f) -> @location(0) vec4f {
  let cellPosition = pixel.xy / style.viewport.zw;
  let cell = vec2i(floor(cellPosition));
  if (style.mode.x < 1.5) {
    let color = sampleSource((vec2f(cell) + 0.5) * style.viewport.zw);
    let index = u32(cell.x % 4) * 4u + u32(cell.y % 4);
    return vec4f(orderedDither(color, style.background.rgb, THRESHOLDS[index]), 1.0);
  }
  let info = textureLoad(asciiCells, clamp(cell, vec2i(0), vec2i(textureDimensions(asciiCells)) - 1), 0);
  let glyph = min(u32(round(info.a * 255.0)), ${ASCII_GLYPHS.length - 1}u);
  // Integrate the compact glyph over each display pixel; keep subpixel strokes visible.
  let local = fract(cellPosition) * vec2f(6.0, 10.0) - vec2f(0.5, 1.5);
  let footprint = vec2f(6.0, 10.0) / style.viewport.zw;
  let low = local - footprint * 0.5;
  let high = local + footprint * 0.5;
  let origin = vec2i(floor(low));
  var coverage = 0.0;
  for (var y = 0; y < 3; y++) {
    for (var x = 0; x < 3; x++) {
      let point = origin + vec2i(x, y);
      let overlap = max(vec2f(0.0), min(high, vec2f(point + 1)) - max(low, vec2f(point)));
      coverage += glyphBit(glyph, point) * overlap.x * overlap.y;
    }
  }
  coverage /= footprint.x * footprint.y;
  return vec4f(mix(style.background.rgb, info.rgb, clamp(coverage, 0.0, 1.0)), 1.0);
}
`;

const FINISH_SHADER = `
struct PostParams {
  viewport: vec4f,
  bloomInfo: vec4f,
  finishing: vec4f,
  background: vec4f,
  temporal: vec4f,
  tint: vec4f,
}

@group(0) @binding(0) var sceneTexture: texture_2d<f32>;
@group(0) @binding(1) var bloomTexture: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> post: PostParams;

fn hash12(value: vec2f) -> f32 {
  let p = fract(value * vec2f(0.1031, 0.1030));
  let mixed = p + dot(p, p.yx + 33.33);
  return fract((mixed.x + mixed.y) * mixed.x);
}

@fragment
fn fs_main(@location(0) uv: vec2f, @builtin(position) pixel: vec4f) -> @location(0) vec4f {
  let background = post.background.rgb;
  // Scene and output have identical dimensions; never filter the sharp base image.
  var scene = textureLoad(sceneTexture, vec2i(pixel.xy), 0).rgb;

  if (post.finishing.z > 0.000001) {
    let aspect = post.viewport.x / max(post.viewport.y, 1.0);
    let centered = (uv - vec2f(0.5)) * vec2f(aspect, 1.0);
    let radius = clamp(length(centered) / 0.78, 0.0, 1.0);
    let radialDirection = centered / max(length(centered), 0.0001);
    let minResolution = min(post.viewport.x, post.viewport.y);
    let pixelOffset = radialDirection * (post.finishing.z * minResolution * radius * radius);
    let uvOffset = pixelOffset * post.viewport.zw;
    let positive = textureSampleLevel(sceneTexture, linearSampler, uv + uvOffset, 0.0).rgb;
    let negative = textureSampleLevel(sceneTexture, linearSampler, uv - uvOffset, 0.0).rgb;
    scene = vec3f(positive.r, scene.g, negative.b);
  }

  var foreground = scene - background;
  if (post.finishing.x > 0.0001) {
    let bloom = textureSampleLevel(bloomTexture, linearSampler, uv, 0.0);
    // A colored haze remains visible on white; protect the opaque facet colors underneath.
    let haloMask = 1.0 - smoothstep(0.04, 0.4, length(foreground));
    let haloOpacity = min(bloom.a * post.finishing.x * 1.8, 0.65) * haloMask;
    let haloColor = bloom.rgb / max(bloom.a, 0.00001);
    let lightForeground = mix(foreground, haloColor - background, haloOpacity);
    foreground = mix(foreground + bloom.rgb * post.finishing.x, lightForeground, post.finishing.w);
  }

  let signal = smoothstep(0.008, 0.18, length(foreground));
  if (post.finishing.y > 0.0001) {
    let grainSeed = floor(post.temporal.x * 60.0);
    let noise = hash12(floor(pixel.xy) + vec2f(grainSeed, grainSeed * 1.6180339)) - 0.5;
    foreground += vec3f(noise * post.finishing.y * signal);
  }

  return vec4f(clamp(background + foreground, vec3f(0.0), vec3f(1.0)), 1.0);
}
`;

const parseColor = (value, fallback) => {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value);
  const source = match || /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(fallback);
  return [parseInt(source[1], 16) / 255, parseInt(source[2], 16) / 255, parseInt(source[3], 16) / 255, 1];
};

const resolveQuality = canvas => {
  const memory = navigator.deviceMemory || 6;
  const cores = navigator.hardwareConcurrency || 6;
  const cssPixels = Math.max(1, canvas.clientWidth * canvas.clientHeight);
  if (canvas.clientWidth < 640 || memory <= 4 || cores <= 4) return 'low';
  if (cssPixels <= 360000 && memory >= 8 && cores >= 12) return 'high';
  return 'medium';
};

const resolveDpr = (preset, canvas) => {
  const cssPixels = Math.max(1, canvas.clientWidth * canvas.clientHeight);
  // The budget limits supersampling, never the one-pixel-per-CSS-pixel base image.
  const budgetDpr = Math.sqrt(preset.supersamplePixels / cssPixels);
  return Math.max(1, Math.min(window.devicePixelRatio || 1, preset.dpr, budgetDpr));
};

const resolveBloomSize = (size, qualityLevel = 0) => {
  const bloomScale = BLOOM_SCALES[qualityLevel] ?? BLOOM_SCALES[0];
  return [Math.max(1, Math.round(size[0] * bloomScale)), Math.max(1, Math.round(size[1] * bloomScale))];
};

const createRenderGraph = (gpu, outputSize, bloomSize = resolveBloomSize(outputSize)) => {
  const viewParams = uniforms(gpu, {
    viewport: [1, 0.0132, 1, 0],
    shape: [1, 1, 0.36, 0],
    effects: [1, 2, 1, 1.12],
    composition: [0, 0, 0, 1],
    transport: [0, 0, 0, 0],
    formation: [1, 0, 0, 0],
    gather: [0, 0, 0, 0],
    pointer: [0, 0, 0.54, 0],
    shock: [0, 0, 4, 0],
    shockB: [0, 0, 0, 0],
    shockC: [0, 0, 0, 0],
    shockD: [0, 0, 0, 0],
    material: [0.46, MATERIALS.pearl, 0.92, 0.54],
    light: [-0.321, 0.49, 0.845, 0],
    environment: [0, 0, 0, 0],
    baseColor: [137 / 255, 106 / 255, 189 / 255, 1],
    highlightColor: mixColor([168 / 255, 85 / 255, 247 / 255, 1], [1, 1, 1, 1], MATERIAL_PRESETS.pearl.highlightMix),
    accentColor: [168 / 255, 85 / 255, 247 / 255, 1]
  });
  const postParams = uniforms(gpu, {
    viewport: [outputSize[0], outputSize[1], 1 / outputSize[0], 1 / outputSize[1]],
    bloomInfo: [1 / bloomSize[0], 1 / bloomSize[1], 0.2, 0.12],
    finishing: [0.5, 0.05, 0.0075, 0],
    background: [0.071, 0.059, 0.09, 1],
    temporal: [0, 0, 0, 0],
    tint: [137 / 255, 106 / 255, 189 / 255, 1]
  });
  const shardDraw = draw(gpu, {
    shader: SHARD_SHADER,
    vertices: 6,
    blend: 'premultiplied',
    cull: 'none',
    depth: false,
    label: 'aero-shards-procedural'
  });
  shardDraw.set({ view: viewParams });
  const sceneTarget = target(gpu, {
    size: outputSize,
    format: 'rgba8unorm',
    label: 'aero-shards-scene'
  });
  const bloomTarget = target(gpu, {
    size: bloomSize,
    format: 'rgba16float',
    label: 'aero-shards-bloom'
  });
  const bloomScratchTarget = target(gpu, {
    size: bloomSize,
    format: 'rgba16float',
    label: 'aero-shards-bloom-scratch'
  });
  const linearSampler = sampler(gpu, {
    minFilter: 'linear',
    magFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge'
  });
  const bloomEffect = effect(gpu, BLOOM_SHADER, {
    label: 'aero-shards-bloom-prefilter',
    set: {
      sceneTexture: sceneTarget,
      sceneSampler: linearSampler,
      post: postParams
    }
  });
  const blurParamsX = uniforms(gpu, { direction: [1 / bloomSize[0], 0, 0, 0] });
  const blurParamsY = uniforms(gpu, { direction: [0, 1 / bloomSize[1], 0, 0] });
  const bloomBlurX = effect(gpu, BLOOM_BLUR_SHADER, {
    label: 'aero-shards-bloom-horizontal',
    set: { bloomTexture: bloomTarget, linearSampler, blur: blurParamsX }
  });
  const bloomBlurY = effect(gpu, BLOOM_BLUR_SHADER, {
    label: 'aero-shards-bloom-vertical',
    set: { bloomTexture: bloomScratchTarget, linearSampler, blur: blurParamsY }
  });
  const finishEffect = effect(gpu, FINISH_SHADER, {
    label: 'aero-shards-finish',
    set: {
      sceneTexture: sceneTarget,
      bloomTexture: bloomTarget,
      linearSampler,
      post: postParams
    }
  });
  // Disabled effects retain only tiny placeholders, not full-resolution render targets.
  const styleTarget = target(gpu, { size: [1, 1], format: 'rgba8unorm', label: 'aero-shards-style' });
  const asciiTarget = target(gpu, { size: [1, 1], format: 'rgba8unorm', label: 'aero-shards-ascii-cells' });
  const styleParams = uniforms(gpu, {
    viewport: [outputSize[0], outputSize[1], 6, 10],
    background: [0.071, 0.059, 0.09, 1],
    mode: [0, 0, 0, 0]
  });
  const asciiEffect = effect(gpu, ASCII_CELL_SHADER, {
    label: 'aero-shards-ascii-match',
    set: { sourceTexture: sceneTarget, sourceSampler: linearSampler, style: styleParams }
  });
  const styleEffect = effect(gpu, STYLE_SHADER, {
    label: 'aero-shards-style-resolve',
    set: { sourceTexture: sceneTarget, sourceSampler: linearSampler, style: styleParams, asciiCells: asciiTarget }
  });
  return {
    viewParams,
    postParams,
    shardDraw,
    sceneTarget,
    bloomTarget,
    bloomScratchTarget,
    bloomEffect,
    blurParamsX,
    blurParamsY,
    bloomBlurX,
    bloomBlurY,
    finishEffect,
    styleTarget,
    asciiTarget,
    styleParams,
    asciiEffect,
    styleEffect,
    styleSignature: ''
  };
};

const configureStyle = (graph, settings, outputSize, cssSize) => {
  const mode = settings.effect;
  const signature = [mode, ...outputSize, ...cssSize, ...settings.background].join('|');
  if (signature === graph.styleSignature) return;
  graph.styleSignature = signature;
  const cellWidth = ((mode === EFFECTS.ascii ? 3.6 : 1) * outputSize[0]) / Math.max(cssSize[0], 1);
  const cellHeight = ((mode === EFFECTS.ascii ? 6 : 1) * outputSize[1]) / Math.max(cssSize[1], 1);
  graph.styleTarget.resize(mode ? outputSize : [1, 1]);
  graph.asciiTarget.resize(
    mode === EFFECTS.ascii
      ? [Math.max(1, Math.ceil(outputSize[0] / cellWidth)), Math.max(1, Math.ceil(outputSize[1] / cellHeight))]
      : [1, 1]
  );
  graph.styleParams.set({
    viewport: [outputSize[0], outputSize[1], cellWidth, cellHeight],
    background: settings.background,
    mode: [mode, 0, 0, 0]
  });
  const source = mode ? graph.styleTarget : graph.sceneTarget;
  graph.bloomEffect.set({ sceneTexture: source });
  graph.finishEffect.set({ sceneTexture: source });
};

const prepareRenderGraph = async (graph, outputFormat) => {
  await Promise.all([
    graph.shardDraw.compile({ colors: [outputFormat] }),
    graph.shardDraw.compile(graph.sceneTarget),
    graph.bloomEffect.compile(graph.bloomTarget),
    graph.bloomBlurX.compile(graph.bloomScratchTarget),
    graph.bloomBlurY.compile(graph.bloomTarget),
    graph.finishEffect.compile({ colors: [outputFormat] }),
    graph.asciiEffect.compile(graph.asciiTarget),
    graph.styleEffect.compile(graph.styleTarget)
  ]);
};

export default function AeroShards({
  backgroundColor = '#120F17',
  shardColor = '#896ABD',
  accentColor = '#A855F7',
  placement = 'full',
  flow = 'stream',
  material = 'pearl',
  detail = 'balanced',
  effect = 'none',
  scale = 1,
  spread = 1,
  depth = 1,
  speed = 1,
  spin = 1,
  interaction = 'repel',
  density = 1.5,
  shardSize = 1.1,
  stretch = 1,
  turbulence = 1,
  glow = 1,
  edgeSoftness = 2,
  bloom = 0.5,
  grain = 0.05,
  chromaticAberration = 0.0075,
  transitionDuration = 1,
  interactionRadius = 1.5,
  interactionStrength = 0.5,
  rippleIntensity = 1,
  holdToGather = true,
  paused = false,
  className = '',
  onError
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const onErrorRef = useRef(onError);
  const settingsRef = useRef(null);
  const wakeRef = useRef(() => {});
  const pointerRef = useRef({
    raw: [0.5, 0.5],
    position: [0.5, 0.5],
    velocity: [0, 0],
    active: 0,
    presence: 0,
    presenceVelocity: 0,
    initialized: false
  });
  const ripplesRef = useRef(createRipples());
  const holdRef = useRef(createHold());
  const [ready, setReady] = useState(false);

  const resolvedMaterial = MATERIAL_PRESETS[material] || MATERIAL_PRESETS.pearl;
  const resolvedDetail = DETAIL_PRESETS[detail] || DETAIL_PRESETS.balanced;
  const resolvedEffect = EFFECTS[effect] ?? EFFECTS.none;
  // Stylized marks need enough screen area to resolve; preserve roughly the same field coverage.
  const effectDetail = resolvedEffect === EFFECTS.none ? 1 : 0.4;
  const effectSize = resolvedEffect === EFFECTS.none ? 1 : 1.75;
  const resolvedScale = clamp(scale, 0.5, 2.5);
  const resolvedBackground = parseColor(backgroundColor, '#120F17');
  const resolvedShardColor = parseColor(shardColor, '#896ABD');
  const resolvedAccentColor = parseColor(accentColor, '#A855F7');
  const resolvedSpread = clamp(spread, 0.15, 1.1);
  const resolvedDepth = clamp(depth, 0, 1.25);
  const resolvedSpeed = clamp(speed, 0, 2);
  const resolvedSpin = clamp(spin, 0, 2);
  const resolvedInteraction = INTERACTIONS[interaction] ?? INTERACTIONS.repel;
  const resolvedDensity = clamp(density, 0.5, 1.5);
  const resolvedShardSize = clamp(shardSize, 0.5, 1.5);
  const resolvedStretch = clamp(stretch, 0.6, 1.8);
  const resolvedTurbulence = clamp(turbulence, 0, 2);
  const resolvedGlow = clamp(glow, 0, 2);
  const resolvedEdgeSoftness = clamp(edgeSoftness, 0, 2);
  const resolvedBloom = clamp(bloom, 0, 3);
  const resolvedGrain = clamp(grain, 0, 0.12);
  const resolvedChromaticAberration = clamp(chromaticAberration, 0, 0.01);
  const resolvedTransitionDuration = clamp(transitionDuration, 0.2, 2);
  const resolvedInteractionRadius = clamp(interactionRadius, 0.5, 2);
  const resolvedInteractionStrength = clamp(interactionStrength, 0, 2);
  const backgroundLuma =
    resolvedBackground[0] * 0.2126 + resolvedBackground[1] * 0.7152 + resolvedBackground[2] * 0.0722;
  const lightBackground = clamp((backgroundLuma - 0.58) / 0.24, 0, 1);
  const lightSurface = lightBackground * lightBackground * (3 - 2 * lightBackground);

  settingsRef.current = {
    background: resolvedBackground,
    shard: resolvedShardColor,
    highlight: mixColor(resolvedAccentColor, [1, 1, 1, 1], resolvedMaterial.highlightMix),
    accent: resolvedAccentColor,
    composition: PLACEMENTS[placement] ?? PLACEMENTS.full,
    flow: FLOWS[flow] ?? FLOWS.stream,
    material: MATERIALS[material] ?? MATERIALS.pearl,
    effect: resolvedEffect,
    detailCount: resolvedDetail.count * resolvedDensity * effectDetail,
    shardSize: resolvedDetail.size * resolvedShardSize * effectSize,
    scale: resolvedScale,
    stretch: resolvedStretch * (1 + Math.min(resolvedSpeed * 0.34, 1.2) * 0.1),
    speed: resolvedSpeed,
    spin: resolvedSpin,
    turbulence: 0.36 * resolvedTurbulence,
    spread: resolvedSpread,
    depth: resolvedDepth,
    roughness: resolvedMaterial.roughness,
    brightness: resolvedMaterial.brightness,
    glow: resolvedMaterial.glow * resolvedGlow,
    edgeSoftness: resolvedEdgeSoftness,
    bloom: resolvedBloom,
    grain: resolvedGrain,
    // Keep RGB separation below the scale of the glyph strokes and dither screen.
    chromaticAberration: resolvedChromaticAberration * (resolvedEffect === EFFECTS.none ? 1 : 0.2),
    exposure: 1.12 + (0.96 - 1.12) * lightSurface,
    lightSurface,
    transitionDuration: resolvedTransitionDuration,
    interaction: resolvedInteraction,
    interactionRadius: (interaction === 'attract' ? 0.27 : 0.18) * resolvedInteractionRadius,
    interactionStrength: resolvedInteractionStrength,
    rippleIntensity: clamp(rippleIntensity, 0, 2),
    holdToGather,
    paused,
    signature: [
      backgroundColor,
      shardColor,
      accentColor,
      placement,
      flow,
      material,
      detail,
      effect,
      resolvedScale,
      resolvedSpread,
      resolvedDepth,
      resolvedSpeed,
      resolvedSpin,
      interaction,
      resolvedDensity,
      resolvedShardSize,
      resolvedStretch,
      resolvedTurbulence,
      resolvedGlow,
      resolvedEdgeSoftness,
      resolvedBloom,
      resolvedGrain,
      resolvedChromaticAberration,
      resolvedTransitionDuration,
      resolvedInteractionRadius,
      resolvedInteractionStrength,
      rippleIntensity,
      holdToGather,
      paused
    ].join('|')
  };
  const settingsSignature = settingsRef.current.signature;
  onErrorRef.current = onError;

  useEffect(() => {
    wakeRef.current();
  }, [settingsSignature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    resetPointerMotion(pointerRef.current);
    ripplesRef.current = createRipples();
    holdRef.current = createHold();

    let disposed = false;
    let runtimeFailed = false;
    let gpu;
    let animationFrameId = 0;
    let timeoutId = 0;
    let unsubscribeResize;
    let unsubscribeGpuError;
    let visibilityObserver;
    let resizeObserver;
    let visible = true;
    let visibilityRatio = 1;
    let needsRender = true;
    let interactionDeadline = 0;
    let settlingDeadline = 0;
    let bounds = root.getBoundingClientRect();
    let boundsDirty = false;
    let resumePending = true;
    let wakeRenderer = () => {
      needsRender = true;
    };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const reportFailure = error => {
      if (disposed || runtimeFailed) return;
      runtimeFailed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (timeoutId) window.clearTimeout(timeoutId);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      unsubscribeResize?.();
      unsubscribeGpuError?.();
      const failedGpu = gpu;
      gpu = undefined;
      failedGpu?.dispose();
      const resolved = error instanceof Error ? error : new Error(String(error));
      onErrorRef.current?.(resolved);
    };

    const updateBounds = () => {
      bounds = root.getBoundingClientRect();
      boundsDirty = false;
    };

    const pointFromClient = (clientX, clientY) => {
      if (boundsDirty) updateBounds();
      if (bounds.width <= 0 || bounds.height <= 0) return null;
      const x = (clientX - bounds.left) / bounds.width;
      const y = (clientY - bounds.top) / bounds.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return null;
      return [x, y];
    };

    const updatePointerTarget = next => {
      const pointer = pointerRef.current;
      if (!pointer.initialized || (!pointer.active && pointer.presence === 0)) {
        pointer.raw = [...next];
        pointer.position = [...next];
        pointer.presence = 0;
        resetPointerMotion(pointer);
        pointer.initialized = true;
      } else {
        pointer.raw[0] = next[0];
        pointer.raw[1] = next[1];
      }
      pointer.active = 1;
    };

    const deactivatePointer = () => {
      pointerRef.current.active = 0;
      holdRef.current.pointerId = null;
      const now = performance.now();
      interactionDeadline = now + 140;
      settlingDeadline = now + 680;
      wakeRenderer();
    };

    const handlePointerMove = event => {
      const settings = settingsRef.current;
      if (!event.isPrimary || !visible || settings.interaction === INTERACTIONS.none) return;
      const next = pointFromClient(event.clientX, event.clientY);
      if (!next) {
        const pointer = pointerRef.current;
        if (pointer.active || pointer.presence > 0) deactivatePointer();
        return;
      }
      updatePointerTarget(next);
      const now = performance.now();
      interactionDeadline = now + 140;
      settlingDeadline = now + 680;
      wakeRenderer();
    };

    const handlePointerDown = event => {
      const settings = settingsRef.current;
      if (!event.isPrimary || event.button !== 0 || !visible || settings.interaction === INTERACTIONS.none) return;
      // Never hijack links, form controls, or editable content layered above a background.
      if (
        event.target instanceof Element &&
        event.target.closest('a, button, input, textarea, select, [role="button"], [contenteditable="true"]')
      )
        return;
      const next = pointFromClient(event.clientX, event.clientY);
      if (!next) return;
      if (!settings.paused && !reduceMotion.matches && settings.speed > 0.0001) {
        startRipple(ripplesRef.current, next, bounds.width / Math.max(bounds.height, 1));
        if (settings.holdToGather) {
          holdRef.current.pointerId = event.pointerId;
          holdRef.current.elapsed = 0;
        }
      }
      updatePointerTarget(next);
      const now = performance.now();
      interactionDeadline = now + 220;
      settlingDeadline = now + 800;
      wakeRenderer();
    };

    const handlePointerEnd = event => {
      const hold = holdRef.current;
      if (hold.pointerId === event.pointerId) {
        hold.pointerId = null;
        const settings = settingsRef.current;
        if (
          hold.amount > 0.1 &&
          !settings.paused &&
          !reduceMotion.matches &&
          settings.interaction !== INTERACTIONS.none
        ) {
          startRipple(
            ripplesRef.current,
            pointerRef.current.raw,
            bounds.width / Math.max(bounds.height, 1),
            1 + hold.amount * 0.8
          );
        }
        wakeRenderer();
      }
      if (event.pointerType !== 'mouse') deactivatePointer();
    };

    const markBoundsDirty = () => {
      boundsDirty = true;
    };

    const handleVisibilityChange = () => {
      resumePending = true;
      holdRef.current.pointerId = null;
      resetPointerMotion(pointerRef.current);
      wakeRenderer();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerEnd, { passive: true });
    window.addEventListener('pointercancel', deactivatePointer, { passive: true });
    window.addEventListener('blur', deactivatePointer);
    window.addEventListener('scroll', markBoundsDirty, { passive: true, capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    reduceMotion.addEventListener('change', handleVisibilityChange);

    visibilityObserver = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        visibilityRatio = entry?.intersectionRatio ?? 1;
        visible = entry ? entry.isIntersecting && visibilityRatio >= 0.02 : true;
        if (visible) {
          resumePending = true;
        } else {
          interactionDeadline = 0;
          settlingDeadline = 0;
          const pointer = pointerRef.current;
          pointer.active = 0;
          pointer.presence = 0;
          holdRef.current.pointerId = null;
          resetPointerMotion(pointer);
        }
        wakeRenderer();
      },
      { threshold: [0, 0.02, 0.25] }
    );
    visibilityObserver.observe(root);

    void (async () => {
      try {
        setReady(false);
        const resolvedQuality = resolveQuality(canvas);
        const preset = QUALITY_PRESETS[resolvedQuality] || QUALITY_PRESETS.medium;
        gpu = await init({ powerPreference: 'low-power' });
        if (disposed) return gpu.dispose();
        unsubscribeGpuError = gpu.onError(reportFailure);

        const outputFormat = navigator.gpu.getPreferredCanvasFormat();
        const output = surface(gpu, canvas, {
          dpr: resolveDpr(preset, canvas),
          autoResize: false,
          format: outputFormat
        });
        const graph = createRenderGraph(gpu, output.size, resolveBloomSize([canvas.clientWidth, canvas.clientHeight]));
        await prepareRenderGraph(graph, outputFormat);
        if (disposed) return;

        let lastSettingsSignature = '';
        let previousRenderTimestamp = 0;
        let lastPresentationTimestamp = 0;
        let nextPresentationTimestamp = 0;
        let flowDistance = 0;
        let travelPhase = 0;
        let grainTime = 0;
        let firstFrame = true;
        const placementMotion = createFormation(settingsRef.current.composition);
        let layoutWeights = placementMotion.weights;
        let layoutTransitioning = false;
        const formation = createFormation(settingsRef.current.flow);
        let renderScale = settingsRef.current.scale;
        let runtimeQualityLevel = 0;
        let appliedBloomLevel = 0;
        let pendingBloomResize = false;
        let pressureStartedAt = 0;
        let stableStartedAt = performance.now();
        let lastQualityChange = 0;
        let encodeAverage = 0;
        let renderTimestamp = 0;
        let previousRafTimestamp = 0;
        let refreshInterval = 1000 / 60;
        const refreshSamples = new Float32Array(30);
        let refreshSampleCount = 0;
        let refreshSampleIndex = 0;

        const resolveFrameState = now => {
          const pointer = pointerRef.current;
          const pointerTransitioning = Math.abs(pointer.presence - pointer.active) > 0.004;
          if (
            now < interactionDeadline ||
            pointerTransitioning ||
            ripplesRef.current.some(ripple => ripple.strength > 0) ||
            layoutTransitioning ||
            holdRef.current.pointerId !== null ||
            holdRef.current.amount > 0 ||
            formation.weights[settingsRef.current.flow] < 1 ||
            Math.abs(settingsRef.current.scale - renderScale) > 0.001
          ) {
            return FRAME_STATES.interactive;
          }
          if (now < settlingDeadline) return FRAME_STATES.settling;
          if (visibilityRatio < 0.25) return FRAME_STATES.partial;
          return FRAME_STATES.ambient;
        };

        const resizePostTargets = (qualityLevel = appliedBloomLevel) => {
          const width = Math.max(1, output.size[0]);
          const height = Math.max(1, output.size[1]);
          const bloomSize = resolveBloomSize([canvas.clientWidth, canvas.clientHeight], qualityLevel);
          graph.sceneTarget.resize([width, height]);
          graph.bloomTarget.resize(bloomSize);
          graph.bloomScratchTarget.resize(bloomSize);
          graph.blurParamsX.set({ direction: [1 / bloomSize[0], 0, 0, 0] });
          graph.blurParamsY.set({ direction: [0, 1 / bloomSize[1], 0, 0] });
          graph.postParams.set({
            viewport: [width, height, 1 / width, 1 / height],
            bloomInfo: [1 / bloomSize[0], 1 / bloomSize[1], 0.2, 0.12]
          });
        };

        const resizeOutput = () => {
          updateBounds();
          const dpr = resolveDpr(preset, canvas);
          const nextSize = [
            Math.max(1, Math.round(canvas.clientWidth * dpr)),
            Math.max(1, Math.round(canvas.clientHeight * dpr))
          ];
          if (nextSize[0] !== output.size[0] || nextSize[1] !== output.size[1]) output.resize(nextSize);
          resizePostTargets();
        };

        unsubscribeResize = output.onResize(() => {
          resizePostTargets();
          needsRender = true;
          wakeRenderer();
        });
        resizeObserver = new ResizeObserver(() => {
          resizeOutput();
          wakeRenderer();
        });
        resizeObserver.observe(canvas);

        const setRuntimeQuality = (nextLevel, now, frameState) => {
          const clampedLevel = Math.max(0, Math.min(RUNTIME_QUALITY.length - 1, nextLevel));
          if (clampedLevel === runtimeQualityLevel) return;
          runtimeQualityLevel = clampedLevel;
          pressureStartedAt = 0;
          stableStartedAt = now;
          lastQualityChange = now;
          if (frameState === FRAME_STATES.interactive || frameState === FRAME_STATES.settling) {
            pendingBloomResize = true;
          } else {
            appliedBloomLevel = runtimeQualityLevel;
            pendingBloomResize = false;
            resizePostTargets();
          }
        };

        const renderFrame = currentFrame => {
          const settings = settingsRef.current;
          const frozen = settings.paused || reduceMotion.matches || settings.speed <= 0.0001;
          const elapsed =
            resumePending || !previousRenderTimestamp
              ? 0
              : Math.min(0.05, Math.max(0, (renderTimestamp - previousRenderTimestamp) / 1000));
          resumePending = false;
          previousRenderTimestamp = renderTimestamp;
          lastSettingsSignature = settings.signature;
          needsRender = false;

          if (!frozen) {
            flowDistance += elapsed * settings.speed * 0.34;
            grainTime += elapsed;
          }
          if (frozen) {
            renderScale = settings.scale;
          } else {
            renderScale += (settings.scale - renderScale) * (1 - Math.exp(-elapsed * 12));
          }

          advanceFormation(placementMotion, settings.composition, elapsed, settings.transitionDuration, frozen);
          layoutWeights = placementMotion.weights;
          layoutTransitioning = layoutWeights[settings.composition] !== 1;
          if (!frozen) {
            const travelAspect = output.size[0] / Math.max(output.size[1], 1);
            travelPhase =
              (travelPhase + (elapsed * settings.speed * 0.34) / resolvePathLength(travelAspect, layoutWeights)) % 1;
          }

          const pointer = pointerRef.current;
          advanceFormation(formation, settings.flow, elapsed, settings.transitionDuration, frozen);
          advanceHold(
            holdRef.current,
            elapsed,
            frozen || !settings.holdToGather || settings.interaction === INTERACTIONS.none
          );
          if (settings.interaction === INTERACTIONS.none) {
            pointer.active = 0;
            pointer.presence = 0;
            resetPointerMotion(pointer);
          } else if (frozen) {
            pointer.position = [...pointer.raw];
            pointer.presence = pointer.active;
            resetPointerMotion(pointer);
          } else if (pointer.initialized) {
            advancePointer(pointer, elapsed);
          }

          advanceRipples(ripplesRef.current, elapsed, frozen || settings.interaction === INTERACTIONS.none);

          const runtimeQuality = RUNTIME_QUALITY[runtimeQualityLevel];
          const activeCount = Math.max(
            700,
            Math.round(preset.count * settings.detailCount * runtimeQuality.countScale)
          );
          const densityCompensation = Math.pow(1 / runtimeQuality.countScale, 0.2);
          const shardWorldSize = 0.0125 * settings.shardSize * densityCompensation;
          const aspect = output.size[0] / Math.max(output.size[1], 1);
          const lightPresence = settings.interaction === INTERACTIONS.none ? 0 : pointer.presence;
          const pointerShiftX = (pointer.position[0] - 0.5) * 0.38 * lightPresence;
          const pointerShiftY = (pointer.position[1] - 0.5) * -0.24 * lightPresence;
          const lightX = -0.38 + pointerShiftX;
          const lightY = 0.58 + pointerShiftY;
          const lightLength = Math.hypot(lightX, lightY, 1);
          const interactionSign = settings.interaction === INTERACTIONS.attract ? 1 : -1;
          const interactionPresence =
            settings.interaction === INTERACTIONS.none
              ? 0
              : pointer.presence * settings.interactionStrength * interactionSign * (1 - holdRef.current.amount);
          const pointerWorldX = ((pointer.position[0] * 2 - 1) * aspect) / renderScale;
          const pointerWorldY = (1 - pointer.position[1] * 2) / renderScale;
          const inverseScale = 1 / renderScale;
          const rippleUniforms = ripplesRef.current.map(ripple => [
            (ripple.origin[0] * 2 - 1) * aspect * inverseScale,
            (1 - ripple.origin[1] * 2) * inverseScale,
            ripple.age,
            ripple.strength * settings.interactionStrength * settings.rippleIntensity * inverseScale
          ]);

          graph.viewParams.set({
            viewport: [aspect, shardWorldSize, renderScale, flowDistance],
            shape: [settings.spread, settings.depth, settings.turbulence, pointerShiftY],
            effects: [settings.spin, settings.edgeSoftness, settings.stretch, settings.exposure],
            composition: layoutWeights,
            transport: [travelPhase, Math.min(1, (1 - Math.max(...layoutWeights)) * 12), 0, 0],
            formation: formation.weights,
            gather: [pointerWorldX, pointerWorldY, holdRef.current.amount, holdRef.current.phase],
            pointer: [
              pointerWorldX,
              pointerWorldY,
              settings.interactionRadius * 2 * inverseScale,
              interactionPresence * inverseScale
            ],
            shock: rippleUniforms[0],
            shockB: rippleUniforms[1],
            shockC: rippleUniforms[2],
            shockD: rippleUniforms[3],
            material: [settings.roughness, settings.material, settings.brightness, settings.glow],
            light: [lightX / lightLength, lightY / lightLength, 1 / lightLength, pointerShiftX],
            environment: [settings.lightSurface, 0, 0, 0],
            baseColor: settings.shard,
            highlightColor: settings.highlight,
            accentColor: settings.accent
          });
          graph.postParams.set({
            finishing: [settings.bloom, settings.grain, settings.chromaticAberration, settings.lightSurface],
            background: settings.background,
            tint: mixColor(settings.shard, settings.accent, 0.4),
            temporal: [grainTime, 0, 0, 0]
          });

          configureStyle(graph, settings, output.size, [canvas.clientWidth, canvas.clientHeight]);

          const postEnabled =
            settings.effect !== EFFECTS.none ||
            settings.bloom > 0.0001 ||
            settings.grain > 0.0001 ||
            settings.chromaticAberration > 0.000001;

          if (!postEnabled) {
            currentFrame.pass({ target: output, clear: settings.background }, pass => {
              pass.draw(graph.shardDraw, { instances: activeCount });
            });
          } else {
            currentFrame.pass({ target: graph.sceneTarget, clear: settings.background }, pass => {
              pass.draw(graph.shardDraw, { instances: activeCount });
            });
            if (settings.effect === EFFECTS.ascii) {
              currentFrame.pass({ target: graph.asciiTarget, clear: [0, 0, 0, 0] }, pass => {
                pass.draw(graph.asciiEffect);
              });
            }
            if (settings.effect !== EFFECTS.none) {
              currentFrame.pass({ target: graph.styleTarget, clear: settings.background }, pass => {
                pass.draw(graph.styleEffect);
              });
            }
            if (settings.bloom > 0.0001) {
              currentFrame.pass({ target: graph.bloomTarget, clear: [0, 0, 0, 1] }, pass => {
                pass.draw(graph.bloomEffect);
              });
              currentFrame.pass({ target: graph.bloomScratchTarget, clear: [0, 0, 0, 1] }, pass => {
                pass.draw(graph.bloomBlurX);
              });
              currentFrame.pass({ target: graph.bloomTarget, clear: [0, 0, 0, 1] }, pass => {
                pass.draw(graph.bloomBlurY);
              });
            }
            currentFrame.pass({ target: output, clear: settings.background }, pass => {
              pass.draw(graph.finishEffect);
            });
          }

          if (firstFrame) {
            firstFrame = false;
            requestAnimationFrame(() => {
              if (!disposed) setReady(true);
            });
          }
        };

        const scheduleRaf = () => {
          if (disposed || runtimeFailed || animationFrameId || !visible || document.hidden) return;
          animationFrameId = requestAnimationFrame(scheduleFrame);
        };

        const scheduleSleep = targetTimestamp => {
          if (disposed || runtimeFailed || timeoutId || animationFrameId || !visible || document.hidden) return;
          const delay = Math.max(0, targetTimestamp - performance.now() - 10);
          timeoutId = window.setTimeout(() => {
            timeoutId = 0;
            scheduleRaf();
          }, delay);
        };

        const scheduleFrame = timestamp => {
          animationFrameId = 0;
          if (disposed || runtimeFailed || !visible || document.hidden) return;

          if (previousRafTimestamp) {
            const refreshSample = timestamp - previousRafTimestamp;
            if (refreshSample > 3 && refreshSample < 35) {
              refreshSamples[refreshSampleIndex] = refreshSample;
              refreshSampleIndex = (refreshSampleIndex + 1) % refreshSamples.length;
              refreshSampleCount = Math.min(refreshSampleCount + 1, refreshSamples.length);
              refreshInterval = refreshSamples[0];
              for (let index = 1; index < refreshSampleCount; index += 1) {
                refreshInterval = Math.min(refreshInterval, refreshSamples[index]);
              }
            }
          }
          previousRafTimestamp = timestamp;

          const settings = settingsRef.current;
          const settingsChanged = settings.signature !== lastSettingsSignature;
          const frozen = settings.paused || reduceMotion.matches || settings.speed <= 0.0001;
          if (frozen && !firstFrame && !settingsChanged && !needsRender) return;

          const forceFrame = firstFrame || settingsChanged || !lastPresentationTimestamp;
          const frameState = resolveFrameState(performance.now());
          const presentationInterval = resolveFrameInterval(frameState, refreshInterval);
          const cadenceDeadline = lastPresentationTimestamp + presentationInterval;
          const dueTimestamp = nextPresentationTimestamp
            ? Math.min(nextPresentationTimestamp, cadenceDeadline)
            : cadenceDeadline;
          if (!forceFrame && timestamp < dueTimestamp - 0.5) {
            if (frameState.continuous) scheduleRaf();
            else scheduleSleep(dueTimestamp);
            return;
          }

          if (pendingBloomResize && frameState !== FRAME_STATES.interactive && frameState !== FRAME_STATES.settling) {
            appliedBloomLevel = runtimeQualityLevel;
            pendingBloomResize = false;
            resizePostTargets();
          }

          const sincePresentation = lastPresentationTimestamp ? timestamp - lastPresentationTimestamp : Infinity;
          renderTimestamp = timestamp;
          const encodeStart = performance.now();
          try {
            frame(gpu, renderFrame);
          } catch (error) {
            reportFailure(error);
            return;
          }
          lastPresentationTimestamp = timestamp;

          const monitorNow = performance.now();
          const encodeDuration = monitorNow - encodeStart;
          encodeAverage = encodeAverage ? encodeAverage * 0.9 + encodeDuration * 0.1 : encodeDuration;
          const missedDeadline = Number.isFinite(sincePresentation) && sincePresentation > presentationInterval * 1.65;
          const underPressure = encodeAverage > 4 || missedDeadline;

          if (underPressure) {
            if (!pressureStartedAt) pressureStartedAt = monitorNow;
          } else {
            pressureStartedAt = 0;
          }
          if (underPressure || frameState !== FRAME_STATES.ambient) stableStartedAt = monitorNow;

          const sustainedPressure = pressureStartedAt > 0 && monitorNow - pressureStartedAt > 1800;
          const qualityCooldownComplete = monitorNow - lastQualityChange > 2200;
          if (runtimeQualityLevel < RUNTIME_QUALITY.length - 1 && qualityCooldownComplete && sustainedPressure) {
            setRuntimeQuality(runtimeQualityLevel + 1, monitorNow, frameState);
          } else if (
            runtimeQualityLevel > 0 &&
            frameState === FRAME_STATES.ambient &&
            !underPressure &&
            monitorNow - stableStartedAt > 15000 &&
            monitorNow - lastQualityChange > 15000
          ) {
            setRuntimeQuality(runtimeQualityLevel - 1, monitorNow, frameState);
          }

          const nextState = resolveFrameState(performance.now());
          // Carry fractional RAF deadlines so 90/144 Hz displays still average 60 fps.
          nextPresentationTimestamp = advanceFrameDeadline(
            timestamp,
            dueTimestamp,
            resolveFrameInterval(nextState, refreshInterval),
            forceFrame || nextState.continuous !== frameState.continuous
          );
          if (frozen) return;
          if (nextState.continuous) scheduleRaf();
          else scheduleSleep(nextPresentationTimestamp);
        };

        wakeRenderer = () => {
          needsRender = true;
          if (!animationFrameId) nextPresentationTimestamp = 0;
          if (timeoutId) {
            window.clearTimeout(timeoutId);
            timeoutId = 0;
          }
          scheduleRaf();
        };
        wakeRef.current = wakeRenderer;
        wakeRenderer();
      } catch (error) {
        reportFailure(error);
      }
    })();

    return () => {
      disposed = true;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', deactivatePointer);
      window.removeEventListener('blur', deactivatePointer);
      window.removeEventListener('scroll', markBoundsDirty, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      reduceMotion.removeEventListener('change', handleVisibilityChange);
      visibilityObserver?.disconnect();
      resizeObserver?.disconnect();
      unsubscribeResize?.();
      unsubscribeGpuError?.();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (timeoutId) window.clearTimeout(timeoutId);
      wakeRef.current = () => {};
      gpu?.dispose();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`aero-shards ${className}`}
      data-ready={ready}
      style={{ backgroundColor }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="aero-shards__canvas" />
    </div>
  );
}
