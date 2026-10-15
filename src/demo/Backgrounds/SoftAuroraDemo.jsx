import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorMode } from '../../components/setup/color-mode';

import SoftAurora from '../../content/Backgrounds/SoftAurora/SoftAurora';
import { softAurora } from '../../constants/code/Backgrounds/softAuroraCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/SoftAurora';

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  enableMouseInteraction: true,
  mouseInfluence: 0.25,
  clickPulse: true,
  intro: true,
  lightMode: false
};

const propData = [
  { name: 'color1', type: 'string', default: "'#f7f7f7'", description: 'Tint of the first aurora layer.' },
  { name: 'color2', type: 'string', default: "'#e100ff'", description: 'Tint of the second aurora layer.' },
  {
    name: 'spectrum',
    type: 'number',
    default: '1',
    description:
      'How much of the shifting rainbow shows through the tints, from 0 to 1. 0 uses the two colors as they are.'
  },
  { name: 'speed', type: 'number', default: '0.6', description: 'Overall animation speed.' },
  { name: 'colorSpeed', type: 'number', default: '1', description: 'How fast the colors drift along the band.' },
  { name: 'scale', type: 'number', default: '1.5', description: 'Scale of the noise that shapes the band.' },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness.' },
  { name: 'noiseFrequency', type: 'number', default: '2.5', description: 'How tightly the band ripples.' },
  { name: 'noiseAmplitude', type: 'number', default: '1', description: 'How far the band waves up and down.' },
  {
    name: 'bandHeight',
    type: 'number',
    default: '0.5',
    description: 'Vertical position of the band, from 0 at the bottom to 1 at the top.'
  },
  {
    name: 'bandSpread',
    type: 'number',
    default: '1',
    description: 'How tight and bright the band is. Lower values spread it into a wide, soft glow.'
  },
  { name: 'tilt', type: 'number', default: '0', description: 'Tilts the band by this many degrees.' },
  {
    name: 'octaveDecay',
    type: 'number',
    default: '0.1',
    description: 'How much fine ripple sits on top of the large waves.'
  },
  {
    name: 'layerOffset',
    type: 'number',
    default: '0',
    description: 'Shifts the second layer in time so the two separate.'
  },
  {
    name: 'enableMouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The aurora drifts with the cursor and reaches toward it when it comes close.'
  },
  { name: 'mouseInfluence', type: 'number', default: '0.25', description: 'Strength of the cursor drift and reach.' },
  {
    name: 'clickPulse',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a soft pulse of light along the band.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The band starts as a thin line and blooms in on mount.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Prints the aurora as soft colored ink so it sits on light pages.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Overall opacity, from 0 to 1.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const SoftAuroraDemo = () => {
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
            <SoftAurora key={key} {...settings} />
            <BackgroundContent pillText="New Background" headline="A gentle glow to light your way!" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="soft-aurora" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color 1"
              color={settings.color1}
              onChange={value => updateProp('color1', value)}
            />
            <PreviewColorPickerCustom
              title="Color 2"
              color={settings.color2}
              onChange={value => updateProp('color2', value)}
            />
            <PreviewSlider
              title="Spectrum"
              min={0}
              max={1}
              step={0.05}
              value={settings.spectrum}
              onChange={value => updateProp('spectrum', value)}
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
              title="Color Speed"
              min={0}
              max={5}
              step={0.1}
              value={settings.colorSpeed}
              onChange={value => updateProp('colorSpeed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.1}
              max={3}
              step={0.1}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.1}
              max={3}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Noise Frequency"
              min={0.5}
              max={10}
              step={0.5}
              value={settings.noiseFrequency}
              onChange={value => updateProp('noiseFrequency', value)}
            />
            <PreviewSlider
              title="Noise Amplitude"
              min={0}
              max={5}
              step={0.1}
              value={settings.noiseAmplitude}
              onChange={value => updateProp('noiseAmplitude', value)}
            />
            <PreviewSlider
              title="Band Height"
              min={0}
              max={1}
              step={0.01}
              value={settings.bandHeight}
              onChange={value => updateProp('bandHeight', value)}
            />
            <PreviewSlider
              title="Band Spread"
              min={0.1}
              max={3}
              step={0.05}
              value={settings.bandSpread}
              onChange={value => updateProp('bandSpread', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={-45}
              max={45}
              step={1}
              value={settings.tilt}
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Octave Decay"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.octaveDecay}
              onChange={value => updateProp('octaveDecay', value)}
            />
            <PreviewSlider
              title="Layer Offset"
              min={0}
              max={1}
              step={0.05}
              value={settings.layerOffset}
              onChange={value => updateProp('layerOffset', value)}
            />
            <PreviewSlider
              title="Mouse Influence"
              min={0}
              max={1}
              step={0.05}
              value={settings.mouseInfluence}
              onChange={value => updateProp('mouseInfluence', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.enableMouseInteraction}
              onChange={value => updateProp('enableMouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Pulse"
              isChecked={settings.clickPulse}
              onChange={value => updateProp('clickPulse', value)}
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
          <CodeExample codeObject={softAurora} componentName="SoftAurora" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SoftAuroraDemo;
