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

import VoicePill from '../../content/Micro/VoicePill/VoicePill';
import { voicePill } from '../../constants/code/Micro/voicePillCode';

const DEFAULT_PROPS = {
  accentColor: '#f5f5f5',
  iconColor: '#a1a1aa',
  background: '#27272a',
  size: 40,
  shape: 'pill',
  reach: 12,
  showTime: true,
  waveform: true,
  slideToCancel: true,
  cancelDistance: 64,
  attack: 40,
  release: 240,
  sensitivity: 1,
  floor: 0.1,
  openDuration: 200,
  pressScale: 0.95,
  mode: 'auto',
  holdAfter: 300,
  reactive: 'simulated',
  disabled: false
};

const SHAPE_OPTIONS = [
  { value: 'pill', label: 'Pill' },
  { value: 'rounded', label: 'Rounded' }
];
const MODE_OPTIONS = [
  { value: 'auto', label: 'Tap or hold' },
  { value: 'hold', label: 'Hold only' },
  { value: 'toggle', label: 'Toggle' }
];
const SIGNAL_OPTIONS = [
  { value: 'simulated', label: 'Simulated' },
  { value: 'mic', label: 'Microphone' }
];

const VoicePillDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    accentColor,
    iconColor,
    background,
    size,
    shape,
    reach,
    showTime,
    waveform,
    slideToCancel,
    cancelDistance,
    attack,
    release,
    sensitivity,
    floor,
    openDuration,
    pressScale,
    mode,
    holdAfter,
    reactive,
    disabled
  } = props;

  const renderedAccent = useColorModeValue(
    accentColor === DEFAULT_PROPS.accentColor ? '#18181b' : accentColor,
    accentColor
  );
  const renderedIcon = useColorModeValue(iconColor === DEFAULT_PROPS.iconColor ? '#71717a' : iconColor, iconColor);
  const renderedBackground = useColorModeValue(
    background === DEFAULT_PROPS.background ? '#f6f6f6' : background,
    background
  );

  const propData = useMemo(
    () => [
      {
        name: 'accentColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'The waveform, the clock and the stop mark.'
      },
      { name: 'iconColor', type: 'string', default: '"#a1a1aa"', description: 'The mic at rest, and the hover wash.' },
      {
        name: 'background',
        type: 'string',
        default: '"#27272a"',
        description: 'The capsule surface.'
      },
      {
        name: 'size',
        type: 'number',
        default: '28',
        description: 'Footprint in px. The icon, the stop mark and the clock scale with it.'
      },
      {
        name: 'shape',
        type: "'pill' | 'rounded'",
        default: "'pill'",
        description: 'A circle that opens into a capsule, or a rounded square.'
      },
      {
        name: 'reach',
        type: 'number',
        default: '8',
        description: 'The room the capsule leaves before the waveform, in px.'
      },
      {
        name: 'showTime',
        type: 'boolean',
        default: 'true',
        description: 'An elapsed clock in the capsule, which grows to the left to hold it.'
      },
      {
        name: 'waveform',
        type: 'boolean',
        default: 'true',
        description: 'A history of the level scrolling through the capsule, past the clock.'
      },
      {
        name: 'slideToCancel',
        type: 'boolean',
        default: 'true',
        description:
          'While held, sliding left drags the capsule contents along and reveals Cancel. Crossing the distance scatters the bars and stops without a result.'
      },
      {
        name: 'cancelDistance',
        type: 'number',
        default: '64',
        description: 'How far left a held pointer slides before it cancels, in px.'
      },
      {
        name: 'attack',
        type: 'number',
        default: '40',
        description: 'How fast the level rises to a louder signal, in ms.'
      },
      {
        name: 'release',
        type: 'number',
        default: '240',
        description: 'How long the level hangs after the sound drops, in ms.'
      },
      { name: 'sensitivity', type: 'number', default: '1', description: 'Gain on the signal before the envelope.' },
      {
        name: 'floor',
        type: 'number',
        default: '0.1',
        description: 'Waveform bar height when silent, as a fraction of its box.'
      },
      { name: 'openDuration', type: 'number', default: '200', description: 'The capsule open and close, in ms.' },
      {
        name: 'pressScale',
        type: 'number',
        default: '0.95',
        description: 'Scale of the button while a pointer is down.'
      },
      {
        name: 'mode',
        type: "'auto' | 'hold' | 'toggle'",
        default: "'auto'",
        description:
          'Auto: a tap latches, a hold stops on release. Hold: release always stops. Toggle: release never stops.'
      },
      {
        name: 'holdAfter',
        type: 'number',
        default: '300',
        description: 'In auto, the press length after which a release stops instead of latching, in ms.'
      },
      {
        name: 'reactive',
        type: "'simulated' | 'mic'",
        default: "'simulated'",
        description:
          'What drives the level. Mic asks for microphone permission on the first press and stops if it is refused.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dimmed and inert. A listening pill stops.' },
      {
        name: 'ariaLabel',
        type: 'string',
        default: '"Dictate"',
        description: 'Accessible name. The state is carried by aria-pressed.'
      },
      {
        name: 'onStart',
        type: '({ source }) => void',
        default: '-',
        description: 'Listening began, with the requested source.'
      },
      {
        name: 'onStop',
        type: '({ reason, duration }) => void',
        default: '-',
        description:
          'Listening ended. Reason is release, tap, key, escape, blur, cancel, disabled, mic-denied or unmount; duration in ms.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the button.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            <VoicePill
              accentColor={renderedAccent}
              iconColor={renderedIcon}
              background={renderedBackground}
              size={size}
              shape={shape}
              reach={reach}
              showTime={showTime}
              waveform={waveform}
              slideToCancel={slideToCancel}
              cancelDistance={cancelDistance}
              attack={attack}
              release={release}
              sensitivity={sensitivity}
              floor={floor}
              openDuration={openDuration}
              pressScale={pressScale}
              mode={mode}
              holdAfter={holdAfter}
              reactive={reactive}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent}
              onChange={val => updateProp('accentColor', val)}
            />
            <PreviewColorPickerCustom
              title="Icon"
              color={renderedIcon}
              onChange={val => updateProp('iconColor', val)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground}
              onChange={val => updateProp('background', val)}
            />
            <PreviewSlider
              title="Size"
              min={24}
              max={64}
              step={2}
              value={size}
              valueUnit="px"
              onChange={val => updateProp('size', val)}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={shape}
              onChange={val => updateProp('shape', val)}
              width={130}
            />
            <PreviewSlider
              title="Reach"
              min={0}
              max={20}
              step={1}
              value={reach}
              valueUnit="px"
              onChange={val => updateProp('reach', val)}
            />
            <PreviewSwitch title="Show Time" isChecked={showTime} onChange={val => updateProp('showTime', val)} />
            <PreviewSwitch title="Waveform" isChecked={waveform} onChange={val => updateProp('waveform', val)} />
            <PreviewSwitch
              title="Slide To Cancel"
              isChecked={slideToCancel}
              onChange={val => updateProp('slideToCancel', val)}
            />
            <PreviewSlider
              title="Cancel Distance"
              min={32}
              max={160}
              step={4}
              value={cancelDistance}
              valueUnit="px"
              isDisabled={!slideToCancel}
              onChange={val => updateProp('cancelDistance', val)}
            />
            <PreviewSlider
              title="Attack"
              min={5}
              max={200}
              step={5}
              value={attack}
              valueUnit="ms"
              onChange={val => updateProp('attack', val)}
            />
            <PreviewSlider
              title="Release"
              min={60}
              max={900}
              step={10}
              value={release}
              valueUnit="ms"
              onChange={val => updateProp('release', val)}
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
              title="Quiet Height"
              min={0}
              max={0.5}
              step={0.05}
              value={floor}
              onChange={val => updateProp('floor', val)}
            />
            <PreviewSlider
              title="Open"
              min={120}
              max={320}
              step={10}
              value={openDuration}
              valueUnit="ms"
              onChange={val => updateProp('openDuration', val)}
            />
            <PreviewSlider
              title="Press Scale"
              min={0.88}
              max={1}
              step={0.01}
              value={pressScale}
              onChange={val => updateProp('pressScale', val)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={mode}
              onChange={val => updateProp('mode', val)}
              width={150}
            />
            <PreviewSlider
              title="Hold After"
              min={100}
              max={800}
              step={50}
              value={holdAfter}
              valueUnit="ms"
              isDisabled={mode !== 'auto'}
              onChange={val => updateProp('holdAfter', val)}
            />
            <PreviewSelect
              title="Signal"
              options={SIGNAL_OPTIONS}
              value={reactive}
              onChange={val => updateProp('reactive', val)}
              width={150}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={voicePill} />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default VoicePillDemo;
