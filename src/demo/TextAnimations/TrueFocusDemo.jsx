import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import TrueFocus from '../../content/TextAnimations/TrueFocus/TrueFocus';
import { trueFocus } from '../../constants/code/TextAnimations/trueFocusCode';

const LOOK = {
  sentence: 'True Focus',
  borderColor: '#5227FF',
  highlightColor: '#5227FF',
  easing: 'smooth',
  order: 'sequential',
  animationDuration: 0.5,
  pauseBetweenAnimations: 1,
  focusStyle: 'brackets',
  focusScale: 1,
  blurAmount: 5,
  unfocusedOpacity: 1,
  cornerSize: 16,
  borderWidth: 3
};

const PRESETS = {
  classic: { ...LOOK },
  box: {
    ...LOOK,
    sentence: 'Less noise, more focus',
    borderColor: '#ffffff',
    easing: 'spring',
    animationDuration: 0.55,
    pauseBetweenAnimations: 0.9,
    focusStyle: 'box',
    focusScale: 1.06,
    blurAmount: 3,
    unfocusedOpacity: 0.4,
    borderWidth: 1.5
  },
  underline: {
    ...LOOK,
    sentence: 'Make every word count',
    borderColor: '#ff5a36',
    easing: 'spring',
    order: 'random',
    pauseBetweenAnimations: 0.8,
    focusStyle: 'underline',
    blurAmount: 0,
    unfocusedOpacity: 0.28,
    borderWidth: 4
  },
  marker: {
    ...LOOK,
    sentence: 'Mark what matters most',
    highlightColor: '#4f8dff',
    animationDuration: 0.6,
    focusStyle: 'highlight',
    focusScale: 1.04,
    blurAmount: 1.5,
    unfocusedOpacity: 0.5
  }
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  manualMode: false
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'box', label: 'Box' },
  { value: 'underline', label: 'Underline' },
  { value: 'marker', label: 'Marker' }
];

const STYLE_OPTIONS = [
  { value: 'brackets', label: 'Brackets' },
  { value: 'box', label: 'Box' },
  { value: 'underline', label: 'Underline' },
  { value: 'highlight', label: 'Highlight' }
];

const EASING_OPTIONS = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'spring', label: 'Spring' }
];

const ORDER_OPTIONS = [
  { value: 'sequential', label: 'Sequential' },
  { value: 'random', label: 'Random' }
];

const propData = [
  {
    name: 'sentence',
    type: 'string',
    default: "'True Focus'",
    description: 'The text to display with the focus animation.'
  },
  {
    name: 'separator',
    type: 'string',
    default: "' '",
    description: 'String used to split the sentence into words.'
  },
  {
    name: 'focusStyle',
    type: "'brackets' | 'box' | 'underline' | 'highlight'",
    default: "'brackets'",
    description:
      'How the focused word is marked: corner brackets, a full outline, a bar underneath, or a soft filled block behind the word.'
  },
  {
    name: 'borderColor',
    type: 'string',
    default: "'green'",
    description: 'Color of the brackets, box or underline.'
  },
  {
    name: 'highlightColor',
    type: 'string',
    default: 'undefined',
    description:
      'Color of the block in the highlight style, drawn softly so the text stays readable. Uses the border color when not set.'
  },
  {
    name: 'glowColor',
    type: 'string',
    default: "'transparent'",
    description: 'Color of a soft glow around the brackets, box or underline. No glow by default.'
  },
  {
    name: 'focusScale',
    type: 'number',
    default: '1',
    description: 'Scales up the focused word, for example 1.06. The frame grows with it.'
  },
  {
    name: 'blurAmount',
    type: 'number',
    default: '5',
    description: 'Blur on the words that are out of focus, in px.'
  },
  {
    name: 'unfocusedOpacity',
    type: 'number',
    default: '1',
    description: 'Opacity of the words that are out of focus, from 0 to 1.'
  },
  {
    name: 'easing',
    type: "'smooth' | 'spring'",
    default: "'smooth'",
    description: 'How the frame moves between words: a smooth glide, or a spring that slightly overshoots and settles.'
  },
  {
    name: 'order',
    type: "'sequential' | 'random'",
    default: "'sequential'",
    description: 'Moves the focus to the next word in reading order, or to a random other word.'
  },
  {
    name: 'manualMode',
    type: 'boolean',
    default: 'false',
    description: 'Moves the focus to the hovered word instead of cycling on its own.'
  },
  {
    name: 'animationDuration',
    type: 'number',
    default: '0.5',
    description: 'How long the frame takes to move to the next word, in seconds.'
  },
  {
    name: 'pauseBetweenAnimations',
    type: 'number',
    default: '1',
    description: 'How long the focus rests on each word before moving on, in seconds.'
  },
  {
    name: 'cornerSize',
    type: 'number',
    default: '16',
    description: 'Length of each corner bracket, in px.'
  },
  {
    name: 'borderWidth',
    type: 'number',
    default: '3',
    description: 'Thickness of the brackets, box or underline, in px.'
  }
];

const TrueFocusDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const lightBorder = settings.borderColor.toLowerCase() === '#ffffff' ? '#18181b' : settings.borderColor;
  const borderColor = useColorModeValue(lightBorder, settings.borderColor);

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
          <Box position="relative" className="demo-container" minH={400}>
            <TrueFocus key={key} {...settings} borderColor={borderColor} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Border Color"
              color={borderColor}
              onChange={value => updateProp('borderColor', value)}
            />
            <PreviewColorPickerCustom
              title="Highlight Color"
              color={settings.highlightColor}
              onChange={value => updateProp('highlightColor', value)}
            />
            <PreviewSelect
              title="Easing"
              options={EASING_OPTIONS}
              value={settings.easing}
              onChange={value => updateProp('easing', value)}
            />
            <PreviewSelect
              title="Order"
              options={ORDER_OPTIONS}
              value={settings.order}
              isDisabled={settings.manualMode}
              onChange={value => updateProp('order', value)}
            />
            <PreviewSlider
              title="Animation Duration"
              min={0.1}
              max={3}
              step={0.05}
              value={settings.animationDuration}
              valueUnit="s"
              onChange={value => updateProp('animationDuration', value)}
            />
            <PreviewSlider
              title="Pause Between Animations"
              min={0}
              max={5}
              step={0.1}
              value={settings.pauseBetweenAnimations}
              valueUnit="s"
              isDisabled={settings.manualMode}
              onChange={value => updateProp('pauseBetweenAnimations', value)}
            />
            <PreviewSwitch
              title="Hover Mode"
              isChecked={settings.manualMode}
              onChange={value => updateProp('manualMode', value)}
            />
            <PreviewSelect
              title="Focus Style"
              options={STYLE_OPTIONS}
              value={settings.focusStyle}
              onChange={value => updateProp('focusStyle', value)}
            />
            <PreviewSlider
              title="Focus Scale"
              min={1}
              max={1.3}
              step={0.01}
              value={settings.focusScale}
              onChange={value => updateProp('focusScale', value)}
            />
            <PreviewSlider
              title="Blur Amount"
              min={0}
              max={15}
              step={0.5}
              value={settings.blurAmount}
              valueUnit="px"
              onChange={value => updateProp('blurAmount', value)}
            />
            <PreviewSlider
              title="Unfocused Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.unfocusedOpacity}
              onChange={value => updateProp('unfocusedOpacity', value)}
            />
            <PreviewSlider
              title="Corner Size"
              min={6}
              max={40}
              step={1}
              value={settings.cornerSize}
              valueUnit="px"
              isDisabled={settings.focusStyle !== 'brackets'}
              onChange={value => updateProp('cornerSize', value)}
            />
            <PreviewSlider
              title="Border Width"
              min={1}
              max={8}
              step={0.5}
              value={settings.borderWidth}
              valueUnit="px"
              isDisabled={settings.focusStyle === 'highlight'}
              onChange={value => updateProp('borderWidth', value)}
            />
            <PreviewInput
              title="Sentence"
              value={settings.sentence}
              placeholder="True Focus"
              maxLength={40}
              onChange={value => updateProp('sentence', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={trueFocus} componentName="TrueFocus" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TrueFocusDemo;
