import { useMemo, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Archive02Icon, Delete02Icon, SentIcon } from '@hugeicons/core-free-icons';
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

import FuseButton from '../../content/Micro/FuseButton/FuseButton';
import { fuseButton } from '../../constants/code/Micro/fuseButtonCode';

const DEFAULT_PROPS = {
  preset: 'archive',
  color: '#f5f5f5',
  background: '#27272a',
  fuseColor: '#f5a524',
  size: 'md',
  radius: 22,
  undoWindow: 4000,
  fuse: 'outline',
  fuseThickness: 1.5,
  crossfadeMs: 200,
  commitOn: 'press',
  pauseOnHover: true,
  settle: 'reset',
  disabled: false
};

const PRESETS = {
  archive: { label: 'Archive', undoLabel: 'Undo', doneLabel: 'Archived', icon: Archive02Icon, fuse: '#f5a524' },
  send: { label: 'Send', undoLabel: 'Undo', doneLabel: 'Sent', icon: SentIcon, fuse: '#5b8def' },
  delete: { label: 'Delete', undoLabel: 'Undo', doneLabel: 'Deleted', icon: Delete02Icon, fuse: '#e5484d' }
};

const PRESET_OPTIONS = [
  { value: 'archive', label: 'Archive' },
  { value: 'send', label: 'Send' },
  { value: 'delete', label: 'Delete' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const FUSE_OPTIONS = [
  { value: 'outline', label: 'Outline' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' }
];

const COMMIT_OPTIONS = [
  { value: 'press', label: 'On press' },
  { value: 'fuseEnd', label: 'When fuse ends' }
];

const SETTLE_OPTIONS = [
  { value: 'reset', label: 'Reset' },
  { value: 'stay', label: 'Stay done' }
];

const FuseButtonDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    preset,
    color,
    background,
    fuseColor,
    size,
    radius,
    undoWindow,
    fuse,
    fuseThickness,
    crossfadeMs,
    commitOn,
    pauseOnHover,
    settle,
    disabled
  } = props;
  const [epoch, setEpoch] = useState(0);

  const content = PRESETS[preset] || PRESETS.archive;
  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedBackground = useColorModeValue(
    background === DEFAULT_PROPS.background ? '#f6f6f6' : background,
    background
  );
  const renderedFuse = fuseColor === DEFAULT_PROPS.fuseColor ? content.fuse : fuseColor;
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 17 : 15;

  const reset = () => {
    resetProps();
    setEpoch(e => e + 1);
  };

  const propData = useMemo(
    () => [
      { name: 'label', type: 'string', default: '"Archive"', description: 'The idle action.' },
      {
        name: 'undoLabel',
        type: 'string',
        default: '"Undo"',
        description: 'The label while the fuse burns; the whole pill is the Undo button.'
      },
      {
        name: 'doneLabel',
        type: 'string',
        default: '"Archived"',
        description:
          'Shown with a check once the fuse burns out and settle is stay; announced to screen readers on arm.'
      },
      {
        name: 'icon',
        type: 'ReactNode',
        default: 'undefined',
        description: 'The idle glyph; an archive icon when omitted.'
      },
      {
        name: 'color',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'Ink for labels and icons; the seam and tints derive from it.'
      },
      { name: 'background', type: 'string', default: '"#27272a"', description: 'The pill surface.' },
      { name: 'fuseColor', type: 'string', default: '"#f5a524"', description: 'The lit line or ring.' },
      {
        name: 'size',
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: 'Height 36, 44 or 52 pixels with matching type and icons.'
      },
      {
        name: 'radius',
        type: 'number',
        default: '22',
        description: 'Corner radius in pixels; 22 is a full pill at the medium size.'
      },
      {
        name: 'undoWindow',
        type: 'number',
        default: '4000',
        description: 'How long the fuse burns and Undo stays on offer, in milliseconds.'
      },
      {
        name: 'fuse',
        type: '"outline" | "bottom" | "top"',
        default: '"outline"',
        description: 'The pill rim burning down clockwise, or a line along the bottom or top edge.'
      },
      { name: 'fuseThickness', type: 'number', default: '1.5', description: 'Line height or rim stroke in pixels.' },
      {
        name: 'crossfadeMs',
        type: 'number',
        default: '200',
        description: 'Blur crossfade between faces after a pointer press. Keyboard commits swap instantly.'
      },
      {
        name: 'commitOn',
        type: '"press" | "fuseEnd"',
        default: '"press"',
        description: 'When onCommit fires: at the press, with Undo as the revert, or only once the fuse burns out.'
      },
      {
        name: 'pauseOnHover',
        type: 'boolean',
        default: 'true',
        description: 'Leaving and coming back with a mouse freezes the fuse until the pointer leaves again.'
      },
      {
        name: 'settle',
        type: '"reset" | "stay"',
        default: '"reset"',
        description: 'After the fuse ends: return to the idle face, or stay on a terminal done face until remounted.'
      },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description: 'Dims the idle face and ignores presses. Undo stays available while armed.'
      },
      { name: 'onCommit', type: '(reason: "press" | "fuseEnd") => void', default: '-', description: 'The action.' },
      {
        name: 'onUndo',
        type: '() => void',
        default: '-',
        description: 'Called when Undo or Escape runs the action back.'
      },
      {
        name: 'onFuseEnd',
        type: '() => void',
        default: '-',
        description: 'Called when the window closes without an undo.'
      },
      {
        name: 'onPhaseChange',
        type: '(phase: "idle" | "armed" | "settled") => void',
        default: '-',
        description: 'Called on every phase change.'
      },
      {
        name: 'type',
        type: '"button" | "submit" | "reset"',
        default: '"button"',
        description: 'Type of the idle button.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the pill.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={reset} hasChanges={hasChanges}>
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
            <RefreshButton onClick={() => setEpoch(e => e + 1)} />
            <FuseButton
              key={`${preset}-${epoch}`}
              label={content.label}
              undoLabel={content.undoLabel}
              doneLabel={content.doneLabel}
              icon={<HugeiconsIcon icon={content.icon} size={iconSize} strokeWidth={1.8} />}
              color={renderedColor}
              background={renderedBackground}
              fuseColor={renderedFuse}
              size={size}
              radius={radius}
              undoWindow={undoWindow}
              fuse={fuse}
              fuseThickness={fuseThickness}
              crossfadeMs={crossfadeMs}
              commitOn={commitOn}
              pauseOnHover={pauseOnHover}
              settle={settle}
              disabled={disabled}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Preset"
              options={PRESET_OPTIONS}
              value={preset}
              onChange={val => updateProp('preset', val)}
              width={120}
            />
            <PreviewColorPickerCustom title="Text" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground}
              onChange={val => updateProp('background', val)}
            />
            <PreviewColorPickerCustom
              title="Fuse"
              color={renderedFuse}
              onChange={val => updateProp('fuseColor', val)}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={size}
              onChange={val => updateProp('size', val)}
              width={120}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={26}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Undo Window"
              min={1000}
              max={10000}
              step={500}
              value={undoWindow}
              valueUnit="ms"
              onChange={val => updateProp('undoWindow', val)}
            />
            <PreviewSelect
              title="Fuse"
              options={FUSE_OPTIONS}
              value={fuse}
              onChange={val => updateProp('fuse', val)}
              width={120}
            />
            <PreviewSlider
              title="Fuse Thickness"
              min={1}
              max={4}
              step={0.5}
              value={fuseThickness}
              valueUnit="px"
              onChange={val => updateProp('fuseThickness', val)}
            />
            <PreviewSlider
              title="Crossfade"
              min={100}
              max={300}
              step={10}
              value={crossfadeMs}
              valueUnit="ms"
              onChange={val => updateProp('crossfadeMs', val)}
            />
            <PreviewSelect
              title="Commit On"
              options={COMMIT_OPTIONS}
              value={commitOn}
              onChange={val => updateProp('commitOn', val)}
              width={160}
            />
            <PreviewSelect
              title="After Fuse"
              options={SETTLE_OPTIONS}
              value={settle}
              onChange={val => updateProp('settle', val)}
              width={130}
            />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={pauseOnHover}
              onChange={val => updateProp('pauseOnHover', val)}
            />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={fuseButton} componentName="FuseButton" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FuseButtonDemo;
