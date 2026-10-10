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

import PixelSnow from '../../content/Backgrounds/PixelSnow/PixelSnow';
import { pixelSnow } from '../../constants/code/Backgrounds/pixelSnowCode';

const SNOWFALL = {
  variant: 'snowflake',
  density: 0.5,
  speed: 1,
  wind: 0.25,
  sway: 0.5,
  flakeSize: 1,
  pixelSize: 3,
  glow: 0.8,
  twinkle: 0.35,
  accumulate: false
};

const DEFAULT_PROPS = {
  preset: 'snowfall',
  color: '#ffffff',
  ...SNOWFALL,
  depth: 0.6,
  brightness: 1,
  fade: 0,
  opacity: 1,
  mouseInteraction: true,
  intro: true,
  lightMode: false
};

const PRESETS = {
  snowfall: SNOWFALL,
  calm: { ...SNOWFALL, density: 0.3, speed: 0.55, wind: 0, sway: 0.9, flakeSize: 1.3 },
  blizzard: { ...SNOWFALL, density: 1, speed: 2.2, wind: 1.4, sway: 0.2, flakeSize: 0.8, twinkle: 0.15 },
  drift: { ...SNOWFALL, density: 0.6, accumulate: true },
  retro: { ...SNOWFALL, variant: 'square', pixelSize: 5, glow: 0.3, twinkle: 0, sway: 0.3 }
};

const PRESET_OPTIONS = [
  { value: 'snowfall', label: 'Snowfall' },
  { value: 'calm', label: 'Calm' },
  { value: 'blizzard', label: 'Blizzard' },
  { value: 'drift', label: 'Drift' },
  { value: 'retro', label: 'Retro' }
];

const VARIANT_OPTIONS = [
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'square', label: 'Square' },
  { value: 'round', label: 'Round' }
];

const propData = [
  { name: 'color', type: 'string', default: "'#ffffff'", description: 'Color of the snow.' },
  {
    name: 'variant',
    type: "'snowflake' | 'square' | 'round'",
    default: "'snowflake'",
    description: 'Shape of the flakes: pixel crystals, square pixels or round pixels.'
  },
  { name: 'density', type: 'number', default: '0.5', description: 'How much snow is falling, from 0 to 1.' },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'How fast the snow falls. Negative values make it rise.'
  },
  {
    name: 'wind',
    type: 'number',
    default: '0.25',
    description: 'Sideways drift. Negative values blow to the left.'
  },
  { name: 'sway', type: 'number', default: '0.5', description: 'How much each flake swings as it falls.' },
  {
    name: 'flakeSize',
    type: 'number',
    default: '1',
    description: 'Size of the flakes, from 0 for mostly tiny specks to 2 for mostly large crystals.'
  },
  { name: 'pixelSize', type: 'number', default: '3', description: 'Size of one snow pixel in px.' },
  {
    name: 'depth',
    type: 'number',
    default: '0.6',
    description: 'How strongly far flakes fall slower and dimmer than near ones, from 0 to 1.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness of the snow.' },
  { name: 'glow', type: 'number', default: '0.8', description: 'Strength of the soft light around each flake.' },
  {
    name: 'twinkle',
    type: 'number',
    default: '0.35',
    description: 'How often flakes catch the light and sparkle, from 0 to 1.'
  },
  {
    name: 'accumulate',
    type: 'boolean',
    default: 'false',
    description: 'Lets the snow pile up in soft drifts along the bottom edge.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Lets the cursor brush the snow aside and stir it as it moves.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Lets the snow drift in from the top on mount.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the snow as colored pixels for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the snow in place.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const PixelSnowDemo = () => {
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
            <PixelSnow key={key} {...settings} />
            <BackgroundContent headline="Oh, the weather outside is frightful!" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="pixel-snow" currentProps={settings} defaultProps={DEFAULT_PROPS} />
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
            <PreviewSlider
              title="Density"
              min={0}
              max={1}
              step={0.05}
              value={settings.density}
              onChange={value => updateProp('density', value)}
            />
            <PreviewSlider
              title="Speed"
              min={-1}
              max={3}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Wind"
              min={-2}
              max={2}
              step={0.05}
              value={settings.wind}
              onChange={value => updateProp('wind', value)}
            />
            <PreviewSlider
              title="Sway"
              min={0}
              max={2}
              step={0.05}
              value={settings.sway}
              onChange={value => updateProp('sway', value)}
            />
            <PreviewSlider
              title="Flake Size"
              min={0}
              max={2}
              step={0.05}
              value={settings.flakeSize}
              onChange={value => updateProp('flakeSize', value)}
            />
            <PreviewSlider
              title="Pixel Size"
              min={1}
              max={8}
              step={1}
              value={settings.pixelSize}
              valueUnit="px"
              onChange={value => updateProp('pixelSize', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={1}
              step={0.05}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
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
              title="Twinkle"
              min={0}
              max={1}
              step={0.05}
              value={settings.twinkle}
              onChange={value => updateProp('twinkle', value)}
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
              title="Accumulate"
              isChecked={settings.accumulate}
              onChange={value => updateProp('accumulate', value)}
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
          <CodeExample codeObject={pixelSnow} componentName="PixelSnow" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PixelSnowDemo;
