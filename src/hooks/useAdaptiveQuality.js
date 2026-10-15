import { useEffect, useRef, useState } from 'react';

export const QUALITY_STEPS = [
  { dpr: 1.5, quality: 'medium', lite: false },
  { dpr: 1.25, quality: 'medium', lite: false },
  { dpr: 1, quality: 'medium', lite: false },
  { dpr: 0.75, quality: 'low', lite: false },
  { dpr: 0.6, quality: 'low', lite: true }
];

const STORAGE_KEY = 'rb-landing-quality';
const WINDOW = 60;
const SLOW_FRAME_MS = 24;
const WARMUP_MS = 1500;
const STABLE_WINDOWS = 3;
const LAST = QUALITY_STEPS.length - 1;

const startLevel = () => {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = Number(sessionStorage.getItem(STORAGE_KEY));
    if (stored > 0) return Math.min(LAST, stored);
  } catch {
    return 0;
  }
  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  if (cores <= 2 || memory <= 2) return LAST;
  if (window.matchMedia?.('(prefers-reduced-transparency: reduce)').matches) return LAST;
  return 0;
};

export default function useAdaptiveQuality(active) {
  const [level, setLevel] = useState(startLevel);
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(level));
    } catch {
      return;
    }
  }, [level]);

  useEffect(() => {
    if (QUALITY_STEPS[level].lite) document.documentElement.setAttribute('data-lite', '');
  }, [level]);

  useEffect(() => {
    if (!active || levelRef.current >= LAST) return undefined;
    let frame = 0;
    let last = 0;
    let good = 0;
    let samples = [];
    const began = performance.now();
    const tick = now => {
      if (document.hidden) {
        last = 0;
        samples = [];
      } else {
        if (last && now - began > WARMUP_MS) samples.push(now - last);
        last = now;
      }
      if (samples.length >= WINDOW) {
        const median = samples.slice().sort((a, b) => a - b)[WINDOW >> 1];
        samples = [];
        if (median > SLOW_FRAME_MS) {
          good = 0;
          const next = Math.min(levelRef.current + 1, LAST);
          levelRef.current = next;
          setLevel(next);
          if (next >= LAST) return;
        } else if (++good >= STABLE_WINDOWS) {
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return QUALITY_STEPS[level];
}
