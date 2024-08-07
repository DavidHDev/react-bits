import { Box } from "@chakra-ui/react";
import BlobCursor from "../content/Animations/BlobCursor/BlobCursor";
import CodeExample from "../components/CodeExample";
import { CODE_EXAMPLES } from "../constants/ExampleConstants";
import { WarningIcon } from "@chakra-ui/icons";

const BlobCursorDemo = () => {
  const { blobCursor } = CODE_EXAMPLES;

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Box height={200} position="relative" className="demo-container" overflow="hidden">
        <BlobCursor />
      </Box>

      <p className="demo-extra-info">
        <WarningIcon position="relative" /> Not supported on Safari
      </p>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> for the animation.
      </p>

      <CodeExample codeObject={blobCursor} />
    </>
  );
}

export default BlobCursorDemo;