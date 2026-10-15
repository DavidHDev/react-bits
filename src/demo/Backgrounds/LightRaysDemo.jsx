import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import LightRays from '../../content/Backgrounds/LightRays/LightRays';
import { lightRays } from '../../constants/code/Backgrounds/lightRaysCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/LightRays';

const DEFAULT_PROPS = {
  preset: 'spotlight',
  ...LOOK,
  followMouse: true,
  cursorShadow: true,
  clickPulse: true,
  intro: true,
  lightMode: false
};

const ORIGIN_OPTIONS = [
  { value: 'top-center', label: 'Top' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'bottom-center', label: 'Bottom' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' }
];

const propData = [
  {
    name: 'raysOrigin',
    type: 'RaysOrigin',
    default: "'top-center'",
    description:
      "Where the light comes from: 'top-center', 'top-left', 'top-right', 'left', 'right', 'bottom-center', 'bottom-left' or 'bottom-right'."
  },
  { name: 'raysColor', type: 'string', default: "'#ffffff'", description: 'Color of the light.' },
  { name: 'raysSpeed', type: 'number', default: '1', description: 'Animation speed. 0 freezes the rays.' },
  {
    name: 'lightSpread',
    type: 'number',
    default: '0.5',
    description: 'How wide the beam opens. Lower values give a tight spotlight.'
  },
  { name: 'rayLength', type: 'number', default: '3', description: 'How far the rays reach, in container widths.' },
  { name: 'rayDensity', type: 'number', default: '1', description: 'How many separate shafts the beam splits into.' },
  { name: 'tilt', type: 'number', default: '0', description: 'Turns the beam by this many degrees.' },
  {
    name: 'raySharpness',
    type: 'number',
    default: '0.35',
    description: 'How crisp the edges of the shafts are, from 0 to 1.'
  },
  { name: 'glow', type: 'number', default: '0.6', description: 'Brightness of the glow around the light source.' },
  {
    name: 'haze',
    type: 'number',
    default: '0.25',
    description: 'Drifting haze that breaks the shafts up, like dust in the air, from 0 to 1.'
  },
  {
    name: 'atmosphere',
    type: 'number',
    default: '1',
    description: 'How much the light cools toward blue as it travels away from the source, from 0 to 1.'
  },
  { name: 'intensity', type: 'number', default: '1', description: 'Overall brightness of the light.' },
  { name: 'pulsating', type: 'boolean', default: 'false', description: 'The rays slowly breathe brighter and dimmer.' },
  {
    name: 'fadeDistance',
    type: 'number',
    default: '1',
    description: 'How far the rays travel before they dim, in container widths.'
  },
  { name: 'saturation', type: 'number', default: '1', description: 'Color saturation of the light.' },
  {
    name: 'followMouse',
    type: 'boolean',
    default: 'true',
    description: 'The beam turns toward the cursor.'
  },
  {
    name: 'mouseInfluence',
    type: 'number',
    default: '0.1',
    description: 'How far the beam turns toward the cursor, from 0 to 1.'
  },
  {
    name: 'cursorShadow',
    type: 'boolean',
    default: 'true',
    description: 'The cursor blocks the light and casts a soft shadow down the rays.'
  },
  {
    name: 'clickPulse',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a wave of light down the rays.'
  },
  { name: 'noiseAmount', type: 'number', default: '0', description: 'Film grain over the rays, from 0 to 1.' },
  { name: 'distortion', type: 'number', default: '0', description: 'Makes the rays waver as if seen through heat.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'The rays grow out from the source on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Prints the light as soft colored ink so it sits on light pages.'
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

const LightRaysDemo = () => {
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
            <LightRays key={key} {...settings} />
            <BackgroundContent pillText="New Background" headline="May these lights guide you on your path" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="light-rays" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Rays Origin"
              options={ORIGIN_OPTIONS}
              value={settings.raysOrigin}
              onChange={value => updateProp('raysOrigin', value)}
            />
            <PreviewColorPickerCustom
              title="Rays Color"
              color={settings.raysColor}
              onChange={value => updateProp('raysColor', value)}
            />
            <PreviewSlider
              title="Rays Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings.raysSpeed}
              onChange={value => updateProp('raysSpeed', value)}
            />
            <PreviewSlider
              title="Light Spread"
              min={0.1}
              max={2}
              step={0.01}
              value={settings.lightSpread}
              onChange={value => updateProp('lightSpread', value)}
            />
            <PreviewSlider
              title="Ray Length"
              min={0.5}
              max={4}
              step={0.1}
              value={settings.rayLength}
              onChange={value => updateProp('rayLength', value)}
            />
            <PreviewSlider
              title="Ray Density"
              min={0.3}
              max={4}
              step={0.1}
              value={settings.rayDensity}
              onChange={value => updateProp('rayDensity', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={-60}
              max={60}
              step={1}
              value={settings.tilt}
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Ray Sharpness"
              min={0}
              max={1}
              step={0.05}
              value={settings.raySharpness}
              onChange={value => updateProp('raySharpness', value)}
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
              title="Haze"
              min={0}
              max={1}
              step={0.05}
              value={settings.haze}
              onChange={value => updateProp('haze', value)}
            />
            <PreviewSlider
              title="Atmosphere"
              min={0}
              max={1}
              step={0.05}
              value={settings.atmosphere}
              onChange={value => updateProp('atmosphere', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Fade Distance"
              min={0.3}
              max={2}
              step={0.05}
              value={settings.fadeDistance}
              onChange={value => updateProp('fadeDistance', value)}
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
              title="Mouse Influence"
              min={0}
              max={1}
              step={0.05}
              value={settings.mouseInfluence}
              onChange={value => updateProp('mouseInfluence', value)}
            />
            <PreviewSlider
              title="Noise Amount"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.noiseAmount}
              onChange={value => updateProp('noiseAmount', value)}
            />
            <PreviewSlider
              title="Distortion"
              min={0}
              max={1}
              step={0.05}
              value={settings.distortion}
              onChange={value => updateProp('distortion', value)}
            />
            <PreviewSwitch
              title="Pulsating"
              isChecked={settings.pulsating}
              onChange={value => updateProp('pulsating', value)}
            />
            <PreviewSwitch
              title="Follow Mouse"
              isChecked={settings.followMouse}
              onChange={value => updateProp('followMouse', value)}
            />
            <PreviewSwitch
              title="Cursor Shadow"
              isChecked={settings.cursorShadow}
              onChange={value => updateProp('cursorShadow', value)}
            />
            <PreviewSwitch
              title="Click Pulse"
              isChecked={settings.clickPulse}
              onChange={value => updateProp('clickPulse', value)}
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
          <CodeExample codeObject={lightRays} componentName="LightRays" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LightRaysDemo;
