import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import FallingText from '../../content/TextAnimations/FallingText/FallingText';
import { fallingText } from '../../constants/code/TextAnimations/fallingTextCode';

const SENTENCE = 'Some sentences are built to last. This one falls apart on contact.';
const HIGHLIGHTS = ['falls', 'apart'];

const FEEL = {
  trigger: 'hover',
  variant: 'text',
  split: 'words',
  order: 'random',
  gravity: 1,
  bounciness: 0.2,
  scatter: 0.5,
  stagger: 0.03,
  cursorPush: 0.5,
  mouseConstraintStiffness: 0.2,
  restoreDelay: 2,
  size: 2
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...FEEL,
  accentColor: '#5b8cff',
  draggable: true,
  wireframes: false
};

const PRESETS = {
  classic: {},
  tiles: { variant: 'tiles', size: 1.5, bounciness: 0.15 },
  letters: { split: 'letters', size: 3.25, order: 'sequence', stagger: 0.035, scatter: 0.8 },
  domino: { order: 'sequence', stagger: 0.12, scatter: 0.2, bounciness: 0.1 },
  bouncy: { bounciness: 0.7, scatter: 1, gravity: 1.3, cursorPush: 1 }
};

const PRESET_TEXT = { letters: 'Gravity always wins' };

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'tiles', label: 'Tiles' },
  { value: 'letters', label: 'Letters' },
  { value: 'domino', label: 'Domino' },
  { value: 'bouncy', label: 'Bouncy' }
];

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' },
  { value: 'auto', label: 'Auto' },
  { value: 'scroll', label: 'Scroll' }
];

const VARIANT_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'tiles', label: 'Tiles' }
];

const SPLIT_OPTIONS = [
  { value: 'words', label: 'Words' },
  { value: 'letters', label: 'Letters' }
];

const ORDER_OPTIONS = [
  { value: 'random', label: 'Random' },
  { value: 'sequence', label: 'Sequence' },
  { value: 'center', label: 'Center' },
  { value: 'together', label: 'Together' }
];

const propData = [
  { name: 'text', type: 'string', default: "''", description: 'The text that falls apart.' },
  {
    name: 'highlightWords',
    type: 'string[]',
    default: '[]',
    description:
      'Words that start with any of these strings get the accent color, or the accent tile in the tiles variant.'
  },
  {
    name: 'highlightClass',
    type: 'string',
    default: "'highlighted'",
    description: 'Extra class added to highlighted words.'
  },
  {
    name: 'trigger',
    type: "'auto' | 'hover' | 'click' | 'scroll'",
    default: "'auto'",
    description: 'What starts the fall. Scroll starts it when the text scrolls into view.'
  },
  {
    name: 'variant',
    type: "'text' | 'tiles'",
    default: "'text'",
    description: 'Plain falling text, or words on tiles that stack like blocks.'
  },
  {
    name: 'split',
    type: "'words' | 'letters'",
    default: "'words'",
    description: 'Whether whole words or single letters fall.'
  },
  {
    name: 'order',
    type: "'random' | 'sequence' | 'center' | 'together'",
    default: "'random'",
    description: 'Which pieces drop first. Falling pieces knock loose the ones they land on.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.03',
    description: 'Delay between pieces dropping, in seconds.'
  },
  { name: 'gravity', type: 'number', default: '1', description: 'Strength of gravity. Negative values fall upward.' },
  {
    name: 'bounciness',
    type: 'number',
    default: '0.2',
    description: 'How much pieces bounce when they land, from 0 to 1.'
  },
  {
    name: 'scatter',
    type: 'number',
    default: '0.5',
    description: 'How much spin and sideways push each piece gets as it drops, from 0 to 1.'
  },
  { name: 'draggable', type: 'boolean', default: 'true', description: 'Lets people pick up, drag and throw pieces.' },
  {
    name: 'mouseConstraintStiffness',
    type: 'number',
    default: '0.2',
    description: 'How tightly a dragged piece follows the pointer, from 0 to 1.'
  },
  {
    name: 'cursorPush',
    type: 'number',
    default: '0.5',
    description: 'How hard a quick swipe knocks the fallen pieces around. 0 turns it off.'
  },
  {
    name: 'restoreDelay',
    type: 'number',
    default: '0',
    description:
      'Seconds after the pile settles, with the pointer away, before the text flies back into place and can fall again. 0 keeps it fallen.'
  },
  { name: 'fontSize', type: 'string', default: "'1rem'", description: 'Font size of the text.' },
  {
    name: 'accentColor',
    type: 'string',
    default: "'#5b8cff'",
    description: 'Color of highlighted words, or of their tiles in the tiles variant.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the tiles.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Background of the area the text falls into.'
  },
  {
    name: 'wireframes',
    type: 'boolean',
    default: 'false',
    description: 'Outlines each piece to show its physics shape.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const FallingTextDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, size, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const ink = useColorModeValue('#18181b', '#f4f4f5');
  const text = PRESET_TEXT[preset] ?? SENTENCE;

  const computedProps = useMemo(
    () => ({ fontSize: `${size}rem`, ...(theme === 'light' ? { theme: 'light' } : {}) }),
    [size, theme]
  );

  const applyPreset = value => {
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], accentColor: settings.accentColor, preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'size']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={460} p={0} overflow="hidden">
            <FallingText
              key={`${preset}-${key}`}
              {...settings}
              text={text}
              highlightWords={preset === 'letters' ? [] : HIGHLIGHTS}
              fontSize={`${size}rem`}
              theme={theme}
              style={{ color: ink }}
            />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings.trigger}
              onChange={value => updateProp('trigger', value)}
            />
            <PreviewSelect
              title="Variant"
              options={VARIANT_OPTIONS}
              value={settings.variant}
              onChange={value => updateProp('variant', value)}
            />
            <PreviewSelect
              title="Split"
              options={SPLIT_OPTIONS}
              value={settings.split}
              onChange={value => updateProp('split', value)}
            />
            <PreviewSelect
              title="Order"
              options={ORDER_OPTIONS}
              value={settings.order}
              onChange={value => updateProp('order', value)}
            />
            <PreviewColorPickerCustom
              title="Accent Color"
              color={settings.accentColor}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={1}
              max={4}
              step={0.25}
              value={size}
              valueUnit="rem"
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Gravity"
              min={0.2}
              max={2.5}
              step={0.05}
              value={settings.gravity}
              onChange={value => updateProp('gravity', value)}
            />
            <PreviewSlider
              title="Bounciness"
              min={0}
              max={1}
              step={0.05}
              value={settings.bounciness}
              onChange={value => updateProp('bounciness', value)}
            />
            <PreviewSlider
              title="Scatter"
              min={0}
              max={1}
              step={0.05}
              value={settings.scatter}
              onChange={value => updateProp('scatter', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.2}
              step={0.01}
              value={settings.stagger}
              valueUnit="s"
              isDisabled={settings.order === 'together'}
              onChange={value => updateProp('stagger', value)}
            />
            <PreviewSlider
              title="Cursor Push"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.cursorPush}
              onChange={value => updateProp('cursorPush', value)}
            />
            <PreviewSlider
              title="Drag Stiffness"
              min={0.05}
              max={1}
              step={0.05}
              value={settings.mouseConstraintStiffness}
              isDisabled={!settings.draggable}
              onChange={value => updateProp('mouseConstraintStiffness', value)}
            />
            <PreviewSlider
              title="Restore Delay"
              min={0}
              max={6}
              step={0.5}
              value={settings.restoreDelay}
              valueUnit="s"
              onChange={value => updateProp('restoreDelay', value)}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings.draggable}
              onChange={value => updateProp('draggable', value)}
            />
            <PreviewSwitch
              title="Wireframes"
              isChecked={settings.wireframes}
              onChange={value => updateProp('wireframes', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['matter-js']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={fallingText} componentName="FallingText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FallingTextDemo;
