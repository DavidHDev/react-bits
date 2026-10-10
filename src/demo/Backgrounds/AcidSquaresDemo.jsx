import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import AcidSquares from '@/content/Backgrounds/AcidSquares/AcidSquares';
import { acidSquares } from '../../constants/code/Backgrounds/acidSquaresCode';

const ACID = {
  accentColor: '#c6ff3d',
  shape: 'square',
  pulse: 1,
  pulseSpeed: 0.45,
  pulseSpacing: 1,
  pulseWidth: 1,
  sparkle: 0.04,
  speed: 0.7,
  breathe: 1,
  zoom: 1.3,
  depth: 10,
  edges: 0.45,
  twist: 0,
  roll: 0,
  brightness: 1
};

const DEFAULT_PROPS = {
  preset: 'acid',
  color: '#120f17',
  ...ACID,
  mouseInteraction: true,
  mouseStrength: 1,
  mouseRadius: 0.35,
  detail: 'medium',
  grain: 0.03,
  fade: 0,
  opacity: 1,
  lightMode: false
};

const PRESETS = {
  acid: ACID,
  cobalt: { ...ACID, accentColor: '#3d7bff' },
  mono: { ...ACID, accentColor: '#ffffff', sparkle: 0 },
  ember: { ...ACID, accentColor: '#ff7a2f', pulseSpacing: 1.4, pulseWidth: 1.6 },
  glass: { ...ACID, accentColor: '#7ff3ff', edges: 0.1, pulse: 0.8, sparkle: 0.06 },
  vortex: { ...ACID, shape: 'round', twist: 0.06, roll: 0.12, depth: 12, pulseSpeed: 0.6 }
};

const LIGHT_ACCENTS = {
  acid: '#8fd61f',
  cobalt: '#2f6bff',
  mono: '#3f3f46',
  ember: '#f26a1b',
  glass: '#1fb6d4',
  vortex: '#8fd61f'
};

const PRESET_OPTIONS = [
  { value: 'acid', label: 'Acid' },
  { value: 'cobalt', label: 'Cobalt' },
  { value: 'mono', label: 'Mono' },
  { value: 'ember', label: 'Ember' },
  { value: 'glass', label: 'Glass' },
  { value: 'vortex', label: 'Vortex' }
];

const SHAPE_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'round', label: 'Round' }
];

const DETAIL_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const propData = [
  {
    name: 'color',
    type: 'string',
    default: "'#120f17'",
    description: 'Color of the squares. Set it to your page background, every shade is derived from it.'
  },
  {
    name: 'accentColor',
    type: 'string',
    default: "'#c6ff3d'",
    description: 'Color of the light rings, the twinkling squares and the cursor light.'
  },
  { name: 'shape', type: "'square' | 'round'", default: "'square'", description: 'Shape of the corridor.' },
  {
    name: 'pulse',
    type: 'number',
    default: '1',
    description: 'Brightness of the rings of light that travel toward you. 0 turns them off.'
  },
  { name: 'pulseSpeed', type: 'number', default: '0.45', description: 'How fast the rings travel.' },
  { name: 'pulseSpacing', type: 'number', default: '1', description: 'Distance between the rings.' },
  { name: 'pulseWidth', type: 'number', default: '1', description: 'Thickness of each ring and its trail.' },
  {
    name: 'sparkle',
    type: 'number',
    default: '0.04',
    description: 'Share of squares that twinkle with light, from 0 to 1.'
  },
  { name: 'speed', type: 'number', default: '0.7', description: 'Speed of the slow drift in and out of the corridor.' },
  {
    name: 'breathe',
    type: 'number',
    default: '1',
    description: 'How far the view drifts in and out. 0 holds it still.'
  },
  { name: 'zoom', type: 'number', default: '1.3', description: 'Field of view into the corridor. Higher zooms in.' },
  {
    name: 'depth',
    type: 'number',
    default: '10',
    description: 'How deep the corridor reaches. Higher shows more rings of smaller squares.'
  },
  {
    name: 'edges',
    type: 'number',
    default: '0.45',
    description: 'Look of the squares, from 0 for solid glass blocks to 1 for thin wireframe edges.'
  },
  { name: 'twist', type: 'number', default: '0', description: 'How much the corridor spirals as it recedes.' },
  { name: 'roll', type: 'number', default: '0', description: 'Speed at which the corridor slowly rotates.' },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Lights up the squares around the cursor and lets the view follow it slightly.'
  },
  { name: 'mouseStrength', type: 'number', default: '1', description: 'Brightness of the cursor light.' },
  {
    name: 'mouseRadius',
    type: 'number',
    default: '0.35',
    description: 'Size of the cursor light, as a fraction of the view height.'
  },
  {
    name: 'detail',
    type: "'low' | 'medium' | 'high'",
    default: "'medium'",
    description: 'Rendering detail. Lower it for weaker devices.'
  },
  { name: 'grain', type: 'number', default: '0.03', description: 'Strength of the film grain.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the corridor as ink for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const AcidSquaresDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const light = useColorModeValue(true, false);

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaultProps[key]]));
    const tone = light ? { accentColor: LIGHT_ACCENTS[value] } : {};
    updateProps({ ...base, ...PRESETS[value], ...tone, preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <AcidSquares {...settings} />
            <BackgroundContent headline="A luminous crystal corridor of stacked squares." />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="acid-squares" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={props.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Accent"
              color={props.accentColor}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={props.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSlider
              title="Pulse"
              min={0}
              max={2}
              step={0.05}
              value={props.pulse}
              onChange={value => updateProp('pulse', value)}
            />
            <PreviewSlider
              title="Pulse Speed"
              min={0}
              max={2}
              step={0.05}
              value={props.pulseSpeed}
              onChange={value => updateProp('pulseSpeed', value)}
            />
            <PreviewSlider
              title="Pulse Spacing"
              min={0.4}
              max={3}
              step={0.05}
              value={props.pulseSpacing}
              onChange={value => updateProp('pulseSpacing', value)}
            />
            <PreviewSlider
              title="Pulse Width"
              min={0.3}
              max={3}
              step={0.05}
              value={props.pulseWidth}
              onChange={value => updateProp('pulseWidth', value)}
            />
            <PreviewSlider
              title="Sparkle"
              min={0}
              max={0.3}
              step={0.01}
              value={props.sparkle}
              onChange={value => updateProp('sparkle', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Breathe"
              min={0}
              max={3}
              step={0.05}
              value={props.breathe}
              onChange={value => updateProp('breathe', value)}
            />
            <PreviewSlider
              title="Zoom"
              min={0.9}
              max={2.5}
              step={0.05}
              value={props.zoom}
              onChange={value => updateProp('zoom', value)}
            />
            <PreviewSlider
              title="Depth"
              min={5}
              max={16}
              step={0.5}
              value={props.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Edges"
              min={0}
              max={1}
              step={0.05}
              value={props.edges}
              onChange={value => updateProp('edges', value)}
            />
            <PreviewSlider
              title="Twist"
              min={0}
              max={0.3}
              step={0.01}
              value={props.twist}
              onChange={value => updateProp('twist', value)}
            />
            <PreviewSlider
              title="Roll"
              min={-0.5}
              max={0.5}
              step={0.01}
              value={props.roll}
              onChange={value => updateProp('roll', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.3}
              max={2}
              step={0.05}
              value={props.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Cursor Light"
              min={0}
              max={2}
              step={0.05}
              value={props.mouseStrength}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={0.1}
              max={1}
              step={0.01}
              value={props.mouseRadius}
              onChange={value => updateProp('mouseRadius', value)}
            />
            <PreviewSelect
              title="Detail"
              options={DETAIL_OPTIONS}
              value={props.detail}
              onChange={value => updateProp('detail', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.15}
              step={0.005}
              value={props.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={props.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={props.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={props.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Light Mode"
              isChecked={props.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={acidSquares} componentName="AcidSquares" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default AcidSquaresDemo;
