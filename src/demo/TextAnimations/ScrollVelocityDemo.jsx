import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';

import ScrollVelocity from '../../content/TextAnimations/ScrollVelocity/ScrollVelocity';
import { scrollVelocity } from '../../constants/code/TextAnimations/scrollVelocityCode';
import Customize from '../../components/common/Preview/Customize';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

const DEFAULT_PROPS = {
  velocity: 100
};

const ScrollVelocityDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { velocity } = props;

  const propData = useMemo(
    () => [
      {
        name: 'scrollContainerRef',
        type: 'React.RefObject<HTMLElement>',
        default: 'undefined',
        description: 'Optional ref for a custom scroll container to track scroll position.'
      },
      {
        name: 'texts',
        type: 'React.ReactNode[]',
        default: '[]',
        description:
          'Array of items to display as scrolling content. Accepts strings, JSX elements, icons, or any valid React node.'
      },
      {
        name: 'velocity',
        type: 'number',
        default: '100',
        description: 'Base velocity for scrolling; sign is flipped for odd indexed texts.'
      },
      {
        name: 'className',
        type: 'string',
        default: '""',
        description: 'CSS class applied to each text copy (span).'
      },
      {
        name: 'damping',
        type: 'number',
        default: '50',
        description: 'Damping value for the spring animation.'
      },
      {
        name: 'stiffness',
        type: 'number',
        default: '400',
        description: 'Stiffness value for the spring animation.'
      },
      {
        name: 'numCopies',
        type: 'number',
        default: '6',
        description: 'Number of copies of the text rendered for a continuous scrolling effect.'
      },
      {
        name: 'velocityMapping',
        type: '{ input: number[]; output: number[] }',
        default: '{ input: [0, 1000], output: [0, 5] }',
        description: 'Mapping from scroll velocity to a movement multiplier for dynamic scrolling.'
      },
      {
        name: 'parallaxClassName',
        type: 'string',
        default: '"parallax"',
        description: 'CSS class for the parallax container.'
      },
      {
        name: 'scrollerClassName',
        type: 'string',
        default: '"scroller"',
        description: 'CSS class for the scroller container.'
      },
      {
        name: 'parallaxStyle',
        type: 'React.CSSProperties',
        default: 'undefined',
        description: 'Inline styles for the parallax container.'
      },
      {
        name: 'scrollerStyle',
        type: 'React.CSSProperties',
        default: 'undefined',
        description: 'Inline styles for the scroller container.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow={'hidden'}>
            <Flex position="relative" justifyContent="center" alignItems="center">
              <ScrollVelocity
                texts={['React Bits', 'Scroll Down']}
                velocity={velocity}
                className="custom-scroll-text"
              />
            </Flex>
          </Box>

          <Customize>
            <PreviewSlider
              title="Velocity"
              min={10}
              max={500}
              step={10}
              value={velocity}
              onChange={val => {
                updateProp('velocity', val);
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
          <Box mb="50vh"></Box>
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scrollVelocity} componentName="ScrollVelocity" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ScrollVelocityDemo;
