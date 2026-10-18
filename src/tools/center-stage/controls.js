import { DEVICE_TYPES, FINISHES, VIEWPORT_ASPECTS } from './engine/devices';
import { PHONE_COLORS, PHONE_ISLANDS, PHONE_METALS, TABLET_COLORS } from './engine/phone';
import { MOTION_KINDS } from './engine/scene';
import { FONTS } from './engine/text';
import { BACKGROUND_IMAGES } from './media';
import { BACKDROPS, DEFAULT_BACKDROP } from './backdrop';

export const BACKGROUND_KINDS = [
  { value: 'solid', label: 'Solid' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'mesh', label: 'Soft mesh' },
  { value: 'studio', label: 'Studio' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'image', label: 'Photo' },
  { value: 'reactbits', label: 'React Bits' },
  { value: 'transparent', label: 'Transparent' }
];

export const CONTROLS = {
  turn: { label: 'Turn', path: 'camera.ry', type: 'number', min: -60, max: 60, step: 0.5, unit: '°' },
  tilt: { label: 'Tilt', path: 'camera.rx', type: 'number', min: -40, max: 70, step: 0.5, unit: '°' },
  roll: { label: 'Roll', path: 'camera.rz', type: 'number', min: -25, max: 25, step: 0.5, unit: '°' },
  zoom: { label: 'Zoom', path: 'camera.zoom', type: 'number', min: 0.5, max: 4.5, step: 0.01, unit: '×' },
  fov: { label: 'Perspective', path: 'camera.fov', type: 'number', min: 8, max: 70, step: 1, unit: '°' },
  offsetX: { label: 'Shift X', path: 'camera.x', type: 'number', min: -0.5, max: 0.5, step: 0.005 },
  offsetY: { label: 'Shift Y', path: 'camera.y', type: 'number', min: -0.5, max: 0.5, step: 0.005 },
  padding: { label: 'Padding', path: 'camera.pad', type: 'number', min: 0, max: 0.6, step: 0.005 },
  depth: { label: 'Depth of field', path: 'depth.amount', type: 'number', min: 0, max: 1, step: 0.01, percent: true },
  bgKind: { label: 'Style', path: 'background.kind', type: 'chips', options: BACKGROUND_KINDS },
  bgColor: { label: 'Background', path: 'background.colors.0', type: 'color' },
  bgColor2: { label: 'Second color', path: 'background.colors.1', type: 'color' },
  bgColor3: { label: 'Third color', path: 'background.colors.2', type: 'color' },
  bgColor4: { label: 'Fourth color', path: 'background.colors.3', type: 'color' },
  bgAngle: { label: 'Angle', path: 'background.angle', type: 'number', min: 0, max: 360, step: 1, unit: '°' },
  bgImage: {
    label: 'Photo',
    path: 'background.image',
    type: 'select',
    options: BACKGROUND_IMAGES.map(({ value, label }) => ({ value, label })),
    fallback: 'sky-day'
  },
  bgBackdrop: {
    label: 'Background',
    path: 'background.component',
    type: 'backdrop',
    options: BACKDROPS,
    fallback: DEFAULT_BACKDROP
  },
  bgPreset: { label: 'Look', path: 'background.preset', type: 'backdropPreset' },
  bgProps: { label: 'Customize', path: 'background.props', type: 'backdropProps' },
  bgSlot: {
    label: 'From screen',
    path: 'background.slot',
    type: 'choice',
    options: [
      { value: 0, label: '1' },
      { value: 1, label: '2' },
      { value: 2, label: '3' }
    ],
    fallback: 0
  },
  spot: { label: 'Spotlight', path: 'background.spot', type: 'number', min: 0, max: 1, step: 0.01, percent: true },
  studioLight: {
    label: 'Light pool',
    path: 'background.light',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.01,
    percent: true
  },
  bgBlur: { label: 'Blur', path: 'background.blur', type: 'number', min: 0, max: 2, step: 0.01 },
  bgDim: { label: 'Dim', path: 'background.dim', type: 'number', min: 0, max: 0.9, step: 0.01, percent: true },
  shadow: { label: 'Shadow', path: 'light.shadow', type: 'number', min: 0, max: 1, step: 0.01, percent: true },
  softness: { label: 'Softness', path: 'light.softness', type: 'number', min: 0, max: 1, step: 0.01, percent: true },
  lightAngle: { label: 'Light angle', path: 'light.angle', type: 'number', min: -90, max: 90, step: 1, unit: '°' },
  lightHeight: { label: 'Light height', path: 'light.height', type: 'number', min: 12, max: 88, step: 1, unit: '°' },
  lift: { label: 'Lift', path: 'light.distance', type: 'number', min: 0.01, max: 1, step: 0.01 },
  reflection: {
    label: 'Reflection',
    path: 'light.reflection',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.01,
    percent: true
  },
  glare: { label: 'Glare', path: 'light.glare', type: 'number', min: 0, max: 0.6, step: 0.01, percent: true },
  shadowTint: { label: 'Shadow color', path: 'light.tint', type: 'color' },
  text: { label: 'Headline', path: 'type.text', type: 'text', multiline: true },
  font: {
    label: 'Font',
    path: 'type.font',
    type: 'select',
    options: FONTS.map(({ value, label }) => ({ value, label }))
  },
  weight: { label: 'Weight', path: 'type.weight', type: 'number', min: 250, max: 900, step: 10 },
  typeSize: { label: 'Size', path: 'type.size', type: 'number', min: 0.1, max: 1.4, step: 0.01 },
  typeColor: { label: 'Color', path: 'type.color', type: 'color', auto: true },
  typeOpacity: { label: 'Opacity', path: 'type.opacity', type: 'number', min: 0, max: 1, step: 0.01, percent: true },
  typeStyle: {
    label: 'Style',
    path: 'type.style',
    type: 'choice',
    options: [
      { value: 'fill', label: 'Fill' },
      { value: 'outline', label: 'Outline' }
    ]
  },
  typePosition: {
    label: 'Position',
    path: 'type.position',
    type: 'select',
    options: [
      { value: 'behind', label: 'Behind the shot' },
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' }
    ]
  },
  typeDepth: { label: 'Distance', path: 'type.depth', type: 'number', min: 0, max: 1, step: 0.01 },
  typeOffset: { label: 'Height', path: 'type.offset', type: 'number', min: -0.5, max: 0.5, step: 0.005 },
  tracking: { label: 'Letter spacing', path: 'type.tracking', type: 'number', min: -0.12, max: 0.1, step: 0.005 },
  title: { label: 'Title', path: 'caption.title', type: 'text' },
  subtitle: { label: 'Subtitle', path: 'caption.subtitle', type: 'text' },
  captionPosition: {
    label: 'Position',
    path: 'caption.position',
    type: 'choice',
    options: [
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' }
    ]
  },
  captionAlign: {
    label: 'Align',
    path: 'caption.align',
    type: 'choice',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' }
    ]
  },
  captionSize: { label: 'Size', path: 'caption.size', type: 'number', min: 0.5, max: 1.8, step: 0.01 },
  captionColor: { label: 'Color', path: 'caption.color', type: 'color', auto: true },
  motion: { label: 'Motion', path: 'motion.kind', type: 'motion', options: MOTION_KINDS },
  duration: { label: 'Length', path: 'motion.duration', type: 'number', min: 2, max: 40, step: 0.5, unit: 's' },
  lengths: {
    label: 'Length',
    path: 'motion.duration',
    type: 'chips',
    options: [4, 6, 8, 12, 16, 24].map(value => ({ value, label: `${value}s` }))
  },
  shift: {
    label: 'Tile motion',
    path: 'motion.shift',
    type: 'choice',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'sway', label: 'Sway' },
      { value: 'flow', label: 'Flow' }
    ],
    fallback: 'off'
  },
  shiftAmount: {
    label: 'Tile shift',
    path: 'motion.shiftAmount',
    type: 'number',
    min: 0,
    max: 1.5,
    step: 0.01,
    percent: true,
    fallback: 0.5
  },
  intensity: {
    label: 'Intensity',
    path: 'motion.intensity',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.01,
    percent: true
  },
  grain: { label: 'Grain', path: 'finish.grain', type: 'number', min: 0, max: 1, step: 0.01, percent: true },
  vignette: { label: 'Vignette', path: 'finish.vignette', type: 'number', min: 0, max: 1, step: 0.01, percent: true }
};

export const deviceControls = (index, device) => {
  const base = `devices.${index}`;
  const phone = device.type === 'phone';
  const handheld = phone || device.type === 'tablet';
  const hardware = handheld || device.type === 'laptop' || device.type === 'monitor';
  const list = [
    { key: `${base}.type`, label: 'Frame', path: `${base}.type`, type: 'select', options: DEVICE_TYPES },
    hardware
      ? {
          key: `${base}.finish`,
          label: 'Finish',
          path: `${base}.finish`,
          type: 'swatches',
          options: phone ? PHONE_COLORS : TABLET_COLORS,
          custom: `${base}.color`,
          fallback: 'black'
        }
      : {
          key: `${base}.finish`,
          label: 'Finish',
          path: `${base}.finish`,
          type: 'select',
          options: FINISHES[device.type || 'card'] || FINISHES.card
        }
  ];
  if (phone) {
    list.push({
      key: `${base}.statusBar`,
      label: 'Status bar',
      path: `${base}.statusBar`,
      type: 'switch',
      fallback: true
    });
    list.push({
      key: `${base}.browserBar`,
      label: 'Safari bar',
      path: `${base}.browserBar`,
      type: 'switch',
      fallback: false
    });
    if (device.browserBar)
      list.push({ key: `${base}.url`, label: 'Address', path: `${base}.url`, type: 'text', fallback: 'reactbits.dev' });
  }
  const primary = list.length;
  if (device.type === 'browser')
    list.push({ key: `${base}.url`, label: 'Address', path: `${base}.url`, type: 'text', fallback: 'reactbits.dev' });
  if (device.type === 'window')
    list.push({ key: `${base}.title`, label: 'Title', path: `${base}.title`, type: 'text' });
  if (device.type === 'browser' || device.type === 'window')
    list.push({
      key: `${base}.lights`,
      label: 'Window buttons',
      path: `${base}.lights`,
      type: 'choice',
      options: [
        { value: 'mono', label: 'Mono' },
        { value: 'color', label: 'Color' }
      ],
      fallback: 'mono'
    });
  if (device.type === 'card')
    list.push({
      key: `${base}.radius`,
      label: 'Corners',
      path: `${base}.radius`,
      type: 'number',
      min: 0,
      max: 0.3,
      step: 0.002
    });
  if (device.type === 'browser' || device.type === 'window' || device.type === 'card') {
    list.push({
      key: `${base}.viewport`,
      label: 'Viewport',
      path: `${base}.viewport`,
      type: 'select',
      options: VIEWPORT_ASPECTS,
      fallback: 'auto'
    });
  }
  if (hardware) {
    list.push({
      key: `${base}.metal`,
      label: 'Metal',
      path: `${base}.metal`,
      type: 'choice',
      options: PHONE_METALS,
      fallback: 'satin'
    });
    list.push({
      key: `${base}.glass`,
      label: 'Glass reflection',
      path: `${base}.glass`,
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      percent: true,
      fallback: handheld ? 0.5 : 0.2
    });
    list.push({
      key: `${base}.glassFinish`,
      label: 'Glass',
      path: `${base}.glassFinish`,
      type: 'choice',
      options: [
        { value: 'glossy', label: 'Glossy' },
        { value: 'matte', label: 'Matte' }
      ],
      fallback: 'glossy'
    });
    if (phone)
      list.push({
        key: `${base}.island`,
        label: 'Island',
        path: `${base}.island`,
        type: 'choice',
        options: PHONE_ISLANDS,
        fallback: 'pill'
      });
    list.push({
      key: `${base}.glow`,
      label: 'Screen brightness',
      path: `${base}.glow`,
      type: 'number',
      min: 0.4,
      max: 1.4,
      step: 0.01,
      percent: true,
      fallback: 1
    });
  }
  if (device.type === 'tablet')
    list.push({
      key: `${base}.orientation`,
      label: 'Orientation',
      path: `${base}.orientation`,
      type: 'choice',
      options: [
        { value: 'landscape', label: 'Landscape' },
        { value: 'portrait', label: 'Portrait' }
      ],
      fallback: 'landscape'
    });
  if (device.type === 'laptop')
    list.push({
      key: `${base}.open`,
      label: 'Lid angle',
      path: `${base}.open`,
      type: 'number',
      min: 0,
      max: 135,
      step: 0.5,
      unit: '°',
      fallback: 108
    });
  list.push({
    key: `${base}.fit`,
    label: 'Fit',
    path: `${base}.fit`,
    type: 'choice',
    options: [
      { value: 'cover', label: 'Fill' },
      { value: 'contain', label: 'Fit' }
    ],
    fallback: 'cover'
  });
  list.push({
    key: `${base}.scroll`,
    label: 'Scroll',
    path: `${base}.scroll`,
    type: 'number',
    min: 0,
    max: 1,
    step: 0.001,
    percent: true,
    fallback: 0
  });
  list.push({
    key: `${base}.scale`,
    label: 'Size',
    path: `${base}.scale`,
    type: 'number',
    min: 0.2,
    max: 2.5,
    step: 0.01,
    fallback: 1
  });
  return list.map((control, position) => (position >= primary ? { ...control, more: true } : control));
};

export const devicePlacement = index => {
  const base = `devices.${index}`;
  return [
    {
      key: `${base}.x`,
      label: 'Move sideways',
      path: `${base}.x`,
      type: 'number',
      min: -4,
      max: 4,
      step: 0.01,
      fallback: 0
    },
    { key: `${base}.y`, label: 'Move up', path: `${base}.y`, type: 'number', min: -3, max: 3, step: 0.01, fallback: 0 },
    {
      key: `${base}.z`,
      label: 'Move forward',
      path: `${base}.z`,
      type: 'number',
      min: -4,
      max: 3,
      step: 0.01,
      fallback: 0
    },
    {
      key: `${base}.ry`,
      label: 'Turn',
      path: `${base}.ry`,
      type: 'number',
      min: -180,
      max: 180,
      step: 0.5,
      unit: '°',
      fallback: 0
    },
    {
      key: `${base}.rx`,
      label: 'Tilt',
      path: `${base}.rx`,
      type: 'number',
      min: -90,
      max: 90,
      step: 0.5,
      unit: '°',
      fallback: 0
    },
    {
      key: `${base}.rz`,
      label: 'Roll',
      path: `${base}.rz`,
      type: 'number',
      min: -45,
      max: 45,
      step: 0.5,
      unit: '°',
      fallback: 0
    }
  ];
};

export const TABS = [
  { value: 'scene', label: 'Scene' },
  { value: 'device', label: 'Device' },
  { value: 'camera', label: 'Camera' },
  { value: 'motion', label: 'Motion' },
  { value: 'text', label: 'Text' }
];

export const TAB_GROUPS = {
  scene: [
    {
      id: 'background',
      title: 'Background',
      controls: ['bgKind', 'bgBackdrop', 'bgPreset', 'bgImage', 'bgSlot', 'bgColor', 'bgColor2'],
      more: ['bgColor3', 'bgAngle', 'spot', 'studioLight', 'bgBlur', 'bgDim', 'bgProps']
    },
    {
      id: 'light',
      title: 'Light and shadow',
      controls: ['shadow', 'softness', 'reflection'],
      more: ['lightAngle', 'lightHeight', 'lift', 'glare', 'shadowTint']
    },
    { id: 'finish', title: 'Finish', controls: ['grain', 'vignette'] }
  ],
  camera: [
    {
      id: 'angle',
      title: 'Angle',
      controls: ['turn', 'tilt', 'zoom'],
      more: ['roll', 'fov', 'offsetX', 'offsetY', 'padding']
    },
    { id: 'depth', title: 'Depth of field', controls: ['depth'] }
  ],
  motion: [
    { id: 'motion', title: 'Motion', controls: ['motion'] },
    { id: 'timing', title: 'Timing', controls: ['lengths', 'intensity'], more: ['duration'] },
    { id: 'tiles', title: 'Tiles', controls: ['shift', 'shiftAmount'] }
  ],
  text: [
    {
      id: 'type',
      title: 'Headline',
      controls: ['text', 'typeStyle', 'typeSize'],
      more: ['font', 'weight', 'typeColor', 'typeOpacity', 'typePosition', 'typeDepth', 'typeOffset', 'tracking']
    },
    {
      id: 'caption',
      title: 'Caption',
      controls: ['title', 'subtitle'],
      more: ['captionPosition', 'captionAlign', 'captionSize', 'captionColor']
    }
  ]
};

export const visibleControl = (id, doc) => {
  const bg = doc.background?.kind;
  switch (id) {
    case 'bgColor2':
      return ['spotlight', 'gradient', 'mesh', 'studio'].includes(bg);
    case 'bgColor3':
      return ['gradient', 'mesh'].includes(bg);
    case 'bgAngle':
      return bg === 'gradient';
    case 'spot':
      return ['solid', 'spotlight', 'gradient', 'mesh'].includes(bg);
    case 'studioLight':
      return bg === 'studio';
    case 'bgImage':
      return bg === 'image';
    case 'bgSlot':
      return bg === 'ambient';
    case 'bgBlur':
    case 'bgDim':
      return ['ambient', 'image', 'reactbits'].includes(bg);
    case 'bgBackdrop':
    case 'bgPreset':
    case 'bgProps':
      return bg === 'reactbits';
    case 'bgColor':
      return bg !== 'transparent' && bg !== 'image' && bg !== 'ambient' && bg !== 'reactbits';
    case 'reflection':
      return bg === 'studio' || doc.light?.receiver === 'floor';
    case 'font':
    case 'weight':
    case 'typeSize':
    case 'typeColor':
    case 'typeOpacity':
    case 'typeStyle':
    case 'typePosition':
    case 'typeOffset':
    case 'tracking':
      return Boolean(doc.type?.text);
    case 'typeDepth':
      return Boolean(doc.type?.text) && doc.type?.position === 'behind';
    case 'captionPosition':
    case 'captionAlign':
    case 'captionSize':
    case 'captionColor':
      return Boolean(doc.caption?.title || doc.caption?.subtitle);
    case 'duration':
    case 'lengths':
    case 'intensity':
      return (doc.motion?.kind || 'none') !== 'none' || Boolean(doc.motion?.shift && doc.motion.shift !== 'off');
    case 'shift':
      return (
        doc.motion?.kind !== 'flow' && doc.devices.some(device => device.lane !== undefined && device.lane !== null)
      );
    case 'shiftAmount':
      return (
        doc.motion?.shift === 'sway' && doc.devices.some(device => device.lane !== undefined && device.lane !== null)
      );
    default:
      return true;
  }
};
