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
import { useColorMode } from '../../components/setup/color-mode';

import GridScan from '../../content/Backgrounds/GridScan/GridScan';
import { gridScan } from '../../constants/code/Backgrounds/gridScanCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/GridScan';

const STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' }
];

const DIRECTION_OPTIONS = [
  { value: 'forward', label: 'Forward' },
  { value: 'backward', label: 'Backward' },
  { value: 'pingpong', label: 'Ping Pong' }
];

const CLICK_OPTIONS = [
  { value: 'ping', label: 'Ping' },
  { value: 'scan', label: 'Scan' },
  { value: 'none', label: 'None' }
];

const propData = [
  {
    name: 'linesColor',
    type: 'string',
    default: "'#4d4757'",
    description: 'Color of the grid lines. Light mode defaults to a pale gray.'
  },
  {
    name: 'scanColor',
    type: 'string',
    default: "'#7dd3fc'",
    description: 'Color of the scan, its trail, the points and the click ping. Light mode defaults to a deeper blue.'
  },
  { name: 'cells', type: 'number', default: '8', description: 'Number of grid cells from the floor to the ceiling.' },
  { name: 'lineThickness', type: 'number', default: '1', description: 'Thickness of the grid lines in pixels.' },
  {
    name: 'lineStyle',
    type: "'solid' | 'dashed' | 'dotted'",
    default: "'solid'",
    description: 'Style of the grid lines.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '3',
    description: 'How deep the room goes, relative to its height. High values turn it into a long corridor.'
  },
  {
    name: 'depthFade',
    type: 'number',
    default: '0.6',
    description: 'How much the room fades into the distance, from 0 (evenly bright) to 1 (gone by the back wall).'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '1',
    description:
      'How far the view shifts as the cursor moves, as if you were moving your head in front of a window. 0 keeps it still.'
  },
  {
    name: 'shading',
    type: 'number',
    default: '0.7',
    description: 'Soft light and corner shadows on the walls, from 0 (pure wireframe) to 1.'
  },
  {
    name: 'reflection',
    type: 'number',
    default: '0.35',
    description: 'How much the glossy floor reflects the scan and pings, from 0 to 1.'
  },
  {
    name: 'points',
    type: 'boolean',
    default: 'true',
    description: 'Scatters points over the walls that sparkle as the scan passes, like a LiDAR capture.'
  },
  {
    name: 'scanDirection',
    type: "'forward' | 'backward' | 'pingpong'",
    default: "'forward'",
    description: 'Whether the scan travels into the room, out of it, or alternates.'
  },
  { name: 'scanDuration', type: 'number', default: '2.4', description: 'Seconds each scan takes to cross the room.' },
  { name: 'scanDelay', type: 'number', default: '1.6', description: 'Seconds between scans.' },
  {
    name: 'scanWidth',
    type: 'number',
    default: '1',
    description: 'Thickness of the scan line, from 0.2 to 5.'
  },
  {
    name: 'trail',
    type: 'number',
    default: '0.5',
    description: 'How long the walls keep glowing behind the scan, from 0 to 1.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '0.6',
    description: 'Bloom around the scan line and points, from 0 to 1.5.'
  },
  {
    name: 'autoScan',
    type: 'boolean',
    default: 'true',
    description: 'Runs scans on a loop. Turn it off to scan only on click.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'Moves the view with the cursor and lights up the walls under it.'
  },
  {
    name: 'clickEffect',
    type: "'ping' | 'scan' | 'none'",
    default: "'ping'",
    description:
      'What a click does. Ping sends a ring of light across the walls from that spot, scan starts a new scan.'
  },
  {
    name: 'enableWebcam',
    type: 'boolean',
    default: 'false',
    description:
      'Moves the view with your head through the webcam. The face tracker is loaded from a CDN the first time it turns on.'
  },
  {
    name: 'showPreview',
    type: 'boolean',
    default: 'false',
    description: 'Shows a small camera preview with the tracking status while the webcam is on.'
  },
  {
    name: 'modelsPath',
    type: 'string',
    default: 'CDN URL',
    description: 'Where the face tracking model is loaded from. Point it at your own copy to self-host.'
  },
  {
    name: 'enableGyro',
    type: 'boolean',
    default: 'false',
    description: 'Moves the view as a phone or tablet tilts. iOS asks for permission on the first tap.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Reveals the room with a first scan on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Renders a bright room with dark shading for light backgrounds.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const GridScanDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: colorMode === 'light', defaults: defaultProps }), preset: value });
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
            <GridScan key={key} {...settings} />
            <BackgroundContent headline="Hold on, scanning for Angular users." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="grid-scan" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom
              title="Lines Color"
              color={settings.linesColor}
              onChange={value => updateProp('linesColor', value)}
            />
            <PreviewColorPickerCustom
              title="Scan Color"
              color={settings.scanColor}
              onChange={value => updateProp('scanColor', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Line Style"
              options={STYLE_OPTIONS}
              value={settings.lineStyle}
              onChange={value => updateProp('lineStyle', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.scanDirection}
              onChange={value => updateProp('scanDirection', value)}
            />
            <PreviewSelect
              title="Click Effect"
              options={CLICK_OPTIONS}
              value={settings.clickEffect}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewSlider
              title="Cells"
              min={3}
              max={20}
              step={1}
              value={settings.cells}
              onChange={value => updateProp('cells', value)}
            />
            <PreviewSlider
              title="Line Thickness"
              min={0.5}
              max={3}
              step={0.1}
              value={settings.lineThickness}
              valueUnit="px"
              onChange={value => updateProp('lineThickness', value)}
            />
            <PreviewSlider
              title="Depth"
              min={1}
              max={10}
              step={0.1}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Depth Fade"
              min={0}
              max={1}
              step={0.01}
              value={settings.depthFade}
              onChange={value => updateProp('depthFade', value)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={2}
              step={0.05}
              value={settings.parallax}
              onChange={value => updateProp('parallax', value)}
            />
            <PreviewSlider
              title="Shading"
              min={0}
              max={1}
              step={0.01}
              value={settings.shading}
              onChange={value => updateProp('shading', value)}
            />
            <PreviewSlider
              title="Reflection"
              min={0}
              max={1}
              step={0.01}
              value={settings.reflection}
              onChange={value => updateProp('reflection', value)}
            />
            <PreviewSlider
              title="Scan Duration"
              min={0.5}
              max={6}
              step={0.1}
              value={settings.scanDuration}
              valueUnit="s"
              onChange={value => updateProp('scanDuration', value)}
            />
            <PreviewSlider
              title="Scan Delay"
              min={0}
              max={6}
              step={0.1}
              value={settings.scanDelay}
              valueUnit="s"
              isDisabled={!settings.autoScan}
              onChange={value => updateProp('scanDelay', value)}
            />
            <PreviewSlider
              title="Scan Width"
              min={0.2}
              max={5}
              step={0.1}
              value={settings.scanWidth}
              onChange={value => updateProp('scanWidth', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0}
              max={1}
              step={0.01}
              value={settings.trail}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1.5}
              step={0.01}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSwitch title="Points" isChecked={settings.points} onChange={value => updateProp('points', value)} />
            <PreviewSwitch
              title="Auto Scan"
              isChecked={settings.autoScan}
              onChange={value => updateProp('autoScan', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings.interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSwitch
              title="Webcam"
              isChecked={settings.enableWebcam}
              onChange={value => updateProp('enableWebcam', value)}
            />
            <PreviewSwitch
              title="Camera Preview"
              isChecked={settings.showPreview}
              isDisabled={!settings.enableWebcam}
              onChange={value => updateProp('showPreview', value)}
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
          <CodeExample codeObject={gridScan} componentName="GridScan" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GridScanDemo;
