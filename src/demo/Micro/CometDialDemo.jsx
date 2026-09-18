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

import CometDial from '../../content/Micro/CometDial/CometDial';
import { cometDial } from '../../constants/code/Micro/cometDialCode';

const DEFAULT_PROPS = {
  accent: '#f5f5f5',
  ink: '#fdfdfd',
  unit: 'percent',
  size: 250,
  sweep: 320,
  thickness: 5,
  speed: 25,
  tapBounce: 0.2,
  flickBounce: 0.1,
  momentum: 1,
  cometReach: 180,
  cometWidth: 12,
  disabled: false
};

const UNIT_OPTIONS = [
  { value: 'percent', label: '%' },
  { value: 'degrees', label: '°' },
  { value: 'decibels', label: 'dB' },
  { value: 'none', label: 'None' }
];
const UNITS = { percent: '%', degrees: '°', decibels: 'dB', none: '' };

const CometDialDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    accent,
    ink,
    unit,
    size,
    sweep,
    thickness,
    speed,
    tapBounce,
    flickBounce,
    momentum,
    cometReach,
    cometWidth,
    disabled
  } = props;
  const [value, setValue] = useState(62);

  const renderedAccent = useColorModeValue(accent === DEFAULT_PROPS.accent ? '#18181b' : accent, accent);
  const renderedInk = useColorModeValue(ink === DEFAULT_PROPS.ink ? '#18181b' : ink, ink);

  const propData = useMemo(
    () => [
      {
        name: 'value',
        type: 'number',
        default: 'undefined',
        description: 'Controlled value. A change from outside launches the reading on the tap spring.'
      },
      { name: 'defaultValue', type: 'number', default: '62', description: 'Initial value when uncontrolled.' },
      { name: 'min', type: 'number', default: '0', description: 'Lowest value.' },
      { name: 'max', type: 'number', default: '100', description: 'Highest value.' },
      { name: 'step', type: 'number', default: '1', description: 'Snapping grid, and the keyboard nudge.' },
      { name: 'unit', type: 'string', default: '"%"', description: 'Suffix after the figure. Empty hides it.' },
      { name: 'label', type: 'string', default: '"Level"', description: 'Accessible name of the slider.' },
      { name: 'accent', type: 'string', default: '"#f5f5f5"', description: 'The lit arc, the bead and the comet.' },
      { name: 'ink', type: 'string', default: '"#fdfdfd"', description: 'The track and the readout.' },
      {
        name: 'size',
        type: 'number',
        default: '250',
        description: 'Diameter in pixels. Everything inside scales with it.'
      },
      {
        name: 'sweep',
        type: 'number',
        default: '320',
        description: 'Degrees the arc covers, with the gap centred at the bottom.'
      },
      {
        name: 'thickness',
        type: 'number',
        default: '5',
        description: 'Stroke width of the track and the arc. The bead follows it.'
      },
      { name: 'speed', type: 'number', default: '25', description: 'How quickly the reading arrives, 0 to 100.' },
      { name: 'tapBounce', type: 'number', default: '0.2', description: 'Ring-down after a tap. 0 stops dead.' },
      {
        name: 'flickBounce',
        type: 'number',
        default: '0.1',
        description: 'Ring-down after a full-speed flick. A slower release lands between the two.'
      },
      {
        name: 'momentum',
        type: 'number',
        default: '1',
        description: 'How far a flick carries the reading past where you let go. 0 drops it where released.'
      },
      {
        name: 'cometReach',
        type: 'number',
        default: '180',
        description: 'Degrees of trail behind the bead at full speed.'
      },
      {
        name: 'cometWidth',
        type: 'number',
        default: '12',
        description: 'Extra stroke width at the head of the trail at full speed.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the dial and ignores input.' },
      {
        name: 'onChange',
        type: '(value: number) => void',
        default: '-',
        description: 'Called on every snapped change, including during a drag.'
      },
      {
        name: 'onChangeEnd',
        type: '(value: number, detail: { velocity: number; bounce: number }) => void',
        default: '-',
        description: 'Called on release and on a key, with the release velocity and the bounce it earned.'
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
            <CometDial
              value={value}
              onChange={setValue}
              unit={UNITS[unit] ?? '%'}
              accent={renderedAccent}
              ink={renderedInk}
              size={size}
              sweep={sweep}
              thickness={thickness}
              speed={speed}
              tapBounce={tapBounce}
              flickBounce={flickBounce}
              momentum={momentum}
              cometReach={cometReach}
              cometWidth={cometWidth}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent}
              onChange={val => updateProp('accent', val)}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedInk} onChange={val => updateProp('ink', val)} />
            <PreviewSlider title="Value" min={0} max={100} step={1} value={value} onChange={setValue} />
            <PreviewSelect
              title="Unit"
              options={UNIT_OPTIONS}
              value={unit}
              onChange={val => updateProp('unit', val)}
              width={110}
            />
            <PreviewSlider
              title="Size"
              min={160}
              max={360}
              step={10}
              value={size}
              valueUnit="px"
              onChange={val => updateProp('size', val)}
            />
            <PreviewSlider
              title="Sweep"
              min={180}
              max={340}
              step={5}
              value={sweep}
              valueUnit="°"
              onChange={val => updateProp('sweep', val)}
            />
            <PreviewSlider
              title="Thickness"
              min={2}
              max={8}
              step={0.5}
              value={thickness}
              onChange={val => updateProp('thickness', val)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={100}
              step={1}
              value={speed}
              onChange={val => updateProp('speed', val)}
            />
            <PreviewSlider
              title="Tap Bounce"
              min={0}
              max={0.3}
              step={0.02}
              value={tapBounce}
              onChange={val => updateProp('tapBounce', val)}
            />
            <PreviewSlider
              title="Flick Bounce"
              min={0}
              max={0.5}
              step={0.02}
              value={flickBounce}
              onChange={val => updateProp('flickBounce', val)}
            />
            <PreviewSlider
              title="Momentum"
              min={0}
              max={2}
              step={0.1}
              value={momentum}
              onChange={val => updateProp('momentum', val)}
            />
            <PreviewSlider
              title="Comet Reach"
              min={10}
              max={180}
              step={5}
              value={cometReach}
              valueUnit="°"
              onChange={val => updateProp('cometReach', val)}
            />
            <PreviewSlider
              title="Comet Width"
              min={0}
              max={12}
              step={0.5}
              value={cometWidth}
              onChange={val => updateProp('cometWidth', val)}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={cometDial} componentName="CometDial" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CometDialDemo;
