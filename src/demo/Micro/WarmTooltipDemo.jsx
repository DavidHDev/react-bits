import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Image01Icon,
  Link01Icon,
  MoreHorizontalIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon
} from '@hugeicons/core-free-icons';
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

import WarmTooltip, { WarmTooltipGroup } from '../../content/Micro/WarmTooltip/WarmTooltip';
import { warmTooltip } from '../../constants/code/Micro/warmTooltipCode';

const DEFAULT_PROPS = {
  side: 'top',
  surfaceColor: '#f5f5f5',
  inkColor: '#18181b',
  size: 'md',
  radius: 8,
  gap: 8,
  arrow: true,
  delay: 400,
  warmWindow: 300,
  travel: 320,
  popDuration: 160,
  popScale: 0.94,
  popBlur: 4,
  lean: false,
  showFuse: false
};

const TOOLS = [
  { name: 'Bold', label: 'Bold', shortcut: '⌘B', icon: TextBoldIcon },
  { name: 'Italic', label: 'Italic', shortcut: '⌘I', icon: TextItalicIcon },
  { name: 'Underline', label: 'Underline', shortcut: '⌘U', icon: TextUnderlineIcon },
  { name: 'Link', label: 'Add link', shortcut: '⌘K', icon: Link01Icon },
  { name: 'Insert image', label: 'Insert image', icon: Image01Icon },
  { name: 'More', label: 'More options', icon: MoreHorizontalIcon }
];

const SIDE_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const WarmTooltipDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    side,
    surfaceColor,
    inkColor,
    size,
    radius,
    gap,
    arrow,
    delay,
    warmWindow,
    travel,
    popDuration,
    popScale,
    popBlur,
    lean,
    showFuse
  } = props;

  const renderedSurface = useColorModeValue(
    surfaceColor === DEFAULT_PROPS.surfaceColor ? '#18181b' : surfaceColor,
    surfaceColor
  );
  const renderedInk = useColorModeValue(inkColor === DEFAULT_PROPS.inkColor ? '#ffffff' : inkColor, inkColor);
  const toolbarBg = useColorModeValue('#f6f6f6', '#232326');
  const vertical = side === 'left' || side === 'right';

  const propData = useMemo(
    () => [
      { name: 'content', type: 'ReactNode', default: '-', description: 'The label. Keep it to a few words.' },
      {
        name: 'shortcut',
        type: 'ReactNode',
        default: 'undefined',
        description: 'Optional keyboard shortcut, drawn as a keycap beside the label.'
      },
      {
        name: 'children',
        type: 'ReactElement',
        default: '-',
        description: 'The trigger. It only receives aria-describedby; its own handlers and focus ring stay untouched.'
      },
      {
        name: 'side',
        type: '"top" | "bottom" | "left" | "right"',
        default: '"top"',
        description: 'The edge the label hangs from; also where the fuse runs and the pop originates.'
      },
      {
        name: 'delay',
        type: 'number',
        default: '400',
        description: 'How long a cold open waits, in milliseconds. Inherits the group value when omitted.'
      },
      {
        name: 'warmWindow',
        type: 'number',
        default: '300',
        description: 'How long after this label closes the group stays warm. Inherits the group value when omitted.'
      },
      { name: 'surfaceColor', type: 'string', default: '"#f5f5f5"', description: 'Label background, arrow and fuse.' },
      {
        name: 'inkColor',
        type: 'string',
        default: '"#18181b"',
        description: 'Label text; the keycap is tinted from it.'
      },
      { name: 'size', type: '"sm" | "md" | "lg"', default: '"md"', description: 'Font size and padding of the label.' },
      { name: 'radius', type: 'number', default: '8', description: 'Corner radius of the label in pixels.' },
      { name: 'gap', type: 'number', default: '8', description: 'Distance between the trigger edge and the label.' },
      { name: 'arrow', type: 'boolean', default: 'true', description: 'Shows the pointer on the anchored edge.' },
      {
        name: 'popDuration',
        type: 'number',
        default: '160',
        description: 'Cold pop-in time in milliseconds; the exit takes 0.8 of it.'
      },
      {
        name: 'popScale',
        type: 'number',
        default: '0.94',
        description: 'Scale the label pops from. 1 makes it a fade.'
      },
      { name: 'popBlur', type: 'number', default: '4', description: 'Blur in pixels the label arrives through.' },
      {
        name: 'showFuse',
        type: 'boolean',
        default: 'false',
        description:
          'Draws a thin line along the trigger edge that fills over the delay, or over the long press on touch.'
      },
      {
        name: 'longPress',
        type: 'number',
        default: '500',
        description: 'Hold time in milliseconds that opens the label on touch; the click that follows is swallowed.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'No open path; an open label closes.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the trigger wrapper.' },
      {
        name: 'WarmTooltipGroup',
        type: 'component',
        default: '-',
        description:
          'Wraps a toolbar so its tooltips share one label. Props: delay (400), warmWindow (300), travel (320, how long the label takes to glide to the next trigger; 0 hops), lean (0, degrees of tilt while gliding), onWarmChange. Its ref exposes reset().'
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
            <WarmTooltipGroup
              key={`${delay}-${warmWindow}-${travel}-${lean}`}
              delay={delay}
              warmWindow={warmWindow}
              travel={travel}
              lean={lean ? 10 : 0}
            >
              <Box
                display="flex"
                flexDirection={vertical ? 'column' : 'row'}
                gap="2px"
                p="6px"
                borderRadius="14px"
                bg={toolbarBg}
              >
                {TOOLS.map(tool => (
                  <WarmTooltip
                    key={tool.name}
                    content={tool.label}
                    shortcut={tool.shortcut}
                    side={side}
                    surfaceColor={renderedSurface}
                    inkColor={renderedInk}
                    size={size}
                    radius={radius}
                    gap={gap}
                    arrow={arrow}
                    popDuration={popDuration}
                    popScale={popScale}
                    popBlur={popBlur}
                    showFuse={showFuse}
                  >
                    <Box
                      as="button"
                      type="button"
                      aria-label={tool.name}
                      display="grid"
                      placeItems="center"
                      w="44px"
                      h="44px"
                      border="0"
                      borderRadius="10px"
                      bg="transparent"
                      color="var(--text-primary)"
                      cursor="pointer"
                      transition="background-color 120ms ease"
                      _hover={{ bg: 'var(--surface-ghost)' }}
                      _focusVisible={{ outline: '2px solid var(--text-primary)', outlineOffset: '2px' }}
                    >
                      <HugeiconsIcon icon={tool.icon} size={20} strokeWidth={1.8} />
                    </Box>
                  </WarmTooltip>
                ))}
              </Box>
            </WarmTooltipGroup>
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Surface"
              color={renderedSurface}
              onChange={val => updateProp('surfaceColor', val)}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedInk} onChange={val => updateProp('inkColor', val)} />
            <PreviewSelect
              title="Side"
              options={SIDE_OPTIONS}
              value={side}
              onChange={val => updateProp('side', val)}
              width={120}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={size}
              onChange={val => updateProp('size', val)}
              width={120}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={16}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Gap"
              min={2}
              max={20}
              step={1}
              value={gap}
              valueUnit="px"
              onChange={val => updateProp('gap', val)}
            />
            <PreviewSwitch title="Arrow" isChecked={arrow} onChange={val => updateProp('arrow', val)} />
            <PreviewSlider
              title="Delay"
              min={0}
              max={1000}
              step={50}
              value={delay}
              valueUnit="ms"
              onChange={val => updateProp('delay', val)}
            />
            <PreviewSlider
              title="Warm Window"
              min={0}
              max={2000}
              step={50}
              value={warmWindow}
              valueUnit="ms"
              onChange={val => updateProp('warmWindow', val)}
            />
            <PreviewSlider
              title="Travel"
              min={0}
              max={800}
              step={20}
              value={travel}
              valueUnit="ms"
              onChange={val => updateProp('travel', val)}
            />
            <PreviewSlider
              title="Pop Duration"
              min={0}
              max={300}
              step={5}
              value={popDuration}
              valueUnit="ms"
              onChange={val => updateProp('popDuration', val)}
            />
            <PreviewSlider
              title="Pop Scale"
              min={0.8}
              max={1}
              step={0.01}
              value={popScale}
              onChange={val => updateProp('popScale', val)}
            />
            <PreviewSlider
              title="Pop Blur"
              min={0}
              max={12}
              step={1}
              value={popBlur}
              valueUnit="px"
              onChange={val => updateProp('popBlur', val)}
            />
            <PreviewSwitch title="Lean" isChecked={lean} onChange={val => updateProp('lean', val)} />
            <PreviewSwitch title="Show Fuse" isChecked={showFuse} onChange={val => updateProp('showFuse', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={warmTooltip} componentName="WarmTooltip" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default WarmTooltipDemo;
