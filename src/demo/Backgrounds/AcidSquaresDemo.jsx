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
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import AcidSquares from '@/content/Backgrounds/AcidSquares/AcidSquares';
import { acidSquares } from '../../constants/code/Backgrounds/acidSquaresCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/AcidSquares';

const SHAPE_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'round', label: 'Round' }
];

const ORIGIN_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'random', label: 'Random' }
];

const LIGHTING_OPTIONS = [
  { value: 'split', label: 'Split' },
  { value: 'backlit', label: 'Backlit' },
  { value: 'overhead', label: 'Overhead' }
];

const HOVER_OPTIONS = [
  { value: 'press', label: 'Press' },
  { value: 'lift', label: 'Lift' },
  { value: 'none', label: 'None' }
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
    description: 'Base color of the squares. Set it to your page background, the gaps show the page through.'
  },
  {
    name: 'accentColor',
    type: 'string',
    default: "'#ff4fb8'",
    description: 'Color of the first light that drifts across the squares.'
  },
  {
    name: 'secondaryColor',
    type: 'string',
    default: "'#3b6bff'",
    description: 'Color of the second light.'
  },
  { name: 'tileSize', type: 'number', default: '1', description: 'Size of the squares.' },
  { name: 'gap', type: 'number', default: '0.12', description: 'Width of the gaps between the squares.' },
  {
    name: 'roundness',
    type: 'number',
    default: '0.25',
    description: 'Corner radius, from sharp squares at 0 to circles at 1.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '0.5',
    description: 'How softly the edges of each square round off into the gaps.'
  },
  {
    name: 'bulge',
    type: 'number',
    default: '0.3',
    description: 'How much each square domes up like a cushion. 0 keeps the tops flat.'
  },
  { name: 'rotation', type: 'number', default: '35', description: 'Rotation of the grid, in degrees.' },
  {
    name: 'gloss',
    type: 'number',
    default: '0.6',
    description: 'From soft satin at 0 to glossy at 1, with tighter highlights along the edges.'
  },
  { name: 'waves', type: 'number', default: '1', description: 'Height of the slow swells. 0 lays the surface flat.' },
  { name: 'waveScale', type: 'number', default: '1', description: 'Size of the swells. Higher makes them broader.' },
  { name: 'speed', type: 'number', default: '0.6', description: 'Speed of the swells and the drifting lights.' },
  {
    name: 'shape',
    type: "'square' | 'round'",
    default: "'square'",
    description: 'Shape of the ripples that travel across the surface.'
  },
  { name: 'pulse', type: 'number', default: '1', description: 'Height of the ripples. 0 turns them off.' },
  { name: 'pulseSpeed', type: 'number', default: '0.45', description: 'How fast the ripples travel.' },
  { name: 'pulseSpacing', type: 'number', default: '1', description: 'Time between ripples.' },
  { name: 'pulseWidth', type: 'number', default: '1', description: 'Width of each ripple.' },
  {
    name: 'pulseOrigin',
    type: "'center' | 'random'",
    default: "'center'",
    description: 'Start every ripple from the center, or from random spots on the surface.'
  },
  {
    name: 'lighting',
    type: "'split' | 'backlit' | 'overhead'",
    default: "'split'",
    description: 'Placement of the two lights: from either side, low behind the surface, or from above.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness.' },
  {
    name: 'tilt',
    type: 'number',
    default: '0.7',
    description: 'View angle, from straight down at 0 to low across the surface at 1.'
  },
  { name: 'zoom', type: 'number', default: '1', description: 'Zoom. Higher brings the squares closer.' },
  {
    name: 'depth',
    type: 'number',
    default: '10',
    description: 'How far the surface reaches before it fades into the page.'
  },
  { name: 'grain', type: 'number', default: '0.12', description: 'Strength of the film grain.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Switches the squares on from the center outward when the effect first appears.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Lets the cursor shape the surface and the view follow it slightly.'
  },
  {
    name: 'hoverEffect',
    type: "'press' | 'lift' | 'none'",
    default: "'press'",
    description: 'Whether the cursor presses the surface down or lifts it up.'
  },
  { name: 'mouseStrength', type: 'number', default: '1', description: 'Depth of the cursor press or lift.' },
  {
    name: 'mouseRadius',
    type: 'number',
    default: '0.35',
    description: 'Size of the area the cursor shapes.'
  },
  {
    name: 'pulseOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Sends a ripple out from wherever you click.'
  },
  {
    name: 'detail',
    type: "'low' | 'medium' | 'high'",
    default: "'medium'",
    description: 'Smoothness of the surface. Lower it for weaker devices.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws pale squares with soft tints for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const AcidSquaresDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const light = useColorModeValue(true, false);

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light, defaults: defaultProps }), preset: value });
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
            <AcidSquares key={key} {...settings} />
            <BackgroundContent headline="Glossy squares that ripple under colored light." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="acid-squares" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Accent"
              color={settings.accentColor}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewColorPickerCustom
              title="Secondary"
              color={settings.secondaryColor}
              onChange={value => updateProp('secondaryColor', value)}
            />
            <PreviewSlider
              title="Tile Size"
              min={0.3}
              max={2.5}
              step={0.05}
              value={settings.tileSize}
              onChange={value => updateProp('tileSize', value)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={0.4}
              step={0.01}
              value={settings.gap}
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Roundness"
              min={0}
              max={1}
              step={0.01}
              value={settings.roundness}
              onChange={value => updateProp('roundness', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.01}
              value={settings.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Bulge"
              min={0}
              max={1.5}
              step={0.01}
              value={settings.bulge}
              onChange={value => updateProp('bulge', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-90}
              max={90}
              step={1}
              value={settings.rotation}
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Gloss"
              min={0}
              max={1}
              step={0.01}
              value={settings.gloss}
              onChange={value => updateProp('gloss', value)}
            />
            <PreviewSlider
              title="Waves"
              min={0}
              max={2}
              step={0.05}
              value={settings.waves}
              onChange={value => updateProp('waves', value)}
            />
            <PreviewSlider
              title="Wave Scale"
              min={0.4}
              max={2.5}
              step={0.05}
              value={settings.waveScale}
              onChange={value => updateProp('waveScale', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSelect
              title="Ripple Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSlider
              title="Pulse"
              min={0}
              max={2}
              step={0.05}
              value={settings.pulse}
              onChange={value => updateProp('pulse', value)}
            />
            <PreviewSlider
              title="Pulse Speed"
              min={0}
              max={2}
              step={0.05}
              value={settings.pulseSpeed}
              onChange={value => updateProp('pulseSpeed', value)}
            />
            <PreviewSlider
              title="Pulse Spacing"
              min={0.4}
              max={3}
              step={0.05}
              value={settings.pulseSpacing}
              onChange={value => updateProp('pulseSpacing', value)}
            />
            <PreviewSlider
              title="Pulse Width"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.pulseWidth}
              onChange={value => updateProp('pulseWidth', value)}
            />
            <PreviewSelect
              title="Pulse Origin"
              options={ORIGIN_OPTIONS}
              value={settings.pulseOrigin}
              onChange={value => updateProp('pulseOrigin', value)}
            />
            <PreviewSelect
              title="Lighting"
              options={LIGHTING_OPTIONS}
              value={settings.lighting}
              onChange={value => updateProp('lighting', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.3}
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={1}
              step={0.01}
              value={settings.tilt}
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Zoom"
              min={0.5}
              max={2.5}
              step={0.05}
              value={settings.zoom}
              onChange={value => updateProp('zoom', value)}
            />
            <PreviewSlider
              title="Depth"
              min={3}
              max={20}
              step={0.5}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.4}
              step={0.01}
              value={settings.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSelect
              title="Hover Effect"
              options={HOVER_OPTIONS}
              value={settings.hoverEffect}
              onChange={value => updateProp('hoverEffect', value)}
            />
            <PreviewSlider
              title="Hover Strength"
              min={0}
              max={2}
              step={0.05}
              value={settings.mouseStrength}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSlider
              title="Hover Radius"
              min={0.1}
              max={1}
              step={0.01}
              value={settings.mouseRadius}
              onChange={value => updateProp('mouseRadius', value)}
            />
            <PreviewSelect
              title="Detail"
              options={DETAIL_OPTIONS}
              value={settings.detail}
              onChange={value => updateProp('detail', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Pulse On Click"
              isChecked={settings.pulseOnClick}
              onChange={value => updateProp('pulseOnClick', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings.lightMode}
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
