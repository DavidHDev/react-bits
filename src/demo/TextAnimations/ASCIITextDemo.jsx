import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import useComponentProps from '../../hooks/useComponentProps';
import { useColorModeValue } from '../../components/setup/color-mode';

import ASCIIText from '@content/TextAnimations/ASCIIText/ASCIIText';
import { asciiText } from '../../constants/code/TextAnimations/asciiTextCode';

const CLASSIC = ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

const DEFAULT_PROPS = {
  preset: 'classic',
  text: 'Hey!',
  charset: CLASSIC,
  colors: ['#ff6188', '#fc9867', '#ffd866'],
  asciiFontSize: 8,
  textScale: 1,
  blocks: 0.9,
  waves: 1,
  waveSpeed: 1,
  chroma: 1,
  tilt: 1,
  hueShift: 1,
  scramble: 0.6,
  clickRipple: true,
  idle: true,
  interactive: true
};

const PRESETS = {
  classic: {},
  terminal: {
    charset: ' .:-=+*#%@',
    colors: ['#b8f5c8', '#5ee08a', '#1f9d55'],
    blocks: 0,
    chroma: 0.3,
    hueShift: 0,
    asciiFontSize: 10
  },
  blocks: { charset: ' ░▒▓█', colors: ['#ffffff', '#d4d4d8', '#a1a1aa'], blocks: 0.2, hueShift: 0, chroma: 0.6 },
  binary: { charset: ' 01', colors: ['#ffffff', '#bae6fd', '#38bdf8'], blocks: 0.35, hueShift: 0.4, asciiFontSize: 9 },
  mono: { colors: ['#ffffff', '#e4e4e7', '#a1a1aa'], blocks: 0.15, chroma: 0, hueShift: 0, waves: 0.6 }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'binary', label: 'Binary' },
  { value: 'mono', label: 'Mono' }
];

const propData = [
  { name: 'text', type: 'string', default: "'Hey!'", description: 'Text rendered in ASCII.' },
  {
    name: 'asciiFontSize',
    type: 'number',
    default: '8',
    description: 'Height of each character cell in pixels. Smaller cells give finer detail.'
  },
  {
    name: 'charset',
    type: 'string',
    default: "' .'`^\",:;Il!i~+_-?][}{1)(|/...'",
    description: 'Characters from darkest to brightest. Any string works, including Unicode blocks.'
  },
  {
    name: 'colors',
    type: 'string[]',
    default: "['#ff6188', '#fc9867', '#ffd866']",
    description: 'Gradient for the characters, from the center outward. Up to three colors.'
  },
  { name: 'textColor', type: 'string', default: "'#fdf9f3'", description: 'Color of the text behind the characters.' },
  {
    name: 'fontFamily',
    type: 'string',
    default: "'IBM Plex Mono', ui-monospace, ...",
    description: 'Font for the text and the characters.'
  },
  { name: 'fontWeight', type: 'number', default: '600', description: 'Weight of the rendered text.' },
  { name: 'textScale', type: 'number', default: '1', description: 'Size of the text relative to the container.' },
  {
    name: 'blocks',
    type: 'number',
    default: '0.9',
    description: 'Opacity of the colored pixel blocks under the characters, from 0 to 1.'
  },
  { name: 'waves', type: 'number', default: '1', description: 'Strength of the wavy motion. 0 keeps the text flat.' },
  { name: 'waveSpeed', type: 'number', default: '1', description: 'Speed of the wavy motion.' },
  { name: 'chroma', type: 'number', default: '1', description: 'Amount of color fringing around the letters.' },
  { name: 'tilt', type: 'number', default: '1', description: 'How far the text turns toward the pointer.' },
  {
    name: 'hueShift',
    type: 'number',
    default: '1',
    description: 'Rotates the hue as the pointer circles the text. 0 keeps the colors fixed.'
  },
  {
    name: 'scramble',
    type: 'number',
    default: '0.6',
    description: 'Size and strength of the glitchy scramble under the pointer, from 0 to 1.'
  },
  {
    name: 'clickRipple',
    type: 'boolean',
    default: 'true',
    description: 'Sends a ring of characters across the canvas from where you click.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Decodes the text out of random characters on load.'
  },
  { name: 'idle', type: 'boolean', default: 'true', description: 'Sways the text gently when nobody interacts.' },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'Reacts to the pointer with tilt, hue, scramble and ripples.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Light inverts the colors so the effect works on white pages.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const ASCIITextDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, DEFAULT_PROPS[key]]));
    updateProps({ ...base, ...PRESETS[value], text: props.text, preset: value });
  };

  const computedProps = useMemo(() => (theme === 'light' ? { theme: 'light' } : {}), [theme]);

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={440} overflow="hidden">
            <ASCIIText {...settings} theme={theme} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewInput
              title="Text"
              value={props.text}
              placeholder="Enter text..."
              width={200}
              maxLength={12}
              onChange={value => updateProp('text', value)}
            />
            <PreviewInput
              title="Characters"
              value={props.charset}
              placeholder=" .:-=+*#%@"
              width={200}
              maxLength={80}
              onChange={value => updateProp('charset', value)}
            />
            <PreviewColorList
              title="Colors"
              colors={props.colors}
              min={1}
              max={3}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSlider
              title="Cell Size"
              min={4}
              max={24}
              step={1}
              value={props.asciiFontSize}
              valueUnit="px"
              onChange={value => updateProp('asciiFontSize', value)}
            />
            <PreviewSlider
              title="Text Scale"
              min={0.4}
              max={2}
              step={0.05}
              value={props.textScale}
              onChange={value => updateProp('textScale', value)}
            />
            <PreviewSlider
              title="Blocks"
              min={0}
              max={1}
              step={0.05}
              value={props.blocks}
              onChange={value => updateProp('blocks', value)}
            />
            <PreviewSlider
              title="Waves"
              min={0}
              max={2}
              step={0.05}
              value={props.waves}
              onChange={value => updateProp('waves', value)}
            />
            <PreviewSlider
              title="Wave Speed"
              min={0}
              max={3}
              step={0.05}
              value={props.waveSpeed}
              onChange={value => updateProp('waveSpeed', value)}
            />
            <PreviewSlider
              title="Chroma"
              min={0}
              max={3}
              step={0.05}
              value={props.chroma}
              onChange={value => updateProp('chroma', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={2}
              step={0.05}
              value={props.tilt}
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Hue Shift"
              min={0}
              max={2}
              step={0.05}
              value={props.hueShift}
              onChange={value => updateProp('hueShift', value)}
            />
            <PreviewSlider
              title="Scramble"
              min={0}
              max={1}
              step={0.05}
              value={props.scramble}
              onChange={value => updateProp('scramble', value)}
            />
            <PreviewSwitch
              title="Click Ripple"
              isChecked={props.clickRipple}
              onChange={value => updateProp('clickRipple', value)}
            />
            <PreviewSwitch title="Idle Sway" isChecked={props.idle} onChange={value => updateProp('idle', value)} />
            <PreviewSwitch
              title="Interactive"
              isChecked={props.interactive}
              onChange={value => updateProp('interactive', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={asciiText} componentName="ASCIIText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ASCIITextDemo;
