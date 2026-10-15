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

import SideRays from '../../content/Backgrounds/SideRays/SideRays';
import { sideRays } from '../../constants/code/Backgrounds/sideRaysCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/SideRays';

const DEFAULT_PROPS = {
  preset: 'sunbeam',
  ...LOOK,
  followMouse: true,
  mouseInfluence: 0.5,
  intro: true,
  lightMode: false,
  opacity: 1
};

const ORIGIN_OPTIONS = [
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' }
];

const LIGHT_SWAP = {
  '#ffffff': '#64748b',
  '#e0e7ff': '#818cf8'
};

const propData = [
  {
    name: 'rayColor1',
    type: 'string',
    default: "'#FFC46B'",
    description: 'Color of the first layer of rays, on the upper side of the fan.'
  },
  {
    name: 'rayColor2',
    type: 'string',
    default: "'#96c8ff'",
    description: 'Color of the second layer of rays, on the lower side of the fan.'
  },
  {
    name: 'blend',
    type: 'number',
    default: '0.6',
    description: 'Balance between the two layers, from 0 (only the first color) to 1 (only the second).'
  },
  {
    name: 'origin',
    type: "'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'right' | 'left'",
    default: "'top-right'",
    description: 'Corner or side the light shines in from.'
  },
  { name: 'speed', type: 'number', default: '2.5', description: 'How fast the rays shimmer and sway. 0 freezes them.' },
  { name: 'intensity', type: 'number', default: '2', description: 'Brightness of the light.' },
  { name: 'spread', type: 'number', default: '2', description: 'How wide the rays fan out.' },
  {
    name: 'density',
    type: 'number',
    default: '5',
    description: 'How many separate rays the light breaks into. Higher values give finer rays.'
  },
  {
    name: 'sharpness',
    type: 'number',
    default: '0.5',
    description: 'How crisp the edges of the rays are, from soft haze at 0 to defined beams at 1.'
  },
  { name: 'tilt', type: 'number', default: '0', description: 'Rotates the rays, in degrees.' },
  {
    name: 'falloff',
    type: 'number',
    default: '1.6',
    description: 'How quickly the light fades with distance. Lower values let the rays reach further.'
  },
  { name: 'glow', type: 'number', default: '1', description: 'Brightness of the glow where the light enters.' },
  {
    name: 'saturation',
    type: 'number',
    default: '1',
    description: 'Color saturation of the light. 0 is grayscale.'
  },
  {
    name: 'dust',
    type: 'number',
    default: '0',
    description: 'Amount of dust drifting in the light, from 0 to 1. Specks only show inside the rays.'
  },
  {
    name: 'followMouse',
    type: 'boolean',
    default: 'true',
    description: 'The rays lean toward the cursor and the ray under it brightens.'
  },
  {
    name: 'mouseInfluence',
    type: 'number',
    default: '0.5',
    description: 'How strongly the rays follow the cursor, from 0 to 1.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'The rays grow out from their source on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Renders the rays as soft tinted light for light backgrounds.'
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

const swapColor = (value, light) => {
  const key = `#${String(value).replace(/^#/, '').toLowerCase()}`;
  return light ? (LIGHT_SWAP[key] ?? value) : value;
};

const SideRaysDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const colors = {
    rayColor1: swapColor(settings.rayColor1, settings.lightMode),
    rayColor2: swapColor(settings.rayColor2, settings.lightMode)
  };

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
      computedProps={colors}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <SideRays key={key} {...settings} {...colors} />
            <BackgroundContent headline="Light cascading from the corner." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="side-rays"
              currentProps={{ ...settings, ...colors }}
              defaultProps={DEFAULT_PROPS}
            />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Origin"
              options={ORIGIN_OPTIONS}
              value={settings.origin}
              onChange={value => updateProp('origin', value)}
            />
            <PreviewColorPickerCustom
              title="Ray Color 1"
              color={colors.rayColor1}
              onChange={value => updateProp('rayColor1', value)}
            />
            <PreviewColorPickerCustom
              title="Ray Color 2"
              color={colors.rayColor2}
              onChange={value => updateProp('rayColor2', value)}
            />
            <PreviewSlider
              title="Blend"
              min={0}
              max={1}
              step={0.01}
              value={settings.blend}
              onChange={value => updateProp('blend', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={6}
              step={0.1}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.2}
              max={4}
              step={0.05}
              value={settings.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0.3}
              max={4}
              step={0.05}
              value={settings.spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Density"
              min={1}
              max={20}
              step={0.5}
              value={settings.density}
              onChange={value => updateProp('density', value)}
            />
            <PreviewSlider
              title="Sharpness"
              min={0}
              max={1}
              step={0.01}
              value={settings.sharpness}
              onChange={value => updateProp('sharpness', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={-60}
              max={60}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Falloff"
              min={0.5}
              max={4}
              step={0.05}
              value={settings.falloff}
              onChange={value => updateProp('falloff', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={3}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
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
              title="Dust"
              min={0}
              max={1}
              step={0.01}
              value={settings.dust}
              onChange={value => updateProp('dust', value)}
            />
            <PreviewSlider
              title="Mouse Influence"
              min={0}
              max={1}
              step={0.01}
              value={settings.mouseInfluence}
              onChange={value => updateProp('mouseInfluence', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSwitch
              title="Follow Mouse"
              isChecked={settings.followMouse}
              onChange={value => updateProp('followMouse', value)}
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
          <CodeExample codeObject={sideRays} componentName="SideRays" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SideRaysDemo;
