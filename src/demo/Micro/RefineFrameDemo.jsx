import { useCallback, useEffect, useMemo, useRef } from 'react';
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

import RefineFrame from '../../content/Micro/RefineFrame/RefineFrame';
import { refineFrame } from '../../constants/code/Micro/refineFrameCode';

const DEFAULT_PROPS = {
  status: 'queued',
  aspectRatio: '4 / 3',
  width: 320,
  radius: 16,
  background: '#27272a',
  color: '#f5f5f5',
  stageDuration: 400,
  sweep: true,
  showStatus: true,
  hideAfter: 1200
};

const IMAGE =
  'https://images.unsplash.com/photo-1721407964262-f9864b562453?q=80&w=1180&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const STATUS_OPTIONS = [
  { value: 'queued', label: 'Queued' },
  { value: 'generating', label: 'Generating' },
  { value: 'refining', label: 'Refining' },
  { value: 'complete', label: 'Complete' },
  { value: 'error', label: 'Error' }
];
const ASPECT_OPTIONS = [
  { value: '4 / 3', label: '4 : 3' },
  { value: '1 / 1', label: '1 : 1' },
  { value: '16 / 9', label: '16 : 9' },
  { value: '3 / 4', label: '3 : 4' }
];
const WALK = [
  ['queued', 0],
  ['generating', 700],
  ['refining', 2300],
  ['complete', 3500]
];

const RefineFrameDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { status, aspectRatio, width, radius, background, color, stageDuration, sweep, showStatus, hideAfter } = props;

  const renderedBackground = useColorModeValue(
    background === DEFAULT_PROPS.background ? '#f6f6f6' : background,
    background
  );
  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);

  const timers = useRef([]);
  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const walk = useCallback(() => {
    stop();
    WALK.forEach(([next, at]) => timers.current.push(setTimeout(() => updateProp('status', next), at)));
  }, [stop, updateProp]);
  useEffect(() => {
    walk();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const propData = useMemo(
    () => [
      {
        name: 'status',
        type: "'queued' | 'generating' | 'refining' | 'complete' | 'error'",
        default: "'generating'",
        description: 'The stage. Each change tweens the media to that stage.'
      },
      {
        name: 'children',
        type: 'ReactNode',
        default: '-',
        description: 'The media: an img, video or canvas. It fills the frame.'
      },
      {
        name: 'aspectRatio',
        type: 'string',
        default: '"4 / 3"',
        description: 'The box reserved before and during generation, so nothing shifts.'
      },
      { name: 'width', type: 'number', default: '320', description: 'Frame width in px, capped at the parent.' },
      { name: 'radius', type: 'number', default: '16', description: 'Corner radius in px.' },
      {
        name: 'background',
        type: 'string',
        default: '"#27272a"',
        description: 'The paper behind the media, and the chip surface.'
      },
      {
        name: 'color',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'The ink: chip text, the sweep and the retry pill.'
      },
      { name: 'stageDuration', type: 'number', default: '400', description: 'Each stage tween, in ms.' },
      { name: 'sweep', type: 'boolean', default: 'true', description: 'A soft band crosses the frame while it works.' },
      {
        name: 'showStatus',
        type: 'boolean',
        default: 'true',
        description: 'The chip with the mark and the stage label.'
      },
      {
        name: 'hideAfter',
        type: 'number',
        default: '1200',
        description: 'Ms after completion before the chip fades. 0 keeps it.'
      },
      {
        name: 'labels',
        type: 'Partial<Record<status, string>>',
        default: 'DEFAULT_LABELS',
        description: 'Chip text per stage: Queued, Generating, Refining, Ready, Failed.'
      },
      { name: 'retryLabel', type: 'string', default: '"Retry"', description: 'The pill on an error.' },
      {
        name: 'onRetry',
        type: '() => void',
        default: '-',
        description: 'The retry pill was pressed. Without it, no pill.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the frame.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            <RefreshButton onClick={walk} />
            <RefineFrame
              status={status}
              aspectRatio={aspectRatio}
              width={width}
              radius={radius}
              background={renderedBackground}
              color={renderedColor}
              stageDuration={stageDuration}
              sweep={sweep}
              showStatus={showStatus}
              hideAfter={hideAfter}
              onRetry={walk}
            >
              <img src={IMAGE} alt="" crossOrigin="anonymous" draggable={false} />
            </RefineFrame>
          </Box>

          <Customize>
            <PreviewSelect
              title="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={val => {
                stop();
                updateProp('status', val);
              }}
              width={140}
            />
            <PreviewSelect
              title="Aspect"
              options={ASPECT_OPTIONS}
              value={aspectRatio}
              onChange={val => updateProp('aspectRatio', val)}
              width={110}
            />
            <PreviewSlider
              title="Width"
              min={200}
              max={480}
              step={8}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={32}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground}
              onChange={val => updateProp('background', val)}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewSlider
              title="Stage"
              min={150}
              max={900}
              step={10}
              value={stageDuration}
              valueUnit="ms"
              onChange={val => updateProp('stageDuration', val)}
            />
            <PreviewSwitch title="Sweep" isChecked={sweep} onChange={val => updateProp('sweep', val)} />
            <PreviewSwitch title="Show Status" isChecked={showStatus} onChange={val => updateProp('showStatus', val)} />
            <PreviewSlider
              title="Hide After"
              min={0}
              max={4000}
              step={100}
              value={hideAfter}
              valueUnit="ms"
              isDisabled={!showStatus}
              onChange={val => updateProp('hideAfter', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={refineFrame} />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default RefineFrameDemo;
