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

import Waves from '../../content/Backgrounds/Waves/Waves';
import { waves } from '../../constants/code/Backgrounds/wavesCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Waves';

const STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' }
];

const propData = [
  { name: 'lineColor', type: 'string', default: "'#ffffff'", description: 'Color of the lines.' },
  {
    name: 'accentColor',
    type: 'string',
    default: 'lineColor',
    description: 'Color the lines take on where the cursor or a click pushes them.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Background behind the lines.'
  },
  {
    name: 'lineStyle',
    type: "'solid' | 'dashed'",
    default: "'solid'",
    description: 'Draws solid lines, or dashes that stream along them.'
  },
  { name: 'spacing', type: 'number', default: '10', description: 'Space between the lines, in px.' },
  { name: 'lineWidth', type: 'number', default: '1', description: 'Width of the lines, in px.' },
  { name: 'rotation', type: 'number', default: '0', description: 'Turns the lines, in degrees. 90 lays them flat.' },
  { name: 'amplitude', type: 'number', default: '32', description: 'How far the lines sway, in px.' },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size of the wave pattern. Higher values make broader, calmer waves.'
  },
  {
    name: 'twist',
    type: 'number',
    default: '1',
    description: 'How much the waves twist the lines, gathering them into bright folds.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'How fast the waves flow. 0 holds them still.' },
  { name: 'variation', type: 'number', default: '0', description: 'Picks a different wave pattern.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Moving the cursor drags the lines along with it.'
  },
  {
    name: 'mouseRadius',
    type: 'number',
    default: '175',
    description: 'Radius around the cursor that drags the lines, in px.'
  },
  { name: 'mouseStrength', type: 'number', default: '1', description: 'How hard a moving cursor drags the lines.' },
  {
    name: 'bounce',
    type: 'number',
    default: '0.5',
    description: 'How much the lines overshoot and wobble as they settle, from 0 to 1.'
  },
  {
    name: 'returnDuration',
    type: 'number',
    default: '1.4',
    description: 'Roughly how long the lines take to settle back, in seconds.'
  },
  { name: 'clickRipple', type: 'boolean', default: 'true', description: 'Clicking parts the lines in a soft ripple.' },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Opens the lines from the center and swells the waves in on mount.'
  },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the lines as ink for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the waves.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const WavesDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps, props: settings }), preset: value });
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
            <Waves key={key} {...settings} />
            <BackgroundContent headline="Make waves with every move." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="waves" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Line Color"
              color={settings.lineColor}
              onChange={value => updateProp('lineColor', value)}
            />
            <PreviewColorPickerCustom
              title="Accent Color"
              color={settings.accentColor}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSelect
              title="Line Style"
              options={STYLE_OPTIONS}
              value={settings.lineStyle}
              onChange={value => updateProp('lineStyle', value)}
            />
            <PreviewSlider
              title="Spacing"
              min={4}
              max={28}
              step={1}
              value={settings.spacing}
              valueUnit="px"
              onChange={value => updateProp('spacing', value)}
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
              title="Rotation"
              min={0}
              max={180}
              step={1}
              value={settings.rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Amplitude"
              min={0}
              max={80}
              step={1}
              value={settings.amplitude}
              valueUnit="px"
              onChange={value => updateProp('amplitude', value)}
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
              title="Twist"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.twist}
              onChange={value => updateProp('twist', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={4}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Variation"
              min={0}
              max={20}
              step={1}
              value={settings.variation}
              onChange={value => updateProp('variation', value)}
            />
            <PreviewSlider
              title="Mouse Radius"
              min={60}
              max={400}
              step={5}
              value={settings.mouseRadius}
              valueUnit="px"
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseRadius', value)}
            />
            <PreviewSlider
              title="Mouse Strength"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.mouseStrength}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.05}
              value={settings.bounce}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSlider
              title="Return Duration"
              min={0.3}
              max={4}
              step={0.1}
              value={settings.returnDuration}
              valueUnit="s"
              onChange={value => updateProp('returnDuration', value)}
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
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Ripple"
              isChecked={settings.clickRipple}
              onChange={value => updateProp('clickRipple', value)}
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
          <CodeExample codeObject={waves} componentName="Waves" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default WavesDemo;
