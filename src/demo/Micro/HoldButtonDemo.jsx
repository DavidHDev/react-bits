import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CreditCardIcon, Delete02Icon, Logout01Icon, SentIcon, Tick02Icon } from '@hugeicons/core-free-icons';
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

import HoldButton from '../../content/Micro/HoldButton/HoldButton';
import { holdButton } from '../../constants/code/Micro/holdButtonCode';

const DEFAULT_PROPS = {
  action: 'delete',
  fillColor: '#5227FF',
  backgroundColor: '#27272a',
  textColor: '#f5f5f5',
  fillTextColor: '#ffffff',
  size: 'md',
  radius: 14,
  fillDirection: 'right',
  holdTime: 2000,
  releaseTime: 200,
  pressScale: 0.97,
  wave: true,
  waveAmplitude: 6,
  glow: true,
  resetAfter: 1200,
  disabled: false
};

const ACTIONS = {
  delete: { label: 'Hold to delete', done: 'Deleted', icon: Delete02Icon },
  send: { label: 'Hold to send', done: 'Sent', icon: SentIcon },
  pay: { label: 'Hold to pay', done: 'Paid', icon: CreditCardIcon },
  signout: { label: 'Hold to sign out', done: 'Signed out', icon: Logout01Icon }
};

const ACTION_OPTIONS = [
  { value: 'delete', label: 'Delete' },
  { value: 'send', label: 'Send' },
  { value: 'pay', label: 'Pay' },
  { value: 'signout', label: 'Sign out' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const DIRECTION_OPTIONS = [
  { value: 'right', label: 'Right' },
  { value: 'up', label: 'Up' }
];

const HoldButtonDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    action,
    fillColor,
    backgroundColor,
    textColor,
    fillTextColor,
    size,
    radius,
    fillDirection,
    holdTime,
    releaseTime,
    pressScale,
    wave,
    waveAmplitude,
    glow,
    resetAfter,
    disabled
  } = props;
  const current = ACTIONS[action] || ACTIONS.delete;

  const renderedBackground = useColorModeValue(
    backgroundColor === DEFAULT_PROPS.backgroundColor ? '#f6f6f6' : backgroundColor,
    backgroundColor
  );
  const renderedText = useColorModeValue(textColor === DEFAULT_PROPS.textColor ? '#333333' : textColor, textColor);

  const propData = useMemo(
    () => [
      {
        name: 'children',
        type: 'ReactNode',
        default: '"Hold to delete"',
        description: 'Label shown while idle and holding.'
      },
      {
        name: 'doneLabel',
        type: 'ReactNode',
        default: '"Deleted"',
        description: 'Label that blurs in when the hold completes.'
      },
      {
        name: 'icon',
        type: 'ReactNode',
        default: 'null',
        description: 'Optional icon rendered before the idle label.'
      },
      {
        name: 'doneIcon',
        type: 'ReactNode',
        default: 'null',
        description: 'Optional icon rendered before the done label.'
      },
      { name: 'backgroundColor', type: 'string', default: '"#27272a"', description: 'Button body colour.' },
      {
        name: 'fillColor',
        type: 'string',
        default: '"#5227FF"',
        description: 'Colour of the liquid fill, its wave, the glow and the focus ring.'
      },
      { name: 'textColor', type: 'string', default: '"#f5f5f5"', description: 'Label colour outside the fill.' },
      {
        name: 'fillTextColor',
        type: 'string',
        default: '"#ffffff"',
        description: 'Label colour inside the fill; the ink inverts as the edge crosses it.'
      },
      {
        name: 'size',
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: 'Height, padding and font size preset.'
      },
      {
        name: 'radius',
        type: 'number',
        default: '14',
        description: 'Corner radius in pixels of the body, the fill and the focus ring.'
      },
      {
        name: 'fillDirection',
        type: '"right" | "up"',
        default: '"right"',
        description: 'Whether the liquid sweeps left to right or rises from the bottom.'
      },
      {
        name: 'holdTime',
        type: 'number',
        default: '2000',
        description: 'How long the press must last, in milliseconds. The fill moves at constant speed.'
      },
      {
        name: 'releaseTime',
        type: 'number',
        default: '200',
        description: 'How fast the fill snaps back on an early release or a reset, in milliseconds.'
      },
      {
        name: 'pressScale',
        type: 'number',
        default: '0.97',
        description: 'Squash of the button while a pointer holds it. 1 disables it.'
      },
      {
        name: 'wave',
        type: 'boolean',
        default: 'true',
        description: 'Scrolling meniscus on the leading edge of the fill.'
      },
      { name: 'waveAmplitude', type: 'number', default: '6', description: 'Height of the wave crests in pixels.' },
      {
        name: 'glow',
        type: 'boolean',
        default: 'true',
        description: 'Glow that charges with the hold and pulses once on completion.'
      },
      {
        name: 'resetAfter',
        type: 'number',
        default: '1200',
        description: 'Milliseconds the done state stays before the button resets. 0 keeps it done.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the button and ignores input.' },
      {
        name: 'onHold',
        type: '() => void',
        default: '-',
        description: 'Called once, on the frame the fill completes.'
      },
      {
        name: 'onTap',
        type: '() => void',
        default: '-',
        description: 'Called on a release shorter than 250ms that did not drift away.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the button.' }
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
            <HoldButton
              key={`${action}-${fillDirection}`}
              doneLabel={current.done}
              icon={<HugeiconsIcon icon={current.icon} size={18} strokeWidth={2} />}
              doneIcon={<HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={2.5} />}
              backgroundColor={renderedBackground}
              fillColor={fillColor}
              textColor={renderedText}
              fillTextColor={fillTextColor}
              size={size}
              radius={radius}
              fillDirection={fillDirection}
              holdTime={holdTime}
              releaseTime={releaseTime}
              pressScale={pressScale}
              wave={wave}
              waveAmplitude={waveAmplitude}
              glow={glow}
              resetAfter={resetAfter}
              disabled={disabled}
            >
              {current.label}
            </HoldButton>
          </Box>

          <Customize>
            <PreviewSelect
              title="Action"
              options={ACTION_OPTIONS}
              value={action}
              onChange={val => updateProp('action', val)}
              width={150}
            />
            <PreviewColorPickerCustom title="Fill" color={fillColor} onChange={val => updateProp('fillColor', val)} />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground}
              onChange={val => updateProp('backgroundColor', val)}
            />
            <PreviewColorPickerCustom
              title="Text"
              color={renderedText}
              onChange={val => updateProp('textColor', val)}
            />
            <PreviewColorPickerCustom
              title="Text On Fill"
              color={fillTextColor}
              onChange={val => updateProp('fillTextColor', val)}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={size}
              onChange={val => updateProp('size', val)}
              width={140}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={30}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSelect
              title="Fill Direction"
              options={DIRECTION_OPTIONS}
              value={fillDirection}
              onChange={val => updateProp('fillDirection', val)}
              width={120}
            />
            <PreviewSlider
              title="Hold Time"
              min={600}
              max={4000}
              step={100}
              value={holdTime}
              valueUnit="ms"
              onChange={val => updateProp('holdTime', val)}
            />
            <PreviewSlider
              title="Release"
              min={100}
              max={400}
              step={10}
              value={releaseTime}
              valueUnit="ms"
              onChange={val => updateProp('releaseTime', val)}
            />
            <PreviewSlider
              title="Press Scale"
              min={0.9}
              max={1}
              step={0.005}
              value={pressScale}
              onChange={val => updateProp('pressScale', val)}
            />
            <PreviewSwitch title="Wave" isChecked={wave} onChange={val => updateProp('wave', val)} />
            <PreviewSlider
              title="Wave Size"
              min={2}
              max={14}
              step={1}
              value={waveAmplitude}
              valueUnit="px"
              isDisabled={!wave}
              onChange={val => updateProp('waveAmplitude', val)}
            />
            <PreviewSwitch title="Glow" isChecked={glow} onChange={val => updateProp('glow', val)} />
            <PreviewSlider
              title="Reset After"
              min={0}
              max={3000}
              step={100}
              value={resetAfter}
              valueUnit="ms"
              onChange={val => updateProp('resetAfter', val)}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={holdButton} componentName="HoldButton" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default HoldButtonDemo;
