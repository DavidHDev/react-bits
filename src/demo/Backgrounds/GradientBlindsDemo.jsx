import { Box, Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorMode } from '../../components/setup/color-mode';

import GradientBlinds from '../../content/Backgrounds/GradientBlinds/GradientBlinds';
import { gradientBlinds } from '../../constants/code/Backgrounds/gradientBlindsCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/GradientBlinds';

const DEFAULT_PROPS = {
  preset: 'satin',
  ...LOOK,
  intro: true,
  lightMode: false
};

const DIRECTION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const CLICK_OPTIONS = [
  { value: 'ripple', label: 'Ripple' },
  { value: 'none', label: 'None' }
];

const IDLE_OPTIONS = [
  { value: 'drift', label: 'Drift' },
  { value: 'center', label: 'Center' },
  { value: 'stay', label: 'Stay' }
];

const propData = [
  {
    name: 'gradientColors',
    type: 'string[]',
    default: "['#FF9FFC', '#5227FF']",
    description: 'Colors of the gradient across the blinds, up to 8. One color is used for every blind.'
  },
  {
    name: 'angle',
    type: 'number',
    default: '0',
    description: 'Rotation of the blinds in degrees. 0 stands them upright.'
  },
  {
    name: 'blindCount',
    type: 'number',
    default: '16',
    description: 'Number of blinds. Acts as an upper limit when blindMinWidth is set.'
  },
  {
    name: 'blindMinWidth',
    type: 'number',
    default: '60',
    description: 'Narrowest a blind can get, in px. Fewer blinds are drawn on small screens to respect it.'
  },
  {
    name: 'shineDirection',
    type: "'left' | 'right'",
    default: "'left'",
    description: 'Which edge of each blind catches the light.'
  },
  {
    name: 'lightColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the light that falls on the blinds. Warm or cool whites change the mood.'
  },
  {
    name: 'spotlightRadius',
    type: 'number',
    default: '0.5',
    description: 'Size of the light around the cursor, relative to the area.'
  },
  {
    name: 'spotlightSoftness',
    type: 'number',
    default: '1',
    description: 'How the light fades toward its edge. Higher values keep it brighter for longer, then drop off.'
  },
  {
    name: 'spotlightOpacity',
    type: 'number',
    default: '1',
    description: 'Strength of the light.'
  },
  {
    name: 'shine',
    type: 'number',
    default: '0.4',
    description: 'Soft highlight along the lit edge of each blind, strongest near the light, from 0 (matte) to 1.'
  },
  {
    name: 'relief',
    type: 'number',
    default: '0.5',
    description: 'Depth of the shadow where each blind tucks under the next, from 0 (flat) to 1.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '0.4',
    description: 'Soft haze of colored light around the cursor.'
  },
  {
    name: 'sway',
    type: 'number',
    default: '0.35',
    description: 'How much the blinds drift and turn on their own, as if in a breeze.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'Speed of the sway and of the drifting light.'
  },
  {
    name: 'hoverTilt',
    type: 'number',
    default: '0.6',
    description: 'How much the blinds near the cursor turn toward the light and brighten, from 0 to 1.'
  },
  {
    name: 'clickEffect',
    type: "'ripple' | 'none'",
    default: "'ripple'",
    description: 'Clicking sends a wave of light through the blinds, from slat to slat outward from the click.'
  },
  {
    name: 'idle',
    type: "'drift' | 'center' | 'stay'",
    default: "'drift'",
    description: 'What the light does while the cursor is away: wander slowly, return to the middle, or stay put.'
  },
  {
    name: 'perspective',
    type: 'number',
    default: '0',
    description: 'Makes the blinds recede to one side like a window seen at an angle, from -1 to 1.'
  },
  {
    name: 'gradientSpeed',
    type: 'number',
    default: '0',
    description: 'Drifts the colors across the blinds over time. 0 keeps them still.'
  },
  {
    name: 'mirrorGradient',
    type: 'boolean',
    default: 'false',
    description: 'Runs the gradient forward and back again instead of once across.'
  },
  {
    name: 'distortAmount',
    type: 'number',
    default: '0',
    description: 'Bends the blinds into soft waves.'
  },
  {
    name: 'noise',
    type: 'number',
    default: '0.3',
    description: 'Strength of the film grain, from 0 (clean) to 1.'
  },
  {
    name: 'mouseDampening',
    type: 'number',
    default: '0.15',
    description: 'How long the light takes to catch up with the cursor, in seconds. 0 follows instantly.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Fades the light in while the blinds turn into place on mount.'
  },
  {
    name: 'paused',
    type: 'boolean',
    default: 'false',
    description: 'Freezes the current frame.'
  },
  {
    name: 'mixBlendMode',
    type: 'string',
    default: "'lighten'",
    description: 'CSS blend mode of the blinds over the page in dark mode, so dark areas show the page behind.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the blinds as clean colored light on a white page.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const GradientBlindsDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: colorMode === 'light', defaults: defaultProps }), preset: value });
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
            <GradientBlinds key={key} {...settings} />
            <BackgroundContent headline="Let a little light into your next launch" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="gradient-blinds" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings.gradientColors}
              min={1}
              max={8}
              onChange={value => updateProp('gradientColors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Click Effect"
              options={CLICK_OPTIONS}
              value={settings.clickEffect}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewSelect
              title="Idle Light"
              options={IDLE_OPTIONS}
              value={settings.idle}
              onChange={value => updateProp('idle', value)}
            />
            <PreviewSelect
              title="Light Direction"
              options={DIRECTION_OPTIONS}
              value={settings.shineDirection}
              onChange={value => updateProp('shineDirection', value)}
            />
            <PreviewColorPickerCustom
              title="Light Color"
              color={settings.lightColor}
              onChange={value => updateProp('lightColor', value)}
            />
            <PreviewSlider
              title="Angle"
              min={-90}
              max={90}
              step={1}
              value={settings.angle}
              valueUnit="°"
              onChange={value => updateProp('angle', value)}
            />
            <PreviewSlider
              title="Blind Count"
              min={2}
              max={64}
              step={1}
              value={settings.blindCount}
              onChange={value => updateProp('blindCount', value)}
            />
            <PreviewSlider
              title="Min Blind Width"
              min={10}
              max={200}
              step={5}
              value={settings.blindMinWidth}
              valueUnit="px"
              onChange={value => updateProp('blindMinWidth', value)}
            />
            <PreviewSlider
              title="Spotlight Radius"
              min={0.1}
              max={1.5}
              step={0.01}
              value={settings.spotlightRadius}
              onChange={value => updateProp('spotlightRadius', value)}
            />
            <PreviewSlider
              title="Spotlight Softness"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.spotlightSoftness}
              onChange={value => updateProp('spotlightSoftness', value)}
            />
            <PreviewSlider
              title="Spotlight Opacity"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.spotlightOpacity}
              onChange={value => updateProp('spotlightOpacity', value)}
            />
            <PreviewSlider
              title="Shine"
              min={0}
              max={1}
              step={0.01}
              value={settings.shine}
              onChange={value => updateProp('shine', value)}
            />
            <PreviewSlider
              title="Relief"
              min={0}
              max={1}
              step={0.01}
              value={settings.relief}
              onChange={value => updateProp('relief', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.01}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Sway"
              min={0}
              max={1}
              step={0.01}
              value={settings.sway}
              onChange={value => updateProp('sway', value)}
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
              title="Hover Tilt"
              min={0}
              max={1}
              step={0.01}
              value={settings.hoverTilt}
              onChange={value => updateProp('hoverTilt', value)}
            />
            <PreviewSlider
              title="Perspective"
              min={-1}
              max={1}
              step={0.01}
              value={settings.perspective}
              onChange={value => updateProp('perspective', value)}
            />
            <PreviewSlider
              title="Gradient Speed"
              min={0}
              max={4}
              step={0.05}
              value={settings.gradientSpeed}
              onChange={value => updateProp('gradientSpeed', value)}
            />
            <PreviewSlider
              title="Distort"
              min={0}
              max={40}
              step={1}
              value={settings.distortAmount}
              onChange={value => updateProp('distortAmount', value)}
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
              title="Mouse Dampening"
              min={0}
              max={1}
              step={0.01}
              value={settings.mouseDampening}
              valueUnit="s"
              onChange={value => updateProp('mouseDampening', value)}
            />
            <PreviewSwitch
              title="Mirror Gradient"
              isChecked={settings.mirrorGradient}
              onChange={value => updateProp('mirrorGradient', value)}
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
          <CodeExample codeObject={gradientBlinds} componentName="GradientBlinds" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GradientBlindsDemo;
