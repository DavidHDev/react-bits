import { useEffect, useMemo, useState } from 'react';
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
import RefreshButton from '../../components/common/Preview/RefreshButton';

import ThoughtLine from '../../content/Micro/ThoughtLine/ThoughtLine';
import { thoughtLine } from '../../constants/code/Micro/thoughtLineCode';

const DEFAULT_PROPS = {
  label: 'Thinking…',
  doneLabel: '',
  glyph: 'sparkle',
  color: '#f5f5f5',
  glyphColor: '',
  fontSize: 18,
  breathPeriod: 1.6,
  breathDepth: 0.45,
  shimmer: true,
  shimmerDuration: 1.8,
  settleDuration: 350,
  settleBlur: 2,
  showTimer: true,
  trace: true,
  collapsible: true,
  loop: true,
  working: true
};

const GLYPH_OPTIONS = [
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'dot', label: 'Dot' },
  { value: 'none', label: 'None' }
];

const STEPS = ['Reading the question', 'Searching your notes', 'Comparing two approaches', 'Drafting an answer'];
const STEP_MS = 900;
const FIRST_MS = 500;
const REST_MS = 2600;

const ThoughtLineDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    label,
    doneLabel,
    glyph,
    color,
    glyphColor,
    fontSize,
    breathPeriod,
    breathDepth,
    shimmer,
    shimmerDuration,
    settleDuration,
    settleBlur,
    showTimer,
    trace,
    collapsible,
    loop,
    working
  } = props;

  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedGlyph = glyphColor || renderedColor;

  const [run, setRun] = useState(0);
  const [loopWorking, setLoopWorking] = useState(true);
  const [steps, setSteps] = useState([]);
  useEffect(() => {
    if (!loop) {
      setSteps(STEPS);
      return undefined;
    }
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    setSteps([]);
    setLoopWorking(true);
    STEPS.forEach((step, i) => at(FIRST_MS + i * STEP_MS, () => setSteps(s => [...s, step])));
    at(FIRST_MS + STEPS.length * STEP_MS, () => setLoopWorking(false));
    at(FIRST_MS + STEPS.length * STEP_MS + REST_MS, () => setRun(r => r + 1));
    return () => timers.forEach(clearTimeout);
  }, [loop, run]);

  const propData = useMemo(
    () => [
      {
        name: 'label',
        type: 'string',
        default: '"Thinking…"',
        description: 'The working line. It breathes, and it is the spoken text.'
      },
      {
        name: 'doneLabel',
        type: 'string',
        default: '""',
        description: 'The settled line. Empty gives "Thought for", or "Done thinking" without the timer.'
      },
      {
        name: 'renderLabel',
        type: '(text, working) => ReactNode',
        default: '-',
        description: 'Wraps either string, for a sheen or a link. Inline content only.'
      },
      {
        name: 'glyph',
        type: "'sparkle' | 'dot' | 'none' | ReactNode",
        default: "'sparkle'",
        description: 'The mark that breathes and dims.'
      },
      {
        name: 'steps',
        type: 'string[]',
        default: '[]',
        description:
          'The trace beneath the line. Append as the agent progresses; the last step is current, earlier ones tick.'
      },
      {
        name: 'collapsible',
        type: 'boolean',
        default: 'true',
        description: 'The line becomes a toggle for the trace, with a chevron.'
      },
      {
        name: 'collapseOnSettle',
        type: 'boolean',
        default: 'true',
        description: 'Fold the trace into the line when it settles.'
      },
      { name: 'color', type: 'string', default: '"currentColor"', description: 'The ink of the line and the trace.' },
      { name: 'glyphColor', type: 'string', default: '""', description: 'The glyph alone. Empty follows the ink.' },
      { name: 'fontSize', type: 'number', default: '16', description: 'Type size in px. Everything scales in em.' },
      { name: 'breathPeriod', type: 'number', default: '1.6', description: 'One breath, up and down, in seconds.' },
      {
        name: 'breathDepth',
        type: 'number',
        default: '0.45',
        description: 'How far the glyph and label dim at the trough. 0 is no breath.'
      },
      {
        name: 'shimmer',
        type: 'boolean',
        default: 'true',
        description: 'A band of ink sweeps the working label. The label then leaves the breath to the glyph.'
      },
      { name: 'shimmerDuration', type: 'number', default: '1.8', description: 'One sweep, in seconds.' },
      {
        name: 'settleDuration',
        type: 'number',
        default: '350',
        description: 'The settle chord, in ms: crossfade, dim, glide, fold.'
      },
      { name: 'settleBlur', type: 'number', default: '2', description: 'Blur through the crossfade seam, in px.' },
      {
        name: 'working',
        type: 'boolean',
        default: 'true',
        description: 'Working or settled. True again starts a new clock.'
      },
      {
        name: 'settleAfter',
        type: 'number',
        default: '0',
        description: 'Seconds after which the line settles by itself. 0 waits for working.'
      },
      {
        name: 'elapsed',
        type: 'number',
        default: 'undefined',
        description: 'Controlled seconds. The internal clock never runs.'
      },
      {
        name: 'showTimer',
        type: 'boolean',
        default: 'true',
        description: 'The live clock that freezes into the sentence.'
      },
      {
        name: 'onSettle',
        type: '(seconds) => void',
        default: '-',
        description: 'Once per settle, with the frozen time.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root.' }
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
            alignItems="flex-start"
            pt="188px"
          >
            <RefreshButton onClick={() => setRun(r => r + 1)} />
            <ThoughtLine
              label={label}
              doneLabel={doneLabel}
              glyph={glyph}
              steps={trace ? steps : []}
              collapsible={collapsible}
              color={renderedColor}
              glyphColor={renderedGlyph}
              fontSize={fontSize}
              breathPeriod={breathPeriod}
              breathDepth={breathDepth}
              shimmer={shimmer}
              shimmerDuration={shimmerDuration}
              settleDuration={settleDuration}
              settleBlur={settleBlur}
              working={loop ? loopWorking : working}
              showTimer={showTimer}
            />
          </Box>

          <Customize>
            <PreviewSwitch title="Loop" isChecked={loop} onChange={val => updateProp('loop', val)} />
            <PreviewSwitch
              title="Working"
              isChecked={loop ? loopWorking : working}
              isDisabled={loop}
              onChange={val => updateProp('working', val)}
            />
            <PreviewInput title="Label" value={label} maxLength={24} onChange={val => updateProp('label', val)} />
            <PreviewInput
              title="Done Label"
              value={doneLabel}
              maxLength={24}
              onChange={val => updateProp('doneLabel', val)}
            />
            <PreviewSelect
              title="Glyph"
              options={GLYPH_OPTIONS}
              value={glyph}
              onChange={val => updateProp('glyph', val)}
              width={120}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom
              title="Glyph Color"
              color={renderedGlyph}
              onChange={val => updateProp('glyphColor', val)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={28}
              step={1}
              value={fontSize}
              valueUnit="px"
              onChange={val => updateProp('fontSize', val)}
            />
            <PreviewSlider
              title="Breath Period"
              min={0.8}
              max={3}
              step={0.1}
              value={breathPeriod}
              valueUnit="s"
              onChange={val => updateProp('breathPeriod', val)}
            />
            <PreviewSlider
              title="Breath Depth"
              min={0}
              max={0.6}
              step={0.05}
              value={breathDepth}
              onChange={val => updateProp('breathDepth', val)}
            />
            <PreviewSwitch title="Shimmer" isChecked={shimmer} onChange={val => updateProp('shimmer', val)} />
            <PreviewSlider
              title="Shimmer Speed"
              min={0.8}
              max={4}
              step={0.1}
              value={shimmerDuration}
              valueUnit="s"
              isDisabled={!shimmer}
              onChange={val => updateProp('shimmerDuration', val)}
            />
            <PreviewSlider
              title="Settle"
              min={150}
              max={600}
              step={10}
              value={settleDuration}
              valueUnit="ms"
              onChange={val => updateProp('settleDuration', val)}
            />
            <PreviewSlider
              title="Settle Blur"
              min={0}
              max={6}
              step={0.5}
              value={settleBlur}
              valueUnit="px"
              onChange={val => updateProp('settleBlur', val)}
            />
            <PreviewSwitch title="Show Timer" isChecked={showTimer} onChange={val => updateProp('showTimer', val)} />
            <PreviewSwitch title="Trace" isChecked={trace} onChange={val => updateProp('trace', val)} />
            <PreviewSwitch
              title="Collapsible"
              isChecked={collapsible}
              onChange={val => updateProp('collapsible', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={thoughtLine} />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ThoughtLineDemo;
