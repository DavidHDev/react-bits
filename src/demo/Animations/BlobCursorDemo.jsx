import { Box, Button, Flex, Text } from "@chakra-ui/react";
import BlobCursor from "../../content/Animations/BlobCursor/BlobCursor";
import { WarningIcon } from "@chakra-ui/icons";
import { useState } from "react";
import CodeExample from '../../components/code/CodeExample';
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";

const BlobCursorDemo = () => {
  const [shape, setShape] = useState('circle');
  const [color, setColor] = useState('#00f0ff');

  const { blobCursor } = CODE_EXAMPLES;

  return (
    <TabbedLayout>
      <PreviewTab>
        <Box height={200} position="relative" className="demo-container" overflow="hidden">
          <BlobCursor blobType={shape} fillColor={color} />
        </Box>

        <div className="preview-options">
          <h2 className="demo-title-extra">Options</h2>
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
              Color:&nbsp;&nbsp;<input type="color" value={color} style={{ height: '22px', outline: 'none', border: 'none' }} onChange={(e) => setColor(e.target.value)} />
            </Flex>
          </Flex>
        </div>

        <p className="demo-extra-info">
          <WarningIcon position="relative" /> Not supported on Safari
        </p>

        <h2 className="demo-title-extra">Dependencies</h2>
        <div className="demo-details">
          <span>@react-spring/web</span>
        </div>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={blobCursor} />
      </CodeTab>
    </TabbedLayout>
  );
}

export default BlobCursorDemo;