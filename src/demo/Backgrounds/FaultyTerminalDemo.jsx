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

import FaultyTerminal from '../../content/Backgrounds/FaultyTerminal/FaultyTerminal';
import { faultyTerminal } from '../../constants/code/Backgrounds/faultyTerminalCode';

const LOOK = {
  tint: '#A7EF9E',
  glyphs: 'blocks',
  scale: 1.5,
  digitSize: 1.2,
  timeScale: 0.5,
  brightness: 0.75,
  glow: 0.5,
  persistence: 0.5,
  mouseStrength: 0.5,
  mouseGlow: 0.6,
  scramble: 0.5,
  scanlineIntensity: 0.5,
  glitchAmount: 1,
  flickerAmount: 1,
  noiseAmp: 1,
  chromaticAberration: 0,
  curvature: 0.1,
  vignette: 0.25,
  clickEffect: 'glitch'
};

const DEFAULT_PROPS = {
  preset: 'phosphor',
  ...LOOK,
  mouseReact: true,
  pageLoadAnimation: true,
  pause: false,
  lightMode: false
};

const PRESETS = {
  phosphor: {},
  classic: {
    brightness: 0.6,
    glow: 0,
    persistence: 0,
    mouseGlow: 0,
    vignette: 0,
    clickEffect: 'none'
  },
  terminal: {
    glyphs: 'characters',
    tint: '#B8F5A8',
    scale: 1.2,
    digitSize: 1.15,
    brightness: 0.85,
    scramble: 0.6
  },
  amber: {
    glyphs: 'dots',
    tint: '#FFB347',
    scale: 1.6,
    digitSize: 1.25,
    brightness: 0.8,
    glow: 0.6,
    clickEffect: 'degauss'
  },
  ice: {
    tint: '#7DD3FC',
    scale: 2.2,
    digitSize: 1.3,
    timeScale: 0.35,
    brightness: 0.85,
    glow: 0.7,
    persistence: 0.85,
    mouseGlow: 0.8
  },
  meltdown: {
    tint: '#F4F4F5',
    scale: 1.3,
    timeScale: 0.8,
    brightness: 0.7,
    glitchAmount: 3,
    flickerAmount: 2,
    noiseAmp: 1.3,
    chromaticAberration: 1.5,
    curvature: 0.25,
    vignette: 0.45
  },
  data: {
    glyphs: 'characters',
    tint: '#E4E4E7',
    scale: 2.4,
    digitSize: 1.1,
    brightness: 0.7,
    glow: 0.35,
    scramble: 0.9,
    curvature: 0
  }
};

const LIGHT_SWAP = {
  phosphor: { tint: '#166534', brightness: 0.6 },
  classic: { tint: '#166534', brightness: 0.55 },
  terminal: { tint: '#166534', brightness: 0.75 },
  amber: { tint: '#B45309', brightness: 0.7 },
  ice: { tint: '#0369A1', brightness: 0.7 },
  meltdown: { tint: '#18181B', brightness: 0.6 },
  data: { tint: '#18181B', brightness: 0.6 }
};

const PRESET_OPTIONS = [
  { value: 'phosphor', label: 'Phosphor' },
  { value: 'classic', label: 'Classic' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'amber', label: 'Amber' },
  { value: 'ice', label: 'Ice' },
  { value: 'meltdown', label: 'Meltdown' },
  { value: 'data', label: 'Data' }
];

const GLYPH_OPTIONS = [
  { value: 'blocks', label: 'Blocks' },
  { value: 'dots', label: 'Dots' },
  { value: 'characters', label: 'Characters' }
];

const CLICK_OPTIONS = [
  { value: 'glitch', label: 'Glitch' },
  { value: 'degauss', label: 'Degauss' },
  { value: 'none', label: 'None' }
];

const propData = [
  {
    name: 'tint',
    type: 'string',
    default: "'#ffffff'",
    description: 'Phosphor color of the glyphs. In light mode, light colors are deepened so they print clearly.'
  },
  {
    name: 'glyphs',
    type: "'blocks' | 'dots' | 'characters'",
    default: "'blocks'",
    description:
      'What each cell draws: squares of lit pixels, round LED dots, or terminal characters that keep changing.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Zoom of the pattern. Higher values show more, smaller glyphs.'
  },
  {
    name: 'gridMul',
    type: '[number, number]',
    default: '[2, 1]',
    description: 'Glyph density across and down, multiplied with scale.'
  },
  {
    name: 'digitSize',
    type: 'number',
    default: '1.5',
    description: 'Space around each glyph. 1 packs them edge to edge, higher values leave wider gaps.'
  },
  {
    name: 'timeScale',
    type: 'number',
    default: '0.3',
    description: 'Speed of the animation.'
  },
  {
    name: 'brightness',
    type: 'number',
    default: '1',
    description: 'Overall brightness of the screen, or ink strength in light mode.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '0.5',
    description: 'Phosphor bloom around the glyphs, with richer color in the halo and paler bright cores.'
  },
  {
    name: 'persistence',
    type: 'number',
    default: '0.5',
    description:
      'How long glyphs keep glowing after they switch off, like real phosphor. Leaves trails behind the cursor.'
  },
  {
    name: 'mouseReact',
    type: 'boolean',
    default: 'true',
    description: 'Lights up the glyphs around the cursor. The light rests in the middle while the cursor is away.'
  },
  {
    name: 'mouseStrength',
    type: 'number',
    default: '0.2',
    description: 'How many glyphs the cursor lights up around it.'
  },
  {
    name: 'mouseGlow',
    type: 'number',
    default: '0.6',
    description: 'How much the glyphs under the cursor heat up toward white while you move.'
  },
  {
    name: 'scramble',
    type: 'number',
    default: '0.5',
    description: 'How fast characters change near the cursor. Only used with characters.'
  },
  {
    name: 'clickEffect',
    type: "'glitch' | 'degauss' | 'none'",
    default: "'glitch'",
    description:
      'What a click does: tear the screen into shifting bands, or send a wobbling degauss wave from the click.'
  },
  {
    name: 'scanlineIntensity',
    type: 'number',
    default: '0.3',
    description: 'Strength of the soft halo and the bright band that rolls down the screen.'
  },
  {
    name: 'glitchAmount',
    type: 'number',
    default: '1',
    description: 'How far the faulty bands of the screen shift sideways.'
  },
  {
    name: 'flickerAmount',
    type: 'number',
    default: '1',
    description: 'How often the faulty bands appear.'
  },
  {
    name: 'noiseAmp',
    type: 'number',
    default: '1',
    description: 'Strength of the swirling pattern that decides which glyphs light up.'
  },
  {
    name: 'chromaticAberration',
    type: 'number',
    default: '0',
    description: 'Splits the red and blue channels apart, in pixels.'
  },
  {
    name: 'curvature',
    type: 'number',
    default: '0.2',
    description: 'Bulge of the screen, like the glass of an old tube.'
  },
  {
    name: 'vignette',
    type: 'number',
    default: '0.25',
    description: 'Darkens the edges of the screen so it fades into the page.'
  },
  {
    name: 'dither',
    type: 'number | boolean',
    default: '0',
    description: 'Fine noise that smooths color banding.'
  },
  {
    name: 'pageLoadAnimation',
    type: 'boolean',
    default: 'true',
    description: 'Switches the glyphs on one by one, each with a short phosphor flash, on mount.'
  },
  {
    name: 'pause',
    type: 'boolean',
    default: 'false',
    description: 'Freezes the animation. The cursor still lights up glyphs.'
  },
  {
    name: 'variation',
    type: 'number',
    default: 'random',
    description: 'Picks a fixed pattern. Leave it out for a different one on every mount.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Prints the glyphs as crisp ink on a light page.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const FaultyTerminalDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({
      ...LOOK,
      ...PRESETS[value],
      ...(colorMode === 'light' ? LIGHT_SWAP[value] : null),
      preset: value
    });
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
            <FaultyTerminal key={key} {...settings} />
            <BackgroundContent headline="It works on my machine, please check again" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="faulty-terminal" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Tint"
              color={settings.tint}
              onChange={value => updateProp('tint', value)}
            />
            <PreviewSelect
              title="Glyphs"
              options={GLYPH_OPTIONS}
              value={settings.glyphs}
              onChange={value => updateProp('glyphs', value)}
            />
            <PreviewSelect
              title="Click Effect"
              options={CLICK_OPTIONS}
              value={settings.clickEffect}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.8}
              max={4}
              step={0.1}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Digit Size"
              min={0.9}
              max={2.5}
              step={0.05}
              value={settings.digitSize}
              onChange={value => updateProp('digitSize', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={settings.timeScale}
              onChange={value => updateProp('timeScale', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={1.5}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Persistence"
              min={0}
              max={1}
              step={0.01}
              value={settings.persistence}
              onChange={value => updateProp('persistence', value)}
            />
            <PreviewSlider
              title="Mouse Strength"
              min={0}
              max={1}
              step={0.05}
              value={settings.mouseStrength}
              isDisabled={!settings.mouseReact}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSlider
              title="Mouse Glow"
              min={0}
              max={1}
              step={0.05}
              value={settings.mouseGlow}
              isDisabled={!settings.mouseReact}
              onChange={value => updateProp('mouseGlow', value)}
            />
            <PreviewSlider
              title="Scramble"
              min={0}
              max={1}
              step={0.05}
              value={settings.scramble}
              isDisabled={settings.glyphs !== 'characters'}
              onChange={value => updateProp('scramble', value)}
            />
            <PreviewSlider
              title="Scanline Intensity"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.scanlineIntensity}
              onChange={value => updateProp('scanlineIntensity', value)}
            />
            <PreviewSlider
              title="Glitch Amount"
              min={0}
              max={4}
              step={0.1}
              value={settings.glitchAmount}
              onChange={value => updateProp('glitchAmount', value)}
            />
            <PreviewSlider
              title="Flicker Amount"
              min={0}
              max={3}
              step={0.1}
              value={settings.flickerAmount}
              onChange={value => updateProp('flickerAmount', value)}
            />
            <PreviewSlider
              title="Noise Amplitude"
              min={0.5}
              max={1.5}
              step={0.05}
              value={settings.noiseAmp}
              onChange={value => updateProp('noiseAmp', value)}
            />
            <PreviewSlider
              title="Chromatic Aberration"
              min={0}
              max={4}
              step={0.1}
              value={settings.chromaticAberration}
              valueUnit="px"
              onChange={value => updateProp('chromaticAberration', value)}
            />
            <PreviewSlider
              title="Curvature"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.curvature}
              onChange={value => updateProp('curvature', value)}
            />
            <PreviewSlider
              title="Vignette"
              min={0}
              max={1}
              step={0.01}
              value={settings.vignette}
              onChange={value => updateProp('vignette', value)}
            />
            <PreviewSwitch
              title="Mouse React"
              isChecked={settings.mouseReact}
              onChange={value => updateProp('mouseReact', value)}
            />
            <PreviewSwitch
              title="Page Load Animation"
              isChecked={settings.pageLoadAnimation}
              onChange={value => {
                updateProp('pageLoadAnimation', value);
                forceRerender();
              }}
            />
            <PreviewSwitch title="Pause" isChecked={settings.pause} onChange={value => updateProp('pause', value)} />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={faultyTerminal} componentName="FaultyTerminal" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FaultyTerminalDemo;
