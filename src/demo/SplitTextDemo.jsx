import { Box } from "@chakra-ui/react";
import { SplitText } from "../content/TextAnimations/SplitText/SplitText";

import { useState } from "react";
import { CODE_EXAMPLES } from "../constants/ExampleConstants";
import RefreshButton from "../components/RefreshButton";
import CodeExample from "../components/CodeExample";

const SplitTextDemo = () => {
  const { splitText } = CODE_EXAMPLES;
  const [counter, setCounter] = useState(0);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Box position="relative" className="demo-container">
        <SplitText key={counter} text="Hello!" className="split-text-demo" />
        <RefreshButton onClick={reRender} />
      </Box>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> for the animation.
      </p>

      <CodeExample codeObject={splitText} />
    </>

  );
}

export default SplitTextDemo;