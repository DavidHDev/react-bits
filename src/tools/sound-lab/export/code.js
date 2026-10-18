export const TUNE_KEYS = ['pitch', 'tone', 'length', 'space', 'punch', 'variation', 'volume'];

const EFFECT_KEYS = ['reverb', 'echo', 'filter', 'chorus', 'lofi'];

const DEFAULTS = { pitch: 0, tone: 0, length: 1, space: 0, punch: 0, variation: 0, volume: 0 };

export const registryName = sound =>
  `Sound${sound.id
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}`;

export const fileName = sound => sound.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

export function toSource(value, indent = '') {
  const next = `${indent}  `;
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const flat = value.every(item => typeof item !== 'object' || item === null);
    if (flat) return `[${value.map(item => toSource(item)).join(', ')}]`;
    return `[\n${value.map(item => `${next}${toSource(item, next)}`).join(',\n')}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (!entries.length) return '{}';
    const parts = entries.map(([key, item]) => `${IDENTIFIER.test(key) ? key : `'${key}'`}: ${toSource(item, next)}`);
    const inline = `{ ${parts.join(', ')} }`;
    if (inline.length + indent.length <= 96 && !inline.includes('\n')) return inline;
    return `{\n${parts.map(part => `${next}${part}`).join(',\n')}\n${indent}}`;
  }
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
  if (typeof value === 'number') return String(Number(value.toFixed(5)));
  return String(value);
}

export function soundSource(sound, typescript) {
  const name = fileName(sound);
  const body = toSource(sound.recipe);
  if (typescript) {
    return `import type { Recipe } from './react-bits-sound';\n\nconst ${name}: Recipe = ${body};\n\nexport default ${name};\n`;
  }
  return `const ${name} = ${body};\n\nexport default ${name};\n`;
}

const effectSettings = effect =>
  Object.fromEntries(
    Object.entries(effect)
      .filter(([, value]) => value !== undefined && value !== false)
      .map(([key, value]) => [key, typeof value === 'number' ? Number(value.toFixed(2)) : value])
  );

export const tuneChanges = (tune = {}) => ({
  ...Object.fromEntries(
    TUNE_KEYS.filter(key => tune[key] !== undefined && Math.abs(tune[key] - DEFAULTS[key]) > 1e-6).map(key => [
      key,
      Number(Number(tune[key]).toFixed(key === 'length' ? 2 : 2))
    ])
  ),
  ...Object.fromEntries(EFFECT_KEYS.filter(key => tune[key]).map(key => [key, effectSettings(tune[key])]))
});

const DEMOS = {
  tap: ['SaveButton', 'button', 'onClick={play}', 'Save changes'],
  select: ['TopicChip', 'button', 'onClick={play}', 'Design'],
  toggle: ['WifiSwitch', 'button', 'role="switch" onClick={play}', 'Wi-Fi'],
  feedback: ['SubscribeButton', 'button', 'onClick={play}', 'Subscribe'],
  notify: ['NotifyButton', 'button', 'onClick={play}', 'Send notification'],
  motion: ['OpenPanel', 'button', 'onClick={play}', 'Open panel'],
  system: ['ConnectButton', 'button', 'onClick={play}', 'Connect'],
  navigate: ['NextButton', 'button', 'onClick={play}', 'Next'],
  drag: ['DraggableCard', 'div', 'draggable onDragStart={play}', 'Drag me'],
  progress: ['StepButton', 'button', 'onClick={play}', 'Complete step'],
  message: ['SendButton', 'button', 'onClick={play}', 'Send'],
  media: ['PlayButton', 'button', 'onClick={play}', 'Play'],
  delight: ['LikeButton', 'button', 'onClick={play}', 'Like']
};

export function usageSource(sound, tune) {
  const name = fileName(sound);
  const changes = tuneChanges(tune);
  const options = Object.keys(changes).length ? `, ${toSource(changes, '  ')}` : '';
  const imports = `import { useSound } from '@/components/sounds/react-bits-sound';\nimport ${name} from '@/components/sounds/${name}';`;
  if (sound.category === 'type') {
    return `${imports}\n\nexport default function MessageInput() {\n  const play = useSound(${name}${options});\n\n  return <input onKeyDown={play} placeholder="Type a message" />;\n}\n`;
  }
  if (sound.library === 'video') {
    return `${imports}\n\nexport default function PlayIntro() {\n  const play = useSound(${name}${options});\n\n  return <button onClick={play}>Play ${sound.name.toLowerCase()}</button>;\n}\n`;
  }
  const [component, tag, attributes, label] = DEMOS[sound.category] || DEMOS.tap;
  return `${imports}\n\nexport default function ${component}() {\n  const play = useSound(${name}${options});\n\n  return <${tag} ${attributes}>${label}</${tag}>;\n}\n`;
}
