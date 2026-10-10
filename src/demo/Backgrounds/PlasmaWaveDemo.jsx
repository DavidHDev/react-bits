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

import PlasmaWave from '../../content/Backgrounds/PlasmaWave/PlasmaWave';
import { plasmaWave } from '../../constants/code/Backgrounds/plasmaWaveCode';

const MOTION = {
  speed: 1,
  speed1: 0.05,
  speed2: 0.05,
  dir2: 1,
  bend1: 1,
  bend2: 0.5,
  thickness: 0.3,
  glow: 1
};

const DEFAULT_PROPS = {
  preset: 'plasma',
  colors: ['#A855F7', '#06B6D4'],
  ...MOTION,
  focalLength: 1.25,
  rotationDeg: 0,
  brightness: 1,
  core: 0.6,
  grain: 0.03,
  fade: 0,
  opacity: 1,
  quality: 1,
  mouseInteraction: true,
  intro: true,
  lightMode: false
};

const PRESETS = {
  plasma: { ...MOTION, colors: ['#A855F7', '#06B6D4'] },
  ember: { ...MOTION, colors: ['#ff8a3d', '#ff2d6f'] },
  glacier: { ...MOTION, colors: ['#93c5fd', '#e0f2fe'], glow: 0.9 },
  mono: { ...MOTION, colors: ['#ffffff', '#a1a1aa'], glow: 0.6 },
  storm: { ...MOTION, colors: ['#A855F7', '#06B6D4'], speed: 1.8, bend1: 1.5, bend2: 1, thickness: 0.34, glow: 1.3 },
  calm: { ...MOTION, colors: ['#A855F7', '#06B6D4'], speed: 0.6, bend1: 0.7, bend2: 0.35, thickness: 0.24, glow: 0.8 }
};

const LIGHT_COLORS = {
  plasma: { colors: ['#8B2CFF', '#00CFF5'] },
  ember: { colors: ['#ff7a00', '#e8175d'] },
  glacier: { colors: ['#1d4ed8', '#0891b2'] },
  mono: { colors: ['#27272a', '#71717a'] },
  storm: { colors: ['#8B2CFF', '#00CFF5'] },
  calm: { colors: ['#8B2CFF', '#00CFF5'] }
};

const PRESET_OPTIONS = [
  { value: 'plasma', label: 'Plasma' },
  { value: 'ember', label: 'Ember' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'mono', label: 'Mono' },
  { value: 'storm', label: 'Storm' },
  { value: 'calm', label: 'Calm' }
];

const propData = [
  {
    name: 'colors',
    type: '[string, string]',
    default: "['#A855F7', '#06B6D4']",
    description: 'Colors of the two waves of plasma.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Overall speed of the animation.' },
  { name: 'speed1', type: 'number', default: '0.05', description: 'How fast the first wave travels.' },
  { name: 'speed2', type: 'number', default: '0.05', description: 'How fast the second wave travels.' },
  {
    name: 'dir2',
    type: 'number',
    default: '1',
    description: 'Direction of the second wave. Use -1 to make it travel against the first.'
  },
  { name: 'bend1', type: 'number', default: '1', description: 'How far the first wave curls around its path.' },
  { name: 'bend2', type: 'number', default: '0.5', description: 'How far the second wave curls around its path.' },
  { name: 'thickness', type: 'number', default: '0.3', description: 'Thickness of the plasma ribbons.' },
  {
    name: 'focalLength',
    type: 'number',
    default: '1.25',
    description: 'Camera lens. Lower values give a wider, deeper view.'
  },
  { name: 'rotationDeg', type: 'number', default: '0', description: 'Rotation of the whole effect, in degrees.' },
  { name: 'xOffset', type: 'number', default: '0', description: 'Horizontal shift of the view, in px.' },
  { name: 'yOffset', type: 'number', default: '0', description: 'Vertical shift of the view, in px.' },
  { name: 'brightness', type: 'number', default: '1', description: 'Brightness of the plasma.' },
  { name: 'glow', type: 'number', default: '1', description: 'Strength of the soft light spilling around the plasma.' },
  {
    name: 'core',
    type: 'number',
    default: '0.6',
    description: 'How white-hot the brightest parts of the plasma get, from 0 to 1.'
  },
  { name: 'grain', type: 'number', default: '0.03', description: 'Strength of the film grain.' },
  {
    name: 'quality',
    type: 'number',
    default: '1',
    description: 'Detail of the plasma, from 0.25 to 1. Lower values render faster on slow devices.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Swells and brightens the plasma near the cursor.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Unfolds the plasma and fades it in on mount.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the plasma as glowing glass with white cores for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const PlasmaWaveDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const [color1, color2] = settings.colors;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    const tone = theme === 'light' ? LIGHT_COLORS[value] : {};
    updateProps({ ...base, ...PRESETS[value], ...tone, preset: value });
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
            <PlasmaWave key={key} {...settings} />
            <BackgroundContent headline="Plasma that glows and flows behind your hero." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="plasma-wave" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color 1"
              color={color1}
              onChange={value => updateProp('colors', [value, color2])}
            />
            <PreviewColorPickerCustom
              title="Color 2"
              color={color2}
              onChange={value => updateProp('colors', [color1, value])}
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
              title="Speed 1"
              min={0}
              max={0.2}
              step={0.005}
              value={settings.speed1}
              onChange={value => updateProp('speed1', value)}
            />
            <PreviewSlider
              title="Speed 2"
              min={0}
              max={0.2}
              step={0.005}
              value={settings.speed2}
              onChange={value => updateProp('speed2', value)}
            />
            <PreviewSlider
              title="Direction 2"
              min={-1}
              max={1}
              step={0.1}
              value={settings.dir2}
              onChange={value => updateProp('dir2', value)}
            />
            <PreviewSlider
              title="Bend 1"
              min={0}
              max={3}
              step={0.05}
              value={settings.bend1}
              onChange={value => updateProp('bend1', value)}
            />
            <PreviewSlider
              title="Bend 2"
              min={0}
              max={3}
              step={0.05}
              value={settings.bend2}
              onChange={value => updateProp('bend2', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.1}
              max={0.6}
              step={0.01}
              value={settings.thickness}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Focal Length"
              min={0.3}
              max={2}
              step={0.05}
              value={settings.focalLength}
              onChange={value => updateProp('focalLength', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={0}
              max={360}
              step={1}
              value={settings.rotationDeg}
              valueUnit="°"
              onChange={value => updateProp('rotationDeg', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.3}
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
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
              title="Core"
              min={0}
              max={1}
              step={0.05}
              value={settings.core}
              onChange={value => updateProp('core', value)}
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
            <PreviewSlider
              title="Quality"
              min={0.25}
              max={1}
              step={0.05}
              value={settings.quality}
              onChange={value => updateProp('quality', value)}
            />
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
          <CodeExample codeObject={plasmaWave} componentName="PlasmaWave" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PlasmaWaveDemo;
