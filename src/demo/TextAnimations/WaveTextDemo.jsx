import { Box } from "@chakra-ui/react";

import { useState } from "react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import RefreshButton from "../../components/common/RefreshButton";
import WaveText from "../../content/TextAnimations/WaveText/WaveText";
import CodeExample from '../../components/code/CodeExample';
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";

const WaveTextDemo = () => {
  const { waveText } = CODE_EXAMPLES;
  const [counter, setCounter] = useState(0);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  return (
    <TabbedLayout>
      <PreviewTab>
        <Box position="relative" className="demo-container">
          <WaveText key={counter} />
          <RefreshButton onClick={reRender} />
        </Box>

        <h2 className="demo-title-extra">Dependencies</h2>
        <div className="demo-details">
          <span>@react-spring/web</span>
        </div>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={waveText} />
      </CodeTab>
    </TabbedLayout>

  );
}

export default WaveTextDemo;