import { Palette, Shapes, ImageIcon, Video, Volume2 } from 'lucide-react';

export const TOOLS = [
  {
    id: 'background-studio',
    label: 'Background Studio',
    tagline: 'Animated backgrounds',
    icon: Palette,
    path: '/tools/background-studio',
    description:
      'Browse every animated background, start from a preset and tune it live. Export the code, a high resolution image or a looping MP4 or WebM video, or share it as a link.'
  },
  {
    id: 'center-stage',
    label: 'Center Stage',
    tagline: 'Product shots and mockups',
    icon: Video,
    path: '/tools/center-stage',
    description:
      'Turn a screenshot or screen recording into a polished product shot. Perfect for launch videos or demos. Start from a preset, put your screens on lifelike phones, laptops and browsers, then shape the shot with 3D tilt, depth of field, shadows and type. Export 4K images, 4K video, GIFs or a link.'
  },
  {
    id: 'shape-magic',
    label: 'Shape Magic',
    tagline: 'Logo marks and 3D materials',
    icon: Shapes,
    path: '/tools/shape-magic',
    description:
      'Design a logo mark from smart shapes, patterns, text or your own SVG, then give it a 3D material like chrome, glass or neon, or any React Bits background. Export clean SVG, PNG, favicons, video or React.'
  },
  {
    id: 'texture-lab',
    label: 'Texture Lab',
    tagline: 'Photo and video effects',
    icon: ImageIcon,
    path: '/tools/texture-lab',
    description:
      'Run photos, videos or your camera through 160 one-click styles and 75+ stackable, animated effects, from ASCII and halftone to glass, chrome and glitch. Export images, videos, GIFs or a shareable style.'
  },
  {
    id: 'sound-lab',
    label: 'Sound Lab',
    tagline: 'Interface and video sounds',
    icon: Volume2,
    path: '/tools/sound-lab',
    description:
      'A library of polished sounds, from soft taps, toggles and notifications to risers, impacts and whooshes for video. Tune pitch, tone, length and space, then install a sound into your project with one command or download it as WAV, MP3 or OGG.'
  }
];
