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

import FluxLines from '../../content/Backgrounds/FluxLines/FluxLines';
import { fluxLines } from '../../constants/code/Backgrounds/fluxLinesCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/FluxLines';

const FLOW_OPTIONS = [
  { value: 'down', label: 'Down' },
  { value: 'up', label: 'Up' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#ffffff', '#ffffff', '#ffffff']",
    description: 'Up to 8 colors blended along the lines. A single color makes every line the same.'
  },
  { name: 'speed', type: 'number', default: '0.5', description: 'How fast the fluid churns and flows.' },
  {
    name: 'scale',
    type: 'number',
    default: '1.6',
    description: 'Zoom of the pattern. Higher values show bigger, fewer shapes.'
  },
  { name: 'turbulence', type: 'number', default: '1', description: 'How much the flow swirls and distorts.' },
  {
    name: 'fluidity',
    type: 'number',
    default: '0.1',
    description: 'How smoothly the two layers of the fluid merge. Higher values give softer, rounder lines.'
  },
  { name: 'rimWidth', type: 'number', default: '0.2', description: 'Thickness of the glow around each line.' },
  { name: 'sharpness', type: 'number', default: '2.5', description: 'Falloff of the glow. Higher values are tighter.' },
  {
    name: 'shimmer',
    type: 'number',
    default: '1.5',
    description: 'How much the lines break up into separate strokes. 0 shows every line.'
  },
  { name: 'glow', type: 'number', default: '2', description: 'Brightness of the lines.' },
  {
    name: 'lineWidth',
    type: 'number',
    default: '1',
    description: 'Width of the crisp core inside each line, in pixels. 0 keeps only the glow.'
  },
  {
    name: 'flowDirection',
    type: "'up' | 'down' | 'left' | 'right'",
    default: "'down'",
    description: 'Main direction the fluid drifts.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Turns the cursor into a magnet that reveals and curls the lines around it.'
  },
  { name: 'mouseStrength', type: 'number', default: '1', description: 'Strength of the cursor magnet.' },
  {
    name: 'mouseRadius',
    type: 'number',
    default: '0.35',
    description: 'Reach of the cursor magnet, as a fraction of the height.'
  },
  {
    name: 'mouseDampening',
    type: 'number',
    default: '0.15',
    description: 'Time in seconds the magnet takes to catch up with the cursor. 0 follows instantly.'
  },
  { name: 'clickSwirl', type: 'boolean', default: 'true', description: 'Clicking stirs the fluid into a swirl.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Fades the lines in on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the lines as ink for light backgrounds.'
  },
  {
    name: 'transparent',
    type: 'boolean',
    default: 'true',
    description: 'Lets the page show through. When off, the lines sit on the background color.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'#120f17'",
    description: 'Background color when transparent is off. Defaults to white in light mode.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the flow.' },
  { name: 'mixBlendMode', type: 'string', default: '-', description: 'CSS mix-blend-mode applied to the container.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const FluxLinesDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
  };

  const setColor = (index, value) => {
    const next = [0, 1, 2].map(i => settings.colors?.[i] ?? settings.colors?.[0] ?? '#ffffff');
    next[index] = value;
    updateProp('colors', next);
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
            <FluxLines key={key} {...settings} />
            <BackgroundContent headline="Follow the lines of force" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="flux-lines" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            {[0, 1, 2].map(index => (
              <PreviewColorPickerCustom
                key={index}
                title={`Color ${index + 1}`}
                color={settings.colors?.[index] ?? settings.colors?.[0] ?? '#ffffff'}
                onChange={value => setColor(index, value)}
              />
            ))}
            <PreviewSlider
              title="Glow"
              min={0.5}
              max={4}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Rim Width"
              min={0.05}
              max={0.5}
              step={0.01}
              value={settings.rimWidth}
              onChange={value => updateProp('rimWidth', value)}
            />
            <PreviewSlider
              title="Sharpness"
              min={1}
              max={6}
              step={0.1}
              value={settings.sharpness}
              onChange={value => updateProp('sharpness', value)}
            />
            <PreviewSlider
              title="Line Width"
              min={0}
              max={3}
              step={0.1}
              value={settings.lineWidth}
              valueUnit="px"
              onChange={value => updateProp('lineWidth', value)}
            />
            <PreviewSlider
              title="Shimmer"
              min={0}
              max={2}
              step={0.05}
              value={settings.shimmer}
              onChange={value => updateProp('shimmer', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.5}
              max={3}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
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
              title="Turbulence"
              min={0}
              max={2}
              step={0.05}
              value={settings.turbulence}
              onChange={value => updateProp('turbulence', value)}
            />
            <PreviewSlider
              title="Fluidity"
              min={0.02}
              max={0.5}
              step={0.01}
              value={settings.fluidity}
              onChange={value => updateProp('fluidity', value)}
            />
            <PreviewSelect
              title="Flow Direction"
              options={FLOW_OPTIONS}
              value={settings.flowDirection}
              onChange={value => updateProp('flowDirection', value)}
            />
            <PreviewSlider
              title="Cursor Strength"
              min={0}
              max={2}
              step={0.05}
              value={settings.mouseStrength}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={0.1}
              max={0.8}
              step={0.01}
              value={settings.mouseRadius}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseRadius', value)}
            />
            <PreviewSwitch
              title="Cursor Magnet"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Swirl"
              isChecked={settings.clickSwirl}
              onChange={value => updateProp('clickSwirl', value)}
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
          <CodeExample codeObject={fluxLines} componentName="FluxLines" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FluxLinesDemo;
