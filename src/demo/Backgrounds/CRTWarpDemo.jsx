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

import CRTWarp from '../../content/Backgrounds/CRTWarp/CRTWarp';
import { crtWarp } from '../../constants/code/Backgrounds/crtWarpCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/CRTWarp';

const DEFAULT_PROPS = {
  preset: 'ultraviolet',
  ...LOOK,
  intro: true,
  mouseReact: true,
  mouseStrength: 0.5,
  changeOnClick: true,
  dpr: 2,
  paused: false
};

const MASK_OPTIONS = [
  { value: 'aperture', label: 'Aperture Grille' },
  { value: 'shadow', label: 'Shadow Mask' },
  { value: 'slot', label: 'Slot Mask' },
  { value: 'none', label: 'None' }
];

const QUALITY_OPTIONS = [
  { value: 1, label: 'Performance' },
  { value: 1.5, label: 'Balanced' },
  { value: 2, label: 'Sharp' }
];

const propData = [
  { name: 'color', type: 'string', default: "'#c755f7'", description: 'Phosphor color of the picture.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'#120f17'",
    description: "Color of the dark tube behind the picture. Use 'transparent' to let the page show through."
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Prints the picture as ink on a light background instead of glowing phosphor.'
  },
  {
    name: 'mask',
    type: "'aperture' | 'shadow' | 'slot' | 'none'",
    default: "'aperture'",
    description: 'The phosphor pattern of the tube: vertical stripes, dot triads, slots, or a plain mono tube.'
  },
  { name: 'speed', type: 'number', default: '0.5', description: 'How fast the plasma flows.' },
  {
    name: 'variation',
    type: 'number',
    default: '0',
    description: 'Picks a different plasma pattern. Each whole number is a new one.'
  },
  { name: 'waveAmplitude', type: 'number', default: '0.3', description: 'How tightly the plasma folds into bands.' },
  { name: 'waveFrequency', type: 'number', default: '2.5', description: 'How many blobs fit on screen.' },
  { name: 'levels', type: 'number', default: '3', description: 'Number of brightness steps in the picture.' },
  {
    name: 'columns',
    type: 'number',
    default: '80',
    description: 'Width of the low resolution picture in blocks. Fewer columns make chunkier blocks.'
  },
  {
    name: 'persistence',
    type: 'number',
    default: '0.4',
    description: 'How long the phosphor keeps glowing after the picture moves on, leaving soft trails.'
  },
  { name: 'curvature', type: 'number', default: '0.25', description: 'Bulge of the curved glass.' },
  {
    name: 'corners',
    type: 'number',
    default: '0',
    description: 'Rounds the corners of the tube and shows its edge. 0 keeps the picture edge to edge.'
  },
  {
    name: 'scanlineStrength',
    type: 'number',
    default: '0.6',
    description: 'Depth of the dark gaps between scanlines. Bright lines widen and fill the gaps.'
  },
  {
    name: 'scanlineFrequency',
    type: 'number',
    default: '200',
    description: 'Number of scanlines from top to bottom.'
  },
  { name: 'maskStrength', type: 'number', default: '0.3', description: 'Visibility of the phosphor mask.' },
  { name: 'bloom', type: 'number', default: '1.5', description: 'Glow that spills from bright areas.' },
  { name: 'bloomRadius', type: 'number', default: '1', description: 'How far the glow spreads.' },
  {
    name: 'rgbShift',
    type: 'number',
    default: '0.003',
    description: 'Misalignment of the red and blue beams, which fringes edges with color.'
  },
  { name: 'noise', type: 'number', default: '0.1', description: 'Grain in the lit picture.' },
  { name: 'flicker', type: 'number', default: '0.15', description: 'Brightness flicker of the tube.' },
  {
    name: 'interference',
    type: 'number',
    default: '0.2',
    description: 'A slow hum bar rolling down the screen and jitter along the lines.'
  },
  { name: 'vignette', type: 'number', default: '0.3', description: 'Darkening toward the edges of the tube.' },
  {
    name: 'brightness',
    type: 'number',
    default: '1',
    description: 'Overall brightness, or ink strength in light mode.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description:
      'Warms the tube up when it first comes into view: the plasma grows out of the dark and pulls into focus.'
  },
  {
    name: 'mouseReact',
    type: 'boolean',
    default: 'true',
    description: 'The cursor acts like a magnet held to the glass, twisting the picture with color fringes.'
  },
  { name: 'mouseStrength', type: 'number', default: '0.5', description: 'Strength of the magnet.' },
  {
    name: 'changeOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Clicking changes the channel: the picture rolls through static and comes back with a new pattern.'
  },
  { name: 'dpr', type: 'number', default: '2', description: 'Maximum device pixel ratio of the canvas.' },
  { name: 'fps', type: 'number', default: '60', description: 'Maximum frame rate.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the plasma.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const CRTWarpDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: colorMode === 'light' }), preset: value });
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
            <CRTWarp key={key} {...settings} />
            <BackgroundContent pillText="New Background" headline="Make every pixel pulse" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="crt-warp" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Phosphor Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={settings.backgroundColor}
              onChange={value => updateProp('backgroundColor', value)}
            />
            <PreviewSelect
              title="Mask"
              options={MASK_OPTIONS}
              value={settings.mask}
              onChange={value => updateProp('mask', value)}
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
              title="Variation"
              min={0}
              max={24}
              step={1}
              value={settings.variation}
              onChange={value => updateProp('variation', value)}
            />
            <PreviewSlider
              title="Wave Amount"
              min={0.05}
              max={1}
              step={0.01}
              value={settings.waveAmplitude}
              onChange={value => updateProp('waveAmplitude', value)}
            />
            <PreviewSlider
              title="Wave Density"
              min={0.5}
              max={6}
              step={0.1}
              value={settings.waveFrequency}
              onChange={value => updateProp('waveFrequency', value)}
            />
            <PreviewSlider
              title="Levels"
              min={2}
              max={8}
              step={1}
              value={settings.levels}
              onChange={value => updateProp('levels', value)}
            />
            <PreviewSlider
              title="Columns"
              min={24}
              max={200}
              step={1}
              value={settings.columns}
              onChange={value => updateProp('columns', value)}
            />
            <PreviewSlider
              title="Persistence"
              min={0}
              max={0.95}
              step={0.01}
              value={settings.persistence}
              onChange={value => updateProp('persistence', value)}
            />
            <PreviewSlider
              title="Curvature"
              min={0}
              max={1}
              step={0.01}
              value={settings.curvature}
              onChange={value => updateProp('curvature', value)}
            />
            <PreviewSlider
              title="Corners"
              min={0}
              max={1}
              step={0.01}
              value={settings.corners}
              onChange={value => updateProp('corners', value)}
            />
            <PreviewSlider
              title="Scanlines"
              min={0}
              max={1}
              step={0.01}
              value={settings.scanlineStrength}
              onChange={value => updateProp('scanlineStrength', value)}
            />
            <PreviewSlider
              title="Scanline Density"
              min={80}
              max={480}
              step={5}
              value={settings.scanlineFrequency}
              onChange={value => updateProp('scanlineFrequency', value)}
            />
            <PreviewSlider
              title="Mask Strength"
              min={0}
              max={1}
              step={0.01}
              value={settings.maskStrength}
              isDisabled={settings.mask === 'none'}
              onChange={value => updateProp('maskStrength', value)}
            />
            <PreviewSlider
              title="Bloom"
              min={0}
              max={3}
              step={0.05}
              value={settings.bloom}
              onChange={value => updateProp('bloom', value)}
            />
            <PreviewSlider
              title="Bloom Radius"
              min={0.2}
              max={3}
              step={0.05}
              value={settings.bloomRadius}
              onChange={value => updateProp('bloomRadius', value)}
            />
            <PreviewSlider
              title="RGB Shift"
              min={0}
              max={0.015}
              step={0.0005}
              value={settings.rgbShift}
              onChange={value => updateProp('rgbShift', value)}
            />
            <PreviewSlider
              title="Noise"
              min={0}
              max={0.3}
              step={0.01}
              value={settings.noise}
              onChange={value => updateProp('noise', value)}
            />
            <PreviewSlider
              title="Flicker"
              min={0}
              max={1}
              step={0.01}
              value={settings.flicker}
              onChange={value => updateProp('flicker', value)}
            />
            <PreviewSlider
              title="Interference"
              min={0}
              max={1}
              step={0.01}
              value={settings.interference}
              onChange={value => updateProp('interference', value)}
            />
            <PreviewSlider
              title="Vignette"
              min={0}
              max={1}
              step={0.01}
              value={settings.vignette}
              onChange={value => updateProp('vignette', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.4}
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Magnet Strength"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.mouseStrength}
              isDisabled={!settings.mouseReact}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSelect
              title="Render Quality"
              options={QUALITY_OPTIONS}
              value={settings.dpr}
              onChange={value => updateProp('dpr', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch
              title="Magnet"
              isChecked={settings.mouseReact}
              onChange={value => updateProp('mouseReact', value)}
            />
            <PreviewSwitch
              title="Channel Flip"
              isChecked={settings.changeOnClick}
              onChange={value => updateProp('changeOnClick', value)}
            />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
            <PreviewSwitch title="Pause" isChecked={settings.paused} onChange={value => updateProp('paused', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={crtWarp} componentName="CRTWarp" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CRTWarpDemo;
