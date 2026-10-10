import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Briefcase01Icon, Home01Icon, Mail01Icon, UserIcon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import GooeyNav from '../../content/Components/GooeyNav/GooeyNav';
import { gooeyNav } from '../../constants/code/Components/gooeyNavCode';

const LABELS = ['Home', 'Work', 'About', 'Contact'];
const ICONS = [Home01Icon, Briefcase01Icon, UserIcon, Mail01Icon];

const PALETTES = {
  none: [],
  ember: ['#ff5a1f', '#ff8a3a', '#ffb020']
};

const FEEL = {
  icons: false,
  palette: 'none',
  particleCount: 15,
  spread: 56,
  timeVariance: 300,
  animationTime: 600,
  gooeyness: 0.5,
  wobble: 0.5
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...FEEL,
  color: '',
  size: 'md',
  frame: true,
  hoverEffect: true
};

const PRESETS = {
  classic: { ...FEEL },
  accent: { ...FEEL, color: '#ff5a1f', palette: 'ember' },
  splash: { ...FEEL, particleCount: 24, spread: 84, gooeyness: 0.65, timeVariance: 450 },
  calm: { ...FEEL, particleCount: 8, spread: 28, wobble: 0.2, animationTime: 520 },
  icons: { ...FEEL, icons: true }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'accent', label: 'Accent' },
  { value: 'splash', label: 'Splash' },
  { value: 'calm', label: 'Calm' },
  { value: 'icons', label: 'Icons' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const propData = [
  {
    name: 'items',
    type: '{ label: string; href?: string; icon?: ReactNode }[]',
    default: '-',
    description: 'The navigation items. Items without an href render as buttons.'
  },
  { name: 'initialActiveIndex', type: 'number', default: '0', description: 'Which item starts selected.' },
  {
    name: 'activeIndex',
    type: 'number',
    default: '-',
    description: 'Controls the selected item yourself. Use it together with onChange.'
  },
  {
    name: 'onChange',
    type: '(index: number, item) => void',
    default: '-',
    description: 'Called when an item is selected.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the frame and text.' },
  {
    name: 'color',
    type: 'string',
    default: '-',
    description: 'Color of the active pill. Uses a high-contrast color for the theme when not set.'
  },
  {
    name: 'activeTextColor',
    type: 'string',
    default: '-',
    description: 'Text color inside the pill. Picked automatically from the pill color when not set.'
  },
  {
    name: 'colors',
    type: 'string[]',
    default: '[]',
    description: 'Colors for the droplets. They blend as they merge. Uses the pill color when empty.'
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size of the items.' },
  { name: 'frame', type: 'boolean', default: 'true', description: 'Shows the frosted panel around the items.' },
  {
    name: 'animationTime',
    type: 'number',
    default: '600',
    description: 'Roughly how long the droplets take to travel to the new item, in ms.'
  },
  {
    name: 'particleCount',
    type: 'number',
    default: '15',
    description: 'How many droplets the pill breaks into when an item is selected.'
  },
  {
    name: 'spread',
    type: 'number',
    default: '56',
    description: 'How far the droplets scatter on their way to the new item, in px.'
  },
  {
    name: 'timeVariance',
    type: 'number',
    default: '300',
    description: 'Random variation in each droplet’s timing, in ms.'
  },
  {
    name: 'gooeyness',
    type: 'number',
    default: '0.5',
    description: 'How readily the droplets and pills melt together, from 0 to 1.'
  },
  {
    name: 'wobble',
    type: 'number',
    default: '0.5',
    description: 'How much the new pill wobbles as it forms, from 0 to 1.'
  },
  {
    name: 'hoverEffect',
    type: 'boolean',
    default: 'true',
    description: 'Shows a soft highlight behind the hovered item.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the nav.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the nav.' }
];

const GooeyNavDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, icons, palette, color, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const pill = useColorModeValue('#27272a', '#f4f4f5');

  const items = useMemo(
    () =>
      LABELS.map((label, index) => ({
        label,
        href: '#',
        ...(icons ? { icon: <HugeiconsIcon icon={ICONS[index]} size={16} strokeWidth={1.8} /> } : {})
      })),
    [icons]
  );

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(FEEL).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, color: '', ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({
      ...(color ? { color } : {}),
      ...(PALETTES[palette]?.length ? { colors: PALETTES[palette] } : {}),
      ...(theme === 'light' ? { theme: 'light' } : {})
    }),
    [color, palette, theme]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'icons', 'palette', 'color']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={400}
            p={4}
            overflow="hidden"
            display="grid"
            placeItems="center"
          >
            <GooeyNav
              items={items}
              theme={theme}
              color={color || undefined}
              colors={PALETTES[palette] ?? []}
              {...settings}
            />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Pill Color"
              color={color || pill}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={settings.size}
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Particle Count"
              min={1}
              max={32}
              step={1}
              value={settings.particleCount}
              onChange={value => updateProp('particleCount', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={120}
              step={2}
              value={settings.spread}
              valueUnit="px"
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Animation Time"
              min={200}
              max={1500}
              step={50}
              value={settings.animationTime}
              valueUnit="ms"
              onChange={value => updateProp('animationTime', value)}
            />
            <PreviewSlider
              title="Time Variance"
              min={0}
              max={1000}
              step={50}
              value={settings.timeVariance}
              valueUnit="ms"
              onChange={value => updateProp('timeVariance', value)}
            />
            <PreviewSlider
              title="Gooeyness"
              min={0}
              max={1}
              step={0.05}
              value={settings.gooeyness}
              onChange={value => updateProp('gooeyness', value)}
            />
            <PreviewSlider
              title="Wobble"
              min={0}
              max={1}
              step={0.05}
              value={settings.wobble}
              onChange={value => updateProp('wobble', value)}
            />
            <PreviewSwitch title="Frame" isChecked={settings.frame} onChange={value => updateProp('frame', value)} />
            <PreviewSwitch title="Icons" isChecked={icons} onChange={value => updateProp('icons', value)} />
            <PreviewSwitch
              title="Hover Effect"
              isChecked={settings.hoverEffect}
              onChange={value => updateProp('hoverEffect', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={gooeyNav} componentName="GooeyNav" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GooeyNavDemo;
