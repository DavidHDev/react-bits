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

import JellyRadio from '../../content/Micro/JellyRadio/JellyRadio';
import { jellyRadio } from '../../constants/code/Micro/jellyRadioCode';

const ITEM_SETS = {
  levels: ['Off', 'Low', 'Medium', 'High', 'Max'],
  heat: ['Mild', 'Medium', 'Hot'],
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
};
const middleOf = set => set[Math.floor(set.length / 2)];

const DEFAULT_PROPS = {
  items: 'levels',
  size: 'md',
  chipColor: '#27272a',
  activeColor: '#f5f5f5',
  textColor: '#f5f5f5',
  activeTextColor: '#18181b',
  gap: 8,
  radius: 18,
  swell: 0.2,
  barge: 6,
  shrink: 0.05,
  jelly: 1,
  bounce: 0.25,
  stagger: 22,
  stiffness: 580,
  disabled: false
};

const ITEM_OPTIONS = [
  { value: 'levels', label: 'Levels' },
  { value: 'heat', label: 'Heat' },
  { value: 'days', label: 'Days' }
];
const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const JellyRadioDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    items,
    size,
    chipColor,
    activeColor,
    textColor,
    activeTextColor,
    gap,
    radius,
    swell,
    barge,
    shrink,
    jelly,
    bounce,
    stagger,
    stiffness,
    disabled
  } = props;
  const set = ITEM_SETS[items] ?? ITEM_SETS.levels;
  const [value, setValue] = useState(() => middleOf(set));
  const current = set.includes(value) ? value : middleOf(set);

  const renderedChip = useColorModeValue(chipColor === DEFAULT_PROPS.chipColor ? '#f6f6f6' : chipColor, chipColor);
  const renderedActive = useColorModeValue(
    activeColor === DEFAULT_PROPS.activeColor ? '#18181b' : activeColor,
    activeColor
  );
  const renderedText = useColorModeValue(textColor === DEFAULT_PROPS.textColor ? '#18181b' : textColor, textColor);
  const renderedActiveText = useColorModeValue(
    activeTextColor === DEFAULT_PROPS.activeTextColor ? '#ffffff' : activeTextColor,
    activeTextColor
  );

  const propData = useMemo(
    () => [
      {
        name: 'items',
        type: '(string | { value: string; label: ReactNode; icon?: ReactNode; disabled?: boolean })[]',
        default: '["Off", "Low", "Medium", "High", "Max"]',
        description: 'The chips. A string is both value and label.'
      },
      { name: 'value', type: 'string', default: 'undefined', description: 'Controlled value. Outside changes jump.' },
      {
        name: 'defaultValue',
        type: 'string',
        default: 'undefined',
        description: 'Initial value when uncontrolled. Falls back to the first item.'
      },
      {
        name: 'onChange',
        type: '(value: string, index: number) => void',
        default: '-',
        description: 'Called on the commit, before the motion ends.'
      },
      { name: 'chipColor', type: 'string', default: '"#27272a"', description: 'Surface of an unchosen chip.' },
      { name: 'activeColor', type: 'string', default: '"#f5f5f5"', description: 'Surface of the chosen chip.' },
      {
        name: 'textColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'Label of an unchosen chip, and the hover tone.'
      },
      { name: 'activeTextColor', type: 'string', default: '"#18181b"', description: 'Label of the chosen chip.' },
      {
        name: 'size',
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: 'Chip height 28, 36 or 44 pixels. Large is the touch-first size.'
      },
      { name: 'gap', type: 'number', default: '8', description: 'Rest spacing between chips in pixels.' },
      {
        name: 'radius',
        type: 'number',
        default: '18',
        description: 'Corner radius in pixels. 18 is a pill at medium.'
      },
      {
        name: 'swell',
        type: 'number',
        default: '0.2',
        description: 'How much the chosen chip grows. It also sets the room the neighbours make.'
      },
      {
        name: 'barge',
        type: 'number',
        default: '6',
        description: 'Extra pixels every neighbour is shoved beyond that room. 0 only makes room.'
      },
      { name: 'shrink', type: 'number', default: '0.05', description: 'How much every unchosen chip gives up.' },
      {
        name: 'jelly',
        type: 'number',
        default: '1',
        description: 'The wide-before-tall split. 0 swells uniformly, 1.5 exaggerates it.'
      },
      {
        name: 'bounce',
        type: 'number',
        default: '0.25',
        description: 'One minus the damping ratio. 0 arrives and stops, 0.4 rings.'
      },
      {
        name: 'stagger',
        type: 'number',
        default: '22',
        description: 'Milliseconds per row step before a neighbour moves. 0 moves the row as a slab.'
      },
      {
        name: 'stiffness',
        type: 'number',
        default: '580',
        description: 'Spring stiffness of the chosen chip. Neighbours soften from it with distance.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Fades the group and ignores input.' },
      { name: 'ariaLabel', type: 'string', default: '"Options"', description: 'Accessible name of the group.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the group.' }
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
            <JellyRadio
              items={set}
              value={current}
              onChange={setValue}
              chipColor={renderedChip}
              activeColor={renderedActive}
              textColor={renderedText}
              activeTextColor={renderedActiveText}
              size={size}
              gap={gap}
              radius={radius}
              swell={swell}
              barge={barge}
              shrink={shrink}
              jelly={jelly}
              bounce={bounce}
              stagger={stagger}
              stiffness={stiffness}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Items"
              options={ITEM_OPTIONS}
              value={items}
              onChange={val => {
                updateProp('items', val);
                setValue(middleOf(ITEM_SETS[val] ?? ITEM_SETS.levels));
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
              title="Chip"
              color={renderedChip}
              onChange={val => updateProp('chipColor', val)}
            />
            <PreviewColorPickerCustom
              title="Active"
              color={renderedActive}
              onChange={val => updateProp('activeColor', val)}
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
              title="Gap"
              min={4}
              max={20}
              step={1}
              value={gap}
              valueUnit="px"
              onChange={val => updateProp('gap', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={22}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Swell"
              min={0.05}
              max={0.4}
              step={0.01}
              value={swell}
              onChange={val => updateProp('swell', val)}
            />
            <PreviewSlider
              title="Barge"
              min={0}
              max={20}
              step={1}
              value={barge}
              valueUnit="px"
              onChange={val => updateProp('barge', val)}
            />
            <PreviewSlider
              title="Shrink"
              min={0}
              max={0.15}
              step={0.01}
              value={shrink}
              onChange={val => updateProp('shrink', val)}
            />
            <PreviewSlider
              title="Jelly"
              min={0}
              max={1.5}
              step={0.1}
              value={jelly}
              onChange={val => updateProp('jelly', val)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.4}
              step={0.05}
              value={bounce}
              onChange={val => updateProp('bounce', val)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={60}
              step={2}
              value={stagger}
              valueUnit="ms"
              onChange={val => updateProp('stagger', val)}
            />
            <PreviewSlider
              title="Stiffness"
              min={300}
              max={900}
              step={20}
              value={stiffness}
              onChange={val => updateProp('stiffness', val)}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={jellyRadio} componentName="JellyRadio" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default JellyRadioDemo;
