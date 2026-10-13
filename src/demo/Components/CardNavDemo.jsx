import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import logoWhite from '../../assets/logos/reactbits-gh-white.svg';
import logoBlack from '../../assets/logos/reactbits-gh-black.svg';

import CardNav from '../../content/Components/CardNav/CardNav';
import { cardNav } from '../../constants/code/Components/cardNavCode';

const BASE_ITEMS = [
  {
    label: 'About',
    description: 'The people and the story behind the studio.',
    links: [
      { label: 'Company', href: '#company' },
      { label: 'Careers', href: '#careers' }
    ]
  },
  {
    label: 'Projects',
    description: 'Selected work from the last few years.',
    links: [
      { label: 'Featured', href: '#featured' },
      { label: 'Case studies', href: '#case-studies' }
    ]
  },
  {
    label: 'Contact',
    description: 'Say hello, we read everything.',
    links: [
      { label: 'Email', href: '#email' },
      { label: 'X', href: '#x' },
      { label: 'LinkedIn', href: '#linkedin' }
    ]
  }
];

const LOOK = {
  cardEffect: 'rise',
  openOn: 'click',
  surface: 'glass',
  stagger: 0.12,
  bounce: 0.2,
  accentColor: '',
  accentCard: false,
  menuLabel: true
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  speed: 1,
  cardHeight: 176,
  maxWidth: 800,
  descriptions: true,
  showCta: true,
  intro: true
};

const PRESETS = {
  classic: {},
  accent: { accentColor: '#ff5a1f', accentCard: true },
  unfold: { cardEffect: 'unfold', stagger: 0.16, bounce: 0.1 },
  hover: { openOn: 'hover' },
  solid: { surface: 'solid', cardEffect: 'fade', menuLabel: false, bounce: 0 }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'accent', label: 'Accent' },
  { value: 'unfold', label: 'Unfold' },
  { value: 'hover', label: 'Hover' },
  { value: 'solid', label: 'Solid' }
];

const EFFECT_OPTIONS = [
  { value: 'rise', label: 'Rise' },
  { value: 'unfold', label: 'Unfold' },
  { value: 'fade', label: 'Fade' }
];

const OPEN_OPTIONS = [
  { value: 'click', label: 'Click' },
  { value: 'hover', label: 'Hover' }
];

const SURFACE_OPTIONS = [
  { value: 'glass', label: 'Glass' },
  { value: 'solid', label: 'Solid' }
];

const contrastInk = color => {
  const hex = String(color || '').replace('#', '');
  if (!/^([0-9a-f]{6})$/i.test(hex)) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6 ? '#121016' : '#ffffff';
};

const propData = [
  {
    name: 'items',
    type: '{ label: string; description?: string; bgColor?: string; textColor?: string; links: { label: string; href?: string; ariaLabel?: string }[] }[]',
    default: '-',
    description: 'The cards in the menu. Give a card a bgColor to tint it, and links without an href render as buttons.'
  },
  {
    name: 'logo',
    type: 'string | ReactNode',
    default: '-',
    description: 'Image URL or element shown in the middle of the bar.'
  },
  { name: 'logoAlt', type: 'string', default: "'Logo'", description: 'Accessible label for the logo link.' },
  { name: 'logoHref', type: 'string', default: "'#'", description: 'Where the logo links to.' },
  {
    name: 'cta',
    type: '{ label: string; href?: string; onClick?: (event) => void }',
    default: '-',
    description: 'Button on the right of the bar. On narrow screens it moves to the bottom of the menu.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Color scheme of the bar, cards and button.'
  },
  {
    name: 'surface',
    type: "'glass' | 'solid'",
    default: "'glass'",
    description: 'Frosted glass that blurs what is behind the bar, or an opaque fill.'
  },
  {
    name: 'openOn',
    type: "'click' | 'hover'",
    default: "'click'",
    description: 'Opens the menu from the button, or as soon as the pointer moves over the bar.'
  },
  {
    name: 'cardEffect',
    type: "'rise' | 'unfold' | 'fade'",
    default: "'rise'",
    description: 'How the cards arrive: rising into place, folding down from the bar, or fading in from a soft blur.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.12',
    description: 'How far each card trails the one before it, from 0 to 0.3.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.2',
    description: 'How much the menu overshoots as it opens, from 0 to 1.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Speed of the open and close animation.' },
  { name: 'cardHeight', type: 'number', default: '176', description: 'Minimum height of the cards in px.' },
  { name: 'maxWidth', type: 'number', default: '800', description: 'Maximum width of the bar in px.' },
  {
    name: 'accentColor',
    type: 'string',
    default: '-',
    description: 'Color of the button. Its label picks black or white for contrast.'
  },
  {
    name: 'menuLabel',
    type: 'boolean',
    default: 'true',
    description: 'Shows Menu and Close next to the menu icon, rolling between them.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Unrolls the bar from its center on mount.' },
  { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Starts with the menu open.' },
  {
    name: 'open',
    type: 'boolean',
    default: '-',
    description: 'Controls the menu from outside. Pair it with onOpenChange.'
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    default: '-',
    description: 'Called when the menu opens or closes.'
  },
  {
    name: 'linkComponent',
    type: 'ElementType',
    default: "'a'",
    description: "Renders the links, so you can pass your router's link. It receives href, className and children."
  },
  {
    name: 'onLinkClick',
    type: '(link, item, event) => void',
    default: '-',
    description: 'Called when a link is clicked. The menu closes afterwards.'
  },
  { name: 'ariaLabel', type: 'string', default: "'Main'", description: 'Accessible name of the nav landmark.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root.' }
];

const CardNavDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, accentColor, accentCard, descriptions, showCta, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ctaDefault = useColorModeValue('#18181b', '#f4f4f5');
  const accent = accentColor || ctaDefault;

  const items = useMemo(
    () =>
      BASE_ITEMS.map((item, index) => ({
        ...item,
        ...(descriptions ? {} : { description: undefined }),
        ...(accentCard && index === 0 ? { bgColor: accent, textColor: contrastInk(accent) } : {})
      })),
    [descriptions, accentCard, accent]
  );

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({
      ...(accentColor ? { accentColor } : {}),
      ...(theme === 'light' ? { theme: 'light' } : {})
    }),
    [accentColor, theme]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'accentColor', 'accentCard', 'descriptions', 'showCta']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={480} p={0} overflow="hidden">
            <Box position="absolute" top="64px" left="20px" right="20px">
              <CardNav
                key={key}
                logo={theme === 'light' ? logoBlack : logoWhite}
                logoAlt="React Bits"
                items={items}
                cta={showCta ? { label: 'Get started' } : undefined}
                theme={theme}
                accentColor={accentColor || undefined}
                onLinkClick={(link, item, event) => event.preventDefault()}
                {...settings}
              />
            </Box>
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Accent"
              color={accent}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSelect
              title="Card Effect"
              options={EFFECT_OPTIONS}
              value={settings.cardEffect}
              onChange={value => updateProp('cardEffect', value)}
            />
            <PreviewSelect
              title="Open On"
              options={OPEN_OPTIONS}
              value={settings.openOn}
              onChange={value => updateProp('openOn', value)}
            />
            <PreviewSelect
              title="Surface"
              options={SURFACE_OPTIONS}
              value={settings.surface}
              onChange={value => updateProp('surface', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.3}
              step={0.01}
              value={settings.stagger}
              onChange={value => updateProp('stagger', value)}
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
              title="Speed"
              min={0.4}
              max={2}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Card Height"
              min={120}
              max={260}
              step={2}
              value={settings.cardHeight}
              valueUnit="px"
              onChange={value => updateProp('cardHeight', value)}
            />
            <PreviewSlider
              title="Max Width"
              min={480}
              max={1000}
              step={10}
              value={settings.maxWidth}
              valueUnit="px"
              onChange={value => updateProp('maxWidth', value)}
            />
            <PreviewSwitch
              title="Menu Label"
              isChecked={settings.menuLabel}
              onChange={value => updateProp('menuLabel', value)}
            />
            <PreviewSwitch title="Button" isChecked={showCta} onChange={value => updateProp('showCta', value)} />
            <PreviewSwitch
              title="Descriptions"
              isChecked={descriptions}
              onChange={value => updateProp('descriptions', value)}
            />
            <PreviewSwitch
              title="Accent Card"
              isChecked={accentCard}
              onChange={value => updateProp('accentCard', value)}
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
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={cardNav} componentName="CardNav" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CardNavDemo;
