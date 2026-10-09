import { Box, Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import GridDistortion from '../../content/Backgrounds/GridDistortion/GridDistortion';
import { gridDistortion } from '../../constants/code/Backgrounds/gridDistortionCode';

const DEFAULT_PROPS = {
  preset: 'classic',
  imageSrc: '/assets/demo/night-landscape.webp',
  grid: 15,
  radius: 0.18,
  strength: 0.15,
  relaxation: 0.96,
  mode: 'drag',
  softness: 0,
  chroma: 0,
  idle: 0.3,
  clickRipple: true,
  intro: true
};

const PRESETS = {
  classic: {},
  liquid: { softness: 1, grid: 24, strength: 0.25, relaxation: 0.95 },
  glitch: { grid: 32, radius: 0.12, strength: 0.3, relaxation: 0.9, chroma: 0.6 },
  swirl: { mode: 'swirl', grid: 20, radius: 0.28, strength: 0.25, softness: 0.5 },
  tiles: { grid: 8, radius: 0.3, strength: 0.3, relaxation: 0.97 }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'glitch', label: 'Glitch' },
  { value: 'swirl', label: 'Swirl' },
  { value: 'tiles', label: 'Tiles' }
];

const MODE_OPTIONS = [
  { value: 'drag', label: 'Drag' },
  { value: 'push', label: 'Push' },
  { value: 'swirl', label: 'Swirl' }
];

const propData = [
  { name: 'imageSrc', type: 'string', default: '-', description: 'Image to distort. It covers the container.' },
  {
    name: 'grid',
    type: 'number',
    default: '15',
    description: 'Number of cells across. Rows follow the container so cells stay square.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '0.18',
    description: 'Reach of the pointer as a fraction of the container width.'
  },
  {
    name: 'strength',
    type: 'number',
    default: '0.15',
    description: 'How far the pointer throws the cells. 0 turns the pointer off.'
  },
  {
    name: 'relaxation',
    type: 'number',
    default: '0.96',
    description: 'How much displacement each cell keeps per frame. Higher values settle more slowly.'
  },
  {
    name: 'mode',
    type: "'drag' | 'push' | 'swirl'",
    default: "'drag'",
    description: 'Drag pulls cells along with the pointer, push throws them outward and swirl spins them around it.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '0',
    description: 'Blends the crisp blocks into a smooth liquid warp, from 0 to 1.'
  },
  {
    name: 'chroma',
    type: 'number',
    default: '0',
    description: 'Splits the color channels on displaced cells, from 0 to 1.'
  },
  {
    name: 'idle',
    type: 'number',
    default: '0.3',
    description: 'A slow wandering distortion that keeps the image alive while the pointer rests. 0 turns it off.'
  },
  {
    name: 'clickRipple',
    type: 'boolean',
    default: 'true',
    description: 'Sends a ring of displaced cells out from every click.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Scrambles the cells when the image loads and lets them settle into place.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const GridDistortionDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaultProps[key]]));
    updateProps({ ...base, ...PRESETS[value], imageSrc: props.imageSrc, preset: value });
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
            <GridDistortion {...settings} />

            <BackgroundContent pillText="New Background" headline="Don't just sit there, move your cursor!" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="grid-distortion" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSlider
              title="Grid"
              min={4}
              max={60}
              step={1}
              value={props.grid}
              onChange={value => updateProp('grid', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0.05}
              max={0.5}
              step={0.01}
              value={props.radius}
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Strength"
              min={0}
              max={0.6}
              step={0.01}
              value={props.strength}
              onChange={value => updateProp('strength', value)}
            />
            <PreviewSlider
              title="Relaxation"
              min={0.8}
              max={0.99}
              step={0.01}
              value={props.relaxation}
              onChange={value => updateProp('relaxation', value)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={props.mode}
              onChange={value => updateProp('mode', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={props.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Chroma"
              min={0}
              max={1}
              step={0.05}
              value={props.chroma}
              onChange={value => updateProp('chroma', value)}
            />
            <PreviewSlider
              title="Idle"
              min={0}
              max={1}
              step={0.05}
              value={props.idle}
              onChange={value => updateProp('idle', value)}
            />
            <PreviewSwitch
              title="Click Ripple"
              isChecked={props.clickRipple}
              onChange={value => updateProp('clickRipple', value)}
            />
            <PreviewSwitch title="Intro" isChecked={props.intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={gridDistortion} componentName="GridDistortion" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GridDistortionDemo;
