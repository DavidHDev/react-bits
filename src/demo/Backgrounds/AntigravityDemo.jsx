import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Antigravity from '../../content/Backgrounds/Antigravity/Antigravity';
import { antigravity } from '../../constants/code/Backgrounds/antigravityCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/Antigravity';

const DEFAULT_PROPS = {
  preset: 'magnet',
  ...LOOK,
  autoAnimate: true,
  interactive: true,
  clickBurst: true,
  intro: true,
  lightMode: false
};

const COLOR_MODE_OPTIONS = [
  { value: 'conic', label: 'Conic' },
  { value: 'radial', label: 'Radial' },
  { value: 'random', label: 'Random' }
];

const SHAPE_OPTIONS = [
  { value: 'capsule', label: 'Capsule' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'box', label: 'Box' },
  { value: 'tetrahedron', label: 'Tetrahedron' }
];

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#5227FF', '#FF9FFC', '#B497CF']",
    description: 'Palette the particles are colored from. How it is spread depends on colorMode.'
  },
  {
    name: 'color',
    type: 'string',
    default: '-',
    description: 'A single color for every particle. Overrides colors when set.'
  },
  {
    name: 'colorMode',
    type: "'conic' | 'radial' | 'random'",
    default: "'conic'",
    description:
      'Spreads the palette around the cursor, outward from the ring, or gives each particle a random color from it.'
  },
  {
    name: 'colorSpeed',
    type: 'number',
    default: '0.05',
    description: 'How fast the conic palette turns around the cursor. 0 keeps it still.'
  },
  {
    name: 'particleShape',
    type: "'capsule' | 'sphere' | 'box' | 'tetrahedron'",
    default: "'capsule'",
    description: 'Shape of the particles. Capsules stretch into dashes that point at the cursor.'
  },
  { name: 'count', type: 'number', default: '1500', description: 'Number of particles in the field.' },
  { name: 'particleSize', type: 'number', default: '0.9', description: 'Size of the particles.' },
  {
    name: 'particleVariance',
    type: 'number',
    default: '1',
    description: 'How much each particle pulses in size, from 0 to 1.'
  },
  {
    name: 'magnetRadius',
    type: 'number',
    default: '9',
    description: 'Size of the area around the cursor whose particles get pulled into the ring.'
  },
  { name: 'ringRadius', type: 'number', default: '7', description: 'Radius of the ring the particles form.' },
  {
    name: 'fieldStrength',
    type: 'number',
    default: '10',
    description: 'How tightly the particles line up on the ring. Lower values spread them into a wider band.'
  },
  {
    name: 'waveAmplitude',
    type: 'number',
    default: '1',
    description: 'How much the ring ripples. 0 gives a clean circle.'
  },
  {
    name: 'waveCount',
    type: 'number',
    default: '3',
    description: 'Number of ripples around the ring. Pair with a high waveAmplitude for a flower shape.'
  },
  { name: 'waveSpeed', type: 'number', default: '0.4', description: 'How fast the ripples travel around the ring.' },
  {
    name: 'rotationSpeed',
    type: 'number',
    default: '0',
    description: 'How fast the particles orbit the cursor. Negative values orbit the other way.'
  },
  { name: 'pulseSpeed', type: 'number', default: '3', description: 'How fast the particles pulse in size.' },
  {
    name: 'depthFactor',
    type: 'number',
    default: '1',
    description: 'Strength of the 3D depth. Particles in front grow, particles behind shrink and soften.'
  },
  {
    name: 'ambient',
    type: 'number',
    default: '0.25',
    description: 'How visible the particles away from the ring are, from 0 to 1.'
  },
  {
    name: 'lerpSpeed',
    type: 'number',
    default: '0.05',
    description: 'How quickly the particles follow the cursor. Lower values leave longer trails.'
  },
  {
    name: 'autoAnimate',
    type: 'boolean',
    default: 'true',
    description: 'The ring drifts around on its own after a couple of seconds without cursor movement.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'The ring follows the cursor or finger. Turn off for a purely ambient background.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description: 'Pressing pulls the ring in and spins it faster. Releasing blasts the particles outward.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'The particles float up into place on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Deepens pale colors so the particles stay visible on light backgrounds.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Overall opacity, from 0 to 1.' },
  {
    name: 'maxDevicePixelRatio',
    type: 'number',
    default: '2',
    description: 'Highest pixel ratio the canvas renders at.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const AntigravityDemo = () => {
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
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <Antigravity key={key} {...settings} />
            <BackgroundContent headline="Defy gravity with every move." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="antigravity" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings.colors}
              min={1}
              max={6}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Color Mode"
              options={COLOR_MODE_OPTIONS}
              value={settings.colorMode}
              onChange={value => updateProp('colorMode', value)}
            />
            <PreviewSelect
              title="Particle Shape"
              options={SHAPE_OPTIONS}
              value={settings.particleShape}
              onChange={value => updateProp('particleShape', value)}
            />
            <PreviewSlider
              title="Color Speed"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.colorSpeed}
              onChange={value => updateProp('colorSpeed', value)}
            />
            <PreviewSlider
              title="Count"
              min={100}
              max={5000}
              step={50}
              value={settings.count}
              onChange={value => updateProp('count', value)}
            />
            <PreviewSlider
              title="Particle Size"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.particleSize}
              onChange={value => updateProp('particleSize', value)}
            />
            <PreviewSlider
              title="Particle Variance"
              min={0}
              max={1}
              step={0.05}
              value={settings.particleVariance}
              onChange={value => updateProp('particleVariance', value)}
            />
            <PreviewSlider
              title="Magnet Radius"
              min={2}
              max={20}
              step={0.5}
              value={settings.magnetRadius}
              onChange={value => updateProp('magnetRadius', value)}
            />
            <PreviewSlider
              title="Ring Radius"
              min={0}
              max={16}
              step={0.5}
              value={settings.ringRadius}
              onChange={value => updateProp('ringRadius', value)}
            />
            <PreviewSlider
              title="Field Strength"
              min={1}
              max={40}
              step={0.5}
              value={settings.fieldStrength}
              onChange={value => updateProp('fieldStrength', value)}
            />
            <PreviewSlider
              title="Wave Amplitude"
              min={0}
              max={8}
              step={0.1}
              value={settings.waveAmplitude}
              onChange={value => updateProp('waveAmplitude', value)}
            />
            <PreviewSlider
              title="Wave Count"
              min={0}
              max={12}
              step={1}
              value={settings.waveCount}
              onChange={value => updateProp('waveCount', value)}
            />
            <PreviewSlider
              title="Wave Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings.waveSpeed}
              onChange={value => updateProp('waveSpeed', value)}
            />
            <PreviewSlider
              title="Rotation Speed"
              min={-3}
              max={3}
              step={0.05}
              value={settings.rotationSpeed}
              onChange={value => updateProp('rotationSpeed', value)}
            />
            <PreviewSlider
              title="Pulse Speed"
              min={0}
              max={10}
              step={0.1}
              value={settings.pulseSpeed}
              onChange={value => updateProp('pulseSpeed', value)}
            />
            <PreviewSlider
              title="Depth Factor"
              min={0}
              max={3}
              step={0.05}
              value={settings.depthFactor}
              onChange={value => updateProp('depthFactor', value)}
            />
            <PreviewSlider
              title="Ambient"
              min={0}
              max={1}
              step={0.01}
              value={settings.ambient}
              onChange={value => updateProp('ambient', value)}
            />
            <PreviewSlider
              title="Lerp Speed"
              min={0.01}
              max={0.3}
              step={0.01}
              value={settings.lerpSpeed}
              onChange={value => updateProp('lerpSpeed', value)}
            />
            <PreviewSwitch
              title="Auto Animate"
              isChecked={settings.autoAnimate}
              onChange={value => updateProp('autoAnimate', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings.interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSwitch
              title="Click Burst"
              isChecked={settings.clickBurst}
              onChange={value => updateProp('clickBurst', value)}
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
          <CodeExample codeObject={antigravity} componentName="Antigravity" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default AntigravityDemo;
