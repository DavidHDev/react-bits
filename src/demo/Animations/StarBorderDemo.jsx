import { Box, Text } from "@chakra-ui/react";

import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";
import CodeExample from '../../components/code/CodeExample';
import StarBorder from "../../content/Animations/StarBorder/StarBorder";
import PropTable from "../../components/common/PropTable";

const StarBorderDemo = () => {
  const { starBorder } = CODE_EXAMPLES;

  const propData = [
    {
      name: 'as',
      type: 'string',
      default: 'button',
      description: 'Allows specifying the type of the parent component to be rendered.',
    },
    {
      name: 'className',
      type: 'string',
      default: '-',
      description: 'Allows adding custom classes to the component.',
    },
    {
      name: 'color',
      type: 'string',
      default: 'white',
      description: 'Changes the main color of the border (fades to transparent)',
    },
    {
      name: 'speed',
      type: 'string',
      default: '6s',
      description: 'Changes the speed of the animation.',
    },
  ];

  return (
    <TabbedLayout>
      <PreviewTab>
        <h2 className="demo-title-extra">Button</h2>
        <Box position="relative" className="demo-container">
          <StarBorder>
            <Text mx={0} fontSize={'1em'}>Hello World!</Text>
          </StarBorder>
        </Box>

        <h2 className="demo-title-extra">Container, custom color</h2>
        <Box position="relative" className="demo-container">
          <StarBorder as="div" color="cyan">
            <div style={{ width: '200px', height: '100px', display: 'grid', placeItems: 'center' }}>
              Hello
            </div>
          </StarBorder>
        </Box>

        <h2 className="demo-title-extra">Component API</h2>
        <PropTable data={propData} />
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={starBorder} />
      </CodeTab>
    </TabbedLayout>
  );
};

export default StarBorderDemo;
