import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import CursorGrid from '../../content/Animations/CursorGrid/CursorGrid';
import { cursorGrid } from '../../constants/code/Animations/cursorGridCode';

const LOOK = {
  color: '#ffffff',
  gridColor: '#ffffff',
  highlight: 'area',
  gridStyle: 'lines',
  falloff: 'smooth',
  cellSize: 60,
  radius: 140,
  holdTime: 400,
  fadeDuration: 800,
  lineWidth: 1,
  maxOpacity: 1,
  fillOpacity: 0.06,
  gridOpacity: 0.08,
  spotlight: 0.6,
  cellGap: 0,
  cellRadius: 0,
  pulseSpeed: 600,
  ambient: 0,
  edgeFade: 0.2
};

const DEFAULT_PROPS = {
  preset: 'minimal',
  ...LOOK,
  clickPulse: true,
  intro: true
};

const PRESETS = {
  minimal: {},
  cell: { highlight: 'cell', fadeDuration: 1400, fillOpacity: 0.08 },
  tiles: {
    color: '#7dd3fc',
    highlight: 'cell',
    cellGap: 4,
    cellRadius: 10,
    fillOpacity: 0.14,
    gridOpacity: 0.05,
    fadeDuration: 1200
  },
  marks: { color: '#fbbf24', gridStyle: 'crosses', gridOpacity: 0.28, fillOpacity: 0.08, spotlight: 0.8 },
  dots: { gridStyle: 'dots', cellSize: 36, radius: 120, gridOpacity: 0.3, fillOpacity: 0.1 },
  dashed: { color: '#34d399', gridStyle: 'dashed', gridOpacity: 0.14, ambient: 0.5, fadeDuration: 1600 },
  classic: {
    color: '#D946EF',
    cellSize: 70,
    lineWidth: 1.2,
    fillOpacity: 0,
    gridOpacity: 0,
    spotlight: 0,
    edgeFade: 0
  }
};

const LIGHT_SWAP = {
  '#ffffff': '#18181b',
  '#7dd3fc': '#0284c7',
  '#fbbf24': '#d97706',
  '#34d399': '#059669',
  '#d946ef': '#c026d3'
};

const DARK_SWAP = Object.fromEntries(Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]));

const PRESET_OPTIONS = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'cell', label: 'Cell' },
  { value: 'tiles', label: 'Tiles' },
  { value: 'marks', label: 'Marks' },
  { value: 'dots', label: 'Dots' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'classic', label: 'Classic' }
];

const HIGHLIGHT_OPTIONS = [
  { value: 'area', label: 'Area' },
  { value: 'cell', label: 'Cell' }
];

const STYLE_OPTIONS = [
  { value: 'lines', label: 'Lines' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dots', label: 'Dots' },
  { value: 'crosses', label: 'Crosses' }
];

const FALLOFF_OPTIONS = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'linear', label: 'Linear' },
  { value: 'sharp', label: 'Sharp' }
];

const propData = [
  {
    name: 'color',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of lit cells and pulses. Defaults to near black in light mode.'
  },
  {
    name: 'gridColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the grid lines. Defaults to near black in light mode.'
  },
  { name: 'cellSize', type: 'number', default: '60', description: 'Size of each grid cell, in px.' },
  {
    name: 'highlight',
    type: "'area' | 'cell'",
    default: "'area'",
    description: 'Light every cell within the radius around the cursor, or only the cell under it.'
  },
  {
    name: 'gridStyle',
    type: "'lines' | 'dashed' | 'dots' | 'crosses'",
    default: "'lines'",
    description: 'How the grid is drawn: solid lines, dashed lines, dots or plus marks where the lines meet.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '140',
    description: 'Reach of the cursor, in px, for both the lit area and the spotlight.'
  },
  {
    name: 'falloff',
    type: "'smooth' | 'linear' | 'sharp'",
    default: "'smooth'",
    description: 'How quickly cells dim toward the edge of the radius.'
  },
  { name: 'holdTime', type: 'number', default: '400', description: 'How long a cell stays lit before fading, in ms.' },
  {
    name: 'fadeDuration',
    type: 'number',
    default: '800',
    description: 'How long a lit cell takes to fade out, in ms.'
  },
  { name: 'lineWidth', type: 'number', default: '1', description: 'Width of the grid lines, in px.' },
  { name: 'maxOpacity', type: 'number', default: '1', description: 'Brightness of a fully lit cell outline.' },
  { name: 'fillOpacity', type: 'number', default: '0.06', description: 'Soft fill inside lit cells.' },
  {
    name: 'gridOpacity',
    type: 'number',
    default: '0.08',
    description: 'Opacity of the grid lines at rest. 0 shows only lit cells.'
  },
  {
    name: 'spotlight',
    type: 'number',
    default: '0.6',
    description: 'How much the grid lines brighten around the cursor, from 0 to 1.'
  },
  {
    name: 'cellGap',
    type: 'number',
    default: '0',
    description: 'Inset of lit cells, in px. Above 0, lit cells become separate tiles.'
  },
  { name: 'cellRadius', type: 'number', default: '0', description: 'Corner radius of lit tiles, in px.' },
  {
    name: 'clickPulse',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ring of lit cells out from the click.'
  },
  { name: 'pulseSpeed', type: 'number', default: '600', description: 'Speed of the click ring, in px per second.' },
  {
    name: 'ambient',
    type: 'number',
    default: '0',
    description: 'Lets random cells glow softly on their own, from 0 to 1.'
  },
  {
    name: 'edgeFade',
    type: 'number',
    default: '0.2',
    description: 'Fades the grid out toward the edges, from 0 to 0.5.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Draws the grid out from the center with a pulse on mount.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Uses near black lines and cells by default, for light pages.'
  },
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'Content drawn above the grid. The grid keeps reacting to the cursor underneath it.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const CursorGridDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, color, gridColor, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const swap = theme === 'light' ? LIGHT_SWAP : DARK_SWAP;
  const tone = swap[color.toLowerCase()] ?? color;
  const lines = swap[gridColor.toLowerCase()] ?? gridColor;

  const applyPreset = value => {
    updateProps({ ...LOOK, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
      computedProps={{ color: tone, gridColor: lines, ...(theme === 'light' ? { lightMode: true } : {}) }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <CursorGrid key={key} {...settings} color={tone} gridColor={lines} lightMode={theme === 'light'} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom title="Color" color={tone} onChange={value => updateProp('color', value)} />
            <PreviewColorPickerCustom
              title="Grid Color"
              color={lines}
              onChange={value => updateProp('gridColor', value)}
            />
            <PreviewSelect
              title="Highlight"
              options={HIGHLIGHT_OPTIONS}
              value={settings.highlight}
              onChange={value => updateProp('highlight', value)}
            />
            <PreviewSelect
              title="Grid Style"
              options={STYLE_OPTIONS}
              value={settings.gridStyle}
              onChange={value => updateProp('gridStyle', value)}
            />
            <PreviewSelect
              title="Falloff"
              options={FALLOFF_OPTIONS}
              value={settings.falloff}
              isDisabled={settings.highlight === 'cell'}
              onChange={value => updateProp('falloff', value)}
            />
            <PreviewSlider
              title="Cell Size"
              min={20}
              max={160}
              step={2}
              value={settings.cellSize}
              valueUnit="px"
              onChange={value => updateProp('cellSize', value)}
            />
            <PreviewSlider
              title="Radius"
              min={40}
              max={400}
              step={10}
              value={settings.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Hold Time"
              min={0}
              max={2000}
              step={50}
              value={settings.holdTime}
              valueUnit="ms"
              onChange={value => updateProp('holdTime', value)}
            />
            <PreviewSlider
              title="Fade Duration"
              min={100}
              max={3000}
              step={50}
              value={settings.fadeDuration}
              valueUnit="ms"
              onChange={value => updateProp('fadeDuration', value)}
            />
            <PreviewSlider
              title="Line Width"
              min={0.5}
              max={4}
              step={0.1}
              value={settings.lineWidth}
              valueUnit="px"
              onChange={value => updateProp('lineWidth', value)}
            />
            <PreviewSlider
              title="Max Opacity"
              min={0.1}
              max={1}
              step={0.05}
              value={settings.maxOpacity}
              onChange={value => updateProp('maxOpacity', value)}
            />
            <PreviewSlider
              title="Fill Opacity"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.fillOpacity}
              onChange={value => updateProp('fillOpacity', value)}
            />
            <PreviewSlider
              title="Grid Opacity"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.gridOpacity}
              onChange={value => updateProp('gridOpacity', value)}
            />
            <PreviewSlider
              title="Spotlight"
              min={0}
              max={1}
              step={0.01}
              value={settings.spotlight}
              onChange={value => updateProp('spotlight', value)}
            />
            <PreviewSlider
              title="Cell Gap"
              min={0}
              max={16}
              step={1}
              value={settings.cellGap}
              valueUnit="px"
              onChange={value => updateProp('cellGap', value)}
            />
            <PreviewSlider
              title="Cell Corners"
              min={0}
              max={24}
              step={1}
              value={settings.cellRadius}
              valueUnit="px"
              onChange={value => updateProp('cellRadius', value)}
            />
            <PreviewSlider
              title="Pulse Speed"
              min={100}
              max={2000}
              step={50}
              value={settings.pulseSpeed}
              valueUnit="px/s"
              isDisabled={!settings.clickPulse}
              onChange={value => updateProp('pulseSpeed', value)}
            />
            <PreviewSlider
              title="Ambient"
              min={0}
              max={1}
              step={0.01}
              value={settings.ambient}
              onChange={value => updateProp('ambient', value)}
            />
            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.edgeFade}
              onChange={value => updateProp('edgeFade', value)}
            />
            <PreviewSwitch
              title="Click Pulse"
              isChecked={settings.clickPulse}
              onChange={value => updateProp('clickPulse', value)}
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
          <CodeExample codeObject={cursorGrid} componentName="CursorGrid" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CursorGridDemo;
