import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';

import useForceRerender from '../../hooks/useForceRerender';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import TextPressure from '../../content/TextAnimations/TextPressure/TextPressure';
import { textPressure } from '../../constants/code/TextAnimations/textPressureCode';
import Customize from '../../components/common/Preview/Customize';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

const propData = [
  {
    name: 'text',
    type: 'string',
    default: '"Compressa"',
    description: 'Text content that will be displayed and animated.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: '',
    description: 'Name of the variable font family.'
  },
  {
    name: 'fontUrl',
    type: 'string',
    default: 'URL to a .woff2 or .ttf file',
    description: 'URL for the variable font file (needed)'
  },
  {
    name: 'flex',
    type: 'boolean',
    default: 'true',
    description: 'Whether the characters are spaced using flex layout.'
  },
  {
    name: 'scale',
    type: 'boolean',
    default: 'false',
    description: 'If true, vertically scales the text to fill its container height.'
  },
  {
    name: 'alpha',
    type: 'boolean',
    default: 'false',
    description: 'If true, applies an opacity effect based on cursor distance.'
  },
  {
    name: 'stroke',
    type: 'boolean',
    default: 'false',
    description: 'If true, adds a stroke effect around characters.'
  },
  {
    name: 'width',
    type: 'boolean',
    default: 'true',
    description: 'If true, varies the variable-font "width" axis.'
  },
  {
    name: 'weight',
    type: 'boolean',
    default: 'true',
    description: 'If true, varies the variable-font "weight" axis.'
  },
  {
    name: 'italic',
    type: 'boolean',
    default: 'true',
    description: 'If true, varies the variable-font "italics" axis.'
  },
  {
    name: 'textColor',
    type: 'string',
    default: '#FFFFFF',
    description: 'The fill color of the text'
  },
  {
    name: 'strokeColor',
    type: 'string',
    default: '#FF0000',
    description: 'The stroke color that will be applied to the text when "stroke" is set to true'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Additional class for styling the <h1> wrapper.'
  },
  {
    name: 'minFontSize',
    type: 'number',
    default: '24',
    description: 'Sets a minimum font-size to avoid overly tiny text on smaller screens.'
  }
];

const DEFAULT_PROPS = {
  text: 'Hello!',
  flex: true,
  alpha: false,
  stroke: false,
  width: true,
  weight: true,
  italic: true,
  textColor: '#ffffff',
  strokeColor: '#5227FF'
};

const TextPressureDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { text, flex, alpha, stroke, width, weight, italic, textColor, strokeColor } = props;
  const renderedTextColor = useColorModeValue(
    textColor === DEFAULT_PROPS.textColor ? '#18181b' : textColor,
    textColor
  );

  const [key, forceRerender] = useForceRerender();

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={430}
            overflow="hidden"
            mb={6}
          >
            <RefreshButton onClick={forceRerender} />
            <Box w="100%" h="100%" minH={0}>
              <TextPressure
                key={key}
                text={text}
                flex={flex}
                alpha={alpha}
                stroke={stroke}
                width={width}
                weight={weight}
                italic={italic}
                textColor={renderedTextColor}
                strokeColor={strokeColor}
                minFontSize={36}
              />
            </Box>
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Text Color"
              color={renderedTextColor}
              onChange={val => {
                updateProp('textColor', val);
                forceRerender();
              }}
            />

            <PreviewColorPickerCustom
              title="Stroke Color"
              color={strokeColor}
              onChange={val => {
                updateProp('strokeColor', val);
                forceRerender();
              }}
            />

            <PreviewInput
              title="Text"
              value={text}
              placeholder="Your text here..."
              width={200}
              maxLength={10}
              onChange={val => updateProp('text', val)}
            />

            <PreviewSwitch
                title="Flex"
                isChecked={flex}
                onChange={checked => {
                  updateProp('flex', checked);
                  forceRerender();
                }}
              />
              <PreviewSwitch
                title="Alpha"
                isChecked={alpha}
                onChange={checked => {
                  updateProp('alpha', checked);
                  forceRerender();
                }}
              />
              <PreviewSwitch
                title="Stroke"
                isChecked={stroke}
                onChange={checked => {
                  updateProp('stroke', checked);
                  forceRerender();
                }}
              />
              <PreviewSwitch
                title="Width"
                isChecked={width}
                onChange={checked => {
                  updateProp('width', checked);
                  forceRerender();
                }}
              />
              <PreviewSwitch
                title="Weight"
                isChecked={weight}
                onChange={checked => {
                  updateProp('weight', checked);
                  forceRerender();
                }}
              />
              <PreviewSwitch
                title="Italic"
                isChecked={italic}
                onChange={checked => {
                  updateProp('italic', checked);
                  forceRerender();
                }}
              />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={textPressure} componentName="TextPressure" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TextPressureDemo;
