import { useMemo } from 'react';
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
import { useColorModeValue } from '../../components/setup/color-mode';

import GridMotion from '../../content/Backgrounds/GridMotion/GridMotion';
import { gridMotion } from '../../constants/code/Backgrounds/gridMotionCode';

const PHOTOS = [
  '1705032033999-efa3082e1a4e',
  '1721407964262-f9864b562453',
  '1781155451576-ae65c8816d31',
  '1762846818262-33c197852fa8',
  '1709699714159-29bc3ac99486',
  '1776394254711-4a0d7345269a',
  '1763440519433-5467759054fc',
  '1724152312974-d4d48b8b36fd',
  '1781242629922-6f39cc3671cd',
  '1774009485852-13a515d32e36',
  '1781499455083-6ccc3beb20cd',
  '1772440337285-8b5674e1ee8a',
  '1656651356997-71fcb0f04d3b',
  '1781764177519-9c9c88733c3e',
  '1636269603887-702d9a201bb4',
  '1782977389500-dd7adad33ebe',
  '1632231484562-3d2bed7e808d'
].map(id => `https://images.unsplash.com/photo-${id}?w=640&q=75&auto=format&fit=crop`);

const WORDS = [
  'Motion',
  'Type',
  'Color',
  'Light',
  'Grid',
  'Depth',
  'Form',
  'Rhythm',
  'Space',
  'Texture',
  'Contrast',
  'Balance',
  'Flow',
  'Scale',
  'Detail',
  'Craft'
];

const DEFAULT_PROPS = {
  preset: 'gallery',
  content: 'photos',
  rows: 4,
  aspectRatio: 1.33,
  gap: 16,
  radius: 14,
  angle: -12,
  tilt: 0,
  speed: 24,
  direction: 'alternate',
  parallax: 0.5,
  spotlight: 0.6,
  dim: 0.35,
  fade: 0.5,
  grayscale: false
};

const PRESETS = {
  gallery: {},
  showcase: { tilt: 50, angle: -28, rows: 6, speed: 30, dim: 0.2, fade: 0.35 },
  mono: { grayscale: true, dim: 0.45, spotlight: 0.35 },
  posters: { aspectRatio: 0.75, rows: 3, angle: -6, gap: 12, radius: 8 },
  calm: { speed: 10, parallax: 0.2, dim: 0.6, fade: 0.75, spotlight: 0.4 },
  rush: { speed: 110, direction: 'left', angle: 0, rows: 5, parallax: 0, radius: 10 },
  words: { content: 'words', aspectRatio: 2.2, rows: 6, gap: 12, radius: 999, angle: -8, dim: 0.25 }
};

const PRESET_OPTIONS = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'mono', label: 'Mono' },
  { value: 'posters', label: 'Posters' },
  { value: 'calm', label: 'Calm' },
  { value: 'rush', label: 'Rush' },
  { value: 'words', label: 'Words' }
];

const DIRECTION_OPTIONS = [
  { value: 'alternate', label: 'Alternate' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const GridMotionDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, content, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const items = content === 'words' ? WORDS : PHOTOS;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaultProps[key]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const propData = useMemo(
    () => [
      {
        name: 'items',
        type: 'Array<string | ReactNode | { src: string; alt?: string }>',
        default: '[]',
        description:
          'Tile content. Image URLs and paths render as photos, other strings as text, and JSX as is. Items repeat to fill the wall.'
      },
      { name: 'rows', type: 'number', default: '4', description: 'Rows of tiles. More rows means smaller tiles.' },
      {
        name: 'aspectRatio',
        type: 'number',
        default: '1.33',
        description: 'Width of each tile divided by its height. Below 1 gives portrait tiles.'
      },
      { name: 'gap', type: 'number', default: '16', description: 'Space between tiles in pixels.' },
      {
        name: 'radius',
        type: 'number',
        default: '14',
        description: 'Corner radius of the tiles in pixels. Large values give pills.'
      },
      { name: 'angle', type: 'number', default: '-12', description: 'Rotation of the whole wall in degrees.' },
      {
        name: 'tilt',
        type: 'number',
        default: '0',
        description: 'Leans the wall back in 3D, in degrees. 0 keeps it flat.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '24',
        description: 'Drift speed of the rows in pixels per second. 0 keeps them still.'
      },
      {
        name: 'direction',
        type: "'alternate' | 'left' | 'right'",
        default: "'alternate'",
        description: 'Which way the rows drift. Alternate sends neighbouring rows in opposite directions.'
      },
      {
        name: 'parallax',
        type: 'number',
        default: '0.5',
        description: 'How far the rows slide against each other as the pointer moves across the page, from 0 to 1.'
      },
      {
        name: 'spotlight',
        type: 'number',
        default: '0.6',
        description:
          'Size of the area around the pointer where dimmed or grayscale tiles come back to full color, from 0 to 1. 0 turns it off.'
      },
      {
        name: 'dim',
        type: 'number',
        default: '0.35',
        description: 'Fades the tiles outside the spotlight, which keeps text on top readable. From 0 to 1.'
      },
      {
        name: 'grayscale',
        type: 'boolean',
        default: 'false',
        description: 'Shows the tiles in grayscale until the spotlight brings their color back.'
      },
      {
        name: 'fade',
        type: 'number',
        default: '0.5',
        description: 'Fades the edges of the wall into the page, from 0 to 1.'
      },
      {
        name: 'tileColor',
        type: 'string',
        default: '-',
        description: 'Background of text and empty tiles. Follows the theme when not set.'
      },
      {
        name: 'textColor',
        type: 'string',
        default: '-',
        description: 'Color of text tiles. Follows the theme when not set.'
      },
      {
        name: 'theme',
        type: "'dark' | 'light'",
        default: "'dark'",
        description: 'Picks the default tile and text colors.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'content']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <GridMotion {...settings} items={items} theme={theme} />

            <BackgroundContent pillText="New Background" headline="A wall of work that moves with you" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="grid-motion" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewSlider
              title="Rows"
              min={1}
              max={8}
              step={1}
              value={props.rows}
              onChange={value => updateProp('rows', value)}
            />

            <PreviewSlider
              title="Tile Ratio"
              min={0.5}
              max={2.5}
              step={0.05}
              value={props.aspectRatio}
              onChange={value => updateProp('aspectRatio', value)}
            />

            <PreviewSlider
              title="Gap"
              min={0}
              max={40}
              step={1}
              value={props.gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />

            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={Math.min(props.radius, 40)}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />

            <PreviewSlider
              title="Angle"
              min={-45}
              max={45}
              step={1}
              value={props.angle}
              valueUnit="°"
              onChange={value => updateProp('angle', value)}
            />

            <PreviewSlider
              title="Tilt"
              min={0}
              max={65}
              step={1}
              value={props.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={160}
              step={2}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />

            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={props.direction}
              onChange={value => updateProp('direction', value)}
            />

            <PreviewSlider
              title="Parallax"
              min={0}
              max={1}
              step={0.05}
              value={props.parallax}
              onChange={value => updateProp('parallax', value)}
            />

            <PreviewSlider
              title="Spotlight"
              min={0}
              max={1}
              step={0.05}
              value={props.spotlight}
              onChange={value => updateProp('spotlight', value)}
            />

            <PreviewSlider
              title="Dim"
              min={0}
              max={0.9}
              step={0.05}
              value={props.dim}
              onChange={value => updateProp('dim', value)}
            />

            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={props.fade}
              onChange={value => updateProp('fade', value)}
            />

            <PreviewSwitch
              title="Grayscale"
              isChecked={props.grayscale}
              onChange={value => updateProp('grayscale', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={gridMotion} componentName="GridMotion" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GridMotionDemo;
