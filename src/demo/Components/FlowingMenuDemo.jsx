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

import FlowingMenu from '../../content/Components/FlowingMenu/FlowingMenu';
import { flowingMenu } from '../../constants/code/Components/flowingMenuCode';

const ITEMS = [
  {
    link: '#',
    text: 'Mojave',
    meta: '2018',
    image: 'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=600&h=400&fit=crop&sat=-100&auto=format'
  },
  {
    link: '#',
    text: 'Sonoma',
    meta: '2023',
    image: 'https://images.unsplash.com/photo-1781499455083-6ccc3beb20cd?q=80&w=600&h=400&fit=crop&sat=-100&auto=format'
  },
  {
    link: '#',
    text: 'Monterey',
    meta: '2021',
    image: 'https://images.unsplash.com/photo-1776394254711-4a0d7345269a?q=80&w=600&h=400&fit=crop&sat=-100&auto=format'
  },
  {
    link: '#',
    text: 'Sequoia',
    meta: '2024',
    image: 'https://images.unsplash.com/photo-1781242629922-6f39cc3671cd?q=80&w=600&h=400&fit=crop&sat=-100&auto=format'
  }
];

const PLAIN_ITEMS = ITEMS.map(item => ({ ...item, meta: undefined }));

const LOOK = {
  speed: 60,
  direction: 'left',
  followCursor: 0.4,
  duration: 0.5,
  stretch: 0.6,
  magnet: 0.25,
  bandInset: 0,
  bandRadius: 0,
  carryContent: false,
  dividers: true,
  dimInactive: false,
  align: 'center',
  showIndex: false,
  showArrow: false,
  imageShape: 'pill',
  meta: false
};

const COLORS = {
  textColor: '',
  bgColor: '',
  marqueeBgColor: '',
  marqueeTextColor: '',
  borderColor: ''
};

const DEFAULT_PROPS = {
  preset: 'liquid',
  ...LOOK,
  ...COLORS,
  intro: true
};

const PALETTES = {
  liquid: {
    dark: {
      textColor: '#ffffff',
      bgColor: '#120F17',
      marqueeBgColor: '#ffffff',
      marqueeTextColor: '#120F17',
      borderColor: 'rgba(255, 255, 255, 0.14)'
    },
    light: {
      textColor: '#18181b',
      bgColor: '#ffffff',
      marqueeBgColor: '#18181b',
      marqueeTextColor: '#ffffff',
      borderColor: 'rgba(24, 24, 27, 0.1)'
    }
  },
  capsule: {
    dark: {
      textColor: '#ffffff',
      bgColor: '#120F17',
      marqueeBgColor: '#ff6a3d',
      marqueeTextColor: '#120F17',
      borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    light: {
      textColor: '#18181b',
      bgColor: '#ffffff',
      marqueeBgColor: '#ff6a3d',
      marqueeTextColor: '#120F17',
      borderColor: 'rgba(24, 24, 27, 0.08)'
    }
  },
  editorial: {
    dark: {
      textColor: '#efeae0',
      bgColor: '#141210',
      marqueeBgColor: '#efeae0',
      marqueeTextColor: '#141210',
      borderColor: 'rgba(239, 234, 224, 0.16)'
    },
    light: {
      textColor: '#1a1714',
      bgColor: '#f4f1ea',
      marqueeBgColor: '#1a1714',
      marqueeTextColor: '#f4f1ea',
      borderColor: 'rgba(26, 23, 20, 0.14)'
    }
  },
  slab: {
    dark: {
      textColor: '#ffffff',
      bgColor: '#120F17',
      marqueeBgColor: '#302c38',
      marqueeTextColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    light: {
      textColor: '#18181b',
      bgColor: '#ffffff',
      marqueeBgColor: '#f1f1f3',
      marqueeTextColor: '#18181b',
      borderColor: 'rgba(24, 24, 27, 0.08)'
    }
  }
};

const PRESETS = {
  liquid: {},
  capsule: {
    bandInset: 12,
    bandRadius: 999,
    carryContent: true,
    imageShape: 'circle',
    stretch: 0.85,
    magnet: 0.35,
    speed: 80,
    followCursor: 0.6,
    dividers: false,
    dimInactive: true
  },
  editorial: {
    align: 'left',
    showIndex: true,
    showArrow: true,
    imageShape: 'rounded',
    direction: 'alternate',
    duration: 0.45,
    stretch: 0.3,
    magnet: 0.15,
    speed: 40,
    dimInactive: true,
    meta: true
  },
  slab: {
    bandInset: 18,
    bandRadius: 22,
    carryContent: true,
    imageShape: 'rounded',
    stretch: 1,
    magnet: 0.4,
    duration: 0.65,
    speed: 55,
    dividers: false,
    dimInactive: true
  }
};

const PRESET_OPTIONS = [
  { value: 'liquid', label: 'Liquid' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'slab', label: 'Slab' }
];

const DIRECTION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'alternate', label: 'Alternate' }
];

const ALIGN_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'left', label: 'Left' }
];

const SHAPE_OPTIONS = [
  { value: 'pill', label: 'Pill' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' }
];

const propData = [
  {
    name: 'items',
    type: 'Array<{ text, link?, image?, marquee?, meta? }>',
    default: '[]',
    description:
      'Menu rows. marquee changes the text that scrolls in the band and meta adds a note at the end of the row.'
  },
  { name: 'speed', type: 'number', default: '60', description: 'Marquee speed in px per second.' },
  {
    name: 'direction',
    type: "'left' | 'right' | 'alternate'",
    default: "'left'",
    description: 'Which way the marquee runs. Alternate flips every other row.'
  },
  {
    name: 'followCursor',
    type: 'number',
    default: '0.4',
    description: 'How much moving the cursor sideways speeds up or reverses the marquee, from 0 to 1.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '0.5',
    description: 'Time in seconds the band takes to glide to a row.'
  },
  {
    name: 'stretch',
    type: 'number',
    default: '0.6',
    description: 'How much the band stretches like liquid while it moves, from 0 for rigid to 1.'
  },
  {
    name: 'magnet',
    type: 'number',
    default: '0.25',
    description: 'How much the band leans toward the cursor inside a row, from 0 to 1.'
  },
  { name: 'bandInset', type: 'number', default: '0', description: 'Gap in px between the band and the row edges.' },
  {
    name: 'carryContent',
    type: 'boolean',
    default: 'false',
    description: 'Moves the marquee with the band instead of keeping it fixed in each row.'
  },
  {
    name: 'bandRadius',
    type: 'number',
    default: '0',
    description: 'Corner radius of the band in px. Use a large value for a pill.'
  },
  { name: 'textColor', type: 'string', default: "'#ffffff'", description: 'Color of the menu text.' },
  { name: 'bgColor', type: 'string', default: "'#120F17'", description: 'Background color of the menu.' },
  { name: 'marqueeBgColor', type: 'string', default: "'#ffffff'", description: 'Background color of the band.' },
  { name: 'marqueeTextColor', type: 'string', default: "'#120F17'", description: 'Text color inside the band.' },
  {
    name: 'borderColor',
    type: 'string',
    default: "'rgba(255, 255, 255, 0.14)'",
    description: 'Color of the lines between rows.'
  },
  { name: 'dividers', type: 'boolean', default: 'true', description: 'Draws lines between rows.' },
  {
    name: 'dimInactive',
    type: 'boolean',
    default: 'false',
    description: 'Fades the other rows while the band is on one.'
  },
  { name: 'align', type: "'center' | 'left'", default: "'center'", description: 'Alignment of the row labels.' },
  { name: 'showIndex', type: 'boolean', default: 'false', description: 'Numbers each row.' },
  { name: 'showArrow', type: 'boolean', default: 'false', description: 'Adds an arrow to the end of each row.' },
  {
    name: 'imageShape',
    type: "'pill' | 'rounded' | 'circle'",
    default: "'pill'",
    description: 'Shape of the images in the band.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Rows rise in, the lines draw and the band sweeps once down the menu on mount.'
  },
  { name: 'activeIndex', type: 'number', default: '-', description: 'Marks the current page row.' },
  {
    name: 'onItemClick',
    type: '(item, index, event) => void',
    default: '-',
    description: 'Called when a row is clicked.'
  },
  { name: 'ariaLabel', type: 'string', default: "'Menu'", description: 'Accessible name of the navigation.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the menu.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the menu.' }
];

const FlowingMenuDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, meta, textColor, bgColor, marqueeBgColor, marqueeTextColor, borderColor, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const palette = (PALETTES[preset] ?? PALETTES.liquid)[theme];
  const colors = {
    textColor: textColor || palette.textColor,
    bgColor: bgColor || palette.bgColor,
    marqueeBgColor: marqueeBgColor || palette.marqueeBgColor,
    marqueeTextColor: marqueeTextColor || palette.marqueeTextColor,
    borderColor: borderColor || palette.borderColor
  };

  const applyPreset = value => {
    updateProps({ ...LOOK, ...COLORS, ...PRESETS[value], preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'meta', ...Object.keys(COLORS)]}
      computedProps={colors}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={600} p={0} overflow="hidden">
            <Box position="absolute" inset={0}>
              <FlowingMenu key={key} items={meta ? ITEMS : PLAIN_ITEMS} {...settings} {...colors} />
            </Box>
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSelect
              title="Align"
              options={ALIGN_OPTIONS}
              value={settings.align}
              onChange={value => updateProp('align', value)}
            />
            <PreviewSelect
              title="Image Shape"
              options={SHAPE_OPTIONS}
              value={settings.imageShape}
              onChange={value => updateProp('imageShape', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={200}
              step={5}
              value={settings.speed}
              valueUnit="px/s"
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Follow Cursor"
              min={0}
              max={1}
              step={0.01}
              value={settings.followCursor}
              onChange={value => updateProp('followCursor', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.2}
              max={1.2}
              step={0.05}
              value={settings.duration}
              valueUnit="s"
              onChange={value => updateProp('duration', value)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={1}
              step={0.01}
              value={settings.stretch}
              onChange={value => updateProp('stretch', value)}
            />
            <PreviewSlider
              title="Magnet"
              min={0}
              max={1}
              step={0.01}
              value={settings.magnet}
              onChange={value => updateProp('magnet', value)}
            />
            <PreviewSlider
              title="Band Inset"
              min={0}
              max={40}
              step={1}
              value={settings.bandInset}
              valueUnit="px"
              onChange={value => updateProp('bandInset', value)}
            />
            <PreviewSlider
              title="Band Radius"
              min={0}
              max={80}
              step={1}
              value={Math.min(settings.bandRadius, 80)}
              valueUnit="px"
              onChange={value => updateProp('bandRadius', value)}
            />
            <PreviewColorPickerCustom
              title="Text"
              color={colors.textColor}
              onChange={value => updateProp('textColor', value)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={colors.bgColor}
              onChange={value => updateProp('bgColor', value)}
            />
            <PreviewColorPickerCustom
              title="Band"
              color={colors.marqueeBgColor}
              onChange={value => updateProp('marqueeBgColor', value)}
            />
            <PreviewColorPickerCustom
              title="Band Text"
              color={colors.marqueeTextColor}
              onChange={value => updateProp('marqueeTextColor', value)}
            />
            <PreviewSwitch
              title="Dividers"
              isChecked={settings.dividers}
              onChange={value => updateProp('dividers', value)}
            />
            <PreviewSwitch
              title="Carry Content"
              isChecked={settings.carryContent}
              onChange={value => updateProp('carryContent', value)}
            />
            <PreviewSwitch
              title="Dim Inactive"
              isChecked={settings.dimInactive}
              onChange={value => updateProp('dimInactive', value)}
            />
            <PreviewSwitch
              title="Show Index"
              isChecked={settings.showIndex}
              onChange={value => updateProp('showIndex', value)}
            />
            <PreviewSwitch
              title="Show Arrow"
              isChecked={settings.showArrow}
              onChange={value => updateProp('showArrow', value)}
            />
            <PreviewSwitch title="Meta" isChecked={meta} onChange={value => updateProp('meta', value)} />
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
          <CodeExample codeObject={flowingMenu} componentName="FlowingMenu" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FlowingMenuDemo;
