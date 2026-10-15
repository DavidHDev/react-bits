import { Box, Flex, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import SplashCursor from '../../content/Animations/SplashCursor/SplashCursor';
import { splashCursor } from '../../constants/code/Animations/splashCursorCode';
import { LOOK, CLASSIC, PRESET_OPTIONS, presetProps } from './presets/SplashCursor';

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  ...CLASSIC,
  quality: 'high',
  clickSplash: true,
  intro: true,
  contained: false
};

const LIGHT_SWAP = {
  '#a855f7': '#9333ea',
  '#e4e4e7': '#3f3f46',
  '#3b82f6': '#1d4ed8'
};

const DARK_SWAP = Object.fromEntries(Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]));

const QUALITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#4f8cff', '#2dd4bf', '#ffd166']",
    description: 'Palette the ink cycles through when rainbow is off.'
  },
  {
    name: 'rainbow',
    type: 'boolean',
    default: 'true',
    description: 'Cycles through the full spectrum instead of the palette.'
  },
  {
    name: 'colorSpeed',
    type: 'number',
    default: '1',
    description: 'How fast the colors shift while you move. 0 keeps one color per stroke.'
  },
  { name: 'intensity', type: 'number', default: '1', description: 'How much ink each movement leaves behind.' },
  { name: 'size', type: 'number', default: '1', description: 'Width of the stroke and the splash.' },
  { name: 'force', type: 'number', default: '1', description: 'How hard the cursor pushes the fluid.' },
  { name: 'swirl', type: 'number', default: '3', description: 'Amount of curling eddies in the flow.' },
  {
    name: 'trail',
    type: 'number',
    default: '1',
    description: 'How long the ink lingers before it fades. 2 lasts twice as long.'
  },
  {
    name: 'momentum',
    type: 'number',
    default: '1',
    description: 'How long the fluid keeps moving after the cursor stops.'
  },
  { name: 'shading', type: 'number', default: '1', description: 'Depth shading on the ripples, from 0 to 1.' },
  { name: 'glow', type: 'number', default: '0', description: 'Soft bloom around the brightest ink, from 0 to 1.' },
  {
    name: 'quality',
    type: "'low' | 'medium' | 'high'",
    default: "'high'",
    description: 'Simulation detail. Lower settings are lighter on older devices.'
  },
  { name: 'clickSplash', type: 'boolean', default: 'true', description: 'Bursts a splash where you click or tap.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Plays a short stroke across the screen on mount.' },
  {
    name: 'contained',
    type: 'boolean',
    default: 'false',
    description: 'Fills the parent element instead of the whole viewport and only reacts inside it.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Glowing ink for dark backgrounds or absorbing ink for light ones.'
  },
  { name: 'zIndex', type: 'number', default: '50', description: 'Stacking order of the effect over your content.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const SplashCursorDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, colors, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const swap = theme === 'light' ? LIGHT_SWAP : DARK_SWAP;
  const shown = (colors?.length ? colors : LOOK.colors).map(color => swap[color.toLowerCase()] ?? color);

  const applyPreset = value => {
    updateProps({ ...presetProps(value), preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'colors']}
      computedProps={{ colors: shown, ...(theme === 'light' ? { theme: 'light' } : {}) }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={500}
            p={0}
            overflow="hidden"
            style={{ cursor: 'crosshair' }}
          >
            <Flex position="absolute" inset={0} align="center" justify="center" pointerEvents="none">
              <Text fontSize="14px" color="var(--text-muted)" userSelect="none">
                Move your cursor
              </Text>
            </Flex>
            {settings.contained && <SplashCursor key={key} theme={theme} colors={shown} {...settings} />}
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="splash-cursor"
              currentProps={{ ...settings, colors: shown }}
              defaultProps={LOOK}
            />
          </Flex>

          <Customize>
            {!settings.rainbow && (
              <PreviewColorList
                title="Colors"
                colors={shown}
                min={1}
                max={6}
                onChange={value => updateProp('colors', value)}
              />
            )}
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Quality"
              options={QUALITY_OPTIONS}
              value={settings.quality}
              onChange={value => updateProp('quality', value)}
            />
            <PreviewSlider
              title="Color Speed"
              min={0}
              max={4}
              step={0.05}
              value={settings.colorSpeed}
              onChange={value => updateProp('colorSpeed', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.2}
              max={3}
              step={0.05}
              value={settings.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Size"
              min={0.2}
              max={4}
              step={0.05}
              value={settings.size}
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Force"
              min={0}
              max={3}
              step={0.05}
              value={settings.force}
              onChange={value => updateProp('force', value)}
            />
            <PreviewSlider
              title="Swirl"
              min={0}
              max={40}
              step={0.5}
              value={settings.swirl}
              onChange={value => updateProp('swirl', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0.2}
              max={5}
              step={0.05}
              value={settings.trail}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Momentum"
              min={0.2}
              max={5}
              step={0.05}
              value={settings.momentum}
              onChange={value => updateProp('momentum', value)}
            />
            <PreviewSlider
              title="Shading"
              min={0}
              max={1}
              step={0.01}
              value={settings.shading}
              onChange={value => updateProp('shading', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.01}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSwitch
              title="Rainbow"
              isChecked={settings.rainbow}
              onChange={value => updateProp('rainbow', value)}
            />
            <PreviewSwitch
              title="Click Splash"
              isChecked={settings.clickSplash}
              onChange={value => updateProp('clickSplash', value)}
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
              title="Contained"
              isChecked={settings.contained}
              onChange={value => updateProp('contained', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={splashCursor} componentName="SplashCursor" />
        </CodeTab>
      </TabsLayout>

      {!settings.contained && <SplashCursor key={key} theme={theme} colors={shown} {...settings} />}
    </ComponentPropsProvider>
  );
};

export default SplashCursorDemo;
