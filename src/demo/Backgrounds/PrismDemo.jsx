import { Box, Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Prism from '../../content/Backgrounds/Prism/Prism';
import { prism } from '../../constants/code/Backgrounds/prismCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Prism';

const ANIMATION_OPTIONS = [
  { value: 'rotate', label: 'Rotate' },
  { value: '3drotate', label: '3D Rotate' },
  { value: 'hover', label: 'Hover' },
  { value: 'static', label: 'Static' }
];

const propData = [
  {
    name: 'animationType',
    type: "'rotate' | '3drotate' | 'hover' | 'static'",
    default: "'rotate'",
    description: 'Rotate spins the prism in place, 3D rotate tumbles it, hover turns it only toward the cursor.'
  },
  {
    name: 'timeScale',
    type: 'number',
    default: '0.5',
    description: 'Speed of the rotation. 0 holds it still.'
  },
  {
    name: 'colors',
    type: 'string[]',
    default: '[]',
    description: 'Custom colors for the light, cycled through the color bands. Leave empty for the original spectrum.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '1',
    description: 'Brightness of the light.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '3.6',
    description: 'Size of the prism on screen. Larger values zoom in.'
  },
  {
    name: 'height',
    type: 'number',
    default: '3.5',
    description: 'Height of the prism from its base to its tip.'
  },
  {
    name: 'baseWidth',
    type: 'number',
    default: '5.5',
    description: 'Width of the prism at its base.'
  },
  {
    name: 'hueShift',
    type: 'number',
    default: '0',
    description: 'Rotates every color around the color wheel, in degrees.'
  },
  {
    name: 'colorFrequency',
    type: 'number',
    default: '1',
    description: 'How quickly the colors change through the light. Higher values show more bands.'
  },
  {
    name: 'saturation',
    type: 'number',
    default: '1.5',
    description: 'Color intensity, from 0 (grayscale) to 2.'
  },
  {
    name: 'noise',
    type: 'number',
    default: '0',
    description: 'Film grain over the light, from 0 to 1.'
  },
  {
    name: 'offset',
    type: '{ x?: number; y?: number }',
    default: '{ x: 0, y: 0 }',
    description: 'Moves the prism by a number of pixels, x to the right and y down.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'Tilts the prism toward the cursor in every animation mode.'
  },
  {
    name: 'hoverStrength',
    type: 'number',
    default: '2',
    description: 'How far the prism turns toward the cursor.'
  },
  {
    name: 'inertia',
    type: 'number',
    default: '0.05',
    description: 'How quickly the prism follows the cursor, from 0.01 (slow and smooth) to 1 (instant).'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Fades the light in on mount.'
  },
  {
    name: 'resolution',
    type: 'number',
    default: '0.5',
    description:
      'Fraction of the screen resolution the light is rendered at, from 0.25 to 1. The glow is soft, so 0.5 looks the same as full resolution and runs about four times faster.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the light as colored ink for light backgrounds.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const PrismDemo = () => {
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
            <Prism key={key} {...settings} />
            <BackgroundContent headline="A spectrum of colors that spark creativity" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="prism" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings.colors}
              min={0}
              max={8}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Animation"
              options={ANIMATION_OPTIONS}
              value={settings.animationType}
              onChange={value => updateProp('animationType', value)}
            />
            <PreviewSlider
              title="Time Scale"
              min={0}
              max={2}
              step={0.05}
              value={settings.timeScale}
              isDisabled={settings.animationType === 'hover' || settings.animationType === 'static'}
              onChange={value => updateProp('timeScale', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0.2}
              max={3}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Scale"
              min={1.5}
              max={6}
              step={0.1}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Height"
              min={1}
              max={8}
              step={0.1}
              value={settings.height}
              onChange={value => updateProp('height', value)}
            />
            <PreviewSlider
              title="Base Width"
              min={1}
              max={10}
              step={0.1}
              value={settings.baseWidth}
              onChange={value => updateProp('baseWidth', value)}
            />
            <PreviewSlider
              title="Hue Shift"
              min={0}
              max={360}
              step={1}
              value={settings.hueShift}
              valueUnit="°"
              onChange={value => updateProp('hueShift', value)}
            />
            <PreviewSlider
              title="Color Frequency"
              min={0.25}
              max={4}
              step={0.05}
              value={settings.colorFrequency}
              onChange={value => updateProp('colorFrequency', value)}
            />
            <PreviewSlider
              title="Saturation"
              min={0}
              max={2}
              step={0.05}
              value={settings.saturation}
              onChange={value => updateProp('saturation', value)}
            />
            <PreviewSlider
              title="Noise"
              min={0}
              max={1}
              step={0.01}
              value={settings.noise}
              onChange={value => updateProp('noise', value)}
            />
            <PreviewSlider
              title="Hover Strength"
              min={0}
              max={4}
              step={0.1}
              value={settings.hoverStrength}
              isDisabled={!settings.interactive && settings.animationType !== 'hover'}
              onChange={value => updateProp('hoverStrength', value)}
            />
            <PreviewSlider
              title="Inertia"
              min={0.01}
              max={0.3}
              step={0.01}
              value={settings.inertia}
              isDisabled={!settings.interactive && settings.animationType !== 'hover'}
              onChange={value => updateProp('inertia', value)}
            />
            <PreviewSlider
              title="Resolution"
              min={0.25}
              max={1}
              step={0.05}
              value={settings.resolution}
              onChange={value => updateProp('resolution', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings.interactive}
              onChange={value => updateProp('interactive', value)}
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
          <CodeExample codeObject={prism} componentName="Prism" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PrismDemo;
