import { componentMetadata } from './Information.js';
// Used for main sidebar navigation
export const CATEGORIES = [
  {
    name: 'Get Started',
    subcategories: ['Introduction', 'Installation', 'MCP', 'Index', 'Changelog']
  },
  {
    name: 'Text Animations',
    subcategories: [
      'Tech Text',
      'Text Loop',
      'Masked Heading',
      'Particle Text',
      'Split Flap Text',
      'Warp Text',
      'Stroke Text',
      'Depth Text',
      'Fold Text',
      'Echo Text',
      'Split Text',
      'Blur Text',
      'Circular Text',
      'Text Type',
      'Shuffle',
      'Shiny Text',
      'Text Pressure',
      'Curved Loop',
      'Fuzzy Text',
      'Gradient Text',
      'Falling Text',
      'Text Cursor',
      'Decrypted Text',
      'True Focus',
      'Scroll Float',
      'Scroll Reveal',
      'ASCII Text',
      'Scrambled Text',
      'Rotating Text',
      'Glitch Text',
      'Scroll Velocity',
      'Variable Proximity',
      'Count Up'
    ]
  },
  {
    name: 'Animations',
    subcategories: [
      'Electric Logo',
      'Dither Veil',
      'Glow Cursor',
      'Scroll Expand',
      'Ripple Distortion',
      'Elastic Mesh',
      'Swarm Cursor',
      'Halftone Reveal',
      'Pixel Swap',
      'Cursor Grid',
      'Animated Content',
      'Fade Content',
      'Electric Border',
      'Orbit Images',
      'Pixel Transition',
      'Glare Hover',
      'Antigravity',
      'Logo Loop',
      'Target Cursor',
      'Magic Rings',
      'Laser Flow',
      'Magnet Lines',
      'Ghost Cursor',
      'Gradual Blur',
      'Click Spark',
      'Magnet',
      'Strands',
      'Sticker Peel',
      'Pixel Trail',
      'Cubes',
      'Metallic Paint',
      'Noise',
      'Shape Blur',
      'Crosshair',
      'Image Trail',
      'Ribbons',
      'Splash Cursor',
      'Meta Balls',
      'Blob Cursor',
      'Star Border'
    ]
  },
  {
    name: 'Components',
    subcategories: [
      'Circular Carousel',
      'Flex Carousel',
      'Infinite Spiral',
      'Depth Carousel',
      'Morph Slider',
      'Drift Wall',
      'Accordion Gallery',
      'Specular Button',
      'Option Wheel',
      'Curved Input',
      'Line Sidebar',
      'Animated List',
      'Scroll Stack',
      'Bubble Menu',
      'Magic Bento',
      'Circular Gallery',
      'Reflective Card',
      'Card Nav',
      'Stack',
      'Fluid Glass',
      'Pill Nav',
      'Tilted Card',
      'Masonry',
      'Glass Surface',
      'Dome Gallery',
      'Chroma Grid',
      'Folder',
      'Staggered Menu',
      'Model Viewer',
      'Lanyard',
      'Profile Card',
      'Dock',
      'Gooey Nav',
      'Pixel Card',
      'Carousel',
      'Spotlight Card',
      'Border Glow',
      'Flying Posters',
      'Card Swap',
      'Glass Icons',
      'Decay Card',
      'Flowing Menu',
      'Elastic Slider',
      'Counter',
      'Infinite Menu',
      'Stepper',
      'Bounce Cards'
    ]
  },
  {
    name: 'Micro',
    subcategories: ['Shredder', 'Paper Crumple', 'Tear Ticket', 'Flip Card', 'Branched Menu', 'Folder Float', 'Refine Frame', 'Thought Line', 'Voice Pill', 'Slosh Gauge', 'Prompt Bar', 'Swipe Toast', 'Sling Button', 'Bell Toggle', 'Call Chip', 'Status Mark', 'Glide Select', 'Swipe Row', 'Jelly Radio', 'Comet Dial', 'Wake Slider', 'Code Slots', 'Dodge Field', 'Lattice Loader', 'Scrub Field', 'Fuse Button', 'Warm Tooltip', 'Slide Commit', 'Rubber Segment', 'Pulse Heart', 'Spring Check', 'Peek Rating', 'Hold Button', 'Squish Switch']
  },
  {
    name: 'Backgrounds',
    subcategories: [
      'Pattern Waves',
      'Micro Slats',
      'Shape Waves',
      'Aero Shards',
      'Ghost Fibers',
      'CRT Warp',
      'Molten Metal',
      'Gradient Waves',
      'Web Threads',
      'Topography',
      'Light Tunnel',
      'Sliced Waves',
      'Acid Squares',
      'Scanner',
      'Ferrofluid',
      'Lightfall',
      'Liquid Ether',
      'Prism',
      'Dark Veil',
      'Light Pillar',
      'Silk',
      'Floating Lines',
      'Side Rays',
      'Light Rays',
      'Pixel Blast',
      'Color Bends',
      'Evil Eye',
      'Line Waves',
      'Radar',
      'Soft Aurora',
      'Aurora',
      'Plasma',
      'Plasma Wave',
      'Particles',
      'Gradient Blinds',
      'Grainient',
      'Grid Scan',
      'Beams',
      'Pixel Snow',
      'Lightning',
      'Prismatic Burst',
      'Galaxy',
      'Dither',
      'Faulty Terminal',
      'Ripple Grid',
      'Dot Field',
      'Dot Grid',
      'Threads',
      'Hyperspeed',
      'Iridescence',
      'Waves',
      'Grid Distortion',
      'Ballpit',
      'Orb',
      'Letter Glitch',
      'Grid Motion',
      'Shape Grid',
      'Liquid Chrome',
      'Balatro'
    ]
  }
];

export const COMPONENT_COUNT = Math.floor(
  CATEGORIES.filter((c) => c.name !== 'Get Started').reduce((sum, c) => sum + c.subcategories.length, 0) / 5
) * 5;

export const TOTAL_COMPONENTS = CATEGORIES.filter(category => category.name !== 'Get Started').reduce(
  (total, category) => total + category.subcategories.length,
  0
);

const NEW_FOR_DAYS = 30;
const UPDATED_FOR_DAYS = 14;
const DAY_MS = 86400000;
const now = Date.now();
const isRecent = (date, days) => Boolean(date) && now - Date.parse(`${date}T00:00:00Z`) < days * DAY_MS;
const toSlug = value => value.replace(/\s+/g, '-').toLowerCase();
const latestUpdate = meta => (meta.updates || []).reduce((latest, update) => (update.date > latest ? update.date : latest), '');

const metadataByPath = new Map(
  Object.entries(componentMetadata).map(([key, meta]) => [new URL(meta.docsUrl).pathname, { key, meta }])
);

const catalog = CATEGORIES.filter(category => category.name !== 'Get Started').flatMap(category =>
  category.subcategories
    .map(name => ({ name, entry: metadataByPath.get(`/${toSlug(category.name)}/${toSlug(name)}`) }))
    .filter(({ entry }) => entry)
);

const recentlyAdded = catalog.filter(({ entry }) => isRecent(entry.meta.added, NEW_FOR_DAYS));
const recentlyUpdated = catalog.filter(
  ({ entry }) => !isRecent(entry.meta.added, NEW_FOR_DAYS) && isRecent(latestUpdate(entry.meta), UPDATED_FOR_DAYS)
);

export const NEW = recentlyAdded.map(({ name }) => name);
export const NEW_KEYS = new Set(recentlyAdded.map(({ entry }) => entry.key));
export const UPDATED = recentlyUpdated.map(({ name }) => name);
export const UPDATED_KEYS = new Set(recentlyUpdated.map(({ entry }) => entry.key));
