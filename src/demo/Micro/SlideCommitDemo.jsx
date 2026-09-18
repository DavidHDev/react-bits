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

import SlideCommit from '../../content/Micro/SlideCommit/SlideCommit';
import { slideCommit } from '../../constants/code/Micro/slideCommitCode';

const DEFAULT_PROPS = {
  outcome: 'resolve',
  latency: 1200,
  label: 'Slide to pay',
  doneLabel: 'Paid',
  errorLabel: 'Payment failed',
  trackColor: '#262626',
  handleColor: '#f5f5f5',
  successColor: '#22c55e',
  dangerColor: '#e5484d',
  width: 280,
  height: 56,
  radius: 28,
  speed: 50,
  returnBounce: 0.38,
  landingDip: 0.026,
  holdMs: 1500,
  disabled: false
};

const OUTCOME_OPTIONS = [
  { value: 'resolve', label: 'Resolve' },
  { value: 'reject', label: 'Reject' },
  { value: 'instant', label: 'Instant' }
];

const SlideCommitDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    outcome,
    latency,
    label,
    doneLabel,
    errorLabel,
    trackColor,
    handleColor,
    successColor,
    dangerColor,
    width,
    height,
    radius,
    speed,
    returnBounce,
    landingDip,
    holdMs,
    disabled
  } = props;

  const renderedTrack = useColorModeValue(trackColor === DEFAULT_PROPS.trackColor ? '#f6f6f6' : trackColor, trackColor);
  const renderedHandle = useColorModeValue(
    handleColor === DEFAULT_PROPS.handleColor ? '#18181b' : handleColor,
    handleColor
  );

  const handleConfirm = () => {
    if (outcome === 'instant') return undefined;
    return new Promise((resolve, reject) => {
      setTimeout(() => (outcome === 'reject' ? reject(new Error('Declined')) : resolve()), latency);
    });
  };

  const propData = useMemo(
    () => [
      {
        name: 'label',
        type: 'ReactNode',
        default: '"Slide to pay"',
        description: 'The instruction centred in the pill; the capsule wipes it as you drag.'
      },
      {
        name: 'doneLabel',
        type: 'ReactNode',
        default: '"Paid"',
        description: 'The words beside the check once confirmed.'
      },
      {
        name: 'errorLabel',
        type: 'ReactNode',
        default: '"Payment failed"',
        description: 'Replaces the instruction, in the danger colour, after a rejected promise.'
      },
      {
        name: 'onConfirm',
        type: '() => void | Promise<unknown>',
        default: '-',
        description:
          'Called when the handle reaches the end. Return a promise to show the spinner; it unfurls on resolve and springs home on reject.'
      },
      { name: 'onDone', type: '() => void', default: '-', description: 'Called when the done pill unfurls.' },
      {
        name: 'onError',
        type: '(reason: unknown) => void',
        default: '-',
        description: 'Called with the rejection reason; the component swallows it otherwise.'
      },
      { name: 'trackColor', type: 'string', default: '"#262626"', description: 'The pill behind the handle.' },
      {
        name: 'handleColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'The handle and the ground it paints; the arrow colour is picked to read on it.'
      },
      { name: 'successColor', type: 'string', default: '"#22c55e"', description: 'Fill of the done pill.' },
      {
        name: 'dangerColor',
        type: 'string',
        default: '"#e5484d"',
        description: 'Tint of the handle and error label after a reject.'
      },
      {
        name: 'width',
        type: 'number',
        default: '280',
        description: 'Track width in pixels; the travel scales with it.'
      },
      {
        name: 'height',
        type: 'number',
        default: '56',
        description: 'Track height in pixels; the handle is 8px smaller.'
      },
      {
        name: 'radius',
        type: 'number',
        default: '28',
        description: 'Track corner radius; the handle corner is 4px smaller so the two stay concentric.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '50',
        description: 'How fast the unfurl and the return take over once you let go.'
      },
      {
        name: 'returnBounce',
        type: 'number',
        default: '0.38',
        description: 'Energy left when the handle returns to the wall: 0 stops dead, 0.38 fills the 8% squash.'
      },
      {
        name: 'landingDip',
        type: 'number',
        default: '0.026',
        description: 'How much the track dips as the done pill lands. 0 removes it.'
      },
      {
        name: 'holdMs',
        type: 'number',
        default: '1500',
        description: 'How long the done pill stands before it closes back. 0 keeps it until the component remounts.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the control and ignores input.' },
      { name: 'icon', type: 'ReactNode', default: 'undefined', description: 'Replaces the arrow in the handle.' },
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
            <SlideCommit
              label={label}
              doneLabel={doneLabel}
              errorLabel={errorLabel}
              onConfirm={handleConfirm}
              trackColor={renderedTrack}
              handleColor={renderedHandle}
              successColor={successColor}
              dangerColor={dangerColor}
              width={width}
              height={height}
              radius={radius}
              speed={speed}
              returnBounce={returnBounce}
              landingDip={landingDip}
              holdMs={holdMs}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Outcome"
              options={OUTCOME_OPTIONS}
              value={outcome}
              onChange={val => updateProp('outcome', val)}
              width={120}
            />
            <PreviewSlider
              title="Latency"
              min={0}
              max={3000}
              step={100}
              value={latency}
              valueUnit="ms"
              onChange={val => updateProp('latency', val)}
            />
            <PreviewInput title="Label" value={label} maxLength={28} onChange={val => updateProp('label', val)} />
            <PreviewInput
              title="Done Label"
              value={doneLabel}
              maxLength={20}
              onChange={val => updateProp('doneLabel', val)}
            />
            <PreviewInput
              title="Error Label"
              value={errorLabel}
              maxLength={28}
              onChange={val => updateProp('errorLabel', val)}
            />
            <PreviewColorPickerCustom
              title="Track"
              color={renderedTrack}
              onChange={val => updateProp('trackColor', val)}
            />
            <PreviewColorPickerCustom
              title="Handle"
              color={renderedHandle}
              onChange={val => updateProp('handleColor', val)}
            />
            <PreviewColorPickerCustom
              title="Success"
              color={successColor}
              onChange={val => updateProp('successColor', val)}
            />
            <PreviewColorPickerCustom
              title="Danger"
              color={dangerColor}
              onChange={val => updateProp('dangerColor', val)}
            />
            <PreviewSlider
              title="Width"
              min={220}
              max={380}
              step={4}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
            />
            <PreviewSlider
              title="Height"
              min={44}
              max={72}
              step={2}
              value={height}
              valueUnit="px"
              onChange={val => updateProp('height', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={36}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
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
              title="Return Bounce"
              min={0}
              max={0.5}
              step={0.02}
              value={returnBounce}
              onChange={val => updateProp('returnBounce', val)}
            />
            <PreviewSlider
              title="Landing Dip"
              min={0}
              max={0.06}
              step={0.002}
              value={landingDip}
              onChange={val => updateProp('landingDip', val)}
            />
            <PreviewSlider
              title="Hold"
              min={500}
              max={4000}
              step={100}
              value={holdMs}
              valueUnit="ms"
              onChange={val => updateProp('holdMs', val)}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={slideCommit} componentName="SlideCommit" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SlideCommitDemo;
