import { Box, Flex, Text } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CursorPointer01Icon, FlowConnectionIcon, Orbit01Icon, Route01Icon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import SwarmCursor from '../../content/Animations/SwarmCursor/SwarmCursor';
import { swarmCursor } from '../../constants/code/Animations/swarmCursorCode';

const WIDE = '@container swarm (min-width: 640px)';

const INK = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.62)',
    tile: 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    card: 'linear-gradient(180deg, rgba(42, 39, 50, 0.92) 0%, rgba(29, 27, 35, 0.92) 100%)',
    solid: '#f4f4f5',
    solidText: '#121016',
    hover: 'brightness(1.12)',
    halo: '0 1px 2px rgba(18, 15, 23, 0.9), 0 0 12px rgba(18, 15, 23, 0.85)'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.62)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    card: 'linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(246, 246, 248, 0.94) 100%)',
    solid: '#18181b',
    solidText: '#ffffff',
    hover: 'brightness(0.97)',
    halo: '0 0 2px rgba(255, 255, 255, 0.95), 0 0 12px rgba(255, 255, 255, 0.9)'
  }
};

const NAV = ['Product', 'Customers', 'Pricing', 'Docs'];

const FEATURES = [
  { icon: CursorPointer01Icon, title: 'Live presence', text: 'See who is working where, as it happens.' },
  { icon: Route01Icon, title: 'Shared roadmaps', text: 'Plans, releases and reviews on one line.' },
  { icon: FlowConnectionIcon, title: 'Quiet handoffs', text: 'Pass work along without losing context.' }
];

const LOOK = {
  shape: 'dot',
  color: '#ffffff',
  accentColor: '#ffffff',
  count: 800,
  size: 2.6,
  spread: 90,
  speed: 1,
  swirl: 0.6,
  tail: 0.5,
  trail: 0.6,
  wander: 0.5,
  depth: 0.7,
  clickEffect: 'burst'
};

const DEFAULT_PROPS = {
  demo: 'hero',
  preset: 'liquid',
  ...LOOK,
  idle: 'roam',
  hideCursor: false,
  intro: true,
  enabled: true
};

const PRESETS = {
  liquid: {},
  ink: { count: 1400, size: 1.8, swirl: 0.85, wander: 0.7, depth: 0.5 },
  vortex: { count: 1000, size: 2.2, speed: 1.6, swirl: 1, wander: 1.1, accentColor: '#7dd3fc' },
  comet: { shape: 'streak', accentColor: '#7dd3fc', count: 600, size: 2.2, tail: 0.9, trail: 1.4, swirl: 0.4 },
  fireflies: {
    color: '#fde68a',
    accentColor: '#fde68a',
    count: 160,
    size: 4,
    spread: 120,
    speed: 0.5,
    swirl: 0.3,
    wander: 1.2,
    depth: 0.5,
    clickEffect: 'pulse'
  },
  pixels: { shape: 'square', count: 500, size: 3.4, swirl: 0.5, depth: 0.3 }
};

const LIGHT_SWAP = {
  '#ffffff': '#18181b',
  '#fde68a': '#d97706',
  '#7dd3fc': '#0284c7'
};

const DARK_SWAP = Object.fromEntries(Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]));

const DEMO_OPTIONS = [
  { value: 'hero', label: 'Hero' },
  { value: 'features', label: 'Features' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'liquid', label: 'Liquid' },
  { value: 'ink', label: 'Ink' },
  { value: 'vortex', label: 'Vortex' },
  { value: 'comet', label: 'Comet' },
  { value: 'fireflies', label: 'Fireflies' },
  { value: 'pixels', label: 'Pixels' }
];

const SHAPE_OPTIONS = [
  { value: 'dot', label: 'Dot' },
  { value: 'streak', label: 'Streak' },
  { value: 'square', label: 'Square' }
];

const IDLE_OPTIONS = [
  { value: 'roam', label: 'Roam' },
  { value: 'gather', label: 'Gather' },
  { value: 'hide', label: 'Hide' }
];

const CLICK_OPTIONS = [
  { value: 'burst', label: 'Burst' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'none', label: 'None' }
];

const propData = [
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'Content the swarm flows behind, such as a hero with buttons.'
  },
  {
    name: 'count',
    type: 'number',
    default: '800',
    description: 'Number of particles in the swarm, up to 2000.'
  },
  { name: 'size', type: 'number', default: '2.6', description: 'Size of each particle, in px.' },
  {
    name: 'shape',
    type: "'dot' | 'streak' | 'square'",
    default: "'dot'",
    description: 'Shape of each particle.'
  },
  {
    name: 'color',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the particles. Defaults to near black in light mode.'
  },
  {
    name: 'accentColor',
    type: 'string',
    default: 'color',
    description: 'Color particles take on when they rush and when you click.'
  },
  {
    name: 'spread',
    type: 'number',
    default: '90',
    description: 'Radius of the swarm around the cursor, in px.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'How lively the swarm churns and turns while the cursor rests.'
  },
  {
    name: 'swirl',
    type: 'number',
    default: '0.6',
    description: 'How much the swarm curls into eddies and how long they keep turning, from 0 (calm) to 1 (stormy).'
  },
  {
    name: 'tail',
    type: 'number',
    default: '0.5',
    description: 'How far the swarm streams behind a fast cursor, from 0 (tight) to 1 (a long trailing tail).'
  },
  {
    name: 'trail',
    type: 'number',
    default: '0.6',
    description: 'Motion blur on fast particles.'
  },
  {
    name: 'wander',
    type: 'number',
    default: '0.5',
    description: 'How restlessly the swarm folds and drifts on its own.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '0.7',
    description: 'How much near particles grow and blur and far ones shrink and fade, from 0 (flat) to 1 (deep).'
  },
  {
    name: 'targets',
    type: 'string',
    default: "'a, button, [data-swarm-target]'",
    description: 'Elements inside the swarm that it pours around while hovered. Pass an empty string to turn this off.'
  },
  {
    name: 'idle',
    type: "'roam' | 'gather' | 'hide'",
    default: "'roam'",
    description: 'What the swarm does while the cursor is away: drift around the area, wait in the middle, or fade out.'
  },
  {
    name: 'clickEffect',
    type: "'burst' | 'pulse' | 'none'",
    default: "'burst'",
    description:
      'What a click does. Burst splashes the swarm outward in a curl, pulse sends a wave of light through it.'
  },
  {
    name: 'hideCursor',
    type: 'boolean',
    default: 'false',
    description:
      'Hides the system cursor over the component and marks the pointer with a dot, so the swarm becomes the cursor.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Swirls the swarm in from across the area on mount.'
  },
  { name: 'enabled', type: 'boolean', default: 'true', description: 'Shows and animates the swarm.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Uses near black particles by default and keeps them crisp, for light backgrounds.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const IconTile = ({ ink, icon, size = 32 }) => (
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

const SceneButton = ({ ink, solid, small, children }) => (
  <Box
    as="button"
    type="button"
    h={small ? '34px' : '44px'}
    px={small ? '14px' : '20px'}
    borderRadius={small ? '10px' : '12px'}
    fontSize={small ? '13px' : '15px'}
    fontWeight={500}
    cursor="pointer"
    whiteSpace="nowrap"
    transition="filter 200ms ease"
    _hover={{ filter: ink.hover }}
    style={
      solid
        ? { background: ink.solid, color: ink.solidText }
        : { background: ink.tile, color: ink.text, boxShadow: ink.rim }
    }
  >
    {children}
  </Box>
);

const HeroScene = ({ ink }) => (
  <Flex direction="column" w="100%" h="100%">
    <Flex align="center" gap="12px" pl="16px" pr="60px" pt="13px" css={{ [WIDE]: { paddingLeft: '22px' } }}>
      <Flex align="center" gap="10px">
        <IconTile ink={ink} icon={Orbit01Icon} size={30} />
        <Text fontSize="15px" fontWeight={600} color={ink.text}>
          Flock
        </Text>
      </Flex>
      <Flex ml="auto" align="center" gap="2px" display="none" css={{ [WIDE]: { display: 'flex' } }}>
        {NAV.map(item => (
          <Box
            key={item}
            as="button"
            type="button"
            h="32px"
            px="12px"
            borderRadius="8px"
            fontSize="13px"
            fontWeight={500}
            cursor="pointer"
            color={ink.muted}
            transition="color 200ms ease"
            _hover={{ color: ink.text }}
          >
            {item}
          </Box>
        ))}
      </Flex>
      <Box ml="auto" css={{ [WIDE]: { marginLeft: '8px' } }}>
        <SceneButton ink={ink} small>
          Sign in
        </SceneButton>
      </Box>
    </Flex>
    <Flex flex="1" direction="column" align="center" justify="center" textAlign="center" px="20px" pb="32px">
      <Text
        fontSize="30px"
        fontWeight={600}
        lineHeight={1.08}
        letterSpacing="-0.035em"
        color={ink.text}
        maxW="520px"
        css={{ [WIDE]: { fontSize: '44px' } }}
        style={{ textShadow: ink.halo, textWrap: 'balance' }}
      >
        Teams move faster in formation
      </Text>
      <Text
        mt="14px"
        fontSize="14px"
        lineHeight={1.6}
        color={ink.muted}
        maxW="400px"
        css={{ [WIDE]: { fontSize: '16px' } }}
        style={{ textShadow: ink.halo, textWrap: 'balance' }}
      >
        Plan, build and ship on one shared rhythm, with every update in plain sight.
      </Text>
      <Flex mt="28px" gap="10px" wrap="wrap" justify="center">
        <SceneButton ink={ink} solid>
          Start for free
        </SceneButton>
        <SceneButton ink={ink}>Book a demo</SceneButton>
      </Flex>
    </Flex>
  </Flex>
);

const FeaturesScene = ({ ink }) => (
  <Flex direction="column" align="center" justify="center" w="100%" h="100%" px="16px" gap="20px">
    <Box textAlign="center" style={{ textShadow: ink.halo }}>
      <Text
        fontSize="22px"
        fontWeight={600}
        letterSpacing="-0.03em"
        color={ink.text}
        css={{ [WIDE]: { fontSize: '28px' } }}
      >
        Everything moves together
      </Text>
      <Text mt="8px" fontSize="14px" color={ink.muted}>
        One workspace for the whole flight path.
      </Text>
    </Box>
    <Box
      display="grid"
      gridTemplateColumns="minmax(0, 1fr)"
      gap="10px"
      w="100%"
      maxW="720px"
      css={{ [WIDE]: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' } }}
    >
      {FEATURES.map(item => (
        <Flex
          key={item.title}
          data-swarm-target=""
          tabIndex={0}
          direction="row"
          align="center"
          gap="14px"
          p="14px"
          borderRadius="16px"
          textAlign="left"
          cursor="default"
          transition="filter 200ms ease"
          _hover={{ filter: ink.hover }}
          css={{ [WIDE]: { flexDirection: 'column', alignItems: 'flex-start', gap: '16px', padding: '18px' } }}
          style={{ background: ink.card, boxShadow: ink.rim }}
        >
          <IconTile ink={ink} icon={item.icon} />
          <Box>
            <Text fontSize="15px" fontWeight={600} color={ink.text}>
              {item.title}
            </Text>
            <Text mt="4px" fontSize="13px" lineHeight={1.5} color={ink.muted}>
              {item.text}
            </Text>
          </Box>
        </Flex>
      ))}
    </Box>
  </Flex>
);

const SwarmCursorDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, preset, color, accentColor, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = INK[theme];
  const swap = theme === 'light' ? LIGHT_SWAP : DARK_SWAP;
  const tone = swap[color.toLowerCase()] ?? color;
  const accent = swap[accentColor.toLowerCase()] ?? accentColor;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['demo', 'preset']}
      computedProps={{ color: tone, accentColor: accent, ...(theme === 'light' ? { lightMode: true } : {}) }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={{ base: 520, md: 560 }}
            p={0}
            overflow="hidden"
            style={{ containerType: 'inline-size', containerName: 'swarm' }}
          >
            <SwarmCursor key={key} {...settings} color={tone} accentColor={accent} lightMode={theme === 'light'}>
              {demo === 'hero' && <HeroScene ink={ink} />}
              {demo === 'features' && <FeaturesScene ink={ink} />}
            </SwarmCursor>
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
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewColorPickerCustom title="Color" color={tone} onChange={value => updateProp('color', value)} />
            <PreviewColorPickerCustom
              title="Accent Color"
              color={accent}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSelect
              title="Click Effect"
              options={CLICK_OPTIONS}
              value={settings.clickEffect}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewSlider
              title="Count"
              min={40}
              max={2000}
              step={10}
              value={settings.count}
              onChange={value => updateProp('count', value)}
            />
            <PreviewSlider
              title="Size"
              min={1}
              max={8}
              step={0.1}
              value={settings.size}
              valueUnit="px"
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Spread"
              min={40}
              max={200}
              step={5}
              value={settings.spread}
              valueUnit="px"
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Swirl"
              min={0}
              max={1}
              step={0.01}
              value={settings.swirl}
              onChange={value => updateProp('swirl', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Tail"
              min={0}
              max={1}
              step={0.01}
              value={settings.tail}
              onChange={value => updateProp('tail', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0}
              max={3}
              step={0.05}
              value={settings.trail}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Wander"
              min={0}
              max={2}
              step={0.01}
              value={settings.wander}
              onChange={value => updateProp('wander', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={1}
              step={0.01}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSelect
              title="Idle"
              options={IDLE_OPTIONS}
              value={settings.idle}
              onChange={value => updateProp('idle', value)}
            />
            <PreviewSwitch
              title="Hide Cursor"
              isChecked={settings.hideCursor}
              onChange={value => updateProp('hideCursor', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Enabled"
              isChecked={settings.enabled}
              onChange={value => updateProp('enabled', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={swarmCursor} componentName="SwarmCursor" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SwarmCursorDemo;
