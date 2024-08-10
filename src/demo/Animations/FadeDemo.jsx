import { Box, Button, Flex, Text } from "@chakra-ui/react";
import RefreshButton from "../../components/common/RefreshButton";
import Fade from "../../content/Animations/Fade/Fade";
import { useState } from "react";
import CodeExample from "../../components/code/CodeExample";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";

const FadeDemo = () => {
  const [counter, setCounter] = useState(0);
  const [blur, setBlur] = useState(false);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  const { fade } = CODE_EXAMPLES;

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Box position="relative" className="demo-container" minH={200}>
        <Fade key={counter} blur={blur}>
          <Flex fontSize="xl" fontWeight="bolder" justifyContent="center" alignItems="center" color="black" h={100} borderRadius="xl" w={200} bg={"#fff"}>Fade</Flex>
        </Fade>
        <RefreshButton onClick={reRender} />
      </Box>

      <h2 className="demo-title">Options</h2>
      <Flex gap={2}>
        <Button
          fontSize="xs"
          h={8}
          onClick={() => {
            setBlur(!blur);
            reRender();
          }}
        >
          Blur: <Text color={blur ? "lightgreen" : "coral"}>&nbsp;{String(blur)}</Text>
        </Button>
      </Flex>

      <p className="demo-details">
        This component is dependency-free.
      </p>

      <CodeExample codeObject={fade} />
    </>
  );
}

export default FadeDemo;