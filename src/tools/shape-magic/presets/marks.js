import { DEFAULT_MODERN, MODERN_GROUPS, MODERN_MARKS } from './modern';

const CLASSIC_GROUPS = [
  { id: 'geometric', label: 'Geometric' },
  { id: 'organic', label: 'Organic' },
  { id: 'liquid', label: 'Liquid' },
  { id: 'symbols', label: 'Symbols' },
  { id: 'badges', label: 'Badges' },
  { id: 'letters', label: 'Lettermarks' },
  { id: 'line', label: 'Outline' }
];

const tomato = { kind: 'solid', color1: '#ff5640', color2: '#e5383b', color3: '#b8243a' };
const tangerine = { kind: 'solid', color1: '#ff7a1c', color2: '#f0561a', color3: '#c93d12' };
const amber = { kind: 'solid', color1: '#ffb21e', color2: '#ff8a14', color3: '#e5600f' };
const emerald = { kind: 'solid', color1: '#12b76a', color2: '#0b8f55', color3: '#086b44' };
const teal = { kind: 'solid', color1: '#0fb5a6', color2: '#0b8f88', color3: '#0a6b6a' };
const cobalt = { kind: 'solid', color1: '#2f6bff', color2: '#2447d6', color3: '#1c32a8' };
const ink = { kind: 'solid', color1: '#323f9c', color2: '#26307a', color3: '#1c2459' };
const rose = { kind: 'solid', color1: '#ff4f8b', color2: '#e5306d', color3: '#b81f55' };
const chalk = { kind: 'solid', color1: '#d8cdb8', color2: '#b8ab94', color3: '#8f8571' };
const sunset = { kind: 'linear', color1: '#ffb36b', color2: '#ff4f5e', color3: '#c2367a', angle: 160 };
const ocean = { kind: 'linear', color1: '#7fd7ff', color2: '#2f5bff', color3: '#2a2fb8', angle: 160 };
const jade = { kind: 'linear', color1: '#7af0c0', color2: '#0f9d76', color3: '#0b6b5a', angle: 160 };
const berry = { kind: 'linear', color1: '#ff9ac1', color2: '#e0336b', color3: '#9e1f5a', angle: 160 };
const citrus = { kind: 'linear', color1: '#ffe066', color2: '#ff8a1f', color3: '#e8541a', angle: 160 };
const flame = { kind: 'linear', color1: '#ffd166', color2: '#ff4d2e', color3: '#c42a3c', angle: 180 };
const sky = { kind: 'linear', color1: '#a5e4ff', color2: '#3a8dff', color3: '#2b55d6', angle: 180 };
const coral = { kind: 'linear', color1: '#ff8f5a', color2: '#e5304f', color3: '#a8204f', angle: 160 };
const forest = { kind: 'linear', color1: '#6fdc8c', color2: '#127a4a', color3: '#0b5235', angle: 180 };
const marigold = { kind: 'radial', color1: '#ffd36b', color2: '#ff5a3c', color3: '#d6304a', extent: 0.9 };
const dusk = { kind: 'linear', color1: '#ffd29a', color2: '#ff5d8f', color3: '#c2367a', stops: 3, angle: 150 };
const sweep = { kind: 'conic', color1: '#ffb36b', color2: '#ff4f5e', color3: '#ffb36b', stops: 3, angle: 0 };

const CLASSIC_MARKS = [
  {
    id: 'hexa',
    name: 'Cube',
    group: 'geometric',
    tags: ['box', 'hexagon', 'isometric', '3d'],
    mark: {
      layers: [
        { type: 'polygon', params: { sides: 6, roundness: 0.18 }, size: 0.86 },
        {
          type: 'wave',
          params: { waves: 1, amplitude: 0, thickness: 0.26 },
          x: 0.5,
          size: 0.5,
          repeat: 3,
          spin: 90,
          op: 'cut',
          smooth: 0
        }
      ]
    },
    fill: cobalt
  },
  {
    id: 'orbit',
    name: 'Orbit',
    group: 'geometric',
    tags: ['ring', 'planet', 'satellite', 'space'],
    mark: {
      layers: [
        { type: 'ring', params: { thickness: 0.24 }, size: 0.74 },
        { type: 'circle', x: 0.5, y: -0.5, size: 0.26, op: 'cut', smooth: 0.06 },
        { type: 'circle', x: 0.5, y: -0.5, size: 0.15, op: 'add' }
      ]
    },
    fill: sky
  },
  {
    id: 'spark',
    name: 'Spark',
    group: 'geometric',
    tags: ['star', 'sparkle', 'shine', 'twinkle'],
    mark: { layers: [{ type: 'star', params: { points: 4, inner: 0.46, roundness: 0.35 }, size: 0.86 }] },
    fill: citrus
  },
  {
    id: 'knot',
    name: 'Knot',
    group: 'geometric',
    tags: ['rings', 'weave', 'trinity', 'interlocked'],
    mark: {
      layers: [
        { type: 'ring', params: { thickness: 0.2222 }, y: -0.3, size: 0.54 },
        { type: 'ring', params: { thickness: 0.2222 }, x: 0.2598, y: 0.15, size: 0.54, op: 'add' },
        { type: 'ring', params: { thickness: 0.2222 }, x: -0.2598, y: 0.15, size: 0.54, op: 'add' },
        {
          type: 'arc',
          params: { sweep: 64, thickness: 0.3158, roundness: 0 },
          x: 0.15,
          y: 0.2598,
          size: 0.57,
          rotation: 57.2,
          repeat: 3,
          spin: -30,
          op: 'cut',
          smooth: 0
        },
        {
          type: 'arc',
          params: { sweep: 80, thickness: 0.2222, roundness: 0 },
          x: 0.15,
          y: 0.2598,
          size: 0.54,
          rotation: 57.2,
          repeat: 3,
          spin: -30,
          op: 'add'
        },
        {
          type: 'arc',
          params: { sweep: 64, thickness: 0.3158, roundness: 0 },
          x: -0.15,
          y: -0.2598,
          size: 0.57,
          rotation: 122.8,
          repeat: 3,
          spin: 150,
          op: 'cut',
          smooth: 0
        },
        {
          type: 'arc',
          params: { sweep: 80, thickness: 0.2222, roundness: 0 },
          x: -0.15,
          y: -0.2598,
          size: 0.54,
          rotation: 122.8,
          repeat: 3,
          spin: 150,
          op: 'add'
        }
      ]
    },
    fill: teal
  },
  {
    id: 'portal',
    name: 'Portal',
    group: 'geometric',
    tags: ['arch', 'door', 'gate', 'squircle'],
    mark: {
      layers: [
        { type: 'squircle', params: { roundness: 0.55 }, size: 0.82 },
        { type: 'circle', size: 0.34, op: 'cut', smooth: 0 },
        { type: 'box', params: { width: 0.67, height: 1, roundness: 0 }, y: 0.48, size: 0.5, op: 'cut', smooth: 0 }
      ]
    },
    fill: berry
  },
  {
    id: 'pinwheel',
    name: 'Pinwheel',
    group: 'geometric',
    tags: ['fan', 'spin', 'blades', 'motion'],
    mark: {
      layers: [
        {
          type: 'pie',
          params: { sweep: 180, roundness: 0.3 },
          x: 0.325,
          y: -0.269,
          size: 0.4,
          rotation: -135,
          repeat: 4
        }
      ]
    },
    fill: sweep
  },
  {
    id: 'stack',
    name: 'Stack',
    group: 'geometric',
    tags: ['layers', 'stack', 'diamond', 'data'],
    mark: {
      layers: [
        { type: 'diamond', params: { width: 1, height: 0.56, roundness: 0.35 }, y: 0.3, size: 0.84 },
        {
          type: 'diamond',
          params: { width: 1, height: 0.56, roundness: 0.35 },
          y: 0.1,
          size: 0.96,
          op: 'cut',
          smooth: 0
        },
        { type: 'diamond', params: { width: 1, height: 0.56, roundness: 0.35 }, y: 0.03, size: 0.84, op: 'add' },
        {
          type: 'diamond',
          params: { width: 1, height: 0.56, roundness: 0.35 },
          y: -0.17,
          size: 0.96,
          op: 'cut',
          smooth: 0
        },
        { type: 'diamond', params: { width: 1, height: 0.56, roundness: 0.35 }, y: -0.24, size: 0.84, op: 'add' }
      ]
    },
    fill: ink
  },
  {
    id: 'tile',
    name: 'Tile',
    group: 'geometric',
    tags: ['square', 'quarter', 'star', 'bauhaus'],
    mark: {
      layers: [{ type: 'pie', params: { sweep: 90, roundness: 0 }, x: 0.98, size: 0.68, repeat: 4, spin: 45 }]
    },
    fill: tomato
  },
  {
    id: 'speed',
    name: 'Speed',
    group: 'geometric',
    tags: ['stripes', 'motion', 'sport', 'fast'],
    mark: {
      layers: [
        {
          type: 'wave',
          params: { waves: 1, amplitude: 0, thickness: 0.34 },
          x: -0.4879,
          y: -0.4879,
          size: 1,
          rotation: -45
        },
        {
          type: 'wave',
          params: { waves: 1, amplitude: 0, thickness: 0.34 },
          x: -0.1626,
          y: -0.1626,
          size: 1,
          rotation: -45,
          op: 'add'
        },
        {
          type: 'wave',
          params: { waves: 1, amplitude: 0, thickness: 0.34 },
          x: 0.1626,
          y: 0.1626,
          size: 1,
          rotation: -45,
          op: 'add'
        },
        {
          type: 'wave',
          params: { waves: 1, amplitude: 0, thickness: 0.34 },
          x: 0.4879,
          y: 0.4879,
          size: 1,
          rotation: -45,
          op: 'add'
        },
        { type: 'circle', size: 0.84, op: 'keep', smooth: 0 }
      ]
    },
    fill: ocean
  },
  {
    id: 'split',
    name: 'Split',
    group: 'geometric',
    tags: ['half', 'bauhaus', 'contrast', 'balance'],
    mark: {
      layers: [
        { type: 'circle', size: 0.8 },
        { type: 'box', params: { width: 0.5, height: 1, roundness: 0 }, x: 0.4, size: 0.8, op: 'exclude' }
      ]
    },
    fill: emerald
  },
  {
    id: 'bloom',
    name: 'Bloom',
    group: 'organic',
    tags: ['flower', 'petals', 'blossom', 'spring'],
    mark: {
      layers: [
        { type: 'circle', params: { stretch: 0.55 }, x: 0.5, size: 0.36, repeat: 6, spin: -90 },
        { type: 'circle', size: 0.36, op: 'merge', smooth: 0.16 },
        { type: 'circle', size: 0.13, op: 'cut', smooth: 0.04 }
      ]
    },
    fill: marigold
  },
  {
    id: 'laurel',
    name: 'Laurel',
    group: 'organic',
    tags: ['wreath', 'award', 'leaves', 'victory'],
    mark: {
      layers: [
        {
          type: 'leaf',
          params: { width: 0.5, roundness: 0.3 },
          x: 0.7,
          size: 0.18,
          rotation: 25,
          repeat: 12,
          spin: 15,
          mirror: true
        },
        {
          type: 'leaf',
          params: { width: 0.5, roundness: 0.3 },
          x: 0.1812,
          y: -0.6761,
          size: 0.18,
          rotation: -50,
          round: 0.02,
          mirror: true,
          op: 'cut',
          smooth: 0
        },
        { type: 'star', params: { points: 5, inner: 0.5, roundness: 0.3 }, y: 0.02, size: 0.3, op: 'add' }
      ]
    },
    fill: amber
  },
  {
    id: 'pebble',
    name: 'Cairn',
    group: 'organic',
    tags: ['stones', 'balance', 'calm', 'pebble'],
    mark: {
      layers: [
        { type: 'circle', params: { stretch: 0.5 }, y: 0.47, size: 0.62 },
        { type: 'circle', params: { stretch: 0.55 }, x: 0.04, y: -0.11, size: 0.44, rotation: -6, op: 'add' },
        { type: 'circle', params: { stretch: 0.62 }, x: -0.02, y: -0.58, size: 0.3, rotation: 8, op: 'add' }
      ]
    },
    fill: chalk
  },
  {
    id: 'clover',
    name: 'Clover',
    group: 'organic',
    tags: ['luck', 'leaf', 'hearts', 'nature'],
    mark: {
      layers: [
        {
          type: 'heart',
          params: { width: 0.5, roundness: 0.3 },
          x: 0.4,
          size: 0.4,
          rotation: 90,
          repeat: 4,
          spin: -45
        }
      ]
    },
    fill: emerald
  },
  {
    id: 'sprout',
    name: 'Sprout',
    group: 'organic',
    tags: ['plant', 'seedling', 'grow', 'leaves'],
    mark: {
      layers: [
        { type: 'leaf', params: { width: 0.55, roundness: 0.2 }, x: -0.3, y: -0.33, size: 0.44, rotation: -50 },
        {
          type: 'leaf',
          params: { width: 0.55, roundness: 0.2 },
          x: 0.3,
          y: -0.33,
          size: 0.44,
          rotation: 50,
          op: 'add'
        },
        { type: 'box', params: { width: 0.2, height: 1, roundness: 1 }, y: 0.27, size: 0.38, op: 'add' }
      ]
    },
    fill: jade
  },
  {
    id: 'tidal',
    name: 'Tidal',
    group: 'organic',
    tags: ['waves', 'water', 'ocean', 'sea'],
    mark: {
      layers: [
        { type: 'circle', size: 0.84 },
        {
          type: 'wave',
          params: { waves: 1.5, amplitude: 0.22, thickness: 0.12 },
          y: -0.12,
          size: 0.9,
          op: 'cut',
          smooth: 0
        },
        {
          type: 'wave',
          params: { waves: 1.5, amplitude: 0.22, thickness: 0.12 },
          y: 0.22,
          size: 0.9,
          op: 'cut',
          smooth: 0
        }
      ]
    },
    fill: ocean
  },
  {
    id: 'petals',
    name: 'Lotus',
    group: 'organic',
    tags: ['flower', 'yoga', 'calm', 'wellness'],
    mark: {
      layers: [
        { type: 'leaf', params: { width: 0.5, roundness: 0.2 }, y: -0.04, size: 0.6 },
        {
          type: 'leaf',
          params: { width: 0.5, roundness: 0.2 },
          x: 0.3078,
          y: 0.166,
          size: 0.5,
          rotation: 38,
          mirror: true,
          op: 'add'
        },
        {
          type: 'leaf',
          params: { width: 0.5, roundness: 0.2 },
          x: 0.3687,
          y: 0.4681,
          size: 0.38,
          rotation: 76,
          mirror: true,
          op: 'add'
        }
      ]
    },
    fill: berry
  },
  {
    id: 'pine',
    name: 'Pine',
    group: 'organic',
    tags: ['tree', 'forest', 'outdoors', 'evergreen'],
    mark: {
      layers: [
        { type: 'triangle', params: { width: 0.75, roundness: 0.3 }, y: -0.52, size: 0.36 },
        { type: 'triangle', params: { width: 0.75, roundness: 0.3 }, y: -0.2, size: 0.5, op: 'add' },
        { type: 'triangle', params: { width: 0.75, roundness: 0.3 }, y: 0.17, size: 0.64, op: 'add' },
        { type: 'box', params: { width: 0.24, height: 1, roundness: 0.3 }, y: 0.62, size: 0.18, op: 'add' }
      ]
    },
    fill: forest
  },
  {
    id: 'twins',
    name: 'Twins',
    group: 'liquid',
    tags: ['cells', 'split', 'goo', 'pair'],
    mark: {
      layers: [
        { type: 'circle', x: -0.31, y: 0.31, size: 0.39 },
        { type: 'circle', x: 0.31, y: -0.31, size: 0.39, op: 'merge', smooth: 0.44 }
      ]
    },
    fill: dusk
  },
  {
    id: 'blocks',
    name: 'Fuse',
    group: 'liquid',
    tags: ['square', 'circle', 'morph', 'shapes'],
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 1, roundness: 0.3 }, x: -0.3, y: -0.3, size: 0.42 },
        { type: 'circle', x: 0.36, y: 0.36, size: 0.4, op: 'merge', smooth: 0.34 }
      ]
    },
    fill: tangerine
  },
  {
    id: 'drip',
    name: 'Drip',
    group: 'liquid',
    tags: ['drop', 'melt', 'paint', 'goo'],
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 0.5, roundness: 1 }, y: -0.36, size: 0.8 },
        {
          type: 'box',
          params: { width: 0.3103, height: 1, roundness: 1 },
          x: -0.44,
          size: 0.29,
          op: 'merge',
          smooth: 0.14
        },
        {
          type: 'box',
          params: { width: 0.2, height: 1, roundness: 1 },
          x: -0.06,
          y: 0.16,
          size: 0.45,
          op: 'merge',
          smooth: 0.14
        },
        {
          type: 'box',
          params: { width: 0.4091, height: 1, roundness: 1 },
          x: 0.38,
          y: -0.07,
          size: 0.22,
          op: 'merge',
          smooth: 0.14
        },
        { type: 'circle', x: -0.06, y: 0.72, size: 0.07 }
      ]
    },
    fill: rose
  },
  {
    id: 'molecule',
    name: 'Molecule',
    group: 'liquid',
    tags: ['atom', 'science', 'node', 'goo'],
    mark: {
      layers: [
        { type: 'circle', y: 0.08, size: 0.34 },
        { type: 'circle', y: -0.52, size: 0.2, op: 'merge', smooth: 0.3 },
        { type: 'circle', x: 0.5196, y: 0.38, size: 0.2, op: 'merge', smooth: 0.3 },
        { type: 'circle', x: -0.5196, y: 0.38, size: 0.2, op: 'merge', smooth: 0.3 }
      ]
    },
    fill: teal
  },
  {
    id: 'plus',
    name: 'Plus',
    group: 'liquid',
    tags: ['cross', 'health', 'add', 'soft'],
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 0.38, roundness: 1 }, size: 0.82 },
        {
          type: 'box',
          params: { width: 1, height: 0.38, roundness: 1 },
          size: 0.82,
          rotation: 90,
          op: 'merge',
          smooth: 0.3
        }
      ]
    },
    fill: jade
  },
  {
    id: 'cloud',
    name: 'Cloud',
    group: 'liquid',
    tags: ['weather', 'sky', 'storage', 'soft'],
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 0.36, roundness: 1 }, y: 0.26, size: 0.8 },
        { type: 'circle', x: -0.24, size: 0.34, op: 'merge', smooth: 0.12 },
        { type: 'circle', x: 0.2, y: -0.12, size: 0.44, op: 'merge', smooth: 0.12 }
      ]
    },
    fill: sky
  },
  {
    id: 'splat',
    name: 'Splat',
    group: 'liquid',
    tags: ['ink', 'paint', 'splash', 'drops'],
    mark: {
      layers: [
        { type: 'circle', x: -0.03, y: 0.1, size: 0.44 },
        { type: 'circle', x: 0.43, y: -0.16, size: 0.16, op: 'merge', smooth: 0.2 },
        { type: 'circle', x: -0.47, y: -0.2, size: 0.13, op: 'merge', smooth: 0.2 },
        { type: 'circle', x: -0.33, y: 0.56, size: 0.15, op: 'merge', smooth: 0.2 },
        { type: 'circle', x: 0.31, y: 0.52, size: 0.11, op: 'merge', smooth: 0.2 },
        { type: 'circle', x: 0.05, y: -0.4, size: 0.1, op: 'merge', smooth: 0.2 },
        { type: 'circle', x: 0.69, y: 0.2, size: 0.065, op: 'add' },
        { type: 'circle', x: -0.71, y: 0.26, size: 0.05, op: 'add' },
        { type: 'circle', x: 0.17, y: -0.68, size: 0.06, op: 'add' }
      ]
    },
    fill: ink
  },
  {
    id: 'pulse',
    name: 'Pulse',
    group: 'symbols',
    tags: ['heart', 'love', 'health', 'beat'],
    mark: {
      layers: [
        { type: 'heart', params: { width: 0.5, roundness: 0.35 }, y: 0.02, size: 0.84 },
        {
          type: 'wave',
          params: { waves: 1, amplitude: 0.3, thickness: 0.12 },
          y: -0.02,
          size: 0.92,
          op: 'cut',
          smooth: 0
        }
      ]
    },
    fill: rose
  },
  {
    id: 'bolt',
    name: 'Bolt',
    group: 'symbols',
    tags: ['lightning', 'energy', 'fast', 'power'],
    mark: {
      layers: [
        { type: 'triangle', params: { width: 0.34, roundness: 0.25 }, x: -0.12, y: -0.3, size: 0.56, rotation: 24.6 },
        {
          type: 'triangle',
          params: { width: 0.34, roundness: 0.25 },
          x: 0.12,
          y: 0.3,
          size: 0.56,
          rotation: 204.6,
          op: 'merge',
          smooth: 0.03
        }
      ]
    },
    fill: amber
  },
  {
    id: 'pin',
    name: 'Pin',
    group: 'symbols',
    tags: ['map', 'location', 'place', 'marker'],
    mark: {
      layers: [
        { type: 'drop', params: { length: 0.45, roundness: 0.15 }, size: 0.86, rotation: 180 },
        { type: 'circle', y: -0.2, size: 0.24, op: 'cut', smooth: 0 }
      ]
    },
    fill: tomato
  },
  {
    id: 'night',
    name: 'Night',
    group: 'symbols',
    tags: ['moon', 'crescent', 'star', 'sleep'],
    mark: {
      layers: [
        { type: 'moon', params: { phase: 0.42, roundness: 0.4 }, x: -0.06, y: 0.06, size: 0.78, rotation: -25 },
        { type: 'star', params: { points: 4, inner: 0.45, roundness: 0.35 }, x: 0.48, y: -0.44, size: 0.26, op: 'add' }
      ]
    },
    fill: ink
  },
  {
    id: 'sunset',
    name: 'Sunset',
    group: 'symbols',
    tags: ['sun', 'retro', 'horizon', 'summer'],
    mark: {
      layers: [
        { type: 'circle', size: 0.84 },
        { type: 'wave', params: { waves: 1, amplitude: 0, thickness: 0.07 }, y: 0.14, size: 1, op: 'cut', smooth: 0 },
        { type: 'wave', params: { waves: 1, amplitude: 0, thickness: 0.11 }, y: 0.36, size: 1, op: 'cut', smooth: 0 },
        { type: 'wave', params: { waves: 1, amplitude: 0, thickness: 0.15 }, y: 0.6, size: 1, op: 'cut', smooth: 0 }
      ]
    },
    fill: sunset
  },
  {
    id: 'iris',
    name: 'Iris',
    group: 'symbols',
    tags: ['eye', 'vision', 'see', 'focus'],
    mark: {
      layers: [
        { type: 'leaf', params: { width: 0.58, roundness: 0.25 }, size: 0.84, rotation: 90 },
        { type: 'circle', size: 0.34, op: 'cut', smooth: 0 },
        { type: 'circle', size: 0.19, op: 'add' }
      ]
    },
    fill: teal
  },
  {
    id: 'summit',
    name: 'Summit',
    group: 'symbols',
    tags: ['mountain', 'peak', 'outdoors', 'climb'],
    mark: {
      layers: [
        { type: 'triangle', params: { width: 0.62, roundness: 0.1 }, x: 0.15, y: -0.03, size: 0.72 },
        {
          type: 'triangle',
          params: { width: 0.62, roundness: 0.1 },
          x: -0.38,
          y: 0.19,
          size: 0.48,
          outline: 0.06,
          op: 'cut',
          smooth: 0
        },
        { type: 'triangle', params: { width: 0.62, roundness: 0.1 }, x: -0.38, y: 0.19, size: 0.48, op: 'add' }
      ]
    },
    fill: ocean
  },
  {
    id: 'north',
    name: 'North',
    group: 'symbols',
    tags: ['compass', 'star', 'direction', 'explore'],
    mark: {
      layers: [
        { type: 'circle', size: 0.5 },
        { type: 'star', params: { points: 4, inner: 0.36, roundness: 0.2 }, size: 0.86, op: 'exclude' }
      ]
    },
    fill: emerald
  },
  {
    id: 'flame',
    name: 'Flame',
    group: 'symbols',
    tags: ['fire', 'hot', 'energy', 'torch'],
    mark: {
      layers: [
        { type: 'drop', params: { length: 0.55, roundness: 0.15 }, size: 0.86 },
        { type: 'circle', x: 0.48, y: -0.42, size: 0.36, op: 'cut', smooth: 0.06 },
        { type: 'drop', params: { length: 0.35, roundness: 0.2 }, x: -0.02, y: 0.38, size: 0.3, op: 'cut', smooth: 0 }
      ]
    },
    fill: flame
  },
  {
    id: 'burst',
    name: 'Burst',
    group: 'badges',
    tags: ['sticker', 'sale', 'star', 'new'],
    mark: {
      layers: [
        { type: 'star', params: { points: 16, inner: 0.62, roundness: 0.3 }, size: 0.86 },
        { type: 'star', params: { points: 5, inner: 0.5, roundness: 0.3 }, size: 0.34, op: 'cut', smooth: 0 }
      ]
    },
    fill: tangerine
  },
  {
    id: 'verified',
    name: 'Verified',
    group: 'badges',
    tags: ['check', 'seal', 'trust', 'approved'],
    mark: {
      layers: [
        { type: 'star', params: { points: 12, inner: 0.82, roundness: 0.8 }, size: 0.86 },
        {
          type: 'wave',
          params: { waves: 1, amplitude: 0, thickness: 0.5224 },
          x: -0.21,
          y: 0.07,
          size: 0.2488,
          rotation: 45,
          op: 'cut',
          smooth: 0
        },
        {
          type: 'wave',
          params: { waves: 1, amplitude: 0, thickness: 0.3266 },
          x: 0.14,
          y: -0.05,
          size: 0.398,
          rotation: -48.65,
          op: 'cut',
          smooth: 0
        }
      ]
    },
    fill: cobalt
  },
  {
    id: 'crest',
    name: 'Crest',
    group: 'badges',
    tags: ['shield', 'chevron', 'rank', 'secure'],
    mark: {
      layers: [
        { type: 'shield', params: { width: 0.84, point: 0.6, roundness: 0.35 }, size: 0.86 },
        {
          type: 'chevron',
          params: { angle: 100, thickness: 0.3, roundness: 0.3 },
          y: 0.02,
          size: 0.52,
          op: 'cut',
          smooth: 0
        },
        {
          type: 'chevron',
          params: { angle: 100, thickness: 0.3, roundness: 0.3 },
          y: -0.3,
          size: 0.52,
          op: 'cut',
          smooth: 0
        }
      ]
    },
    fill: ink
  },
  {
    id: 'medal',
    name: 'Medal',
    group: 'badges',
    tags: ['award', 'prize', 'ribbon', 'winner'],
    mark: {
      layers: [
        {
          type: 'box',
          params: { width: 0.36, height: 1, roundness: 0.1 },
          x: 0.2,
          y: 0.37,
          size: 0.42,
          rotation: -22,
          mirror: true
        },
        {
          type: 'diamond',
          params: { width: 0.5, height: 0.5, roundness: 0 },
          x: 0.37,
          y: 0.81,
          size: 0.36,
          rotation: -22,
          mirror: true,
          op: 'cut',
          smooth: 0
        },
        { type: 'circle', y: -0.25, size: 0.62, op: 'cut', smooth: 0 },
        { type: 'circle', y: -0.25, size: 0.54, op: 'add' },
        { type: 'star', params: { points: 5, inner: 0.5, roundness: 0.3 }, y: -0.26, size: 0.27, op: 'cut', smooth: 0 }
      ]
    },
    fill: amber
  },
  {
    id: 'ticket',
    name: 'Ticket',
    group: 'badges',
    tags: ['event', 'pass', 'admit', 'coupon'],
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 0.62, roundness: 0.25 }, size: 0.78, rotation: -12 },
        { type: 'circle', x: -0.763, y: 0.162, size: 0.15, op: 'cut', smooth: 0 },
        { type: 'circle', x: 0.763, y: -0.162, size: 0.15, op: 'cut', smooth: 0 }
      ]
    },
    fill: citrus
  },
  {
    id: 'charge',
    name: 'Charge',
    group: 'badges',
    tags: ['hexagon', 'bolt', 'energy', 'power'],
    mark: {
      layers: [
        { type: 'polygon', params: { sides: 6, roundness: 0.3 }, size: 0.86, rotation: 30 },
        {
          type: 'triangle',
          params: { width: 0.34, roundness: 0.25 },
          x: -0.074,
          y: -0.185,
          size: 0.345,
          rotation: 24.6,
          op: 'cut',
          smooth: 0
        },
        {
          type: 'triangle',
          params: { width: 0.34, roundness: 0.25 },
          x: 0.074,
          y: 0.185,
          size: 0.345,
          rotation: 204.6,
          op: 'cut',
          smooth: 0
        }
      ]
    },
    fill: tomato
  },
  {
    id: 'monogram',
    name: 'Monogram',
    group: 'letters',
    tags: ['letter', 'serif', 'initial', 'circle'],
    mark: {
      layers: [
        { type: 'circle', size: 0.86 },
        { type: 'text', text: { value: 'R', font: 'Fraunces', weight: 800 }, size: 0.66, op: 'cut', smooth: 0 }
      ]
    },
    fill: chalk
  },
  {
    id: 'wordmark',
    name: 'Wordmark',
    group: 'letters',
    tags: ['text', 'word', 'logotype', 'brand'],
    mark: {
      layers: [
        {
          type: 'text',
          text: { value: 'bits', font: 'Bricolage Grotesque', weight: 800, tracking: -0.04 },
          x: -0.1,
          y: 0.06,
          size: 0.9
        },
        { type: 'star', params: { points: 4, inner: 0.46, roundness: 0.35 }, x: 0.64, y: -0.33, size: 0.17, op: 'add' }
      ]
    },
    fill: cobalt
  },
  {
    id: 'initial',
    name: 'Initial',
    group: 'letters',
    tags: ['letter', 'app', 'icon', 'squircle'],
    mark: {
      layers: [
        { type: 'squircle', params: { roundness: 0.62 }, size: 0.8 },
        { type: 'text', text: { value: 'a', font: 'Geist', weight: 800 }, y: -0.04, size: 0.6, op: 'cut', smooth: 0 }
      ]
    },
    fill: tomato
  },
  {
    id: 'ampersand',
    name: 'Ampersand',
    group: 'letters',
    tags: ['and', 'serif', 'studio', 'elegant'],
    mark: { layers: [{ type: 'text', text: { value: '&', font: 'Instrument Serif', weight: 400 }, size: 1 }] },
    fill: tangerine
  },
  {
    id: 'serif',
    name: 'Serif',
    group: 'letters',
    tags: ['letter', 'g', 'editorial', 'elegant'],
    mark: { layers: [{ type: 'text', text: { value: 'g', font: 'Fraunces', weight: 800 }, size: 1 }] },
    fill: ink
  },
  {
    id: 'emblem',
    name: 'Emblem',
    group: 'letters',
    tags: ['letter', 'ring', 'badge', 'bold'],
    mark: {
      layers: [
        { type: 'ring', params: { thickness: 0.12 }, size: 0.86 },
        { type: 'text', text: { value: 'N', font: 'Unbounded', weight: 800 }, size: 0.66, op: 'add' }
      ]
    },
    fill: emerald
  },
  {
    id: 'hello',
    name: 'Hello',
    group: 'letters',
    tags: ['text', 'word', 'friendly', 'dot'],
    mark: {
      layers: [
        { type: 'text', text: { value: 'hey', font: 'Sora', weight: 800, tracking: -0.03 }, x: -0.1, size: 0.96 },
        { type: 'circle', x: 0.7, y: 0.19, size: 0.095, op: 'add' }
      ]
    },
    fill: rose
  },
  {
    id: 'globe',
    name: 'Globe',
    group: 'line',
    tags: ['world', 'web', 'earth', 'global'],
    mark: {
      layers: [
        { type: 'circle', size: 0.8, outline: 0.055 },
        { type: 'circle', params: { stretch: 0.42 }, size: 0.8, rotation: 90, outline: 0.055, op: 'add' },
        { type: 'wave', params: { waves: 1, amplitude: 0, thickness: 0.1375 }, size: 0.8, op: 'add' }
      ]
    },
    fill: cobalt
  },
  {
    id: 'link',
    name: 'Link',
    group: 'line',
    tags: ['chain', 'connect', 'url', 'join'],
    mark: {
      layers: [
        {
          type: 'box',
          params: { width: 1, height: 0.46, roundness: 1 },
          x: -0.24,
          y: 0.24,
          size: 0.5,
          rotation: -45,
          outline: 0.065
        },
        {
          type: 'box',
          params: { width: 1, height: 0.46, roundness: 1 },
          x: 0.24,
          y: -0.24,
          size: 0.5,
          rotation: -45,
          outline: 0.065,
          op: 'add'
        }
      ]
    },
    fill: teal
  },
  {
    id: 'octagram',
    name: 'Octagram',
    group: 'line',
    tags: ['star', 'squares', 'geometry', 'pattern'],
    mark: {
      layers: [
        { type: 'box', params: { width: 1, height: 1, roundness: 0.15 }, size: 0.58, outline: 0.05 },
        {
          type: 'box',
          params: { width: 1, height: 1, roundness: 0.15 },
          size: 0.58,
          rotation: 45,
          outline: 0.05,
          op: 'add'
        }
      ]
    },
    fill: emerald
  },
  {
    id: 'coil',
    name: 'Coil',
    group: 'line',
    tags: ['spiral', 'swirl', 'hypnotic', 'shell'],
    mark: { layers: [{ type: 'spiral', params: { turns: 3, thickness: 0.32 }, x: -0.06, y: -0.06, size: 0.82 }] },
    fill: coral
  },
  {
    id: 'trinity',
    name: 'Trinity',
    group: 'line',
    tags: ['triquetra', 'knot', 'loops', 'petals'],
    mark: {
      layers: [
        { type: 'leaf', params: { width: 0.5, roundness: 0 }, y: -0.27, size: 0.42, outline: 0.06 },
        {
          type: 'leaf',
          params: { width: 0.5, roundness: 0 },
          x: 0.3464,
          y: 0.33,
          size: 0.42,
          rotation: 120,
          outline: 0.06,
          op: 'add'
        },
        {
          type: 'leaf',
          params: { width: 0.5, roundness: 0 },
          x: -0.3464,
          y: 0.33,
          size: 0.42,
          rotation: 240,
          outline: 0.06,
          op: 'add'
        }
      ]
    },
    fill: teal
  },
  {
    id: 'venn',
    name: 'Venn',
    group: 'line',
    tags: ['circles', 'overlap', 'together', 'community'],
    mark: {
      layers: [
        { type: 'circle', y: -0.19, size: 0.44, outline: 0.05 },
        { type: 'circle', x: 0.19, y: 0.14, size: 0.44, outline: 0.05, op: 'add' },
        { type: 'circle', x: -0.19, y: 0.14, size: 0.44, outline: 0.05, op: 'add' }
      ]
    },
    fill: rose
  },
  {
    id: 'echo',
    name: 'Echo',
    group: 'line',
    tags: ['circles', 'ripple', 'target', 'sound'],
    mark: {
      layers: [
        { type: 'circle', size: 0.8, outline: 0.05 },
        { type: 'circle', y: 0.2, size: 0.58, outline: 0.05, op: 'add' },
        { type: 'circle', y: 0.4, size: 0.36, outline: 0.05, op: 'add' },
        { type: 'circle', y: 0.6, size: 0.14, op: 'add' }
      ]
    },
    fill: tomato
  },
  {
    id: 'rosette',
    name: 'Rosette',
    group: 'line',
    tags: ['flower', 'circles', 'sacred', 'pattern'],
    mark: {
      layers: [
        { type: 'circle', y: -0.41, size: 0.41, outline: 0.04 },
        { type: 'circle', x: 0.3551, y: -0.205, size: 0.41, outline: 0.04, op: 'add' },
        { type: 'circle', x: 0.3551, y: 0.205, size: 0.41, outline: 0.04, op: 'add' },
        { type: 'circle', y: 0.41, size: 0.41, outline: 0.04, op: 'add' },
        { type: 'circle', x: -0.3551, y: 0.205, size: 0.41, outline: 0.04, op: 'add' },
        { type: 'circle', x: -0.3551, y: -0.205, size: 0.41, outline: 0.04, op: 'add' }
      ]
    },
    fill: tangerine
  }
];

export const MARK_GROUPS = [...MODERN_GROUPS, ...CLASSIC_GROUPS];

export const MARKS = [...MODERN_MARKS, ...CLASSIC_MARKS];

export const MARKS_BY_ID = Object.fromEntries(MARKS.map(mark => [mark.id, mark]));

export const DEFAULT_MARK = DEFAULT_MODERN;
