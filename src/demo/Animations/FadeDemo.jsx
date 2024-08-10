import { Box, Button, Flex, Text } from "@chakra-ui/react";
import RefreshButton from "../../components/common/RefreshButton";
import Fade from "../../content/Animations/Fade/Fade";
import { useState } from "react";
import CodeExample from "../../components/code/CodeExample";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";

const FadeDemo = () => {
  const [counter, setCounter] = useState(0);
  const [blur, setBlur] = useState(false);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  const { fade } = CODE_EXAMPLES;

  return (
    <TabbedLayout>
      <PreviewTab>
        <Box position="relative" className="demo-container" minH={200}>
          <Fade key={counter} blur={blur}>
            <Flex fontSize="xl" fontWeight="bolder" justifyContent="center" alignItems="center" color="black" h={100} borderRadius="xl" w={200} bg={"#fff"}>Fade</Flex>
          </Fade>
          <RefreshButton onClick={reRender} />
        </Box>

        <div className="preview-options">
          <h2 className="demo-title-extra">Options</h2>
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
        </div>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={fade} />
      </CodeTab>
    </TabbedLayout>
  );
}

export default FadeDemo;