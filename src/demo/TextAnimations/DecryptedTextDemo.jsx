import { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { TabsLayout, PreviewTab, CodeTab } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import DecryptedText from '../../content/TextAnimations/DecryptedText/DecryptedText';
import { decryptedText } from '../../constants/code/TextAnimations/decryptedTextCode';

const CHARACTER_SETS = {
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  hex: '0123456789ABCDEF',
  binary: '01',
  blocks: '█▓▒░',
  symbols: '!<>-_/[]{}=+*^?#'
};

const LOOK = {
  scrambleColor: '',
  effect: 'scramble',
  animateOn: 'inViewHover',
  speed: 60,
  maxIterations: 10,
  sequential: true,
  revealDirection: 'start',
  hoverRadius: 100,
  loop: false,
  loopDelay: 2000,
  characters: CHARACTER_SETS.letters,
  useOriginalCharsOnly: false
};

const PRESETS = {
  classic: { ...LOOK },
  terminal: {
    ...LOOK,
    scrambleColor: '#2bb673',
    revealDirection: 'random',
    speed: 40,
    hoverRadius: 70,
    characters: CHARACTER_SETS.hex
  },
  flip: {
    ...LOOK,
    effect: 'flip',
    revealDirection: 'center',
    speed: 70,
    hoverRadius: 0
  },
  loop: {
    ...LOOK,
    effect: 'fade',
    animateOn: 'view',
    speed: 45,
    hoverRadius: 0,
    loop: true,
    loopDelay: 1800,
    characters: CHARACTER_SETS.symbols
  }
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  clickMode: 'once'
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'flip', label: 'Flip' },
  { value: 'loop', label: 'Loop' }
];

const EFFECT_OPTIONS = [
  { label: 'Scramble', value: 'scramble' },
  { label: 'Flip', value: 'flip' },
  { label: 'Fade', value: 'fade' }
];

const ANIMATE_OPTIONS = [
  { label: 'View', value: 'view' },
  { label: 'Hover', value: 'hover' },
  { label: 'View & Hover', value: 'inViewHover' },
  { label: 'Click', value: 'click' }
];

const CLICK_OPTIONS = [
  { label: 'Once', value: 'once' },
  { label: 'Toggle', value: 'toggle' }
];

const DIRECTION_OPTIONS = [
  { label: 'Start', value: 'start' },
  { label: 'End', value: 'end' },
  { label: 'Center', value: 'center' },
  { label: 'Random', value: 'random' }
];

const CHARACTER_OPTIONS = [
  { label: 'Letters', value: CHARACTER_SETS.letters },
  { label: 'Hex', value: CHARACTER_SETS.hex },
  { label: 'Binary', value: CHARACTER_SETS.binary },
  { label: 'Blocks', value: CHARACTER_SETS.blocks },
  { label: 'Symbols', value: CHARACTER_SETS.symbols }
];

const propData = [
  {
    name: 'text',
    type: 'string',
    default: '-',
    description: 'The text to decrypt.'
  },
  {
    name: 'effect',
    type: "'scramble' | 'flip' | 'fade'",
    default: "'scramble'",
    description:
      'How letters decode. Scramble swaps glyphs in place, flip rolls each glyph in vertically and lands the real letter with a soft bounce, fade keeps scrambled glyphs faint and brightens them as they resolve.'
  },
  {
    name: 'scrambleColor',
    type: 'string',
    default: "''",
    description:
      'Color of letters while they are scrambled. Each letter eases back to the text color as it decodes. Leave empty to keep the text color.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '50',
    description: 'Time between steps, in ms.'
  },
  {
    name: 'maxIterations',
    type: 'number',
    default: '10',
    description:
      'How many steps the letters scramble before settling when not sequential. Also sets how long letters keep scrambling after the cursor passes with hoverRadius.'
  },
  {
    name: 'sequential',
    type: 'boolean',
    default: 'false',
    description: 'Reveals one letter per step instead of all at once.'
  },
  {
    name: 'revealDirection',
    type: "'start' | 'end' | 'center' | 'random'",
    default: "'start'",
    description: 'Where the sequential reveal starts. Random uncovers the letters in a shuffled order.'
  },
  {
    name: 'useOriginalCharsOnly',
    type: 'boolean',
    default: 'false',
    description: 'Scrambles using only the letters already in the text.'
  },
  {
    name: 'characters',
    type: 'string',
    default: "'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+'",
    description: 'The pool of characters used while scrambling.'
  },
  {
    name: 'animateOn',
    type: "'view' | 'hover' | 'inViewHover' | 'click'",
    default: "'hover'",
    description: 'What starts the decryption. View and click start scrambled, so the real text never flashes first.'
  },
  {
    name: 'clickMode',
    type: "'once' | 'toggle'",
    default: "'once'",
    description: "With click, decrypt once or toggle back and forth. Only applies when animateOn is 'click'."
  },
  {
    name: 'hoverRadius',
    type: 'number',
    default: '0',
    description:
      'With hover, only letters within this many px of the cursor scramble, fading out toward the edge, and they settle once it passes. 0 decrypts the whole text on hover.'
  },
  {
    name: 'loop',
    type: 'boolean',
    default: 'false',
    description: 'After decrypting, holds, scrambles the text again and repeats. Pauses while off screen.'
  },
  {
    name: 'loopDelay',
    type: 'number',
    default: '2000',
    description: 'How long the decrypted text holds before scrambling again when looping, in ms.'
  },
  {
    name: 'className',
    type: 'string',
    default: "''",
    description: 'Class names for revealed letters.'
  },
  {
    name: 'parentClassName',
    type: 'string',
    default: "''",
    description: 'Class names for the wrapper around all letters.'
  },
  {
    name: 'encryptedClassName',
    type: 'string',
    default: "''",
    description: 'Class names for letters that are still scrambled.'
  }
];

const DecryptedTextDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, scrambleColor, ...settings } = props;
  const [key, forceRerender] = useForceRerender();
  const ink = useColorModeValue('#18181b', '#ffffff');
  const hoverable = settings.animateOn === 'hover' || settings.animateOn === 'inViewHover';

  const change = (name, value) => {
    updateProp(name, value);
    forceRerender();
  };

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = useMemo(() => (scrambleColor ? { scrambleColor } : {}), [scrambleColor]);

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'scrambleColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" py={{ md: 6, sm: 4 }} className="demo-container" h={400} overflow="hidden">
            <RefreshButton onClick={forceRerender} />

            <Flex width="80%" px=".5em">
              <DecryptedText
                key={key}
                text="Hacking into the mainframe..."
                parentClassName="decrypted-text"
                {...settings}
                scrambleColor={scrambleColor}
              />
            </Flex>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Scramble Color"
              color={scrambleColor || ink}
              onChange={value => updateProp('scrambleColor', value)}
            />
            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings.effect}
              onChange={value => change('effect', value)}
            />
            <PreviewSelect
              title="Animate On"
              options={ANIMATE_OPTIONS}
              value={settings.animateOn}
              onChange={value => change('animateOn', value)}
            />
            <PreviewSelect
              title="Click Mode"
              options={CLICK_OPTIONS}
              value={settings.clickMode}
              isDisabled={settings.animateOn !== 'click'}
              onChange={value => change('clickMode', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.revealDirection}
              isDisabled={!settings.sequential}
              onChange={value => change('revealDirection', value)}
            />
            <PreviewSlider
              title="Speed"
              min={20}
              max={200}
              step={5}
              value={settings.speed}
              valueUnit="ms"
              onChange={value => change('speed', value)}
            />
            <PreviewSlider
              title="Iterations"
              min={1}
              max={40}
              step={1}
              value={settings.maxIterations}
              isDisabled={settings.sequential && !(hoverable && settings.hoverRadius > 0)}
              onChange={value => change('maxIterations', value)}
            />
            <PreviewSlider
              title="Hover Radius"
              min={0}
              max={240}
              step={10}
              value={settings.hoverRadius}
              valueUnit="px"
              isDisabled={!hoverable}
              onChange={value => change('hoverRadius', value)}
            />
            <PreviewSwitch title="Loop" isChecked={settings.loop} onChange={value => change('loop', value)} />
            <PreviewSlider
              title="Loop Delay"
              min={400}
              max={5000}
              step={100}
              value={settings.loopDelay}
              valueUnit="ms"
              isDisabled={!settings.loop}
              onChange={value => change('loopDelay', value)}
            />
            <PreviewSwitch
              title="Sequential"
              isChecked={settings.sequential}
              onChange={value => change('sequential', value)}
            />
            <PreviewSelect
              title="Characters"
              options={CHARACTER_OPTIONS}
              value={settings.characters}
              isDisabled={settings.useOriginalCharsOnly}
              onChange={value => change('characters', value)}
            />
            <PreviewSwitch
              title="Original Chars"
              isChecked={settings.useOriginalCharsOnly}
              onChange={value => change('useOriginalCharsOnly', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={decryptedText} componentName="DecryptedText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default DecryptedTextDemo;
