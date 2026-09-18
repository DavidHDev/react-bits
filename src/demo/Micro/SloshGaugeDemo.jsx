import { useMemo } from 'react';
import { Box, Button, Flex } from '@chakra-ui/react';
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
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import SloshGauge from '../../content/Micro/SloshGauge/SloshGauge';
import { sloshGauge } from '../../constants/code/Micro/sloshGaugeCode';

const DEFAULT_PROPS = {
  value: 60,
  interactive: true,
  showValue: true,
  disabled: false,
  liquidColor: '#f5f5f5',
  glassColor: '#27272a',
  width: 88,
  height: 180,
  radius: 20,
  ticks: 4,
  viscosity: 0.15,
  tilt: 0.45,
  splash: 0.42
};

const PRESETS = [
  { label: 'Empty', value: 0 },
  { label: '25%', value: 25 },
  { label: '60%', value: 60 },
  { label: 'Full', value: 100 }
];

const SloshGaugeDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    value,
    interactive,
    showValue,
    disabled,
    liquidColor,
    glassColor,
    width,
    height,
    radius,
    ticks,
    viscosity,
    tilt,
    splash
  } = props;

  const renderedLiquid = useColorModeValue(
    liquidColor === DEFAULT_PROPS.liquidColor ? '#18181b' : liquidColor,
    liquidColor
  );
  const renderedGlass = useColorModeValue(glassColor === DEFAULT_PROPS.glassColor ? '#f6f6f6' : glassColor, glassColor);

  const propData = useMemo(
    () => [
      {
        name: 'value',
        type: 'number',
        default: 'undefined',
        description: 'The level, 0 to 100, controlled. Every change launches the liquid toward it.'
      },
      { name: 'defaultValue', type: 'number', default: '60', description: 'The starting level when uncontrolled.' },
      {
        name: 'onChange',
        type: '(value: number) => void',
        default: '-',
        description: 'The integer level on press, on each change while dragging, and on keys. Interactive only.'
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'false',
        description: 'Press or drag the tank to set the level, arrows to step. A marker appears at the level.'
      },
      {
        name: 'showValue',
        type: 'boolean',
        default: 'true',
        description: 'A readout whose colour flips at the surface.'
      },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description: 'Dimmed and inert. Value changes still animate.'
      },
      {
        name: 'liquidColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'The liquid. The readout over it picks dark or light by itself.'
      },
      { name: 'glassColor', type: 'string', default: '"#27272a"', description: 'The tank.' },
      { name: 'width', type: 'number', default: '88', description: 'Tank width in px. The readout scales with it.' },
      { name: 'height', type: 'number', default: '180', description: 'Tank height in px.' },
      {
        name: 'radius',
        type: 'number',
        default: '20',
        description: 'Corner radius in px, capped at half the smaller side.'
      },
      {
        name: 'ticks',
        type: 'number',
        default: '4',
        description: 'Lines etched on the right of the glass. 0 hides them.'
      },
      {
        name: 'viscosity',
        type: 'number',
        default: '0.15',
        description: '0 is a rigid gauge. Higher is slower to answer, longer to settle, and overshoots more.'
      },
      {
        name: 'tilt',
        type: 'number',
        default: '0.45',
        description: 'How far the surface leans per unit of speed. 0 keeps it flat.'
      },
      {
        name: 'splash',
        type: 'number',
        default: '0.42',
        description: 'How much of a slam the top and bottom give back. 0 swallows it, 0.8 nearly bounces.'
      },
      { name: 'unit', type: 'string', default: '"%"', description: 'Readout suffix.' },
      { name: 'ariaLabel', type: 'string', default: '"Level"', description: 'Accessible name of the meter or slider.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the tank.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            <Box mb="36px">
              <SloshGauge
                value={value}
                onChange={v => updateProp('value', v)}
                interactive={interactive}
                showValue={showValue}
                disabled={disabled}
                liquidColor={renderedLiquid}
                glassColor={renderedGlass}
                width={width}
                height={height}
                radius={radius}
                ticks={ticks}
                viscosity={viscosity}
                tilt={tilt}
                splash={splash}
              />
            </Box>
            <Flex position="absolute" bottom="24px" left="50%" transform="translateX(-50%)" gap="6px">
              {PRESETS.map(p => (
                <Button
                  key={p.label}
                  size="sm"
                  variant="ghost"
                  fontSize="13px"
                  fontWeight={500}
                  rounded="full"
                  onClick={() => updateProp('value', p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </Flex>
          </Box>

          <Customize>
            <PreviewSlider
              title="Value"
              min={0}
              max={100}
              step={1}
              value={value}
              onChange={val => updateProp('value', val)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={interactive}
              onChange={val => updateProp('interactive', val)}
            />
            <PreviewSwitch title="Show Value" isChecked={showValue} onChange={val => updateProp('showValue', val)} />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
            <PreviewColorPickerCustom
              title="Liquid"
              color={renderedLiquid}
              onChange={val => updateProp('liquidColor', val)}
            />
            <PreviewColorPickerCustom
              title="Glass"
              color={renderedGlass}
              onChange={val => updateProp('glassColor', val)}
            />
            <PreviewSlider
              title="Width"
              min={56}
              max={160}
              step={4}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
            />
            <PreviewSlider
              title="Height"
              min={120}
              max={300}
              step={4}
              value={height}
              valueUnit="px"
              onChange={val => updateProp('height', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={44}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Ticks"
              min={0}
              max={10}
              step={1}
              value={ticks}
              onChange={val => updateProp('ticks', val)}
            />
            <PreviewSlider
              title="Viscosity"
              min={0}
              max={1}
              step={0.05}
              value={viscosity}
              onChange={val => updateProp('viscosity', val)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={1}
              step={0.05}
              value={tilt}
              onChange={val => updateProp('tilt', val)}
            />
            <PreviewSlider
              title="Splash"
              min={0}
              max={0.8}
              step={0.02}
              value={splash}
              onChange={val => updateProp('splash', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={sloshGauge} />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SloshGaugeDemo;
