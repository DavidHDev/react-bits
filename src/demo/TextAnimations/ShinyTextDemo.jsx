import { Box, Flex, Input } from "@chakra-ui/react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import CodeExample from "../../components/code/CodeExample";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";
import ShinyText from "../../content/TextAnimations/ShinyText/ShinyText";
import { useState } from "react";

const ShinyTextDemo = () => {
  const { shinyText } = CODE_EXAMPLES;
  const [speed, setSpeed] = useState(1);

  return (
    <TabbedLayout>
      <PreviewTab>
        <h2 className="demo-title-extra">Button Example</h2>
        <Box position="relative" className="demo-container" minH={150}>
          <div className="shiny-button">
            <ShinyText text="Shiny Button" disabled={false} speed={3} className="shiny-text-demo" />
          </div>
        </Box>

        <h2 className="demo-title-extra">Text Example</h2>
        <Box position="relative" className="demo-container" minH={150}>
          <ShinyText text="Just some shiny text!" disabled={false} speed={3} className="shiny-text-demo" />
        </Box>

        <h2 className="demo-title-extra">Configurable Speed</h2>
        <Box position="relative" className="demo-container" minH={150}>
          <ShinyText text="This is fast shiny!" disabled={false} speed={speed} className="shiny-text-demo" />
        </Box>

        <div className="preview-options">
          <Flex gap={2} alignItems="center">
            Animation speed (editable) &nbsp;- <Input h={8} px={2} type="tel" onChange={(e) => setSpeed(e.target.value)} maxLength={3} value={speed} w={`${String(speed).length + 1.5}ch`} />
            {speed === 1 ? 'second' : 'seconds'}
          </Flex>
        </div>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={shinyText} />
      </CodeTab>
    </TabbedLayout>

  );
}

export default ShinyTextDemo;