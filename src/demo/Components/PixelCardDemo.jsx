import { Box, Flex, Text } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DropletIcon,
  Fire03Icon,
  FlowerIcon,
  Globe02Icon,
  GridIcon,
  Moon02Icon,
  Rocket01Icon,
  SecurityCheckIcon,
  SparklesIcon,
  Sun02Icon,
  Tick02Icon,
  UserGroupIcon,
  WorkflowSquare03Icon
} from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import PixelCard from '../../content/Components/PixelCard/PixelCard';
import { pixelCard } from '../../constants/code/Components/pixelCardCode';

const PALETTES = {
  classic: {
    dark: ['#f8fafc', '#f1f5f9', '#cbd5e1'],
    light: ['#18181b', '#52525b', '#a1a1aa'],
    glow: ['#cbd5e1', '#71717a']
  },
  ocean: {
    dark: ['#e0f2fe', '#7dd3fc', '#0ea5e9'],
    light: ['#0c4a6e', '#0369a1', '#0284c7'],
    glow: ['#0ea5e9', '#0284c7']
  },
  sunbeam: {
    dark: ['#fef08a', '#fde047', '#eab308'],
    light: ['#713f12', '#a16207', '#ca8a04'],
    glow: ['#eab308', '#ca8a04']
  },
  bloom: {
    dark: ['#fecdd3', '#fda4af', '#e11d48'],
    light: ['#831843', '#be123c', '#e11d48'],
    glow: ['#e11d48', '#be123c']
  },
  halo: {
    dark: ['#ccfbf1', '#5eead4', '#14b8a6'],
    light: ['#134e4a', '#0f766e', '#0d9488'],
    glow: ['#14b8a6', '#0d9488']
  },
  ember: {
    dark: ['#ffedd5', '#fdba74', '#f97316'],
    light: ['#7c2d12', '#c2410c', '#ea580c'],
    glow: ['#f97316', '#ea580c']
  }
};

const ICONS = {
  classic: SparklesIcon,
  ocean: DropletIcon,
  sunbeam: Sun02Icon,
  bloom: FlowerIcon,
  mosaic: GridIcon,
  halo: Moon02Icon,
  ember: Fire03Icon
};

const INK = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.62)',
    faint: 'rgba(244, 244, 245, 0.36)',
    tile: 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    solid: '#f4f4f5',
    solidText: '#121016',
    hover: 'brightness(1.12)',
    halo: '0 1px 2px rgba(15, 14, 19, 0.95), 0 0 10px rgba(15, 14, 19, 0.9), 0 0 22px rgba(15, 14, 19, 0.75)'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.62)',
    faint: 'rgba(24, 24, 27, 0.38)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    solid: '#18181b',
    solidText: '#ffffff',
    hover: 'brightness(0.97)',
    halo: '0 0 2px rgba(255, 255, 255, 0.95), 0 0 10px rgba(255, 255, 255, 0.92), 0 0 22px rgba(255, 255, 255, 0.8)'
  }
};

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

const PEOPLE = ['AK', 'JM', 'SR', 'LT'];
const STEPS = [
  { label: 'Build', time: '12s' },
  { label: 'Test', time: '48s' },
  { label: 'Deploy', time: '9s' }
];

const LOOK = {
  palette: 'classic',
  colors: PALETTES.classic.dark,
  glowColor: PALETTES.classic.glow[0],
  shape: 'square',
  origin: 'center',
  gap: 5,
  pixelSize: 2,
  speed: 35,
  revealDuration: 600,
  spotlight: 0.5,
  glow: 0.5,
  opacity: 0.35,
  fade: 0.7,
  trigger: 'hover',
  radius: 24,
  clickPulse: true,
  intro: true
};

const DEFAULT_PROPS = { preset: 'classic', demo: 'pricing', ...LOOK };

const withPalette = (name, rest) => ({
  ...LOOK,
  palette: name,
  colors: PALETTES[name].dark,
  glowColor: PALETTES[name].glow[0],
  ...rest
});

const PRESETS = {
  classic: LOOK,
  ocean: withPalette('ocean', { gap: 10, pixelSize: 3, speed: 25, origin: 'pointer', spotlight: 0.7 }),
  sunbeam: withPalette('sunbeam', { gap: 4, pixelSize: 1.8, speed: 20, glow: 0.6 }),
  bloom: withPalette('bloom', { gap: 7, pixelSize: 3, speed: 80, shape: 'circle' }),
  mosaic: { ...LOOK, gap: 12, pixelSize: 7, speed: 14, spotlight: 0.8, radius: 18 },
  halo: withPalette('halo', {
    gap: 9,
    pixelSize: 4,
    shape: 'circle',
    origin: 'pointer',
    spotlight: 1,
    glow: 0.7,
    radius: 32
  }),
  ember: withPalette('ember', { gap: 8, pixelSize: 3.4, speed: 50, shape: 'diamond', revealDuration: 800 })
};

const modeOpacity = demo => (demo === 'basic' ? 0.7 : 0.35);

const DEMO_OPTIONS = [
  { value: 'pricing', label: 'Pricing' },
  { value: 'bento', label: 'Bento' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'sunbeam', label: 'Sunbeam' },
  { value: 'bloom', label: 'Bloom' },
  { value: 'mosaic', label: 'Mosaic' },
  { value: 'halo', label: 'Halo' },
  { value: 'ember', label: 'Ember' }
];

const SHAPE_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' }
];

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' },
  { value: 'always', label: 'Always' }
];

const ORIGIN_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'pointer', label: 'Pointer' }
];

const same = (a, b) =>
  a.length === b.length && a.every((value, index) => value.toLowerCase() === b[index].toLowerCase());

const propData = [
  {
    name: 'variant',
    type: "'default' | 'blue' | 'yellow' | 'pink'",
    default: "'default'",
    description: 'A ready-made palette with its own gap and speed. Any prop you pass overrides it.'
  },
  {
    name: 'colors',
    type: 'string | string[]',
    default: 'From variant',
    description: 'Pixel colors, as an array or a comma-separated string. Each pixel picks one at random.'
  },
  {
    name: 'glowColor',
    type: 'string',
    default: 'From variant',
    description: 'Color of the soft light that follows the cursor across the card.'
  },
  { name: 'gap', type: 'number', default: 'From variant', description: 'Distance between pixels, in px.' },
  { name: 'pixelSize', type: 'number', default: '2', description: 'Largest size a pixel grows to, in px.' },
  {
    name: 'speed',
    type: 'number',
    default: 'From variant',
    description: 'How fast the pixels twinkle, from 0 to 100. 0 holds them still.'
  },
  {
    name: 'shape',
    type: "'square' | 'circle' | 'diamond'",
    default: "'square'",
    description: 'Shape of each pixel.'
  },
  {
    name: 'origin',
    type: "'center' | 'pointer'",
    default: "'center'",
    description: 'Where the reveal wave starts: the middle of the card, or wherever the pointer enters.'
  },
  {
    name: 'revealDuration',
    type: 'number',
    default: '600',
    description: 'How long the wave takes to sweep across the card, in ms.'
  },
  {
    name: 'spotlight',
    type: 'number',
    default: '0.5',
    description: 'How much pixels near the cursor swell and brighten, from 0 to 1.'
  },
  { name: 'glow', type: 'number', default: '0.5', description: 'Strength of the soft light under the pixels.' },
  {
    name: 'opacity',
    type: 'number',
    default: '1',
    description: 'Opacity of the pixels and glow. Lower it to keep text on the card easy to read.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0',
    description: 'Fades the pixels out toward the middle so they frame your content, from 0 to 1.'
  },
  {
    name: 'trigger',
    type: "'hover' | 'click' | 'always'",
    default: "'hover'",
    description: 'What turns the effect on: hovering or focusing the card, clicking it on and off, or always on.'
  },
  {
    name: 'clickPulse',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ripple of brighter pixels out from the click.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Plays the reveal once when the card first scrolls into view.'
  },
  {
    name: 'introDelay',
    type: 'number',
    default: '0',
    description: 'Wait before the intro, in ms. Stagger it across a row of cards.'
  },
  {
    name: 'noFocus',
    type: 'boolean',
    default: 'From variant',
    description: 'Stops keyboard focus from triggering the effect.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the card.' },
  { name: 'radius', type: 'number', default: '24', description: 'Corner radius of the card, in px.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the card.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the card.' },
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'Card content. It is centered and sits above the pixels.'
  }
];

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

const ActionButton = ({ ink, solid, children }) => (
  <Box
    as="button"
    type="button"
    w="100%"
    h="38px"
    borderRadius="10px"
    fontSize="13px"
    fontWeight={500}
    cursor="pointer"
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

const Feature = ({ ink, icon, title, text }) => (
  <Flex
    direction="column"
    justify="space-between"
    w="100%"
    h="100%"
    p="20px"
    textAlign="left"
    gap="16px"
    style={{ textShadow: ink.halo }}
  >
    <IconTile ink={ink} icon={icon} />
    <Box>
      <Text fontSize="15px" fontWeight={600} color={ink.text}>
        {title}
      </Text>
      <Text fontSize="13px" lineHeight="1.5" mt="4px" color={ink.muted}>
        {text}
      </Text>
    </Box>
  </Flex>
);

const PricingScene = ({ card, ink, accent }) => (
  <Box
    display="grid"
    gridTemplateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
    gap="14px"
    w="100%"
    maxW="760px"
  >
    {PLANS.map((plan, index) => (
      <Box key={plan.name} h={{ base: '330px', md: '372px' }}>
        <PixelCard
          {...card}
          trigger={plan.featured ? 'always' : card.trigger}
          introDelay={index * 140}
          style={{ width: '100%', height: '100%' }}
        >
          <Flex direction="column" w="100%" h="100%" p="22px" textAlign="left" style={{ textShadow: ink.halo }}>
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
            <Box mt="auto" pt="20px">
              <ActionButton ink={ink} solid={plan.featured}>
                {plan.cta}
              </ActionButton>
            </Box>
          </Flex>
        </PixelCard>
      </Box>
    ))}
  </Box>
);

const BentoScene = ({ card, ink }) => (
  <Box
    display="grid"
    gridTemplateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
    gridAutoRows={{ base: '180px', md: '178px' }}
    gap="14px"
    w="100%"
    maxW="760px"
  >
    <Box gridColumn={{ md: 'span 2' }}>
      <PixelCard {...card} introDelay={0} style={{ width: '100%', height: '100%' }}>
        <Flex
          direction="column"
          justify="space-between"
          w="100%"
          h="100%"
          p="20px"
          textAlign="left"
          style={{ textShadow: ink.halo }}
        >
          <Flex align="center">
            {PEOPLE.map((initials, index) => (
              <Box
                key={initials}
                w="32px"
                h="32px"
                ml={index ? '-8px' : 0}
                borderRadius="50%"
                display="grid"
                placeItems="center"
                fontSize="11px"
                fontWeight={600}
                color={ink.text}
                style={{ background: ink.tile, boxShadow: ink.rim }}
              >
                {initials}
              </Box>
            ))}
            <Text ml="10px" fontSize="12px" color={ink.muted}>
              4 editing now
            </Text>
          </Flex>
          <Box>
            <Text fontSize="15px" fontWeight={600} color={ink.text}>
              Realtime collaboration
            </Text>
            <Text fontSize="13px" lineHeight="1.5" mt="4px" color={ink.muted}>
              Edit together and see every cursor as it moves.
            </Text>
          </Box>
        </Flex>
      </PixelCard>
    </Box>
    <Box gridRow={{ md: 'span 2' }}>
      <PixelCard {...card} introDelay={160} style={{ width: '100%', height: '100%' }}>
        <Flex
          direction="column"
          justify="space-between"
          w="100%"
          h="100%"
          p="20px"
          textAlign="left"
          style={{ textShadow: ink.halo }}
        >
          <IconTile ink={ink} icon={WorkflowSquare03Icon} />
          <Flex direction="column" gap="8px" my="16px">
            {STEPS.map(step => (
              <Flex
                key={step.label}
                align="center"
                gap="8px"
                h="34px"
                px="10px"
                borderRadius="10px"
                fontSize="13px"
                color={ink.text}
                style={{ background: ink.tile, boxShadow: ink.rim, textShadow: 'none' }}
              >
                <HugeiconsIcon icon={Tick02Icon} size={15} color={ink.faint} strokeWidth={2} />
                {step.label}
                <Text as="span" ml="auto" fontSize="12px" color={ink.muted}>
                  {step.time}
                </Text>
              </Flex>
            ))}
          </Flex>
          <Box>
            <Text fontSize="15px" fontWeight={600} color={ink.text}>
              Automated workflows
            </Text>
            <Text fontSize="13px" lineHeight="1.5" mt="4px" color={ink.muted}>
              Every push is built, tested and shipped.
            </Text>
          </Box>
        </Flex>
      </PixelCard>
    </Box>
    <Box>
      <PixelCard {...card} introDelay={320} style={{ width: '100%', height: '100%' }}>
        <Feature ink={ink} icon={SecurityCheckIcon} title="SSO and audit logs" text="Every sign-in on record." />
      </PixelCard>
    </Box>
    <Box>
      <PixelCard {...card} introDelay={480} style={{ width: '100%', height: '100%' }}>
        <Feature ink={ink} icon={Globe02Icon} title="Global edge" text="Served close to every visitor." />
      </PixelCard>
    </Box>
  </Box>
);

const PixelCardDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, demo, palette, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = INK[theme];

  const tones = PALETTES[palette] ?? PALETTES.classic;
  const themed = theme === 'light' && same(settings.colors, tones.dark);
  const colors = themed ? tones.light : settings.colors;
  const glowColor =
    theme === 'light' && settings.glowColor.toLowerCase() === tones.glow[0].toLowerCase()
      ? tones.glow[1]
      : settings.glowColor;
  const accent = palette === 'classic' && settings.glowColor === PALETTES.classic.glow[0] ? ink.text : glowColor;

  const card = { ...settings, colors, glowColor, theme };
  const computedProps = { colors, glowColor, theme };

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], opacity: modeOpacity(demo), preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'demo', 'palette']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h="auto"
            minH={{ base: 480, md: 540 }}
            px={{ base: 4, md: 8 }}
            py={{ base: 14, md: 12 }}
            overflow="hidden"
            display="grid"
            gridTemplateColumns="minmax(0, 1fr)"
            placeItems="center"
          >
            <RefreshButton onClick={forceRerender} />
            <Box key={key} w="100%" display="grid" gridTemplateColumns="minmax(0, 1fr)" justifyItems="center">
              {demo === 'pricing' && <PricingScene card={card} ink={ink} accent={accent} />}
              {demo === 'bento' && <BentoScene card={card} ink={ink} />}
              {demo === 'basic' && (
                <PixelCard {...card}>
                  <Box
                    color={ink.text}
                    transition="color 320ms ease, transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)"
                    css={{ '.pixel-card[data-active] &': { color: glowColor, transform: 'scale(1.08)' } }}
                  >
                    <HugeiconsIcon icon={ICONS[preset] ?? SparklesIcon} size={48} strokeWidth={1.5} />
                  </Box>
                </PixelCard>
              )}
            </Box>
          </Box>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={colors}
              min={1}
              max={6}
              onChange={value => updateProps({ colors: value, palette: 'custom' })}
            />
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={demo}
              onChange={value => {
                updateProps({ demo: value, opacity: modeOpacity(value) });
                forceRerender();
              }}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Glow Color"
              color={glowColor}
              onChange={value => updateProps({ glowColor: value, palette: 'custom' })}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings.trigger}
              onChange={value => updateProp('trigger', value)}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSelect
              title="Origin"
              options={ORIGIN_OPTIONS}
              value={settings.origin}
              onChange={value => updateProp('origin', value)}
            />
            <PreviewSlider
              title="Gap"
              min={3}
              max={20}
              step={1}
              value={settings.gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Pixel Size"
              min={1}
              max={10}
              step={0.1}
              value={settings.pixelSize}
              valueUnit="px"
              onChange={value => updateProp('pixelSize', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={100}
              step={1}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Reveal Duration"
              min={200}
              max={1600}
              step={50}
              value={settings.revealDuration}
              valueUnit="ms"
              onChange={value => updateProp('revealDuration', value)}
            />
            <PreviewSlider
              title="Spotlight"
              min={0}
              max={1}
              step={0.05}
              value={settings.spotlight}
              onChange={value => updateProp('spotlight', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0.1}
              max={1}
              step={0.05}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={48}
              step={1}
              value={settings.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSwitch
              title="Click Pulse"
              isChecked={settings.clickPulse}
              onChange={value => updateProp('clickPulse', value)}
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
          <CodeExample codeObject={pixelCard} componentName="PixelCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PixelCardDemo;
