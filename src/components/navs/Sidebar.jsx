import { useRef, useState, useCallback, useMemo, memo, useEffect, Fragment } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Box, Flex, VStack, Text, Stack, Icon, IconButton, Drawer, Image, Separator } from '@chakra-ui/react';
import { ArrowRight, SearchIcon, XIcon } from 'lucide-react';

import { TOOLS } from '../../constants/Tools';
import { PRO_SECTIONS } from '../../constants/Pro';
import { colors } from '../../constants/colors';

import { useTransition } from '../../hooks/useTransition';
import usePreviewMediaAllowed from '../../hooks/usePreviewMediaAllowed';
import { CATEGORIES, NEW, TOTAL_COMPONENTS, UPDATED } from '../../constants/Categories';
import { componentMap } from '../../constants/Components';
import { componentMetadata } from '../../constants/Information';

import Logo from '../../assets/logos/react-bits-logo.svg';
import SponsorsCard from '../common/SponsorsCard';

// ─── Constants ───────────────────────────────────────────────────────────────
const SCROLL_OFFSET = 100;

const ICON_BUTTON_STYLES = {
  rounded: '10px',
  border: '1px solid transparent',
  bg: 'var(--surface-ghost-track)',
  _hover: { bg: 'var(--surface-ghost-hover)' }
};

const ARROW_ICON_PROPS = { boxSize: 4, transform: 'rotate(-45deg)' };

const BOTTOM_ENTER_PX = 8;
const BOTTOM_EXIT_PX = 48;
const PREVIEW_WIDTH = 304;
const PREVIEW_HEIGHT = 226;
const PREVIEW_DELAY = 260;
const PREVIEW_CYCLE_MS = 2400;

const PRO_PREVIEW_ITEMS = {
  components: [
    { label: 'Aurora Beam', src: '/assets/pro/components/aurora-beam-poster.webp' },
    { label: 'Reel Gallery', src: '/assets/pro/components/reel-gallery.webp' },
    { label: 'Glass Tiles', src: '/assets/pro/components/glass-tiles-poster.webp' },
    { label: 'Particle Image', src: '/assets/pro/components/particle-image-poster.webp' }
  ],
  blocks: [
    { label: 'Hero sections', src: '/assets/pro/blocks/hero-7.webp', crop: 'zoom' },
    { label: 'Pricing sections', src: '/assets/pro/blocks/pricing-1.webp', crop: 'zoom' },
    { label: 'Feature sections', src: '/assets/pro/blocks/features-10.webp', crop: 'zoom' }
  ],
  'app-ui': [
    { label: 'AI Chat', src: '/assets/pro/app-ui/ai-chat-8.webp', crop: 'deep' },
    { label: 'Dashboards', src: '/assets/pro/app-ui/dashboard-1.webp', crop: 'deep' },
    { label: 'Data tables', src: '/assets/pro/app-ui/data-table-1.webp', crop: 'deep' }
  ],
  templates: [
    { label: 'Finance template', src: 'https://cdn.reactbits.dev/finance-preview.mp4', type: 'video' },
    { label: 'AI SaaS template', src: 'https://cdn.reactbits.dev/ai-saas-preview.mp4', type: 'video' },
    { label: 'Security template', src: 'https://cdn.reactbits.dev/security-preview.mp4', type: 'video' }
  ],
  'agent-kit': [
    { label: 'Terminal Dark', src: '/assets/pro/agent-kit/skill-terminal-dark.webp' },
    { label: 'Swiss Grid', src: '/assets/pro/agent-kit/skill-swiss-grid.webp' },
    { label: 'Developer Tool', src: '/assets/pro/agent-kit/prompt-developer-tool.webp' }
  ]
};

// ─── Utility Functions ───────────────────────────────────────────────────────
const scrollToTop = () => window.scrollTo(0, 0);
const slug = str => str.replace(/\s+/g, '-').toLowerCase();
const COMPONENT_METADATA_BY_PATH = new Map(
  Object.values(componentMetadata).map(metadata => [new URL(metadata.docsUrl).pathname, metadata])
);

const useScrollEdges = ref => {
  const [edges, setEdges] = useState({ isAtTop: true, isAtBottom: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setEdges(previous => ({
        isAtTop: el.scrollTop <= 2,
        isAtBottom: previous.isAtBottom ? remaining <= BOTTOM_EXIT_PX : remaining <= BOTTOM_ENTER_PX
      }));
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [ref]);

  return edges;
};

const SidebarHoverPreview = ({ preview, x, y, reduceMotion }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const items = preview?.items || [];
  const previewKey = preview?.key;
  const itemCount = items.length;

  useEffect(() => {
    if (!previewKey || itemCount < 2 || reduceMotion) return undefined;

    const timeout = window.setTimeout(() => {
      setActiveIndex(current => (current + 1) % itemCount);
    }, PREVIEW_CYCLE_MS);

    return () => window.clearTimeout(timeout);
  }, [previewKey, itemCount, reduceMotion, activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [previewKey]);

  const activeItem = items[activeIndex];

  return (
    <AnimatePresence>
      {preview && activeItem && (
        <motion.aside
          className="sidebar-hover-preview"
          style={{ x, y }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <div className="sidebar-hover-preview-media">
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={`${preview.key}-${activeIndex}`}
                className="sidebar-hover-preview-frame"
                initial={{ opacity: 0, filter: 'blur(9px)', scale: 1.025 }}
                animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                exit={{ opacity: 0, filter: 'blur(7px)', scale: 0.985 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeItem.type === 'video' ? (
                  <video src={activeItem.src} autoPlay loop muted playsInline preload="metadata" />
                ) : activeItem.videoBase ? (
                  <video autoPlay loop muted playsInline preload="metadata">
                    <source src={`${activeItem.videoBase}.webm`} type="video/webm" />
                    <source src={`${activeItem.videoBase}.mp4`} type="video/mp4" />
                  </video>
                ) : (
                  <img
                    src={activeItem.src}
                    alt=""
                    className={activeItem.crop ? `sidebar-hover-preview-crop-${activeItem.crop}` : undefined}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="sidebar-hover-preview-caption">
            <span className="sidebar-hover-preview-title">{preview.title}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`${preview.key}-label-${activeIndex}`}
                className="sidebar-hover-preview-item"
                initial={{ opacity: 0, filter: 'blur(4px)', y: 2 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                exit={{ opacity: 0, filter: 'blur(4px)', y: -2 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.3 }}
              >
                {activeItem.label}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────
// ─── Pro Configuration ───────────────────────────────────────────────────────
const ProLinks = ({ onClose }) => (
  <>
    <Text className="sidebar-pro-name" mb={3}>
      Explore Pro
    </Text>
    <Flex direction="column" gap={2}>
      <Link to="/pro" onClick={onClose}>
        <Flex alignItems="center" gap="8px">
          <span>Overview</span>
        </Flex>
      </Link>
      {PRO_SECTIONS.map(section => (
        <Link key={section.slug} to={`/pro/${section.slug}`} onClick={onClose} className="sidebar-pro-link">
          <Flex alignItems="center" gap="7px">
            <Icon as={section.icon} boxSize={4} className="sidebar-pro-icon" />
            <span>{section.sidebarLabel || section.label}</span>
            {section.freeCount && <span className="sidebar-pro-free-tag">{section.freeCount} Free</span>}
          </Flex>
        </Link>
      ))}
    </Flex>
    <Separator my={4} />
  </>
);

// ─── Tools Configuration ─────────────────────────────────────────────────────
const ToolsLinks = ({ onClose }) => (
  <>
    <Separator my={4} />
    <Text color="#a6a6a6" mb={3}>
      Tools
    </Text>
    <Flex direction="column" gap={2}>
      {TOOLS.map(tool => (
        <Link
          key={tool.id}
          to={tool.comingSoon ? '#' : tool.path}
          onClick={tool.comingSoon ? e => e.preventDefault() : onClose}
          style={{
            opacity: tool.comingSoon ? 0.5 : 1,
            cursor: tool.comingSoon ? 'not-allowed' : 'pointer'
          }}
        >
          <Flex alignItems="center" gap="8px">
            <span>{tool.label}</span>
            {tool.comingSoon && (
              <Text as="span" fontSize="10px" color={colors.accentMuted} fontWeight={600}>
                SOON
              </Text>
            )}
          </Flex>
        </Link>
      ))}
    </Flex>
  </>
);

const UsefulLinks = ({ onClose }) => (
  <>
    <Separator my={4} />
    <Text color="#a6a6a6" mb={3}>
      Useful Links
    </Text>
    <Flex direction="column" gap={2}>
      {[
        { to: 'https://github.com/DavidHDev/react-bits', label: 'GitHub', external: true },
        { to: '/showcase', label: 'Showcase' },
        { to: 'https://x.com/davidhaz', label: 'Who made this?', external: true }
      ].map(({ to, label, external }) => (
        <Link key={to} to={to} target={external ? '_blank' : undefined} onClick={onClose} display="block" mb={2}>
          <Flex alignItems="center" gap="4px">
            <span>{label}</span>
            <Icon as={ArrowRight} {...ARROW_ICON_PROPS} />
          </Flex>
        </Link>
      ))}
    </Flex>
  </>
);

const MainDrawer = ({ isOpen, onClose, categories, location, pendingActivePath, onNavigation, isTransitioning }) => (
  <Drawer.Root open={isOpen} onOpenChange={onClose} placement="left" size="full">
    <Drawer.Backdrop mt="50px" h="calc(100vh - 50px)" />
    <Drawer.Positioner
      w="100vw"
      maxW="100vw"
      mt="50px"
      h="calc(100vh - 50px)"
      sx={{
        transition: 'transform 0.3s ease',
        "&[data-state='closed']": { transform: 'translateX(-100%)' },
        "&[data-state='open']": { transform: 'translateX(0)' }
      }}
    >
      <Drawer.Content bg={colors.bgBody} h="100%">
        <Drawer.Header h="72px" py={2} borderBottom="1px solid #ffffff1c" className="sidebar-logo">
          <Flex align="center" justify="space-between" w="100%">
            <Link to="/">
              <Image src={Logo} alt="Logo" h="28px" />
            </Link>
            <IconButton {...ICON_BUTTON_STYLES} aria-label="Close" onClick={onClose}>
              <Icon as={XIcon} color="#fff" />
            </IconButton>
          </Flex>
        </Drawer.Header>
        <Drawer.Body pb="6em">
          <VStack align="stretch" spacing={5} mt={8}>
            {categories.map((cat, i) => (
              <Box key={cat.name}>
                <Category
                  category={cat}
                  location={location}
                  pendingActivePath={pendingActivePath}
                  handleClick={onClose}
                  handleTransitionNavigation={onNavigation}
                  itemRefs={{}}
                  isTransitioning={isTransitioning}
                  isFirstCategory={i === 0}
                />
                {i === 0 && (
                  <>
                    <ProLinks onClose={onClose} />
                    <ToolsLinks onClose={onClose} />
                  </>
                )}
              </Box>
            ))}
          </VStack>
          <UsefulLinks onClose={onClose} />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Positioner>
  </Drawer.Root>
);

const SponsorsDrawer = ({ isOpen, onClose }) => (
  <Drawer.Root open={isOpen} onOpenChange={onClose} placement="left" size="full">
    <Drawer.Backdrop />
    <Drawer.Positioner
      w="100vw"
      maxW="100vw"
      sx={{
        transition: 'transform 0.3s ease',
        "&[data-state='closed']": { transform: 'translateX(-100%)' },
        "&[data-state='open']": { transform: 'translateX(0)' }
      }}
    >
      <Drawer.Content bg={colors.bgBody}>
        <Drawer.Body p={0}>
          <Box position="relative" p="1em" pt="3.5em">
            <IconButton
              {...ICON_BUTTON_STYLES}
              aria-label="Close"
              onClick={onClose}
              position="absolute"
              top="1em"
              right="1em"
              zIndex={2}
            >
              <Icon as={XIcon} color="#fff" />
            </IconButton>
            <Box className="sponsors-overlay">
              <SponsorsCard />
            </Box>
          </Box>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Positioner>
  </Drawer.Root>
);

const Category = memo(
  ({
    category,
    handleClick,
    handleTransitionNavigation,
    location,
    pendingActivePath,
    itemRefs,
    isTransitioning,
    isFirstCategory,
    showFavorites,
    onPreviewEnter,
    onPreviewMove,
    onPreviewLeave
  }) => {
    const items = useMemo(
      () =>
        category.subcategories.map(sub => {
          const path = `/${slug(category.name)}/${slug(sub)}`;
          const activePath = pendingActivePath || location.pathname;
          return {
            sub,
            path,
            isActive: activePath === path,
            isNew: NEW.includes(sub),
            isUpdated: UPDATED.includes(sub)
          };
        }),
      [category.name, category.subcategories, location.pathname, pendingActivePath]
    );

    return (
      <Box>
        <Text className="category-name" mb={2} mt={isFirstCategory ? 0 : 4}>
          {category.name}
        </Text>
        <Stack className="sidebar-link-stack" spacing={0.5} pl={4} borderLeft="1px solid #2F293A" position="relative">
          {items.map(({ sub, path, isActive, isNew, isUpdated }) => (
            <Link
              key={path}
              ref={el => {
                if (itemRefs.current) itemRefs.current[path] = el;
              }}
              to={path}
              className={`sidebar-item ${isActive ? 'active-sidebar-item' : ''} ${isTransitioning ? 'transitioning' : ''}`}
              onClick={e => {
                e.preventDefault();
                handleTransitionNavigation ? handleTransitionNavigation(path, sub) : handleClick();
              }}
              onMouseEnter={event => onPreviewEnter?.(category.name, sub, event)}
              onMouseMove={event => onPreviewMove?.(event)}
              onMouseLeave={onPreviewLeave}
              onFocus={event => onPreviewEnter?.(category.name, sub, event)}
              onBlur={onPreviewLeave}
            >
              {sub}
              {isNew && <span className="new-tag">New</span>}
              {isUpdated && <span className="updated-tag">Updated</span>}
            </Link>
          ))}
          {showFavorites && (
            <Link
              ref={el => {
                if (itemRefs.current) itemRefs.current['/favorites'] = el;
              }}
              to="/favorites"
              className={`sidebar-item ${location.pathname === '/favorites' ? 'active-sidebar-item' : ''}`}
              onClick={handleClick}
            >
              Favorites
            </Link>
          )}
        </Stack>
      </Box>
    );
  }
);

Category.displayName = 'Category';

// ─── Main Component ──────────────────────────────────────────────────────────
const Sidebar = () => {
  // State
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isSponsorsOpen, setSponsorsOpen] = useState(false);
  const [pendingActivePath, setPendingActivePath] = useState(null);
  const [sidebarFilter, setSidebarFilter] = useState('');
  const [sidebarPreview, setSidebarPreview] = useState(null);

  // Refs
  const sidebarContainerRef = useRef(null);
  const itemRefs = useRef({});
  const previewShowTimerRef = useRef(null);
  const previewHideTimerRef = useRef(null);

  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const previewMediaAllowed = usePreviewMediaAllowed();
  const previewX = useMotionValue(260);
  const previewY = useMotionValue(100);
  const smoothPreviewX = useSpring(previewX, { stiffness: 420, damping: 38, mass: 0.72 });
  const smoothPreviewY = useSpring(previewY, { stiffness: 360, damping: 34, mass: 0.78 });
  const { startTransition, isTransitioning } = useTransition();
  const { isAtTop: isSidebarAtTop, isAtBottom: isSidebarAtBottom } = useScrollEdges(sidebarContainerRef);
  const sidebarFilterQuery = sidebarFilter.trim().toLowerCase();
  const sidebarCategories = useMemo(
    () =>
      CATEGORIES.map((category, index) => ({
        ...category,
        index,
        subcategories:
          sidebarFilterQuery && !category.name.toLowerCase().includes(sidebarFilterQuery)
            ? category.subcategories.filter(item => item.toLowerCase().includes(sidebarFilterQuery))
            : category.subcategories
      })),
    [sidebarFilterQuery]
  );
  const sidebarProSections = useMemo(
    () =>
      sidebarFilterQuery && !'pro'.includes(sidebarFilterQuery)
        ? PRO_SECTIONS.filter(section =>
            `${section.sidebarLabel || ''} ${section.label}`.toLowerCase().includes(sidebarFilterQuery)
          )
        : PRO_SECTIONS,
    [sidebarFilterQuery]
  );
  const sidebarTools = useMemo(
    () =>
      sidebarFilterQuery && !'tools'.includes(sidebarFilterQuery)
        ? TOOLS.filter(tool => tool.label.toLowerCase().includes(sidebarFilterQuery))
        : TOOLS,
    [sidebarFilterQuery]
  );
  const showSidebarFavorites = !sidebarFilterQuery || 'favorites saved'.includes(sidebarFilterQuery);
  const sidebarHasResults =
    showSidebarFavorites ||
    sidebarProSections.length > 0 ||
    sidebarTools.length > 0 ||
    sidebarCategories.some(category => category.subcategories.length > 0);
  const firstVisibleCategory = sidebarCategories.find(
    category => category.subcategories.length > 0 || (category.index === 0 && showSidebarFavorites)
  )?.name;

  // Helpers
  const findActiveElement = useCallback(() => {
    const activePath = pendingActivePath || location.pathname;
    const directMatch = itemRefs.current[activePath];
    if (directMatch) return directMatch;
    for (const category of CATEGORIES) {
      const activeItem = category.subcategories.find(sub => activePath === `/${slug(category.name)}/${slug(sub)}`);
      if (activeItem) return itemRefs.current[`/${slug(category.name)}/${slug(activeItem)}`];
    }
    return null;
  }, [location.pathname, pendingActivePath]);

  const scrollActiveItemIntoView = useCallback(() => {
    const activeEl = findActiveElement();
    if (!activeEl || !sidebarContainerRef.current) return;

    const containerRect = sidebarContainerRef.current.getBoundingClientRect();
    const elementRect = activeEl.getBoundingClientRect();

    const isOutOfView =
      elementRect.top < containerRect.top + SCROLL_OFFSET || elementRect.bottom > containerRect.bottom - SCROLL_OFFSET;

    if (isOutOfView) {
      sidebarContainerRef.current.scrollTo({
        top: sidebarContainerRef.current.scrollTop + (elementRect.top - containerRect.top) - SCROLL_OFFSET,
        behavior: 'smooth'
      });
    }
  }, [findActiveElement]);

  // Handlers
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const createNavigationHandler = useCallback(
    shouldCloseDrawer => async (path, subcategory) => {
      if (isTransitioning || location.pathname === path) return;

      if (shouldCloseDrawer) closeDrawer();
      setPendingActivePath(path);

      await startTransition(slug(subcategory), componentMap, () => {
        navigate(path);
        scrollToTop();
        setPendingActivePath(null);
      });
    },
    [isTransitioning, location.pathname, startTransition, navigate, closeDrawer]
  );

  const handleTransitionNavigation = useMemo(() => createNavigationHandler(false), [createNavigationHandler]);

  const handleMobileNavigation = useMemo(() => createNavigationHandler(true), [createNavigationHandler]);

  const updatePreviewPosition = useCallback(
    event => {
      const itemRect = event.currentTarget.getBoundingClientRect();
      const sidebarRect = event.currentTarget.closest('nav')?.getBoundingClientRect();
      const pointerX = event.clientX || itemRect.left + itemRect.width / 2;
      const pointerY = event.clientY || itemRect.top + itemRect.height / 2;
      const sidebarLeft = sidebarRect?.left ?? 16;
      const sidebarWidth = sidebarRect?.width ?? 228;
      const sidebarRight = sidebarRect?.right ?? sidebarLeft + sidebarWidth;
      const pointerProgress = Math.max(0, Math.min(1, (pointerX - sidebarLeft) / sidebarWidth));
      const horizontalDrift = (pointerProgress - 0.5) * 12;
      const nextX = Math.min(window.innerWidth - PREVIEW_WIDTH - 16, sidebarRight + 16 + horizontalDrift);
      const minY = sidebarRect?.top ?? 76;
      const maxY = Math.max(minY, window.innerHeight - PREVIEW_HEIGHT - 16);
      const nextY = Math.max(minY, Math.min(maxY, pointerY - PREVIEW_HEIGHT / 2));

      previewX.set(nextX);
      previewY.set(nextY);
    },
    [previewX, previewY]
  );

  const handlePreviewEnter = useCallback(
    (categoryName, componentName, event) => {
      if (!previewMediaAllowed || categoryName === 'Get Started') return;

      const key = `/${slug(categoryName)}/${slug(componentName)}`;
      const metadata = COMPONENT_METADATA_BY_PATH.get(key);
      if (!metadata?.videoUrl) return;

      clearTimeout(previewShowTimerRef.current);
      clearTimeout(previewHideTimerRef.current);
      updatePreviewPosition(event);

      const videoBase = metadata.videoUrl.replace(/\.(webm|mp4)$/i, '');
      const delay = sidebarPreview ? 70 : PREVIEW_DELAY;
      previewShowTimerRef.current = setTimeout(() => {
        setSidebarPreview({
          key,
          title: componentName,
          items: [{ label: categoryName, videoBase }]
        });
      }, delay);
    },
    [previewMediaAllowed, sidebarPreview, updatePreviewPosition]
  );

  const handleProPreviewEnter = useCallback(
    (section, event) => {
      const items = PRO_PREVIEW_ITEMS[section.slug];
      if (!previewMediaAllowed || !items?.length) return;

      clearTimeout(previewShowTimerRef.current);
      clearTimeout(previewHideTimerRef.current);
      updatePreviewPosition(event);

      const delay = sidebarPreview ? 70 : PREVIEW_DELAY;
      previewShowTimerRef.current = setTimeout(() => {
        setSidebarPreview({ key: `pro-${section.slug}`, title: section.sidebarLabel || section.label, items });
      }, delay);
    },
    [previewMediaAllowed, sidebarPreview, updatePreviewPosition]
  );

  const handlePreviewMove = useCallback(
    event => {
      if (previewMediaAllowed && !reduceMotion) updatePreviewPosition(event);
    },
    [previewMediaAllowed, reduceMotion, updatePreviewPosition]
  );

  const handlePreviewLeave = useCallback(() => {
    clearTimeout(previewShowTimerRef.current);
    clearTimeout(previewHideTimerRef.current);
    previewHideTimerRef.current = setTimeout(() => setSidebarPreview(null), 90);
  }, []);

  // Effects
  useEffect(() => {
    const timer = setTimeout(scrollActiveItemIntoView, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, scrollActiveItemIntoView]);

  useEffect(() => {
    if (pendingActivePath && location.pathname === pendingActivePath) {
      setPendingActivePath(null);
    }
  }, [location.pathname, pendingActivePath]);

  useEffect(() => {
    setSidebarPreview(null);
    clearTimeout(previewShowTimerRef.current);
    clearTimeout(previewHideTimerRef.current);
  }, [location.pathname, sidebarFilter]);

  useEffect(() => {
    if (!previewMediaAllowed) setSidebarPreview(null);
  }, [previewMediaAllowed]);

  useEffect(
    () => () => {
      clearTimeout(previewShowTimerRef.current);
      clearTimeout(previewHideTimerRef.current);
    },
    []
  );

  return (
    <>
      <MainDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        categories={CATEGORIES}
        location={location}
        pendingActivePath={pendingActivePath}
        onNavigation={handleMobileNavigation}
        isTransitioning={isTransitioning}
      />

      <SponsorsDrawer isOpen={isSponsorsOpen} onClose={() => setSponsorsOpen(false)} />

      <Box
        as="nav"
        position="fixed"
        top="calc(var(--docs-header-height) + 16px)"
        left="16px"
        h="calc(100vh - var(--docs-header-height) - 32px)"
        w={{ base: 0, md: '228px' }}
        maxW="228px"
        p={0}
        overflow="hidden"
        className="sidebar"
      >
        <label className="sidebar-filter">
          <SearchIcon size={13} aria-hidden="true" />
          <input
            value={sidebarFilter}
            onChange={event => setSidebarFilter(event.target.value)}
            placeholder={`Filter ${TOTAL_COMPONENTS} components...`}
            aria-label="Filter sidebar navigation"
          />
        </label>

        <Box
          className={`sidebar-scroll-shell ${isSidebarAtTop ? 'is-at-top' : ''} ${isSidebarAtBottom ? 'is-at-bottom' : ''}`}
        >
          <Box ref={sidebarContainerRef} className="sidebar-scroll">
            <VStack align="stretch" spacing={4}>
              {sidebarCategories.map(cat => (
                <Fragment key={cat.name}>
                  {(cat.subcategories.length > 0 || (cat.index === 0 && showSidebarFavorites)) && (
                    <Category
                      key={cat.name}
                      category={cat}
                      location={location}
                      pendingActivePath={pendingActivePath}
                      handleClick={scrollToTop}
                      handleTransitionNavigation={handleTransitionNavigation}
                      itemRefs={itemRefs}
                      isTransitioning={isTransitioning}
                      isFirstCategory={cat.name === firstVisibleCategory}
                      showFavorites={cat.index === 0 && showSidebarFavorites}
                      onPreviewEnter={handlePreviewEnter}
                      onPreviewMove={handlePreviewMove}
                      onPreviewLeave={handlePreviewLeave}
                    />
                  )}

                  {/* Pro Section - after Get Started */}
                  {cat.index === 0 && sidebarProSections.length > 0 && (
                    <Box>
                      <Text className="category-name sidebar-pro-name" mb={2} mt={4}>
                        Explore Pro
                      </Text>
                      <Stack
                        className="sidebar-link-stack"
                        spacing={0.5}
                        pl={4}
                        borderLeft={`1px solid ${colors.borderSecondary}`}
                        position="relative"
                      >
                        {sidebarProSections.map(section => {
                          const path = `/pro/${section.slug}`;
                          return (
                            <Link
                              key={section.slug}
                              ref={el => {
                                if (itemRefs.current) itemRefs.current[path] = el;
                              }}
                              to={path}
                              className={`sidebar-item sidebar-pro-link ${location.pathname === path ? 'active-sidebar-item' : ''}`}
                              onClick={scrollToTop}
                              onMouseEnter={event => handleProPreviewEnter(section, event)}
                              onMouseMove={handlePreviewMove}
                              onMouseLeave={handlePreviewLeave}
                              onFocus={event => handleProPreviewEnter(section, event)}
                              onBlur={handlePreviewLeave}
                            >
                              <Icon as={section.icon} boxSize={3.5} className="sidebar-pro-icon" />
                              <span>{section.sidebarLabel || section.label}</span>
                              {section.freeCount && <span className="sidebar-pro-free-tag">{section.freeCount} Free</span>}
                            </Link>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* Tools Section - after Pro */}
                  {cat.index === 0 && sidebarTools.length > 0 && (
                    <Box>
                      <Text className="category-name" mb={2} mt={4}>
                        Tools
                      </Text>
                      <Stack
                        className="sidebar-link-stack"
                        spacing={0.5}
                        pl={4}
                        borderLeft={`1px solid ${colors.borderSecondary}`}
                        position="relative"
                      >
                        {sidebarTools.map(tool => (
                          <Link
                            key={tool.id}
                            to={tool.path}
                            className={`sidebar-item ${location.pathname === tool.path ? 'active-sidebar-item' : ''}`}
                            onClick={scrollToTop}
                          >
                            <span>{tool.label}</span>
                          </Link>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Fragment>
              ))}
              {!sidebarHasResults && <Text className="sidebar-filter-empty">No matching pages</Text>}
            </VStack>
          </Box>
        </Box>
      </Box>

      {previewMediaAllowed && (
        <SidebarHoverPreview
          preview={sidebarPreview}
          x={reduceMotion ? previewX : smoothPreviewX}
          y={reduceMotion ? previewY : smoothPreviewY}
          reduceMotion={reduceMotion}
        />
      )}
    </>
  );
};

export default Sidebar;
