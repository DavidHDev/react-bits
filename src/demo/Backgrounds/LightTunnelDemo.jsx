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

import LightTunnel from '../../content/Backgrounds/LightTunnel/LightTunnel';
import { lightTunnel } from '../../constants/code/Backgrounds/lightTunnelCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/LightTunnel';

const FLOW_OPTIONS = [
  { value: 'inward', label: 'Inward' },
  { value: 'outward', label: 'Outward' }
];

const propData = [
  { name: 'cableColor', type: 'string', default: "'#ffffff'", description: 'Color of the fibres.' },
  { name: 'pulseColor', type: 'string', default: "'#ffffff'", description: 'Color of the light pulses.' },
  {
    name: 'tunnelColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the soft glow around the fibres, shown when tunnelOpacity is above 0.'
  },
  {
    name: 'tunnelOpacity',
    type: 'number',
    default: '0',
    description: 'Strength of the soft glow around the fibres that tints the tunnel walls.'
  },
  { name: 'speed', type: 'number', default: '0.1', description: 'Overall speed of the tunnel.' },
  {
    name: 'flowDirection',
    type: "'inward' | 'outward'",
    default: "'inward'",
    description: 'Whether the pulses race into the tunnel or rush out toward you.'
  },
  { name: 'pulseSpeed', type: 'number', default: '2', description: 'How fast the pulses travel.' },
  { name: 'pulseLength', type: 'number', default: '0.28', description: 'Length of each pulse and its tail.' },
  {
    name: 'pulseBlend',
    type: 'number',
    default: '0.6',
    description: 'Softness of the pulses, from crisp sparks (0) to long soft streaks (1).'
  },
  { name: 'pulseWidth', type: 'number', default: '1', description: 'Width of the pulses relative to the fibres.' },
  {
    name: 'pulseDensity',
    type: 'number',
    default: '0.5',
    description: 'How many pulses are travelling at once, from 0 to 1.'
  },
  { name: 'cableCount', type: 'number', default: '56', description: 'Number of fibres around the tunnel.' },
  { name: 'thickness', type: 'number', default: '0.35', description: 'Thickness of the fibres.' },
  { name: 'rimWidth', type: 'number', default: '0.15', description: 'How far the glow spreads around each pulse.' },
  { name: 'waviness', type: 'number', default: '0.3', description: 'How much the fibres swirl along the tunnel.' },
  { name: 'sway', type: 'number', default: '0.5', description: 'How much the tunnel slowly rocks back and forth.' },
  {
    name: 'bend',
    type: 'number',
    default: '0.4',
    description: 'How much the far end of the tunnel drifts and curves.'
  },
  { name: 'size', type: 'number', default: '1', description: 'Scale of the tunnel.' },
  { name: 'centerX', type: 'number', default: '0', description: 'Horizontal offset of the tunnel center.' },
  { name: 'centerY', type: 'number', default: '0', description: 'Vertical offset of the tunnel center.' },
  { name: 'glow', type: 'number', default: '1', description: 'Strength of the glow around the pulses.' },
  {
    name: 'fadeNear',
    type: 'number',
    default: '0.5',
    description: 'How far from the center the tunnel fades in. Higher values keep the middle clear.'
  },
  {
    name: 'fadeFar',
    type: 'number',
    default: '2',
    description: 'Distance at which the tunnel fades out at the edges.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness.' },
  {
    name: 'colorVariance',
    type: 'boolean',
    default: 'true',
    description: 'Gives every fibre a slightly different brightness.'
  },
  { name: 'grain', type: 'boolean', default: 'false', description: 'Adds a fine film grain to the light.' },
  { name: 'grainIntensity', type: 'number', default: '0.05', description: 'Strength of the grain.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Steers the far end of the tunnel toward the cursor.'
  },
  { name: 'mouseStrength', type: 'number', default: '0.1', description: 'How far the cursor steers the tunnel.' },
  {
    name: 'clickSurge',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ring of light down the tunnel.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Grows the tunnel out from the center on mount.' },
  {
    name: 'variation',
    type: 'number',
    default: '0',
    description: 'Picks a different arrangement of fibres and pulses.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the tunnel as ink for light backgrounds.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const LightTunnelDemo = () => {
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
            <LightTunnel key={key} {...settings} />
            <BackgroundContent headline="A fibre-optic tunnel of travelling light." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="light-tunnel" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Fibre Color"
              color={settings.cableColor}
              onChange={value => updateProp('cableColor', value)}
            />
            <PreviewColorPickerCustom
              title="Pulse Color"
              color={settings.pulseColor}
              onChange={value => updateProp('pulseColor', value)}
            />
            <PreviewColorPickerCustom
              title="Tunnel Color"
              color={settings.tunnelColor}
              onChange={value => updateProp('tunnelColor', value)}
            />
            <PreviewSlider
              title="Tunnel Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings.tunnelOpacity}
              onChange={value => updateProp('tunnelOpacity', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2.5}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSelect
              title="Flow Direction"
              options={FLOW_OPTIONS}
              value={settings.flowDirection}
              onChange={value => updateProp('flowDirection', value)}
            />
            <PreviewSlider
              title="Pulse Speed"
              min={0}
              max={5}
              step={0.05}
              value={settings.pulseSpeed}
              onChange={value => updateProp('pulseSpeed', value)}
            />
            <PreviewSlider
              title="Pulse Length"
              min={0.05}
              max={0.8}
              step={0.01}
              value={settings.pulseLength}
              onChange={value => updateProp('pulseLength', value)}
            />
            <PreviewSlider
              title="Pulse Blend"
              min={0}
              max={1}
              step={0.01}
              value={settings.pulseBlend}
              onChange={value => updateProp('pulseBlend', value)}
            />
            <PreviewSlider
              title="Pulse Width"
              min={0.2}
              max={2.5}
              step={0.05}
              value={settings.pulseWidth}
              onChange={value => updateProp('pulseWidth', value)}
            />
            <PreviewSlider
              title="Pulse Density"
              min={0}
              max={1}
              step={0.01}
              value={settings.pulseDensity}
              onChange={value => updateProp('pulseDensity', value)}
            />
            <PreviewSlider
              title="Fibres"
              min={12}
              max={140}
              step={1}
              value={settings.cableCount}
              onChange={value => updateProp('cableCount', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.05}
              max={1.2}
              step={0.01}
              value={settings.thickness}
              onChange={value => updateProp('thickness', value)}
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
              title="Rim Width"
              min={0}
              max={1}
              step={0.01}
              value={settings.rimWidth}
              onChange={value => updateProp('rimWidth', value)}
            />
            <PreviewSlider
              title="Waviness"
              min={0}
              max={1}
              step={0.01}
              value={settings.waviness}
              onChange={value => updateProp('waviness', value)}
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
              title="Bend"
              min={0}
              max={1.5}
              step={0.01}
              value={settings.bend}
              onChange={value => updateProp('bend', value)}
            />
            <PreviewSlider
              title="Size"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.size}
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Fade Near"
              min={0.01}
              max={0.8}
              step={0.01}
              value={settings.fadeNear}
              onChange={value => updateProp('fadeNear', value)}
            />
            <PreviewSlider
              title="Fade Far"
              min={0.6}
              max={3}
              step={0.05}
              value={settings.fadeFar}
              onChange={value => updateProp('fadeFar', value)}
            />
            <PreviewSlider
              title="Cursor Strength"
              min={0}
              max={0.4}
              step={0.01}
              value={settings.mouseStrength}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSwitch
              title="Cursor Steer"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Surge"
              isChecked={settings.clickSurge}
              onChange={value => updateProp('clickSurge', value)}
            />
            <PreviewSwitch
              title="Color Variance"
              isChecked={settings.colorVariance}
              onChange={value => updateProp('colorVariance', value)}
            />
            <PreviewSwitch title="Grain" isChecked={settings.grain} onChange={value => updateProp('grain', value)} />
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
          <CodeExample codeObject={lightTunnel} componentName="LightTunnel" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LightTunnelDemo;
