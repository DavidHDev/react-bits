import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import Dependencies from '../../components/code/Dependencies';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { useColorModeValue } from '../../components/setup/color-mode';

import TechText from '../../content/TextAnimations/TechText/TechText';
import { techText } from '../../constants/code/TextAnimations/techTextCode';

const LOOK = {
  fontFamily: '',
  fontWeight: 600,
  letterSpacing: -0.05,
  accentColor: 'currentColor',
  reveal: 'letter',
  reach: 200,
  softness: 0.7,
  lineStyle: 'dashed',
  dashLength: 4,
  dashGap: 2,
  strokeWidth: 1.5,
  specks: 15,
  speed: 1,
  bounce: 0.4,
  selection: true,
  labels: true,
  intro: 'none',
  introDuration: 2,
  guides: false
};

const PRESETS = {
  vector: { ...LOOK },
  lens: {
    ...LOOK,
    reveal: 'area',
    reach: 240,
    softness: 0.85,
    lineStyle: 'solid',
    strokeWidth: 1,
    specks: 0,
    labels: false,
    intro: 'type',
    introDuration: 1.4
  },
  mono: {
    ...LOOK,
    fontFamily: '"Geist Mono", monospace',
    fontWeight: 500,
    letterSpacing: -0.02,
    accentColor: '#ff5a36',
    dashLength: 2,
    dashGap: 2,
    strokeWidth: 1,
    specks: 32,
    intro: 'assemble',
    introDuration: 2.2
  },
  serif: {
    ...LOOK,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: 400,
    letterSpacing: -0.03,
    lineStyle: 'solid',
    strokeWidth: 1.25,
    specks: 6,
    bounce: 0.75,
    intro: 'metrics',
    introDuration: 2.8,
    guides: true
  }
};

const PRESET_OPTIONS = [
  { value: 'vector', label: 'Vector' },
  { value: 'lens', label: 'Lens' },
  { value: 'mono', label: 'Mono' },
  { value: 'serif', label: 'Serif' }
];

const DEFAULT_PROPS = {
  preset: 'vector',
  text: 'React Bits',
  ...LOOK,
  color: 'currentColor',
  fontSize: 150,
  align: 'center',
  draggable: true,
  clickKick: true,
  sweep: true
};

const REVEAL_OPTIONS = [
  { label: 'Area', value: 'area' },
  { label: 'Letter', value: 'letter' },
  { label: 'Off', value: 'off' }
];

const INTRO_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Type', value: 'type' },
  { label: 'Assemble', value: 'assemble' },
  { label: 'Metrics', value: 'metrics' }
];

const LINE_OPTIONS = [
  { label: 'Dashed', value: 'dashed' },
  { label: 'Solid', value: 'solid' }
];

const ALIGN_OPTIONS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' }
];

const FONT_OPTIONS = [
  { label: 'Inherit', value: '' },
  { label: 'Geist Mono', value: '"Geist Mono", monospace' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'System', value: 'system-ui, sans-serif' }
];

const propData = [
  { name: 'text', type: 'string', default: "'React Bits'", description: 'The wordmark to render.' },
  {
    name: 'fontFamily',
    type: 'string',
    default: "''",
    description: 'Any font family loaded on the page. Leave empty to inherit the font of the container.'
  },
  { name: 'fontWeight', type: 'number', default: '600', description: 'Weight of the wordmark.' },
  {
    name: 'fontSize',
    type: 'number',
    default: '150',
    description: 'Largest font size in px. The wordmark shrinks to fit narrower containers.'
  },
  { name: 'letterSpacing', type: 'number', default: '-0.05', description: 'Extra space between letters, in em.' },
  {
    name: 'align',
    type: "'left' | 'center' | 'right'",
    default: "'center'",
    description: 'Where the wordmark sits across the container.'
  },
  {
    name: 'color',
    type: 'string',
    default: "'currentColor'",
    description: 'Colour of the letters and their outlines. Follows the surrounding text colour by default.'
  },
  {
    name: 'accentColor',
    type: 'string',
    default: "'currentColor'",
    description: 'Colour of the selection frame, connector, specks and labels.'
  },
  {
    name: 'reveal',
    type: "'area' | 'letter' | 'off'",
    default: "'letter'",
    description:
      'Area fades the letters into outlines inside a circle around the pointer. Letter turns only the active letter into its outline. Off keeps every letter solid.'
  },
  {
    name: 'reach',
    type: 'number',
    default: '200',
    description: 'Radius around the pointer where the letters turn into vector outlines, in px.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '0.7',
    description: 'How gradually the fill hands over to the outlines. 0 is a hard edge.'
  },
  { name: 'dashLength', type: 'number', default: '4', description: 'Length of each outline dash, in px.' },
  { name: 'dashGap', type: 'number', default: '2', description: 'Space between outline dashes, in px.' },
  {
    name: 'lineStyle',
    type: "'dashed' | 'solid'",
    default: "'dashed'",
    description: 'How the outlines under the pointer are drawn. Only the outer silhouette is traced either way.'
  },
  { name: 'strokeWidth', type: 'number', default: '1.5', description: 'Thickness of the outline, in px.' },
  {
    name: 'specks',
    type: 'number',
    default: '15',
    description: 'Tiny squares that blink and respawn around the active letter, seeded per letter. 0 turns them off.'
  },
  {
    name: 'selection',
    type: 'boolean',
    default: 'true',
    description: 'Frame the letter under the pointer. The frame glides from letter to letter.'
  },
  {
    name: 'labels',
    type: 'boolean',
    default: 'true',
    description: 'Label the frame with the letter and its size, or with its offset while dragged.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'true',
    description: 'Let letters be dragged off the baseline. They spring back home on release.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.4',
    description: 'How much a released letter overshoots on its way home, from 0 (none) to 1 (very springy).'
  },
  {
    name: 'clickKick',
    type: 'boolean',
    default: 'true',
    description:
      'Clicking a letter kicks it upward on its spring and sends a ripple through its neighbours, each leaving its outline behind while it moves.'
  },
  {
    name: 'intro',
    type: "'none' | 'type' | 'assemble' | 'metrics'",
    default: "'none'",
    description:
      'Entrance played once the wordmark is in view. Type places each letter as an outline under the selection frame, assemble flies pixel specks into the letters, metrics rules the font lines first and fills the letters zone by zone between them.'
  },
  {
    name: 'introDuration',
    type: 'number',
    default: '2',
    description: 'Length of the intro, in seconds.'
  },
  {
    name: 'guides',
    type: 'boolean',
    default: 'false',
    description: 'Rule the baseline, x-height, cap height and descender across the wordmark while a letter is active.'
  },
  {
    name: 'sweep',
    type: 'boolean',
    default: 'true',
    description: 'Sweep the reveal across the wordmark on its own while the pointer is away.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Speed of the idle sweep.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra classes on the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles on the container.' }
];

const TechTextDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');
  const shown = value => (value === 'currentColor' ? ink : value);

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={480} p={0} overflow="hidden">
            <TechText key={key} {...settings} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={shown(settings.color)}
              onChange={v => updateProp('color', v)}
            />
            <PreviewColorPickerCustom
              title="Accent"
              color={shown(settings.accentColor)}
              onChange={v => updateProp('accentColor', v)}
            />

            <PreviewSelect
              title="Intro"
              options={INTRO_OPTIONS}
              value={settings.intro}
              onChange={v => updateProp('intro', v)}
            />
            <PreviewSlider
              title="Intro Duration"
              min={0.6}
              max={4}
              step={0.1}
              isDisabled={settings.intro === 'none'}
              value={settings.introDuration}
              valueUnit="s"
              onChange={v => updateProp('introDuration', v)}
            />
            <PreviewSelect
              title="Reveal"
              options={REVEAL_OPTIONS}
              value={settings.reveal}
              onChange={v => updateProp('reveal', v)}
            />
            <PreviewSlider
              title="Reach"
              isDisabled={settings.reveal !== 'area'}
              min={80}
              max={400}
              step={10}
              value={settings.reach}
              valueUnit="px"
              onChange={v => updateProp('reach', v)}
            />
            <PreviewSlider
              title="Softness"
              isDisabled={settings.reveal !== 'area'}
              min={0}
              max={1}
              step={0.05}
              value={settings.softness}
              onChange={v => updateProp('softness', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0.2}
              max={3}
              step={0.1}
              isDisabled={!settings.sweep}
              value={settings.speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.9}
              step={0.05}
              isDisabled={!settings.draggable && !settings.clickKick}
              value={settings.bounce}
              onChange={v => updateProp('bounce', v)}
            />

            <PreviewInput title="Text" value={settings.text} maxLength={24} onChange={v => updateProp('text', v)} />
            <PreviewSelect
              title="Font"
              options={FONT_OPTIONS}
              value={settings.fontFamily}
              onChange={v => updateProp('fontFamily', v)}
            />
            <PreviewSelect
              title="Align"
              options={ALIGN_OPTIONS}
              value={settings.align}
              onChange={v => updateProp('align', v)}
            />
            <PreviewSlider
              title="Font Weight"
              min={300}
              max={900}
              step={100}
              value={settings.fontWeight}
              onChange={v => updateProp('fontWeight', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={60}
              max={320}
              step={5}
              value={settings.fontSize}
              valueUnit="px"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSlider
              title="Letter Spacing"
              min={-0.1}
              max={0.2}
              step={0.01}
              value={settings.letterSpacing}
              valueUnit="em"
              onChange={v => updateProp('letterSpacing', v)}
            />
            <PreviewSelect
              title="Line Style"
              options={LINE_OPTIONS}
              value={settings.lineStyle}
              onChange={v => updateProp('lineStyle', v)}
            />
            <PreviewSlider
              title="Dash Length"
              min={2}
              max={16}
              step={1}
              isDisabled={settings.lineStyle === 'solid'}
              value={settings.dashLength}
              valueUnit="px"
              onChange={v => updateProp('dashLength', v)}
            />
            <PreviewSlider
              title="Dash Gap"
              min={2}
              max={12}
              step={1}
              isDisabled={settings.lineStyle === 'solid'}
              value={settings.dashGap}
              valueUnit="px"
              onChange={v => updateProp('dashGap', v)}
            />
            <PreviewSlider
              title="Stroke Width"
              min={0.5}
              max={4}
              step={0.25}
              value={settings.strokeWidth}
              valueUnit="px"
              onChange={v => updateProp('strokeWidth', v)}
            />
            <PreviewSlider
              title="Specks"
              min={0}
              max={48}
              step={1}
              value={settings.specks}
              onChange={v => updateProp('specks', v)}
            />

            <PreviewSwitch
              title="Click Kick"
              isChecked={settings.clickKick}
              onChange={v => updateProp('clickKick', v)}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings.draggable}
              onChange={v => updateProp('draggable', v)}
            />
            <PreviewSwitch title="Sweep" isChecked={settings.sweep} onChange={v => updateProp('sweep', v)} />
            <PreviewSwitch
              title="Selection"
              isChecked={settings.selection}
              onChange={v => updateProp('selection', v)}
            />
            <PreviewSwitch title="Labels" isChecked={settings.labels} onChange={v => updateProp('labels', v)} />
            <PreviewSwitch title="Guides" isChecked={settings.guides} onChange={v => updateProp('guides', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={techText} componentName="TechText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TechTextDemo;
