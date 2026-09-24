import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import Dependencies from '../../components/code/Dependencies';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { useColorModeValue } from '../../components/setup/color-mode';

import TechText from '../../content/TextAnimations/TechText/TechText';
import { techText } from '../../constants/code/TextAnimations/techTextCode';

const REVEAL_OPTIONS = [
  { label: 'Area', value: 'area' },
  { label: 'Letter', value: 'letter' },
  { label: 'Off', value: 'off' }
];

const LINE_OPTIONS = [
  { label: 'Dashed', value: 'dashed' },
  { label: 'Solid', value: 'solid' }
];

const FONT_OPTIONS = [
  { label: 'Inherit', value: '' },
  { label: 'Geist Mono', value: '"Geist Mono", monospace' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'System', value: 'system-ui, sans-serif' }
];

const DEFAULT_PROPS = {
  text: 'React Bits',
  fontFamily: '',
  color: '#ffffff',
  accentColor: '#ffffff',
  fontWeight: 600,
  fontSize: 150,
  letterSpacing: -0.05,
  reach: 200,
  softness: 0.7,
  dashLength: 4,
  dashGap: 2,
  strokeWidth: 1.5,
  speed: 1,
  specks: 15,
  lineStyle: 'dashed',
  reveal: 'letter',
  selection: true,
  labels: true,
  draggable: true,
  sweep: true
};

const TechTextDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    text,
    fontFamily,
    color,
    accentColor,
    fontWeight,
    fontSize,
    letterSpacing,
    reach,
    softness,
    dashLength,
    dashGap,
    strokeWidth,
    speed,
    specks,
    lineStyle,
    reveal,
    selection,
    labels,
    draggable,
    sweep
  } = props;

  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedAccent = useColorModeValue(
    accentColor === DEFAULT_PROPS.accentColor ? '#18181b' : accentColor,
    accentColor
  );

  const propData = useMemo(
    () => [
      { name: 'text', type: 'string', default: "'React Bits'", description: 'The wordmark to render.' },
      {
        name: 'fontFamily',
        type: 'string',
        default: "''",
        description: 'Any font family loaded on the page. Leave empty to inherit the font of the container.'
      },
      { name: 'fontWeight', type: 'number', default: '600', description: 'Weight of the wordmark.' },
      {
        name: 'fontSize',
        type: 'number',
        default: '150',
        description: 'Largest font size in px. The wordmark shrinks to fit narrower containers.'
      },
      { name: 'letterSpacing', type: 'number', default: '-0.05', description: 'Extra space between letters, in em.' },
      {
        name: 'color',
        type: 'string',
        default: "'#ffffff'",
        description: 'Colour of the letters and their outlines.'
      },
      {
        name: 'accentColor',
        type: 'string',
        default: "'#ffffff'",
        description: 'Colour of the selection frame, connector and labels.'
      },
      {
        name: 'reveal',
        type: "'area' | 'letter' | 'off'",
        default: "'letter'",
        description:
          'Area fades the letters into outlines inside a circle around the pointer. Letter turns only the active letter into its outline. Off keeps every letter solid.'
      },
      {
        name: 'reach',
        type: 'number',
        default: '200',
        description: 'Radius around the pointer where the letters turn into vector outlines, in px.'
      },
      {
        name: 'softness',
        type: 'number',
        default: '0.7',
        description: 'How gradually the fill hands over to the outlines. 0 is a hard edge.'
      },
      { name: 'dashLength', type: 'number', default: '4', description: 'Length of each outline dash, in px.' },
      { name: 'dashGap', type: 'number', default: '2', description: 'Space between outline dashes, in px.' },
      {
        name: 'lineStyle',
        type: "'dashed' | 'solid'",
        default: "'dashed'",
        description: 'How the outlines under the pointer are drawn. Only the outer silhouette is traced either way.'
      },
      { name: 'strokeWidth', type: 'number', default: '1.5', description: 'Thickness of the outline, in px.' },
      {
        name: 'specks',
        type: 'number',
        default: '15',
        description:
          'Tiny squares that blink and respawn around the active letter, seeded per letter. 0 turns them off.'
      },
      {
        name: 'selection',
        type: 'boolean',
        default: 'true',
        description: 'Frame the letter under the pointer. The frame glides from letter to letter.'
      },
      {
        name: 'labels',
        type: 'boolean',
        default: 'true',
        description: 'Label the frame with the letter and its size, or with its offset while dragged.'
      },
      {
        name: 'draggable',
        type: 'boolean',
        default: 'true',
        description: 'Let letters be dragged off the baseline. They spring back home on release.'
      },
      {
        name: 'sweep',
        type: 'boolean',
        default: 'true',
        description: 'Sweep the reveal across the wordmark on its own while the pointer is away.'
      },
      { name: 'speed', type: 'number', default: '1', description: 'Speed of the idle sweep.' },
      { name: 'className', type: 'string', default: "''", description: 'Extra classes on the container.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles on the container.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={480} p={0} overflow="hidden">
            <TechText
              key={key}
              text={text}
              fontFamily={fontFamily}
              color={renderedColor}
              accentColor={renderedAccent}
              fontWeight={fontWeight}
              fontSize={fontSize}
              letterSpacing={letterSpacing}
              reach={reach}
              softness={softness}
              dashLength={dashLength}
              dashGap={dashGap}
              strokeWidth={strokeWidth}
              speed={speed}
              specks={specks}
              lineStyle={lineStyle}
              reveal={reveal}
              selection={selection}
              labels={labels}
              draggable={draggable}
              sweep={sweep}
            />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewInput title="Text" value={text} maxLength={24} onChange={v => updateProp('text', v)} />
            <PreviewSelect
              title="Font"
              options={FONT_OPTIONS}
              value={fontFamily}
              onChange={v => updateProp('fontFamily', v)}
            />
            <PreviewColorPickerCustom title="Color" color={renderedColor} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent}
              onChange={v => updateProp('accentColor', v)}
            />

            <PreviewSlider
              title="Font Weight"
              min={300}
              max={900}
              step={100}
              value={fontWeight}
              onChange={v => updateProp('fontWeight', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={60}
              max={320}
              step={5}
              value={fontSize}
              valueUnit="px"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSlider
              title="Letter Spacing"
              min={-0.1}
              max={0.2}
              step={0.01}
              value={letterSpacing}
              valueUnit="em"
              onChange={v => updateProp('letterSpacing', v)}
            />

            <PreviewSelect
              title="Reveal"
              options={REVEAL_OPTIONS}
              value={reveal}
              onChange={v => updateProp('reveal', v)}
            />
            <PreviewSlider
              title="Reach"
              isDisabled={reveal !== 'area'}
              min={80}
              max={400}
              step={10}
              value={reach}
              valueUnit="px"
              onChange={v => updateProp('reach', v)}
            />
            <PreviewSlider
              title="Softness"
              isDisabled={reveal !== 'area'}
              min={0}
              max={1}
              step={0.05}
              value={softness}
              onChange={v => updateProp('softness', v)}
            />
            <PreviewSelect
              title="Line Style"
              options={LINE_OPTIONS}
              value={lineStyle}
              onChange={v => updateProp('lineStyle', v)}
            />
            <PreviewSlider
              title="Dash Length"
              min={2}
              max={16}
              step={1}
              isDisabled={lineStyle === 'solid'}
              value={dashLength}
              valueUnit="px"
              onChange={v => updateProp('dashLength', v)}
            />
            <PreviewSlider
              title="Dash Gap"
              min={2}
              max={12}
              step={1}
              isDisabled={lineStyle === 'solid'}
              value={dashGap}
              valueUnit="px"
              onChange={v => updateProp('dashGap', v)}
            />
            <PreviewSlider
              title="Stroke Width"
              min={0.5}
              max={4}
              step={0.25}
              value={strokeWidth}
              valueUnit="px"
              onChange={v => updateProp('strokeWidth', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0.2}
              max={3}
              step={0.1}
              value={speed}
              onChange={v => updateProp('speed', v)}
            />

            <PreviewSlider
              title="Specks"
              min={0}
              max={48}
              step={1}
              value={specks}
              onChange={v => updateProp('specks', v)}
            />

            <PreviewSwitch title="Selection" isChecked={selection} onChange={v => updateProp('selection', v)} />
            <PreviewSwitch title="Labels" isChecked={labels} onChange={v => updateProp('labels', v)} />
            <PreviewSwitch title="Draggable" isChecked={draggable} onChange={v => updateProp('draggable', v)} />
            <PreviewSwitch title="Sweep" isChecked={sweep} onChange={v => updateProp('sweep', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={techText} componentName="TechText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TechTextDemo;
