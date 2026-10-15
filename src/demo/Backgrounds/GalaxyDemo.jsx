import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Galaxy from '../../content/Backgrounds/Galaxy/Galaxy';
import { galaxy } from '../../constants/code/Backgrounds/galaxyCode';
import { PALETTES, DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Galaxy';

const PALETTE_OPTIONS = [
  { value: 'none', label: 'Hue Shift' },
  { value: 'stardust', label: 'Stardust' },
  { value: 'ice', label: 'Ice' },
  { value: 'gold', label: 'Gold' },
  { value: 'rose', label: 'Rose' }
];

const DIRECTION_OPTIONS = [
  { value: 'forward', label: 'Forward' },
  { value: 'backward', label: 'Backward' }
];

const propData = [
  {
    name: 'starColors',
    type: 'string[]',
    default: '-',
    description: 'Up to four colors the stars are picked from. Replaces the hue shift and saturation coloring.'
  },
  { name: 'hueShift', type: 'number', default: '140', description: 'Shifts the hue of the stars, in degrees.' },
  { name: 'saturation', type: 'number', default: '0', description: 'Color saturation of the stars, from 0 to 1.' },
  { name: 'density', type: 'number', default: '1', description: 'How densely the stars are packed.' },
  { name: 'glowIntensity', type: 'number', default: '0.3', description: 'Brightness of the glow around each star.' },
  { name: 'starSize', type: 'number', default: '1', description: 'Size of each star glow.' },
  {
    name: 'flareIntensity',
    type: 'number',
    default: '1',
    description: 'Strength of the cross flares on the brightest stars.'
  },
  { name: 'twinkleIntensity', type: 'number', default: '0.3', description: 'How much the stars twinkle, from 0 to 1.' },
  { name: 'starSpeed', type: 'number', default: '0.5', description: 'How fast you travel through the stars.' },
  { name: 'speed', type: 'number', default: '1', description: 'Overall speed of the animation.' },
  { name: 'rotationSpeed', type: 'number', default: '0.1', description: 'How fast the starfield rotates.' },
  { name: 'layers', type: 'number', default: '4', description: 'Number of star layers, from 2 to 8.' },
  {
    name: 'direction',
    type: "'forward' | 'backward'",
    default: "'forward'",
    description: 'Whether you fly into the stars or drift back out of them.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Lets the cursor interact with the stars.'
  },
  {
    name: 'mouseRepulsion',
    type: 'boolean',
    default: 'true',
    description: 'Pushes the stars away from the cursor. When off, the field shifts with the cursor instead.'
  },
  {
    name: 'repulsionStrength',
    type: 'number',
    default: '2',
    description: 'Strength of the push away from the cursor.'
  },
  {
    name: 'autoCenterRepulsion',
    type: 'number',
    default: '0',
    description: 'Pushes the stars away from the center without the cursor. 0 turns it off.'
  },
  { name: 'clickWarp', type: 'boolean', default: 'true', description: 'Clicking jumps forward at warp speed.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Drops out of warp speed on mount.' },
  {
    name: 'focal',
    type: '[number, number]',
    default: '[0.5, 0.5]',
    description: 'Center of the starfield, from 0 to 1.'
  },
  {
    name: 'rotation',
    type: '[number, number]',
    default: '[1, 0]',
    description: 'Fixed rotation of the starfield as a [cos, sin] pair.'
  },
  {
    name: 'transparent',
    type: 'boolean',
    default: 'true',
    description: 'Shows the page behind the stars. When off, the stars sit on the background color.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'#000000'",
    description: 'Background behind the stars when transparent is off, or the paper color in light mode.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the stars as ink for light backgrounds.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  { name: 'disableAnimation', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const paletteName = colors =>
  Object.keys(PALETTES).find(name => PALETTES[name].join(',') === (colors ?? []).join(',')) ?? 'none';

const GalaxyDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const paletteActive = settings.starColors?.length > 0;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
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
            <Galaxy key={key} {...settings} starColors={paletteActive ? settings.starColors : undefined} />
            <BackgroundContent headline="Components you shall have, young padawan." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="galaxy" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Star Colors"
              options={PALETTE_OPTIONS}
              value={paletteName(settings.starColors)}
              onChange={value => updateProp('starColors', PALETTES[value])}
            />
            <PreviewSlider
              title="Hue Shift"
              min={0}
              max={360}
              step={1}
              value={settings.hueShift}
              valueUnit="°"
              isDisabled={paletteActive}
              onChange={value => updateProp('hueShift', value)}
            />
            <PreviewSlider
              title="Saturation"
              min={0}
              max={1}
              step={0.01}
              value={settings.saturation}
              isDisabled={paletteActive}
              onChange={value => updateProp('saturation', value)}
            />
            <PreviewSlider
              title="Density"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.density}
              onChange={value => updateProp('density', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.01}
              value={settings.glowIntensity}
              onChange={value => updateProp('glowIntensity', value)}
            />
            <PreviewSlider
              title="Star Size"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.starSize}
              onChange={value => updateProp('starSize', value)}
            />
            <PreviewSlider
              title="Flares"
              min={0}
              max={4}
              step={0.05}
              value={settings.flareIntensity}
              onChange={value => updateProp('flareIntensity', value)}
            />
            <PreviewSlider
              title="Twinkle"
              min={0}
              max={1}
              step={0.01}
              value={settings.twinkleIntensity}
              onChange={value => updateProp('twinkleIntensity', value)}
            />
            <PreviewSlider
              title="Star Speed"
              min={0}
              max={4}
              step={0.05}
              value={settings.starSpeed}
              onChange={value => updateProp('starSpeed', value)}
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
              title="Rotation Speed"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.rotationSpeed}
              onChange={value => updateProp('rotationSpeed', value)}
            />
            <PreviewSlider
              title="Layers"
              min={2}
              max={8}
              step={1}
              value={settings.layers}
              onChange={value => updateProp('layers', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSlider
              title="Repulsion Strength"
              min={0}
              max={5}
              step={0.1}
              value={settings.repulsionStrength}
              isDisabled={!settings.mouseInteraction || !settings.mouseRepulsion}
              onChange={value => updateProp('repulsionStrength', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Mouse Repulsion"
              isChecked={settings.mouseRepulsion}
              onChange={value => updateProp('mouseRepulsion', value)}
            />
            <PreviewSwitch
              title="Click Warp"
              isChecked={settings.clickWarp}
              onChange={value => updateProp('clickWarp', value)}
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
          <CodeExample codeObject={galaxy} componentName="Galaxy" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GalaxyDemo;
