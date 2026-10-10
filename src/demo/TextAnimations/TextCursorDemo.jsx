import { useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import TextCursor from '../../content/TextAnimations/TextCursor/TextCursor';
import { textCursor } from '../../constants/code/TextAnimations/textCursorCode';

const LOOK = {
  text: 'Hello',
  mode: 'stamp',
  fontSize: 28,
  spacing: 88,
  maxPoints: 7,
  shrink: 0.5,
  fade: 0.6,
  smoothing: 0.3,
  exitDuration: 0.5,
  removalInterval: 30,
  followMouseDirection: true,
  keepUpright: true,
  randomFloat: true,
  popIn: true
};

const PRESETS = {
  words: { ...LOOK },
  emoji: { ...LOOK, text: '✨', fontSize: 30, spacing: 46, maxPoints: 10, shrink: 0.6, fade: 0.5 },
  chain: {
    ...LOOK,
    text: '→',
    mode: 'chain',
    fontSize: 24,
    spacing: 22,
    maxPoints: 18,
    shrink: 0.55,
    fade: 0.75,
    randomFloat: false
  },
  ribbon: {
    ...LOOK,
    text: 'React Bits follows your cursor ✦ ',
    mode: 'ribbon',
    fontSize: 26,
    spacing: 1,
    shrink: 0.35,
    fade: 0.7,
    smoothing: 0.4
  }
};

const DEFAULT_PROPS = {
  preset: 'words',
  ...LOOK,
  color: '',
  hideCursor: false
};

const PRESET_OPTIONS = [
  { value: 'words', label: 'Words' },
  { value: 'emoji', label: 'Emoji' },
  { value: 'chain', label: 'Chain' },
  { value: 'ribbon', label: 'Ribbon' }
];

const MODE_OPTIONS = [
  { value: 'stamp', label: 'Stamp' },
  { value: 'chain', label: 'Chain' },
  { value: 'ribbon', label: 'Ribbon' }
];

const propData = [
  { name: 'text', type: 'string', default: "'Hello'", description: 'The text or emoji the trail is made of.' },
  {
    name: 'mode',
    type: "'stamp' | 'chain' | 'ribbon'",
    default: "'stamp'",
    description:
      'Stamp leaves copies along the path, chain makes copies follow each other like a snake, and ribbon lays the letters along the path.'
  },
  {
    name: 'spacing',
    type: 'number',
    default: '88',
    description: 'Distance between copies, in px. In ribbon mode, extra space between letters.'
  },
  {
    name: 'maxPoints',
    type: 'number',
    default: '7',
    description: 'Most copies shown at once in stamp and chain modes.'
  },
  { name: 'color', type: 'string', default: "'currentColor'", description: 'Color of the text.' },
  { name: 'fontSize', type: 'number', default: '28', description: 'Font size of the text, in px.' },
  { name: 'fontWeight', type: 'number | string', default: '600', description: 'Font weight of the text.' },
  { name: 'fontFamily', type: 'string', default: "'inherit'", description: 'Font family of the text.' },
  {
    name: 'shrink',
    type: 'number',
    default: '0.5',
    description: 'How much smaller the trail gets toward its end, from 0 to 1.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0.6',
    description: 'How much the trail fades toward its end, from 0 to 1.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0.3',
    description: 'Softens the path the trail follows, from 0 to 1. Higher values lag a little behind the cursor.'
  },
  {
    name: 'followMouseDirection',
    type: 'boolean',
    default: 'true',
    description: 'Turns the text to face the direction the cursor moves.'
  },
  {
    name: 'randomFloat',
    type: 'boolean',
    default: 'true',
    description: 'Lets stamped copies sway gently, and makes chains and ribbons ripple.'
  },
  { name: 'popIn', type: 'boolean', default: 'true', description: 'Makes new copies pop in with a little overshoot.' },
  {
    name: 'keepUpright',
    type: 'boolean',
    default: 'true',
    description: 'In stamp mode, keeps copies from turning upside down when the cursor moves left.'
  },
  {
    name: 'exitDuration',
    type: 'number',
    default: '0.5',
    description: 'How long a stamped copy takes to shrink away, in seconds.'
  },
  {
    name: 'removalInterval',
    type: 'number',
    default: '30',
    description: 'How quickly the trail pulls back into the cursor once it stops, in ms per copy.'
  },
  { name: 'hideCursor', type: 'boolean', default: 'false', description: 'Hides the system cursor over the element.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const TextCursorDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, color, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(() => (color ? { color } : {}), [color]);

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'color']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={460} p={0} overflow="hidden">
            <Text
              position="absolute"
              bottom={5}
              left="50%"
              transform="translateX(-50%)"
              fontSize="sm"
              color="var(--text-dimmed)"
              userSelect="none"
              pointerEvents="none"
            >
              Move around
            </Text>
            <TextCursor {...settings} color={color || 'currentColor'} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewInput
              title="Text"
              value={settings.text}
              placeholder="Enter text..."
              width={180}
              maxLength={40}
              onChange={value => updateProp('text', value)}
            />
            <PreviewColorPickerCustom
              title="Color"
              color={color || ink}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings.mode}
              onChange={value => updateProp('mode', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={72}
              step={1}
              value={settings.fontSize}
              valueUnit="px"
              onChange={value => updateProp('fontSize', value)}
            />
            <PreviewSlider
              title="Spacing"
              min={0}
              max={200}
              step={1}
              value={settings.spacing}
              valueUnit="px"
              onChange={value => updateProp('spacing', value)}
            />
            <PreviewSlider
              title="Max Points"
              min={1}
              max={30}
              step={1}
              value={settings.maxPoints}
              onChange={value => updateProp('maxPoints', value)}
            />
            <PreviewSlider
              title="Shrink"
              min={0}
              max={1}
              step={0.05}
              value={settings.shrink}
              onChange={value => updateProp('shrink', value)}
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
              title="Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={settings.smoothing}
              onChange={value => updateProp('smoothing', value)}
            />
            <PreviewSlider
              title="Exit Duration"
              min={0.1}
              max={2}
              step={0.05}
              value={settings.exitDuration}
              valueUnit="s"
              onChange={value => updateProp('exitDuration', value)}
            />
            <PreviewSlider
              title="Removal Interval"
              min={5}
              max={200}
              step={5}
              value={settings.removalInterval}
              valueUnit="ms"
              onChange={value => updateProp('removalInterval', value)}
            />
            <PreviewSwitch
              title="Follow Mouse Direction"
              isChecked={settings.followMouseDirection}
              onChange={value => updateProp('followMouseDirection', value)}
            />
            <PreviewSwitch
              title="Keep Upright"
              isChecked={settings.keepUpright}
              onChange={value => updateProp('keepUpright', value)}
            />
            <PreviewSwitch
              title="Random Float"
              isChecked={settings.randomFloat}
              onChange={value => updateProp('randomFloat', value)}
            />
            <PreviewSwitch title="Pop In" isChecked={settings.popIn} onChange={value => updateProp('popIn', value)} />
            <PreviewSwitch
              title="Hide Cursor"
              isChecked={settings.hideCursor}
              onChange={value => updateProp('hideCursor', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={textCursor} componentName="TextCursor" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TextCursorDemo;
