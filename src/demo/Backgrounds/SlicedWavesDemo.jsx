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

import SlicedWaves from '@/content/Backgrounds/SlicedWaves/SlicedWaves';
import { slicedWaves } from '../../constants/code/Backgrounds/slicedWavesCode';

const PRISM = {
  color1: '#ffd9a8',
  color2: '#ff5fa2',
  color3: '#5b8cff',
  ribbons: 3,
  spacing: 28,
  barWidth: 0.5,
  ribbonHeight: 0.26,
  spread: 0.1,
  amplitude: 0.1,
  frequency: 1,
  perspective: 0.45,
  curve: 0.5,
  blur: 0.6,
  glow: 1,
  position: 0.78,
  slices: 0
};

const DEFAULT_PROPS = {
  preset: 'prism',
  ...PRISM,
  speed: 1,
  brightness: 1.25,
  rotation: 0,
  grain: 0.08,
  fade: 0,
  opacity: 1,
  mouseInteraction: true,
  intro: true,
  lightMode: false
};

const PRESETS = {
  prism: PRISM,
  neon: { ...PRISM, color1: '#8fe9ff', color2: '#ff6fae', color3: '#6a5cff' },
  ember: { ...PRISM, color1: '#ffc46b', color2: '#ff6a3d', color3: '#ff2d55' },
  aurora: { ...PRISM, color1: '#6dffc7', color2: '#4dc3ff', color3: '#5468ff', ribbons: 4, spread: 0.08 },
  ion: { ...PRISM, color1: '#ffffff', color2: '#7fa7ff', color3: '#3d5afe', blur: 0.9 },
  signal: { ...PRISM, slices: 6, spacing: 30, barWidth: 0.6, blur: 0.3 }
};

const LIGHT_COLORS = {
  prism: { color1: '#ff9d4d', color2: '#ff2d78', color3: '#3060ff' },
  neon: { color1: '#00a7c4', color2: '#ff2d78', color3: '#5a3dff' },
  ember: { color1: '#ff9a1f', color2: '#ff4a1c', color3: '#e0123c' },
  aurora: { color1: '#00b886', color2: '#0098e0', color3: '#3445ff' },
  ion: { color1: '#475569', color2: '#3b5bff', color3: '#1d2fd6' },
  signal: { color1: '#ff9d4d', color2: '#ff2d78', color3: '#3060ff' }
};

const PRESET_OPTIONS = [
  { value: 'prism', label: 'Prism' },
  { value: 'neon', label: 'Neon' },
  { value: 'ember', label: 'Ember' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'ion', label: 'Ion' },
  { value: 'signal', label: 'Signal' }
];

const propData = [
  { name: 'color1', type: 'string', default: "'#ffd9a8'", description: 'First color of the light.' },
  { name: 'color2', type: 'string', default: "'#ff5fa2'", description: 'Second color of the light.' },
  { name: 'color3', type: 'string', default: "'#5b8cff'", description: 'Third color of the light.' },
  { name: 'ribbons', type: 'number', default: '3', description: 'Number of waves of light, from 1 to 6.' },
  {
    name: 'spacing',
    type: 'number',
    default: '28',
    description: 'Distance between the bars in the middle of the view, in px.'
  },
  { name: 'barWidth', type: 'number', default: '0.5', description: 'Width of each bar, as a share of the spacing.' },
  {
    name: 'ribbonHeight',
    type: 'number',
    default: '0.26',
    description: 'Height of each wave, as a fraction of the view height.'
  },
  {
    name: 'spread',
    type: 'number',
    default: '0.1',
    description: 'Vertical distance between the waves, as a fraction of the view height.'
  },
  {
    name: 'amplitude',
    type: 'number',
    default: '0.1',
    description: 'How far the waves rise and fall, as a fraction of the view height.'
  },
  { name: 'frequency', type: 'number', default: '1', description: 'How many waves fit across the view.' },
  { name: 'speed', type: 'number', default: '1', description: 'Animation speed. Negative values reverse the waves.' },
  {
    name: 'perspective',
    type: 'number',
    default: '0.45',
    description: 'How much the strip of bars turns away from you, from 0 to 1.'
  },
  { name: 'curve', type: 'number', default: '0.5', description: 'How much the strip bends in depth, from 0 to 1.' },
  {
    name: 'blur',
    type: 'number',
    default: '0.6',
    description: 'Depth of field. Bars away from the focus soften, and the focus follows the cursor.'
  },
  { name: 'glow', type: 'number', default: '1', description: 'Strength of the soft light around each bar.' },
  {
    name: 'brightness',
    type: 'number',
    default: '1.25',
    description: 'Overall brightness. Where waves overlap, the light burns to white.'
  },
  {
    name: 'position',
    type: 'number',
    default: '0.78',
    description: 'Vertical position of the waves, from 0 at the top to 1 at the bottom.'
  },
  { name: 'rotation', type: 'number', default: '0', description: 'Rotation of the whole effect, in degrees.' },
  {
    name: 'slices',
    type: 'number',
    default: '0',
    description: 'Cuts the bars into segments like an LED display. 0 keeps them solid.'
  },
  { name: 'grain', type: 'number', default: '0.08', description: 'Strength of the film grain.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Pulls the focus to the bars under the cursor and lights them up.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Grows the bars in across the view on mount.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the bars as colored ink for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const SlicedWavesDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');

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
            <SlicedWaves key={key} {...settings} />
            <BackgroundContent headline="Waves of light, sliced and set in motion." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="sliced-waves" currentProps={settings} defaultProps={DEFAULT_PROPS} />
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
            <PreviewColorPickerCustom
              title="Color 3"
              color={settings.color3}
              onChange={value => updateProp('color3', value)}
            />
            <PreviewSlider
              title="Ribbons"
              min={1}
              max={6}
              step={1}
              value={settings.ribbons}
              onChange={value => updateProp('ribbons', value)}
            />
            <PreviewSlider
              title="Spacing"
              min={8}
              max={60}
              step={1}
              value={settings.spacing}
              valueUnit="px"
              onChange={value => updateProp('spacing', value)}
            />
            <PreviewSlider
              title="Bar Width"
              min={0.15}
              max={1}
              step={0.05}
              value={settings.barWidth}
              onChange={value => updateProp('barWidth', value)}
            />
            <PreviewSlider
              title="Ribbon Height"
              min={0.04}
              max={0.5}
              step={0.01}
              value={settings.ribbonHeight}
              onChange={value => updateProp('ribbonHeight', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={0.25}
              step={0.005}
              value={settings.spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Amplitude"
              min={0}
              max={0.25}
              step={0.005}
              value={settings.amplitude}
              onChange={value => updateProp('amplitude', value)}
            />
            <PreviewSlider
              title="Frequency"
              min={0.2}
              max={3}
              step={0.05}
              value={settings.frequency}
              onChange={value => updateProp('frequency', value)}
            />
            <PreviewSlider
              title="Speed"
              min={-2}
              max={2}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Perspective"
              min={0}
              max={1}
              step={0.05}
              value={settings.perspective}
              onChange={value => updateProp('perspective', value)}
            />
            <PreviewSlider
              title="Curve"
              min={0}
              max={1}
              step={0.05}
              value={settings.curve}
              onChange={value => updateProp('curve', value)}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={2}
              step={0.05}
              value={settings.blur}
              onChange={value => updateProp('blur', value)}
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
              title="Brightness"
              min={0.3}
              max={2.5}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Position"
              min={0}
              max={1}
              step={0.01}
              value={settings.position}
              onChange={value => updateProp('position', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-180}
              max={180}
              step={1}
              value={settings.rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Slices"
              min={0}
              max={14}
              step={1}
              value={settings.slices}
              onChange={value => updateProp('slices', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.2}
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
          <CodeExample codeObject={slicedWaves} componentName="SlicedWaves" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SlicedWavesDemo;
