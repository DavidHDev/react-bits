// TabbedLayout.js
import React from "react";
import { Tabs, TabList, Tab, TabPanels, TabPanel, Icon, Text, Flex } from "@chakra-ui/react";
import { TbBrandCss3 } from "react-icons/tb";
import { RiTailwindCssLine, RiEmotionSadLine } from "react-icons/ri";

const CodeOptions = ({ children }) => {
  const cssContent = React.Children.toArray(children).find(
    (child) => child.type === CSSTab
  );
  const tailwindContent = React.Children.toArray(children).find(
    (child) => child.type === TailwindTab
  );

  return (
    <Tabs mt={4}>
      <TabList borderBottom={"1px solid #ffffff1c"} mb={4}>
        <Tab
          _selected={{ color: "#00f0ff", borderBottomColor: "#00f0ff" }}
          sx={{
            transition: "color 0.3s",
            "&:hover": {
              color: "#00f0ff",
            },
          }}
        >
          <Icon as={TbBrandCss3} />&nbsp;CSS
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
          <Icon as={RiTailwindCssLine} />&nbsp;Tailwind
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel p={0}>{cssContent}</TabPanel>
        <TabPanel p={0}>{tailwindContent?.props?.children?.props?.codeString
          ? tailwindContent
          : <Flex alignItems="center" gap={2} my={6} color='#a1a1aa'><Icon as={RiEmotionSadLine} /><Text>Nothing here yet</Text></Flex>
        }
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

// Helper components to wrap tab content
const CSSTab = ({ children }) => <>{children}</>;
const TailwindTab = ({ children }) => <>{children}</>;

export { CodeOptions, CSSTab, TailwindTab };
