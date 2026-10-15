import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import ScrambledText from '../../content/TextAnimations/ScrambledText/ScrambledText';
import { scrambledTextCode } from '../../constants/code/TextAnimations/scrambledTextCode';

const LOOK = {
  color: '',
  scrambleColor: '',
  effect: 'scramble',
  radius: 100,
  strength: 1,
  trail: 0.6,
  duration: 1.2,
  speed: 0.5,
  clickBurst: true,
  fontFamily: '',
  scrambleChars: '.:'
};

const PRESETS = {
  decode: { ...LOOK },
  float: {
    ...LOOK,
    effect: 'lift',
    radius: 130,
    strength: 1,
    trail: 0.9,
    duration: 0.9,
    speed: 0.8,
    fontFamily: 'Geist, sans-serif',
    scrambleChars: '·•'
  },
  haze: {
    ...LOOK,
    effect: 'blur',
    radius: 120,
    strength: 1.1,
    trail: 1.4,
    duration: 1.4,
    speed: 0.4,
    fontFamily: 'Georgia, serif',
    scrambleChars: '░▒'
  },
  lens: {
    ...LOOK,
    scrambleColor: '#ff5a1f',
    effect: 'magnify',
    radius: 90,
    strength: 1,
    trail: 0.35,
    duration: 0.8,
    speed: 1,
    fontFamily: '"Geist Mono", monospace',
    scrambleChars: '<>/*'
  }
};

const DEFAULT_PROPS = {
  preset: 'decode',
  ...LOOK,
  intro: true
};

const PRESET_OPTIONS = [
  { value: 'decode', label: 'Decode' },
  { value: 'float', label: 'Float' },
  { value: 'haze', label: 'Haze' },
  { value: 'lens', label: 'Lens' }
];

const EFFECT_OPTIONS = [
  { value: 'scramble', label: 'Scramble' },
  { value: 'lift', label: 'Lift' },
  { value: 'blur', label: 'Blur' },
  { value: 'magnify', label: 'Magnify' }
];

const FONT_OPTIONS = [
  { value: '', label: 'Mono' },
  { value: 'Geist, sans-serif', label: 'Sans' },
  { value: 'Georgia, serif', label: 'Serif' },
  { value: '"Geist Mono", monospace', label: 'Geist Mono' }
];

const propData = [
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'The text to scramble.'
  },
  {
    name: 'effect',
    type: "'scramble' | 'lift' | 'blur' | 'magnify'",
    default: "'scramble'",
    description:
      'What happens to letters near the pointer: they scramble, rise, blur, or swell like a lens. Each one eases in and out with a soft falloff.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '100',
    description: 'Distance from the pointer, in px, within which letters react.'
  },
  {
    name: 'strength',
    type: 'number',
    default: '1',
    description: 'How far letters lift, how much they blur, or how much they magnify.'
  },
  {
    name: 'trail',
    type: 'number',
    default: '0.6',
    description:
      'How long lifted, blurred or magnified letters take to settle after the pointer moves on, in seconds. Scrambling uses duration instead.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '1.2',
    description:
      'How long a letter right under the pointer keeps scrambling, in seconds. Also sets the pace of the intro and the click burst.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '0.5',
    description: 'How often a scrambling letter swaps to a new character. Higher values flicker faster.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a scramble wave outward from the click point, carrying the current effect with it.'
  },
  {
    name: 'scrambleChars',
    type: 'string',
    default: "'.:'",
    description: 'The characters shown while a letter is scrambled.'
  },
  {
    name: 'scrambleColor',
    type: 'string',
    default: "''",
    description: 'Color of letters while they are scrambled. Leave empty to keep the text color.'
  },
  {
    name: 'color',
    type: 'string',
    default: "''",
    description: 'Color of the text. Leave empty to follow the surrounding text color.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: "''",
    description: 'Font of the text. Leave empty to keep the default monospace.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Decodes the whole text from scrambled characters the first time it scrolls into view.'
  },
  {
    name: 'className',
    type: 'string',
    default: "''",
    description: 'Extra class names for the wrapper.'
  },
  {
    name: 'style',
    type: 'CSSProperties',
    default: '{}',
    description: 'Inline styles for the wrapper.'
  }
];

const ScrambledTextDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, color, scrambleColor, fontFamily, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');
  const physical = settings.effect !== 'scramble';

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = useMemo(
    () => ({
      ...(color ? { color } : {}),
      ...(scrambleColor ? { scrambleColor } : {}),
      ...(fontFamily ? { fontFamily } : {})
    }),
    [color, scrambleColor, fontFamily]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'color', 'scrambleColor', 'fontFamily']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            <ScrambledText
              key={key}
              className="scrambled-text-demo"
              style={{ color: ink }}
              {...settings}
              color={color}
              scrambleColor={scrambleColor}
              fontFamily={fontFamily}
            >
              Once you hover over me, you will see the effect in action! You can customize the radius, duration, and
              speed of the scramble effect.
            </ScrambledText>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={color || ink}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Scramble Color"
              color={scrambleColor || color || ink}
              onChange={value => updateProp('scrambleColor', value)}
            />
            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings.effect}
              onChange={value => updateProp('effect', value)}
            />
            <PreviewSlider
              title="Radius"
              min={20}
              max={300}
              step={10}
              value={settings.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Strength"
              min={0.2}
              max={2}
              step={0.1}
              value={settings.strength}
              isDisabled={!physical}
              onChange={value => updateProp('strength', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0.1}
              max={3}
              step={0.05}
              value={settings.trail}
              valueUnit="s"
              isDisabled={!physical}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.1}
              max={5}
              step={0.1}
              value={settings.duration}
              valueUnit="s"
              onChange={value => updateProp('duration', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0.1}
              max={2}
              step={0.1}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSwitch
              title="Click Burst"
              isChecked={settings.clickBurst}
              onChange={value => updateProp('clickBurst', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSelect
              title="Font"
              options={FONT_OPTIONS}
              value={fontFamily}
              onChange={value => updateProp('fontFamily', value)}
            />
            <PreviewInput
              title="Scramble Characters"
              value={settings.scrambleChars}
              placeholder="Enter characters..."
              maxLength={16}
              onChange={value => updateProp('scrambleChars', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scrambledTextCode} componentName="ScrambledText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ScrambledTextDemo;
