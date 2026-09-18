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
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import WakeSlider from '../../content/Micro/WakeSlider/WakeSlider';
import { wakeSlider } from '../../constants/code/Micro/wakeSliderCode';

const DEFAULT_PROPS = {
  fillColor: '#f5f5f5',
  trackColor: '#27272a',
  step: 1,
  showValue: true,
  bars: 32,
  height: 56,
  restHeight: 12,
  gap: 4,
  sensitivity: 1,
  reach: 6,
  skew: 0.6,
  glide: 0.3,
  smoothing: 100,
  disabled: false
};

const WakeSliderDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    fillColor,
    trackColor,
    step,
    showValue,
    bars,
    height,
    restHeight,
    gap,
    sensitivity,
    reach,
    skew,
    glide,
    smoothing,
    disabled
  } = props;
  const [value, setValue] = useState(50);

  const renderedFill = useColorModeValue(fillColor === DEFAULT_PROPS.fillColor ? '#18181b' : fillColor, fillColor);
  const renderedTrack = useColorModeValue(trackColor === DEFAULT_PROPS.trackColor ? '#f6f6f6' : trackColor, trackColor);

  const propData = useMemo(
    () => [
      { name: 'value', type: 'number', default: 'undefined', description: 'Controlled value.' },
      { name: 'defaultValue', type: 'number', default: '50', description: 'Initial value when uncontrolled.' },
      {
        name: 'onChange',
        type: '(value: number) => void',
        default: '-',
        description: 'Called on every committed change, from the pointer or the keyboard.'
      },
      { name: 'min', type: 'number', default: '0', description: 'Lowest value.' },
      { name: 'max', type: 'number', default: '100', description: 'Highest value.' },
      {
        name: 'step',
        type: 'number',
        default: '1',
        description: 'Snapping grid. Large steps move the handle in notches, and the wake pulses per notch.'
      },
      { name: 'bars', type: 'number', default: '32', description: 'How many bars draw the track.' },
      {
        name: 'height',
        type: 'number',
        default: '56',
        description: 'Full bar height in pixels, the ceiling of the wake.'
      },
      { name: 'restHeight', type: 'number', default: '12', description: 'Bar height at rest in pixels.' },
      { name: 'gap', type: 'number', default: '4', description: 'Space between bars in pixels.' },
      { name: 'fillColor', type: 'string', default: '"#f5f5f5"', description: 'Lit bars, up to the value.' },
      { name: 'trackColor', type: 'string', default: '"#27272a"', description: 'Unlit bars.' },
      {
        name: 'crestColor',
        type: 'string',
        default: '""',
        description: 'Optional tint the raised bars take on by their lift. Empty renders no tint layer.'
      },
      {
        name: 'sensitivity',
        type: 'number',
        default: '1',
        description: 'How easily speed raises the wake. Low needs a flick; high lifts it on a stroll.'
      },
      { name: 'reach', type: 'number', default: '6', description: 'Half-width of the wake at full speed, in bars.' },
      {
        name: 'skew',
        type: 'number',
        default: '0.6',
        description: 'How much wider the wake is behind the handle than ahead. 0 is symmetric.'
      },
      {
        name: 'glide',
        type: 'number',
        default: '0.3',
        description: 'Seconds the handle takes to settle. Short hugs the finger; long floats behind it.'
      },
      {
        name: 'smoothing',
        type: 'number',
        default: '100',
        description: 'Milliseconds of velocity lag. Low twitches with every change of speed; high lingers.'
      },
      { name: 'showValue', type: 'boolean', default: 'false', description: 'Shows the value beside the track.' },
      {
        name: 'formatValue',
        type: '(value: number) => string',
        default: '-',
        description: 'Formats the readout and the announced value.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Fades the slider and ignores input.' },
      { name: 'ariaLabel', type: 'string', default: '"Value"', description: 'Accessible name of the slider.' },
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
            <Box w="min(320px, calc(100% - 48px))">
              <WakeSlider
                value={value}
                onChange={setValue}
                step={step}
                bars={bars}
                height={height}
                restHeight={restHeight}
                gap={gap}
                fillColor={renderedFill}
                trackColor={renderedTrack}
                sensitivity={sensitivity}
                reach={reach}
                skew={skew}
                glide={glide}
                smoothing={smoothing}
                showValue={showValue}
                disabled={disabled}
              />
            </Box>
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Fill"
              color={renderedFill}
              onChange={val => updateProp('fillColor', val)}
            />
            <PreviewColorPickerCustom
              title="Track"
              color={renderedTrack}
              onChange={val => updateProp('trackColor', val)}
            />
            <PreviewSlider title="Value" min={0} max={100} step={1} value={value} onChange={setValue} />
            <PreviewSlider
              title="Step"
              min={1}
              max={25}
              step={1}
              value={step}
              onChange={val => updateProp('step', val)}
            />
            <PreviewSwitch title="Show Value" isChecked={showValue} onChange={val => updateProp('showValue', val)} />
            <PreviewSlider
              title="Bars"
              min={12}
              max={64}
              step={1}
              value={bars}
              onChange={val => updateProp('bars', val)}
            />
            <PreviewSlider
              title="Height"
              min={24}
              max={96}
              step={2}
              value={height}
              valueUnit="px"
              onChange={val => updateProp('height', val)}
            />
            <PreviewSlider
              title="Rest Height"
              min={4}
              max={24}
              step={1}
              value={restHeight}
              valueUnit="px"
              onChange={val => updateProp('restHeight', val)}
            />
            <PreviewSlider
              title="Gap"
              min={1}
              max={8}
              step={1}
              value={gap}
              valueUnit="px"
              onChange={val => updateProp('gap', val)}
            />
            <PreviewSlider
              title="Sensitivity"
              min={0.25}
              max={3}
              step={0.05}
              value={sensitivity}
              onChange={val => updateProp('sensitivity', val)}
            />
            <PreviewSlider
              title="Reach"
              min={2}
              max={12}
              step={0.5}
              value={reach}
              onChange={val => updateProp('reach', val)}
            />
            <PreviewSlider
              title="Skew"
              min={0}
              max={1}
              step={0.05}
              value={skew}
              onChange={val => updateProp('skew', val)}
            />
            <PreviewSlider
              title="Glide"
              min={0.15}
              max={0.6}
              step={0.05}
              value={glide}
              valueUnit="s"
              onChange={val => updateProp('glide', val)}
            />
            <PreviewSlider
              title="Smoothing"
              min={40}
              max={250}
              step={10}
              value={smoothing}
              valueUnit="ms"
              onChange={val => updateProp('smoothing', val)}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={wakeSlider} componentName="WakeSlider" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default WakeSliderDemo;
