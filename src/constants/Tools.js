import { Palette, Shapes, ImageIcon } from 'lucide-react';

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
  }
];
