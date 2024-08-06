import { Box } from "@chakra-ui/react";

import { useState } from "react";
import { BlurText } from "../content/TextAnimations/BlurText/BlurText";
import { CODE_EXAMPLES } from "../constants/ExampleConstants";
import CodeExample from "../components/CodeExample";
import RefreshButton from "../components/RefreshButton";

const BlurTextDemo = () => {
  const { blurText } = CODE_EXAMPLES;
  const [counter, setCounter] = useState(0);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Box position="relative" className="demo-container">
        <BlurText key={counter} text="Isn't this so cool?!" className="blur-text-demo" />
        <RefreshButton onClick={reRender} />
      </Box>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> for the animation.
      </p>

      <CodeExample codeObject={blurText} />
    </>

  );
}

export default BlurTextDemo;