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
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import ScrubField from '../../content/Micro/ScrubField/ScrubField';
import { scrubField } from '../../constants/code/Micro/scrubFieldCode';

const DEFAULT_PROPS = {
  accent: '#f5f5f5',
  chipColor: '#27272a',
  label: 'Radius',
  suffix: 'px',
  defaultValue: 24,
  min: 0,
  max: 100,
  step: 1,
  size: 'lg',
  sensitivity: 2,
  rubberReach: 8,
  returnDuration: 300,
  coarseMultiplier: 10,
  fineMultiplier: 0.1,
  showDelta: true,
  showDirty: false,
  showFill: true,
  disabled: false
};

const STEP_OPTIONS = [
  { value: 0.1, label: '0.1' },
  { value: 0.5, label: '0.5' },
  { value: 1, label: '1' },
  { value: 5, label: '5' },
  { value: 10, label: '10' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const ScrubFieldDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    accent,
    chipColor,
    label,
    suffix,
    defaultValue,
    min,
    max,
    step,
    size,
    sensitivity,
    rubberReach,
    returnDuration,
    coarseMultiplier,
    fineMultiplier,
    showDelta,
    showDirty,
    showFill,
    disabled
  } = props;
  const renderedAccent = useColorModeValue(accent === DEFAULT_PROPS.accent ? '#18181b' : accent, accent);
  const renderedChip = useColorModeValue(chipColor === DEFAULT_PROPS.chipColor ? '#f6f6f6' : chipColor, chipColor);

  const propData = useMemo(
    () => [
      {
        name: 'label',
        type: 'string',
        default: '"Radius"',
        description: 'The field name. Drag anywhere on the chip to scrub; click without moving to type.'
      },
      {
        name: 'suffix',
        type: 'string',
        default: '"px"',
        description: 'Unit after the number, also read by screen readers.'
      },
      {
        name: 'value',
        type: 'number',
        default: 'undefined',
        description: 'Controlled value; changes from outside land without motion.'
      },
      {
        name: 'defaultValue',
        type: 'number',
        default: '24',
        description: 'Initial value and the dirty baseline: the ring turns off exactly here.'
      },
      { name: 'min', type: 'number', default: '0', description: 'Lower bound; the rubber band starts here.' },
      { name: 'max', type: 'number', default: '100', description: 'Upper bound; the rubber band starts here.' },
      {
        name: 'step',
        type: 'number',
        default: '1',
        description: 'Granularity of drag and arrows; sets the decimals shown.'
      },
      { name: 'size', type: '"sm" | "md" | "lg"', default: '"md"', description: 'Chip height 28, 34 or 44 pixels.' },
      {
        name: 'sensitivity',
        type: 'number',
        default: '2',
        description: 'Pixels of travel per step. 1 is twitchy, 6 is precise.'
      },
      {
        name: 'rubberReach',
        type: 'number',
        default: '8',
        description: 'How far past a bound the number can be pushed, as a percent of the range. 0 is a hard stop.'
      },
      {
        name: 'returnDuration',
        type: 'number',
        default: '300',
        description: 'Duration in milliseconds of the critically damped snap back to the bound.'
      },
      {
        name: 'coarseMultiplier',
        type: 'number',
        default: '10',
        description: 'Step multiplier while Shift is held, and for Page Up and Page Down.'
      },
      {
        name: 'fineMultiplier',
        type: 'number',
        default: '0.1',
        description: 'Step multiplier while Alt or Option is held; adds a decimal.'
      },
      {
        name: 'showDelta',
        type: 'boolean',
        default: 'true',
        description: 'Shows the signed change in a pill riding the pointer.'
      },
      {
        name: 'showDirty',
        type: 'boolean',
        default: 'false',
        description: 'Rings the chip while the value differs from the default.'
      },
      {
        name: 'showFill',
        type: 'boolean',
        default: 'true',
        description: 'Fills the chip from the left in proportion to where the value sits in the range.'
      },
      {
        name: 'accent',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'Fill band, dirty ring and delta pill.'
      },
      {
        name: 'chipColor',
        type: 'string',
        default: '"#27272a"',
        description: 'Chip surface. Text inherits from the page.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the chip and ignores input.' },
      {
        name: 'onChange',
        type: '(value: number) => void',
        default: '-',
        description: 'Called on every step, key and typed commit.'
      },
      {
        name: 'onCommit',
        type: '(value: number) => void',
        default: '-',
        description: 'Called on release, on a key step and on blur or Enter.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the chip.' }
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
            <ScrubField
              key={`${min}-${max}-${step}`}
              label={label}
              suffix={suffix}
              defaultValue={defaultValue}
              min={min}
              max={max}
              step={step}
              size={size}
              sensitivity={sensitivity}
              rubberReach={rubberReach}
              returnDuration={returnDuration}
              coarseMultiplier={coarseMultiplier}
              fineMultiplier={fineMultiplier}
              showDelta={showDelta}
              showDirty={showDirty}
              showFill={showFill}
              accent={renderedAccent}
              chipColor={renderedChip}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent}
              onChange={val => updateProp('accent', val)}
            />
            <PreviewColorPickerCustom
              title="Chip"
              color={renderedChip}
              onChange={val => updateProp('chipColor', val)}
            />
            <PreviewInput title="Label" value={label} maxLength={14} onChange={val => updateProp('label', val)} />
            <PreviewInput title="Suffix" value={suffix} maxLength={4} onChange={val => updateProp('suffix', val)} />
            <PreviewSlider
              title="Default"
              min={0}
              max={100}
              step={1}
              value={defaultValue}
              onChange={val => updateProp('defaultValue', val)}
            />
            <PreviewSlider
              title="Min"
              min={-100}
              max={0}
              step={10}
              value={min}
              onChange={val => updateProp('min', val)}
            />
            <PreviewSlider
              title="Max"
              min={10}
              max={500}
              step={10}
              value={max}
              onChange={val => updateProp('max', val)}
            />
            <PreviewSelect
              title="Step"
              options={STEP_OPTIONS}
              value={step}
              onChange={val => updateProp('step', Number(val))}
              width={100}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={size}
              onChange={val => updateProp('size', val)}
              width={120}
            />
            <PreviewSlider
              title="Sensitivity"
              min={1}
              max={8}
              step={1}
              value={sensitivity}
              valueUnit="px"
              onChange={val => updateProp('sensitivity', val)}
            />
            <PreviewSlider
              title="Rubber Reach"
              min={0}
              max={25}
              step={1}
              value={rubberReach}
              valueUnit="%"
              onChange={val => updateProp('rubberReach', val)}
            />
            <PreviewSlider
              title="Return"
              min={150}
              max={600}
              step={10}
              value={returnDuration}
              valueUnit="ms"
              onChange={val => updateProp('returnDuration', val)}
            />
            <PreviewSlider
              title="Coarse"
              min={2}
              max={20}
              step={1}
              value={coarseMultiplier}
              valueUnit="x"
              onChange={val => updateProp('coarseMultiplier', val)}
            />
            <PreviewSlider
              title="Fine"
              min={0.05}
              max={0.5}
              step={0.05}
              value={fineMultiplier}
              valueUnit="x"
              onChange={val => updateProp('fineMultiplier', val)}
            />
            <PreviewSwitch title="Ghost Delta" isChecked={showDelta} onChange={val => updateProp('showDelta', val)} />
            <PreviewSwitch title="Dirty Ring" isChecked={showDirty} onChange={val => updateProp('showDirty', val)} />
            <PreviewSwitch title="Fill" isChecked={showFill} onChange={val => updateProp('showFill', val)} />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scrubField} componentName="ScrubField" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ScrubFieldDemo;
