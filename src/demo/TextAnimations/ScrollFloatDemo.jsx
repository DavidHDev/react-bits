import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import useComponentProps from '../../hooks/useComponentProps';
import useSmoothScroll from '../../hooks/useSmoothScroll';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import ScrollFloat from '../../content/TextAnimations/ScrollFloat/ScrollFloat';
import { scrollFloat } from '../../constants/code/TextAnimations/scrollFloatCode';

const LOOK = {
  colorShift: false,
  shiftColor: '#ff6b3d',
  effect: 'float',
  splitBy: 'chars',
  direction: 'up',
  order: 'start',
  ease: 'back.inOut(2)',
  animationDuration: 1,
  stagger: 0.03,
  smoothing: 0,
  distance: 120,
  stretch: 2.3
};

const PRESETS = {
  float: { ...LOOK },
  flip: {
    ...LOOK,
    effect: 'flip',
    direction: 'down',
    order: 'center',
    stagger: 0.12,
    smoothing: 0.4,
    distance: 140
  },
  scatter: {
    ...LOOK,
    colorShift: true,
    effect: 'scatter',
    order: 'random',
    ease: 'sine.inOut',
    stagger: 0.09,
    smoothing: 0.5,
    distance: 170
  },
  wave: {
    ...LOOK,
    colorShift: true,
    shiftColor: '#3d8bff',
    effect: 'wave',
    ease: 'none',
    animationDuration: 1.6,
    stagger: 0.11,
    smoothing: 0.3,
    distance: 130,
    stretch: 1.4
  }
};

const DEFAULT_PROPS = {
  preset: 'float',
  ...LOOK
};

const PRESET_OPTIONS = [
  { value: 'float', label: 'Float' },
  { value: 'flip', label: 'Flip' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'wave', label: 'Wave' }
];

const EFFECT_OPTIONS = [
  { value: 'float', label: 'Float' },
  { value: 'flip', label: 'Flip' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'blur', label: 'Blur' },
  { value: 'wave', label: 'Wave' }
];

const SPLIT_OPTIONS = [
  { value: 'chars', label: 'Letters' },
  { value: 'words', label: 'Words' }
];

const DIRECTION_OPTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' }
];

const ORDER_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' },
  { value: 'center', label: 'Center' },
  { value: 'edges', label: 'Edges' },
  { value: 'random', label: 'Random' }
];

const EASE_OPTIONS = [
  { value: 'back.inOut(2)', label: 'Overshoot' },
  { value: 'elastic.out(1, 0.45)', label: 'Elastic' },
  { value: 'power3.out', label: 'Glide' },
  { value: 'sine.inOut', label: 'Smooth' },
  { value: 'expo.out', label: 'Expo' },
  { value: 'none', label: 'Linear' }
];

const propData = [
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'The text to animate. Plain text is split into letters or words, anything else moves in as one piece.'
  },
  {
    name: 'scrollContainerRef',
    type: 'RefObject<HTMLElement>',
    default: 'window',
    description: 'Ref to the element that scrolls. Leave it out to use the page.'
  },
  {
    name: 'effect',
    type: "'float' | 'flip' | 'scatter' | 'blur' | 'wave'",
    default: "'float'",
    description:
      'How the pieces arrive. Float stretches them up out of a slot, flip rolls them in on a drum, scatter assembles them from random spots, blur pulls them into focus and wave makes them swell in on a rolling wave.'
  },
  {
    name: 'splitBy',
    type: "'chars' | 'words'",
    default: "'chars'",
    description: 'Animate each letter on its own or each word as one piece.'
  },
  {
    name: 'direction',
    type: "'up' | 'down'",
    default: "'up'",
    description: 'Whether the pieces come in from below or from above.'
  },
  {
    name: 'order',
    type: "'start' | 'end' | 'center' | 'edges' | 'random'",
    default: "'start'",
    description: 'Which pieces go first. The order is fixed, so random looks the same on every visit.'
  },
  {
    name: 'fromColor',
    type: 'string',
    default: "'currentColor'",
    description:
      'Color the pieces start in before they settle into the text color. Keep currentColor for no color change.'
  },
  {
    name: 'animationDuration',
    type: 'number',
    default: '1',
    description: "Length of each piece's move compared to the stagger. Higher values move the pieces more together."
  },
  {
    name: 'ease',
    type: 'string',
    default: "'back.inOut(2)'",
    description: "Any GSAP ease, such as 'power3.out', 'elastic.out(1, 0.45)' or 'none'."
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.03',
    description: 'Delay between pieces. Higher values make the text form one piece at a time.'
  },
  {
    name: 'distance',
    type: 'number',
    default: '120',
    description:
      'How far the pieces travel, as a percentage of their height. For flip it sets the size of the drum they roll around, for scatter how widely they start apart.'
  },
  {
    name: 'stretch',
    type: 'number',
    default: '2.3',
    description: 'How tall the pieces are stretched while they rise in the float and wave effects. 1 keeps their shape.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0',
    description: 'Seconds the pieces take to catch up with the scroll. 0 ties them to it directly.'
  },
  {
    name: 'scrollStart',
    type: 'string',
    default: "'center bottom+=50%'",
    description: 'Scroll position where the animation starts, in ScrollTrigger syntax.'
  },
  {
    name: 'scrollEnd',
    type: 'string',
    default: "'bottom bottom-=40%'",
    description: 'Scroll position where the pieces settle. Text near the end of the page still settles fully.'
  },
  { name: 'containerClassName', type: 'string', default: "''", description: 'Extra class names for the heading.' },
  { name: 'textClassName', type: 'string', default: "''", description: 'Extra class names for the text.' }
];

const ScrollFloatDemo = () => {
  const containerRef = useRef(null);
  const hintRef = useRef(null);
  const [scroller, setScroller] = useState(null);
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, colorShift, shiftColor, ...settings } = props;
  const fromColor = colorShift ? shiftColor : 'currentColor';

  useSmoothScroll(scroller, true);

  const fadeHint = event => {
    const hint = hintRef.current;
    if (!hint) return;
    const t = Math.min(1, event.currentTarget.scrollTop / 160);
    hint.style.opacity = String(1 - t * t * (3 - 2 * t));
  };

  useEffect(() => {
    setScroller(containerRef.current);
  }, []);

  const replay = () => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    replay();
  };

  const computedProps = useMemo(() => ({ fromColor }), [fromColor]);

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'colorShift', 'shiftColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            className="demo-container"
            style={{ height: '400px', maxHeight: '400px' }}
            overflowY="scroll"
            overflowX="hidden"
            ref={containerRef}
            onScroll={fadeHint}
            position="relative"
            display="block"
          >
            <Flex
              ref={hintRef}
              className="demo-scroll-hint"
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="400px"
              direction="column"
              align="center"
              justify="center"
              gap="6px"
              pointerEvents="none"
            >
              <Text fontSize="13px" fontWeight={500}>
                Scroll down in this box
              </Text>
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={1.8} />
            </Flex>
            <Box position="relative" pt="760px" pb="520px" px="3rem">
              <ScrollFloat {...settings} fromColor={fromColor} scrollContainerRef={containerRef}>
                React Bits
              </ScrollFloat>
            </Box>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewColorPickerCustom
              title="Start Color"
              color={shiftColor}
              onChange={value => updateProps({ shiftColor: value, colorShift: true })}
            />
            <PreviewSwitch
              title="Color Shift"
              isChecked={colorShift}
              onChange={checked => updateProp('colorShift', checked)}
            />

            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings.effect}
              onChange={value => updateProp('effect', value)}
            />
            <PreviewSelect
              title="Split"
              options={SPLIT_OPTIONS}
              value={settings.splitBy}
              onChange={value => updateProp('splitBy', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSelect
              title="Order"
              options={ORDER_OPTIONS}
              value={settings.order}
              onChange={value => updateProp('order', value)}
            />
            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={settings.ease}
              onChange={value => updateProp('ease', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0.01}
              max={0.2}
              step={0.01}
              value={settings.stagger}
              valueUnit="s"
              onChange={value => updateProp('stagger', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.2}
              max={3}
              step={0.1}
              value={settings.animationDuration}
              valueUnit="s"
              onChange={value => updateProp('animationDuration', value)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0}
              max={2}
              step={0.1}
              value={settings.smoothing}
              valueUnit="s"
              onChange={value => updateProp('smoothing', value)}
            />

            <PreviewSlider
              title="Distance"
              min={0}
              max={300}
              step={10}
              value={settings.distance}
              valueUnit="%"
              onChange={value => updateProp('distance', value)}
            />
            <PreviewSlider
              title="Stretch"
              min={1}
              max={4}
              step={0.1}
              value={settings.stretch}
              isDisabled={settings.effect !== 'float' && settings.effect !== 'wave'}
              onChange={value => updateProp('stretch', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scrollFloat} componentName="ScrollFloat" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ScrollFloatDemo;
