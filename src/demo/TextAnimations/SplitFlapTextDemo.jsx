import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import SplitFlapText from '../../content/TextAnimations/SplitFlapText/SplitFlapText';
import { splitFlapText } from '../../constants/code/TextAnimations/splitFlapTextCode';

const PHRASE_SETS = {
  launch: ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'],
  travel: ['BOARDING NOW', 'FINAL CALL', 'GATE OPEN'],
  product: ['BUILD FASTER', 'SHIP CLEANER', 'DELIGHT USERS'],
  numeric: ['FLIGHT 204', 'GATE 18', 'SEAT 07A'],
  time: ['09:41', '12:30', '18:05']
};

const LOOK = {
  words: PHRASE_SETS.launch,
  charset: 'alphanumeric',
  align: 'left',
  tileColor: '#111827',
  textColor: '#f8fafc',
  flipDuration: 0.12,
  stagger: 0.06,
  cycleDelay: 2400,
  flipsPerChar: 8,
  padTo: 12,
  fontSize: 52,
  tileRadius: 8,
  gap: 6,
  order: 'left',
  tileStyle: 'board',
  glare: 0,
  depth: 0.5
};

const PRESETS = {
  board: { ...LOOK },
  airport: {
    ...LOOK,
    words: PHRASE_SETS.travel,
    charset: 'alpha',
    tileColor: '#0a0a0a',
    textColor: '#facc15',
    flipDuration: 0.09,
    stagger: 0.035,
    flipsPerChar: 12,
    fontSize: 48,
    tileRadius: 3,
    gap: 3,
    order: 'random',
    glare: 0.75,
    depth: 0.85
  },
  minimal: {
    ...LOOK,
    words: PHRASE_SETS.product,
    align: 'center',
    flipDuration: 0.2,
    stagger: 0.045,
    flipsPerChar: 4,
    padTo: 13,
    fontSize: 64,
    gap: 1,
    order: 'center',
    tileStyle: 'minimal',
    depth: 0.6
  },
  clock: {
    ...LOOK,
    words: PHRASE_SETS.time,
    charset: 'numeric',
    align: 'center',
    tileColor: '#18181b',
    textColor: '#fafafa',
    flipDuration: 0.17,
    stagger: 0.08,
    cycleDelay: 2000,
    flipsPerChar: 6,
    padTo: 5,
    fontSize: 92,
    tileRadius: 14,
    gap: 10,
    order: 'right',
    glare: 0.45,
    depth: 1
  }
};

const DEFAULT_PROPS = {
  preset: 'board',
  ...LOOK,
  loop: true,
  intro: true
};

const PRESET_OPTIONS = [
  { value: 'board', label: 'Board' },
  { value: 'airport', label: 'Airport' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'clock', label: 'Clock' }
];

const PHRASE_OPTIONS = [
  { value: 'launch', label: 'Launch' },
  { value: 'travel', label: 'Travel' },
  { value: 'product', label: 'Product' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'time', label: 'Time' }
];

const CHARSET_OPTIONS = [
  { value: 'alphanumeric', label: 'A-Z + 0-9' },
  { value: 'alpha', label: 'A-Z' },
  { value: 'numeric', label: '0-9' },
  { value: 'ABCDEF0123456789•', label: 'Hex + dot' }
];

const ORDER_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'center', label: 'Center' },
  { value: 'random', label: 'Random' }
];

const STYLE_OPTIONS = [
  { value: 'board', label: 'Board' },
  { value: 'minimal', label: 'Minimal' }
];

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

const propData = [
  {
    name: 'words',
    type: 'string[]',
    default: "['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE']",
    description: 'Phrases to cycle through like a departure board.'
  },
  {
    name: 'text',
    type: 'string',
    default: 'undefined',
    description: 'Optional single phrase. When set, it takes precedence over words, and changing it flips the board.'
  },
  {
    name: 'flipDuration',
    type: 'number',
    default: '0.12',
    description: 'Duration, in seconds, of each individual flap turn.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.06',
    description: 'Delay, in seconds, between each tile starting its cascade.'
  },
  {
    name: 'cycleDelay',
    type: 'number',
    default: '2400',
    description: 'Hold time, in milliseconds, before cycling to the next phrase.'
  },
  {
    name: 'charset',
    type: '"alpha" | "alphanumeric" | "numeric" | string',
    default: '"alphanumeric"',
    description: 'Characters used for the intermediate flip glyphs.'
  },
  {
    name: 'flipsPerChar',
    type: 'number',
    default: '8',
    description: 'Number of intermediate glyphs each changed tile flips through.'
  },
  {
    name: 'align',
    type: '"left" | "center" | "right"',
    default: '"left"',
    description: 'Where phrases shorter than the board sit on it.'
  },
  {
    name: 'tileColor',
    type: 'string',
    default: '"#111827"',
    description: 'Base color of each mechanical tile.'
  },
  {
    name: 'textColor',
    type: 'string',
    default: '"#f8fafc"',
    description:
      'Color of the glyphs on every flap. "currentColor" follows the surrounding text, handy for the minimal style.'
  },
  {
    name: 'tileRadius',
    type: 'number | string',
    default: '8',
    description: 'Corner radius for each tile.'
  },
  {
    name: 'gap',
    type: 'number | string',
    default: '6',
    description: 'Space between adjacent flap tiles.'
  },
  {
    name: 'fontSize',
    type: 'number | string',
    default: '52',
    description: 'Tile type size. Numeric values are treated as pixels.'
  },
  {
    name: 'loop',
    type: 'boolean',
    default: 'true',
    description: 'Whether the phrase array repeats after the final phrase.'
  },
  {
    name: 'padTo',
    type: 'number',
    default: '12',
    description: 'Fixed tile count used to keep the board width stable.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Starts the board blank and flips it to the first phrase on mount.'
  },
  {
    name: 'order',
    type: '"left" | "right" | "center" | "random"',
    default: '"left"',
    description: 'Where the cascade starts: from the left, from the right, out from the middle, or in a random order.'
  },
  {
    name: 'tileStyle',
    type: '"board" | "minimal"',
    default: '"board"',
    description: 'Mechanical tiles, or bare characters that flip on their own, split by a hinge line.'
  },
  {
    name: 'glare',
    type: 'number',
    default: '0',
    description: 'Strength, from 0 to 1, of the soft light sheen that sweeps down each tile as its flap falls.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '0.5',
    description:
      'How physical the board feels, from 0 (flat) to 1: hinge shadow, flap shading as it turns, the shadow a falling flap casts and the thickness of its edge.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Optional class name for custom styling.'
  },
  {
    name: 'style',
    type: 'CSSProperties',
    default: '{}',
    description: 'Optional inline styles for the root element.'
  }
];

const SplitFlapTextDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const { words, padTo, gap, fontSize, tileStyle } = settings;
  const ink = useColorModeValue('#18181b', '#ffffff');
  const minimal = tileStyle === 'minimal';
  const inkText = minimal && settings.textColor === DEFAULT_PROPS.textColor;
  const textColor = inkText ? ink : settings.textColor;

  const computedProps = useMemo(() => (inkText ? { textColor: 'currentColor' } : {}), [inkText]);

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const phraseSet =
    Object.entries(PHRASE_SETS).find(([, phrases]) => phrases.join('\u001f') === words.join('\u001f'))?.[0] || 'launch';

  const boardWidth = Math.max(Math.ceil(padTo), ...words.map(word => String(word).length), 1);
  const fittedFontSize = `min(${fontSize}px, calc((100cqi - ${(boardWidth - 1) * gap}px) / ${(boardWidth * 0.78).toFixed(2)}))`;

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
            className="demo-container"
            minH={360}
            p={{ base: 6, md: 12 }}
            overflow="hidden"
            position="relative"
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{ containerType: 'inline-size' }}
          >
            <SplitFlapText key={key} {...settings} textColor={textColor} fontSize={fittedFontSize} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Tile Color"
              color={settings.tileColor}
              onChange={value => updateProp('tileColor', value)}
            />
            <PreviewColorPickerCustom
              title="Text Color"
              color={textColor}
              onChange={value => updateProp('textColor', value)}
            />
            <PreviewSelect
              title="Phrase Set"
              options={PHRASE_OPTIONS}
              value={phraseSet}
              onChange={value => updateProp('words', PHRASE_SETS[value])}
            />
            <PreviewSelect
              title="Charset"
              options={CHARSET_OPTIONS}
              value={settings.charset}
              onChange={value => updateProp('charset', value)}
            />
            <PreviewSelect
              title="Order"
              options={ORDER_OPTIONS}
              value={settings.order}
              onChange={value => updateProp('order', value)}
            />
            <PreviewSlider
              title="Flip Duration"
              min={0.06}
              max={0.3}
              step={0.01}
              value={settings.flipDuration}
              valueUnit="s"
              onChange={value => updateProp('flipDuration', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.14}
              step={0.005}
              value={settings.stagger}
              valueUnit="s"
              onChange={value => updateProp('stagger', value)}
            />
            <PreviewSlider
              title="Cycle Delay"
              min={900}
              max={5000}
              step={100}
              value={settings.cycleDelay}
              valueUnit="ms"
              onChange={value => updateProp('cycleDelay', value)}
            />
            <PreviewSlider
              title="Flips"
              min={1}
              max={14}
              step={1}
              value={settings.flipsPerChar}
              onChange={value => updateProp('flipsPerChar', value)}
            />
            <PreviewSwitch title="Loop" isChecked={settings.loop} onChange={checked => updateProp('loop', checked)} />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={checked => {
                updateProp('intro', checked);
                forceRerender();
              }}
            />
            <PreviewSelect
              title="Tile Style"
              options={STYLE_OPTIONS}
              value={tileStyle}
              onChange={value => updateProp('tileStyle', value)}
            />
            <PreviewSelect
              title="Align"
              options={ALIGN_OPTIONS}
              value={settings.align}
              onChange={value => updateProp('align', value)}
            />
            <PreviewSlider
              title="Glare"
              min={0}
              max={1}
              step={0.05}
              value={settings.glare}
              isDisabled={minimal}
              onChange={value => updateProp('glare', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={1}
              step={0.05}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Pad To"
              min={4}
              max={18}
              step={1}
              value={padTo}
              onChange={value => updateProp('padTo', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={32}
              max={96}
              step={1}
              value={fontSize}
              valueUnit="px"
              onChange={value => updateProp('fontSize', value)}
            />
            <PreviewSlider
              title="Tile Radius"
              min={0}
              max={18}
              step={1}
              value={settings.tileRadius}
              valueUnit="px"
              isDisabled={minimal}
              onChange={value => updateProp('tileRadius', value)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={14}
              step={1}
              value={gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={splitFlapText} componentName="SplitFlapText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SplitFlapTextDemo;
