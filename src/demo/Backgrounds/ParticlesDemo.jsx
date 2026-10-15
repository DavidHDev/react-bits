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

import Particles from '../../content/Backgrounds/Particles/Particles';
import { particles } from '../../constants/code/Backgrounds/particlesCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Particles';

const SHAPE_OPTIONS = [
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' },
  { value: 'ring', label: 'Ring' },
  { value: 'sparkle', label: 'Sparkle' }
];

const HOVER_OPTIONS = [
  { value: 'parallax', label: 'Parallax' },
  { value: 'repel', label: 'Repel' },
  { value: 'attract', label: 'Attract' }
];

const DRIFT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'forward', label: 'Forward' }
];

const propData = [
  { name: 'particleCount', type: 'number', default: '200', description: 'How many particles there are.' },
  {
    name: 'particleSpread',
    type: 'number',
    default: '10',
    description: 'How far the particles spread out from the center.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '0.1',
    description: 'Speed of the floating motion, twinkle and rotation.'
  },
  {
    name: 'particleColors',
    type: 'string[]',
    default: "['#ffffff']",
    description: 'Colors the particles are picked from.'
  },
  {
    name: 'particleBaseSize',
    type: 'number',
    default: '100',
    description: 'Base size of the particles. Nearer particles are drawn larger.'
  },
  {
    name: 'sizeRandomness',
    type: 'number',
    default: '1',
    description: 'How much particle sizes vary. 0 draws every particle at the base size in px.'
  },
  {
    name: 'shape',
    type: "'circle' | 'square' | 'ring' | 'sparkle'",
    default: "'circle'",
    description: 'Shape of each particle.'
  },
  { name: 'glow', type: 'number', default: '0.5', description: 'Soft glow around each particle.' },
  { name: 'twinkle', type: 'number', default: '0.3', description: 'How much the particles flicker, from 0 to 1.' },
  {
    name: 'depthOfField',
    type: 'number',
    default: '0',
    description: 'Blurs the nearest particles into soft bokeh, like a camera lens.'
  },
  {
    name: 'connections',
    type: 'boolean',
    default: 'false',
    description: 'Joins nearby particles with thin lines, like a constellation.'
  },
  {
    name: 'connectionDistance',
    type: 'number',
    default: '110',
    description: 'How close particles need to be to connect, in px.'
  },
  {
    name: 'drift',
    type: "'none' | 'up' | 'down' | 'forward'",
    default: "'none'",
    description: 'Sends the particles drifting up like embers, down like snow, or toward you like a starfield.'
  },
  { name: 'driftSpeed', type: 'number', default: '1', description: 'How fast the particles drift.' },
  {
    name: 'moveParticlesOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Lets the cursor move the particles.'
  },
  {
    name: 'hoverEffect',
    type: "'parallax' | 'repel' | 'attract'",
    default: "'parallax'",
    description:
      'Parallax shifts the whole field away from the cursor. Repel and attract push or pull nearby particles.'
  },
  {
    name: 'particleHoverFactor',
    type: 'number',
    default: '1',
    description: 'Strength of the hover effect.'
  },
  {
    name: 'hoverRadius',
    type: 'number',
    default: '140',
    description: 'Radius around the cursor that repel and attract reach, in px.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a burst of light rippling through the particles.'
  },
  {
    name: 'alphaParticles',
    type: 'boolean',
    default: 'false',
    description: 'Draws softer, slightly see-through particles.'
  },
  {
    name: 'cameraDistance',
    type: 'number',
    default: '20',
    description: 'Distance from the camera to the particles. Lower values feel closer and deeper.'
  },
  {
    name: 'disableRotation',
    type: 'boolean',
    default: 'false',
    description: 'Stops the slow rotation of the whole field.'
  },
  { name: 'variation', type: 'number', default: '0', description: 'Picks a different particle layout.' },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Flies the particles in from the distance on mount.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the particles as ink for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  {
    name: 'pixelRatio',
    type: 'number',
    default: 'auto',
    description: "Maximum device pixel ratio. Defaults to the screen's, capped at 2."
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const ParticlesDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
  };

  const setColor = (index, value) => {
    const next = [...settings.particleColors];
    next[index] = value;
    updateProp('particleColors', next);
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
            <Particles key={key} {...settings} />
            <BackgroundContent headline="Drift through a field of light." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="particles" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            {['Color 1', 'Color 2', 'Color 3'].map((title, index) => (
              <PreviewColorPickerCustom
                key={title}
                title={title}
                color={settings.particleColors[index] ?? settings.particleColors[0]}
                onChange={value => setColor(index, value)}
              />
            ))}
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSlider
              title="Count"
              min={10}
              max={4000}
              step={10}
              value={settings.particleCount}
              onChange={value => updateProp('particleCount', value)}
            />
            <PreviewSlider
              title="Spread"
              min={2}
              max={30}
              step={0.5}
              value={settings.particleSpread}
              onChange={value => updateProp('particleSpread', value)}
            />
            <PreviewSlider
              title="Size"
              min={20}
              max={400}
              step={5}
              value={settings.particleBaseSize}
              onChange={value => updateProp('particleBaseSize', value)}
            />
            <PreviewSlider
              title="Size Randomness"
              min={0.1}
              max={2}
              step={0.05}
              value={settings.sizeRandomness}
              onChange={value => updateProp('sizeRandomness', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={1}
              step={0.01}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
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
              title="Twinkle"
              min={0}
              max={1}
              step={0.05}
              value={settings.twinkle}
              onChange={value => updateProp('twinkle', value)}
            />
            <PreviewSlider
              title="Depth Of Field"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.depthOfField}
              onChange={value => updateProp('depthOfField', value)}
            />
            <PreviewSelect
              title="Drift"
              options={DRIFT_OPTIONS}
              value={settings.drift}
              onChange={value => updateProp('drift', value)}
            />
            <PreviewSlider
              title="Drift Speed"
              min={0}
              max={4}
              step={0.05}
              value={settings.driftSpeed}
              isDisabled={settings.drift === 'none'}
              onChange={value => updateProp('driftSpeed', value)}
            />
            <PreviewSlider
              title="Connection Distance"
              min={40}
              max={240}
              step={5}
              value={settings.connectionDistance}
              valueUnit="px"
              isDisabled={!settings.connections}
              onChange={value => updateProp('connectionDistance', value)}
            />
            <PreviewSelect
              title="Hover Effect"
              options={HOVER_OPTIONS}
              value={settings.hoverEffect}
              onChange={value => updateProp('hoverEffect', value)}
            />
            <PreviewSlider
              title="Hover Factor"
              min={0}
              max={4}
              step={0.05}
              value={settings.particleHoverFactor}
              isDisabled={!settings.moveParticlesOnHover}
              onChange={value => updateProp('particleHoverFactor', value)}
            />
            <PreviewSlider
              title="Hover Radius"
              min={40}
              max={400}
              step={5}
              value={settings.hoverRadius}
              valueUnit="px"
              isDisabled={!settings.moveParticlesOnHover || settings.hoverEffect === 'parallax'}
              onChange={value => updateProp('hoverRadius', value)}
            />
            <PreviewSlider
              title="Camera Distance"
              min={6}
              max={60}
              step={1}
              value={settings.cameraDistance}
              onChange={value => updateProp('cameraDistance', value)}
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
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSwitch
              title="Connections"
              isChecked={settings.connections}
              onChange={value => updateProp('connections', value)}
            />
            <PreviewSwitch
              title="Move On Hover"
              isChecked={settings.moveParticlesOnHover}
              onChange={value => updateProp('moveParticlesOnHover', value)}
            />
            <PreviewSwitch
              title="Click Burst"
              isChecked={settings.clickBurst}
              onChange={value => updateProp('clickBurst', value)}
            />
            <PreviewSwitch
              title="Soft Particles"
              isChecked={settings.alphaParticles}
              onChange={value => updateProp('alphaParticles', value)}
            />
            <PreviewSwitch
              title="Disable Rotation"
              isChecked={settings.disableRotation}
              onChange={value => updateProp('disableRotation', value)}
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
          <CodeExample codeObject={particles} componentName="Particles" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ParticlesDemo;
