import { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BookOpen01Icon, Camera01Icon, Home01Icon, UserIcon } from '@hugeicons/core-free-icons';

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

import markWhite from '../../assets/logos/react-bits-logo-small.svg';
import markBlack from '../../assets/logos/react-bits-logo-small-black.svg';

import PillNav from '../../content/Components/PillNav/PillNav';
import { pillNav } from '../../constants/code/Components/pillNavCode';

const LABELS = ['Home', 'Journal', 'Photos', 'About'];
const ICONS = [Home01Icon, BookOpen01Icon, Camera01Icon, UserIcon];

const LOOK = {
  layout: 'split',
  itemStyle: 'pill',
  hoverEffect: 'fill',
  indicator: 'dot',
  surface: 'glass',
  highlightColor: '',
  icons: false
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  size: 'md',
  bounce: 0.3,
  stretch: 0.5,
  collapse: 'auto',
  intro: true
};

const PRESETS = {
  classic: {},
  glide: { itemStyle: 'plain', hoverEffect: 'glide', indicator: 'pill' },
  capsule: { layout: 'joined', itemStyle: 'plain', hoverEffect: 'glide', indicator: 'pill' },
  ember: { highlightColor: '#ff5a1f' },
  icons: { icons: true },
  minimal: { surface: 'none', itemStyle: 'plain', hoverEffect: 'glide', indicator: 'dot' }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'glide', label: 'Glide' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'ember', label: 'Ember' },
  { value: 'icons', label: 'Icons' },
  { value: 'minimal', label: 'Minimal' }
];

const LAYOUT_OPTIONS = [
  { value: 'split', label: 'Split' },
  { value: 'joined', label: 'Joined' }
];

const ITEM_OPTIONS = [
  { value: 'pill', label: 'Pill' },
  { value: 'plain', label: 'Plain' }
];

const HOVER_OPTIONS = [
  { value: 'fill', label: 'Fill' },
  { value: 'glide', label: 'Glide' },
  { value: 'none', label: 'None' }
];

const INDICATOR_OPTIONS = [
  { value: 'dot', label: 'Dot' },
  { value: 'pill', label: 'Pill' },
  { value: 'none', label: 'None' }
];

const SURFACE_OPTIONS = [
  { value: 'glass', label: 'Glass' },
  { value: 'solid', label: 'Solid' },
  { value: 'none', label: 'None' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const COLLAPSE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'always', label: 'Always' },
  { value: 'never', label: 'Never' }
];

const propData = [
  {
    name: 'items',
    type: '{ label: string; href?: string; icon?: ReactNode; ariaLabel?: string }[]',
    default: '-',
    description: 'The navigation links. Items without an href render as buttons.'
  },
  {
    name: 'logo',
    type: 'string | ReactNode',
    default: '-',
    description: 'Image URL or element shown in the round logo button. It spins on hover.'
  },
  { name: 'logoAlt', type: 'string', default: "'Logo'", description: 'Accessible label for the logo link.' },
  { name: 'logoHref', type: 'string', default: "'#'", description: 'Where the logo links to.' },
  {
    name: 'activeHref',
    type: 'string',
    default: '-',
    description: 'Marks the item with this href as the current page. Leave it out to let the nav track clicks itself.'
  },
  {
    name: 'defaultActiveIndex',
    type: 'number',
    default: '0',
    description: 'Which item starts active when activeHref is not set.'
  },
  {
    name: 'onItemClick',
    type: '(item, index, event) => void',
    default: '-',
    description: 'Called when an item is clicked.'
  },
  {
    name: 'linkComponent',
    type: 'ElementType',
    default: "'a'",
    description: "Renders the links, so you can pass your router's link. It receives href, className and children."
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Color scheme of the surfaces, labels and highlight.'
  },
  {
    name: 'layout',
    type: "'split' | 'joined'",
    default: "'split'",
    description: 'Split puts the logo in its own bubble beside the bar. Joined holds everything in one capsule.'
  },
  {
    name: 'itemStyle',
    type: "'pill' | 'plain'",
    default: "'pill'",
    description: 'Pill gives every item its own raised pill. Plain shows the labels straight on the bar.'
  },
  {
    name: 'hoverEffect',
    type: "'fill' | 'glide' | 'none'",
    default: "'fill'",
    description:
      'Fill rises a circle through the hovered pill as its label rolls over. Glide slides one pill to the item under the cursor.'
  },
  {
    name: 'indicator',
    type: "'dot' | 'pill' | 'none'",
    default: "'dot'",
    description: 'How the current page is marked: a small dot that slides between items, or a filled pill.'
  },
  {
    name: 'surface',
    type: "'glass' | 'solid' | 'none'",
    default: "'glass'",
    description: 'Background of the bar and logo: frosted glass, an opaque fill, or nothing.'
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height, padding and text size.' },
  {
    name: 'highlightColor',
    type: 'string',
    default: '-',
    description: 'Color of the fill, the gliding pill and the dot. Labels on it pick black or white for contrast.'
  },
  {
    name: 'highlightTextColor',
    type: 'string',
    default: '-',
    description: 'Overrides the label color on the highlight.'
  },
  { name: 'barColor', type: 'string', default: '-', description: 'Overrides the background of the bar and logo.' },
  { name: 'textColor', type: 'string', default: '-', description: 'Overrides the label color.' },
  {
    name: 'bounce',
    type: 'number',
    default: '0.3',
    description: 'How much the gliding pill and the dot overshoot as they settle, from 0 to 1.'
  },
  {
    name: 'stretch',
    type: 'number',
    default: '0.5',
    description: 'How far the gliding pill stretches toward its target before the back edge catches up, from 0 to 1.'
  },
  {
    name: 'collapse',
    type: "'auto' | 'always' | 'never'",
    default: "'auto'",
    description: 'When the links fold into a menu button. Auto folds them only when they no longer fit.'
  },
  {
    name: 'onMenuToggle',
    type: '(open: boolean) => void',
    default: '-',
    description: 'Called when the folded menu opens or closes.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Pops the logo in and unrolls the bar on mount.'
  },
  { name: 'ariaLabel', type: 'string', default: "'Main'", description: 'Accessible name of the nav landmark.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the nav.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the nav.' }
];

const PillNavDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, icons, highlightColor, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const highlight = useColorModeValue('#18181b', '#f4f4f5');

  const items = useMemo(
    () =>
      LABELS.map((label, index) => ({
        label,
        href: `#${label.toLowerCase()}`,
        ...(icons ? { icon: <HugeiconsIcon icon={ICONS[index]} size={16} strokeWidth={1.8} /> } : {})
      })),
    [icons]
  );

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({
      ...(highlightColor ? { highlightColor } : {}),
      ...(theme === 'light' ? { theme: 'light' } : {})
    }),
    [highlightColor, theme]
  );

  const nav = (
    <PillNav
      key={key}
      logo={theme === 'light' ? markBlack : markWhite}
      logoAlt="React Bits"
      items={items}
      theme={theme}
      highlightColor={highlightColor || undefined}
      onItemClick={(item, index, event) => event.preventDefault()}
      {...settings}
    />
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'icons', 'highlightColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={360} p={0} overflow="hidden">
            <Flex w="100%" h="100%" align="center" justify="center" px="56px">
              {nav}
            </Flex>
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Highlight"
              color={highlightColor || highlight}
              onChange={value => updateProp('highlightColor', value)}
            />
            <PreviewSelect
              title="Layout"
              options={LAYOUT_OPTIONS}
              value={settings.layout}
              onChange={value => updateProp('layout', value)}
            />
            <PreviewSelect
              title="Items"
              options={ITEM_OPTIONS}
              value={settings.itemStyle}
              onChange={value => updateProp('itemStyle', value)}
            />
            <PreviewSelect
              title="Hover Effect"
              options={HOVER_OPTIONS}
              value={settings.hoverEffect}
              onChange={value => updateProp('hoverEffect', value)}
            />
            <PreviewSelect
              title="Indicator"
              options={INDICATOR_OPTIONS}
              value={settings.indicator}
              onChange={value => updateProp('indicator', value)}
            />
            <PreviewSelect
              title="Surface"
              options={SURFACE_OPTIONS}
              value={settings.surface}
              onChange={value => updateProp('surface', value)}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={settings.size}
              onChange={value => updateProp('size', value)}
            />
            <PreviewSelect
              title="Collapse"
              options={COLLAPSE_OPTIONS}
              value={settings.collapse}
              onChange={value => updateProp('collapse', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.01}
              value={settings.bounce}
              isDisabled={settings.hoverEffect !== 'glide' && settings.indicator === 'none'}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={1}
              step={0.01}
              value={settings.stretch}
              isDisabled={settings.hoverEffect !== 'glide' && settings.indicator !== 'pill'}
              onChange={value => updateProp('stretch', value)}
            />
            <PreviewSwitch title="Icons" isChecked={icons} onChange={value => updateProp('icons', value)} />
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
          <CodeExample codeObject={pillNav} componentName="PillNav" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PillNavDemo;
