import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  ChartLineData01Icon,
  CloudIcon,
  CommandIcon,
  Database01Icon,
  FingerPrintIcon,
  FlashIcon,
  Globe02Icon,
  Layers01Icon,
  Notification01Icon,
  SecurityCheckIcon,
  Settings01Icon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';

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

import AnimatedContent from '../../content/Animations/AnimatedContent/AnimatedContent';
import { animatedContent } from '../../constants/code/Animations/animatedContentCode';

const INK = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.62)',
    faint: 'rgba(244, 244, 245, 0.4)',
    tile: 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    card: 'linear-gradient(180deg, #24212c 0%, #1b1921 100%)',
    solid: '#f4f4f5',
    solidText: '#121016',
    photo: '/assets/demo/night-landscape.webp'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.62)',
    faint: 'rgba(24, 24, 27, 0.4)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    card: 'linear-gradient(180deg, #ffffff 0%, #f8f8fa 100%)',
    solid: '#18181b',
    solidText: '#ffffff',
    photo: '/assets/demo/day-landscape.webp'
  }
};

const FEATURES = [
  { icon: FlashIcon, title: 'Instant deploys', text: 'Push to main and it is live in seconds.' },
  { icon: Layers01Icon, title: 'Preview builds', text: 'Every branch gets its own shareable URL.' },
  { icon: SecurityCheckIcon, title: 'Built-in safety', text: 'Roll back any release with one click.' }
];

const STATS = [
  { value: '99.99%', label: 'Uptime' },
  { value: '42ms', label: 'Median latency' },
  { value: '180+', label: 'Edge regions' }
];

const TILES = [
  CommandIcon,
  CloudIcon,
  Database01Icon,
  FingerPrintIcon,
  Globe02Icon,
  Notification01Icon,
  Settings01Icon,
  UserGroupIcon
];

const LOOK = {
  direction: 'vertical',
  distance: 100,
  reverse: false,
  duration: 0.8,
  ease: 'power3.out',
  initialOpacity: 0,
  animateOpacity: true,
  scale: 1,
  blur: 0,
  rotate: 0,
  tilt: 0,
  wipe: 'none',
  stagger: 0.08,
  staggerFrom: 'start',
  scrub: false
};

const DEFAULT_PROPS = {
  demo: 'scroll',
  preset: 'rise',
  smoothScroll: true,
  ...LOOK,
  delay: 0,
  threshold: 0.1,
  once: true,
  disappearAfter: 0,
  disappearDuration: 0.5,
  disappearEase: 'power3.in'
};

const PRESETS = {
  rise: {},
  blur: { distance: 40, blur: 12, duration: 1 },
  flip: { distance: 40, tilt: 60, duration: 1.1 },
  wipe: { distance: 0, wipe: 'up', duration: 1.2, ease: 'power2.out' },
  slide: { direction: 'horizontal', distance: 140, duration: 1.1, ease: 'expo.out', blur: 4 },
  spring: { distance: 120, duration: 1.6, ease: 'elastic.out(1, 0.55)' },
  zoom: { distance: 0, scale: 0.85, blur: 6, duration: 0.9 },
  scrub: { distance: 80, blur: 10, scrub: true }
};

const DEMO_OPTIONS = [
  { value: 'scroll', label: 'Scroll' },
  { value: 'stagger', label: 'Stagger' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'rise', label: 'Rise' },
  { value: 'blur', label: 'Blur' },
  { value: 'flip', label: 'Flip' },
  { value: 'wipe', label: 'Wipe' },
  { value: 'slide', label: 'Slide' },
  { value: 'spring', label: 'Spring' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'scrub', label: 'Scrub' }
];

const DIRECTION_OPTIONS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' }
];

const EASE_OPTIONS = [
  { value: 'power3.out', label: 'Power' },
  { value: 'expo.out', label: 'Expo' },
  { value: 'power2.out', label: 'Soft' },
  { value: 'back.out(1.6)', label: 'Back' },
  { value: 'elastic.out(1, 0.55)', label: 'Elastic' },
  { value: 'bounce.out', label: 'Bounce' },
  { value: 'none', label: 'Linear' }
];

const DISAPPEAR_EASE_OPTIONS = [
  { value: 'power3.in', label: 'Power' },
  { value: 'expo.in', label: 'Expo' },
  { value: 'back.in(1.6)', label: 'Back' }
];

const WIPE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'center', label: 'Center' }
];

const STAGGER_FROM_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' },
  { value: 'center', label: 'Center' },
  { value: 'edges', label: 'Edges' },
  { value: 'random', label: 'Random' }
];

const propData = [
  { name: 'children', type: 'ReactNode', default: '-', description: 'The content to animate.' },
  {
    name: 'container',
    type: 'string | HTMLElement',
    default: 'window',
    description: 'Scroll container that drives the animation, as a selector or an element. Defaults to the page.'
  },
  {
    name: 'distance',
    type: 'number',
    default: '100',
    description: 'How far the content travels into place, in px.'
  },
  {
    name: 'direction',
    type: "'vertical' | 'horizontal'",
    default: "'vertical'",
    description: 'Axis the content travels along.'
  },
  {
    name: 'reverse',
    type: 'boolean',
    default: 'false',
    description: 'Comes in from the opposite side: from above, or from the left.'
  },
  { name: 'duration', type: 'number', default: '0.8', description: 'Length of the animation, in seconds.' },
  {
    name: 'ease',
    type: 'string',
    default: "'power3.out'",
    description: "Any GSAP ease, such as 'expo.out', 'back.out(1.6)' or 'elastic.out(1, 0.5)'."
  },
  { name: 'initialOpacity', type: 'number', default: '0', description: 'Opacity the content starts from.' },
  {
    name: 'animateOpacity',
    type: 'boolean',
    default: 'true',
    description: 'Fades the content in. Turn off to keep it fully opaque while it moves.'
  },
  { name: 'scale', type: 'number', default: '1', description: 'Scale the content starts from.' },
  {
    name: 'blur',
    type: 'number',
    default: '0',
    description: 'Blur the content starts from, in px. It comes into focus as it lands.'
  },
  { name: 'rotate', type: 'number', default: '0', description: 'Rotation the content starts from, in degrees.' },
  {
    name: 'tilt',
    type: 'number',
    default: '0',
    description: 'Tips the content back in 3D, in degrees, so it flips up into place.'
  },
  {
    name: 'wipe',
    type: "'none' | 'up' | 'down' | 'left' | 'right' | 'center'",
    default: "'none'",
    description: 'Reveals the content behind a soft moving edge instead of all at once.'
  },
  {
    name: 'threshold',
    type: 'number',
    default: '0.1',
    description: 'How far into the viewport the top of the content must be before it animates, from 0 to 1.'
  },
  { name: 'delay', type: 'number', default: '0', description: 'Wait before the animation starts, in seconds.' },
  {
    name: 'stagger',
    type: 'number',
    default: '0',
    description: 'Animates each direct child in turn, this many seconds apart. Great for lists and grids.'
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
    description: 'Animate when the content scrolls into view, or right away.'
  },
  {
    name: 'once',
    type: 'boolean',
    default: 'true',
    description:
      'Plays once. Turn off to replay every time the content scrolls in, and reverse when it scrolls back out.'
  },
  {
    name: 'scrub',
    type: 'boolean | number',
    default: 'false',
    description: 'Ties the animation to the scroll position. A number smooths it, in seconds.'
  },
  {
    name: 'disappearAfter',
    type: 'number',
    default: '0',
    description: 'Hides the content again this many seconds after it appears. 0 keeps it shown.'
  },
  {
    name: 'disappearDuration',
    type: 'number',
    default: '0.5',
    description: 'Length of the hide animation, in seconds.'
  },
  { name: 'disappearEase', type: 'string', default: "'power3.in'", description: 'GSAP ease of the hide animation.' },
  { name: 'onStart', type: '() => void', default: '-', description: 'Called when the animation starts.' },
  { name: 'onComplete', type: '() => void', default: '-', description: 'Called when the animation finishes.' },
  {
    name: 'onDisappearanceComplete',
    type: '() => void',
    default: '-',
    description: 'Called when the hide animation finishes.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the wrapper.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the wrapper.' }
];

const IconTile = ({ ink, icon, size = 36 }) => (
  <Box
    w={`${size}px`}
    h={`${size}px`}
    borderRadius="10px"
    display="grid"
    placeItems="center"
    flexShrink={0}
    style={{ background: ink.tile, boxShadow: ink.rim }}
  >
    <HugeiconsIcon icon={icon} size={Math.round(size * 0.5)} color={ink.text} strokeWidth={1.6} />
  </Box>
);

const ScrollScene = ({ ink, reveal, smooth }) => {
  const [scroller, setScroller] = useState(null);
  const motion = { ...reveal, container: scroller };
  useSmoothScroll(scroller, smooth);
  return (
    <Box ref={setScroller} position="absolute" inset={0} overflowY="auto" css={{ scrollbarWidth: 'none' }}>
      {scroller && (
        <Flex direction="column" align="center" gap="72px" px="24px" pt="96px" pb="140px" maxW="720px" mx="auto">
          <AnimatedContent {...motion} style={{ textAlign: 'center' }}>
            <Text fontSize="clamp(26px, 7cqi, 40px)" fontWeight={600} letterSpacing="-0.035em" lineHeight={1.1}>
              Ship it before lunch
            </Text>
            <Text mt="14px" fontSize="15px" color={ink.muted} maxW="420px" mx="auto" lineHeight={1.6}>
              Every push becomes a live preview, every merge a release, with nothing to configure.
            </Text>
          </AnimatedContent>

          <AnimatedContent
            {...motion}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '14px',
              width: '100%'
            }}
          >
            {FEATURES.map(item => (
              <Box key={item.title} p="20px" borderRadius="18px" style={{ background: ink.card, boxShadow: ink.rim }}>
                <IconTile ink={ink} icon={item.icon} />
                <Text mt="18px" fontSize="15px" fontWeight={600}>
                  {item.title}
                </Text>
                <Text mt="6px" fontSize="13px" lineHeight={1.5} color={ink.muted}>
                  {item.text}
                </Text>
              </Box>
            ))}
          </AnimatedContent>

          <AnimatedContent {...motion} style={{ width: '100%' }}>
            <Box
              h={{ base: '200px', md: '260px' }}
              borderRadius="22px"
              overflow="hidden"
              position="relative"
              style={{ boxShadow: ink.rim }}
            >
              <Box
                as="img"
                src={ink.photo}
                alt=""
                draggable={false}
                position="absolute"
                inset={0}
                w="100%"
                h="100%"
                objectFit="cover"
              />
            </Box>
          </AnimatedContent>

          <AnimatedContent
            {...motion}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', width: '100%' }}
          >
            {STATS.map(item => (
              <Box key={item.label} textAlign="center" py="6px">
                <Text fontSize="clamp(18px, 5.4cqi, 32px)" fontWeight={600} letterSpacing="-0.03em" whiteSpace="nowrap">
                  {item.value}
                </Text>
                <Text mt="4px" fontSize="13px" color={ink.muted}>
                  {item.label}
                </Text>
              </Box>
            ))}
          </AnimatedContent>

          <AnimatedContent {...motion} style={{ width: '100%' }}>
            <Flex
              align="center"
              justify="space-between"
              gap="16px"
              wrap="wrap"
              p="24px"
              borderRadius="20px"
              style={{ background: ink.card, boxShadow: ink.rim }}
            >
              <Flex align="center" gap="14px">
                <IconTile ink={ink} icon={ChartLineData01Icon} size={40} />
                <Box>
                  <Text fontSize="16px" fontWeight={600}>
                    Start shipping today
                  </Text>
                  <Text mt="2px" fontSize="13px" color={ink.muted}>
                    Free for personal projects.
                  </Text>
                </Box>
              </Flex>
              <Flex
                as="span"
                align="center"
                gap="6px"
                h="40px"
                px="16px"
                borderRadius="11px"
                fontSize="14px"
                fontWeight={500}
                style={{ background: ink.solid, color: ink.solidText }}
              >
                Get started
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={1.8} />
              </Flex>
            </Flex>
          </AnimatedContent>
        </Flex>
      )}
    </Box>
  );
};

const StaggerScene = ({ ink, reveal }) => (
  <Flex position="absolute" inset={0} align="center" justify="center" px="24px">
    <AnimatedContent
      {...reveal}
      stagger={reveal.stagger > 0 ? reveal.stagger : 0.08}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '14px',
        width: 'min(100%, 460px)'
      }}
    >
      {TILES.map((icon, index) => (
        <Box
          key={index}
          aspectRatio="1"
          borderRadius="18px"
          display="grid"
          placeItems="center"
          style={{ background: ink.card, boxShadow: ink.rim }}
        >
          <HugeiconsIcon icon={icon} size={24} color={ink.text} strokeWidth={1.6} />
        </Box>
      ))}
    </AnimatedContent>
  </Flex>
);

const BasicScene = ({ ink, reveal }) => (
  <Flex position="absolute" inset={0} align="center" justify="center">
    <AnimatedContent {...reveal}>
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="14px"
        w="220px"
        h="150px"
        borderRadius="22px"
        style={{ background: ink.card, boxShadow: ink.rim }}
      >
        <IconTile ink={ink} icon={FlashIcon} size={40} />
        <Text fontSize="15px" fontWeight={600}>
          Animated content
        </Text>
      </Flex>
    </AnimatedContent>
  </Flex>
);

const AnimatedContentDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, preset, smoothScroll, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = INK[theme];

  const applyPreset = value => {
    updateProps({ ...LOOK, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const Scene = demo === 'stagger' ? StaggerScene : demo === 'basic' ? BasicScene : ScrollScene;

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
            <Scene key={`${demo}-${key}`} ink={ink} reveal={settings} smooth={smoothScroll} />
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
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={settings.ease}
              onChange={value => updateProp('ease', value)}
            />
            <PreviewSelect
              title="Wipe"
              options={WIPE_OPTIONS}
              value={settings.wipe}
              onChange={value => updateProp('wipe', value)}
            />
            <PreviewSelect
              title="Stagger From"
              options={STAGGER_FROM_OPTIONS}
              value={settings.staggerFrom}
              onChange={value => updateProp('staggerFrom', value)}
            />
            <PreviewSlider
              title="Distance"
              min={0}
              max={300}
              step={10}
              value={settings.distance}
              valueUnit="px"
              onChange={value => updateProp('distance', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.1}
              max={3}
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
              max={0.4}
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
              title="Initial Scale"
              min={0.5}
              max={1.5}
              step={0.01}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Rotate"
              min={-45}
              max={45}
              step={1}
              value={settings.rotate}
              valueUnit="°"
              onChange={value => updateProp('rotate', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={90}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Initial Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.initialOpacity}
              isDisabled={!settings.animateOpacity}
              onChange={value => updateProp('initialOpacity', value)}
            />
            <PreviewSlider
              title="Threshold"
              min={0}
              max={0.9}
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
              isDisabled={!settings.once || settings.scrub}
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
            <PreviewSelect
              title="Disappear Ease"
              options={DISAPPEAR_EASE_OPTIONS}
              value={settings.disappearEase}
              onChange={value => updateProp('disappearEase', value)}
            />
            <PreviewSwitch
              title="Reverse"
              isChecked={settings.reverse}
              onChange={value => updateProp('reverse', value)}
            />
            <PreviewSwitch
              title="Animate Opacity"
              isChecked={settings.animateOpacity}
              onChange={value => updateProp('animateOpacity', value)}
            />
            <PreviewSwitch
              title="Smooth Scroll"
              isChecked={smoothScroll}
              isDisabled={demo !== 'scroll'}
              onChange={value => updateProp('smoothScroll', value)}
            />
            <PreviewSwitch title="Once" isChecked={settings.once} onChange={value => updateProp('once', value)} />
            <PreviewSwitch title="Scrub" isChecked={settings.scrub} onChange={value => updateProp('scrub', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={animatedContent} componentName="AnimatedContent" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default AnimatedContentDemo;
