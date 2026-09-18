import { useMemo, useState } from 'react';
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

import GlideSelect from '../../content/Micro/GlideSelect/GlideSelect';
import { glideSelect } from '../../constants/code/Micro/glideSelectCode';

const OPTION_SETS = {
  formats: [
    { value: 'png', label: 'PNG', tag: 'Lossless' },
    { value: 'jpg', label: 'JPG', tag: 'Smallest' },
    { value: 'webp', label: 'WebP', tag: 'Modern' },
    { value: 'svg', label: 'SVG', tag: 'Vector' },
    { value: 'pdf', label: 'PDF', tag: 'Print' }
  ],
  regions: [
    { value: 'us-east', label: 'US East', tag: 'Virginia' },
    { value: 'us-west', label: 'US West', tag: 'Oregon' },
    { value: 'eu', label: 'EU', tag: 'Frankfurt' },
    { value: 'asia', label: 'Asia', tag: 'Singapore' }
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
};
const firstOf = set => (typeof set[0] === 'string' ? set[0] : set[0].value);

const DEFAULT_PROPS = {
  options: 'formats',
  size: 'md',
  accentColor: '#f5f5f5',
  surfaceColor: '#27272a',
  highlightColor: '#3f3f46',
  textColor: '#f5f5f5',
  radius: 10,
  menuWidth: 176,
  placement: 'bottom',
  align: 'left',
  popDuration: 180,
  glideDuration: 220,
  rememberPosition: true,
  showTags: true,
  disabled: false
};

const OPTION_OPTIONS = [
  { value: 'formats', label: 'Formats' },
  { value: 'regions', label: 'Regions' },
  { value: 'sizes', label: 'Sizes' }
];
const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];
const PLACEMENT_OPTIONS = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' }
];
const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const GlideSelectDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    options,
    size,
    accentColor,
    surfaceColor,
    highlightColor,
    textColor,
    radius,
    menuWidth,
    placement,
    align,
    popDuration,
    glideDuration,
    rememberPosition,
    showTags,
    disabled
  } = props;
  const set = OPTION_SETS[options] ?? OPTION_SETS.formats;
  const [value, setValue] = useState(() => firstOf(set));
  const known = set.some(o => (typeof o === 'string' ? o : o.value) === value);
  const current = known ? value : firstOf(set);

  const renderedAccent = useColorModeValue(
    accentColor === DEFAULT_PROPS.accentColor ? '#18181b' : accentColor,
    accentColor
  );
  const renderedSurface = useColorModeValue(
    surfaceColor === DEFAULT_PROPS.surfaceColor ? '#f6f6f6' : surfaceColor,
    surfaceColor
  );
  const renderedHighlight = useColorModeValue(
    highlightColor === DEFAULT_PROPS.highlightColor ? '#e4e4e7' : highlightColor,
    highlightColor
  );
  const renderedText = useColorModeValue(textColor === DEFAULT_PROPS.textColor ? '#18181b' : textColor, textColor);

  const propData = useMemo(
    () => [
      {
        name: 'options',
        type: '(string | { value: string; label: ReactNode; tag?: string })[]',
        default: '["One", "Two", "Three"]',
        description: 'The rows. A string is both value and label; a tag shows muted at the right.'
      },
      {
        name: 'value',
        type: 'string',
        default: 'undefined',
        description: 'Controlled value. Outside changes never animate.'
      },
      { name: 'defaultValue', type: 'string', default: 'undefined', description: 'Initial value when uncontrolled.' },
      {
        name: 'onChange',
        type: '(value: string, option) => void',
        default: '-',
        description: 'Called on a pick that changes the value.'
      },
      {
        name: 'placeholder',
        type: 'string',
        default: '"Select…"',
        description: 'Chip text while nothing is selected.'
      },
      { name: 'showTags', type: 'boolean', default: 'true', description: "Shows each row's tag." },
      { name: 'accentColor', type: 'string', default: '"#f5f5f5"', description: 'The check on the selected row.' },
      { name: 'surfaceColor', type: 'string', default: '"#27272a"', description: 'Chip and menu background.' },
      {
        name: 'highlightColor',
        type: 'string',
        default: '"#3f3f46"',
        description: 'The gliding pill. The selected row rests on it at 60%, and the chip tint derives from it.'
      },
      {
        name: 'textColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'Labels. Tags and the chevron derive from it.'
      },
      {
        name: 'size',
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: 'Chip 28, 32 or 44 pixels with matching rows. Large is the touch-first size.'
      },
      {
        name: 'radius',
        type: 'number',
        default: '10',
        description: 'Menu corner in pixels. Chip, rows and pill use 4 less so they stay concentric.'
      },
      {
        name: 'menuWidth',
        type: 'number',
        default: '176',
        description: 'Menu width in pixels, never narrower than the chip.'
      },
      {
        name: 'placement',
        type: '"top" | "bottom"',
        default: '"bottom"',
        description: 'Which side the menu grows on. It flips when the chosen side would leave the viewport.'
      },
      { name: 'align', type: '"left" | "right"', default: '"left"', description: 'Which chip edge the menu shares.' },
      {
        name: 'popDuration',
        type: 'number',
        default: '180',
        description: 'Milliseconds the menu takes to grow out of its corner. It leaves in two thirds of that.'
      },
      {
        name: 'glideDuration',
        type: 'number',
        default: '220',
        description: 'Milliseconds the pill takes to travel between rows. 0 is a conventional hover.'
      },
      {
        name: 'rememberPosition',
        type: 'boolean',
        default: 'true',
        description:
          'The highlight stays on the row the pointer left, so re-entry glides from there. Off, it clears on leave and the selected row shows again.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the chip and ignores input.' },
      { name: 'ariaLabel', type: 'string', default: '"Select"', description: 'Accessible name of the chip and list.' },
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
            h={480}
            overflow="visible"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <GlideSelect
              key={options}
              options={set}
              value={current}
              onChange={setValue}
              ariaLabel="Export format"
              showTags={showTags}
              accentColor={renderedAccent}
              surfaceColor={renderedSurface}
              highlightColor={renderedHighlight}
              textColor={renderedText}
              size={size}
              radius={radius}
              menuWidth={menuWidth}
              placement={placement}
              align={align}
              popDuration={popDuration}
              glideDuration={glideDuration}
              rememberPosition={rememberPosition}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Options"
              options={OPTION_OPTIONS}
              value={options}
              onChange={val => {
                updateProp('options', val);
                setValue(firstOf(OPTION_SETS[val] ?? OPTION_SETS.formats));
              }}
              width={120}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={size}
              onChange={val => updateProp('size', val)}
              width={120}
            />
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent}
              onChange={val => updateProp('accentColor', val)}
            />
            <PreviewColorPickerCustom
              title="Surface"
              color={renderedSurface}
              onChange={val => updateProp('surfaceColor', val)}
            />
            <PreviewColorPickerCustom
              title="Highlight"
              color={renderedHighlight}
              onChange={val => updateProp('highlightColor', val)}
            />
            <PreviewColorPickerCustom
              title="Text"
              color={renderedText}
              onChange={val => updateProp('textColor', val)}
            />
            <PreviewSlider
              title="Radius"
              min={6}
              max={20}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Menu Width"
              min={140}
              max={280}
              step={4}
              value={menuWidth}
              valueUnit="px"
              onChange={val => updateProp('menuWidth', val)}
            />
            <PreviewSelect
              title="Placement"
              options={PLACEMENT_OPTIONS}
              value={placement}
              onChange={val => updateProp('placement', val)}
              width={120}
            />
            <PreviewSelect
              title="Align"
              options={ALIGN_OPTIONS}
              value={align}
              onChange={val => updateProp('align', val)}
              width={110}
            />
            <PreviewSlider
              title="Pop"
              min={0}
              max={400}
              step={10}
              value={popDuration}
              valueUnit="ms"
              onChange={val => updateProp('popDuration', val)}
            />
            <PreviewSlider
              title="Glide"
              min={0}
              max={400}
              step={10}
              value={glideDuration}
              valueUnit="ms"
              onChange={val => updateProp('glideDuration', val)}
            />
            <PreviewSwitch
              title="Remember Position"
              isChecked={rememberPosition}
              onChange={val => updateProp('rememberPosition', val)}
            />
            <PreviewSwitch title="Show Tags" isChecked={showTags} onChange={val => updateProp('showTags', val)} />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={glideSelect} componentName="GlideSelect" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GlideSelectDemo;
