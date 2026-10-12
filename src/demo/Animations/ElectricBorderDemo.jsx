import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp02Icon,
  Attachment02Icon,
  CloudUploadIcon,
  FlashIcon,
  Image01Icon,
  Mic02Icon,
  Pdf01Icon,
  Rocket01Icon,
  SparklesIcon,
  StopIcon,
  Tick02Icon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';

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

import ElectricBorder from '../../content/Animations/ElectricBorder/ElectricBorder';
import { electricBorder } from '../../constants/code/Animations/electricBorderCode';

const INK = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.6)',
    faint: 'rgba(244, 244, 245, 0.34)',
    panel: 'linear-gradient(180deg, #1d1a24 0%, #16141b 100%)',
    panelRim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    tile: 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    well: 'rgba(255, 255, 255, 0.025)',
    wellRim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
    track: 'rgba(255, 255, 255, 0.08)',
    solid: '#f4f4f5',
    solidText: '#121016'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.6)',
    faint: 'rgba(24, 24, 27, 0.36)',
    panel: 'linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%)',
    panelRim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), 0 8px 24px -12px rgba(24, 24, 27, 0.18)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f4f4f6 100%)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    well: 'rgba(24, 24, 27, 0.025)',
    wellRim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.06)',
    track: 'rgba(24, 24, 27, 0.08)',
    solid: '#18181b',
    solidText: '#ffffff'
  }
};

const LOOK = {
  color: '#7df9ff',
  speed: 1,
  chaos: 0.5,
  spread: 0.6,
  thickness: 1.5,
  strands: 3,
  glow: 0.6,
  intensity: 0.8,
  arcs: 1,
  flicker: 0.5
};

const DEFAULT_PROPS = {
  demo: 'composer',
  preset: 'voltage',
  ...LOOK,
  borderRadius: 24,
  offset: 0,
  cursorRadius: 90,
  active: true,
  interactive: true,
  intro: true
};

const PRESETS = {
  voltage: {},
  plasma: { color: '#c084fc' },
  ember: { color: '#fb923c', chaos: 0.7, flicker: 0.7 },
  emerald: { color: '#34d399', strands: 4, spread: 0.8 },
  storm: { color: '#93c5fd', strands: 5, chaos: 0.9, spread: 1.1, arcs: 2.5, flicker: 0.8, glow: 0.8 },
  silver: { color: '#e4e4e7', strands: 2, chaos: 0.25, spread: 0.3, arcs: 0, flicker: 0.15, glow: 0.4 }
};

const LIGHT_SWAP = {
  '#7df9ff': '#0891b2',
  '#c084fc': '#7c3aed',
  '#fb923c': '#ea580c',
  '#34d399': '#059669',
  '#93c5fd': '#2563eb',
  '#e4e4e7': '#52525b'
};

const DARK_SWAP = Object.fromEntries(Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]));

const WIDE = '@container electric (min-width: 660px)';

const DEMO_OPTIONS = [
  { value: 'composer', label: 'Composer' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'upload', label: 'Upload' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'voltage', label: 'Voltage' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'ember', label: 'Ember' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'storm', label: 'Storm' },
  { value: 'silver', label: 'Silver' }
];

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    note: 'For side projects',
    features: ['3 projects', 'Community support', 'Basic analytics'],
    cta: 'Get started',
    icon: SparklesIcon
  },
  {
    name: 'Pro',
    price: '$24',
    note: 'For growing teams',
    features: ['Unlimited projects', 'Priority support', 'Advanced analytics'],
    cta: 'Upgrade to Pro',
    icon: Rocket01Icon,
    featured: true
  },
  {
    name: 'Team',
    price: '$59',
    note: 'For organizations',
    features: ['Shared workspaces', 'SSO and audit logs', 'Dedicated manager'],
    cta: 'Contact sales',
    icon: UserGroupIcon
  }
];

const propData = [
  { name: 'children', type: 'ReactNode', default: '-', description: 'Content wrapped by the electric border.' },
  {
    name: 'color',
    type: 'string',
    default: "'#7df9ff'",
    description: 'Color of the current. The strands burn whiter at their core.'
  },
  {
    name: 'glowColor',
    type: 'string',
    default: '-',
    description: 'Color of the glow around the strands. Defaults to color.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'How fast the current crackles and moves.' },
  { name: 'chaos', type: 'number', default: '0.5', description: 'How jagged the strands are, from 0 to 2.' },
  {
    name: 'spread',
    type: 'number',
    default: '0.6',
    description: 'How far the strands wander from the edge, from 0 to 2.'
  },
  { name: 'thickness', type: 'number', default: '1.5', description: 'Thickness of the strands, in px.' },
  {
    name: 'strands',
    type: 'number',
    default: '3',
    description: 'Number of strands running along the edge, from 1 to 6.'
  },
  { name: 'glow', type: 'number', default: '0.6', description: 'Strength of the glow around the border.' },
  { name: 'intensity', type: 'number', default: '0.8', description: 'Overall brightness of the current.' },
  {
    name: 'arcs',
    type: 'number',
    default: '1',
    description: 'How often sparks leap off the border. 0 turns them off.'
  },
  { name: 'flicker', type: 'number', default: '0.5', description: 'How much the current flickers, from 0 to 1.' },
  {
    name: 'borderRadius',
    type: 'number',
    default: '24',
    description: 'Corner radius of the border, in px. Match it to your content.'
  },
  {
    name: 'offset',
    type: 'number',
    default: '0',
    description: 'Moves the border outward from the edge of the content, in px. Negative values move it inward.'
  },
  {
    name: 'active',
    type: 'boolean',
    default: 'true',
    description: 'Powers the border on or off. Turning it on sends the current racing around the edge again.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The current races around the edge from the top when the border mounts.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'The current surges near the cursor and clicks send a jolt around the edge.'
  },
  {
    name: 'cursorRadius',
    type: 'number',
    default: '90',
    description: 'Size of the area around the cursor where the current surges, in px.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Glowing light for dark pages, or crisp ink with a white core for light ones.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the wrapper.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the wrapper.' }
];

const swapColor = (value, swap) => {
  const key = `#${String(value).replace(/^#/, '').toLowerCase()}`;
  return swap[key] ?? key;
};

const IconTile = ({ ink, icon, size = 34 }) => (
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

const ToolButton = ({ ink, icon, label, onClick, solid }) => (
  <Box
    as="button"
    type="button"
    aria-label={label}
    onClick={onClick}
    w="34px"
    h="34px"
    borderRadius="999px"
    display="grid"
    placeItems="center"
    flexShrink={0}
    cursor="pointer"
    transition="transform 160ms ease, filter 160ms ease"
    _hover={{ filter: 'brightness(1.08)' }}
    _active={{ transform: 'scale(0.94)' }}
    style={solid ? { background: ink.solid, color: ink.solidText } : { background: ink.tile, boxShadow: ink.rim }}
  >
    <HugeiconsIcon icon={icon} size={16} color={solid ? ink.solidText : ink.text} strokeWidth={1.8} />
  </Box>
);

const ComposerScene = ({ border, ink, radius }) => {
  const [generating, setGenerating] = useState(true);

  return (
    <ElectricBorder
      {...border}
      active={border.active && generating}
      borderRadius={radius}
      style={{ width: '100%', maxWidth: 520 }}
    >
      <Box w="100%" p="14px" borderRadius={`${radius}px`} style={{ background: ink.panel, boxShadow: ink.panelRim }}>
        <Text px="6px" pt="4px" minH="80px" fontSize="15px" lineHeight="1.6" color={ink.text}>
          Write a launch post for our new electric borders. Keep it short and upbeat.
        </Text>
        <Flex mt="10px" align="center" gap="8px">
          <ToolButton ink={ink} icon={Attachment02Icon} label="Attach a file" />
          <Flex
            align="center"
            gap="4px"
            h="34px"
            px="12px"
            borderRadius="999px"
            fontSize="13px"
            fontWeight={500}
            color={ink.text}
            style={{ background: ink.tile, boxShadow: ink.rim }}
          >
            Fast
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} color={ink.muted} strokeWidth={1.8} />
          </Flex>
          <Box flex="1" />
          <ToolButton ink={ink} icon={Mic02Icon} label="Dictate" />
          <ToolButton
            ink={ink}
            solid
            icon={generating ? StopIcon : ArrowUp02Icon}
            label={generating ? 'Stop generating' : 'Send'}
            onClick={() => setGenerating(value => !value)}
          />
        </Flex>
      </Box>
    </ElectricBorder>
  );
};

const PlanCard = ({ plan, ink, radius, accent }) => (
  <Flex
    direction="column"
    h="100%"
    p="22px"
    textAlign="left"
    borderRadius={`${radius}px`}
    style={{ background: ink.panel, boxShadow: ink.panelRim }}
  >
    <Flex align="center" gap="10px">
      <IconTile ink={ink} icon={plan.icon} size={32} />
      <Text fontSize="15px" fontWeight={600} color={ink.text}>
        {plan.name}
      </Text>
      {plan.featured && (
        <Text ml="auto" fontSize="12px" fontWeight={500} style={{ color: accent }}>
          Popular
        </Text>
      )}
    </Flex>
    <Flex align="baseline" gap="4px" mt="22px">
      <Text fontSize="34px" fontWeight={600} letterSpacing="-0.03em" lineHeight="1" color={ink.text}>
        {plan.price}
      </Text>
      <Text fontSize="13px" color={ink.muted}>
        /month
      </Text>
    </Flex>
    <Text fontSize="13px" mt="8px" color={ink.muted}>
      {plan.note}
    </Text>
    <Flex as="ul" direction="column" gap="10px" mt="22px" listStyleType="none">
      {plan.features.map(feature => (
        <Flex as="li" key={feature} align="center" gap="8px" fontSize="13px" color={ink.text}>
          <HugeiconsIcon icon={Tick02Icon} size={15} color={ink.faint} strokeWidth={2} />
          {feature}
        </Flex>
      ))}
    </Flex>
    <Box
      as="button"
      type="button"
      mt="auto"
      w="100%"
      h="38px"
      borderRadius="10px"
      fontSize="13px"
      fontWeight={500}
      cursor="pointer"
      transition="filter 200ms ease"
      _hover={{ filter: 'brightness(1.08)' }}
      style={
        plan.featured
          ? { background: ink.solid, color: ink.solidText }
          : { background: ink.tile, color: ink.text, boxShadow: ink.rim }
      }
    >
      {plan.cta}
    </Box>
  </Flex>
);

const PricingScene = ({ border, ink, radius }) => (
  <Box
    display="grid"
    gridTemplateColumns="minmax(0, 1fr)"
    gap="18px"
    w="100%"
    maxW="300px"
    css={{ [WIDE]: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', maxWidth: '740px' } }}
  >
    {PLANS.map(plan =>
      plan.featured ? (
        <Box key={plan.name} h="370px">
          <ElectricBorder {...border} borderRadius={radius} style={{ height: '100%' }}>
            <PlanCard plan={plan} ink={ink} radius={radius} accent={border.color} />
          </ElectricBorder>
        </Box>
      ) : (
        <Box key={plan.name} h="370px" display="none" css={{ [WIDE]: { display: 'block' } }}>
          <PlanCard plan={plan} ink={ink} radius={radius} />
        </Box>
      )
    )}
  </Box>
);

const FileRow = ({ ink, icon, name, size, progress }) => (
  <Flex align="center" gap="12px" p="10px" borderRadius="12px" style={{ background: ink.well, boxShadow: ink.wellRim }}>
    <IconTile ink={ink} icon={icon} size={32} />
    <Box flex="1" minW={0}>
      <Flex align="baseline" gap="8px">
        <Text fontSize="13px" fontWeight={500} color={ink.text} truncate>
          {name}
        </Text>
        <Text ml="auto" fontSize="12px" color={ink.muted} flexShrink={0}>
          {progress >= 1 ? size : `${Math.round(progress * 100)}%`}
        </Text>
      </Flex>
      <Box mt="8px" h="4px" borderRadius="999px" overflow="hidden" style={{ background: ink.track }}>
        <Box h="100%" w={`${progress * 100}%`} borderRadius="999px" style={{ background: ink.text, opacity: 0.8 }} />
      </Box>
    </Box>
  </Flex>
);

const UploadScene = ({ border, ink, radius }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <ElectricBorder
      {...border}
      active={border.active && hovered}
      borderRadius={radius}
      style={{ width: '100%', maxWidth: 440 }}
    >
      <Box
        w="100%"
        p="14px"
        borderRadius={`${radius}px`}
        style={{ background: ink.panel, boxShadow: ink.panelRim }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="10px"
          h="172px"
          borderRadius={`${Math.max(4, radius - 10)}px`}
          style={{ background: ink.well, boxShadow: ink.wellRim }}
        >
          <IconTile ink={ink} icon={CloudUploadIcon} size={40} />
          <Text mt="4px" fontSize="14px" fontWeight={600} color={ink.text}>
            Drop files to upload
          </Text>
          <Text fontSize="12px" color={ink.muted}>
            PNG, JPG or PDF, up to 10 MB
          </Text>
        </Flex>
        <Flex direction="column" gap="8px" mt="10px">
          <FileRow ink={ink} icon={Pdf01Icon} name="Brand guidelines.pdf" size="4.2 MB" progress={1} />
          <FileRow ink={ink} icon={Image01Icon} name="Hero shot.png" size="2.8 MB" progress={0.64} />
        </Flex>
      </Box>
    </ElectricBorder>
  );
};

const BasicScene = ({ border, ink, radius }) => (
  <ElectricBorder {...border} borderRadius={radius} style={{ width: '100%', maxWidth: 280 }}>
    <Flex
      direction="column"
      justify="space-between"
      w="100%"
      h="340px"
      p="24px"
      borderRadius={`${radius}px`}
      style={{ background: ink.panel, boxShadow: ink.panelRim }}
    >
      <IconTile ink={ink} icon={FlashIcon} size={38} />
      <Box>
        <Text fontSize="17px" fontWeight={600} color={ink.text}>
          Electric Border
        </Text>
        <Text fontSize="13px" lineHeight="1.5" mt="6px" color={ink.muted}>
          Wrap anything in a living current.
        </Text>
      </Box>
    </Flex>
  </ElectricBorder>
);

const SCENES = { composer: ComposerScene, pricing: PricingScene, upload: UploadScene, basic: BasicScene };

const ElectricBorderDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { demo, preset, color, borderRadius, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = INK[theme];
  const shown = swapColor(color, theme === 'light' ? LIGHT_SWAP : DARK_SWAP);
  const border = { ...settings, color: shown, theme };
  const Scene = SCENES[demo] ?? ComposerScene;

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
      demoOnlyProps={['demo', 'preset', 'color']}
      computedProps={{ color: shown, ...(theme === 'light' ? { theme: 'light' } : {}) }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={{ base: 520, md: 560 }}
            px="28px"
            py={0}
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{ containerType: 'inline-size', containerName: 'electric' }}
          >
            <Scene key={`${demo}-${key}`} border={border} ink={ink} radius={borderRadius} />
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
            <PreviewColorPickerCustom title="Color" color={shown} onChange={value => updateProp('color', value)} />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Chaos"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.chaos}
              onChange={value => updateProp('chaos', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.5}
              max={4}
              step={0.1}
              value={settings.thickness}
              valueUnit="px"
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Strands"
              min={1}
              max={6}
              step={1}
              value={settings.strands}
              onChange={value => updateProp('strands', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.3}
              max={2}
              step={0.05}
              value={settings.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Arcs"
              min={0}
              max={3}
              step={0.1}
              value={settings.arcs}
              onChange={value => updateProp('arcs', value)}
            />
            <PreviewSlider
              title="Flicker"
              min={0}
              max={1}
              step={0.05}
              value={settings.flicker}
              onChange={value => updateProp('flicker', value)}
            />
            <PreviewSlider
              title="Border Radius"
              min={0}
              max={40}
              step={1}
              value={borderRadius}
              valueUnit="px"
              onChange={value => updateProp('borderRadius', value)}
            />
            <PreviewSlider
              title="Offset"
              min={-6}
              max={12}
              step={1}
              value={settings.offset}
              valueUnit="px"
              onChange={value => updateProp('offset', value)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={30}
              max={200}
              step={5}
              value={settings.cursorRadius}
              valueUnit="px"
              onChange={value => updateProp('cursorRadius', value)}
            />
            <PreviewSwitch title="Active" isChecked={settings.active} onChange={value => updateProp('active', value)} />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings.interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={electricBorder} componentName="ElectricBorder" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ElectricBorderDemo;
