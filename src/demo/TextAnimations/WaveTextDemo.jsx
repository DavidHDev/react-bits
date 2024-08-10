import { Box } from "@chakra-ui/react";

import { useState } from "react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import RefreshButton from "../../components/common/RefreshButton";
import WaveText from "../../content/TextAnimations/WaveText/WaveText";
import CodeExample from '../../components/code/CodeExample';

const WaveTextDemo = () => {
  const { waveText } = CODE_EXAMPLES;
  const [counter, setCounter] = useState(0);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Box position="relative" className="demo-container">
        <WaveText key={counter} />
        <RefreshButton onClick={reRender} />
      </Box>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> for the animation.
      </p>

      <CodeExample codeObject={waveText} />
    </>

  );
}

export default WaveTextDemo;