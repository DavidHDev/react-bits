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

import PeekRating from '../../content/Micro/PeekRating/PeekRating';
import { peekRating } from '../../constants/code/Micro/peekRatingCode';

const DEFAULT_PROPS = {
  count: 5,
  shape: 'star',
  showLabels: true,
  activeColor: '#f5b400',
  idleColor: '#52525b',
  tipColor: '#27272a',
  tipTextColor: '#f5f5f5',
  size: 40,
  lift: 8,
  magnify: 1.15,
  riseDuration: 320,
  popScale: 1.3,
  showTip: true,
  allowClear: true,
  readOnly: false
};

const LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Superb', 'Stellar', 'Epic', 'Legendary', 'Mythic', 'Perfect'];

const SHAPE_OPTIONS = [
  { value: 'star', label: 'Star' },
  { value: 'heart', label: 'Heart' },
  { value: 'bolt', label: 'Bolt' }
];

const PeekRatingDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    count,
    shape,
    showLabels,
    activeColor,
    idleColor,
    tipColor,
    tipTextColor,
    size,
    lift,
    magnify,
    riseDuration,
    popScale,
    showTip,
    allowClear,
    readOnly
  } = props;
  const [value, setValue] = useState(3);

  const renderedIdleColor = useColorModeValue(idleColor === DEFAULT_PROPS.idleColor ? '#d4d4d8' : idleColor, idleColor);
  const renderedTipColor = useColorModeValue(tipColor === DEFAULT_PROPS.tipColor ? '#18181b' : tipColor, tipColor);
  const renderedTipTextColor = useColorModeValue(
    tipTextColor === DEFAULT_PROPS.tipTextColor ? '#ffffff' : tipTextColor,
    tipTextColor
  );

  const propData = useMemo(
    () => [
      { name: 'value', type: 'number', default: 'undefined', description: 'Controlled rating, from 0 to count.' },
      { name: 'defaultValue', type: 'number', default: '0', description: 'Initial rating when uncontrolled.' },
      {
        name: 'onChange',
        type: '(value: number) => void',
        default: '-',
        description: 'Called when a rating is committed by click, release or keyboard.'
      },
      {
        name: 'onPreview',
        type: '(value: number | null) => void',
        default: '-',
        description: 'Called on every slot crossing while previewing, and with null when the preview clears.'
      },
      { name: 'count', type: 'number', default: '5', description: 'Number of glyphs.' },
      { name: 'shape', type: '"star" | "heart" | "bolt"', default: '"star"', description: 'Built-in glyph shape.' },
      {
        name: 'icon',
        type: 'ReactNode',
        default: 'undefined',
        description: 'Custom glyph that replaces the built-in shape.'
      },
      {
        name: 'labels',
        type: 'string[]',
        default: '[]',
        description: 'One label per glyph, shown in the tip while previewing. Without labels the tip shows the number.'
      },
      {
        name: 'activeColor',
        type: 'string',
        default: '"#f5b400"',
        description: 'Colour of lit glyphs and of the focus ring.'
      },
      { name: 'idleColor', type: 'string', default: '"#52525b"', description: 'Colour of unlit glyphs.' },
      {
        name: 'tipColor',
        type: 'string',
        default: '"#27272a"',
        description: 'Background of the tip that follows the pointer.'
      },
      { name: 'tipTextColor', type: 'string', default: '"#f5f5f5"', description: 'Text colour of the tip.' },
      {
        name: 'size',
        type: 'number',
        default: '28',
        description: 'Glyph size in pixels; spacing and the tip scale with it.'
      },
      {
        name: 'lift',
        type: 'number',
        default: '6',
        description: 'How far previewed glyphs rise, in pixels. 0 makes the preview colour-only.'
      },
      { name: 'magnify', type: 'number', default: '1.15', description: 'Scale of the glyph under the pointer.' },
      {
        name: 'riseDuration',
        type: 'number',
        default: '320',
        description: 'Duration in milliseconds of each glyph’s rise and fall, and of the tip’s hop.'
      },
      {
        name: 'popScale',
        type: 'number',
        default: '1.3',
        description: 'Peak scale of the pop on the committed glyph. 1 disables it.'
      },
      {
        name: 'showTip',
        type: 'boolean',
        default: 'true',
        description: 'Shows the tip above the pointer glyph while previewing.'
      },
      {
        name: 'allowClear',
        type: 'boolean',
        default: 'true',
        description: 'Clicking the current rating again, or Backspace, clears it to 0.'
      },
      {
        name: 'readOnly',
        type: 'boolean',
        default: 'false',
        description: 'Display only: no preview, no pop, announced as an image.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the control and ignores input.' },
      { name: 'ariaLabel', type: 'string', default: '"Rating"', description: 'Accessible name of the radio group.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root element.' }
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
            <PeekRating
              key={`${count}-${readOnly}`}
              value={value}
              onChange={setValue}
              count={count}
              shape={shape}
              labels={showLabels ? LABELS.slice(0, count) : []}
              activeColor={activeColor}
              idleColor={renderedIdleColor}
              tipColor={renderedTipColor}
              tipTextColor={renderedTipTextColor}
              size={size}
              lift={lift}
              magnify={magnify}
              riseDuration={riseDuration}
              popScale={popScale}
              showTip={showTip}
              allowClear={allowClear}
              readOnly={readOnly}
            />
          </Box>

          <Customize>
            <PreviewSlider
              title="Value"
              min={0}
              max={count}
              step={1}
              value={Math.min(value, count)}
              onChange={setValue}
            />
            <PreviewSlider
              title="Count"
              min={3}
              max={10}
              step={1}
              value={count}
              onChange={val => {
                updateProp('count', val);
                setValue(v => Math.min(v, val));
              }}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={shape}
              onChange={val => updateProp('shape', val)}
              width={120}
            />
            <PreviewSwitch title="Labels" isChecked={showLabels} onChange={val => updateProp('showLabels', val)} />
            <PreviewSwitch title="Tip" isChecked={showTip} onChange={val => updateProp('showTip', val)} />
            <PreviewColorPickerCustom
              title="Active"
              color={activeColor}
              onChange={val => updateProp('activeColor', val)}
            />
            <PreviewColorPickerCustom
              title="Idle"
              color={renderedIdleColor}
              onChange={val => updateProp('idleColor', val)}
            />
            <PreviewColorPickerCustom
              title="Tip"
              color={renderedTipColor}
              onChange={val => updateProp('tipColor', val)}
            />
            <PreviewColorPickerCustom
              title="Tip Text"
              color={renderedTipTextColor}
              onChange={val => updateProp('tipTextColor', val)}
            />
            <PreviewSlider
              title="Size"
              min={16}
              max={48}
              step={1}
              value={size}
              valueUnit="px"
              onChange={val => updateProp('size', val)}
            />
            <PreviewSlider
              title="Lift"
              min={0}
              max={16}
              step={1}
              value={lift}
              valueUnit="px"
              onChange={val => updateProp('lift', val)}
            />
            <PreviewSlider
              title="Magnify"
              min={1}
              max={1.5}
              step={0.01}
              value={magnify}
              onChange={val => updateProp('magnify', val)}
            />
            <PreviewSlider
              title="Rise"
              min={120}
              max={600}
              step={10}
              value={riseDuration}
              valueUnit="ms"
              onChange={val => updateProp('riseDuration', val)}
            />
            <PreviewSlider
              title="Pop"
              min={1}
              max={1.6}
              step={0.05}
              value={popScale}
              onChange={val => updateProp('popScale', val)}
            />
            <PreviewSwitch title="Allow Clear" isChecked={allowClear} onChange={val => updateProp('allowClear', val)} />
            <PreviewSwitch title="Read Only" isChecked={readOnly} onChange={val => updateProp('readOnly', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={peekRating} componentName="PeekRating" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PeekRatingDemo;
