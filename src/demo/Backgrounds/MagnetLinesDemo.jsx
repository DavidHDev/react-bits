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
import { useColorModeValue } from '../../components/setup/color-mode';

import MagnetLines from '../../content/Backgrounds/MagnetLines/MagnetLines';
import { magnetLines } from '../../constants/code/Backgrounds/magnetLinesCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/MagnetLines';

const SQUARE_SIZE = 'min(440px, 86%)';

const DEFAULT_PROPS = { preset: 'classic', layout: 'full', ...LOOK, clickPulse: true, intro: true, idle: false };

const LIGHT_SWAP = {
  '#efefef': '#27272a',
  '#38bdf8': '#0284c7',
  '#f43f5e': '#e11d48'
};

const DARK_SWAP = Object.fromEntries(Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]));

const LAYOUT_OPTIONS = [
  { value: 'full', label: 'Full' },
  { value: 'square', label: 'Square' }
];

const MODE_OPTIONS = [
  { value: 'orbit', label: 'Orbit' },
  { value: 'attract', label: 'Attract' },
  { value: 'spiral', label: 'Spiral' },
  { value: 'dipole', label: 'Dipole' }
];

const SHAPE_OPTIONS = [
  { value: 'line', label: 'Line' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'needle', label: 'Needle' }
];

const propData = [
  {
    name: 'spacing',
    type: 'number',
    default: '30',
    description: 'Distance between lines in px. The grid fills the area with as many lines as fit.'
  },
  { name: 'rows', type: 'number', default: '-', description: 'Exact number of rows. Overrides spacing.' },
  { name: 'columns', type: 'number', default: '-', description: 'Exact number of columns. Overrides spacing.' },
  {
    name: 'containerSize',
    type: 'number | string',
    default: '-',
    description:
      'Draws a square field of this width instead of filling the parent. Numbers are in px; strings take any CSS length.'
  },
  { name: 'lineColor', type: 'string', default: "'#efefef'", description: 'Color of the lines.' },
  {
    name: 'accentColor',
    type: 'string',
    default: '-',
    description: 'Color lines take on near the cursor. Compass needles use it for their north half.'
  },
  {
    name: 'lineWidth',
    type: 'number | string',
    default: '2',
    description: 'Thickness of each line. Numbers are in px; strings take any CSS length.'
  },
  {
    name: 'lineHeight',
    type: 'number | string',
    default: '18',
    description: 'Length of each line. Numbers are in px; strings take any CSS length.'
  },
  {
    name: 'baseAngle',
    type: 'number',
    default: '-10',
    description: 'Resting angle of the lines in degrees, used before the intro and outside the reach.'
  },
  {
    name: 'mode',
    type: "'orbit' | 'attract' | 'spiral' | 'dipole'",
    default: "'orbit'",
    description:
      'Shape of the field: rings around the cursor, lines aiming at it, a vortex, or a bar magnet that turns with your movement.'
  },
  {
    name: 'shape',
    type: "'line' | 'arrow' | 'needle'",
    default: "'line'",
    description: 'Draws each line as a rounded bar, an arrow showing the field direction, or a two-tone compass needle.'
  },
  {
    name: 'rainbow',
    type: 'boolean',
    default: 'false',
    description: 'Colors every line by the direction it points, so the field becomes a color wheel.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '200',
    description: 'Size of the area around the cursor where lines are brightest and longest, in px.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0.65',
    description: 'How much lines dim away from the cursor, from 0 to 1. 0 keeps every line at full strength.'
  },
  {
    name: 'edgeFade',
    type: 'number',
    default: '0',
    description: 'Fades the edges into the page, from 0 to 1.'
  },
  {
    name: 'stretch',
    type: 'number',
    default: '0.4',
    description: 'How much lines grow near the cursor, from 0 to 2.'
  },
  {
    name: 'reach',
    type: 'number',
    default: '0',
    description:
      'Distance in px within which lines follow the cursor. Lines farther out settle back to their resting angle. 0 means every line follows.'
  },
  {
    name: 'scatter',
    type: 'number',
    default: '0',
    description:
      'Randomizes the resting angle of each line, from 0 to 1, like loose iron filings. Pairs well with reach.'
  },
  {
    name: 'inertia',
    type: 'number',
    default: '0.35',
    description: 'How slowly the lines swing into place, from 0 to 1. 0 snaps them instantly.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.3',
    description: 'How much the lines overshoot and wobble as they settle, from 0 to 1.'
  },
  {
    name: 'ripple',
    type: 'number',
    default: '0.3',
    description: 'Delays lines by their distance from the cursor so movement ripples outward, from 0 to 1.'
  },
  {
    name: 'clickPulse',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ring that spins the lines as it travels outward.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Lines fade in from the center and swing into place when the field mounts.'
  },
  {
    name: 'idle',
    type: 'boolean',
    default: 'false',
    description: 'Moves the field on its own when the cursor is away.'
  },
  {
    name: 'tiltX',
    type: 'number',
    default: '0',
    description:
      'Tilts the field back in 3D around the horizontal axis, in degrees. A full-size field stretches to the horizon.'
  },
  {
    name: 'tiltY',
    type: 'number',
    default: '0',
    description: 'Tilts the field in 3D around the vertical axis, in degrees.'
  },
  {
    name: 'maxDevicePixelRatio',
    type: 'number',
    default: '2',
    description: 'Highest pixel ratio the canvas renders at.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const swapColor = (value, swap) => {
  if (!value) return value;
  const key = `#${String(value).replace(/^#/, '').toLowerCase()}`;
  return swap[key] ?? key;
};

const MagnetLinesDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, layout, lineColor, accentColor, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const swap = theme === 'light' ? LIGHT_SWAP : DARK_SWAP;
  const line = swapColor(lineColor || defaultProps.lineColor, swap);
  const accent = swapColor(accentColor, swap);
  const square = layout === 'square';
  const colors = { lineColor: line, ...(accent ? { accentColor: accent } : {}) };

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'layout', 'lineColor', 'accentColor']}
      computedProps={{ ...colors, ...(square ? { containerSize: SQUARE_SIZE } : {}) }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <MagnetLines key={key} {...settings} {...colors} containerSize={square ? SQUARE_SIZE : undefined} />
            {!square && <BackgroundContent headline="Every line turns to follow your cursor" />}
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="magnet-lines"
              currentProps={{ ...settings, ...colors }}
              defaultProps={{ ...LOOK, lineColor: defaultProps.lineColor }}
            />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Layout"
              options={LAYOUT_OPTIONS}
              value={layout}
              onChange={value => updateProp('layout', value)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings.mode}
              onChange={value => updateProp('mode', value)}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewColorPickerCustom
              title="Line Color"
              color={line}
              onChange={value => updateProp('lineColor', value)}
            />
            <PreviewColorPickerCustom
              title="Accent Color"
              color={accent || line}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSlider
              title="Spacing"
              min={12}
              max={80}
              step={1}
              value={settings.spacing}
              valueUnit="px"
              onChange={value => updateProp('spacing', value)}
            />
            <PreviewSlider
              title="Line Width"
              min={0.5}
              max={8}
              step={0.5}
              value={settings.lineWidth}
              valueUnit="px"
              onChange={value => updateProp('lineWidth', value)}
            />
            <PreviewSlider
              title="Line Length"
              min={4}
              max={60}
              step={1}
              value={settings.lineHeight}
              valueUnit="px"
              onChange={value => updateProp('lineHeight', value)}
            />
            <PreviewSlider
              title="Base Angle"
              min={-180}
              max={180}
              step={5}
              value={settings.baseAngle}
              valueUnit="°"
              onChange={value => updateProp('baseAngle', value)}
            />
            <PreviewSlider
              title="Radius"
              min={40}
              max={500}
              step={10}
              value={settings.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
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
              title="Edge Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.edgeFade}
              onChange={value => updateProp('edgeFade', value)}
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
              title="Reach"
              min={0}
              max={400}
              step={10}
              value={settings.reach}
              valueUnit="px"
              onChange={value => updateProp('reach', value)}
            />
            <PreviewSlider
              title="Scatter"
              min={0}
              max={1}
              step={0.05}
              value={settings.scatter}
              onChange={value => updateProp('scatter', value)}
            />
            <PreviewSlider
              title="Inertia"
              min={0}
              max={1}
              step={0.05}
              value={settings.inertia}
              onChange={value => updateProp('inertia', value)}
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
              title="Ripple"
              min={0}
              max={1}
              step={0.05}
              value={settings.ripple}
              onChange={value => updateProp('ripple', value)}
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
            <PreviewSwitch
              title="Rainbow"
              isChecked={settings.rainbow}
              onChange={value => updateProp('rainbow', value)}
            />
            <PreviewSwitch
              title="Click Pulse"
              isChecked={settings.clickPulse}
              onChange={value => updateProp('clickPulse', value)}
            />
            <PreviewSwitch title="Idle" isChecked={settings.idle} onChange={value => updateProp('idle', value)} />
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
          <CodeExample codeObject={magnetLines} componentName="MagnetLines" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default MagnetLinesDemo;
