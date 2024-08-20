import { Box } from "@chakra-ui/react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";
import CodeExample from '../../components/code/CodeExample';
import DecayCard from "../../content/Components/DecayCard/DecayCard";
import PropTable from "../../components/common/PropTable";

const DecayCardDemo = () => {
  const { decayCard } = CODE_EXAMPLES;

  const propData = [
    {
      name: 'width',
      type: 'number',
      default: 200,
      description: 'The width of the card in pixels.',
    },
    {
      name: 'height',
      type: 'number',
      default: 300,
      description: 'The height of the card in pixels.',
    },
    {
      name: 'image',
      type: 'string',
      default: '',
      description: 'Allows setting the background image of the card.',
    }
  ];

  return (
    <TabbedLayout>
      <PreviewTab>
        <Box position="relative" className="demo-container" overflow="hidden">
          <DecayCard>
            <h2>The<br />Open Sea</h2>
          </DecayCard>
        </Box>

        <h2 className="demo-title-extra">Dependencies</h2>
        <div className="demo-details">
          <span>gsap</span>
        </div>

        <h2 className="demo-title-extra">Component API</h2>
        <PropTable data={propData} />
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={decayCard} />
      </CodeTab>
    </TabbedLayout>
  );
};

export default DecayCardDemo;
