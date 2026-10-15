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

import Ferrofluid from '../../content/Backgrounds/Ferrofluid/Ferrofluid';
import { ferrofluid } from '../../constants/code/Backgrounds/ferrofluidCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Ferrofluid';

const FLOW_OPTIONS = [
  { value: 'down', label: 'Down' },
  { value: 'up', label: 'Up' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'none', label: 'None' }
];

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#ffffff', '#ffffff', '#ffffff']",
    description: 'Colors of the studio lights reflected in the fluid: key light, side lights and fill light.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Strength of the reflections.' },
  {
    name: 'scale',
    type: 'number',
    default: '1.6',
    description: 'Zoom of the fluid. Higher values show bigger, fewer spikes.'
  },
  { name: 'spikeHeight', type: 'number', default: '1', description: 'How tall the spikes grow in a strong field.' },
  {
    name: 'sharpness',
    type: 'number',
    default: '2.5',
    description:
      'How peaked the spikes are. Low values give soft mounds, high values taller cones. Tips always stay rounded.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '48',
    description: 'Viewing angle in degrees. Low values look down from above, high values look across the fluid.'
  },
  {
    name: 'turbulence',
    type: 'number',
    default: '1',
    description: 'How much the spike pattern sways and drifts out of its regular grid.'
  },
  {
    name: 'fluidity',
    type: 'number',
    default: '0.5',
    description: 'How loosely the spikes respond, from 0 (thick and slow) to 1 (bouncy).'
  },
  { name: 'speed', type: 'number', default: '0.5', description: 'How fast the swells roll across the surface.' },
  {
    name: 'magnetism',
    type: 'number',
    default: '1',
    description: 'Strength of the magnetic field that raises swells of spikes across the surface.'
  },
  {
    name: 'variation',
    type: 'number',
    default: '0',
    description: 'Picks a different arrangement of swells.'
  },
  {
    name: 'flowDirection',
    type: "'down' | 'up' | 'left' | 'right' | 'none'",
    default: "'down'",
    description: 'Direction the swells roll. None keeps them morphing in place.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Turns the cursor into a magnet that raises a crown of spikes.'
  },
  { name: 'mouseStrength', type: 'number', default: '1', description: 'Strength of the cursor magnet.' },
  {
    name: 'mouseRadius',
    type: 'number',
    default: '0.22',
    description: 'Reach of the cursor magnet, as a fraction of the height.'
  },
  {
    name: 'mouseDampening',
    type: 'number',
    default: '0.15',
    description: 'Time in seconds the crown takes to catch up with the cursor. 0 follows instantly.'
  },
  {
    name: 'clickPulse',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a magnetic pulse through the fluid.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Raises the spikes when the field switches on.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Renders the fluid as glossy white liquid for light backgrounds.'
  },
  {
    name: 'transparent',
    type: 'boolean',
    default: 'true',
    description: 'Lets the page show through. When off, the fluid sits on the color below.'
  },
  {
    name: 'color',
    type: 'string',
    default: "'#120f17'",
    description: 'Background color when transparent is off. Defaults to white in light mode.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the fluid.' },
  { name: 'mixBlendMode', type: 'string', default: '-', description: 'CSS mix-blend-mode applied to the container.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const LIGHTS = [
  { title: 'Key Light', index: 0 },
  { title: 'Side Lights', index: 1 },
  { title: 'Fill Light', index: 2 }
];

const FerrofluidDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
  };

  const setLight = (index, value) => {
    const next = [0, 1, 2].map(i => settings.colors?.[i] ?? settings.colors?.[0] ?? '#ffffff');
    next[index] = value;
    updateProp('colors', next);
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
            <Ferrofluid key={key} {...settings} />
            <BackgroundContent headline="Bend the magnetic fluid" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="ferrofluid" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            {LIGHTS.map(light => (
              <PreviewColorPickerCustom
                key={light.title}
                title={light.title}
                color={settings.colors?.[light.index] ?? settings.colors?.[0] ?? '#ffffff'}
                onChange={value => setLight(light.index, value)}
              />
            ))}
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.8}
              max={3}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Spike Height"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.spikeHeight}
              onChange={value => updateProp('spikeHeight', value)}
            />
            <PreviewSlider
              title="Sharpness"
              min={1}
              max={5}
              step={0.1}
              value={settings.sharpness}
              onChange={value => updateProp('sharpness', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={25}
              max={65}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Turbulence"
              min={0}
              max={3}
              step={0.05}
              value={settings.turbulence}
              onChange={value => updateProp('turbulence', value)}
            />
            <PreviewSlider
              title="Fluidity"
              min={0}
              max={1}
              step={0.01}
              value={settings.fluidity}
              onChange={value => updateProp('fluidity', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Magnetism"
              min={0}
              max={2}
              step={0.05}
              value={settings.magnetism}
              onChange={value => updateProp('magnetism', value)}
            />
            <PreviewSlider
              title="Variation"
              min={0}
              max={10}
              step={1}
              value={settings.variation}
              onChange={value => updateProp('variation', value)}
            />
            <PreviewSelect
              title="Flow Direction"
              options={FLOW_OPTIONS}
              value={settings.flowDirection}
              onChange={value => updateProp('flowDirection', value)}
            />
            <PreviewSlider
              title="Cursor Strength"
              min={0}
              max={2}
              step={0.05}
              value={settings.mouseStrength}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={0.08}
              max={0.45}
              step={0.01}
              value={settings.mouseRadius}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseRadius', value)}
            />
            <PreviewSwitch
              title="Cursor Magnet"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Pulse"
              isChecked={settings.clickPulse}
              onChange={value => updateProp('clickPulse', value)}
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
          <CodeExample codeObject={ferrofluid} componentName="Ferrofluid" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FerrofluidDemo;
