import { useMemo } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  GithubIcon,
  Home01Icon,
  Message01Icon,
  Notification03Icon,
  PlayIcon,
  Search01Icon,
  Settings02Icon
} from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import Magnet from '../../content/Animations/Magnet/Magnet';
import { magnet } from '../../constants/code/Animations/magnetCode';

const INK = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.56)',
    hover: 'brightness(1.12)',
    primary: 'linear-gradient(to bottom, #ffffff, #ecebf0)',
    primaryInk: '#120f17',
    primaryShadow:
      'inset 0 1px 0 #ffffff, inset 0 -1px 0 rgba(18, 15, 23, 0.1), 0 1px 2px rgba(0, 0, 0, 0.3), 0 10px 24px -10px rgba(0, 0, 0, 0.6)',
    ghost: 'rgba(255, 255, 255, 0.08)',
    ghostShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
    panel: 'rgba(38, 35, 46, 0.66)',
    panelShadow: '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    panelRim: 'inset 0 1px 0 rgba(255, 255, 255, 0.07), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
    tile: 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    tileShadow:
      'inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.07), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    cardShadow:
      'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 30px 60px -30px rgba(0, 0, 0, 0.85), 0 10px 24px -14px rgba(0, 0, 0, 0.55)',
    track: 'rgba(255, 255, 255, 0.12)',
    cover: '/assets/demo/night-sky.webp'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.56)',
    hover: 'brightness(0.97)',
    primary: 'linear-gradient(to bottom, #2a2730, #17151c)',
    primaryInk: '#ffffff',
    primaryShadow:
      'inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 2px rgba(24, 24, 27, 0.25), 0 10px 24px -12px rgba(24, 24, 27, 0.5)',
    ghost: 'rgba(255, 255, 255, 0.72)',
    ghostShadow: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), 0 1px 2px rgba(24, 24, 27, 0.05)',
    panel: 'rgba(240, 240, 243, 0.8)',
    panelShadow: '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    panelRim: 'inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(24, 24, 27, 0.07)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    tileShadow: 'inset 0 1px 0 #ffffff, inset 0 0 0 1px rgba(24, 24, 27, 0.08), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    cardShadow:
      'inset 0 1px 0 #ffffff, inset 0 0 0 1px rgba(24, 24, 27, 0.07), 0 30px 60px -32px rgba(24, 24, 27, 0.35), 0 10px 24px -16px rgba(24, 24, 27, 0.2)',
    track: 'rgba(24, 24, 27, 0.1)',
    cover: '/assets/demo/day-sky.webp'
  }
};

const DOCK_ICONS = [Home01Icon, Search01Icon, Notification03Icon, Message01Icon, Settings02Icon];

const FEEL = {
  padding: 100,
  magnetStrength: 2,
  stiffness: 170,
  damping: 16,
  tilt: 6,
  scale: 1,
  axis: 'both'
};

const DEFAULT_PROPS = {
  demo: 'buttons',
  preset: 'default',
  ...FEEL,
  disabled: false
};

const PRESETS = {
  default: { ...FEEL },
  subtle: { ...FEEL, padding: 60, magnetStrength: 5, stiffness: 150, damping: 20, tilt: 3 },
  snappy: { ...FEEL, padding: 90, stiffness: 420, damping: 28 },
  elastic: { ...FEEL, padding: 110, magnetStrength: 1.6, stiffness: 240, damping: 8 },
  floaty: { ...FEEL, padding: 140, magnetStrength: 2.4, stiffness: 50, damping: 9 },
  sticky: { ...FEEL, padding: 180, magnetStrength: 1.2, stiffness: 200, damping: 18 },
  lift: { ...FEEL, magnetStrength: 3, tilt: 14, scale: 1.06 }
};

const PRESET_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'snappy', label: 'Snappy' },
  { value: 'elastic', label: 'Elastic' },
  { value: 'floaty', label: 'Floaty' },
  { value: 'sticky', label: 'Sticky' },
  { value: 'lift', label: 'Lift' }
];

const DEMO_OPTIONS = [
  { value: 'buttons', label: 'Buttons' },
  { value: 'dock', label: 'Dock' },
  { value: 'card', label: 'Card' },
  { value: 'basic', label: 'Basic' }
];

const AXIS_OPTIONS = [
  { value: 'both', label: 'Both' },
  { value: 'x', label: 'Horizontal' },
  { value: 'y', label: 'Vertical' }
];

const propData = [
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'The content that moves toward the cursor.'
  },
  {
    name: 'padding',
    type: 'number',
    default: '100',
    description: 'Distance in pixels around the element where the cursor starts to pull it.'
  },
  {
    name: 'magnetStrength',
    type: 'number',
    default: '2',
    description:
      'How far the element follows the cursor. The offset is divided by this value, so 1 follows the cursor and higher values move less.'
  },
  {
    name: 'exclusive',
    type: 'boolean',
    default: 'true',
    description:
      'When several magnets are in range, only the nearest exclusive one is pulled. Turn it off to let a group, like dock icons, lean toward the cursor together.'
  },
  {
    name: 'axis',
    type: "'both' | 'x' | 'y'",
    default: "'both'",
    description: 'Limits the movement to one axis.'
  },
  {
    name: 'maxOffset',
    type: 'number',
    default: '-',
    description: 'Caps how far the element can move from its resting place, in pixels.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '0',
    description: 'Maximum 3D tilt toward the cursor, in degrees.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Scale of the element while the cursor pulls it.'
  },
  {
    name: 'spring',
    type: '{ stiffness?: number; damping?: number; mass?: number }',
    default: '{ stiffness: 170, damping: 16, mass: 1 }',
    description:
      'Spring that drives the movement. Higher stiffness reacts faster, lower damping lets it overshoot and wobble back.'
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Turns the effect off and lets the element spring back to rest.'
  },
  {
    name: 'onActiveChange',
    type: '(active: boolean) => void',
    default: '-',
    description:
      'Called when the cursor enters or leaves the magnetic area. The wrapper also gets a data-magnet-active attribute.'
  },
  {
    name: 'wrapperClassName',
    type: 'string',
    default: "''",
    description: 'Class name for the outer wrapper, which stays in place.'
  },
  {
    name: 'innerClassName',
    type: 'string',
    default: "''",
    description: 'Class name for the inner element that moves.'
  },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the outer wrapper.' }
];

const ButtonBase = ({ children, style, ink }) => (
  <Box
    as="button"
    type="button"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    gap="8px"
    h="44px"
    px="20px"
    borderRadius="12px"
    fontSize="14px"
    fontWeight={500}
    letterSpacing="-0.01em"
    whiteSpace="nowrap"
    cursor="pointer"
    transition="filter 200ms ease"
    _hover={{ filter: ink.hover }}
    style={style}
  >
    {children}
  </Box>
);

const ButtonsScene = ({ magnet: settings, ink }) => (
  <Flex gap="14px" wrap="wrap" justify="center">
    <Magnet {...settings} maxOffset={10}>
      <ButtonBase ink={ink} style={{ background: ink.primary, color: ink.primaryInk, boxShadow: ink.primaryShadow }}>
        Get started
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} style={{ marginRight: -4 }} />
      </ButtonBase>
    </Magnet>
    <Magnet {...settings} maxOffset={10}>
      <ButtonBase ink={ink} style={{ background: ink.ghost, color: ink.text, boxShadow: ink.ghostShadow }}>
        <HugeiconsIcon icon={GithubIcon} size={16} strokeWidth={1.8} />
        Star on GitHub
      </ButtonBase>
    </Magnet>
  </Flex>
);

const DockScene = ({ magnet: settings, ink }) => (
  <Box
    position="relative"
    display="flex"
    gap="10px"
    p="10px"
    borderRadius="22px"
    style={{ background: ink.panel, boxShadow: ink.panelShadow, backdropFilter: 'blur(20px) saturate(1.6)' }}
  >
    {DOCK_ICONS.map((icon, index) => (
      <Magnet key={index} {...settings} exclusive={false} maxOffset={14}>
        <Box
          as="button"
          type="button"
          aria-label="Dock item"
          w="48px"
          h="48px"
          borderRadius="14px"
          display="grid"
          placeItems="center"
          cursor="pointer"
          transition="filter 200ms ease"
          _hover={{ filter: ink.hover }}
          style={{ background: ink.tile, boxShadow: ink.tileShadow, color: ink.text }}
        >
          <HugeiconsIcon icon={icon} size={21} strokeWidth={1.6} />
        </Box>
      </Magnet>
    ))}
    <Box
      position="absolute"
      inset={0}
      borderRadius="inherit"
      pointerEvents="none"
      style={{ boxShadow: ink.panelRim }}
    />
  </Box>
);

const CardScene = ({ magnet: settings, ink }) => (
  <Magnet {...settings} maxOffset={36}>
    <Box w="288px" p="14px" borderRadius="22px" style={{ background: ink.tile, boxShadow: ink.cardShadow }}>
      <Box
        h="168px"
        borderRadius="12px"
        backgroundSize="cover"
        backgroundPosition="center"
        style={{ backgroundImage: `url(${ink.cover})` }}
      />
      <Flex align="center" justify="space-between" mt="14px" px="4px">
        <Box>
          <Text fontSize="15px" fontWeight={600} letterSpacing="-0.01em" color={ink.text}>
            Afterglow
          </Text>
          <Text fontSize="13px" color={ink.muted}>
            Golden hour sessions
          </Text>
        </Box>
        <Box
          as="button"
          type="button"
          aria-label="Play"
          w="40px"
          h="40px"
          borderRadius="12px"
          display="grid"
          placeItems="center"
          cursor="pointer"
          style={{ background: ink.primary, color: ink.primaryInk, boxShadow: ink.primaryShadow }}
        >
          <HugeiconsIcon icon={PlayIcon} size={17} strokeWidth={2} />
        </Box>
      </Flex>
      <Box mt="14px" mx="4px" mb="4px" h="4px" borderRadius="2px" overflow="hidden" style={{ background: ink.track }}>
        <Box h="100%" w="38%" borderRadius="2px" style={{ background: ink.text }} />
      </Box>
    </Box>
  </Magnet>
);

const BasicScene = ({ magnet: settings, ink }) => (
  <Magnet {...settings}>
    <ButtonBase ink={ink} style={{ background: ink.ghost, color: ink.text, boxShadow: ink.ghostShadow }}>
      Hover me
    </ButtonBase>
  </Magnet>
);

const SCENES = { buttons: ButtonsScene, dock: DockScene, card: CardScene, basic: BasicScene };

const MagnetDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, preset, stiffness, damping, ...settings } = props;
  const ink = useColorModeValue(INK.light, INK.dark);
  const spring = useMemo(() => ({ stiffness, damping }), [stiffness, damping]);
  const computedProps = useMemo(() => ({ spring }), [spring]);
  const Scene = SCENES[demo] || ButtonsScene;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(FEEL).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['demo', 'preset', 'stiffness', 'damping']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Flex
            position="relative"
            className="demo-container"
            h={460}
            p={0}
            overflow="hidden"
            align="center"
            justify="center"
          >
            <Scene magnet={{ ...settings, spring }} ink={ink} />
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
              title="Axis"
              options={AXIS_OPTIONS}
              value={settings.axis}
              onChange={value => updateProp('axis', value)}
            />
            <PreviewSlider
              title="Padding"
              min={0}
              max={300}
              step={10}
              value={settings.padding}
              valueUnit="px"
              onChange={value => updateProp('padding', value)}
            />
            <PreviewSlider
              title="Strength"
              min={1}
              max={10}
              step={0.1}
              value={settings.magnetStrength}
              onChange={value => updateProp('magnetStrength', value)}
            />
            <PreviewSlider
              title="Stiffness"
              min={20}
              max={600}
              step={10}
              value={stiffness}
              onChange={value => updateProp('stiffness', value)}
            />
            <PreviewSlider
              title="Damping"
              min={2}
              max={40}
              step={1}
              value={damping}
              onChange={value => updateProp('damping', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={30}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Scale"
              min={1}
              max={1.2}
              step={0.01}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSwitch
              title="Disabled"
              isChecked={settings.disabled}
              onChange={value => updateProp('disabled', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={magnet} componentName="Magnet" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default MagnetDemo;
