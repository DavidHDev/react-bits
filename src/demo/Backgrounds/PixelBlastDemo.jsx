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
import { useColorMode } from '../../components/setup/color-mode';

import PixelBlast from '../../content/Backgrounds/PixelBlast/PixelBlast';
import { pixelBlast } from '../../constants/code/Backgrounds/pixelBlastCode';

const LOOK = {
  color: '#B497CF',
  accentColor: '#B497CF',
  variant: 'square',
  pixelSize: 3,
  patternScale: 2,
  patternDensity: 1,
  pixelSizeJitter: 0,
  softness: 0.6,
  smoothing: 1,
  glow: 0.4,
  twinkle: 0.25,
  speed: 0.5,
  drift: 0.2,
  driftAngle: 30,
  hoverEffect: 'reveal',
  hoverRadius: 140,
  enableRipples: true,
  rippleSpeed: 0.3,
  rippleThickness: 0.1,
  rippleIntensityScale: 1,
  autoRipple: 0,
  edgeFade: 0.25,
  tiltX: 0,
  tiltY: 0
};

const DEFAULT_PROPS = {
  preset: 'blast',
  ...LOOK,
  intro: true,
  lightMode: false
};

const PRESETS = {
  blast: {},
  classic: {
    softness: 0,
    smoothing: 0,
    glow: 0,
    twinkle: 0,
    drift: 0,
    hoverEffect: 'none'
  },
  mono: {
    color: '#71717A',
    accentColor: '#F4F4F5',
    pixelSize: 2,
    patternScale: 2.6,
    patternDensity: 1.1,
    glow: 0.3,
    hoverEffect: 'grow'
  },
  ember: {
    color: '#9A3412',
    accentColor: '#FDBA74',
    patternScale: 1.6,
    patternDensity: 1.15,
    glow: 0.6,
    twinkle: 0.4,
    drift: 0.35,
    driftAngle: 90
  },
  dots: {
    color: '#7DD3FC',
    accentColor: '#E0F2FE',
    variant: 'circle',
    pixelSize: 7,
    pixelSizeJitter: 0.5,
    patternScale: 2.4,
    patternDensity: 1.25,
    softness: 1,
    glow: 0.3
  },
  stars: {
    color: '#A1A1AA',
    accentColor: '#FDE68A',
    variant: 'cross',
    pixelSize: 6,
    pixelSizeJitter: 0.6,
    patternScale: 3,
    patternDensity: 1.1,
    twinkle: 0.75,
    glow: 0.2,
    speed: 0.3,
    hoverEffect: 'grow'
  },
  horizon: {
    pixelSize: 3,
    patternDensity: 1.1,
    drift: 0.6,
    driftAngle: 90,
    edgeFade: 0.15,
    tiltX: 58
  },
  storm: {
    color: '#818CF8',
    accentColor: '#E0E7FF',
    patternScale: 2.4,
    speed: 1,
    glow: 0.5,
    autoRipple: 1.6,
    rippleSpeed: 0.45,
    rippleIntensityScale: 1.4,
    hoverEffect: 'grow'
  }
};

const LIGHT_SWAP = {
  blast: { color: '#6D28D9', accentColor: '#6D28D9' },
  classic: { color: '#6D28D9', accentColor: '#6D28D9' },
  mono: { color: '#A1A1AA', accentColor: '#18181B' },
  ember: { color: '#FDBA74', accentColor: '#C2410C' },
  dots: { color: '#38BDF8', accentColor: '#0369A1' },
  stars: { color: '#A1A1AA', accentColor: '#D97706' },
  horizon: { color: '#6D28D9', accentColor: '#6D28D9' },
  storm: { color: '#818CF8', accentColor: '#3730A3' }
};

const PRESET_OPTIONS = [
  { value: 'blast', label: 'Blast' },
  { value: 'classic', label: 'Classic' },
  { value: 'mono', label: 'Mono' },
  { value: 'ember', label: 'Ember' },
  { value: 'dots', label: 'Dots' },
  { value: 'stars', label: 'Stars' },
  { value: 'horizon', label: 'Horizon' },
  { value: 'storm', label: 'Storm' }
];

const VARIANT_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'cross', label: 'Cross' },
  { value: 'ring', label: 'Ring' }
];

const HOVER_OPTIONS = [
  { value: 'reveal', label: 'Reveal' },
  { value: 'grow', label: 'Grow' },
  { value: 'none', label: 'None' }
];

const propData = [
  { name: 'color', type: 'string', default: "'#B497CF'", description: 'Color of the pixels.' },
  {
    name: 'accentColor',
    type: 'string',
    default: 'color',
    description: 'Color the densest areas, ripples and the area under the cursor shift toward.'
  },
  {
    name: 'variant',
    type: "'square' | 'circle' | 'triangle' | 'diamond' | 'cross' | 'ring'",
    default: "'square'",
    description: 'Shape of each pixel.'
  },
  { name: 'pixelSize', type: 'number', default: '3', description: 'Size of each pixel, in px.' },
  {
    name: 'patternScale',
    type: 'number',
    default: '2',
    description: 'Zoom of the cloud pattern. Higher values make smaller, busier clouds.'
  },
  {
    name: 'patternDensity',
    type: 'number',
    default: '1',
    description: 'How many pixels light up. Higher values fill more of the area.'
  },
  {
    name: 'pixelSizeJitter',
    type: 'number',
    default: '0',
    description: 'Random size variation between pixels, from 0 to 1.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '0.6',
    description: 'Lets pixels grow and shrink smoothly as the pattern moves, instead of popping on and off.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '1',
    description: 'Smooths the edges of the clouds. 0 keeps the original blocky steps.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '0.4',
    description: 'Soft light behind the densest areas, and a hot core in ripples.'
  },
  {
    name: 'twinkle',
    type: 'number',
    default: '0.25',
    description: 'Lets pixels shimmer at their own pace, from 0 to 1.'
  },
  { name: 'speed', type: 'number', default: '0.5', description: 'How fast the clouds change shape.' },
  {
    name: 'drift',
    type: 'number',
    default: '0.2',
    description: 'How fast the clouds slide across the area. 0 keeps them in place.'
  },
  { name: 'driftAngle', type: 'number', default: '30', description: 'Direction of the drift, in degrees.' },
  {
    name: 'hoverEffect',
    type: "'reveal' | 'grow' | 'none'",
    default: "'reveal'",
    description: 'What the cursor does: light up more pixels around it, or make nearby pixels swell and brighten.'
  },
  {
    name: 'hoverRadius',
    type: 'number',
    default: '140',
    description: 'Size of the area the cursor affects, in px.'
  },
  {
    name: 'enableRipples',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ring of pixels out from the click.'
  },
  { name: 'rippleSpeed', type: 'number', default: '0.3', description: 'How fast ripples spread.' },
  { name: 'rippleThickness', type: 'number', default: '0.1', description: 'Width of the ripple ring.' },
  { name: 'rippleIntensityScale', type: 'number', default: '1', description: 'Brightness of ripples.' },
  {
    name: 'autoRipple',
    type: 'number',
    default: '0',
    description: 'Sends a ripple from a random spot about this many seconds apart. 0 turns it off.'
  },
  {
    name: 'tiltX',
    type: 'number',
    default: '0',
    description: 'Tilts the pixels back into a floor that fades toward the horizon, in degrees.'
  },
  { name: 'tiltY', type: 'number', default: '0', description: 'Turns the pixels sideways in perspective, in degrees.' },
  {
    name: 'edgeFade',
    type: 'number',
    default: '0.5',
    description: 'Fades the pixels out toward the edges, from 0 to 1.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Blasts the pixels out from the center in a ring on mount.'
  },
  { name: 'noiseAmount', type: 'number', default: '0', description: 'Film grain on the pixels.' },
  {
    name: 'transparent',
    type: 'boolean',
    default: 'true',
    description: 'Shows the page behind the pixels. Turn off for a solid black, or white in light mode, backdrop.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Darkens hot pixels instead of brightening them, for light pages.'
  },
  {
    name: 'variation',
    type: 'number',
    default: 'random',
    description: 'Picks a fixed pattern. Leave it out for a different one on every mount.'
  },
  {
    name: 'autoPauseOffscreen',
    type: 'boolean',
    default: 'true',
    description: 'Stops rendering while the background is scrolled out of view.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: '-', description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const PixelBlastDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({
      ...LOOK,
      ...PRESETS[value],
      ...(colorMode === 'light' ? LIGHT_SWAP[value] : null),
      preset: value
    });
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
            <PixelBlast key={key} {...settings} />
            <BackgroundContent headline="It's dangerous to go alone! Take this." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="pixel-blast" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Accent Color"
              color={settings.accentColor}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSelect
              title="Variant"
              options={VARIANT_OPTIONS}
              value={settings.variant}
              onChange={value => updateProp('variant', value)}
            />
            <PreviewSelect
              title="Hover Effect"
              options={HOVER_OPTIONS}
              value={settings.hoverEffect}
              onChange={value => updateProp('hoverEffect', value)}
            />
            <PreviewSlider
              title="Pixel Size"
              min={1}
              max={12}
              step={0.5}
              value={settings.pixelSize}
              valueUnit="px"
              onChange={value => updateProp('pixelSize', value)}
            />
            <PreviewSlider
              title="Pattern Scale"
              min={0.5}
              max={5}
              step={0.1}
              value={settings.patternScale}
              onChange={value => updateProp('patternScale', value)}
            />
            <PreviewSlider
              title="Pattern Density"
              min={0.5}
              max={2}
              step={0.01}
              value={settings.patternDensity}
              onChange={value => updateProp('patternDensity', value)}
            />
            <PreviewSlider
              title="Pixel Jitter"
              min={0}
              max={1}
              step={0.01}
              value={settings.pixelSizeJitter}
              onChange={value => updateProp('pixelSizeJitter', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.01}
              value={settings.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0}
              max={1}
              step={0.01}
              value={settings.smoothing}
              onChange={value => updateProp('smoothing', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1.5}
              step={0.01}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Twinkle"
              min={0}
              max={1}
              step={0.01}
              value={settings.twinkle}
              onChange={value => updateProp('twinkle', value)}
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
              title="Drift"
              min={0}
              max={2}
              step={0.05}
              value={settings.drift}
              onChange={value => updateProp('drift', value)}
            />
            <PreviewSlider
              title="Drift Angle"
              min={0}
              max={360}
              step={1}
              value={settings.driftAngle}
              valueUnit="°"
              isDisabled={!settings.drift}
              onChange={value => updateProp('driftAngle', value)}
            />
            <PreviewSlider
              title="Hover Radius"
              min={40}
              max={400}
              step={10}
              value={settings.hoverRadius}
              valueUnit="px"
              isDisabled={settings.hoverEffect === 'none'}
              onChange={value => updateProp('hoverRadius', value)}
            />
            <PreviewSlider
              title="Ripple Speed"
              min={0.05}
              max={1}
              step={0.01}
              value={settings.rippleSpeed}
              isDisabled={!settings.enableRipples}
              onChange={value => updateProp('rippleSpeed', value)}
            />
            <PreviewSlider
              title="Ripple Thickness"
              min={0.02}
              max={0.4}
              step={0.01}
              value={settings.rippleThickness}
              isDisabled={!settings.enableRipples}
              onChange={value => updateProp('rippleThickness', value)}
            />
            <PreviewSlider
              title="Ripple Intensity"
              min={0.2}
              max={3}
              step={0.05}
              value={settings.rippleIntensityScale}
              isDisabled={!settings.enableRipples}
              onChange={value => updateProp('rippleIntensityScale', value)}
            />
            <PreviewSlider
              title="Auto Ripple"
              min={0}
              max={6}
              step={0.1}
              value={settings.autoRipple}
              valueUnit="s"
              isDisabled={!settings.enableRipples}
              onChange={value => updateProp('autoRipple', value)}
            />
            <PreviewSlider
              title="Tilt X"
              min={-70}
              max={70}
              step={1}
              value={settings.tiltX}
              valueUnit="°"
              onChange={value => updateProp('tiltX', value)}
            />
            <PreviewSlider
              title="Tilt Y"
              min={-70}
              max={70}
              step={1}
              value={settings.tiltY}
              valueUnit="°"
              onChange={value => updateProp('tiltY', value)}
            />
            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={1}
              step={0.01}
              value={settings.edgeFade}
              onChange={value => updateProp('edgeFade', value)}
            />
            <PreviewSwitch
              title="Ripples"
              isChecked={settings.enableRipples}
              onChange={value => updateProp('enableRipples', value)}
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
          <CodeExample codeObject={pixelBlast} componentName="PixelBlast" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PixelBlastDemo;
