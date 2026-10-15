import ascii from './ascii';
import halftone from './halftone';
import dither from './dither';
import pixel from './pixel';
import voxel from './voxel';
import posterize from './posterize';
import ink from './ink';
import paint from './paint';
import watercolor from './watercolor';
import engrave from './engrave';
import chalk from './chalk';
import contour from './contour';
import crt from './crt';
import vhs from './vhs';
import chromatic from './chromatic';
import glitch from './glitch';
import smear from './smear';
import pixelsort from './pixelsort';
import forensics from './forensics';
import jpeg from './jpeg';
import datamosh from './datamosh';
import echo from './echo';
import bars from './bars';
import bloom from './bloom';
import halation from './halation';
import leak from './leak';
import sparkle from './sparkle';
import lens from './lens';
import blur from './blur';
import bokeh from './bokeh';
import grain from './grain';
import film from './film';
import scratches from './scratches';
import paper from './paper';
import letterbox from './letterbox';
import adjust from './adjust';
import grade from './grade';
import gradient from './gradient';
import hue from './hue';
import warp from './warp';
import ripple from './ripple';
import water from './water';
import fluted from './fluted';
import refract from './refract';
import kaleidoscope from './kaleidoscope';
import distort from './distort';
import forms from './forms';
import truchet from './truchet';
import lattice from './lattice';
import lowpoly from './lowpoly';
import extrude from './extrude';
import neongrid from './neongrid';
import flowfield from './flowfield';
import schematic from './schematic';
import specimen from './specimen';
import frosted from './frosted';
import stained from './stained';
import vitrine from './vitrine';
import shatter from './shatter';
import orb from './orb';
import droste from './droste';
import chrome from './chrome';
import crystallize from './crystallize';
import emboss from './emboss';
import marble from './marble';
import molten from './molten';
import thinfilm from './thinfilm';
import sketch from './sketch';
import warhol from './warhol';
import woodblock from './woodblock';
import points from './points';
import disco from './disco';
import anaglyph from './anaglyph';
import dust from './dust';
import edgeglow from './edgeglow';
import warpbloom from './warpbloom';
import rays from './rays';

export const EFFECT_LIST = [
  ascii,
  halftone,
  warhol,
  woodblock,
  dither,
  points,
  pixel,
  voxel,
  posterize,
  ink,
  sketch,
  paint,
  watercolor,
  engrave,
  chalk,
  contour,
  forms,
  truchet,
  lattice,
  lowpoly,
  extrude,
  neongrid,
  flowfield,
  schematic,
  specimen,
  fluted,
  frosted,
  stained,
  vitrine,
  shatter,
  orb,
  chrome,
  crystallize,
  emboss,
  marble,
  molten,
  thinfilm,
  crt,
  vhs,
  chromatic,
  glitch,
  jpeg,
  datamosh,
  echo,
  bars,
  smear,
  pixelsort,
  forensics,
  bloom,
  halation,
  leak,
  sparkle,
  disco,
  anaglyph,
  dust,
  edgeglow,
  warpbloom,
  rays,
  lens,
  blur,
  bokeh,
  grain,
  film,
  scratches,
  paper,
  letterbox,
  adjust,
  grade,
  gradient,
  hue,
  warp,
  ripple,
  water,
  refract,
  kaleidoscope,
  droste,
  distort
];

export const CATEGORIES = [
  { id: 'type', label: 'Type' },
  { id: 'print', label: 'Print' },
  { id: 'pixel', label: 'Pixel' },
  { id: 'art', label: 'Art' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'glass', label: 'Glass' },
  { id: 'light', label: 'Light' },
  { id: 'material', label: 'Material' },
  { id: 'analog', label: 'Analog' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'film', label: 'Film' },
  { id: 'color', label: 'Color' },
  { id: 'lens', label: 'Lens and blur' },
  { id: 'distort', label: 'Distort' }
];

export const EFFECTS = Object.fromEntries(EFFECT_LIST.map(effect => [effect.id, effect]));

export const DEFAULT_BLEND = 'screen';

export const blendFor = type => EFFECTS[type]?.blend || DEFAULT_BLEND;

export const defaultParams = effect =>
  Object.fromEntries(
    effect.params.map(param => [param.key, Array.isArray(param.default) ? [...param.default] : param.default])
  );

export const HERO = {
  disco: ['shape', 'size', 'sparkle'],
  anaglyph: ['glasses', 'amount', 'depth'],
  dust: ['density', 'size', 'glow'],
  edgeglow: ['thickness', 'glow', 'threshold'],
  warpbloom: ['mode', 'strength', 'intensity'],
  rays: ['rays', 'length', 'intensity'],
  sketch: ['medium', 'shading', 'outline'],
  warhol: ['layout', 'colorway', 'tones'],
  woodblock: ['palette', 'simplify', 'lines'],
  chrome: ['environment', 'roughness', 'depth'],
  crystallize: ['size', 'facets', 'edges'],
  emboss: ['material', 'depth', 'light'],
  marble: ['swirl', 'veins', 'colors'],
  molten: ['alloy', 'heat', 'crust'],
  thinfilm: ['film', 'thickness', 'spread'],
  voxel: ['size', 'relief', 'shading'],
  forms: ['shape', 'size', 'palette'],
  truchet: ['size', 'pattern', 'width'],
  lattice: ['size', 'weave', 'bend'],
  lowpoly: ['size', 'detail', 'edges'],
  extrude: ['size', 'height', 'rotation'],
  neongrid: ['density', 'glow', 'threshold'],
  flowfield: ['density', 'length', 'curl'],
  schematic: ['density', 'style', 'background'],
  specimen: ['count', 'size', 'fill'],
  frosted: ['frost', 'texture', 'clear'],
  stained: ['size', 'lead', 'glow'],
  vitrine: ['size', 'facet', 'refraction'],
  shatter: ['size', 'displacement', 'pattern'],
  orb: ['size', 'refraction', 'dispersion'],
  pixelsort: ['low', 'length', 'angle'],
  forensics: ['palette', 'intensity', 'detail'],
  droste: ['scale', 'arms', 'zoom'],
  distort: ['strength', 'radius', 'speed'],
  ascii: ['size', 'coverage', 'glow'],
  halftone: ['size', 'angle', 'contrast'],
  dither: ['palette', 'pattern', 'pixel'],
  points: ['style', 'size', 'density'],
  pixel: ['size', 'shape', 'gap'],
  posterize: ['levels', 'outline', 'saturation'],
  ink: ['weight', 'shading', 'detail'],
  paint: ['radius', 'flow', 'canvas'],
  watercolor: ['radius', 'edges', 'granulation'],
  engrave: ['density', 'relief', 'style'],
  chalk: ['shading', 'sensitivity', 'board'],
  contour: ['levels', 'width', 'smoothing'],
  crt: ['curvature', 'scan', 'glow'],
  vhs: ['tape', 'bleed', 'noise'],
  chromatic: ['amount', 'mode'],
  glitch: ['amount', 'blocks', 'split'],
  jpeg: ['quality', 'size'],
  datamosh: ['intensity', 'size', 'drift'],
  echo: ['length', 'tint'],
  bars: ['count', 'intensity', 'speed'],
  smear: ['mode', 'position', 'variance'],
  bloom: ['intensity', 'threshold', 'radius'],
  halation: ['intensity', 'radius'],
  leak: ['intensity', 'position', 'spread'],
  sparkle: ['intensity', 'threshold', 'spacing'],
  lens: ['distortion', 'vignette', 'chroma'],
  blur: ['amount', 'mode'],
  bokeh: ['radius', 'gain', 'shape'],
  grain: ['amount', 'size'],
  film: ['dust', 'scratches', 'weave'],
  scratches: ['opacity', 'density'],
  paper: ['wrinkles', 'folds', 'grain'],
  letterbox: ['ratio', 'color'],
  adjust: ['exposure', 'contrast', 'saturation'],
  grade: ['split', 'curve', 'shadows', 'highlights'],
  gradient: ['palette', 'contrast'],
  hue: ['shift', 'cycle'],
  warp: ['strength', 'scale', 'speed'],
  ripple: ['amplitude', 'frequency'],
  water: ['refraction', 'size', 'highlights'],
  fluted: ['size', 'distortion', 'shape'],
  refract: ['spread', 'swirl'],
  kaleidoscope: ['segments', 'zoom', 'spin']
};

const SUPPORT = new Set([
  'adjust',
  'grade',
  'grain',
  'bloom',
  'halation',
  'lens',
  'letterbox',
  'scratches',
  'paper',
  'film',
  'hue',
  'chromatic'
]);

export const lookPrimary = look =>
  look.primary ??
  Math.max(
    0,
    look.layers.findIndex(item => !SUPPORT.has(item.type))
  );

export const heroControls = (look, layers) => {
  if (!look || !layers.length) return null;
  const index = lookPrimary(look);
  const layer = layers[index];
  const effect = layer && EFFECTS[layer.type];
  if (!effect || layer.type !== look.layers[index]?.type) return null;
  const keys = look.controls || HERO[layer.type] || effect.hero || effect.params.slice(0, 3).map(param => param.key);
  const params = keys
    .map(key => effect.params.find(param => param.key === key))
    .filter(param => param && (!param.when || param.when(layer.params)));
  return params.length ? { layer, effect, params } : null;
};
