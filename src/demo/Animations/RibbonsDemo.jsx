import { Box, Flex, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Ribbons from '../../content/Animations/Ribbons/Ribbons';
import { ribbons } from '../../constants/code/Animations/ribbonsCode';

const LOOK = {
  colors: ['#3847ff', '#7c84ff', '#c7cbff'],
  shape: 'lens',
  thickness: 30,
  length: 1.4,
  spread: 18,
  stiffness: 0.5,
  bounce: 0.5,
  wave: 0,
  softness: 0,
  opacity: 1,
  fade: false
};

const DEFAULT_PROPS = { preset: 'layers', ...LOOK };

const PRESETS = {
  layers: LOOK,
  solo: { ...LOOK, colors: ['#3847ff'], length: 1 },
  comet: {
    ...LOOK,
    colors: ['#3847ff', '#5d67ff', '#8890ff', '#b6bbff'],
    shape: 'comet',
    thickness: 26,
    length: 2.2,
    spread: 14,
    fade: true
  },
  glow: { ...LOOK, thickness: 36, length: 2.4, softness: 0.8, fade: true },
  streamers: {
    ...LOOK,
    colors: ['#1f2be0', '#3847ff', '#6670ff', '#959cff', '#c7cbff'],
    shape: 'even',
    thickness: 10,
    length: 2.4,
    spread: 14,
    bounce: 0.7,
    wave: 0.5
  }
};

const PRESET_OPTIONS = [
  { value: 'layers', label: 'Layers' },
  { value: 'solo', label: 'Solo' },
  { value: 'comet', label: 'Comet' },
  { value: 'glow', label: 'Glow' },
  { value: 'streamers', label: 'Streamers' }
];

const SHAPE_OPTIONS = [
  { value: 'lens', label: 'Lens' },
  { value: 'comet', label: 'Comet' },
  { value: 'even', label: 'Even' }
];

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#3847ff', '#7c84ff', '#c7cbff']",
    description: 'One ribbon is drawn for each color, in order from back to front.'
  },
  {
    name: 'shape',
    type: "'lens' | 'comet' | 'even'",
    default: "'lens'",
    description: 'Width along each ribbon. Lens swells in the middle, comet is widest at the cursor, even stays level.'
  },
  { name: 'thickness', type: 'number', default: '30', description: 'Width of each ribbon at its widest, in pixels.' },
  {
    name: 'length',
    type: 'number',
    default: '1.4',
    description: 'How far the ribbons trail behind the cursor. Higher values leave longer, lazier trails.'
  },
  { name: 'spread', type: 'number', default: '18', description: 'Space between the ribbons, in pixels.' },
  {
    name: 'stiffness',
    type: 'number',
    default: '0.5',
    description: 'How tightly the ribbons chase the cursor, from 0 to 1.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.5',
    description: 'How far the ribbons overshoot and swing back when the cursor stops or turns, from 0 to 1.'
  },
  { name: 'wave', type: 'number', default: '0', description: 'A wave that rolls along each ribbon, from 0 to 1.' },
  {
    name: 'softness',
    type: 'number',
    default: '0',
    description: 'Blurs the ribbon edges into soft light trails, from 0 to 1.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the ribbons.' },
  { name: 'fade', type: 'boolean', default: 'false', description: 'Fades each ribbon out toward its tail.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Color behind the ribbons. By default the canvas is transparent.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const RibbonsDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
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
          <Box position="relative" className="demo-container" h={{ base: 380, md: 500 }} p={0} overflow="hidden">
            <Text className="demo-instruction" position="absolute" fontSize="clamp(2rem, 6vw, 6rem)" fontWeight={600}>
              Hover Me.
            </Text>
            <Ribbons {...settings} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="ribbons" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings.colors}
              min={1}
              max={8}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={4}
              max={80}
              step={1}
              value={settings.thickness}
              valueUnit="px"
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Length"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.length}
              onChange={value => updateProp('length', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={60}
              step={1}
              value={settings.spread}
              valueUnit="px"
              isDisabled={settings.colors.length < 2}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Stiffness"
              min={0}
              max={1}
              step={0.05}
              value={settings.stiffness}
              onChange={value => updateProp('stiffness', value)}
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
              title="Wave"
              min={0}
              max={1}
              step={0.05}
              value={settings.wave}
              onChange={value => updateProp('wave', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={settings.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0.1}
              max={1}
              step={0.05}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSwitch title="Fade" isChecked={settings.fade} onChange={value => updateProp('fade', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={ribbons} componentName="Ribbons" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default RibbonsDemo;
