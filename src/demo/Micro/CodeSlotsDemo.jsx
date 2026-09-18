import { useEffect, useMemo, useRef, useState } from 'react';
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

import CodeSlots from '../../content/Micro/CodeSlots/CodeSlots';
import { codeSlots } from '../../constants/code/Micro/codeSlotsCode';

const DEFAULT_PROPS = {
  accentColor: '#f5f5f5',
  inkColor: '#f5f5f5',
  slotColor: '#27272a',
  digitColor: '#18181b',
  dangerColor: '#ff3b30',
  length: 6,
  mask: false,
  caret: true,
  outcome: 'accept',
  slotSize: 44,
  gap: 8,
  radius: 12,
  bounce: 0.2,
  settle: 0.3,
  rise: 8,
  cascade: 20,
  disabled: false
};

const OUTCOME_OPTIONS = [
  { value: 'accept', label: 'Accept' },
  { value: 'reject', label: 'Reject' }
];

const CodeSlotsDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    accentColor,
    inkColor,
    slotColor,
    digitColor,
    dangerColor,
    length,
    mask,
    caret,
    outcome,
    slotSize,
    gap,
    radius,
    bounce,
    settle,
    rise,
    cascade,
    disabled
  } = props;

  const renderedAccent = useColorModeValue(
    accentColor === DEFAULT_PROPS.accentColor ? '#18181b' : accentColor,
    accentColor
  );
  const renderedInk = useColorModeValue(inkColor === DEFAULT_PROPS.inkColor ? '#18181b' : inkColor, inkColor);
  const renderedSlot = useColorModeValue(slotColor === DEFAULT_PROPS.slotColor ? '#f6f6f6' : slotColor, slotColor);
  const renderedDigit = useColorModeValue(digitColor === DEFAULT_PROPS.digitColor ? '#ffffff' : digitColor, digitColor);

  const [value, setValue] = useState('');
  const [status, setStatus] = useState('idle');
  const timers = useRef([]);
  const later = (fn, ms) => {
    timers.current.push(setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const handleChange = code => {
    setValue(code);
    setStatus('idle');
  };
  const handleComplete = () => {
    later(() => {
      if (outcome === 'reject') {
        setStatus('error');
        return;
      }
      setStatus('success');
      later(() => {
        setValue('');
        setStatus('idle');
      }, 1800);
    }, 350);
  };

  const propData = useMemo(
    () => [
      { name: 'length', type: 'number', default: '6', description: 'Number of slots.' },
      {
        name: 'value',
        type: 'string',
        default: 'undefined',
        description: 'Controlled code. Digits that arrive from outside land with the cascade; digits removed drain.'
      },
      {
        name: 'defaultValue',
        type: 'string',
        default: '""',
        description: 'Uncontrolled initial code, rendered already landed.'
      },
      {
        name: 'onChange',
        type: '(code: string) => void',
        default: '-',
        description: 'Called on every edit, including the clear at the end of a reject.'
      },
      {
        name: 'onComplete',
        type: '(code: string) => void',
        default: '-',
        description: 'Called once when the last hole is filled.'
      },
      {
        name: 'status',
        type: '"idle" | "error" | "success"',
        default: '"idle"',
        description:
          'error drains the slots last to first under the danger tint and clears the code; success merges the fills into one wash and locks the input.'
      },
      { name: 'mask', type: 'boolean', default: 'false', description: 'Shows a dot instead of each digit.' },
      { name: 'caret', type: 'boolean', default: 'true', description: 'Shows the blinking caret in the active slot.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Fades the row and ignores input.' },
      { name: 'autoFocus', type: 'boolean', default: 'false', description: 'Focuses the input on mount.' },
      {
        name: 'accentColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'Fill of a landed digit, the active ring and the success wash.'
      },
      {
        name: 'inkColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'Caret, and the tint of the active slot.'
      },
      { name: 'slotColor', type: 'string', default: '"#27272a"', description: 'Surface of an empty slot.' },
      { name: 'digitColor', type: 'string', default: '"#18181b"', description: 'Digit colour on the fill.' },
      {
        name: 'dangerColor',
        type: 'string',
        default: '"#ff3b30"',
        description: 'Ring and fill colour while status is error.'
      },
      {
        name: 'slotSize',
        type: 'number',
        default: '44',
        description: 'Slot width in pixels. Height and digit size follow it.'
      },
      { name: 'gap', type: 'number', default: '8', description: 'Space between slots in pixels.' },
      {
        name: 'radius',
        type: 'number',
        default: '12',
        description: 'Corner radius in pixels, capped at half the slot size.'
      },
      {
        name: 'bounce',
        type: 'number',
        default: '0.2',
        description: 'Spring overshoot of the landing fill. 0 is critically damped.'
      },
      { name: 'settle', type: 'number', default: '0.3', description: 'Seconds a digit takes to land or drain.' },
      { name: 'rise', type: 'number', default: '8', description: 'Pixels a digit rises into place. 0 fades only.' },
      {
        name: 'cascade',
        type: 'number',
        default: '20',
        description: 'Milliseconds between slots when several land at once or drain on reject.'
      },
      {
        name: 'ariaLabel',
        type: 'string',
        default: '"One-time code"',
        description: 'Accessible name of the input.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
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
            <CodeSlots
              length={length}
              value={value}
              status={status}
              mask={mask}
              caret={caret}
              disabled={disabled}
              accentColor={renderedAccent}
              inkColor={renderedInk}
              slotColor={renderedSlot}
              digitColor={renderedDigit}
              dangerColor={dangerColor}
              slotSize={slotSize}
              gap={gap}
              radius={radius}
              bounce={bounce}
              settle={settle}
              rise={rise}
              cascade={cascade}
              onChange={handleChange}
              onComplete={handleComplete}
            />
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent}
              onChange={val => updateProp('accentColor', val)}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedInk} onChange={val => updateProp('inkColor', val)} />
            <PreviewColorPickerCustom
              title="Slot"
              color={renderedSlot}
              onChange={val => updateProp('slotColor', val)}
            />
            <PreviewColorPickerCustom
              title="Digit"
              color={renderedDigit}
              onChange={val => updateProp('digitColor', val)}
            />
            <PreviewColorPickerCustom
              title="Danger"
              color={dangerColor}
              onChange={val => updateProp('dangerColor', val)}
            />
            <PreviewSlider
              title="Length"
              min={4}
              max={8}
              step={1}
              value={length}
              onChange={val => updateProp('length', val)}
            />
            <PreviewSwitch title="Mask" isChecked={mask} onChange={val => updateProp('mask', val)} />
            <PreviewSwitch title="Caret" isChecked={caret} onChange={val => updateProp('caret', val)} />
            <PreviewSelect
              title="Outcome"
              options={OUTCOME_OPTIONS}
              value={outcome}
              onChange={val => updateProp('outcome', val)}
              width={120}
            />
            <PreviewSlider
              title="Slot Size"
              min={36}
              max={64}
              step={2}
              value={slotSize}
              valueUnit="px"
              onChange={val => updateProp('slotSize', val)}
            />
            <PreviewSlider
              title="Gap"
              min={4}
              max={16}
              step={1}
              value={gap}
              valueUnit="px"
              onChange={val => updateProp('gap', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={32}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.3}
              step={0.05}
              value={bounce}
              onChange={val => updateProp('bounce', val)}
            />
            <PreviewSlider
              title="Settle"
              min={0.2}
              max={0.5}
              step={0.05}
              value={settle}
              valueUnit="s"
              onChange={val => updateProp('settle', val)}
            />
            <PreviewSlider
              title="Rise"
              min={0}
              max={16}
              step={1}
              value={rise}
              valueUnit="px"
              onChange={val => updateProp('rise', val)}
            />
            <PreviewSlider
              title="Cascade"
              min={0}
              max={60}
              step={5}
              value={cascade}
              valueUnit="ms"
              onChange={val => updateProp('cascade', val)}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={codeSlots} componentName="CodeSlots" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CodeSlotsDemo;
