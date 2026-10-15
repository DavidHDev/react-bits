import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import Customize from '../../components/common/Preview/Customize';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import RefreshButton from '@/components/common/Preview/RefreshButton';
import useForceRerender from '@/hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import { shuffle } from '../../constants/code/TextAnimations/shuffleCode';
import Shuffle from '@content/TextAnimations/Shuffle/Shuffle';

const LOOK = {
  effect: 'slide',
  shuffleDirection: 'right',
  animationMode: 'evenodd',
  ease: 'power3.out',
  duration: 0.35,
  shuffleTimes: 1,
  stagger: 0.03,
  maxDelay: 0,
  scrambleCharset: '',
  motionBlur: false,
  hoverRadius: 0,
  accentColor: ''
};

const PRESETS = {
  classic: { ...LOOK },
  flip: {
    ...LOOK,
    effect: 'flip',
    shuffleDirection: 'down',
    animationMode: 'sequence',
    ease: 'power2.out',
    duration: 1.1,
    shuffleTimes: 7,
    stagger: 0.07,
    scrambleCharset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  },
  blur: {
    ...LOOK,
    effect: 'blur',
    shuffleDirection: 'up',
    animationMode: 'center',
    ease: 'expo.out',
    duration: 1.5,
    shuffleTimes: 14,
    stagger: 0.06,
    scrambleCharset: '0123456789#%&*+=?'
  },
  hover: {
    ...LOOK,
    shuffleDirection: 'down',
    animationMode: 'random',
    ease: 'expo.out',
    duration: 0.9,
    shuffleTimes: 5,
    maxDelay: 0.45,
    scrambleCharset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    motionBlur: true,
    hoverRadius: 120,
    accentColor: '#ff5a36'
  }
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  color: '',
  colorFrom: '',
  colorTo: '',
  loop: false,
  loopDelay: 0,
  triggerOnHover: true
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'flip', label: 'Flip' },
  { value: 'blur', label: 'Blur' },
  { value: 'hover', label: 'Hover' }
];

const EFFECT_OPTIONS = [
  { label: 'Slide', value: 'slide' },
  { label: 'Flip', value: 'flip' },
  { label: 'Blur', value: 'blur' }
];

const DIRECTION_OPTIONS = [
  { label: 'Right', value: 'right' },
  { label: 'Left', value: 'left' },
  { label: 'Up', value: 'up' },
  { label: 'Down', value: 'down' }
];

const MODE_OPTIONS = [
  { label: 'Even / Odd', value: 'evenodd' },
  { label: 'Sequence', value: 'sequence' },
  { label: 'Center', value: 'center' },
  { label: 'Random', value: 'random' }
];

const EASE_OPTIONS = [
  { label: 'power2.out', value: 'power2.out' },
  { label: 'power3.out', value: 'power3.out' },
  { label: 'back.out(1.1)', value: 'back.out(1.1)' },
  { label: 'back.out(2)', value: 'back.out(2)' },
  { label: 'expo.out', value: 'expo.out' }
];

const propData = [
  { name: 'text', type: 'string', default: '""', description: 'The text content to shuffle.' },
  { name: 'className', type: 'string', default: '""', description: 'Optional CSS class for the wrapper element.' },
  { name: 'style', type: 'object', default: '{}', description: 'Inline styles applied to the wrapper element.' },
  {
    name: 'effect',
    type: '"slide" | "flip" | "blur"',
    default: '"slide"',
    description:
      'How each letter cycles: a reel that slides past, a card that flips in 3D through random glyphs, or glyphs that spin in place with motion blur and settle sharp.'
  },
  {
    name: 'shuffleDirection',
    type: '"left" | "right" | "up" | "down"',
    default: '"right"',
    description: 'Direction letters travel. Flip turns around the matching axis.'
  },
  { name: 'duration', type: 'number', default: '0.35', description: 'Duration (s) of each letter’s shuffle.' },
  {
    name: 'maxDelay',
    type: 'number',
    default: '0',
    description: 'Longest random delay (s) before a letter starts, when animationMode is "random".'
  },
  {
    name: 'ease',
    type: 'string | Function',
    default: '"power3.out"',
    description: 'GSAP ease for the motion and color shift. Back eases make letters overshoot as they land.'
  },
  {
    name: 'threshold',
    type: 'number',
    default: '0.1',
    description: 'Portion of the element that must enter view before starting.'
  },
  {
    name: 'rootMargin',
    type: 'string',
    default: '"-100px"',
    description: 'ScrollTrigger start offset (px, %, etc.).'
  },
  {
    name: 'tag',
    type: '"h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span"',
    default: '"p"',
    description: 'HTML tag to render for the text container.'
  },
  {
    name: 'textAlign',
    type: 'CSS text-align',
    default: '"center"',
    description: 'Text alignment applied via inline style.'
  },
  {
    name: 'onShuffleComplete',
    type: '() => void',
    default: 'undefined',
    description: 'Called after a full run completes (and on each loop repeat).'
  },
  {
    name: 'shuffleTimes',
    type: 'number',
    default: '1',
    description: 'How many interim glyphs each letter passes through before it lands.'
  },
  {
    name: 'animationMode',
    type: '"evenodd" | "sequence" | "center" | "random"',
    default: '"evenodd"',
    description:
      'Order the letters start in: odd letters then even ones, left to right, outward from the middle, or after random delays.'
  },
  { name: 'loop', type: 'boolean', default: 'false', description: 'Repeat the shuffle indefinitely.' },
  { name: 'loopDelay', type: 'number', default: '0', description: 'Delay (s) between loop repeats.' },
  {
    name: 'stagger',
    type: 'number',
    default: '0.03',
    description: 'Delay (s) between letters starting, in every mode except "random".'
  },
  {
    name: 'scrambleCharset',
    type: 'string',
    default: '""',
    description: 'Characters to use for interim scrambles; empty keeps original copies.'
  },
  {
    name: 'motionBlur',
    type: 'boolean',
    default: 'false',
    description: 'Smears the sliding reel along its direction while it moves fast, then lands sharp. Slide effect only.'
  },
  {
    name: 'color',
    type: 'string',
    default: 'undefined',
    description: 'Text color. Follows the surrounding text color when unset.'
  },
  {
    name: 'accentColor',
    type: 'string',
    default: 'undefined',
    description: 'Color of the interim glyphs while letters are in flight. Settled letters keep the text color.'
  },
  {
    name: 'colorFrom',
    type: 'string',
    default: 'undefined',
    description: 'Color each letter starts in, fading to its final color as it lands.'
  },
  {
    name: 'colorTo',
    type: 'string',
    default: 'undefined',
    description: 'Color each letter fades to as it lands, and keeps afterwards.'
  },
  {
    name: 'triggerOnce',
    type: 'boolean',
    default: 'true',
    description: 'Auto-run only on first scroll into view.'
  },
  {
    name: 'respectReducedMotion',
    type: 'boolean',
    default: 'true',
    description: 'Shows the text right away, without shuffling, if the user prefers reduced motion.'
  },
  {
    name: 'triggerOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Allow re-playing the animation on hover after it completes.'
  },
  {
    name: 'hoverRadius',
    type: 'number',
    default: '0',
    description:
      'With hover replay on, only letters within this distance (px) of the cursor reshuffle, closer ones longer and through more glyphs. 0 replays the whole text.'
  }
];

const ShuffleDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, color, accentColor, colorFrom, colorTo, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');

  const colors = useMemo(
    () => Object.fromEntries(Object.entries({ color, accentColor, colorFrom, colorTo }).filter(([, value]) => value)),
    [color, accentColor, colorFrom, colorTo]
  );

  const change = (name, value) => {
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
      demoOnlyProps={['preset', 'color', 'accentColor', 'colorFrom', 'colorTo']}
      computedProps={colors}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="flex justify-center items-center demo-container"
            h={400}
            overflow="hidden"
          >
            <Shuffle key={key} text="REACT BITS" {...settings} {...colors} />

            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewColorPickerCustom title="Color" color={color || ink} onChange={value => change('color', value)} />

            <PreviewColorPickerCustom
              title="Accent"
              color={accentColor || color || ink}
              onChange={value => change('accentColor', value)}
            />

            <PreviewColorPickerCustom
              title="Start Color"
              color={colorFrom || color || ink}
              onChange={value => change('colorFrom', value)}
            />

            <PreviewColorPickerCustom
              title="End Color"
              color={colorTo || color || ink}
              onChange={value => change('colorTo', value)}
            />

            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings.effect}
              onChange={value => change('effect', value)}
            />

            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.shuffleDirection}
              onChange={value => change('shuffleDirection', value)}
            />

            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings.animationMode}
              onChange={value => change('animationMode', value)}
            />

            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={settings.ease}
              onChange={value => change('ease', value)}
            />

            <PreviewSlider
              title="Duration"
              min={0.1}
              max={2}
              step={0.05}
              value={settings.duration}
              valueUnit="s"
              onChange={value => change('duration', Number(value))}
            />

            <PreviewSlider
              title="Shuffle Times"
              min={1}
              max={16}
              step={1}
              value={settings.shuffleTimes}
              onChange={value => change('shuffleTimes', Number(value))}
            />

            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.2}
              step={0.01}
              value={settings.stagger}
              valueUnit="s"
              isDisabled={settings.animationMode === 'random'}
              onChange={value => change('stagger', Number(value))}
            />

            <PreviewSlider
              title="Max Delay"
              min={0}
              max={1}
              step={0.05}
              value={settings.maxDelay}
              valueUnit="s"
              isDisabled={settings.animationMode !== 'random'}
              onChange={value => change('maxDelay', Number(value))}
            />

            <PreviewSwitch title="Loop" isChecked={settings.loop} onChange={checked => change('loop', checked)} />

            <PreviewSlider
              title="Loop Delay"
              min={0}
              max={2}
              step={0.1}
              value={settings.loopDelay}
              isDisabled={!settings.loop}
              valueUnit="s"
              onChange={value => change('loopDelay', Number(value))}
            />

            <PreviewInput
              title="Scramble"
              value={settings.scrambleCharset}
              placeholder="Repeats the letter"
              maxLength={40}
              onChange={value => change('scrambleCharset', value)}
            />

            <PreviewSwitch
              title="Motion Blur"
              isChecked={settings.motionBlur}
              isDisabled={settings.effect !== 'slide'}
              onChange={checked => change('motionBlur', checked)}
            />

            <PreviewSwitch
              title="Hover Replay"
              isChecked={settings.triggerOnHover}
              onChange={checked => change('triggerOnHover', checked)}
            />

            <PreviewSlider
              title="Hover Radius"
              min={0}
              max={300}
              step={10}
              value={settings.hoverRadius}
              valueUnit="px"
              isDisabled={!settings.triggerOnHover}
              onChange={value => change('hoverRadius', Number(value))}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap', '@gsap/react']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={shuffle} componentName="Shuffle" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ShuffleDemo;
