import { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PropTable from '../../components/common/Preview/PropTable';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import useThemedProps from '../../hooks/useThemedProps';

import PatternWaves from '../../content/Backgrounds/PatternWaves/PatternWaves';
import { patternWaves } from '../../constants/code/Backgrounds/patternWavesCode';

const PRESETS = {
  silk: {
    pattern: 'dot',
    wave: 'silk',
    spacing: 9,
    markSize: 0.95,
    depth: 0.95,
    light: 0,
    shine: 0.8,
    contrast: 1.2,
    speed: 0.35,
    scale: 1,
    direction: 20
  },
  ocean: {
    pattern: 'dot',
    wave: 'swell',
    spacing: 10,
    markSize: 0.9,
    depth: 0.42,
    light: 0,
    shine: 1,
    contrast: 1.2,
    speed: 0.5,
    scale: 1,
    direction: 100
  },
  pond: {
    pattern: 'dot',
    wave: 'ripple',
    spacing: 10,
    markSize: 0.9,
    depth: 0.55,
    light: 0,
    shine: 1.2,
    contrast: 1.2,
    speed: 0.5,
    scale: 1,
    direction: 35
  },
  lines: {
    pattern: 'line',
    wave: 'silk',
    spacing: 12,
    markSize: 0.42,
    depth: 0.9,
    light: 0,
    shine: 0.6,
    contrast: 1.2,
    speed: 0.3,
    scale: 1,
    direction: 20
  },
  terminal: {
    pattern: 'glyph',
    wave: 'ripple',
    spacing: 13,
    markSize: 0.95,
    depth: 0.75,
    light: 0,
    shine: 0.9,
    contrast: 1.4,
    speed: 0.3,
    scale: 1.1,
    direction: 200
  },
  mesh: {
    pattern: 'plus',
    wave: 'silk',
    spacing: 14,
    markSize: 0.8,
    depth: 0.95,
    light: 0,
    shine: 1,
    contrast: 1.45,
    speed: 0.4,
    scale: 1.1,
    direction: 325
  }
};

const PRESET_OPTIONS = [
  { label: 'Silk', value: 'silk' },
  { label: 'Ocean', value: 'ocean' },
  { label: 'Pond', value: 'pond' },
  { label: 'Lines', value: 'lines' },
  { label: 'Terminal', value: 'terminal' },
  { label: 'Mesh', value: 'mesh' }
];

const PATTERN_OPTIONS = [
  { label: 'Dot', value: 'dot' },
  { label: 'Square', value: 'square' },
  { label: 'Plus', value: 'plus' },
  { label: 'Line', value: 'line' },
  { label: 'Glyph', value: 'glyph' }
];

const WAVE_OPTIONS = [
  { label: 'Silk', value: 'silk' },
  { label: 'Swell', value: 'swell' },
  { label: 'Ripple', value: 'ripple' }
];

const FADE_OPTIONS = [
  { label: 'Edges', value: 'edges' },
  { label: 'Center', value: 'center' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Top', value: 'top' },
  { label: 'None', value: 'none' }
];

const DEFAULT_PROPS = {
  preset: 'silk',
  ...PRESETS.silk,
  color: '#ffffff',
  backgroundColor: '#120f17',
  opacity: 1,
  fade: 'edges',
  fadeSize: 0.5,
  characters: '.:-=+*#%@',
  interactive: true,
  cursorSize: 50,
  cursorStrength: 0.6,
  intro: true,
  paused: false
};

const LIGHT_PROPS = {
  color: '#18181b',
  backgroundColor: '#ffffff'
};

const PatternWavesDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const themedProps = useThemedProps(props, DEFAULT_PROPS, LIGHT_PROPS);

  const choosePreset = value => {
    updateProps({ preset: value, ...(PRESETS[value] || PRESETS.silk) });
  };

  const propData = useMemo(
    () => [
      {
        name: 'preset',
        type: "'silk' | 'ocean' | 'pond' | 'lines' | 'terminal' | 'mesh'",
        default: "'silk'",
        description:
          'A complete starting look. Every pattern, wave and light prop below overrides the preset value when you pass it.'
      },
      {
        name: 'pattern',
        type: "'dot' | 'square' | 'plus' | 'line' | 'glyph'",
        default: 'from preset',
        description:
          'The mark that draws the surface. Line traces it as flowing contour lines, glyph uses characters picked by brightness.'
      },
      {
        name: 'wave',
        type: "'silk' | 'swell' | 'ripple'",
        default: 'from preset',
        description:
          'The shape of the moving surface. Silk is draped fabric folds, swell is rolling parallel waves, ripple is rings travelling in from off screen.'
      },
      {
        name: 'color',
        type: 'string',
        default: "'#ffffff'",
        description:
          'The one color of the pattern. Shadows, midtones and highlights are all derived from it. A color darker than the background prints like ink.'
      },
      {
        name: 'backgroundColor',
        type: 'string',
        default: "'#000000'",
        description: 'Color behind the pattern. Pass transparent to show the page through.'
      },
      {
        name: 'spacing',
        type: 'number',
        default: 'from preset',
        description: 'Distance between marks in CSS pixels. Smaller values give a finer print.'
      },
      {
        name: 'markSize',
        type: 'number',
        default: 'from preset',
        description: 'Largest mark as a fraction of the spacing.'
      },
      {
        name: 'depth',
        type: 'number',
        default: 'from preset',
        description:
          'How tall the surface is. Deeper surfaces cast stronger shading and lift the marks along the crests.'
      },
      {
        name: 'light',
        type: 'number',
        default: 'from preset',
        description:
          'Angle of the light across the waves in degrees, from -90 to 90. 0 lights the folds head on, larger values graze them.'
      },
      {
        name: 'shine',
        type: 'number',
        default: 'from preset',
        description: 'Strength of the glints where the surface catches the light.'
      },
      {
        name: 'contrast',
        type: 'number',
        default: 'from preset',
        description: 'Spread between the quiet shadows and the lit areas.'
      },
      {
        name: 'speed',
        type: 'number',
        default: 'from preset',
        description: 'How fast the surface moves. 0 freezes it while the cursor keeps working.'
      },
      {
        name: 'scale',
        type: 'number',
        default: 'from preset',
        description: 'Size of the waves. Larger values give broader, calmer forms.'
      },
      {
        name: 'direction',
        type: 'number',
        default: 'from preset',
        description: 'Direction the waves travel in degrees. The light turns with it.'
      },
      {
        name: 'opacity',
        type: 'number',
        default: '1',
        description: 'Overall opacity of the pattern, from 0 to 1.'
      },
      {
        name: 'fade',
        type: "'edges' | 'center' | 'bottom' | 'top' | 'none'",
        default: "'edges'",
        description:
          'Where the pattern fades into the background. Center keeps the middle calm for a headline, bottom and top fade towards that edge.'
      },
      {
        name: 'fadeSize',
        type: 'number',
        default: '0.5',
        description: 'How far the fade reaches, from 0.05 to 1.'
      },
      {
        name: 'characters',
        type: 'string',
        default: "'.:-=+*#%@'",
        description: 'Characters for the glyph pattern, ordered from the lightest to the densest.'
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'true',
        description:
          'Lets the cursor disturb the surface. Moving it leaves a wake of ripples that catch the light, a click drops a splash.'
      },
      {
        name: 'cursorSize',
        type: 'number',
        default: '50',
        description: 'Radius of the patch of surface the cursor pushes, in CSS pixels.'
      },
      {
        name: 'cursorStrength',
        type: 'number',
        default: '0.6',
        description: 'How hard the cursor pushes the surface, from 0 to 1.'
      },
      {
        name: 'intro',
        type: 'boolean',
        default: 'true',
        description:
          'On mount the marks fade in from the center, then the surface rises and the light sweeps across it.'
      },
      {
        name: 'paused',
        type: 'boolean',
        default: 'false',
        description: 'Freezes the surface. The cursor ripples keep working.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root element.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider
      props={themedProps}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <PatternWaves key={key} {...themedProps} />
            <BackgroundContent headline="Soft light on a moving surface." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="pattern-waves" currentProps={themedProps} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props.preset} onChange={choosePreset} />
            <PreviewSelect
              title="Pattern"
              options={PATTERN_OPTIONS}
              value={props.pattern}
              onChange={value => updateProp('pattern', value)}
            />
            <PreviewSelect
              title="Wave"
              options={WAVE_OPTIONS}
              value={props.wave}
              onChange={value => updateProp('wave', value)}
            />
            <PreviewInput
              title="Characters"
              value={props.characters}
              placeholder="Lightest to densest"
              maxLength={24}
              isDisabled={props.pattern !== 'glyph'}
              onChange={value => updateProp('characters', value)}
            />

            <PreviewColorPickerCustom
              title="Color"
              color={themedProps.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={themedProps.backgroundColor}
              onChange={value => updateProp('backgroundColor', value)}
            />

            <PreviewSlider
              title="Spacing"
              min={5}
              max={30}
              step={1}
              value={props.spacing}
              valueUnit="px"
              onChange={value => updateProp('spacing', value)}
            />
            <PreviewSlider
              title="Mark Size"
              min={0.3}
              max={1}
              step={0.05}
              value={props.markSize}
              onChange={value => updateProp('markSize', value)}
            />

            <PreviewSlider
              title="Depth"
              min={0}
              max={1.5}
              step={0.05}
              value={props.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Light"
              min={-90}
              max={90}
              step={1}
              value={props.light}
              valueUnit="°"
              onChange={value => updateProp('light', value)}
            />
            <PreviewSlider
              title="Shine"
              min={0}
              max={2}
              step={0.05}
              value={props.shine}
              onChange={value => updateProp('shine', value)}
            />
            <PreviewSlider
              title="Contrast"
              min={0.5}
              max={2.5}
              step={0.05}
              value={props.contrast}
              onChange={value => updateProp('contrast', value)}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.3}
              max={3}
              step={0.05}
              value={props.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Direction"
              min={0}
              max={360}
              step={1}
              value={props.direction}
              valueUnit="°"
              onChange={value => updateProp('direction', value)}
            />

            <PreviewSelect
              title="Fade"
              options={FADE_OPTIONS}
              value={props.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Fade Size"
              min={0.1}
              max={1}
              step={0.05}
              value={props.fadeSize}
              isDisabled={props.fade === 'none'}
              onChange={value => updateProp('fadeSize', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={props.opacity}
              onChange={value => updateProp('opacity', value)}
            />

            <PreviewSwitch
              title="Interactive"
              isChecked={props.interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSlider
              title="Cursor Size"
              min={10}
              max={200}
              step={5}
              value={props.cursorSize}
              valueUnit="px"
              isDisabled={!props.interactive}
              onChange={value => updateProp('cursorSize', value)}
            />
            <PreviewSlider
              title="Cursor Strength"
              min={0}
              max={1}
              step={0.05}
              value={props.cursorStrength}
              isDisabled={!props.interactive}
              onChange={value => updateProp('cursorStrength', value)}
            />

            <PreviewSwitch title="Intro" isChecked={props.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch title="Paused" isChecked={props.paused} onChange={value => updateProp('paused', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={patternWaves} componentName="PatternWaves" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PatternWavesDemo;
