import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import useSmoothScroll from '../../hooks/useSmoothScroll';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import ScrollReveal from '../../content/TextAnimations/ScrollReveal/ScrollReveal';
import { scrollReveal } from '../../constants/code/TextAnimations/scrollRevealCode';

const LOOK = {
  highlight: false,
  highlightColor: '#ff5a1f',
  mode: 'scrub',
  splitBy: 'words',
  effect: 'fade',
  stagger: 0.05,
  duration: 0.8,
  smoothing: 0,
  baseOpacity: 0.1,
  baseRotation: 3,
  baseOffset: 0,
  enableBlur: true,
  blurStrength: 4
};

const PRESETS = {
  reveal: { ...LOOK },
  highlight: { ...LOOK, highlight: true, stagger: 0.2, baseOpacity: 0.15, baseRotation: 0, enableBlur: false },
  rise: {
    ...LOOK,
    mode: 'enter',
    splitBy: 'lines',
    effect: 'rise',
    stagger: 0.12,
    duration: 0.9,
    baseOpacity: 0,
    baseRotation: 0,
    enableBlur: false
  },
  flip: {
    ...LOOK,
    splitBy: 'chars',
    effect: 'flip',
    stagger: 0.012,
    smoothing: 0.3,
    baseOpacity: 0,
    baseRotation: 0,
    enableBlur: false
  }
};

const DEFAULT_PROPS = {
  preset: 'reveal',
  ...LOOK
};

const PRESET_OPTIONS = [
  { value: 'reveal', label: 'Reveal' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'rise', label: 'Rise' },
  { value: 'flip', label: 'Flip' }
];

const MODE_OPTIONS = [
  { value: 'scrub', label: 'Scrub' },
  { value: 'enter', label: 'Enter' }
];

const SPLIT_OPTIONS = [
  { value: 'words', label: 'Words' },
  { value: 'chars', label: 'Chars' },
  { value: 'lines', label: 'Lines' }
];

const EFFECT_OPTIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'rise', label: 'Rise' },
  { value: 'flip', label: 'Flip' },
  { value: 'scale', label: 'Scale' }
];

const propData = [
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description:
      'The text to reveal. Plain text is split into words, characters or lines, anything else is revealed as one piece.'
  },
  {
    name: 'scrollContainerRef',
    type: 'RefObject<HTMLElement>',
    default: 'window',
    description: 'Ref to the element that scrolls. Leave it out to use the page.'
  },
  {
    name: 'highlightColor',
    type: 'string',
    default: "''",
    description:
      'Accent each word lights up to while it is being revealed, before it settles to the text color. Leave empty for no highlight.'
  },
  {
    name: 'mode',
    type: "'scrub' | 'enter'",
    default: "'scrub'",
    description:
      "'scrub' ties the reveal to the scroll position, 'enter' plays it once when the text scrolls into view."
  },
  {
    name: 'splitBy',
    type: "'words' | 'chars' | 'lines'",
    default: "'words'",
    description:
      "What each step of the reveal is. 'lines' groups the words of each rendered line and regroups on resize."
  },
  {
    name: 'effect',
    type: "'fade' | 'rise' | 'flip' | 'scale'",
    default: "'fade'",
    description:
      "How each piece appears. 'fade' brightens in place, 'rise' slides up from behind its own baseline, 'flip' stands up from flat and 'scale' pops up from small."
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.05',
    description:
      'Spacing between pieces. Higher values reveal them one at a time instead of in a soft wave. In enter mode it is in seconds.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '0.8',
    description: "Seconds each piece takes to appear when mode is 'enter'."
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0',
    description: 'Seconds the reveal takes to catch up with the scroll. 0 ties it to the scroll directly.'
  },
  {
    name: 'enableBlur',
    type: 'boolean',
    default: 'true',
    description: 'Starts each piece out of focus and sharpens it as it appears.'
  },
  {
    name: 'blurStrength',
    type: 'number',
    default: '4',
    description: 'How blurred the pieces start, in px.'
  },
  {
    name: 'baseOpacity',
    type: 'number',
    default: '0.1',
    description: 'Opacity of the pieces before they are revealed, from 0 to 1.'
  },
  {
    name: 'baseRotation',
    type: 'number',
    default: '3',
    description: 'Tilt of the whole block before it levels out, in degrees. 0 keeps it level.'
  },
  {
    name: 'baseOffset',
    type: 'number',
    default: '0',
    description: 'How far below its place each piece starts, in px. Pieces rise into place as they appear.'
  },
  {
    name: 'rotationEnd',
    type: 'string',
    default: "'bottom bottom'",
    description: 'Scroll position where the block finishes leveling out in scrub mode, in ScrollTrigger syntax.'
  },
  {
    name: 'wordAnimationEnd',
    type: 'string',
    default: "'bottom bottom'",
    description:
      'Scroll position where every piece is fully revealed in scrub mode. Text near the end of the page still finishes.'
  },
  {
    name: 'containerClassName',
    type: 'string',
    default: "''",
    description: 'Extra class names for the heading.'
  },
  {
    name: 'textClassName',
    type: 'string',
    default: "''",
    description: 'Extra class names for the text.'
  }
];

const ScrollRevealDemo = () => {
  const containerRef = useRef(null);
  const hintRef = useRef(null);
  const [scroller, setScroller] = useState(null);
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, highlight, highlightColor, ...settings } = props;

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

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = useMemo(
    () => ({ highlightColor: highlight ? highlightColor : undefined }),
    [highlight, highlightColor]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'highlight']}
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
            {settings.mode === 'enter' && <RefreshButton onClick={forceRerender} />}
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
            <Box position="relative" pt="640px" pb="480px" px="3rem">
              <ScrollReveal
                key={key}
                {...settings}
                highlightColor={highlight ? highlightColor : ''}
                scrollContainerRef={containerRef}
              >
                When does a man die? When he is hit by a bullet? No! When he suffers a disease? No! When he ate a soup
                made out of a poisonous mushroom? No! A man dies when he is forgotten!
              </ScrollReveal>
            </Box>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSwitch title="Highlight" isChecked={highlight} onChange={value => updateProp('highlight', value)} />
            <PreviewColorPickerCustom
              title="Highlight Color"
              color={highlightColor}
              onChange={value => updateProps({ highlightColor: value, highlight: true })}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings.mode}
              onChange={value => updateProp('mode', value)}
            />
            <PreviewSelect
              title="Split By"
              options={SPLIT_OPTIONS}
              value={settings.splitBy}
              onChange={value => updateProp('splitBy', value)}
            />
            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings.effect}
              onChange={value => updateProp('effect', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.5}
              step={0.005}
              value={settings.stagger}
              onChange={value => updateProp('stagger', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.duration}
              valueUnit="s"
              isDisabled={settings.mode !== 'enter'}
              onChange={value => updateProp('duration', value)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0}
              max={2}
              step={0.1}
              value={settings.smoothing}
              valueUnit="s"
              isDisabled={settings.mode !== 'scrub'}
              onChange={value => updateProp('smoothing', value)}
            />
            <PreviewSlider
              title="Starting Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.baseOpacity}
              onChange={value => updateProp('baseOpacity', value)}
            />
            <PreviewSlider
              title="Starting Rotation"
              min={0}
              max={10}
              step={1}
              value={settings.baseRotation}
              valueUnit="°"
              onChange={value => updateProp('baseRotation', value)}
            />
            <PreviewSlider
              title="Starting Offset"
              min={0}
              max={60}
              step={1}
              value={settings.baseOffset}
              valueUnit="px"
              onChange={value => updateProp('baseOffset', value)}
            />
            <PreviewSlider
              title="Blur Strength"
              min={0}
              max={20}
              step={1}
              value={settings.blurStrength}
              valueUnit="px"
              isDisabled={!settings.enableBlur}
              onChange={value => updateProp('blurStrength', value)}
            />
            <PreviewSwitch
              title="Enable Blur"
              isChecked={settings.enableBlur}
              onChange={value => updateProp('enableBlur', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scrollReveal} componentName="ScrollReveal" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ScrollRevealDemo;
