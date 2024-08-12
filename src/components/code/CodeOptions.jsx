// TabbedLayout.js
import React from "react";
import { Tabs, TabList, Tab, TabPanels, TabPanel, Icon, Text, Flex } from "@chakra-ui/react";
import { TbBrandCss3 } from "react-icons/tb";
import { RiTailwindCssLine, RiEmotionSadLine } from "react-icons/ri";

const CodeOptions = ({ children, hasNoCss = false }) => {
  const tabs = React.Children.toArray(children);
  const cssContent = tabs.find((child) => child.type === CSSTab);
  const tailwindContent = tabs.find((child) => child.type === TailwindTab);

  const tabStyle = {
    transition: "color 0.3s",
    "&:hover": {
      color: "#00f0ff",
    },
  };

  const renderTailwindContent = () =>
    tailwindContent?.props?.children?.props?.codeString ? (
      tailwindContent
    ) : (
      <Flex alignItems="center" gap={2} my={6} color="#a1a1aa">
        {hasNoCss ? (
          <Text>This component does not use any CSS.</Text>
        ) : (
          <>
            <Icon as={RiEmotionSadLine} />
            <Text>Nothing here yet!</Text>
          </>
        )}
      </Flex>
    );

  return (
    <Tabs mt={4}>
      <TabList borderBottom="1px solid #ffffff1c" mb={4}>
        <Tab _selected={{ color: "#00f0ff", borderBottomColor: "#00f0ff" }} sx={tabStyle}>
          <Icon as={TbBrandCss3} />&nbsp;Default
        </Tab>
        <Tab _selected={{ color: "#00f0ff", borderBottomColor: "#00f0ff" }} sx={tabStyle}>
          <Icon as={RiTailwindCssLine} />&nbsp;Tailwind
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel p={0}>{cssContent}</TabPanel>
        <TabPanel p={0}>{renderTailwindContent()}</TabPanel>
      </TabPanels>
    </Tabs>
  );
};

// Helper components to wrap tab content
const CSSTab = ({ children }) => <>{children}</>;
const TailwindTab = ({ children }) => <>{children}</>;

export { CodeOptions, CSSTab, TailwindTab };
