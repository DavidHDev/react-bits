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

import LightPillar from '../../content/Backgrounds/LightPillar/LightPillar';
import { lightPillar } from '../../constants/code/Backgrounds/lightPillarCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/LightPillar';

const DEFAULT_PROPS = {
  preset: 'aurora',
  ...LOOK,
  interactive: true,
  clickPulse: true,
  intro: true,
  fade: 0,
  quality: 'high',
  mixBlendMode: 'screen',
  lightMode: false
};

const QUALITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const BLEND_OPTIONS = [
  { value: 'screen', label: 'Screen' },
  { value: 'normal', label: 'Normal' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'luminosity', label: 'Luminosity' }
];

const propData = [
  {
    name: 'topColor',
    type: 'string',
    default: "'#5227FF'",
    description: 'Color of the lower, denser part of the pillar.'
  },
  {
    name: 'bottomColor',
    type: 'string',
    default: "'#FF9FFC'",
    description: 'Color the light fades into toward the top.'
  },
  { name: 'intensity', type: 'number', default: '1', description: 'Overall brightness.' },
  {
    name: 'glowAmount',
    type: 'number',
    default: '0.002',
    description: 'How much light the strands gather. Higher values burn brighter and whiter.'
  },
  {
    name: 'bloom',
    type: 'number',
    default: '0.5',
    description: 'Soft halo around the brightest strands, from 0 to 1.'
  },
  { name: 'pillarWidth', type: 'number', default: '3', description: 'Width of the pillar.' },
  {
    name: 'pillarHeight',
    type: 'number',
    default: '0.4',
    description: 'Vertical stretch of the strands. Higher values pack them tighter.'
  },
  {
    name: 'pillarRotation',
    type: 'number',
    default: '25',
    description: 'Tilts the pillar, in degrees.'
  },
  {
    name: 'twist',
    type: 'number',
    default: '0.4',
    description: 'How much the strands swirl around each other.'
  },
  {
    name: 'detail',
    type: 'number',
    default: '4',
    description: 'Layers of turbulence in the strands, from 1 to 6. Fewer layers are smoother and faster.'
  },
  {
    name: 'rotationSpeed',
    type: 'number',
    default: '0.3',
    description: 'How fast the pillar turns. Also drives the overall animation speed.'
  },
  {
    name: 'flow',
    type: 'number',
    default: '1',
    description: 'How fast the light streams along the pillar, relative to the rotation.'
  },
  { name: 'noiseIntensity', type: 'number', default: '0.5', description: 'Strength of the film grain.' },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'The pillar leans, drifts and turns toward the cursor.'
  },
  {
    name: 'clickPulse',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a surge of light racing up the pillar.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The pillar ignites from the bottom and widens when it first appears.'
  },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  {
    name: 'quality',
    type: "'low' | 'medium' | 'high'",
    default: "'high'",
    description: 'Render resolution of the light. The pillar is soft, so lower settings look almost the same.'
  },
  {
    name: 'resolution',
    type: 'number',
    default: '-',
    description: 'Exact render scale relative to the element size, from 0.25 to 2. Overrides quality.'
  },
  {
    name: 'mixBlendMode',
    type: 'string',
    default: "'screen'",
    description: 'CSS blend mode for the canvas. Screen lets the page show through the dark areas.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the pillar as colored light on a white background.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const LightPillarDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
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
          <Box position="relative" className="demo-container" h={500} overflow="hidden" p={0}>
            <LightPillar key={key} {...settings} />
            <BackgroundContent headline="Ethereal light pillar for your hero sections." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="light-pillar" currentProps={settings} defaultProps={LOOK} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Top Color"
              color={settings.topColor}
              onChange={value => updateProp('topColor', value)}
            />
            <PreviewColorPickerCustom
              title="Bottom Color"
              color={settings.bottomColor}
              onChange={value => updateProp('bottomColor', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.1}
              max={3}
              step={0.05}
              value={settings.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0.0005}
              max={0.01}
              step={0.0005}
              value={settings.glowAmount}
              onChange={value => updateProp('glowAmount', value)}
            />
            <PreviewSlider
              title="Bloom"
              min={0}
              max={1}
              step={0.05}
              value={settings.bloom}
              onChange={value => updateProp('bloom', value)}
            />
            <PreviewSlider
              title="Pillar Width"
              min={0.5}
              max={8}
              step={0.1}
              value={settings.pillarWidth}
              onChange={value => updateProp('pillarWidth', value)}
            />
            <PreviewSlider
              title="Pillar Height"
              min={0.1}
              max={1.5}
              step={0.05}
              value={settings.pillarHeight}
              onChange={value => updateProp('pillarHeight', value)}
            />
            <PreviewSlider
              title="Pillar Rotation"
              min={-90}
              max={90}
              step={1}
              value={settings.pillarRotation}
              valueUnit="°"
              onChange={value => updateProp('pillarRotation', value)}
            />
            <PreviewSlider
              title="Twist"
              min={0}
              max={1.6}
              step={0.05}
              value={settings.twist}
              onChange={value => updateProp('twist', value)}
            />
            <PreviewSlider
              title="Detail"
              min={1}
              max={6}
              step={1}
              value={settings.detail}
              onChange={value => updateProp('detail', value)}
            />
            <PreviewSlider
              title="Rotation Speed"
              min={0}
              max={2}
              step={0.05}
              value={settings.rotationSpeed}
              onChange={value => updateProp('rotationSpeed', value)}
            />
            <PreviewSlider
              title="Flow"
              min={0}
              max={3}
              step={0.05}
              value={settings.flow}
              onChange={value => updateProp('flow', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={2}
              step={0.05}
              value={settings.noiseIntensity}
              onChange={value => updateProp('noiseIntensity', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSelect
              title="Quality"
              options={QUALITY_OPTIONS}
              value={settings.quality}
              onChange={value => updateProp('quality', value)}
            />
            <PreviewSelect
              title="Blend Mode"
              options={BLEND_OPTIONS}
              value={settings.mixBlendMode}
              onChange={value => updateProp('mixBlendMode', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings.interactive}
              onChange={value => updateProp('interactive', value)}
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
          <CodeExample codeObject={lightPillar} componentName="LightPillar" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LightPillarDemo;
