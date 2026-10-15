import { useMemo } from 'react';
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
import useThemedProps from '../../hooks/useThemedProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import ShapeGrid from '../../content/Backgrounds/ShapeGrid/ShapeGrid';
import { shapeGrid } from '../../constants/code/Backgrounds/shapeGridCode';
import { LOOK, PRESETS, PRESET_OPTIONS, presetProps } from './presets/ShapeGrid';

const DEFAULT_PROPS = { preset: 'classic', ...LOOK };

const SHAPE_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'tile', label: 'Tile' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'circle', label: 'Circle' },
  { value: 'cross', label: 'Cross' },
  { value: 'dot', label: 'Dot' }
];

const DIRECTION_OPTIONS = [
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'none', label: 'None' }
];

const propData = [
  {
    name: 'shape',
    type: "'square' | 'tile' | 'hexagon' | 'triangle' | 'diamond' | 'circle' | 'cross' | 'dot'",
    default: "'square'",
    description: 'Shape of the cells. Cross and dot draw markers where the grid lines would meet.'
  },
  { name: 'cellSize', type: 'number', default: '40', description: 'Size of each cell, in px.' },
  { name: 'lineWidth', type: 'number', default: '1', description: 'Thickness of the grid lines, in px.' },
  {
    name: 'direction',
    type: "'diagonal' | 'up' | 'down' | 'left' | 'right' | 'none'",
    default: "'diagonal'",
    description: 'Which way the grid drifts. None holds it still.'
  },
  { name: 'speed', type: 'number', default: '0.5', description: 'How fast the grid drifts.' },
  { name: 'lineColor', type: 'string', default: "'#2a2734'", description: 'Color of the grid lines.' },
  {
    name: 'hoverColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color the cell borders light up in under the cursor.'
  },
  {
    name: 'hoverFillColor',
    type: 'string',
    default: 'hoverColor',
    description: 'Color that fills the inside of lit cells. Follows hoverColor when not set.'
  },
  {
    name: 'fillOpacity',
    type: 'number',
    default: '0.15',
    description: 'How solid the inside of lit cells gets, from 0 for outlines only to 1 for solid cells.'
  },
  {
    name: 'rainbow',
    type: 'boolean',
    default: 'false',
    description: 'Lights cells in shifting rainbow colors instead of the hover color.'
  },
  {
    name: 'tiltX',
    type: 'number',
    default: '0',
    description: 'Tilts the grid back in perspective, in degrees. Positive values push the top away.'
  },
  {
    name: 'tiltY',
    type: 'number',
    default: '0',
    description: 'Turns the grid sideways in perspective, in degrees. Positive values push the right side away.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '1.5',
    description: 'Size of the light around the cursor, in cells. 0 lights only the cell under it.'
  },
  {
    name: 'trail',
    type: 'number',
    default: '0.6',
    description: 'How long lit cells take to fade after the cursor moves on, in seconds.'
  },
  { name: 'glow', type: 'number', default: '0.35', description: 'Soft glow around lit cells, from 0 to 1.' },
  {
    name: 'twinkle',
    type: 'number',
    default: '0',
    description: 'Lets random cells light up on their own now and then, from 0 to 1.'
  },
  { name: 'fade', type: 'number', default: '1', description: 'Fades the grid out toward the edges, from 0 to 1.' },
  {
    name: 'clickCascade',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ring of lit cells rolling out across the grid.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Draws the grid in from the middle when it first appears.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole grid.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Color behind the grid. By default the canvas is transparent.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the drift and the lights.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const ShapeGridDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const current = PRESETS[props.preset] ?? PRESETS.classic;
  const darkColors = useMemo(
    () => ({
      lineColor: current.look.lineColor,
      hoverColor: current.look.hoverColor,
      hoverFillColor: current.look.hoverFillColor
    }),
    [current]
  );
  const themedProps = useThemedProps(props, darkColors, current.light);
  const { preset, ...settings } = themedProps;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={themedProps}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={{ base: 420, md: 520 }} p={0} overflow="hidden">
            <ShapeGrid key={key} {...settings} />
            <BackgroundContent pillText="New Background" headline="A living grid that lights up wherever you go" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="shape-grid" currentProps={settings} defaultProps={LOOK} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewColorPickerCustom
              title="Line Color"
              color={settings.lineColor}
              onChange={value => updateProp('lineColor', value)}
            />
            <PreviewColorPickerCustom
              title="Hover Border"
              color={settings.hoverColor}
              onChange={value => updateProp('hoverColor', value)}
            />
            <PreviewColorPickerCustom
              title="Hover Fill"
              color={settings.hoverFillColor}
              onChange={value => updateProp('hoverFillColor', value)}
            />
            <PreviewSwitch
              title="Rainbow"
              isChecked={settings.rainbow}
              onChange={value => updateProp('rainbow', value)}
            />
            <PreviewSlider
              title="Cell Size"
              min={14}
              max={100}
              step={1}
              value={settings.cellSize}
              valueUnit="px"
              onChange={value => updateProp('cellSize', value)}
            />
            <PreviewSlider
              title="Line Width"
              min={0.5}
              max={3}
              step={0.25}
              value={settings.lineWidth}
              valueUnit="px"
              onChange={value => updateProp('lineWidth', value)}
            />
            <PreviewSlider
              title="Fill Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.fillOpacity}
              onChange={value => updateProp('fillOpacity', value)}
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
              title="Tilt X"
              min={-60}
              max={60}
              step={1}
              value={settings.tiltX}
              valueUnit="°"
              onChange={value => updateProp('tiltX', value)}
            />
            <PreviewSlider
              title="Tilt Y"
              min={-60}
              max={60}
              step={1}
              value={settings.tiltY}
              valueUnit="°"
              onChange={value => updateProp('tiltY', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={5}
              step={0.1}
              value={settings.radius}
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0.1}
              max={3}
              step={0.05}
              value={settings.trail}
              valueUnit="s"
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Twinkle"
              min={0}
              max={1}
              step={0.05}
              value={settings.twinkle}
              onChange={value => updateProp('twinkle', value)}
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
              title="Click Cascade"
              isChecked={settings.clickCascade}
              onChange={value => updateProp('clickCascade', value)}
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
          <CodeExample codeObject={shapeGrid} componentName="ShapeGrid" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ShapeGridDemo;
