const ease = t => t * t * (3 - 2 * t);

export const morphCycle = morph => (Math.max(0, morph.hold ?? 0.8) + Math.max(0.05, morph.duration ?? 1.6)) * 2;

export const morphPhase = (elapsed, morph) => {
  const hold = Math.max(0, morph.hold ?? 0.8);
  const duration = Math.max(0.05, morph.duration ?? 1.6);
  const total = (hold + duration) * 2;
  const s = ((elapsed % total) + total) % total;
  if (s < hold) return 0;
  if (s < hold + duration) return ease((s - hold) / duration);
  if (s < hold * 2 + duration) return 1;
  return 1 - ease((s - hold * 2 - duration) / duration);
};
