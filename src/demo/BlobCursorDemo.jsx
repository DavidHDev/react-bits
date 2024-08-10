import { Box, Button, Flex, Text } from "@chakra-ui/react";
import BlobCursor from "../content/Animations/BlobCursor/BlobCursor";
import CodeExample from "../components/CodeExample";
import { CODE_EXAMPLES } from "../constants/ExampleConstants";
import { WarningIcon } from "@chakra-ui/icons";
import { useState } from "react";

const BlobCursorDemo = () => {
  const [shape, setShape] = useState('circle');
  const [color, setColor] = useState('#00f0ff');

  const { blobCursor } = CODE_EXAMPLES;

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Box height={200} position="relative" className="demo-container" overflow="hidden">
        <BlobCursor blobType={shape} fillColor={color} />
      </Box>

      <p className="demo-extra-info">
        <WarningIcon position="relative" /> Not supported on Safari
      </p>

      <h2 className="demo-title">Options</h2>
      <Flex gap={2}>
        <Button
          fontSize="xs"
          h={8}
          onClick={() => {
            setShape(shape === 'circle' ? 'square' : 'circle');
          }}
        >
          Shape: <Text color={"#a1a1aa"}>&nbsp;{String(shape)}</Text>
        </Button>
        <Flex alignItems="center"
          fontSize="xs"
          h={8}
          onClick={() => {

          }}
        >
          Color:&nbsp;&nbsp;<input type="color" value={color} style={{ height: '22px', outline: 'none', border: 'none' }} onChange={(e) => setColor(e.target.value)}/>
        </Flex>
      </Flex>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> for the animation.
      </p>

      <CodeExample codeObject={blobCursor} />
    </>
  );
}

export default BlobCursorDemo;