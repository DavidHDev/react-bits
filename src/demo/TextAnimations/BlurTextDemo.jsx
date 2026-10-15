import { useMemo } from 'react';
import { toast } from 'sonner';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import RefreshButton from '../../components/common/Preview/RefreshButton';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import PropTable from '../../components/common/Preview/PropTable';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import BlurText from '../../content/TextAnimations/BlurText/BlurText';
import { blurText } from '../../constants/code/TextAnimations/blurTextCode';

const LOOK = {
  textColor: '',
  startColor: '',
  effect: 'blur',
  animateBy: 'words',
  direction: 'top',
  staggerFrom: 'start',
  trigger: 'view',
  delay: 200,
  stepDuration: 0.35,
  loop: false,
  loopDelay: 2,
  blur: 10,
  distance: 50,
  focusOnHover: false
};

const PRESETS = {
  soft: { ...LOOK },
  focus: {
    ...LOOK,
    effect: 'focus',
    animateBy: 'letters',
    staggerFrom: 'center',
    delay: 35,
    stepDuration: 0.5,
    loop: true,
    loopDelay: 1.6,
    blur: 14,
    distance: 0
  },
  tilt: {
    ...LOOK,
    startColor: '#ff5a36',
    effect: 'tilt',
    animateBy: 'letters',
    direction: 'bottom',
    delay: 40,
    stepDuration: 0.45,
    blur: 8,
    distance: 40
  },
  drift: {
    ...LOOK,
    effect: 'drift',
    direction: 'left',
    staggerFrom: 'random',
    delay: 110,
    stepDuration: 0.5,
    blur: 12,
    distance: 70,
    focusOnHover: true
  }
};

const DEFAULT_PROPS = {
  preset: 'soft',
  text: "Isn't this so cool?!",
  ...LOOK
};

const PRESET_OPTIONS = [
  { value: 'soft', label: 'Soft' },
  { value: 'focus', label: 'Focus' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'drift', label: 'Drift' }
];

const EFFECT_OPTIONS = [
  { value: 'blur', label: 'Blur' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'focus', label: 'Focus' },
  { value: 'drift', label: 'Drift' }
];

const ANIMATE_BY_OPTIONS = [
  { value: 'words', label: 'Words' },
  { value: 'letters', label: 'Letters' }
];

const DIRECTION_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const STAGGER_FROM_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
  { value: 'random', label: 'Random' }
];

const TRIGGER_OPTIONS = [
  { value: 'view', label: 'View' },
  { value: 'load', label: 'Load' },
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const propData = [
  {
    name: 'text',
    type: 'string',
    default: '""',
    description: 'The text content to animate.'
  },
  {
    name: 'effect',
    type: '"blur" | "zoom" | "tilt" | "focus" | "drift"',
    default: '"blur"',
    description:
      'How each piece comes in. Blur slides in from a side, zoom shrinks down from large, tilt swings in on a slight 3D angle, focus sharpens in place like a camera focus pull and drift glides in sideways with a lean that relaxes.'
  },
  {
    name: 'animateBy',
    type: '"words" | "letters"',
    default: '"words"',
    description: 'Whether each word or each letter comes into focus on its own.'
  },
  {
    name: 'direction',
    type: '"top" | "bottom" | "left" | "right"',
    default: '"top"',
    description:
      'Side the words or letters move in from. Drift always glides sideways, from the right only when set to right.'
  },
  {
    name: 'staggerFrom',
    type: '"start" | "center" | "end" | "random"',
    default: '"start"',
    description: 'Where the stagger starts: the first piece, the middle, the last piece or a shuffled order.'
  },
  {
    name: 'trigger',
    type: '"view" | "load" | "hover" | "click"',
    default: '"view"',
    description:
      'When the text comes in. View waits until it scrolls into view and load starts right away. Hover and click show the text and replay it each time it is hovered or clicked.'
  },
  {
    name: 'delay',
    type: 'number',
    default: '200',
    description: 'Delay between animations for each word/letter (in ms).'
  },
  {
    name: 'stepDuration',
    type: 'number',
    default: '0.35',
    description: 'The time taken for each step of the animation (in seconds).'
  },
  {
    name: 'loop',
    type: 'boolean',
    default: 'false',
    description: 'Keeps replaying: the text holds, blurs back out and comes in again.'
  },
  {
    name: 'loopDelay',
    type: 'number',
    default: '2',
    description: 'How long the text stays sharp before it blurs out again when looping, in seconds.'
  },
  {
    name: 'blur',
    type: 'number',
    default: '10',
    description: 'How blurred each word or letter starts, in px.'
  },
  {
    name: 'distance',
    type: 'number',
    default: '50',
    description:
      'How far each word or letter travels into place, in px. 0 keeps them still so they only come into focus.'
  },
  {
    name: 'color',
    type: 'string',
    default: '"currentColor"',
    description: 'Color of the text. Follows the surrounding text color by default.'
  },
  {
    name: 'fromColor',
    type: 'string',
    default: '-',
    description:
      'Color each word or letter starts in before it settles on the text color. Leave it out to keep one color.'
  },
  {
    name: 'focusOnHover',
    type: 'boolean',
    default: 'false',
    description: 'Hovering a word keeps it sharp while the other words soften and dim.'
  },
  {
    name: 'threshold',
    type: 'number',
    default: '0.1',
    description: 'Intersection threshold for triggering the animation.'
  },
  {
    name: 'rootMargin',
    type: 'string',
    default: '"0px"',
    description: 'Root margin for the intersection observer.'
  },
  {
    name: 'animationFrom',
    type: 'object',
    default: 'undefined',
    description: 'Custom starting keyframe. Replaces the effect, blur, distance and direction settings.'
  },
  {
    name: 'animationTo',
    type: 'object[]',
    default: 'undefined',
    description: 'Custom keyframes to animate through after animationFrom.'
  },
  {
    name: 'easing',
    type: 'Easing | Easing[]',
    default: '-',
    description: 'Motion easing applied to every step. Each effect uses its own tuned curves when this is left out.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Extra class names for the paragraph.'
  },
  {
    name: 'onAnimationComplete',
    type: 'function',
    default: 'undefined',
    description: 'Called each time the text finishes coming in.'
  }
];

const BlurTextDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, textColor, startColor, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');

  const [key, forceRerender] = useForceRerender();

  const updateAndReplay = (name, value) => {
    updateProp(name, value);
    forceRerender();
  };

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = useMemo(
    () => ({
      ...(textColor ? { color: textColor } : {}),
      ...(startColor ? { fromColor: startColor } : {})
    }),
    [textColor, startColor]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'textColor', 'startColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" minH={400} overflow="hidden">
            <RefreshButton onClick={forceRerender} />
            <BlurText
              key={key}
              {...settings}
              color={textColor || undefined}
              fromColor={startColor || undefined}
              onAnimationComplete={settings.loop ? undefined : () => toast('✅ Animation Finished!')}
              className="blur-text-demo"
            />
          </Box>
          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewColorPickerCustom
              title="Text Color"
              color={textColor || ink}
              onChange={val => updateProp('textColor', val)}
            />

            <PreviewColorPickerCustom
              title="From Color"
              color={startColor || textColor || ink}
              onChange={val => updateProp('startColor', val)}
            />

            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings.effect}
              onChange={val => updateAndReplay('effect', val)}
            />

            <PreviewSelect
              title="Animate By"
              options={ANIMATE_BY_OPTIONS}
              value={settings.animateBy}
              onChange={val => updateAndReplay('animateBy', val)}
            />

            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={val => updateAndReplay('direction', val)}
            />

            <PreviewSelect
              title="Stagger From"
              options={STAGGER_FROM_OPTIONS}
              value={settings.staggerFrom}
              onChange={val => updateAndReplay('staggerFrom', val)}
            />

            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings.trigger}
              onChange={val => updateAndReplay('trigger', val)}
            />

            <PreviewSlider
              title="Delay"
              min={20}
              max={500}
              step={10}
              value={settings.delay}
              valueUnit="ms"
              onChange={val => updateAndReplay('delay', val)}
            />

            <PreviewSlider
              title="Step Duration"
              min={0.1}
              max={1}
              step={0.05}
              value={settings.stepDuration}
              valueUnit="s"
              onChange={val => updateAndReplay('stepDuration', val)}
            />

            <PreviewSwitch title="Loop" isChecked={settings.loop} onChange={val => updateAndReplay('loop', val)} />

            <PreviewSlider
              title="Loop Delay"
              min={0.2}
              max={5}
              step={0.1}
              value={settings.loopDelay}
              valueUnit="s"
              isDisabled={!settings.loop}
              onChange={val => updateProp('loopDelay', val)}
            />

            <PreviewSlider
              title="Blur"
              min={0}
              max={30}
              step={1}
              value={settings.blur}
              valueUnit="px"
              onChange={val => updateAndReplay('blur', val)}
            />

            <PreviewSlider
              title="Distance"
              min={0}
              max={120}
              step={5}
              value={settings.distance}
              valueUnit="px"
              onChange={val => updateAndReplay('distance', val)}
            />

            <PreviewSwitch
              title="Focus On Hover"
              isChecked={settings.focusOnHover}
              onChange={val => updateProp('focusOnHover', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={blurText} componentName="BlurText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default BlurTextDemo;
