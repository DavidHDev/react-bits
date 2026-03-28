export const BACKGROUNDS = [
  {
    id: 'silk',
    label: 'Silk',
    component: () => import('../../../content/Backgrounds/Silk/Silk.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/silk"',
    props: [
      { name: 'speed', type: 'number', default: 5, min: 0, max: 20, step: 0.1, label: 'Speed' },
      { name: 'scale', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1, label: 'Scale' },
      { name: 'color', type: 'color', default: '#7B7481', label: 'Color' },
      { name: 'noiseIntensity', type: 'number', default: 1.5, min: 0, max: 5, step: 0.1, label: 'Noise Intensity' },
      { name: 'rotation', type: 'number', default: 0, min: 0, max: 6.28, step: 0.1, label: 'Rotation' }
    ]
  },
  {
    id: 'aurora',
    label: 'Aurora',
    component: () => import('../../../content/Backgrounds/Aurora/Aurora.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/aurora"',
    props: [
      {
        name: 'colorStops',
        type: 'colorArray',
        default: ['#5227FF', '#7cff67', '#5227FF'],
        label: 'Color Stops',
        minItems: 2,
        maxItems: 5
      },
      { name: 'amplitude', type: 'number', default: 1.0, min: 0, max: 3, step: 0.1, label: 'Amplitude' },
      { name: 'blend', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05, label: 'Blend' }
    ]
  },
  {
    id: 'particles',
    label: 'Particles',
    component: () => import('../../../content/Backgrounds/Particles/Particles.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/particles"',
    props: [
      { name: 'particleCount', type: 'number', default: 200, min: 10, max: 1000, step: 10, label: 'Particle Count' },
      { name: 'particleSpread', type: 'number', default: 10, min: 1, max: 50, step: 1, label: 'Spread' },
      { name: 'speed', type: 'number', default: 0.1, min: 0, max: 2, step: 0.01, label: 'Speed' },
      {
        name: 'particleColors',
        type: 'colorArray',
        default: ['#ffffff', '#ffffff', '#ffffff'],
        label: 'Colors',
        minItems: 1,
        maxItems: 5
      },
      { name: 'moveParticlesOnHover', type: 'boolean', default: false, label: 'Move on Hover' },
      { name: 'particleHoverFactor', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1, label: 'Hover Factor' },
      { name: 'alphaParticles', type: 'boolean', default: false, label: 'Alpha Particles' },
      { name: 'particleBaseSize', type: 'number', default: 100, min: 10, max: 500, step: 10, label: 'Base Size' },
      { name: 'sizeRandomness', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Size Randomness' },
      { name: 'cameraDistance', type: 'number', default: 20, min: 5, max: 100, step: 1, label: 'Camera Distance' },
      { name: 'disableRotation', type: 'boolean', default: false, label: 'Disable Rotation' }
    ]
  },
  {
    id: 'shape-grid',
    label: 'Shape Grid',
    component: () => import('../../../content/Backgrounds/ShapeGrid/ShapeGrid.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/shape-grid"',
    props: [
      { name: 'speed', type: 'number', default: 0.5, min: 0, max: 2, step: 0.05, label: 'Speed' },
      { name: 'squareSize', type: 'number', default: 40, min: 10, max: 100, step: 5, label: 'Square Size' },
      {
        name: 'direction',
        type: 'select',
        default: 'diagonal',
        options: ['up', 'down', 'left', 'right', 'diagonal'],
        label: 'Direction'
      },
      { name: 'borderColor', type: 'color', default: '#999', label: 'Border Color' },
      { name: 'hoverFillColor', type: 'color', default: '#222', label: 'Hover Fill Color' },
      {
        name: 'shape',
        type: 'select',
        default: 'square',
        options: ['square', 'hexagon', 'circle', 'triangle'],
        label: 'Shape'
      },
      { name: 'hoverTrailAmount', type: 'number', default: 0, min: 0, max: 20, step: 1, label: 'Hover Trail' }
    ]
  },
  {
    id: 'waves',
    label: 'Waves',
    component: () => import('../../../content/Backgrounds/Waves/Waves.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/waves"',
    props: [
      { name: 'lineColor', type: 'color', default: '#5227FF', label: 'Line Color' },
      { name: 'backgroundColor', type: 'color', default: 'transparent', label: 'Background Color' },
      { name: 'waveSpeedX', type: 'number', default: 0.02, min: 0, max: 0.1, step: 0.005, label: 'Wave Speed X' },
      { name: 'waveSpeedY', type: 'number', default: 0.01, min: 0, max: 0.1, step: 0.005, label: 'Wave Speed Y' },
      { name: 'waveAmpX', type: 'number', default: 40, min: 0, max: 100, step: 5, label: 'Wave Amplitude X' },
      { name: 'waveAmpY', type: 'number', default: 20, min: 0, max: 100, step: 5, label: 'Wave Amplitude Y' },
      { name: 'friction', type: 'number', default: 0.9, min: 0.5, max: 1, step: 0.01, label: 'Friction' },
      { name: 'tension', type: 'number', default: 0.01, min: 0, max: 0.1, step: 0.005, label: 'Tension' },
      { name: 'maxCursorMove', type: 'number', default: 120, min: 10, max: 300, step: 10, label: 'Max Cursor Move' },
      { name: 'xGap', type: 'number', default: 12, min: 4, max: 30, step: 2, label: 'X Gap' },
      { name: 'yGap', type: 'number', default: 36, min: 10, max: 80, step: 4, label: 'Y Gap' }
    ]
  },
  {
    id: 'ballpit',
    label: 'Ballpit',
    component: () => import('../../../content/Backgrounds/Ballpit/Ballpit.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/ballpit"',
    props: [
      { name: 'count', type: 'number', default: 100, min: 10, max: 500, step: 10, label: 'Ball Count' },
      { name: 'gravity', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, label: 'Gravity' },
      { name: 'friction', type: 'number', default: 0.9975, min: 0.9, max: 1, step: 0.001, label: 'Friction' },
      { name: 'wallBounce', type: 'number', default: 0.95, min: 0.5, max: 1, step: 0.01, label: 'Wall Bounce' },
      { name: 'followCursor', type: 'boolean', default: true, label: 'Follow Cursor' },
      {
        name: 'colors',
        type: 'colorArray',
        default: ['#5227FF', '#7cff67', '#ff6b6b'],
        label: 'Colors',
        minItems: 1,
        maxItems: 6
      }
    ]
  },
  {
    id: 'hyperspeed',
    label: 'Hyperspeed',
    component: () => import('../../../content/Backgrounds/Hyperspeed/Hyperspeed.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/hyperspeed"',
    props: [
      {
        name: 'preset',
        type: 'select',
        default: 'one',
        label: 'Preset',
        options: [
          { value: 'one', label: 'Cyberpunk' },
          { value: 'two', label: 'Akira' },
          { value: 'three', label: 'Golden' },
          { value: 'four', label: 'Split' },
          { value: 'five', label: 'Highway' },
          { value: 'six', label: 'Neon Waves' }
        ]
      }
    ],
    usePresets: true
  },
  {
    id: 'iridescence',
    label: 'Iridescence',
    component: () => import('../../../content/Backgrounds/Iridescence/Iridescence.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/iridescence"',
    props: [
      { name: 'speed', type: 'number', default: 1.0, min: 0, max: 5, step: 0.1, label: 'Speed' },
      { name: 'amplitude', type: 'number', default: 0.1, min: 0, max: 1, step: 0.05, label: 'Amplitude' },
      { name: 'mouseReact', type: 'boolean', default: true, label: 'Mouse React' }
    ]
  },
  {
    id: 'grid-motion',
    label: 'Grid Motion',
    component: () => import('../../../content/Backgrounds/GridMotion/GridMotion.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/grid-motion"',
    props: [{ name: 'gradientColor', type: 'color', default: '#5227FF', label: 'Gradient Color' }]
  },
  {
    id: 'grid-distortion',
    label: 'Grid Distortion',
    component: () => import('../../../content/Backgrounds/GridDistortion/GridDistortion.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/grid-distortion"',
    props: [
      {
        name: 'imageSrc',
        type: 'text',
        default: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800',
        label: 'Image URL'
      },
      { name: 'grid', type: 'number', default: 15, min: 5, max: 50, step: 1, label: 'Grid Size' },
      { name: 'mouse', type: 'number', default: 0.1, min: 0, max: 1, step: 0.05, label: 'Mouse Influence' },
      { name: 'strength', type: 'number', default: 0.15, min: 0, max: 1, step: 0.05, label: 'Strength' },
      { name: 'relaxation', type: 'number', default: 0.9, min: 0.5, max: 1, step: 0.01, label: 'Relaxation' }
    ]
  },
  {
    id: 'orb',
    label: 'Orb',
    component: () => import('../../../content/Backgrounds/Orb/Orb.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/orb"',
    props: [
      { name: 'hue', type: 'number', default: 0, min: 0, max: 360, step: 1, label: 'Hue' },
      { name: 'hoverIntensity', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, label: 'Hover Intensity' },
      { name: 'rotateOnHover', type: 'boolean', default: true, label: 'Rotate on Hover' },
      { name: 'forceHoverState', type: 'boolean', default: false, label: 'Force Hover State' }
    ]
  },
  {
    id: 'letter-glitch',
    label: 'Letter Glitch',
    component: () => import('../../../content/Backgrounds/LetterGlitch/LetterGlitch.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/letter-glitch"',
    props: [
      {
        name: 'glitchColors',
        type: 'colorArray',
        default: ['#5227FF', '#7cff67', '#ff6b6b'],
        label: 'Glitch Colors',
        minItems: 1,
        maxItems: 5
      },
      { name: 'glitchSpeed', type: 'number', default: 50, min: 10, max: 200, step: 10, label: 'Glitch Speed' },
      { name: 'centerVignette', type: 'boolean', default: true, label: 'Center Vignette' },
      { name: 'outerVignette', type: 'boolean', default: false, label: 'Outer Vignette' },
      { name: 'smooth', type: 'boolean', default: true, label: 'Smooth' }
    ]
  },
  {
    id: 'liquid-chrome',
    label: 'Liquid Chrome',
    component: () => import('../../../content/Backgrounds/LiquidChrome/LiquidChrome.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/liquid-chrome"',
    props: [
      { name: 'speed', type: 'number', default: 0.2, min: 0, max: 2, step: 0.05, label: 'Speed' },
      { name: 'amplitude', type: 'number', default: 0.3, min: 0, max: 1, step: 0.05, label: 'Amplitude' },
      { name: 'frequencyX', type: 'number', default: 3, min: 0.5, max: 10, step: 0.5, label: 'Frequency X' },
      { name: 'frequencyY', type: 'number', default: 3, min: 0.5, max: 10, step: 0.5, label: 'Frequency Y' },
      { name: 'interactive', type: 'boolean', default: true, label: 'Interactive' }
    ]
  },
  {
    id: 'balatro',
    label: 'Balatro',
    component: () => import('../../../content/Backgrounds/Balatro/Balatro.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/balatro"',
    props: [
      { name: 'spinRotation', type: 'number', default: -2.0, min: -10, max: 10, step: 0.5, label: 'Spin Rotation' },
      { name: 'spinSpeed', type: 'number', default: 7.0, min: 0, max: 20, step: 0.5, label: 'Spin Speed' },
      { name: 'color1', type: 'color', default: '#DE443B', label: 'Color 1' },
      { name: 'color2', type: 'color', default: '#006BB4', label: 'Color 2' },
      { name: 'color3', type: 'color', default: '#162325', label: 'Color 3' },
      { name: 'contrast', type: 'number', default: 3.5, min: 1, max: 10, step: 0.5, label: 'Contrast' },
      { name: 'lighting', type: 'number', default: 0.4, min: 0, max: 1, step: 0.05, label: 'Lighting' },
      { name: 'spinAmount', type: 'number', default: 0.25, min: 0, max: 1, step: 0.05, label: 'Spin Amount' },
      { name: 'pixelFilter', type: 'number', default: 700, min: 100, max: 2000, step: 50, label: 'Pixel Filter' }
    ]
  },
  {
    id: 'threads',
    label: 'Threads',
    component: () => import('../../../content/Backgrounds/Threads/Threads.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/threads"',
    props: [
      { name: 'color', type: 'rgbArray', default: [0.32, 0.15, 1.0], label: 'Color' },
      { name: 'amplitude', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Amplitude' },
      { name: 'distance', type: 'number', default: 0, min: 0, max: 2, step: 0.1, label: 'Distance' },
      { name: 'enableMouseInteraction', type: 'boolean', default: true, label: 'Mouse Interaction' }
    ]
  },
  {
    id: 'dither',
    label: 'Dither',
    component: () => import('../../../content/Backgrounds/Dither/Dither.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/dither"',
    props: [
      { name: 'waveColor', type: 'rgbArray', default: [0.32, 0.15, 1.0], label: 'Color' },
      { name: 'disableAnimation', type: 'boolean', default: false, label: 'Disable Animation' },
      { name: 'enableMouseInteraction', type: 'boolean', default: true, label: 'Mouse Interaction' },
      { name: 'mouseRadius', type: 'number', default: 1, min: 0, max: 2, step: 0.1, label: 'Mouse Radius' },
      { name: 'colorNum', type: 'number', default: 4, min: 2, max: 16, step: 1, label: 'Color Num' },
      { name: 'pixelSize', type: 'number', default: 2, min: 1, max: 8, step: 1, label: 'Pixel Size' },
      { name: 'waveAmplitude', type: 'number', default: 0.3, min: 0, max: 1, step: 0.05, label: 'Wave Amplitude' },
      { name: 'waveFrequency', type: 'number', default: 3, min: 1, max: 10, step: 0.5, label: 'Wave Frequency' },
      { name: 'waveSpeed', type: 'number', default: 0.05, min: 0, max: 0.2, step: 0.01, label: 'Wave Speed' }
    ]
  },
  {
    id: 'lightning',
    label: 'Lightning',
    component: () => import('../../../content/Backgrounds/Lightning/Lightning.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/lightning"',
    props: [
      { name: 'hue', type: 'number', default: 230, min: 0, max: 360, step: 1, label: 'Hue' },
      { name: 'xOffset', type: 'number', default: 0, min: -2, max: 2, step: 0.1, label: 'X Offset' },
      { name: 'speed', type: 'number', default: 1, min: 0, max: 5, step: 0.1, label: 'Speed' },
      { name: 'intensity', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Intensity' },
      { name: 'size', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1, label: 'Size' }
    ]
  },
  {
    id: 'dot-grid',
    label: 'Dot Grid',
    component: () => import('../../../content/Backgrounds/DotGrid/DotGrid.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/dot-grid"',
    props: [
      { name: 'dotSize', type: 'number', default: 16, min: 4, max: 40, step: 2, label: 'Dot Size' },
      { name: 'gap', type: 'number', default: 32, min: 10, max: 80, step: 4, label: 'Gap' },
      { name: 'baseColor', type: 'color', default: '#5227FF', label: 'Base Color' },
      { name: 'activeColor', type: 'color', default: '#5227FF', label: 'Active Color' },
      { name: 'proximity', type: 'number', default: 150, min: 50, max: 400, step: 10, label: 'Proximity' },
      { name: 'speedTrigger', type: 'number', default: 100, min: 10, max: 500, step: 10, label: 'Speed Trigger' },
      { name: 'shockRadius', type: 'number', default: 250, min: 50, max: 500, step: 10, label: 'Shock Radius' },
      { name: 'shockStrength', type: 'number', default: 5, min: 1, max: 20, step: 0.5, label: 'Shock Strength' },
      { name: 'maxSpeed', type: 'number', default: 5000, min: 1000, max: 10000, step: 500, label: 'Max Speed' },
      { name: 'resistance', type: 'number', default: 750, min: 100, max: 2000, step: 50, label: 'Resistance' },
      { name: 'returnDuration', type: 'number', default: 1.5, min: 0.3, max: 5, step: 0.1, label: 'Return Duration' }
    ]
  },
  {
    id: 'beams',
    label: 'Beams',
    component: () => import('../../../content/Backgrounds/Beams/Beams.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/beams"',
    props: [
      { name: 'beamWidth', type: 'number', default: 2, min: 0.5, max: 10, step: 0.5, label: 'Beam Width' },
      { name: 'beamHeight', type: 'number', default: 15, min: 5, max: 30, step: 1, label: 'Beam Height' },
      { name: 'beamNumber', type: 'number', default: 12, min: 2, max: 30, step: 1, label: 'Beam Number' },
      { name: 'lightColor', type: 'color', default: '#ffffff', label: 'Light Color' },
      { name: 'speed', type: 'number', default: 2, min: 0.1, max: 10, step: 0.1, label: 'Speed' },
      { name: 'noiseIntensity', type: 'number', default: 1.75, min: 0, max: 5, step: 0.25, label: 'Noise Intensity' },
      { name: 'scale', type: 'number', default: 0.2, min: 0.05, max: 1, step: 0.05, label: 'Scale' },
      { name: 'rotation', type: 'number', default: 0, min: -180, max: 180, step: 5, label: 'Rotation' }
    ]
  },
  {
    id: 'ripple-grid',
    label: 'Ripple Grid',
    component: () => import('../../../content/Backgrounds/RippleGrid/RippleGrid.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/ripple-grid"',
    props: [
      { name: 'enableRainbow', type: 'boolean', default: false, label: 'Enable Rainbow' },
      { name: 'gridColor', type: 'color', default: '#ffffff', label: 'Grid Color' },
      {
        name: 'rippleIntensity',
        type: 'number',
        default: 0.05,
        min: 0,
        max: 0.2,
        step: 0.01,
        label: 'Ripple Intensity'
      },
      { name: 'gridSize', type: 'number', default: 10, min: 2, max: 30, step: 1, label: 'Grid Size' },
      { name: 'gridThickness', type: 'number', default: 15, min: 1, max: 50, step: 1, label: 'Grid Thickness' },
      { name: 'fadeDistance', type: 'number', default: 1.5, min: 0.5, max: 5, step: 0.1, label: 'Fade Distance' },
      { name: 'vignetteStrength', type: 'number', default: 2, min: 0, max: 5, step: 0.5, label: 'Vignette Strength' },
      { name: 'glowIntensity', type: 'number', default: 0.1, min: 0, max: 1, step: 0.05, label: 'Glow Intensity' },
      { name: 'opacity', type: 'number', default: 1, min: 0, max: 1, step: 0.05, label: 'Opacity' },
      { name: 'gridRotation', type: 'number', default: 0, min: 0, max: 360, step: 5, label: 'Grid Rotation' },
      { name: 'mouseInteraction', type: 'boolean', default: true, label: 'Mouse Interaction' },
      { name: 'mouseInteractionRadius', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1, label: 'Mouse Radius' }
    ]
  },
  {
    id: 'dark-veil',
    label: 'Dark Veil',
    component: () => import('../../../content/Backgrounds/DarkVeil/DarkVeil.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/dark-veil"',
    props: [
      { name: 'hueShift', type: 'number', default: 0, min: -180, max: 180, step: 5, label: 'Hue Shift' },
      { name: 'noiseIntensity', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, label: 'Noise Intensity' },
      {
        name: 'scanlineIntensity',
        type: 'number',
        default: 0,
        min: 0,
        max: 1,
        step: 0.05,
        label: 'Scanline Intensity'
      },
      { name: 'speed', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, label: 'Speed' },
      { name: 'scanlineFrequency', type: 'number', default: 0, min: 0, max: 50, step: 1, label: 'Scanline Frequency' },
      { name: 'warpAmount', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Warp Amount' },
      { name: 'resolutionScale', type: 'number', default: 1, min: 0.25, max: 2, step: 0.25, label: 'Resolution Scale' }
    ]
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    component: () => import('../../../content/Backgrounds/Galaxy/Galaxy.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/galaxy"',
    props: [
      { name: 'starSpeed', type: 'number', default: 0.5, min: 0, max: 3, step: 0.1, label: 'Star Speed' },
      { name: 'density', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1, label: 'Density' },
      { name: 'hueShift', type: 'number', default: 140, min: 0, max: 360, step: 5, label: 'Hue Shift' },
      { name: 'speed', type: 'number', default: 1, min: 0, max: 5, step: 0.1, label: 'Speed' },
      { name: 'glowIntensity', type: 'number', default: 0.3, min: 0, max: 1, step: 0.05, label: 'Glow Intensity' },
      { name: 'saturation', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Saturation' },
      { name: 'mouseRepulsion', type: 'boolean', default: true, label: 'Mouse Repulsion' },
      { name: 'repulsionStrength', type: 'number', default: 2, min: 0, max: 5, step: 0.5, label: 'Repulsion Strength' },
      {
        name: 'twinkleIntensity',
        type: 'number',
        default: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
        label: 'Twinkle Intensity'
      },
      { name: 'rotationSpeed', type: 'number', default: 0.1, min: 0, max: 1, step: 0.05, label: 'Rotation Speed' },
      { name: 'transparent', type: 'boolean', default: true, label: 'Transparent' }
    ]
  },
  {
    id: 'light-rays',
    label: 'Light Rays',
    component: () => import('../../../content/Backgrounds/LightRays/LightRays.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/light-rays"',
    props: [
      {
        name: 'raysOrigin',
        type: 'select',
        default: 'top-center',
        options: [
          'top-left',
          'top-center',
          'top-right',
          'left',
          'right',
          'bottom-left',
          'bottom-center',
          'bottom-right'
        ],
        label: 'Rays Origin'
      },
      { name: 'raysColor', type: 'color', default: '#ffffff', label: 'Rays Color' },
      { name: 'raysSpeed', type: 'number', default: 1, min: 0, max: 5, step: 0.1, label: 'Speed' },
      { name: 'lightSpread', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1, label: 'Light Spread' },
      { name: 'rayLength', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1, label: 'Ray Length' },
      { name: 'pulsating', type: 'boolean', default: false, label: 'Pulsating' },
      { name: 'fadeDistance', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Fade Distance' },
      { name: 'saturation', type: 'number', default: 1, min: 0, max: 2, step: 0.1, label: 'Saturation' },
      { name: 'followMouse', type: 'boolean', default: true, label: 'Follow Mouse' },
      { name: 'mouseInfluence', type: 'number', default: 0.1, min: 0, max: 1, step: 0.05, label: 'Mouse Influence' },
      { name: 'noiseAmount', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Noise Amount' },
      { name: 'distortion', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Distortion' }
    ]
  },
  {
    id: 'faulty-terminal',
    label: 'Faulty Terminal',
    component: () => import('../../../content/Backgrounds/FaultyTerminal/FaultyTerminal.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/faulty-terminal"',
    props: [
      { name: 'scale', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1, label: 'Scale' },
      { name: 'digitSize', type: 'number', default: 1.5, min: 0.5, max: 5, step: 0.1, label: 'Digit Size' },
      {
        name: 'scanlineIntensity',
        type: 'number',
        default: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
        label: 'Scanline Intensity'
      },
      { name: 'glitchAmount', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Glitch Amount' },
      { name: 'flickerAmount', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Flicker Amount' },
      { name: 'noiseAmp', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Noise Amp' },
      {
        name: 'chromaticAberration',
        type: 'number',
        default: 0,
        min: 0,
        max: 0.1,
        step: 0.005,
        label: 'Chromatic Aberration'
      },
      { name: 'dither', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Dither' },
      { name: 'curvature', type: 'number', default: 0.2, min: 0, max: 1, step: 0.05, label: 'Curvature' },
      { name: 'tint', type: 'color', default: '#ffffff', label: 'Tint' },
      { name: 'mouseReact', type: 'boolean', default: true, label: 'Mouse React' },
      { name: 'mouseStrength', type: 'number', default: 0.2, min: 0, max: 1, step: 0.05, label: 'Mouse Strength' },
      { name: 'brightness', type: 'number', default: 1, min: 0.2, max: 2, step: 0.1, label: 'Brightness' }
    ]
  },
  {
    id: 'plasma',
    label: 'Plasma',
    component: () => import('../../../content/Backgrounds/Plasma/Plasma.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/plasma"',
    props: [
      { name: 'color', type: 'color', default: '#ffffff', label: 'Color' },
      { name: 'speed', type: 'number', default: 1, min: 0, max: 5, step: 0.1, label: 'Speed' },
      { name: 'direction', type: 'select', default: 'forward', options: ['forward', 'backward'], label: 'Direction' },
      { name: 'scale', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1, label: 'Scale' },
      { name: 'opacity', type: 'number', default: 1, min: 0, max: 1, step: 0.05, label: 'Opacity' },
      { name: 'mouseInteractive', type: 'boolean', default: true, label: 'Mouse Interactive' }
    ]
  },
  {
    id: 'prism',
    label: 'Prism',
    component: () => import('../../../content/Backgrounds/Prism/Prism.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/prism"',
    props: [
      { name: 'height', type: 'number', default: 3.5, min: 1, max: 10, step: 0.5, label: 'Height' },
      { name: 'baseWidth', type: 'number', default: 5.5, min: 1, max: 15, step: 0.5, label: 'Base Width' },
      {
        name: 'animationType',
        type: 'select',
        default: 'rotate',
        options: ['rotate', 'rotate3d', 'hover'],
        label: 'Animation Type'
      },
      { name: 'glow', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Glow' },
      { name: 'noise', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, label: 'Noise' },
      { name: 'transparent', type: 'boolean', default: true, label: 'Transparent' },
      { name: 'scale', type: 'number', default: 3.6, min: 0.5, max: 10, step: 0.2, label: 'Scale' },
      { name: 'hueShift', type: 'number', default: 0, min: 0, max: 360, step: 5, label: 'Hue Shift' },
      { name: 'colorFrequency', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1, label: 'Color Frequency' },
      { name: 'hoverStrength', type: 'number', default: 2, min: 0, max: 5, step: 0.5, label: 'Hover Strength' },
      { name: 'inertia', type: 'number', default: 0.05, min: 0.01, max: 0.2, step: 0.01, label: 'Inertia' },
      { name: 'bloom', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Bloom' },
      { name: 'timeScale', type: 'number', default: 0.5, min: 0.1, max: 3, step: 0.1, label: 'Time Scale' }
    ]
  },
  {
    id: 'gradient-blinds',
    label: 'Gradient Blinds',
    component: () => import('../../../content/Backgrounds/GradientBlinds/GradientBlinds.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/gradient-blinds"',
    props: [
      {
        name: 'gradientColors',
        type: 'colorArray',
        default: ['#FF9FFC', '#5227FF'],
        label: 'Gradient Colors',
        minItems: 2,
        maxItems: 8
      },
      { name: 'angle', type: 'number', default: 0, min: -180, max: 180, step: 5, label: 'Angle' },
      { name: 'noise', type: 'number', default: 0.3, min: 0, max: 1, step: 0.05, label: 'Noise' },
      { name: 'blindCount', type: 'number', default: 16, min: 4, max: 50, step: 1, label: 'Blind Count' },
      { name: 'blindMinWidth', type: 'number', default: 60, min: 10, max: 200, step: 10, label: 'Blind Min Width' },
      { name: 'mouseDampening', type: 'number', default: 0.15, min: 0, max: 0.5, step: 0.05, label: 'Mouse Dampening' },
      { name: 'mirrorGradient', type: 'boolean', default: false, label: 'Mirror Gradient' },
      { name: 'spotlightRadius', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, label: 'Spotlight Radius' },
      { name: 'spotlightSoftness', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Spotlight Softness' },
      { name: 'spotlightOpacity', type: 'number', default: 1, min: 0, max: 1, step: 0.05, label: 'Spotlight Opacity' },
      { name: 'distortAmount', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Distort Amount' },
      {
        name: 'shineDirection',
        type: 'select',
        default: 'left',
        options: ['left', 'right', 'none'],
        label: 'Shine Direction'
      }
    ]
  },
  {
    id: 'grainient',
    label: 'Grainient',
    component: () => import('../../../content/Backgrounds/Grainient/Grainient.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/grainient"',
    props: [
      { name: 'color1', type: 'color', default: '#FF9FFC', label: 'Color 1' },
      { name: 'color2', type: 'color', default: '#5227FF', label: 'Color 2' },
      { name: 'color3', type: 'color', default: '#B19EEF', label: 'Color 3' },
      { name: 'timeSpeed', type: 'number', default: 0.25, min: 0, max: 5, step: 0.05, label: 'Time Speed' },
      { name: 'colorBalance', type: 'number', default: 0.0, min: -1, max: 1, step: 0.01, label: 'Color Balance' },
      { name: 'warpStrength', type: 'number', default: 1.0, min: 0, max: 4, step: 0.05, label: 'Warp Strength' },
      { name: 'warpFrequency', type: 'number', default: 5.0, min: 0, max: 12, step: 0.1, label: 'Warp Frequency' },
      { name: 'warpSpeed', type: 'number', default: 2.0, min: 0, max: 6, step: 0.1, label: 'Warp Speed' },
      { name: 'warpAmplitude', type: 'number', default: 50.0, min: 5, max: 80, step: 1, label: 'Warp Amplitude' },
      { name: 'blendAngle', type: 'number', default: 0.0, min: -180, max: 180, step: 1, label: 'Blend Angle' },
      { name: 'blendSoftness', type: 'number', default: 0.05, min: 0, max: 1, step: 0.01, label: 'Blend Softness' },
      { name: 'rotationAmount', type: 'number', default: 500.0, min: 0, max: 1440, step: 10, label: 'Rotation Amount' },
      { name: 'noiseScale', type: 'number', default: 2.0, min: 0, max: 4, step: 0.05, label: 'Noise Scale' },
      { name: 'grainAmount', type: 'number', default: 0.1, min: 0, max: 0.4, step: 0.01, label: 'Grain Amount' },
      { name: 'grainScale', type: 'number', default: 2.0, min: 0.2, max: 8, step: 0.1, label: 'Grain Scale' },
      { name: 'grainAnimated', type: 'boolean', default: false, label: 'Grain Animated' },
      { name: 'contrast', type: 'number', default: 1.5, min: 0, max: 2.5, step: 0.05, label: 'Contrast' },
      { name: 'gamma', type: 'number', default: 1.0, min: 0.4, max: 2.5, step: 0.05, label: 'Gamma' },
      { name: 'saturation', type: 'number', default: 1.0, min: 0, max: 2.5, step: 0.05, label: 'Saturation' },
      { name: 'centerX', type: 'number', default: 0.0, min: -1, max: 1, step: 0.01, label: 'Center X' },
      { name: 'centerY', type: 'number', default: 0.0, min: -1, max: 1, step: 0.01, label: 'Center Y' },
      { name: 'zoom', type: 'number', default: 0.9, min: 0.3, max: 3, step: 0.05, label: 'Zoom' }
    ]
  },
  {
    id: 'prismatic-burst',
    label: 'Prismatic Burst',
    component: () => import('../../../content/Backgrounds/PrismaticBurst/PrismaticBurst.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/prismatic-burst"',
    props: [
      { name: 'intensity', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5, label: 'Intensity' },
      { name: 'speed', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, label: 'Speed' },
      {
        name: 'animationType',
        type: 'select',
        default: 'rotate3d',
        options: ['rotate', 'rotate3d', 'hover'],
        label: 'Animation Type'
      },
      {
        name: 'colors',
        type: 'colorArray',
        default: ['#5227FF', '#FF9FFC', '#7cff67'],
        label: 'Colors',
        minItems: 2,
        maxItems: 8
      },
      { name: 'distort', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Distort' },
      { name: 'hoverDampness', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Hover Dampness' },
      { name: 'rayCount', type: 'number', default: 0, min: 0, max: 20, step: 1, label: 'Ray Count' }
    ]
  },
  {
    id: 'pixel-blast',
    label: 'Pixel Blast',
    component: () => import('../../../content/Backgrounds/PixelBlast/PixelBlast.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/pixel-blast"',
    props: [
      {
        name: 'variant',
        type: 'select',
        default: 'square',
        options: ['square', 'circle', 'triangle', 'diamond'],
        label: 'Variant'
      },
      { name: 'pixelSize', type: 'number', default: 3, min: 1, max: 10, step: 1, label: 'Pixel Size' },
      { name: 'color', type: 'color', default: '#B19EEF', label: 'Color' },
      { name: 'patternScale', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5, label: 'Pattern Scale' },
      { name: 'patternDensity', type: 'number', default: 1, min: 0.1, max: 2, step: 0.1, label: 'Pattern Density' },
      { name: 'enableRipples', type: 'boolean', default: true, label: 'Enable Ripples' },
      { name: 'rippleSpeed', type: 'number', default: 0.3, min: 0.05, max: 1, step: 0.05, label: 'Ripple Speed' },
      {
        name: 'rippleThickness',
        type: 'number',
        default: 0.1,
        min: 0.01,
        max: 0.5,
        step: 0.02,
        label: 'Ripple Thickness'
      },
      {
        name: 'rippleIntensityScale',
        type: 'number',
        default: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        label: 'Ripple Intensity'
      },
      { name: 'speed', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, label: 'Speed' },
      { name: 'transparent', type: 'boolean', default: true, label: 'Transparent' },
      { name: 'edgeFade', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05, label: 'Edge Fade' }
    ]
  },
  {
    id: 'liquid-ether',
    label: 'Liquid Ether',
    component: () => import('../../../content/Backgrounds/LiquidEther/LiquidEther.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/liquid-ether"',
    props: [
      { name: 'mouseForce', type: 'number', default: 20, min: 1, max: 50, step: 1, label: 'Mouse Force' },
      { name: 'cursorSize', type: 'number', default: 100, min: 20, max: 300, step: 10, label: 'Cursor Size' },
      { name: 'isViscous', type: 'boolean', default: false, label: 'Viscous' },
      { name: 'viscous', type: 'number', default: 30, min: 5, max: 100, step: 5, label: 'Viscosity' },
      {
        name: 'colors',
        type: 'colorArray',
        default: ['#5227FF', '#FF9FFC', '#B19EEF'],
        label: 'Colors',
        minItems: 2,
        maxItems: 5
      },
      { name: 'autoDemo', type: 'boolean', default: true, label: 'Auto Demo' },
      { name: 'autoSpeed', type: 'number', default: 0.5, min: 0.1, max: 2, step: 0.1, label: 'Auto Speed' },
      { name: 'autoIntensity', type: 'number', default: 2.2, min: 0.5, max: 5, step: 0.2, label: 'Auto Intensity' },
      { name: 'isBounce', type: 'boolean', default: false, label: 'Bounce' },
      { name: 'resolution', type: 'number', default: 0.5, min: 0.25, max: 1, step: 0.25, label: 'Resolution' }
    ]
  },
  {
    id: 'color-bends',
    label: 'Color Bends',
    component: () => import('../../../content/Backgrounds/ColorBends/ColorBends.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/color-bends"',
    props: [
      { name: 'rotation', type: 'number', default: 45, min: 0, max: 360, step: 5, label: 'Rotation' },
      { name: 'speed', type: 'number', default: 0.2, min: 0, max: 1, step: 0.05, label: 'Speed' },
      {
        name: 'colors',
        type: 'colorArray',
        default: ['#5227FF', '#FF9FFC', '#7cff67'],
        label: 'Colors',
        minItems: 2,
        maxItems: 8
      },
      { name: 'transparent', type: 'boolean', default: true, label: 'Transparent' },
      { name: 'autoRotate', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Auto Rotate' },
      { name: 'scale', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1, label: 'Scale' },
      { name: 'frequency', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1, label: 'Frequency' },
      { name: 'warpStrength', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Warp Strength' },
      { name: 'mouseInfluence', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Mouse Influence' },
      { name: 'parallax', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, label: 'Parallax' },
      { name: 'noise', type: 'number', default: 0.1, min: 0, max: 0.5, step: 0.05, label: 'Noise' }
    ]
  },
  {
    id: 'grid-scan',
    label: 'Grid Scan',
    component: () => import('../../../content/Backgrounds/GridScan/GridScan.jsx').then(m => ({ default: m.GridScan })),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/grid-scan"',
    props: [
      { name: 'sensitivity', type: 'number', default: 0.55, min: 0, max: 1, step: 0.05, label: 'Sensitivity' },
      { name: 'lineThickness', type: 'number', default: 1, min: 0.5, max: 5, step: 0.5, label: 'Line Thickness' },
      { name: 'linesColor', type: 'color', default: '#392e4e', label: 'Lines Color' },
      { name: 'scanColor', type: 'color', default: '#FF9FFC', label: 'Scan Color' },
      { name: 'scanOpacity', type: 'number', default: 0.4, min: 0, max: 1, step: 0.05, label: 'Scan Opacity' },
      { name: 'gridScale', type: 'number', default: 0.1, min: 0.01, max: 0.5, step: 0.01, label: 'Grid Scale' },
      {
        name: 'lineStyle',
        type: 'select',
        default: 'solid',
        options: ['solid', 'dashed', 'dotted'],
        label: 'Line Style'
      },
      { name: 'lineJitter', type: 'number', default: 0.1, min: 0, max: 1, step: 0.05, label: 'Line Jitter' },
      {
        name: 'scanDirection',
        type: 'select',
        default: 'pingpong',
        options: ['forward', 'backward', 'pingpong'],
        label: 'Scan Direction'
      },
      {
        name: 'noiseIntensity',
        type: 'number',
        default: 0.01,
        min: 0,
        max: 0.1,
        step: 0.005,
        label: 'Noise Intensity'
      },
      { name: 'scanGlow', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, label: 'Scan Glow' },
      { name: 'scanSoftness', type: 'number', default: 2, min: 0, max: 5, step: 0.5, label: 'Scan Softness' },
      { name: 'scanDuration', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5, label: 'Scan Duration' },
      { name: 'scanDelay', type: 'number', default: 2, min: 0, max: 5, step: 0.5, label: 'Scan Delay' },
      { name: 'scanOnClick', type: 'boolean', default: false, label: 'Scan On Click' }
    ]
  },
  {
    id: 'floating-lines',
    label: 'Floating Lines',
    component: () => import('../../../content/Backgrounds/FloatingLines/FloatingLines.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/floating-lines"',
    props: [
      {
        name: 'linesGradient',
        type: 'colorArray',
        default: ['#E945F5', '#2F4BC0', '#E945F5'],
        label: 'Lines Gradient',
        minItems: 2,
        maxItems: 8
      },
      { name: 'animationSpeed', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Animation Speed' },
      { name: 'interactive', type: 'boolean', default: true, label: 'Interactive' },
      { name: 'bendRadius', type: 'number', default: 5, min: 1, max: 15, step: 0.5, label: 'Bend Radius' },
      { name: 'bendStrength', type: 'number', default: -0.5, min: -2, max: 2, step: 0.1, label: 'Bend Strength' },
      { name: 'mouseDamping', type: 'number', default: 0.05, min: 0, max: 0.2, step: 0.01, label: 'Mouse Damping' },
      { name: 'parallax', type: 'boolean', default: true, label: 'Parallax' },
      { name: 'parallaxStrength', type: 'number', default: 0.2, min: 0, max: 1, step: 0.05, label: 'Parallax Strength' }
    ]
  },
  {
    id: 'light-pillar',
    label: 'Light Pillar',
    component: () => import('../../../content/Backgrounds/LightPillar/LightPillar.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/light-pillar"',
    props: [
      { name: 'topColor', type: 'color', default: '#5227FF', label: 'Top Color' },
      { name: 'bottomColor', type: 'color', default: '#FF9FFC', label: 'Bottom Color' },
      { name: 'intensity', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1, label: 'Intensity' },
      { name: 'rotationSpeed', type: 'number', default: 0.3, min: 0, max: 2, step: 0.1, label: 'Rotation Speed' },
      { name: 'interactive', type: 'boolean', default: false, label: 'Interactive' },
      { name: 'glowAmount', type: 'number', default: 0.005, min: 0, max: 0.02, step: 0.001, label: 'Glow Amount' },
      { name: 'pillarWidth', type: 'number', default: 3, min: 0.5, max: 10, step: 0.5, label: 'Pillar Width' },
      { name: 'pillarHeight', type: 'number', default: 0.4, min: 0.1, max: 1, step: 0.05, label: 'Pillar Height' },
      { name: 'noiseIntensity', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, label: 'Noise Intensity' },
      { name: 'pillarRotation', type: 'number', default: 0, min: 0, max: 360, step: 5, label: 'Pillar Rotation' }
    ]
  },
  {
    id: 'pixel-snow',
    label: 'Pixel Snow',
    component: () => import('../../../content/Backgrounds/PixelSnow/PixelSnow.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/pixel-snow"',
    props: [
      { name: 'color', type: 'color', default: '#ffffff', label: 'Color' },
      { name: 'flakeSize', type: 'number', default: 0.01, min: 0.001, max: 0.05, step: 0.002, label: 'Flake Size' },
      { name: 'minFlakeSize', type: 'number', default: 1.25, min: 0.5, max: 3, step: 0.25, label: 'Min Flake Size' },
      { name: 'pixelResolution', type: 'number', default: 200, min: 50, max: 500, step: 25, label: 'Pixel Resolution' },
      { name: 'speed', type: 'number', default: 1.25, min: 0.1, max: 5, step: 0.25, label: 'Speed' },
      { name: 'depthFade', type: 'number', default: 8, min: 1, max: 20, step: 1, label: 'Depth Fade' },
      { name: 'farPlane', type: 'number', default: 20, min: 5, max: 50, step: 5, label: 'Far Plane' },
      { name: 'brightness', type: 'number', default: 1, min: 0.2, max: 3, step: 0.1, label: 'Brightness' },
      { name: 'gamma', type: 'number', default: 0.4545, min: 0.1, max: 1, step: 0.05, label: 'Gamma' },
      { name: 'density', type: 'number', default: 0.3, min: 0.1, max: 1, step: 0.05, label: 'Density' },
      {
        name: 'variant',
        type: 'select',
        default: 'square',
        options: ['square', 'round', 'snowflake'],
        label: 'Variant'
      },
      { name: 'direction', type: 'number', default: 125, min: 0, max: 360, step: 5, label: 'Direction' }
    ]
  },
  {
    id: 'line-waves',
    label: 'Line Waves',
    component: () => import('../../../content/Backgrounds/LineWaves/LineWaves.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/line-waves"',
    props: [
      { name: 'speed', type: 'number', default: 0.3, min: 0.1, max: 3, step: 0.1, label: 'Speed' },
      { name: 'innerLineCount', type: 'number', default: 32, min: 2, max: 40, step: 1, label: 'Inner Line Count' },
      { name: 'outerLineCount', type: 'number', default: 36, min: 2, max: 40, step: 1, label: 'Outer Line Count' },
      { name: 'warpIntensity', type: 'number', default: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Warp Intensity' },
      { name: 'rotation', type: 'number', default: -45, min: -180, max: 180, step: 1, label: 'Rotation' },
      { name: 'edgeFadeWidth', type: 'number', default: 0.0, min: 0, max: 1, step: 0.05, label: 'Edge Fade Width' },
      {
        name: 'colorCycleSpeed',
        type: 'number',
        default: 1.0,
        min: 0.1,
        max: 5,
        step: 0.1,
        label: 'Color Cycle Speed'
      },
      { name: 'brightness', type: 'number', default: 0.2, min: 0.1, max: 3, step: 0.1, label: 'Brightness' },
      { name: 'color1', type: 'color', default: '#ffffff', label: 'Color 1' },
      { name: 'color2', type: 'color', default: '#ffffff', label: 'Color 2' },
      { name: 'color3', type: 'color', default: '#ffffff', label: 'Color 3' },
      { name: 'enableMouseInteraction', type: 'boolean', default: true, label: 'Mouse Interaction' },
      { name: 'mouseInfluence', type: 'number', default: 2.0, min: 0.1, max: 2, step: 0.1, label: 'Mouse Influence' }
    ]
  },
  {
    id: 'evil-eye',
    label: 'Evil Eye',
    component: () => import('../../../content/Backgrounds/EvilEye/EvilEye.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/evil-eye"',
    props: [
      { name: 'eyeColor', type: 'color', default: '#FF6F37', label: 'Eye Color' },
      { name: 'intensity', type: 'number', default: 1.5, min: 0.5, max: 5, step: 0.1, label: 'Intensity' },
      { name: 'pupilSize', type: 'number', default: 0.6, min: 0.1, max: 2, step: 0.05, label: 'Pupil Size' },
      { name: 'irisWidth', type: 'number', default: 0.25, min: 0.1, max: 0.8, step: 0.05, label: 'Iris Width' },
      { name: 'glowIntensity', type: 'number', default: 0.35, min: 0, max: 1.5, step: 0.05, label: 'Glow Intensity' },
      { name: 'scale', type: 'number', default: 0.8, min: 0.2, max: 3, step: 0.1, label: 'Scale' },
      { name: 'noiseScale', type: 'number', default: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Noise Scale' },
      { name: 'pupilFollow', type: 'number', default: 1.0, min: 0, max: 2, step: 0.1, label: 'Pupil Follow' },
      { name: 'flameSpeed', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1, label: 'Flame Speed' },
      { name: 'backgroundColor', type: 'color', default: '#000000', label: 'Background Color' }
    ]
  },
  {
    id: 'radar',
    label: 'Radar',
    component: () => import('../../../content/Backgrounds/Radar/Radar.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/radar"',
    props: [
      { name: 'speed', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1, label: 'Speed' },
      { name: 'scale', type: 'number', default: 0.5, min: 0.1, max: 3, step: 0.1, label: 'Scale' },
      { name: 'ringCount', type: 'number', default: 10, min: 1, max: 30, step: 1, label: 'Ring Count' },
      { name: 'spokeCount', type: 'number', default: 10, min: 1, max: 36, step: 1, label: 'Spoke Count' },
      {
        name: 'ringThickness',
        type: 'number',
        default: 0.05,
        min: 0.01,
        max: 0.3,
        step: 0.01,
        label: 'Ring Thickness'
      },
      {
        name: 'spokeThickness',
        type: 'number',
        default: 0.01,
        min: 0.01,
        max: 0.2,
        step: 0.01,
        label: 'Spoke Thickness'
      },
      { name: 'sweepSpeed', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1, label: 'Sweep Speed' },
      { name: 'sweepWidth', type: 'number', default: 2, min: 1, max: 20, step: 1, label: 'Sweep Width' },
      { name: 'sweepLobes', type: 'number', default: 1, min: 1, max: 6, step: 1, label: 'Sweep Lobes' },
      { name: 'color', type: 'color', default: '#9f29ff', label: 'Color' },
      { name: 'backgroundColor', type: 'color', default: '#000000', label: 'Background Color' },
      { name: 'falloff', type: 'number', default: 2.0, min: 0.1, max: 3, step: 0.1, label: 'Falloff' },
      { name: 'brightness', type: 'number', default: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Brightness' },
      { name: 'enableMouseInteraction', type: 'boolean', default: true, label: 'Mouse Interaction' },
      { name: 'mouseInfluence', type: 'number', default: 0.1, min: 0.1, max: 1, step: 0.05, label: 'Mouse Influence' }
    ]
  },
  {
    id: 'soft-aurora',
    label: 'Soft Aurora',
    component: () => import('../../../content/Backgrounds/SoftAurora/SoftAurora.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/backgrounds/soft-aurora"',
    props: [
      { name: 'speed', type: 'number', default: 0.6, min: 0.1, max: 5, step: 0.1, label: 'Speed' },
      { name: 'scale', type: 'number', default: 1.5, min: 0.1, max: 3, step: 0.1, label: 'Scale' },
      { name: 'brightness', type: 'number', default: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Brightness' },
      { name: 'color1', type: 'color', default: '#f7f7f7', label: 'Color 1' },
      { name: 'color2', type: 'color', default: '#e100ff', label: 'Color 2' },
      { name: 'noiseFrequency', type: 'number', default: 2.5, min: 0.5, max: 10, step: 0.5, label: 'Noise Frequency' },
      { name: 'noiseAmplitude', type: 'number', default: 1.0, min: 0.5, max: 10, step: 0.5, label: 'Noise Amplitude' },
      { name: 'bandHeight', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05, label: 'Band Height' },
      { name: 'bandSpread', type: 'number', default: 1.0, min: 0.1, max: 3, step: 0.1, label: 'Band Spread' },
      { name: 'octaveDecay', type: 'number', default: 0.1, min: 0.01, max: 0.5, step: 0.01, label: 'Octave Decay' },
      { name: 'layerOffset', type: 'number', default: 0, min: 0, max: 1, step: 0.05, label: 'Layer Offset' },
      { name: 'colorSpeed', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1, label: 'Color Speed' },
      { name: 'enableMouseInteraction', type: 'boolean', default: true, label: 'Mouse Interaction' },
      { name: 'mouseInfluence', type: 'number', default: 0.25, min: 0.1, max: 1, step: 0.05, label: 'Mouse Influence' }
    ]
  },
  {
    id: 'antigravity',
    label: 'Antigravity',
    component: () => import('../../../content/Animations/Antigravity/Antigravity.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/animations/antigravity"',
    props: [
      { name: 'count', type: 'number', default: 300, min: 50, max: 1000, step: 10, label: 'Particle Count' },
      { name: 'magnetRadius', type: 'number', default: 10, min: 1, max: 30, step: 1, label: 'Magnet Radius' },
      { name: 'ringRadius', type: 'number', default: 10, min: 1, max: 30, step: 1, label: 'Ring Radius' },
      { name: 'waveSpeed', type: 'number', default: 0.4, min: 0, max: 2, step: 0.1, label: 'Wave Speed' },
      { name: 'waveAmplitude', type: 'number', default: 1, min: 0, max: 5, step: 0.1, label: 'Wave Amplitude' },
      { name: 'particleSize', type: 'number', default: 2, min: 0.5, max: 10, step: 0.5, label: 'Particle Size' },
      { name: 'lerpSpeed', type: 'number', default: 0.1, min: 0.01, max: 0.5, step: 0.01, label: 'Lerp Speed' },
      { name: 'color', type: 'color', default: '#FF9FFC', label: 'Color' },
      { name: 'autoAnimate', type: 'boolean', default: false, label: 'Auto Animate' },
      { name: 'particleVariance', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Particle Variance' },
      { name: 'rotationSpeed', type: 'number', default: 0, min: 0, max: 2, step: 0.1, label: 'Rotation Speed' },
      { name: 'depthFactor', type: 'number', default: 1, min: 0, max: 3, step: 0.1, label: 'Depth Factor' },
      { name: 'pulseSpeed', type: 'number', default: 3, min: 0, max: 10, step: 0.5, label: 'Pulse Speed' },
      {
        name: 'particleShape',
        type: 'select',
        default: 'capsule',
        options: ['capsule', 'sphere', 'box', 'tetrahedron'],
        label: 'Particle Shape'
      },
      { name: 'fieldStrength', type: 'number', default: 10, min: 0, max: 30, step: 1, label: 'Field Strength' }
    ]
  },
  {
    id: 'click-spark',
    label: 'Click Spark',
    component: () => import('../../../content/Animations/ClickSpark/ClickSpark.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/animations/click-spark"',
    props: [
      { name: 'sparkColor', type: 'color', default: '#ffffff', label: 'Spark Color' },
      { name: 'sparkSize', type: 'number', default: 10, min: 2, max: 50, step: 1, label: 'Spark Size' },
      { name: 'sparkRadius', type: 'number', default: 15, min: 5, max: 100, step: 1, label: 'Spark Radius' },
      { name: 'sparkCount', type: 'number', default: 8, min: 3, max: 20, step: 1, label: 'Spark Count' },
      { name: 'duration', type: 'number', default: 400, min: 100, max: 2000, step: 50, label: 'Duration (ms)' },
      {
        name: 'easing',
        type: 'select',
        default: 'ease-out',
        options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
        label: 'Easing'
      },
      { name: 'extraScale', type: 'number', default: 1.0, min: 0.5, max: 3, step: 0.1, label: 'Extra Scale' }
    ]
  },
  {
    id: 'ghost-cursor',
    label: 'Ghost Cursor',
    component: () => import('../../../content/Animations/GhostCursor/GhostCursor.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/animations/ghost-cursor"',
    forceRemountOnPropChange: true,
    wrapperStyle: { width: '100%', height: '100%', minHeight: '100%', position: 'relative' },
    props: [
      { name: 'trailLength', type: 'number', default: 50, min: 10, max: 100, step: 5, label: 'Trail Length' },
      { name: 'inertia', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05, label: 'Inertia' },
      { name: 'grainIntensity', type: 'number', default: 0.05, min: 0, max: 0.3, step: 0.01, label: 'Grain Intensity' },
      { name: 'bloomStrength', type: 'number', default: 0.1, min: 0, max: 1, step: 0.05, label: 'Bloom Strength' },
      { name: 'bloomRadius', type: 'number', default: 1.0, min: 0, max: 3, step: 0.1, label: 'Bloom Radius' },
      { name: 'brightness', type: 'number', default: 2, min: 0.1, max: 5, step: 0.1, label: 'Brightness' },
      { name: 'color', type: 'color', default: '#B19EEF', label: 'Color' },
      { name: 'edgeIntensity', type: 'number', default: 0, min: 0, max: 1, step: 0.1, label: 'Edge Intensity' }
    ]
  },
  {
    id: 'image-trail',
    label: 'Image Trail',
    component: () => import('../../../content/Animations/ImageTrail/ImageTrail.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/animations/image-trail"',
    props: [
      {
        name: 'variant',
        type: 'select',
        default: '1',
        options: [
          { value: '1', label: 'Variant 1' },
          { value: '2', label: 'Variant 2' },
          { value: '3', label: 'Variant 3' },
          { value: '4', label: 'Variant 4' },
          { value: '5', label: 'Variant 5' },
          { value: '6', label: 'Variant 6' },
          { value: '7', label: 'Variant 7' },
          { value: '8', label: 'Variant 8' }
        ],
        label: 'Variant'
      }
    ],
    fixedProps: {
      items: [
        'https://images.unsplash.com/photo-1709949908058-a08659571596?w=300',
        'https://images.unsplash.com/photo-1548516173-3cabfa4607e9?w=300',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=300',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300',
        'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=300'
      ]
    }
  },
  {
    id: 'laser-flow',
    label: 'Laser Flow',
    component: () =>
      import('../../../content/Animations/LaserFlow/LaserFlow.jsx').then(m => ({ default: m.LaserFlow })),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/animations/laser-flow"',
    props: [
      { name: 'color', type: 'color', default: '#FF79C6', label: 'Color' },
      { name: 'wispDensity', type: 'number', default: 1, min: 0, max: 2, step: 0.1, label: 'Wisp Density' },
      { name: 'flowSpeed', type: 'number', default: 0.35, min: 0, max: 2, step: 0.05, label: 'Flow Speed' },
      { name: 'verticalSizing', type: 'number', default: 2.0, min: 0.5, max: 5, step: 0.1, label: 'Vertical Size' },
      { name: 'horizontalSizing', type: 'number', default: 0.5, min: 0.1, max: 3, step: 0.1, label: 'Horizontal Size' },
      { name: 'fogIntensity', type: 'number', default: 0.45, min: 0, max: 1, step: 0.05, label: 'Fog Intensity' },
      { name: 'fogScale', type: 'number', default: 0.3, min: 0.1, max: 1, step: 0.05, label: 'Fog Scale' },
      { name: 'wispSpeed', type: 'number', default: 15.0, min: 1, max: 30, step: 1, label: 'Wisp Speed' },
      { name: 'wispIntensity', type: 'number', default: 5.0, min: 0, max: 15, step: 0.5, label: 'Wisp Intensity' },
      { name: 'flowStrength', type: 'number', default: 0.25, min: 0, max: 1, step: 0.05, label: 'Flow Strength' },
      { name: 'decay', type: 'number', default: 1.1, min: 0.5, max: 3, step: 0.1, label: 'Decay' },
      {
        name: 'horizontalBeamOffset',
        type: 'number',
        default: 0.0,
        min: -0.5,
        max: 0.5,
        step: 0.05,
        label: 'Horizontal Offset'
      },
      {
        name: 'verticalBeamOffset',
        type: 'number',
        default: -0.5,
        min: -0.5,
        max: 0.5,
        step: 0.05,
        label: 'Vertical Offset'
      }
    ]
  },
  {
    id: 'noise',
    label: 'Noise',
    component: () => import('../../../content/Animations/Noise/Noise.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/animations/noise"',
    props: [
      { name: 'patternSize', type: 'number', default: 250, min: 50, max: 500, step: 10, label: 'Pattern Size' },
      { name: 'patternScaleX', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1, label: 'Scale X' },
      { name: 'patternScaleY', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1, label: 'Scale Y' },
      {
        name: 'patternRefreshInterval',
        type: 'number',
        default: 2,
        min: 1,
        max: 10,
        step: 1,
        label: 'Refresh Interval'
      },
      { name: 'patternAlpha', type: 'number', default: 15, min: 5, max: 100, step: 5, label: 'Alpha' }
    ]
  },
  {
    id: 'ribbons',
    label: 'Ribbons',
    component: () => import('../../../content/Animations/Ribbons/Ribbons.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/animations/ribbons"',
    props: [
      { name: 'colors', type: 'colorArray', default: ['#FC8EAC'], label: 'Colors', minItems: 1, maxItems: 5 },
      { name: 'baseSpring', type: 'number', default: 0.03, min: 0.01, max: 0.1, step: 0.01, label: 'Spring' },
      { name: 'baseFriction', type: 'number', default: 0.9, min: 0.5, max: 0.99, step: 0.01, label: 'Friction' },
      { name: 'baseThickness', type: 'number', default: 30, min: 5, max: 100, step: 5, label: 'Thickness' },
      { name: 'offsetFactor', type: 'number', default: 0.05, min: 0, max: 0.2, step: 0.01, label: 'Offset Factor' },
      { name: 'maxAge', type: 'number', default: 500, min: 100, max: 2000, step: 50, label: 'Max Age (ms)' },
      { name: 'pointCount', type: 'number', default: 50, min: 10, max: 150, step: 5, label: 'Point Count' },
      { name: 'speedMultiplier', type: 'number', default: 0.6, min: 0.1, max: 2, step: 0.1, label: 'Speed' },
      { name: 'enableFade', type: 'boolean', default: false, label: 'Enable Fade' },
      { name: 'enableShaderEffect', type: 'boolean', default: false, label: 'Shader Effect' },
      { name: 'effectAmplitude', type: 'number', default: 2, min: 0, max: 10, step: 0.5, label: 'Effect Amplitude' }
    ]
  },
  {
    id: 'splash-cursor',
    label: 'Splash Cursor',
    component: () => import('../../../content/Animations/SplashCursor/SplashCursor.jsx'),
    installCommand: 'npx shadcn@latest add "https://reactbits.dev/default/animations/splash-cursor"',
    forceRemountOnPropChange: true,
    props: [
      {
        name: 'SIM_RESOLUTION',
        type: 'number',
        default: 128,
        min: 32,
        max: 256,
        step: 32,
        label: 'Simulation Resolution'
      },
      {
        name: 'DYE_RESOLUTION',
        type: 'number',
        default: 1440,
        min: 512,
        max: 2048,
        step: 128,
        label: 'Dye Resolution'
      },
      {
        name: 'DENSITY_DISSIPATION',
        type: 'number',
        default: 3.5,
        min: 0.5,
        max: 10,
        step: 0.5,
        label: 'Density Dissipation'
      },
      {
        name: 'VELOCITY_DISSIPATION',
        type: 'number',
        default: 2,
        min: 0.5,
        max: 5,
        step: 0.5,
        label: 'Velocity Dissipation'
      },
      { name: 'PRESSURE', type: 'number', default: 0.1, min: 0, max: 1, step: 0.1, label: 'Pressure' },
      { name: 'CURL', type: 'number', default: 3, min: 0, max: 30, step: 1, label: 'Curl' },
      { name: 'SPLAT_RADIUS', type: 'number', default: 0.2, min: 0.05, max: 1, step: 0.05, label: 'Splat Radius' },
      { name: 'SPLAT_FORCE', type: 'number', default: 6000, min: 1000, max: 20000, step: 500, label: 'Splat Force' },
      { name: 'COLOR_UPDATE_SPEED', type: 'number', default: 10, min: 1, max: 50, step: 1, label: 'Color Update Speed' }
    ]
  }
];

export const getBackgroundById = id => BACKGROUNDS.find(bg => bg.id === id);
export const getDefaultProps = background => {
  if (!background?.props) return {};
  return background.props.reduce((acc, prop) => {
    acc[prop.name] = prop.default;
    return acc;
  }, {});
};

const ANIMATION_IDS = [
  'antigravity',
  'click-spark',
  'ghost-cursor',
  'image-trail',
  'laser-flow',
  'noise',
  'ribbons',
  'splash-cursor'
];

export const getDocsPath = background => {
  if (!background?.id) return '/';
  const category = ANIMATION_IDS.includes(background.id) ? 'animations' : 'backgrounds';
  return `/${category}/${background.id}`;
};
