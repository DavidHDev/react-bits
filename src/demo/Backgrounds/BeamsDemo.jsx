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

import { beams } from '../../constants/code/Backgrounds/beamsCode';
import Beams from '../../content/Backgrounds/Beams/Beams';

const LOOK = {
  beamWidth: 140,
  rotation: 30,
  waveLength: 233,
  depth: 1,
  sharpness: 0.6,
  twist: 0,
  fillLight: 0.3,
  glow: 0.6
};

const DEFAULT_PROPS = {
  preset: 'studio',
  color: '#ffffff',
  ...LOOK,
  speed: 1,
  brightness: 1.6,
  grain: 0.35,
  variation: 0,
  mouseInteraction: true,
  mouseStrength: 1,
  fade: 0,
  opacity: 1,
  intro: true,
  lightMode: false
};

const PRESETS = {
  studio: { ...LOOK, color: '#ffffff' },
  ember: { ...LOOK, color: '#ff8a4c', rotation: 20, glow: 0.85, fillLight: 0.2 },
  glacier: { ...LOOK, color: '#8fd0ff', beamWidth: 90, rotation: 45, sharpness: 0.75, fillLight: 0.4 },
  chrome: { ...LOOK, sharpness: 0.8, depth: 1.2, fillLight: 0.9, glow: 0.4, rotation: 35 },
  dawn: { ...LOOK, color: '#ffd59a', rotation: -30, waveLength: 320, twist: 0.4, glow: 0.7 }
};

const PRESET_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: 'ember', label: 'Ember' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'dawn', label: 'Dawn' }
];

const propData = [
  {
    name: 'color',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the light that glints off the beams.'
  },
  { name: 'beamWidth', type: 'number', default: '140', description: 'Width of each beam, in px.' },
  { name: 'rotation', type: 'number', default: '30', description: 'Angle of the beams, in degrees.' },
  { name: 'speed', type: 'number', default: '1', description: 'How fast the ripples move.' },
  {
    name: 'waveLength',
    type: 'number',
    default: '233',
    description: 'Length of the ripples along each beam, in px.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '1',
    description: 'How deep the ripples are. Deeper ripples catch the light in more places.'
  },
  {
    name: 'sharpness',
    type: 'number',
    default: '0.6',
    description: 'How crisp the glints are, from 0 for soft satin to 1 for sharp, glossy streaks.'
  },
  {
    name: 'twist',
    type: 'number',
    default: '0',
    description: 'Turns each beam slightly on its own axis, so glints show up on more beams.'
  },
  {
    name: 'fillLight',
    type: 'number',
    default: '0.3',
    description: 'Strength of a dimmer second light from the other side, for fuller, more metallic beams.'
  },
  { name: 'brightness', type: 'number', default: '1.6', description: 'Strength of the light.' },
  { name: 'glow', type: 'number', default: '0.6', description: 'Soft glow around the brightest glints.' },
  { name: 'grain', type: 'number', default: '0.35', description: 'Strength of the film grain, from 0 to 1.' },
  {
    name: 'variation',
    type: 'number',
    default: '0',
    description: 'Picks a different ripple pattern. Any number works.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The cursor moves the light along the beams and brightens the glints near it.'
  },
  { name: 'mouseStrength', type: 'number', default: '1', description: 'How strongly the cursor moves the light.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Sweeps the light in on mount.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Prints the glints as soft ink, for light backgrounds.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: 'undefined',
    description: 'Optional solid background. By default the canvas is transparent and the page shows through.'
  },
  {
    name: 'quality',
    type: 'number',
    default: '0.75',
    description: 'Render resolution, from 0.25 to 1. Lower values run faster.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const BeamsDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
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
            <Beams key={key} {...settings} />
            <BackgroundContent pillText="New Background" headline="Radiant beams for creative user interfaces" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="beams" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Beam Width"
              min={40}
              max={320}
              step={2}
              value={settings.beamWidth}
              valueUnit="px"
              onChange={value => updateProp('beamWidth', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-90}
              max={90}
              step={1}
              value={settings.rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Wave Length"
              min={80}
              max={600}
              step={1}
              value={settings.waveLength}
              valueUnit="px"
              onChange={value => updateProp('waveLength', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0.2}
              max={2.5}
              step={0.05}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Sharpness"
              min={0}
              max={1}
              step={0.05}
              value={settings.sharpness}
              onChange={value => updateProp('sharpness', value)}
            />
            <PreviewSlider
              title="Twist"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.twist}
              onChange={value => updateProp('twist', value)}
            />
            <PreviewSlider
              title="Fill Light"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.fillLight}
              onChange={value => updateProp('fillLight', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.4}
              max={3}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
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
              title="Grain"
              min={0}
              max={1}
              step={0.05}
              value={settings.grain}
              onChange={value => updateProp('grain', value)}
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
              title="Mouse Strength"
              min={0}
              max={2}
              step={0.05}
              value={settings.mouseStrength}
              onChange={value => updateProp('mouseStrength', value)}
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
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={beams} componentName="Beams" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default BeamsDemo;
