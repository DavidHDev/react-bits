import { INTERFACE } from './interface.js';
import { VIDEO } from './video.js';

export const LIBRARIES = [
  { id: 'interface', label: 'Interface' },
  { id: 'video', label: 'Video' }
];

export const CATEGORIES = [
  { id: 'tap', library: 'interface', label: 'Tap' },
  { id: 'select', library: 'interface', label: 'Select' },
  { id: 'toggle', library: 'interface', label: 'Toggle' },
  { id: 'feedback', library: 'interface', label: 'Feedback' },
  { id: 'notify', library: 'interface', label: 'Notify' },
  { id: 'motion', library: 'interface', label: 'Motion' },
  { id: 'type', library: 'interface', label: 'Type' },
  { id: 'system', library: 'interface', label: 'System' },
  { id: 'navigate', library: 'interface', label: 'Navigate' },
  { id: 'drag', library: 'interface', label: 'Drag' },
  { id: 'progress', library: 'interface', label: 'Progress' },
  { id: 'message', library: 'interface', label: 'Message' },
  { id: 'media', library: 'interface', label: 'Media' },
  { id: 'delight', library: 'interface', label: 'Delight' },
  { id: 'risers', library: 'video', label: 'Risers' },
  { id: 'impacts', library: 'video', label: 'Impacts' },
  { id: 'whooshes', library: 'video', label: 'Whooshes' },
  { id: 'transitions', library: 'video', label: 'Transitions' },
  { id: 'accents', library: 'video', label: 'Accents' },
  { id: 'drops', library: 'video', label: 'Drops' },
  { id: 'glitches', library: 'video', label: 'Glitches' },
  { id: 'ambience', library: 'video', label: 'Ambience' },
  { id: 'titles', library: 'video', label: 'Titles' },
  { id: 'pops', library: 'video', label: 'Pops' },
  { id: 'stingers', library: 'video', label: 'Stingers' },
  { id: 'tension', library: 'video', label: 'Tension' }
];

export const SOUNDS = [...INTERFACE, ...VIDEO].map(sound => ({
  ...sound,
  library: CATEGORIES.find(category => category.id === sound.category).library
}));

export const SOUNDS_BY_ID = Object.fromEntries(SOUNDS.map(sound => [sound.id, sound]));
