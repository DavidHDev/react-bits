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
import { useColorMode } from '../../components/setup/color-mode';

import Topography from '../../content/Backgrounds/Topography/Topography';
import { topography } from '../../constants/code/Backgrounds/topographyCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/Topography';

const DEFAULT_PROPS = {
  preset: 'ridgeline',
  ...LOOK,
  opacity: 1,
  mouseInteraction: true,
  mouseRadius: 1,
  mouseStrength: 0.6,
  trail: 0.3,
  parallax: 0.5,
  intro: true,
  lightMode: false
};

const DIRECTION_OPTIONS = [
  { value: 'forward', label: 'Forward' },
  { value: 'backward', label: 'Backward' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const HOVER_OPTIONS = [
  { value: 'lift', label: 'Lift' },
  { value: 'trace', label: 'Trace' },
  { value: 'light', label: 'Light' }
];

const MARKER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'plus', label: 'Plus' },
  { value: 'dots', label: 'Dots' }
];

const CLICK_OPTIONS = [
  { value: 'pulse', label: 'Pulse' },
  { value: 'peak', label: 'Peak' },
  { value: 'none', label: 'None' }
];

const propData = [
  {
    name: 'color',
    type: 'string',
    default: "'#4f7cff'",
    description: 'Color of the contour lines. The brightest lines glow toward white.'
  },
  {
    name: 'lineCount',
    type: 'number',
    default: '22',
    description: 'How many contour lines stack up the tallest mountain.'
  },
  {
    name: 'lineWidth',
    type: 'number',
    default: '1.2',
    description: 'Width of the lines in px. Nearer lines draw a little thicker.'
  },
  {
    name: 'majorLines',
    type: 'boolean',
    default: 'true',
    description: 'Draws every fifth line bolder and brighter, like the index lines on a map.'
  },
  {
    name: 'elevation',
    type: 'number',
    default: '1',
    description: 'How tall the mountains rise. 0 lays the map flat.'
  },
  {
    name: 'foreground',
    type: 'number',
    default: '0.2',
    description:
      'How much height the land keeps as it reaches the camera. Low values settle it flat so the view stays clear.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size of the landforms. Larger values give broader mountains.'
  },
  {
    name: 'detail',
    type: 'number',
    default: '0.35',
    description: 'Fine wobble in the lines and small rings on the plains, from 0 to 1.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '32',
    description: 'Camera angle in degrees, from a low view across the land to 90 for straight down.'
  },
  { name: 'speed', type: 'number', default: '0.25', description: 'How fast the camera glides over the land.' },
  {
    name: 'direction',
    type: "'forward' | 'backward' | 'left' | 'right'",
    default: "'forward'",
    description: 'Which way the camera travels.'
  },
  {
    name: 'morph',
    type: 'number',
    default: '0.2',
    description: 'How quickly the landforms reshape over time. 0 keeps the terrain still.'
  },
  { name: 'glow', type: 'number', default: '0.6', description: 'Soft bloom around the lit lines.' },
  {
    name: 'depthOfField',
    type: 'number',
    default: '0.4',
    description: 'Softens lines away from the focus point, which follows the cursor.'
  },
  {
    name: 'fog',
    type: 'number',
    default: '0.35',
    description: 'How quickly the land fades into the distance. 1 leaves only the foreground.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness of the lines.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Overall opacity of the effect.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Lets the cursor light and shape the terrain, and tilts the camera toward it.'
  },
  {
    name: 'hoverEffect',
    type: "'lift' | 'trace' | 'light'",
    default: "'lift'",
    description: 'Lift raises the land under the cursor, trace lights the contour at its height, light only lights it.'
  },
  { name: 'mouseRadius', type: 'number', default: '1', description: 'Size of the area the cursor affects.' },
  {
    name: 'mouseStrength',
    type: 'number',
    default: '0.6',
    description: 'How high the land lifts and how brightly it lights.'
  },
  {
    name: 'trail',
    type: 'number',
    default: '0.3',
    description: 'How long the lifted land takes to settle back, from 0 to 1.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '0.5',
    description: 'How far the camera leans toward the cursor, from 0 to 1.'
  },
  {
    name: 'clickEffect',
    type: "'pulse' | 'peak' | 'none'",
    default: "'pulse'",
    description: 'Pulse sends a ring of light rolling out over the land, peak raises a new mountain.'
  },
  {
    name: 'markers',
    type: "'none' | 'plus' | 'dots'",
    default: "'none'",
    description:
      'Survey markers on a grid across the land. A few blink, and the ones near the cursor get a target frame.'
  },
  {
    name: 'glitch',
    type: 'number',
    default: '0',
    description: 'How often brief data glitches slice through the lines, from 0 to 1. Clicks set one off too.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The map fades in flat and rises into mountains on mount.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the lines as crisp ink for light backgrounds instead of glowing light.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const TopographyDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: colorMode === 'light', defaults: defaultProps }), preset: value });
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
            <Topography key={key} {...settings} />
            <BackgroundContent headline="Terrain that rises to meet your cursor." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="topography" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSelect
              title="Hover Effect"
              options={HOVER_OPTIONS}
              value={settings.hoverEffect}
              onChange={value => updateProp('hoverEffect', value)}
            />
            <PreviewSelect
              title="Click Effect"
              options={CLICK_OPTIONS}
              value={settings.clickEffect}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewSelect
              title="Markers"
              options={MARKER_OPTIONS}
              value={settings.markers}
              onChange={value => updateProp('markers', value)}
            />
            <PreviewSlider
              title="Lines"
              min={6}
              max={60}
              step={1}
              value={settings.lineCount}
              onChange={value => updateProp('lineCount', value)}
            />
            <PreviewSlider
              title="Line Width"
              min={0.5}
              max={3}
              step={0.1}
              value={settings.lineWidth}
              valueUnit="px"
              onChange={value => updateProp('lineWidth', value)}
            />
            <PreviewSlider
              title="Elevation"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.elevation}
              onChange={value => updateProp('elevation', value)}
            />
            <PreviewSlider
              title="Foreground"
              min={0}
              max={1}
              step={0.01}
              value={settings.foreground}
              onChange={value => updateProp('foreground', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.4}
              max={3}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Detail"
              min={0}
              max={1}
              step={0.01}
              value={settings.detail}
              onChange={value => updateProp('detail', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={15}
              max={90}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={1.5}
              step={0.01}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Morph"
              min={0}
              max={1}
              step={0.01}
              value={settings.morph}
              onChange={value => updateProp('morph', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Depth of Field"
              min={0}
              max={1}
              step={0.01}
              value={settings.depthOfField}
              onChange={value => updateProp('depthOfField', value)}
            />
            <PreviewSlider
              title="Fog"
              min={0}
              max={1}
              step={0.01}
              value={settings.fog}
              onChange={value => updateProp('fog', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Glitch"
              min={0}
              max={1}
              step={0.01}
              value={settings.glitch}
              onChange={value => updateProp('glitch', value)}
            />
            <PreviewSlider
              title="Mouse Radius"
              min={0.3}
              max={2.5}
              step={0.05}
              value={settings.mouseRadius}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseRadius', value)}
            />
            <PreviewSlider
              title="Mouse Strength"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.mouseStrength}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0}
              max={1}
              step={0.01}
              value={settings.trail}
              isDisabled={!settings.mouseInteraction || settings.hoverEffect !== 'lift'}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={1}
              step={0.01}
              value={settings.parallax}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('parallax', value)}
            />
            <PreviewSwitch
              title="Major Lines"
              isChecked={settings.majorLines}
              onChange={value => updateProp('majorLines', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={topography} componentName="Topography" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TopographyDemo;
