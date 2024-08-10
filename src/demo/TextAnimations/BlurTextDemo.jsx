import { Box } from "@chakra-ui/react";
import { useState } from "react";
import { BlurText } from "../../content/TextAnimations/BlurText/BlurText";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import CodeExample from "../../components/code/CodeExample";
import RefreshButton from "../../components/common/RefreshButton";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";

const BlurTextDemo = () => {
  const { blurText } = CODE_EXAMPLES;
  const [counter, setCounter] = useState(0);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  return (
    <TabbedLayout>
      <PreviewTab>
        <Box position="relative" className="demo-container">
          <BlurText key={counter} text="Isn't this so cool?!" className="blur-text-demo" />
          <RefreshButton onClick={reRender} />
        </Box>

        <h2 className="demo-title-extra">Dependencies</h2>
        <div className="demo-details">
          <span>@react-spring/web</span>
        </div>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={blurText} />
      </CodeTab>
    </TabbedLayout>

  );
}

export default BlurTextDemo;