import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import RubberSegment from '../../content/Micro/RubberSegment/RubberSegment';
import { rubberSegment } from '../../constants/code/Micro/rubberSegmentCode';

const DEFAULT_PROPS = {
  preset: 'periods',
  trackColor: '#27272a',
  thumbColor: '#fafafa',
  textColor: '#fafafa',
  activeTextColor: '#18181b',
  size: 'md',
  radius: 10,
  inset: 3,
  equalSlots: true,
  stretch: 100,
  squash: 3,
  speed: 1,
  glide: 75,
  draggable: true,
  disabled: false
};

const PRESETS = {
  periods: ['Day', 'Week', 'Month', 'Year'],
  views: ['List', 'Board', 'Calendar'],
  sizes: ['S', 'M', 'L', 'XL', 'XXL']
};

const PRESET_OPTIONS = [
  { value: 'periods', label: 'Day / Week / Month / Year' },
  { value: 'views', label: 'List / Board / Calendar' },
  { value: 'sizes', label: 'S / M / L / XL / XXL' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const RubberSegmentDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    preset,
    trackColor,
    thumbColor,
    textColor,
    activeTextColor,
    size,
    radius,
    inset,
    equalSlots,
    stretch,
    squash,
    speed,
    glide,
    draggable,
    disabled
  } = props;

  const renderedTrack = useColorModeValue(trackColor === DEFAULT_PROPS.trackColor ? '#f6f6f6' : trackColor, trackColor);
  const renderedThumb = useColorModeValue(thumbColor === DEFAULT_PROPS.thumbColor ? '#18181b' : thumbColor, thumbColor);
  const renderedText = useColorModeValue(textColor === DEFAULT_PROPS.textColor ? '#18181b' : textColor, textColor);
  const renderedActiveText = useColorModeValue(
    activeTextColor === DEFAULT_PROPS.activeTextColor ? '#fafafa' : activeTextColor,
    activeTextColor
  );

  const items = PRESETS[preset] || PRESETS.periods;

  const propData = useMemo(
    () => [
      {
        name: 'items',
        type: '(string | { value: string; label: ReactNode; icon?: ReactNode })[]',
        default: '-',
        description: 'The slots, in order. A string is both value and label.'
      },
      {
        name: 'value',
        type: 'string',
        default: 'undefined',
        description: 'Controlled value. A change from outside jumps the thumb without animation.'
      },
      {
        name: 'defaultValue',
        type: 'string',
        default: 'undefined',
        description: 'Initial value when uncontrolled; the first item if omitted.'
      },
      {
        name: 'onChange',
        type: '(value: string, index: number) => void',
        default: '-',
        description: 'Called on a tap, on a drag release and on every arrow key.'
      },
      { name: 'trackColor', type: 'string', default: '"#27272a"', description: 'The well behind the slots.' },
      {
        name: 'thumbColor',
        type: 'string',
        default: '"#fafafa"',
        description: 'The rubber thumb, and the focus ring.'
      },
      { name: 'textColor', type: 'string', default: '"#fafafa"', description: 'Idle labels, drawn at 70%.' },
      {
        name: 'activeTextColor',
        type: 'string',
        default: '"#18181b"',
        description: 'The label revealed inside the thumb.'
      },
      {
        name: 'size',
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: 'Track height 28, 36 or 44 pixels; font and padding follow.'
      },
      { name: 'radius', type: 'number', default: '10', description: 'Track corner radius in pixels.' },
      {
        name: 'inset',
        type: 'number',
        default: '3',
        description: 'Gap between the thumb and the track edge; the thumb corner is radius minus inset.'
      },
      {
        name: 'equalSlots',
        type: 'boolean',
        default: 'true',
        description: 'Every slot the same width. Off, slots hug their labels and the thumb changes width per slot.'
      },
      {
        name: 'stretch',
        type: 'number',
        default: '100',
        description: 'How far a tap dilates the thumb across old and new slot before it contracts. 0 is a plain slide.'
      },
      {
        name: 'squash',
        type: 'number',
        default: '3',
        description: 'Pixels the trailing edge lands past the slot edge before relaxing. 0 removes the squash.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '1',
        description: 'Scales every phase together; 0.25 is slow motion.'
      },
      {
        name: 'glide',
        type: 'number',
        default: '75',
        description: 'How far a flick carries the thumb before it snaps. 0 always lands on the nearest slot.'
      },
      {
        name: 'draggable',
        type: 'boolean',
        default: 'true',
        description: 'Lets the thumb be grabbed, dragged and flicked.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the control and ignores input.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the track.' },
      {
        name: 'aria-label',
        type: 'string',
        default: '"Segmented control"',
        description: 'Accessible name of the radio group.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={400}
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <RubberSegment
              key={preset}
              items={items}
              defaultValue={items[1]}
              trackColor={renderedTrack}
              thumbColor={renderedThumb}
              textColor={renderedText}
              activeTextColor={renderedActiveText}
              size={size}
              radius={radius}
              inset={inset}
              equalSlots={equalSlots}
              stretch={stretch}
              squash={squash}
              speed={speed}
              glide={glide}
              draggable={draggable}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Items"
              options={PRESET_OPTIONS}
              value={preset}
              onChange={val => updateProp('preset', val)}
              width={220}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={size}
              onChange={val => updateProp('size', val)}
              width={120}
            />
            <PreviewColorPickerCustom
              title="Track"
              color={renderedTrack}
              onChange={val => updateProp('trackColor', val)}
            />
            <PreviewColorPickerCustom
              title="Thumb"
              color={renderedThumb}
              onChange={val => updateProp('thumbColor', val)}
            />
            <PreviewColorPickerCustom
              title="Text"
              color={renderedText}
              onChange={val => updateProp('textColor', val)}
            />
            <PreviewColorPickerCustom
              title="Active Text"
              color={renderedActiveText}
              onChange={val => updateProp('activeTextColor', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={24}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Inset"
              min={1}
              max={8}
              step={1}
              value={inset}
              valueUnit="px"
              onChange={val => updateProp('inset', val)}
            />
            <PreviewSwitch title="Equal Slots" isChecked={equalSlots} onChange={val => updateProp('equalSlots', val)} />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={100}
              step={5}
              value={stretch}
              onChange={val => updateProp('stretch', val)}
            />
            <PreviewSlider
              title="Squash"
              min={0}
              max={6}
              step={0.5}
              value={squash}
              valueUnit="px"
              onChange={val => updateProp('squash', val)}
            />
            <PreviewSlider
              title="Speed"
              min={0.25}
              max={2}
              step={0.05}
              value={speed}
              valueUnit="x"
              onChange={val => updateProp('speed', val)}
            />
            <PreviewSlider
              title="Glide"
              min={0}
              max={100}
              step={5}
              value={glide}
              onChange={val => updateProp('glide', val)}
            />
            <PreviewSwitch title="Draggable" isChecked={draggable} onChange={val => updateProp('draggable', val)} />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={rubberSegment} componentName="RubberSegment" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default RubberSegmentDemo;
