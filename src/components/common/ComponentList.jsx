import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Flex,
  Icon,
  IconButton,
  Input,
  InputGroup,
  Portal,
  Select,
  Text,
  createListCollection
} from '@chakra-ui/react';
import { Grid as RVGrid, AutoSizer, WindowScroller } from 'react-virtualized';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { RiHeartFill, RiHeartLine } from 'react-icons/ri';
import { toast } from 'sonner';
import { componentMetadata } from '../../constants/Information';
import { rankComponentSearch } from '../../utils/componentSearch';
import {
  getSavedComponents,
  isComponentSaved,
  removeSavedComponent,
  toggleSavedComponent
} from '../../utils/favorites';
// import { ArrowRightIcon } from 'lucide-react';
// import Aurora from '../../content/Backgrounds/Aurora/Aurora';
import { colors } from '../../constants/colors';
import { CATEGORIES, NEW } from '../../constants/Categories';
import usePreviewMediaAllowed from '../../hooks/usePreviewMediaAllowed';

const CARD_RADIUS = 16;
const EMPTY_SET = new Set();

const FAV_BTN_STYLE = {
  size: 'xs',
  variant: 'unstyled',
  borderRadius: '8px',
  position: 'absolute',
  top: '8px',
  right: '8px',
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '28px',
  h: '28px',
  minW: 'unset',
  bg: 'rgba(0,0,0,0.4)',
  backdropFilter: 'var(--surface-ghost-blur)',
  border: '1px solid transparent',
  boxShadow: 'var(--surface-ghost-highlight)',
  transition: 'opacity 0.2s ease, background-color 0.2s ease, transform 0.2s ease',
  _focus: { opacity: 1, pointerEvents: 'auto' },
  _hover: { bg: 'rgba(0,0,0,0.6)', transform: 'scale(1.1)' }
};

const PILL_BTN_STYLE = {
  px: 4,
  h: '36px',
  borderRadius: '10px',
  cursor: 'pointer',
  border: '1px solid transparent',
  transition: 'background var(--transition-base), transform var(--dur-press) var(--ease-out)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontWeight: 500,
  bg: 'var(--surface-ghost-track)',
  backdropFilter: 'var(--surface-ghost-blur)',
  _hover: { background: 'var(--surface-ghost-hover)' },
  _active: { transform: 'scale(0.97)' }
};

const slug = str => (str || '').replace(/\s+/g, '-').toLowerCase();
const fromPascal = str =>
  (str || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();

const ComponentList = ({
  list,
  hasDeleteButton = false,
  hasFavoriteButton = false,
  sorting = 'none',
  title,
  newSinceLastVisit = EMPTY_SET,
  basePath = '',
  showCategoryFilter = true
}) => {
  const scrollRef = useRef(null);
  const GAP_PX = 16;
  const [hoveredKey, setHoveredKey] = useState(null);
  const previewMediaAllowed = usePreviewMediaAllowed();
  const clearSlotRef = useRef(null);
  const clearBtnRef = useRef(null);
  const CLEAR_APPEAR_DEBOUNCE_MS = 300;

  const setHoverToItemAtPoint = useCallback((x, y) => {
    try {
      const el = document.elementFromPoint(x, y);
      let node = el;
      while (node && node !== document.body) {
        if (node.dataset && node.dataset.itemKey) {
          setHoveredKey(node.dataset.itemKey);
          return;
        }
        node = node.parentElement;
      }
      setHoveredKey(null);
    } catch (e) {
      // noop
    }
  }, []);

  const items = useMemo(() => {
    if (!list) return [];
    const entries = Array.isArray(list) ? list : Object.entries(list).map(([key, meta]) => ({ key, ...meta }));

    const mapToItem = entry => {
      const key = entry.key ?? entry?.id ?? null;
      const meta = entry.key ? entry : (componentMetadata?.[entry] ?? {});
      const fullKey = key || entry;
      const [cat, comp] = (fullKey || '').split('/');
      const title = fromPascal(meta?.name ?? comp);
      return {
        key: fullKey,
        categoryKey: cat,
        componentKey: comp,
        categoryLabel: fromPascal(meta?.category ?? cat),
        title,
        description: meta?.description ?? '',
        videoUrl: meta?.videoUrl ?? '',
        tags: Array.isArray(meta?.tags) ? meta.tags : [],
        docsUrl: meta?.docsUrl,
        isNew: NEW.includes(title),
        isNewSinceLastVisit: newSinceLastVisit.has(fullKey)
      };
    };

    let arr = entries
      .filter(e => {
        const key = (e.key ?? e)?.toString?.() ?? '';
        return key.includes('/') && (e.key ? true : !!componentMetadata[key]);
      })
      .map(mapToItem);

    if (sorting === 'alphabetical') {
      arr = arr.sort((a, b) => {
        if (a.isNewSinceLastVisit !== b.isNewSinceLastVisit) return a.isNewSinceLastVisit ? -1 : 1;
        const aNew = NEW.includes(a.title);
        const bNew = NEW.includes(b.title);
        if (aNew !== bNew) return aNew ? -1 : 1;
        return a.title.localeCompare(b.title);
      });
    }
    return arr;
  }, [list, newSinceLastVisit, sorting]);

  const categoriesList = useMemo(
    () => [
      'All Components',
      ...CATEGORIES.filter(c => c.name !== 'Get Started')
        .map(c => c.name)
        .sort((a, b) => a.localeCompare(b))
    ],
    []
  );
  const categories = useMemo(() => createListCollection({ items: categoriesList }), [categoriesList]);

  const [selectedCategory, setSelectedCategory] = useState(categories.items[0]);
  const [search, setSearch] = useState('');
  const [newOnly, setNewOnly] = useState(false);

  useEffect(() => {
    setSelectedCategory(prev => (categories.items.includes(prev) ? prev : categories.items[0]));
  }, [categories.items]);

  const [savedSet, setSavedSet] = useState(() => new Set(getSavedComponents()));
  useEffect(() => {
    const update = () => setSavedSet(new Set(getSavedComponents()));
    const onStorage = e => {
      if (!e || e.key === 'savedComponents') update();
    };
    window.addEventListener('favorites:updated', update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('favorites:updated', update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim();
    const all = !showCategoryFilter || selectedCategory === 'All Components';
    return items
      .filter(item => (all || item.categoryLabel === selectedCategory) && (!newOnly || item.isNewSinceLastVisit))
      .map(item => ({ item, match: term ? rankComponentSearch(item, term) : { score: 1 } }))
      .filter(({ match }) => Boolean(match))
      .sort((a, b) => (term ? b.match.score - a.match.score : 0))
      .map(({ item }) => item);
  }, [items, newOnly, selectedCategory, search, showCategoryFilter]);
  const controlsDisabled = items.length === 0;
  const hasCategoryFilter = showCategoryFilter && selectedCategory !== categories.items[0];
  const newSinceLastVisitCount = useMemo(() => items.filter(item => item.isNewSinceLastVisit).length, [items]);
  const hasActiveFilters = hasCategoryFilter || newOnly || search.trim().length > 0;

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), CLEAR_APPEAR_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  const showClear = !controlsDisabled && (hasCategoryFilter || newOnly || (debouncedSearch?.trim()?.length ?? 0) > 0);

  useGSAP(() => {
    const slot = clearSlotRef.current;
    const btn = clearBtnRef.current;
    if (!slot || !btn) return;
    gsap.killTweensOf([slot, btn]);

    if (showClear) {
      const tl = gsap.timeline();
      tl.to(slot, { width: 40, duration: 0.3, ease: 'power2.out' }).fromTo(
        btn,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out', force3D: true },
        '<0.05'
      );
    } else {
      const tl = gsap.timeline();
      tl.to(btn, { scale: 0, opacity: 0, duration: 0.15, ease: 'power2.in' }).to(
        slot,
        { width: 0, duration: 0.25, ease: 'power2.inOut' },
        '+=0'
      );
    }
  }, [showClear]);

  const getColumnsForWidth = useCallback(w => (w >= 700 ? 3 : w >= 480 ? 2 : 1), []);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory(categories.items[0]);
    setNewOnly(false);
  };

  return (
    <Box className="category-page" ref={scrollRef}>
      {/* <Flex
        position="relative"
        w="100%"
        h="110px"
        border={`1px solid ${colors.bgElevated}`}
        overflow="hidden"
        bg={colors.bgBody}
        mb={6}
        cursor="pointer"
        alignItems="center"
        pl={{ base: 4, md: 8 }}
        pr={2}
        borderRadius="25px"
        as="a"
        href="https://pro.reactbits.dev"
        target="_blank"
      >
        <Flex
          direction="column"
          position="relative"
          zIndex={1}
          alignSelf={{ base: 'flex-start', md: 'center' }}
          pt={{ base: 4, md: 0 }}
        >
          <Text fontSize={{ base: '16px', md: '24px' }} fontWeight="600" color="#fff" letterSpacing={'-.5px'}>
            React Bits Pro is live!
          </Text>
          <Text fontSize={{ base: '12px', md: '16px' }} fontWeight="500" color={colors.accent} letterSpacing={'-.5px'}>
            Explore unique components, UI blocks, and templates to supercharge your work.
          </Text>
        </Flex>

        <Icon
          boxSize={{ base: 8 }}
          opacity={0.5}
          color="#a78bfa"
          as={ArrowRightIcon}
          display="inline-block"
          mr={'1em'}
          ml={'auto'}
        />

        <Box position="absolute" top={0} left={0} w="100%" h="100%" zIndex={0} rotate={'180deg'} opacity={0.25}>
          <Aurora colorStops={['#FF9FFC', '#5227FF', '#FF9FFC']} amplitude={6} blend={6} />
        </Box>
      </Flex> */}

      <Flex
        className="page-transition-fade"
        mb={12}
        alignItems={{ base: 'flex-start', md: 'center' }}
        justifyContent={{ base: 'flex-start', md: 'space-between' }}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        {title ? (
          <Box>
            <h2 className="sub-category" style={{ margin: 0 }}>
              {title}
            </h2>
            {hasActiveFilters ? (
              <Text mt={2} color={colors.textMuted} fontSize="13px" fontWeight={500} aria-live="polite">
                {filtered.length} {filtered.length === 1 ? 'component' : 'components'} found
              </Text>
            ) : null}
            {newSinceLastVisitCount > 0 ? (
              <Box
                as="button"
                mt={2}
                color={newOnly ? colors.accent : colors.textMuted}
                fontSize="13px"
                fontWeight={500}
                cursor="pointer"
                textAlign="left"
                transition="color var(--transition-base)"
                onClick={() => setNewOnly(value => !value)}
                aria-pressed={newOnly}
                _hover={{ color: colors.accent }}
              >
                {newSinceLastVisitCount} new since your last visit
              </Box>
            ) : null}
          </Box>
        ) : null}

        <Flex
          direction={{ base: 'column', md: 'row' }}
          alignItems="center"
          position="relative"
          left={{ base: 0, md: '6px' }}
          justifyContent="flex-end"
          gap={{ base: 2, md: 0 }}
          w={{ base: '100%', md: 'auto' }}
          opacity={controlsDisabled ? 0.5 : 1}
        >
          <InputGroup
            startElement={<Icon as={FiSearch} color="var(--text-dimmed)" fontSize="14px" />}
            w={{ base: '100%', md: '180px' }}
            mr={{ base: 0, md: 2 }}
          >
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              h="36px"
              borderRadius="10px"
              bg="var(--action-control-bg)"
              border="1px solid var(--action-control-border)"
              backdropFilter="var(--surface-ghost-blur)"
              transition="background var(--transition-base), border-color var(--transition-base)"
              color="var(--text-primary)"
              fontSize="13px"
              fontWeight={500}
              disabled={controlsDisabled}
              tabIndex={controlsDisabled ? -1 : 0}
              onFocus={e => {
                if (controlsDisabled) {
                  try {
                    e.target.blur();
                  } catch {
                    /* noop */
                  }
                }
              }}
              pointerEvents={controlsDisabled ? 'none' : 'auto'}
              _focus={{
                bg: 'var(--action-control-selected)',
                borderColor: 'var(--action-control-selected-border)',
                boxShadow: 'var(--action-control-shadow)',
                outline: 'none'
              }}
              _focusVisible={{
                bg: 'var(--action-control-selected)',
                borderColor: 'var(--action-control-selected-border)',
                boxShadow: 'var(--action-control-shadow)',
                outline: 'none'
              }}
              _hover={{ bg: 'var(--action-control-hover)', borderColor: 'var(--action-control-selected-border)' }}
              _placeholder={{ color: 'var(--text-dimmed)', fontWeight: 500 }}
            />
          </InputGroup>

          {showCategoryFilter ? (
            <Select.Root
              collection={categories}
              value={[selectedCategory]}
              onValueChange={({ value }) => setSelectedCategory(value[0])}
              size="sm"
              width={{ base: '100%', md: '180px' }}
              disabled={controlsDisabled}
            >
              <Select.HiddenSelect name="component-list-category-filter" />
              <Select.Control>
                <Select.Trigger
                  fontSize="13px"
                  bg="var(--action-control-bg)"
                  border="1px solid var(--action-control-border)"
                  backdropFilter="var(--surface-ghost-blur)"
                  rounded="10px"
                  h="36px"
                  fontWeight={500}
                  cursor={controlsDisabled ? 'default' : 'pointer'}
                  transition="background 0.2s ease, border-color 0.2s ease"
                  _hover={
                    controlsDisabled
                      ? undefined
                      : {
                          background: 'var(--action-control-hover)',
                          borderColor: 'var(--action-control-selected-border)'
                        }
                  }
                  css={{
                    '&[data-state="open"]': {
                      background: 'var(--action-control-selected)',
                      borderColor: 'var(--action-control-selected-border)',
                      boxShadow: 'var(--action-control-shadow)'
                    }
                  }}
                  w="full"
                >
                  <Select.ValueText color={controlsDisabled ? 'var(--text-dimmed)' : 'var(--text-primary)'} pl={2}>
                    {selectedCategory}
                  </Select.ValueText>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Trigger>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content
                    bg="var(--shell-panel)"
                    backdropFilter="blur(32px) saturate(1.3)"
                    border="1px solid var(--shell-border-strong)"
                    borderRadius="12px"
                    w={{ base: '100%', md: '180px' }}
                    px={1.5}
                    py={1.5}
                    boxShadow="var(--shadow-menu)"
                  >
                    {categories.items.map(cat => (
                      <Select.Item
                        key={cat}
                        item={cat}
                        borderRadius="8px"
                        px={3}
                        py={2}
                        fontSize="13px"
                        cursor="pointer"
                        _highlighted={{ bg: 'var(--surface-ghost)' }}
                      >
                        {cat}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          ) : null}

          <Box
            ref={clearSlotRef}
            marginLeft={1.5}
            display={{ base: 'none', md: 'flex' }}
            alignItems="center"
            justifyContent="center"
            style={{ width: 0, overflow: 'hidden' }}
          >
            <IconButton
              ref={clearBtnRef}
              aria-label="Clear filters"
              rounded="10px"
              size="sm"
              variant="ghost"
              color="var(--text-muted)"
              onClick={clearFilters}
              h="36px"
              w="36px"
              bg="var(--action-control-bg)"
              border="1px solid var(--action-control-border)"
              backdropFilter="var(--surface-ghost-blur)"
              opacity={0}
              style={{ transformOrigin: '50% 50%' }}
              pointerEvents={showClear ? 'auto' : 'none'}
              tabIndex={showClear ? 0 : -1}
              _hover={{ bg: 'var(--action-control-hover)', borderColor: 'var(--action-control-selected-border)' }}
              _focus={{ boxShadow: 'none', outline: 'none' }}
              _focusVisible={{ boxShadow: 'none', outline: 'none' }}
            >
              <Icon as={FiX} />
            </IconButton>
          </Box>
        </Flex>
      </Flex>

      <Box mt={4}>
        {filtered.length === 0 ? (
          <Box role="status" p={6} mt={'6em'} textAlign="center" position="relative">
            <Box position="relative">
              <Text color="var(--text-primary)" fontWeight={500} fontSize="24px" mb={1}>
                {items.length > 0 ? 'No results...' : 'Nothing here yet...'}
              </Text>
              <Text color={colors.textMuted} fontSize="16px" mb={8}>
                {items.length > 0 ? 'Try adjusting your filters' : 'Tap the heart on any component to save it'}
              </Text>

              <Flex gap={2} justify="center" wrap="wrap">
                {items.length > 0 ? (
                  <Box as="button" onClick={clearFilters} {...PILL_BTN_STYLE}>
                    Clear Filters
                  </Box>
                ) : (
                  <Box
                    as={RouterLink}
                    to="/get-started/index"
                    lineHeight={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={6}
                    {...PILL_BTN_STYLE}
                  >
                    Browse Components
                  </Box>
                )}
              </Flex>
            </Box>
          </Box>
        ) : (
          <>
            <WindowScroller scrollElement={typeof window !== 'undefined' ? window : undefined}>
              {({ height, isScrolling, onChildScroll, scrollTop }) => (
                <Box>
                  <AutoSizer disableHeight>
                    {({ width }) => {
                      const columnCount = getColumnsForWidth(width);
                      const columnWidth = Math.floor(width / columnCount);
                      const cardHeight = 260;
                      const rowHeight = cardHeight + GAP_PX;
                      const rowCount = Math.ceil(filtered.length / columnCount);

                      const cellRenderer = ({ columnIndex, rowIndex, key, style }) => {
                        const index = rowIndex * columnCount + columnIndex;
                        if (index >= filtered.length) {
                          return <div key={key} style={style} />;
                        }
                        const item = filtered[index];
                        const to = `${basePath}/${slug(fromPascal(item.categoryKey))}/${slug(fromPascal(item.componentKey))}`;
                        const isSaved = savedSet.has(item.key) || isComponentSaved(item.key);
                        const isLastCol = columnIndex === columnCount - 1;

                        const cellStyle = {
                          ...style,
                          width: columnWidth,
                          paddingRight: isLastCol ? 0 : GAP_PX,
                          paddingBottom: GAP_PX
                        };
                        return (
                          <div key={key} style={cellStyle}>
                            <Box
                              key={item.key}
                              as={RouterLink}
                              to={to}
                              data-item-key={item.key}
                              display="block"
                              role="group"
                              className="browse-card"
                              bg="var(--surface-ghost-track)"
                              border="1px solid transparent"
                              boxShadow="var(--surface-ghost-highlight)"
                              borderRadius={`${CARD_RADIUS}px`}
                              p="6px"
                              textDecoration="none"
                              overflow="hidden"
                              onMouseEnter={() => setHoveredKey(item.key)}
                              onMouseLeave={() => setHoveredKey(prev => (prev === item.key ? null : prev))}
                            >
                              <Box
                                className="browse-card-media"
                                position="relative"
                                overflow="hidden"
                                borderRadius="12px"
                              >
                                <LazyCardMedia
                                  key={item.videoUrl || item.key}
                                  videoUrl={item.videoUrl}
                                  title={item.title}
                                  playing={previewMediaAllowed && hoveredKey === item.key}
                                />

                                {item.isNew || item.isNewSinceLastVisit ? (
                                  <Box
                                    position="absolute"
                                    top="8px"
                                    left="8px"
                                    zIndex={2}
                                    px="8px"
                                    py="3px"
                                    borderRadius="6px"
                                    fontSize="10px"
                                    fontWeight={600}
                                    lineHeight={1}
                                    letterSpacing="0.06em"
                                    textTransform="uppercase"
                                    color="var(--new-badge-text)"
                                    border="1px solid transparent"
                                    bg="var(--new-badge-bg)"
                                    boxShadow="var(--surface-ghost-highlight)"
                                    backdropFilter="var(--surface-ghost-blur)"
                                    pointerEvents="none"
                                  >
                                    {item.isNewSinceLastVisit ? 'Since last visit' : 'New'}
                                  </Box>
                                ) : null}

                                {hasDeleteButton ? (
                                  <IconButton
                                    aria-label="Remove from favorites"
                                    {...FAV_BTN_STYLE}
                                    opacity={hoveredKey === item.key ? 1 : 0}
                                    pointerEvents={hoveredKey === item.key ? 'auto' : 'none'}
                                    color="rgba(255,255,255,0.85)"
                                    _hover={{ bg: 'rgba(0,0,0,0.55)', transform: 'scale(1.1)', color: '#ef4444' }}
                                    onClick={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const { clientX, clientY } = e;
                                      const next = removeSavedComponent(item.key);
                                      setSavedSet(new Set(next));

                                      if (e.currentTarget && typeof e.currentTarget.blur === 'function') {
                                        e.currentTarget.blur();
                                      }

                                      if (typeof window !== 'undefined') {
                                        const schedule = window.requestAnimationFrame
                                          ? window.requestAnimationFrame
                                          : fn => setTimeout(fn, 0);
                                        schedule(() => setHoverToItemAtPoint(clientX, clientY));
                                      }
                                    }}
                                  >
                                    <Icon as={FiTrash2} fontSize="13px" />
                                  </IconButton>
                                ) : null}

                                {!hasDeleteButton && hasFavoriteButton ? (
                                  <IconButton
                                    aria-label={isSaved ? 'Remove from favorites' : 'Add to favorites'}
                                    {...FAV_BTN_STYLE}
                                    opacity={isSaved || hoveredKey === item.key ? 1 : 0}
                                    pointerEvents={hoveredKey === item.key ? 'auto' : 'none'}
                                    color={isSaved ? '#A855F7' : 'rgba(255,255,255,0.85)'}
                                    onClick={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const { saved, list: next } = toggleSavedComponent(item.key);
                                      setSavedSet(new Set(next));
                                      toast?.[saved ? 'success' : 'error']?.(
                                        <>
                                          {saved ? 'Added' : 'Removed'}{' '}
                                          <span style={{ color: colors.accent, fontWeight: 700 }}>
                                            &lt;{item.title} /&gt;
                                          </span>{' '}
                                          {saved ? 'to favorites' : 'from favorites'}
                                        </>
                                      );
                                      if (e.currentTarget && typeof e.currentTarget.blur === 'function') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                  >
                                    <Icon as={isSaved ? RiHeartFill : RiHeartLine} fontSize="13px" />
                                  </IconButton>
                                ) : null}
                              </Box>
                              <Box px={2.5} pt={3} pb={2}>
                                <Text
                                  className="browse-card-title"
                                  color="var(--text-primary)"
                                  fontSize="14.5px"
                                  fontWeight={600}
                                  lineHeight="1.25"
                                  letterSpacing="-0.25px"
                                >
                                  {item.title}
                                </Text>
                                <Text
                                  color="var(--text-dimmed)"
                                  fontWeight={500}
                                  fontSize="11px"
                                  letterSpacing="0.05em"
                                  textTransform="uppercase"
                                  mt="5px"
                                >
                                  {item.categoryLabel}
                                </Text>
                              </Box>
                            </Box>
                          </div>
                        );
                      };

                      return (
                        <RVGrid
                          autoHeight
                          height={height}
                          width={width}
                          rowCount={rowCount}
                          columnCount={columnCount}
                          columnWidth={columnWidth}
                          rowHeight={rowHeight}
                          cellRenderer={cellRenderer}
                          overscanRowCount={2}
                          isScrolling={isScrolling}
                          onScroll={onChildScroll}
                          scrollTop={scrollTop}
                        />
                      );
                    }}
                  </AutoSizer>
                </Box>
              )}
            </WindowScroller>
          </>
        )}
      </Box>
    </Box>
  );
};

const LazyCardMedia = ({ videoUrl, playing, title }) => {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);

  const show = !!videoUrl && !failed;

  const base = useMemo(() => (videoUrl ? videoUrl.replace(/\.(webm|mp4)$/i, '') : ''), [videoUrl]);
  const webm = base ? `${base}.webm` : '';
  const mp4 = base ? `${base}.mp4` : '';

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (playing) {
      const tryPlay = () => {
        try {
          const p = v.play();
          if (p && typeof p.then === 'function') {
            p.catch(() => {});
          }
        } catch (e) {
          // ignore
        }
      };

      if (v.readyState >= 3) {
        tryPlay();
      } else {
        const onCanPlay = () => tryPlay();
        v.addEventListener('canplay', onCanPlay, { once: true });
        return () => {
          v.removeEventListener('canplay', onCanPlay);
        };
      }
    } else {
      try {
        v.pause();
      } catch (e) {
        // ignore
      }
    }
  }, [playing]);
  const handleLoadedMetadata = e => {
    const v = e.target;
    v.currentTime = 0.1;
  };

  return (
    <Box className="browse-card-well" h="190px" borderRadius="12px" overflow="hidden">
      {show ? (
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          className="browse-card-video"
        >
          {/* Let the browser choose the best supported source */}
          <source src={webm} type="video/webm" />
          <source src={mp4} type="video/mp4" onError={() => setFailed(true)} />
        </video>
      ) : (
        <Flex className="browse-card-empty" h="100%" align="center" justify="center" aria-hidden="true">
          <Text
            fontFamily="'Geist Mono', monospace"
            fontSize="12px"
            fontWeight={500}
            letterSpacing="-0.2px"
            color="rgba(255,255,255,0.3)"
            px={4}
            textAlign="center"
          >
            {`<${(title || '').replace(/\s+/g, '')} />`}
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default ComponentList;
