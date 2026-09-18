import { useEffect, useMemo, useRef } from 'react';
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
import RefreshButton from '../../components/common/Preview/RefreshButton';

import CallChip from '../../content/Micro/CallChip/CallChip';
import { callChip } from '../../constants/code/Micro/callChipCode';

const DEFAULT_PROPS = {
  status: 'running',
  icon: 'terminal',
  color: '#f5f5f5',
  surfaceColor: '#27272a',
  progressColor: '#f5f5f5',
  progressOpacity: 0.08,
  doneColor: '#22c55e',
  errorColor: '#ef4444',
  size: 34,
  radius: 10,
  expectedMs: 2500,
  washOpacity: 0.14,
  shake: 6,
  showTimer: true
};

const STATUS_OPTIONS = [
  { value: 'running', label: 'Running' },
  { value: 'done', label: 'Done' },
  { value: 'error', label: 'Error' }
];
const ICON_OPTIONS = [
  { value: 'terminal', label: 'Terminal' },
  { value: 'file', label: 'File' },
  { value: 'search', label: 'Search' },
  { value: 'edit', label: 'Edit' }
];

const CallChipDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    status,
    icon,
    color,
    surfaceColor,
    progressColor,
    progressOpacity,
    doneColor,
    errorColor,
    size,
    radius,
    expectedMs,
    washOpacity,
    shake,
    showTimer
  } = props;

  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedSurface = useColorModeValue(
    surfaceColor === DEFAULT_PROPS.surfaceColor ? '#f6f6f6' : surfaceColor,
    surfaceColor
  );
  const renderedProgress = useColorModeValue(
    progressColor === DEFAULT_PROPS.progressColor ? '#18181b' : progressColor,
    progressColor
  );

  const timer = useRef(undefined);
  const outcome = useRef(status);
  outcome.current = status;
  const replay = () => {
    clearTimeout(timer.current);
    const fail = outcome.current === 'error';
    updateProp('status', 'running');
    timer.current = setTimeout(
      () => updateProp('status', fail ? 'error' : 'done'),
      fail ? Math.round(expectedMs * 0.62) : expectedMs + 300
    );
  };
  useEffect(() => {
    replay();
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedMs]);

  const propData = useMemo(
    () => [
      {
        name: 'icon',
        type: '"terminal" | "file" | "search" | "edit" | ReactNode',
        default: '"terminal"',
        description: 'The tool glyph. It rolls out when the call resolves.'
      },
      { name: 'name', type: 'string', default: '"bash"', description: 'The tool name.' },
      { name: 'argument', type: 'string', default: '"npm test"', description: 'The argument.' },
      {
        name: 'status',
        type: '"idle" | "running" | "done" | "error"',
        default: '"running"',
        description:
          'Running wipes the fill across and ticks the counter. Done completes it with a wash. Error stops it, tints and shakes.'
      },
      {
        name: 'expectedMs',
        type: 'number',
        default: '2500',
        description: 'Milliseconds the fill takes to reach its 90% park, the time you expect the call to take.'
      },
      {
        name: 'size',
        type: 'number',
        default: '34',
        description: 'Chip height in pixels. Font, padding and glyph follow.'
      },
      {
        name: 'radius',
        type: 'number',
        default: '10',
        description: 'Corner radius in pixels. Half the height is a pill.'
      },
      { name: 'color', type: 'string', default: '"currentColor"', description: 'Ink for the text and the tool glyph.' },
      { name: 'surfaceColor', type: 'string', default: '"#27272a"', description: 'The chip surface.' },
      {
        name: 'progressColor',
        type: 'string',
        default: '"currentColor"',
        description: 'The fill that wipes across while running.'
      },
      { name: 'progressOpacity', type: 'number', default: '0.08', description: 'How strong that fill is.' },
      { name: 'doneColor', type: 'string', default: '"#22c55e"', description: 'The success wash and the check.' },
      {
        name: 'errorColor',
        type: 'string',
        default: '"#ef4444"',
        description: 'The stopped fill and the retry glyph on error.'
      },
      {
        name: 'washOpacity',
        type: 'number',
        default: '0.14',
        description: 'Strength of the success wash and of the error tint.'
      },
      { name: 'shake', type: 'number', default: '6', description: 'Error shake amplitude in pixels. 0 tints only.' },
      { name: 'showTimer', type: 'boolean', default: 'true', description: 'Shows the millisecond counter.' },
      {
        name: 'onRetry',
        type: '() => void',
        default: '-',
        description: 'When set, the failed chip becomes a retry button.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' },
      { name: 'style', type: 'CSSProperties', default: 'undefined', description: 'Inline styles merged onto the root.' }
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
            <RefreshButton onClick={replay} />
            <CallChip
              icon={icon}
              status={status}
              expectedMs={expectedMs}
              size={size}
              radius={radius}
              color={renderedColor}
              surfaceColor={renderedSurface}
              progressColor={renderedProgress}
              progressOpacity={progressOpacity}
              doneColor={doneColor}
              errorColor={errorColor}
              washOpacity={washOpacity}
              shake={shake}
              showTimer={showTimer}
              onRetry={replay}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={val => {
                clearTimeout(timer.current);
                updateProp('status', val);
              }}
              width={120}
            />
            <PreviewSelect
              title="Icon"
              options={ICON_OPTIONS}
              value={icon}
              onChange={val => updateProp('icon', val)}
              width={120}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom
              title="Surface"
              color={renderedSurface}
              onChange={val => updateProp('surfaceColor', val)}
            />
            <PreviewColorPickerCustom
              title="Progress"
              color={renderedProgress}
              onChange={val => updateProp('progressColor', val)}
            />
            <PreviewColorPickerCustom title="Done" color={doneColor} onChange={val => updateProp('doneColor', val)} />
            <PreviewColorPickerCustom
              title="Error"
              color={errorColor}
              onChange={val => updateProp('errorColor', val)}
            />
            <PreviewSlider
              title="Size"
              min={24}
              max={48}
              step={1}
              value={size}
              valueUnit="px"
              onChange={val => updateProp('size', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={24}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Progress Opacity"
              min={0.04}
              max={0.3}
              step={0.01}
              value={progressOpacity}
              onChange={val => updateProp('progressOpacity', val)}
            />
            <PreviewSlider
              title="Expected Time"
              min={500}
              max={8000}
              step={100}
              value={expectedMs}
              valueUnit="ms"
              onChange={val => updateProp('expectedMs', val)}
            />
            <PreviewSlider
              title="Wash"
              min={0}
              max={0.4}
              step={0.02}
              value={washOpacity}
              onChange={val => updateProp('washOpacity', val)}
            />
            <PreviewSlider
              title="Shake"
              min={0}
              max={12}
              step={1}
              value={shake}
              valueUnit="px"
              onChange={val => updateProp('shake', val)}
            />
            <PreviewSwitch title="Show Timer" isChecked={showTimer} onChange={val => updateProp('showTimer', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={callChip} componentName="CallChip" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CallChipDemo;
