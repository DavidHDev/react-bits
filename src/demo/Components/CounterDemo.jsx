import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Button, Flex } from '@chakra-ui/react';

import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';

import Counter from '../../content/Components/Counter/Counter';
import { counter } from '../../constants/code/Components/counterCode';
import PreviewSwitch from '@/components/common/Preview/PreviewSwitch';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

const DEFAULT_PROPS = {
  digitPlaceHolders: true,
  value: 1,
  fontSize: 80,
  gap: 10
};

const roundToTenth = num => Math.round(num * 10) / 10;

const CounterDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { digitPlaceHolders, value, fontSize, gap } = props;

  const propData = useMemo(
    () => [
      {
        name: 'value',
        type: 'number',
        default: 'N/A (required)',
        description: 'The numeric value to display in the counter.'
      },
      {
        name: 'fontSize',
        type: 'number',
        default: '100',
        description: 'The base font size used for the counter digits.'
      },
      {
        name: 'padding',
        type: 'number',
        default: '0',
        description: 'Additional padding added to the digit height.'
      },
      {
        name: 'places',
        type: 'number[]',
        default: '[100, 10, 1 , "." , 0.1]',
        description:
          'Defines which digit positions to display. Include whole number and decimal place values (use "." for the decimal point). If omitted, place values will be detected automatically.'
      },
      {
        name: 'gap',
        type: 'number',
        default: '8',
        description: 'The gap (in pixels) between each digit.'
      },
      {
        name: 'borderRadius',
        type: 'number',
        default: '4',
        description: 'The border radius (in pixels) for the counter container.'
      },
      {
        name: 'horizontalPadding',
        type: 'number',
        default: '8',
        description: 'The horizontal padding (in pixels) for the counter container.'
      },
      {
        name: 'textColor',
        type: 'string',
        default: 'inherit',
        description: 'The text color for the counter digits.'
      },
      {
        name: 'fontWeight',
        type: 'string | number',
        default: 'inherit',
        description: 'The font weight of the counter digits.'
      },
      {
        name: 'containerStyle',
        type: 'React.CSSProperties',
        default: '{}',
        description: 'Custom inline styles for the outer container.'
      },
      {
        name: 'counterStyle',
        type: 'React.CSSProperties',
        default: '{}',
        description: 'Custom inline styles for the counter element.'
      },
      {
        name: 'digitStyle',
        type: 'React.CSSProperties',
        default: '{}',
        description: 'Custom inline styles for each digit container.'
      },
      {
        name: 'gradientHeight',
        type: 'number',
        default: '16',
        description: 'The height (in pixels) of the gradient overlays.'
      },
      {
        name: 'gradientFrom',
        type: 'string',
        default: "'black'",
        description: 'The starting color for the gradient overlays.'
      },
      {
        name: 'gradientTo',
        type: 'string',
        default: "'transparent'",
        description: 'The ending color for the gradient overlays.'
      },
      {
        name: 'topGradientStyle',
        type: 'React.CSSProperties',
        default: 'undefined',
        description: 'Custom inline styles for the top gradient overlay.'
      },
      {
        name: 'bottomGradientStyle',
        type: 'React.CSSProperties',
        default: 'undefined',
        description: 'Custom inline styles for the bottom gradient overlay.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} overflow="hidden">
            {digitPlaceHolders ? (
              <Counter
                value={parseFloat(value.toFixed(1))}
                places={[100, 10, 1, '.', 0.1]}
                gradientFrom="var(--bg-body)"
                fontSize={fontSize}
                padding={5}
                gap={gap}
                borderRadius={10}
                horizontalPadding={15}
                textColor="var(--text-primary)"
                fontWeight={600}
              />
            ) : (
              <Counter
                value={value}
                gradientFrom="var(--bg-body)"
                fontSize={fontSize}
                padding={5}
                gap={gap}
                borderRadius={10}
                horizontalPadding={15}
                textColor="var(--text-primary)"
                fontWeight={600}
              />
            )}

            <Flex gap={4} bottom="1em" direction={'row'} justify={'center'} mt={4} position="absolute">
              <Button
                bg="var(--text-primary)"
                borderRadius="10px"
                border="1px solid var(--text-primary)"
                _hover={{ opacity: 0.84 }}
                color="var(--bg-body)"
                h={10}
                w={16}
                onClick={() => updateProp('value', roundToTenth(value - 0.4))}
              >
                - 0.4
              </Button>
              <Button
                bg="var(--text-primary)"
                borderRadius="10px"
                border="1px solid var(--text-primary)"
                _hover={{ opacity: 0.84 }}
                color="var(--bg-body)"
                h={10}
                w={10}
                onClick={() => updateProp('value', value - 1)}
              >
                -
              </Button>
              <Button
                bg="var(--text-primary)"
                borderRadius="10px"
                border="1px solid var(--text-primary)"
                _hover={{ opacity: 0.84 }}
                color="var(--bg-body)"
                h={10}
                w={10}
                onClick={() => value < 999 && updateProp('value', value + 1)}
              >
                +
              </Button>
              <Button
                bg="var(--text-primary)"
                borderRadius="10px"
                border="1px solid var(--text-primary)"
                _hover={{ opacity: 0.84 }}
                color="var(--bg-body)"
                h={10}
                w={16}
                onClick={() => value < 999 && updateProp('value', roundToTenth(value + 0.4))}
              >
                + 0.4
              </Button>
            </Flex>
          </Box>

          <Customize>
            <PreviewSwitch
              title="Show Digits"
              isChecked={digitPlaceHolders}
              onChange={v => updateProp('digitPlaceHolders', v)}
            />

            <PreviewSlider
              title="Value"
              min={0}
              max={999}
              step={1}
              value={value}
              onChange={val => updateProp('value', val)}
            />

            <PreviewSlider
              title="Gap"
              min={0}
              max={50}
              step={10}
              value={gap}
              onChange={val => updateProp('gap', val)}
            />

            <PreviewSlider
              title="Font Size"
              min={40}
              max={200}
              step={10}
              value={fontSize}
              onChange={val => updateProp('fontSize', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={counter} componentName="Counter" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CounterDemo;
