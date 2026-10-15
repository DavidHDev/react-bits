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

import GradientWaves from '../../content/Backgrounds/GradientWaves/GradientWaves';
import { gradientWaves } from '../../constants/code/Backgrounds/gradientWavesCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/GradientWaves';

const DEFAULT_PROPS = {
  preset: 'dusk',
  ...LOOK,
  quality: 'medium',
  intro: true,
  mouseInteraction: true,
  parallaxStrength: 0.5,
  mouseStrength: 0.6,
  swellOnClick: true,
  paused: false
};

const QUALITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const propData = [
  {
    name: 'horizonColor',
    type: 'string',
    default: "'#5227FF'",
    description: 'Haze the waves fade into toward the horizon, and the tint of their shadows.'
  },
  { name: 'waveColor', type: 'string', default: "'#FF9FFC'", description: 'Main color of the wave bodies.' },
  {
    name: 'crestColor',
    type: 'string',
    default: "'#FFFFFF'",
    description: 'Color of the crests and the light they catch.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Fills the canvas behind the waves. Transparent lets the page show through.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the waves as soft colored ink for light pages.'
  },
  { name: 'speed', type: 'number', default: '0.4', description: 'How fast the waves roll in.' },
  { name: 'amplitude', type: 'number', default: '2.5', description: 'Height of the waves.' },
  {
    name: 'waveScale',
    type: 'number',
    default: '0.6',
    description: 'How many waves fit in view. Higher is choppier.'
  },
  {
    name: 'waveRatio',
    type: 'number',
    default: '0.9',
    description: 'Balance between the long rolling waves and the shorter cross waves.'
  },
  { name: 'swell', type: 'number', default: '35', description: 'How much the long waves bend and meander.' },
  { name: 'turbulence', type: 'number', default: '20', description: 'How much the cross waves wander.' },
  {
    name: 'tilt',
    type: 'number',
    default: '64',
    description: 'Camera angle in degrees, from looking down to facing the horizon.'
  },
  { name: 'zoom', type: 'number', default: '1', description: 'Field of view. Higher zooms in.' },
  { name: 'height', type: 'number', default: '5.5', description: 'Water level. Higher brings the waves closer.' },
  { name: 'fogDepth', type: 'number', default: '15', description: 'How far you can see before the waves fade out.' },
  {
    name: 'relief',
    type: 'number',
    default: '1',
    description: 'Depth of the light and shadow on the waves. 0 gives flat gradient waves.'
  },
  {
    name: 'lightAngle',
    type: 'number',
    default: '120',
    description: 'Direction the light comes from, in degrees. 0 lights the waves from behind you, 180 from the horizon.'
  },
  { name: 'sheen', type: 'number', default: '0', description: 'Strength of a soft highlight on the crests.' },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  { name: 'grain', type: 'number', default: '0.2', description: 'Film grain on the waves, up to 0.5. 0 turns it off.' },
  {
    name: 'quality',
    type: "'low' | 'medium' | 'high'",
    default: "'medium'",
    description: 'Rendering precision. Lower is faster on weak devices.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Starts from calm water and lets the waves rise from the horizon toward you.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The light follows the cursor across the waves and the view turns gently toward it.'
  },
  {
    name: 'parallaxStrength',
    type: 'number',
    default: '0.5',
    description: 'How far the view turns toward the cursor.'
  },
  {
    name: 'mouseStrength',
    type: 'number',
    default: '0.6',
    description: 'How far the light turns to follow the cursor.'
  },
  {
    name: 'swellOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a swell rolling in from that point.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the waves.' },
  { name: 'dpr', type: 'number', default: '2', description: 'Maximum device pixel ratio of the canvas.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const GradientWavesDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: colorMode === 'light' }), preset: value });
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
            <GradientWaves key={key} {...settings} />
            <BackgroundContent pillText="New Background" headline="Soft rolling gradient waves fading into haze." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="gradient-waves" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Horizon Color"
              color={settings.horizonColor}
              onChange={value => updateProp('horizonColor', value)}
            />
            <PreviewColorPickerCustom
              title="Wave Color"
              color={settings.waveColor}
              onChange={value => updateProp('waveColor', value)}
            />
            <PreviewColorPickerCustom
              title="Crest Color"
              color={settings.crestColor}
              onChange={value => updateProp('crestColor', value)}
            />
            <PreviewSelect
              title="Quality"
              options={QUALITY_OPTIONS}
              value={settings.quality}
              onChange={value => updateProp('quality', value)}
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
              title="Amplitude"
              min={0}
              max={5}
              step={0.05}
              value={settings.amplitude}
              onChange={value => updateProp('amplitude', value)}
            />
            <PreviewSlider
              title="Wave Scale"
              min={0.3}
              max={2}
              step={0.01}
              value={settings.waveScale}
              onChange={value => updateProp('waveScale', value)}
            />
            <PreviewSlider
              title="Wave Ratio"
              min={0.3}
              max={2}
              step={0.01}
              value={settings.waveRatio}
              onChange={value => updateProp('waveRatio', value)}
            />
            <PreviewSlider
              title="Swell"
              min={0}
              max={40}
              step={0.5}
              value={settings.swell}
              onChange={value => updateProp('swell', value)}
            />
            <PreviewSlider
              title="Turbulence"
              min={0}
              max={40}
              step={0.5}
              value={settings.turbulence}
              onChange={value => updateProp('turbulence', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={30}
              max={80}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Zoom"
              min={0.6}
              max={1.6}
              step={0.01}
              value={settings.zoom}
              onChange={value => updateProp('zoom', value)}
            />
            <PreviewSlider
              title="Height"
              min={2}
              max={10}
              step={0.1}
              value={settings.height}
              onChange={value => updateProp('height', value)}
            />
            <PreviewSlider
              title="Fog Depth"
              min={5}
              max={40}
              step={0.5}
              value={settings.fogDepth}
              onChange={value => updateProp('fogDepth', value)}
            />
            <PreviewSlider
              title="Relief"
              min={0}
              max={1}
              step={0.01}
              value={settings.relief}
              onChange={value => updateProp('relief', value)}
            />
            <PreviewSlider
              title="Light Angle"
              min={-180}
              max={180}
              step={1}
              value={settings.lightAngle}
              valueUnit="°"
              onChange={value => updateProp('lightAngle', value)}
            />
            <PreviewSlider
              title="Sheen"
              min={0}
              max={1}
              step={0.01}
              value={settings.sheen}
              onChange={value => updateProp('sheen', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.4}
              max={1.6}
              step={0.01}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={1}
              step={0.01}
              value={settings.parallaxStrength}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('parallaxStrength', value)}
            />
            <PreviewSlider
              title="Light Follow"
              min={0}
              max={1}
              step={0.01}
              value={settings.mouseStrength}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch
              title="Cursor"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Swell on Click"
              isChecked={settings.swellOnClick}
              onChange={value => updateProp('swellOnClick', value)}
            />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
            <PreviewSwitch title="Pause" isChecked={settings.paused} onChange={value => updateProp('paused', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={gradientWaves} componentName="GradientWaves" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GradientWavesDemo;
