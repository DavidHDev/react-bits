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

import RippleGrid from '../../content/Backgrounds/RippleGrid/RippleGrid';
import { rippleGrid } from '../../constants/code/Backgrounds/rippleGridCode';

const SHAPE = {
  variant: 'lines',
  cellSize: 48,
  lineWidth: 1,
  glow: 0.6,
  rippleStrength: 1,
  rippleSpeed: 1,
  rippleSize: 1,
  autoRipple: 'center',
  rippleInterval: 2.6,
  tilt: 0,
  rotation: 0,
  fade: 0.5
};

const DEFAULT_PROPS = {
  preset: 'pulse',
  color: '#ffffff',
  ...SHAPE,
  opacity: 1,
  mouseInteraction: true,
  clickRipple: true,
  intro: true,
  lightMode: false
};

const PRESETS = {
  pulse: { ...SHAPE },
  floor: { ...SHAPE, tilt: 62, cellSize: 56, autoRipple: 'random', rippleInterval: 1.6, fade: 0.35 },
  dots: { ...SHAPE, variant: 'dots', cellSize: 32, glow: 0.4 },
  cross: { ...SHAPE, variant: 'cross', cellSize: 56, lineWidth: 1.5 },
  calm: { ...SHAPE, autoRipple: 'none', rippleStrength: 0.8, glow: 0.4 }
};

const PRESET_OPTIONS = [
  { value: 'pulse', label: 'Pulse' },
  { value: 'floor', label: 'Floor' },
  { value: 'dots', label: 'Dots' },
  { value: 'cross', label: 'Cross' },
  { value: 'calm', label: 'Calm' }
];

const VARIANT_OPTIONS = [
  { value: 'lines', label: 'Lines' },
  { value: 'dots', label: 'Dots' },
  { value: 'cross', label: 'Cross' }
];

const AUTO_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'random', label: 'Random' },
  { value: 'none', label: 'None' }
];

const propData = [
  {
    name: 'color',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the grid. Light mode derives its ink from it.'
  },
  {
    name: 'variant',
    type: "'lines' | 'dots' | 'cross'",
    default: "'lines'",
    description: 'Draws the grid as lines, dots at each crossing, or small crosses.'
  },
  { name: 'cellSize', type: 'number', default: '48', description: 'Size of each grid cell, in px.' },
  { name: 'lineWidth', type: 'number', default: '1', description: 'Width of the lines, in px.' },
  { name: 'glow', type: 'number', default: '0.6', description: 'Soft glow around the lines.' },
  {
    name: 'rippleStrength',
    type: 'number',
    default: '1',
    description: 'How far ripples bend the grid and how brightly their crests light it.'
  },
  { name: 'rippleSpeed', type: 'number', default: '1', description: 'How fast ripples travel outward.' },
  { name: 'rippleSize', type: 'number', default: '1', description: 'Wavelength of the ripples.' },
  {
    name: 'autoRipple',
    type: "'center' | 'random' | 'none'",
    default: "'center'",
    description: 'Where idle ripples start: from the center, at random spots, or not at all.'
  },
  { name: 'rippleInterval', type: 'number', default: '2.6', description: 'Seconds between idle ripples.' },
  {
    name: 'tilt',
    type: 'number',
    default: '0',
    description: 'Lays the grid back in perspective, like a floor, in degrees.'
  },
  { name: 'rotation', type: 'number', default: '0', description: 'Turns the grid, in degrees.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The cursor leaves a wake of small ripples and lights up the lines nearby.'
  },
  { name: 'clickRipple', type: 'boolean', default: 'true', description: 'Clicking sends a strong ripple.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Reveals the grid with a ripple from the center.' },
  { name: 'fade', type: 'number', default: '0.5', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the grid as ink for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const RippleGridDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], color: settings.color, preset: value });
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
            <RippleGrid key={key} {...settings} />
            <BackgroundContent pillText="New Background" headline="Every move sends ripples through the grid" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="ripple-grid" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSelect
              title="Variant"
              options={VARIANT_OPTIONS}
              value={settings.variant}
              onChange={value => updateProp('variant', value)}
            />
            <PreviewSelect
              title="Auto Ripple"
              options={AUTO_OPTIONS}
              value={settings.autoRipple}
              onChange={value => updateProp('autoRipple', value)}
            />
            <PreviewSlider
              title="Cell Size"
              min={16}
              max={120}
              step={1}
              value={settings.cellSize}
              valueUnit="px"
              onChange={value => updateProp('cellSize', value)}
            />
            <PreviewSlider
              title="Line Width"
              min={0.5}
              max={4}
              step={0.25}
              value={settings.lineWidth}
              valueUnit="px"
              onChange={value => updateProp('lineWidth', value)}
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
              title="Ripple Strength"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.rippleStrength}
              onChange={value => updateProp('rippleStrength', value)}
            />
            <PreviewSlider
              title="Ripple Speed"
              min={0.2}
              max={3}
              step={0.05}
              value={settings.rippleSpeed}
              onChange={value => updateProp('rippleSpeed', value)}
            />
            <PreviewSlider
              title="Ripple Size"
              min={0.4}
              max={3}
              step={0.05}
              value={settings.rippleSize}
              onChange={value => updateProp('rippleSize', value)}
            />
            <PreviewSlider
              title="Ripple Interval"
              min={0.5}
              max={8}
              step={0.1}
              value={settings.rippleInterval}
              valueUnit="s"
              onChange={value => updateProp('rippleInterval', value)}
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
              title="Rotation"
              min={0}
              max={90}
              step={1}
              value={settings.rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
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
          <CodeExample codeObject={rippleGrid} componentName="RippleGrid" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default RippleGridDemo;
