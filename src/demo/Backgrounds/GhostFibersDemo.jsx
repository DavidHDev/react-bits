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

import GhostFibers from '@/content/Backgrounds/GhostFibers/GhostFibers';
import { ghostFibers } from '../../constants/code/Backgrounds/ghostFibersCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/GhostFibers';

const GRADIENT_OPTIONS = [
  { value: 'depth', label: 'Depth' },
  { value: 'along', label: 'Along' },
  { value: 'across', label: 'Across' }
];

const STYLE_OPTIONS = [
  { value: 'dots', label: 'Dots' },
  { value: 'dashes', label: 'Dashes' },
  { value: 'lines', label: 'Lines' }
];

const HOVER_OPTIONS = [
  { value: 'focus', label: 'Focus' },
  { value: 'part', label: 'Part' },
  { value: 'none', label: 'None' }
];

const propData = [
  { name: 'glowColor', type: 'string', default: "'#8b5cf6'", description: 'Main color of the fibers.' },
  {
    name: 'lineColor',
    type: 'string',
    default: '-',
    description: 'Color of the bright folds, sparkles and tips. Leave it out to use a pale tint of the glow color.'
  },
  {
    name: 'secondaryColor',
    type: 'string',
    default: '-',
    description: 'Second color the gradient blends toward. Leave it out to use a deeper shade of the glow color.'
  },
  {
    name: 'gradient',
    type: "'depth' | 'along' | 'across'",
    default: "'depth'",
    description: 'How the two colors blend: by distance, along the length of the ribbons, or across their width.'
  },
  { name: 'layers', type: 'number', default: '3', description: 'Number of ribbons, from 1 to 3.' },
  { name: 'waves', type: 'number', default: '1', description: 'How much the ribbons undulate. 0 keeps them straight.' },
  { name: 'twist', type: 'number', default: '1.2', description: 'How often the ribbons turn over along their length.' },
  {
    name: 'volume',
    type: 'number',
    default: '0.7',
    description: 'Thickness of each ribbon, from a single flat sheet at 0 to a layered bundle.'
  },
  { name: 'spread', type: 'number', default: '1', description: 'Width of the ribbons.' },
  { name: 'scale', type: 'number', default: '1', description: 'Size of the whole effect.' },
  { name: 'rotation', type: 'number', default: '18', description: 'Tilt of the whole effect, in degrees.' },
  {
    name: 'perspective',
    type: 'number',
    default: '0.65',
    description: 'How far the ribbons turn into the distance, from side-on at 0 to steeply receding at 1.'
  },
  { name: 'threads', type: 'number', default: '72', description: 'Number of fibers in each ribbon.' },
  { name: 'density', type: 'number', default: '1', description: 'Number of dots along each fiber.' },
  { name: 'thickness', type: 'number', default: '1', description: 'Size of the dots.' },
  {
    name: 'fiberStyle',
    type: "'dots' | 'dashes' | 'lines'",
    default: "'dots'",
    description: 'Draws the fibers as rows of dots, short dashes or continuous lines.'
  },
  {
    name: 'tips',
    type: 'number',
    default: '0',
    description: 'Cuts the fibers at different lengths and lights their ends, like fiber optics.'
  },
  {
    name: 'foldGlow',
    type: 'number',
    default: '1',
    description: 'Brightness of the light where the ribbons fold edge-on.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '0.5',
    description: 'Speed of the waves and the twist. 0 holds them still.'
  },
  {
    name: 'flow',
    type: 'number',
    default: '0.4',
    description: 'Speed of the dots along the fibers. Negative values reverse them.'
  },
  { name: 'rollSpeed', type: 'number', default: '0.15', description: 'How fast the ribbons roll around their length.' },
  {
    name: 'depthOfField',
    type: 'number',
    default: '0.85',
    description: 'Strength of the camera blur away from the focus. 0 keeps everything sharp.'
  },
  {
    name: 'focusDepth',
    type: 'number',
    default: '0',
    description: 'Moves the focus nearer with negative values or farther with positive ones.'
  },
  { name: 'particles', type: 'number', default: '0.5', description: 'Amount of dust floating around the ribbons.' },
  { name: 'sparkle', type: 'number', default: '0.5', description: 'How often single dots twinkle.' },
  { name: 'glow', type: 'number', default: '0.8', description: 'Strength of the bloom around the bright areas.' },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness.' },
  { name: 'vignette', type: 'number', default: '0.3', description: 'How much the edges fade out, from 0 to 1.' },
  { name: 'grain', type: 'number', default: '0.06', description: 'Strength of the film grain.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Lets the view follow the cursor slightly and turns on the hover effect.'
  },
  {
    name: 'hoverEffect',
    type: "'focus' | 'part' | 'none'",
    default: "'focus'",
    description: 'Pulls the focus to the ribbon under the cursor, parts the fibers around it, or does nothing.'
  },
  { name: 'mouseStrength', type: 'number', default: '1', description: 'Strength of the hover effect.' },
  {
    name: 'pulseOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Sends a pulse of light along the ribbon you click.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Draws the ribbons in from one end when the effect first appears.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the fibers as colored ink for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const GhostFibersDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const light = useColorModeValue(true, false);

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light, defaults: defaultProps }), preset: value });
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
            <GhostFibers key={key} {...settings} />
            <BackgroundContent headline="Ribbons of fine fibers that fold through the light." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="ghost-fibers" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Glow Color"
              color={settings.glowColor}
              onChange={value => updateProp('glowColor', value)}
            />
            <PreviewColorPickerCustom
              title="Line Color"
              color={settings.lineColor}
              onChange={value => updateProp('lineColor', value)}
            />
            <PreviewColorPickerCustom
              title="Secondary"
              color={settings.secondaryColor}
              onChange={value => updateProp('secondaryColor', value)}
            />
            <PreviewSelect
              title="Gradient"
              options={GRADIENT_OPTIONS}
              value={settings.gradient}
              onChange={value => updateProp('gradient', value)}
            />
            <PreviewSlider
              title="Layers"
              min={1}
              max={3}
              step={1}
              value={settings.layers}
              onChange={value => updateProp('layers', value)}
            />
            <PreviewSlider
              title="Waves"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.waves}
              onChange={value => updateProp('waves', value)}
            />
            <PreviewSlider
              title="Twist"
              min={0}
              max={3}
              step={0.05}
              value={settings.twist}
              onChange={value => updateProp('twist', value)}
            />
            <PreviewSlider
              title="Volume"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.volume}
              onChange={value => updateProp('volume', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0.4}
              max={2.5}
              step={0.05}
              value={settings.spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.5}
              max={2}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-90}
              max={90}
              step={1}
              value={settings.rotation}
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Perspective"
              min={0}
              max={1}
              step={0.01}
              value={settings.perspective}
              onChange={value => updateProp('perspective', value)}
            />
            <PreviewSelect
              title="Fiber Style"
              options={STYLE_OPTIONS}
              value={settings.fiberStyle}
              onChange={value => updateProp('fiberStyle', value)}
            />
            <PreviewSlider
              title="Threads"
              min={12}
              max={160}
              step={1}
              value={settings.threads}
              onChange={value => updateProp('threads', value)}
            />
            <PreviewSlider
              title="Density"
              min={0.3}
              max={2.5}
              step={0.05}
              value={settings.density}
              onChange={value => updateProp('density', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.thickness}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Tips"
              min={0}
              max={1}
              step={0.05}
              value={settings.tips}
              onChange={value => updateProp('tips', value)}
            />
            <PreviewSlider
              title="Fold Glow"
              min={0}
              max={3}
              step={0.05}
              value={settings.foldGlow}
              onChange={value => updateProp('foldGlow', value)}
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
              title="Flow"
              min={-1.5}
              max={1.5}
              step={0.05}
              value={settings.flow}
              onChange={value => updateProp('flow', value)}
            />
            <PreviewSlider
              title="Roll Speed"
              min={-1}
              max={1}
              step={0.01}
              value={settings.rollSpeed}
              onChange={value => updateProp('rollSpeed', value)}
            />
            <PreviewSlider
              title="Depth Of Field"
              min={0}
              max={2}
              step={0.05}
              value={settings.depthOfField}
              onChange={value => updateProp('depthOfField', value)}
            />
            <PreviewSlider
              title="Focus Depth"
              min={-1}
              max={1}
              step={0.05}
              value={settings.focusDepth}
              onChange={value => updateProp('focusDepth', value)}
            />
            <PreviewSlider
              title="Particles"
              min={0}
              max={2}
              step={0.05}
              value={settings.particles}
              onChange={value => updateProp('particles', value)}
            />
            <PreviewSlider
              title="Sparkle"
              min={0}
              max={2}
              step={0.05}
              value={settings.sparkle}
              onChange={value => updateProp('sparkle', value)}
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
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Vignette"
              min={0}
              max={1}
              step={0.05}
              value={settings.vignette}
              onChange={value => updateProp('vignette', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.3}
              step={0.01}
              value={settings.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSelect
              title="Hover Effect"
              options={HOVER_OPTIONS}
              value={settings.hoverEffect}
              onChange={value => updateProp('hoverEffect', value)}
            />
            <PreviewSlider
              title="Hover Strength"
              min={0}
              max={2}
              step={0.05}
              value={settings.mouseStrength}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Pulse On Click"
              isChecked={settings.pulseOnClick}
              onChange={value => updateProp('pulseOnClick', value)}
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
          <CodeExample codeObject={ghostFibers} componentName="GhostFibers" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GhostFibersDemo;
