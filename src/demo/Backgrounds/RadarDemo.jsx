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

import Radar from '../../content/Backgrounds/Radar/Radar';
import { radar } from '../../constants/code/Backgrounds/radarCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Radar';

const MODE_OPTIONS = [
  { value: 'sweep', label: 'Sweep' },
  { value: 'pulse', label: 'Pulse' }
];

const propData = [
  { name: 'color', type: 'string', default: "'#3ef09a'", description: 'Color of the sweep and the contacts.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Fills the canvas behind the radar. Leave it transparent to let the page show through.'
  },
  {
    name: 'mode',
    type: "'sweep' | 'pulse'",
    default: "'sweep'",
    description: 'A rotating beam, or sonar rings that expand from the center.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'Speed of the sweep. Negative values sweep counterclockwise.'
  },
  {
    name: 'trail',
    type: 'number',
    default: '0.35',
    description: 'How long the afterglow lingers behind the sweep, from 0 to 1.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '0.9',
    description: 'Size of the radar, relative to the shorter side of the view.'
  },
  { name: 'ringCount', type: 'number', default: '6', description: 'Number of range rings.' },
  { name: 'spokeCount', type: 'number', default: '12', description: 'Number of faint bearing lines. 0 hides them.' },
  { name: 'ticks', type: 'boolean', default: 'true', description: 'Shows the bearing scale around the edge.' },
  {
    name: 'targets',
    type: 'number',
    default: '6',
    description: 'Number of moving contacts the sweep picks up, up to 16.'
  },
  {
    name: 'clutter',
    type: 'number',
    default: '0.35',
    description: 'Amount of speckled returns the sweep lights up, from 0 to 1.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '1',
    description: 'Strength of the soft light around the beam and contacts.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness.' },
  {
    name: 'gridOpacity',
    type: 'number',
    default: '1',
    description: 'Opacity of the rings, ticks and lines, from 0 to 2.'
  },
  { name: 'lineWidth', type: 'number', default: '1', description: 'Width of the grid lines in px.' },
  {
    name: 'tilt',
    type: 'number',
    default: '0',
    description: 'Tilts the radar back in perspective like a floor, in degrees.'
  },
  {
    name: 'centerX',
    type: 'number',
    default: '0.5',
    description: 'Horizontal position of the radar center, from 0 to 1.'
  },
  {
    name: 'centerY',
    type: 'number',
    default: '0.5',
    description: 'Vertical position of the radar center, from 0 at the top to 1 at the bottom.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Lights up the grid near the cursor, and the sweep picks the cursor up as a contact.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Draws the rings in and starts the sweep on mount.' },
  { name: 'grain', type: 'number', default: '0.03', description: 'Strength of the film grain.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the radar as ink for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const RadarDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: theme === 'light', defaults: defaultProps }), preset: value });
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
            <Radar key={key} {...settings} />
            <BackgroundContent headline="Catch every signal on the first sweep." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="radar" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings.mode}
              onChange={value => updateProp('mode', value)}
            />
            <PreviewSlider
              title="Speed"
              min={-2}
              max={3}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0.05}
              max={1}
              step={0.01}
              value={settings.trail}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.3}
              max={2.5}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Ring Count"
              min={1}
              max={16}
              step={1}
              value={settings.ringCount}
              onChange={value => updateProp('ringCount', value)}
            />
            <PreviewSlider
              title="Spoke Count"
              min={0}
              max={36}
              step={1}
              value={settings.spokeCount}
              onChange={value => updateProp('spokeCount', value)}
            />
            <PreviewSlider
              title="Targets"
              min={0}
              max={16}
              step={1}
              value={settings.targets}
              onChange={value => updateProp('targets', value)}
            />
            <PreviewSlider
              title="Clutter"
              min={0}
              max={1}
              step={0.05}
              value={settings.clutter}
              onChange={value => updateProp('clutter', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
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
              title="Grid Opacity"
              min={0}
              max={2}
              step={0.05}
              value={settings.gridOpacity}
              onChange={value => updateProp('gridOpacity', value)}
            />
            <PreviewSlider
              title="Line Width"
              min={0.5}
              max={3}
              step={0.25}
              value={settings.lineWidth}
              valueUnit="px"
              onChange={value => updateProp('lineWidth', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={75}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Center X"
              min={0}
              max={1}
              step={0.01}
              value={settings.centerX}
              onChange={value => updateProp('centerX', value)}
            />
            <PreviewSlider
              title="Center Y"
              min={0}
              max={1}
              step={0.01}
              value={settings.centerY}
              onChange={value => updateProp('centerY', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.15}
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
            <PreviewSwitch title="Ticks" isChecked={settings.ticks} onChange={value => updateProp('ticks', value)} />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={radar} componentName="Radar" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default RadarDemo;
