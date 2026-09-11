import { useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';

import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';

import StarBorder from '../../content/Animations/StarBorder/StarBorder';
import { starBorder } from '../../constants/code/Animations/starBorderCode';
import Customize from '../../components/common/Preview/Customize';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

const DEFAULT_PROPS = {
  thickness: 1,
  speed: 5,
  color: 'magenta'
};

const colorOptions = [
  { value: 'magenta', label: 'Magenta' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'white', label: 'White' }
];

const StarBorderDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { thickness, speed, color } = props;
  const backgroundColor = useColorModeValue('#ffffff', '#000000');
  const textColor = useColorModeValue('#18181b', '#ffffff');
  const borderColor = useColorModeValue('#e4e4e7', '#222222');

  const propData = useMemo(
    () => [
      {
        name: 'as',
        type: 'string',
        default: 'button',
        description: 'Allows specifying the type of the parent component to be rendered.'
      },
      {
        name: 'className',
        type: 'string',
        default: '-',
        description: 'Allows adding custom classes to the component.'
      },
      {
        name: 'color',
        type: 'string',
        default: 'white',
        description: 'Changes the main color of the border (fades to transparent)'
      },
      {
        name: 'speed',
        type: 'string',
        default: '6s',
        description: 'Changes the speed of the animation.'
      },
      {
        name: 'thickness',
        type: 'number',
        default: '1',
        description: 'Controls the thickness of the star border effect.'
      },
      {
        name: 'backgroundColor',
        type: 'string',
        default: "'#000000'",
        description: 'Background color of the button surface.'
      },
      {
        name: 'textColor',
        type: 'string',
        default: "'#ffffff'",
        description: 'Text color of the button content.'
      },
      {
        name: 'borderColor',
        type: 'string',
        default: "'#222222'",
        description: 'Static border color around the button surface.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['speed']}
      computedProps={{ speed: `${speed}s` }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400}>
            <StarBorder
              className="star-border-demo"
              color={color}
              thickness={thickness}
              speed={`${speed}s`}
              backgroundColor={backgroundColor}
              textColor={textColor}
              borderColor={borderColor}
            >
              <Text mx={0} fontSize={'1em'}>
                Star Border
              </Text>
            </StarBorder>
          </Box>

          <Customize>
            <PreviewSelect
              title="Color"
              options={colorOptions}
              value={color}
              width={120}
              onChange={v => updateProp('color', v)}
            />

            <PreviewSlider
              title="Thickness"
              min={0.5}
              max={8}
              step={0.5}
              value={thickness}
              valueUnit="px"
              width={200}
              onChange={v => updateProp('thickness', v)}
            />

            <PreviewSlider
              title="Speed"
              min={1}
              max={10}
              step={0.5}
              value={speed}
              valueUnit="s"
              width={200}
              onChange={v => updateProp('speed', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={starBorder} componentName="StarBorder" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default StarBorderDemo;
