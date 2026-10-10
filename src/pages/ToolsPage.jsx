import { Box, Flex, Text, Icon, Portal } from '@chakra-ui/react';
import { ChevronDown, Info } from 'lucide-react';
import { useRef, useEffect, useState, Suspense, lazy } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LuArrowUpRight } from 'react-icons/lu';
import Navbar from '../components/landingnew/Navbar/Navbar';
import Footer from '../components/landingnew/Footer/Footer';
import ProCard from '../components/common/ProCard';
import SponsorsCard from '../components/common/SponsorsCard';
import { TOOLS as BASE_TOOLS } from '../constants/Tools';
import { colors } from '../constants/colors';
import { useColorModeValue } from '../components/setup/color-mode';
import usePageSEO from '../hooks/usePageSEO';
import { PAGE_METADATA, getToolSEO } from '../constants/pageMetadata';
import '../tools/tools.css';
import '../css/site-page.css';
import '../css/tools-landing.css';

const BackgroundStudio = lazy(() => import('../tools/background-studio/BackgroundStudio'));
const ShapeMagic = lazy(() => import('../tools/shape-magic/ShapeMagic'));
const TextureLab = lazy(() => import('../tools/texture-lab/TextureLab'));

const TOOL_COMPONENTS = {
  'background-studio': BackgroundStudio,
  'shape-magic': ShapeMagic,
  'texture-lab': TextureLab
};

const TOOLS = BASE_TOOLS.map(tool => ({
  ...tool,
  component: TOOL_COMPONENTS[tool.id]
}));

const previewFrom = name => lazy(() => import('../tools/ToolPreviews').then(module => ({ default: module[name] })));

const TOOL_CARDS = {
  'background-studio': {
    blurb: 'Pick an animated background, tune every setting live, then export a video, an image or the code.',
    Preview: previewFrom('BackgroundStudioPreview')
  },
  'shape-magic': {
    blurb: 'Merge rectangles into one liquid shape. Export SVG, PNG, React or a clip-path.',
    Preview: previewFrom('ShapeMagicPreview')
  },
  'texture-lab': {
    blurb: 'Run an image through halftone, dither, ASCII, grain and more, then download it.',
    Preview: previewFrom('TextureLabPreview')
  }
};

const ToolDropdown = ({ selectedTool, onSelect, isOpen, setIsOpen }) => {
  const dropdownRef = useRef(null);
  const infoRef = useRef(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const selected = TOOLS.find(t => t.id === selectedTool) || TOOLS[0];

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  useEffect(() => {
    if (tooltipVisible && infoRef.current) {
      const rect = infoRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top, left: rect.right + 8 });
    }
  }, [tooltipVisible]);

  return (
    <Box position="relative" ref={dropdownRef}>
      <div className="tool-selector-wrapper" onClick={() => setIsOpen(!isOpen)}>
        <Flex
          as="button"
          className="tool-selector-button"
          align="center"
          cursor="pointer"
          justify="space-between"
          w="100%"
        >
          <Flex align="center" gap={2.5}>
            <Flex align="center" justify="center" w={7} h={7} borderRadius="8px" bg="var(--surface-ghost-hover)">
              <Icon as={selected.icon} boxSize={4} color="var(--text-primary)" />
            </Flex>
            <Text fontSize="14px" fontWeight={600} color="var(--text-primary)" letterSpacing="-0.01em">
              {selected.label}
            </Text>
          </Flex>
          <Flex align="center" gap={1.5}>
            <div
              ref={infoRef}
              className="info-tooltip-trigger"
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
            >
              <Info size={14} color="var(--text-dimmed)" />
            </div>
            <Flex align="center" justify="center" w={6} h={6} borderRadius="6px" bg="var(--surface-ghost)">
              <Icon
                as={ChevronDown}
                boxSize={3.5}
                color="var(--text-dimmed)"
                transition="transform 0.2s"
                transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
              />
            </Flex>
          </Flex>
        </Flex>
      </div>

      <Box
        position="absolute"
        top="100%"
        left={0}
        right={0}
        mt={2}
        bg={colors.bgCard}
        border={`1px solid ${colors.borderPrimary}`}
        borderRadius="12px"
        overflow="hidden"
        opacity={isOpen ? 1 : 0}
        visibility={isOpen ? 'visible' : 'hidden'}
        transform={isOpen ? 'translateY(0)' : 'translateY(-8px)'}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex={100}
        boxShadow="var(--tool-menu-shadow)"
      >
        {TOOLS.map(tool => (
          <Flex
            key={tool.id}
            as="button"
            onClick={() => {
              onSelect(tool.id);
              setIsOpen(false);
            }}
            align="center"
            gap={2.5}
            w="100%"
            px={3}
            py={2.5}
            bg={selectedTool === tool.id ? colors.bgElevated : 'transparent'}
            _hover={{ bg: colors.bgElevated }}
            transition="all 0.15s"
          >
            <Flex
              align="center"
              justify="center"
              w={6}
              h={6}
              borderRadius="8px"
              bg={selectedTool === tool.id ? 'var(--surface-ghost-hover)' : 'var(--surface-ghost)'}
              transition="all 0.15s"
            >
              <Icon
                as={tool.icon}
                boxSize={3.5}
                color={selectedTool === tool.id ? 'var(--text-primary)' : 'var(--text-dimmed)'}
              />
            </Flex>
            <Text fontSize="14px" fontWeight={selectedTool === tool.id ? 600 : 500} color="var(--text-primary)">
              {tool.label}
            </Text>
            {!tool.component && (
              <Text fontSize="10px" color={colors.accentMuted} fontWeight={600} ml="auto">
                Soon
              </Text>
            )}
          </Flex>
        ))}
      </Box>

      {tooltipVisible && (
        <Portal>
          <Box
            position="fixed"
            top={`${tooltipPos.top}px`}
            left={`${tooltipPos.left}px`}
            bg="var(--tool-popover-bg)"
            border="1px solid var(--tool-popover-border)"
            borderRadius="8px"
            p="8px 12px"
            w="220px"
            fontSize="12px"
            color="var(--text-muted)"
            lineHeight={1.5}
            boxShadow="var(--tool-menu-shadow)"
            zIndex={99999}
            pointerEvents="none"
          >
            {selected.description}
          </Box>
        </Portal>
      )}
    </Box>
  );
};

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
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const light = useColorModeValue(true, false);
  const activeTool = TOOLS.find(tool => tool.id === toolId);
  usePageSEO(activeTool ? getToolSEO(activeTool) : { ...PAGE_METADATA['/tools'], path: '/tools' });

  if (!toolId) {
    return (
      <>
        <Navbar showDocs />
        <main className="pg tl">
          <div className="tl-layout">
            <div className="tl-main">
              <header className="pg-head tl-head">
                <div>
                  <h1 className="pg-title">Creative tools</h1>
                  <p className="pg-sub">
                    Free tools that run in your browser. Make a background, a shape or a texture, tune it live, then
                    take it into your project.
                  </p>
                </div>
              </header>

              <div className="tl-grid">
                {TOOLS.map(tool => {
                  const card = TOOL_CARDS[tool.id];
                  const Preview = card?.Preview;
                  return (
                    <Link to={`/tools/${tool.id}`} className={`pg-tile tl-card tl-card--${tool.id}`} key={tool.id}>
                      <div className="pg-well tl-well">
                        {Preview && (
                          <Suspense fallback={null}>
                            <Preview light={light} />
                          </Suspense>
                        )}
                      </div>
                      <div className="tl-caption">
                        <div className="tl-text">
                          <h2 className="tl-name">{tool.label}</h2>
                          <p className="tl-desc">{card?.blurb || tool.description}</p>
                        </div>
                        <span className="tl-open">
                          Open
                          <LuArrowUpRight size={14} aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <aside className="tl-rail">
              <ProCard />
              <SponsorsCard />
            </aside>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  const handleToolSelect = id => {
    navigate(`/tools/${id}`);
  };

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
        <Box display={{ base: 'block', lg: 'none' }} mb={3} flexShrink={0}>
          <ToolDropdown
            selectedTool={selectedTool}
            onSelect={handleToolSelect}
            isOpen={isMobileDropdownOpen}
            setIsOpen={setIsMobileDropdownOpen}
          />
        </Box>

        {/* Tool content - full height, tool selector passed as prop */}
        <Box flex={1} overflow="hidden">
          <ToolContent
            toolId={selectedTool}
            toolSelector={
              <ToolDropdown
                selectedTool={selectedTool}
                onSelect={handleToolSelect}
                isOpen={isDropdownOpen}
                setIsOpen={setIsDropdownOpen}
              />
            }
          />
        </Box>
      </Box>
    </Box>
  );
}
