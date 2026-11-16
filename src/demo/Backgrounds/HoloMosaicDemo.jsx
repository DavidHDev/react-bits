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

import HoloMosaic from '@/content/Backgrounds/HoloMosaic/HoloMosaic';
import { holoMosaic } from '../../constants/code/Backgrounds/holoMosaicCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/HoloMosaic';

const FILTER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'ascii', label: 'ASCII' },
  { value: 'dither', label: 'Dither' }
];

const SPECTRUM_OPTIONS = [
  { value: 'full', label: 'Full' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'pearl', label: 'Pearl' }
];

const propData = [
  {
    name: 'color',
    type: 'string',
    default: "'#120f17'",
    description: 'Base color of the tiles. Set it to your page background, the seams show the page through.'
  },
  {
    name: 'metalColor',
    type: 'string',
    default: "'#e8ebf1'",
    description: 'Tint of the metal where no color diffracts, and of the glints and sheen.'
  },
  {
    name: 'spectrum',
    type: "'full' | 'warm' | 'cool' | 'pearl'",
    default: "'full'",
    description:
      'Range of colors the tiles split light into: the full rainbow, golds and reds, blues and greens, or soft pearl.'
  },
  {
    name: 'tileSize',
    type: 'number',
    default: '1',
    description: 'Size of the tiles.'
  },
  {
    name: 'gap',
    type: 'number',
    default: '0.08',
    description: 'Width of the seams between tiles.'
  },
  {
    name: 'roundness',
    type: 'number',
    default: '0.15',
    description: 'Corner radius of the tiles.'
  },
  {
    name: 'bevel',
    type: 'number',
    default: '0.35',
    description: 'How much the tile edges round off and catch the light.'
  },
  {
    name: 'rotation',
    type: 'number',
    default: '0',
    description: 'Rotation of the tile grid, in degrees.'
  },
  {
    name: 'scatter',
    type: 'number',
    default: '0.3',
    description:
      'How differently each tile is etched. 0 keeps the color flowing across tiles, 1 gives every tile its own.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '0.35',
    description: 'How much the tiles lean in random directions, so they catch the light one by one.'
  },
  {
    name: 'swirl',
    type: 'number',
    default: '1',
    description: 'Size of the swirling color pattern. Higher makes it finer.'
  },
  {
    name: 'ripple',
    type: 'number',
    default: '0.6',
    description: 'Strength of the slow rings that roll through the color.'
  },
  {
    name: 'bands',
    type: 'number',
    default: '1.3',
    description: 'How many color bands fit across the tiles.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '0.5',
    description: 'Size of the light. Higher blends the color bands more softly.'
  },
  {
    name: 'intensity',
    type: 'number',
    default: '1.25',
    description: 'Strength of the colors.'
  },
  {
    name: 'saturation',
    type: 'number',
    default: '0.1',
    description: 'Color saturation. 0 gives plain silver.'
  },
  {
    name: 'glitter',
    type: 'number',
    default: '0.85',
    description: 'Amount of tiny glints that sparkle as the light moves.'
  },
  {
    name: 'sheen',
    type: 'number',
    default: '0.8',
    description: 'Soft reflection of the light on the tiles.'
  },
  {
    name: 'grain',
    type: 'number',
    default: '0.08',
    description: 'Strength of the film grain.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '0.5',
    description: 'Speed of the drifting light and the moving color.'
  },
  {
    name: 'variation',
    type: 'number',
    default: '0',
    description: 'Picks a different pattern of tiles and color.'
  },
  {
    name: 'filter',
    type: "'none' | 'ascii' | 'dither'",
    default: "'none'",
    description: 'Redraws the effect as colored ASCII characters or as an ordered dither.'
  },
  {
    name: 'filterSize',
    type: 'number',
    default: '1',
    description: 'Size of the characters or dither dots.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0',
    description: 'Fades the edges into the page, from 0 to 1.'
  },
  {
    name: 'opacity',
    type: 'number',
    default: '1',
    description: 'Opacity of the whole effect.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Flips the tiles in from the center when the effect first appears.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Lets the light follow the cursor and the tiles around it tilt toward it.'
  },
  {
    name: 'mouseStrength',
    type: 'number',
    default: '1',
    description: 'How far the tiles around the cursor tilt.'
  },
  {
    name: 'mouseRadius',
    type: 'number',
    default: '0.25',
    description: 'Size of the area around the cursor that tilts.'
  },
  {
    name: 'flipOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Sends a wave of flipping tiles out from wherever you click.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Prints the colors like ink on pale tiles, for light backgrounds.'
  },
  {
    name: 'paused',
    type: 'boolean',
    default: 'false',
    description: 'Freezes the animation.'
  },
  {
    name: 'dpr',
    type: 'number',
    default: 'auto',
    description: 'Maximum device pixel ratio, capped at 2.'
  },
  {
    name: 'className',
    type: 'string',
    default: "''",
    description: 'Extra class names for the container.'
  }
];

const HoloMosaicDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const light = useColorModeValue(true, false);

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light, defaults: defaultProps }), preset: value });
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
            <HoloMosaic key={key} {...settings} />
            <BackgroundContent headline="Holographic tiles that change color as the light moves." />
            <RefreshButton onClick={forceRerender} />
          </Box>
          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="holo-mosaic" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Metal Color"
              color={settings.metalColor}
              onChange={value => updateProp('metalColor', value)}
            />
            <PreviewSelect
              title="Spectrum"
              options={SPECTRUM_OPTIONS}
              value={settings.spectrum}
              onChange={value => updateProp('spectrum', value)}
            />
            <PreviewSelect
              title="Filter"
              options={FILTER_OPTIONS}
              value={settings.filter}
              onChange={value => updateProp('filter', value)}
            />
            <PreviewSlider
              title="Filter Size"
              min={0.5}
              max={3}
              step={0.05}
              value={settings.filterSize}
              onChange={value => updateProp('filterSize', value)}
            />
            <PreviewSlider
              title="Tile Size"
              min={0.4}
              max={3}
              step={0.05}
              value={settings.tileSize}
              onChange={value => updateProp('tileSize', value)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={0.3}
              step={0.01}
              value={settings.gap}
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Roundness"
              min={0}
              max={1}
              step={0.01}
              value={settings.roundness}
              onChange={value => updateProp('roundness', value)}
            />
            <PreviewSlider
              title="Bevel"
              min={0}
              max={1}
              step={0.01}
              value={settings.bevel}
              onChange={value => updateProp('bevel', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-90}
              max={90}
              step={1}
              value={settings.rotation}
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Scatter"
              min={0}
              max={1}
              step={0.01}
              value={settings.scatter}
              onChange={value => updateProp('scatter', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={1}
              step={0.01}
              value={settings.tilt}
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Swirl"
              min={0.2}
              max={3}
              step={0.05}
              value={settings.swirl}
              onChange={value => updateProp('swirl', value)}
            />
            <PreviewSlider
              title="Ripple"
              min={0}
              max={2}
              step={0.05}
              value={settings.ripple}
              onChange={value => updateProp('ripple', value)}
            />
            <PreviewSlider
              title="Bands"
              min={0.5}
              max={2.5}
              step={0.05}
              value={settings.bands}
              onChange={value => updateProp('bands', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.01}
              value={settings.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0}
              max={2}
              step={0.05}
              value={settings.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Saturation"
              min={0}
              max={1.3}
              step={0.01}
              value={settings.saturation}
              onChange={value => updateProp('saturation', value)}
            />
            <PreviewSlider
              title="Glitter"
              min={0}
              max={1}
              step={0.01}
              value={settings.glitter}
              onChange={value => updateProp('glitter', value)}
            />
            <PreviewSlider
              title="Sheen"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.sheen}
              onChange={value => updateProp('sheen', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.4}
              step={0.01}
              value={settings.grain}
              onChange={value => updateProp('grain', value)}
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
              max={20}
              step={1}
              value={settings.variation}
              onChange={value => updateProp('variation', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.01}
              value={settings.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSlider
              title="Mouse Strength"
              min={0}
              max={2}
              step={0.05}
              value={settings.mouseStrength}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSlider
              title="Mouse Radius"
              min={0.1}
              max={0.6}
              step={0.01}
              value={settings.mouseRadius}
              onChange={value => updateProp('mouseRadius', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Flip On Click"
              isChecked={settings.flipOnClick}
              onChange={value => updateProp('flipOnClick', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={holoMosaic} componentName="HoloMosaic" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default HoloMosaicDemo;
