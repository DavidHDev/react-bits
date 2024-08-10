// TabbedLayout.js
import React from "react";
import { Tabs, TabList, Tab, TabPanels, TabPanel, Flex, Icon, Button, Text, Box } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { FiCode, FiEye, FiHeart } from "react-icons/fi";
import { TbBug, TbBulb } from "react-icons/tb";


const TabbedLayout = ({ children }) => {
  const { subcategory, category } = useParams(); // Extract subcategory from the URL

  const previewContent = React.Children.toArray(children).find(
    (child) => child.type === PreviewTab
  );
  const codeContent = React.Children.toArray(children).find(
    (child) => child.type === CodeTab
  );
  const contributeContent = React.Children.toArray(children).find(
    (child) => child.type === ContributeTab
  );

  return (
    <Tabs mt={4}>
      <TabList borderBottom={"1px solid #ffffff1c"} justifyContent="space-between">
        <Flex>
          <Tab
            _selected={{ color: "#00f0ff", borderBottomColor: "#00f0ff" }}
            sx={{
              transition: "color 0.3s",
              "&:hover": {
                color: "#00f0ff",
              },
            }}
          >
            <Icon as={FiEye} />&nbsp;Preview
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
            <Icon as={FiCode} />&nbsp;Code
          </Tab>
        </Flex>

        <Tab
          _selected={{ color: "#00f0ff", borderBottomColor: "#00f0ff" }}
          sx={{
            paddingLeft: 0,
            paddingRight: 0,
            transition: "color 0.3s",
            "&:hover": {
              color: "#00f0ff",
            },
          }}
        >
          <Icon as={FiHeart} />&nbsp;Contribute
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel p={0}>{previewContent}</TabPanel>
        <TabPanel p={0}>{codeContent}</TabPanel>
        <TabPanel p={0}>
          <Box className="contribute-container">
            <h2 className="demo-title-contribute">Help us improve this component!</h2>
            <Flex gap={2} justifyContent="center" alignItems="center" direction={{ base: 'column', md: 'row' }}>
              <Button cursor="pointer" href={`https://github.com/DavidHDev/react-bits/issues/new?title=[BUG]:+${category}/${subcategory}&labels=bug&labels=bug&template=bug.md`} as="a" rel="noreferrer" target="_blank" fontSize="sm" height={9} rounded="xl" className="contribute-button">
                <Icon as={TbBug} />&nbsp;Report an issue
              </Button>
              <Text mx={2} color="#a1a1aa">or</Text>
              <Button cursor="pointer" href={`https://github.com/DavidHDev/react-bits/issues/new?title=[FEAT]:+${category}/${subcategory}&labels=enhancement&labels=enhancement&template=feature-request.md`} as="a" rel="noreferrer" target="_blank" fontSize="sm" height={9} rounded="xl" className="contribute-button">
                <Icon as={TbBulb} />&nbsp;Request a feature
              </Button>
            </Flex>
          </Box>
          {contributeContent}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

// Helper components to wrap tab content
const PreviewTab = ({ children }) => <>{children}</>;
const CodeTab = ({ children }) => <>{children}</>;
const ContributeTab = ({ children }) => <>{children}</>;

export { TabbedLayout, PreviewTab, CodeTab, ContributeTab };
