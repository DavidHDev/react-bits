import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import useSmoothScroll from '../../hooks/useSmoothScroll';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import FadeContent from '../../content/Animations/FadeContent/FadeContent';
import { fadeContent } from '../../constants/code/Animations/fadeContentCode';

const INK = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.62)',
    faint: 'rgba(244, 244, 245, 0.4)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07)',
    sky: '/assets/demo/night-sky.webp',
    portrait: '/assets/demo/night-portrait.webp',
    landscape: '/assets/demo/night-landscape.webp'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.62)',
    faint: 'rgba(24, 24, 27, 0.4)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08)',
    sky: '/assets/demo/day-sky.webp',
    portrait: '/assets/demo/day-portrait.webp',
    landscape: '/assets/demo/day-landscape.webp'
  }
};

const TILES = [
  { photo: 'sky', position: '18% 40%' },
  { photo: 'portrait', position: '50% 30%' },
  { photo: 'landscape', position: '20% 60%' },
  { photo: 'landscape', position: '82% 45%' },
  { photo: 'sky', position: '85% 55%' },
  { photo: 'portrait', position: '50% 88%' }
];

const LOOK = {
  effect: 'fade',
  blur: 0,
  duration: 1,
  ease: 'power2.out',
  initialOpacity: 0,
  stagger: 0.1,
  staggerFrom: 'start',
  exit: false,
  scrub: false
};

const DEFAULT_PROPS = {
  demo: 'journal',
  preset: 'mist',
  smoothScroll: true,
  ...LOOK,
  effect: 'mist',
  duration: 1.8,
  delay: 0,
  threshold: 0.1,
  once: true,
  disappearAfter: 0,
  disappearDuration: 0.5,
  disappearEase: 'power2.in'
};

const PRESETS = {
  fade: {},
  soft: { blur: 10, duration: 1.2 },
  focus: { effect: 'focus', duration: 1.2, ease: 'power3.out' },
  develop: { effect: 'develop', duration: 2 },
  dissolve: { effect: 'dissolve', duration: 1.4, ease: 'power1.inOut' },
  mist: { effect: 'mist', duration: 1.8 },
  pixel: { effect: 'pixel', duration: 1.2, ease: 'power1.inOut' },
  spotlight: { effect: 'focus', exit: true, scrub: 0.5 }
};

const DEMO_OPTIONS = [
  { value: 'journal', label: 'Journal' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'soft', label: 'Soft' },
  { value: 'focus', label: 'Focus' },
  { value: 'develop', label: 'Develop' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'mist', label: 'Mist' },
  { value: 'pixel', label: 'Pixel' },
  { value: 'spotlight', label: 'Spotlight' }
];

const EFFECT_OPTIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'focus', label: 'Focus' },
  { value: 'develop', label: 'Develop' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'mist', label: 'Mist' },
  { value: 'pixel', label: 'Pixel' }
];

const EASE_OPTIONS = [
  { value: 'power2.out', label: 'Soft' },
  { value: 'power3.out', label: 'Power' },
  { value: 'expo.out', label: 'Expo' },
  { value: 'power1.inOut', label: 'Even' },
  { value: 'sine.in', label: 'Slow Start' },
  { value: 'none', label: 'Linear' }
];

const DISAPPEAR_EASE_OPTIONS = [
  { value: 'power2.in', label: 'Soft' },
  { value: 'power3.in', label: 'Power' },
  { value: 'expo.in', label: 'Expo' }
];

const STAGGER_FROM_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' },
  { value: 'center', label: 'Center' },
  { value: 'edges', label: 'Edges' },
  { value: 'random', label: 'Random' }
];

const propData = [
  { name: 'children', type: 'ReactNode', default: '-', description: 'The content to fade in.' },
  {
    name: 'container',
    type: 'string | HTMLElement',
    default: 'window',
    description: 'Scroll container that drives the fade, as a selector or an element. Defaults to the page.'
  },
  {
    name: 'effect',
    type: "'fade' | 'focus' | 'develop' | 'dissolve' | 'mist' | 'pixel'",
    default: "'fade'",
    description:
      'How the content appears: a plain fade, out of focus, from washed-out gray, through fine grain, through drifting mist, or block by block.'
  },
  {
    name: 'blur',
    type: 'boolean | number',
    default: 'false',
    description: 'Extra blur the content starts from, in px. true adds 10px.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '1',
    description: 'Length of the fade, in seconds. Values above 10 are read as milliseconds.'
  },
  {
    name: 'ease',
    type: 'string',
    default: "'power2.out'",
    description: "Any GSAP ease, such as 'power3.out', 'expo.out' or 'none'."
  },
  {
    name: 'delay',
    type: 'number',
    default: '0',
    description: 'Wait before the fade starts, in seconds. Values above 10 are read as milliseconds.'
  },
  {
    name: 'threshold',
    type: 'number',
    default: '0.1',
    description: 'How far into the viewport the top of the content must be before it fades in, from 0 to 1.'
  },
  { name: 'initialOpacity', type: 'number', default: '0', description: 'Opacity the content starts from.' },
  {
    name: 'stagger',
    type: 'number',
    default: '0',
    description: 'Fades each direct child in turn, this many seconds apart. Great for lists and grids.'
  },
  {
    name: 'staggerFrom',
    type: "'start' | 'end' | 'center' | 'edges' | 'random'",
    default: "'start'",
    description: 'Which child goes first when staggering.'
  },
  {
    name: 'trigger',
    type: "'scroll' | 'mount'",
    default: "'scroll'",
    description: 'Fade in when the content scrolls into view, or right away.'
  },
  {
    name: 'once',
    type: 'boolean',
    default: 'true',
    description: 'Fades in once. Turn off to fade back out whenever the content scrolls back below the view.'
  },
  {
    name: 'exit',
    type: 'boolean',
    default: 'false',
    description: 'Fades the content back out as it scrolls off the top, and in again when it comes back.'
  },
  {
    name: 'scrub',
    type: 'boolean | number',
    default: 'false',
    description: 'Ties the fade to the scroll position instead of playing it. A number smooths it, in seconds.'
  },
  {
    name: 'disappearAfter',
    type: 'number',
    default: '0',
    description: 'Fades the content out again this many seconds after it appears. 0 keeps it shown.'
  },
  {
    name: 'disappearDuration',
    type: 'number',
    default: '0.5',
    description: 'Length of the fade out, in seconds.'
  },
  { name: 'disappearEase', type: 'string', default: "'power2.in'", description: 'GSAP ease of the fade out.' },
  { name: 'onStart', type: '() => void', default: '-', description: 'Called when the fade starts.' },
  { name: 'onComplete', type: '() => void', default: '-', description: 'Called when the fade finishes.' },
  {
    name: 'onDisappearanceComplete',
    type: '() => void',
    default: '-',
    description: 'Called when the fade out finishes.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the wrapper.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the wrapper.' }
];

const Photo = ({ ink, src, position = '50% 50%', h, ratio, radius = '22px' }) => (
  <Box
    position="relative"
    w="100%"
    h={h}
    aspectRatio={ratio}
    borderRadius={radius}
    overflow="hidden"
    style={{ boxShadow: ink.rim }}
  >
    <Box
      as="img"
      src={src}
      alt=""
      draggable={false}
      position="absolute"
      inset={0}
      w="100%"
      h="100%"
      objectFit="cover"
      style={{ objectPosition: position }}
    />
  </Box>
);

const JournalScene = ({ ink, fade, smooth }) => {
  const [scroller, setScroller] = useState(null);
  const motion = { ...fade, container: scroller };
  useSmoothScroll(scroller, smooth);
  return (
    <Box ref={setScroller} position="absolute" inset={0} overflowY="auto" css={{ scrollbarWidth: 'none' }}>
      {scroller && (
        <Flex direction="column" align="center" gap="64px" px="24px" pt="92px" pb="140px" maxW="680px" mx="auto">
          <FadeContent {...motion} style={{ textAlign: 'center' }}>
            <Text fontSize="13px" color={ink.faint}>
              Field notes, October
            </Text>
            <Text
              mt="10px"
              fontSize="clamp(28px, 7.4cqi, 44px)"
              fontWeight={600}
              letterSpacing="-0.035em"
              lineHeight={1.08}
            >
              Slow light over the bay
            </Text>
            <Text mt="14px" fontSize="15px" color={ink.muted} maxW="400px" mx="auto" lineHeight={1.6}>
              Shot in the last minutes of daylight, when the clouds turn and the water goes still.
            </Text>
          </FadeContent>

          <FadeContent {...motion} style={{ width: '100%' }}>
            <Photo ink={ink} src={ink.sky} h="clamp(220px, 50cqi, 340px)" />
          </FadeContent>

          <FadeContent
            {...motion}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', width: '100%', alignItems: 'center' }}
          >
            <Box flex="1 1 240px" minW={0}>
              <Text fontSize="20px" fontWeight={600} letterSpacing="-0.02em">
                The walk out
              </Text>
              <Text mt="10px" fontSize="15px" lineHeight={1.65} color={ink.muted}>
                The pier is a twenty minute walk from the station. Most evenings it is empty by the time the sky starts
                to change, so you get the whole thing to yourself.
              </Text>
            </Box>
            <Box flex="1 1 240px" minW={0}>
              <Photo ink={ink} src={ink.portrait} ratio="4 / 5" radius="18px" />
            </Box>
          </FadeContent>

          <FadeContent {...motion} style={{ textAlign: 'center', maxWidth: '460px' }}>
            <Text fontSize="clamp(20px, 5cqi, 28px)" fontWeight={500} letterSpacing="-0.02em" lineHeight={1.3}>
              The good light lasts about four minutes. You learn to wait for it.
            </Text>
          </FadeContent>

          <FadeContent {...motion} style={{ width: '100%' }}>
            <Photo ink={ink} src={ink.landscape} h="clamp(200px, 44cqi, 300px)" position="50% 60%" />
          </FadeContent>

          <FadeContent {...motion} style={{ textAlign: 'center' }}>
            <Text fontSize="15px" color={ink.muted}>
              More from the coast next spring.
            </Text>
          </FadeContent>
        </Flex>
      )}
    </Box>
  );
};

const GalleryScene = ({ ink, fade }) => (
  <Flex position="absolute" inset={0} align="center" justify="center" px="24px">
    <FadeContent
      {...fade}
      stagger={fade.stagger > 0 ? fade.stagger : 0.1}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '12px',
        width: 'min(100%, 520px)'
      }}
    >
      {TILES.map((tile, index) => (
        <Photo key={index} ink={ink} src={ink[tile.photo]} position={tile.position} ratio="1" radius="16px" />
      ))}
    </FadeContent>
  </Flex>
);

const BasicScene = ({ ink, fade }) => (
  <Flex position="absolute" inset={0} align="center" justify="center" px="24px">
    <FadeContent {...fade} style={{ width: 'min(100%, 320px)' }}>
      <Photo ink={ink} src={ink.sky} ratio="3 / 2" radius="20px" />
    </FadeContent>
  </Flex>
);

const FadeContentDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, preset, smoothScroll, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = INK[theme];
  const scrolling = demo === 'journal';
  const fade = scrolling ? settings : { ...settings, exit: false, scrub: false };

  const applyPreset = value => {
    updateProps({ ...LOOK, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const Scene = demo === 'gallery' ? GalleryScene : demo === 'basic' ? BasicScene : JournalScene;

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['demo', 'preset', 'smoothScroll']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={500}
            p={0}
            overflow="hidden"
            color={ink.text}
            style={{ containerType: 'inline-size' }}
          >
            <Scene key={`${demo}-${key}`} ink={ink} fade={fade} smooth={smoothScroll} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={demo}
              onChange={value => updateProp('demo', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings.effect}
              onChange={value => updateProp('effect', value)}
            />
            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={settings.ease}
              onChange={value => updateProp('ease', value)}
            />
            <PreviewSelect
              title="Stagger From"
              options={STAGGER_FROM_OPTIONS}
              value={settings.staggerFrom}
              onChange={value => updateProp('staggerFrom', value)}
            />
            <PreviewSelect
              title="Disappear Ease"
              options={DISAPPEAR_EASE_OPTIONS}
              value={settings.disappearEase}
              onChange={value => updateProp('disappearEase', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.2}
              max={4}
              step={0.1}
              value={settings.duration}
              valueUnit="s"
              onChange={value => updateProp('duration', value)}
            />
            <PreviewSlider
              title="Delay"
              min={0}
              max={2}
              step={0.1}
              value={settings.delay}
              valueUnit="s"
              onChange={value => updateProp('delay', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.stagger}
              valueUnit="s"
              onChange={value => updateProp('stagger', value)}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={30}
              step={1}
              value={settings.blur}
              valueUnit="px"
              onChange={value => updateProp('blur', value)}
            />
            <PreviewSlider
              title="Initial Opacity"
              min={0}
              max={0.9}
              step={0.05}
              value={settings.initialOpacity}
              onChange={value => updateProp('initialOpacity', value)}
            />
            <PreviewSlider
              title="Threshold"
              min={0}
              max={0.45}
              step={0.05}
              value={settings.threshold}
              onChange={value => updateProp('threshold', value)}
            />
            <PreviewSlider
              title="Disappear After"
              min={0}
              max={5}
              step={0.1}
              value={settings.disappearAfter}
              valueUnit="s"
              isDisabled={!settings.once || settings.exit || (scrolling && Boolean(settings.scrub))}
              onChange={value => updateProp('disappearAfter', value)}
            />
            <PreviewSlider
              title="Disappear Duration"
              min={0.1}
              max={3}
              step={0.1}
              value={settings.disappearDuration}
              valueUnit="s"
              isDisabled={!settings.disappearAfter}
              onChange={value => updateProp('disappearDuration', value)}
            />
            <PreviewSwitch title="Once" isChecked={settings.once} onChange={value => updateProp('once', value)} />
            <PreviewSwitch
              title="Exit"
              isChecked={settings.exit}
              isDisabled={!scrolling}
              onChange={value => updateProp('exit', value)}
            />
            <PreviewSwitch
              title="Scrub"
              isChecked={Boolean(settings.scrub)}
              isDisabled={!scrolling}
              onChange={value => updateProp('scrub', value)}
            />
            <PreviewSwitch
              title="Smooth Scroll"
              isChecked={smoothScroll}
              isDisabled={!scrolling}
              onChange={value => updateProp('smoothScroll', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={fadeContent} componentName="FadeContent" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FadeContentDemo;
