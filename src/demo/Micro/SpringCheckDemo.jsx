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

import SpringCheck from '../../content/Micro/SpringCheck/SpringCheck';
import { springCheck } from '../../constants/code/Micro/springCheckCode';

const DEFAULT_PROPS = {
  color: '#ffffff',
  fillColor: '#ffffff',
  checkColor: '#0b0b0f',
  boxSize: 28,
  boxRadius: 9,
  fontSize: 18,
  bounce: 0.2,
  strikeLag: 0.12,
  doneOpacity: 0.42,
  strike: 'left',
  disabled: false
};

const STRIKE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'none', label: 'None' }
];

const ROWS = [
  { label: 'Ship the build', defaultChecked: false },
  { label: 'Update the changelog', defaultChecked: false },
  { label: 'Book the launch call', defaultChecked: true }
];

const SpringCheckDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    color,
    fillColor,
    checkColor,
    boxSize,
    boxRadius,
    fontSize,
    bounce,
    strikeLag,
    doneOpacity,
    strike,
    disabled
  } = props;
  const [epoch, setEpoch] = useState(0);

  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedFill = useColorModeValue(fillColor === DEFAULT_PROPS.fillColor ? '#18181b' : fillColor, fillColor);
  const renderedCheck = useColorModeValue(checkColor === DEFAULT_PROPS.checkColor ? '#ffffff' : checkColor, checkColor);

  const reset = () => {
    resetProps();
    setEpoch(e => e + 1);
  };

  const propData = useMemo(
    () => [
      {
        name: 'label',
        type: 'ReactNode',
        default: '"Ship the build"',
        description: 'The words beside the box; the strike-through is exactly their width.'
      },
      {
        name: 'checked',
        type: 'boolean',
        default: 'undefined',
        description: 'Controlled state. A change from outside animates on the spring.'
      },
      { name: 'defaultChecked', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
      { name: 'onChange', type: '(checked: boolean) => void', default: '-', description: 'Called on every toggle.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the row and ignores input.' },
      {
        name: 'color',
        type: 'string',
        default: '"#ffffff"',
        description: 'Ink: the label, the ring, the rule and the focus outline.'
      },
      {
        name: 'fillColor',
        type: 'string',
        default: '"#ffffff"',
        description: 'The fill that swells out of the box centre.'
      },
      {
        name: 'checkColor',
        type: 'string',
        default: '"#0b0b0f"',
        description: 'Stroke of the tick drawn over the fill.'
      },
      {
        name: 'boxSize',
        type: 'number',
        default: '28',
        description: 'Box side in pixels; ring, gap and row height derive from it.'
      },
      {
        name: 'boxRadius',
        type: 'number',
        default: '9',
        description: 'Box corner radius in pixels; half the size makes a circle.'
      },
      {
        name: 'fontSize',
        type: 'number',
        default: '18',
        description: 'Label size in pixels; the rule thickness derives from it.'
      },
      {
        name: 'bounce',
        type: 'number',
        default: '0.2',
        description: 'How far the fill swells past full. 0 arrives dead, 0.5 rebounds twice.'
      },
      {
        name: 'strikeLag',
        type: 'number',
        default: '0.12',
        description: 'Where on the spring the rule starts: 0 wipes with the fill, 0.4 waits for the tick.'
      },
      {
        name: 'doneOpacity',
        type: 'number',
        default: '0.42',
        description: 'How much ink the words keep once checked.'
      },
      {
        name: 'strike',
        type: '"left" | "center" | "right" | "none"',
        default: '"left"',
        description: 'Where the strike-through wipes from, or no rule at all.'
      },
      { name: 'ariaLabel', type: 'string', default: '-', description: 'Accessible name when the label is not text.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the row.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={reset} hasChanges={hasChanges}>
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
            <Box key={epoch} display="flex" flexDirection="column" alignItems="flex-start" gap="4px" minW="260px">
              {ROWS.map(row => (
                <SpringCheck
                  key={row.label}
                  label={row.label}
                  defaultChecked={row.defaultChecked}
                  disabled={disabled}
                  color={renderedColor}
                  fillColor={renderedFill}
                  checkColor={renderedCheck}
                  boxSize={boxSize}
                  boxRadius={boxRadius}
                  fontSize={fontSize}
                  bounce={bounce}
                  strikeLag={strikeLag}
                  doneOpacity={doneOpacity}
                  strike={strike}
                />
              ))}
            </Box>
          </Box>

          <Customize>
            <PreviewColorPickerCustom title="Ink" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom
              title="Fill"
              color={renderedFill}
              onChange={val => updateProp('fillColor', val)}
            />
            <PreviewColorPickerCustom
              title="Check"
              color={renderedCheck}
              onChange={val => updateProp('checkColor', val)}
            />
            <PreviewSlider
              title="Box Size"
              min={16}
              max={40}
              step={1}
              value={boxSize}
              valueUnit="px"
              onChange={val => updateProp('boxSize', val)}
            />
            <PreviewSlider
              title="Box Radius"
              min={0}
              max={20}
              step={1}
              value={boxRadius}
              valueUnit="px"
              onChange={val => updateProp('boxRadius', val)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={28}
              step={1}
              value={fontSize}
              valueUnit="px"
              onChange={val => updateProp('fontSize', val)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.5}
              step={0.05}
              value={bounce}
              onChange={val => updateProp('bounce', val)}
            />
            <PreviewSlider
              title="Strike Lag"
              min={0}
              max={0.5}
              step={0.02}
              value={strikeLag}
              onChange={val => updateProp('strikeLag', val)}
            />
            <PreviewSlider
              title="Done Opacity"
              min={0.2}
              max={0.8}
              step={0.02}
              value={doneOpacity}
              onChange={val => updateProp('doneOpacity', val)}
            />
            <PreviewSelect
              title="Strike"
              options={STRIKE_OPTIONS}
              value={strike}
              onChange={val => updateProp('strike', val)}
              width={120}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={springCheck} componentName="SpringCheck" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SpringCheckDemo;
