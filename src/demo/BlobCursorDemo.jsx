import { Box } from "@chakra-ui/react";
import BlobCursor from "../content/Animations/BlobCursor/BlobCursor";
import CodeExample from "../components/CodeExample";
import { CODE_EXAMPLES } from "../constants/ExampleConstants";

const BlobCursorDemo = () => {
  const { blobCursor } = CODE_EXAMPLES;

  return (
    <>
      <h2 className="demo-title">Demo (hover)</h2>
      <Box height={200} position="relative" className="demo-container" overflow="hidden">
        <BlobCursor />
      </Box>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> and <span>react-use-measure</span> for the animation.
      </p>

      <CodeExample codeObject={blobCursor} />
    </>
  );
}

export default BlobCursorDemo;