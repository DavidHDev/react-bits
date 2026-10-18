import { Box, Flex, Text } from '@chakra-ui/react';
import { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/landingnew/Navbar/Navbar';
import Footer from '../components/landingnew/Footer/Footer';
import ToolSwitcher from '../tools/ToolSwitcher';
import ToolsIndex from '../tools/ToolsIndex';
import { TOOLS as BASE_TOOLS } from '../constants/Tools';
import { colors } from '../constants/colors';
import usePageSEO from '../hooks/usePageSEO';
import { PAGE_METADATA, getToolSEO } from '../constants/pageMetadata';
import '../tools/tools.css';
import '../css/site-page.css';

const BackgroundStudio = lazy(() => import('../tools/background-studio/BackgroundStudio'));
const ShapeMagic = lazy(() => import('../tools/shape-magic/ShapeMagic'));
const TextureLab = lazy(() => import('../tools/texture-lab/TextureLab'));
const CenterStage = lazy(() => import('../tools/center-stage/CenterStage'));
const SoundLab = lazy(() => import('../tools/sound-lab/SoundLab'));

const TOOL_COMPONENTS = {
  'background-studio': BackgroundStudio,
  'shape-magic': ShapeMagic,
  'texture-lab': TextureLab,
  'center-stage': CenterStage,
  'sound-lab': SoundLab
};

const TOOLS = BASE_TOOLS.map(tool => ({
  ...tool,
  component: TOOL_COMPONENTS[tool.id]
}));

const ComingSoon = ({ label, toolSelector }) => (
  <Flex h="100%" w="100%" gap={4} direction={{ base: 'column', lg: 'row' }}>
    {/* Controls Panel - shown on desktop */}
    <Box w="280px" flexShrink={0} display={{ base: 'none', lg: 'flex' }} flexDirection="column">
      {toolSelector && <Box mb={4}>{toolSelector}</Box>}
      <Text fontSize="13px" color={colors.accentMuted}>
        Settings will appear here when the tool is ready.
      </Text>
    </Box>

    {/* Preview Area */}
    <Flex
      flex={1}
      align="center"
      justify="center"
      direction="column"
      gap={3}
      borderRadius={{ base: '12px', lg: '16px' }}
      border={`1px solid ${colors.borderPrimary}`}
      bg={colors.bgCard}
      minH={{ base: '200px', lg: 'auto' }}
    >
      <Text fontSize={{ base: '20px', md: '24px' }} fontWeight={700} color="var(--text-primary)">
        {label}
      </Text>
      <Text fontSize="14px" color={colors.accentMuted}>
        Coming soon...
      </Text>
    </Flex>
  </Flex>
);

const ToolContent = ({ toolId, toolSelector, mobileToolSelector }) => {
  const tool = TOOLS.find(t => t.id === toolId);

  if (!tool?.component) {
    return (
      <ComingSoon label={tool?.label || 'Tool'} toolSelector={toolSelector} mobileToolSelector={mobileToolSelector} />
    );
  }

  const Component = tool.component;
  return (
    <Suspense
      fallback={
        <Flex w="100%" h="100%" align="center" justify="center">
          <Text color={colors.accentMuted}>Loading...</Text>
        </Flex>
      }
    >
      <Component toolSelector={toolSelector} mobileToolSelector={mobileToolSelector} />
    </Suspense>
  );
};

export default function ToolsPage() {
  const { toolId } = useParams();
  const activeTool = TOOLS.find(tool => tool.id === toolId);
  usePageSEO(activeTool ? getToolSEO(activeTool) : { ...PAGE_METADATA['/tools'], path: '/tools' });

  if (!toolId) {
    return (
      <>
        <Navbar showDocs />
        <ToolsIndex />
        <Footer wide />
      </>
    );
  }

  const selectedTool = TOOLS.find(t => t.id === toolId)?.id || 'background-studio';

  return (
    <Box className="rb-tools-page" h="100vh" bg={colors.bgBody} overflow="hidden">
      <Navbar showDocs />

      <Box
        px={{ base: 3, md: 6 }}
        pt={{ base: '80px', md: '80px' }}
        pb={{ base: 3, md: 6 }}
        h="100vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        {/* Mobile Tool Selector - shown at top on mobile */}
        <Box display="block" css={{ '@media (min-width: 1024px)': { display: 'none' } }} mb={3} flexShrink={0}>
          <ToolSwitcher activeId={selectedTool} />
        </Box>

        {/* Tool content - full height, tool selector passed as prop */}
        <Box flex={1} overflow="hidden">
          <ToolContent toolId={selectedTool} toolSelector={<ToolSwitcher activeId={selectedTool} />} />
        </Box>
      </Box>
    </Box>
  );
}
