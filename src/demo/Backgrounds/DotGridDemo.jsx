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

import DotGrid from '../../content/Backgrounds/DotGrid/DotGrid';
import { dotGrid } from '../../constants/code/Backgrounds/dotGridCode';

const FEEL = {
  shape: 'circle',
  dotSize: 5,
  gap: 18,
  proximity: 140,
  strength: 1,
  bounce: 0.6,
  tension: 0.4,
  returnDuration: 0.8,
  shockRadius: 320,
  shockStrength: 5,
  swell: 0.8,
  stretch: 0.5,
  glow: 0.5,
  fade: 0
};

const DEFAULT_PROPS = {
  preset: 'jelly',
  baseColor: '#3a3446',
  activeColor: '#ffffff',
  ...FEEL,
  opacity: 1,
  mouseInteraction: true,
  clickShock: true,
  intro: true
};

const PRESETS = {
  jelly: { ...FEEL },
  streak: { ...FEEL, tension: 0, bounce: 0.25, returnDuration: 0.6, stretch: 1.4, swell: 0.4, strength: 1.3 },
  pixel: { ...FEEL, shape: 'square', dotSize: 6, gap: 14, bounce: 0.7, tension: 0.3, glow: 0.2, stretch: 0.4 },
  dense: { ...FEEL, dotSize: 3, gap: 10, proximity: 170, tension: 0.55, swell: 1.2, glow: 0.6 },
  calm: { ...FEEL, strength: 0.5, bounce: 0.3, returnDuration: 1.4, swell: 0.4, stretch: 0.2, glow: 0.25, fade: 0.5 }
};

const PRESET_OPTIONS = [
  { value: 'jelly', label: 'Jelly' },
  { value: 'streak', label: 'Streak' },
  { value: 'pixel', label: 'Pixel' },
  { value: 'dense', label: 'Dense' },
  { value: 'calm', label: 'Calm' }
];

const SHAPE_OPTIONS = [
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' }
];

const propData = [
  { name: 'baseColor', type: 'string', default: "'#3a3446'", description: 'Color of the dots at rest.' },
  {
    name: 'activeColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color the dots light up to while they move or sit near the cursor.'
  },
  { name: 'shape', type: "'circle' | 'square'", default: "'circle'", description: 'Shape of each dot.' },
  { name: 'dotSize', type: 'number', default: '5', description: 'Size of each dot, in px.' },
  { name: 'gap', type: 'number', default: '18', description: 'Space between dots, in px.' },
  {
    name: 'proximity',
    type: 'number',
    default: '140',
    description: 'Radius around the cursor that pushes the dots and lights them up, in px.'
  },
  { name: 'strength', type: 'number', default: '1', description: 'How hard a moving cursor pushes the dots.' },
  {
    name: 'bounce',
    type: 'number',
    default: '0.6',
    description: 'How much the dots overshoot and wobble as they settle, from 0 to 1.'
  },
  {
    name: 'tension',
    type: 'number',
    default: '0.4',
    description:
      'How strongly each dot pulls on its neighbours, so a push travels through the grid like jelly. 0 keeps every dot independent.'
  },
  {
    name: 'returnDuration',
    type: 'number',
    default: '0.8',
    description: 'Roughly how long the dots take to settle back into place, in seconds.'
  },
  { name: 'shockRadius', type: 'number', default: '320', description: 'How far a click shockwave travels, in px.' },
  { name: 'shockStrength', type: 'number', default: '5', description: 'How hard a click shockwave pushes the dots.' },
  { name: 'swell', type: 'number', default: '0.8', description: 'How much the dots grow while they are lit.' },
  {
    name: 'stretch',
    type: 'number',
    default: '0.5',
    description: 'How much moving dots stretch into short streaks along their motion.'
  },
  { name: 'glow', type: 'number', default: '0.5', description: 'Soft halo around lit dots.' },
  {
    name: 'fade',
    type: 'number',
    default: '0',
    description: 'Fades the grid out toward the edges, from 0 to 1.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Overall opacity of the grid.' },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Pops the dots in from the center when the grid first appears.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Lets the cursor push the dots and light them up.'
  },
  { name: 'clickShock', type: 'boolean', default: 'true', description: 'Sends a shockwave out from each click.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const DotGridDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(FEEL).map(name => [name, defaultProps[name]]));
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
            <DotGrid key={key} {...settings} />
            <BackgroundContent pillText="New Background" headline="Flick the dots and watch them wobble home" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="dot-grid" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Base Color"
              color={settings.baseColor}
              onChange={value => updateProp('baseColor', value)}
            />
            <PreviewColorPickerCustom
              title="Active Color"
              color={settings.activeColor}
              onChange={value => updateProp('activeColor', value)}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSlider
              title="Dot Size"
              min={2}
              max={16}
              step={1}
              value={settings.dotSize}
              valueUnit="px"
              onChange={value => updateProp('dotSize', value)}
            />
            <PreviewSlider
              title="Gap"
              min={4}
              max={48}
              step={1}
              value={settings.gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Proximity"
              min={40}
              max={320}
              step={5}
              value={settings.proximity}
              valueUnit="px"
              onChange={value => updateProp('proximity', value)}
            />
            <PreviewSlider
              title="Strength"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.strength}
              onChange={value => updateProp('strength', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.05}
              value={settings.bounce}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSlider
              title="Tension"
              min={0}
              max={1}
              step={0.05}
              value={settings.tension}
              onChange={value => updateProp('tension', value)}
            />
            <PreviewSlider
              title="Return Duration"
              min={0.2}
              max={3}
              step={0.05}
              value={settings.returnDuration}
              valueUnit="s"
              onChange={value => updateProp('returnDuration', value)}
            />
            <PreviewSlider
              title="Shock Radius"
              min={80}
              max={800}
              step={10}
              value={settings.shockRadius}
              valueUnit="px"
              onChange={value => updateProp('shockRadius', value)}
            />
            <PreviewSlider
              title="Shock Strength"
              min={0}
              max={12}
              step={0.5}
              value={settings.shockStrength}
              onChange={value => updateProp('shockStrength', value)}
            />
            <PreviewSlider
              title="Swell"
              min={0}
              max={2}
              step={0.05}
              value={settings.swell}
              onChange={value => updateProp('swell', value)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={2}
              step={0.05}
              value={settings.stretch}
              onChange={value => updateProp('stretch', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Shock"
              isChecked={settings.clickShock}
              onChange={value => updateProp('clickShock', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={dotGrid} componentName="DotGrid" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default DotGridDemo;
