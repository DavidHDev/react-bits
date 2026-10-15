import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';
import { useMemo } from 'react';

import Customize from '../../components/common/Preview/Customize';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import TextType from '../../content/TextAnimations/TextType/TextType';
import { textType } from '../../constants/code/TextAnimations/textTypeCode';

const SENTENCES = ['Welcome to React Bits! Good to see you!', 'Build some amazing experiences!'];
const WORDS = ['interfaces', 'products', 'experiences'];

const LOOK = {
  cursorColor: 'currentColor',
  prefixColor: 'currentColor',
  typingSpeed: 75,
  deletingSpeed: 50,
  pauseDuration: 1500,
  mistakes: 0,
  typeEffect: 'none',
  cursorBlinkDuration: 0.5,
  variableSpeedEnabled: false,
  variableSpeedMin: 60,
  variableSpeedMax: 120,
  cursorGlide: true,
  cursorStyle: 'underscore',
  cursorCharacter: '_',
  deleteMode: 'backspace',
  showCursor: true,
  prefix: ''
};

const PRESETS = {
  classic: { ...LOOK },
  human: {
    ...LOOK,
    cursorStyle: 'bar',
    typeEffect: 'fade',
    mistakes: 0.55,
    deletingSpeed: 35,
    pauseDuration: 2200,
    cursorBlinkDuration: 0.55,
    variableSpeedEnabled: true,
    variableSpeedMin: 40,
    variableSpeedMax: 170
  },
  editor: {
    ...LOOK,
    cursorStyle: 'block',
    typeEffect: 'blur',
    deleteMode: 'select',
    typingSpeed: 55,
    deletingSpeed: 22,
    pauseDuration: 2000,
    cursorBlinkDuration: 0.6
  },
  hero: {
    ...LOOK,
    prefix: 'We build ',
    prefixColor: '#8a8693',
    cursorColor: '#ff5a36',
    cursorStyle: 'bar',
    typeEffect: 'rise',
    typingSpeed: 90,
    deletingSpeed: 40,
    pauseDuration: 1800
  }
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'human', label: 'Human' },
  { value: 'editor', label: 'Editor' },
  { value: 'hero', label: 'Hero' }
];

const CURSOR_STYLE_OPTIONS = [
  { value: 'bar', label: 'Bar' },
  { value: 'block', label: 'Block' },
  { value: 'underscore', label: 'Underscore' },
  { value: 'character', label: 'Character' }
];

const CURSOR_OPTIONS = [
  { value: '_', label: 'Underscore (_)' },
  { value: '|', label: 'Pipe (|)' },
  { value: '▎', label: 'Block (▎)' },
  { value: '●', label: 'Dot (●)' },
  { value: '█', label: 'Full Block (█)' }
];

const EFFECT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'blur', label: 'Blur' },
  { value: 'rise', label: 'Rise' }
];

const DELETE_MODE_OPTIONS = [
  { value: 'backspace', label: 'Backspace' },
  { value: 'select', label: 'Select' }
];

const propData = [
  {
    name: 'text',
    type: 'string | string[]',
    default: '-',
    description: 'A sentence, or a list of sentences typed one after another.'
  },
  {
    name: 'as',
    type: 'ElementType',
    default: 'div',
    description: 'The element to render, such as h1 or span.'
  },
  {
    name: 'prefix',
    type: 'string',
    default: "''",
    description: 'Static text shown before the typed part, such as "We build " in front of rotating words.'
  },
  {
    name: 'prefixColor',
    type: 'string',
    default: "'currentColor'",
    description: 'Color of the prefix. Follows the surrounding text color by default.'
  },
  {
    name: 'typingSpeed',
    type: 'number',
    default: '50',
    description: 'Delay between typed characters, in ms.'
  },
  {
    name: 'initialDelay',
    type: 'number',
    default: '0',
    description: 'Wait before a sentence starts typing, in ms.'
  },
  {
    name: 'pauseDuration',
    type: 'number',
    default: '2000',
    description: 'How long a finished sentence stays before it is cleared, in ms.'
  },
  {
    name: 'deletingSpeed',
    type: 'number',
    default: '30',
    description: 'Delay between deleted characters, in ms. In select mode, how fast the highlight grows.'
  },
  {
    name: 'deleteMode',
    type: "'backspace' | 'select'",
    default: "'backspace'",
    description:
      'How a sentence is cleared: erased one character at a time, or highlighted like selected text and then removed at once.'
  },
  {
    name: 'typeEffect',
    type: "'none' | 'fade' | 'blur' | 'rise'",
    default: "'none'",
    description:
      'How each character appears as it is typed: instantly, fading in, sharpening from a blur, or rising into place.'
  },
  {
    name: 'mistakes',
    type: 'number',
    default: '0',
    description:
      'From 0 to 1. How often a wrong key is hit. The typo is noticed after a beat, erased, and corrected, like a person typing.'
  },
  {
    name: 'variableSpeed',
    type: '{min: number, max: number}',
    default: 'undefined',
    description: 'Types each character after a random delay between min and max ms, for a human feel.'
  },
  {
    name: 'loop',
    type: 'boolean',
    default: 'true',
    description: 'Starts over after the last sentence. When off, the last sentence stays.'
  },
  {
    name: 'showCursor',
    type: 'boolean',
    default: 'true',
    description: 'Shows a blinking cursor at the typing position.'
  },
  {
    name: 'cursorStyle',
    type: "'character' | 'bar' | 'block' | 'underscore'",
    default: "'character'",
    description:
      'Shape of the cursor. Bar, block and underscore are drawn to fit the font. Character uses cursorCharacter.'
  },
  {
    name: 'cursorCharacter',
    type: 'string | React.ReactNode',
    default: '|',
    description: 'Character or React node used as the cursor when cursorStyle is character.'
  },
  {
    name: 'cursorColor',
    type: 'string',
    default: "'currentColor'",
    description: 'Color of the cursor. Follows the surrounding text color by default.'
  },
  {
    name: 'cursorBlinkDuration',
    type: 'number',
    default: '0.5',
    description: 'Half the length of one blink, in seconds. The cursor fades softly and stays solid while typing.'
  },
  {
    name: 'cursorGlide',
    type: 'boolean',
    default: 'true',
    description: 'Glides the cursor smoothly to each new position instead of jumping.'
  },
  {
    name: 'hideCursorWhileTyping',
    type: 'boolean',
    default: 'false',
    description: 'Fades the cursor out while characters are being typed or cleared.'
  },
  {
    name: 'cursorClassName',
    type: 'string',
    default: "''",
    description: 'Extra class names for the cursor.'
  },
  {
    name: 'className',
    type: 'string',
    default: "''",
    description: 'Extra class names for the root element.'
  },
  {
    name: 'textColors',
    type: 'string[]',
    default: '[]',
    description: 'Colors for the sentences, used in turn.'
  },
  {
    name: 'onSentenceComplete',
    type: '(sentence: string, index: number) => void',
    default: 'undefined',
    description: 'Called with the sentence and its index each time a sentence is cleared.'
  },
  {
    name: 'startOnVisible',
    type: 'boolean',
    default: 'false',
    description: 'Waits until the text scrolls into view before typing.'
  },
  {
    name: 'reverseMode',
    type: 'boolean',
    default: 'false',
    description: 'Reveals each sentence from its last character back to its first.'
  }
];

const TextTypeDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, variableSpeedEnabled, variableSpeedMin, variableSpeedMax, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');
  const shown = value => (value === 'currentColor' ? ink : value);

  const variableSpeed = useMemo(
    () => (variableSpeedEnabled ? { min: variableSpeedMin, max: variableSpeedMax } : undefined),
    [variableSpeedEnabled, variableSpeedMin, variableSpeedMax]
  );

  const computedProps = useMemo(() => (variableSpeed ? { variableSpeed } : {}), [variableSpeed]);

  const restart = (name, value) => {
    updateProp(name, value);
    forceRerender();
  };

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'variableSpeedEnabled', 'variableSpeedMin', 'variableSpeedMax']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={350}
            p={16}
            overflow="hidden"
            alignItems="flex-start"
            justifyContent="flex-start"
          >
            <TextType
              key={key}
              text={settings.prefix ? WORDS : SENTENCES}
              {...settings}
              variableSpeed={variableSpeed}
              className="custom-text-type"
            />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewColorPickerCustom
              title="Cursor Color"
              color={shown(settings.cursorColor)}
              onChange={value => updateProp('cursorColor', value)}
            />

            <PreviewColorPickerCustom
              title="Prefix Color"
              color={shown(settings.prefixColor)}
              onChange={value => updateProp('prefixColor', value)}
            />

            <PreviewSlider
              title="Typing Speed"
              min={10}
              max={200}
              step={5}
              value={settings.typingSpeed}
              valueUnit="ms"
              isDisabled={variableSpeedEnabled}
              onChange={value => updateProp('typingSpeed', value)}
            />

            <PreviewSlider
              title="Deleting Speed"
              min={10}
              max={100}
              step={5}
              value={settings.deletingSpeed}
              valueUnit="ms"
              onChange={value => updateProp('deletingSpeed', value)}
            />

            <PreviewSlider
              title="Pause Duration"
              min={500}
              max={5000}
              step={100}
              value={settings.pauseDuration}
              valueUnit="ms"
              onChange={value => updateProp('pauseDuration', value)}
            />

            <PreviewSlider
              title="Mistakes"
              min={0}
              max={1}
              step={0.05}
              value={settings.mistakes}
              onChange={value => updateProp('mistakes', value)}
            />

            <PreviewSelect
              title="Type Effect"
              options={EFFECT_OPTIONS}
              value={settings.typeEffect}
              onChange={value => updateProp('typeEffect', value)}
            />

            <PreviewSlider
              title="Cursor Blink"
              min={0.1}
              max={2}
              step={0.05}
              value={settings.cursorBlinkDuration}
              valueUnit="s"
              isDisabled={!settings.showCursor}
              onChange={value => updateProp('cursorBlinkDuration', value)}
            />

            <PreviewSwitch
              title="Variable Speed"
              isChecked={variableSpeedEnabled}
              onChange={checked => updateProp('variableSpeedEnabled', checked)}
            />

            <PreviewSlider
              title="Variable Speed Min"
              isDisabled={!variableSpeedEnabled}
              min={10}
              max={150}
              step={5}
              value={variableSpeedMin}
              valueUnit="ms"
              onChange={value => updateProp('variableSpeedMin', value)}
            />

            <PreviewSlider
              title="Variable Speed Max"
              isDisabled={!variableSpeedEnabled}
              min={50}
              max={300}
              step={5}
              value={variableSpeedMax}
              valueUnit="ms"
              onChange={value => updateProp('variableSpeedMax', value)}
            />

            <PreviewSwitch
              title="Cursor Glide"
              isChecked={settings.cursorGlide}
              isDisabled={!settings.showCursor}
              onChange={checked => updateProp('cursorGlide', checked)}
            />

            <PreviewSelect
              title="Cursor Style"
              options={CURSOR_STYLE_OPTIONS}
              value={settings.cursorStyle}
              isDisabled={!settings.showCursor}
              onChange={value => updateProp('cursorStyle', value)}
            />

            <PreviewSelect
              title="Cursor Character"
              options={CURSOR_OPTIONS}
              value={settings.cursorCharacter}
              isDisabled={!settings.showCursor || settings.cursorStyle !== 'character'}
              onChange={value => updateProp('cursorCharacter', value)}
            />

            <PreviewSelect
              title="Delete Mode"
              options={DELETE_MODE_OPTIONS}
              value={settings.deleteMode}
              onChange={value => updateProp('deleteMode', value)}
            />

            <PreviewSwitch
              title="Show Cursor"
              isChecked={settings.showCursor}
              onChange={checked => updateProp('showCursor', checked)}
            />

            <PreviewInput
              title="Prefix"
              value={settings.prefix}
              placeholder="We build "
              maxLength={24}
              onChange={value => restart('prefix', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={textType} componentName="TextType" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TextTypeDemo;
