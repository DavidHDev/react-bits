import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AirplaneTakeOff01Icon,
  Archive02Icon,
  Delete02Icon,
  Flag02Icon,
  Invoice01Icon,
  Note01Icon
} from '@hugeicons/core-free-icons';
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

import SwipeRow from '../../content/Micro/SwipeRow/SwipeRow';
import { swipeRow } from '../../constants/code/Micro/swipeRowCode';

const DEFAULT_PROPS = {
  drawer: 'two',
  actionColor: '#e5484d',
  drawerColor: '#3f3f46',
  rowColor: '#27272a',
  textColor: '#f5f5f5',
  height: 64,
  radius: 16,
  actionWidth: 80,
  direction: 'left',
  snapBounce: 0.2,
  resistance: 0.55,
  collapseMs: 200,
  commitAt: 0.6,
  fullSwipe: true,
  disabled: false
};

const DRAWER_OPTIONS = [
  { value: 'one', label: 'Delete' },
  { value: 'two', label: 'Archive, Delete' },
  { value: 'three', label: 'Flag, Archive, Delete' }
];
const DIRECTION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const icon = glyph => <HugeiconsIcon icon={glyph} size={20} strokeWidth={2} />;
const ACTION_SETS = {
  one: [{ id: 'delete', label: 'Delete', icon: icon(Delete02Icon) }],
  two: [
    { id: 'delete', label: 'Delete', icon: icon(Delete02Icon) },
    { id: 'archive', label: 'Archive', icon: icon(Archive02Icon), dismiss: true }
  ],
  three: [
    { id: 'delete', label: 'Delete', icon: icon(Delete02Icon) },
    { id: 'archive', label: 'Archive', icon: icon(Archive02Icon), dismiss: true },
    { id: 'flag', label: 'Flag', icon: icon(Flag02Icon) }
  ]
};

const ROWS = [
  { id: 'notes', icon: Note01Icon, title: 'Design review notes', subtitle: 'Edited 2 min ago', meta: '9:41' },
  {
    id: 'flight',
    icon: AirplaneTakeOff01Icon,
    title: 'Flight to Lisbon',
    subtitle: 'Gate changes to B12',
    meta: 'Tue'
  },
  { id: 'invoice', icon: Invoice01Icon, title: 'Invoice #1042', subtitle: 'Due in 3 days', meta: '$1,280' }
];
const RETURN_MS = 1200;
const GAP = 8;

const Entrance = ({ animate, height, children }) => {
  const [stage, setStage] = useState(animate ? 'enter' : 'done');
  useEffect(() => {
    if (!animate) return undefined;
    const id = requestAnimationFrame(() => setStage('grow'));
    return () => cancelAnimationFrame(id);
  }, [animate]);
  const growing = stage !== 'done';
  return (
    <div
      style={{
        height: stage === 'enter' ? 0 : stage === 'grow' ? height + GAP : 'auto',
        opacity: stage === 'enter' ? 0 : 1,
        overflow: growing ? 'hidden' : 'visible',
        transition: growing ? 'height 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease' : 'none'
      }}
      onTransitionEnd={e => {
        if (e.propertyName === 'height') setStage('done');
      }}
    >
      {children}
    </div>
  );
};

const SwipeRowDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    drawer,
    actionColor,
    drawerColor,
    rowColor,
    textColor,
    height,
    radius,
    actionWidth,
    direction,
    snapBounce,
    resistance,
    collapseMs,
    commitAt,
    fullSwipe,
    disabled
  } = props;

  const renderedRow = useColorModeValue(rowColor === DEFAULT_PROPS.rowColor ? '#f6f6f6' : rowColor, rowColor);
  const renderedText = useColorModeValue(textColor === DEFAULT_PROPS.textColor ? '#18181b' : textColor, textColor);
  const renderedDrawer = useColorModeValue(
    drawerColor === DEFAULT_PROPS.drawerColor ? '#e4e4e7' : drawerColor,
    drawerColor
  );

  const [rows, setRows] = useState(() => ROWS.map(r => ({ ...r, returning: false })));
  const [openId, setOpenId] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const remove = id => {
    const index = rows.findIndex(r => r.id === id);
    setRows(current => current.filter(r => r.id !== id));
    setOpenId(current => (current === id ? null : current));
    timers.current.push(
      setTimeout(() => {
        setRows(current => {
          const next = current.filter(r => r.id !== id);
          const at = Math.min(Math.max(0, index), next.length);
          next.splice(at, 0, { ...ROWS.find(r => r.id === id), returning: true });
          return next;
        });
      }, RETURN_MS)
    );
  };

  const propData = useMemo(
    () => [
      { name: 'children', type: 'ReactNode', default: '-', description: 'The row content you drag.' },
      {
        name: 'actions',
        type: 'SwipeAction[]',
        default: '[{ id: "delete", label: "Delete" }]',
        description:
          'The drawer, outermost first. Each has id, label, an optional icon, an optional color for secondary actions, dismiss to fold the row when pressed, and onSelect. The first is the full-swipe action and always folds the row.'
      },
      {
        name: 'actionColor',
        type: 'string',
        default: '"#e5484d"',
        description: 'The full-swipe block that leaps and fills the row.'
      },
      {
        name: 'drawerColor',
        type: 'string',
        default: '"#3f3f46"',
        description: 'The drawer base and the secondary actions.'
      },
      { name: 'rowColor', type: 'string', default: '"#27272a"', description: 'The surface.' },
      { name: 'textColor', type: 'string', default: '"#f5f5f5"', description: 'Row text and the keyboard toggle.' },
      { name: 'height', type: 'number', default: '64', description: 'Row height in pixels. The fold closes from it.' },
      {
        name: 'radius',
        type: 'number',
        default: '16',
        description: 'Corner radius of the row and the clipped drawer.'
      },
      {
        name: 'actionWidth',
        type: 'number',
        default: '80',
        description: 'Width of each action in pixels, so the drawer width too.'
      },
      {
        name: 'direction',
        type: '"left" | "right"',
        default: '"left"',
        description: 'Which way you swipe. Everything mirrors.'
      },
      {
        name: 'snapBounce',
        type: 'number',
        default: '0.2',
        description: 'Overshoot of the open or close settle after a flick. Slow releases never bounce.'
      },
      {
        name: 'resistance',
        type: 'number',
        default: '0.55',
        description:
          'How much of the finger the row keeps past the drawer, and the rubber-band beyond the commit point.'
      },
      { name: 'collapseMs', type: 'number', default: '200', description: 'How long a deleted row takes to fold shut.' },
      {
        name: 'commitAt',
        type: 'number',
        default: '0.6',
        description: 'Fraction of the row width the surface must uncover for the block to leap and a release to delete.'
      },
      {
        name: 'fullSwipe',
        type: 'boolean',
        default: 'true',
        description: 'Off, the drawer is the end: no leap, no delete.'
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the row and ignores input.' },
      {
        name: 'open',
        type: 'boolean',
        default: 'undefined',
        description: 'Controlled open state. Outside changes settle the row.'
      },
      {
        name: 'onOpenChange',
        type: '(open: boolean) => void',
        default: '-',
        description: 'Called when a gesture or key opens or closes the drawer.'
      },
      {
        name: 'onAction',
        type: '(action: SwipeAction) => void',
        default: '-',
        description: 'Called when any action button is pressed.'
      },
      {
        name: 'onCommit',
        type: '(action: SwipeAction) => void',
        default: '-',
        description:
          'Called after a full swipe or a press on a folding action, once the row has shut. Remove the row here.'
      },
      {
        name: 'closeOnAction',
        type: 'boolean',
        default: 'true',
        description: 'Closes the drawer after an action is pressed.'
      },
      {
        name: 'haptic',
        type: 'boolean',
        default: 'true',
        description: 'A short vibration on touch when the block leaps.'
      },
      { name: 'label', type: 'string', default: '"List item"', description: 'Accessible name of the row.' },
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
            <Box w="min(360px, calc(100% - 48px))">
              {rows.map(row => (
                <Entrance key={row.id} animate={row.returning} height={height}>
                  <SwipeRow
                    label={row.title}
                    actions={ACTION_SETS[drawer] ?? ACTION_SETS.two}
                    open={openId === row.id}
                    onOpenChange={isOpen =>
                      setOpenId(current => (isOpen ? row.id : current === row.id ? null : current))
                    }
                    onCommit={() => remove(row.id)}
                    actionColor={actionColor}
                    drawerColor={renderedDrawer}
                    rowColor={renderedRow}
                    textColor={renderedText}
                    height={height}
                    radius={radius}
                    actionWidth={actionWidth}
                    direction={direction}
                    snapBounce={snapBounce}
                    resistance={resistance}
                    collapseMs={collapseMs}
                    commitAt={commitAt}
                    fullSwipe={fullSwipe}
                    disabled={disabled}
                    style={{ marginBottom: GAP }}
                  >
                    <Box as="span" display="inline-flex" opacity={0.6} flexShrink={0}>
                      <HugeiconsIcon icon={row.icon} size={20} strokeWidth={1.8} />
                    </Box>
                    <Box as="span" display="grid" gap="2px" flex="1 1 auto" minW={0}>
                      <Box
                        as="span"
                        fontSize="14px"
                        fontWeight={500}
                        lineHeight={1.2}
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {row.title}
                      </Box>
                      <Box
                        as="span"
                        fontSize="12px"
                        opacity={0.6}
                        lineHeight={1.2}
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {row.subtitle}
                      </Box>
                    </Box>
                    <Box as="span" fontSize="12px" opacity={0.5} flexShrink={0}>
                      {row.meta}
                    </Box>
                  </SwipeRow>
                </Entrance>
              ))}
            </Box>
          </Box>

          <Customize>
            <PreviewSelect
              title="Drawer"
              options={DRAWER_OPTIONS}
              value={drawer}
              onChange={val => updateProp('drawer', val)}
              width={190}
            />
            <PreviewColorPickerCustom
              title="Action"
              color={actionColor}
              onChange={val => updateProp('actionColor', val)}
            />
            <PreviewColorPickerCustom
              title="Drawer Color"
              color={renderedDrawer}
              onChange={val => updateProp('drawerColor', val)}
            />
            <PreviewColorPickerCustom title="Row" color={renderedRow} onChange={val => updateProp('rowColor', val)} />
            <PreviewColorPickerCustom
              title="Text"
              color={renderedText}
              onChange={val => updateProp('textColor', val)}
            />
            <PreviewSlider
              title="Height"
              min={48}
              max={88}
              step={2}
              value={height}
              valueUnit="px"
              onChange={val => updateProp('height', val)}
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
            <PreviewSlider
              title="Action Width"
              min={56}
              max={120}
              step={4}
              value={actionWidth}
              valueUnit="px"
              onChange={val => updateProp('actionWidth', val)}
            />
            <PreviewSelect
              title="Swipe"
              options={DIRECTION_OPTIONS}
              value={direction}
              onChange={val => updateProp('direction', val)}
              width={110}
            />
            <PreviewSlider
              title="Flick Bounce"
              min={0}
              max={0.3}
              step={0.02}
              value={snapBounce}
              onChange={val => updateProp('snapBounce', val)}
            />
            <PreviewSlider
              title="Resistance"
              min={0.4}
              max={1}
              step={0.05}
              value={resistance}
              onChange={val => updateProp('resistance', val)}
            />
            <PreviewSlider
              title="Collapse"
              min={100}
              max={400}
              step={20}
              value={collapseMs}
              valueUnit="ms"
              onChange={val => updateProp('collapseMs', val)}
            />
            <PreviewSlider
              title="Commit At"
              min={0.4}
              max={0.9}
              step={0.05}
              value={commitAt}
              onChange={val => updateProp('commitAt', val)}
            />
            <PreviewSwitch title="Full Swipe" isChecked={fullSwipe} onChange={val => updateProp('fullSwipe', val)} />
            <PreviewSwitch title="Disabled" isChecked={disabled} onChange={val => updateProp('disabled', val)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={swipeRow} componentName="SwipeRow" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SwipeRowDemo;
