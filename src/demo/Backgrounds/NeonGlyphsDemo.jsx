import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import NeonGlyphs from '@/content/Backgrounds/NeonGlyphs/NeonGlyphs';
import { neonGlyphs } from '../../constants/code/Backgrounds/neonGlyphsCode';
import { DEFAULT_PROPS, LOOK, PRESET_OPTIONS, presetProps } from './presets/NeonGlyphs';

const CHARACTER_OPTIONS = [
  { value: LOOK.characters, label: 'Letters' },
  { value: '0123456789', label: 'Digits' },
  { value: '0123456789ABCDEF', label: 'Hex' },
  { value: '01', label: 'Binary' },
  { value: '#$%&*+=<>?!@/|~^', label: 'Symbols' }
];

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#a6f3fa', '#ea6fe0', '#6fd6f7', '#d351b6', '#5aaef0']",
    description: 'Neon colors. Every column and row of glyphs picks one of them, up to 8.'
  },
  {
    name: 'characters',
    type: 'string',
    default: "'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=<>?!'",
    description: 'Characters the glyphs are drawn from.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: '\'"Geist Mono", ui-monospace, ...\'',
    description: 'Font used to draw the glyphs. A monospace font keeps them aligned in the grid.'
  },
  {
    name: 'cellSize',
    type: 'number',
    default: '16',
    description: 'Size of each glyph cell in pixels, before perspective.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '12',
    description: 'How many layers of glyphs the plane holds. 1 makes it a single flat sheet.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '25',
    description:
      'How far the top of the plane leans away, in degrees. 0 keeps it flat, around 60 lays it down like a floor.'
  },
  {
    name: 'turn',
    type: 'number',
    default: '0',
    description: 'How far the plane turns to the side, in degrees, like a wall running into the distance.'
  },
  {
    name: 'rotation',
    type: 'number',
    default: '0',
    description: 'Rotation of the glyph grid within the plane, in degrees.'
  },
  {
    name: 'perspective',
    type: 'number',
    default: '60',
    description: 'Field of view in degrees. Higher values exaggerate the depth of a tilted or turned plane.'
  },
  {
    name: 'sway',
    type: 'number',
    default: '0.5',
    description: 'How much the plane slowly sways, so its layers drift past each other.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '0.15',
    description: 'Speed of the floating glyphs.'
  },
  {
    name: 'density',
    type: 'number',
    default: '0.1',
    description: 'Share of the plane filled with glyphs at any moment.'
  },
  {
    name: 'trails',
    type: 'number',
    default: '0.25',
    description: 'Motion blur on the drifting glyphs.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '0.75',
    description: 'Strength of the bloom around the glyphs.'
  },
  {
    name: 'flicker',
    type: 'number',
    default: '0.5',
    description: 'How often glyphs flash white-hot.'
  },
  {
    name: 'scramble',
    type: 'number',
    default: '0.5',
    description: 'How fast the characters change.'
  },
  {
    name: 'brightness',
    type: 'number',
    default: '1',
    description: 'Overall brightness of the glyphs.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0.75',
    description: 'Fades the edges into the page, splitting the colors slightly as they go.'
  },
  {
    name: 'aberration',
    type: 'number',
    default: '0.5',
    description: 'How far the red and blue split apart toward the faded edges.'
  },
  {
    name: 'variation',
    type: 'number',
    default: '0',
    description: 'Picks a different arrangement of columns, rows and colors.'
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
    description: 'Lights the glyphs up from the center outward when the effect first appears.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Wakes up scrambling glyphs around the cursor.'
  },
  {
    name: 'burstOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Sends a ring of bright, scrambling glyphs out from wherever you click.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the glyphs as colored ink for light backgrounds.'
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

const NeonGlyphsDemo = () => {
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
            <NeonGlyphs key={key} {...settings} />
            <BackgroundContent headline="A deep field of neon glyphs, laid out in 3D." />
            <RefreshButton onClick={forceRerender} />
          </Box>
          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="neon-glyphs" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings.colors}
              min={1}
              max={8}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Characters"
              options={CHARACTER_OPTIONS}
              value={settings.characters}
              onChange={value => updateProp('characters', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={-60}
              max={75}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Turn"
              min={-60}
              max={60}
              step={1}
              value={settings.turn}
              valueUnit="°"
              onChange={value => updateProp('turn', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-45}
              max={45}
              step={1}
              value={settings.rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Perspective"
              min={20}
              max={100}
              step={1}
              value={settings.perspective}
              valueUnit="°"
              onChange={value => updateProp('perspective', value)}
            />
            <PreviewSlider
              title="Depth"
              min={1}
              max={32}
              step={1}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Sway"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.sway}
              onChange={value => updateProp('sway', value)}
            />
            <PreviewSlider
              title="Cell Size"
              min={10}
              max={36}
              step={1}
              value={settings.cellSize}
              valueUnit="px"
              onChange={value => updateProp('cellSize', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={1}
              step={0.01}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Density"
              min={0.02}
              max={0.4}
              step={0.01}
              value={settings.density}
              onChange={value => updateProp('density', value)}
            />
            <PreviewSlider
              title="Trails"
              min={0}
              max={1}
              step={0.01}
              value={settings.trails}
              onChange={value => updateProp('trails', value)}
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
              title="Flicker"
              min={0}
              max={1}
              step={0.01}
              value={settings.flicker}
              onChange={value => updateProp('flicker', value)}
            />
            <PreviewSlider
              title="Scramble"
              min={0}
              max={3}
              step={0.05}
              value={settings.scramble}
              onChange={value => updateProp('scramble', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
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
              title="Aberration"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.aberration}
              onChange={value => updateProp('aberration', value)}
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
              title="Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Burst On Click"
              isChecked={settings.burstOnClick}
              onChange={value => updateProp('burstOnClick', value)}
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
          <CodeExample codeObject={neonGlyphs} componentName="NeonGlyphs" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default NeonGlyphsDemo;
