import { Box } from "@chakra-ui/react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import CodeExample from "../../components/code/CodeExample";
import FollowCursor from "../../content/Animations/FollowCursor/FollowCursor";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";


const FollowCursorDemo = () => {
  const { followCursor } = CODE_EXAMPLES;

  return (
    <TabbedLayout>
      <PreviewTab>
        <Box position="relative" className="demo-container" minH={400} overflow="hidden">
          <FollowCursor />
        </Box>

        <p className="demo-extra-info">
          <InfoOutlineIcon position="relative" /> Hover for desktop, drag for mobile.
        </p>

        <h2 className="demo-title-extra">Dependencies</h2>
        <div className="demo-details">
          <span>@react-spring/web</span>
          <span>react-use-gesture</span>
        </div>
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={followCursor} />
      </CodeTab>
    </TabbedLayout>

  );
}

export default FollowCursorDemo;