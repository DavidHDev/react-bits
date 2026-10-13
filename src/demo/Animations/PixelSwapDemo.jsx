import { Box, Flex, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import PixelSwap from '../../content/Animations/PixelSwap/PixelSwap';
import { pixelSwap } from '../../constants/code/Animations/pixelSwapCode';

const INK = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.6)',
    card: 'linear-gradient(180deg, #2c2935 0%, #1f1c26 100%)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    well: 'rgba(255, 255, 255, 0.05)',
    solid: '#f4f4f5',
    solidText: '#121016',
    plainA: '#26232e',
    plainB: '#f4f4f5'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.6)',
    card: 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)',
    well: 'rgba(24, 24, 27, 0.04)',
    solid: '#18181b',
    solidText: '#ffffff',
    plainA: '#f0f0f3',
    plainB: '#18181b'
  }
};

const LOOK = {
  effect: 'flip',
  pixelSize: 72,
  gap: 0,
  pixelRadius: 0,
  origin: 'pointer',
  axis: 'auto',
  duration: 1100,
  pixelDuration: 700,
  depth: 0.5,
  shading: 0.5,
  bounce: 0.3,
  randomness: 0.15
};

const DEFAULT_PROPS = {
  demo: 'photo',
  preset: 'flip',
  ...LOOK,
  trigger: 'hover'
};

const PRESETS = {
  flip: {},
  cascade: { origin: 'diagonal', pixelSize: 96, duration: 1800, pixelDuration: 900, depth: 0.7, randomness: 0.05 },
  assemble: { effect: 'assemble', pixelSize: 64, duration: 1300, depth: 0.6 },
  tiles: { pixelSize: 110, gap: 6, pixelRadius: 18, depth: 0.6, bounce: 0.5 },
  pixel: { pixelSize: 28, duration: 900, pixelDuration: 380, depth: 0.25, shading: 0.3, randomness: 0.5 }
};

const DEMO_OPTIONS = [
  { value: 'photo', label: 'Photo' },
  { value: 'card', label: 'Card' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'flip', label: 'Flip' },
  { value: 'cascade', label: 'Cascade' },
  { value: 'assemble', label: 'Assemble' },
  { value: 'tiles', label: 'Tiles' },
  { value: 'pixel', label: 'Pixel' }
];

const EFFECT_OPTIONS = [
  { value: 'flip', label: 'Flip' },
  { value: 'assemble', label: 'Assemble' },
  { value: 'grow', label: 'Grow' }
];

const ORIGIN_OPTIONS = [
  { value: 'pointer', label: 'Pointer' },
  { value: 'center', label: 'Center' },
  { value: 'edges', label: 'Edges' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'random', label: 'Random' }
];

const AXIS_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'x', label: 'Horizontal' },
  { value: 'y', label: 'Vertical' }
];

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const STATS = [
  { value: '36', label: 'Projects' },
  { value: '48k', label: 'Followers' },
  { value: '1.2k', label: 'Stars' }
];

const propData = [
  { name: 'firstContent', type: 'ReactNode', default: '-', description: 'Content shown at rest.' },
  { name: 'secondContent', type: 'ReactNode', default: '-', description: 'Content the tiles turn over to.' },
  {
    name: 'effect',
    type: "'flip' | 'assemble' | 'grow'",
    default: "'flip'",
    description:
      'Flip turns every tile over in 3D, assemble drops the old tiles away as the new ones fly in, grow opens the new tiles over the old.'
  },
  {
    name: 'pixelSize',
    type: 'number',
    default: '72',
    description: 'Edge length of each tile in px. Grows automatically when the grid would pass 196 tiles.'
  },
  { name: 'gap', type: 'number', default: '0', description: 'Space between tiles in px while they move.' },
  {
    name: 'pixelRadius',
    type: 'number',
    default: '0',
    description: 'Corner rounding of the tiles while they move, as a percentage. 50 makes circles.'
  },
  {
    name: 'origin',
    type: "'pointer' | 'center' | 'edges' | 'left' | 'right' | 'top' | 'bottom' | 'diagonal' | 'random'",
    default: "'pointer'",
    description: 'Where the wave starts. Pointer starts it where the cursor entered, left or clicked.'
  },
  {
    name: 'axis',
    type: "'auto' | 'x' | 'y'",
    default: "'auto'",
    description: 'Axis the tiles flip around. Auto tips each tile away from the origin.'
  },
  { name: 'duration', type: 'number', default: '1100', description: 'Total length of the swap in ms.' },
  { name: 'pixelDuration', type: 'number', default: '700', description: 'Time a single tile takes in ms.' },
  {
    name: 'depth',
    type: 'number',
    default: '0.5',
    description: 'How far the tiles lift and how strong the perspective is, from 0 to 1.'
  },
  {
    name: 'shading',
    type: 'number',
    default: '0.5',
    description: 'How much the tiles darken as they turn, from 0 to 1.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.3',
    description: 'How much each tile overshoots before it settles, from 0 to 1.'
  },
  {
    name: 'randomness',
    type: 'number',
    default: '0.15',
    description: 'Noise mixed into the wave order, from 0 for a clean wave to 1 for a scatter.'
  },
  {
    name: 'backdropColor',
    type: 'string',
    default: "'transparent'",
    description: 'Color seen behind the tiles while they move.'
  },
  {
    name: 'trigger',
    type: "'hover' | 'click' | 'none'",
    default: "'hover'",
    description: 'What starts the swap. With none, drive it with active.'
  },
  { name: 'initialActive', type: 'boolean', default: 'false', description: 'Starts on the second content.' },
  {
    name: 'active',
    type: 'boolean',
    default: '-',
    description: 'Controls which content shows. Pair it with onActiveChange.'
  },
  {
    name: 'onActiveChange',
    type: '(active: boolean) => void',
    default: '-',
    description: 'Called when the trigger asks to swap.'
  },
  {
    name: 'onComplete',
    type: '(active: boolean) => void',
    default: '-',
    description: 'Called when a swap finishes.'
  },
  { name: 'aspectRatio', type: 'string', default: "'16 / 10'", description: 'Aspect ratio of the root.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root.' }
];

const Photo = ({ src }) => (
  <img
    src={src}
    alt=""
    draggable={false}
    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
  />
);

const ProfileFront = () => (
  <Box position="relative" w="100%" h="100%">
    <Photo src="/assets/demo/person.webp" />
    <Box
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      px="20px"
      pb="18px"
      pt="56px"
      color="#ffffff"
      style={{ background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.55) 100%)' }}
    >
      <Text fontSize="19px" fontWeight={600} letterSpacing="-0.02em">
        Javi A. Torres
      </Text>
      <Text mt="2px" fontSize="13px" opacity={0.8}>
        Software Engineer
      </Text>
    </Box>
  </Box>
);

const ProfileBack = ({ ink }) => (
  <Flex direction="column" w="100%" h="100%" p="20px" gap="16px" style={{ background: ink.card }} color={ink.text}>
    <Flex align="center" gap="12px">
      <Box
        w="48px"
        h="48px"
        borderRadius="999px"
        flexShrink={0}
        style={{ background: 'center / cover no-repeat url(/assets/demo/person.webp)', boxShadow: ink.rim }}
      />
      <Box>
        <Text fontSize="16px" fontWeight={600} letterSpacing="-0.015em">
          Javi A. Torres
        </Text>
        <Text fontSize="13px" color={ink.muted}>
          @javicodes
        </Text>
      </Box>
    </Flex>
    <Text fontSize="14px" lineHeight={1.5} color={ink.muted}>
      Builds interfaces that move. Open source, design systems and small motion experiments.
    </Text>
    <Flex gap="8px" mt="auto">
      {STATS.map(stat => (
        <Box key={stat.label} flex="1" p="10px" borderRadius="12px" style={{ background: ink.well }}>
          <Text fontSize="17px" fontWeight={600} letterSpacing="-0.02em">
            {stat.value}
          </Text>
          <Text fontSize="12px" color={ink.muted}>
            {stat.label}
          </Text>
        </Box>
      ))}
    </Flex>
    <Box
      h="42px"
      borderRadius="12px"
      display="grid"
      placeItems="center"
      fontSize="14px"
      fontWeight={600}
      style={{ background: ink.solid, color: ink.solidText }}
    >
      Follow
    </Box>
  </Flex>
);

const PixelSwapDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = INK[theme];

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const scenes = {
    photo: {
      width: '560px',
      aspectRatio: '16 / 10',
      first: <Photo src="/assets/demo/day-landscape.webp" />,
      second: <Photo src="/assets/demo/night-landscape.webp" />
    },
    card: {
      width: '300px',
      aspectRatio: '4 / 5',
      first: <ProfileFront />,
      second: <ProfileBack ink={ink} />
    },
    basic: {
      width: '480px',
      aspectRatio: '16 / 10',
      first: <Box w="100%" h="100%" style={{ background: ink.plainA }} />,
      second: <Box w="100%" h="100%" style={{ background: ink.plainB }} />
    }
  };
  const scene = scenes[demo] ?? scenes.photo;

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['demo', 'preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <Flex position="relative" className="demo-container" h={460} p="24px" align="center" justify="center">
            <Box w="100%" maxW={scene.width}>
              <PixelSwap
                key={demo}
                firstContent={scene.first}
                secondContent={scene.second}
                aspectRatio={scene.aspectRatio}
                style={{ borderRadius: 18, cursor: settings.trigger === 'click' ? 'pointer' : 'default' }}
                {...settings}
              />
            </Box>
          </Flex>

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
              title="Origin"
              options={ORIGIN_OPTIONS}
              value={settings.origin}
              onChange={value => updateProp('origin', value)}
            />
            <PreviewSelect
              title="Axis"
              options={AXIS_OPTIONS}
              value={settings.axis}
              isDisabled={settings.effect !== 'flip'}
              onChange={value => updateProp('axis', value)}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings.trigger}
              onChange={value => updateProp('trigger', value)}
            />
            <PreviewSlider
              title="Pixel Size"
              min={24}
              max={160}
              step={2}
              value={settings.pixelSize}
              valueUnit="px"
              onChange={value => updateProp('pixelSize', value)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={12}
              step={1}
              value={settings.gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Pixel Radius"
              min={0}
              max={50}
              step={1}
              value={settings.pixelRadius}
              valueUnit="%"
              onChange={value => updateProp('pixelRadius', value)}
            />
            <PreviewSlider
              title="Duration"
              min={400}
              max={3000}
              step={50}
              value={settings.duration}
              valueUnit="ms"
              onChange={value => updateProp('duration', value)}
            />
            <PreviewSlider
              title="Pixel Duration"
              min={150}
              max={1500}
              step={10}
              value={settings.pixelDuration}
              valueUnit="ms"
              onChange={value => updateProp('pixelDuration', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={1}
              step={0.01}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Shading"
              min={0}
              max={1}
              step={0.01}
              value={settings.shading}
              onChange={value => updateProp('shading', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.01}
              value={settings.bounce}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSlider
              title="Randomness"
              min={0}
              max={1}
              step={0.01}
              value={settings.randomness}
              onChange={value => updateProp('randomness', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={pixelSwap} componentName="PixelSwap" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PixelSwapDemo;
