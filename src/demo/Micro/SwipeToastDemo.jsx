import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
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
import RefreshButton from '../../components/common/Preview/RefreshButton';

import SwipeToast from '../../content/Micro/SwipeToast/SwipeToast';
import { swipeToast } from '../../constants/code/Micro/swipeToastCode';

const DEFAULT_PROPS = {
  title: 'File archived',
  description: 'Moved to Archive',
  actionLabel: 'Undo',
  background: '#27272a',
  color: '#f5f5f5',
  fuseColor: '#f5a524',
  width: 356,
  radius: 12,
  slideMs: 400,
  settleBounce: 0.2,
  swipeDistance: 40,
  duration: 4000,
  fuse: 'bottom',
  pauseOnHover: true,
  closeButton: false,
  inline: true
};

const FUSE_OPTIONS = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'none', label: 'None' }
];
const MAX_TOASTS = 3;

const SwipeToastDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    title,
    description,
    actionLabel,
    background,
    color,
    fuseColor,
    width,
    radius,
    slideMs,
    settleBounce,
    swipeDistance,
    duration,
    fuse,
    pauseOnHover,
    closeButton,
    inline
  } = props;

  const renderedBackground = useColorModeValue(
    background === DEFAULT_PROPS.background ? '#ffffff' : background,
    background
  );
  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);

  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const show = useCallback(() => {
    setToasts(current => {
      const next = [...current, { id: nextId.current++, open: true }];
      const live = next.filter(t => t.open);
      if (live.length > MAX_TOASTS) {
        const oldest = live[0].id;
        return next.map(t => (t.id === oldest ? { ...t, open: false } : t));
      }
      return next;
    });
  }, []);
  const remove = useCallback(id => setToasts(current => current.filter(t => t.id !== id)), []);
  const reset = () => {
    setToasts([]);
    show();
  };
  useEffect(() => {
    show();
  }, [show]);

  const propData = useMemo(
    () => [
      { name: 'title', type: 'ReactNode', default: '"File archived"', description: 'The first line.' },
      { name: 'description', type: 'ReactNode', default: '""', description: 'The dimmer second line. Empty hides it.' },
      { name: 'icon', type: 'ReactNode', default: 'undefined', description: 'An 18px icon before the text.' },
      { name: 'actionLabel', type: 'ReactNode', default: '""', description: 'The inverted button. Empty hides it.' },
      {
        name: 'onAction',
        type: '() => void',
        default: '-',
        description: 'Called when the action is pressed, before the close.'
      },
      {
        name: 'open',
        type: 'boolean',
        default: 'true',
        description: 'Flip to false to close from outside. True again re-enters.'
      },
      {
        name: 'onClose',
        type: '(reason) => void',
        default: '-',
        description:
          'Called after the exit, and after the inline slot has collapsed. Reason is timeout, swipe, action, close, escape or programmatic.'
      },
      {
        name: 'background',
        type: 'string',
        default: '"#27272a"',
        description: 'The card surface, and the action text.'
      },
      {
        name: 'color',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'Ink: title, description at 62% and the action fill.'
      },
      { name: 'fuseColor', type: 'string', default: '"#f5a524"', description: 'The burning line.' },
      {
        name: 'width',
        type: 'number',
        default: '356',
        description: 'Card width in pixels, capped at the parent when inline.'
      },
      { name: 'radius', type: 'number', default: '12', description: 'Corner radius in pixels.' },
      { name: 'slideMs', type: 'number', default: '400', description: 'How long the rise and the drop take.' },
      {
        name: 'settleBounce',
        type: 'number',
        default: '0.2',
        description: 'Overshoot of the return after an abandoned swipe. 0 stops dead.'
      },
      {
        name: 'swipeDistance',
        type: 'number',
        default: '40',
        description: 'How far a slow drag must go before release dismisses. A flick always does.'
      },
      {
        name: 'duration',
        type: 'number',
        default: '4000',
        description: 'Milliseconds until it closes itself. Changing it re-arms the fuse. 0 keeps it until dismissed.'
      },
      {
        name: 'fuse',
        type: '"bottom" | "top" | "none"',
        default: '"bottom"',
        description: 'Which edge the line burns along. None keeps the timer but shows nothing.'
      },
      {
        name: 'pauseOnHover',
        type: 'boolean',
        default: 'true',
        description: 'Hovering freezes the line and the timer.'
      },
      { name: 'closeButton', type: 'boolean', default: 'false', description: 'Adds a cross at the end of the row.' },
      {
        name: 'inline',
        type: 'boolean',
        default: 'false',
        description: 'In flow inside the parent instead of fixed to the bottom-right of the viewport.'
      },
      { name: 'dismissible', type: 'boolean', default: 'true', description: 'Off removes the swipe and Escape.' },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            <RefreshButton onClick={reset} />
            <Button
              position="absolute"
              top="24px"
              left="50%"
              transform="translateX(-50%)"
              size="sm"
              variant="ghost"
              fontSize="13px"
              fontWeight={500}
              rounded="full"
              onClick={show}
            >
              Show toast
            </Button>
            <Box
              position="absolute"
              left="24px"
              right="24px"
              bottom="32px"
              display="flex"
              flexDirection="column"
              alignItems="flex-end"
            >
              {toasts.map(toast => (
                <SwipeToast
                  key={toast.id}
                  open={toast.open}
                  onClose={() => remove(toast.id)}
                  icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />}
                  title={title}
                  description={description}
                  actionLabel={actionLabel}
                  background={renderedBackground}
                  color={renderedColor}
                  fuseColor={fuseColor}
                  width={width}
                  radius={radius}
                  slideMs={slideMs}
                  settleBounce={settleBounce}
                  swipeDistance={swipeDistance}
                  duration={duration}
                  fuse={fuse}
                  pauseOnHover={pauseOnHover}
                  closeButton={closeButton}
                  inline={inline}
                />
              ))}
            </Box>
          </Box>

          <Customize>
            <PreviewInput title="Title" value={title} maxLength={32} onChange={val => updateProp('title', val)} />
            <PreviewInput
              title="Description"
              value={description}
              maxLength={48}
              onChange={val => updateProp('description', val)}
            />
            <PreviewInput
              title="Action Label"
              value={actionLabel}
              maxLength={12}
              onChange={val => updateProp('actionLabel', val)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground}
              onChange={val => updateProp('background', val)}
            />
            <PreviewColorPickerCustom title="Text" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom title="Fuse" color={fuseColor} onChange={val => updateProp('fuseColor', val)} />
            <PreviewSlider
              title="Width"
              min={280}
              max={420}
              step={4}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
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
              title="Slide"
              min={200}
              max={700}
              step={20}
              value={slideMs}
              valueUnit="ms"
              onChange={val => updateProp('slideMs', val)}
            />
            <PreviewSlider
              title="Settle Bounce"
              min={0}
              max={0.4}
              step={0.02}
              value={settleBounce}
              onChange={val => updateProp('settleBounce', val)}
            />
            <PreviewSlider
              title="Swipe Distance"
              min={12}
              max={96}
              step={2}
              value={swipeDistance}
              valueUnit="px"
              onChange={val => updateProp('swipeDistance', val)}
            />
            <PreviewSlider
              title="Duration"
              min={0}
              max={10000}
              step={250}
              value={duration}
              valueUnit="ms"
              onChange={val => updateProp('duration', val)}
            />
            <PreviewSelect
              title="Fuse"
              options={FUSE_OPTIONS}
              value={fuse}
              onChange={val => updateProp('fuse', val)}
              width={120}
            />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={pauseOnHover}
              onChange={val => updateProp('pauseOnHover', val)}
            />
            <PreviewSwitch
              title="Close Button"
              isChecked={closeButton}
              onChange={val => updateProp('closeButton', val)}
            />
            <PreviewSwitch title="Inline" isChecked={inline} onChange={val => updateProp('inline', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={swipeToast} componentName="SwipeToast" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SwipeToastDemo;
