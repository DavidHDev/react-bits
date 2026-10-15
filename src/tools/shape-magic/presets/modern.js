export const MODERN_GROUPS = [
  { id: 'm-lines', label: 'Lines' },
  { id: 'm-dots', label: 'Dots' },
  { id: 'm-rays', label: 'Grids & rays' },
  { id: 'm-arcs', label: 'Arcs' },
  { id: 'm-forms', label: 'Forms' },
  { id: 'm-type', label: 'Type' }
];

export const MODERN_MARKS = [
  {
    id: 'm-latitude',
    name: 'Latitude',
    group: 'm-lines',
    tags: ['sphere', 'planet', 'globe', 'stripes'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', size: 0.8842, pattern: 'lines', density: 11, weight: 0.55, patternAngle: 18, bulge: 1 },
        { type: 'circle', size: 0.84, op: 'keep', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-diagonal',
    name: 'Diagonal',
    group: 'm-lines',
    tags: ['stripes', 'disc', 'diagonal', 'motion'],
    ink: true,
    mark: { layers: [{ type: 'circle', size: 0.84, pattern: 'lines', density: 9, weight: 0.5, patternAngle: 135 }] }
  },
  {
    id: 'm-fade',
    name: 'Fade',
    group: 'm-lines',
    tags: ['bars', 'gradient', 'disc', 'rhythm'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'circle',
          size: 0.84,
          rotation: 180,
          pattern: 'lines',
          density: 9,
          weight: 0.84,
          patternAngle: 90,
          taper: 0.85
        }
      ]
    }
  },
  {
    id: 'm-weave',
    name: 'Weave',
    group: 'm-lines',
    tags: ['quadrants', 'basket', 'stripes', 'textile'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'pie',
          params: { sweep: 90, roundness: 0 },
          size: 0.84,
          rotation: 45,
          repeat: 2,
          pattern: 'lines',
          density: 10,
          weight: 0.5,
          patternAngle: 135,
          invert: true
        },
        {
          type: 'pie',
          params: { sweep: 90, roundness: 0 },
          size: 0.84,
          rotation: 135,
          repeat: 2,
          pattern: 'lines',
          density: 10,
          weight: 0.5,
          patternAngle: 135,
          invert: true
        },
        { type: 'cross', params: { thickness: 0.1, roundness: 0, inner: 0 }, size: 0.84, op: 'cut', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-shift',
    name: 'Shift',
    group: 'm-lines',
    tags: ['stripes', 'op art', 'offset', 'disc'],
    ink: true,
    mark: {
      layers: [
        { type: 'pie', params: { sweep: 180, roundness: 0 }, size: 0.875, pattern: 'lines', density: 13, weight: 0.5 },
        {
          type: 'pie',
          params: { sweep: 180, roundness: 0 },
          size: 0.875,
          rotation: 180,
          pattern: 'lines',
          density: 13,
          weight: 0.5,
          invert: true
        },
        { type: 'circle', size: 0.84, op: 'keep', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-quarter',
    name: 'Quarter',
    group: 'm-lines',
    tags: ['quarter', 'corner', 'stripes', 'fan'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'pie',
          params: { sweep: 90, roundness: 0 },
          x: -0.76,
          y: 0.76,
          size: 1.52,
          rotation: 135,
          pattern: 'lines',
          density: 10,
          weight: 0.5,
          patternAngle: 90,
          invert: true
        }
      ]
    }
  },
  {
    id: 'm-pills',
    name: 'Pills',
    group: 'm-lines',
    tags: ['bars', 'stack', 'disc', 'sun'],
    ink: true,
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 0.1848, roundness: 1 }, y: -0.72, size: 0.3517 },
        { type: 'box', params: { width: 1, height: 0.0965, roundness: 1 }, y: -0.48, size: 0.6735 },
        { type: 'box', params: { width: 1, height: 0.0811, roundness: 1 }, y: -0.24, size: 0.8019 },
        { type: 'box', params: { width: 1, height: 0.0774, roundness: 1 }, size: 0.84 },
        { type: 'box', params: { width: 1, height: 0.0811, roundness: 1 }, y: 0.24, size: 0.8019 },
        { type: 'box', params: { width: 1, height: 0.0965, roundness: 1 }, y: 0.48, size: 0.6735 },
        { type: 'box', params: { width: 1, height: 0.1848, roundness: 1 }, y: 0.72, size: 0.3517 }
      ]
    }
  },
  {
    id: 'm-zed',
    name: 'Zed',
    group: 'm-lines',
    tags: ['z', 'letter', 'stripes', 'speed'],
    ink: true,
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 0.1818, roundness: 0 }, y: -0.6055, size: 0.74 },
        { type: 'box', params: { width: 1, height: 0.1818, roundness: 0 }, y: 0.6055, size: 0.74 },
        { type: 'box', params: { width: 1, height: 0.1307, roundness: 0 }, size: 1.1942, rotation: 137.2821 },
        {
          type: 'box',
          params: { width: 1, height: 1, roundness: 0 },
          size: 0.74,
          pattern: 'lines',
          density: 11,
          weight: 0.56,
          op: 'keep',
          smooth: 0
        }
      ]
    }
  },
  {
    id: 'm-peak',
    name: 'Peak',
    group: 'm-lines',
    tags: ['mountain', 'triangle', 'stripes', 'summit'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'triangle',
          params: { width: 0.6111, roundness: 0 },
          y: -0.02,
          size: 0.84,
          pattern: 'lines',
          density: 11,
          weight: 0.72,
          patternAngle: 180,
          taper: 0.6
        }
      ]
    }
  },
  {
    id: 'm-zigzag',
    name: 'Zigzag',
    group: 'm-lines',
    tags: ['zigzag', 'chevron', 'mountains', 'energy'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'chevron',
          params: { angle: 90, thickness: 0.25, roundness: 0 },
          x: 0.26,
          y: -0.36,
          size: 0.52,
          mirror: true
        },
        { type: 'chevron', params: { angle: 90, thickness: 0.25, roundness: 0 }, x: 0.26, size: 0.52, mirror: true },
        {
          type: 'chevron',
          params: { angle: 90, thickness: 0.25, roundness: 0 },
          x: 0.26,
          y: 0.36,
          size: 0.52,
          mirror: true
        }
      ]
    }
  },
  {
    id: 'm-halftone',
    name: 'Halftone',
    group: 'm-dots',
    tags: ['dots', 'sphere', 'print', 'gradient'],
    ink: true,
    mark: { layers: [{ type: 'circle', size: 0.84, pattern: 'halftone', density: 11, weight: 0.95, taper: 0.72 }] }
  },
  {
    id: 'm-dot-globe',
    name: 'Dot globe',
    group: 'm-dots',
    tags: ['dots', 'sphere', 'globe', 'planet'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', y: -0.7576, size: 0.05, repeat: 5, layout: 'row', gap: 2.638 },
        { type: 'circle', y: -0.5798, size: 0.0774, repeat: 5, layout: 'row', gap: 3.2448 },
        { type: 'circle', y: -0.3138, size: 0.1012, repeat: 5, layout: 'row', gap: 3.2448 },
        { type: 'circle', size: 0.1095, repeat: 5, layout: 'row', gap: 3.2448 },
        { type: 'circle', y: 0.3138, size: 0.1012, repeat: 5, layout: 'row', gap: 3.2448 },
        { type: 'circle', y: 0.5798, size: 0.0774, repeat: 5, layout: 'row', gap: 3.2448 },
        { type: 'circle', y: 0.7576, size: 0.05, repeat: 5, layout: 'row', gap: 2.638 }
      ]
    }
  },
  {
    id: 'm-dot-fade',
    name: 'Dot fade',
    group: 'm-dots',
    tags: ['dots', 'gradient', 'grid', 'fade'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'box',
          params: { width: 1, height: 1, roundness: 0 },
          size: 0.72,
          pattern: 'dots',
          density: 7,
          weight: 0.9,
          taper: 0.9
        }
      ]
    }
  },
  {
    id: 'm-dot-diamond',
    name: 'Dot diamond',
    group: 'm-dots',
    tags: ['dots', 'diamond', 'sparkle', 'star'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'box',
          params: { width: 1, height: 1, roundness: 0 },
          size: 0.62,
          rotation: 45,
          pattern: 'halftone',
          density: 7,
          weight: 0.95,
          taper: 0.6
        }
      ]
    }
  },
  {
    id: 'm-dot-ring',
    name: 'Dot ring',
    group: 'm-dots',
    tags: ['dots', 'ring', 'circle', 'loop'],
    ink: true,
    mark: { layers: [{ type: 'circle', x: 0.68, size: 0.15, repeat: 8 }] }
  },
  {
    id: 'm-dot-burst',
    name: 'Dot burst',
    group: 'm-dots',
    tags: ['dots', 'radial', 'bloom', 'firework'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', size: 0.13 },
        { type: 'circle', x: 0.33, size: 0.09, repeat: 6 },
        { type: 'circle', x: 0.56, size: 0.066, repeat: 12, spin: 15 },
        { type: 'circle', x: 0.78, size: 0.05, repeat: 16, spin: 11.25 }
      ]
    }
  },
  {
    id: 'm-bonds',
    name: 'Bonds',
    group: 'm-dots',
    tags: ['dots', 'network', 'molecule', 'diamond'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', x: 0.64, size: 0.15, repeat: 4 },
        { type: 'diamond', params: { width: 1, height: 1, roundness: 0 }, size: 0.64, outline: 0.036 }
      ]
    }
  },
  {
    id: 'm-trio',
    name: 'Trio',
    group: 'm-dots',
    tags: ['molecule', 'atom', 'dots', 'science'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', y: -0.14, size: 0.3 },
        { type: 'circle', x: 0.4728, y: 0.2294, size: 0.17, mirror: true },
        {
          type: 'box',
          params: { width: 1, height: 0.1167, roundness: 0 },
          x: 0.2364,
          y: 0.0447,
          size: 0.3,
          rotation: 38,
          mirror: true
        }
      ]
    }
  },
  {
    id: 'm-meridian',
    name: 'Meridian',
    group: 'm-rays',
    tags: ['globe', 'world', 'grid', 'sphere'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', size: 0.84, pattern: 'grid', density: 6, weight: 0.3, bulge: 1 },
        { type: 'ring', params: { thickness: 0.05 }, size: 0.84 }
      ]
    }
  },
  {
    id: 'm-flag',
    name: 'Flag',
    group: 'm-rays',
    tags: ['grid', 'flag', 'wave', 'mesh'],
    ink: true,
    mark: {
      layers: [
        { type: 'wave', params: { waves: 1, amplitude: 0.5, thickness: 0.5 }, size: 1.04, outline: 0.025 },
        { type: 'wave', params: { waves: 1, amplitude: 0.5, thickness: 0.2857 }, size: 0.91, outline: 0.025 },
        { type: 'wave', params: { waves: 1, amplitude: 0.5, thickness: 0.0621 }, size: 0.805 },
        {
          type: 'wave',
          params: { waves: 1, amplitude: 0.5, thickness: 0.5 },
          size: 1.04,
          pattern: 'lines',
          density: 8,
          weight: 0.1923,
          patternAngle: 90
        },
        { type: 'box', params: { width: 0.805, height: 1, roundness: 0 }, size: 1, op: 'keep', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-sunburst',
    name: 'Sunburst',
    group: 'm-rays',
    tags: ['sun', 'rays', 'burst', 'radiant'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', size: 0.84, pattern: 'rays', density: 28, weight: 0.5 },
        { type: 'circle', size: 0.2, op: 'cut', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-petals',
    name: 'Petals',
    group: 'm-rays',
    tags: ['flower', 'petals', 'bloom', 'radial'],
    ink: true,
    mark: {
      layers: [{ type: 'leaf', params: { width: 0.2, roundness: 0 }, x: 0.48, size: 0.36, rotation: 90, repeat: 16 }]
    }
  },
  {
    id: 'm-fan',
    name: 'Fan',
    group: 'm-rays',
    tags: ['rays', 'quarter', 'corner', 'spotlight'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'pie',
          params: { sweep: 90, roundness: 0 },
          x: -0.76,
          y: 0.76,
          size: 1.52,
          rotation: 135,
          pattern: 'rays',
          density: 28,
          weight: 0.5
        },
        {
          type: 'pie',
          params: { sweep: 90, roundness: 0 },
          x: -0.76,
          y: 0.76,
          size: 0.42,
          rotation: 135,
          op: 'cut',
          smooth: 0
        }
      ]
    }
  },
  {
    id: 'm-hourglass',
    name: 'Hourglass',
    group: 'm-rays',
    tags: ['rays', 'time', 'bowtie', 'focus'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'box',
          params: { width: 1, height: 1, roundness: 0 },
          size: 0.74,
          pattern: 'rays',
          density: 28,
          weight: 0.5
        },
        { type: 'pie', params: { sweep: 90, roundness: 0 }, size: 1.2, rotation: 90, repeat: 2, op: 'keep', smooth: 0 },
        { type: 'circle', size: 0.1, op: 'cut', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-aperture',
    name: 'Aperture',
    group: 'm-rays',
    tags: ['camera', 'shutter', 'lens', 'photo'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', size: 0.8 },
        {
          type: 'box',
          params: { width: 0.0428, height: 1, roundness: 0 },
          x: 0.25,
          y: 0.4153,
          size: 0.5847,
          repeat: 6,
          op: 'cut',
          smooth: 0
        },
        { type: 'polygon', params: { sides: 6, roundness: 0 }, size: 0.2887, op: 'cut', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-sunrise',
    name: 'Sunrise',
    group: 'm-arcs',
    tags: ['rainbow', 'sun', 'horizon', 'arch'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'arc',
          params: { sweep: 180, thickness: 0.6667, roundness: 0 },
          y: 0.425,
          size: 0.9,
          pattern: 'rings',
          density: 9,
          weight: 0.5
        },
        { type: 'pie', params: { sweep: 180, roundness: 0 }, y: 0.425, size: 0.25, rotation: 90 }
      ]
    }
  },
  {
    id: 'm-corner',
    name: 'Corner',
    group: 'm-arcs',
    tags: ['rainbow', 'quarter', 'signal', 'radio'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'arc',
          params: { sweep: 90, thickness: 0.6667, roundness: 0 },
          x: -0.755,
          y: 0.755,
          size: 1.5988,
          rotation: 45,
          pattern: 'rings',
          density: 9,
          weight: 0.5
        },
        { type: 'pie', params: { sweep: 90, roundness: 0 }, x: -0.755, y: 0.755, size: 0.4441, rotation: 135 }
      ]
    }
  },
  {
    id: 'm-arch',
    name: 'Arch',
    group: 'm-arcs',
    tags: ['arch', 'gate', 'lines', 'parallel'],
    ink: true,
    mark: {
      layers: [
        { type: 'box', params: { width: 0.6522, height: 1, roundness: 1 }, y: 0.4, size: 1.15, outline: 0.05 },
        { type: 'box', params: { width: 0.5789, height: 1, roundness: 1 }, y: 0.4, size: 0.95, outline: 0.05 },
        { type: 'box', params: { width: 0.4667, height: 1, roundness: 1 }, y: 0.4, size: 0.75, outline: 0.05 },
        { type: 'box', params: { width: 0.2727, height: 1, roundness: 1 }, y: 0.4, size: 0.55, outline: 0.05 },
        { type: 'box', params: { width: 1, height: 0.3231, roundness: 0 }, y: 1.2, size: 1.3, op: 'cut', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-hook',
    name: 'Hook',
    group: 'm-arcs',
    tags: ['j', 'hook', 'lines', 'parallel'],
    ink: true,
    mark: {
      layers: [
        { type: 'box', params: { width: 0.6522, height: 1, roundness: 1 }, y: -0.4, size: 1.15, outline: 0.05 },
        { type: 'box', params: { width: 0.5789, height: 1, roundness: 1 }, y: -0.4, size: 0.95, outline: 0.05 },
        { type: 'box', params: { width: 0.4667, height: 1, roundness: 1 }, y: -0.4, size: 0.75, outline: 0.05 },
        { type: 'box', params: { width: 0.2727, height: 1, roundness: 1 }, y: -0.4, size: 0.55, outline: 0.05 },
        { type: 'box', params: { width: 1, height: 0.3231, roundness: 0 }, y: -1.2, size: 1.3, op: 'cut', smooth: 0 },
        {
          type: 'box',
          params: { width: 1, height: 0.8, roundness: 0 },
          x: -0.5,
          y: -0.6,
          size: 0.5,
          op: 'cut',
          smooth: 0
        }
      ]
    }
  },
  {
    id: 'm-shell',
    name: 'Shell',
    group: 'm-arcs',
    tags: ['shell', 'fan', 'arcs', 'nautilus'],
    ink: true,
    mark: {
      layers: [
        { type: 'arc', params: { sweep: 180, thickness: 0.1176, roundness: 0 }, y: 0.425, size: 0.85 },
        { type: 'arc', params: { sweep: 180, thickness: 0.1538, roundness: 0 }, x: -0.2, y: 0.425, size: 0.65 },
        { type: 'arc', params: { sweep: 180, thickness: 0.2222, roundness: 0 }, x: -0.4, y: 0.425, size: 0.45 },
        { type: 'arc', params: { sweep: 180, thickness: 0.4, roundness: 0 }, x: -0.6, y: 0.425, size: 0.25 }
      ]
    }
  },
  {
    id: 'm-eccentric',
    name: 'Eccentric',
    group: 'm-arcs',
    tags: ['circles', 'depth', 'tunnel', 'echo'],
    ink: true,
    mark: {
      layers: [
        { type: 'ring', params: { thickness: 0.1037 }, y: -0.03, size: 0.82 },
        { type: 'ring', params: { thickness: 0.1318 }, y: 0.01, size: 0.645 },
        { type: 'ring', params: { thickness: 0.1809 }, y: 0.05, size: 0.47 },
        { type: 'ring', params: { thickness: 0.2881 }, y: 0.09, size: 0.295 },
        { type: 'circle', y: 0.13, size: 0.12 }
      ]
    }
  },
  {
    id: 'm-ripple',
    name: 'Ripple',
    group: 'm-arcs',
    tags: ['rings', 'ripple', 'wave', 'echo'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'box',
          params: { width: 1, height: 1, roundness: 0 },
          x: 0.34,
          y: -0.34,
          size: 1.56,
          pattern: 'rings',
          density: 13,
          weight: 0.5
        },
        { type: 'circle', size: 0.84, op: 'keep', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-golden',
    name: 'Golden',
    group: 'm-arcs',
    tags: ['spiral', 'swirl', 'golden', 'shell'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'arc',
          params: { sweep: 91.5, thickness: 0.1235, roundness: 0 },
          x: 0.1514,
          y: 0.475,
          size: 1.0125,
          rotation: -44.25
        },
        {
          type: 'arc',
          params: { sweep: 93, thickness: 0.1924, roundness: 0 },
          x: 0.1514,
          y: 0.1121,
          size: 0.6496,
          rotation: 45
        },
        {
          type: 'arc',
          params: { sweep: 93, thickness: 0.2939, roundness: 0 },
          x: 0.3757,
          y: 0.1121,
          size: 0.4254,
          rotation: 135
        },
        {
          type: 'arc',
          params: { sweep: 93, thickness: 0.4359, roundness: 0 },
          x: 0.3757,
          y: 0.2507,
          size: 0.2868,
          rotation: -135
        },
        {
          type: 'arc',
          params: { sweep: 93, thickness: 0.6216, roundness: 0 },
          x: 0.29,
          y: 0.2507,
          size: 0.2011,
          rotation: -45
        },
        {
          type: 'arc',
          params: { sweep: 93, thickness: 0.8437, roundness: 0 },
          x: 0.29,
          y: 0.1978,
          size: 0.1482,
          rotation: 45
        }
      ]
    }
  },
  {
    id: 'm-waves',
    name: 'Waves',
    group: 'm-arcs',
    tags: ['water', 'wave', 'flow', 'sea'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'wave',
          params: { waves: 2, amplitude: 0.6, thickness: 0.14 },
          size: 0.8,
          repeat: 4,
          layout: 'column',
          gap: 0.5
        }
      ]
    }
  },
  {
    id: 'm-astroid',
    name: 'Astroid',
    group: 'm-forms',
    tags: ['star', 'sparkle', 'spark', 'shine'],
    ink: true,
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 1, roundness: 0 }, size: 0.84 },
        { type: 'circle', x: 1.1879, size: 0.84, repeat: 4, spin: 45, op: 'cut', smooth: 0.1 }
      ]
    }
  },
  {
    id: 'm-bite',
    name: 'Bite',
    group: 'm-forms',
    tags: ['square', 'notch', 'tile', 'soft'],
    ink: true,
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 1, roundness: 0.4 }, size: 0.74 },
        { type: 'circle', x: 1.0465, size: 0.42, repeat: 4, spin: 45, op: 'cut', smooth: 0.04 }
      ]
    }
  },
  {
    id: 'm-nested',
    name: 'Nested',
    group: 'm-forms',
    tags: ['diamond', 'square', 'op art', 'concentric'],
    ink: true,
    mark: {
      layers: [
        { type: 'diamond', params: { width: 1, height: 1, roundness: 0 }, size: 1.48 },
        { type: 'diamond', params: { width: 1, height: 1, roundness: 0 }, size: 1.2686, op: 'exclude' },
        { type: 'diamond', params: { width: 1, height: 1, roundness: 0 }, size: 1.0571, op: 'exclude' },
        { type: 'diamond', params: { width: 1, height: 1, roundness: 0 }, size: 0.8457, op: 'exclude' },
        { type: 'diamond', params: { width: 1, height: 1, roundness: 0 }, size: 0.6343, op: 'exclude' },
        { type: 'diamond', params: { width: 1, height: 1, roundness: 0 }, size: 0.4229, op: 'exclude' },
        { type: 'diamond', params: { width: 1, height: 1, roundness: 0 }, size: 0.2114, op: 'exclude' },
        { type: 'box', params: { width: 1, height: 1, roundness: 0 }, size: 0.74, op: 'keep', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-quadrants',
    name: 'Quadrants',
    group: 'm-forms',
    tags: ['triangles', 'square', 'diamond', 'bauhaus'],
    ink: true,
    mark: {
      layers: [
        { type: 'triangle', params: { width: 1, roundness: 0 }, x: -0.58, y: -0.58, size: 0.5091, rotation: -45 },
        { type: 'triangle', params: { width: 1, roundness: 0 }, x: 0.58, y: -0.58, size: 0.5091, rotation: 45 },
        { type: 'triangle', params: { width: 1, roundness: 0 }, x: -0.58, y: 0.58, size: 0.5091, rotation: -135 },
        { type: 'triangle', params: { width: 1, roundness: 0 }, x: 0.58, y: 0.58, size: 0.5091, rotation: 135 }
      ]
    }
  },
  {
    id: 'm-vane',
    name: 'Vane',
    group: 'm-forms',
    tags: ['triangles', 'pinwheel', 'windmill', 'spin'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'triangle',
          params: { width: 1, roundness: 0 },
          x: -0.2,
          y: -0.6,
          size: 0.5657,
          rotation: 45,
          repeat: 4
        }
      ]
    }
  },
  {
    id: 'm-chain',
    name: 'Chain',
    group: 'm-forms',
    tags: ['link', 'chain', 'connect', 'together'],
    ink: true,
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 1, roundness: 0.36 }, x: -0.22, y: -0.22, size: 0.5, outline: 0.05 },
        { type: 'box', params: { width: 1, height: 1, roundness: 0.36 }, x: 0.22, y: 0.22, size: 0.5, outline: 0.05 },
        {
          type: 'box',
          params: { width: 1, height: 0.7273, roundness: 0 },
          x: -0.28,
          y: 0.28,
          size: 0.11,
          op: 'cut',
          smooth: 0
        },
        { type: 'box', params: { width: 1, height: 1, roundness: 0.36 }, x: 0.22, y: 0.22, size: 0.5, outline: 0.05 },
        {
          type: 'box',
          params: { width: 0.7273, height: 1, roundness: 0 },
          x: 0.28,
          y: -0.28,
          size: 0.11,
          op: 'cut',
          smooth: 0
        },
        { type: 'box', params: { width: 0.3846, height: 1, roundness: 0 }, x: 0.28, y: -0.28, size: 0.13 }
      ]
    }
  },
  {
    id: 'm-isometric',
    name: 'Isometric',
    group: 'm-forms',
    tags: ['cube', 'isometric', 'box', 'stripes'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'diamond',
          params: { width: 1, height: 0.5774, roundness: 0 },
          y: -0.43,
          size: 0.7448,
          repeat: 3,
          pattern: 'lines',
          density: 10,
          weight: 0.5,
          patternAngle: 150
        },
        {
          type: 'box',
          params: { width: 1, height: 0.06, roundness: 0 },
          y: 0.5,
          size: 0.5,
          rotation: 90,
          repeat: 3,
          op: 'cut',
          smooth: 0
        }
      ]
    }
  },
  {
    id: 'm-cross',
    name: 'Cross',
    group: 'm-forms',
    tags: ['x', 'cross', 'close', 'kiss'],
    ink: true,
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 0.1416, roundness: 1 }, size: 0.9885, rotation: 45 },
        { type: 'box', params: { width: 1, height: 0.1416, roundness: 1 }, size: 0.9885, rotation: 135, op: 'exclude' }
      ]
    }
  },
  {
    id: 'm-trefoil',
    name: 'Trefoil',
    group: 'm-forms',
    tags: ['circles', 'three', 'overlap', 'venn'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', y: -0.32, size: 0.47 },
        { type: 'circle', x: 0.3204, y: 0.235, size: 0.47, op: 'exclude' },
        { type: 'circle', x: -0.3204, y: 0.235, size: 0.47, op: 'exclude' }
      ]
    }
  },
  {
    id: 'm-metaball',
    name: 'Metaball',
    group: 'm-forms',
    tags: ['blob', 'liquid', 'lobes', 'soft'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', y: -0.45, size: 0.33 },
        { type: 'circle', x: 0.45, size: 0.33, op: 'merge', smooth: 0.3 },
        { type: 'circle', y: 0.45, size: 0.33, op: 'merge', smooth: 0.3 },
        { type: 'circle', x: -0.45, size: 0.33, op: 'merge', smooth: 0.3 }
      ]
    }
  },
  {
    id: 'm-quarter-n',
    name: 'Quarter N',
    group: 'm-forms',
    tags: ['n', 'letter', 'quarter', 'bauhaus'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', params: { stretch: 0.5 }, x: -0.67, y: 0.67, size: 1.34, rotation: 90 },
        { type: 'circle', params: { stretch: 0.5 }, x: 0.67, y: -0.67, size: 1.34, rotation: 90 },
        { type: 'box', params: { width: 1, height: 1, roundness: 0 }, size: 0.67, op: 'keep', smooth: 0 }
      ]
    }
  },
  {
    id: 'm-propeller',
    name: 'Propeller',
    group: 'm-forms',
    tags: ['leaves', 'spin', 'fan', 'four'],
    ink: true,
    mark: {
      layers: [
        { type: 'leaf', params: { width: 0.44, roundness: 0 }, x: 0.4, y: -0.17, size: 0.44, rotation: 90, repeat: 4 }
      ]
    }
  },
  {
    id: 'm-striped-s',
    name: 'Striped S',
    group: 'm-type',
    tags: ['letter', 's', 'stripes', 'initial'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'text',
          text: { value: 'S', font: 'Archivo Black', weight: 400 },
          size: 0.94,
          pattern: 'lines',
          density: 12,
          weight: 0.56
        }
      ]
    }
  },
  {
    id: 'm-halftone-a',
    name: 'Halftone a',
    group: 'm-type',
    tags: ['letter', 'a', 'dots', 'initial'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', size: 0.84, pattern: 'halftone', density: 11, weight: 0.94, taper: 0.7 },
        { type: 'box', params: { width: 1, height: 1, roundness: 0 }, size: 0.3818, op: 'cut', smooth: 0 },
        { type: 'text', text: { value: 'a', font: 'Geist', weight: 800 }, size: 0.44 }
      ]
    }
  },
  {
    id: 'm-cut-g',
    name: 'Cut G',
    group: 'm-type',
    tags: ['letter', 'g', 'monogram', 'stripes'],
    ink: true,
    mark: {
      layers: [
        { type: 'circle', size: 0.84, pattern: 'lines', density: 13, weight: 0.56 },
        {
          type: 'text',
          text: { value: 'G', font: 'Geist', weight: 900 },
          size: 0.7,
          round: 0.035,
          op: 'cut',
          smooth: 0
        }
      ]
    }
  },
  {
    id: 'm-tile-y',
    name: 'Tile y',
    group: 'm-type',
    tags: ['letter', 'y', 'serif', 'initial'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'box',
          params: { width: 1, height: 1, roundness: 0.18 },
          size: 0.74,
          pattern: 'lines',
          density: 13,
          weight: 0.5,
          patternAngle: 135
        },
        {
          type: 'text',
          text: { value: 'y', font: 'Fraunces', weight: 800 },
          size: 0.7,
          round: 0.05,
          op: 'cut',
          smooth: 0
        },
        { type: 'text', text: { value: 'y', font: 'Fraunces', weight: 800 }, size: 0.7 }
      ]
    }
  },
  {
    id: 'm-amp',
    name: 'Amp',
    group: 'm-type',
    tags: ['ampersand', 'and', 'stripes', 'studio'],
    ink: true,
    mark: {
      layers: [
        {
          type: 'text',
          text: { value: '&', font: 'Bricolage Grotesque', weight: 800 },
          size: 0.96,
          pattern: 'lines',
          density: 14,
          weight: 0.56
        }
      ]
    }
  },
  {
    id: 'm-split-e',
    name: 'Split e',
    group: 'm-type',
    tags: ['letter', 'e', 'contrast', 'half'],
    ink: true,
    mark: {
      layers: [
        { type: 'text', text: { value: 'e', font: 'Geist', weight: 900 }, x: -0.04, size: 0.9 },
        { type: 'box', params: { width: 0.5065, height: 1, roundness: 0 }, x: 0.35, size: 0.77, op: 'exclude' }
      ]
    }
  }
];

export const MODERN_MARKS_BY_ID = Object.fromEntries(MODERN_MARKS.map(mark => [mark.id, mark]));

export const DEFAULT_MODERN = 'm-bite';
