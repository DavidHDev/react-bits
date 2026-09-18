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

import LatticeLoader from '../../content/Micro/LatticeLoader/LatticeLoader';
import { latticeLoader } from '../../constants/code/Micro/latticeLoaderCode';

const DEFAULT_PROPS = {
  status: 'working',
  pattern: 'orbit',
  grid: 3,
  shape: 'round',
  color: '#f5f5f5',
  doneColor: '#22c55e',
  errorColor: '#ef4444',
  cellSize: 6,
  gap: 2,
  fontSize: 14,
  step: 90,
  idleOpacity: 0.15,
  glow: false,
  glowColor: '',
  showTimer: true,
  label: 'Thinking',
  doneLabel: 'Done in',
  errorLabel: 'Failed after'
};

const STATUS_OPTIONS = [
  { value: 'working', label: 'Working' },
  { value: 'done', label: 'Done' },
  { value: 'error', label: 'Error' }
];

const PATTERN_OPTIONS = {
  3: [
    { value: 'arrow', label: 'Arrow' },
    { value: 'dots', label: 'Dots' },
    { value: 'orbit', label: 'Orbit' },
    { value: 'ripple', label: 'Ripple' },
    { value: 'snake', label: 'Snake' },
    { value: 'spiral', label: 'Spiral' }
  ],
  4: [
    { value: 'sweep', label: 'Sweep' },
    { value: 'spin', label: 'Spin' },
    { value: 'rain', label: 'Rain' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'orbit', label: 'Orbit' },
    { value: 'snake', label: 'Snake' }
  ]
};

const GRID_OPTIONS = [
  { value: 3, label: '3 x 3' },
  { value: 4, label: '4 x 4' }
];

const SHAPE_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'round', label: 'Round' }
];

const LatticeLoaderDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    status,
    pattern,
    grid,
    shape,
    color,
    doneColor,
    errorColor,
    cellSize,
    gap,
    fontSize,
    step,
    idleOpacity,
    glow,
    glowColor,
    showTimer,
    label,
    doneLabel,
    errorLabel
  } = props;

  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const patternOptions = PATTERN_OPTIONS[grid] || PATTERN_OPTIONS[3];

  const changeGrid = next => {
    updateProp('grid', next);
    if (!PATTERN_OPTIONS[next].some(opt => opt.value === pattern))
      updateProp('pattern', next === 4 ? 'sweep' : 'orbit');
  };

  const propData = useMemo(
    () => [
      { name: 'label', type: 'string', default: '"Thinking"', description: 'The verb while working.' },
      {
        name: 'doneLabel',
        type: 'string',
        default: '"Done in"',
        description: 'The verb after status turns to done; the frozen time follows it.'
      },
      {
        name: 'errorLabel',
        type: 'string',
        default: '"Failed after"',
        description: 'The verb after status turns to error.'
      },
      {
        name: 'status',
        type: '"working" | "done" | "error"',
        default: '"working"',
        description:
          'Drives everything: the wave runs, or freezes and dissolves into a check or a cross while the stopwatch stops.'
      },
      {
        name: 'pattern',
        type: 'string | { cells, loop?, scale? }',
        default: '"orbit"',
        description:
          'The wave geometry. At 3 x 3: arrow, dots, orbit, ripple, snake, spiral. At 4 x 4: sweep, spin, rain, pulse, orbit, snake. A custom object gives one delay per cell in step units (null for a hole), an optional loop and scale, and lit: the share of the cycle a cell stays bright, 0.25, 0.35, 0.45 or 0.62.'
      },
      {
        name: 'grid',
        type: '3 | 4',
        default: '3',
        description: 'Cells per side. Each size has its own set of patterns and its own check and cross.'
      },
      { name: 'shape', type: '"square" | "round"', default: '"round"', description: 'Rounded tiles or dots.' },
      {
        name: 'color',
        type: 'string',
        default: '"currentColor"',
        description: 'Ink for the cells, the verb and the stopwatch. Inherits the page colour by default.'
      },
      { name: 'doneColor', type: 'string', default: '"#22c55e"', description: 'Colour of the check.' },
      { name: 'errorColor', type: 'string', default: '"#ef4444"', description: 'Colour of the cross.' },
      {
        name: 'cellSize',
        type: 'number',
        default: '6',
        description: 'Cell side in pixels; the lattice is three cells and two gaps.'
      },
      { name: 'gap', type: 'number', default: '2', description: 'Seam between cells in pixels.' },
      {
        name: 'fontSize',
        type: 'number',
        default: '14',
        description: 'Verb size in pixels; the stopwatch and row gap scale with it.'
      },
      {
        name: 'step',
        type: 'number',
        default: '90',
        description: 'Milliseconds between neighbouring cells lighting; the whole loop scales with it.'
      },
      { name: 'idleOpacity', type: 'number', default: '0.15', description: 'How visible the dark silhouette is.' },
      { name: 'glow', type: 'boolean', default: 'false', description: 'A halo on the lit cells and the mark.' },
      {
        name: 'glowColor',
        type: 'string',
        default: '""',
        description: 'The halo colour. Empty follows the ink, and the mark colour for the mark.'
      },
      { name: 'showTimer', type: 'boolean', default: 'true', description: 'Shows the live stopwatch.' },
      {
        name: 'elapsed',
        type: 'number',
        default: 'undefined',
        description: 'Controlled elapsed seconds. When set, the internal clock never runs.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the row.' },
      { name: 'style', type: 'CSSProperties', default: 'undefined', description: 'Inline styles merged onto the row.' }
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
            <LatticeLoader
              status={status}
              pattern={pattern}
              grid={grid}
              shape={shape}
              color={renderedColor}
              doneColor={doneColor}
              errorColor={errorColor}
              cellSize={cellSize}
              gap={gap}
              fontSize={fontSize}
              step={step}
              idleOpacity={idleOpacity}
              glow={glow}
              glowColor={glowColor}
              showTimer={showTimer}
              label={label}
              doneLabel={doneLabel}
              errorLabel={errorLabel}
            />
          </Box>

          <Customize>
            <PreviewSelect
              title="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={val => updateProp('status', val)}
              width={120}
            />
            <PreviewSelect
              title="Pattern"
              options={patternOptions}
              value={pattern}
              onChange={val => updateProp('pattern', val)}
              width={120}
            />
            <PreviewSelect
              title="Grid"
              options={GRID_OPTIONS}
              value={grid}
              onChange={val => changeGrid(Number(val))}
              width={120}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={shape}
              onChange={val => updateProp('shape', val)}
              width={120}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom title="Done" color={doneColor} onChange={val => updateProp('doneColor', val)} />
            <PreviewColorPickerCustom
              title="Error"
              color={errorColor}
              onChange={val => updateProp('errorColor', val)}
            />
            <PreviewSlider
              title="Cell Size"
              min={4}
              max={14}
              step={1}
              value={cellSize}
              valueUnit="px"
              onChange={val => updateProp('cellSize', val)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={8}
              step={1}
              value={gap}
              valueUnit="px"
              onChange={val => updateProp('gap', val)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={24}
              step={1}
              value={fontSize}
              valueUnit="px"
              onChange={val => updateProp('fontSize', val)}
            />
            <PreviewSlider
              title="Step"
              min={40}
              max={160}
              step={5}
              value={step}
              valueUnit="ms"
              onChange={val => updateProp('step', val)}
            />
            <PreviewSlider
              title="Idle Opacity"
              min={0.05}
              max={0.4}
              step={0.01}
              value={idleOpacity}
              onChange={val => updateProp('idleOpacity', val)}
            />
            <PreviewSwitch title="Glow" isChecked={glow} onChange={val => updateProp('glow', val)} />
            <PreviewColorPickerCustom
              title="Glow Color"
              color={glowColor || renderedColor}
              onChange={val => updateProp('glowColor', val)}
            />
            <PreviewSwitch title="Show Timer" isChecked={showTimer} onChange={val => updateProp('showTimer', val)} />
            <PreviewInput title="Label" value={label} maxLength={16} onChange={val => updateProp('label', val)} />
            <PreviewInput
              title="Done Label"
              value={doneLabel}
              maxLength={16}
              onChange={val => updateProp('doneLabel', val)}
            />
            <PreviewInput
              title="Error Label"
              value={errorLabel}
              maxLength={16}
              onChange={val => updateProp('errorLabel', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={latticeLoader} componentName="LatticeLoader" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LatticeLoaderDemo;
