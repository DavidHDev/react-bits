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

import DodgeField from '../../content/Micro/DodgeField/DodgeField';
import { dodgeField } from '../../constants/code/Micro/dodgeFieldCode';

const DEFAULT_PROPS = {
  inkColor: '#f5f5f5',
  contrastColor: '#18181b',
  fieldHeight: 240,
  reach: 72,
  radius: 120,
  falloff: 2,
  fleeDuration: 130,
  returnDuration: 620,
  returnBounce: 0.1,
  patience: 4,
  axis: 'both',
  wall: 'clamp',
  disabled: false
};

const AXIS_OPTIONS = [
  { value: 'both', label: 'Both' },
  { value: 'x', label: 'Horizontal' },
  { value: 'y', label: 'Vertical' }
];

const WALL_OPTIONS = [
  { value: 'clamp', label: 'Clamp' },
  { value: 'bounce', label: 'Bounce' }
];

const DodgeFieldDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    inkColor,
    contrastColor,
    fieldHeight,
    reach,
    radius,
    falloff,
    fleeDuration,
    returnDuration,
    returnBounce,
    patience,
    axis,
    wall,
    disabled
  } = props;

  const renderedInk = useColorModeValue(inkColor === DEFAULT_PROPS.inkColor ? '#18181b' : inkColor, inkColor);
  const renderedContrast = useColorModeValue(
    contrastColor === DEFAULT_PROPS.contrastColor ? '#ffffff' : contrastColor,
    contrastColor
  );

  const propData = useMemo(
    () => [
      {
        name: 'children',
        type: 'ReactNode | (state) => ReactNode',
        default: 'undefined',
        description:
          'What flees. Omit it for the built-in pill, pass any element, or pass a function of { dodges, gave, caught, fleeing }.'
      },
      {
        name: 'taunts',
        type: 'string[]',
        default: '["Catch me", "Nope", "Too slow", "Almost", "Okay, okay"]',
        description: 'Labels for the built-in pill: the first at rest, then one per dodge, the last once it relents.'
      },
      {
        name: 'notice',
        type: 'string',
        default: '""',
        description: 'One line shown under the child on touch devices, where nothing dodges.'
      },
      {
        name: 'inkColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'The pill tint and text, the caught fill and the focus ring all derive from it.'
      },
      {
        name: 'contrastColor',
        type: 'string',
        default: '"#18181b"',
        description: 'Text colour while the pill is caught.'
      },
      {
        name: 'fieldHeight',
        type: 'number',
        default: '240',
        description: 'Height of the invisible field in pixels; its width is the container.'
      },
      {
        name: 'reach',
        type: 'number',
        default: '72',
        description: 'How far it bolts, in pixels, with the pointer on its home.'
      },
      {
        name: 'radius',
        type: 'number',
        default: '120',
        description: 'Distance from home at which it starts to react, in pixels.'
      },
      {
        name: 'falloff',
        type: 'number',
        default: '2',
        description: 'Exponent of the reaction curve. 1 drifts away from far off; 4 only flinches at the last moment.'
      },
      {
        name: 'fleeDuration',
        type: 'number',
        default: '130',
        description: 'Settle time of the dart, in milliseconds.'
      },
      {
        name: 'returnDuration',
        type: 'number',
        default: '620',
        description: 'Settle time of the glide home, in milliseconds.'
      },
      {
        name: 'returnBounce',
        type: 'number',
        default: '0.1',
        description: 'Overshoot on the way home. 0.1 is a hair, 0.3 a visible wobble.'
      },
      {
        name: 'axis',
        type: '"both" | "x" | "y"',
        default: '"both"',
        description: 'Which way it may flee.'
      },
      {
        name: 'wall',
        type: '"clamp" | "bounce"',
        default: '"clamp"',
        description: 'At the edge of the field: stop dead, or fold the overflow back so it rebounds.'
      },
      {
        name: 'patience',
        type: 'number',
        default: '4',
        description:
          'Dodges before it gives in and sits still, at least 1. Never wrap a decline or close control in a field that dodges.'
      },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description: 'Sits still and stops counting; the child stays clickable.'
      },
      { name: 'onDodge', type: '(count: number) => void', default: '-', description: 'Called on each counted dodge.' },
      { name: 'onRelent', type: '() => void', default: '-', description: 'Called when it gives in.' },
      { name: 'onCatch', type: '() => void', default: '-', description: 'Called when the child is clicked.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the field.' },
      {
        name: 'style',
        type: 'CSSProperties',
        default: 'undefined',
        description: 'Inline styles merged onto the field.'
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
            <DodgeField
              inkColor={renderedInk}
              contrastColor={renderedContrast}
              fieldHeight={fieldHeight}
              reach={reach}
              radius={radius}
              falloff={falloff}
              fleeDuration={fleeDuration}
              returnDuration={returnDuration}
              returnBounce={returnBounce}
              patience={patience}
              axis={axis}
              wall={wall}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewColorPickerCustom title="Ink" color={renderedInk} onChange={val => updateProp('inkColor', val)} />
            <PreviewColorPickerCustom
              title="Contrast"
              color={renderedContrast}
              onChange={val => updateProp('contrastColor', val)}
            />
            <PreviewSlider
              title="Field Height"
              min={120}
              max={360}
              step={10}
              value={fieldHeight}
              valueUnit="px"
              onChange={val => updateProp('fieldHeight', val)}
            />
            <PreviewSlider
              title="Reach"
              min={14}
              max={120}
              step={2}
              value={reach}
              valueUnit="px"
              onChange={val => updateProp('reach', val)}
            />
            <PreviewSlider
              title="Radius"
              min={60}
              max={200}
              step={5}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Falloff"
              min={1}
              max={4}
              step={0.5}
              value={falloff}
              onChange={val => updateProp('falloff', val)}
            />
            <PreviewSlider
              title="Flee"
              min={60}
              max={300}
              step={10}
              value={fleeDuration}
              valueUnit="ms"
              onChange={val => updateProp('fleeDuration', val)}
            />
            <PreviewSlider
              title="Return"
              min={200}
              max={1000}
              step={20}
              value={returnDuration}
              valueUnit="ms"
              onChange={val => updateProp('returnDuration', val)}
            />
            <PreviewSlider
              title="Return Bounce"
              min={0}
              max={0.3}
              step={0.05}
              value={returnBounce}
              onChange={val => updateProp('returnBounce', val)}
            />
            <PreviewSlider
              title="Patience"
              min={1}
              max={8}
              step={1}
              value={patience}
              onChange={val => updateProp('patience', val)}
            />
            <PreviewSelect
              title="Axis"
              options={AXIS_OPTIONS}
              value={axis}
              onChange={val => updateProp('axis', val)}
              width={130}
            />
            <PreviewSelect
              title="Wall"
              options={WALL_OPTIONS}
              value={wall}
              onChange={val => updateProp('wall', val)}
              width={120}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={dodgeField} componentName="DodgeField" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default DodgeFieldDemo;
