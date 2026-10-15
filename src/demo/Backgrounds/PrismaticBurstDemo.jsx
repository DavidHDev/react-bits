import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import PrismaticBurst from '../../content/Backgrounds/PrismaticBurst/PrismaticBurst';
import { prismaticBurst } from '../../constants/code/Backgrounds/prismaticBurstCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/PrismaticBurst';

const DEFAULT_PROPS = {
  preset: 'nebula',
  ...LOOK,
  mouseInteraction: true,
  mouseStrength: 0.5,
  hoverDampness: 0.25,
  clickBurst: true,
  intro: true,
  fade: 0,
  lightMode: false
};

const ANIMATION_OPTIONS = [
  { value: 'rotate', label: 'Rotate' },
  { value: 'rotate3d', label: 'Rotate 3D' },
  { value: 'hover', label: 'Hover' }
];

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: 'undefined',
    description: 'Colors blended through the rays, up to 64. Leave empty for a full spectrum.'
  },
  { name: 'intensity', type: 'number', default: '2', description: 'Overall brightness of the rays.' },
  { name: 'speed', type: 'number', default: '0.5', description: 'How fast the burst turns and shifts.' },
  {
    name: 'animationType',
    type: '"rotate" | "rotate3d" | "hover"',
    default: '"rotate3d"',
    description: 'Flat rotation, full 3D rotation, or a burst that turns to follow the cursor.'
  },
  { name: 'zoom', type: 'number', default: '1', description: 'How close the burst is. Higher values zoom in.' },
  {
    name: 'rayWidth',
    type: 'number',
    default: '1',
    description: 'Thickness of the rays, from thin threads to broad beams.'
  },
  {
    name: 'rayCount',
    type: 'number',
    default: '0',
    description: 'Splits the light into this many evenly spaced spokes. 0 keeps it organic.'
  },
  { name: 'distort', type: 'number', default: '0', description: 'Bends the rays into flowing, organic shapes.' },
  {
    name: 'twist',
    type: 'number',
    default: '0',
    description: 'Swirls the rays into a spiral. Negative values turn the other way.'
  },
  {
    name: 'flow',
    type: 'number',
    default: '0',
    description: 'Streams the colors through the burst. Negative values reverse the direction.'
  },
  {
    name: 'centerFade',
    type: 'number',
    default: '1',
    description: 'Size of the dark core at the heart of the burst, from 0.5 to 3.'
  },
  { name: 'glow', type: 'number', default: '0', description: 'Soft bloom around the brightest rays.' },
  { name: 'grain', type: 'number', default: '0.8', description: 'Film grain over the light, from 0.3 to 1.' },
  {
    name: 'offset',
    type: '{ x?: number | string; y?: number | string }',
    default: '{ x: 0, y: 0 }',
    description: 'Moves the center of the burst, in pixels. Positive y moves it up.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The burst leans toward the cursor and the rays near it brighten.'
  },
  {
    name: 'mouseStrength',
    type: 'number',
    default: '0.5',
    description: 'How strongly the burst reacts to the cursor.'
  },
  {
    name: 'hoverDampness',
    type: 'number',
    default: '0.25',
    description: 'How smoothly the burst follows the cursor, from 0 to 1. Higher values feel heavier.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a wave of light racing out along the rays.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'The burst ignites from the center when it mounts.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  {
    name: 'quality',
    type: '"low" | "medium" | "high"',
    default: '"high"',
    description: 'Render resolution. Lower settings are lighter on slower devices.'
  },
  {
    name: 'resolution',
    type: 'number',
    default: 'undefined',
    description: 'Exact render scale from 0.2 to 1. Overrides quality.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the burst as colored ink on a white background.'
  },
  {
    name: 'mixBlendMode',
    type: 'string',
    default: 'undefined',
    description: 'CSS blend mode for the canvas, such as screen or lighten.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const PrismaticBurstDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, spectrum, colors, ...rest } = props;
  const settings = { ...rest, colors: spectrum ? [] : colors };

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'spectrum']}
      computedProps={{ colors: settings.colors }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} overflow="hidden" p={0}>
            <PrismaticBurst key={key} {...settings} />
            <BackgroundContent headline="A burst of color, refracted from the core" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="prismatic-burst" currentProps={settings} defaultProps={LOOK} />
          </Flex>

          <Customize>
            {!spectrum && (
              <PreviewColorList
                title="Colors"
                colors={colors}
                min={1}
                onChange={value => updateProp('colors', value)}
              />
            )}
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Animation"
              options={ANIMATION_OPTIONS}
              value={props.animationType}
              onChange={value => updateProp('animationType', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.2}
              max={4}
              step={0.05}
              value={props.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Zoom"
              min={0.4}
              max={2.5}
              step={0.05}
              value={props.zoom}
              onChange={value => updateProp('zoom', value)}
            />
            <PreviewSlider
              title="Ray Width"
              min={0.3}
              max={2}
              step={0.05}
              value={props.rayWidth}
              onChange={value => updateProp('rayWidth', value)}
            />
            <PreviewSlider
              title="Ray Count"
              min={0}
              max={48}
              step={1}
              value={props.rayCount}
              onChange={value => updateProp('rayCount', value)}
            />
            <PreviewSlider
              title="Distort"
              min={0}
              max={6}
              step={0.1}
              value={props.distort}
              onChange={value => updateProp('distort', value)}
            />
            <PreviewSlider
              title="Twist"
              min={-3}
              max={3}
              step={0.05}
              value={props.twist}
              onChange={value => updateProp('twist', value)}
            />
            <PreviewSlider
              title="Flow"
              min={-1.5}
              max={1.5}
              step={0.05}
              value={props.flow}
              onChange={value => updateProp('flow', value)}
            />
            <PreviewSlider
              title="Center Fade"
              min={0.5}
              max={2}
              step={0.05}
              value={props.centerFade}
              onChange={value => updateProp('centerFade', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={props.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0.3}
              max={1}
              step={0.05}
              value={props.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSlider
              title="Cursor Strength"
              min={0}
              max={1.5}
              step={0.05}
              value={props.mouseStrength}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSlider
              title="Cursor Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={props.hoverDampness}
              onChange={value => updateProp('hoverDampness', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={props.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSwitch title="Spectrum" isChecked={spectrum} onChange={value => updateProp('spectrum', value)} />
            <PreviewSwitch
              title="Cursor"
              isChecked={props.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Burst"
              isChecked={props.clickBurst}
              onChange={value => updateProp('clickBurst', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={props.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Light Mode"
              isChecked={props.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={prismaticBurst} componentName="PrismaticBurst" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PrismaticBurstDemo;
