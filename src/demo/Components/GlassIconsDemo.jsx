import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Book02Icon,
  ChartHistogramIcon,
  CloudIcon,
  DribbbleIcon,
  FavouriteIcon,
  Folder01Icon,
  GithubIcon,
  InstagramIcon,
  Linkedin01Icon,
  NewTwitterIcon,
  Note01Icon,
  YoutubeIcon
} from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import GlassIcons from '../../content/Components/GlassIcons/GlassIcons';
import { glassIcons } from '../../constants/code/Components/glassIconsCode';

const glyph = icon => <HugeiconsIcon icon={icon} size={24} strokeWidth={1.8} />;

const APPS = [
  { icon: glyph(Folder01Icon), color: 'blue', label: 'Files' },
  { icon: glyph(Book02Icon), color: 'purple', label: 'Books' },
  { icon: glyph(FavouriteIcon), color: 'red', label: 'Health' },
  { icon: glyph(CloudIcon), color: 'indigo', label: 'Weather' },
  { icon: glyph(Note01Icon), color: 'orange', label: 'Notes' },
  { icon: glyph(ChartHistogramIcon), color: 'green', label: 'Stats' }
];

const MONO = APPS.map(item => ({ ...item, color: 'graphite' }));

const SOCIAL = [
  { icon: glyph(GithubIcon), color: 'linear-gradient(135deg, #4a4752, #1d1b22)', label: 'GitHub' },
  { icon: glyph(NewTwitterIcon), color: 'linear-gradient(135deg, #3d3b44, #121116)', label: 'X' },
  { icon: glyph(Linkedin01Icon), color: 'linear-gradient(135deg, #2f8ae0, #0a5bb8)', label: 'LinkedIn' },
  {
    icon: glyph(InstagramIcon),
    color: 'linear-gradient(135deg, #feda75, #fa7e1e 30%, #d62976 60%, #962fbf 85%)',
    label: 'Instagram'
  },
  { icon: glyph(YoutubeIcon), color: 'linear-gradient(135deg, #ff4e45, #c4120a)', label: 'YouTube' },
  { icon: glyph(DribbbleIcon), color: 'linear-gradient(135deg, #f58bb8, #d6427f)', label: 'Dribbble' }
];

const DEFAULT_PROPS = {
  preset: 'apps',
  size: 82,
  gap: 66,
  columns: 3,
  roundness: 0.6,
  refraction: 0.8,
  bevel: 0.6,
  dispersion: 0,
  frost: 0.2,
  shine: 0.85,
  tint: '#dfdfdf',
  tintOpacity: 0.2,
  iconColor: '',
  plate: 'tilt',
  tilt: 30,
  spread: 0.5,
  hover: 'press',
  parallax: 1,
  labels: 'hover',
  intro: true
};

const PRESETS = {
  apps: {},
  mono: {},
  social: { size: 56, gap: 22, columns: 6, roundness: 1, plate: 'circle', spread: 0.12 },
  dock: { size: 60, gap: 16, columns: 6, roundness: 0.42, plate: 'offset', spread: 0.35, hover: 'float' },
  clear: { plate: 'none', refraction: 0.9, dispersion: 0.6, frost: 0.15, tintOpacity: 0.06 }
};

const PRESET_OPTIONS = [
  { value: 'apps', label: 'Apps' },
  { value: 'mono', label: 'Mono' },
  { value: 'social', label: 'Social' },
  { value: 'dock', label: 'Dock' },
  { value: 'clear', label: 'Clear' }
];

const PLATE_OPTIONS = [
  { value: 'tilt', label: 'Tilt' },
  { value: 'offset', label: 'Offset' },
  { value: 'circle', label: 'Circle' },
  { value: 'none', label: 'None' }
];

const HOVER_OPTIONS = [
  { value: 'lift', label: 'Lift' },
  { value: 'float', label: 'Float' },
  { value: 'press', label: 'Press' },
  { value: 'none', label: 'None' }
];

const LABEL_OPTIONS = [
  { value: 'hover', label: 'On Hover' },
  { value: 'always', label: 'Always' },
  { value: 'none', label: 'Hidden' }
];

const propData = [
  {
    name: 'items',
    type: 'GlassIconsItem[]',
    default: '[]',
    description:
      'Icons to show. Each item takes an icon, a label and a color, plus an optional href, target, onClick, id and className. Color is a preset name (blue, purple, red, indigo, orange, green, teal, pink, graphite, silver) or any CSS color or gradient.'
  },
  { name: 'size', type: 'number', default: '82', description: 'Width and height of each icon in px.' },
  { name: 'gap', type: 'number', default: '66', description: 'Space between the icons in px.' },
  {
    name: 'columns',
    type: 'number',
    default: '3',
    description: 'Icons per row. They wrap to fewer columns when there is not enough room.'
  },
  {
    name: 'roundness',
    type: 'number',
    default: '0.6',
    description: 'Corner rounding, from 0 for square to 1 for a circle.'
  },
  {
    name: 'refraction',
    type: 'number',
    default: '0.8',
    description: 'How strongly the glass bends what is behind it around its edge. Works in Chromium browsers.'
  },
  { name: 'bevel', type: 'number', default: '0.6', description: 'Width of the curved glass edge, from 0 to 1.' },
  {
    name: 'dispersion',
    type: 'number',
    default: '0',
    description: 'Rainbow fringing where the edge bends the light, from 0 to 1.'
  },
  {
    name: 'frost',
    type: 'number',
    default: '0.2',
    description: 'How much the glass blurs what is behind it, from 0 to 1.'
  },
  {
    name: 'shine',
    type: 'number',
    default: '0.85',
    description: 'Strength of the light catching the glass edge, from 0 to 1.'
  },
  { name: 'tint', type: 'string', default: "'#dfdfdf'", description: 'Color of the glass.' },
  {
    name: 'tintOpacity',
    type: 'number',
    default: '0.2',
    description: 'How strongly the tint colors the glass, from 0 to 1.'
  },
  {
    name: 'iconColor',
    type: 'string',
    default: '-',
    description: 'Color of the icons on the glass. Defaults to white, or near black on clear glass in the light theme.'
  },
  {
    name: 'plate',
    type: "'tilt' | 'offset' | 'circle' | 'none'",
    default: "'tilt'",
    description: 'Colored shape behind the glass: a tilted card, a shifted card, a disc or nothing for clear glass.'
  },
  { name: 'tilt', type: 'number', default: '30', description: 'Angle of the tilted card in degrees.' },
  {
    name: 'spread',
    type: 'number',
    default: '0.5',
    description: 'How far the shifted card or disc peeks out from behind the glass, from 0 to 1.'
  },
  {
    name: 'hover',
    type: "'lift' | 'float' | 'press' | 'none'",
    default: "'press'",
    description:
      'Hover animation. Lift raises the glass and swings the card, float raises the glass and press pushes it in.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '1',
    description: 'How far the card behind the glass drifts with the pointer, from 0 to 1.'
  },
  {
    name: 'labels',
    type: "'hover' | 'always' | 'none'",
    default: "'hover'",
    description: 'When the labels under the icons are shown.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description:
      'Plays an entrance the first time the icons scroll into view: the glass settles and the cards swing out.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Color scheme of the labels and glass edges.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const GlassIconsDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [key, forceRerender] = useForceRerender();
  const { preset, iconColor, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = iconColor || (theme === 'light' && props.plate === 'none' ? '#27272a' : '#ffffff');
  const items = preset === 'mono' ? MONO : preset === 'social' ? SOCIAL : APPS;
  const backdrop =
    preset === 'clear'
      ? `url(/assets/demo/${theme === 'light' ? 'day' : 'night'}-landscape.webp) center / cover`
      : undefined;

  const computedProps = useMemo(
    () => ({ iconColor: ink, ...(theme === 'light' ? { theme: 'light' } : {}) }),
    [ink, theme]
  );

  const applyPreset = value => {
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
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
            style={backdrop ? { background: backdrop } : undefined}
          >
            <GlassIcons key={`${preset}-${key}`} {...settings} iconColor={ink} items={items} theme={theme} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Plate"
              options={PLATE_OPTIONS}
              value={props.plate}
              onChange={value => updateProp('plate', value)}
            />
            <PreviewSelect
              title="Hover"
              options={HOVER_OPTIONS}
              value={props.hover}
              onChange={value => updateProp('hover', value)}
            />
            <PreviewSelect
              title="Labels"
              options={LABEL_OPTIONS}
              value={props.labels}
              onChange={value => updateProp('labels', value)}
            />
            <PreviewColorPickerCustom title="Tint" color={props.tint} onChange={value => updateProp('tint', value)} />
            <PreviewColorPickerCustom
              title="Icon Color"
              color={ink}
              onChange={value => updateProp('iconColor', value)}
            />
            <PreviewSlider
              title="Size"
              min={40}
              max={120}
              step={2}
              value={props.size}
              valueUnit="px"
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Gap"
              min={8}
              max={96}
              step={2}
              value={props.gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Columns"
              min={1}
              max={6}
              step={1}
              value={props.columns}
              onChange={value => updateProp('columns', value)}
            />
            <PreviewSlider
              title="Roundness"
              min={0}
              max={1}
              step={0.02}
              value={props.roundness}
              onChange={value => updateProp('roundness', value)}
            />
            <PreviewSlider
              title="Refraction"
              min={0}
              max={1.5}
              step={0.05}
              value={props.refraction}
              onChange={value => updateProp('refraction', value)}
            />
            <PreviewSlider
              title="Bevel"
              min={0}
              max={1}
              step={0.05}
              value={props.bevel}
              onChange={value => updateProp('bevel', value)}
            />
            <PreviewSlider
              title="Dispersion"
              min={0}
              max={1}
              step={0.05}
              value={props.dispersion}
              onChange={value => updateProp('dispersion', value)}
            />
            <PreviewSlider
              title="Frost"
              min={0}
              max={1}
              step={0.05}
              value={props.frost}
              onChange={value => updateProp('frost', value)}
            />
            <PreviewSlider
              title="Shine"
              min={0}
              max={1}
              step={0.05}
              value={props.shine}
              onChange={value => updateProp('shine', value)}
            />
            <PreviewSlider
              title="Tint Opacity"
              min={0}
              max={0.6}
              step={0.02}
              value={props.tintOpacity}
              onChange={value => updateProp('tintOpacity', value)}
            />
            {props.plate === 'tilt' && (
              <PreviewSlider
                title="Tilt"
                min={-45}
                max={45}
                step={1}
                value={props.tilt}
                valueUnit="°"
                onChange={value => updateProp('tilt', value)}
              />
            )}
            {(props.plate === 'offset' || props.plate === 'circle') && (
              <PreviewSlider
                title="Spread"
                min={0}
                max={1}
                step={0.05}
                value={props.spread}
                onChange={value => updateProp('spread', value)}
              />
            )}
            <PreviewSwitch title="Intro" isChecked={props.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={1}
              step={0.05}
              value={props.parallax}
              onChange={value => updateProp('parallax', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={glassIcons} componentName="GlassIcons" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GlassIconsDemo;
