import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import MetaBalls from '../../content/Animations/MetaBalls/MetaBalls';
import { metaBalls } from '../../constants/code/Animations/metaBallsCode';

const SHAPE = {
  variant: 'solid',
  motion: 'orbit',
  speed: 0.3,
  animationSize: 30,
  ballCount: 15,
  clumpFactor: 1,
  cursorBallSize: 3,
  hoverSmoothness: 0.1,
  gooeyness: 0.5,
  stickiness: 0.5,
  stretch: 0.5,
  wobble: 0.5,
  lineWidth: 1.5,
  rings: 4
};

const DEFAULT_PROPS = {
  preset: 'classic',
  color: '',
  cursorBallColor: '',
  ...SHAPE,
  enableMouseInteraction: true,
  clickBurst: true,
  intro: true
};

const PRESETS = {
  classic: {},
  jelly: { ballCount: 12, stickiness: 0.85, stretch: 0.9, wobble: 0.9, gooeyness: 0.6, cursorBallSize: 3.5 },
  contour: { variant: 'contour', motion: 'drift', animationSize: 18, ballCount: 10, lineWidth: 1, rings: 5 },
  lava: {
    motion: 'lava',
    animationSize: 16,
    ballCount: 9,
    speed: 0.6,
    gooeyness: 0.6,
    stickiness: 0.8,
    color: '#ff5a1f',
    cursorBallColor: '#ff5a1f'
  },
  outline: { variant: 'outline', gooeyness: 0.65, lineWidth: 1.5 },
  duo: { ballCount: 18, gooeyness: 0.6, cursorBallSize: 4, cursorBallColor: '#3b82f6' }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'jelly', label: 'Jelly' },
  { value: 'contour', label: 'Contour' },
  { value: 'lava', label: 'Lava' },
  { value: 'outline', label: 'Outline' },
  { value: 'duo', label: 'Duo' }
];

const VARIANT_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'outline', label: 'Outline' },
  { value: 'contour', label: 'Contour' }
];

const MOTION_OPTIONS = [
  { value: 'orbit', label: 'Orbit' },
  { value: 'drift', label: 'Drift' },
  { value: 'lava', label: 'Lava' }
];

const propData = [
  { name: 'color', type: 'string', default: "'#ffffff'", description: 'Color of the blobs.' },
  {
    name: 'cursorBallColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the cursor blob. It blends smoothly into any blob it merges with.'
  },
  {
    name: 'variant',
    type: "'solid' | 'outline' | 'contour'",
    default: "'solid'",
    description: 'Filled blobs, a single outline, or an outline with contour rings around it.'
  },
  {
    name: 'motion',
    type: "'orbit' | 'drift' | 'lava'",
    default: "'orbit'",
    description:
      'How the blobs move: orbiting a cluster, drifting across the area, or rising and sinking like a lava lamp.'
  },
  { name: 'speed', type: 'number', default: '0.3', description: 'Speed of the motion.' },
  {
    name: 'animationSize',
    type: 'number',
    default: '30',
    description: 'Size of the world shown in the view. Higher values zoom out and make the blobs smaller.'
  },
  { name: 'ballCount', type: 'number', default: '15', description: 'Number of blobs, up to 50.' },
  {
    name: 'clumpFactor',
    type: 'number',
    default: '1',
    description: 'How far the blobs travel from the center. Lower values pack them together.'
  },
  {
    name: 'gooeyness',
    type: 'number',
    default: '0.5',
    description: 'How far blobs reach toward each other before merging, from 0 to 1. 0.5 is the classic look.'
  },
  {
    name: 'stickiness',
    type: 'number',
    default: '0.5',
    description: 'How strongly merged blobs cling together before the neck between them snaps, from 0 to 1.'
  },
  {
    name: 'stretch',
    type: 'number',
    default: '0.5',
    description: 'How much blobs stretch in the direction they move, from 0 to 1.'
  },
  {
    name: 'wobble',
    type: 'number',
    default: '0.5',
    description: 'How much blobs jiggle after stretching or being pushed, from 0 to 1.'
  },
  {
    name: 'enableMouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The cursor blob follows the pointer and pushes the others aside. It orbits on its own otherwise.'
  },
  { name: 'cursorBallSize', type: 'number', default: '3', description: 'Size of the cursor blob.' },
  {
    name: 'hoverSmoothness',
    type: 'number',
    default: '0.1',
    description: 'How quickly the cursor blob catches up with the pointer. Lower is smoother.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description: 'Clicking makes the cursor blob pulse and splash the others outward before they flow back.'
  },
  {
    name: 'lineWidth',
    type: 'number',
    default: '1.5',
    description: 'Width of the lines in the outline and contour variants, in px.'
  },
  { name: 'rings', type: 'number', default: '4', description: 'Number of contour rings around the outline.' },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Starts as a single drop that buds into the blobs the first time it comes into view.'
  },
  {
    name: 'enableTransparency',
    type: 'boolean',
    default: 'false',
    description: 'Renders on a transparent background instead of black.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const MetaBallsDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, color, cursorBallColor, intro, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');
  const blobColor = color || ink;
  const cursorColor = cursorBallColor || ink;

  const computedProps = useMemo(
    () => ({ color: blobColor, cursorBallColor: cursorColor, enableTransparency: true }),
    [blobColor, cursorColor]
  );

  const applyPreset = value => {
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'color', 'cursorBallColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={480} p={0} overflow="hidden">
            <MetaBalls
              key={`${preset}-${intro}-${key}`}
              {...settings}
              color={blobColor}
              cursorBallColor={cursorColor}
              intro={intro}
              enableTransparency
            />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Variant"
              options={VARIANT_OPTIONS}
              value={settings.variant}
              onChange={value => updateProp('variant', value)}
            />
            <PreviewSelect
              title="Motion"
              options={MOTION_OPTIONS}
              value={settings.motion}
              onChange={value => updateProp('motion', value)}
            />
            <PreviewColorPickerCustom title="Color" color={blobColor} onChange={value => updateProp('color', value)} />
            <PreviewColorPickerCustom
              title="Cursor Color"
              color={cursorColor}
              onChange={value => updateProp('cursorBallColor', value)}
            />
            <PreviewSlider
              title="Ball Count"
              min={2}
              max={50}
              step={1}
              value={settings.ballCount}
              onChange={value => updateProp('ballCount', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="World Size"
              min={10}
              max={50}
              step={1}
              value={settings.animationSize}
              onChange={value => updateProp('animationSize', value)}
            />
            <PreviewSlider
              title="Clump Factor"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.clumpFactor}
              onChange={value => updateProp('clumpFactor', value)}
            />
            <PreviewSlider
              title="Gooeyness"
              min={0}
              max={1}
              step={0.05}
              value={settings.gooeyness}
              onChange={value => updateProp('gooeyness', value)}
            />
            <PreviewSlider
              title="Stickiness"
              min={0}
              max={1}
              step={0.05}
              value={settings.stickiness}
              onChange={value => updateProp('stickiness', value)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={1}
              step={0.05}
              value={settings.stretch}
              onChange={value => updateProp('stretch', value)}
            />
            <PreviewSlider
              title="Wobble"
              min={0}
              max={1}
              step={0.05}
              value={settings.wobble}
              onChange={value => updateProp('wobble', value)}
            />
            <PreviewSlider
              title="Cursor Size"
              min={0}
              max={6}
              step={0.25}
              value={settings.cursorBallSize}
              onChange={value => updateProp('cursorBallSize', value)}
            />
            <PreviewSlider
              title="Cursor Smoothing"
              min={0.01}
              max={0.3}
              step={0.01}
              value={settings.hoverSmoothness}
              isDisabled={!settings.enableMouseInteraction}
              onChange={value => updateProp('hoverSmoothness', value)}
            />
            <PreviewSlider
              title="Line Width"
              min={0.5}
              max={4}
              step={0.25}
              value={settings.lineWidth}
              valueUnit="px"
              isDisabled={settings.variant === 'solid'}
              onChange={value => updateProp('lineWidth', value)}
            />
            <PreviewSlider
              title="Rings"
              min={1}
              max={8}
              step={1}
              value={settings.rings}
              isDisabled={settings.variant !== 'contour'}
              onChange={value => updateProp('rings', value)}
            />
            <PreviewSwitch
              title="Follow Cursor"
              isChecked={settings.enableMouseInteraction}
              onChange={value => updateProp('enableMouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Burst"
              isChecked={settings.clickBurst}
              isDisabled={!settings.enableMouseInteraction}
              onChange={value => updateProp('clickBurst', value)}
            />
            <PreviewSwitch title="Intro" isChecked={intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={metaBalls} componentName="MetaBalls" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default MetaBallsDemo;
