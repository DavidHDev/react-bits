import { Box, Flex, Text } from "@chakra-ui/react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";
import CodeExample from '../../components/code/CodeExample';
import RollingGallery from "../../content/Components/RollingGallery/RollingGallery";
import PropTable from "../../components/common/PropTable";

const ThreeDGalleryDemo = () => {
  const { rollingGallery } = CODE_EXAMPLES;

  const propData = [
    {
      name: 'autoplay',
      type: 'boolean',
      default: 'false',
      description: 'Controls the autoplay toggle of the carousel. When turned on, it rotates and loops infinitely.',
    },
    {
      name: 'pauseOnHover',
      type: 'boolean',
      default: 'false',
      description: 'Allows the carousel to be paused on hover when autoplay is turned on.',
    }
  ];

  return (
    <TabbedLayout>
      <PreviewTab>
        <Box position="relative" className="demo-container" bg={'#000000'} overflow='hidden' p={0}>
          <Flex h={'100%'} maxW={'600px'} alignItems="center" justifyContent="center" direction="column">
            <Text textAlign="center" position="absolute" fontWeight={900} top={{ base: '4em', md: '1em' }} whiteSpace="nowrap" fontSize={{ base: '1.6em', md: '3rem' }}>Your trip to Thailand.</Text>
            <RollingGallery autoplay={true} pauseOnHover={true} />
          </Flex>
        </Box>

        <h2 className="demo-title-extra">Dependencies</h2>
        <div className="demo-details">
          <span>framer-motion</span>
        </div>

        <h2 className="demo-title-extra">Component API</h2>
        <PropTable data={propData} />
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={rollingGallery} />
      </CodeTab>
    </TabbedLayout>
  );
};

export default ThreeDGalleryDemo;
