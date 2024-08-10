// TabbedLayout.js
import React from "react";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@chakra-ui/react";

const TabbedLayout = ({ children }) => {
  // Separate PreviewTab and CodeTab components
  const previewContent = React.Children.toArray(children).find(
    (child) => child.type === PreviewTab
  );
  const codeContent = React.Children.toArray(children).find(
    (child) => child.type === CodeTab
  );

  return (
    <Tabs mt={4}>
      <TabList borderBottom={"1px solid #ffffff1c"}>
        <Tab
          _selected={{ color: "#00f0ff", borderBottomColor: "#00f0ff" }}
          sx={{
            transition: "color 0.3s",
            "&:hover": {
              color: "#00f0ff",
            },
          }}
        >
          Preview
        </Tab>
        <Tab
          _selected={{ color: "#00f0ff", borderBottomColor: "#00f0ff" }}
          sx={{
            transition: "color 0.3s",
            "&:hover": {
              color: "#00f0ff",
            },
          }}
        >
          Code
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel p={0}>{previewContent}</TabPanel>
        <TabPanel p={0}>{codeContent}</TabPanel>
      </TabPanels>
    </Tabs>
  );
};

// Helper components to wrap tab content
const PreviewTab = ({ children }) => <>{children}</>;
const CodeTab = ({ children }) => <>{children}</>;

export { TabbedLayout, PreviewTab, CodeTab };
