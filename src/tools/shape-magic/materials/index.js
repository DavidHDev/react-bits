import chrome from './chrome';
import brushedMetal from './brushed-metal';
import quicksilver from './quicksilver';
import obsidian from './obsidian';
import glass from './glass';
import crystal from './crystal';
import frost from './frost';
import water from './water';
import thinFilm from './thin-film';
import neon from './neon';
import lightEdge from './light-edge';
import irradiance from './irradiance';
import hologram from './hologram';
import holoFoil from './holo-foil';
import heatmap from './heatmap';
import thermal from './thermal';
import gemSmoke from './gem-smoke';
import smoke from './smoke';
import nebula from './nebula';
import plastic from './plastic';
import carbonFiber from './carbon-fiber';
import goo from './goo';
import emboss from './emboss';
import voxels from './voxels';
import particles from './particles';
import auroraFlow from './aurora-flow';
import flowingGradient from './flowing-gradient';
import plasmaFlow from './plasma-flow';
import swirl from './swirl';

export const PROCEDURAL_GROUPS = [
  { id: 'fx-heat', label: 'Heat and smoke', ids: ['heatmap', 'gem-smoke', 'nebula', 'thermal', 'smoke'] },
  { id: 'fx-metal', label: 'Metal', ids: ['chrome', 'quicksilver', 'brushed-metal', 'obsidian'] },
  { id: 'fx-glass', label: 'Glass', ids: ['glass', 'crystal', 'frost', 'water', 'thin-film'] },
  { id: 'fx-light', label: 'Light', ids: ['holo-foil', 'neon', 'light-edge', 'irradiance', 'hologram'] },
  { id: 'fx-surface', label: 'Surface', ids: ['plastic', 'goo', 'emboss', 'carbon-fiber', 'voxels', 'particles'] },
  { id: 'patterns', label: 'Patterns', ids: ['aurora-flow', 'flowing-gradient', 'plasma-flow', 'swirl'] }
];

export const PROCEDURAL = [
  chrome,
  brushedMetal,
  quicksilver,
  obsidian,
  glass,
  crystal,
  frost,
  water,
  thinFilm,
  neon,
  lightEdge,
  irradiance,
  hologram,
  holoFoil,
  heatmap,
  thermal,
  gemSmoke,
  smoke,
  nebula,
  plastic,
  carbonFiber,
  goo,
  emboss,
  voxels,
  particles,
  auroraFlow,
  flowingGradient,
  plasmaFlow,
  swirl
];

export const PROCEDURAL_BY_ID = Object.fromEntries(PROCEDURAL.map(def => [def.id, def]));
