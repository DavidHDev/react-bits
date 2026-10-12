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

import Grainient from '../../content/Backgrounds/Grainient/Grainient';
import { grainient } from '../../constants/code/Backgrounds/grainientCode';

const LOOK = {
  colors: ['#120f17', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa'],
  type: 'linear',
  angle: 55,
  bands: 1,
  softness: 1,
  flow: 0.8,
  scale: 1,
  speed: 1,
  silk: 0.35,
  grainAmount: 0.08,
  grainSize: 1.2,
  grainAnimated: true,
  contrast: 1,
  saturation: 1,
  variation: 0
};

const DEFAULT_PROPS = {
  preset: 'ember',
  ...LOOK,
  interactive: true,
  stir: 1,
  clickSwirl: true,
  intro: true,
  lightMode: false
};

const PRESETS = {
  ember: { ...LOOK },
  lagoon: { ...LOOK, colors: ['#071318', '#0e7490', '#2dd4bf', '#ccfbf1'], angle: 20, flow: 0.9 },
  dusk: { ...LOOK, colors: ['#120f17', '#3f0d1a', '#be123c', '#fb923c', '#fde68a'], angle: 150, silk: 0.4 },
  satin: { ...LOOK, colors: ['#0c0c0f', '#3f3f46', '#a1a1aa', '#fafafa'], angle: 40, bands: 2, silk: 1 },
  dunes: {
    ...LOOK,
    colors: ['#120f17', '#451a03', '#b45309', '#fbbf24', '#fef3c7'],
    angle: 70,
    bands: 2,
    softness: 0.08,
    scale: 1.2,
    silk: 0,
    grainAmount: 0.12,
    grainSize: 1.8
  },
  tide: {
    ...LOOK,
    colors: ['#06101f', '#0c4a6e', '#0284c7', '#7dd3fc', '#f0f9ff'],
    angle: 0,
    bands: 3,
    softness: 0.25,
    flow: 0.7,
    silk: 0.3
  },
  aurora: {
    ...LOOK,
    colors: ['#05110f', '#065f46', '#34d399', '#ecfccb'],
    angle: 100,
    bands: 3,
    flow: 1.1,
    silk: 0.6
  },
  rings: {
    ...LOOK,
    colors: ['#120f17', '#4c0519', '#e11d48', '#fecdd3'],
    type: 'radial',
    bands: 3,
    softness: 0.2,
    flow: 0.7,
    silk: 0.3
  }
};

const PRESET_OPTIONS = [
  { value: 'ember', label: 'Ember' },
  { value: 'lagoon', label: 'Lagoon' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'satin', label: 'Satin' },
  { value: 'dunes', label: 'Dunes' },
  { value: 'tide', label: 'Tide' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'rings', label: 'Rings' }
];

const TYPE_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' }
];

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#120f17', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa']",
    description:
      'Two to eight colors, from the base to the highlight. Use your page background as the first color so the edges blend in.'
  },
  {
    name: 'type',
    type: "'linear' | 'radial'",
    default: "'linear'",
    description: 'Linear runs the colors across the container. Radial puts the last color in the middle.'
  },
  {
    name: 'angle',
    type: 'number',
    default: '55',
    description: 'Direction of a linear gradient in degrees, like CSS: 0 runs bottom to top, 90 left to right.'
  },
  {
    name: 'bands',
    type: 'number',
    default: '1',
    description: 'How many times the colors repeat back and forth, from 1 to 8. Higher values make stripes or rings.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '1',
    description: 'Blend between colors, from 0 (crisp, poster-like edges) to 1 (smooth).'
  },
  {
    name: 'flow',
    type: 'number',
    default: '0.8',
    description: 'How much the gradient bends into waves, from 0 (straight) to 3. Above 1 it starts to marble.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size of the waves, from 0.25 to 3.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'Speed of the drifting waves. 0 holds them still.'
  },
  {
    name: 'silk',
    type: 'number',
    default: '0.35',
    description: 'Satin shading on the folds, from 0 to 1. Combine with bands for glossy ribbons.'
  },
  {
    name: 'grainAmount',
    type: 'number',
    default: '0.08',
    description: 'Strength of the film grain, from 0 to 0.5.'
  },
  {
    name: 'grainSize',
    type: 'number',
    default: '1.2',
    description: 'Size of the grain in pixels, from 0.5 to 4.'
  },
  {
    name: 'grainAnimated',
    type: 'boolean',
    default: 'true',
    description: 'Shifts the grain every frame like film. When off, the grain stays fixed.'
  },
  {
    name: 'contrast',
    type: 'number',
    default: '1',
    description: 'Contrast of the colors, from 0.2 to 2.'
  },
  {
    name: 'saturation',
    type: 'number',
    default: '1',
    description: 'Saturation of the colors, from 0 (grayscale) to 2.'
  },
  {
    name: 'variation',
    type: 'number',
    default: '0',
    description: 'Picks a different pattern of waves.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'Lets the cursor drag the colors around like paint. The trail settles back after a moment.'
  },
  {
    name: 'stir',
    type: 'number',
    default: '1',
    description: 'How far the cursor drags the colors, from 0 to 2.'
  },
  {
    name: 'clickSwirl',
    type: 'boolean',
    default: 'true',
    description: 'Clicking twists the colors into a swirl that slowly unwinds.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Blooms the colors out from the middle on mount.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description:
      'Builds a light version of the palette: the first color becomes white and the others run in reverse, deepest last.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const GrainientDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
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
            <Grainient key={key} {...settings} />
            <BackgroundContent headline="Grainy gradients that flow with you." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="grainient" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings.colors}
              min={2}
              max={8}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Type"
              options={TYPE_OPTIONS}
              value={settings.type}
              onChange={value => updateProp('type', value)}
            />
            <PreviewSlider
              title="Angle"
              min={0}
              max={360}
              step={1}
              value={settings.angle}
              valueUnit="°"
              isDisabled={settings.type === 'radial'}
              onChange={value => updateProp('angle', value)}
            />
            <PreviewSlider
              title="Bands"
              min={1}
              max={6}
              step={1}
              value={settings.bands}
              onChange={value => updateProp('bands', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.01}
              value={settings.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Flow"
              min={0}
              max={2}
              step={0.05}
              value={settings.flow}
              onChange={value => updateProp('flow', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.25}
              max={3}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
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
              title="Silk"
              min={0}
              max={1}
              step={0.01}
              value={settings.silk}
              onChange={value => updateProp('silk', value)}
            />
            <PreviewSlider
              title="Grain Amount"
              min={0}
              max={0.3}
              step={0.01}
              value={settings.grainAmount}
              onChange={value => updateProp('grainAmount', value)}
            />
            <PreviewSlider
              title="Grain Size"
              min={0.5}
              max={4}
              step={0.1}
              value={settings.grainSize}
              valueUnit="px"
              onChange={value => updateProp('grainSize', value)}
            />
            <PreviewSlider
              title="Contrast"
              min={0.5}
              max={1.6}
              step={0.01}
              value={settings.contrast}
              onChange={value => updateProp('contrast', value)}
            />
            <PreviewSlider
              title="Saturation"
              min={0}
              max={2}
              step={0.01}
              value={settings.saturation}
              onChange={value => updateProp('saturation', value)}
            />
            <PreviewSlider
              title="Variation"
              min={0}
              max={20}
              step={1}
              value={settings.variation}
              onChange={value => updateProp('variation', value)}
            />
            <PreviewSlider
              title="Stir"
              min={0}
              max={2}
              step={0.05}
              value={settings.stir}
              isDisabled={!settings.interactive}
              onChange={value => updateProp('stir', value)}
            />
            <PreviewSwitch
              title="Animated Grain"
              isChecked={settings.grainAnimated}
              onChange={value => updateProp('grainAnimated', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings.interactive}
              onChange={value => updateProp('interactive', value)}
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
          <CodeExample codeObject={grainient} componentName="Grainient" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GrainientDemo;
