import { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
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

import MicroSlats from '../../content/Backgrounds/MicroSlats/MicroSlats';
import { microSlats } from '../../constants/code/Backgrounds/microSlatsCode';

const PRESETS = {
  swell: {
    scale: 1.5,
    speed: 0.6,
    direction: 250,
    chop: 0.55,
    stretch: 0,
    glint: 0.7,
    contrast: 1.25,
    perspective: 0.55,
    fog: 0.55
  },
  tide: {
    scale: 1.3,
    speed: 0.5,
    direction: 262,
    chop: 0.2,
    stretch: 0.12,
    glint: 0.45,
    contrast: 1.1,
    perspective: 0.5,
    fog: 0.4
  },
  storm: {
    scale: 0.55,
    speed: 1.6,
    direction: 236,
    chop: 1,
    stretch: 0.3,
    glint: 1.3,
    contrast: 1.8,
    perspective: 0.8,
    fog: 0.35
  },
  signal: {
    scale: 0.85,
    speed: 1.2,
    direction: 180,
    chop: 0.6,
    stretch: 0.85,
    glint: 0.25,
    contrast: 1.2,
    perspective: 0,
    fog: 0
  }
};

const PRESET_OPTIONS = [
  { label: 'Swell', value: 'swell' },
  { label: 'Tide', value: 'tide' },
  { label: 'Storm', value: 'storm' },
  { label: 'Signal', value: 'signal' }
];

const DEFAULT_PROPS = {
  preset: 'swell',
  color: '#A855F7',
  glintColor: '#ffffff',
  backgroundColor: '#120f17',
  slatWidth: 10,
  slatHeight: 25,
  gap: 3,
  roundness: 0.75,
  ...PRESETS.swell,
  interactive: true,
  cursorStrength: 1,
  cursorSize: 40,
  swirl: 0,
  trail: 1.4,
  lean: 0,
  intro: true,
  introDuration: 1.5,
  paused: false
};

const LIGHT_PROPS = {
  glintColor: '#6B21A8',
  backgroundColor: '#ffffff'
};

const MicroSlatsDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const themedProps = useThemedProps(props, DEFAULT_PROPS, LIGHT_PROPS);

  const choosePreset = value => {
    updateProps({ preset: value, ...(PRESETS[value] || PRESETS.swell) });
  };

  const propData = useMemo(
    () => [
      {
        name: 'preset',
        type: "'swell' | 'tide' | 'storm' | 'signal'",
        default: "'swell'",
        description:
          'A starting look for the sea. Every wave prop below overrides the preset value when you pass it. Signal turns the field into a flat, equalizer style wall.'
      },
      { name: 'color', type: 'string', default: "'#A855F7'", description: 'Color of the slats.' },
      {
        name: 'glintColor',
        type: 'string',
        default: "'#ffffff'",
        description: 'Color the slats shift towards on wave crests and in the light the cursor leaves.'
      },
      {
        name: 'backgroundColor',
        type: 'string',
        default: "'#000000'",
        description: 'Color behind the slats. Pass transparent to show the page through.'
      },
      { name: 'slatWidth', type: 'number', default: '10', description: 'Width of one slat in CSS pixels.' },
      { name: 'slatHeight', type: 'number', default: '25', description: 'Full height of one slat in CSS pixels.' },
      { name: 'gap', type: 'number', default: '3', description: 'Space between slats in CSS pixels.' },
      {
        name: 'roundness',
        type: 'number',
        default: '0.75',
        description: 'Corner rounding of each slat, from square at 0 to a full pill at 1.'
      },
      {
        name: 'scale',
        type: 'number',
        default: 'from preset',
        description: 'Size of the swell. Larger values give longer, calmer waves.'
      },
      {
        name: 'speed',
        type: 'number',
        default: 'from preset',
        description: 'How fast the waves roll. 0 freezes the sea while the cursor can still stir it.'
      },
      {
        name: 'direction',
        type: 'number',
        default: 'from preset',
        description: 'Heading of the swell in degrees. 270 rolls straight towards the viewer.'
      },
      {
        name: 'chop',
        type: 'number',
        default: 'from preset',
        description: 'Sharpens the crests and flattens the troughs, like wind on the water.'
      },
      {
        name: 'stretch',
        type: 'number',
        default: 'from preset',
        description: 'How much each slat grows and shrinks with the wave under it. 0 keeps every slat full length.'
      },
      {
        name: 'glint',
        type: 'number',
        default: 'from preset',
        description: 'Strength of the light caught on the crests.'
      },
      {
        name: 'contrast',
        type: 'number',
        default: 'from preset',
        description: 'Spread between dark troughs and bright crests.'
      },
      {
        name: 'perspective',
        type: 'number',
        default: 'from preset',
        description: 'How far the sea recedes towards a horizon above the top edge. 0 is a flat wall.'
      },
      {
        name: 'fog',
        type: 'number',
        default: 'from preset',
        description: 'Haze that fades the far rows into the background.'
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'true',
        description:
          'Lets the cursor stir the water. Moving it pushes a real fluid that bends the swell and carries a swirling trail of light, and a click spins out a splash.'
      },
      {
        name: 'cursorStrength',
        type: 'number',
        default: '1',
        description: 'Brightness of the light the cursor leaves in the water.'
      },
      {
        name: 'cursorSize',
        type: 'number',
        default: '40',
        description: 'Radius of the patch of water the cursor pushes, in CSS pixels.'
      },
      {
        name: 'swirl',
        type: 'number',
        default: '0',
        description: 'How strongly the stirred water curls into eddies.'
      },
      {
        name: 'trail',
        type: 'number',
        default: '1.4',
        description: 'How long the stirred water and its light linger, in seconds.'
      },
      {
        name: 'lean',
        type: 'number',
        default: '0',
        description: 'How far the slats tilt with the current. 0 keeps them upright.'
      },
      {
        name: 'intro',
        type: 'boolean',
        default: 'true',
        description: 'Rolls the sea in from the horizon on mount, unfolding the slats row by row.'
      },
      { name: 'introDuration', type: 'number', default: '1.5', description: 'Length of the intro in seconds.' },
      {
        name: 'paused',
        type: 'boolean',
        default: 'false',
        description: 'Freezes the waves. The cursor can still stir the water.'
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
            <MicroSlats key={key} {...themedProps} />
            <BackgroundContent headline="A quiet pattern, drawn one slat at a time." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="micro-slats" currentProps={themedProps} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props.preset} onChange={choosePreset} />

            <PreviewColorPickerCustom
              title="Color"
              color={themedProps.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Glint Color"
              color={themedProps.glintColor}
              onChange={value => updateProp('glintColor', value)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={themedProps.backgroundColor}
              onChange={value => updateProp('backgroundColor', value)}
            />

            <PreviewSlider
              title="Slat Width"
              min={2}
              max={16}
              step={1}
              value={props.slatWidth}
              valueUnit="px"
              onChange={value => updateProp('slatWidth', value)}
            />
            <PreviewSlider
              title="Slat Height"
              min={6}
              max={64}
              step={1}
              value={props.slatHeight}
              valueUnit="px"
              onChange={value => updateProp('slatHeight', value)}
            />
            <PreviewSlider
              title="Gap"
              min={1}
              max={12}
              step={1}
              value={props.gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Roundness"
              min={0}
              max={1}
              step={0.05}
              value={props.roundness}
              onChange={value => updateProp('roundness', value)}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.3}
              max={2.5}
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
            <PreviewSlider
              title="Chop"
              min={0}
              max={1.5}
              step={0.05}
              value={props.chop}
              onChange={value => updateProp('chop', value)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={0.95}
              step={0.05}
              value={props.stretch}
              onChange={value => updateProp('stretch', value)}
            />
            <PreviewSlider
              title="Glint"
              min={0}
              max={2}
              step={0.05}
              value={props.glint}
              onChange={value => updateProp('glint', value)}
            />
            <PreviewSlider
              title="Contrast"
              min={0.5}
              max={3}
              step={0.05}
              value={props.contrast}
              onChange={value => updateProp('contrast', value)}
            />
            <PreviewSlider
              title="Perspective"
              min={0}
              max={1}
              step={0.05}
              value={props.perspective}
              onChange={value => updateProp('perspective', value)}
            />
            <PreviewSlider
              title="Fog"
              min={0}
              max={1}
              step={0.05}
              value={props.fog}
              onChange={value => updateProp('fog', value)}
            />

            <PreviewSwitch
              title="Interactive"
              isChecked={props.interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSlider
              title="Cursor Strength"
              min={0}
              max={2}
              step={0.05}
              value={props.cursorStrength}
              isDisabled={!props.interactive}
              onChange={value => updateProp('cursorStrength', value)}
            />
            <PreviewSlider
              title="Cursor Size"
              min={20}
              max={240}
              step={5}
              value={props.cursorSize}
              valueUnit="px"
              isDisabled={!props.interactive}
              onChange={value => updateProp('cursorSize', value)}
            />
            <PreviewSlider
              title="Swirl"
              min={0}
              max={1.5}
              step={0.05}
              value={props.swirl}
              isDisabled={!props.interactive}
              onChange={value => updateProp('swirl', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0.3}
              max={4}
              step={0.1}
              value={props.trail}
              valueUnit="s"
              isDisabled={!props.interactive}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Lean"
              min={0}
              max={1}
              step={0.05}
              value={props.lean}
              isDisabled={!props.interactive}
              onChange={value => updateProp('lean', value)}
            />

            <PreviewSwitch title="Intro" isChecked={props.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSlider
              title="Intro Duration"
              min={0.6}
              max={5}
              step={0.1}
              value={props.introDuration}
              valueUnit="s"
              isDisabled={!props.intro}
              onChange={value => updateProp('introDuration', value)}
            />
            <PreviewSwitch title="Paused" isChecked={props.paused} onChange={value => updateProp('paused', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={microSlats} componentName="MicroSlats" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default MicroSlatsDemo;
