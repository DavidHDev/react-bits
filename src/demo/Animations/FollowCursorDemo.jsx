import { Box } from "@chakra-ui/react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import CodeExample from "../../components/code/CodeExample";
import FollowCursor from "../../content/Animations/FollowCursor/FollowCursor";
import { InfoOutlineIcon } from "@chakra-ui/icons";


const FollowCursorDemo = () => {
  const { followCursor } = CODE_EXAMPLES;

  return (
    <>
      <h2 className="demo-title">Demo</h2>
      <Box position="relative" className="demo-container" minH={400} overflow="hidden">
        <FollowCursor />
      </Box>

      <p className="demo-extra-info">
        <InfoOutlineIcon position="relative" /> Hover for desktop, drag for mobile.
      </p>

      <p className="demo-details">
        This component uses <span>@react-spring/web</span> for the animation and <span>react-use-gesture</span> for mobile gestures.
      </p>

      <CodeExample codeObject={followCursor} />
    </>

  );
}

export default FollowCursorDemo;