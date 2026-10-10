import { Box, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import PixelTrail from '../../content/Animations/PixelTrail/PixelTrail';
import { pixelTrail } from '../../constants/code/Animations/pixelTrailCode';

const WHITE = '#ffffff';
const INK = '#1b1a21';
const DAY_SKY = '/assets/demo/day-sky.webp';
const NIGHT_SKY = '/assets/demo/night-sky.webp';

const LOOK = {
  gridSize: 50,
  trailSize: 0.1,
  maxAge: 500,
  interpolate: 5,
  color: '#A855F7',
  colorShift: true,
  shiftColor: '#A855F7',
  gooeyEnabled: true,
  gooStrength: 2,
  shape: 'square',
  gap: 0.08,
  decay: 'fade',
  flow: 0,
  gravity: 0,
  sparkle: 0,
  shine: 0.6,
  glow: 0.4,
  clickBurst: false,
  reveal: false
};

const DEFAULT_PROPS = { preset: 'classic', ...LOOK };

const PRESETS = {
  classic: LOOK,
  comet: {
    ...LOOK,
    color: WHITE,
    colorShift: true,
    trailSize: 0.12,
    maxAge: 700,
    flow: 0.4,
    clickBurst: true
  },
  gel: { ...LOOK, gap: 0, maxAge: 600, trailSize: 0.12, gooStrength: 5, shine: 1, glow: 0.5 },
  drip: { ...LOOK, maxAge: 1100, gooStrength: 3, gravity: 0.6, clickBurst: true },
  led: {
    ...LOOK,
    color: WHITE,
    colorShift: true,
    gridSize: 60,
    maxAge: 700,
    gooeyEnabled: false,
    shape: 'circle',
    gap: 0.25
  },
  halftone: { ...LOOK, gridSize: 70, maxAge: 800, gooeyEnabled: false, shape: 'circle', decay: 'shrink' },
  dither: { ...LOOK, gridSize: 100, trailSize: 0.14, maxAge: 700, gooeyEnabled: false, decay: 'dither' },
  sparkle: {
    ...LOOK,
    color: WHITE,
    colorShift: true,
    maxAge: 900,
    gooeyEnabled: false,
    sparkle: 0.8,
    clickBurst: true
  },
  reveal: { ...LOOK, gridSize: 60, trailSize: 0.15, maxAge: 1600, gooStrength: 3, reveal: true, clickBurst: true }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'comet', label: 'Comet' },
  { value: 'gel', label: 'Gel' },
  { value: 'drip', label: 'Drip' },
  { value: 'led', label: 'LED' },
  { value: 'halftone', label: 'Halftone' },
  { value: 'dither', label: 'Dither' },
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'reveal', label: 'Reveal' }
];

const SHAPE_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' }
];

const DECAY_OPTIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'shrink', label: 'Shrink' },
  { value: 'dither', label: 'Dither' }
];

const propData = [
  { name: 'gridSize', type: 'number', default: '40', description: 'Number of pixels across the longer side.' },
  {
    name: 'trailSize',
    type: 'number',
    default: '0.1',
    description: 'Radius of the trail brush, as a fraction of the longer side.'
  },
  { name: 'maxAge', type: 'number', default: '250', description: 'How long each part of the trail lasts, in ms.' },
  {
    name: 'interpolate',
    type: 'number',
    default: '5',
    description: 'How many in-between points fill gaps on fast moves. Higher is smoother.'
  },
  {
    name: 'easingFunction',
    type: '(x: number) => number',
    default: 'x => x',
    description: 'Easing curve for how the trail swells in and fades out.'
  },
  { name: 'color', type: 'string', default: "'#ffffff'", description: 'Pixel color.' },
  {
    name: 'trailColor',
    type: 'string',
    default: 'undefined',
    description: 'A second color the trail shifts to as it ages. Leave it out for a single color.'
  },
  {
    name: 'gooeyFilter',
    type: '{ strength: number } | false',
    default: '{ strength: 2 }',
    description:
      'Melts neighbouring pixels into liquid blobs. Higher strength rounds them more. Pass false for separate pixels.'
  },
  {
    name: 'shape',
    type: "'square' | 'circle' | 'diamond'",
    default: "'square'",
    description: 'Shape of each pixel when goo is off.'
  },
  {
    name: 'gap',
    type: 'number',
    default: '0.08',
    description: 'Space between pixels, as a fraction of a pixel. With goo on it draws fine seams between them.'
  },
  {
    name: 'decay',
    type: "'fade' | 'shrink' | 'dither'",
    default: "'fade'",
    description: 'How pixels disappear: fading out, shrinking away or dropping out in a dither pattern.'
  },
  {
    name: 'flow',
    type: 'number',
    default: '0',
    description: 'How much the trail keeps drifting in the direction the cursor moved, from 0 to 1.'
  },
  {
    name: 'gravity',
    type: 'number',
    default: '0',
    description: 'Makes the trail sag down as it fades. Negative values make it rise, from -1 to 1.'
  },
  { name: 'sparkle', type: 'number', default: '0', description: 'Makes fading pixels flicker, from 0 to 1.' },
  {
    name: 'shine',
    type: 'number',
    default: '0.6',
    description: 'Glossy light on the pixels: bevels on every step, a brighter core and highlights, from 0 to 1.'
  },
  { name: 'glow', type: 'number', default: '0.4', description: 'A soft glow around the trail, from 0 to 1.' },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'false',
    description: 'Clicking splashes a ring of trail out from the cursor.'
  },
  {
    name: 'imageSrc',
    type: 'string',
    default: 'undefined',
    description: 'An image the trail reveals. Each pixel takes the color of the image beneath it.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const PixelTrailDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, colorShift, shiftColor, gooeyEnabled, gooStrength, reveal, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');

  const color = theme === 'light' && settings.color.toLowerCase() === WHITE ? INK : settings.color;
  const gooeyFilter = gooeyEnabled ? { strength: gooStrength } : false;
  const trailColor = colorShift ? shiftColor : undefined;
  const imageSrc = reveal ? (theme === 'light' ? NIGHT_SKY : DAY_SKY) : undefined;

  const computedProps = {
    color,
    ...(trailColor ? { trailColor } : {}),
    gooeyFilter,
    ...(imageSrc ? { imageSrc } : {})
  };

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'colorShift', 'shiftColor', 'gooeyEnabled', 'gooStrength', 'reveal']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} p={0} overflow="hidden">
            <RefreshButton onClick={forceRerender} />
            <PixelTrail
              key={key}
              {...settings}
              color={color}
              trailColor={trailColor}
              gooeyFilter={gooeyFilter}
              imageSrc={imageSrc}
            />
            <Text
              position="absolute"
              bottom={5}
              left="50%"
              transform="translateX(-50%)"
              zIndex={0}
              fontSize="sm"
              color="var(--text-dimmed)"
              userSelect="none"
              pointerEvents="none"
            >
              {settings.clickBurst ? 'Move and click' : 'Move around'}
            </Text>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom title="Color" color={color} onChange={value => updateProp('color', value)} />
            <PreviewColorPickerCustom
              title="Trail Color"
              color={shiftColor}
              onChange={value => {
                updateProps({ shiftColor: value, colorShift: true });
              }}
            />
            <PreviewSwitch
              title="Color Shift"
              isChecked={colorShift}
              onChange={value => updateProp('colorShift', value)}
            />
            <PreviewSlider
              title="Grid Size"
              min={10}
              max={120}
              step={1}
              value={settings.gridSize}
              onChange={value => updateProp('gridSize', value)}
            />
            <PreviewSlider
              title="Trail Size"
              min={0.05}
              max={0.5}
              step={0.01}
              value={settings.trailSize}
              onChange={value => updateProp('trailSize', value)}
            />
            <PreviewSlider
              title="Max Age"
              min={100}
              max={3000}
              step={50}
              value={settings.maxAge}
              valueUnit="ms"
              onChange={value => updateProp('maxAge', value)}
            />
            <PreviewSlider
              title="Interpolate"
              min={0}
              max={10}
              step={0.1}
              value={settings.interpolate}
              onChange={value => updateProp('interpolate', value)}
            />
            <PreviewSwitch
              title="Gooey Filter"
              isChecked={gooeyEnabled}
              onChange={value => updateProp('gooeyEnabled', value)}
            />
            <PreviewSlider
              title="Gooey Strength"
              min={1}
              max={20}
              step={1}
              value={gooStrength}
              isDisabled={!gooeyEnabled}
              onChange={value => updateProp('gooStrength', value)}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              isDisabled={gooeyEnabled}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={0.6}
              step={0.01}
              value={settings.gap}
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSelect
              title="Decay"
              options={DECAY_OPTIONS}
              value={settings.decay}
              onChange={value => updateProp('decay', value)}
            />
            <PreviewSlider
              title="Flow"
              min={0}
              max={1}
              step={0.05}
              value={settings.flow}
              onChange={value => updateProp('flow', value)}
            />
            <PreviewSlider
              title="Gravity"
              min={-1}
              max={1}
              step={0.05}
              value={settings.gravity}
              onChange={value => updateProp('gravity', value)}
            />
            <PreviewSlider
              title="Sparkle"
              min={0}
              max={1}
              step={0.05}
              value={settings.sparkle}
              onChange={value => updateProp('sparkle', value)}
            />
            <PreviewSlider
              title="Shine"
              min={0}
              max={1}
              step={0.05}
              value={settings.shine}
              onChange={value => updateProp('shine', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSwitch
              title="Click Burst"
              isChecked={settings.clickBurst}
              onChange={value => updateProp('clickBurst', value)}
            />
            <PreviewSwitch title="Reveal Image" isChecked={reveal} onChange={value => updateProp('reveal', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={pixelTrail} componentName="PixelTrail" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PixelTrailDemo;
