// SplitTextDemo.js
import { Box } from "@chakra-ui/react";
import { SplitText } from "../../content/TextAnimations/SplitText/SplitText";

import { useState } from "react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import RefreshButton from "../../components/common/RefreshButton";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";
import CodeExample from '../../components/code/CodeExample';

const SplitTextDemo = () => {
  const { splitText } = CODE_EXAMPLES;
  const [counter, setCounter] = useState(0);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  return (
    <TabbedLayout>
      <PreviewTab>
        <Box position="relative" className="demo-container">
          <SplitText key={counter} text="Hello!" className="split-text-demo" />
          <RefreshButton onClick={reRender} />
        </Box>

        <h2 className="demo-title-extra">Dependencies</h2>
        <div className="demo-details">
          <span>@react-spring/web</span>
        </div>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={splitText} />
      </CodeTab>
    </TabbedLayout>
  );
};

export default SplitTextDemo;
