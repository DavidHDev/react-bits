export const BACKGROUND_LIGHT_PROPS = {
  'aero-shards': { lightMode: true, shardColor: '#7c5cbf', accentColor: '#a855f7' },
  'acid-squares': { lightMode: true, color: '#ffffff', accentColor: '#ec4899', secondaryColor: '#4f46e5' },
  antigravity: { lightMode: true },
  aurora: { lightMode: true },
  balatro: { lightMode: true },
  ballpit: { colors: ['#18181b'] },
  beams: { lightMode: true },
  'crt-warp': { lightMode: true, color: '#7c3aed', backgroundColor: '#ffffff', bloom: 0.6, noise: 0.05 },
  'color-bends': { lightMode: true, color: '#6d28d9', intensity: 1.2, noise: 0.08 },
  'dark-veil': { lightMode: true },
  dither: { waveColor: '#9e9e9e', backgroundColor: '#ffffff' },
  'dot-field': { lightMode: true },
  'dot-grid': { baseColor: '#d4d4d8', activeColor: '#18181b', glow: 0.25 },
  'evil-eye': { lightMode: true, eyeColor: '#c2410c', backgroundColor: '#ffffff', glowIntensity: 0.22 },
  'faulty-terminal': { lightMode: true, tint: '#166534', brightness: 0.6 },
  ferrofluid: { lightMode: true },
  'flux-lines': { lightMode: true },
  'floating-lines': { lightMode: true },
  galaxy: { lightMode: true },
  'gradient-blinds': { lightMode: true, gradientColors: ['#be185d', '#5b21b6'], noise: 0.28 },
  'gradient-waves': { lightMode: true, horizonColor: '#8b5cf6', waveColor: '#e879f9', crestColor: '#f5d0fe' },
  'ghost-fibers': { lightMode: true, glowColor: '#7c3aed', lineColor: '#4c1d95', secondaryColor: '#a78bfa' },
  'gradient-ascii': { lightMode: true, colors: ['#4f8ff7', '#e8f0ff', '#b4d0ff', '#7cb4fb'] },
  grainient: { lightMode: true },
  'grid-distortion': { imageSrc: '/assets/demo/day-landscape.webp' },
  'grid-motion': { theme: 'light' },
  'grid-scan': { lightMode: true, linesColor: '#d4d4d8', scanColor: '#0284c7' },
  hyperspeed: { theme: 'light', roadColor: '#efeff2', lineColor: '#d0d0d7' },
  iridescence: { color: '#ffffff' },
  'letter-glitch': { lightMode: true, glitchColors: ['#18181b', '#0f9f6e'], baseColor: '#18181b' },
  'light-pillar': {
    lightMode: true,
    topColor: '#6d28d9',
    bottomColor: '#ec4899',
    intensity: 1.15,
    mixBlendMode: 'normal'
  },
  'light-rays': { lightMode: true, raysColor: '#6d28d9', saturation: 0.75, lightSpread: 0.38 },
  'light-tunnel': { lightMode: true },
  lightfall: { lightMode: true, colors: ['#52525b'], backgroundColor: '#ffffff', backgroundGlow: 0 },
  lightning: { lightMode: true },
  'line-waves': { lightMode: true },
  'liquid-chrome': { lightMode: true },
  'liquid-ether': { lightMode: true },
  'magic-rings': { theme: 'light', color: '#7C3AED', colorTwo: '#4F46E5' },
  'magnet-lines': { lineColor: '#27272a' },
  'molten-metal': { lightMode: true, colors: ['#8b5cf6', '#c026d3'], coreColor: '#7e22ce' },
  orb: { backgroundColor: '#ffffff', hue: 275 },
  particles: { lightMode: true },
  'pixel-blast': { lightMode: true, color: '#6D28D9', accentColor: '#6D28D9' },
  'pixel-snow': { lightMode: true, color: '#7f9cc4' },
  plasma: { lightMode: true },
  'plasma-wave': { lightMode: true, colors: ['#8B2CFF', '#00CFF5'] },
  prism: { lightMode: true },
  'prismatic-burst': { lightMode: true, intensity: 1.15, colors: ['#7c3aed', '#4338ca', '#0e7490'] },
  radar: { lightMode: true, color: '#0a9f5f' },
  'ripple-grid': { lightMode: true },
  scanner: { lightMode: true, color1: '#5b21b6', color2: '#be185d', color3: '#18181b' },
  'shape-grid': { lineColor: '#e4e4e7', hoverColor: '#18181b', hoverFillColor: '#18181b' },
  'side-rays': { lightMode: true, rayColor1: '#f59e0b', rayColor2: '#60a5fa' },
  silk: { lightMode: true, color: '#5227FF', noiseIntensity: 1.35 },
  'sliced-waves': { lightMode: true, color1: '#ff9d4d', color2: '#ff2d78', color3: '#3060ff' },
  'soft-aurora': { lightMode: true },
  threads: { color: '#52525b' },
  topography: { lightMode: true, color: '#2554d8' },
  waves: { lightMode: true, accentColor: '#18181b' },
  'web-threads': {
    lightMode: true,
    colors: ['#6d28d9', '#ec4899'],
    glow: 0.018,
    brightness: 0.82,
    grain: 0.015
  }
};

export const STUDIO_DARK_PROPS = {
  'micro-slats': { backgroundColor: '#120f17' },
  'pattern-waves': { backgroundColor: '#120f17' },
  'shape-waves': { backgroundColor: '#120f17' }
};

export const STUDIO_LIGHT_PROPS = {
  'click-spark': { sparkColor: '#18181b' },
  'ghost-cursor': { theme: 'light', color: '#8b6fb3' },
  'laser-flow': { theme: 'light' },
  'magnet-lines': { accentColor: '#18181b' },
  'micro-slats': { glintColor: '#6B21A8', backgroundColor: '#ffffff' },
  noise: { blendMode: 'multiply' },
  'pattern-waves': { color: '#18181b', backgroundColor: '#ffffff' },
  'shape-waves': { color: '#8a8a8a', hoverColor: '#18181b', backgroundColor: '#ffffff' }
};

export const getBackgroundLightProps = () => {
  if (typeof window === 'undefined') return null;
  const [, category, slug] = window.location.pathname.split('/');
  return category?.toLowerCase() === 'backgrounds' ? BACKGROUND_LIGHT_PROPS[slug?.toLowerCase()] || null : null;
};
