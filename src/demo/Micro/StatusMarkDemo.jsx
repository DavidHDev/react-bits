import { useEffect, useMemo, useRef, useState } from 'react';
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

import StatusMark from '../../content/Micro/StatusMark/StatusMark';
import { statusMark } from '../../constants/code/Micro/statusMarkCode';

const DEFAULT_PROPS = {
  status: 'running',
  indeterminate: true,
  progress: 0.62,
  label: 'Draft supplier emails',
  color: '#f5f5f5',
  doneColor: '#22c55e',
  errorColor: '#ef4444',
  size: 28,
  strokeWidth: 2,
  dashes: 8,
  fontSize: 16,
  spinDuration: 1100,
  arcLength: 0.68,
  drawDuration: 240,
  fillOpacity: 0.06,
  strike: true,
  strikeDelay: 60
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'running', label: 'Running' },
  { value: 'done', label: 'Done' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const LIFECYCLE = [
  ['pending', undefined, 900],
  ['running', undefined, 1600],
  ['running', 0.35, 700],
  ['running', 0.72, 700],
  ['running', 1, 400],
  ['done', undefined, 1800],
  ['pending', undefined, 700],
  ['running', undefined, 1200],
  ['cancelled', undefined, 1400],
  ['pending', undefined, 700],
  ['running', 0.4, 900],
  ['failed', undefined, 1600]
];

const StatusMarkDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    status,
    indeterminate,
    progress,
    label,
    color,
    doneColor,
    errorColor,
    size,
    strokeWidth,
    dashes,
    fontSize,
    spinDuration,
    arcLength,
    drawDuration,
    fillOpacity,
    strike,
    strikeDelay
  } = props;

  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedDone = useColorModeValue(doneColor === DEFAULT_PROPS.doneColor ? '#16a34a' : doneColor, doneColor);
  const renderedError = useColorModeValue(errorColor === DEFAULT_PROPS.errorColor ? '#dc2626' : errorColor, errorColor);

  const [play, setPlay] = useState(true);
  const [auto, setAuto] = useState({ status: 'pending', progress: undefined });
  const timer = useRef(undefined);
  useEffect(() => {
    if (!play) return undefined;
    let step = 0;
    const next = () => {
      const [s, p, hold] = LIFECYCLE[step];
      setAuto({ status: s, progress: p });
      step = (step + 1) % LIFECYCLE.length;
      timer.current = setTimeout(next, hold);
    };
    next();
    return () => clearTimeout(timer.current);
  }, [play]);
  const manual = (key, val) => {
    setPlay(false);
    updateProp(key, val);
  };

  const shownStatus = play ? auto.status : status;
  const shownProgress = play ? auto.progress : indeterminate ? undefined : progress;

  const propData = useMemo(
    () => [
      {
        name: 'status',
        type: '"pending" | "running" | "done" | "failed" | "cancelled"',
        default: '"pending"',
        description: 'The lifecycle state. Every change morphs the glyph in place.'
      },
      {
        name: 'progress',
        type: 'number',
        default: 'undefined',
        description: '0 to 1 while running. Leave it out for an indeterminate spinning arc.'
      },
      {
        name: 'label',
        type: 'ReactNode',
        default: 'undefined',
        description: 'Text beside the glyph. It dims and gets struck.'
      },
      {
        name: 'color',
        type: 'string',
        default: '"currentColor"',
        description: 'Ring, arc, cancelled cross and label.'
      },
      { name: 'doneColor', type: 'string', default: '"#22c55e"', description: 'Ring, wash and check when done.' },
      { name: 'errorColor', type: 'string', default: '"#ef4444"', description: 'Ring, wash and cross when failed.' },
      {
        name: 'size',
        type: 'number',
        default: '20',
        description: 'Glyph size in pixels. The label gap is half of it.'
      },
      {
        name: 'strokeWidth',
        type: 'number',
        default: '2',
        description: 'Stroke width in the 24-unit box. The ring shrinks to keep its margin.'
      },
      {
        name: 'dashes',
        type: 'number',
        default: '8',
        description: 'Dashes in the idle ring, the ones that fuse into the arc.'
      },
      {
        name: 'fontSize',
        type: 'number',
        default: '14',
        description: 'Label size in pixels. The strike scales with it.'
      },
      {
        name: 'spinDuration',
        type: 'number',
        default: '1100',
        description: 'Milliseconds per turn of the indeterminate arc.'
      },
      {
        name: 'arcLength',
        type: 'number',
        default: '0.68',
        description: 'Share of the ring the indeterminate arc covers.'
      },
      {
        name: 'drawDuration',
        type: 'number',
        default: '240',
        description: 'Milliseconds the check or cross takes to draw.'
      },
      { name: 'fillOpacity', type: 'number', default: '0.06', description: 'The wash inside a finished ring.' },
      { name: 'strike', type: 'boolean', default: 'true', description: 'Strikes the label through when done.' },
      {
        name: 'strikeDelay',
        type: 'number',
        default: '60',
        description: 'Milliseconds after the check starts before the strike wipes in.'
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
            <StatusMark
              status={shownStatus}
              progress={shownProgress}
              label={label || undefined}
              color={renderedColor}
              doneColor={renderedDone}
              errorColor={renderedError}
              size={size}
              strokeWidth={strokeWidth}
              dashes={dashes}
              fontSize={fontSize}
              spinDuration={spinDuration}
              arcLength={arcLength}
              drawDuration={drawDuration}
              fillOpacity={fillOpacity}
              strike={strike}
              strikeDelay={strikeDelay}
            />
          </Box>

          <Customize>
            <PreviewSwitch title="Play Lifecycle" isChecked={play} onChange={setPlay} />
            <PreviewSelect
              title="Status"
              options={STATUS_OPTIONS}
              value={shownStatus}
              onChange={val => manual('status', val)}
              width={130}
            />
            <PreviewSwitch
              title="Indeterminate"
              isChecked={indeterminate}
              onChange={val => manual('indeterminate', val)}
            />
            <PreviewSlider
              title="Progress"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              isDisabled={indeterminate}
              onChange={val => manual('progress', val)}
            />
            <PreviewInput title="Label" value={label} maxLength={32} onChange={val => updateProp('label', val)} />
            <PreviewColorPickerCustom title="Ink" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom
              title="Done"
              color={renderedDone}
              onChange={val => updateProp('doneColor', val)}
            />
            <PreviewColorPickerCustom
              title="Error"
              color={renderedError}
              onChange={val => updateProp('errorColor', val)}
            />
            <PreviewSlider
              title="Size"
              min={16}
              max={40}
              step={1}
              value={size}
              valueUnit="px"
              onChange={val => updateProp('size', val)}
            />
            <PreviewSlider
              title="Stroke"
              min={1.5}
              max={3}
              step={0.25}
              value={strokeWidth}
              onChange={val => updateProp('strokeWidth', val)}
            />
            <PreviewSlider
              title="Dashes"
              min={4}
              max={16}
              step={1}
              value={dashes}
              onChange={val => updateProp('dashes', val)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={22}
              step={1}
              value={fontSize}
              valueUnit="px"
              onChange={val => updateProp('fontSize', val)}
            />
            <PreviewSlider
              title="Spin"
              min={600}
              max={2000}
              step={50}
              value={spinDuration}
              valueUnit="ms"
              onChange={val => updateProp('spinDuration', val)}
            />
            <PreviewSlider
              title="Arc Length"
              min={0.2}
              max={0.9}
              step={0.01}
              value={arcLength}
              onChange={val => updateProp('arcLength', val)}
            />
            <PreviewSlider
              title="Draw"
              min={120}
              max={600}
              step={10}
              value={drawDuration}
              valueUnit="ms"
              onChange={val => updateProp('drawDuration', val)}
            />
            <PreviewSlider
              title="Fill"
              min={0}
              max={0.25}
              step={0.01}
              value={fillOpacity}
              onChange={val => updateProp('fillOpacity', val)}
            />
            <PreviewSwitch title="Strike Label" isChecked={strike} onChange={val => updateProp('strike', val)} />
            <PreviewSlider
              title="Strike Delay"
              min={0}
              max={300}
              step={10}
              value={strikeDelay}
              valueUnit="ms"
              onChange={val => updateProp('strikeDelay', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={statusMark} componentName="StatusMark" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default StatusMarkDemo;
