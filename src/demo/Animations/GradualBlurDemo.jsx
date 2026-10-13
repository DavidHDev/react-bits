import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Album02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FavouriteIcon,
  Image01Icon,
  MoreHorizontalIcon,
  Search01Icon
} from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useComponentProps from '../../hooks/useComponentProps';
import useSmoothScroll from '../../hooks/useSmoothScroll';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import GradualBlur from '../../content/Animations/GradualBlur/GradualBlur';
import { gradualBlur } from '../../constants/code/Animations/gradualblurCode';

const INK = {
  dark: {
    page: '#120f17',
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.6)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07)',
    tile: 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    tileRim:
      'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    sky: '/assets/demo/night-sky.webp',
    portrait: '/assets/demo/night-portrait.webp',
    landscape: '/assets/demo/night-landscape.webp'
  },
  light: {
    page: '#ffffff',
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.6)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    tileRim:
      'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    sky: '/assets/demo/day-sky.webp',
    portrait: '/assets/demo/day-portrait.webp',
    landscape: '/assets/demo/day-landscape.webp'
  }
};

const SHOTS = [
  { photo: 'sky', position: '20% 40%', zoom: 1 },
  { photo: 'portrait', position: '50% 35%', zoom: 1.15 },
  { photo: 'landscape', position: '30% 60%', zoom: 1 },
  { photo: 'landscape', position: '82% 40%', zoom: 1.7 },
  { photo: 'sky', position: '85% 60%', zoom: 1.5 },
  { photo: 'portrait', position: '45% 85%', zoom: 1 },
  { photo: 'portrait', position: '70% 55%', zoom: 1.9 },
  { photo: 'sky', position: '50% 80%', zoom: 1.2 },
  { photo: 'landscape', position: '55% 25%', zoom: 1.4 }
];

const SECTIONS = [
  { title: 'Today', shots: [0, 1, 2, 3, 4, 5] },
  { title: 'Yesterday', shots: [6, 7, 8, 2, 0, 1] },
  { title: 'Last week', shots: [3, 4, 5, 6, 7, 8, 1, 2, 0] }
];

const TABS = [
  { icon: Image01Icon, label: 'Library' },
  { icon: Album02Icon, label: 'Albums' },
  { icon: FavouriteIcon, label: 'Favorites' },
  { icon: Search01Icon, label: 'Search' }
];

const LOOK = {
  strength: 2,
  depth: 6,
  layers: 8,
  curve: 'linear',
  exponential: true,
  opacity: 1,
  saturation: 1,
  hoverIntensity: 1,
  tintAmount: 0.6
};

const DEFAULT_PROPS = {
  demo: 'feed',
  preset: 'soft',
  smoothScroll: true,
  tintColor: null,
  position: 'bottom',
  target: 'parent',
  autoHide: true,
  ...LOOK
};

const PRESETS = {
  soft: {},
  clear: { tintAmount: 0 },
  deep: { strength: 4, depth: 10, tintAmount: 0.45 },
  subtle: { strength: 1, depth: 4, tintAmount: 0.3 },
  vibrant: { strength: 3, saturation: 1.8, tintAmount: 0 },
  fog: { strength: 2.5, exponential: false, curve: 'ease-out', tintAmount: 0.92 },
  peek: { strength: 3, hoverIntensity: 0, tintAmount: 0.3 },
  steps: { layers: 3, exponential: false, curve: 'linear', tintAmount: 0 }
};

const DEMO_OPTIONS = [
  { value: 'feed', label: 'Feed' },
  { value: 'photo', label: 'Photo' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'soft', label: 'Soft' },
  { value: 'clear', label: 'Clear' },
  { value: 'deep', label: 'Deep' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'fog', label: 'Fog' },
  { value: 'peek', label: 'Peek' },
  { value: 'steps', label: 'Steps' }
];

const POSITION_OPTIONS = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const TARGET_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'page', label: 'Page' }
];

const CURVE_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'bezier', label: 'Smooth' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' }
];

const propData = [
  {
    name: 'position',
    type: "'top' | 'bottom' | 'left' | 'right'",
    default: "'bottom'",
    description: 'Edge the blur grows toward.'
  },
  {
    name: 'target',
    type: "'parent' | 'page'",
    default: "'parent'",
    description: 'Sit inside the nearest positioned parent, or stay fixed to the edge of the viewport.'
  },
  {
    name: 'height',
    type: 'string | number',
    default: "'6rem'",
    description: 'How far the blur reaches in from the edge. For left and right this is its width. Numbers are px.'
  },
  {
    name: 'width',
    type: 'string | number',
    default: '-',
    description: 'For top and bottom, a narrower centered band. For left and right, overrides height.'
  },
  {
    name: 'strength',
    type: 'number',
    default: '2',
    description: 'How blurry the very edge gets. Each step adds about 12px of blur.'
  },
  {
    name: 'layers',
    type: 'number',
    default: '8',
    description: 'Blur layers stacked across the ramp. More layers give a smoother falloff, fewer show visible steps.'
  },
  {
    name: 'curve',
    type: "'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out'",
    default: "'linear'",
    description: 'How the blur builds across the ramp. bezier is a smooth S-curve.'
  },
  {
    name: 'exponential',
    type: 'boolean',
    default: 'true',
    description: 'Doubles the blur toward the edge so it starts gently. Turn off for an even ramp.'
  },
  {
    name: 'opacity',
    type: 'number',
    default: '1',
    description: 'Opacity of the blur layers. Lower values let the sharp content show through.'
  },
  {
    name: 'saturation',
    type: 'number',
    default: '1',
    description: 'Color boost of the blurred content, building toward the edge, for a glassy look.'
  },
  {
    name: 'tint',
    type: 'string',
    default: "'transparent'",
    description: 'Color the content fades into at the edge, such as your page background. Use rgba for a lighter wash.'
  },
  {
    name: 'autoHide',
    type: 'boolean',
    default: 'false',
    description:
      'Fades the blur out when the scroll container reaches this edge, so it only shows while there is more to scroll.'
  },
  {
    name: 'container',
    type: 'string | HTMLElement | RefObject',
    default: '-',
    description:
      'Scroll container watched by autoHide. Defaults to a scrollable sibling or the parent, or the page when target is page.'
  },
  {
    name: 'hoverIntensity',
    type: 'number',
    default: '1',
    description: 'Multiplies the blur while the cursor is over it. 0 clears it on hover, 2 doubles it.'
  },
  {
    name: 'duration',
    type: 'number | string',
    default: '0.3',
    description: 'Length of the hover and autoHide transitions, in seconds or as a CSS time.'
  },
  { name: 'easing', type: 'string', default: "'ease-out'", description: 'CSS easing of those transitions.' },
  { name: 'zIndex', type: 'number', default: '1000', description: 'Stacking order of the overlay.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the overlay.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the overlay.' }
];

const toRgba = (hex, alpha) => {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map(c => c + c)
          .join('')
      : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Shot = ({ ink, shot, radius = '6px', ratio = '1' }) => (
  <Box position="relative" aspectRatio={ratio} borderRadius={radius} overflow="hidden">
    <Box
      as="img"
      src={ink[shot.photo]}
      alt=""
      draggable={false}
      position="absolute"
      inset={0}
      w="100%"
      h="100%"
      objectFit="cover"
      style={{ objectPosition: shot.position, transform: `scale(${shot.zoom})`, transformOrigin: shot.position }}
    />
  </Box>
);

const FeedScene = ({ ink, blur, smooth }) => {
  const [scroller, setScroller] = useState(null);
  useSmoothScroll(scroller, smooth);
  return (
    <Box position="absolute" inset={0}>
      <Box ref={setScroller} position="absolute" inset={0} overflowY="auto" css={{ scrollbarWidth: 'none' }}>
        <Box maxW="720px" mx="auto" px="16px" pt="76px" pb="104px">
          {SECTIONS.map((section, index) => (
            <Box key={section.title} mt={index ? '28px' : 0}>
              <Flex justify="space-between" align="baseline" px="4px" mb="10px">
                <Text fontSize="15px" fontWeight={600}>
                  {section.title}
                </Text>
                <Text fontSize="13px" color={ink.muted}>
                  {section.shots.length} photos
                </Text>
              </Flex>
              <Box display="grid" gridTemplateColumns="repeat(3, minmax(0, 1fr))" gap="4px">
                {section.shots.map((shot, i) => (
                  <Shot key={i} ink={ink} shot={SHOTS[shot]} />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <GradualBlur {...blur} position="top" target="parent" zIndex={2} />
      <GradualBlur {...blur} position="bottom" target="parent" zIndex={2} />

      <Flex
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={3}
        h="64px"
        px="24px"
        align="center"
        justify="space-between"
        pointerEvents="none"
      >
        <Text fontSize="22px" fontWeight={600} letterSpacing="-0.02em">
          Library
        </Text>
        <Flex gap="18px" align="center">
          <HugeiconsIcon icon={Search01Icon} size={20} color={ink.text} strokeWidth={1.7} />
          <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color={ink.text} strokeWidth={1.7} />
        </Flex>
      </Flex>

      <Flex
        position="absolute"
        bottom="14px"
        left={0}
        right={0}
        zIndex={3}
        justify="center"
        gap="clamp(20px, 7cqi, 44px)"
        pointerEvents="none"
      >
        {TABS.map((tab, index) => (
          <Flex key={tab.label} direction="column" align="center" gap="4px" color={index ? ink.muted : ink.text}>
            <HugeiconsIcon icon={tab.icon} size={21} color="currentColor" strokeWidth={1.7} />
            <Text fontSize="11px" fontWeight={500}>
              {tab.label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

const PhotoScene = ({ ink, blur }) => (
  <Flex position="absolute" inset={0} align="center" justify="center" px="24px">
    <Box
      position="relative"
      w="min(100%, 560px)"
      aspectRatio="3 / 2"
      borderRadius="22px"
      overflow="hidden"
      style={{ boxShadow: ink.rim }}
    >
      <Box
        as="img"
        src={ink.landscape}
        alt=""
        draggable={false}
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        objectFit="cover"
        style={{ objectPosition: '50% 60%' }}
      />
      <GradualBlur {...blur} position="bottom" target="parent" zIndex={2} />
      <Flex position="absolute" left="22px" right="22px" bottom="20px" zIndex={3} align="flex-end" gap="12px">
        <Box flex="1" minW={0} color="#ffffff">
          <Text fontSize="clamp(16px, 3.6cqi, 20px)" fontWeight={600} letterSpacing="-0.01em">
            Canola field
          </Text>
          <Text mt="2px" fontSize="13px" opacity={0.78}>
            Gippsland, 35mm
          </Text>
        </Box>
        <Flex gap="14px" color="#ffffff" pb="2px">
          <HugeiconsIcon icon={FavouriteIcon} size={20} color="currentColor" strokeWidth={1.7} />
          <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color="currentColor" strokeWidth={1.7} />
        </Flex>
      </Flex>
    </Box>
  </Flex>
);

const RoundButton = ({ ink, icon, label, onClick }) => (
  <Box
    as="button"
    type="button"
    aria-label={label}
    onClick={onClick}
    w="40px"
    h="40px"
    borderRadius="12px"
    display="grid"
    placeItems="center"
    cursor="pointer"
    style={{ background: ink.tile, boxShadow: ink.tileRim }}
  >
    <HugeiconsIcon icon={icon} size={18} color={ink.text} strokeWidth={1.8} />
  </Box>
);

const CarouselScene = ({ ink, blur }) => {
  const strip = useRef(null);
  const move = direction => strip.current?.scrollBy({ left: direction * 212, behavior: 'smooth' });

  useEffect(() => {
    const el = strip.current;
    if (!el) return undefined;
    const onWheel = event => {
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((event.deltaY < 0 && el.scrollLeft <= 1) || (event.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <Flex position="absolute" inset={0} direction="column" align="center" justify="center" gap="22px">
      <Box position="relative" w="100%">
        <Box ref={strip} overflowX="auto" css={{ scrollbarWidth: 'none' }}>
          <Flex gap="12px" w="max-content" px="24px" py="2px">
            {SHOTS.map((shot, i) => (
              <Box key={i} w="200px" flexShrink={0} style={{ boxShadow: ink.rim, borderRadius: '18px' }}>
                <Shot ink={ink} shot={shot} radius="18px" ratio="4 / 5" />
              </Box>
            ))}
          </Flex>
        </Box>
        <GradualBlur {...blur} position="left" target="parent" zIndex={2} />
        <GradualBlur {...blur} position="right" target="parent" zIndex={2} />
      </Box>
      <Flex gap="10px">
        <RoundButton ink={ink} icon={ArrowLeft01Icon} label="Previous" onClick={() => move(-1)} />
        <RoundButton ink={ink} icon={ArrowRight01Icon} label="Next" onClick={() => move(1)} />
      </Flex>
    </Flex>
  );
};

const BasicScene = ({ ink, blur, position, target }) => (
  <Flex position="absolute" inset={0} align="center" justify="center" px="24px">
    <Box
      position="relative"
      w="min(100%, 480px)"
      aspectRatio="3 / 2"
      borderRadius="20px"
      overflow="hidden"
      style={{ boxShadow: ink.rim }}
    >
      <Box
        as="img"
        src={ink.sky}
        alt=""
        draggable={false}
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        objectFit="cover"
      />
      <GradualBlur {...blur} position={position} target={target} zIndex={target === 'page' ? 1000 : 2} />
    </Box>
  </Flex>
);

const GradualBlurDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, preset, smoothScroll, tintColor, tintAmount, depth, position, target, ...look } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = INK[theme];
  const scrim = demo === 'photo' || (demo === 'basic' && target !== 'page');
  const tintHex = tintColor ?? (scrim ? '#000000' : ink.page);
  const tint = tintAmount > 0 ? toRgba(tintHex, tintAmount) : 'transparent';
  const height = `${depth}rem`;
  const blur = { ...look, height, tint };
  const basic = demo === 'basic';

  const computedProps = useMemo(() => ({ height, tint }), [height, tint]);

  const applyPreset = value => updateProps({ ...LOOK, ...PRESETS[value], preset: value });

  const Scene =
    demo === 'photo' ? PhotoScene : demo === 'carousel' ? CarouselScene : demo === 'basic' ? BasicScene : FeedScene;

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['demo', 'preset', 'smoothScroll', 'tintColor', 'tintAmount', 'depth']}
      computedProps={computedProps}
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
            <Scene key={demo} ink={ink} blur={blur} smooth={smoothScroll} position={position} target={target} />
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
              title="Position"
              options={POSITION_OPTIONS}
              value={position}
              isDisabled={!basic}
              onChange={value => updateProp('position', value)}
            />
            <PreviewSelect
              title="Target"
              options={TARGET_OPTIONS}
              value={target}
              isDisabled={!basic}
              onChange={value => updateProp('target', value)}
            />
            <PreviewSelect
              title="Curve"
              options={CURVE_OPTIONS}
              value={look.curve}
              onChange={value => updateProp('curve', value)}
            />
            <PreviewColorPickerCustom title="Tint" color={tintHex} onChange={value => updateProp('tintColor', value)} />
            <PreviewSlider
              title="Tint Amount"
              min={0}
              max={1}
              step={0.05}
              value={tintAmount}
              onChange={value => updateProp('tintAmount', value)}
            />
            <PreviewSlider
              title="Strength"
              min={0.5}
              max={6}
              step={0.25}
              value={look.strength}
              onChange={value => updateProp('strength', value)}
            />
            <PreviewSlider
              title="Height"
              min={2}
              max={14}
              step={0.5}
              value={depth}
              valueUnit="rem"
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Layers"
              min={1}
              max={16}
              step={1}
              value={look.layers}
              onChange={value => updateProp('layers', value)}
            />
            <PreviewSlider
              title="Saturation"
              min={0}
              max={2.5}
              step={0.05}
              value={look.saturation}
              onChange={value => updateProp('saturation', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0.1}
              max={1}
              step={0.05}
              value={look.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSlider
              title="Hover Intensity"
              min={0}
              max={3}
              step={0.1}
              value={look.hoverIntensity}
              onChange={value => updateProp('hoverIntensity', value)}
            />
            <PreviewSwitch
              title="Exponential"
              isChecked={look.exponential}
              onChange={value => updateProp('exponential', value)}
            />
            <PreviewSwitch
              title="Auto Hide"
              isChecked={look.autoHide}
              isDisabled={demo !== 'feed' && demo !== 'carousel'}
              onChange={value => updateProp('autoHide', value)}
            />
            <PreviewSwitch
              title="Smooth Scroll"
              isChecked={smoothScroll}
              isDisabled={demo !== 'feed'}
              onChange={value => updateProp('smoothScroll', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={gradualBlur} componentName="GradualBlur" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GradualBlurDemo;
