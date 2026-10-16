export const LOOK_GROUPS = [
  { id: 'type', label: 'Type' },
  { id: 'print', label: 'Print' },
  { id: 'pixel', label: 'Pixel' },
  { id: 'art', label: 'Art' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'glass', label: 'Glass' },
  { id: 'light', label: 'Light and color' },
  { id: 'material', label: 'Material' },
  { id: 'signal', label: 'Signal' },
  { id: 'film', label: 'Film' },
  { id: 'blur', label: 'Blur' },
  { id: 'motion', label: 'Motion' },
  { id: 'distort', label: 'Distort' }
];

export const LOOKS = [
  {
    id: 'soft-type',
    name: 'Soft type',
    group: 'type',
    tags: 'ascii glyphs blur dreamy',
    primary: 2,
    layers: [
      { type: 'blur', params: { mode: 'gaussian', amount: 5 } },
      { type: 'adjust', params: { exposure: -0.45 } },
      {
        type: 'ascii',
        params: {
          charset: 'letters',
          size: 9.5,
          weight: 'regular',
          behind: 'color',
          color: 'image',
          lift: 0.5,
          opacity: 0.95,
          coverage: 0.32,
          threshold: 0.42,
          fade: 0.7,
          depth: 0.35,
          glow: 0.7,
          spread: 0.65,
          twinkle: 0.3,
          flicker: 0.04,
          contrast: 1.1,
          background: '#000000'
        }
      },
      { type: 'grain', params: { amount: 0.14, size: 1.2, chroma: 0.1, motion: 1 } }
    ]
  },
  {
    id: 'terminal',
    name: 'Terminal',
    group: 'type',
    layers: [
      {
        type: 'ascii',
        params: {
          charset: 'standard',
          size: 8,
          color: 'ink',
          ink: '#8dffb0',
          background: '#050806',
          contrast: 1.35,
          flicker: 0.35
        }
      },
      { type: 'bloom', params: { threshold: 0.25, intensity: 0.9, radius: 0.75, tint: '#8dffb0' } },
      {
        type: 'crt',
        params: { curvature: 0.18, scan: 0.35, mask: 'none', glow: 0.25, vignette: 0.45, roll: 0.25, flicker: 0.15 }
      }
    ]
  },
  {
    id: 'color-type',
    name: 'Color type',
    group: 'type',
    layers: [
      {
        type: 'ascii',
        params: {
          charset: 'dense',
          size: 8,
          color: 'image',
          background: '#09080c',
          backdrop: 0.2,
          contrast: 1.3,
          flicker: 0.2
        }
      }
    ]
  },
  {
    id: 'matrix',
    name: 'Rain',
    group: 'type',
    layers: [
      {
        type: 'ascii',
        params: {
          charset: 'matrix',
          size: 9,
          color: 'gradient',
          ink: '#0b5c2c',
          accent: '#b9ffd4',
          background: '#020403',
          contrast: 1.4,
          rain: 0.85,
          flicker: 0.45
        }
      },
      { type: 'bloom', params: { threshold: 0.3, intensity: 0.8, tint: '#9dffc2' } }
    ]
  },
  {
    id: 'braille',
    name: 'Braille',
    group: 'type',
    layers: [
      {
        type: 'ascii',
        params: {
          charset: 'braille',
          size: 14,
          color: 'ink',
          ink: '#f2efe8',
          background: '#111014',
          contrast: 1.25,
          flicker: 0.15
        }
      }
    ]
  },
  {
    id: 'outline-type',
    name: 'Outline type',
    group: 'type',
    layers: [
      {
        type: 'ascii',
        params: {
          charset: 'minimal',
          size: 8,
          color: 'ink',
          ink: '#e9e4da',
          background: '#0d0c11',
          edges: 0.65,
          contrast: 1.2,
          flicker: 0.1
        }
      }
    ]
  },
  {
    id: 'blocks',
    name: 'Blocks',
    group: 'type',
    tags: 'ascii quadrant terminal pixel',
    layers: [
      { type: 'ascii', params: { charset: 'blocks', size: 9, behind: 'color', background: '#09090b', contrast: 1.15 } }
    ]
  },
  {
    id: 'dot-matrix',
    name: 'Dot matrix',
    group: 'type',
    tags: 'ascii dots halftone',
    layers: [
      { type: 'ascii', params: { charset: 'dots', size: 10, behind: 'color', background: '#0a090d', glow: 0.35 } }
    ]
  },
  {
    id: 'diamonds',
    name: 'Diamonds',
    group: 'type',
    tags: 'ascii jewel glyphs',
    layers: [
      { type: 'ascii', params: { charset: 'diamonds', size: 11, behind: 'color', background: '#0b0a0e', glow: 0.25 } }
    ]
  },
  {
    id: 'crosses',
    name: 'Crosses',
    group: 'type',
    tags: 'ascii plus cross stitch',
    layers: [
      { type: 'ascii', params: { charset: 'crosses', size: 11, behind: 'color', background: '#0b0a0e', glow: 0.3 } }
    ]
  },
  {
    id: 'strokes',
    name: 'Strokes',
    group: 'type',
    tags: 'ascii diagonal slashes',
    layers: [
      {
        type: 'ascii',
        params: {
          charset: 'strokes',
          size: 9,
          behind: 'color',
          background: '#0b0a0e',
          lift: 0.2,
          glow: 0.45,
          contrast: 1.3
        }
      }
    ]
  },
  {
    id: 'barcode',
    name: 'Barcode',
    group: 'type',
    tags: 'ascii lines vertical',
    layers: [
      { type: 'ascii', params: { charset: 'lines', size: 11, behind: 'color', background: '#0a090d', glow: 0.2 } }
    ]
  },
  {
    id: 'studio',
    name: 'Studio',
    group: 'type',
    tags: 'ascii palette poster',
    layers: [
      {
        type: 'ascii',
        params: {
          charset: 'dense',
          size: 6.5,
          behind: 'color',
          background: '#050507',
          color: 'palette',
          palette: 'dusk',
          glow: 0.45,
          contrast: 1.3
        }
      }
    ]
  },
  {
    id: 'mixed-glyphs',
    name: 'Mixed glyphs',
    group: 'type',
    tags: 'ascii blocks symbols',
    layers: [
      { type: 'ascii', params: { charset: 'mixed', size: 8, behind: 'color', background: '#08080a', contrast: 1.25 } }
    ]
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    group: 'type',
    tags: 'ascii paper ink print',
    layers: [
      {
        type: 'ascii',
        blend: 'normal',
        params: {
          charset: 'standard',
          size: 7.5,
          weight: 'bold',
          behind: 'color',
          background: '#efe9dc',
          color: 'ink',
          ink: '#1c1a19',
          invert: true,
          contrast: 1.6,
          brightness: 0.06,
          spread: 1.4,
          flicker: 0
        }
      },
      { type: 'paper', params: { paper: '#ffffff', shadow: '#d9d2c4', wrinkles: 0.5, folds: 0.25, drops: 0.15 } }
    ]
  },
  {
    id: 'newsprint',
    name: 'Newsprint',
    group: 'print',
    layers: [
      {
        type: 'halftone',
        params: { mode: 'mono', size: 6, angle: 45, paper: '#ece6d9', ink: '#1c1b1e', contrast: 1.25, rough: 0.45 }
      },
      { type: 'grain', params: { amount: 0.18, size: 0.9, chroma: 0, motion: 0.6 } }
    ]
  },
  {
    id: 'pop-print',
    name: 'CMYK',
    group: 'print',
    layers: [
      { type: 'adjust', params: { saturation: 1.25, contrast: 1.1 } },
      { type: 'halftone', params: { mode: 'cmyk', size: 10, angle: 15, misregister: 0.35, rough: 0.3 } }
    ]
  },
  {
    id: 'riso',
    name: 'Riso',
    group: 'print',
    layers: [
      {
        type: 'halftone',
        params: {
          mode: 'duotone',
          size: 7,
          angle: 22,
          paper: '#f4efe4',
          ink: '#2440ff',
          accent: '#ff4a6b',
          misregister: 0.55,
          rough: 0.55,
          contrast: 1.2
        }
      },
      { type: 'grain', params: { amount: 0.22, size: 1.3, chroma: 0, motion: 0.5 } }
    ]
  },
  {
    id: 'comic',
    name: 'Comic',
    group: 'print',
    layers: [
      { type: 'posterize', params: { levels: 4, smooth: 1.6, saturation: 1.35, outline: 0.7, line: '#141217' } },
      {
        type: 'halftone',
        mix: 0.35,
        blend: 'multiply',
        params: { mode: 'mono', size: 5, angle: 45, paper: '#ffffff', ink: '#1a1820' }
      }
    ]
  },
  {
    id: 'ink-sketch',
    name: 'Ink sketch',
    group: 'art',
    layers: [{ type: 'ink', params: { weight: 1, detail: 0.6, shading: 0.55, boil: 0.35 } }]
  },
  {
    id: 'banknote',
    name: 'Banknote',
    group: 'print',
    layers: [
      {
        type: 'engrave',
        params: { style: 'line', density: 140, relief: 0.8, waviness: 0.5, ink: '#1f3a2c', paper: '#ece6d3' }
      },
      {
        type: 'paper',
        params: { shadow: '#d6d0c2', grain: 0.35, fibers: 0.35, wrinkles: 0.45, folds: 0.25, drops: 0.1 }
      }
    ]
  },
  {
    id: 'zine',
    name: 'Zine',
    group: 'print',
    layers: [
      {
        type: 'halftone',
        params: { mode: 'mono', size: 6, angle: 45, paper: '#f1efe9', ink: '#161616', contrast: 1.45, rough: 0.5 }
      },
      {
        type: 'paper',
        params: { shadow: '#c9c6bf', wrinkles: 0.7, crumples: 0.45, folds: 0.6, foldsY: 0, drops: 0.25 }
      }
    ]
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    group: 'art',
    layers: [{ type: 'watercolor', params: { radius: 10, edges: 0.7, granulation: 0.55, lightness: 0.4 } }]
  },
  {
    id: 'chalkboard',
    name: 'Chalkboard',
    group: 'art',
    layers: [{ type: 'chalk', params: { board: '#1f2a25', chalk: '#efece2', shading: 0.6, grain: 0.5 } }]
  },
  {
    id: 'topographic',
    name: 'Topographic',
    group: 'geometric',
    layers: [
      {
        type: 'contour',
        params: { levels: 12, width: 1.3, smoothing: 0.5, background: 'color', fill: '#0f1014', lineMode: 'image' }
      }
    ]
  },
  {
    id: 'spiral-etch',
    name: 'Spiral etch',
    group: 'geometric',
    layers: [
      {
        type: 'engrave',
        params: { style: 'spiral', density: 120, relief: 0.5, waviness: 0.15, ink: '#151417', paper: '#f3efe6' }
      }
    ]
  },
  {
    id: 'pixel-art',
    name: 'Pixel art',
    group: 'pixel',
    tags: 'retro 16-bit palette',
    layers: [{ type: 'pixel', params: { shape: 'square', size: 7, palette: 'resurrect64', dither: 0.25 } }]
  },
  {
    id: 'mosaic-tiles',
    name: 'Tiles',
    group: 'pixel',
    tags: 'mosaic photo tiles grout',
    layers: [{ type: 'pixel', params: { shape: 'mosaic', size: 8, tile: 'square' } }]
  },
  {
    id: 'bricks',
    name: 'Bricks',
    group: 'pixel',
    tags: 'lego toy studs',
    layers: [{ type: 'pixel', params: { shape: 'brick', size: 8, piece: 'plate', brickColors: 'toy' } }]
  },
  {
    id: 'voxels',
    name: 'Voxels',
    group: 'pixel',
    tags: 'cubes 3d isometric',
    layers: [{ type: 'voxel', params: {} }]
  },
  {
    id: 'honeycomb',
    name: 'Honeycomb',
    group: 'pixel',
    tags: 'hex hexagon mosaic',
    layers: [{ type: 'pixel', params: { shape: 'hex', size: 10, palette: 'none', gap: 0.12, background: '#0c0b10' } }]
  },
  {
    id: 'home-computer',
    name: 'Home computer',
    group: 'pixel',
    tags: 'c64 retro 8-bit',
    layers: [{ type: 'pixel', params: { shape: 'square', size: 6, palette: 'c64', dither: 0.45 } }]
  },
  {
    id: 'game-boy',
    name: 'Handheld',
    group: 'pixel',
    layers: [
      { type: 'adjust', params: { contrast: 1.35, exposure: -0.15 } },
      { type: 'dither', params: { palette: 'gameboy', pattern: 'bayer4', pixel: 3, contrast: 1.3 } }
    ]
  },
  {
    id: 'one-bit',
    name: '1-bit',
    group: 'pixel',
    layers: [
      {
        type: 'dither',
        params: { palette: 'custom', colors: ['#0f0e12', '#f2eee6'], pattern: 'blue', pixel: 1.5, contrast: 1.25 }
      }
    ]
  },
  {
    id: 'pico',
    name: 'Fantasy console',
    group: 'pixel',
    layers: [
      { type: 'adjust', params: { saturation: 1.3, contrast: 1.1 } },
      { type: 'dither', params: { palette: 'pico8', match: 'color', pattern: 'bayer4', pixel: 3.5, contrast: 1.15 } }
    ]
  },
  {
    id: 'arcade',
    name: 'Arcade',
    group: 'pixel',
    layers: [
      { type: 'pixel', params: { shape: 'square', size: 4, palette: 'none' } },
      {
        type: 'crt',
        params: { curvature: 0.5, scan: 0.7, mask: 'aperture', maskStrength: 0.45, glow: 0.55, roll: 0.2 }
      }
    ]
  },
  {
    id: 'led-wall',
    name: 'LED wall',
    group: 'pixel',
    layers: [
      { type: 'adjust', params: { saturation: 1.3, contrast: 1.15 } },
      { type: 'pixel', params: { shape: 'round', size: 11, gap: 0.3, glow: 0.65 } },
      { type: 'bloom', params: { threshold: 0.35, intensity: 0.7 } }
    ]
  },
  {
    id: 'tape',
    name: 'Tape',
    group: 'signal',
    layers: [
      { type: 'adjust', params: { saturation: 0.9, contrast: 1.05, temperature: 0.08 } },
      { type: 'vhs', params: { bleed: 0.85, jitter: 0.5, noise: 0.35, tracking: 0.55, fade: 0.5 } },
      { type: 'chromatic', params: { mode: 'linear', amount: 2.5 } }
    ]
  },
  {
    id: 'signal-loss',
    name: 'Signal loss',
    group: 'signal',
    layers: [
      { type: 'vhs', params: { bleed: 0.6, jitter: 0.9, noise: 0.55, tracking: 0.8, fade: 0.4 } },
      { type: 'glitch', params: { amount: 0.55, blocks: 0.4, split: 0.8, frequency: 0.55 } }
    ]
  },
  {
    id: 'broadcast',
    name: 'Broadcast',
    group: 'signal',
    layers: [
      { type: 'crt', params: { curvature: 0.35, scan: 0.55, mask: 'slot', maskStrength: 0.4, glow: 0.4, roll: 0.35 } }
    ]
  },
  {
    id: 'corrupt',
    name: 'Corrupt',
    group: 'signal',
    layers: [
      { type: 'datamosh', params: { intensity: 0.75 } },
      { type: 'chromatic', params: { mode: 'linear', amount: 2 } }
    ]
  },
  {
    id: 'deep-fried',
    name: 'Deep fried',
    group: 'signal',
    layers: [
      { type: 'adjust', params: { exposure: 0.1, contrast: 1.35, saturation: 1.7, vibrance: 0.3, sharpen: 1.2 } },
      { type: 'jpeg', params: { quality: 7, size: 14, bleed: 'high' } }
    ]
  },
  {
    id: 'sliced',
    name: 'Sliced',
    group: 'signal',
    layers: [
      { type: 'bars', params: { count: 9, intensity: 0.1, speed: 0.6 } },
      { type: 'chromatic', params: { mode: 'linear', amount: 3.5 } },
      { type: 'grain', params: { amount: 0.1, size: 1, motion: 1 } }
    ]
  },
  {
    id: 'super-8',
    name: 'Super 8',
    group: 'film',
    layers: [
      { type: 'adjust', params: { temperature: 0.22, contrast: 1.12, fade: 0.28, saturation: 0.95 } },
      { type: 'halation', params: { threshold: 0.4, radius: 10, intensity: 0.6 } },
      { type: 'grain', params: { amount: 0.36, size: 1.7, chroma: 0.25, motion: 1 } },
      { type: 'film', params: { weave: 0.45, flicker: 0.4, dust: 0.45, scratches: 0.35, fade: 0.2, fps: 18 } },
      { type: 'lens', params: { distortion: 0.04, chroma: 0.25, softness: 0.25, vignette: 0.55 } }
    ]
  },
  {
    id: 'cinema',
    name: 'Cinema',
    group: 'film',
    layers: [
      { type: 'grade', params: { split: 0.6, curve: 0.5, blacks: 0.025, rolloff: 0.65, saturation: 0.95 } },
      { type: 'halation', params: { threshold: 0.55, radius: 8, intensity: 0.45 } },
      { type: 'grain', params: { amount: 0.2, size: 1, chroma: 0.1, motion: 1 } },
      { type: 'lens', params: { distortion: 0, chroma: 0.15, softness: 0.15, vignette: 0.4 } },
      { type: 'letterbox', params: { ratio: '2.39' } }
    ]
  },
  {
    id: 'night-glow',
    name: 'Night glow',
    group: 'film',
    layers: [
      { type: 'adjust', params: { exposure: -0.2, contrast: 1.2, saturation: 1.1 } },
      { type: 'bloom', params: { threshold: 0.45, intensity: 1.2, radius: 0.85 } },
      { type: 'halation', params: { threshold: 0.35, radius: 14, intensity: 0.7 } },
      { type: 'grain', params: { amount: 0.25, size: 1.2, motion: 1 } }
    ]
  },
  {
    id: 'expired',
    name: 'Expired film',
    group: 'film',
    layers: [
      {
        type: 'grade',
        params: { shadows: '#2d6a5a', highlights: '#ffb36b', split: 0.75, curve: 0.3, blacks: 0.08, saturation: 0.85 }
      },
      { type: 'leak', params: { position: 'right', intensity: 0.3, spread: 0.55 } },
      { type: 'grain', params: { amount: 0.34, size: 1.4, chroma: 0.3, motion: 1 } },
      { type: 'scratches', params: { opacity: 0.45, density: 1 } },
      { type: 'lens', params: { distortion: 0.02, chroma: 0.2, softness: 0.2, vignette: 0.5 } }
    ]
  },
  {
    id: 'reeded',
    name: 'Reeded',
    group: 'glass',
    layers: [
      {
        type: 'fluted',
        params: { shape: 'lines', profile: 'prism', size: 28, distortion: 0.55, highlights: 0.15, shadows: 0.3 }
      }
    ]
  },
  {
    id: 'wave-glass',
    name: 'Wave glass',
    group: 'glass',
    layers: [
      {
        type: 'fluted',
        params: { shape: 'wave', profile: 'lens', size: 40, distortion: 0.6, frost: 0.15, highlights: 0.2 }
      }
    ]
  },
  {
    id: 'pool',
    name: 'Pool',
    group: 'glass',
    layers: [
      { type: 'water', params: { refraction: 0.2, highlights: 0.35 } },
      { type: 'grade', params: { shadows: '#1c6e8a', highlights: '#e8fbff', split: 0.4, curve: 0.25, rolloff: 0.4 } }
    ]
  },
  {
    id: 'prism',
    name: 'Prism',
    group: 'light',
    layers: [
      { type: 'refract', params: {} },
      { type: 'bloom', params: { threshold: 0.7, intensity: 0.5 } }
    ]
  },
  {
    id: 'oil',
    name: 'Oil paint',
    group: 'art',
    layers: [
      { type: 'paint', params: { radius: 7, flow: 0.85, sharpness: 8, saturation: 1.2, canvas: 0.45, light: 0.4 } },
      { type: 'adjust', params: { vibrance: 0.2, contrast: 1.05 } }
    ]
  },
  {
    id: 'thermal',
    name: 'Thermal',
    group: 'light',
    layers: [
      { type: 'blur', params: { mode: 'gaussian', amount: 2 } },
      { type: 'gradient', params: { palette: 'thermal', contrast: 1.25 } },
      { type: 'grain', params: { amount: 0.15, size: 1, chroma: 0, motion: 1 } }
    ]
  },
  {
    id: 'poster',
    name: 'Poster',
    group: 'art',
    layers: [
      { type: 'posterize', params: { levels: 5, smooth: 1.4, saturation: 1.2, outline: 0.25 } },
      { type: 'gradient', mix: 0.55, blend: 'soft-light', params: { palette: 'dusk' } },
      { type: 'grain', params: { amount: 0.15, size: 1, motion: 0.5 } }
    ]
  },
  {
    id: 'dream',
    name: 'Dream',
    group: 'motion',
    layers: [
      { type: 'adjust', params: { exposure: 0.12, saturation: 1.12, contrast: 1.05 } },
      { type: 'blur', mix: 0.5, blend: 'screen', params: { mode: 'gaussian', amount: 18 } },
      { type: 'blur', mix: 0.35, blend: 'multiply', params: { mode: 'gaussian', amount: 9 } },
      { type: 'leak', params: { position: 'top-left', intensity: 0.3, spread: 0.7, streaks: 0.4, speed: 0.6 } },
      { type: 'grain', params: { amount: 0.12, size: 1.2, motion: 1 } }
    ]
  },
  {
    id: 'liquid',
    name: 'Liquid',
    group: 'motion',
    layers: [
      { type: 'warp', params: { strength: 0.085, scale: 1.5, speed: 0.8, split: 0.6 } },
      { type: 'chromatic', params: { mode: 'radial', amount: 5, wobble: 0.4 } }
    ]
  },
  {
    id: 'mandala',
    name: 'Mandala',
    group: 'motion',
    layers: [
      { type: 'kaleidoscope', params: { segments: 10, zoom: 1.15, spin: 0.2 } },
      { type: 'hue', params: { cycle: 0.25 } },
      { type: 'bloom', params: { threshold: 0.6, intensity: 0.5 } }
    ]
  },
  {
    id: 'glitter',
    name: 'Glitter',
    group: 'light',
    layers: [
      { type: 'sparkle', params: { threshold: 0.74, intensity: 12, spacing: 50 } },
      { type: 'bloom', params: { threshold: 0.65, intensity: 0.5 } }
    ]
  },
  {
    id: 'slit-scan',
    name: 'Pixel stretch',
    group: 'motion',
    layers: [
      { type: 'smear', params: { mode: 'stretch', angle: 0, position: 0.55, variance: 0.45, speed: 0.6 } },
      { type: 'grain', params: { amount: 0.12, size: 1, motion: 1 } }
    ]
  },
  {
    id: 'pixel-sort',
    name: 'Pixel sort',
    group: 'signal',
    tags: 'glitch sorting streaks',
    layers: [{ type: 'pixelsort', params: { low: 0.22, high: 0.96, length: 0.85, randomness: 0.6 } }]
  },
  {
    id: 'forensics',
    name: 'Forensics',
    group: 'signal',
    tags: 'error level heat analysis',
    layers: [{ type: 'forensics', params: {} }]
  },
  {
    id: 'rgb-split',
    name: 'RGB split',
    group: 'signal',
    tags: 'chromatic aberration channels',
    layers: [
      { type: 'chromatic', params: { mode: 'linear', amount: 16, wobble: 0.35 } },
      { type: 'adjust', params: { contrast: 1.12, saturation: 1.15 } }
    ]
  },
  {
    id: 'scanlines',
    name: 'Scanlines',
    group: 'signal',
    tags: 'broadcast interlace tv',
    layers: [
      {
        type: 'crt',
        params: { curvature: 0, lines: 3, scan: 0.8, mask: 'none', glow: 0.3, vignette: 0.3, flicker: 0.1, roll: 0.25 }
      }
    ]
  },
  {
    id: 'lofi',
    name: 'Lo-fi',
    group: 'signal',
    tags: 'tape vhs muted grain',
    layers: [
      { type: 'grade', params: { split: 0.35, curve: 0.2, blacks: 0.08, rolloff: 0.7, saturation: 0.8 } },
      { type: 'vhs', params: { tape: 'lp', bleed: 0.9, noise: 0.45, jitter: 0.35, tracking: 0.2, fade: 0.6 } },
      { type: 'grain', params: { amount: 0.22, size: 1.3, motion: 1 } }
    ]
  },
  {
    id: 'twirl',
    name: 'Twirl',
    group: 'distort',
    tags: 'spiral vortex swirl',
    layers: [{ type: 'distort', params: { type: 'twirl', strength: 0.65, radius: 0.6 } }]
  },
  {
    id: 'pinch',
    name: 'Pinch',
    group: 'distort',
    tags: 'suck squeeze',
    layers: [{ type: 'distort', params: { type: 'pinch', strength: 0.7, radius: 0.6 } }]
  },
  {
    id: 'bulge',
    name: 'Bulge',
    group: 'distort',
    tags: 'spherize fisheye',
    layers: [{ type: 'distort', params: { type: 'bulge', strength: 0.7, radius: 0.6 } }]
  },
  {
    id: 'little-planet',
    name: 'Little planet',
    group: 'distort',
    tags: 'polar coordinates tiny planet',
    layers: [{ type: 'distort', params: { type: 'polar', polarMode: 'wrap' } }]
  },
  {
    id: 'shear',
    name: 'Shear',
    group: 'distort',
    tags: 'skew slant',
    layers: [{ type: 'distort', params: { type: 'shear', strength: 0.75, curve: 'wave' } }]
  },
  {
    id: 'smudge',
    name: 'Smudge',
    group: 'distort',
    tags: 'drip smear melt',
    layers: [{ type: 'distort', params: { type: 'smudge', strength: 0.6 } }]
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    group: 'distort',
    tags: 'waves ridges',
    layers: [{ type: 'distort', params: { type: 'zigzag', strength: 0.45, ridges: 14 } }]
  },
  {
    id: 'ripple-rings',
    name: 'Ripple',
    group: 'distort',
    tags: 'water rings pond',
    layers: [{ type: 'ripple', params: { mode: 'rings', amplitude: 0.014, frequency: 1.2, shine: 0.35 } }]
  },
  {
    id: 'soft-focus',
    name: 'Soft focus',
    group: 'blur',
    tags: 'gaussian dreamy glow',
    layers: [
      { type: 'blur', params: { mode: 'gaussian', amount: 10 } },
      { type: 'bloom', params: { threshold: 0.6, intensity: 0.6 } }
    ]
  },
  {
    id: 'motion-blur',
    name: 'Motion',
    group: 'blur',
    tags: 'speed streak',
    layers: [{ type: 'blur', params: { mode: 'motion', amount: 34, angle: 0 } }]
  },
  {
    id: 'zoom-burst',
    name: 'Zoom burst',
    group: 'blur',
    tags: 'radial zoom',
    layers: [{ type: 'blur', params: { mode: 'zoom', amount: 26 } }]
  },
  {
    id: 'miniature',
    name: 'Miniature',
    group: 'blur',
    tags: 'tilt shift toy',
    layers: [
      { type: 'blur', params: { mode: 'tilt', amount: 14, focus: 0.45, width: 0.18 } },
      { type: 'adjust', params: { saturation: 1.35, contrast: 1.12 } }
    ]
  },
  {
    id: 'bokeh',
    name: 'Bokeh',
    group: 'blur',
    tags: 'lens blur depth highlights',
    layers: [
      { type: 'bokeh', params: { radius: 40, gain: 9 } },
      { type: 'grade', params: { split: 0.35, curve: 0.3, rolloff: 0.6 } }
    ]
  },
  {
    id: 'noir',
    name: 'Noir',
    group: 'film',
    tags: 'black white monochrome',
    layers: [
      { type: 'adjust', params: { saturation: 0, contrast: 1.35, exposure: -0.05 } },
      { type: 'grade', params: { split: 0, curve: 0.7, blacks: -0.04, rolloff: 0.5, saturation: 0 } },
      { type: 'grain', params: { amount: 0.3, size: 1.2, chroma: 0, motion: 1 } },
      { type: 'lens', params: { distortion: 0, chroma: 0, softness: 0.2, vignette: 0.75 } }
    ]
  },
  {
    id: 'bleach',
    name: 'Bleach bypass',
    group: 'film',
    tags: 'desaturated contrast silver',
    layers: [
      { type: 'grade', params: { split: 0.2, curve: 0.85, blacks: -0.03, rolloff: 0.4, saturation: 0.45 } },
      { type: 'grain', params: { amount: 0.22, size: 1, chroma: 0.05, motion: 1 } }
    ]
  },
  {
    id: 'golden-hour',
    name: 'Golden hour',
    group: 'film',
    tags: 'warm sunset glow',
    layers: [
      {
        type: 'grade',
        params: { shadows: '#5b3a6e', highlights: '#ffb347', split: 0.7, curve: 0.35, blacks: 0.03, rolloff: 0.65 }
      },
      { type: 'halation', params: { threshold: 0.45, radius: 12, intensity: 0.6 } },
      { type: 'leak', params: { position: 'top-right', intensity: 0.28, spread: 0.6 } },
      { type: 'grain', params: { amount: 0.16, size: 1.1, motion: 1 } }
    ]
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    group: 'geometric',
    layers: [
      {
        type: 'forms',
        blend: 'normal',
        params: {
          shape: 'mixed',
          palette: 'bauhaus',
          background: '#efe8da',
          size: 30,
          scale: 1.05,
          floor: 0.6,
          contrast: 1.4
        }
      },
      { type: 'grain', params: { amount: 0.16, size: 1.2 } }
    ]
  },
  {
    id: 'asterisk',
    name: 'Asterisk',
    group: 'geometric',
    layers: [
      { type: 'forms', params: { shape: 'asterisk', palette: 'image', size: 26, scale: 1.2, floor: 0, contrast: 1.6 } }
    ]
  },
  {
    id: 'arcs',
    name: 'Arcs',
    group: 'geometric',
    layers: [{ type: 'truchet', params: { size: 22, width: 0.24 } }]
  },
  {
    id: 'maze',
    name: 'Maze',
    group: 'geometric',
    layers: [{ type: 'truchet', params: { pattern: 'maze', style: 'diagonal', size: 18, width: 0.2, contrast: 1.5 } }]
  },
  {
    id: 'woven',
    name: 'Woven',
    group: 'geometric',
    layers: [{ type: 'lattice', params: { size: 20 } }]
  },
  {
    id: 'basket',
    name: 'Basket',
    group: 'geometric',
    layers: [{ type: 'lattice', params: { weave: 'basket', size: 26, bend: 2, depth: 0.85 } }]
  },
  {
    id: 'low-poly',
    name: 'Low poly',
    group: 'geometric',
    layers: [{ type: 'lowpoly', params: {} }]
  },
  {
    id: 'origami',
    name: 'Origami',
    group: 'geometric',
    layers: [
      { type: 'lowpoly', params: { size: 84, detail: 0.5, relief: 0.65, saturation: 0.9, edges: 0 } },
      { type: 'grain', params: { amount: 0.12, size: 1.4 } }
    ]
  },
  {
    id: 'skyline',
    name: 'Skyline',
    group: 'geometric',
    layers: [{ type: 'extrude', params: {} }]
  },
  {
    id: 'data-city',
    name: 'Data city',
    group: 'geometric',
    layers: [{ type: 'extrude', params: { palette: 'gradient', size: 12, gap: 0.3, height: 1.3, turn: 0.15 } }]
  },
  {
    id: 'wireframe',
    name: 'Wireframe',
    group: 'geometric',
    layers: [{ type: 'neongrid', params: { threshold: 0.42, density: 36 } }]
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    group: 'geometric',
    layers: [
      {
        type: 'neongrid',
        params: { view: 'perspective', color: '#ff4fd8', threshold: 0.35, density: 40, backdrop: 0.12 }
      }
    ]
  },
  {
    id: 'currents',
    name: 'Currents',
    group: 'geometric',
    layers: [{ type: 'flowfield', params: {} }]
  },
  {
    id: 'pen-flow',
    name: 'Pen flow',
    group: 'geometric',
    layers: [
      {
        type: 'flowfield',
        blend: 'normal',
        params: { ground: 'light', color: 'ink', ink: '#1a1820', width: 2.6, density: 1, contrast: 2.5 }
      }
    ]
  },
  {
    id: 'schematic',
    name: 'Schematic',
    group: 'geometric',
    layers: [{ type: 'schematic', params: {} }]
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    group: 'geometric',
    layers: [{ type: 'schematic', blend: 'normal', params: { background: 'blueprint' } }]
  },
  {
    id: 'circuit',
    name: 'Circuit',
    group: 'geometric',
    layers: [{ type: 'schematic', params: { style: 'circuit', background: 'dim', density: 32 } }]
  },
  {
    id: 'field-notes',
    name: 'Field notes',
    group: 'geometric',
    layers: [{ type: 'specimen', params: {} }]
  },
  {
    id: 'frosted',
    name: 'Frosted',
    group: 'glass',
    layers: [{ type: 'frosted', params: {} }]
  },
  {
    id: 'rain-window',
    name: 'Rain window',
    group: 'glass',
    layers: [{ type: 'frosted', params: { clear: 'drips', clearSize: 0.7, frost: 0.55 } }]
  },
  {
    id: 'hammered',
    name: 'Hammered',
    group: 'glass',
    layers: [{ type: 'frosted', params: { texture: 'hammered', size: 28, frost: 0.3 } }]
  },
  {
    id: 'crystal-ball',
    name: 'Crystal ball',
    group: 'glass',
    layers: [{ type: 'orb', params: {} }]
  },
  {
    id: 'shattered',
    name: 'Shattered',
    group: 'glass',
    layers: [{ type: 'shatter', params: {} }]
  },
  {
    id: 'crackle',
    name: 'Crackle',
    group: 'glass',
    layers: [{ type: 'shatter', params: { pattern: 'crackle', size: 90, cracks: 0.9, displacement: 0.3 } }]
  },
  {
    id: 'stained-glass',
    name: 'Stained glass',
    group: 'glass',
    layers: [{ type: 'stained', params: {} }]
  },
  {
    id: 'rose-window',
    name: 'Rose window',
    group: 'glass',
    layers: [{ type: 'stained', params: { pattern: 'rose' } }]
  },
  {
    id: 'pressed-glass',
    name: 'Pressed glass',
    group: 'glass',
    layers: [{ type: 'vitrine', params: {} }]
  },
  {
    id: 'glass-blocks',
    name: 'Glass blocks',
    group: 'glass',
    layers: [{ type: 'vitrine', params: { facet: 'dome', size: 90, refraction: 0.55 } }]
  },
  {
    id: 'chrome',
    name: 'Chrome',
    group: 'material',
    layers: [{ type: 'chrome', params: { detail: 0.7, depth: 0.7 } }]
  },
  {
    id: 'mercury',
    name: 'Mercury',
    group: 'material',
    layers: [
      {
        type: 'chrome',
        params: { environment: 'horizon', tint: '#dfe2e8', backdrop: '#0e0f12', roughness: 0.3, speed: 0.4 }
      }
    ]
  },
  {
    id: 'crystal',
    name: 'Crystal',
    group: 'material',
    layers: [{ type: 'crystallize', params: { size: 36, edges: 0.12 } }]
  },
  {
    id: 'gemstone',
    name: 'Gemstone',
    group: 'material',
    layers: [{ type: 'crystallize', params: { size: 34, facets: 0.8, edges: 0.3 } }]
  },
  {
    id: 'pressed-metal',
    name: 'Pressed metal',
    group: 'material',
    layers: [{ type: 'emboss', params: { depth: 0.85, shadow: 0.6, texture: 0.25 } }]
  },
  {
    id: 'letterpress',
    name: 'Letterpress',
    group: 'material',
    layers: [{ type: 'emboss', params: { material: 'paper', direction: 'pressed', depth: 0.85, shadow: 0.6 } }]
  },
  {
    id: 'plaster',
    name: 'Plaster',
    group: 'material',
    layers: [{ type: 'emboss', params: { material: 'plaster', depth: 0.9, shadow: 0.65, light: 120 } }]
  },
  {
    id: 'marble',
    name: 'Marble',
    group: 'material',
    layers: [{ type: 'marble', params: {} }]
  },
  {
    id: 'molten-gold',
    name: 'Molten gold',
    group: 'material',
    layers: [{ type: 'molten', params: { alloy: 'gold' } }]
  },
  {
    id: 'forge',
    name: 'Forge',
    group: 'material',
    layers: [{ type: 'molten', params: {} }]
  },
  {
    id: 'oil-slick',
    name: 'Oil slick',
    group: 'material',
    layers: [{ type: 'thinfilm', params: { thickness: 0.55, strength: 0.85 } }]
  },
  {
    id: 'soap-bubble',
    name: 'Soap bubble',
    group: 'material',
    layers: [{ type: 'thinfilm', params: { film: 'soap' } }]
  },
  {
    id: 'infinite',
    name: 'Infinite',
    group: 'distort',
    layers: [{ type: 'droste', params: {} }]
  },
  {
    id: 'pencil',
    name: 'Pencil',
    group: 'art',
    layers: [{ type: 'sketch', blend: 'normal', params: {} }]
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    group: 'art',
    layers: [{ type: 'sketch', blend: 'normal', params: { medium: 'charcoal', smudge: 0.7, grain: 0.75, shading: 1 } }]
  },
  {
    id: 'colored-pencil',
    name: 'Colored pencil',
    group: 'art',
    layers: [{ type: 'sketch', blend: 'normal', params: { medium: 'colored' } }]
  },
  {
    id: 'pop-art',
    name: 'Pop art',
    group: 'print',
    layers: [{ type: 'warhol', params: {} }]
  },
  {
    id: 'pop-strip',
    name: 'Pop strip',
    group: 'print',
    layers: [{ type: 'warhol', params: { layout: 'strip', colorway: 'electric' } }]
  },
  {
    id: 'ukiyo-e',
    name: 'Ukiyo-e',
    group: 'print',
    layers: [{ type: 'woodblock', params: {} }]
  },
  {
    id: 'prussian',
    name: 'Prussian',
    group: 'print',
    layers: [{ type: 'woodblock', params: { palette: 'hokusai' } }]
  },
  {
    id: 'night-print',
    name: 'Night print',
    group: 'print',
    layers: [{ type: 'woodblock', params: { palette: 'night' } }]
  },
  {
    id: 'crosshatch',
    name: 'Crosshatch',
    group: 'print',
    layers: [
      {
        type: 'engrave',
        params: { style: 'crosshatch', density: 110, relief: 0.45, waviness: 0.12, ink: '#17151a', paper: '#f6f3ec' }
      }
    ]
  },
  {
    id: 'sun-print',
    name: 'Sun print',
    group: 'print',
    layers: [
      { type: 'gradient', params: { palette: 'custom', colors: ['#0a2149', '#1d4f93', '#eef2f7'], contrast: 1.25 } },
      { type: 'paper', params: { shadow: '#c3cede', grain: 0.4, fibers: 0.45, wrinkles: 0.2, folds: 0, drops: 0 } },
      { type: 'grain', params: { amount: 0.14, size: 1.2 } }
    ]
  },
  {
    id: 'two-tone',
    name: 'Two tone',
    group: 'light',
    layers: [{ type: 'gradient', params: { palette: 'custom', colors: ['#16163a', '#ff6a5b'], contrast: 1.2 } }]
  },
  {
    id: 'afterglow',
    name: 'Afterglow',
    group: 'light',
    layers: [
      { type: 'gradient', params: { palette: 'dusk', contrast: 1.15 } },
      { type: 'bloom', params: { threshold: 0.6, intensity: 0.45 } }
    ]
  },
  {
    id: 'infrared',
    name: 'Infrared',
    group: 'light',
    layers: [
      { type: 'gradient', params: { palette: 'infrared', contrast: 1.2 } },
      { type: 'grain', params: { amount: 0.12, size: 1 } }
    ]
  },
  {
    id: 'fringe',
    name: 'Fringe',
    group: 'light',
    layers: [
      { type: 'lens', params: { distortion: 0.3, chroma: 1, vignette: 0.35 } },
      { type: 'chromatic', params: { mode: 'radial', amount: 26, falloff: 1.2 } }
    ]
  },
  {
    id: 'waves',
    name: 'Waves',
    group: 'distort',
    layers: [{ type: 'ripple', params: { mode: 'waves', amplitude: 0.018, frequency: 1.3, angle: 80, shine: 0.45 } }]
  },
  {
    id: 'stipple',
    name: 'Stipple',
    group: 'print',
    layers: [{ type: 'points', params: {} }]
  },
  {
    id: 'color-stipple',
    name: 'Color stipple',
    group: 'print',
    layers: [{ type: 'points', params: { color: true } }]
  },
  {
    id: 'pointillist',
    name: 'Pointillist',
    group: 'print',
    layers: [{ type: 'points', params: { style: 'pointillism', size: 1.6 } }]
  },
  {
    id: 'seurat',
    name: 'Seurat',
    group: 'print',
    layers: [{ type: 'points', params: { style: 'pointillism', ground: '#efe9dd', size: 1.4 } }]
  },
  {
    id: 'velvet',
    name: 'Velvet',
    group: 'print',
    layers: [{ type: 'points', params: { style: 'mezzotint' } }]
  },
  {
    id: 'velvet-color',
    name: 'Color mezzotint',
    group: 'print',
    layers: [{ type: 'points', params: { style: 'mezzotint', color: true } }]
  },
  {
    id: 'atkinson',
    name: 'Atkinson',
    group: 'pixel',
    layers: [{ type: 'dither', params: { pattern: 'atkinson', palette: 'mac', pixel: 2 } }]
  },
  {
    id: 'micro',
    name: 'Micro',
    group: 'pixel',
    layers: [{ type: 'dither', params: { pattern: 'floyd', palette: 'c64', pixel: 3 } }]
  },
  {
    id: 'neon-dither',
    name: 'Neon dither',
    group: 'pixel',
    layers: [{ type: 'dither', params: { pattern: 'bayer4', palette: 'neon', pixel: 3 } }]
  },
  {
    id: 'amber',
    name: 'Amber',
    group: 'pixel',
    layers: [
      { type: 'dither', params: { pattern: 'bayer4', palette: 'amber', pixel: 2 } },
      {
        type: 'crt',
        params: { curvature: 0.1, scan: 0.3, mask: 'none', glow: 0.35, vignette: 0.4, roll: 0, flicker: 0.08 }
      }
    ]
  },
  {
    id: 'teletext',
    name: 'Teletext',
    group: 'pixel',
    layers: [{ type: 'dither', params: { pattern: 'bayer2', palette: 'teletext', pixel: 6 } }]
  },
  {
    id: 'mirror-ball',
    name: 'Mirror ball',
    group: 'light',
    layers: [{ type: 'disco', params: {} }]
  },
  {
    id: 'sequins',
    name: 'Sequins',
    group: 'light',
    layers: [{ type: 'disco', params: { shape: 'flat', size: 12, sparkle: 0.8 } }]
  },
  {
    id: 'stereo',
    name: 'Stereo',
    group: 'light',
    layers: [{ type: 'anaglyph', params: { amount: 26, pop: 0.45 } }]
  },
  {
    id: 'stardust',
    name: 'Stardust',
    group: 'light',
    layers: [{ type: 'dust', params: {} }]
  },
  {
    id: 'fireflies',
    name: 'Fireflies',
    group: 'light',
    layers: [{ type: 'dust', params: { colorMode: 'tint', density: 0.3, threshold: 0.6, size: 2.4, glow: 1 } }]
  },
  {
    id: 'neon-edges',
    name: 'Neon edges',
    group: 'light',
    layers: [{ type: 'edgeglow', params: {} }]
  },
  {
    id: 'neon-trace',
    name: 'Neon trace',
    group: 'light',
    layers: [{ type: 'edgeglow', params: { colorMode: 'custom', background: 0.1 } }]
  },
  {
    id: 'light-burst',
    name: 'Light burst',
    group: 'light',
    layers: [{ type: 'warpbloom', params: {} }]
  },
  {
    id: 'vortex',
    name: 'Vortex',
    group: 'light',
    layers: [{ type: 'warpbloom', params: { mode: 'swirl' } }]
  },
  {
    id: 'starburst',
    name: 'Starburst',
    group: 'light',
    layers: [{ type: 'rays', params: { rays: 4, length: 0.6, intensity: 1.4 } }]
  },
  {
    id: 'light-sweep',
    name: 'Light sweep',
    group: 'light',
    layers: [{ type: 'rays', params: { rays: 1, length: 0.9, intensity: 1.5, shafts: 1 } }]
  },
  {
    id: 'relief',
    name: 'Relief',
    group: 'material',
    layers: [{ type: 'emboss', params: { imageColor: true, depth: 0.8, shadow: 0.55 } }]
  },
  {
    id: 'light-painting',
    name: 'Light painting',
    group: 'light',
    layers: [
      { type: 'flowfield', params: { width: 2.4, length: 120, density: 0.7, drift: 0.6, contrast: 1.6 } },
      { type: 'bloom', params: { threshold: 0.45, intensity: 0.9, radius: 0.7 } }
    ]
  }
];

export const LOOKS_BY_ID = Object.fromEntries(LOOKS.map(look => [look.id, look]));
