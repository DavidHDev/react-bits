import { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorMode } from '../../components/setup/color-mode';

import LetterGlitch from '../../content/Backgrounds/LetterGlitch/LetterGlitch';
import { letterGlitch } from '../../constants/code/Backgrounds/letterGlitchCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/LetterGlitch';

const FONTS = {
  system: '',
  geist: "'Geist Mono', ui-monospace, monospace",
  code: "'Google Sans Code', ui-monospace, monospace",
  pixel: "'Press Start 2P', ui-monospace, monospace"
};

const FONT_OPTIONS = [
  { value: 'system', label: 'System Mono' },
  { value: 'geist', label: 'Geist Mono' },
  { value: 'code', label: 'Google Sans Code' },
  { value: 'pixel', label: 'Press Start 2P' }
];

const CHARACTER_SETS = {
  classic: '',
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  binary: '01',
  hex: '0123456789ABCDEF',
  symbols: '!@#$%&*+-=/|<>[]{}()~^:;.,?',
  braille: '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵'
};

const CHARACTER_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'letters', label: 'Letters' },
  { value: 'binary', label: 'Binary' },
  { value: 'hex', label: 'Hex' },
  { value: 'symbols', label: 'Symbols' },
  { value: 'braille', label: 'Braille' }
];

const CLICK_OPTIONS = [
  { value: 'tear', label: 'Tear' },
  { value: 'burst', label: 'Burst' },
  { value: 'none', label: 'None' }
];

const propData = [
  {
    name: 'glitchColors',
    type: 'string[]',
    default: "['#ffffff', '#61dca3']",
    description: 'Up to 8 colors that glitching letters light up in. Light mode defaults to dark ink tones.'
  },
  {
    name: 'baseColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the letters at rest. Light mode defaults to near black.'
  },
  {
    name: 'characters',
    type: 'string',
    default: "'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'",
    description: 'Characters to draw. Repeat a character to make it appear more often.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: "'ui-monospace, ...'",
    description: 'CSS font family for the letters. Web fonts are drawn once they have loaded.'
  },
  { name: 'fontSize', type: 'number', default: '14', description: 'Size of the letters in pixels.' },
  {
    name: 'spacing',
    type: 'number',
    default: '0.6',
    description: 'Room around each letter relative to the font size. 0 packs them like lines of text.'
  },
  {
    name: 'density',
    type: 'number',
    default: '0.9',
    description:
      'Share of the grid that shows a letter at rest, from 0 to 1. Empty cells still flicker when they glitch.'
  },
  {
    name: 'baseOpacity',
    type: 'number',
    default: '0.16',
    description: 'Opacity of the letters at rest, from 0 to 1.'
  },
  {
    name: 'glitchAmount',
    type: 'number',
    default: '0.5',
    description: 'How often letters glitch, from 0 (never) to 1 (constantly).'
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'Tempo of the scrambling and glitches. 0 freezes the letters.'
  },
  {
    name: 'flow',
    type: 'number',
    default: '0.5',
    description: 'Strength of the soft waves of light that drift across the letters, from 0 to 1.'
  },
  {
    name: 'smooth',
    type: 'boolean',
    default: 'true',
    description: 'Fades glitching letters in and out. When off, they flicker on and off instantly.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'Lights up and scrambles the letters near the cursor, leaving a trail of glitches when it moves.'
  },
  {
    name: 'cursorRadius',
    type: 'number',
    default: '140',
    description: 'Radius of the area around the cursor that reacts, in pixels.'
  },
  {
    name: 'clickEffect',
    type: "'tear' | 'burst' | 'none'",
    default: "'tear'",
    description: 'What a click does. Tear rips a horizontal glitch through the rows, burst sends glitches outward.'
  },
  {
    name: 'edgeFade',
    type: 'number',
    default: '0',
    description: 'Fades the letters out toward the edges, from 0 to 0.5.'
  },
  {
    name: 'centerFade',
    type: 'number',
    default: '0',
    description: 'Clears the letters behind the middle of the container to keep content readable, from 0 to 1.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Boots the letters in with a flicker on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Switches the default colors to dark ink for light backgrounds.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: '-',
    description: 'Paints an opaque background behind the letters. Leave it unset for a transparent canvas.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const LetterGlitchDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, font, charset, ...settings } = props;
  const fontFamily = FONTS[font] || undefined;
  const characters = CHARACTER_SETS[charset] || undefined;

  const computedProps = useMemo(
    () => ({ ...(fontFamily ? { fontFamily } : {}), ...(characters ? { characters } : {}) }),
    [fontFamily, characters]
  );

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: colorMode === 'light', defaults: defaultProps }), preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'font', 'charset']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <LetterGlitch key={key} {...settings} fontFamily={fontFamily} characters={characters} />
            <BackgroundContent headline="Am I finally a real hacker now, mom?" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="letter-glitch"
              currentProps={{ ...settings, ...computedProps }}
              defaultProps={DEFAULT_PROPS}
            />
          </Flex>

          <Customize>
            <PreviewColorList
              title="Glitch Colors"
              colors={settings.glitchColors}
              min={1}
              max={8}
              onChange={value => updateProp('glitchColors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Font"
              options={FONT_OPTIONS}
              value={font}
              onChange={value => updateProp('font', value)}
            />
            <PreviewSelect
              title="Characters"
              options={CHARACTER_OPTIONS}
              value={charset}
              onChange={value => updateProp('charset', value)}
            />
            <PreviewColorPickerCustom
              title="Base Color"
              color={settings.baseColor}
              onChange={value => updateProp('baseColor', value)}
            />
            <PreviewSelect
              title="Click Effect"
              options={CLICK_OPTIONS}
              value={settings.clickEffect}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={8}
              max={32}
              step={1}
              value={settings.fontSize}
              valueUnit="px"
              onChange={value => updateProp('fontSize', value)}
            />
            <PreviewSlider
              title="Spacing"
              min={0}
              max={2}
              step={0.05}
              value={settings.spacing}
              onChange={value => updateProp('spacing', value)}
            />
            <PreviewSlider
              title="Density"
              min={0}
              max={1}
              step={0.01}
              value={settings.density}
              onChange={value => updateProp('density', value)}
            />
            <PreviewSlider
              title="Base Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings.baseOpacity}
              onChange={value => updateProp('baseOpacity', value)}
            />
            <PreviewSlider
              title="Glitch Amount"
              min={0}
              max={1}
              step={0.01}
              value={settings.glitchAmount}
              onChange={value => updateProp('glitchAmount', value)}
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
              title="Flow"
              min={0}
              max={1}
              step={0.01}
              value={settings.flow}
              onChange={value => updateProp('flow', value)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={40}
              max={400}
              step={5}
              value={settings.cursorRadius}
              valueUnit="px"
              isDisabled={!settings.interactive}
              onChange={value => updateProp('cursorRadius', value)}
            />
            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.edgeFade}
              onChange={value => updateProp('edgeFade', value)}
            />
            <PreviewSlider
              title="Center Fade"
              min={0}
              max={1}
              step={0.01}
              value={settings.centerFade}
              onChange={value => updateProp('centerFade', value)}
            />
            <PreviewSwitch title="Smooth" isChecked={settings.smooth} onChange={value => updateProp('smooth', value)} />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings.interactive}
              onChange={value => updateProp('interactive', value)}
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
          <CodeExample codeObject={letterGlitch} componentName="LetterGlitch" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LetterGlitchDemo;
