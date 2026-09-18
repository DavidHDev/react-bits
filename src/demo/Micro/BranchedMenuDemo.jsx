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
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import BranchedMenu from '../../content/Micro/BranchedMenu/BranchedMenu';
import { branchedMenu } from '../../constants/code/Micro/branchedMenuCode';

const DEFAULT_PROPS = {
  color: '#f5f5f5',
  accentColor: '#f5f5f5',
  lineColor: '#3f3f46',
  width: 240,
  rowHeight: 32,
  indent: 40,
  trunk: 14,
  radius: 10,
  lineWidth: 1.5,
  fontSize: 14,
  drawDuration: 400,
  foldDuration: 300
};

const BranchedMenuDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    color,
    accentColor,
    lineColor,
    width,
    rowHeight,
    indent,
    trunk,
    radius,
    lineWidth,
    fontSize,
    drawDuration,
    foldDuration
  } = props;

  const renderedColor = useColorModeValue(color === DEFAULT_PROPS.color ? '#18181b' : color, color);
  const renderedAccent = useColorModeValue(
    accentColor === DEFAULT_PROPS.accentColor ? '#18181b' : accentColor,
    accentColor
  );
  const renderedLine = useColorModeValue(lineColor === DEFAULT_PROPS.lineColor ? '#d4d4d8' : lineColor, lineColor);

  const propData = useMemo(
    () => [
      {
        name: 'items',
        type: 'BranchedMenuItem[]',
        default: 'DEFAULT_ITEMS',
        description:
          'Sections: label plus children (value, label, icon), or a leaf with a value. A section with children folds; a leaf selects.'
      },
      {
        name: 'defaultOpen',
        type: 'number | number[]',
        default: '0',
        description: 'The section, or sections, open at first. -1 for none.'
      },
      {
        name: 'defaultActive',
        type: 'string',
        default: '""',
        description: "Value selected at first. Empty picks the open section's first child."
      },
      { name: 'onSelect', type: '(value, item) => void', default: '-', description: 'A child or a leaf was picked.' },
      { name: 'onToggle', type: '(index, open) => void', default: '-', description: 'A section folded or unfolded.' },
      {
        name: 'color',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'The ink. Lines and idle text are mixes of it.'
      },
      {
        name: 'accentColor',
        type: 'string',
        default: '"#f5f5f5"',
        description: 'The active line, the active label and the marker.'
      },
      {
        name: 'lineColor',
        type: 'string',
        default: '"#3f3f46"',
        description: 'The rail, trunk and branches. A solid colour, so joints never darken.'
      },
      {
        name: 'width',
        type: 'number',
        default: '240',
        description: 'The widest the menu may be, in px. It shrinks to its content.'
      },
      { name: 'rowHeight', type: 'number', default: '36', description: 'Height of a child row in px.' },
      {
        name: 'indent',
        type: 'number',
        default: '40',
        description: 'Where child rows start, in px. Branches end just before it.'
      },
      { name: 'trunk', type: 'number', default: '14', description: "The trunk line's x position, in px." },
      { name: 'radius', type: 'number', default: '10', description: 'The curve of each branch, in px.' },
      { name: 'lineWidth', type: 'number', default: '1.5', description: 'Stroke width of the lines.' },
      {
        name: 'fontSize',
        type: 'number',
        default: '14',
        description: 'Child text size in px. Headers are 1px larger.'
      },
      { name: 'drawDuration', type: 'number', default: '400', description: "The accent line's travel, in ms." },
      { name: 'foldDuration', type: 'number', default: '300', description: "A section's fold and unfold, in ms." },
      { name: 'className', type: 'string', default: '""', description: 'Extra classes for the nav.' }
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
            pt="24px"
          >
            <BranchedMenu
              defaultOpen={[0, 1]}
              defaultActive="quick"
              color={renderedColor}
              accentColor={renderedAccent}
              lineColor={renderedLine}
              width={width}
              rowHeight={rowHeight}
              indent={indent}
              trunk={trunk}
              radius={radius}
              lineWidth={lineWidth}
              fontSize={fontSize}
              drawDuration={drawDuration}
              foldDuration={foldDuration}
            />
          </Box>

          <Customize>
            <PreviewColorPickerCustom title="Ink" color={renderedColor} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent}
              onChange={val => updateProp('accentColor', val)}
            />
            <PreviewColorPickerCustom
              title="Lines"
              color={renderedLine}
              onChange={val => updateProp('lineColor', val)}
            />
            <PreviewSlider
              title="Width"
              min={180}
              max={360}
              step={4}
              value={width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
            />
            <PreviewSlider
              title="Row Height"
              min={28}
              max={52}
              step={1}
              value={rowHeight}
              valueUnit="px"
              onChange={val => updateProp('rowHeight', val)}
            />
            <PreviewSlider
              title="Indent"
              min={28}
              max={72}
              step={1}
              value={indent}
              valueUnit="px"
              onChange={val => updateProp('indent', val)}
            />
            <PreviewSlider
              title="Trunk"
              min={2}
              max={30}
              step={1}
              value={trunk}
              valueUnit="px"
              onChange={val => updateProp('trunk', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={18}
              step={1}
              value={radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewSlider
              title="Line Width"
              min={1}
              max={3}
              step={0.25}
              value={lineWidth}
              onChange={val => updateProp('lineWidth', val)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={18}
              step={1}
              value={fontSize}
              valueUnit="px"
              onChange={val => updateProp('fontSize', val)}
            />
            <PreviewSlider
              title="Draw"
              min={150}
              max={900}
              step={10}
              value={drawDuration}
              valueUnit="ms"
              onChange={val => updateProp('drawDuration', val)}
            />
            <PreviewSlider
              title="Fold"
              min={150}
              max={600}
              step={10}
              value={foldDuration}
              valueUnit="ms"
              onChange={val => updateProp('foldDuration', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={branchedMenu} />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default BranchedMenuDemo;
