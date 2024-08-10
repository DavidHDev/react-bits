import { Flex } from "@chakra-ui/react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import Stack from "../../content/Components/Stack/Stack";
import CodeExample from '../../components/code/CodeExample';
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";

const StackDemo = () => {
  const { stack } = CODE_EXAMPLES;

  return (
    <TabbedLayout>
      <PreviewTab>
        <Flex overflow="hidden" justifyContent="center" alignItems="center" minH={400} position="relative" pb={"4em"} className="demo-container">
          <Stack />
        </Flex>

        <h2 className="demo-title-extra">Dependencies</h2>
        <div className="demo-details">
          <span>@react-spring/web</span>
          <span>react-use-gesture</span>
        </div>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={stack} />
      </CodeTab>
    </TabbedLayout>

  );
}

export default StackDemo;