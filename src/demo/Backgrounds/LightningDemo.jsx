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

import Lightning from '../../content/Backgrounds/Lightning/Lightning';
import { lightning } from '../../constants/code/Backgrounds/lightningCode';

const SHAPE = {
  bolts: 1,
  spread: 0.6,
  branches: 0.5,
  xOffset: 0,
  angle: 0,
  size: 1,
  thickness: 1,
  glow: 1,
  intensity: 1,
  speed: 1,
  flicker: 0.6,
  fade: 0
};

const DEFAULT_PROPS = {
  preset: 'bolt',
  color: '#4d6bff',
  ...SHAPE,
  opacity: 1,
  mouseInteraction: true,
  mouseStrength: 1,
  clickStrike: true,
  intro: true,
  lightMode: false
};

const PRESETS = {
  bolt: { ...SHAPE },
  storm: { ...SHAPE, bolts: 3, spread: 0.8, branches: 0.8, flicker: 0.85, glow: 0.9 },
  arc: { ...SHAPE, angle: 90, branches: 0.2, speed: 2.2, size: 1.3, glow: 0.75, flicker: 0.9 },
  calm: { ...SHAPE, branches: 0.25, speed: 0.45, flicker: 0.15, glow: 1.35, fade: 0.4 },
  fine: { ...SHAPE, size: 1.8, thickness: 0.7, glow: 0.65, branches: 1, xOffset: 0.35 }
};

const PRESET_OPTIONS = [
  { value: 'bolt', label: 'Bolt' },
  { value: 'storm', label: 'Storm' },
  { value: 'arc', label: 'Arc' },
  { value: 'calm', label: 'Calm' },
  { value: 'fine', label: 'Fine' }
];

const propData = [
  {
    name: 'color',
    type: 'string',
    default: "'#4d6bff'",
    description: 'Color of the lightning. The hottest parts glow white.'
  },
  { name: 'bolts', type: 'number', default: '1', description: 'How many bolts to draw, from 1 to 4.' },
  { name: 'spread', type: 'number', default: '0.6', description: 'Space between bolts when there is more than one.' },
  {
    name: 'branches',
    type: 'number',
    default: '0.5',
    description: 'How many side branches split off and flash along the bolts, from 0 to 1.'
  },
  { name: 'xOffset', type: 'number', default: '0', description: 'Moves the bolts sideways.' },
  { name: 'angle', type: 'number', default: '0', description: 'Tilts the bolts, in degrees. 90 runs them across.' },
  { name: 'size', type: 'number', default: '1', description: 'Scale of the jagged path. Higher is more crooked.' },
  { name: 'thickness', type: 'number', default: '1', description: 'Thickness of the bright core.' },
  { name: 'glow', type: 'number', default: '1', description: 'How far the glow spreads around the bolts.' },
  { name: 'intensity', type: 'number', default: '1', description: 'Overall brightness.' },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'How fast the bolts crawl. The motion loops seamlessly every 10 seconds at 1.'
  },
  {
    name: 'flicker',
    type: 'number',
    default: '0.6',
    description: 'Strength of the flicker and sudden flashes, from 0 to 1.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Bolts bend toward the cursor, crackle and grow extra branches near it.'
  },
  {
    name: 'mouseStrength',
    type: 'number',
    default: '1',
    description: 'How strongly the bolts bend toward the cursor.'
  },
  {
    name: 'clickStrike',
    type: 'boolean',
    default: 'true',
    description: 'Clicking calls down a bolt that strikes the spot and briefly flashes the others.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Lets the bolts descend from the top on first load.'
  },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the lightning as crisp ink strokes for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the canvas.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the canvas.' }
];

const LightningDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(SHAPE).map(name => [name, defaultProps[name]]));
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
            <Lightning key={key} {...settings} />
            <BackgroundContent pillText="New Background" headline="Click anywhere to call down a strike" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="lightning" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Bolts"
              min={1}
              max={4}
              step={1}
              value={settings.bolts}
              onChange={value => updateProp('bolts', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0.2}
              max={1.5}
              step={0.05}
              value={settings.spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Branches"
              min={0}
              max={1}
              step={0.05}
              value={settings.branches}
              onChange={value => updateProp('branches', value)}
            />
            <PreviewSlider
              title="X Offset"
              min={-1.5}
              max={1.5}
              step={0.05}
              value={settings.xOffset}
              onChange={value => updateProp('xOffset', value)}
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
              title="Size"
              min={0.4}
              max={3}
              step={0.05}
              value={settings.size}
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0}
              max={3}
              step={0.05}
              value={settings.thickness}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0.2}
              max={2.5}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.2}
              max={2.5}
              step={0.05}
              value={settings.intensity}
              onChange={value => updateProp('intensity', value)}
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
              title="Flicker"
              min={0}
              max={1}
              step={0.05}
              value={settings.flicker}
              onChange={value => updateProp('flicker', value)}
            />
            <PreviewSlider
              title="Mouse Strength"
              min={0}
              max={2}
              step={0.05}
              value={settings.mouseStrength}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Strike"
              isChecked={settings.clickStrike}
              onChange={value => updateProp('clickStrike', value)}
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
          <CodeExample codeObject={lightning} componentName="Lightning" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LightningDemo;
