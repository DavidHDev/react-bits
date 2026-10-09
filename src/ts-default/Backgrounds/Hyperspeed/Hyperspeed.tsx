'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

import './Hyperspeed.css';

export type HyperspeedCurve = 'straight' | 'gentle' | 'winding' | 'hills' | 'racing' | 'deep';

export type HyperspeedProps = {
  curve?: HyperspeedCurve;
  curvature?: number;
  speed?: number;
  boost?: number;
  fov?: number;
  boostFov?: number;
  lanes?: number;
  roadWidth?: number;
  medianWidth?: number;
  density?: number;
  trailLength?: number;
  lightSize?: number;
  poles?: number;
  poleHeight?: number;
  dust?: number;
  glow?: number;
  reflections?: number;
  steer?: number;
  tailColors?: string[];
  headColors?: string[];
  poleColors?: string[];
  roadColor?: string;
  roadOpacity?: number;
  lineColor?: string;
  background?: string;
  theme?: 'dark' | 'light';
  interactive?: boolean;
  boosting?: boolean;
  onBoostStart?: () => void;
  onBoostEnd?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

type Vec3 = [number, number, number];

type Swatches = { value: THREE.Vector3[] };

type Palette = {
  background: string;
  road: string;
  lines: string;
  tail: string[];
  head: string[];
  poles: string[];
  dust: string;
};

type Settings = {
  light: boolean;
  curve: HyperspeedCurve;
  curvature: number;
  speed: number;
  boost: number;
  fov: number;
  boostFov: number;
  lanes: number;
  roadWidth: number;
  medianWidth: number;
  density: number;
  trailLength: number;
  lightSize: number;
  poles: number;
  poleHeight: number;
  dust: number;
  glow: number;
  reflections: number;
  steer: number;
  tailColors: string[];
  headColors: string[];
  poleColors: string[];
  roadColor: string;
  roadOpacity: number;
  lineColor: string;
  background: string;
  dustColor: string;
  interactive: boolean;
  boosting: boolean;
};

const TRAVEL = 400;
const MAX_CARS = 160;
const MAX_POLES = 80;
const MAX_DUST = 1500;
const MAX_COLORS = 8;
const CURVES: HyperspeedCurve[] = ['straight', 'gentle', 'winding', 'hills', 'racing', 'deep'];

const THEMES: Record<'dark' | 'light', Palette> = {
  dark: {
    background: 'transparent',
    road: '#08080a',
    lines: '#25252d',
    tail: ['#d856bf', '#6750a2', '#c247ac'],
    head: ['#03b3c3', '#0e5ea5', '#324555'],
    poles: ['#03b3c3'],
    dust: '#ffffff'
  },
  light: {
    background: 'transparent',
    road: '#efeff2',
    lines: '#d0d0d7',
    tail: ['#d856bf', '#6750a2', '#c247ac'],
    head: ['#03b3c3', '#0e5ea5', '#324555'],
    poles: ['#03b3c3'],
    dust: '#18181b'
  }
};

const BEND = /* glsl */ `
  uniform float uTime;
  uniform float uCurvature;
  uniform vec4 uCurveA;
  uniform float uCurveB;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uPixel;
  #define PI 3.14159265358979
  float nsin(float v) { return sin(v) * 0.5 + 0.5; }
  vec3 gentle(float p) {
    return vec3(
      cos(p * PI * 5.0 + uTime) * 25.0 - cos(0.02 * PI * 5.0 + uTime) * 25.0,
      sin(p * PI * 2.0 + PI * 0.5 + uTime) * 15.0 - sin(0.02 * PI * 2.0 + PI * 0.5 + uTime) * 15.0,
      0.0
    );
  }
  float windX(float p) { return cos(PI * p * 4.0 + uTime) * 25.0 + pow(cos(PI * p * 8.0 + uTime * 2.0), 2.0) * 5.0; }
  float windY(float p) { return -nsin(PI * p * 8.0 + uTime) * 10.0 - pow(nsin(PI * p + uTime / 8.0), 5.0) * 10.0; }
  vec3 winding(float p) { return vec3(windX(p) - windX(0.0125), windY(p) - windY(0.0125), 0.0); }
  vec3 hills(float p) {
    return vec3(
      cos(p * PI * 3.0 + uTime) * 30.0 - cos(0.02 * PI * 3.0 + uTime) * 30.0,
      nsin(p * PI * 6.0 + uTime) * 30.0 - nsin(0.02 * PI * 6.0 + uTime) * 30.0,
      nsin(p * PI * 10.0 + uTime) * 20.0 - nsin(0.02 * PI * 10.0 + uTime) * 20.0
    );
  }
  vec3 racing(float p) {
    return vec3(
      sin(p * PI * 2.0 + uTime) * 35.0 - sin(0.0125 * PI * 2.0 + uTime) * 35.0,
      sin(p * PI * 3.0 + uTime) * 10.0 - sin(0.0125 * PI * 3.0 + uTime) * 10.0,
      0.0
    );
  }
  float deepX(float p) { return sin(p * PI * 4.0 + uTime) * 10.0; }
  float deepY(float p) { return pow(abs(p * 10.0), 2.0) + sin(p * PI * 8.0 + uTime) * 20.0; }
  vec3 deep(float p) { return vec3(deepX(p) - deepX(0.02), deepY(p) - deepY(0.02), 0.0); }
  vec3 bend(float p) {
    vec3 d = gentle(p) * uCurveA.x + winding(p) * uCurveA.y + hills(p) * uCurveA.z + racing(p) * uCurveA.w + deep(p) * uCurveB;
    return d * uCurvature;
  }
`;

const STREAK_VERTEX = /* glsl */ `
  ${BEND}
  attribute vec4 aSeedA;
  attribute vec4 aSeedB;
  attribute float aPair;
  attribute float aTone;
  uniform float uTravel;
  uniform float uRoadX;
  uniform float uRoadWidth;
  uniform float uLanes;
  uniform float uDirection;
  uniform vec2 uSpeedRange;
  uniform float uTrail;
  uniform float uStretch;
  uniform float uSize;
  uniform float uRadiusScale;
  uniform float uMirror;
  uniform vec3 uColors[${MAX_COLORS}];
  uniform float uColorCount;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vColor;
  varying float vFog;
  varying float vAbove;
  varying float vThin;
  void main() {
    float laneWidth = uRoadWidth / uLanes;
    float lane = min(floor(aSeedA.x * uLanes), uLanes - 1.0);
    float laneX = (lane + 0.5) * laneWidth - uRoadWidth * 0.5 + (aSeedA.y - 0.5) * 0.5 * laneWidth;
    float carWidth = mix(0.3, 0.5, aSeedA.z) * laneWidth;
    float radius = mix(0.05, 0.14, aSeedA.w) * uSize;
    float len = mix(0.03, 0.2, aSeedB.x) * uTravel * uTrail * (1.0 + uStretch);
    float speed = mix(uSpeedRange.x, uSpeedRange.y, aSeedB.y) * uDirection;
    vec3 center = vec3(
      uRoadX + laneX + aPair * carWidth,
      aSeedB.w * 0.8 + radius * 1.3,
      position.z * len + len - mod(uTime * speed + aSeedB.z * uTravel, uTravel)
    );
    vAbove = center.y;
    center.y = mix(center.y, -center.y * 1.8, uMirror);
    center += bend(abs(center.z / uTravel));
    float depth = max(0.1, -(modelViewMatrix * vec4(center, 1.0)).z);
    float wanted = radius * uRadiusScale;
    float shown = max(wanted, depth * uPixel * 0.75);
    vThin = wanted / shown;
    vec3 p = center + vec3(position.x * shown, position.y * shown * mix(1.0, 2.2, uMirror), 0.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vec3 n = normal;
    n.y *= 1.0 - 2.0 * uMirror;
    vNormal = normalize(normalMatrix * n);
    vView = -mv.xyz;
    vUv = uv;
    vColor = uColors[int(min(floor(aTone * uColorCount), uColorCount - 1.0))];
    vFog = smoothstep(uFogNear, uFogFar, -mv.z);
  }
`;

const STREAK_FRAGMENT = /* glsl */ `
  uniform vec2 uFade;
  uniform float uIntensity;
  uniform float uSharp;
  uniform float uCore;
  uniform float uMirror;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vColor;
  varying float vFog;
  varying float vAbove;
  varying float vThin;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float alpha = pow(facing, uSharp) * smoothstep(uFade.x, uFade.y, vUv.x) * uIntensity * vThin * (1.0 - vFog);
    alpha *= mix(1.0, exp(-vAbove * 0.9), uMirror);
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(mix(vColor, vec3(1.0), pow(facing, 12.0) * uCore), min(alpha, 1.0));
  }
`;

const POLE_VERTEX = /* glsl */ `
  ${BEND}
  attribute vec4 aSeed;
  attribute float aIndex;
  attribute float aSide;
  uniform float uTravel;
  uniform float uCount;
  uniform float uEdge;
  uniform float uHeight;
  uniform float uRadiusScale;
  uniform float uMirror;
  uniform vec3 uColors[${MAX_COLORS}];
  uniform float uColorCount;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vColor;
  varying float vFog;
  varying float vAbove;
  varying float vHeight;
  varying float vThin;
  void main() {
    vHeight = position.y + 0.5;
    float width = mix(0.08, 0.22, aSeed.y);
    float height = mix(1.3, 1.9, aSeed.z) * uHeight;
    float spacing = uTravel / max(uCount, 1.0);
    vec3 center = vec3(
      aSide * uEdge,
      vHeight * height,
      -uTravel + mod(uTime * 120.0 + (aIndex + aSeed.x * 0.6) * spacing, uTravel)
    );
    vAbove = center.y;
    center.y = mix(center.y, -center.y * 1.6, uMirror);
    center += bend(abs(center.z / uTravel));
    float depth = max(0.1, -(modelViewMatrix * vec4(center, 1.0)).z);
    float wanted = width * uRadiusScale;
    float shown = max(wanted, depth * uPixel * 0.75);
    vThin = wanted / shown;
    vec3 p = center + vec3(position.x * shown, 0.0, position.z * shown);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vNormal = normalize(normalMatrix * normal);
    vView = -mv.xyz;
    vColor = uColors[int(min(floor(aSeed.w * uColorCount), uColorCount - 1.0))];
    vFog = smoothstep(uFogNear, uFogFar, -mv.z);
  }
`;

const POLE_FRAGMENT = /* glsl */ `
  uniform float uIntensity;
  uniform float uSharp;
  uniform float uCore;
  uniform float uMirror;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vColor;
  varying float vFog;
  varying float vAbove;
  varying float vHeight;
  varying float vThin;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float ends = smoothstep(0.0, 0.08, vHeight) * smoothstep(1.0, 0.9, vHeight);
    float alpha = pow(facing, uSharp) * ends * uIntensity * vThin * (1.0 - vFog);
    alpha *= mix(1.0, exp(-vAbove * 0.6), uMirror);
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(mix(vColor, vec3(1.0), pow(facing, 12.0) * uCore), min(alpha, 1.0));
  }
`;

const DUST_VERTEX = /* glsl */ `
  ${BEND}
  attribute vec4 aSeed;
  attribute float aEnd;
  uniform float uTravel;
  uniform float uStretch;
  uniform float uSpread;
  varying float vAlpha;
  void main() {
    float x = (aSeed.x - 0.5) * uSpread;
    float y = mix(1.0, 42.0, aSeed.y * aSeed.y);
    float speed = mix(140.0, 260.0, aSeed.w);
    float z = -uTravel + mod(uTime * speed + aSeed.z * uTravel, uTravel);
    float len = (0.6 + uStretch * 7.0) * mix(0.6, 1.4, aSeed.w);
    vec3 p = vec3(x, y, z + aEnd * len);
    p += bend(abs(p.z / uTravel));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = aEnd * (1.0 - smoothstep(uFogNear, uFogFar, -mv.z));
  }
`;

const DUST_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha * uIntensity);
  }
`;

const ROAD_VERTEX = /* glsl */ `
  ${BEND}
  uniform float uTravel;
  uniform float uWidth;
  varying vec2 vRoad;
  varying float vFog;
  void main() {
    vec3 p = position;
    p.x *= uWidth;
    vRoad = vec2(p.x, p.z);
    p += bend(abs(p.z / uTravel));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vFog = smoothstep(uFogNear, uFogFar, -mv.z);
  }
`;

const ROAD_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uRoadColor;
  uniform vec3 uLineColor;
  uniform vec3 uBackground;
  uniform float uRoadWidth;
  uniform float uMedian;
  uniform float uLanes;
  uniform float uTransparent;
  uniform float uOpacity;
  varying vec2 vRoad;
  varying float vFog;
  float stripe(float d, float w) {
    float aa = fwidth(d) * 1.2;
    return 1.0 - smoothstep(w - aa, w + aa, d);
  }
  void main() {
    float rx = abs(vRoad.x) - uMedian * 0.5;
    vec3 color = rx < 0.0 ? mix(uRoadColor, uLineColor, 0.12) : uRoadColor;
    if (rx >= 0.0) {
      float laneWidth = uRoadWidth / uLanes;
      float shoulder = max(stripe(abs(rx - 0.3), 0.07), stripe(abs(rx - (uRoadWidth - 0.3)), 0.07));
      float nearest = floor(rx / laneWidth + 0.5);
      float inner = step(0.5, nearest) * step(nearest, uLanes - 0.5);
      float dash = step(0.5, fract((vRoad.y - uTime * 120.0) / 14.0));
      float marks = max(shoulder, stripe(abs(rx - nearest * laneWidth), 0.06) * inner * dash);
      color = mix(color, uLineColor, marks);
    }
    float alpha = mix(1.0, 1.0 - vFog, uTransparent) * uOpacity;
    gl_FragColor = vec4(mix(color, uBackground, vFog * (1.0 - uTransparent)), alpha);
  }
`;

const QUAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const DOWN_FRAGMENT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uTexel;
  varying vec2 vUv;
  vec4 tap(vec2 offset) {
    return min(texture2D(uTexture, vUv + uTexel * offset), vec4(1.0));
  }
  void main() {
    vec4 sum = tap(vec2(0.0)) * 4.0 + tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0));
    gl_FragColor = sum * 0.125;
  }
`;

const TENT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uTexel;
  varying vec2 vUv;
  vec4 tent() {
    vec4 sum = texture2D(uTexture, vUv + uTexel * vec2(-1.0, 0.0));
    sum += texture2D(uTexture, vUv + uTexel * vec2(1.0, 0.0));
    sum += texture2D(uTexture, vUv + uTexel * vec2(0.0, -1.0));
    sum += texture2D(uTexture, vUv + uTexel * vec2(0.0, 1.0));
    sum += texture2D(uTexture, vUv + uTexel * vec2(-0.5, -0.5)) * 2.0;
    sum += texture2D(uTexture, vUv + uTexel * vec2(0.5, -0.5)) * 2.0;
    sum += texture2D(uTexture, vUv + uTexel * vec2(-0.5, 0.5)) * 2.0;
    sum += texture2D(uTexture, vUv + uTexel * vec2(0.5, 0.5)) * 2.0;
    return sum / 12.0;
  }
`;

const UP_FRAGMENT = /* glsl */ `
  ${TENT}
  void main() {
    gl_FragColor = tent();
  }
`;

const BLOOM_FRAGMENT = /* glsl */ `
  ${TENT}
  uniform float uStrength;
  uniform float uCeiling;
  uniform float uLight;
  void main() {
    vec4 color = tent() * uStrength;
    float peak = max(uLight > 0.5 ? color.a : max(color.r, max(color.g, color.b)), 0.0001);
    color *= uCeiling * (1.0 - exp(-peak / uCeiling)) / peak;
    gl_FragColor = uLight > 0.5 ? color : vec4(color.rgb, 0.0);
  }
`;

let colorContext: CanvasRenderingContext2D | null = null;

const toRgb = (color: string): Vec3 => {
  colorContext = colorContext ?? document.createElement('canvas').getContext('2d');
  if (!colorContext) return [1, 1, 1];
  colorContext.fillStyle = '#000000';
  colorContext.fillStyle = color;
  const value = String(colorContext.fillStyle);
  if (value.startsWith('#')) {
    const hex = parseInt(value.slice(1, 7), 16);
    return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
  }
  const parts = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
};

const fillPalette = (uniform: Swatches, count: { value: number }, colors: string[]) => {
  const list = colors.length ? colors : ['#ffffff'];
  for (let i = 0; i < MAX_COLORS; i++) uniform.value[i].fromArray(toRgb(list[i % list.length]));
  count.value = Math.min(list.length, MAX_COLORS);
};

const instanced = (source: THREE.BufferGeometry) => {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(source.index);
  Object.entries(source.attributes).forEach(([name, attribute]) => geometry.setAttribute(name, attribute));
  return geometry;
};

const nsin = (value: number) => Math.sin(value) * 0.5 + 0.5;
const windX = (q: number, t: number) => Math.cos(Math.PI * q * 4 + t) * 25 + Math.cos(Math.PI * q * 8 + t * 2) ** 2 * 5;
const windY = (q: number, t: number) => -nsin(Math.PI * q * 8 + t) * 10 - nsin(Math.PI * q + t / 8) ** 5 * 10;
const deepX = (q: number, t: number) => Math.sin(q * Math.PI * 4 + t) * 10;
const deepY = (q: number, t: number) => Math.abs(q * 10) ** 2 + Math.sin(q * Math.PI * 8 + t) * 20;

const curveShapes = (p: number, t: number): Vec3[] => {
  const { PI, cos, sin } = Math;
  return [
    [
      cos(p * PI * 5 + t) * 25 - cos(0.02 * PI * 5 + t) * 25,
      sin(p * PI * 2 + PI * 0.5 + t) * 15 - sin(0.02 * PI * 2 + PI * 0.5 + t) * 15,
      0
    ],
    [windX(p, t) - windX(0.0125, t), windY(p, t) - windY(0.0125, t), 0],
    [
      cos(p * PI * 3 + t) * 30 - cos(0.02 * PI * 3 + t) * 30,
      nsin(p * PI * 6 + t) * 30 - nsin(0.02 * PI * 6 + t) * 30,
      nsin(p * PI * 10 + t) * 20 - nsin(0.02 * PI * 10 + t) * 20
    ],
    [
      sin(p * PI * 2 + t) * 35 - sin(0.0125 * PI * 2 + t) * 35,
      sin(p * PI * 3 + t) * 10 - sin(0.0125 * PI * 3 + t) * 10,
      0
    ],
    [deepX(p, t) - deepX(0.02, t), deepY(p, t) - deepY(0.02, t), 0]
  ];
};

const lookShapes = (t: number, curvature: number): Vec3[] => {
  const p = 0.025;
  const [gentle, , hills, racing] = curveShapes(p, t);
  return [
    [gentle[0] * curvature * 2, gentle[1] * curvature * 0.4, -3],
    [(windX(p, t) - windX(p + 0.007, t)) * curvature * -2, (windY(p, t) - windY(p + 0.007, t)) * curvature * -5, -10],
    [hills[0] * curvature * 2, hills[1] * curvature * 2, hills[2] * curvature * 2 - 5],
    [racing[0] * curvature, racing[1] * curvature, -5],
    [(deepX(p, t) - deepX(p + 0.01, t)) * curvature * -2, (deepY(p, t) - deepY(p + 0.01, t)) * curvature * -4, -10]
  ];
};

const Hyperspeed = ({
  curve = 'winding',
  curvature = 1,
  speed = 1,
  boost = 3,
  fov = 90,
  boostFov = 130,
  lanes = 3,
  roadWidth = 10,
  medianWidth = 2,
  density = 40,
  trailLength = 1,
  lightSize = 1,
  poles = 20,
  poleHeight = 1,
  dust = 100,
  glow = 0.6,
  reflections = 0.5,
  steer = 0.35,
  tailColors,
  headColors,
  poleColors,
  roadColor,
  roadOpacity = 0.1,
  lineColor,
  background,
  theme = 'dark',
  interactive = true,
  boosting = false,
  onBoostStart,
  onBoostEnd,
  className = '',
  style
}: HyperspeedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const palette = THEMES[theme] ?? THEMES.dark;
  const settings: Settings = {
    light: theme === 'light',
    curve: CURVES.includes(curve) ? curve : 'winding',
    curvature: Math.max(0, curvature),
    speed: Math.max(0, speed),
    boost: Math.max(1, boost),
    fov: Math.min(170, Math.max(20, fov)),
    boostFov: Math.min(170, Math.max(20, boostFov)),
    lanes: Math.max(1, Math.round(lanes)),
    roadWidth: Math.max(1, roadWidth),
    medianWidth: Math.max(0, medianWidth),
    density: Math.min(MAX_CARS, Math.max(0, Math.round(density))),
    trailLength: Math.max(0.05, trailLength),
    lightSize: Math.max(0.1, lightSize),
    poles: Math.min(MAX_POLES, Math.max(0, Math.round(poles))),
    poleHeight: Math.max(0.1, poleHeight),
    dust: Math.min(MAX_DUST, Math.max(0, Math.round(dust))),
    glow: Math.max(0, glow),
    reflections: Math.max(0, reflections),
    steer: Math.max(0, steer),
    tailColors: tailColors?.length ? tailColors : palette.tail,
    headColors: headColors?.length ? headColors : palette.head,
    poleColors: poleColors?.length ? poleColors : palette.poles,
    roadColor: roadColor ?? palette.road,
    roadOpacity: Math.min(1, Math.max(0, roadOpacity)),
    lineColor: lineColor ?? palette.lines,
    background: background ?? palette.background,
    dustColor: palette.dust,
    interactive,
    boosting
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const callbacksRef = useRef({ onBoostStart, onBoostEnd });
  callbacksRef.current = { onBoostStart, onBoostEnd };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.autoClear = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(settingsRef.current.fov, 1, 0.1, 10000);
    camera.position.set(0, 8, -5);

    const shared = {
      uTime: { value: 0 },
      uCurvature: { value: 1 },
      uCurveA: { value: new THREE.Vector4() },
      uCurveB: { value: 0 },
      uFogNear: { value: TRAVEL * 0.22 },
      uFogFar: { value: TRAVEL * 0.95 },
      uTravel: { value: TRAVEL },
      uStretch: { value: 0 },
      uPixel: { value: 0.001 }
    };
    const disposables: { dispose: () => void }[] = [];
    const effectMaterials: THREE.ShaderMaterial[] = [];

    const material = (
      vertexShader: string,
      fragmentShader: string,
      uniforms: Record<string, THREE.IUniform>,
      options: THREE.ShaderMaterialParameters = {}
    ) => {
      const created = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { ...shared, ...uniforms },
        transparent: true,
        depthWrite: false,
        ...options
      });
      disposables.push(created);
      return created;
    };

    const swatches = (): Swatches => ({
      value: Array.from({ length: MAX_COLORS }, () => new THREE.Vector3(1, 1, 1))
    });

    const roadGeometry = new THREE.PlaneGeometry(1, TRAVEL, 1, 220);
    roadGeometry.rotateX(-Math.PI / 2);
    roadGeometry.translate(0, 0, -TRAVEL / 2);
    disposables.push(roadGeometry);
    const roadUniforms = {
      uWidth: { value: 1 },
      uRoadColor: { value: new THREE.Vector3() },
      uLineColor: { value: new THREE.Vector3() },
      uBackground: { value: new THREE.Vector3() },
      uRoadWidth: { value: 10 },
      uMedian: { value: 2 },
      uLanes: { value: 3 },
      uTransparent: { value: 0 },
      uOpacity: { value: 1 }
    };
    const roadMaterial = material(ROAD_VERTEX, ROAD_FRAGMENT, roadUniforms, { transparent: true, depthWrite: true });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.frustumCulled = false;
    road.renderOrder = 0;
    road.layers.enable(1);
    scene.add(road);

    const tube = new THREE.TubeGeometry(
      new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)),
      24,
      1,
      7,
      false
    );
    disposables.push(tube);

    const streakGroup = (direction: number, fade: [number, number], speedRange: [number, number]) => {
      const geometry = instanced(tube);
      const seedA = new Float32Array(MAX_CARS * 2 * 4);
      const seedB = new Float32Array(MAX_CARS * 2 * 4);
      const pair = new Float32Array(MAX_CARS * 2);
      const tone = new Float32Array(MAX_CARS * 2);
      for (let i = 0; i < MAX_CARS; i++) {
        const a = [Math.random(), Math.random(), Math.random(), Math.random()];
        const b = [Math.random(), Math.random(), Math.random(), Math.random() * Math.random()];
        const shade = Math.random();
        for (let side = 0; side < 2; side++) {
          const index = i * 2 + side;
          seedA.set(a, index * 4);
          seedB.set(b, index * 4);
          pair[index] = side ? 0.5 : -0.5;
          tone[index] = shade;
        }
      }
      geometry.setAttribute('aSeedA', new THREE.InstancedBufferAttribute(seedA, 4));
      geometry.setAttribute('aSeedB', new THREE.InstancedBufferAttribute(seedB, 4));
      geometry.setAttribute('aPair', new THREE.InstancedBufferAttribute(pair, 1));
      geometry.setAttribute('aTone', new THREE.InstancedBufferAttribute(tone, 1));
      geometry.instanceCount = 0;
      disposables.push(geometry);
      const uniforms = {
        uRoadX: { value: 0 },
        uRoadWidth: { value: 10 },
        uLanes: { value: 3 },
        uDirection: { value: direction },
        uSpeedRange: { value: new THREE.Vector2(...speedRange) },
        uTrail: { value: 1 },
        uSize: { value: 1 },
        uColors: swatches(),
        uColorCount: { value: 1 },
        uFade: { value: new THREE.Vector2(...fade) }
      };
      const layer = (radiusScale: number, sharp: number, mirror: number, order: number) => {
        const layerMaterial = material(
          STREAK_VERTEX,
          STREAK_FRAGMENT,
          {
            ...uniforms,
            uRadiusScale: { value: radiusScale },
            uSharp: { value: sharp },
            uMirror: { value: mirror },
            uIntensity: { value: 1 },
            uCore: { value: 0 }
          },
          { depthTest: !mirror }
        );
        effectMaterials.push(layerMaterial);
        const mesh = new THREE.Mesh(geometry, layerMaterial);
        mesh.frustumCulled = false;
        mesh.renderOrder = order;
        if (!mirror) mesh.layers.enable(1);
        scene.add(mesh);
        return layerMaterial;
      };
      return {
        geometry,
        uniforms,
        reflection: layer(2.1, 1.2, 1, 1),
        core: layer(1, 0.85, 0, 3)
      };
    };

    const tail = streakGroup(1, [0, 0.6], [60, 80]);
    const head = streakGroup(-1, [1, 0.4], [120, 160]);

    const cylinder = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
    disposables.push(cylinder);
    const poleGeometry = instanced(cylinder);
    const poleSeed = new Float32Array(MAX_POLES * 2 * 4);
    const poleIndex = new Float32Array(MAX_POLES * 2);
    const poleSide = new Float32Array(MAX_POLES * 2);
    for (let i = 0; i < MAX_POLES; i++) {
      for (let side = 0; side < 2; side++) {
        const index = i * 2 + side;
        poleSeed.set([Math.random(), Math.random(), Math.random(), Math.random()], index * 4);
        poleIndex[index] = i + (side ? 0.5 : 0);
        poleSide[index] = side ? 1 : -1;
      }
    }
    poleGeometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(poleSeed, 4));
    poleGeometry.setAttribute('aIndex', new THREE.InstancedBufferAttribute(poleIndex, 1));
    poleGeometry.setAttribute('aSide', new THREE.InstancedBufferAttribute(poleSide, 1));
    poleGeometry.instanceCount = 0;
    disposables.push(poleGeometry);
    const poleUniforms = {
      uCount: { value: 20 },
      uEdge: { value: 11 },
      uHeight: { value: 1 },
      uColors: swatches(),
      uColorCount: { value: 1 }
    };
    const poleLayer = (radiusScale: number, sharp: number, mirror: number, order: number) => {
      const layerMaterial = material(
        POLE_VERTEX,
        POLE_FRAGMENT,
        {
          ...poleUniforms,
          uRadiusScale: { value: radiusScale },
          uSharp: { value: sharp },
          uMirror: { value: mirror },
          uIntensity: { value: 1 },
          uCore: { value: 0 }
        },
        { depthTest: !mirror }
      );
      effectMaterials.push(layerMaterial);
      const mesh = new THREE.Mesh(poleGeometry, layerMaterial);
      mesh.frustumCulled = false;
      mesh.renderOrder = order;
      if (!mirror) mesh.layers.enable(1);
      scene.add(mesh);
      return layerMaterial;
    };
    const polesLayers = {
      reflection: poleLayer(2.4, 1.2, 1, 1),
      core: poleLayer(1, 0.8, 0, 3)
    };

    const dustGeometry = new THREE.BufferGeometry();
    const dustSeed = new Float32Array(MAX_DUST * 2 * 4);
    const dustEnd = new Float32Array(MAX_DUST * 2);
    for (let i = 0; i < MAX_DUST; i++) {
      const seed = [Math.random(), Math.random(), Math.random(), Math.random()];
      dustSeed.set(seed, i * 8);
      dustSeed.set(seed, i * 8 + 4);
      dustEnd[i * 2 + 1] = 1;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_DUST * 2 * 3), 3));
    dustGeometry.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 4));
    dustGeometry.setAttribute('aEnd', new THREE.BufferAttribute(dustEnd, 1));
    dustGeometry.setDrawRange(0, 0);
    disposables.push(dustGeometry);
    const dustUniforms = {
      uSpread: { value: 140 },
      uColor: { value: new THREE.Vector3(1, 1, 1) },
      uIntensity: { value: 0.5 }
    };
    const dustMaterial = material(DUST_VERTEX, DUST_FRAGMENT, dustUniforms);
    effectMaterials.push(dustMaterial);
    const dustLines = new THREE.LineSegments(dustGeometry, dustMaterial);
    dustLines.frustumCulled = false;
    dustLines.renderOrder = 4;
    scene.add(dustLines);

    const floatTargets =
      renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
    const levels = Array.from({ length: 5 }, (_, index) => {
      const target = new THREE.WebGLRenderTarget(1, 1, {
        type: floatTargets ? THREE.HalfFloatType : THREE.UnsignedByteType,
        depthBuffer: index === 0
      });
      disposables.push(target);
      return target;
    });
    const quadScene = new THREE.Scene();
    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeometry = new THREE.PlaneGeometry(2, 2);
    disposables.push(quadGeometry);
    const quad = new THREE.Mesh(quadGeometry);
    quad.frustumCulled = false;
    quadScene.add(quad);
    const blur = (fragmentShader: string, options: THREE.ShaderMaterialParameters) => {
      const created = new THREE.ShaderMaterial({
        vertexShader: QUAD_VERTEX,
        fragmentShader,
        uniforms: {
          uTexture: { value: null },
          uTexel: { value: new THREE.Vector2() },
          uStrength: { value: 1 },
          uCeiling: { value: 1 },
          uLight: { value: 0 }
        },
        depthTest: false,
        depthWrite: false,
        ...options
      });
      disposables.push(created);
      return created;
    };
    const downMaterial = blur(DOWN_FRAGMENT, { blending: THREE.NoBlending });
    const upMaterial = blur(UP_FRAGMENT, {
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneFactor
    });
    const bloomMaterial = blur(BLOOM_FRAGMENT, { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor });
    const pass = (
      passMaterial: THREE.ShaderMaterial,
      source: THREE.WebGLRenderTarget,
      target: THREE.WebGLRenderTarget | null
    ) => {
      quad.material = passMaterial;
      passMaterial.uniforms.uTexture.value = source.texture;
      passMaterial.uniforms.uTexel.value.set(1 / source.width, 1 / source.height);
      renderer.setRenderTarget(target);
      renderer.render(quadScene, quadCamera);
    };
    const clearColor = new THREE.Color();
    let clearAlpha = 0;

    const state = {
      boost: 0,
      held: false,
      boosted: false,
      fov: settingsRef.current.fov,
      fovVelocity: 0,
      steerX: 0,
      steerY: 0,
      pointerX: 0,
      pointerY: 0,
      weights: [0, 0, 0, 0, 0],
      visible: true
    };
    const keys = { tail: '', head: '', poles: '', surface: '', light: null as boolean | null };
    const lookTarget = new THREE.Vector3();
    let raf = 0;
    let last = performance.now();
    let alive = true;

    const syncColors = (s: Settings) => {
      const tailKey = s.tailColors.join();
      if (tailKey !== keys.tail) {
        keys.tail = tailKey;
        fillPalette(tail.uniforms.uColors, tail.uniforms.uColorCount, s.tailColors);
      }
      const headKey = s.headColors.join();
      if (headKey !== keys.head) {
        keys.head = headKey;
        fillPalette(head.uniforms.uColors, head.uniforms.uColorCount, s.headColors);
      }
      const poleKey = s.poleColors.join();
      if (poleKey !== keys.poles) {
        keys.poles = poleKey;
        fillPalette(poleUniforms.uColors, poleUniforms.uColorCount, s.poleColors);
      }
      const surfaceKey = [s.roadColor, s.lineColor, s.background, s.dustColor].join();
      if (surfaceKey !== keys.surface) {
        keys.surface = surfaceKey;
        roadUniforms.uRoadColor.value.fromArray(toRgb(s.roadColor));
        roadUniforms.uLineColor.value.fromArray(toRgb(s.lineColor));
        dustUniforms.uColor.value.fromArray(toRgb(s.dustColor));
        const transparent = s.background === 'transparent';
        const backdrop: Vec3 = transparent ? [0, 0, 0] : toRgb(s.background);
        roadUniforms.uBackground.value.fromArray(backdrop);
        roadUniforms.uTransparent.value = transparent ? 1 : 0;
        clearColor.setRGB(...backdrop, THREE.LinearSRGBColorSpace);
        clearAlpha = transparent ? 0 : 1;
      }
      if (keys.light !== s.light) {
        keys.light = s.light;
        effectMaterials.forEach(item => {
          item.blending = s.light ? THREE.NormalBlending : THREE.AdditiveBlending;
          item.needsUpdate = true;
        });
        bloomMaterial.blendDst = s.light ? THREE.OneMinusSrcAlphaFactor : THREE.OneFactor;
        bloomMaterial.blendSrcAlpha = s.light ? THREE.OneFactor : THREE.ZeroFactor;
        bloomMaterial.blendDstAlpha = s.light ? THREE.OneMinusSrcAlphaFactor : THREE.OneFactor;
        bloomMaterial.uniforms.uLight.value = s.light ? 1 : 0;
      }
    };

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      levels.forEach((target, index) =>
        target.setSize(
          Math.max(1, Math.round(width / 2 ** (index + 1))),
          Math.max(1, Math.round(height / 2 ** (index + 1)))
        )
      );
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      wake();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      syncColors(s);

      const wanted = (state.held && s.interactive) || s.boosting ? 1 : 0;
      state.boost += (wanted - state.boost) * (1 - Math.exp(-dt / (wanted > state.boost ? 0.28 : 0.85)));
      const pace = s.speed * (reduce ? 0.3 : 1) * (1 + (s.boost - 1) * state.boost);
      shared.uTime.value += dt * pace;
      shared.uStretch.value = state.boost * 1.1;
      shared.uCurvature.value = s.curvature;

      const target = CURVES.indexOf(s.curve) - 1;
      const blend = 1 - Math.exp(-dt / 0.6);
      state.weights = state.weights.map((weight, index) => weight + ((index === target ? 1 : 0) - weight) * blend);
      shared.uCurveA.value.set(state.weights[0], state.weights[1], state.weights[2], state.weights[3]);
      shared.uCurveB.value = state.weights[4];

      const halfRoad = s.roadWidth / 2 + s.medianWidth / 2;
      const surface = 0.45 + 0.55 * s.roadOpacity;
      [tail, head].forEach((group, index) => {
        group.geometry.instanceCount = s.density * 2;
        group.uniforms.uRoadX.value = index ? halfRoad : -halfRoad;
        group.uniforms.uRoadWidth.value = s.roadWidth;
        group.uniforms.uLanes.value = s.lanes;
        group.uniforms.uTrail.value = s.trailLength;
        group.uniforms.uSize.value = s.lightSize;
        group.core.uniforms.uIntensity.value = s.light ? 0.95 : 1 + 0.35 * state.boost;
        group.core.uniforms.uCore.value = s.light ? 0 : 0.75;
        group.reflection.uniforms.uIntensity.value = s.reflections * (s.light ? 0.22 : 0.42) * surface;
      });

      poleGeometry.instanceCount = s.poles * 2;
      poleUniforms.uCount.value = Math.max(1, s.poles);
      poleUniforms.uEdge.value = s.roadWidth + s.medianWidth / 2 + 0.8;
      poleUniforms.uHeight.value = s.poleHeight;
      polesLayers.core.uniforms.uIntensity.value = s.light ? 0.9 : 1;
      polesLayers.core.uniforms.uCore.value = s.light ? 0 : 0.6;
      polesLayers.reflection.uniforms.uIntensity.value = s.reflections * (s.light ? 0.2 : 0.38) * surface;

      dustGeometry.setDrawRange(0, s.dust * 2);
      dustUniforms.uIntensity.value = (s.light ? 0.35 : 0.45) * (1 + state.boost);
      dustUniforms.uSpread.value = (s.roadWidth * 2 + s.medianWidth) * 5;

      roadUniforms.uWidth.value = s.roadWidth * 2 + s.medianWidth + 3;
      roadUniforms.uRoadWidth.value = s.roadWidth;
      roadUniforms.uMedian.value = s.medianWidth;
      roadUniforms.uLanes.value = s.lanes;
      roadUniforms.uOpacity.value = s.roadOpacity;
      roadMaterial.depthWrite = s.roadOpacity > 0.5;

      const fovTarget = reduce ? s.fov : s.fov + (s.boostFov - s.fov) * state.boost;
      state.fovVelocity += ((fovTarget - state.fov) * 90 - state.fovVelocity * 13) * dt;
      state.fov += state.fovVelocity * dt;
      camera.fov = state.fov;
      shared.uPixel.value = (2 * Math.tan((state.fov * Math.PI) / 360)) / Math.max(1, renderer.domElement.height);

      const steerBlend = 1 - Math.exp(-dt / 0.35);
      const follow = s.interactive ? s.steer : 0;
      state.steerX += (state.pointerX * follow - state.steerX) * steerBlend;
      state.steerY += (state.pointerY * follow - state.steerY) * steerBlend;
      camera.position.set(state.steerX * s.roadWidth * 0.45, 8 - state.steerY * 2.5, -5);

      const looks = lookShapes(shared.uTime.value, s.curvature);
      const straight = 1 - state.weights.reduce((sum, weight) => sum + weight, 0);
      lookTarget.set(0, 0, -10 * straight);
      looks.forEach((look, index) => {
        lookTarget.x += look[0] * state.weights[index];
        lookTarget.y += look[1] * state.weights[index];
        lookTarget.z += look[2] * state.weights[index];
      });
      lookTarget.x += state.steerX * 2.5;
      lookTarget.add(camera.position);
      camera.lookAt(lookTarget);
      camera.updateProjectionMatrix();

      renderer.setRenderTarget(null);
      renderer.setClearColor(clearColor, clearAlpha);
      renderer.clear();
      renderer.render(scene, camera);

      if (s.glow > 0) {
        const pixel = shared.uPixel.value;
        shared.uPixel.value = pixel * (renderer.domElement.height / levels[0].height);
        camera.layers.set(1);
        roadMaterial.colorWrite = false;
        renderer.setRenderTarget(levels[0]);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.render(scene, camera);
        roadMaterial.colorWrite = true;
        camera.layers.set(0);
        shared.uPixel.value = pixel;
        for (let i = 1; i < levels.length; i++) pass(downMaterial, levels[i - 1], levels[i]);
        for (let i = levels.length - 1; i > 1; i--) pass(upMaterial, levels[i], levels[i - 1]);
        bloomMaterial.uniforms.uStrength.value = s.glow * (s.light ? 0.5 : 1.4);
        bloomMaterial.uniforms.uCeiling.value = s.glow * (s.light ? 0.3 : 0.5);
        pass(bloomMaterial, levels[1], null);
      }

      if (state.visible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !alive || !state.visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const setHeld = (held: boolean) => {
      if (state.held === held) return;
      state.held = held;
      if (!settingsRef.current.interactive) return;
      if (held) callbacksRef.current.onBoostStart?.();
      else callbacksRef.current.onBoostEnd?.();
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      setHeld(true);
    };
    const onUp = () => setHeld(false);
    const onMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      state.pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      state.pointerY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };
    const onLeave = () => {
      state.pointerX = 0;
      state.pointerY = 0;
    };
    const onMenu = (event: MouseEvent) => {
      if (settingsRef.current.interactive) event.preventDefault();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const visibility = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      if (state.visible) wake();
    });
    visibility.observe(container);
    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerleave', onLeave);
    container.addEventListener('contextmenu', onMenu);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onUp);
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      visibility.disconnect();
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('contextmenu', onMenu);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onUp);
      disposables.forEach(item => item.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className={`hyperspeed${className ? ` ${className}` : ''}`} style={style} />;
};

export default Hyperspeed;
