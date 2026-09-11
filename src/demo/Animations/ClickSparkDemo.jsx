import { useMemo } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import PropTable from '../../components/common/Preview/PropTable';

import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import Customize from '../../components/common/Preview/Customize';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import { clickSpark } from '../../constants/code/Animations/clickSparkCode';
import ClickSpark from '../../content/Animations/ClickSpark/ClickSpark';
import { useColorModeValue } from '../../components/setup/color-mode';

const DEFAULT_PROPS = {
  sparkColor: '#ffffff',
  sparkSize: 10,
  sparkRadius: 15,
  sparkCount: 8,
  duration: 400,
  extraScale: 1.0
};

const ClickSparkDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { sparkColor, sparkSize, sparkRadius, sparkCount, duration, extraScale } = props;
  const renderedSparkColor = useColorModeValue(
    sparkColor === DEFAULT_PROPS.sparkColor ? '#18181b' : sparkColor,
    sparkColor
  );

  const [key, forceRerender] = useForceRerender();

  const propData = useMemo(
    () => [
      {
        name: 'sparkColor',
        type: 'string',
        default: "'#fff'",
        description: 'Color of each spark line.'
      },
      {
        name: 'sparkSize',
        type: 'number',
        default: 10,
        description: 'Initial length of each spark line.'
      },
      {
        name: 'sparkRadius',
        type: 'number',
        default: 15,
        description: 'How far sparks travel from the click center.'
      },
      {
        name: 'sparkCount',
        type: 'number',
        default: 8,
        description: 'Number of spark lines that appear on each click.'
      },
      {
        name: 'duration',
        type: 'number',
        default: 400,
        description: 'Animation duration in milliseconds.'
      },
      {
        name: 'easing',
        type: 'string',
        default: "'ease-out'",
        description: 'Easing function used for the spark animation.'
      },
      {
        name: 'extraScale',
        type: 'number',
        default: 1.0,
        description: 'Additional multiplier for spark distance.'
      },
      {
        name: 'children',
        type: 'React.ReactNode',
        default: '',
        description: 'React children to render.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} p={0} overflow="hidden">
            <ClickSpark
              key={key}
              sparkColor={renderedSparkColor}
              sparkSize={sparkSize}
              sparkRadius={sparkRadius}
              sparkCount={sparkCount}
              duration={duration}
              extraScale={extraScale}
            />

            <Text
              position="absolute"
              fontWeight={600}
              fontSize="2rem"
              textAlign="center"
              className="demo-instruction"
              userSelect="none"
            >
              Click Around!
            </Text>
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="click-spark"
              currentProps={{ sparkColor, sparkSize, sparkRadius, sparkCount, duration, extraScale }}
              defaultProps={DEFAULT_PROPS}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom title="Spark Color" color={renderedSparkColor} onChange={val => { updateProp('sparkColor', val); forceRerender(); }} />

            <PreviewSlider
              title="Spark Size"
              min={5}
              max={60}
              step={1}
              value={sparkSize}
              onChange={val => {
                updateProp('sparkSize', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Spark Radius"
              min={10}
              max={200}
              step={5}
              value={sparkRadius}
              onChange={val => {
                updateProp('sparkRadius', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Spark Count"
              min={1}
              max={20}
              step={1}
              value={sparkCount}
              onChange={val => {
                updateProp('sparkCount', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Duration"
              min={200}
              max={2000}
              step={100}
              value={duration}
              valueUnit="ms"
              onChange={val => {
                updateProp('duration', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Extra Scale"
              min={0.5}
              max={2}
              step={0.1}
              value={extraScale}
              onChange={val => {
                updateProp('extraScale', val);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={clickSpark} componentName="ClickSpark" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ClickSparkDemo;
