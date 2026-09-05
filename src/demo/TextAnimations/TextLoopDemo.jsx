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
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import TextLoop from '../../content/TextAnimations/TextLoop/TextLoop';
import { textLoop } from '../../constants/code/TextAnimations/textLoopCode';

const DEFAULT_PROPS = {
  text: 'React Bits',
  shape: 'wave',
  speed: 90,
  direction: 'forward',
  separator: '✦',
  curviness: 90,
  fontSize: 46,
  fontWeight: 800,
  letterSpacing: 2,
  uppercase: true,
  color: '#ffffff',
  ribbon: true,
  ribbonColor: '#5227FF',
  ribbonWidth: 86,
  pauseOnHover: true
};

const SHAPE_OPTIONS = [
  { value: 'wave', label: 'Wave' },
  { value: 'circle', label: 'Circle' },
  { value: 'infinity', label: 'Infinity' },
  { value: 'arch', label: 'Arch' },
  { value: 'line', label: 'Line' }
];

const DIRECTION_OPTIONS = [
  { value: 'forward', label: 'Forward' },
  { value: 'reverse', label: 'Reverse' }
];

const TextLoopDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    text,
    shape,
    speed,
    direction,
    separator,
    curviness,
    fontSize,
    fontWeight,
    letterSpacing,
    uppercase,
    color,
    ribbon,
    ribbonColor,
    ribbonWidth,
    pauseOnHover
  } = props;
  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#ffffff' : color, color);

  const propData = useMemo(
    () => [
      { name: 'text', type: 'string', default: '"React Bits"', description: 'The phrase repeated along the curve.' },
      {
        name: 'shape',
        type: '"wave" | "circle" | "infinity" | "arch" | "line"',
        default: '"wave"',
        description: 'Built-in curve the text flows along.'
      },
      {
        name: 'path',
        type: 'string',
        default: 'undefined',
        description: 'Custom SVG path data, drawn in a 1200x400 viewBox. Overrides shape when provided.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '90',
        description: 'Travel speed along the path, in units per second.'
      },
      {
        name: 'direction',
        type: '"forward" | "reverse"',
        default: '"forward"',
        description: 'Direction the text scrolls around the curve.'
      },
      { name: 'separator', type: 'string', default: '"✦"', description: 'Glyph placed between each repetition.' },
      {
        name: 'curviness',
        type: 'number',
        default: '90',
        description: 'Amplitude of the wave, or the radius of the closed shapes.'
      },
      { name: 'fontSize', type: 'number', default: '46', description: 'Font size of the looping text.' },
      { name: 'fontWeight', type: 'number', default: '800', description: 'Font weight of the looping text.' },
      { name: 'letterSpacing', type: 'number', default: '2', description: 'Extra tracking between letters.' },
      { name: 'uppercase', type: 'boolean', default: 'true', description: 'Renders the phrase in uppercase.' },
      { name: 'color', type: 'string', default: '"#ffffff"', description: 'Fill color of the text.' },
      {
        name: 'ribbon',
        type: 'boolean',
        default: 'true',
        description: 'Draws a solid band behind the text along the path.'
      },
      { name: 'ribbonColor', type: 'string', default: '"#5227FF"', description: 'Color of the band behind the text.' },
      { name: 'ribbonWidth', type: 'number', default: '86', description: 'Thickness of the band behind the text.' },
      {
        name: 'pauseOnHover',
        type: 'boolean',
        default: 'true',
        description: 'Pauses the loop while the pointer is over it.'
      },
      { name: 'className', type: 'string', default: '""', description: 'Additional CSS classes for the wrapper.' },
      { name: 'style', type: 'object', default: '{}', description: 'Inline styles for the wrapper.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box
            className="demo-container"
            p={0}
            minH={430}
            overflow="hidden"
            position="relative"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <TextLoop
              text={text}
              shape={shape}
              speed={speed}
              direction={direction}
              separator={separator}
              curviness={curviness}
              fontSize={fontSize}
              fontWeight={fontWeight}
              letterSpacing={letterSpacing}
              uppercase={uppercase}
              color={renderedColor}
              ribbon={ribbon}
              ribbonColor={ribbonColor}
              ribbonWidth={ribbonWidth}
              pauseOnHover={pauseOnHover}
            />
          </Box>

          <Customize>
            <PreviewInput
              title="Text"
              value={text}
              placeholder="Your phrase"
              maxLength={30}
              onChange={value => updateProp('text', value)}
            />

            <PreviewInput
              title="Separator"
              value={separator}
              placeholder="✦"
              width={90}
              maxLength={3}
              onChange={value => updateProp('separator', value)}
            />

            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={shape}
              onChange={value => updateProp('shape', value)}
            />

            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={direction}
              onChange={value => updateProp('direction', value)}
            />

            <PreviewColorPickerCustom
              title="Text Color"
              color={renderedColor}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Ribbon Color"
              color={ribbonColor}
              onChange={value => updateProp('ribbonColor', value)}
            />

            <PreviewSwitch title="Ribbon" isChecked={ribbon} onChange={value => updateProp('ribbon', value)} />
            <PreviewSwitch title="Uppercase" isChecked={uppercase} onChange={value => updateProp('uppercase', value)} />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={pauseOnHover}
              onChange={value => updateProp('pauseOnHover', value)}
            />

            <PreviewSlider
              title="Speed"
              min={10}
              max={260}
              step={5}
              value={speed}
              onChange={value => updateProp('speed', value)}
            />

            <PreviewSlider
              title="Curviness"
              min={0}
              max={160}
              step={2}
              value={curviness}
              onChange={value => updateProp('curviness', value)}
            />

            <PreviewSlider
              title="Ribbon Width"
              min={0}
              max={160}
              step={2}
              value={ribbonWidth}
              valueUnit="px"
              onChange={value => updateProp('ribbonWidth', value)}
            />

            <PreviewSlider
              title="Font Size"
              min={18}
              max={90}
              step={2}
              value={fontSize}
              valueUnit="px"
              onChange={value => updateProp('fontSize', value)}
            />

            <PreviewSlider
              title="Font Weight"
              min={300}
              max={900}
              step={50}
              value={fontWeight}
              onChange={value => updateProp('fontWeight', value)}
            />

            <PreviewSlider
              title="Letter Spacing"
              min={-2}
              max={14}
              step={0.5}
              value={letterSpacing}
              valueUnit="px"
              onChange={value => updateProp('letterSpacing', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={textLoop} componentName="TextLoop" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TextLoopDemo;
