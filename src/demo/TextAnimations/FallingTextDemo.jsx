import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Flex, Text } from '@chakra-ui/react';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';

import FallingText from '../../content/TextAnimations/FallingText/FallingText';
import { fallingText } from '../../constants/code/TextAnimations/fallingTextCode';

const DEFAULT_PROPS = {
  gravity: 0.56,
  mouseConstraintStiffness: 0.9,
  trigger: 'hover'
};

const FallingTextDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { gravity, mouseConstraintStiffness, trigger } = props;

  const [key, forceRerender] = useForceRerender();

  const propData = useMemo(
    () => [
      {
        name: 'text',
        type: 'string',
        default: '',
        description: 'The text content to display and eventually animate.'
      },
      {
        name: 'highlightWords',
        type: 'string[]',
        default: '[]',
        description: 'List of words or substrings to apply a highlight style.'
      },
      {
        name: 'highlightClass',
        type: 'string',
        default: `"highlighted"`,
        description: 'CSS class name for highlighted words.'
      },
      {
        name: 'trigger',
        type: "'click' | 'hover' | 'auto' | 'scroll'",
        default: 'auto',
        description: 'Defines how the falling effect is activated.'
      },
      {
        name: 'backgroundColor',
        type: 'string',
        default: `"transparent"`,
        description: 'Canvas background color for the physics world.'
      },
      {
        name: 'wireframes',
        type: 'boolean',
        default: 'false',
        description: 'Whether to render the physics bodies in wireframe mode.'
      },
      {
        name: 'gravity',
        type: 'number',
        default: '1',
        description: 'Vertical gravity factor for the physics engine.'
      },
      {
        name: 'mouseConstraintStiffness',
        type: 'number',
        default: '0.2',
        description: 'Stiffness for the mouse drag constraint.'
      },
      {
        name: 'fontSize',
        type: 'string',
        default: `"1rem"`,
        description: 'Font size applied to the text before it falls.'
      },
      {
        name: 'wordSpacing',
        type: 'string',
        default: `"2px"`,
        description: 'Horizontal spacing between each word.'
      }
    ],
    []
  );

  const options = [
    { value: 'hover', label: 'Hover' },
    { value: 'click', label: 'Click' },
    { value: 'auto', label: 'Auto' },
    { value: 'scroll', label: 'Scroll' }
  ];

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Flex
            position="relative"
            className="demo-container"
            h={400}
            overflow="hidden"
            justifyContent="center"
            alignItems="center"
            p={0}
          >
            <FallingText
              key={key}
              text={`React Bits is a library of animated and interactive React components designed to streamline UI development and simplify your workflow.`}
              highlightWords={['React', 'Bits', 'animated', 'components', 'simplify']}
              highlightClass="highlighted"
              trigger={trigger}
              gravity={gravity}
              fontSize="2rem"
              mouseConstraintStiffness={mouseConstraintStiffness}
            />

            <Text
              className="demo-instruction"
              fontSize="4rem"
              fontWeight={600}
              position="absolute"
              zIndex={0}
              userSelect="none"
            >
              {trigger === 'hover' ? 'Hover Me' : trigger === 'click' ? 'Click Me' : 'Auto Start'}
            </Text>
          </Flex>

          <Customize>
            <PreviewSelect
              title="Trigger"
              options={options}
              value={trigger}
              name="trigger"
              width={150}
              onChange={val => {
                updateProp('trigger', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Gravity"
              min={0.1}
              max={2}
              step={0.01}
              value={gravity}
              onChange={val => {
                updateProp('gravity', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Mouse Constraint Stiffness"
              min={0.1}
              max={2}
              step={0.1}
              value={mouseConstraintStiffness}
              onChange={val => {
                updateProp('mouseConstraintStiffness', val);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['matter-js']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={fallingText} componentName="FallingText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FallingTextDemo;
